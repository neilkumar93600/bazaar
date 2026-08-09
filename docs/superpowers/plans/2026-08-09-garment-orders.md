# Garment Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor buys a printed garment of a claimed design — colour, size, address, order — and it reaches Printify.

**Architecture:** `orders` gains a `kind` discriminator defaulting to `'claim'`, so `claim_design` is untouched. Garment orders are written by a server action with the service-role client (no row lock is needed — many people may order the same shirt). Printify submission is gated behind an env flag because payment is still mocked.

**Tech Stack:** Next.js 16, React 19, Supabase, TypeScript, Printify REST.

**Spec:** [docs/superpowers/specs/2026-08-09-garment-orders-design.md](../specs/2026-08-09-garment-orders-design.md)

## Global Constraints

- **`PRINTIFY_SUBMIT_ORDERS` defaults OFF.** Payment is a mock; no garment gets manufactured against money that never moved.
- A design is orderable only when **claimed** and holding a `printify_product_id`.
- Addresses are snapshotted on the order, never written to `profiles`.
- `orders.status` keeps its four values; Printify's raw word goes in `printify_status`.
- Tests: `npx tsx <path>.test.ts`, `node:assert/strict`, no framework.
- Every commit passes `npx next typegen && npm run typecheck && npm run lint`.
- Migrations via `supabase migration new`, applied with MCP `apply_migration`.
- Branch: `spec/design-ownership-listing`.

---

### Task 1: Address and eligibility rules

**Files:**
- Create: `lib/orders/address.ts`, `lib/orders/eligibility.ts`
- Test: `lib/orders/address.test.ts`, `lib/orders/eligibility.test.ts`

**Interfaces:**
- Produces: `ShippingAddress`, `validateAddress(raw): {ok:true;address:ShippingAddress}|{ok:false;error:string}`, `REGION_REQUIRED_COUNTRIES`; `orderEligibility(design, variantId, catalogueVariantIds)`.

- [ ] **Step 1: Write both failing tests**

`lib/orders/address.test.ts`:

```ts
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

{
  const result = validateAddress(GOOD)
  assert.equal(result.ok, true)
}

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
```

`lib/orders/eligibility.test.ts`:

```ts
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
```

- [ ] **Step 2: Run both, verify they fail**

```bash
npx tsx lib/orders/address.test.ts; npx tsx lib/orders/eligibility.test.ts
```

Expected: module-not-found for each.

- [ ] **Step 3: Write `lib/orders/address.ts`**

```ts
/** Shipping address validation.
 *
 *  Printify rejects an order it has already accepted if the address is wrong,
 *  which surfaces long after checkout. Everything catchable is caught here.
 */

export type ShippingAddress = {
  firstName: string
  lastName: string
  email: string
  phone: string
  /** ISO-3166 alpha-2, uppercase. */
  country: string
  region: string
  address1: string
  address2: string
  city: string
  zip: string
}

/** Printify rejects these three without a state or province. Every other
 *  country treats region as optional. */
export const REGION_REQUIRED_COUNTRIES = ["US", "CA", "AU"]

export type AddressValidation =
  | { ok: true; address: ShippingAddress }
  | { ok: false; error: string }

const clean = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""

export function validateAddress(raw: Record<string, unknown>): AddressValidation {
  const address: ShippingAddress = {
    firstName: clean(raw.firstName),
    lastName: clean(raw.lastName),
    email: clean(raw.email).toLowerCase(),
    phone: clean(raw.phone),
    country: clean(raw.country).toUpperCase(),
    region: clean(raw.region),
    address1: clean(raw.address1),
    address2: clean(raw.address2),
    city: clean(raw.city),
    zip: clean(raw.zip),
  }

  const required: [keyof ShippingAddress, string][] = [
    ["firstName", "Enter a first name."],
    ["lastName", "Enter a last name."],
    ["email", "Enter an email address."],
    ["phone", "Enter a phone number — carriers need one."],
    ["country", "Pick a country."],
    ["address1", "Enter a street address."],
    ["city", "Enter a city."],
    ["zip", "Enter a postal code."],
  ]

  for (const [field, error] of required) {
    if (address[field] === "") return { ok: false, error }
  }

  // Two letters, because that is what Printify's `country` field takes.
  if (!/^[A-Z]{2}$/.test(address.country)) {
    return { ok: false, error: "Use a two-letter country code, like US or GB." }
  }

  // Not RFC-complete on purpose — enough to catch a typo, not enough to reject
  // a real address someone actually owns.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    return { ok: false, error: "That email address doesn't look right." }
  }

  if (REGION_REQUIRED_COUNTRIES.includes(address.country) && address.region === "") {
    return { ok: false, error: "Enter a state or province." }
  }

  return { ok: true, address }
}
```

