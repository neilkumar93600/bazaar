# Design Ownership & Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generated designs become private to their maker until the maker lists them free or priced; claiming transfers exclusive ownership and strips the maker of all further control.

**Architecture:** Three nullable columns on `designs` (`creator_id`, `listed_at`, and `price_cents` made nullable) replace the implicit "generated means published" model. The gate lives in RLS, not in query filters, because `designs` is read from the browser with the anon key. `claim_design` gains a listing check and reads the charged price from the locked row instead of trusting its caller.

**Tech Stack:** Next.js 16 (App Router, server actions, `after()`), React 19, Supabase (Postgres + RLS + PostgREST), TypeScript, Tailwind v4, Base UI primitives, Printify REST.

**Spec:** [docs/superpowers/specs/2026-08-09-design-ownership-listing-design.md](../specs/2026-08-09-design-ownership-listing-design.md)

## Global Constraints

- Money is **integer cents, USD**, everywhere. Never floats in the database.
- **`price_cents is null` means free.** It never means "unknown" or "not set yet". A design with `listed_at is null` may hold any price; it is not live, so the price is not a promise.
- **RLS is the gate.** Server actions must not re-check ownership — a second check that can drift from the policy is worse than one that cannot.
- Tests are `assert`-based, no framework, run with `npx tsx <path>.test.ts`. Follow `lib/generation/prompt.test.ts` exactly.
- Every commit must pass `npx next typegen && npm run typecheck && npm run lint`.
- Migration files are created with `supabase migration new <name>`. **Never hand-name one** — see "Migration hazard" in the spec: remote history holds 2 entries while `supabase/migrations/` holds 7, and the timestamps disagree.
- Never write a secret into a tracked file (`.mcp.json`, `.env.example`, any migration).
- Branch: `spec/design-ownership-listing` (already checked out).

---

### Task 1: Listing rules as pure functions

Price validation and claim eligibility, extracted so both are testable without a database. The SQL in Task 2 mirrors `claimEligibility` branch for branch, including the exact error strings — that mirroring is why this task comes first.

**Files:**
- Create: `lib/listing.ts`
- Test: `lib/listing.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ListingPrice = number | null`
  - `validateListingPrice(free: boolean, dollars: string): PriceValidation` where `PriceValidation = { ok: true; priceCents: ListingPrice } | { ok: false; error: string }`
  - `claimEligibility(row: ClaimRow, viewerId: string, expectedCents: ListingPrice): ClaimCheck` where `ClaimCheck = { ok: true } | { ok: false; error: string }`
  - `type ClaimRow = { listedAt: string | null; priceCents: ListingPrice; claimedBy: string | null; creatorId: string | null; moderationStatus: string }`
  - `MAX_PRICE_CENTS: number`

- [ ] **Step 1: Write the failing test**

Create `lib/listing.test.ts`:

```ts
/** Run: `npx tsx lib/listing.test.ts`
 *
 *  ponytail: assert-based, no framework. Two rules are worth guarding — the
 *  one that decides whether a design may go live, and the one that decides
 *  whether a claim may proceed. Both are money paths, and both are mirrored
 *  in SQL (claim_design), so a silent drift here is a silent drift there.
 */

import assert from "node:assert/strict"

import {
  claimEligibility,
  validateListingPrice,
  MAX_PRICE_CENTS,
  type ClaimRow,
} from "./listing"

// --- validateListingPrice -------------------------------------------------

// Free is a decision, not an empty field: the price box is ignored entirely.
assert.deepEqual(validateListingPrice(true, ""), { ok: true, priceCents: null })
assert.deepEqual(validateListingPrice(true, "29"), { ok: true, priceCents: null })

assert.deepEqual(validateListingPrice(false, "29"), { ok: true, priceCents: 2900 })
assert.deepEqual(validateListingPrice(false, "24.50"), { ok: true, priceCents: 2450 })
assert.deepEqual(validateListingPrice(false, " 24.5 "), { ok: true, priceCents: 2450 })
assert.deepEqual(validateListingPrice(false, "0.01"), { ok: true, priceCents: 1 })

// Zero is not free. A maker who wants free ticks the box; typing 0 is far more
// likely to be a half-finished thought than an intent to give it away.
assert.equal(validateListingPrice(false, "0").ok, false)
assert.equal(validateListingPrice(false, "0.00").ok, false)
assert.equal(validateListingPrice(false, "").ok, false)
assert.equal(validateListingPrice(false, "-5").ok, false)
// parseFloat("12abc") is 12 — the regex is what stops that reaching the DB.
assert.equal(validateListingPrice(false, "12abc").ok, false)
assert.equal(validateListingPrice(false, "abc").ok, false)
// Sub-cent precision has nowhere to go in an integer-cents column.
assert.equal(validateListingPrice(false, "12.555").ok, false)
assert.equal(validateListingPrice(false, String(MAX_PRICE_CENTS / 100 + 1)).ok, false)

// --- claimEligibility -----------------------------------------------------

const BUYER = "11111111-1111-1111-1111-111111111111"
const MAKER = "22222222-2222-2222-2222-222222222222"

const listed: ClaimRow = {
  listedAt: "2026-08-09T00:00:00Z",
  priceCents: 2900,
  claimedBy: null,
  creatorId: MAKER,
  moderationStatus: "approved",
}

assert.deepEqual(claimEligibility(listed, BUYER, 2900), { ok: true })

// Free listings claim at null, and null must compare equal to null.
assert.deepEqual(
  claimEligibility({ ...listed, priceCents: null }, BUYER, null),
  { ok: true },
)

// The listing gate. Without it a private design is claimable by anyone who
// learns its id, straight past the read policy.
assert.equal(claimEligibility({ ...listed, listedAt: null }, BUYER, 2900).ok, false)

assert.equal(
  claimEligibility({ ...listed, moderationStatus: "pending" }, BUYER, 2900).ok,
  false,
)
assert.equal(
  claimEligibility({ ...listed, claimedBy: BUYER }, BUYER, 2900).ok,
  false,
)
// A maker keeping a design means not listing it. Claiming their own listing
// would only charge them, and blocking it forecloses self-dealing once
// royalties are real money.
assert.equal(claimEligibility(listed, MAKER, 2900).ok, false)

// Price drift: the buyer saw one number, the row now holds another.
assert.equal(claimEligibility(listed, BUYER, 1900).ok, false)
assert.equal(claimEligibility(listed, BUYER, null).ok, false)
assert.equal(
  claimEligibility({ ...listed, priceCents: null }, BUYER, 2900).ok,
  false,
)

// House stock has no maker; a null creator must not match a null-ish viewer.
assert.deepEqual(
  claimEligibility({ ...listed, creatorId: null }, BUYER, 2900),
  { ok: true },
)

console.log("lib/listing.test.ts ok")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx tsx lib/listing.test.ts
```

