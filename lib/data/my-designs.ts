import { createClient } from "@/lib/supabase/server"

export type MyDesign = {
  id: string
  imageUrl: string
  claimedAt: string
  vibeName: string | null
  royaltyTotalCents: number
}

export async function getMyDesigns(): Promise<MyDesign[] | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: claims } = await supabase
    .from("claims")
    .select("design_id, claimed_at")
    .eq("claimant_id", user.id)
    .order("claimed_at", { ascending: false })

  const claimList = claims ?? []
  if (claimList.length === 0) return []

  const designIds = claimList.map((c) => c.design_id)

  const [{ data: designRows }, { data: royaltyRows }] = await Promise.all([
    supabase
      .from("designs")
      .select("id, image_url, vibe_id")
      .in("id", designIds),
    supabase
      .from("royalty_ledger")
      .select("design_id, amount_cents")
      .eq("original_claimant_id", user.id)
      .in("design_id", designIds),
  ])

  const vibeIds = [
    ...new Set(
      (designRows ?? [])
        .map((d) => d.vibe_id)
        .filter((id): id is string => id !== null)
    ),
  ]
  const { data: vibeRows } = vibeIds.length
    ? await supabase.from("vibes").select("id, name").in("id", vibeIds)
    : { data: [] }
  const vibeNameById = new Map((vibeRows ?? []).map((v) => [v.id, v.name]))

  const royaltyTotalByDesignId = new Map<string, number>()
  for (const r of royaltyRows ?? []) {
    royaltyTotalByDesignId.set(
      r.design_id,
      (royaltyTotalByDesignId.get(r.design_id) ?? 0) + r.amount_cents
    )
  }

  const claimedAtByDesignId = new Map(
    claimList.map((c) => [c.design_id, c.claimed_at])
  )

  return (designRows ?? [])
    .map((d) => ({
      id: d.id,
      imageUrl: d.image_url,
      claimedAt: claimedAtByDesignId.get(d.id)!,
      vibeName: d.vibe_id ? (vibeNameById.get(d.vibe_id) ?? null) : null,
      royaltyTotalCents: royaltyTotalByDesignId.get(d.id) ?? 0,
    }))
    .sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1))
}
