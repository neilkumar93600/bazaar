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
  /** Every design in the catalogue. True and non-zero from the first seed, so
   *  it carries the stats row before there is any traction to report. */
  designsLive: number
  /** Designs nobody owns yet — the number that actually invites a claim. */
  designsUnclaimed: number
  designsClaimed: number
  creatorCount: number
  royaltiesPaidCents: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const supabase = await createClient()

  const [designsCount, claimsCount, storefrontsCount, royaltyRows] =
    await Promise.all([
      supabase.from("designs").select("*", { count: "exact", head: true }),
      supabase.from("claims").select("*", { count: "exact", head: true }),
      supabase.from("storefronts").select("*", { count: "exact", head: true }),
      // ponytail: sums every paid royalty row in JS — fine at current scale,
      // move to a SQL sum/RPC if royalty_ledger grows large enough to matter.
      supabase
        .from("royalty_ledger")
        .select("amount_cents")
        .not("paid_at", "is", null),
    ])

  const designsLive = designsCount.count ?? 0
  const designsClaimed = claimsCount.count ?? 0

  return {
    designsLive,
    // Clamped: a claim whose design row is gone would otherwise drive this
    // negative and render "-3 unclaimed" on the front page.
    designsUnclaimed: Math.max(0, designsLive - designsClaimed),
    designsClaimed,
    creatorCount: storefrontsCount.count ?? 0,
    royaltiesPaidCents: (royaltyRows.data ?? []).reduce(
      (sum, r) => sum + r.amount_cents,
      0
    ),
  }
}
