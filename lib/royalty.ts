/** The published creator royalty on secondary sales.
 *
 *  Copy-level single source of truth: the home page, the proof section and the
 *  claim mockups all quote this number, and a marketing page that disagrees with
 *  itself about someone's cut is worse than no number at all.
 *
 *  Nothing pays out against it yet — when the payout path lands it must read
 *  this constant (or move it into the database and read it back) rather than
 *  hardcoding a second rate. */
export const ROYALTY_RATE_PERCENT = 10

/** What has to accumulate before a payout is worth making.
 *
 *  A published rule, not a target somebody invented for a dashboard — the
 *  payout panel measures pending royalties against this and nothing else. Move
 *  it into the database the day payouts become configurable per creator. */
export const PAYOUT_THRESHOLD_CENTS = 5000