Expected: FAIL — `Cannot find module './listing'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/listing.ts`:

```ts
/** The two rules that decide whether a design may go live and whether a claim
 *  may proceed.
 *
 *  Pure and database-free on purpose: `claim_design` (SQL) mirrors
 *  `claimEligibility` branch for branch, error string for error string, and a
 *  mirror you cannot test is a mirror that drifts. The SQL version is the one
 *  that actually enforces it — it runs inside the row lock — but this is where
 *  the rule is written down and checked.
 */

/** Free is `null`, never `0`. Zero would make "the maker gave it away" and
 *  "the maker typed nothing" the same value. */
export type ListingPrice = number | null

/** A bound, not a business rule — it stops a fat finger becoming a $9,000,000
 *  listing, nothing more. */
export const MAX_PRICE_CENTS = 100_000_00

export type PriceValidation =
  | { ok: true; priceCents: ListingPrice }
  | { ok: false; error: string }

/** `dollars` is the raw string off the form. Cents conversion happens here,
 *  once, at the edge — everything downstream is integer cents. */
export function validateListingPrice(
  free: boolean,
  dollars: string
): PriceValidation {
  if (free) return { ok: true, priceCents: null }

  const trimmed = dollars.trim()
  if (trimmed === "") {
    return { ok: false, error: "Enter a price, or tick Free." }
  }

  // Not `parseFloat`: it happily reads "12abc" as 12 and "1e3" as 1000. A
  // price is a plain decimal with at most two places or it is a typo.
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Enter a price like 29 or 24.50." }
  }

  const cents = Math.round(Number(trimmed) * 100)

  if (cents <= 0) {
    return {
      ok: false,
      error: "A price has to be more than zero. Tick Free to give it away.",
    }
  }
  if (cents > MAX_PRICE_CENTS) {
    return { ok: false, error: "That price is too high." }
  }

  return { ok: true, priceCents: cents }
}

export type ClaimRow = {
  listedAt: string | null
  priceCents: ListingPrice
  claimedBy: string | null
  creatorId: string | null
  moderationStatus: string
}

export type ClaimCheck = { ok: true } | { ok: false; error: string }

/** `expectedCents` is the price the buyer was shown. It is compared, never
 *  charged — the amount charged always comes from the row. A client that lies
 *  here can only make its own claim fail. */
export function claimEligibility(
  row: ClaimRow,
  viewerId: string,
  expectedCents: ListingPrice
): ClaimCheck {
  if (row.moderationStatus !== "approved") {
    return { ok: false, error: "Design not available." }
  }
  // Same message as the moderation branch on purpose: an unlisted design must
  // not be distinguishable from a nonexistent one by a stranger probing ids.
  if (row.listedAt === null) {
    return { ok: false, error: "Design not available." }
  }
  if (row.claimedBy !== null) {
    return { ok: false, error: "Someone just claimed this design." }
  }
  if (row.creatorId !== null && row.creatorId === viewerId) {
    return { ok: false, error: "You made this design." }
  }
  if (row.priceCents !== expectedCents) {
    return { ok: false, error: "The price changed. Refresh and try again." }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx tsx lib/listing.test.ts
```

Expected: PASS — prints `lib/listing.test.ts ok`.

- [ ] **Step 5: Typecheck and lint**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/listing.ts lib/listing.test.ts
git commit -m "feat: listing price validation and claim eligibility rules"
```

---

### Task 2: Free prices render before they can exist

Make every price surface accept `number | null` and render `Free`, **before** the migration can produce a null. Nothing changes visually yet — no row has a null price — so this task is purely additive and independently safe to ship.

**Files:**
- Modify: `lib/utils.ts` (add `formatListingPrice`)
- Modify: `lib/data/design.ts:17` (`priceCents` type)
- Modify: `components/shared/DesignCard.tsx:22,142`
- Modify: `components/design/DesignDetailContent.tsx:47`
- Modify: `components/design/ClaimForm.tsx:14,39`
- Modify: `app/(public)/design/[id]/page.tsx:18`

**Interfaces:**
- Consumes: `ListingPrice` from Task 1.
- Produces: `formatListingPrice(cents: number | null): string` in `lib/utils.ts`; `DesignCardData.priceCents` and `DesignDetail.priceCents` widen to `number | null`.

- [ ] **Step 1: Add the formatter**

In `lib/utils.ts`, after the existing `formatCents`:

```ts
/** Listing price for display. `null` is free — a deliberate choice by the
 *  maker, not a missing value, so it renders as a word rather than "$0.00". */
export function formatListingPrice(cents: number | null) {
  return cents === null ? "Free" : CURRENCY_FORMAT.format(cents / 100)
}
```

Leave `formatCents` alone — royalties and order amounts are always real numbers.

- [ ] **Step 2: Widen the data types**

`lib/data/design.ts:17` — change `priceCents: number` to:

```ts
  /** Null means the maker listed it free. */
  priceCents: number | null
```

`components/shared/DesignCard.tsx:22` — change `priceCents: number` to:

```ts
  /** Null means free. */
  priceCents: number | null
```

- [ ] **Step 3: Render the free case**

`components/shared/DesignCard.tsx:142` — replace

```tsx
          {priceFormatter.format(design.priceCents / 100)}
```

with

```tsx
          {design.priceCents === null
            ? "Free"
            : priceFormatter.format(design.priceCents / 100)}
```

`components/design/DesignDetailContent.tsx` — `formatCents` appears exactly twice in this file (the import on line 6, the call on line 47), so swap both outright: line 6 becomes `import { formatListingPrice } from "@/lib/utils"` and line 47 becomes `{formatListingPrice(design.priceCents)}`.

`components/design/ClaimForm.tsx` — line 14 `priceCents: number` becomes `priceCents: number | null`; line 5 import `formatListingPrice` instead of `formatCents`; line 39 becomes:

```tsx
        {isPending
          ? "Claiming…"
          : priceCents === null
            ? "Claim it — free"
            : `Claim for ${formatListingPrice(priceCents)}`}
