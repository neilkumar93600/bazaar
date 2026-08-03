import { createClient } from "@/lib/supabase/server"

export type DesignCreator = {
  handle: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
}

export type DesignDetail = {
  id: string
  imageUrl: string
  prompt: string | null
  priceCents: number
  vibeName: string | null
  isClaimed: boolean
  claimantHandle: string | null
  claimedAt: string | null
  createdAt: string
  creator: DesignCreator | null
}

export async function getDesignDetail(id: string): Promise<DesignDetail | null> {
  const supabase = await createClient()

  const { data: design } = await supabase
    .from("designs")
    .select(
      "id, image_url, prompt, price_cents, vibe_id, is_claimed, claimed_by, created_at, generation_job_id"
    )
    .eq("id", id)
    .eq("moderation_status", "approved")
    .maybeSingle()

  if (!design) return null

  type CreatorJob = {
    profiles: {
      handle: string
      display_name: string | null
      avatar_url: string | null
      bio: string | null
    } | null
  }

  const [{ data: vibe }, { data: claimantProfile }, { data: claimRow }, { data: job }] =
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
      // Embeds the creator's profile via the generation_jobs -> profiles FK
      // in the same request, instead of a second round trip once we know
      // the job's user_id.
      design.generation_job_id
        ? supabase
            .from("generation_jobs")
            .select("profiles(handle, display_name, avatar_url, bio)")
            .eq("id", design.generation_job_id)
            .maybeSingle<CreatorJob>()
        : Promise.resolve({ data: null as CreatorJob | null }),
    ])

  const creatorProfile = job?.profiles ?? null

  return {
    id: design.id,
    imageUrl: design.image_url,
    prompt: design.prompt,
    priceCents: design.price_cents,
    vibeName: vibe?.name ?? null,
    isClaimed: design.is_claimed,
    claimantHandle: claimantProfile?.handle ?? null,
    claimedAt: claimRow?.claimed_at ?? null,
    createdAt: design.created_at,
    creator: creatorProfile
      ? {
          handle: creatorProfile.handle,
          displayName: creatorProfile.display_name,
          avatarUrl: creatorProfile.avatar_url,
          bio: creatorProfile.bio,
        }
      : null,
  }
}
