# Shirt Bazaar — Build Progress

One line per route from `docs/ARCHITECTURE.md`. Check off as each ships (route file + local `components/` + any migration it needed), commit named after the item.

## Foundation (not a route, blocks everything below)
- [x] Supabase project connected (MCP registered; schema migration + seed written, pending user OAuth to apply)
- [x] Design tokens + fonts wired into `app/globals.css` / `app/layout.tsx` (dark-only palette, Bebas Neue display + Inter body)
- [x] Persistent chrome: `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`

## Storefront (public)
- [x] `/` — home / vibe-column feed (code complete; render unverified live — blocked on Supabase OAuth, see Notes)
- [ ] `/design/[id]` — design detail + claim/purchase
- [ ] `/creator/[handle]` — claimant's personal storefront
- [ ] `/search` — cross-vibe, cross-creator search

## Auth
- [ ] `/login`
- [ ] `/signup`
- [ ] `/forgot-password`
- [ ] `/verify-otp`
- [ ] `/reset-password`

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
- [ ] `/dashboard/create` — generation flow
- [ ] `/dashboard/designs` — owned designs & claims, storefront mgmt, royalty tracking
- [ ] `/dashboard/messages` — inbox
- [ ] `/dashboard/settings` — Account / Notifications / Twin (placeholder) / AI / Payouts tabs
- [ ] `/dashboard/orders` — purchase history

## Notes
- Migration source of truth lives in `supabase/migrations/` (RLS policy per table per `docs/SECURITY.md`, hardened against the supabase-postgres-best-practices skill: `(select auth.uid())`, FK indexes, `security_invoker` view). Seed data (6 vibes + placeholder designs) in `supabase/seed.sql`.
- Blocked on: Supabase MCP OAuth (`claude /mcp` in an interactive terminal, pick `supabase`, authenticate) — needed to (1) apply the migration + seed, (2) pull the project URL/anon key into `.env.local` (see `.env.example`), (3) render/verify `/` against live data.
- Env vars required by the app: see `.env.example`.
- Typecheck + lint are clean (`npm run typecheck`, `npm run lint`). Dev server boots and correctly fails only on the missing Supabase env vars — confirms the data-fetch wiring (proxy → server client → `lib/data/feed.ts` → page) is correct end to end.
