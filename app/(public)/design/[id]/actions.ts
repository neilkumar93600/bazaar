"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { boltConfigured, createOrderToken } from "@/lib/payments/bolt";
import { fulfilBoltTransaction } from "@/lib/payments/fulfil";
import { resolveBuyerId } from "@/lib/purchase/buyer-account";
import { deliverDesignPurchase } from "@/lib/purchase/deliver";
import { validateBuyer } from "@/lib/orders/buyer";
import { syncDesignProduct } from "@/lib/printify/sync";
import { getDesignDetail, type DesignDetail } from "@/lib/data/design";
import { envValue } from "@/lib/site";
import { designLabel } from "@/lib/utils";
import {
  getOrderOptions,
  type OrderOptions,
} from "@/app/(public)/design/[id]/order-actions";
import {
  colourMockups,
  frontMockupFrom,
  type ColourMockup,
} from "@/lib/printify/mockups";

/** `boltToken` means the purchase isn't finished: the browser still has to
 *  open Bolt's modal with it. A free purchase redirects instead and returns
 *  nothing.
 *
 *  Bolt is a modal, not a hosted page, so there is no URL to send the buyer to
 *  — the token and the publishable key travel back to the client together and
 *  the checkout happens without leaving the design. */
export type BuyState = {
  error?: string;
  boltToken?: string;
  boltPublishableKey?: string;
};

export type DesignDialogData = {
  design: DesignDetail | null;
  viewerIsLoggedIn: boolean;
  viewerEmail: string;
  viewerName: string;
  orderOptions: OrderOptions;
  /** One product photo per garment colour, for the gallery's swatch row. */
  shirtColours: ColourMockup[];
  /** Same, for the back print. */
  backShirtColours: ColourMockup[];
};

export async function getDesignDialogData(
  designId: string
): Promise<DesignDialogData> {
  const [rawDesign, supabase] = await Promise.all([
    getDesignDetail(designId),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const frontUrl = rawDesign
    ? (frontMockupFrom(rawDesign.mockupUrl) ?? rawDesign.mockupUrl)
    : null;
  const backUrl = rawDesign ? rawDesign.backMockupUrl : null;

  const design = rawDesign
    ? {
        ...rawDesign,
        mockupUrl: frontUrl,
        backMockupUrl: backUrl,
      }
    : null;

  // Fetched for every design, not just orderable ones: the gallery needs the
  // colour list to re-point the product photo. The catalogue is cached for the
  // life of the process, so this is one network hop ever.
  const [options, { data: profile }] = await Promise.all([
    design ? getOrderOptions(design.garmentSlug) : Promise.resolve(null),
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
    // Only a claimed design with a product can actually be ordered.
    orderOptions:
      design?.claimedBy && design.printifyProductId ? options : null,
    shirtColours: colourMockups(frontUrl, options?.colours ?? []),
    backShirtColours: colourMockups(backUrl, options?.colours ?? []),
  };
}

/** Buys a design outright — the claim that makes the buyer its permanent
 *  owner.
 *
 *  Free splits from priced here and stays split all the way down. A free
 *  design is claimed inside this call and the receipt goes out behind the
 *  response. A priced one only gets a Bolt order token; the claim happens in
 *  lib/payments/fulfil.ts once Bolt says the money moved, which is the only
 *  moment it is true.
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
    .select("price_cents, listed_at, title, image_url")
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
    const publishableKey = envValue("NEXT_PUBLIC_BOLT_PUBLISHABLE_KEY");

    if (!boltConfigured() || !publishableKey) {
      return { error: "Card payments aren't switched on yet." };
    }

    // Ours, and unique per attempt. Bolt requires uniqueness per *successful*
    // transaction, but minting a fresh one per attempt is simpler and means an
    // abandoned checkout can never collide with the retry that follows it.
    const orderReference = `design_${crypto.randomUUID()}`;

    // Written before the token exists. If Bolt fails on the next line the row
    // is a few bytes of litter; if it were written after, a shopper who paid
    // in the gap would land in fulfilment with nothing to match against.
    //
    // A guest carries no buyer_id: the account is minted at fulfilment, not
    // here, so an abandoned checkout leaves no empty account behind.
    const { error: intentError } = await createServiceClient()
      .from("checkout_intents")
      .insert({
        order_reference: orderReference,
        design_id: designId,
        buyer_id: user?.id ?? null,
        buyer_name: buyer.buyer.name,
        buyer_email: buyer.buyer.email,
        expected_cents: design.price_cents,
      });

    if (intentError) {
      console.error("[buy] could not record checkout intent", intentError);
      return { error: "We couldn't start checkout. Try again." };
    }

    try {
      const boltToken = await createOrderToken({
        orderReference,
        designId,
        designLabel: designLabel({ title: design.title }, 80),
        imageUrl: design.image_url,
        priceCents: design.price_cents,
      });

      return { boltToken, boltPublishableKey: publishableKey };
    } catch (error) {
      console.error("[buy] Bolt order token failed", error);
      return { error: "We couldn't reach checkout. Try again." };
    }
  }

  // A guest gets an account made from the email they just typed. Same door the
  // Bolt webhook uses, for the same reason: the buyer is established by this
  // trusted server code rather than by a session that may not exist.
  const admin = createServiceClient();
  const buyerId = user?.id ?? (await resolveBuyerId(buyer.buyer, admin.auth.admin));

  if (!buyerId) {
    return { error: "We couldn't set up an account for that email. Try another." };
  }

  // Free: no payment ref at all, rather than a zero-amount charge. No
  // processor accepts a zero charge, and inventing a reference for money that
  // never moved makes the orders table lie.
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

/** Finishes a card purchase the moment Bolt's modal reports success.
 *
 *  The webhook is the authoritative half and arrives whether or not the buyer
 *  stays on the page; this is the fast half, so the buyer isn't left watching
 *  a spinner while a webhook queue drains. fulfilBoltTransaction is idempotent
 *  and re-reads the transaction from Bolt, so a browser that invents a
 *  reference here gets exactly nothing.
 */
export async function completeBoltPurchase(
  reference: string
): Promise<{ error?: string; handle?: string | null }> {
  if (!reference) return { error: "That payment is missing its reference." };

  const result = await fulfilBoltTransaction(reference);

  return result.ok ? { handle: result.handle } : { error: result.error };
}
