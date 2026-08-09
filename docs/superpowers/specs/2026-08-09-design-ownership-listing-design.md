# Design ownership & listing — maker control, claim transfer

Date: 2026-08-09
Status: approved, ready to plan

This is **sub-project A** of a five-part decomposition (see "Where this sits"
at the end). It ships alone and blocks the other four.

## Problem

Today generation *is* publication. `/api/generate` inserts a design with
`moderation_status: 'approved'` and every public surface reads it immediately.
The person who generated a design has no say in whether it goes live, what it
costs, or whether it can be free — `designs.price_cents` is `not null default
2900`, so "free" is unrepresentable — and no way to pull it back.

The intended product is the opposite: a maker generates privately, decides
whether to list it (free or priced) or keep it, can delist at any time, and
loses all control the moment someone claims it.

## Scope

The ownership and listing model end to end: schema, RLS, the claim path, and
every read surface that has to respect it.

Out of scope, each deferred to its own spec:

- **B** — create page v2 (route move, style presets, 2×2 grid, persona/aspect/quality inputs)
- **C** — personas and first-run onboarding
- **D** — garment configuration and real Printify mockups
- **E** — the buyer's print-ordering flow

The create page's post-generation CTA changes here only enough not to be
wrong. Its real design belongs to B.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Claim vs order | **Two transactions.** Claim transfers exclusive ownership of the design; anyone may later order a printed garment of it, and the owner earns royalty per order. | Matches `orders` + `royalty_ledger` exactly as already built. One transaction would delete storefronts and royalties. |
| Maker's stake after a claim | **Zero, forever.** Paid once at claim (or nothing, if listed free), then fully out. | User decision. `royalty_ledger` stays reserved for the claimant-resale case. |
| Default state of a new design | **Private.** Visible to its maker only until they list it. | Generation stops being publication. Fail-closed: an abandoned create session leaks nothing. |
| Free vs priced | `price_cents is null` **means free.** | One nullable column instead of a boolean plus a price that has to agree with it. Two columns can disagree; one cannot. |
| Private vs delisted | **The same state** (`listed_at is null`). | They behave identically everywhere. A third enum value would be untestable — no observable difference. |
| Where the gate lives | **RLS**, not query filters. | `designs` is read from the browser with the anon key (the create page polls it). A filter-only gate in `lib/data/*` leaves every private design readable straight from PostgREST. |
| Listing mechanism | **Plain server actions doing an `UPDATE`.** No new `security definer` RPC. | RLS already restricts who and when; a check constraint already rejects non-positive prices. An RPC here is ceremony around an UPDATE. |
| Printify product minting | **Moves from generation to listing.** | Minting at generation pays to create products for designs nobody lists — and B makes it four per job. |

## Architecture

### Schema

```sql
alter table public.designs
  add column creator_id uuid references public.profiles(id),
  add column listed_at  timestamptz;

alter table public.designs alter column price_cents drop not null;
alter table public.designs alter column price_cents drop default;
alter table public.designs drop constraint designs_price_cents_positive;
alter table public.designs
  add constraint designs_price_cents_positive
    check (price_cents is null or price_cents > 0);

create index designs_creator_id_idx on public.designs (creator_id);
create index designs_listed_at_idx  on public.designs (listed_at desc)
  where listed_at is not null;
```

Dropping the `2900` default is deliberate: a listed design must have had a
price decided, and free is a decision too. Defaulting into a price hides the
difference between "the maker chose $29.00" and "nobody chose anything".
Prices are integer cents in USD throughout, matching the existing
`Intl.NumberFormat("en-US", { currency: "USD" })` formatters.

**Backfill.** `creator_id` from `generation_jobs.user_id` via
`generation_job_id`; `listed_at` from `created_at` so nothing already public
disappears. The live database currently holds **one** design row, two
profiles, and zero claims/orders/storefronts (`supabase/seed.sql` is deleted),
so this is close to a no-op — but it must be written, because the migration
also runs against any environment that still has seed data.

`is_claimed` stays alongside `claimed_by` despite being derivable from it.
All four data modules read it and `claim_design` writes both inside one
transaction. Collapsing the pair is a separate cleanup.

### State model

A design is fully described by three columns. There is no status enum.

| `listed_at` | `price_cents` | `claimed_by` | Meaning |
| --- | --- | --- | --- |
| null | null | null | Private — maker only. Freshly generated, or delisted. |
| set | null | null | Listed free. First claimer takes it. |
| set | > 0 | null | Listed at a price. |
| set | either | set | Claimed. Maker is out; owner controls it. |

Delisting is `listed_at = null` and leaves `price_cents` untouched. Relisting
asks for the price again, pre-filled with the previous value — the maker
confirms it rather than silently inheriting a number they set weeks ago.

### Read gate

