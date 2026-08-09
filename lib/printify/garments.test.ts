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
