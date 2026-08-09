/** Run: `npx tsx lib/orders/address.test.ts`
 *
 *  ponytail: the region rule is the one worth a test. Printify rejects US, CA
 *  and AU orders with no state or province — and it rejects them *after* the
 *  buyer believes they have paid, which is the worst place to find out.
 */

import assert from "node:assert/strict"

import { validateAddress } from "./address.ts"

const GOOD = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+44 20 7946 0958",
  country: "GB",
  region: "",
  address1: "12 Analytical Way",
  address2: "",
  city: "London",
  zip: "EC1A 1BB",
}

assert.equal(validateAddress(GOOD).ok, true)

// Every required field is required, one at a time.
for (const field of [
  "firstName",
  "lastName",
  "email",
  "phone",
  "country",
  "address1",
  "city",
  "zip",
] as const) {
  const result = validateAddress({ ...GOOD, [field]: "   " })
  assert.equal(result.ok, false, `${field} must be required`)
}

// address2 and region are optional for GB.
assert.equal(validateAddress({ ...GOOD, address2: "" }).ok, true)

// Country normalises to uppercase ISO-2.
{
  const result = validateAddress({ ...GOOD, country: " gb " })
  assert.equal(result.ok, true)
  assert.equal(result.ok && result.address.country, "GB")
}
assert.equal(validateAddress({ ...GOOD, country: "United Kingdom" }).ok, false)

// THE rule: these three need a region, and nothing else does.
for (const country of ["US", "CA", "AU"]) {
  assert.equal(
    validateAddress({ ...GOOD, country, region: "" }).ok,
    false,
    `${country} must require a region`,
  )
  assert.equal(
    validateAddress({ ...GOOD, country, region: "CA" }).ok,
    true,
    `${country} with a region must pass`,
  )
}
assert.equal(validateAddress({ ...GOOD, country: "DE", region: "" }).ok, true)

// Email shape — not RFC-complete, just enough to catch a typo.
for (const email of ["nope", "no@", "@no", "a b@c.com", ""]) {
  assert.equal(validateAddress({ ...GOOD, email }).ok, false, `${email} must fail`)
}

// Values are trimmed on the way through.
{
  const result = validateAddress({ ...GOOD, city: "  London  " })
  assert.equal(result.ok && result.address.city, "London")
}

console.log("address.test.ts: all assertions passed")
