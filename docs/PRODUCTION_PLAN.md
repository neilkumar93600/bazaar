# Production Plan — Shirt Bazaar

Scoped from a direct ask: go live on a real domain, switch Bolt to production, add paid plans that gate storefront customization, and let creators add bank details to get paid on their sales. This document lays out what each of those actually requires given the current codebase (see [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`TRD.md`](./TRD.md), [`SECURITY.md`](./SECURITY.md) for the underlying detail), plus what else I'd add before calling this production-ready. Nothing here is implemented — this is the plan, not the build.

## Before anything else: what "get paid" currently means

This matters more than it looks like, because it changes the size of item 4. Today, **no creator receives money at any point, for anything.** Confirmed directly in the schema: `designs.creator_id`'s own column comment says *"Paid once at claim, then out — no royalties, no control."* When a buyer claims a priced design, 100% of that payment goes to the platform's Bolt merchant account. The "10% on every resale" figure (`ROYALTY_RATE_PERCENT` in `lib/royalty.ts`) only applies to a *second* sale of an already-claimed design — and that resale mechanism doesn't exist at all (a claim is permanent and singular; nothing in the codebase ever writes to `royalty_ledger`).

So "add bank details so creators get paid" isn't a payout-rail bug fix — it's a business-model decision that has to be made first:

- **Does the original maker get a cut of the primary claim sale**, or only of resales (as currently marketed)?
- If primary-sale cuts are new, what's the split (platform fee vs. creator share)?
- Does the free/paid plan tier (item 3) change that split?

Everything below assumes this gets decided before engineering starts on item 4 — building the payout rail before the split is decided means building it twice.

---

## 1. Domain

**Current state:** `NEXT_PUBLIC_SITE_URL` in `.env.example` is commented as `https://bazaar-jet.vercel.app "while the real domain is pending."` Email is running on a Gmail SMTP fallback specifically because *"the domain isn't verified in Resend"* (`lib/email/send.ts`) — the domain move and email deliverability are the same piece of work, not two.

**Steps:**
1. Buy/point the domain, add it in Vercel, issue TLS (automatic on Vercel).
2. Verify the domain in Resend (SPF/DKIM/DMARC records) and set `EMAIL_FROM` to an address on it. Once verified, drop `GMAIL_USER`/`GMAIL_APP_PASSWORD` — `lib/email/send.ts` will stop needing the stopgap, and receipts stop coming from a Gmail-rewritten `From` header.
3. Set `NEXT_PUBLIC_SITE_URL` to the real origin. It's build-time baked (`NEXT_PUBLIC_`), so this needs a redeploy, not just an env change — audit anywhere it's used before launch: Bolt redirect targets, receipt links, OAuth callback origin.
4. Update the Supabase Auth allowed redirect URLs and the Google/Apple OAuth app configs (both currently point at whatever origin dev/staging used) to the new domain.
5. Update Bolt's dashboard webhook URL (see item 2 — do this in the same pass as the Bolt production cutover, not separately, since both need the real domain live first).
6. Re-check `robots`/sitemap/canonical URLs in `lib/seo/design-schema.ts` and page metadata — anything hardcoded to the Vercel preview domain needs to follow.

## 2. Bolt: sandbox → production

**Current state:** `lib/payments/bolt.ts` already branches on `BOLT_ENV` (defaults to sandbox); the integration itself — order token minting, webhook signature verification via `timingSafeEqual`, idempotent fulfillment — is solid and was verified clean in the security review. This is a config/ops cutover, not a code change.

