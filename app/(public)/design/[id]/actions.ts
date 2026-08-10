"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, stripeConfigured } from "@/lib/payments/stripe";
import { resolveBuyerId } from "@/lib/purchase/buyer-account";
import { deliverDesignPurchase } from "@/lib/purchase/deliver";
import { validateBuyer } from "@/lib/orders/buyer";
import { syncDesignProduct } from "@/lib/printify/sync";
import { getDesignDetail, type DesignDetail } from "@/lib/data/design";
import { siteUrl } from "@/lib/site";
import { designLabel } from "@/lib/utils";
import {
  getOrderOptions,
  type OrderOptions,
} from "@/app/(public)/design/[id]/order-actions";

/** `checkoutUrl` means the purchase isn't finished: the buyer has to go to
 *  Stripe. A free purchase redirects instead and returns nothing. */
export type BuyState = { error?: string; checkoutUrl?: string };

export type DesignDialogData = {
  design: DesignDetail | null;
  viewerIsLoggedIn: boolean;
  viewerEmail: string;
  viewerName: string;
  orderOptions: OrderOptions;
};

export async function getDesignDialogData(
  designId: string
): Promise<DesignDialogData> {
  const [design, supabase] = await Promise.all([
    getDesignDetail(designId),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only a claimed design with a product can be ordered, so the catalogue call
  // is skipped entirely for everything else.
  const [orderOptions, { data: profile }] = await Promise.all([
    design?.claimedBy && design.printifyProductId
      ? getOrderOptions(design.garmentSlug)
      : Promise.resolve(null),
    user
      ? supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { display_name: string | null } | null }),
  ]);

  return {
    design,
    viewerIsLoggedIn: Boolean(user),
    viewerEmail: user?.email ?? "",
    viewerName: profile?.display_name ?? "",
    orderOptions,
  };
}

/** Buys a design outright — the claim that makes the buyer its permanent
 *  owner.
 *
 *  Free splits from priced here and stays split all the way down. A free
 *  design is claimed inside this call and the receipt goes out behind the
 *  response. A priced one only gets a Stripe Checkout session; the claim
 *  happens in lib/payments/fulfil.ts once Stripe says the money moved, which
 *  is the only moment it is true.
 */
export async function buyDesign(
  designId: string,
  /** The price the buyer was shown. Compared, never charged — the amount
   *  charged comes from the row. A client that lies here can only make its own
   *  purchase fail. */
  expectedCents: number | null,
  rawBuyer: Record<string, unknown>
): Promise<BuyState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const buyer = validateBuyer(rawBuyer);
  if (!buyer.ok) return { error: buyer.error };

  // Never trust a client-sent price — re-fetch it fresh server-side. RLS makes
  // this return nothing for an unlisted design the caller doesn't own, which is
  // the first of the two listing gates; the claim RPC holds the second, inside
  // the row lock, where it is actually atomic.
  const { data: design } = await supabase
    .from("designs")
    .select("price_cents, listed_at, prompt, image_url")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design || design.listed_at === null) {
    return { error: "Design not available." };
  }

  if (design.price_cents !== expectedCents) {
    return { error: "The price changed. Refresh and try again." };
  }

  if (design.price_cents !== null) {
    if (!stripeConfigured()) {
      return { error: "Card payments aren't switched on yet." };
    }

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: buyer.buyer.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: design.price_cents,
            product_data: {
              name: designLabel({ prompt: design.prompt }, 80),
              description: "1-of-1 design, yours permanently.",
              images: [design.image_url],
            },
          },
        },
      ],
      // Everything fulfilment needs, because the webhook that finishes this
      // purchase arrives with no session, no cookie and no form post.
      //
      // A guest carries no buyerId: the account is minted at fulfilment, not
      // here, so an abandoned checkout leaves no empty account behind.
      metadata: {
        designId,
        ...(user ? { buyerId: user.id } : {}),
        buyerName: buyer.buyer.name,
        buyerEmail: buyer.buyer.email,
        expectedCents: String(design.price_cents),
      },
      success_url: `${siteUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/design/${designId}`,
    });

    if (!session.url) {
      return { error: "Stripe didn't return a checkout page. Try again." };
    }

    return { checkoutUrl: session.url };
  }

  // A guest gets an account made from the email they just typed. Same door the
  // Stripe webhook uses, for the same reason: the buyer is established by this
  // trusted server code rather than by a session that may not exist.
  const admin = createServiceClient();
  const buyerId = user?.id ?? (await resolveBuyerId(buyer.buyer, admin.auth.admin));

  if (!buyerId) {
    return { error: "We couldn't set up an account for that email. Try another." };
  }

  // Free: no payment ref at all, rather than a zero-amount charge. Stripe
  // rejects a zero charge, and inventing a reference for money that never
  // moved makes the orders table lie.
  const { data, error } = await admin.rpc("claim_design_for", {
    p_buyer_id: buyerId,
    p_design_id: designId,
    p_expected_cents: null,
    p_payment_ref: null,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Someone just claimed this design." };
  }

  const claim = data[0];

  // Both past the response. The receipt is an email round trip and the sync is
  // several — neither belongs between the buyer and the design they now own.
  //
  // The sync is normally a no-op: the product was minted when the design was
  // listed. It is the backfill for designs listed before Printify was set up.
  after(async () => {
    await deliverDesignPurchase({
      designId,
      orderId: claim.order_id,
      buyer: buyer.buyer,
      handle: claim.handle,
    });
    await syncDesignProduct(designId);
  });

  redirect(`/creator/${claim.handle}`);
}
