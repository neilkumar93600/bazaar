/** Run: `npx tsx lib/printify/orders.test.ts`
 *
 *  ponytail: the payload builder is pure so the request body can be checked
 *  without a network call. Field-name drift against Printify's snake_case is
 *  silent until a real order is rejected — long after the buyer has paid.
 */

import assert from "node:assert/strict"

import { buildOrderPayload, mapPrintifyStatus } from "./orders.ts"

const ADDRESS = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+442079460958",
  country: "GB",
  region: "",
  address1: "12 Analytical Way",
  address2: "Flat 3",
  city: "London",
  zip: "EC1A 1BB",
}

const payload = buildOrderPayload({
  orderId: "order-abc",
  productId: "prod_1",
  variantId: 101,
  address: ADDRESS,
})

// external_id is our own id — the idempotency handle for any retry.
assert.equal(payload.external_id, "order-abc")

assert.equal(payload.line_items.length, 1)
assert.deepEqual(payload.line_items[0], {
  product_id: "prod_1",
  variant_id: 101,
  quantity: 1,
})

assert.equal(payload.shipping_method, 1)
assert.equal(payload.send_shipping_notification, false)

// Every field mapped to Printify's snake_case name.
assert.deepEqual(payload.address_to, {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@example.com",
  phone: "+442079460958",
  country: "GB",
  region: "",
  address1: "12 Analytical Way",
  address2: "Flat 3",
  city: "London",
  zip: "EC1A 1BB",
})

// Printify's ten statuses collapse onto our four.
assert.equal(mapPrintifyStatus("in-production"), "paid")
assert.equal(mapPrintifyStatus("sending-to-production"), "paid")
assert.equal(mapPrintifyStatus("fulfilled"), "fulfilled")
assert.equal(mapPrintifyStatus("partially-fulfilled"), "fulfilled")
assert.equal(mapPrintifyStatus("canceled"), "refunded")
// Anything unrecognised leaves our status alone rather than guessing — an
// order must never silently read as fulfilled when it had issues.
assert.equal(mapPrintifyStatus("had-issues"), null)
assert.equal(mapPrintifyStatus("who-knows"), null)

console.log("orders.test.ts: all assertions passed")