**Steps:**
1. Get live Bolt Merchant Dashboard credentials: `BOLT_API_KEY`, `BOLT_SIGNING_SECRET`, `NEXT_PUBLIC_BOLT_PUBLISHABLE_KEY`.
2. Set `BOLT_ENV=production` and `NEXT_PUBLIC_BOLT_ENV=production`. Do this only on the production environment's env vars — a dev branch with this flipped charges real cards (the `.env.example` comment says this explicitly).
3. Register the production webhook endpoint (`https://<real-domain>/api/bolt/webhook`) in Bolt's dashboard, subscribed to `payment`, `auth`, `capture` — matching what `lib/payments/bolt.ts` already expects.
4. Run one real low-value transaction end to end before opening to real users: claim a $1 test design, confirm the webhook *and* the browser fast-path both converge correctly (this dual-path convergence is exactly what `fulfilBoltTransaction()` is built to handle — worth proving it live once).
5. Decide what happens to `PRINTIFY_SUBMIT_ORDERS` at this point. It's correctly off by default because garment reorders still run on a mock payment adapter (`lib/payments/checkout.ts`) — going live on Bolt for *design* purchases does not make it safe to flip this on; that's a separate, still-unbuilt payment path (see §5).

## 3. Paid plans (free vs. upgraded storefront/creation access)

**Current state:** there's no plan/tier concept anywhere in the schema or code today. What exists that a plan could gate:
- `lib/generation/quota.ts` — `DAILY_CAP` (default 5/24h), currently a single global constant, not per-user.
- `lib/storefront/theme-prompt.ts` / `banner-prompt.ts` — AI storefront theming and banner generation. The banner generator is already flagged in `ARCHITECTURE.md` as a real, non-trivial cost (~$0.09/press via MuAPI), deliberately isolated into its own button for that reason — this is the natural first thing to put behind a paid tier, since it already has a per-use cost you'd otherwise be eating for free users.
- Style presets (`lib/generation/styles.ts`) and print quality tiers (`Quality` in the create form) — could gate "premium" styles/quality behind a plan the same way.

**What needs to be built, concretely:**
1. **A plan model.** Minimum: a `plan` (or `subscription_tier`) column on `profiles`, or a `subscriptions` table if you want billing history/renewal state tracked properly rather than a single current-tier flag. Given item 4 already needs a `subscriptions`/`billing` concept for payouts, design these together.
2. **A billing processor for recurring charges.** Bolt's integration in this codebase is a one-time embedded-checkout-modal flow (`createOrderToken()` per purchase) — nothing here indicates Bolt recurring/subscription billing is wired up or even necessarily supported the same way. This needs a decision: check whether Bolt supports subscriptions before assuming it does, or plan to add Stripe Billing alongside Bolt (Stripe's subscription product is mature and would run independently of the Bolt design-purchase flow). Don't discover this mid-build.
3. **Enforcement points**, once the plan model exists:
   - `countRecentGenerations()`/`DAILY_CAP` in `lib/generation/quota.ts` becomes per-plan instead of one global constant.
   - Gate `generateThemeFromPrompt()` / `generateBannerFromPrompt()` calls (`app/dashboard/settings/actions.ts`) behind plan check — cheapest place to start given the existing per-press cost comment.
   - Decide whether claiming itself (not just generating) should have a plan-gated benefit — e.g. a lower/zero platform fee for paid creators, which ties directly into the split decision in item 4.
4. **Free-tier definition that's actually a funnel, not just a wall.** Worth reading against [`GROWTH_AND_RETENTION.md`](./GROWTH_AND_RETENTION.md)'s activation finding: `/create` is currently gated behind signup entirely, before any plan question even applies. Introducing a paid tier without first fixing that means the paywall stacks on top of an account-wall, which compounds the drop-off this doc already flagged as the single biggest activation risk.

## 4. Creator payouts (bank details on file)

Once the business-model question at the top of this doc is answered, the build is a standard marketplace-payout problem:

