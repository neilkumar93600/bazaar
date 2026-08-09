# Create v2 — styles, four-up grid, and a create page that isn't in the dashboard

Date: 2026-08-09
Status: approved, ready to plan

**Sub-project B** of five. Depends on **A** (design ownership & listing), which
is built. Blocks **C** (personas) and **D** (garment config).

## Problem

`/create` doesn't exist — the generator lives at `/dashboard/create`, behind a
sidebar, which is the wrong home for the product's core loop. Signing in lands
you on `/dashboard` rather than the feed.

The form itself asks two questions (idea, vibe) and returns one image in one
fixed house style. A maker cannot choose how the art looks, cannot make a
typographic shirt at all, cannot pick a shape, cannot trade cost for quality,
and gets exactly one attempt per generation — so a near-miss costs a whole
generation to retry.

## Scope

The create page end to end: its route, the controls on it, the style system
behind them, and the four-image pipeline that feeds the grid.

Out of scope, deferred:

- **C** — personas. B renders the control, disabled, reading "No personas yet".
- **D** — garment type / colour / placement and the real Printify mockup.
  After a maker picks a design, B hands straight to A's `ListingForm`; D slots
  in ahead of it later.
- Reference-image uploads (`reference_uploads`) — still accepted and rejected
  by the adapter.
- Regenerate / vary-this-one. Not built; the maker re-submits the form.
- Credits or paid tiers. Quality is free and capped by the existing daily cap.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Style taxonomy | **24 presets in code**, two families: `pictorial` and `typographic` | They are prompt fragments. They ship with the prompt builder that understands them, and a preset absent from deployed code can't be generated anyway. A database table would add a join and a way to get out of sync. |
| Letterforms | **Banned per family, not globally.** Pictorial keeps `no words or letterforms`; typographic replaces it with an exact-string instruction. | The ban exists because the model degrades into garbled pseudo-text. Lifting it globally reintroduces that everywhere. Lifting it only where text *is* the design keeps the guard exactly where it was earning its keep. |
| Vibe | **Each preset carries a `vibeSlug`** | The form asks one question. Style drives art direction, and the same answer files the design into the feed column it belongs in. |
| Images per generation | **Four, always, in parallel** | MuAPI's `gpt-image-2-text-to-image` has no `n` parameter, so four images is four model runs. Sequential breaches `maxDuration`. |
| Job → designs | **One `generation_jobs` row, up to four `designs` rows** | `designs.generation_job_id` is already a non-unique FK. One user action stays one row, so "this generation" remains a thing the database can name. |
| Partial failure | Job is `done` if **≥1** image lands, `failed` only if all four do | Three good images is a good result. Failing the whole job because one run timed out throws away paid work. |
| Quota | **`DAILY_CAP` stays 5**, relabelled "20 images" | Every job requests exactly 4, so `images ≤ 20` and `jobs ≤ 5` are the same constraint. Counting design rows instead would silently stop charging for *failed* generations, which is the abuse case the cap was written for. |
| Quality | `low` / `medium` / `high`, passed straight to MuAPI | The user asked for it. It is not a provider detail — it leaks nothing about which provider is behind the call. |
| Unpicked designs | **All four persist, private** | They cost quota to make. A's **Unlisted** group is already the right shelf. Deleting art someone paid for is hostile. |

## Architecture

### Style presets — `lib/generation/styles.ts`

```ts
export type StyleFamily = "pictorial" | "typographic"

export type StylePreset = {
  slug: string
  label: string
  family: StyleFamily
  /** Resolved to a vibe id at generation time. Slug, not id: ids differ
   *  between environments, slugs don't. */
  vibeSlug: string
  aesthetic: string
  linework: string
  palette: string[]
  /** Which flat field the artwork is keyed against, so the background remover
   *  has a clean edge. See "The cut-field conflict" below. */
  cutField: "black" | "white"
}
```

Twenty-four presets:

