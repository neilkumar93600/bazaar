import { createClient } from "@/lib/supabase/server"
import type { DesignCardData } from "@/components/shared/DesignCard"
import { designImageSrc } from "@/lib/images/design-src"
import type { Placement } from "@/lib/printify/print-areas"

export type DesignCreator = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  /** Storefront banner. Null renders the card's own flat ground instead. */
  bannerUrl: string | null
  bio: string | null
}

export type DesignDetail = {
  id: string
  imageUrl: string
  /** Printify's photo of the finished garment, once the design is claimed and
   *  synced. Null falls back to the drawn mockup. */
  mockupUrl: string | null
  /** The back-camera photo. Populated for every synced product regardless of
   *  placement — Printify photographs every angle whether or not that side has
   *  a print on it. Null until the design is synced. */
  backMockupUrl: string | null
  /** What the maker printed this on. Null is a pre-garment-config design,
   *  which the bazaar treats as "front". */
  placement: Placement | null
  /** Buyer-facing copy, written by the composer. The prompt is deliberately
   *  absent from this type: it is the recipe, it never reaches the browser, and
   *  a field that exists is a field something eventually renders. */
  description: string | null
  /** The design's name — 5-7 words, written by the composer. Null when the
   *  composer fell back: it stores no title at all rather than the first words
   *  of the prompt, and designLabel() falls through to the vibe. */
  title: string | null
  /** The line printed under the illustration, for poster styles. Not a name —
   *  it is copy that appears in the artwork itself. */
  quote: string | null
  /** Null means the maker listed it free. */
  priceCents: number | null
  vibeName: string | null
  /** Drives the same-vibe strip on the design page. */
  vibeId: string | null
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
      "id, image_url, mockup_url, back_mockup_url, placement, title, description, quote_content, price_cents, vibe_id, is_claimed, claimed_by, created_at, creator_id, printify_product_id, garment_slug, featured_variant_id"
    )
    .eq("id", id)
    .eq("moderation_status", "approved")
    .maybeSingle()

  if (!design) return null

  type CreatorProfile = {
    id: string
    handle: string
    display_name: string | null
    avatar_url: string | null
    banner_url: string | null
    bio: string | null
  }

  const [{ data: vibe }, { data: claimantProfile }, { data: claimRow }, { data: creatorProfile }] =
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
      // Read straight off designs.creator_id rather than joining through
      // generation_jobs: that join used to work here, but generation_jobs'
      // only public-read policy was dropped in 20260809140315 (see that
      // migration's step 5) once creator_id made it redundant for
      // attribution. Left as a join, this silently returned null for every
      // visitor but the design's own maker — see
      // 20260903120000_design_quote_content.sql.
      design.creator_id
        ? supabase
            .from("profiles")
            .select("id, handle, display_name, avatar_url, banner_url, bio")
            .eq("id", design.creator_id)
            .maybeSingle<CreatorProfile>()
        : Promise.resolve({ data: null as CreatorProfile | null }),
    ])

  return {
    id: design.id,
    imageUrl: designImageSrc(design.id),
    mockupUrl: design.mockup_url ?? null,
    backMockupUrl: design.back_mockup_url ?? null,
    placement: (design.placement as Placement | null) ?? null,
    description: design.description ?? null,
    title: design.title ?? null,
    quote: design.quote_content ?? null,
    priceCents: design.price_cents,
    vibeName: vibe?.name ?? null,
    vibeId: design.vibe_id ?? null,
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
          id: creatorProfile.id,
          handle: creatorProfile.handle,
          displayName: creatorProfile.display_name,
          avatarUrl: creatorProfile.avatar_url,
          bannerUrl: creatorProfile.banner_url,
          bio: creatorProfile.bio,
        }
      : null,
  }
}

const CARD_COLUMNS =
  "id, image_url, mockup_url, is_claimed, price_cents, title, created_at, vibe_id, claimed_by"

type CardRow = {
  id: string
  image_url: string
  mockup_url: string | null
  is_claimed: boolean
  price_cents: number | null
  title: string | null
  created_at: string
  vibe_id: string | null
  claimed_by: string | null
}

/** Rows to cards, with the two lookups a card needs. Shared by both strips so
 *  they cannot drift into showing different things about the same design. */
async function toCards(rows: CardRow[]): Promise<DesignCardData[]> {
  if (rows.length === 0) return []

  const supabase = await createClient()

  const vibeIds = [...new Set(rows.map((d) => d.vibe_id).filter(Boolean))]
  const claimantIds = [...new Set(rows.map((d) => d.claimed_by).filter(Boolean))]

  const [{ data: vibes }, { data: claimants }] = await Promise.all([
    vibeIds.length
      ? supabase.from("vibes").select("id, name").in("id", vibeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    claimantIds.length
      ? supabase.from("profiles").select("id, handle").in("id", claimantIds)
      : Promise.resolve({ data: [] as { id: string; handle: string }[] }),
  ])

  const vibeName = new Map((vibes ?? []).map((v) => [v.id, v.name]))
  const claimantHandle = new Map((claimants ?? []).map((p) => [p.id, p.handle]))

  return rows.map((d) => ({
    id: d.id,
    imageUrl: designImageSrc(d.id),
    mockupUrl: d.mockup_url ?? null,
    isClaimed: d.is_claimed,
    priceCents: d.price_cents,
    title: d.title ?? null,
    vibeName: d.vibe_id ? (vibeName.get(d.vibe_id) ?? null) : null,
    claimantHandle: d.claimed_by ? (claimantHandle.get(d.claimed_by) ?? null) : null,
    createdAt: d.created_at,
  }))
}

/** One listed design, for the auth panel.
 *
 *  Newest first and always the same one within a request, so the plate does not
 *  change between /login and /signup mid-flow. Listed and approved only — RLS
 *  enforces that independently, but an auth page is a stranger's first sight of
 *  the product and must not be the thing that leaks a draft.
 *
 *  Null when the bazaar is empty, which the panel renders as type alone.
 */
export async function getShowcaseDesign(): Promise<DesignCardData | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("designs")
    .select(CARD_COLUMNS)
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)
    .not("mockup_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)

  const cards = await toCards((data ?? []) as CardRow[])
  return cards[0] ?? null
}

/** More work by the same maker.
 *
 *  Listed designs only, and RLS enforces that independently — an unlisted
 *  draft must not surface in a stranger's recommendations just because it
 *  shares a creator with something they're looking at.
 */
export async function getCreatorDesigns(
  creatorId: string,
  excludeDesignId: string,
  limit = 12
): Promise<DesignCardData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("designs")
    .select(CARD_COLUMNS)
    .eq("creator_id", creatorId)
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)
    .neq("id", excludeDesignId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return toCards((data ?? []) as CardRow[])
}

/** Designs in the same vibe, by anyone.
 *
 *  Vibe is the only similarity signal the schema carries — there are no tags,
 *  no embeddings and no view history. It is honest about that rather than
 *  calling a random sample "recommended for you".
 */
export async function getRelatedDesigns(
  vibeId: string | null,
  excludeDesignId: string,
  limit = 12
): Promise<DesignCardData[]> {
  if (!vibeId) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from("designs")
    .select(CARD_COLUMNS)
    .eq("vibe_id", vibeId)
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)
    .neq("id", excludeDesignId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return toCards((data ?? []) as CardRow[])
}
