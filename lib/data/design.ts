import { createClient } from "@/lib/supabase/server"

export type DesignDetail = {
  id: string
  imageUrl: string
  priceCents: number
  vibeName: string | null
  isClaimed: boolean
  claimantHandle: string | null
  claimedAt: string | null
  createdAt: string
}

export async function getDesignDetail(id: string): Promise<DesignDetail | null> {
  const supabase = await createClient()

  const { data: design } = await supabase
    .from("designs")
    .select("id, image_url, price_cents, vibe_id, is_claimed, claimed_by, created_at")
    .eq("id", id)
    .eq("moderation_status", "approved")
    .maybeSingle()

  if (!design) return null

  const [{ data: vibe }, { data: claimantProfile }, { data: claimRow }] =
    await Promise.all([
      design.vibe_id
        ? supabase.from("vibes").select("name").eq("id", design.vibe_id).maybeSingle()
        : Promise.resolve({ data: null as { name: string } | null }),
      design.claimed_by
        ? supabase
            .from("profiles")
            .select("handle")
            .eq("id", design.claimed_by)
            .maybeSingle()
        : Promise.resolve({ data: null as { handle: string } | null }),
      design.is_claimed
        ? supabase
            .from("claims")
            .select("claimed_at")
            .eq("design_id", design.id)
            .maybeSingle()
        : Promise.resolve({ data: null as { claimed_at: string } | null }),
    ])

  return {
    id: design.id,
    imageUrl: design.image_url,
    priceCents: design.price_cents,
    vibeName: vibe?.name ?? null,
    isClaimed: design.is_claimed,
    claimantHandle: claimantProfile?.handle ?? null,
    claimedAt: claimRow?.claimed_at ?? null,
    createdAt: design.created_at,
  }
}
