/** Run: `npx tsx lib/orders/eligibility.test.ts` */

import assert from "node:assert/strict"

import { orderEligibility } from "./eligibility.ts"

const CATALOGUE = [101, 102, 103]
const CLAIMED = {
  claimedBy: "11111111-1111-1111-1111-111111111111",
  printifyProductId: "prod_1",
}

assert.deepEqual(orderEligibility(CLAIMED, 101, CATALOGUE), { ok: true })

// Claiming is what the bazaar sells; an unclaimed design is not wearable.
assert.equal(
  orderEligibility({ ...CLAIMED, claimedBy: null }, 101, CATALOGUE).ok,
  false,
)

// No product means nothing to order against.
assert.equal(
  orderEligibility({ ...CLAIMED, printifyProductId: null }, 101, CATALOGUE).ok,
  false,
)

// A variant outside this design's garment: Printify accepts the order and
// rejects it later, after the buyer thinks they have paid.
assert.equal(orderEligibility(CLAIMED, 999, CATALOGUE).ok, false)
assert.equal(orderEligibility(CLAIMED, 101, []).ok, false)

console.log("eligibility.test.ts: all assertions passed")
