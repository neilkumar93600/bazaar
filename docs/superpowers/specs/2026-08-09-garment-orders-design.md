# Garment orders — buying the shirt

Date: 2026-08-09
Status: approved, ready to plan

**Sub-project E1**, the first of three slices of the buyer side. Depends on
**A** (ownership), **B** (create v2) and **D** (garment config), all built.

## Problem

Nothing in the app has ever created a Printify *order*. `createDesignProduct`
makes products; `/v1/shops/{id}/orders.json` has never been called. A visitor
who wants the shirt cannot buy it.

Worse, `orders` already means something else: `claim_design` writes a row there
for every ownership *claim*, with `size` null and `placement_*` at their
defaults. `/dashboard/orders` renders those claims in a table with Size and
Placement columns that are permanently empty.

## Scope

One buyer, one design, one garment, delivered.

Deferred to **E2** — real payment. Stripe, webhooks, idempotency, refunds. The
mock `charge()` stays.

Deferred to **E3** — royalty ledger rows and creator payouts. Writing the rows
is small; paying people is Stripe Connect, KYC and tax.

Deferred indefinitely, recorded in Risks: shipping-cost calculation, tax,
cancellation, PII retention policy, express shipping.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Order model | **One table, `kind` in `('claim','garment')`**, defaulting to `'claim'` | Smallest migration, and the default means `claim_design` needs no change at all. Half the columns are null for half the rows; that is cheaper than two tables and a `royalty_ledger.order_id` that has to point at both. |
| Orderable when | **Only once the design is claimed** | Claiming is what the bazaar sells. An unclaimed design has no owner, so a royalty would have nowhere to go and "claim it before someone else does" would lose its point. |
| Cart | **None.** Single item, straight to checkout. | Designs are 1-of-1 and exclusive; nobody batches them. `/cart`'s `ComingSoon` stub is deleted and unlinked rather than built. |
| Address | **Snapshot on the order, never on the profile** | The honest record: an order shipped where it shipped, even if the buyer later moves. One PII store instead of two. Cost: repeat buyers retype it. |
| Insert path | **Server action with the service-role client**, not a `security definer` RPC | `claim_design` needed an RPC for its row lock — two people racing for one exclusive claim. Fifty people may order the same shirt, so there is no race to serialise. Same pattern as `/api/generate` and `sync.ts`; `orders` stays client-uninsertable. |
| Status | **Keep the existing four values**; store Printify's raw word alongside | Printify has ten statuses. Widening the constraint would break the badge variants the orders page switches on. Granularity lives in an unconstrained `printify_status`. |
| Submission | **Gated by `PRINTIFY_SUBMIT_ORDERS`, default off** | Payment is still a mock. With the flag off the whole flow is exercisable and no garment is manufactured against money that never moved. |

## Architecture

### Schema

```sql
alter table public.orders
  add column kind text not null default 'claim'
    check (kind in ('claim', 'garment')),
  add column variant_id        integer,
  add column printify_order_id text,
  add column printify_status   text,
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
```

No backfill: zero orders exist, and `default 'claim'` covers every future
`claim_design` insert without touching that function.

`printify_status` is deliberately unconstrained. `status` maps coarsely:
Printify's `in-production` / `sending-to-production` → `paid`, `fulfilled` /
`partially-fulfilled` → `fulfilled`, `canceled` → `refunded`. Anything else
leaves `status` alone and only updates the raw word.

### Eligibility — `lib/orders/eligibility.ts`

A pure function, mirroring A's `claimEligibility`:

```ts
orderEligibility(
  design: { claimedBy: string | null; printifyProductId: string | null; garmentSlug: string | null },
  variantId: number,
  catalogueVariantIds: number[],
): { ok: true } | { ok: false; error: string }
```

Refuses: unclaimed, no product, a variant that does not belong to that design's
garment. The last one is the important one — Printify accepts the order and
rejects it later, after the buyer believes they have paid.

### Address — `lib/orders/address.ts`