```

`app/(public)/design/[id]/page.tsx` — same two-line swap: line 6 becomes `import { formatListingPrice } from "@/lib/utils";` and line 18's `${formatCents(design.priceCents)}` becomes `${formatListingPrice(design.priceCents)}`. `formatCents` appears nowhere else in this file.

- [ ] **Step 4: Verify nothing broke**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean. No behaviour change — no row has a null price yet.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts lib/data/design.ts components/shared/DesignCard.tsx components/design/DesignDetailContent.tsx components/design/ClaimForm.tsx "app/(public)/design/[id]/page.tsx"
git commit -m "feat: render a null design price as Free"
```

---

### Task 3: The migration

Schema, backfill, both RLS gates, the revoked grants, and the `claim_design` rewrite — **one migration**. They must land together: a listing column without the `claim_design` gate is a window where designs are private but claimable by id.

**Files:**
- Create: `supabase/migrations/<generated>_design_ownership_listing.sql`

**Interfaces:**
- Consumes: the branch order and error strings from `claimEligibility` (Task 1).
- Produces: `designs.creator_id`, `designs.listed_at`, nullable `designs.price_cents`; policies `designs_select_listed`, `designs_update_creator_unclaimed`, `designs_update_claimant`; `public.claim_design(uuid, integer, text)` with second parameter renamed to `p_expected_cents`.

- [ ] **Step 1: Create the file with the CLI**

```bash
npx supabase migration new design_ownership_listing
```

Note the generated filename. **Do not invent one** — remote history and the local directory already disagree, and a hand-picked timestamp can sort before the applied `20260809124800`.

- [ ] **Step 2: Write the migration**

```sql
-- Ownership and listing. Generation stops being publication: a design is
-- private to its maker until they list it, free or priced, and the maker loses
-- every right to it the moment somebody claims it.
--
-- The gate is RLS, not query filters. `designs` is read from the browser with
-- the anon key (the create page polls it), so a filter that lives only in
-- lib/data/* leaves every private row readable straight from PostgREST.

-- 1. Columns -----------------------------------------------------------------

alter table public.designs
  add column creator_id uuid references public.profiles(id),
  add column listed_at  timestamptz;

comment on column public.designs.creator_id is
  'Who generated this design. Paid once at claim, then out — no royalties, no control.';
comment on column public.designs.listed_at is
  'When it went live in the bazaar. Null means private: freshly generated, or delisted.';

-- 2. Price becomes optional: null means the maker listed it free -------------
--
-- The 2900 default goes too. A listed design must have had a price decided,
-- and free is a decision; defaulting into a number hides the difference
-- between "the maker chose $29.00" and "nobody chose anything".

alter table public.designs alter column price_cents drop not null;
alter table public.designs alter column price_cents drop default;
alter table public.designs drop constraint designs_price_cents_positive;
alter table public.designs
  add constraint designs_price_cents_positive
    check (price_cents is null or price_cents > 0);

-- 3. Backfill ----------------------------------------------------------------
--
-- Every existing design stays exactly as visible as it was. Seeded rows have
-- no generation job and so no maker; they are house stock and creator_id
-- stays null, which the claim gate handles (`creator_id is not null and ...`).

update public.designs d
set creator_id = j.user_id
from public.generation_jobs j
where j.id = d.generation_job_id
  and d.creator_id is null;

update public.designs
set listed_at = created_at
where listed_at is null;

create index designs_creator_id_idx on public.designs (creator_id);
create index designs_listed_at_idx on public.designs (listed_at desc)
  where listed_at is not null;

-- 4. Read gate ---------------------------------------------------------------
--
-- Anon carries auth.uid() = null, so this collapses to "listed only". A maker
-- keeps seeing their own drafts; an owner keeps seeing a design they delist.

drop policy "designs_select_public" on public.designs;

create policy "designs_select_listed" on public.designs
  for select using (
    listed_at is not null
    or (select auth.uid()) = creator_id
    or (select auth.uid()) = claimed_by
  );

-- 5. generation_jobs public read is now both redundant and a leak ------------
--
-- It gated on moderation_status = 'approved', but privacy now comes from
-- listed_at and a private design is still 'approved'. Left in place it hands
-- anon the ids and maker ids of every unlisted design. It existed only to
-- attribute a design to its creator, which designs.creator_id now answers.

drop policy "generation_jobs_select_public_result" on public.generation_jobs;

-- 6. Write gate --------------------------------------------------------------
--
-- "The maker has nothing to do with it after a claim" is enforced here: the
-- instant claimed_by is set, the maker's policy stops matching. Both policies
-- carry USING and WITH CHECK — without WITH CHECK a user could reassign a
-- row's creator_id or claimed_by to somebody else.

drop policy "designs_update_owner" on public.designs;

create policy "designs_update_creator_unclaimed" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = creator_id and claimed_by is null)
  with check ((select auth.uid()) = creator_id and claimed_by is null);

create policy "designs_update_claimant" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = claimed_by)
  with check ((select auth.uid()) = claimed_by);

-- 7. Trigger functions are not HTTP endpoints --------------------------------
--
-- Postgres grants EXECUTE to PUBLIC on every new function, and the init
-- migration never revoked it, so every one of these SECURITY DEFINER trigger
-- functions is callable by anon via /rest/v1/rpc. Flagged by the security
-- advisor; notify_on_claim and notify_on_royalty sit on the path this
-- migration rewrites.

revoke execute on function
  public.handle_new_user(),
  public.handle_new_profile(),
  public.notify_on_claim(),
  public.notify_on_message(),
  public.notify_on_order_status_change(),
  public.notify_on_royalty(),
  public.rls_auto_enable()
from public, anon, authenticated;

-- 8. claim_design ------------------------------------------------------------
--
-- Dropped and recreated rather than replaced: CREATE OR REPLACE cannot rename
-- an input parameter, and p_amount_cents becomes p_expected_cents.
--
-- The rename is the point. The caller used to pass the amount to record; it
-- now passes the price the buyer was *shown*, and the row's own price is what
-- gets written. A maker editing the price between page render and claim can no
-- longer cause a buyer to be charged one number while the order records
-- another — the claim fails and the buyer retries against the real price.
--
-- Branch order and error strings mirror claimEligibility() in lib/listing.ts.

drop function if exists public.claim_design(uuid, integer, text);

create function public.claim_design(
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- these checks. claims.design_id being unique is the backstop if they did.
  select * into v_design
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;

  if v_design.moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;

  -- Same message as the branch above, deliberately: an unlisted design must
  -- not be distinguishable from a nonexistent one by a stranger probing ids.
  if v_design.listed_at is null then
    raise exception 'Design not available.';
  end if;

  if v_design.is_claimed or v_design.claimed_by is not null then
    raise exception 'Someone just claimed this design.';
  end if;

  -- Null creator_id (house stock) makes this comparison null, so the branch is
  -- not taken — which is correct: house stock has no maker to exclude.
  if v_design.creator_id = v_buyer then
    raise exception 'You made this design.';
  end if;

  -- `is distinct from`, not `<>`: a free design compares null against null,
  -- and `null <> null` is null, which would fall through the check.
  if v_design.price_cents is distinct from p_expected_cents then
    raise exception 'The price changed. Refresh and try again.';
  end if;

  -- coalesce: a free claim records a real order for zero. orders.amount_cents
  -- has no positivity constraint, so this needs no schema change.
  insert into public.orders (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status)
  values (v_buyer, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = v_buyer
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, v_buyer);

  select p.handle into v_handle from public.profiles p where p.id = v_buyer;

  insert into public.storefronts (owner_id, slug)
  values (v_buyer, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

-- PUBLIC gets EXECUTE by default; the whole point of the grant below is that
-- only signed-in callers reach it.
revoke execute on function public.claim_design(uuid, integer, text) from public;
grant  execute on function public.claim_design(uuid, integer, text) to authenticated;
```