- [ ] **Step 4: Write `lib/orders/eligibility.ts`**

```ts
/** Whether this design can be ordered as a garment at all.
 *
 *  Pure, and mirrored by the server action's own re-read: the action is the
 *  boundary, this is where the rule is written down and checked. */

export type OrderableDesign = {
  claimedBy: string | null
  printifyProductId: string | null
}

export type OrderCheck = { ok: true } | { ok: false; error: string }

export function orderEligibility(
  design: OrderableDesign,
  variantId: number,
  catalogueVariantIds: number[]
): OrderCheck {
  // Claiming is what the bazaar sells. An unclaimed design also has no owner,
  // so a royalty would have nowhere to go.
  if (design.claimedBy === null) {
    return { ok: false, error: "This design hasn't been claimed yet." }
  }
  if (!design.printifyProductId) {
    return { ok: false, error: "This design isn't ready to order yet." }
  }
  // Printify accepts an order with a foreign variant and rejects it later,
  // after the buyer believes they have paid.
  if (!catalogueVariantIds.includes(variantId)) {
    return { ok: false, error: "Pick a size." }
  }
  return { ok: true }
}
```

- [ ] **Step 5: Run both, verify they pass, then commit**

```bash
npx tsx lib/orders/address.test.ts && npx tsx lib/orders/eligibility.test.ts
npx next typegen && npm run typecheck && npm run lint
git add lib/orders/
git commit -m "feat: shipping address and order eligibility rules"
```

---

### Task 2: Printify order submission

**Files:**
- Create: `lib/printify/orders.ts`
- Test: `lib/printify/orders.test.ts`

**Interfaces:**
- Consumes: `printifyConfig`, `printifyFetch` (`client.ts`); `ShippingAddress` (Task 1).
- Produces: `buildOrderPayload(input)`, `submitPrintifyOrder(input): Promise<{printifyOrderId, status} | null>`, `fetchPrintifyOrderStatus(id)`, `mapPrintifyStatus(raw)`.

- [ ] **Step 1: Write the failing test**

```ts
/** Run: `npx tsx lib/printify/orders.test.ts`
 *
 *  ponytail: the payload builder is pure so the request body can be checked
 *  without a network call. Field-name drift against Printify's snake_case is
 *  silent until a real order is rejected.
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
// Anything unrecognised leaves our status alone rather than guessing.
assert.equal(mapPrintifyStatus("had-issues"), null)
assert.equal(mapPrintifyStatus("who-knows"), null)

console.log("orders.test.ts: all assertions passed")
```

- [ ] **Step 2: Verify it fails, then write `lib/printify/orders.ts`**

```ts
import { printifyConfig, printifyFetch } from "./client.ts"
import type { ShippingAddress } from "../orders/address.ts"

/** Our four order statuses, and how Printify's ten map onto them.
 *
 *  Null means "no opinion" — leave `orders.status` where it is and only record
 *  the raw word. Guessing on an unrecognised status is how an order silently
 *  reads as fulfilled when it had issues. */
export function mapPrintifyStatus(
  raw: string
): "paid" | "fulfilled" | "refunded" | null {
  switch (raw) {
    case "in-production":
    case "sending-to-production":
    case "on-hold":
      return "paid"
    case "fulfilled":
    case "partially-fulfilled":
      return "fulfilled"
    case "canceled":
      return "refunded"
    default:
      return null
  }
}

export type OrderPayload = {
  external_id: string
  line_items: { product_id: string; variant_id: number; quantity: number }[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: Record<string, string>
}

/** Pure, so the request body is testable without a network call. */
export function buildOrderPayload({
  orderId,
  productId,
  variantId,
  address,
}: {
  orderId: string
  productId: string
  variantId: number
  address: ShippingAddress
}): OrderPayload {
  return {
    // Our order id: Printify treats it as the caller's key, so a retry cannot
    // create a second garment.
    external_id: orderId,
    line_items: [{ product_id: productId, variant_id: variantId, quantity: 1 }],
    // 1 is standard shipping. Express is not offered.
    shipping_method: 1,
    // We notify the buyer ourselves through notify_on_order_status_change.
    send_shipping_notification: false,
    address_to: {
      first_name: address.firstName,
      last_name: address.lastName,
      email: address.email,
      phone: address.phone,
      country: address.country,
      region: address.region,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      zip: address.zip,
    },
  }
}

/** Off unless explicitly enabled. Payment is still a mock, so submitting would
 *  manufacture a real garment against money that never moved. */
export function ordersEnabled(): boolean {
  return process.env.PRINTIFY_SUBMIT_ORDERS === "true"
}

type PrintifyOrder = { id: string; status?: string }

/** Null when Printify isn't configured or submission is disabled — the caller
 *  treats that as "recorded but not sent", not as a failure. */
export async function submitPrintifyOrder(input: {
  orderId: string
  productId: string
  variantId: number
  address: ShippingAddress
}): Promise<{ printifyOrderId: string; status: string | null } | null> {
  const config = printifyConfig()
  if (!config || !ordersEnabled()) return null

  const created = await printifyFetch<PrintifyOrder>(
    config,
    `/v1/shops/${config.shopId}/orders.json`,
    { method: "POST", body: buildOrderPayload(input) }
  )

  return { printifyOrderId: created.id, status: created.status ?? null }
}

export async function fetchPrintifyOrderStatus(
  printifyOrderId: string
): Promise<string | null> {
  const config = printifyConfig()
  if (!config) return null

  const order = await printifyFetch<PrintifyOrder>(
    config,
    `/v1/shops/${config.shopId}/orders/${printifyOrderId}.json`
  )
  return order.status ?? null
}
```

