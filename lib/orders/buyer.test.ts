/** Run: `npx tsx lib/orders/buyer.test.ts`
 *
 *  ponytail: the email is the entire delivery mechanism for a design purchase
 *  — receipt and artwork file both go there and nowhere else — so a typo that
 *  gets through is a buyer who paid and received nothing.
 */

import assert from "node:assert/strict"

import { validateBuyer } from "./buyer.ts"

const good = validateBuyer({ name: "  Ada   Lovelace ", email: " Ada@Example.COM " })
assert.equal(good.ok, true)
assert.deepEqual(good.ok && good.buyer, {
  name: "Ada Lovelace",
  email: "ada@example.com",
})

for (const bad of [
  { name: "", email: "ada@example.com" },
  { name: "   ", email: "ada@example.com" },
  { name: "Ada", email: "" },
  { name: "Ada", email: "ada@example" },
  { name: "Ada", email: "ada example.com" },
  { name: "Ada", email: "@example.com" },
  { name: "A".repeat(121), email: "ada@example.com" },
]) {
  assert.equal(validateBuyer(bad).ok, false, `should reject ${JSON.stringify(bad)}`)
}

// A missing field is a missing field, not a crash.
assert.equal(validateBuyer({}).ok, false)
assert.equal(validateBuyer({ name: 42, email: null }).ok, false)

console.log("buyer.test.ts ok")
