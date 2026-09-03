# Technical Requirements Document — Shirt Bazaar

Grounded in the current codebase (2026-09-03). Full architectural detail lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md); this document states requirements and constraints, not a re-derivation of the diagrams.

## 1. System summary

Single Next.js 16 (App Router, Turbopack) application. No standalone backend service — every mutation is a Next.js Route Handler (6) or Server Action (27). Postgres via Supabase is both the database and, through Row-Level Security, most of the authorization layer. No ORM; schema is hand-written SQL migrations.

## 2. Stack requirements

| Layer | Choice | Version (as pinned) |
|---|---|---|
| Framework | Next.js, App Router, Turbopack | 16.2.6 |
| UI | React | 19.2.4 |
| Language | TypeScript, strict mode | ^5 |
| Styling | Tailwind CSS 4 + shadcn/ui + `@base-ui/react` | — |
| Database / Auth / Storage | Supabase (Postgres + RLS + Auth + Storage) | `@supabase/supabase-js` ^2.111.0 |
| Image generation | MuAPI (`gpt-image-2-text-to-image`) | — |
| Text composition | MuAPI (`kimi-k3`) | — |
| Persona vision analysis | OpenRouter (`google/gemini-2.5-flash`) | — |
| Fulfillment | Printify API | — |
| Payments (design purchase) | Bolt (embedded modal + signed webhook) | — |
| Payments (garment reorder) | **Mock adapter — not production-ready** | — |
| Email | Resend HTTP API, Gmail SMTP fallback | `nodemailer` ^9 |
| Image processing | `sharp` — **undeclared in package.json**, see §6 | present via `next`'s `optionalDependencies` |
| Charts | `recharts` | ^3.8.0 |

Node package manager: npm (`package-lock.json` present). No monorepo tooling, no separate workspaces.

## 3. Environment configuration

All secrets are server-only unless prefixed `NEXT_PUBLIC_`. Full behavior-when-unset table is in `ARCHITECTURE.md` §External Integrations; summarized here as a deployment checklist:

