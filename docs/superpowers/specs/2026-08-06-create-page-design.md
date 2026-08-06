# Create page — prompt to 1-of-1 design

Date: 2026-08-06
Status: approved, building

## Problem

`/dashboard/create` is a `ComingSoon` stub. The core product loop the whole
marketplace is built around — prompt in, 1-of-1 shirt design out — does not
exist. Every design in the app today comes from `supabase/seed.sql`, which
cycles ten placeholder PNGs; that is the direct cause of the "too many repeats"
feedback, and no amount of front-end work fixes it.

## Scope

Thin vertical slice: **prompt + vibe → generated image → `designs` row → visible
in the feed.**

Explicitly out of scope for this pass (all deferred, none designed away):

- reference image uploads (`reference_uploads`, `generation_jobs.reference_upload_ids`)
- the paid upscale tier (`quality_tier: 'upscale'`)
- an admin moderation UI
- credits / billing

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Ownership | Generated designs land in the bazaar **unclaimed** | Matches the schema's split of `generation_jobs.user_id` (creator) vs `designs.claimed_by` (owner). Keeps the feed stocked. |
| Moderation | **Auto-approve** on successful generation | `gpt-image-2` refuses policy-violating prompts at source. No review queue to staff. Residual risk accepted: legal-but-ugly content reaches the feed until reported. |
| Cost control | **Per-user daily cap**, counted from `generation_jobs` | No new table — the data already exists. Bounds worst case at `cap × signups × image cost`. |
| Execution | **Enqueue + poll the job row** | TRD requires async ("the UI must never appear to hang"). `after()` needs no new dependency and survives the user navigating away. |
| Prompting | Short user text **wrapped server-side in a house-style template** | Raw prompts drift badly — observed this session, gpt-image-2 degraded into generic merch with garbled lettering within seconds. The wrapper pins art direction and bakes in `no words or letterforms`. |

## Architecture

### Input

Vibe select (existing `vibes` rows) + capped prompt textarea + Generate button.

### `POST /api/generate`

1. Auth — `supabase.auth.getUser()`; `401` when absent.
2. Rate limit — count the caller's `generation_jobs` rows created in the last
   24h; `429` at or past `GENERATION_DAILY_CAP`.
3. Validate — prompt length, `vibe_id` resolves to a real row.
4. Insert `generation_jobs { user_id, vibe_id, quality_tier: 'draft', status: 'queued' }`.
5. **Return `{ jobId }` immediately.**
6. Continue the actual work in `after()`.

### Generation (`lib/generation/`)

Two small modules, split so the deferred features drop in without changing callers:

- `prompt.ts` — `buildPrompt(userText, vibeName)` returns the house-style config
  with the user's idea slotted into the subject field.
- `adapter.ts` — `generate(prompt, references, tier)`, the signature the TRD
  specifies. `references` is accepted and ignored this pass; the upscale tier
  is rejected. Provider details never leave the server.

Flow: generate → upload bytes to Supabase Storage → insert `designs`
(`moderation_status: 'approved'`) → update the job to `done` with
`result_design_id`. Any throw sets the job to `failed`.

### Polling

The client reads `generation_jobs` directly through the Supabase browser client.
The existing `generation_jobs_owner_all` RLS policy already permits the owner to
read their own rows, so no second API route exists. Polling stops on
`done`/`failed` and gives up after a ceiling, surfacing a timeout rather than
spinning forever.

### States

`idle → generating (skeleton) → done (design card + "Claim it") → failed (retry)`

## New infrastructure

- A public-read `designs` storage bucket. None exists today.
- `OPENAI_API_KEY`, server-side only, never exposed to the client.
- `GENERATION_DAILY_CAP`, defaulted in code so a missing env var fails closed.

## Verification

One runnable check covering the non-trivial logic:

- `buildPrompt` injects the user's text **and** retains the no-letterforms
  constraint (the regression that would reintroduce garbled output).
- The rate-limit boundary: at the cap refuses, below it allows.

## Risks

- **Auto-approve has no human gate.** Accepted deliberately; revisit before any
  real traffic.
- **`after()` is bounded by the platform's function timeout.** A generation
  slower than that leaves a row stuck in `generating`; the client's poll ceiling
  surfaces it as a timeout rather than hanging. A stuck-row sweeper is not built.
- **The daily cap is per user, not global.** A signup flood can still run up a
  bill. A global kill switch was offered and deferred.
