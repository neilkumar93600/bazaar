"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { charge } from "@/lib/payments/checkout";
import { computeTotalCents, type QualityTier, type Size } from "@/lib/pricing";

export type ClaimState = { error?: string };

export async function claimDesign(
  designId: string,
  input: {
    qualityTier: QualityTier;
    size: Size;
    placementFront: boolean;
    placementBack: boolean;
  }
): Promise<ClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to claim this design." };
  }

  if (!input.placementFront && !input.placementBack) {
    return { error: "Choose at least one placement." };
  }

  // Never trust a client-sent price — recompute from the design's current
  // price_cents, fetched fresh, same as claim_design() re-checks server-side.
  const { data: design } = await supabase
    .from("designs")
    .select("price_cents")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design) {
    return { error: "Design not available." };
  }

  const amountCents = computeTotalCents(
    design.price_cents,
    input.qualityTier,
    input.placementFront,
    input.placementBack
  );

  const { paymentRef } = await charge({
    amountCents,
    buyerId: user.id,
    designId,
  });

  const { data, error } = await supabase.rpc("claim_design", {
    p_design_id: designId,
    p_quality_tier: input.qualityTier,
    p_size: input.size,
    p_placement_front: input.placementFront,
    p_placement_back: input.placementBack,
    p_amount_cents: amountCents,
    p_payment_ref: paymentRef,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Someone just claimed this design." };
  }

  redirect(`/creator/${data[0].handle}`);
}
