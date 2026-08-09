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
  /** The colours this store actually sells, in display order.
   *
   *  Not a nicety — a hard requirement. Blueprint 12 / provider 99 offers 125
   *  colours across 995 variants, and Printify refuses any product with more
   *  than 100 enabled variants. Enabling the whole catalogue fails outright
   *  with `8251 Too many variants enabled`.
   *
   *  Curating colours rather than variant ids keeps every size available in
   *  each colour, which is what the buyer actually needs. Names must match
   *  Printify's exactly. */
  colours: string[]
}

/** Printify rejects a product with more than this many enabled variants. */
export const MAX_ENABLED_VARIANTS = 100

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
      // Chosen from what blueprint 12 / provider 99 stocks, and all mapped in
      // tones.ts so every swatch renders. Roughly 8-9 sizes each, so this sits
      // just under the 100-variant ceiling; sellableVariants enforces it.
      colours: [
        "Black",
        "White",
        "Navy",
        "Red",
        "Maroon",
        "Forest",
        "Military Green",
        "Gold",
        "Orange",
        "Light Blue",
        "Ash",
      ],
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

/** The variants this garment actually puts on sale.
 *
 *  Two jobs. It restricts the catalogue to the curated colours, and it enforces
 *  Printify's 100-variant ceiling — exceeding it fails product creation with
 *  `8251 Too many variants enabled`, which `syncDesignProduct` swallows, so the
 *  symptom is silently missing products rather than an error anyone sees.
 *
 *  Colours are taken whole or not at all. Truncating mid-colour would leave a
 *  colour missing its larger sizes, which reads as stock the store simply
 *  doesn't carry. */
export function sellableVariants(garment: Garment, all: Variant[]): Variant[] {
  const sellable: Variant[] = []

  for (const colour of garment.colours) {
    const group = all.filter((variant) => variant.colour === colour)
    if (group.length === 0) continue
    if (sellable.length + group.length > MAX_ENABLED_VARIANTS) break
    sellable.push(...group)
  }

  return sellable
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
