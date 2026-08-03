import type { DesignCardData } from "@/components/shared/DesignCard"
import { createClient } from "@/lib/supabase/server"

export type VibeTile = { id: string; name: string; slug: string }

export async function getVibeTiles(): Promise<VibeTile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("vibes")
    .select("id, name, slug")
    .order("created_at", { ascending: true })
    .limit(8)
  return data ?? []
}

export type TrendingDesign = DesignCardData

const TRENDING_LIMIT = 12

export async function getTrendingDesigns(): Promise<TrendingDesign[]> {
  const supabase = await createClient()

  const { data: claims } = await supabase
    .from("claims")
    .select("design_id, claimed_at, claimant_id")
    .order("claimed_at", { ascending: false })
    .limit(TRENDING_LIMIT)

  const claimList = claims ?? []
  const designIds = claimList.map((c) => c.design_id)
  if (designIds.length === 0) return []

  const claimantIds = [
    ...new Set(
      claimList
        .map((c) => c.claimant_id)
        .filter((id): id is string => id !== null)
    ),
  ]

  const [{ data: designs }, { data: vibeRows }, { data: profileRows }] =
    await Promise.all([
      supabase
        .from("designs")
        .select("id, image_url, price_cents, created_at, vibe_id")
        .in("id", designIds)
        .eq("moderation_status", "approved"),
      supabase.from("vibes").select("id, name"),
      claimantIds.length
        ? supabase.from("profiles").select("id, handle").in("id", claimantIds)
        : Promise.resolve({ data: [] as { id: string; handle: string }[] }),
    ])

  const designById = new Map((designs ?? []).map((d) => [d.id, d]))
  const vibeNameById = new Map((vibeRows ?? []).map((v) => [v.id, v.name]))
  const handleById = new Map((profileRows ?? []).map((p) => [p.id, p.handle]))

  // Trending is built from the claims table, so every row here is claimed.
  return claimList
    .map((claim) => {
      const design = designById.get(claim.design_id)
      if (!design) return null
      return {
        id: design.id,
        imageUrl: design.image_url,
        isClaimed: true,
        priceCents: design.price_cents,
        createdAt: design.created_at,
        vibeName:
          (design.vibe_id ? vibeNameById.get(design.vibe_id) : null) ?? null,
        claimantHandle: claim.claimant_id
          ? (handleById.get(claim.claimant_id) ?? null)
          : null,
      }
    })
    .filter((d): d is TrendingDesign => d !== null)
}

export type TopCreator = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  followerCount: number
}

const TOP_CREATORS_LIMIT = 6

export async function getTopCreators(): Promise<TopCreator[]> {
  const supabase = await createClient()

  const { data: storefronts } = await supabase
    .from("storefronts")
    .select("owner_id")
  const ownerIds = (storefronts ?? []).map((s) => s.owner_id)
  if (ownerIds.length === 0) return []

  const [{ data: profiles }, { data: follows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .in("id", ownerIds),
    supabase.from("follows").select("followed_id").in("followed_id", ownerIds),
  ])

  const followerCounts = new Map<string, number>()
  for (const f of follows ?? []) {
    followerCounts.set(
      f.followed_id,
      (followerCounts.get(f.followed_id) ?? 0) + 1
    )
  }

  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      followerCount: followerCounts.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, TOP_CREATORS_LIMIT)
}

export type HomeStats = {
  designsClaimed: number
  creatorCount: number
  royaltiesPaidCents: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const supabase = await createClient()

  const [claimsCount, storefrontsCount, royaltyRows] = await Promise.all([
    supabase.from("claims").select("*", { count: "exact", head: true }),
    supabase.from("storefronts").select("*", { count: "exact", head: true }),
    // ponytail: sums every paid royalty row in JS — fine at current scale,
    // move to a SQL sum/RPC if royalty_ledger grows large enough to matter.
    supabase
      .from("royalty_ledger")
      .select("amount_cents")
      .not("paid_at", "is", null),
  ])

  return {
    designsClaimed: claimsCount.count ?? 0,
    creatorCount: storefrontsCount.count ?? 0,
    royaltiesPaidCents: (royaltyRows.data ?? []).reduce(
      (sum, r) => sum + r.amount_cents,
      0
    ),
  }
}