| Required for | Env vars | If missing |
|---|---|---|
| App to run at all | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Hard failure |
| Generation | `MUAPI_API_KEY` | Generation throws immediately |
| Personas | `OPENROUTER_API_KEY` | Persona creation fails only |
| Fulfillment | `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `PRINTIFY_BLUEPRINT_ID`, `PRINTIFY_PRINT_PROVIDER_ID`, `PRINTIFY_SUBMIT_ORDERS` | Falls back to drawn mockups, no real products/orders; leave `PRINTIFY_SUBMIT_ORDERS=false` until the garment-payment mock is replaced (see §6) |
| Design payments | `BOLT_API_KEY`, `BOLT_SIGNING_SECRET`, `NEXT_PUBLIC_BOLT_PUBLISHABLE_KEY`, `BOLT_ENV`, `NEXT_PUBLIC_BOLT_ENV` | Priced claims refuse cleanly; free claims unaffected |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Purchases still complete, no email sent, warning logged |
| Correct absolute URLs | `NEXT_PUBLIC_SITE_URL` | Falls back to localhost — **must** be set in production (Bolt redirects, receipt links depend on it) |

`.env.example` is the source of truth for names; no `.env.local` values were read or should ever be committed (already correctly gitignored).

## 4. Data & API

- Schema: 17 tables + 1 view, RLS enabled on every table, one non-standard column-level grant carve-out on `designs` (hides `prompt` from all client roles). Full entity/relationship detail: [`DATA_MODEL.md`](./DATA_MODEL.md).
- Surface: 6 route handlers + 27 Server Actions, no other API layer (no `pages/api`, no tRPC/GraphQL). Full per-endpoint contract: [`API.md`](./API.md).
- Two known schema/code mismatches to resolve (see `DATA_MODEL.md` for detail): `generation_jobs`'s RLS no longer allows the public read the design-detail page's join depends on, and `messages` has no UPDATE policy, so mark-as-read silently no-ops.

## 5. Non-functional requirements

### Security
Baseline requirement: every finding in [`SECURITY.md`](./SECURITY.md) rated Medium or higher should be closed before this app carries real user payments and PII at scale. Currently one High (open redirect in the OTP/password-recovery confirm flow — one-line fix, route `next` through the existing `safeNext()` guard) and one Medium (unvalidated avatar upload with a base64-into-DB fallback). RLS coverage, webhook signature verification, and the watermark/original-image split are already sound and should be preserved as the pattern for new features, not just left alone.

### Performance
Not yet load-tested. Observed dev-server response times for cold Server Component renders ran 1–6s (Turbopack dev mode; production build times will differ but weren't measured in this audit). One recurring warning: LCP images served through `next/image` without `loading="eager"` on above-the-fold design mockups. No CDN/edge-caching strategy has been verified beyond Next's own image optimizer.

### Reliability
- Generation: no seed/dedup mechanism — the "never regenerate identically" guarantee is a property of the underlying diffusion model's stochasticity, not something the app enforces. If MuAPI's model ever accepted or defaulted to a fixed seed, this guarantee would silently stop holding, with nothing in the code to catch it.
- Payments: the design-purchase path (Bolt) is idempotent and race-safe (webhook + browser fast-path converge on one fulfillment function, keyed by a unique `payment_ref`). The garment-reorder path has no such rigor because it isn't real yet (mock adapter).
- Fulfillment: Printify product creation is deferred to listing time (not generation time) specifically to avoid creating products for designs nobody lists — a real cost-control constraint, not an oversight; preserve this ordering in any refactor.

### Testing
No test framework — `npm test` runs ~24 files straight through `npx tsx`, each file its own inline-assertion script (see `package.json`'s `test` script for the full list). This is adequate for the pure-function `lib/` layer it currently covers (validators, prompt building, formatting) but there is **no integration/E2E coverage** of the Server Actions, RLS policies, or payment/fulfillment flows — the riskiest code in the app (money movement, claim races, RLS) is currently unverified by any automated test. Before scaling this: at minimum, add coverage for `claim_design_for()`'s race behavior and the Bolt webhook/fast-path convergence in `fulfilBoltTransaction()`.

### Deployment
No explicit IaC/deploy config found in the repo (no `vercel.json`, no Dockerfile), but `.gitignore` carries a Vercel entry, implying Vercel is the intended target. `experimental.serverActions.bodySizeLimit` is set to 10mb (`next.config.ts`) — relevant if hosting elsewhere, since some platforms cap request body size below that.

## 6. Known technical debt / must-fix-before-scale

1. **`sharp` is an undeclared dependency.** `lib/images/watermark.ts` imports it directly, but it isn't in `package.json` — it currently only exists in `node_modules` because Next lists it as an `optionalDependency`. Any environment that skips optional deps (`--omit=optional`), lacks a prebuilt binary for its platform, or a future Next version dropping that recommendation will silently break every watermarked image response, with zero signal in `package.json` that anything changed. **Fix: add `sharp` to `dependencies` explicitly.**
2. **Garment-reorder payments are a mock adapter.** `lib/payments/checkout.ts`'s `charge()` always succeeds. Real Printify order submission is correctly gated off (`PRINTIFY_SUBMIT_ORDERS=false` by default) specifically to prevent mock money from shipping real garments — this gate must stay in place until a real payment processor is wired into that path.
3. **Royalty ledger has no writer.** `royalty_ledger` is read from in three places in `lib/data/` but nothing inserts into it, because there is no resale flow (see `PRD.md` §7). This is a product decision as much as a technical one — resolve the product question before building the plumbing.
4. **Open redirect** — see §Security above, one-line fix, two files (`app/api/auth/confirm/route.ts`, `app/(auth)/reset-password/confirm/actions.ts`).
5. **Notification emails are unwired.** `notificationEmail()` in `lib/email/templates.ts` is fully implemented but never called — DB triggers write notification rows but nothing turns them into an email. Needs a Supabase Database Webhook or a cron sweep, per the function's own code comment.
6. **Stale comment in `/api/generate`** describing a 4-image batch that was cut to 1 (`IMAGES_PER_JOB = 1`) — the `maxDuration = 300` timeout budget was sized for the old batch size and should be revisited now that only one image generates per job.
7. **Service-role client construction is duplicated** in three files (`app/api/generate/route.ts`, `lib/printify/sync.ts`, `app/(public)/design/[id]/order-actions.ts`) instead of imported from one place — flagged in-code with a `ponytail:` comment as known duplication to fold in later.

## Related documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — full system diagrams and subsystem walkthrough
- [`DATA_MODEL.md`](./DATA_MODEL.md) — schema, RLS, storage
- [`API.md`](./API.md) — every route handler and Server Action
- [`SECURITY.md`](./SECURITY.md) — full findings with evidence
- [`PRD.md`](./PRD.md) — product requirements and scope
