# Garment Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A maker chooses garment, colour and print placement before listing; the Printify product is minted with the right print areas and the bazaar shows a photo of the colour they picked.

**Architecture:** Garments become configured data (blueprint + provider pairs) with colours and sizes parsed live from Printify's variant catalogue. Print areas become placement-driven. The maker's config is written to the design row *before* `syncDesignProduct` runs, so that function keeps reading everything it needs off the row and its three call sites never change.

**Tech Stack:** Next.js 16, React 19, Supabase, TypeScript, Printify REST (`/v1/catalog`, `/v1/uploads`, `/v1/shops/{id}/products`).

**Spec:** [docs/superpowers/specs/2026-08-09-garment-config-design.md](../specs/2026-08-09-garment-config-design.md)

## Global Constraints

- **The maker picks a colour, never a size.** Size is the buyer's choice, in sub-project E.
- **Sizes are always derived per colour**, never from a global list — not every colour carries every size.
- **`both` means a small chest mark and a full back print**, in that direction. Reversing it is the plausible-looking failure.
- **Exactly one garment price exists**: `Garment.priceCents`. It replaces `FALLBACK_GARMENT_PRICE_CENTS`.
- Config is frozen once `printify_product_id` is set.
- Tests: `npx tsx <path>.test.ts`, `node:assert/strict`, no framework.
- Every commit passes `npx next typegen && npm run typecheck && npm run lint`.
- Migrations via `supabase migration new`, applied with MCP `apply_migration`. Never `supabase db push`.
- Branch: `spec/design-ownership-listing` (A and B continue on it).

## Planning-time finding

