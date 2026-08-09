import type { DesignCardData } from "@/components/shared/DesignCard"
import { createClient } from "@/lib/supabase/server"

const DESIGNS_PER_COLUMN = 14

export type FeedDesign = DesignCardData

export type FeedColumn = {
  id: string
  name: string
  slug: string
  isRentedTakeover: boolean
  designs: FeedDesign[]
}

export async function getFeedColumns(): Promise<FeedColumn[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let vibesQuery = supabase
    .from("vibes")
    .select("id, name, slug, is_default_column, owner_id")
    .order("created_at", { ascending: true })

  if (user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", user.id)

    const followedIds = follows?.map((f) => f.followed_id) ?? []
    vibesQuery = vibesQuery.or(
      followedIds.length > 0
        ? `is_default_column.eq.true,owner_id.in.(${followedIds.join(",")})`
        : "is_default_column.eq.true"
    )
  } else {
    vibesQuery = vibesQuery.eq("is_default_column", true)
  }

  const { data: vibes } = await vibesQuery
  if (!vibes || vibes.length === 0) return []

  const now = new Date().toISOString()
  const [{ data: designs }, { data: rentals }] = await Promise.all([
    supabase
      .from("designs")
      .select(
        "id, vibe_id, image_url, mockup_url, is_claimed, price_cents, created_at, claimed_by"
      )
      .eq("moderation_status", "approved")
      // RLS hides other people's unlisted designs; this hides the viewer's own.
      .not("listed_at", "is", null)
      .in(
        "vibe_id",
        vibes.map((v) => v.id)
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("column_rentals")
      .select("vibe_id")
      .lte("starts_at", now)
      .gte("ends_at", now)
      .in(
        "vibe_id",
        vibes.map((v) => v.id)
      ),
  ])

  const rentedVibeIds = new Set(rentals?.map((r) => r.vibe_id))

  // The shared card names the claimant, so resolve handles in one pass rather
  // than per column.
  const claimantIds = [
    ...new Set(
      (designs ?? [])
        .map((d) => d.claimed_by)
        .filter((id): id is string => id !== null)
    ),
  ]

  const { data: profileRows } = claimantIds.length
    ? await supabase.from("profiles").select("id, handle").in("id", claimantIds)
    : { data: [] }

  const handleById = new Map((profileRows ?? []).map((p) => [p.id, p.handle]))

  return vibes.map((vibe) => ({
    id: vibe.id,
    name: vibe.name,
    slug: vibe.slug,
    isRentedTakeover: rentedVibeIds.has(vibe.id),
    designs: (designs ?? [])
      .filter((d) => d.vibe_id === vibe.id)
      .slice(0, DESIGNS_PER_COLUMN)
      .map((d) => ({
        id: d.id,
        imageUrl: d.image_url,
        mockupUrl: d.mockup_url ?? null,
        isClaimed: d.is_claimed,
        priceCents: d.price_cents,
        createdAt: d.created_at,
        vibeName: vibe.name,
        claimantHandle: d.claimed_by
          ? (handleById.get(d.claimed_by) ?? null)
          : null,
      })),
  }))
}
