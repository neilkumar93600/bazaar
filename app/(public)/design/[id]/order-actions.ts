"use server";

import { after } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/payments/checkout";
import { garmentOrderEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { designLabel } from "@/lib/utils";
import { validateAddress } from "@/lib/orders/address";
import { orderEligibility } from "@/lib/orders/eligibility";
import {
  defaultGarment,
  findGarment,
  coloursFrom,
  sizesForColour,
  sellableVariants,
} from "@/lib/printify/garments";
import { catalogVariants } from "@/lib/printify/products";
import { submitPrintifyOrder } from "@/lib/printify/orders";

export type OrderState = { error?: string; orderId?: string };

export type OrderOptions = {
  garmentLabel: string;
  priceCents: number;
  colours: { colour: string; variantId: number }[];
  /** Sizes keyed by colour. Derived per colour, never a global list — a colour
   *  that only stocks S must not offer 2XL, because Printify rejects that order
   *  after the buyer has paid. */
  sizesByColour: Record<string, { size: string; variantId: number }[]>;
} | null;

/** Server-side: Printify's catalogue needs the API token, so the options are
 *  resolved here and handed to the form as plain data. */
export async function getOrderOptions(
  garmentSlug: string | null
): Promise<OrderOptions> {
  const garment = garmentSlug ? findGarment(garmentSlug) : defaultGarment();
  if (!garment) return null;

  // Sellable, not the whole catalogue: offering a colour the product does not
  // carry produces an order Printify rejects after the buyer has paid.
  const variants = sellableVariants(garment, await catalogVariants(garment));
  if (variants.length === 0) return null;

  const colours = coloursFrom(variants);
  const sizesByColour: Record<string, { size: string; variantId: number }[]> = {};
  for (const { colour } of colours) {
    sizesByColour[colour] = sizesForColour(variants, colour);
  }

  return {
    garmentLabel: garment.label,
    priceCents: garment.priceCents,
    colours,
    sizesByColour,
  };
}

/** Service-role client. `orders` has no client insert policy — every row is
 *  written on the user's behalf by trusted code. Same pattern as
 *  app/api/generate/route.ts and lib/printify/sync.ts. */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Buys a printed garment of a claimed design.
 *
 *  No row lock and no `security definer` RPC, unlike `claim_design`: that one
 *  serialises a race for a single exclusive claim. Fifty people may order the
 *  same shirt, so there is nothing to serialise here.
 */
export async function placeGarmentOrder(
  designId: string,
  variantId: number,
  rawAddress: Record<string, unknown>
): Promise<OrderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to order." };

  const address = validateAddress(rawAddress);
  if (!address.ok) return { error: address.error };

  // Re-read server-side: the client's idea of this design is a suggestion.
  const { data: design } = await supabase
    .from("designs")
    .select("id, claimed_by, printify_product_id, garment_slug, prompt")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design) return { error: "Design not available." };

  const garment = design.garment_slug
    ? findGarment(design.garment_slug)
    : defaultGarment();

  if (!garment) return { error: "This design isn't ready to order yet." };

  const variants = sellableVariants(garment, await catalogVariants(garment));
  const check = orderEligibility(
    {
      claimedBy: design.claimed_by,
      printifyProductId: design.printify_product_id,
    },
    variantId,
    variants.map((variant) => variant.id)
  );

  if (!check.ok) return { error: check.error };

  const { paymentRef } = await charge({
    amountCents: garment.priceCents,
    buyerId: user.id,
    designId,
  });

  const admin = serviceClient();
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      kind: "garment",
      buyer_id: user.id,
      design_id: designId,
      variant_id: variantId,
      amount_cents: garment.priceCents,
      payment_ref: paymentRef,
      status: "paid",
      ship_first_name: address.address.firstName,
      ship_last_name: address.address.lastName,
      ship_email: address.address.email,
      ship_phone: address.address.phone,
      ship_country: address.address.country,
      ship_region: address.address.region,
      ship_address1: address.address.address1,
      ship_address2: address.address.address2,
      ship_city: address.address.city,
      ship_zip: address.address.zip,
    })
    .select("id")
    .single();

  if (error || !order) {
    console.error("[order] insert failed", error);
    return { error: "Could not place the order." };
  }

  // Past the response: Printify is several network hops, the confirmation is
  // another, and the order is already recorded. Both swallow their own
  // failures — an unsubmitted order or an unsent receipt is recoverable from
  // the row, a 500 after taking payment is not.
  //
  // The Printify half is a no-op unless PRINTIFY_SUBMIT_ORDERS is on.
  after(async () => {
    const { subject, html } = garmentOrderEmail({
      orderId: order.id,
      buyerName: address.address.firstName,
      designLabel: designLabel({ prompt: design.prompt }, 60),
      garmentLabel: garment.label,
      priceCents: garment.priceCents,
      placedAt: new Date(),
    })

    await sendEmail({ to: address.address.email, subject, html })

    try {
      const submitted = await submitPrintifyOrder({
        orderId: order.id,
        productId: design.printify_product_id!,
        variantId,
        address: address.address,
      });

      if (submitted) {
        await admin
          .from("orders")
          .update({
            printify_order_id: submitted.printifyOrderId,
            printify_status: submitted.status,
          })
          .eq("id", order.id);
      }
    } catch (submitError) {
      console.error(`[order] Printify submission failed for ${order.id}`, submitError);
    }
  });

  return { orderId: order.id };
}
