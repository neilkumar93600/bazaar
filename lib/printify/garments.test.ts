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
  sellableVariants,
  garments,
  MAX_ENABLED_VARIANTS,
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

// --- sellableVariants -----------------------------------------------------
//
// Regression: enabling the whole catalogue fails product creation outright with
// Printify's `8251 Too many variants enabled` — and syncDesignProduct swallows
// its errors, so the only symptom is designs silently having no product.

{
  const garment = {
    slug: "tee",
    label: "T-shirt",
    blueprintId: 1,
    printProviderId: 1,
    priceCents: 2900,
    colours: ["Black", "Navy"],
  }

  // Curated colours only, in the garment's order — White is not sold.
  assert.deepEqual(
    sellableVariants(garment, MATRIX).map((v) => v.id),
    [10, 11, 12, 30, 31],
  )

  // A colour the catalogue doesn't stock is skipped, not fatal.
  assert.deepEqual(
    sellableVariants({ ...garment, colours: ["Black", "Chartreuse"] }, MATRIX).map(
      (v) => v.id,
    ),
    [10, 11, 12],
  )
}

// The ceiling holds, and colours are taken whole or not at all — a truncated
// colour would appear in the picker missing its larger sizes.
{
  const wide: Variant[] = []
  const colours: string[] = []
  for (let c = 0; c < 40; c++) {
    colours.push(`C${c}`)
    for (let s = 0; s < 8; s++) wide.push({ id: c * 100 + s, colour: `C${c}`, size: `S${s}` })
  }

  const garment = {
    slug: "tee",
    label: "T-shirt",
    blueprintId: 1,
    printProviderId: 1,
    priceCents: 2900,
    colours,
  }

  const sellable = sellableVariants(garment, wide)
  assert.ok(
    sellable.length <= MAX_ENABLED_VARIANTS,
    `${sellable.length} exceeds Printify's ceiling of ${MAX_ENABLED_VARIANTS}`,
  )
  // Whole colours only: 8 per colour divides exactly.
  assert.equal(sellable.length % 8, 0, "a colour must never be half-included")
}

// The configured garments must themselves fit, or nothing can ever be minted.
for (const garment of garments()) {
  assert.ok(
    garment.colours.length > 0,
    `${garment.slug}: needs at least one sellable colour`,
  )
}

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
