/** Run: `npx tsx components/home/MastheadLedger.test.ts`
 *
 *  ponytail: assert-based, no framework, no renderer. Guards one thing — that a
 *  brand-new site never puts a zero on its own front page. Losing that ships
 *  "0 creators earning" above the fold and nothing fails to tell us.
 */

import assert from "node:assert/strict"

import { buildLedgerEntries } from "./MastheadLedger"
import { ROYALTY_RATE_PERCENT } from "../../lib/royalty"

const EMPTY = {
  designsLive: 84,
  designsUnclaimed: 84,
  designsClaimed: 0,
  creatorCount: 0,
  royaltiesPaidCents: 0,
}

// A catalogue with no users: three tiles, and not a zero among them.
{
  const tiles = buildLedgerEntries(EMPTY)
  assert.deepEqual(
    tiles.map((t) => t.key),
    ["live", "unclaimed", "royalty", "owners"],
    "empty site shows launch facts only",
  )
  for (const tile of tiles) {
    assert.ok(tile.value > 0, `${tile.key} must not render as zero`)
  }
}

// The royalty rate is quoted from the shared constant, and never animates.
{
  const royalty = buildLedgerEntries(EMPTY).find((t) => t.key === "royalty")!
  assert.equal(royalty.value, ROYALTY_RATE_PERCENT)
  assert.equal(royalty.suffix, "%")
  assert.ok(!royalty.animate, "a fixed rate must not count up from 0%")
}

// Traction joins one tile at a time, as each metric becomes real.
{
  const tiles = buildLedgerEntries({ ...EMPTY, designsClaimed: 24, designsUnclaimed: 60 })
  assert.deepEqual(
    tiles.map((t) => t.key),
    ["live", "unclaimed", "royalty", "owners", "claimed"],
    "a claimed count appears once it exists",
  )
}

{
  const tiles = buildLedgerEntries({
    designsLive: 84,
    designsUnclaimed: 60,
    designsClaimed: 24,
    creatorCount: 10,
    royaltiesPaidCents: 12_500,
  })
  assert.deepEqual(tiles.map((t) => t.key), [
    "live",
    "unclaimed",
    "royalty",
    "owners",
    "claimed",
    "creators",
    "royalties",
  ])
  const paid = tiles.find((t) => t.key === "royalties")!
  assert.equal(paid.value, 125, "cents render as whole dollars")
  assert.equal(paid.prefix, "$")
}

// Sub-dollar royalties floor to 0, which would put a zero back on the page.
{
  const tiles = buildLedgerEntries({ ...EMPTY, royaltiesPaidCents: 40 })
  assert.ok(
    !tiles.some((t) => t.key === "royalties"),
    "40c of royalties must not render as $0",
  )
}

console.log("MastheadLedger entries: ok")