- [ ] **Step 3: Apply it**

Use the Supabase MCP `apply_migration` tool with the migration name `design_ownership_listing` and the SQL above. **Do not run `supabase db push`** — remote migration history is out of sync with the local directory (spec, "Migration hazard").

- [ ] **Step 4: Verify the schema landed**

Via MCP `execute_sql`:

```sql
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'designs'
  and column_name in ('creator_id', 'listed_at', 'price_cents')
order by column_name;
```

Expected: `creator_id` YES/null, `listed_at` YES/null, `price_cents` **YES**/null (was `NO`/`2900`).

```sql
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('designs', 'generation_jobs')
order by tablename, policyname;
```

Expected on `designs`: `designs_select_listed`, `designs_update_claimant`, `designs_update_creator_unclaimed`. Expected on `generation_jobs`: `generation_jobs_owner_all` **only** — `generation_jobs_select_public_result` must be gone.

```sql
select count(*) filter (where listed_at is null) as unlisted,
       count(*) filter (where creator_id is null) as no_creator,
       count(*) as total
from public.designs;
```

Expected: `unlisted = 0` (every pre-existing design stayed visible).

- [ ] **Step 5: Verify the read gate actually denies anon**

The policy is the whole security story, so test it as the anon role rather than trusting the DDL. Via MCP `execute_sql`:

```sql
-- Take any design, hide it, and confirm the anon role cannot see it.
begin;
  update public.designs set listed_at = null
  where id = (select id from public.designs limit 1);

  set local role anon;
  select count(*) as visible_to_anon from public.designs where listed_at is null;
rollback;
```

Expected: `visible_to_anon = 0`. The `rollback` puts the row back — do not skip it, and send the block as **one** statement so the rollback cannot be orphaned. If the tool refuses a multi-statement body, run the same thing through `psql` instead; do not run the `update` on its own.

- [ ] **Step 6: Re-run the security advisor**

Use MCP `get_advisors` with `type: "security"`.

Expected: the seven `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` warnings are gone. Still expected and **not** in scope: `auth_leaked_password_protection` (an Auth dashboard toggle) and `rls_enabled_no_policy` on `pod_provider_mapping` (correct default-deny).

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): private-by-default designs, maker listing control, claim gate

Adds designs.creator_id and designs.listed_at, makes price_cents nullable
(null = free), and replaces the blanket select policy with one that shows
unlisted rows only to their maker or owner.

Drops generation_jobs_select_public_result: it gated on moderation_status,
which no longer implies public, so it would have leaked unlisted design ids
to anon.

Revokes EXECUTE from PUBLIC on seven SECURITY DEFINER trigger functions that
were callable over /rest/v1/rpc.

claim_design now refuses unlisted designs, refuses the maker claiming their
own, and takes the price the buyer was shown as p_expected_cents — the amount
charged comes from the locked row, so a price edit mid-claim fails the claim
instead of mischarging."
```

---

### Task 4: Public surfaces show only listed designs

RLS hides unlisted designs from *other* people. This filter is what stops a **maker** seeing their own private drafts scattered through the public feed, `/shop`, and their own storefront.

`lib/data/design.ts` is deliberately **not** filtered: RLS already scopes it, and a maker must be able to open their own unlisted design's detail page in order to list it. (The spec said to filter it; the spec was wrong. Same rule, better placement.)

**Files:**
- Modify: `lib/data/feed.ts:53-54`
- Modify: `lib/data/bazaar.ts:86-88, 102-105`
- Modify: `lib/data/storefront.ts:75-78, 118-131`

**Interfaces:**
- Consumes: `designs.listed_at`, `designs.creator_id` (Task 3).
- Produces: nothing new.

- [ ] **Step 1: Filter the home feed**

`lib/data/feed.ts` — in the `designs` query, after `.eq("moderation_status", "approved")`:

```ts
      .eq("moderation_status", "approved")
      // RLS hides other people's unlisted designs; this hides the viewer's own.
      .not("listed_at", "is", null)
```

- [ ] **Step 2: Filter both bazaar queries**

`lib/data/bazaar.ts` — the facet-count query (around line 86):

```ts
      let q = supabase
        .from("designs")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "approved")
        .not("listed_at", "is", null)
        .eq("vibe_id", vibe.id)
```

and the main design query (around line 102):

```ts
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)
```

Both are required — a facet count that includes unlisted designs would advertise a filter that returns fewer rows than it promises.

- [ ] **Step 3: Filter the storefront's claimed designs**

`lib/data/storefront.ts` (around line 75) — an owner who delists a design they own must not keep showing it publicly:

```ts
        .select("id, image_url, mockup_url, vibe_id, price_cents, created_at")
        .in("id", designIds)
        .eq("moderation_status", "approved")
        .not("listed_at", "is", null)
