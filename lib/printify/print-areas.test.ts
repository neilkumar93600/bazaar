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
