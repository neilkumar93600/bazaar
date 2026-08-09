# Shirt Bazaar — Build Progress

One line per route from `docs/ARCHITECTURE.md`. Check off as each ships (route file + local `components/` + any migration it needed), commit named after the item.

## Foundation (not a route, blocks everything below)
- [x] Supabase project connected (MCP registered; schema migration + seed written, pending user OAuth to apply)
- [x] Design tokens + fonts wired into `app/globals.css` / `app/layout.tsx` (dark-only palette, Bebas Neue display + Inter body)
- [x] Persistent chrome: `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`

## Storefront (public)
- [x] `/` — home / vibe-column feed (code complete; render unverified live — blocked on Supabase OAuth, see Notes)
- [x] `/shop` — the Bazaar: full catalog, filter rail + design grid (verified live against seed data)
- [ ] `/design/[id]` — design detail + claim/purchase
- [ ] `/creator/[handle]` — claimant's personal storefront
- [ ] `/search` — cross-vibe, cross-creator search

## Auth
- [x] `/login` — email+password via `signInWithPassword`
- [x] `/signup` — email+password via `signUp` -> `/verify-otp`
- [x] `/forgot-password` — `resetPasswordForEmail`, always reports success
- [x] `/verify-otp` — `verifyOtp(type: 'signup')` -> `/onboarding`, resend action
- [x] `/reset-password` — `updateUser({ password })`

## Legal
- [ ] `/terms`
- [ ] `/privacy`
- [ ] `/child-safety`
- [ ] `/cookies`
- [ ] `/refund-policy`
- [ ] `/acceptable-use`