| Family | Presets | Vibe |
| --- | --- | --- |
| pictorial | Woodcut Flash *(today's house style)*, Blackwork Tattoo, Comic Halftone Pop | `riot` |
| pictorial | Manga Ink, Anime Cel, Watercolour Bloom, Botanical Field Guide | `late-bloomer` |
| pictorial | Vintage Riso, Art Nouveau Panel, Minimal Line | `dusk-atelier` |
| pictorial | Psychedelic Liquid, Chrome Y2K, Surreal Collage | `insatiable` |
| pictorial | Graffiti Piece, Folk Woodblock | `untamed-worldwide` |
| pictorial | Photoreal Render, Pixel Art, Cyberpunk Neon | `compound` |
| typographic | Slab Statement, Blackletter | `riot` |
| typographic | Script Signature, Retro Serif Stack | `dusk-atelier` |
| typographic | Graffiti Tag | `untamed-worldwide` |
| typographic | Kinetic Type Grid | `compound` |

`Woodcut Flash` reproduces the current prompt exactly, so today's output is
still reachable and the change is additive rather than a replacement.

### The cut-field conflict

Artwork is keyed against a flat field and cut out by a second model pass
(`ai-background-remover`), because a background prints as a rectangle of ink.
Today that field is **black**, and the prompt forbids "any part of the subject
rendered in pure black" so the subject can't merge into it.

That rule is fatal for **Blackwork Tattoo** and **Manga Ink**, which are black
ink by definition — they would merge into the field and be cut away, returning
an empty PNG.

So `cutField` is per preset. Dark-ink styles key against **white** and flip the
constraint to pure white instead. The palette and the field are chosen
together, per style, rather than globally.

White-keyed presets: **Blackwork Tattoo**, **Manga Ink**, **Minimal Line**,
**Blackletter**, **Graffiti Tag**, **Slab Statement** — every preset whose
palette is predominantly black ink. The other eighteen stay black-keyed. Any
preset added later must declare a field that its palette can actually separate
from; the test below enforces it.

(This also explains the stale comment at `lib/generation/adapter.ts:74`, which
claims the prompt asks for "a flat white field" — a fossil of an earlier
white-keyed version. Corrected in passing.)

### Prompt — `lib/generation/prompt.ts`

`buildPrompt(userText, vibeName)` becomes:

```ts
buildPrompt(input: {
  idea: string
  style: StylePreset
  /** Typographic styles only. Null for pictorial. */
  text: string | null
}): string
```

The preset supplies `AESTHETIC`, `linework`, `PALETTE` and the background
field. `vibeName` leaves the prompt entirely — the style carries art direction
now — while `vibe_id` still lands on the row, resolved from `style.vibeSlug`.

Family decides one block:

- **pictorial** — `AVOID` keeps `"any words, letters, numerals or letterforms
  anywhere in the image"`, unchanged.
- **typographic** — that line is replaced by a `TEXT_CONTENT` field carrying the
  maker's exact string, an instruction to render it spelled exactly, and an
  `AVOID` entry for *any other* text. The words are the subject; `idea`
  becomes art direction for how they are set.

Text input is capped at **7 words / 40 characters** — the stated range, and
about where gpt-image-2's spelling degrades. The four-up grid is the
mitigation: four attempts, the maker keeps the one that spelled it right.

### Adapter — `lib/generation/adapter.ts`

```ts
generate(input: {
  prompt: string
  references: string[]
  aspectRatio: AspectRatio
  quality: Quality
  cutField: "black" | "white"
}): Promise<GeneratedImage>
```

This replaces the TRD's `generate(prompt, references, quality_tier)`. Deliberate
deviation, recorded here: `quality_tier` meant `draft | upscale`, a pricing
concept that does not exist. Quality is now a direct user control and aspect
ratio is a user control, so both are parameters. `references` stays accepted
and rejected, unchanged.

`AspectRatio` is `"1:1" | "3:4" | "4:3"`. MuAPI also accepts `auto`, `16:9` and
`9:16`; none are useful on a chest print, so they are not offered.

`cutField` reaches the adapter because the background remover needs to know
what it is cutting against — it is not purely a prompt concern.

### Generation — `app/api/generate/route.ts`

1. Validate: idea length, `styleSlug` resolves to a real preset, `text` present
   and within limits **iff** the preset is typographic, aspect and quality are
   in range.
2. Resolve `vibe_id` from `style.vibeSlug`. A slug with no matching row is a
   500, not a silent null — it means the presets and the database disagree.
3. Insert one `generation_jobs` row.
4. Return `{ jobId }`; the rest runs in `after()`.
5. **`Promise.allSettled` over four `generate()` calls.** Each settled success
   uploads and inserts its own `designs` row immediately, so the grid fills
   incrementally rather than all at once at the end.
6. Job → `done` with `result_design_id` set to the first success, or `failed`
   if all four rejected.

**Storage paths must change.** Today the object is `${jobId}.png`; four images
per job would overwrite each other (`upsert: true` makes that silent). New path
is `${jobId}-${index}.png`.

**Timing.** `POLL_TIMEOUT_MS` is 120s per model run and each image is two runs
(generate, then cut). Four images in parallel is therefore a 240s worst case
against `maxDuration = 300`. Tight but inside. Four concurrent MuAPI requests
is also an unmeasured rate-limit risk — see Risks.

### Schema

```sql
-- Job inputs that the prompt cannot be reverse-engineered from.
alter table public.generation_jobs
  add column style_slug   text,
  add column text_content text;

-- quality_tier was draft|upscale, a pricing concept that never shipped.
-- Order matters: existing rows hold 'draft', so they must be migrated BEFORE
-- the new constraint is added or the ALTER fails on its own validation pass.
alter table public.generation_jobs drop constraint generation_jobs_quality_tier_check;

update public.generation_jobs set quality_tier = 'medium' where quality_tier = 'draft';
update public.generation_jobs set quality_tier = 'high'   where quality_tier = 'upscale';

alter table public.generation_jobs
  add constraint generation_jobs_quality_tier_check
    check (quality_tier in ('low', 'medium', 'high'));
```

Aspect ratio is deliberately not stored — it is visible in the image.

### Route and landing

- `/dashboard/create` → **`/create`**, added to `PROTECTED_ROUTES` in
  `lib/supabase/middleware.ts`. A signed-out visitor bounces to `/login` and
  their draft survives in `sessionStorage` via the existing `lib/hero-draft.ts`.
- Post-login lands on **`/`**, not `/dashboard`: `app/(auth)/login/actions.ts`
  and the authed-user bounce in `lib/supabase/middleware.ts`. `verify-otp` →
  `/onboarding` is unchanged; that is C.
- The old route is deleted and its inbound links updated. No permanent redirect
  for stale bookmarks — pre-launch, not worth the config entry.

### Form

Left column, in order:

1. **Idea** — textarea, 200 chars.
2. **Style** — 24 chips in two labelled groups. A radio group, not a select:
   24 options in a dropdown is unbrowsable, and the family split must be
   visible because it changes what the form asks next.
3. **Your words** — rendered **only** when a typographic style is selected.
   Live counter, 7 words / 40 chars.
4. **Persona** — disabled, "No personas yet". C fills it.
5. **Aspect** and **Quality**, two columns. Aspect: Square 1:1, Portrait 3:4
   (default), Wide 4:3. Quality: Low / Medium / High.
6. **Create**, plus images remaining today.

Right column: a 2×2 grid of four skeletons, each cell replaced as its design
row appears. Picking one reveals A's `ListingForm` inline.

### Polling

The client keeps polling `generation_jobs` for status, and additionally queries
`designs where generation_job_id = ?` each tick to fill cells as they land.
Both reads are already permitted: `generation_jobs_owner_all` covers the job,
and A's `designs_select_listed` lets a creator read their own unlisted rows.

Terminal states: `done` (1–4 images), `failed` (none), or the existing client
timeout ceiling.

## Verification

Extending `lib/generation/prompt.test.ts`, same convention (`npx tsx`,
`node:assert/strict`, no framework):

- **The pictorial ban survives.** A pictorial preset's prompt still contains the
  no-letterforms constraint. This is the regression that puts garbled text back
  on every shirt, and it would ship silently.
- **Typographic prompts carry the exact string** and do *not* carry the blanket
  ban — the two families genuinely differ.
- **No preset keys its artwork against a field its own palette contains** — a
  black-palette style must not declare `cutField: "black"`. That combination
  returns an empty PNG, and it is checkable across all 24 presets in one loop.
- **Every `vibeSlug` resolves** against the six known slugs — a typo here files
  designs into a column that doesn't exist.
- Text validation: 7 words passes, 8 fails, 40 chars passes, 41 fails; empty
  text is rejected for a typographic style, and text supplied *alongside* a
  pictorial style is rejected rather than ignored — silently dropping something
  the maker typed is worse than telling them it has nowhere to go.

Not unit-testable, checked by hand once against the live project: that four
images actually land in one job, and that a Blackwork Tattoo generation returns
a non-empty cut-out.

## Risks

- **Four concurrent MuAPI requests is unmeasured.** If they rate-limit, some
  runs fail and the maker gets two or three images instead of four. Handled
  gracefully by design (partial success is a success), but the failure will look
  arbitrary to the user. No backoff is built.
- **240s worst case against a 300s ceiling.** A slow provider day leaves a job
  stuck in `generating` with nothing coming; the client's existing poll ceiling
  surfaces it as a timeout. No stuck-row sweeper — carried over from A's spec,
  still not built.
- **Typographic spelling is not guaranteed.** Four attempts is the mitigation,
  not a fix. A maker may burn a whole generation and get four misspelt shirts.
- **24 presets is 24 pieces of prompt writing.** Some will be weak on first
  contact with the model. They are code, so tuning one is a one-line change, but
  the initial set will not all be good.
- **`quality: "low"` may produce unsellable art.** It is offered because it was
  asked for; nothing stops a maker listing a low-quality design.
- **The style list is not user-extensible.** A maker who wants a style not in
  the 24 has no route to it but the idea textarea, which is exactly the
  free-prompt drift the house template exists to prevent.

## Downstream

`scripts/generate-designs.ts` calls `buildPrompt(idea, vibe.name)` and
`generate(prompt, [], "draft")`. Both signatures change, so the script picks a
preset per vibe and passes explicit aspect and quality. It stays single-image —
house stock does not need a grid.
