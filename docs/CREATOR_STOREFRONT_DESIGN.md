# Creator Storefront — Design Spec

Route: `app/(marketing)/creator/[handle]/page.tsx`. Currently a `ComingSoon` placeholder — this replaces it.

## Purpose

Per `PRD.md`: claiming a design auto-provisions the claimant a personal storefront. It serves three jobs at once:
1. **Proof of first claim** — public, timestamped record that this profile claimed the design first.
2. **Shop** — anyone can buy a print of a claimed design; the claimant earns a permanent royalty on every resale (`royalty_ledger`), but doesn't have to do anything to enable it.
3. **Growth surface** — the destination for the share-image growth loop and for follows.

The page must render for any valid `handle`, including a profile with zero claims yet (storefront existing is implied by having a profile, not gated on the `storefronts` row — see Open Question below).

## Layout

Sticky sidebar shop layout, inside the existing `(marketing)` layout (global `Navbar`/`Footer` apply, no page-specific header/footer).

- **Desktop (≥1024px):** two-column. Left column (~320px, `position: sticky; top: <navbar height> + 24px`) holds the identity panel. Right column (flex-1) holds the design grid. Page content capped at the existing 1200px max-width.
- **Mobile/tablet (<1024px):** stacked — identity panel full-width on top (not sticky), grid below.

## 1. Identity panel

Left column, sticky on desktop.

- Avatar — `components/ui/avatar.tsx`, ~96px.
- `@handle` — Labil-Bold, `--text-heading-sm` (24px).
- Bio line (`profiles.display_name` or a bio field if one exists — optional, renders nothing if empty).
- Stats row, dot-separated, Labil Grotesk 14px `--color-mid-gray`:
  `{followerCount} followers · {designCount} designs · claiming since {formattedClaimedSince}`
  - `followerCount` — count of `follows` where `followed_id = profile.id`.
  - `designCount` — count of `designs`/`claims` where `claimant_id = profile.id`.
  - `claimedSince` — `min(claims.claimed_at)` for this claimant; omit the whole "claiming since" clause if `designCount` is 0.
- **Follow button** — Coral Primary Button (`ff5c3c` fill) when the viewer does not follow this profile; Outlined Ghost Button when they do. Optimistic toggle on click, no page reload. Hidden/disabled if viewer is the profile owner or is logged out (logged-out click routes to `/login`).
- **Share button** — Outlined Ghost Button, copies the storefront URL to clipboard, label swaps to "Copied" for ~1.5s then reverts. Always visible, including to the owner (this is the "proof of claim, ready to share" surface from the PRD growth loop).

## 2. Design grid

Right column. One card per design where `claims.claimant_id = profile.id` (i.e. every design this profile claimed, regardless of who currently buys prints of it), newest claim first.

Grid: 3 columns desktop, 2 tablet, 1 mobile. 24px gap. `--radius-xl` (12px) card radius, `--shadow-lg` at rest.

Each card:
- Design image, `--radius-2xl-2` (20px) per DESIGN.md image radius convention.
- Vibe tag — pill (9999px radius), one of the category gradients (Royal/Sky/Verdant/Magenta/Sunrise) mapped from `designs.vibe_id → vibes`, white bold text.
- Price (from the design's current print pricing — quality-tier price range or "from $X").
- Provenance line, small/mid-gray: `Claimed {relativeDate}` (e.g. "Claimed 3 months ago"). Full date on hover via `title` attribute.
- Whole card is a link to `/design/[id]`. No inline buy button, no quick-buy modal — purchase config (quality tier, placement, size) lives entirely on the design detail page.

Card hover (desktop): 2-4px lift + shadow shift from `--shadow-lg` to `--shadow-xl`, 150ms ease.

## 3. Empty state (designCount = 0)

Grid area (right column) renders `components/ui/empty.tsx` instead of a grid:
- `EmptyMedia` — icon variant (e.g. shirt/sparkle icon).
- `EmptyTitle` — "No designs claimed yet"
- `EmptyDescription` — "Designs @{handle} claims will show up here."
- `EmptyContent` — Outlined Ghost Button linking to `/` (home feed) or `/search`, label "Browse designs"

Identity panel renders normally alongside it (0s in the stats row, "claiming since" clause omitted).

## 4. Motion (subtle tier)

- Grid cards: fade + slight slide-up on mount, staggered ~40ms per card, capped at the first 12 cards (remaining appear without stagger to avoid a long tail delay on large grids).
- Card hover: lift + shadow transition, 150ms ease, per above.
- Follow button: cross-fade between coral-filled and ghost states, 120ms, no layout shift (both states same padding/height).
- Share button: label swap fade, 150ms in/out.
- Sticky identity panel: no scroll-linked motion, plain CSS `position: sticky`.
- Empty state: fades in, no stagger (nothing to stagger).

Respect `prefers-reduced-motion`: disable stagger and slide, keep only opacity fades.

## Data needs (for the implementation plan)

- Lookup profile by `handle` (404 if no profile matches — this is a real 404, distinct from the "0 claims" empty state, which is a valid profile with nothing claimed yet).
- Follower count, design/claim count, earliest `claimed_at` for that profile.
- Viewer's follow status toward this profile (requires current session; anonymous viewers see the logged-out follow state).
- Claimed designs list, newest-claim-first, joined to `vibes` (for tag + gradient) and pricing.

## Out of scope

- Inline/quick-buy on the storefront (explicitly deferred — full flow lives on `/design/[id]`).
- Royalty amounts/ledger — that's the claimant's private dashboard (`app/dashboard`), never shown on the public storefront.
- Rented-column display — column rentals are a home-feed concept, not part of the personal storefront.
- Storefront customization (themes, reordering, custom bio sections) — v1 is system-styled and fixed-layout, per DESIGN.md.

## Open question to confirm before/while implementing

`DATA_MODEL.md`'s `storefronts` table has its own `slug`, separate from `profiles.handle`, and is described as "auto-provisioned on claim" — implying no `storefronts` row exists until first claim. This spec assumes the public route stays keyed on `profiles.handle` directly (so it never 404s pre-claim, per your empty-state answer) and that the `storefronts` table's `slug` is either dropped or just kept in sync with `handle` behind the scenes. Flag if `storefronts.slug` is meant to diverge from `handle` (e.g. a separately-editable shop URL) — that would change the routing/lookup approach here.