## Public
- [ ] `/blog`, `/blog/[slug]`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/careers`
- [ ] `/faq`

## Dashboard (authenticated)
- [ ] `/onboarding` — first-session multi-step flow
- [ ] `/dashboard` — overview
- [x] `/create` — generation flow (moved out of `/dashboard`; 24 styles, four-up grid)
- [x] `/dashboard/designs` — designs this user *made*, split Unlisted / Listed / Adopted, with list & delist
- [ ] `/dashboard/messages` — inbox
- [ ] `/dashboard/settings` — Account / Notifications / Twin (placeholder) / AI / Payouts tabs
- [ ] `/dashboard/orders` — purchase history

## Notes
- **Create v2 (2026-08-09).** The generator lives at `/create`, not
  `/dashboard/create`, and signing in lands on `/`. Art direction comes from 24
  presets in `lib/generation/styles.ts` — code, not a table, because they are
  prompt fragments. Two families: `pictorial` keeps the no-letterforms ban
  verbatim, `typographic` replaces it with an exact-string instruction, and
  **nothing else may widen that exception**. Each preset carries a `vibeSlug`,
  so the form asks for a style and the vibe follows. Spec:
  `docs/superpowers/specs/2026-08-09-create-v2-design.md`, plan:
  `docs/superpowers/plans/2026-08-09-create-v2.md`.
- **`cutField` is load-bearing.** Artwork is keyed against a flat colour so
  `ai-background-remover` has an edge. A style painted in that colour is cut
  away entirely — an empty PNG, generated and paid for. Six black-ink presets
  key against white; `styles.test.ts` enforces the invariant across all 24.
- **MuAPI's image endpoint has no `n`.** Four images is four model runs plus
  four background cuts, fanned out with `Promise.allSettled` inside `after()`.
  Worst case is ~240s against `maxDuration = 300`. The job fails only when
  nothing landed. Storage paths are `{jobId}-{index}.png` — the old
  `{jobId}.png` with `upsert: true` would have collapsed four images into one.
- **The daily cap counts jobs, not images, on purpose.** Every job is exactly 4
  images, so `jobs ≤ 5` and `images ≤ 20` are the same constraint — and counting
  design rows would stop charging for *failed* generations, which is the abuse
  case the cap exists for.
- **Ownership model (2026-08-09).** Generation is no longer publication. A
  generated design is private to `designs.creator_id` until they list it —
  `listed_at` null means private *or* delisted, the same state; `price_cents`
  null means listed free. Claiming transfers exclusive ownership to
  `claimed_by`, and the maker loses every right at that instant, enforced by
  the `designs_update_creator_unclaimed` policy rather than by application
  code. The gate is RLS (`designs_select_listed`), not query filters, because
  `designs` is read from the browser with the anon key. Spec:
  `docs/superpowers/specs/2026-08-09-design-ownership-listing-design.md`,
  plan: `docs/superpowers/plans/2026-08-09-design-ownership-listing.md`.
- Printify products are minted when a design is **listed**, not when it is
  generated — minting at generation paid for products nobody would list.
- `generation_jobs_select_public_result` was dropped: it gated on
  `moderation_status`, which no longer implies public, so it would have leaked
  unlisted design ids to `anon`. `designs.creator_id` answers the question it
  existed for.
- Supabase's default privileges grant `execute` on new `public` functions to
  `anon` **directly**, so `revoke ... from public` is not enough — name `anon`
  explicitly or the security advisor will flag every new `SECURITY DEFINER`
  function.
- Migration history is out of sync: `list_migrations` on the remote returns
  fewer entries than `supabase/migrations/` holds, and timestamps disagree.
  Create files with `supabase migration new`; apply deliberately (MCP
  `apply_migration`), never `supabase db push`, until the history is repaired.
- File structure for every remaining route (storefront, legal, public,
  dashboard, onboarding) is scaffolded with a real `page.tsx` (and
  `layout.tsx` for `/dashboard`'s sidebar) so the route table fully
  resolves — content is a shared `ComingSoon` placeholder, routes stay
  unchecked above until built out for real.
- Auth flow decision (not explicit in TRD, recorded so it isn't
  re-derived): signup is email+password (`signUp`), not passwordless —
  the OTP step is only the post-signup email-verification step
  (`verifyOtp(type: 'signup')`), not how returning users log in.
  Returning login is `signInWithPassword`. This assumes the Supabase
  project's "Confirm signup" email template sends a token/code (not
  just a magic link) — verify that in the dashboard once auth is live.
- One design card: `components/shared/DesignCard.tsx`, used by the home feed,
  Trending row, `/shop` grid and creator storefronts. Each data module maps
  its rows into `DesignCardData` instead of growing a card variant — the
  three former cards (`home/DesignCard`, `bazaar/BazaarDesignCard`,
  `storefront/StorefrontDesignCard`) are deleted.
- `designs.price_cents` added by `20260802000000_add_design_price.sql`
  (integer cents, default 2900). Before it, price existed only per-order via
  `orders.amount_cents`, so nothing could show a price before purchase. The
  card's name slot carries the vibe, the price slot the formatted price, the
  subtitle claim state. `designs` still has no title column.
- `/shop` filters are vibe + availability: there is no rating or price-band
  data to facet on beyond price_cents. Filter state lives entirely in the URL
  (links, not client state), so the panel ships zero JS and every view is
  deep-linkable.
- Seed images are local (`public/t-shirt/tee-01..10.png`), not picsum. They
  are 1.6-3.8MB PNGs — fine for dev via next/image, but compress to WebP
  before they go anywhere near production.
- Loading skeletons are per-route, never route-group-wide. `loading.tsx`
  wraps its own `page.tsx` *and every nested route*, so the old
  `app/(public)/loading.tsx` (shaped like the pre-hero feed home) was the
  fallback for all 14 public routes and matched none of them. Home now lives
  in an `app/(public)/(home)/` group purely so its skeleton can be scoped to
  `/` alone. Add a `loading.tsx` next to a page, not above it.
- `docs/DESIGN_SYSTEM.md` is stale — it describes the old light "Pietra warm
  cream" system. `docs/DESIGN.md` (dark-only, molten orange on obsidian) is
  the authority and is what `app/globals.css` implements.
- `proxy.ts` gates `/dashboard*` and `/onboarding` behind a session,
  and bounces logged-in users away from `/login` and `/signup`.
- Migration source of truth lives in `supabase/migrations/` (RLS policy per table per `docs/SECURITY.md`, hardened against the supabase-postgres-best-practices skill: `(select auth.uid())`, FK indexes, `security_invoker` view). Seed data (6 vibes, 84 designs, 10 fake creators with real `auth.users`/`profiles`/`storefronts`/`claims`/`follows` rows) in `supabase/seed.sql` — dev-only, never point it at a real production project.
- Blocked on: Supabase MCP OAuth (`claude /mcp` in an interactive terminal, pick `supabase`, authenticate) — needed to (1) apply the migration + seed, (2) pull the project URL/anon key into `.env.local` (see `.env.example`), (3) render/verify `/` against live data.
- Env vars required by the app: see `.env.example`.
- Typecheck + lint are clean (`npm run typecheck`, `npm run lint`). Dev server boots and correctly fails only on the missing Supabase env vars — confirms the data-fetch wiring (proxy → server client → `lib/data/feed.ts` → page) is correct end to end.
