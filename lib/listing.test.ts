/** Run: `npx tsx lib/listing.test.ts`
 *
 *  ponytail: assert-based, no framework. Two rules are worth guarding — the
 *  one that decides whether a design may go live, and the one that decides
 *  whether a claim may proceed. Both are money paths, and both are mirrored
 *  in SQL (claim_design), so a silent drift here is a silent drift there.
 */

import assert from "node:assert/strict"

import {
  claimEligibility,
  validateListingPrice,
  MAX_PRICE_CENTS,
  type ClaimRow,
} from "./listing"

// --- validateListingPrice -------------------------------------------------

// Free is a decision, not an empty field: the price box is ignored entirely.
assert.deepEqual(validateListingPrice(true, ""), { ok: true, priceCents: null })
assert.deepEqual(validateListingPrice(true, "29"), { ok: true, priceCents: null })

assert.deepEqual(validateListingPrice(false, "29"), { ok: true, priceCents: 2900 })
assert.deepEqual(validateListingPrice(false, "24.50"), { ok: true, priceCents: 2450 })
assert.deepEqual(validateListingPrice(false, " 24.5 "), { ok: true, priceCents: 2450 })
assert.deepEqual(validateListingPrice(false, "0.01"), { ok: true, priceCents: 1 })

// Zero is not free. A maker who wants free ticks the box; typing 0 is far more
// likely to be a half-finished thought than an intent to give it away.
assert.equal(validateListingPrice(false, "0").ok, false)
assert.equal(validateListingPrice(false, "0.00").ok, false)
assert.equal(validateListingPrice(false, "").ok, false)
assert.equal(validateListingPrice(false, "-5").ok, false)
// parseFloat("12abc") is 12 — the regex is what stops that reaching the DB.
assert.equal(validateListingPrice(false, "12abc").ok, false)
assert.equal(validateListingPrice(false, "abc").ok, false)
// Sub-cent precision has nowhere to go in an integer-cents column.
assert.equal(validateListingPrice(false, "12.555").ok, false)
assert.equal(validateListingPrice(false, String(MAX_PRICE_CENTS / 100 + 1)).ok, false)

// --- claimEligibility -----------------------------------------------------

const BUYER = "11111111-1111-1111-1111-111111111111"
const MAKER = "22222222-2222-2222-2222-222222222222"

const listed: ClaimRow = {
  listedAt: "2026-08-09T00:00:00Z",
  priceCents: 2900,
  claimedBy: null,
  creatorId: MAKER,
  moderationStatus: "approved",
}

assert.deepEqual(claimEligibility(listed, BUYER, 2900), { ok: true })

// Free listings claim at null, and null must compare equal to null.
assert.deepEqual(
  claimEligibility({ ...listed, priceCents: null }, BUYER, null),
  { ok: true },
)

// The listing gate. Without it a private design is claimable by anyone who
// learns its id, straight past the read policy.
assert.equal(claimEligibility({ ...listed, listedAt: null }, BUYER, 2900).ok, false)

assert.equal(
  claimEligibility({ ...listed, moderationStatus: "pending" }, BUYER, 2900).ok,
  false,
)
assert.equal(
  claimEligibility({ ...listed, claimedBy: BUYER }, BUYER, 2900).ok,
  false,
)
// A maker keeping a design means not listing it. Claiming their own listing
// would only charge them, and blocking it forecloses self-dealing once
// royalties are real money.
assert.equal(claimEligibility(listed, MAKER, 2900).ok, false)

// Price drift: the buyer saw one number, the row now holds another.
assert.equal(claimEligibility(listed, BUYER, 1900).ok, false)
assert.equal(claimEligibility(listed, BUYER, null).ok, false)
assert.equal(
  claimEligibility({ ...listed, priceCents: null }, BUYER, 2900).ok,
  false,
)

// House stock has no maker; a null creator must not match a null-ish viewer.
assert.deepEqual(
  claimEligibility({ ...listed, creatorId: null }, BUYER, 2900),
  { ok: true },
)

console.log("lib/listing.test.ts ok")
