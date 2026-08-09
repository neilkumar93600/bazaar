/** The two rules that decide whether a design may go live and whether a claim
 *  may proceed.
 *
 *  Pure and database-free on purpose: `claim_design` (SQL) mirrors
 *  `claimEligibility` branch for branch, error string for error string, and a
 *  mirror you cannot test is a mirror that drifts. The SQL version is the one
 *  that actually enforces it — it runs inside the row lock — but this is where
 *  the rule is written down and checked.
 */

/** Free is `null`, never `0`. Zero would make "the maker gave it away" and
 *  "the maker typed nothing" the same value. */
export type ListingPrice = number | null

/** A bound, not a business rule — it stops a fat finger becoming a $9,000,000
 *  listing, nothing more. */
export const MAX_PRICE_CENTS = 100_000_00

export type PriceValidation =
  | { ok: true; priceCents: ListingPrice }
  | { ok: false; error: string }

/** `dollars` is the raw string off the form. Cents conversion happens here,
 *  once, at the edge — everything downstream is integer cents. */
export function validateListingPrice(
  free: boolean,
  dollars: string
): PriceValidation {
  if (free) return { ok: true, priceCents: null }

  const trimmed = dollars.trim()
  if (trimmed === "") {
    return { ok: false, error: "Enter a price, or tick Free." }
  }

  // Not `parseFloat`: it happily reads "12abc" as 12 and "1e3" as 1000. A
  // price is a plain decimal with at most two places or it is a typo.
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Enter a price like 29 or 24.50." }
  }

  const cents = Math.round(Number(trimmed) * 100)

  if (cents <= 0) {
    return {
      ok: false,
      error: "A price has to be more than zero. Tick Free to give it away.",
    }
  }
  if (cents > MAX_PRICE_CENTS) {
    return { ok: false, error: "That price is too high." }
  }

  return { ok: true, priceCents: cents }
}

export type ClaimRow = {
  listedAt: string | null
  priceCents: ListingPrice
  claimedBy: string | null
  creatorId: string | null
  moderationStatus: string
}

export type ClaimCheck = { ok: true } | { ok: false; error: string }

/** `expectedCents` is the price the buyer was shown. It is compared, never
 *  charged — the amount charged always comes from the row. A client that lies
 *  here can only make its own claim fail. */
export function claimEligibility(
  row: ClaimRow,
  viewerId: string,
  expectedCents: ListingPrice
): ClaimCheck {
  if (row.moderationStatus !== "approved") {
    return { ok: false, error: "Design not available." }
  }
  // Same message as the moderation branch on purpose: an unlisted design must
  // not be distinguishable from a nonexistent one by a stranger probing ids.
  if (row.listedAt === null) {
    return { ok: false, error: "Design not available." }
  }
  if (row.claimedBy !== null) {
    return { ok: false, error: "Someone just claimed this design." }
  }
  if (row.creatorId !== null && row.creatorId === viewerId) {
    return { ok: false, error: "You made this design." }
  }
  if (row.priceCents !== expectedCents) {
    return { ok: false, error: "The price changed. Refresh and try again." }
  }
  return { ok: true }
}
