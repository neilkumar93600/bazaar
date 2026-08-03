# Design Detail + Claim/Purchase Flow

Date: 2026-08-03

## Context

`/design/[id]` is currently a `ComingSoon` placeholder (`app/(public)/design/[id]/page.tsx`). Per `docs/TRD.md`, claiming a design *is* buying it: the base purchase price, with no separate "claim" step. On claim, a design gets exactly one `claims` row forever (`claims.design_id` is unique) — the claimant becomes its permanent owner, gets an auto-provisioned storefront, and earns a royalty on future resales.

The downstream read views already exist and already work against real data (`lib/data/my-designs.ts` → `/dashboard/designs`, `lib/data/orders.ts` → `/dashboard/orders`) — only the write path (claiming/ordering) is missing. Real fulfillment requires Stripe Connect and a print-on-demand provider; neither is configured (no Stripe SDK in `package.json`, no keys in `.env.example`, `pod_provider_mapping` is empty). This spec builds the real transaction behind a mock payment adapter, the same pattern already used for design images (`public/t-shirt` stand-ins "until the image-gen adapter is wired up").

## Scope

In scope:
- `/design/[id]` real page: claimed-design read view, unclaimed-design claim form
- Claiming an **unclaimed** design: quality tier + placement + size selection, live price, mock payment, one atomic DB transaction (order + claim + storefront)
- Shared pricing logic (`lib/pricing.ts`) used by both the client preview and the server's authoritative price
- Mock payment adapter (`lib/payments/checkout.ts`)

Out of scope (future specs):
- Buying a *print* of an already-claimed design (resale) and the royalty payout it triggers — nothing today lets you do this anyway; `DesignCard` shows "View design," not "Buy," for claimed designs
- Shipping address capture — no fulfillment provider exists yet to consume it
- Share-image compositing background job (`docs/TRD.md`'s growth-loop trigger)
- Real Stripe Connect, real POD provider
- `/auctions` (Bid) and `/dashboard/create` (generation flow) — separate specs, next in queue

## Data model

New migration, `claim_design(p_design_id, p_quality_tier, p_size, p_placement_front, p_placement_back, p_amount_cents, p_payment_ref)`, a `security definer` Postgres function — same pattern as the existing `handle_new_user`/`notify_on_*` trigger functions, so no new client-facing INSERT policies are needed on `claims`/`orders`/`storefronts` (all three stay "server-function only," matching `docs/SECURITY.md`).

Transaction body:
1. Resolve buyer as `(select auth.uid())`; raise if not signed in.
2. `select is_claimed, moderation_status from designs where id = p_design_id for update` — row lock. Raise if not found, not `'approved'`, already claimed, or neither placement flag is set.
3. Insert `orders` (status `'paid'` directly — no `'pending'` state, since there's no async webhook yet).
4. Update `designs` set `is_claimed = true, claimed_by = buyer`.
5. Insert `claims` (design_id, claimant_id = buyer) — the unique constraint on `design_id` is a second guard against a concurrent double-claim, on top of the row lock in step 2.
6. Upsert `storefronts` (owner_id = buyer, slug = buyer's `profiles.handle`) `on conflict (owner_id) do nothing` — first-ever claim provisions it, later claims reuse it.
7. Return `(order_id, handle)` for the caller to redirect to `/creator/<handle>`.

`grant execute ... to authenticated` only (not `anon`).

No changes to existing tables beyond this function.

## Pricing (`lib/pricing.ts`)

Single source of truth, imported by both the client form (live total) and the server action (authoritative — the server never trusts a client-sent amount, it recomputes from the design's current `price_cents` plus the selected tier/placement):

- Base price = `designs.price_cents` (already shown on every `DesignCard`)
- Quality tier: `"everyday"` (+$0, "Soft cotton blend, everyday wear"), `"premium"` (+$10, "Heavyweight fabric, richer print detail")
- Placement: front-only included; both sides +$8
- Size: `S | M | L | XL | XXL`, no price effect

```ts
computeTotalCents(basePriceCents, qualityTier, placementFront, placementBack): number
```

## Payment adapter (`lib/payments/checkout.ts`)

```ts
type ChargeInput = { amountCents: number; buyerId: string; designId: string }
type ChargeResult = { paymentRef: string; status: "succeeded" }
async function charge(input: ChargeInput): Promise<ChargeResult>
```

Mock implementation always succeeds, `paymentRef` is `mock_pi_<uuid>`. This is the only file a real Stripe integration replaces later — same shape (amount in, a payment reference + status out), so nothing upstream changes.

## Pages & components

`lib/data/design.ts` — new module, `getDesignDetail(id)`: fetches the design (explicitly filtered to `moderation_status = 'approved'`, matching every other public query in this codebase even though the RLS policy itself is broad) plus vibe name and, if claimed, claimant handle. Returns `null` for not-found/unapproved → `notFound()`.

`app/(public)/design/[id]/page.tsx` — replaces the `ComingSoon` stub:
- Not found or unapproved → `notFound()`
- Claimed → image, vibe, price, "Claimed by @handle" + claimed date, link to `/creator/<handle>`. No purchase UI.
- Unclaimed, logged out → image + details, "Log in to claim" button → `/login` (no redirect param — matches `FollowButton`'s existing logged-out treatment)
- Unclaimed, logged in → `<ClaimForm design={...} />`

`components/design/ClaimForm.tsx` (client component) — quality tier `RadioGroup`, placement checkboxes (front default checked; submit disabled until at least one is checked), size `Select`, live total via `computeTotalCents`, submit button "Claim for $X". Uses `useTransition`, mirrors `FollowButton`'s pending-state pattern.

`app/(public)/design/[id]/actions.ts` — `claimDesign(designId, { qualityTier, size, placementFront, placementBack })`:
1. Get session user; not signed in → `{ ok: false, error: "Sign in to claim this design." }`
2. Re-fetch the design server-side, recompute the authoritative total via `computeTotalCents`
3. `charge(...)` (mock adapter)
4. `supabase.rpc("claim_design", { ...})`
5. Success → `redirect("/creator/" + handle)`
6. RPC error (race: someone else claimed it first) → `{ ok: false, error: "Someone just claimed this design." }` — a real, expected case, not a crash, so the action returns a result object instead of throwing

No `revalidatePath` calls needed: every page that shows claim state (`/`, `/shop`, `/creator/[handle]`) already reads through a cookie-based Supabase client, which Next.js treats as dynamic — no stale cache to bust.

## Testing

No test runner exists anywhere in this project (no jest/vitest, no `test` script). Verifying by hand with Playwright against the dev server, same as the seed-data verification earlier — not introducing a test framework for one feature.