```

- [ ] **Step 4: Replace the storefront's created-designs lookup**

`lib/data/storefront.ts` around lines 118-131 currently fetches this profile's `generation_jobs` ids and then queries `designs` by `generation_job_id`. `creator_id` answers that directly. Delete the `jobRows` / `jobIds` block and replace the `createdRows` query with:

```ts
  // Designs this profile made — independent of who (if anyone) claimed them.
  // creator_id replaces the old two-step hop through generation_jobs.
  const { data: createdRows } = await supabase
    .from("designs")
    .select(
      "id, image_url, mockup_url, vibe_id, price_cents, created_at, is_claimed, claimed_by"
    )
    .eq("creator_id", profile.id)
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)
    .order("created_at", { ascending: false })
```

Delete the now-unused `jobRows` and `jobIds` declarations. The query previously sat behind a `jobIds.length ? … : { data: [] }` ternary and now always runs, so `createdRows` is `T[] | null` instead of `T[] | never[]` — the existing `(createdRows ?? [])` guards downstream already cover that and must stay.

- [ ] **Step 5: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean, with no unused-variable errors from the deleted `jobIds` block.

- [ ] **Step 6: Commit**

```bash
git add lib/data/feed.ts lib/data/bazaar.ts lib/data/storefront.ts
git commit -m "feat: public surfaces show only listed designs

RLS already hides other people's unlisted designs. These filters are what stop
a maker seeing their own drafts in the feed, /shop and their own storefront.
Design detail is deliberately unfiltered so a maker can open a draft to list
it. Storefront's created-designs query drops its generation_jobs hop for
designs.creator_id."
```

---

### Task 5: Generation produces private designs

**Files:**
- Modify: `app/api/generate/route.ts:87-92, 105-160`
- Modify: `scripts/generate-designs.ts:264-282`

**Interfaces:**
- Consumes: `designs.creator_id`, `designs.listed_at` (Task 3).
- Produces: `runGeneration(jobId: string, userId: string, userPrompt: string, vibeName: string | null, vibeId: string | null): Promise<void>` — parameter added in second position.

- [ ] **Step 1: Pass the user id into the worker**

`app/api/generate/route.ts` — update the `after()` call:

```ts
  after(async () => {
    await runGeneration(job.id, user.id, prompt, vibe?.name ?? null, vibe?.id ?? null)
  })