- [ ] **Step 3: Run, verify, commit**

```bash
npx tsx lib/printify/orders.test.ts
npx next typegen && npm run typecheck && npm run lint
git add lib/printify/orders.ts lib/printify/orders.test.ts
git commit -m "feat: Printify order payload and submission, behind a flag"
```

---

### Task 3: Migration

**Files:**
- Create: `supabase/migrations/<generated>_garment_orders.sql`
- Modify: `.env.example` (add `PRINTIFY_SUBMIT_ORDERS`)

- [ ] **Step 1: `npx supabase migration new garment_orders`, then write it**

```sql
-- `orders` has meant ownership claims. It now also means garment orders, and
-- `kind` is what tells them apart.
--
-- Defaulting to 'claim' is deliberate: claim_design's insert needs no change at
-- all, and there are no existing rows to backfill.
alter table public.orders
  add column kind text not null default 'claim'
    check (kind in ('claim', 'garment')),
  add column variant_id        integer,
  add column printify_order_id text,
  -- Printify's own word, unconstrained. `status` keeps its four values so the
  -- orders page's badge variants stay valid; the granularity lives here.
  add column printify_status   text,
  -- Address snapshot. Never written to profiles: an order shipped where it
  -- shipped, even if the buyer later moves.
  add column ship_first_name text,
  add column ship_last_name  text,
  add column ship_email      text,
  add column ship_phone      text,
  add column ship_country    text,
  add column ship_region     text,
  add column ship_address1   text,
  add column ship_address2   text,
  add column ship_city       text,
  add column ship_zip        text;

comment on column public.orders.kind is
  'claim = bought ownership of the design. garment = bought a printed item.';
comment on column public.orders.printify_status is
  'Printify''s raw status word. status is a coarse mapping of it.';

create index orders_kind_idx on public.orders (kind);
```

Add to `.env.example`:

```
# Set to "true" to actually send orders to Printify. Off by default: payment is
# still mocked, and submitting would manufacture a real garment against money
# that never moved.
PRINTIFY_SUBMIT_ORDERS=
```

- [ ] **Step 2: Apply via MCP `apply_migration`, verify, run advisors**

```sql
select kind, count(*) from public.orders group by kind;
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid='public.orders'::regclass and contype='c';
```

Expected: no rows (none exist), and a `kind` check listing `claim, garment`.

- [ ] **Step 3: Commit**

---

### Task 4: Ordering a garment

**Files:**
- Create: `app/(public)/design/[id]/order-actions.ts`
- Create: `components/design/OrderForm.tsx`
- Modify: `lib/data/design.ts` (expose the fields the panel needs)
- Modify: `components/design/DesignDetailContent.tsx`
- Modify: `app/(public)/design/[id]/page.tsx`

**Interfaces:**
- Produces: `placeGarmentOrder(designId, variantId, address): Promise<{error?: string; orderId?: string}>`; `getOrderOptions(designId)`.

- [ ] **Step 1: Expose the design fields**

`DesignDetail` gains `claimedBy: string | null`, `printifyProductId: string | null`, `garmentSlug: string | null`, `featuredVariantId: number | null`. Add them to the existing `select` in `getDesignDetail` and to the returned object.

- [ ] **Step 2: Server-side option loader**

`getOrderOptions(design)` resolves the garment (`findGarment(design.garmentSlug)` or `defaultGarment()`), fetches `catalogVariants(garment)`, and returns `{ garmentLabel, priceCents, variants }` where `variants` is the parsed `Variant[]`. Server-only, same reason as D's `garment-options.ts`: Printify's catalogue needs the API token.

- [ ] **Step 3: The action**

