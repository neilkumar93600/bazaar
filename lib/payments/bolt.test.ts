/** Run: `npx tsx lib/payments/bolt.test.ts`
 *
 *  ponytail: verifyWebhook is the only thing between the open internet and a
 *  free design. Every POST to /api/bolt/webhook is an unauthenticated request
 *  to claim one; if this returns true when it shouldn't, that request works.
 *
 *  isSettled is here for the same reason at one remove: a claim is permanent
 *  and a `pending` transaction under fraud review is not.
 */

import assert from "node:assert/strict"
import { createHmac } from "node:crypto"

process.env.BOLT_SIGNING_SECRET = "test-signing-secret"

const { isSettled, verifyWebhook } = await import("./bolt.ts")

const body = JSON.stringify({ type: "payment", reference: "TRX-123" })
const sign = (payload: string, secret = "test-signing-secret") =>
  createHmac("sha256", secret).update(payload, "utf8").digest("base64")

// The genuine article.
assert.equal(await verifyWebhook(body, sign(body)), true)

// Body tampered after signing — the whole point of the check.
assert.equal(await verifyWebhook(body.replace("TRX-123", "TRX-666"), sign(body)), false)

// Signed with somebody else's secret.
assert.equal(await verifyWebhook(body, sign(body, "not-the-secret")), false)

// No signature header at all.
assert.equal(await verifyWebhook(body, null), false)

// Truncated signature: timingSafeEqual throws on a length mismatch, so this
// would be a 500 on every unsigned request if the length weren't checked first.
assert.equal(await verifyWebhook(body, sign(body).slice(0, 10)), false)

// Empty secret means an unconfigured webhook, and an unconfigured webhook is a
// closed one. Re-imported because the module reads the env at call time.
process.env.BOLT_SIGNING_SECRET = ""
assert.equal(await verifyWebhook(body, sign(body)), false)
process.env.BOLT_SIGNING_SECRET = "test-signing-secret"

// Committed money claims a design. Everything else must not.
for (const status of ["completed", "authorized"]) {
  assert.equal(isSettled(status), true, status)
}
for (const status of ["pending", "failed", "cancelled", "rejected_reversible", "rejected_irreversible", "in_progress", "created", ""]) {
  assert.equal(isSettled(status), false, status)
}

console.log("bolt: ok")