1. **Payment processor for payouts.** Bolt is a buyer-side checkout product in this codebase (card capture + a merchant order token) — nothing in `lib/payments/` suggests it does connected-account payouts to third parties (creators). The standard tool for "collect a creator's bank details, verify identity, split and pay out" is **Stripe Connect** (Express accounts are the usual fit for a marketplace like this — Stripe handles KYC, bank verification, and tax form collection, so this app doesn't have to). This would run alongside Bolt (Bolt still collects the buyer's payment; Connect handles the creator-side payout), not replace it, unless the Bolt-vs-Stripe question above resolves toward consolidating on one processor.
2. **Onboarding flow.** A "Connect your bank" action in `app/dashboard/settings`, redirecting to Stripe's hosted Connect onboarding (don't build custom bank-detail collection forms — that's PCI/KYC liability worth paying Stripe to hold instead).
3. **The ledger needs an actual writer.** `royalty_ledger` exists, has RLS, and is read by the dashboard — but per the finding above, nothing inserts into it. Whatever the split decision lands on (primary sale, resale, or both), the fulfillment code path (`lib/payments/fulfil.ts`'s `fulfilBoltTransaction()`, or a new resale-claim path) needs to write a ledger row at the moment money is confirmed, not compute payouts retroactively from `orders`.
4. **Payout job.** `PAYOUT_THRESHOLD_CENTS` (5000, i.e. $50) already exists as the accrual bar — build the sweep that pays out everyone over threshold (Stripe Connect transfers), on a schedule (weekly is the common default), plus a manual "pay out now" admin path for support cases.
5. **Compliance surface this opens up:** 1099 (US) or equivalent tax reporting once real payouts exist, updated Terms of Service / Creator Agreement language (currently untouched by this — check `app/(legal)/terms` reflects the real payout terms once decided), and a data-handling review specifically for bank/identity data even though Stripe Connect holds most of it directly (Connect's hosted onboarding keeps bank details off this app's own database, which is the right default — don't build a path that stores them locally instead).

---

## 5. What I'd add before calling this production-ready

Not asked for directly, but everything below either blocks the four items above or is the kind of gap that's cheap now and expensive after real money is moving:

- **Close the High-severity open redirect and the other `SECURITY.md` findings** if not already done by the time this ships — one of them (open redirect on the OTP/recovery confirm flow) is a live phishing primitive on the exact auth surface a bank-details onboarding flow will point people through.
- **A CSP**, deferred in this session's security pass specifically because it needs live verification against Bolt's embedded modal and OAuth redirects — do that verification now, before Stripe Connect's hosted onboarding becomes a third third-party surface to account for.
- **Analytics/instrumentation.** `FEATURE_INVENTORY.md` confirmed there is currently no analytics or tracking anywhere in the app. You cannot evaluate whether the paid plan is converting, or where payout onboarding drops people, without it — add this before launch, not after, so day-one numbers exist to compare against.
- **Notification emails, actually wired.** `notificationEmail()` is fully written and unused (`lib/email/templates.ts`) — once real money and payouts are involved, "your design sold" / "payout sent" are exactly the notifications that should not depend on a user having the dashboard open.
- **Error monitoring** (Sentry or equivalent) — nothing in the stack currently reports server-side exceptions anywhere but `console.error`. Once Bolt is live and Connect payouts exist, a silent failure in `fulfilBoltTransaction()` or a payout sweep is a money bug, not a log line.
- **A real staging environment**, separate Supabase project + Bolt sandbox + a non-production domain, so the domain/Bolt/billing cutover in items 1–3 can be rehearsed once before it's done for real. Right now dev points at what appears to be a single shared Supabase project.
- **Rate limiting** on the public, unauthenticated insert endpoints (`SECURITY.md`'s Low finding — newsletter/contact forms) becomes more relevant once the site is on a real domain and discoverable.
- **A resale mechanism**, if the business decision in the payout section is "yes, the 10% resale royalty stays as marketed" — that's a real feature (list-a-claimed-design-for-resale flow, second claim, ledger write), not a config change, and should be scoped and estimated on its own once decided.

## Related documents

- [`PRD.md`](./PRD.md) — product scope and current known risks (§7 already flags the royalty/resale gap this plan's §"Before anything else" expands on)
- [`TRD.md`](./TRD.md) — environment configuration, tech debt
- [`SECURITY.md`](./SECURITY.md) — findings referenced throughout §5
- [`GROWTH_AND_RETENTION.md`](./GROWTH_AND_RETENTION.md) — the `/create` signup-wall finding referenced in §3
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Bolt/Printify/payments subsystem detail
