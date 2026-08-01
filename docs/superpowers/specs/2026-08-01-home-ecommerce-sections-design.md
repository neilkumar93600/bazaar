# Home Page — Additional Ecommerce Sections Design

Date: 2026-08-01

## Context

`docs/superpowers/specs/2026-08-01-navbar-home-storefront-design.md` deliberately kept Home lean (Hero + catalog only) and deferred "categories, trending, or creator-spotlight sections" to a future spec. Since then `VibeTiles`, `TrendingRow`, and `TopCreatorsRow` shipped, so Home today is:

```
Hero → Shop by vibe → Trending now → New drops (Feed) → Top creators
```

This spec adds the ecommerce-standard sections still missing: a trust/value strip, a mechanic explainer, live social-proof stats, and a creator-focused closing CTA. Footer (`components/layout/Footer.tsx`, rendered in `app/(public)/layout.tsx`, outside `page.tsx`) already ends every page with a buyer-facing CTA ("Your vibe is out there. Claim it." + Get started) — the new closing CTA in this spec is intentionally a *different* angle (creator economics) so it doesn't repeat Footer's message.

## New section order

```
Hero
TrustStrip        <- new
Shop by vibe
Trending now
HowItWorks         <- new
New drops (Feed)
StatsBar           <- new
Top creators
CreatorCta         <- new
Footer (layout, unchanged)
```

Rationale: alternates proof/explainer sections between the existing browse rows rather than front- or back-loading them, so the page doesn't read as two disconnected halves (all-narrative-then-all-product, or vice versa).

## Sections

### TrustStrip (`components/home/TrustStrip.tsx`)

Static, no props/data. Full-width `bg-secondary` (cream `#f8f6f2`) band directly under Hero. 4 items, `grid grid-cols-2 sm:grid-cols-4`, each: coral icon (lucide-react, 20-24px) + bold label + one-line gray copy. No card borders/containers — matches DESIGN.md's "Logo Bar Section" pattern (whitespace-separated on a warm band, not boxed).

| Icon | Label | Copy |
|---|---|---|
| `Shield` | One-of-one | Every claim is exclusive. No reprints, no duplicates. |
| `RefreshCw` | Resale royalties | Earn a cut every time your design resells. |
| `Lock` | Secure checkout | Stripe-secured payments, every order. |
| `Store` | Your storefront | Claim a design, get a shareable storefront instantly. |

Motion: `Stagger` wraps the grid, each item is a `StaggerItem` (both from `components/ui/motion.tsx`, already used this way in `Footer.tsx`) — reveals once when scrolled into view.

### HowItWorks (`components/home/HowItWorks.tsx`)

Static, no props/data. White canvas, section heading `text-heading-lg` "How Bazaar works." 3 steps, `grid grid-cols-1 md:grid-cols-3 gap-8`. Each step: big coral display digit (`text-display` token, e.g. "01") + `text-heading-sm` step name + 2-line `text-body` description.

| # | Name | Copy |
|---|---|---|
| 01 | Claim | Browse designs. Claim the one that's you — once claimed, it's yours alone. |
| 02 | Own | Get a personal storefront instantly. Wear it, share it, own it. |
| 03 | Resell | Every resale pays you a royalty, automatically. Your claim keeps earning. |

Motion: `Stagger`/`StaggerItem` per step, same sequential on-scroll reveal as TrustStrip — reads as the numbers appearing 01 → 02 → 03 in order.

### StatsBar (`components/home/StatsBar.tsx`)

Props: `{ stats: HomeStats }` fetched server-side in `page.tsx`. Full-width `bg-secondary` band, 3 big numbers side by side (`grid grid-cols-1 sm:grid-cols-3`), each a `CountUp` value (`text-display`) + label underneath (`text-body-sm text-muted-foreground`).

- Designs claimed — count of `claims` rows
- Creators earning — count of `storefronts` rows
- Royalties paid out — `$` sum of `royalty_ledger.amount_cents` where `paid_at is not null`, formatted from cents to whole dollars

No fabricated numbers — all three come from real tables that already exist (`claims`, `storefronts`, `royalty_ledger`, per `supabase/migrations/20260731000000_init_schema.sql`).

Data (`lib/data/home.ts`):

```ts
export type HomeStats = {
  designsClaimed: number;
  creatorCount: number;
  royaltiesPaidCents: number;
};

export async function getHomeStats(): Promise<HomeStats> {
  const supabase = await createClient();
  const [claimsCount, storefrontsCount, royaltyRows] = await Promise.all([
    supabase.from("claims").select("*", { count: "exact", head: true }),
    supabase.from("storefronts").select("*", { count: "exact", head: true }),
    supabase.from("royalty_ledger").select("amount_cents").not("paid_at", "is", null),
  ]);
  return {
    designsClaimed: claimsCount.count ?? 0,
    creatorCount: storefrontsCount.count ?? 0,
    royaltiesPaidCents: (royaltyRows.data ?? []).reduce((sum, r) => sum + r.amount_cents, 0),
  };
}
```

<!-- ponytail: royalty sum scans every paid royalty_ledger row in JS. Fine at current scale; move to a SQL sum/RPC if the table grows large enough for this to show up in query time. -->

Motion: new `CountUp` primitive in `components/ui/motion.tsx`, following the file's existing conventions (`useReducedMotion` → renders the static final number instantly; otherwise animates 0 → value once on scroll into view via `whileInView`/`useInView` + `animate()` on a `useMotionValue`).

### CreatorCta (`components/home/CreatorCta.tsx`)

Static, no props. Dark charcoal (`bg-charcoal` / `#141414`) full-width band — distinct from the cream `TrustStrip`/`StatsBar` bands and from Footer's dark video-train section, breaks the cream monotony right before Footer. Headline "List it. Sell it. Earn forever." + one-line subcopy on the royalty mechanic + single coral `Button` ("Start creating") → `/signup`. Only one coral CTA in this section's viewport (DESIGN.md rule: one primary coral action per screen).

Motion: `Reveal` on the headline/subcopy/button group (same as `Hero`'s and `Footer`'s existing whileInView fade-up).

## Data flow

`app/(public)/page.tsx` adds one more parallel fetch: `getHomeStats()` alongside the existing `getFeedColumns`/`getVibeTiles`/`getTrendingDesigns`/`getTopCreators` calls in the `Promise.all`. `TrustStrip`, `HowItWorks`, `CreatorCta` take no data and no props.

## Edge cases

- `StatsBar` always renders (unlike `VibeTiles`/`TrendingRow`/`TopCreatorsRow` which return `null` when empty) — zero is a valid, honest state for a new marketplace and the section's whole point is showing real numbers, including small ones.
- `royaltiesPaidCents` division/formatting: whole-dollar display, rounds down (`Math.floor(cents / 100)`), no cents shown.
- `CountUp` under `prefers-reduced-motion`: renders the final formatted value immediately, no animation — same pattern as every other primitive in `motion.tsx`.
- `TrustStrip`/`HowItWorks`/`CreatorCta` have no empty states (fully static copy).

## Testing

Manual verification in dev: scroll through Home and confirm all 4 new sections render in order, reveal-on-scroll fires once per section (not on every re-scroll), `StatsBar` numbers count up and match real counts from Supabase, `prefers-reduced-motion` shows all content instantly with no animation, mobile viewport stacks TrustStrip to 2x2 and HowItWorks to a single column, CreatorCta button navigates to `/signup`.