`syncDesignProduct` already re-reads the design row before minting. So the config reaches it through the row, not through a parameter: `listDesign` writes `garment_slug`, `featured_variant_id` and `placement` in the same `update` that sets `listed_at`, then calls sync as it already does. **Its signature does not change, and neither do its three call sites** (`listDesign`, `claimDesign`'s backfill, `scripts/generate-designs.ts`). The spec's "Downstream" section anticipated a signature change; it isn't needed.

---

### Task 1: Garment catalogue, variant parsing, colour tones

**Files:**
- Create: `lib/printify/garments.ts`
- Create: `lib/printify/tones.ts`
- Test: `lib/printify/garments.test.ts`

**Interfaces:**
- Consumes: `printifyConfig` from `lib/printify/client.ts`.
- Produces, from `garments.ts`: `Garment`, `garments()`, `findGarment(slug)`, `defaultGarment()`, `Variant`, `parseVariant`, `coloursFrom(variants)`, `sizesForColour(variants, colour)`.
- Produces, from `tones.ts`: `GarmentTone`, `toneForColourName(name)`.

**Why two modules.** `ListingForm` is a client component and needs
`toneForColourName` to paint its swatches. `garments.ts` calls `printifyConfig()`,
which reads `PRINTIFY_API_TOKEN` — importing it from the browser drags server env
access into the client bundle. `tones.ts` is pure colour maths with no imports at
all, so the client can have it and nothing else.

**`sizesForColour` is not used in D** — the maker picks a colour, not a size. It
is built and tested here because it is the same parse as `coloursFrom`, and
sub-project E would otherwise write the variant-matrix logic a second time.
Do not delete it as dead code.

- [ ] **Step 1: Write the failing test**

Create `lib/printify/garments.test.ts`:

```ts
/** Run: `npx tsx lib/printify/garments.test.ts`
 *
 *  ponytail: assert-based, no framework. The load-bearing rule is that sizes
 *  are derived per colour. Printify fuses colour and size into one variant, and
 *  offering a size that colour doesn't stock produces an order Printify will
 *  reject after the buyer has paid.
 */

import assert from "node:assert/strict"

import {
  parseVariant,
  coloursFrom,
  sizesForColour,
  type Variant,
} from "./garments.ts"
import { toneForColourName } from "./tones.ts"

// --- parseVariant ---------------------------------------------------------

assert.deepEqual(parseVariant({ id: 1, title: "Black / M" }), {
  id: 1,
  colour: "Black",
  size: "M",
})

// Padding and doubled spaces are Printify's, not ours.
assert.deepEqual(parseVariant({ id: 2, title: "  Sport Grey  /  2XL " }), {
  id: 2,
  colour: "Sport Grey",
  size: "2XL",
})

// Some blueprints have no size axis at all.
assert.deepEqual(parseVariant({ id: 3, title: "Natural" }), {
  id: 3,
  colour: "Natural",
  size: "One size",
})

// --- colours and sizes ----------------------------------------------------

// Deliberately ragged: White stocks only S. This is the whole point.
const MATRIX: Variant[] = [
  { id: 10, colour: "Black", size: "S" },
  { id: 11, colour: "Black", size: "M" },
  { id: 12, colour: "Black", size: "L" },
  { id: 20, colour: "White", size: "S" },
  { id: 30, colour: "Navy", size: "M" },
  { id: 31, colour: "Navy", size: "L" },
]

// Catalogue order, de-duplicated, with a representative variant id per colour —
// the maker picks a colour, so the id is a stand-in for one.
assert.deepEqual(coloursFrom(MATRIX), [
  { colour: "Black", variantId: 10 },
  { colour: "White", variantId: 20 },
  { colour: "Navy", variantId: 30 },
])

assert.deepEqual(sizesForColour(MATRIX, "Black"), [
  { size: "S", variantId: 10 },
  { size: "M", variantId: 11 },
  { size: "L", variantId: 12 },
])

// The rule: White's sizes are White's, not the union of every colour's.
assert.deepEqual(sizesForColour(MATRIX, "White"), [{ size: "S", variantId: 20 }])
assert.deepEqual(sizesForColour(MATRIX, "Nope"), [])

// --- tones ----------------------------------------------------------------

{
  const black = toneForColourName("Black")
  assert.ok(black, "a known colour must resolve")
  // Every channel is a usable hex — the SVG has no fallback for a bad one.
  for (const channel of [black!.body, black!.shade, black!.deep, black!.seam]) {
    assert.match(channel, /^#[0-9a-f]{6}$/i, `bad channel ${channel}`)
  }
  // A dark garment's seam lightens; darkening it further would vanish.
  assert.notEqual(black!.seam, black!.body)
}

// Case and spacing are Printify's problem, not the caller's.
assert.ok(toneForColourName("sport grey"))
assert.ok(toneForColourName("  Navy  "))

// Unknown colours fall back to the caller's hash rather than throwing or
// rendering a hole.
assert.equal(toneForColourName("Chartreuse Surprise"), null)

console.log("garments.test.ts: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx tsx lib/printify/garments.test.ts
```

Expected: FAIL — `Cannot find module './garments.ts'`.

- [ ] **Step 3: Write the module**

Create `lib/printify/garments.ts`. Note the `.ts` extension on the relative import — `scripts/` runs these files through plain node, which resolves neither extensionless paths nor the `@/` alias.

```ts
import { printifyConfig } from "./client.ts"

/** A garment the store sells. Blueprint and provider are Printify's ids for
 *  "which product" and "who makes it"; the pair together determines the whole
 *  variant matrix.
 *
 *  Data, not code branches: adding a hoodie is appending an entry. Printify has
 *  no "which blueprints does my shop support" endpoint — a shop holds products,
 *  and the blueprint catalogue is global — so the configured list is the
 *  store's range. */
export type Garment = {
  slug: string
  label: string
  blueprintId: number
  printProviderId: number
  /** Retail price in cents — what a buyer pays for the garment. Printify bills
   *  cost separately; the margin is the difference.
   *
   *  This is the ONLY garment price in the system. It replaces
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
 *  the buyer has already paid. */
export function sizesForColour(variants: Variant[], colour: string): SizeOption[] {
  return variants
    .filter((variant) => variant.colour === colour)
    .map((variant) => ({ size: variant.size, variantId: variant.id }))
}

```

Then create `lib/printify/tones.ts` — **no imports**, so a client component can
use it without pulling `printifyConfig` and its env reads into the browser
bundle:

```ts
/** Drawn-preview colours, derived from Printify's colour names.
 *
 *  Deliberately import-free: `ListingForm` is a client component and needs
 *  these to paint its swatches, while `garments.ts` next door reads
 *  PRINTIFY_API_TOKEN. Keeping the colour maths separate is what stops that
 *  token's module graph reaching the browser. */

export type GarmentTone = {
  id: string
  body: string
  shade: string
  deep: string
  seam: string
}

/** Printify colour names to a base hex. Approximate on purpose — this drives
 *  the drawn preview only, and the real product photo replaces it once the
 *  product is minted. Anything missing falls back to the hashed tone. */
const COLOUR_HEX: Record<string, string> = {
  black: "#101014",
  white: "#f4f3ef",
  navy: "#1f2a44",
  "sport grey": "#b3b3ae",
  "heather grey": "#a8a9ad",
  "dark heather": "#4a4a4d",
  "dark grey heather": "#3f3f43",
  charcoal: "#36363a",
  ash: "#d6d5d0",
  maroon: "#5c1f2a",
  red: "#b3242c",
  royal: "#1f3f8f",
  "royal blue": "#1f3f8f",
  "light blue": "#a9c6e0",
  forest: "#1e3a2b",
  "forest green": "#1e3a2b",
  "irish green": "#14803c",
  "military green": "#4a4a35",
  sand: "#d8c9a8",
  natural: "#e6dfcf",
  gold: "#d9a520",
  orange: "#d4632a",
  purple: "#4b2a63",
  "light pink": "#e8c2cf",
}

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function mix(hex: string, toward: string, amount: number): string {
  const from = channels(hex)
  const to = channels(toward)
  const blended = from.map((value, index) =>
    Math.round(value + (to[index] - value) * amount),
  )
  return `#${blended.map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Four channels derived from one hex rather than hand-authored per colour.
 *
 *  Shade and deep always darken. The seam darkens on a light garment and
 *  *lightens* on a dark one — darkening charcoal further just makes it vanish,
 *  which is exactly what the hand-tuned charcoal tone in ShirtMockup does. */
function toneFromHex(id: string, hex: string): GarmentTone {
  const dark = luminance(hex) < 0.3
  return {
    id,
    body: hex,
    shade: mix(hex, "#000000", 0.18),
    deep: mix(hex, "#000000", 0.34),
    seam: dark ? mix(hex, "#ffffff", 0.14) : mix(hex, "#000000", 0.12),
  }
}

/** Null for an unknown colour — the caller falls back to the hashed tone rather
 *  than rendering a hole. */
export function toneForColourName(name: string): GarmentTone | null {
  const key = name.trim().replace(/\s+/g, " ").toLowerCase()
  const hex = COLOUR_HEX[key]
  if (!hex) return null
  return toneFromHex(key.replace(/\s+/g, "-"), hex)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx tsx lib/printify/garments.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify and commit**

```bash
npx next typegen && npm run typecheck && npm run lint
git add lib/printify/garments.ts lib/printify/tones.ts lib/printify/garments.test.ts
git commit -m "feat: garment catalogue, variant parsing and preview tones"
```

---

### Task 2: Placement-driven print areas

`printAreas` is a private function inside `products.ts` today, so it cannot be tested. It moves to its own module.

**Files:**
- Create: `lib/printify/print-areas.ts`
- Test: `lib/printify/print-areas.test.ts`
- Modify: `lib/printify/products.ts:69-84` (delete the local `printAreas`)

**Interfaces:**
- Consumes: nothing.
- Produces: `type Placement = "front" | "back" | "both"`, `printAreas(imageId: string, variantIds: number[], placement: Placement)`.

- [ ] **Step 1: Write the failing test**

Create `lib/printify/print-areas.test.ts`:

```ts
/** Run: `npx tsx lib/printify/print-areas.test.ts`
 *
 *  ponytail: assert-based, no framework. One rule is worth pinning — on `both`,
 *  the SMALL mark goes on the front and the FULL art on the back. Reversed, it
 *  prints a giant chest logo and a postage-stamp back, and it looks entirely
 *  plausible in the diff.
 */

import assert from "node:assert/strict"

import { printAreas, FRONT_MARK_SCALE } from "./print-areas.ts"

const IMAGE = "img_123"
const VARIANTS = [1, 2, 3]

function placeholders(placement: "front" | "back" | "both") {
  const areas = printAreas(IMAGE, VARIANTS, placement)
  assert.equal(areas.length, 1, "one area, covering every variant")
  assert.deepEqual(areas[0].variant_ids, VARIANTS)
  return areas[0].placeholders
}

// Front only: full art, no back placeholder at all.
{
  const front = placeholders("front")
  assert.equal(front.length, 1)
  assert.equal(front[0].position, "front")
  assert.equal(front[0].images[0].scale, 1)
  assert.equal(front[0].images[0].id, IMAGE)
}

// Back only: full art on the back, and nothing on the front.
{
  const back = placeholders("back")
  assert.equal(back.length, 1)
  assert.equal(back[0].position, "back")
  assert.equal(back[0].images[0].scale, 1)
}

// Both: small mark front, full art back. Asserted in that direction.
{
  const both = placeholders("both")
  assert.equal(both.length, 2)

  const front = both.find((p) => p.position === "front")!
  const back = both.find((p) => p.position === "back")!

  assert.ok(front, "both must place something on the front")
  assert.ok(back, "both must place something on the back")

  assert.equal(front.images[0].scale, FRONT_MARK_SCALE)
  assert.equal(back.images[0].scale, 1)
  assert.ok(
    front.images[0].scale < back.images[0].scale,
    "the front mark must be SMALLER than the back print",
  )
  // Sits high on the chest, not centred on the belly.
  assert.ok(front.images[0].y < 0.5)
}

console.log("print-areas.test.ts: all assertions passed")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx tsx lib/printify/print-areas.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the module**

Create `lib/printify/print-areas.ts`:

```ts
/** Where the artwork lands on the garment.
 *
 *  x/y are fractions of the print area and `scale` is a fraction of its width,
 *  so scale 1 fills the area edge to edge. */

export type Placement = "front" | "back" | "both"

export const PLACEMENTS: Placement[] = ["front", "back", "both"]

/** The chest mark on a two-sided print.
 *
 *  Centred-high rather than left-chest: the generator produces 3:4 portrait
 *  illustrations, and shrinking one into a left-chest corner loses every bit of
 *  its detail and reads as a mistake. At 32%, centred just below the collar, it
 *  reads as intentional. */
export const FRONT_MARK_SCALE = 0.32
const FRONT_MARK_Y = 0.28

type Image = { id: string; x: number; y: number; scale: number; angle: number }
type Placeholder = { position: string; images: Image[] }

const full = (id: string): Image => ({ id, x: 0.5, y: 0.5, scale: 1, angle: 0 })

const mark = (id: string): Image => ({
  id,
  x: 0.5,
  y: FRONT_MARK_Y,
  scale: FRONT_MARK_SCALE,
  angle: 0,
})

export function printAreas(
  imageId: string,
  variantIds: number[],
  placement: Placement,
): { variant_ids: number[]; placeholders: Placeholder[] }[] {
  const placeholders: Placeholder[] =
    placement === "front"
      ? [{ position: "front", images: [full(imageId)] }]
      : placement === "back"
        ? [{ position: "back", images: [full(imageId)] }]
        : [
            // Small mark front, full art back — the classic two-sided layout.
            { position: "front", images: [mark(imageId)] },
            { position: "back", images: [full(imageId)] },
          ]

  return [{ variant_ids: variantIds, placeholders }]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx tsx lib/printify/print-areas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx next typegen && npm run typecheck && npm run lint
git add lib/printify/print-areas.ts lib/printify/print-areas.test.ts
git commit -m "feat: placement-driven print areas"
```

---

### Task 3: Migration

**Files:**
- Create: `supabase/migrations/<generated>_design_garment_config.sql`

- [ ] **Step 1: Create the file**

```bash
npx supabase migration new design_garment_config
```

- [ ] **Step 2: Write it**

```sql
-- What the maker chose to print this design on.
--
-- All nullable and not backfilled: designs minted before this have a Printify
-- product and a default mockup already, and the drawn mockup covers anything
-- that doesn't. A null garment means "the configured default", which is what
-- the claim-path backfill has always used.
alter table public.designs
  add column garment_slug        text,
  add column featured_variant_id integer,
  add column placement           text check (placement in ('front', 'back', 'both'));

comment on column public.designs.garment_slug is
  'Which configured Garment the Printify product was minted on. Null = the default.';
comment on column public.designs.featured_variant_id is
  'A representative variant of the colour the maker picked, used to select the hero mockup. Not what anyone buys — the buyer picks their own variant.';
comment on column public.designs.placement is
  'front | back | both. `both` is a small chest mark plus a full back print.';
```

- [ ] **Step 3: Apply and verify**

Apply with MCP `apply_migration`, name `design_garment_config`. Then:

```sql
select column_name, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'designs'
  and column_name in ('garment_slug', 'featured_variant_id', 'placement');
```

Expected: three rows, all `YES`.

Then MCP `get_advisors` with `type: "security"` — expect only the three known findings.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): garment, colour and placement on designs"
```

---

### Task 4: Mint the product from the config

**Files:**
- Modify: `lib/printify/client.ts:36-61` (drop `variantIds` from the config)
- Modify: `lib/printify/products.ts` (garment-driven catalogue, placement, featured mockup)
- Modify: `lib/printify/sync.ts` (read the config off the row; drop the fallback price)
- Modify: `.env.example:26` (remove `PRINTIFY_VARIANT_IDS`)

**Interfaces:**
- Consumes: `Garment`, `findGarment`, `defaultGarment`, `parseVariant` (Task 1); `printAreas`, `Placement` (Task 2); the three new columns (Task 3).
- Produces: `createDesignProduct({ designId, garment, title, description, imageUrl, placement, featuredVariantId })`; `catalogVariants(garment)` exported for the form to read colours.

- [ ] **Step 1: Drop the pinned variant list**

In `lib/printify/client.ts`, remove `variantIds` from `PrintifyConfig` and from `printifyConfig()`. The buyer picks the colour now, so an env var pinning a subset is actively wrong — a product must carry every variant the provider offers.

Remove the `PRINTIFY_VARIANT_IDS` line and its comment from `.env.example`.

- [ ] **Step 2: Rework the catalogue cache**

In `lib/printify/products.ts`, the cache is a single module-level promise keyed to nothing. There is more than one blueprint/provider pair now, so it becomes a Map:

```ts
import { parseVariant, type Garment, type Variant } from "./garments.ts"

/** One process-lifetime fetch per garment. Cached as the promise rather than
 *  the result, so concurrent listings share one request. Keyed by
 *  blueprint/provider because there is more than one garment now. */
const variantCache = new Map<string, Promise<Variant[]>>()

export function catalogVariants(garment: Garment): Promise<Variant[]> {
  const key = `${garment.blueprintId}/${garment.printProviderId}`
  const cached = variantCache.get(key)
  if (cached) return cached

  const config = printifyConfig()
  if (!config) return Promise.resolve([])

  const request = printifyFetch<{ variants: { id: number; title: string }[] }>(
    config,
    `/v1/catalog/blueprints/${garment.blueprintId}/print_providers/${garment.printProviderId}/variants.json`,
  )
    .then((data) => (data.variants ?? []).map(parseVariant))
    .catch((error) => {
      // A failed lookup must not poison the cache for the life of the process.
      variantCache.delete(key)
      throw error
    })

  variantCache.set(key, request)
  return request
}
```

Delete `resolveVariantIds` — every variant is now enabled, so it is
`(await catalogVariants(garment)).map((v) => v.id)` at the one call site.

- [ ] **Step 3: Pick the featured mockup**

Replace `pickMockup`. Keep the existing comment explaining why `position` is not the discriminator — it is still true — and add the featured-variant preference in front of it:

```ts
function pickMockup(product: Product, featuredVariantId: number | null): string | null {
  const images = product.images ?? []
  const forVariant = featuredVariantId
    ? images.filter((image) => image.variant_ids.includes(featuredVariantId))
    : []

  const chosen =
    // The maker's colour, from the front, is the whole point of the setting.
    forVariant.find((image) => image.src.includes("camera_label=front")) ??
    forVariant.find((image) => image.is_default) ??
    forVariant[0] ??
    // Then the old chain, for designs with no featured variant.
    images.find((image) => image.is_default) ??
    images.find((image) => image.src.includes("camera_label=front")) ??
    images.find((image) => image.position === "front") ??
    images[0] ??
    null

  return chosen?.src ?? null
}
```

- [ ] **Step 4: Rework `createDesignProduct`**

Its parameters become an object carrying the garment and the config. `priceCents` comes from `garment.priceCents`, never from the design:

```ts
export async function createDesignProduct({
  designId,
  garment,
  title,
  description,
  imageUrl,
  placement,
  featuredVariantId,
}: {
  designId: string
  garment: Garment
  title: string
  description: string
  /** Must be publicly reachable: Printify fetches it server-side. */
  imageUrl: string
  placement: Placement
  featuredVariantId: number | null
}): Promise<PrintifySyncResult | null> {
  const config = printifyConfig()
  if (!config) return null

  const [imageId, variants] = await Promise.all([
    uploadImage(config, `${designId}.png`, imageUrl),
    catalogVariants(garment),
  ])

  const variantIds = variants.map((variant) => variant.id)

  if (variantIds.length === 0) {
    throw new Error(
      `Printify blueprint ${garment.blueprintId} / provider ${garment.printProviderId} returned no variants`,
    )
  }

  const created = await printifyFetch<Product>(
    config,
    `/v1/shops/${config.shopId}/products.json`,
    {
      method: "POST",
      body: {
        title,
        description,
        blueprint_id: garment.blueprintId,
        print_provider_id: garment.printProviderId,
        variants: variantIds.map((id) => ({
          id,
          price: garment.priceCents,
          is_enabled: true,
        })),
        print_areas: printAreas(imageId, variantIds, placement),
      },
    },
  )

  let mockupUrl = pickMockup(created, featuredVariantId)

  for (let attempt = 0; attempt < MOCKUP_POLL_ATTEMPTS && !mockupUrl; attempt++) {
    await sleep(MOCKUP_POLL_DELAY_MS)
    const product = await printifyFetch<Product>(
      config,
      `/v1/shops/${config.shopId}/products/${created.id}.json`,
    )
    mockupUrl = pickMockup(product, featuredVariantId)
  }

  return { productId: created.id, mockupUrl }
}
```

`fetchProductMockup` gains the same `featuredVariantId` parameter and passes it through.

- [ ] **Step 5: Read the config off the row in `sync.ts`**

Delete `FALLBACK_GARMENT_PRICE_CENTS` — `garment.priceCents` is now the single garment price. Extend the select and resolve the garment:

```ts
  const { data: design } = await admin
    .from("designs")
    .select(
      "id, image_url, print_ready_front_url, printify_product_id, vibe_id, garment_slug, featured_variant_id, placement",
    )
    .eq("id", designId)
    .maybeSingle()

  if (!design) return
  // Already minted. This is why the config is frozen: re-minting would orphan
  // the existing product in the Printify shop.
  if (design.printify_product_id) return

  // Null config is the backfill path — designs from before garment choice
  // existed, and the claim-path retry. The default garment, front print.
  const garment = design.garment_slug
    ? findGarment(design.garment_slug)
    : defaultGarment()

  if (!garment) return
```

then pass `garment`, `placement: design.placement ?? "front"`, and
`featuredVariantId: design.featured_variant_id ?? null` into
`createDesignProduct`. **No signature change to `syncDesignProduct` itself**, so
its three call sites are untouched.

- [ ] **Step 6: Verify**

```bash
npx tsx lib/printify/garments.test.ts && npx tsx lib/printify/print-areas.test.ts
npx next typegen && npm run typecheck && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add lib/printify/ .env.example
git commit -m "feat: mint Printify products from the design's garment config"
```

---

### Task 5: Preview the chosen colour

**Files:**
- Modify: `components/shared/ShirtMockup.tsx:28-30, 99`

**Interfaces:**
- Consumes: `GarmentTone` from `lib/printify/tones.ts` (Task 1) — the import-free
  module, because `ShirtMockup` renders on the client too.
- Produces: `ShirtMockup` accepts an optional `tone`.

- [ ] **Step 1: Accept an explicit tone**

`garmentToneFor(imageUrl)` stays as the default — the feed and `/shop` still want a stable per-design tone with no config. Add an optional override:

```tsx
export function ShirtMockup({
  imageUrl,
  priority,
  tone: toneOverride,
}: {
  imageUrl: string
  priority?: boolean
  /** The garment colour the maker picked, for the config preview. Omitted
   *  everywhere else: a feed card has no configured colour, and hashing keeps a
   *  wall of mockups from reading as one shirt photocopied fifty times. */
  tone?: GarmentTone
}) {
  const tone = toneOverride ?? garmentToneFor(imageUrl)
```

Everything below is unchanged — `tone.id` already keys the gradient definitions.

One consequence to note in the comment above `GARMENT_TONES`: that comment
promises "at most three distinct definitions on the page". With an override the
preview adds one more id. Still true for the feed, which is what the comment was
protecting; say so rather than leaving it subtly wrong.

- [ ] **Step 2: Verify and commit**

```bash
npx next typegen && npm run typecheck && npm run lint
git add components/shared/ShirtMockup.tsx
git commit -m "feat: ShirtMockup accepts an explicit garment tone"
```

---

### Task 6: The garment section on the listing form

**Files:**
- Create: `app/dashboard/designs/garment-options.ts` (server-only loader)
- Modify: `components/dashboard/ListingForm.tsx`
- Modify: `app/dashboard/designs/actions.ts` (`listDesign` takes the config)
- Modify: `app/dashboard/designs/page.tsx` and `components/create/CreateForm.tsx` (pass options through)

**Interfaces:**
- Consumes: everything above.
- Produces: `listDesign(designId, config, free, dollars)` where `config` is `{ garmentSlug: string; variantId: number; placement: Placement } | null`.

- [ ] **Step 1: Load the options server-side**

Printify's catalogue must not be fetched from the browser — it needs the API token. Create `app/dashboard/designs/garment-options.ts`:

```ts
import "server-only"

import { garments, coloursFrom, type ColourOption } from "@/lib/printify/garments"
import { catalogVariants } from "@/lib/printify/products"

export type GarmentOption = {
  slug: string
  label: string
  colours: ColourOption[]
}

/** Empty when Printify isn't configured — every surface already treats that as
 *  "no product", and the form hides its garment section rather than offering
 *  choices that cannot be minted. */
export async function getGarmentOptions(): Promise<GarmentOption[]> {
  return Promise.all(
    garments().map(async (garment) => ({
      slug: garment.slug,
      label: garment.label,
      colours: coloursFrom(await catalogVariants(garment)),
    })),
  )
}
```

- [ ] **Step 2: Take the config in `listDesign`**

```ts
export async function listDesign(
  designId: string,
  config: { garmentSlug: string; variantId: number; placement: Placement } | null,
  free: boolean,
  dollars: string,
): Promise<ListingState> {
  const price = validateListingPrice(free, dollars)
  if (!price.ok) return { error: price.error }

  const supabase = await createClient()

  // Validated against the live catalogue, never trusted: a variant id that
  // doesn't belong to the named garment would mint a product Printify rejects.
  const update: Record<string, unknown> = {
    listed_at: new Date().toISOString(),
    price_cents: price.priceCents,
  }

  if (config) {
    const garment = findGarment(config.garmentSlug)
    if (!garment) return { error: "Pick a garment." }

    const variants = await catalogVariants(garment)
    if (!variants.some((variant) => variant.id === config.variantId)) {
      return { error: "Pick a colour." }
    }
    if (!PLACEMENTS.includes(config.placement)) {
      return { error: "Pick where the print goes." }
    }

    update.garment_slug = garment.slug
    update.featured_variant_id = config.variantId
    update.placement = config.placement
  }

  const { data, error } = await supabase
    .from("designs")
    .update(update)
    .eq("id", designId)
    .select("id")
  // …unchanged from here: zero rows means RLS refused, then after(sync).
}
```

The config is written **in the same update** that sets `listed_at`, before
`syncDesignProduct` runs in `after()`. That is why sync needs no new parameter.

A design that already has a `printify_product_id` ignores the config rather than
orphaning a product: the form renders those fields read-only, and passing `null`
is the honest representation of "nothing to change".

- [ ] **Step 3: Add the garment section to `ListingForm`**

The prop type, pinned so Task 6's two call sites agree with it:

```tsx
export function ListingForm({
  designId,
  imageUrl,
  isListed,
  priceCents,
  garmentOptions,
  frozen,
  initialConfig,
}: {
  designId: string
  /** The artwork, for the live preview. ListingForm had no image prop before. */
  imageUrl: string
  isListed: boolean
  priceCents: number | null
  /** Empty when Printify isn't configured — the garment section is then hidden
   *  rather than offering choices that cannot be minted. */
  garmentOptions: GarmentOption[]
  /** True once a Printify product exists. Re-minting would orphan it, so the
   *  garment section renders read-only and the action is sent a null config. */
  frozen: boolean
  initialConfig: {
    garmentSlug: string | null
    variantId: number | null
    placement: Placement | null
  }
})
```

Above the existing free/price controls, when `garmentOptions.length > 0`:

- **Garment** — chip row, one per option. Hidden entirely when there is only one
  garment *and* it is the only choice; showing a one-item picker is noise.
- **Colour** — swatch buttons from `colours`, each a `<button>` with the colour
  name as its `aria-label` and a background from `toneForColourName(colour)?.body`
  (falling back to a neutral border-only chip for unmapped names). Selecting one
  sets `variantId`.
- **Print** — chip row over `PLACEMENTS`, labelled Front / Back / Front & back.

Live preview beside the controls: `<ShirtMockup imageUrl={imageUrl} tone={toneForColourName(colour) ?? undefined} />`. `ListingForm` therefore needs the design's `imageUrl` as a prop — it does not have one today.

When `frozen`, render the three values as text with a line explaining that the
garment is fixed once the product is made, and submit `null` for the config.

- [ ] **Step 4: Thread the options through both surfaces**

`app/dashboard/designs/page.tsx` — `await getGarmentOptions()` once, pass to every `ListingForm`, with `frozen` per design. `getMyDesigns` must therefore also return `printifyProductId` (or a `hasProduct` boolean) and `imageUrl` is already there.

`components/create/CreateForm.tsx` — its `ListingForm` needs the same props. The page is a server component, so `getGarmentOptions()` is awaited in `app/(public)/create/page.tsx` and passed down as a prop. A freshly generated design never has a product, so `frozen` is always `false` there, and `imageUrl` is the picked design's.

- [ ] **Step 5: Verify**

```bash
npx tsx lib/printify/garments.test.ts && npx tsx lib/printify/print-areas.test.ts
npx tsx lib/listing.test.ts && npx tsx lib/generation/styles.test.ts && npx tsx lib/generation/prompt.test.ts
npx next typegen && npm run typecheck && npm run lint
```

- [ ] **Step 6: Manual check against the live Printify shop**

This is the part no test reaches. `npm run dev`, sign in:

1. Generate (or use an existing unlisted design). The garment section shows a
   garment, real Printify colours, and three placements.
2. Pick a dark colour. The drawn preview recolours immediately.
3. List it with `placement: "both"`. Wait for the mockup.
4. **Check the Printify dashboard**: the product has a *small* chest mark and a
   *full* back print. If they are swapped, `printAreas` is inverted.
5. **Check the bazaar card**: `mockup_url` shows the colour you picked, not
   Printify's default.
6. Re-open the listing form for that design: the garment section is read-only.

Record what actually happened, including anything that failed.

- [ ] **Step 7: Commit**

```bash
git add app components
git commit -m "feat: choose garment, colour and placement before listing"
```

---

## Post-implementation

- [ ] `docs/DATA_MODEL.md` — `designs` gains `garment_slug`, `featured_variant_id`, `placement`.
- [ ] `docs/PROGRESS.md` — garment config note, and that `PRINTIFY_VARIANT_IDS` is gone.
- [ ] `.env.example` — confirm `PRINTIFY_VARIANT_IDS` is removed and nothing else references it (`grep -rn PRINTIFY_VARIANT_IDS`).

## Deferred, recorded so they aren't rediscovered

- **No product deletion.** Config is frozen after minting precisely because changing it would orphan a Printify product. Deletion (`DELETE /v1/shops/{id}/products/{pid}.json`) plus a re-mint flow is its own pass.
- **One retail price per garment**, in config, identical for every design.
- **Printify can renumber variants.** Cached per process, refetched on restart; nothing detects a mid-flight change.
- **Non-tee print areas have different aspect ratios** — 3:4 artwork will letterbox on a tote. Only bites when a second garment is configured.
- **The drawn preview is always a tee outline**, even if the garment is a hoodie, and its colour is approximate.
- **Dropping `PRINTIFY_VARIANT_IDS` widens every product to the provider's full variant list** — more variants, more mockup renders, slower minting.
