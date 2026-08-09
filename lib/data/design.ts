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
  /** Printify's photo of the finished garment, once the design is claimed and
   *  synced. Null falls back to the drawn mockup. */
  mockupUrl: string | null
  prompt: string | null
  /** The arched title and the line underneath, for poster designs. Null for
   *  every other style — the words are the design there, so the detail page
   *  should show them next to the idea that made the picture. */
  title: string | null
  quote: string | null
  /** Null means the maker listed it free. */
  priceCents: number | null
  vibeName: string | null
  isClaimed: boolean
  /** The owner's id. A garment can only be ordered once a design has one. */
  claimedBy: string | null
  claimantHandle: string | null
  /** Ordering needs all three: the product to order against, and the garment
   *  whose catalogue the chosen variant must belong to. */
  printifyProductId: string | null
  garmentSlug: string | null
  featuredVariantId: number | null
  claimedAt: string | null
  createdAt: string
  creator: DesignCreator | null
}

export async function getDesignDetail(id: string): Promise<DesignDetail | null> {
  const supabase = await createClient()

  const { data: design } = await supabase
    .from("designs")
    .select(
      "id, image_url, mockup_url, prompt, price_cents, vibe_id, is_claimed, claimed_by, created_at, generation_job_id, printify_product_id, garment_slug, featured_variant_id"
    )
    .eq("id", id)
    .eq("moderation_status", "approved")
    .maybeSingle()

  if (!design) return null

  type CreatorJob = {
    text_content: string | null
    quote_content: string | null
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
            .select("profiles(handle, display_name, avatar_url, bio), text_content, quote_content")
            .eq("id", design.generation_job_id)
            .maybeSingle<CreatorJob>()
        : Promise.resolve({ data: null as CreatorJob | null }),
    ])

  const creatorProfile = job?.profiles ?? null

  return {
    id: design.id,
    imageUrl: design.image_url,
    mockupUrl: design.mockup_url ?? null,
    prompt: design.prompt,
    title: job?.text_content ?? null,
    quote: job?.quote_content ?? null,
    priceCents: design.price_cents,
    vibeName: vibe?.name ?? null,
    isClaimed: design.is_claimed,
    claimedBy: design.claimed_by ?? null,
    claimantHandle: claimantProfile?.handle ?? null,
    printifyProductId: design.printify_product_id ?? null,
    garmentSlug: design.garment_slug ?? null,
    featuredVariantId: design.featured_variant_id ?? null,
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
