import { createClient } from "@/lib/supabase/server"
import type { Placement } from "@/lib/printify/print-areas"

export type MakerDesign = {
  id: string
  imageUrl: string
  vibeName: string | null
  createdAt: string
  /** Null means listed free, or never priced. */
  priceCents: number | null
  isPromptHidden?: boolean
  listedAt: string | null
  /** Once a Printify product exists the garment cannot change — re-minting
   *  would orphan it — so the listing form renders that section read-only. */
  hasProduct: boolean
  garmentSlug: string | null
  featuredVariantId: number | null
  placement: Placement | null
}

export type AdoptedDesign = MakerDesign & {
  claimantHandle: string | null
  /** What the claimer actually paid. Zero for a free claim. */
  soldForCents: number
}

export type MyDesigns = {
  unlisted: MakerDesign[]
  listed: MakerDesign[]
  adopted: AdoptedDesign[]
}

/** Everything this user made, split by what they can still do with it.
 *
 *  Claimed designs move to `adopted` and lose every control — that is the
 *  ownership rule, and it is enforced by RLS, not by this grouping. The
 *  grouping exists so the page doesn't offer buttons that would fail. */
export async function getMyDesigns(): Promise<MyDesigns | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from("designs")
    .select(
      "id, image_url, vibe_id, created_at, price_cents, is_prompt_hidden, listed_at, claimed_by, printify_product_id, garment_slug, featured_variant_id, placement"
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  const designs = rows ?? []
  if (designs.length === 0) return { unlisted: [], listed: [], adopted: [] }

  const vibeIds = [
    ...new Set(
      designs.map((d) => d.vibe_id).filter((id): id is string => id !== null)
    ),
  ]
  const claimantIds = [
    ...new Set(
      designs.map((d) => d.claimed_by).filter((id): id is string => id !== null)
    ),
  ]
  const soldIds = designs.filter((d) => d.claimed_by !== null).map((d) => d.id)

  const [{ data: vibeRows }, { data: claimantRows }, { data: orderRows }] =
    await Promise.all([
      vibeIds.length
        ? supabase.from("vibes").select("id, name").in("id", vibeIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      claimantIds.length
        ? supabase.from("profiles").select("id, handle").in("id", claimantIds)
        : Promise.resolve({ data: [] as { id: string; handle: string }[] }),
      soldIds.length
        ? supabase
            .from("orders")
            .select("design_id, amount_cents")
            .in("design_id", soldIds)
            .eq("status", "paid")
        : Promise.resolve({
            data: [] as { design_id: string; amount_cents: number }[],
          }),
    ])

  const vibeNameById = new Map((vibeRows ?? []).map((v) => [v.id, v.name]))
  const handleById = new Map((claimantRows ?? []).map((p) => [p.id, p.handle]))
  const soldForByDesignId = new Map(
    (orderRows ?? []).map((o) => [o.design_id, o.amount_cents])
  )

  const base = (d: (typeof designs)[number]): MakerDesign => ({
    id: d.id,
    imageUrl: d.image_url,
    vibeName: d.vibe_id ? (vibeNameById.get(d.vibe_id) ?? null) : null,
    createdAt: d.created_at,
    priceCents: d.price_cents,
    isPromptHidden: Boolean(d.is_prompt_hidden),
    listedAt: d.listed_at,
    hasProduct: d.printify_product_id !== null,
    garmentSlug: d.garment_slug,
    featuredVariantId: d.featured_variant_id,
    placement: (d.placement as Placement | null) ?? null,
  })

  // The three filters are mutually exclusive and exhaustive: a row is adopted,
  // or unclaimed and listed, or unclaimed and unlisted. Nothing appears twice,
  // nothing vanishes.
  return {
    unlisted: designs
      .filter((d) => d.claimed_by === null && d.listed_at === null)
      .map(base),
    listed: designs
      .filter((d) => d.claimed_by === null && d.listed_at !== null)
      .map(base),
    adopted: designs
      .filter((d) => d.claimed_by !== null)
      .map((d) => ({
        ...base(d),
        claimantHandle: d.claimed_by
          ? (handleById.get(d.claimed_by) ?? null)
          : null,
        soldForCents: soldForByDesignId.get(d.id) ?? 0,
      })),
  }
}