```sql
drop policy "designs_select_public" on public.designs;

create policy "designs_select_listed" on public.designs
  for select using (
    listed_at is not null
    or (select auth.uid()) = creator_id
    or (select auth.uid()) = claimed_by
  );
```

Anonymous callers have `auth.uid() = null`, so this collapses to "listed
only". A maker sees their own drafts; an owner keeps seeing a design they
later delist.

**`generation_jobs_select_public_result` must be dropped in the same
migration.** It is `for select using (result_design_id is not null and exists
(... d.moderation_status = 'approved'))` with no `TO` clause, so `anon` can
read it. Privacy comes from `listed_at`, not from `moderation_status` — a
private design is still `approved`. Left in place, it hands anonymous callers
the ids and maker ids of every unlisted design. It existed only to attribute a
design to its creator, which `designs.creator_id` now answers directly.

### Write gate

```sql
drop policy "designs_update_owner" on public.designs;

-- The maker may edit listing and price, and only while nobody owns it.
create policy "designs_update_creator_unclaimed" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = creator_id and claimed_by is null)
  with check ((select auth.uid()) = creator_id and claimed_by is null);

create policy "designs_update_claimant" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = claimed_by)
  with check ((select auth.uid()) = claimed_by);
```

"The maker has nothing to do with it after a claim" is enforced here, in the
database: the instant `claimed_by` is set, the maker's policy stops matching.
No server-side check to forget.

Both policies carry `using` **and** `with check` — without `with check` a user
could reassign a row's `creator_id` or `claimed_by` to somebody else. The
existing SELECT policy is what makes these UPDATEs visible at all; an UPDATE
must first SELECT the row, so a maker's own private design has to be readable
by them or their edits silently affect zero rows.

Side effect: `creator_id` as a real column removes the `generation_jobs`
subquery that ran on every row of every update check.

### Revoked grants (adjacent, included deliberately)

The security advisor reports seven `SECURITY DEFINER` functions callable by
`anon` and `authenticated` over `/rest/v1/rpc` — among them `notify_on_claim`
and `notify_on_royalty`, both on the path this spec rewrites. Postgres grants
`EXECUTE` to `PUBLIC` on every new function and the init migration never
revoked it. These are trigger functions; nothing should invoke them by HTTP.

```sql
revoke execute on function
  public.handle_new_user(), public.handle_new_profile(),
  public.notify_on_claim(), public.notify_on_message(),
  public.notify_on_order_status_change(), public.notify_on_royalty(),
  public.rls_auto_enable()
from public, anon, authenticated;
```

Not fixed here, recorded so it isn't re-derived: leaked-password protection is
disabled (an Auth dashboard toggle, no migration can set it), and
`pod_provider_mapping` has RLS enabled with no policies — which is correct
default-deny, not a gap.

### `claim_design` rewrite

The function is dropped and recreated rather than replaced: `create or
replace` cannot rename an input parameter, and `p_amount_cents` becomes
`p_expected_cents`.

Three behavioural changes, all inside the existing `for update` row lock:

1. **Listing gate.** `listed_at is null` raises `'Design not available.'`
   Without it a private design is claimable by anyone who learns its id,
   straight past the read gate.
2. **Price is read from the locked row, never trusted from the caller.**
   Today `actions.ts` fetches the price, calls `charge()`, then passes
   `p_amount_cents` in. A maker editing the price in that window means the
   buyer is charged one number while the order records another. The caller now
   passes the price the buyer *saw* as `p_expected_cents`; a mismatch against
   the locked row raises `'Price changed.'` and the buyer retries against the
   real price.
3. **Free path.** `price_cents is null` writes `amount_cents = 0` and
   `stripe_payment_intent_id = null`. `orders.amount_cents` has no positivity
   constraint, so this needs no schema change.

Plus: `creator_id = auth.uid()` raises. A maker keeping a design means not
listing it; claiming their own listing would only charge them, and blocking it
forecloses self-dealing once royalties are real money.

Everything else — the row lock, the `claims` insert, storefront provisioning,
`security definer` with `set search_path = ''` — is unchanged.

### Server actions

`app/dashboard/designs/actions.ts` (new):

- `listDesign(designId, priceCents: number | null)` — sets `listed_at = now()`
  and the price. `priceCents` is integer cents, not dollars — the form collects
  dollars and converts once, at the edge. Validates before writing: free is
  `null`; otherwise an integer strictly greater than zero. Rejects `0`,
  negatives, and non-integers with a field error rather than a thrown 500.
  RLS enforces maker-and-unclaimed;
  the action does not re-check ownership, because a second check that can drift
  from the policy is worse than one that cannot.
- `delistDesign(designId)` — sets `listed_at = null`. Price is left as it was
  and re-asked on relist.

`listDesign` is also where `syncDesignProduct(designId)` now runs, inside
`after()` so minting never blocks the response.

