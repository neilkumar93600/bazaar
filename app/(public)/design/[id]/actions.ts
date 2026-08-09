"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/payments/checkout";
import { syncDesignProduct } from "@/lib/printify/sync";
import { getDesignDetail, type DesignDetail } from "@/lib/data/design";

export type ClaimState = { error?: string };

export async function getDesignDialogData(
  designId: string
): Promise<{ design: DesignDetail | null; viewerIsLoggedIn: boolean }> {
  const [design, supabase] = await Promise.all([
    getDesignDetail(designId),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { design, viewerIsLoggedIn: Boolean(user) };
}

export async function claimDesign(
  designId: string,
  /** The price the buyer was shown. Compared, never charged — the amount
   *  charged comes from the row. A client that lies here can only make its own
   *  claim fail. */
  expectedCents: number | null
): Promise<ClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to claim this design." };
  }

  // Never trust a client-sent price — re-fetch it fresh server-side. RLS makes
  // this return nothing for an unlisted design the caller doesn't own, which is
  // the first of the two listing gates; claim_design holds the second, inside
  // the row lock, where it is actually atomic.
  const { data: design } = await supabase
    .from("designs")
    .select("price_cents, listed_at")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design || design.listed_at === null) {
    return { error: "Design not available." };
  }

  if (design.price_cents !== expectedCents) {
    return { error: "The price changed. Refresh and try again." };
  }

  // A free claim takes no payment at all, rather than a zero-amount charge:
  // the mock adapter would happily mint a payment ref for nothing, and a real
  // Stripe integration would reject it.
  const paymentRef =
    design.price_cents === null
      ? null
      : (
          await charge({
            amountCents: design.price_cents,
            buyerId: user.id,
            designId,
          })
        ).paymentRef;

  const { data, error } = await supabase.rpc("claim_design", {
    p_design_id: designId,
    p_expected_cents: design.price_cents,
    p_payment_ref: paymentRef,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Someone just claimed this design." };
  }

  // Normally a no-op: the product was minted when the design was listed. This
  // is the backfill for designs listed before Printify was configured, and it
  // must not stand between the buyer and their claim, so it runs past the
  // response.
  after(async () => {
    await syncDesignProduct(designId);
  });

  redirect(`/creator/${data[0].handle}`);
}
