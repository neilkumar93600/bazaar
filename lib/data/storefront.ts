import { cache } from "react"

import type { DesignCardData } from "@/components/shared/DesignCard"
import { createClient } from "@/lib/supabase/server"

export type StorefrontProfile = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
}

export type StorefrontDesign = DesignCardData & { claimedAt: string }

export type StorefrontData = {
  profile: StorefrontProfile
  followerCount: number
  designs: StorefrontDesign[]
  createdDesigns: DesignCardData[]
  claimedSince: string | null
  isFollowing: boolean
  isOwnProfile: boolean
  viewerIsLoggedIn: boolean
}

// Cached per request so generateMetadata and the page body share one round of
// queries instead of running the whole fan-out twice.
export const getStorefrontData = cache(async function getStorefrontData(
  handle: string
): Promise<StorefrontData | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: stdProfile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, bio")
    .eq("handle", handle)
    .maybeSingle()

  if (!stdProfile) return null

  let bannerUrl: string | null = null
  try {
    const { data: bannerData } = await supabase
      .from("profiles")
      .select("banner_url")
      .eq("id", stdProfile.id)
      .single()
    if (bannerData && "banner_url" in bannerData) {
      bannerUrl = (bannerData as { banner_url?: string | null }).banner_url ?? null
    }
  } catch {
    bannerUrl = null
  }

  const profile = {
    ...stdProfile,
    banner_url: bannerUrl,
  }

  const followRowPromise =
    user && user.id !== profile.id
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followed_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id: string } | null })

  const [{ count: followerCount }, { data: claims }, { data: followRow }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", profile.id),
      supabase
        .from("claims")
        .select("design_id, claimed_at")
        .eq("claimant_id", profile.id)
        .order("claimed_at", { ascending: true }),
      followRowPromise,
    ])

  const claimList = claims ?? []
  const designIds = claimList.map((c) => c.design_id)

  const { data: designRows } = designIds.length
    ? await supabase
        .from("designs")
        .select("id, image_url, mockup_url, vibe_id, price_cents, title, created_at")
        .in("id", designIds)
        .eq("moderation_status", "approved")
        // An owner who delists a design they own stops showing it publicly.
        .not("listed_at", "is", null)
    : { data: [] }

  const vibeIds = [
    ...new Set(
      (designRows ?? [])
        .map((d) => d.vibe_id)
        .filter((id): id is string => id !== null)
    ),
  ]

  const { data: vibeRows } = vibeIds.length
    ? await supabase.from("vibes").select("id, name, slug").in("id", vibeIds)
    : { data: [] }

  const vibeById = new Map((vibeRows ?? []).map((v) => [v.id, v]))
  const claimedAtByDesignId = new Map(
    claimList.map((c) => [c.design_id, c.claimed_at])
  )

  const designs: StorefrontDesign[] = (designRows ?? [])
    .map((d) => ({
      id: d.id,
      imageUrl: d.image_url,
      mockupUrl: d.mockup_url ?? null,
      claimedAt: claimedAtByDesignId.get(d.id)!,
      createdAt: d.created_at,
      priceCents: d.price_cents,
      title: d.title ?? null,
      vibeName: (d.vibe_id ? vibeById.get(d.vibe_id)?.name : null) ?? null,
      // Every design on a storefront is claimed, by definition — it got here
      // through this profile's claims.
      isClaimed: true,
      claimantHandle: profile.handle,
    }))
    .sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1))

  // Designs this profile made — independent of who (if anyone) ended up
  // claiming them, so each one resolves its own claimant. `creator_id` replaces
  // the old two-step hop through generation_jobs.
  const { data: createdRows } = await supabase
    .from("designs")
    .select("id, image_url, mockup_url, vibe_id, price_cents, title, created_at, is_claimed, claimed_by")
    .eq("creator_id", profile.id)
    .eq("moderation_status", "approved")
    // A public storefront shows what this maker put in the bazaar, never their
    // private drafts.
    .not("listed_at", "is", null)
    .order("created_at", { ascending: false })

  const createdVibeIds = [
    ...new Set(
      (createdRows ?? [])
        .map((d) => d.vibe_id)
        .filter((id): id is string => id !== null)
    ),
  ]
  const { data: createdVibeRows } = createdVibeIds.length
    ? await supabase.from("vibes").select("id, name").in("id", createdVibeIds)
    : { data: [] }
  const createdVibeNameById = new Map(
    (createdVibeRows ?? []).map((v) => [v.id, v.name])
  )

  const createdClaimantIds = [
    ...new Set(
      (createdRows ?? [])
        .map((d) => d.claimed_by)
        .filter((id): id is string => id !== null)
    ),
  ]
  const { data: createdClaimantRows } = createdClaimantIds.length
    ? await supabase.from("profiles").select("id, handle").in("id", createdClaimantIds)
    : { data: [] }
  const createdClaimantHandleById = new Map(
    (createdClaimantRows ?? []).map((p) => [p.id, p.handle])
  )

  const createdDesigns: DesignCardData[] = (createdRows ?? []).map((d) => ({
    id: d.id,
    imageUrl: d.image_url,
    mockupUrl: d.mockup_url ?? null,
    createdAt: d.created_at,
    priceCents: d.price_cents,
    vibeName: (d.vibe_id ? createdVibeNameById.get(d.vibe_id) : null) ?? null,
    isClaimed: d.is_claimed,
    claimantHandle: d.claimed_by
      ? (createdClaimantHandleById.get(d.claimed_by) ?? null)
      : null,
  }))

  return {
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bannerUrl: (profile as Record<string, unknown>).banner_url as string | null ?? null,
      bio: (profile as Record<string, unknown>).bio as string | null ?? null,
    },
    followerCount: followerCount ?? 0,
    designs,
    createdDesigns,
    claimedSince: claimList.length > 0 ? claimList[0].claimed_at : null,
    isFollowing: Boolean(followRow),
    isOwnProfile: user?.id === profile.id,
    viewerIsLoggedIn: Boolean(user),
  }
})
