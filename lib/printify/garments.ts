import { printifyConfig } from "./client.ts"

/** A garment the store sells. Blueprint and provider are Printify's ids for
 *  "which product" and "who makes it"; the pair together determines the whole
 *  variant matrix.
 *
 *  Data, not code branches: adding a hoodie is appending an entry. Printify has
 *  no "which blueprints does my shop support" endpoint — a shop holds products,
 *  and the blueprint catalogue is global — so the configured list *is* the
 *  store's range.
 *
 *  Server-only in practice: `garments()` reads PRINTIFY_API_TOKEN through
 *  `printifyConfig()`. Client components that need colour swatches import
 *  `./tones.ts` instead, which has no imports at all.
 */
export type Garment = {
  slug: string
  label: string
  blueprintId: number
  printProviderId: number
  /** Retail price in cents — what a buyer pays for the garment. Printify bills
   *  cost separately; the margin is the difference.
   *
   *  This is the ONLY garment price in the system. It replaced
   *  FALLBACK_GARMENT_PRICE_CENTS in sync.ts. `designs.price_cents` means
   *  something different: what a claimer pays for ownership of the artwork. */
  priceCents: number
}

/** Built from the env pair that already works, so nothing configured today
 *  breaks. A second garment is a second entry with its own blueprint/provider. */
export function garments(): Garment[] {
  const config = printifyConfig()
  if (!config) return []

  return [
    {
      slug: "tee",
      label: "T-shirt",
      blueprintId: config.blueprintId,
      printProviderId: config.printProviderId,
      priceCents: 2900,
    },
  ]
}

export function findGarment(slug: string): Garment | null {
  return garments().find((garment) => garment.slug === slug) ?? null
}

/** The garment used when nobody chose one — designs minted before this existed,
 *  and the claim-path backfill. Null when Printify isn't configured at all,
 *  which every caller already treats as "no product". */
export function defaultGarment(): Garment | null {
  return garments()[0] ?? null
}

// --- Variants -------------------------------------------------------------

export type Variant = { id: number; colour: string; size: string }

/** Printify fuses both axes into the title: `"Black / M"`. A title with no
 *  separator has no size axis — some blueprints are one-size — so the whole
 *  title is the colour. */
export function parseVariant(raw: { id: number; title: string }): Variant {
  const [colour, size] = raw.title.split("/")
  return {
    id: raw.id,
    colour: colour.trim().replace(/\s+/g, " "),
    size: size?.trim().replace(/\s+/g, " ") || "One size",
  }
}

export type ColourOption = { colour: string; variantId: number }
export type SizeOption = { size: string; variantId: number }

/** Distinct colours in catalogue order, each with a representative variant id.
 *
 *  The maker picks a colour, not a variant — they are not buying a shirt — so
 *  the id is a stand-in, stored as `featured_variant_id` purely so the mockup
 *  picker can find that colour's render. */
export function coloursFrom(variants: Variant[]): ColourOption[] {
  const seen = new Set<string>()
  const options: ColourOption[] = []

  for (const variant of variants) {
    if (seen.has(variant.colour)) continue
    seen.add(variant.colour)
    options.push({ colour: variant.colour, variantId: variant.id })
  }

  return options
}

/** The sizes stocked in ONE colour. Never a global size list: a colour that
 *  only comes in S must not offer 2XL, because Printify rejects the order after
 *  the buyer has already paid.
 *
 *  Unused by sub-project D — the maker picks a colour, not a size — but built
 *  and tested here because it is the same parse as `coloursFrom`, and the buyer
 *  flow would otherwise write the variant-matrix logic a second time. Not dead
 *  code: do not delete. */
export function sizesForColour(variants: Variant[], colour: string): SizeOption[] {
  return variants
    .filter((variant) => variant.colour === colour)
    .map((variant) => ({ size: variant.size, variantId: variant.id }))
}