```

and the signature:

```ts
async function runGeneration(
  jobId: string,
  userId: string,
  userPrompt: string,
  vibeName: string | null,
  vibeId: string | null,
) {
```

- [ ] **Step 2: Insert the design private**

Replace the `designs` insert body:

```ts
      .insert({
        vibe_id: vibeId,
        generation_job_id: jobId,
        creator_id: userId,
        image_url: publicUrl,
        prompt: userPrompt,
        // Private until the maker lists it. Generation is no longer
        // publication: listed_at stays null, and price_cents stays null
        // because free and priced are both decisions the maker has not made
        // yet — see docs/superpowers/specs/2026-08-09-design-ownership-listing-design.md
        listed_at: null,
        price_cents: null,
        // Auto-approved by design decision — the model refuses policy
        // violations at source and there is no review queue.
        moderation_status: "approved",
      })
```

- [ ] **Step 3: Stop minting a Printify product at generation**

Delete the `await syncDesignProduct(design.id)` call and its comment block from `runGeneration`, and delete the `import { syncDesignProduct } from "@/lib/printify/sync"` line at the top of the file.

Reason to record in the commit, not a comment: minting at generation pays to create Printify products for designs nobody will ever list, and sub-project B turns one generation into four. It moves to the list action in Task 6.

- [ ] **Step 4: Keep the house-stock script listing its output**

`scripts/generate-designs.ts` — the script exists to stock the bazaar, so its designs go straight to live. In the `designs` insert (around line 264):

```ts
    const design = await db.insert<{ id: string }>("designs", {
      vibe_id: vibe.id,
      generation_job_id: job.id,
      creator_id: owner.id,
      image_url: imageUrl,
      prompt: idea,
      price_cents: priceCents,
      // House stock is generated *in order to* be listed — unlike the create
      // flow, where the maker decides. Straight to live.
      listed_at: new Date().toISOString(),
      moderation_status: "approved",
    })
```

Leave the script's `syncDesignProduct(design.id)` call in place: it lists immediately, so minting immediately is correct here.

- [ ] **Step 5: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add app/api/generate/route.ts scripts/generate-designs.ts
git commit -m "feat: generated designs land private, not published

Generation writes creator_id and leaves listed_at/price_cents null — the maker
decides. Printify minting moves out of generation and into the list action:
minting here pays to create products for designs nobody lists, and the 2x2
grid in sub-project B would make that four per job.

The house-stock script still lists and mints immediately; it exists to stock
the bazaar."
```

---

### Task 6: List and delist

**Files:**
- Create: `app/dashboard/designs/actions.ts`
- Modify: `lib/printify/sync.ts:17-34, 42, 61`

**Interfaces:**
- Consumes: `validateListingPrice` (Task 1), `designs.listed_at` (Task 3).
- Produces:
  - `listDesign(designId: string, free: boolean, dollars: string): Promise<{ error?: string }>`
  - `delistDesign(designId: string): Promise<{ error?: string }>`

- [ ] **Step 1: Teach the Printify sync about free designs**

`lib/printify/sync.ts` — `createDesignProduct` takes `priceCents: number` and `design.price_cents` is now nullable. The two prices are different concepts: the design's price is what a *claimer* pays for ownership; Printify's variant price is what a *garment buyer* pays. Sub-project D separates them properly. Until then, a fallback:

Add near the top of the file:

```ts
/** What the Printify product's variants are priced at when the design itself
 *  carries no price (the maker listed it free).
 *
 *  These are different prices wearing the same name: designs.price_cents is
 *  what a claimer pays for *ownership*; this is what a buyer pays for a
 *  *garment*. Sub-project D gives the garment its own price and this constant
 *  goes away. Until then, free ownership must not mean a free t-shirt.
 *
 *  ponytail: one constant, not a config table — there is exactly one garment
 *  price in the system today. */
const FALLBACK_GARMENT_PRICE_CENTS = 2900
```

and change line 61 to:

```ts
      priceCents: design.price_cents ?? FALLBACK_GARMENT_PRICE_CENTS,
```

Update the doc comment on `syncDesignProduct` — the paragraph beginning "Runs at generation, not at claim." is now false. Replace that paragraph with:

```
 *  Runs at listing, not at generation: a design that is never listed never
 *  needs a product, and minting one costs an API call per design. Printify
 *  bills on order, not on product creation, so a listed-but-unsold product
 *  costs nothing. The claim path calls this too, which is a no-op once a
 *  product exists and backfills anything listed while Printify was
 *  unconfigured.
```

- [ ] **Step 2: Write the actions**

Create `app/dashboard/designs/actions.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { validateListingPrice } from "@/lib/listing"
import { syncDesignProduct } from "@/lib/printify/sync"

export type ListingState = { error?: string }

/** Puts a design in the bazaar, free or priced.
 *
 *  There is no ownership check here on purpose. `designs_update_creator_unclaimed`
 *  already restricts this UPDATE to the maker, and only while nobody owns it —
 *  a second check in application code is one more thing that can drift out of
 *  agreement with the policy. A caller who is not the maker updates zero rows
 *  and gets told so.
 */
export async function listDesign(
  designId: string,
  free: boolean,
  dollars: string
): Promise<ListingState> {
  const price = validateListingPrice(free, dollars)
  if (!price.ok) return { error: price.error }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("designs")
    .update({ listed_at: new Date().toISOString(), price_cents: price.priceCents })
    .eq("id", designId)
    .select("id")

  if (error) return { error: "Could not list this design." }
  // Zero rows means RLS refused: not the maker, or somebody already claimed it.
  if (!data || data.length === 0) {
    return { error: "This design can't be listed any more." }
  }

  // Past the response: minting a Printify product is several network hops and
  // the design is already live without one — every surface falls back to the
  // drawn mockup. Swallows its own failures.
  after(async () => {
    await syncDesignProduct(designId)
  })

  revalidatePath("/dashboard/designs")
  return {}
}

/** Pulls a design back out of the bazaar. `price_cents` is left as it was so
 *  the relist form can pre-fill it; an unlisted price is not a promise to
 *  anyone. */
export async function delistDesign(designId: string): Promise<ListingState> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("designs")
    .update({ listed_at: null })
    .eq("id", designId)
    .select("id")

  if (error) return { error: "Could not delist this design." }
  if (!data || data.length === 0) {
    return { error: "This design can't be delisted any more." }
  }

  revalidatePath("/dashboard/designs")
  return {}
}
```

- [ ] **Step 3: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/designs/actions.ts lib/printify/sync.ts
git commit -m "feat: list and delist a design

Printify minting moves here from generation. Ownership is enforced by RLS
alone — a zero-row update is the refusal — so the actions carry no second
ownership check to drift out of agreement with the policy.

syncDesignProduct falls back to a fixed garment price for free designs;
ownership price and garment price are different things wearing one column,
which sub-project D untangles."
```

---

### Task 7: The maker's designs page

Three groups: Unlisted, Listed, Adopted. A claimed design leaves everything actionable but stays visible read-only — a maker who cannot see that their design sold cannot see that they were paid.

**Files:**
- Modify: `lib/data/my-designs.ts` (full rewrite)
- Create: `components/dashboard/ListingForm.tsx`
- Modify: `app/dashboard/designs/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `listDesign`, `delistDesign` (Task 6); `formatListingPrice`, `formatCents` (Task 2).
- Produces: `getMyDesigns(): Promise<MyDesigns | null>` where

```ts
type MakerDesign = {
  id: string
  imageUrl: string
  vibeName: string | null
  createdAt: string
  priceCents: number | null
  listedAt: string | null
}
type AdoptedDesign = MakerDesign & { claimantHandle: string | null; soldForCents: number }
type MyDesigns = { unlisted: MakerDesign[]; listed: MakerDesign[]; adopted: AdoptedDesign[] }
```

- [ ] **Step 1: Rewrite the data module**

Replace the whole of `lib/data/my-designs.ts`:

```ts
import { createClient } from "@/lib/supabase/server"

export type MakerDesign = {
  id: string
  imageUrl: string
  vibeName: string | null
  createdAt: string
  /** Null means listed free, or never priced. */
  priceCents: number | null
  listedAt: string | null
}

export type AdoptedDesign = MakerDesign & {
  claimantHandle: string | null
  /** What the claimer actually paid. Zero for a free claim. */
  soldForCents: number
}

export type MyDesigns = {
  unlisted: MakerDesign[]
  listed: MakerDesign[]
  adopted: AdoptedDesign[]
}

/** Everything this user made, split by what they can still do with it.
 *
 *  Claimed designs move to `adopted` and lose every control — that is the
 *  ownership rule, and it is enforced by RLS, not by this grouping. The
 *  grouping exists so the page doesn't offer buttons that would fail. */
export async function getMyDesigns(): Promise<MyDesigns | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from("designs")
    .select("id, image_url, vibe_id, created_at, price_cents, listed_at, claimed_by")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  const designs = rows ?? []
  if (designs.length === 0) return { unlisted: [], listed: [], adopted: [] }

  const vibeIds = [
    ...new Set(
      designs.map((d) => d.vibe_id).filter((id): id is string => id !== null)
    ),
  ]
  const claimantIds = [
    ...new Set(
      designs.map((d) => d.claimed_by).filter((id): id is string => id !== null)
    ),
  ]
  const soldIds = designs.filter((d) => d.claimed_by !== null).map((d) => d.id)

  const [{ data: vibeRows }, { data: claimantRows }, { data: orderRows }] =
    await Promise.all([
      vibeIds.length
        ? supabase.from("vibes").select("id, name").in("id", vibeIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      claimantIds.length
        ? supabase.from("profiles").select("id, handle").in("id", claimantIds)
        : Promise.resolve({ data: [] as { id: string; handle: string }[] }),
      soldIds.length
        ? supabase
            .from("orders")
            .select("design_id, amount_cents")
            .in("design_id", soldIds)
            .eq("status", "paid")
        : Promise.resolve({
            data: [] as { design_id: string; amount_cents: number }[],
          }),
    ])

  const vibeNameById = new Map((vibeRows ?? []).map((v) => [v.id, v.name]))
  const handleById = new Map((claimantRows ?? []).map((p) => [p.id, p.handle]))
  const soldForByDesignId = new Map(
    (orderRows ?? []).map((o) => [o.design_id, o.amount_cents])
  )

  const base = (d: (typeof designs)[number]): MakerDesign => ({
    id: d.id,
    imageUrl: d.image_url,
    vibeName: d.vibe_id ? (vibeNameById.get(d.vibe_id) ?? null) : null,
    createdAt: d.created_at,
    priceCents: d.price_cents,
    listedAt: d.listed_at,
  })

  return {
    unlisted: designs
      .filter((d) => d.claimed_by === null && d.listed_at === null)
      .map(base),
    listed: designs
      .filter((d) => d.claimed_by === null && d.listed_at !== null)
      .map(base),
    adopted: designs
      .filter((d) => d.claimed_by !== null)
      .map((d) => ({
        ...base(d),
        claimantHandle: d.claimed_by
          ? (handleById.get(d.claimed_by) ?? null)
          : null,
        soldForCents: soldForByDesignId.get(d.id) ?? 0,
      })),
  }
}
```

The three filters are mutually exclusive and exhaustive over `designs`: a row
is adopted (`claimed_by !== null`), or unclaimed and listed, or unclaimed and
unlisted. Nothing can appear twice, and nothing can vanish.

- [ ] **Step 2: Write the listing form**

Create `components/dashboard/ListingForm.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"

import { listDesign, delistDesign } from "@/app/dashboard/designs/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** List / relist / delist for one design.
 *
 *  Validation runs server-side in `listDesign` and the error comes back as a
 *  string — the client does not re-implement the rule, so there is only one
 *  copy of it to be wrong. */
export function ListingForm({
  designId,
  isListed,
  priceCents,
}: {
  designId: string
  isListed: boolean
  /** Pre-fills the box on a relist: the maker confirms the old number rather
   *  than silently inheriting one they set weeks ago. */
  priceCents: number | null
}) {
  const [free, setFree] = useState(priceCents === null && isListed)
  const [dollars, setDollars] = useState(
    priceCents === null ? "" : (priceCents / 100).toString()
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const priceFieldId = `price-${designId}`
  const freeFieldId = `free-${designId}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={freeFieldId}
          checked={free}
          onCheckedChange={(checked) => setFree(checked === true)}
          disabled={isPending}
        />
        <Label htmlFor={freeFieldId} className="text-caption">
          Free to claim
        </Label>
      </div>

      {!free && (
        <div className="flex flex-col gap-1">
          <Label htmlFor={priceFieldId} className="sr-only">
            Price in dollars
          </Label>
          <Input
            id={priceFieldId}
            inputMode="decimal"
            placeholder="29.00"
            value={dollars}
            onChange={(event) => setDollars(event.target.value)}
            disabled={isPending}
          />
        </div>
      )}

      {error && <p className="text-caption text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ember"
          disabled={isPending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await listDesign(designId, free, dollars)
              if (result.error) setError(result.error)
            })
          }}
        >
          {isListed ? "Update listing" : "Make it live"}
        </Button>

        {isListed && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await delistDesign(designId)
                if (result.error) setError(result.error)
              })
            }}
          >
            Delist
          </Button>
        )}
      </div>
    </div>
  )
}
```

`components/ui/button.tsx` defines `size: "sm"` and `variant: "ember"` — both used above are real, no substitutes needed.

- [ ] **Step 3: Rewrite the page**

Replace `app/dashboard/designs/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShirtIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { getMyDesigns, type MakerDesign } from "@/lib/data/my-designs";
import { formatCents, formatListingPrice } from "@/lib/utils";
import { ListingForm } from "@/components/dashboard/ListingForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "My designs" };

