# Design Detail + Claim/Purchase Flow

Date: 2026-08-03

## Context

`/design/[id]` is currently a `ComingSoon` placeholder (`app/(public)/design/[id]/page.tsx`). Per `docs/TRD.md`, claiming a design *is* buying it: the base purchase price, with no separate "claim" step. On claim, a design gets exactly one `claims` row forever (`claims.design_id` is unique) — the claimant becomes its permanent owner, gets an auto-provisioned storefront, and earns a royalty on future resales.

**Correction from the original draft of this spec:** the site is design-ownership only for now. Physical t-shirt fulfillment (print quality, placement, size) comes later via a Printify (or similar) integration — claiming is not a t-shirt order today, just ownership at the design's base price. The quality-tier/placement/size picker this spec originally proposed at claim time has been removed; that UI belongs to the future "order a print" flow once a POD adapter exists.

The downstream read views already exist and already work against real data (`lib/data/my-designs.ts` → `/dashboard/designs`, `lib/data/orders.ts` → `/dashboard/orders`) — only the write path (claiming) is missing. Real payment requires Stripe Connect, which isn't configured (no Stripe SDK in `package.json`, no keys in `.env.example`). This spec builds the real transaction behind a mock payment adapter, the same pattern already used for design images (`public/t-shirt` stand-ins "until the image-gen adapter is wired up").

## Scope

In scope:
- `/design/[id]`: pure design-info page (image, vibe, price, claimed/unclaimed status) — never a checkout form
- `/design/[id]/claim`: the transactional step — confirm, mock payment, one atomic DB transaction (order + claim + storefront)
- Mock payment adapter (`lib/payments/checkout.ts`)

Out of scope (future specs):
- Any print fulfillment at all: quality tier, placement, size, shipping address — all deferred until a Printify (or similar) POD adapter exists. `orders.quality_tier`/`size` stay null and `placement_front`/`back` keep their table defaults until then.
- Buying a *print* of an already-claimed design (resale) and the royalty payout it triggers — nothing today lets you do this anyway; `DesignCard` shows "View design," not "Buy," for claimed designs
- Share-image compositing background job (`docs/TRD.md`'s growth-loop trigger)
- Real Stripe Connect, real POD provider
- `/auctions` (Bid) and `/dashboard/create` (generation flow) — separate specs, next in queue

## Data model

New migration, `claim_design(p_design_id, p_amount_cents, p_payment_ref)`, a `security definer` Postgres function — same pattern as the existing `handle_new_user`/`notify_on_*` trigger functions, so no new client-facing INSERT policies are needed on `claims`/`orders`/`storefronts` (all three stay "server-function only," matching `docs/SECURITY.md`).

Transaction body:
1. Resolve buyer as `(select auth.uid())`; raise if not signed in.
2. `select is_claimed, moderation_status from designs where id = p_design_id for update` — row lock. Raise if not found, not `'approved'`, or already claimed.
3. Insert `orders` (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status `'paid'` directly — no `'pending'` state, since there's no async webhook yet). `quality_tier`/`size` omitted (stay null), `placement_front`/`back` omitted (keep table defaults) — no fulfillment data to record yet.
4. Update `designs` set `is_claimed = true, claimed_by = buyer`.
5. Insert `claims` (design_id, claimant_id = buyer) — the unique constraint on `design_id` is a second guard against a concurrent double-claim, on top of the row lock in step 2.
6. Upsert `storefronts` (owner_id = buyer, slug = buyer's `profiles.handle`) `on conflict (owner_id) do nothing` — first-ever claim provisions it, later claims reuse it.
7. Return `(order_id, handle)` for the caller to redirect to `/creator/<handle>`.

`grant execute ... to authenticated` only (not `anon`).

No changes to existing tables beyond this function.

## Payment adapter (`lib/payments/checkout.ts`)

```ts
type ChargeInput = { amountCents: number; buyerId: string; designId: string }
type ChargeResult = { paymentRef: string; status: "succeeded" }
async function charge(input: ChargeInput): Promise<ChargeResult>
```

Mock implementation always succeeds, `paymentRef` is `mock_pi_<uuid>`. This is the only file a real Stripe integration replaces later — same shape (amount in, a payment reference + status out), so nothing upstream changes.

## Pages & components

`lib/data/design.ts` — new module, `getDesignDetail(id)`: fetches the design (explicitly filtered to `moderation_status = 'approved'`, matching every other public query in this codebase even though the RLS policy itself is broad) plus vibe name and, if claimed, claimant handle. Returns `null` for not-found/unapproved → `notFound()`.

Two steps, not one — `/design/[id]` is design info only, never a checkout form:

`app/(public)/design/[id]/page.tsx` — replaces the `ComingSoon` stub. Pure read view, no auth check:
- Not found or unapproved → `notFound()`
- Claimed → image, vibe, price, "Claimed by @handle" + claimed date, link to `/creator/<handle>`.
- Unclaimed → image, vibe, price, "Unclaimed · created X ago" + a one-line explainer of what claiming means, single "Claim it" button → `/design/[id]/claim`.

`app/(public)/design/[id]/claim/page.tsx` — the transactional step. Already-claimed (race/back-nav) → `redirect` back to `/design/[id]`. Logged out → "Log in to claim" → `/login` (no redirect param — matches `FollowButton`'s existing logged-out treatment). Logged in → `<ClaimForm designId={...} priceCents={...} />`.

`components/design/ClaimForm.tsx` (client component) — one line explaining what claiming means, one button: "Claim for $X" (X = the design's base price, no options to configure). Uses `useTransition`, mirrors `FollowButton`'s pending-state pattern.

`app/(public)/design/[id]/actions.ts` — `claimDesign(designId)`:
1. Get session user; not signed in → `{ error: "Sign in to claim this design." }`
2. Re-fetch the design server-side for its current `price_cents` (never trust a client-sent price)
3. `charge(...)` (mock adapter)
4. `supabase.rpc("claim_design", { ...})`
5. Success → `redirect("/creator/" + handle)`
6. RPC error (race: someone else claimed it first) → `{ error: "Someone just claimed this design." }` — a real, expected case, not a crash, so the action returns a result object instead of throwing

No `revalidatePath` calls needed: every page that shows claim state (`/`, `/shop`, `/creator/[handle]`) already reads through a cookie-based Supabase client, which Next.js treats as dynamic — no stale cache to bust.

## Testing

No test runner exists anywhere in this project (no jest/vitest, no `test` script). Verifying by hand with Playwright against the dev server, same as the seed-data verification earlier — not introducing a test framework for one feature.