| Field | Rule |
| --- | --- |
| `firstName`, `lastName` | required, trimmed |
| `email` | required, prefilled from the session, shape-checked |
| `phone` | **required** — carriers need it and several Printify providers reject orders without one |
| `country` | required, normalised to uppercase ISO-3166 alpha-2 |
| `region` | required for `US`, `CA`, `AU`; optional elsewhere |
| `address1` | required |
| `address2` | optional |
| `city`, `zip` | required |

The region rule is conditional on country because Printify rejects those three
without a state or province — a rejection that lands *after* checkout, which is
the worst place to discover it.

### Flow

1. `/design/[id]` shows **Order a shirt** only when the design is claimed and
   has a `printify_product_id`. Unclaimed designs still show only "Claim it".
2. The order panel resolves the design's garment, then uses `coloursFrom` for
   swatches and **`sizesForColour`** for that colour's sizes — the function D
   built and marked "not dead code". Colour defaults to the maker's
   `featured_variant_id`.
3. Address form, then **Place order**.
4. The server action: re-reads the design, runs `orderEligibility`, validates
   the address, charges (mock), inserts `orders` with `kind: 'garment'`,
   and — if `PRINTIFY_SUBMIT_ORDERS` is on — submits to Printify in `after()`
   and stores `printify_order_id`.

### Printify submission — `lib/printify/orders.ts`

```
POST /v1/shops/{shopId}/orders.json
{
  external_id: <our order id>,
  line_items: [{ product_id, variant_id, quantity: 1 }],
  shipping_method: 1,
  send_shipping_notification: false,
  address_to: { first_name, last_name, email, phone, country, region, address1, address2, city, zip }
}
```

`external_id` is our order id, which is the idempotency handle for any retry.

The payload builder is a pure function so its shape is testable without a
network call.

### Status refresh

No webhook and no cron. The orders page GETs Printify for each non-terminal
garment order when it renders, capped at a small number per request, and writes
back `printify_status` plus the mapped `status`.

That mapping is what makes the existing `notify_on_order_status_change` trigger
fire, so **buyers get order notifications for free** — it already watches any
`orders.status` change and inserts a notification for `buyer_id`. It does not
notify the design owner; that belongs with royalties in E3.

## Verification

`lib/orders/address.test.ts`

- Each required field missing produces its own error.
- `country` normalises: `"us"` → `"US"`, padded input trims.
- **The region rule**: `US`/`CA`/`AU` without a region fail; `DE` without one
  passes. This is the rejection that would otherwise land after checkout.
- Email shape: obvious non-addresses fail.

`lib/orders/eligibility.test.ts`

- Unclaimed refuses, missing product refuses, a variant outside the garment's
  catalogue refuses, a good order allows.

`lib/printify/orders.test.ts`

- The payload carries `external_id`, exactly one line item with the right
  product and variant, `quantity: 1`, and every address field mapped to
  Printify's snake_case names. Field-name drift here is silent until an order
  is rejected.

Manual, once, with the flag on: one real order, confirmed in the Printify
dashboard.

## Risks

- **Payment is a mock.** `PRINTIFY_SUBMIT_ORDERS` defaults off for exactly this
  reason. Turning it on before E2 means manufacturing goods against money that
  never moved.
- **No shipping-cost calculation, so the margin is unknown.**
  `Garment.priceCents` is a flat 2900 while Printify charges cost plus shipping,
  and shipping varies by destination. International orders may sell below cost.
  The fix is Printify's shipping-rates endpoint at checkout; not built.
- **No tax** is calculated or collected.
- **PII.** Addresses sit in Postgres under buyer-only RLS with no encryption
  beyond Supabase's defaults, no retention policy and no deletion path. Fine for
  development; a real question before real users.
- **Status is only as fresh as the last page view**, and a buyer with many open
  orders makes many Printify calls on one render.
- **No cancellation or refund path.** `refunded` exists in the enum; nothing
  ever sets it except the status mapping.
- **`shipping_method: 1`** (standard) is hardcoded; express is not offered.
- **Half of `orders` is null for claims.** The cost of the single-table choice,
  accepted deliberately.