function DesignFrame({ design }: { design: MakerDesign }) {
  return (
    <Link
      href={`/design/${design.id}`}
      className="group relative block outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="glass-surface relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-card">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          className="object-cover"
        />
        {design.vibeName && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            {design.vibeName}
          </Badge>
        )}
      </div>
    </Link>
  );
}

export default async function DesignsPage() {
  const groups = await getMyDesigns();

  if (!groups) return null;

  const total =
    groups.unlisted.length + groups.listed.length + groups.adopted.length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-heading-lg text-foreground">My designs</h1>
        <Button render={<Link href="/dashboard/create" />}>
          Create a design
        </Button>
      </div>

      {total === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShirtIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing made yet</EmptyTitle>
            <EmptyDescription>
              Designs you generate stay private to you until you list them.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/dashboard/create" />}>
              Create a design
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {groups.unlisted.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Unlisted</h2>
                <p className="text-caption text-muted-foreground">
                  Only you can see these. List one to put it in the bazaar.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.unlisted.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <ListingForm
                      designId={design.id}
                      isListed={false}
                      priceCents={design.priceCents}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.listed.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Listed</h2>
                <p className="text-caption text-muted-foreground">
                  Live in the bazaar. Anyone can claim these.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.listed.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <span className="px-0.5 font-mono text-body-sm text-gold-leaf">
                      {formatListingPrice(design.priceCents)}
                    </span>
                    <ListingForm
                      designId={design.id}
                      isListed
                      priceCents={design.priceCents}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.adopted.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Adopted</h2>
                <p className="text-caption text-muted-foreground">
                  Claimed by someone else. These are theirs now — you keep the
                  record, not the design.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.adopted.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <span className="truncate text-caption text-muted-foreground">
                        {design.claimantHandle
                          ? `@${design.claimantHandle}`
                          : "Claimed"}
                        {" · "}
                        {formatDistanceToNowStrict(new Date(design.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="shrink-0 text-body-sm font-medium text-foreground">
                        {formatCents(design.soldForCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean. `Stagger`, `StaggerItem` and `TiltCard` imports are gone from the page — confirm no unused-import errors remain.

- [ ] **Step 5: Commit**

```bash
git add lib/data/my-designs.ts components/dashboard/ListingForm.tsx app/dashboard/designs/page.tsx
git commit -m "feat: maker designs page splits unlisted, listed and adopted

Keyed on designs.creator_id, so the page shows what this user *made* rather
than what they claimed. A claimed design loses every control and moves to
Adopted, which is read-only: hiding it entirely would hide the fact that they
were paid."
```

---

### Task 8: Claim honours listing, free and price drift

**Files:**
- Modify: `app/(public)/design/[id]/actions.ts:27-74`
- Modify: `components/design/ClaimForm.tsx` (pass the price through)

**Interfaces:**
- Consumes: `claim_design(uuid, integer, text)` with `p_expected_cents` (Task 3); `ListingPrice` (Task 1).
- Produces: `claimDesign(designId: string, expectedCents: number | null): Promise<ClaimState>` — second parameter added.

- [ ] **Step 1: Rewrite the action**

Replace the body of `claimDesign` in `app/(public)/design/[id]/actions.ts`:

```ts
export async function claimDesign(
  designId: string,
  /** The price the buyer was shown. Compared, never charged — the amount
   *  charged comes from the row. A client that lies here can only make its own
   *  claim fail. */
  expectedCents: number | null
): Promise<ClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to claim this design." };
  }

  // Never trust a client-sent price — re-fetch it fresh server-side. RLS makes
  // this return nothing for an unlisted design the caller doesn't own, which is
  // the first of the two listing gates; claim_design holds the second, inside
  // the row lock, where it is actually atomic.
  const { data: design } = await supabase
    .from("designs")
    .select("price_cents, listed_at")
    .eq("id", designId)
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (!design || design.listed_at === null) {
    return { error: "Design not available." };
  }

  if (design.price_cents !== expectedCents) {
    return { error: "The price changed. Refresh and try again." };
  }

  // A free claim takes no payment at all, rather than a zero-amount charge:
  // the mock adapter would happily mint a payment ref for nothing, and a real
  // Stripe integration would reject it.
  const paymentRef =
    design.price_cents === null
      ? null
      : (
          await charge({
            amountCents: design.price_cents,
            buyerId: user.id,
            designId,
          })
        ).paymentRef;

  const { data, error } = await supabase.rpc("claim_design", {
    p_design_id: designId,
    p_expected_cents: design.price_cents,
    p_payment_ref: paymentRef,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Someone just claimed this design." };
  }

  // Normally a no-op: the product was minted when the design was listed. This
  // is the backfill for designs listed before Printify was configured, and it
  // must not stand between the buyer and their claim, so it runs past the
  // response.
  after(async () => {
    await syncDesignProduct(designId);
  });

  redirect(`/creator/${data[0].handle}`);
}
```

- [ ] **Step 2: Pass the price from the form**

`components/design/ClaimForm.tsx` — the click handler becomes:

```tsx
            const result = await claimDesign(designId, priceCents)
```

- [ ] **Step 3: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 4: Manual check against the live project**

Start the dev server (`npm run dev`), then, signed in as a user who is **not** the maker:

1. A listed priced design claims successfully and redirects to `/creator/<handle>`.
2. Open a listed design's page, change its price from the maker's account in another session, then claim — expect "The price changed. Refresh and try again." and **no** order row.
3. A design listed free claims successfully; check `orders` for that design shows `amount_cents = 0` and `stripe_payment_intent_id` null.
4. Signed in as the **maker**, the maker's own listed design refuses with "You made this design."

Record the outcome of each in the commit body or the PR description. These four are the money path and none of them is reachable from a unit test.

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/design/[id]/actions.ts" components/design/ClaimForm.tsx
git commit -m "feat: claim refuses unlisted designs, handles free, rejects price drift

The buyer's displayed price now travels to the server as expectedCents and is
compared, never charged: the charged amount comes from the row, and
claim_design re-checks the same comparison inside its row lock. A free design
takes no payment at all rather than a zero-amount charge."
```

---

### Task 9: The create page stops telling makers to claim their own work

Minimum change to stop the CTA lying. The real create flow — route move, style presets, 2×2 grid — is sub-project B.

**Files:**
- Modify: `components/create/CreateForm.tsx:26-28, 222-240`

**Interfaces:**
- Consumes: `ListingForm` (Task 7).
- Produces: nothing.

- [ ] **Step 1: Swap the CTA**

In `components/create/CreateForm.tsx`, replace the `phase.step === "done"` block's `Button` (the "Claim it" link) with the listing form plus a link to the design:

```tsx
        {phase.step === "done" && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={phase.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 384px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="text-body-sm text-muted-foreground">
              Yours, and private. List it to put it in the bazaar — or leave it
              and decide later from your designs.
            </p>
            <ListingForm designId={phase.designId} isListed={false} priceCents={null} />
            <Button
              variant="outline"
              render={<Link href={`/dashboard/designs`} />}
              className="w-fit rounded-full"
            >
              My designs <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
```

Add `import { ListingForm } from "@/components/dashboard/ListingForm"` at the top.

- [ ] **Step 2: Fix the standing copy**

The paragraph at the bottom of the form still says designs "land in the bazaar unclaimed — anyone can claim them, including you." That is now false. Replace it with:

```tsx
        <p className="text-caption text-muted-foreground">
          Designs are private to you until you list them. Once someone claims
          one, it's theirs — you can't relist or resell it.
        </p>
```

- [ ] **Step 3: Verify**

```bash
npx next typegen && npm run typecheck && npm run lint
```

Expected: clean. If `ArrowRight` is now unused, remove the import.

- [ ] **Step 4: Manual check**

`npm run dev`, sign in, generate a design at `/dashboard/create`. Expect: the result appears with a list form, the design does **not** appear on `/` or `/shop`, and it does appear under Unlisted at `/dashboard/designs`. Listing it free makes it appear on `/` within a refresh.

- [ ] **Step 5: Commit**

```bash
git add components/create/CreateForm.tsx
git commit -m "feat: create page offers listing, not claiming

A maker doesn't claim their own design. Minimum change to stop the CTA and the
standing copy contradicting the ownership model; the real create flow is
sub-project B."
```

---

## Post-implementation

- [ ] Run the security advisor one final time (MCP `get_advisors`, `type: "security"`) and confirm only the two known, out-of-scope findings remain (`auth_leaked_password_protection`, `rls_enabled_no_policy` on `pod_provider_mapping`).
- [ ] Update `docs/PROGRESS.md`: the ownership model note, and that `/dashboard/designs` is now built rather than a placeholder.
- [ ] Update `docs/DATA_MODEL.md`: `designs` gains `creator_id` and `listed_at`, `price_cents` is nullable, and the relationships summary needs the maker/owner distinction.

## Deferred, recorded so they aren't rediscovered

- **Deleting a design** — offered nowhere. Storage objects, the Printify product and the `generation_jobs` row all outlive the row. Delist covers the intent.
- **Empty bazaar** — private-by-default means the feed fills only from deliberate listings. `scripts/generate-designs.ts` is the house-stock answer; running it on a schedule is not built.
- **`is_claimed` / `claimed_by`** stay redundant. Only `claim_design` writes them, atomically.
- **Private designs' images** remain in a public-read storage bucket at `designs/{generation_job_id}.png`. The job id is a v4 UUID, so the URL is an unguessable capability. A signed-URL pass is the real answer if private work ever matters.
- **Garment price vs ownership price** share `designs.price_cents` via `FALLBACK_GARMENT_PRICE_CENTS`. Sub-project D separates them.
