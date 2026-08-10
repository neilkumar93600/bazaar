/** Run: `npx tsx lib/purchase/buyer-account.test.ts`
 *
 *  ponytail: this decides *who owns* a guest's design. Returning the wrong id
 *  hands a stranger's purchase to someone else, and returning null where an
 *  account exists refuses a buyer who is already a customer.
 */

import assert from "node:assert/strict"

import { resolveBuyerId, type BuyerAccountAdmin } from "./buyer-account.ts"

const buyer = { name: "Ada Lovelace", email: "ada@example.com" }

function admin(
  created: string | null,
  existing: string | null = null,
): { admin: BuyerAccountAdmin; calls: string[] } {
  const calls: string[] = []
  const fake = {
    async createUser(attrs: { email: string }) {
      calls.push(`createUser:${attrs.email}`)
      return created
        ? { data: { user: { id: created } }, error: null }
        : { data: { user: null }, error: { message: "email exists" } }
    },
    async generateLink(params: { email: string }) {
      calls.push(`generateLink:${params.email}`)
      return existing
        ? { data: { user: { id: existing } }, error: null }
        : { data: { user: null }, error: { message: "not found" } }
    },
  }
  return { admin: fake as unknown as BuyerAccountAdmin, calls }
}

// A brand-new address: one call, and the fresh account owns the design.
const fresh = admin("new-id")
assert.equal(await resolveBuyerId(buyer, fresh.admin), "new-id")
assert.deepEqual(fresh.calls, ["createUser:ada@example.com"])

// An address that already has an account: the purchase joins it rather than
// being refused, which is the whole reason the fallback exists.
const known = admin(null, "existing-id")
assert.equal(await resolveBuyerId(buyer, known.admin), "existing-id")
assert.deepEqual(known.calls, [
  "createUser:ada@example.com",
  "generateLink:ada@example.com",
])

// Neither door opens — null, so the caller can refuse the purchase instead of
// claiming a design for nobody.
const broken = admin(null, null)
assert.equal(await resolveBuyerId(buyer, broken.admin), null)

console.log("buyer-account: ok")