```ts
"use server"

export async function placeGarmentOrder(
  designId: string,
  variantId: number,
  rawAddress: Record<string, unknown>
): Promise<{ error?: string; orderId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to order." }

  const address = validateAddress(rawAddress)
  if (!address.ok) return { error: address.error }

  // Re-read server-side: the client's idea of the design is a suggestion.
  const { data: design } = await supabase
    .from("designs")
    .select("id, claimed_by, printify_product_id, garment_slug")
    .eq("id", designId)
    .maybeSingle()

  if (!design) return { error: "Design not available." }

  const garment = design.garment_slug
    ? findGarment(design.garment_slug)
    : defaultGarment()
  if (!garment) return { error: "This design isn't ready to order yet." }

  const variants = await catalogVariants(garment)
  const check = orderEligibility(
    {
      claimedBy: design.claimed_by,
      printifyProductId: design.printify_product_id,
    },
    variantId,
    variants.map((v) => v.id)
  )
  if (!check.ok) return { error: check.error }

  const { paymentRef } = await charge({
    amountCents: garment.priceCents,
    buyerId: user.id,
    designId,
  })

  // Service role: `orders` has no client insert policy, and this is written on
  // the buyer's behalf. No row lock — fifty people may order the same shirt, so
  // there is nothing to serialise.
  const admin = serviceClient()
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      kind: "garment",
      buyer_id: user.id,
      design_id: designId,
      variant_id: variantId,
      amount_cents: garment.priceCents,
      stripe_payment_intent_id: paymentRef,
      status: "paid",
      ship_first_name: address.address.firstName,
      // …every other ship_* field…
    })
    .select("id")
    .single()

  if (error || !order) return { error: "Could not place the order." }

  // Past the response: Printify is several network hops and the order is
  // already recorded. Swallows its own failures — an unsubmitted order is
  // recoverable, a 500 after taking payment is not.
  after(async () => {
    try {
      const submitted = await submitPrintifyOrder({
        orderId: order.id,
        productId: design.printify_product_id!,
        variantId,
        address: address.address,
      })
      if (submitted) {
        await admin
          .from("orders")
          .update({
            printify_order_id: submitted.printifyOrderId,
            printify_status: submitted.status,
          })
          .eq("id", order.id)
      }
    } catch (e) {
      console.error(`[order] Printify submission failed for ${order.id}`, e)
    }
  })

  return { orderId: order.id }
}
```

- [ ] **Step 4: `OrderForm`**

Client component. Colour swatches (`coloursFrom`), then sizes for the chosen colour (`sizesForColour`) — the size buttons carry the actual `variantId` that gets ordered. Colour defaults to the design's `featuredVariantId`. Then the address fields, then **Place order**. On success, redirect to `/dashboard/orders`.

Rendered by `DesignDetailContent` in place of the claim panel when `design.claimedBy !== null && design.printifyProductId !== null`.

- [ ] **Step 5: Verify, commit**

---

### Task 5: Orders page, status refresh, delete the cart

**Files:**
- Modify: `lib/data/orders.ts`
- Modify: `app/dashboard/orders/page.tsx`
- Delete: `app/(public)/cart/page.tsx`
- Modify: whatever links to `/cart` (`grep -rn "/cart" app components`)

- [ ] **Step 1: `getMyOrders` returns both kinds**

Add `kind`, `variantId`, `printifyStatus`, `printifyOrderId`. Claims render as "Claimed" with no size or placement; garment orders render size and the Printify status.

- [ ] **Step 2: Refresh non-terminal garment orders on render**

For up to 10 garment orders with a `printify_order_id` and a non-terminal status, `fetchPrintifyOrderStatus`, then write back `printify_status` and — when `mapPrintifyStatus` returns non-null — `status`. That `status` write is what makes `notify_on_order_status_change` fire, so buyers get notified for free.

Capped and best-effort: a Printify outage must not break the orders page.

- [ ] **Step 3: Delete `/cart`** and unlink it. There is no cart and one is not planned.

- [ ] **Step 4: Verify, commit**

---

## Post-implementation

- [ ] `docs/DATA_MODEL.md` — `orders.kind` and the address columns.
- [ ] `docs/PROGRESS.md` — E1 note, and the `PRINTIFY_SUBMIT_ORDERS` gate.
- [ ] Confirm `PRINTIFY_SUBMIT_ORDERS` is absent from `.env.local` (i.e. off).

## Deferred

- Real payment (E2), royalties and payouts (E3).
- Shipping-cost calculation — the margin on an international order is unknown.
- Tax, cancellation, refunds, express shipping.
- PII retention and deletion policy.
- Webhooks or a cron for status; refresh is on page view only.
