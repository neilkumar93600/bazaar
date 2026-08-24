/** Run: `npx tsx lib/printify/mockups.test.ts`
 *
 *  ponytail: assert-based, no framework. This parses a URL shape owned by
 *  somebody else's CDN — the failure mode is a broken <img> on every product
 *  page, so the shape gets a check.
 */

import assert from "node:assert/strict"

import { colourMockups, mockupInColour } from "./mockups.ts"

const REAL =
  "https://images-api.printify.com/mockup/6a847effb8e5a6ff5d00bea6/18542/102044/untamed-worldwide-1-of-1.jpg?camera_label=front-2"

// Only the variant segment moves. Product, camera and slug are untouched —
// swapping the camera would photograph a back print from the front.
assert.equal(
  mockupInColour(REAL, 18179),
  "https://images-api.printify.com/mockup/6a847effb8e5a6ff5d00bea6/18179/102044/untamed-worldwide-1-of-1.jpg?camera_label=front-2"
)

// A back-print design keeps its camera.
const BACK = REAL.replace("front-2", "back-2").replace("102044", "102045")
assert.ok(mockupInColour(BACK, 18099)?.endsWith("camera_label=back-2"))
assert.ok(mockupInColour(BACK, 18099)?.includes("/102045/"))

// Anything that isn't the template is refused rather than guessed at.
assert.equal(mockupInColour("not a url", 1), null)
assert.equal(mockupInColour("https://example.com/a.jpg", 1), null)
// Right shape, wrong host: never rewrite a path on somebody else's domain.
assert.equal(
  mockupInColour("https://evil.example/mockup/a/b/c/d.jpg", 1),
  null
)
assert.equal(
  mockupInColour("https://images-api.printify.com/mockup/only/three/parts.jpg", 1),
  null
)

// The list form drops what it cannot re-point, so no two swatches ever show
// the same shirt.
assert.deepEqual(colourMockups(null, [{ colour: "Black", variantId: 1 }]), [])
assert.deepEqual(
  colourMockups("https://example.com/a.jpg", [{ colour: "Black", variantId: 1 }]),
  []
)
// The variant id is carried through: the gallery needs it to open on the
// maker's colour rather than on whatever the catalogue lists first.
assert.deepEqual(
  colourMockups(REAL, [
    { colour: "Black", variantId: 18099 },
    { colour: "Forest", variantId: 18179 },
  ]).map((m) => [m.colour, m.variantId]),
  [
    ["Black", 18099],
    ["Forest", 18179],
  ]
)

console.log("mockups.test.ts: all assertions passed")