### Read surfaces

`lib/data/feed.ts`, `bazaar.ts`, `design.ts`, `storefront.ts` each add
`.not("listed_at", "is", null)`. RLS hides unlisted designs from everyone
else; this filter is what stops a **maker** from seeing their own drafts
scattered through the public feed and their own storefront.

`lib/data/my-designs.ts` becomes three groups:

- **Unlisted** — `listed_at is null and claimed_by is null`. One action: list
  it. There is no delete; see Risks.
- **Listed** — `listed_at is not null and claimed_by is null`. Edit price, delist.
- **Adopted** — `claimed_by is not null`. Read-only: who took it, what it paid.

Your requirement was that a claimed design disappears from the maker's list.
It disappears from everything actionable; it stays visible in **Adopted**,
because a maker who cannot see that their design sold cannot see that they
were paid. Say the word and Adopted goes away.

### Create page

`components/create/CreateForm.tsx`'s "Claim it" CTA is now incorrect — a maker
does not claim their own design. It becomes List / Keep private, calling
`listDesign`. Minimum change to stay truthful; the real create flow is B.

## Verification

One file, `lib/listing.test.ts`, matching the existing convention
(`npx tsx lib/listing.test.ts`, `node:assert/strict`, no framework — same shape
as `lib/generation/prompt.test.ts`).

- **Price validation** — `null` (free) accepted; `2900` accepted; `0`, `-1`,
  `12.5`, `NaN` rejected. This is the rule that decides whether a design can go
  live, and it is the one the UI copy promises.
- **Claim eligibility as a pure function over row state** — unlisted refuses,
  price drift refuses, maker-claims-own refuses, listed with a matching price
  allows. Extracted so the branch is testable without a database; the SQL
  function mirrors it and the row lock is what makes it atomic.

Not unit-tested, verified by hand against the live project after the
migration: that `anon` cannot select an unlisted design, and that a maker
cannot update a design once `claimed_by` is set. Both are RLS behaviour, which
a unit test cannot reach.

## Migration hazard (read before writing the file)

`list_migrations` on the live project returns **two** entries
(`printify_mockups`, `designs_storage_bucket`), while `supabase/migrations/`
holds **seven** files, and the two that match carry different timestamps than
their filenames. Remote migration history and the local directory disagree —
the other five were applied as raw SQL.

Consequences for this change:

- Create the file with `supabase migration new design_ownership_listing`.
  Never hand-name it; the timestamp must sort after the applied
  `20260809124800`.
- Do not run `supabase db push` expecting it to reconcile. Apply this
  migration deliberately (MCP `apply_migration`, or `db push` only after the
  history is repaired), then re-run advisors.
- Repairing the history is real work and is **not** part of this spec. It is
  recorded here so the next person does not discover it mid-deploy.

## Risks

- **The bazaar has nothing in it.** One design row live, and private-by-default
  means it only fills from deliberate listings. This is today's reality, not
  something this change causes, but it becomes visible the moment real users
  arrive. House-generated stock (`scripts/generate-designs.ts` already exists)
  is the fix and is deferred.
- **Private designs' images sit in a public-read storage bucket.** RLS hides
  the row; the image itself stays fetchable at
  `.../designs/{generation_job_id}.png`. The job id is a v4 UUID, so the URL is
  an unguessable capability, not a listing. Accepted for now. A signed-URL or
  private-bucket pass is the real answer if private work ever matters.
- **`is_claimed` and `claimed_by` remain a redundant pair** that can diverge if
  anything ever writes one without the other. Only `claim_design` writes them,
  atomically. Left alone deliberately.
- **Moderation is still auto-approve** with no human gate, unchanged from the
  create-page spec. Private-by-default narrows the blast radius — nothing is
  public until a human chooses to list it — but does not close it.
- **Deleting a design is offered in Unlisted but not designed here.** Storage
  cleanup, the Printify product, and the `generation_jobs` row all outlive the
  design row. If deletion turns out to matter, it needs its own pass; the
  fallback is delist, which is already complete.

## Where this sits

| | Sub-project | Depends on |
| --- | --- | --- |
| **A** | Ownership + listing (this spec) | — |
| B | Create v2 — route move, style presets, 2×2 grid | A |
| C | Personas + first-run onboarding | B |
| D | Garment config + real Printify mockups | B |
| E | Buyer print-ordering flow | D |

Blocked externally: **B needs the muapi MCP working.** `.mcp.json` carries an
unresolved `${…}` placeholder in its `Authorization` header and no `Bearer`
prefix, and `MUAPI_API_KEY` lives in `.env.local`, which the MCP client never
loads. `.mcp.json` is git-tracked, so the key must come from the shell
environment — `"Bearer ${MUAPI_API_KEY}"` with the variable exported — never
pasted into the file.
