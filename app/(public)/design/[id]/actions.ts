"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/payments/checkout";
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

export async function claimDesign(designId: string): Promise<ClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to claim this design." };
  }

  // Never trust a client-sent price — re-fetch it fresh server-side.
  const { data: design } = await supabase
    .from("designs")
    .select("price_cents")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design) {
    return { error: "Design not available." };
  }

  const { paymentRef } = await charge({
    amountCents: design.price_cents,
    buyerId: user.id,
    designId,
  });

  const { data, error } = await supabase.rpc("claim_design", {
    p_design_id: designId,
    p_amount_cents: design.price_cents,
    p_payment_ref: paymentRef,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Someone just claimed this design." };
  }

  redirect(`/creator/${data[0].handle}`);
}
