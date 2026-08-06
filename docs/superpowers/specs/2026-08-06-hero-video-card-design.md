# Hero: full-bleed video card with prompt entry

**Date:** 2026-08-06
**Status:** approved

## Goal

Replace the home hero with a full-bleed rounded video card: local frosted pill
nav inside the card, headline bottom-left with one serif-italic accent word, and
a prompt-entry card bottom-right that hands off to the real generate flow.

Keeps Shirt Bazaar's own copy and the site theme (Column when written, Brainfish now). Adapted from a spec written
for a standalone Vite agency site — the agency contact form, service chips,
mailto row and M-mark logo are replaced with this product's equivalents.

## Decisions

| Question | Decision |
|---|---|
| What does the right-hand card do? | Prompt-to-generate form: prompt textarea + vibe chips + submit |
| Signed-out submit behavior | Deep-link to `/dashboard/create` + stash the draft in `sessionStorage` |
| Nav | Hero-local pill nav; global `Navbar` suppressed on `/` while over the hero |
| Serif accent word | One italic emphasis word in the hero headline. Originally Instrument Serif as a Column exception; now Fraunces, which is a first-class part of the Brainfish system |

The hero never calls `POST /api/generate`. That endpoint is auth-gated, capped
at `DAILY_CAP` per user per 24h, and costs money per call; the home page is
mostly anonymous traffic, so the hero captures intent and the create page owns
generation. No duplicated poll loop, no paid endpoint one click from the front
page.

## Layout

Page root: `bg-background`, `p-3 sm:p-4 md:p-6`. One frame inside:

- `rounded-xl overflow-hidden` (8px — the Brainfish card step)
- `min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)]` — locks to the viewport on desktop, grows to content below `lg`
- Existing `/bazaar/hero.mp4` with `/bazaar/hero.jpg` poster, `object-cover`, gated on the existing `(min-width: 768px) and (prefers-reduced-motion: no-preference)` query
- Content layer `relative z-10 flex flex-col` with the same height ladder, `p-4 sm:p-6 md:p-8`, `gap-6`

Vertical order: nav pill → `flex-1 min-h-[2rem]` spacer → bottom row
(`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6`).

Headline: `text-3xl sm:text-4xl xl:text-5xl font-medium leading-tight
drop-shadow-lg lg:max-w-lg xl:max-w-2xl`, white. Copy: `AI shirts that exist` /
`exactly once`, with `once` in Fraunces italic.

Form card: `w-full lg:w-[min(480px,45%)] shrink-0`, cream, `rounded-xl`,
`shadow-[var(--shadow-xl-2)]` (2px ink offset plus a 1px ink ring), inner
`p-4 sm:p-6`, `flex flex-col gap-4`.

## Data flow

```
hero submit
  → heroDraft.stash({ prompt, vibeId })
  → router.push(/dashboard/create?prompt=…&vibe=…)

signed in  → CreateForm seeds state from searchParams
signed out → /login → … → /dashboard/create
             → CreateForm restores from sessionStorage, then clears it
```

`vibes` come from the `getVibeTiles()` call the home page already makes — no
extra query. Chips are single-select because `/api/generate` takes one
`vibeId`.

Validation reuses `MIN_PROMPT_LENGTH` / `MAX_PROMPT_LENGTH` from
`lib/generation/prompt.ts`. No re-declared limits.

No fake submit delay. The button reads "Taking you there…" until navigation
commits, which is a real state rather than a simulated one.

## Nav

`Navbar` already tracks `pastHero` against the hero section id. On `/` it
renders nothing until the visitor scrolls past the hero, then behaves as it does
today. The hero's own pill carries the links while the hero is on screen.

Accepted cost: the hero pill is a second set of nav links to keep in sync, and
it does not carry the cart / notification / avatar chrome the global bar shows
signed-in users.

## Deviations from the reference

The theme moved to Brainfish after this hero was built, which retired both of
the exceptions this spec originally carried: the serif italic word is now
Fraunces (a first-class part of the system, not an exception), and the frame
sits at the standard 8px card radius instead of 16/24px.

Palette mapping, so the card doesn't read as a foreign component: the source
spec's `blue-600` email link → ink; `pink-100` / `orange-100` / `blue-100`
social chips → monochrome ink on cream; black buttons → the lime primary with an
ink label. Service chips became Pill Tags (transparent, 1px ink border).

Kept verbatim from the spec: the `flex-1 min-h-[2rem]` spacer, the `SocialBtn`
helper, the OR divider, chip active/inactive treatment, focus rings, and the
responsive height ladder.

## Verification

- `lib/hero-draft.ts` gets a `node:test` file beside it, matching
  `lib/generation/prompt.test.ts`: stash → restore → clear round-trip, and
  restore-on-empty returning null.
- `npm run typecheck`, `npm run build`.
- Browser pass at 1440 and 390 wide, signed out: hero renders, chips toggle,
  submit lands on `/login` with the draft surviving into the create form.
