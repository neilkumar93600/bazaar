# Growth & Retention — Bazaar

Grounded in the actual codebase (`e:\Gray Matter Labs\bazaar`) as of 2026-09-03, and in live browsing of the dev app (correct port: **http://localhost:3001** — port 3000 on this machine is a different, unrelated project ("Echo") and was not used for any finding below). Every recommendation below either names the existing file/component it would extend, or says explicitly "requires new: X."

---

## 1. Current State Snapshot

Bazaar already has more retention infrastructure built than a first look suggests — most of it is just not wired end-to-end.

### Built and working

| Mechanic | Where | Notes |
|---|---|---|
| Notifications (claim / royalty / message / order) | `supabase/migrations/20260811034201_baseline_schema.sql` lines 379–481 (4 Postgres triggers: `notify_on_claim`, `notify_on_royalty`, `notify_on_message`, `notify_on_order_status_change`), read via `lib/data/notifications.ts` | Real DB-level event triggers, not stubs. Each checks the recipient's `notification_preferences` row before writing. |
| Notification UI | `components/dashboard/NotificationBell.tsx`, wired in `app/dashboard/layout.tsx` | A header **popover only** — despite a folder at `app/dashboard/notifications/`, there is **no `page.tsx` there**, only an `actions.ts` (mark-all-read). The route `/dashboard/notifications` does not exist as a page. Popover is capped at 20 rows (`NOTIFICATIONS_LIMIT` in `lib/data/notifications.ts`), no "view all." |
| Notification **emails** | `lib/email/templates.ts`, `notificationEmail()` | Fully written (covers all 4 types, honors preferences) but **explicitly unused** — the function's own comment: *"ponytail: nothing sends these yet — notifications are written by database triggers, and a trigger cannot make an HTTP call. Wire them from a Supabase webhook or a cron sweep..."* |
| Direct messages | `app/dashboard/messages`, `app/dashboard/messages/[handle]` | Real 1:1 threads, unread badges, triggers a `message` notification. |
| Personas (style reuse) | `app/dashboard/personas`, `components/dashboard/PersonaManager.tsx`, `lib/generation/persona-analysis.ts` | Upload 10–50 of your own past designs → a vision model writes a style summary → reusable in the create form's persona picker (`components/create/CreateForm.tsx`). This is the app's real "make more like this" mechanic. |
| AI storefront theming | `components/dashboard/StorefrontThemePrompt.tsx`, `lib/storefront/theme.ts` | Unusual, genuinely clever: the creator pastes a mood description into their own ChatGPT/Claude, pastes the reply back here, and it becomes their storefront's theme tokens. Real feature, not a stub. |
| Follow + storefront | `components/storefront/FollowButton.tsx`, `StorefrontHeader.tsx` | Follower count, "Verified Creator" badge, claimed-count. |
| Share | `components/storefront/ShareButton.tsx` | Copy-link to clipboard only. |
| Dashboard analytics | `app/dashboard/page.tsx`, `lib/data/dashboard.ts`, `DashboardAnalyticsChart`, `RoyaltyGoalGauge`, `CreationQuotaGauge` | Real month-over-month deltas, top-earning designs, recent activity feed — well built, not fabricated numbers (the code has a comment about having *removed* a hardcoded quota number that disagreed with the real one). |
| Daily generation quota | `lib/generation/quota.ts` — `DAILY_CAP` (default 5/24h rolling window) | A structural Duolingo-hearts-style "come back" hook already exists; nothing currently pings the user when it resets. |
| Royalty ledger | `lib/royalty.ts` — `ROYALTY_RATE_PERCENT = 10`, `PAYOUT_THRESHOLD_CENTS = 5000` | Accrues correctly and is shown on the dashboard, **but** the file's own comment: *"Nothing pays out against it yet — when the payout path lands it must read this constant."* Creators see a pending-payout number they currently cannot withdraw. |

### Confirmed absent (checked via grep + live browsing, not assumed)

- **No remix/duplicate/regenerate-from-existing-design action anywhere** — grepped the whole repo for `remix`, `duplicate`, `regenerate` semantics tied to a design; nothing. `CreateForm.tsx`'s "Redesign" button only resets the *current in-progress session* back to the same prompt/style — it has no entry point from an already-listed design's page.
- **No favorite / wishlist / save-for-later** — grepped `favorite|bookmark|wishlist` across the repo; zero hits outside a decorative `Heart` icon used to label the "Adopted" tab in `components/dashboard/MyDesignsClient.tsx` (designs you made that someone *else* claimed — unrelated to favoriting).
- **No view-count / "trending" / social-proof signal** on any design or storefront — no such column or table in `lib/data`.
- **No new-follower notification** — the trigger list in the baseline migration covers `claims`, `royalty_ledger`, `messages`, `orders`; there is no `notify_on_follow` on `public.follows`.
- **No abandoned-cart recovery** — `checkout_intents` rows exist (`lib/payments/fulfil.ts`) but nothing sweeps stale/unfinished ones to send a recovery email.
- **No anonymous preview of the create flow** — confirmed live (see §2).

---

## 2. Activation (first session → first design → first claim/listing)

Live-browsed at `http://localhost:3001`:

- **The public home feed (`/`) and public design pages (`/design/[id]`) are genuinely good.** Home is a masonry feed of real listings with price, creator, "X days ago," Claim-it CTAs. A design page has a shirt/art toggle, 11 color swatches, front/back sides, a "Buy now" button, an accordion for edition/status/vibe/mint-date, and two recommendation carousels ("More from [creator]," "More in [vibe]"). This is solid top-of-funnel and solid browse/discovery — no changes needed here.
- **The single biggest activation friction: `/create` hard-redirects anonymous visitors straight to `/signup?next=%2Fcreate`.** Confirmed live, and confirmed in code: `lib/supabase/middleware.ts` lists `/create` in `PROTECTED_ROUTES` alongside `/dashboard`, and its own comment explains the choice — *"/create is where that hero button lands — a new-visitor action"* — so it deliberately sends signed-out `/create` traffic to `/signup` (`target = pathname.startsWith("/create") ? "/signup" : "/login"`) rather than `/login` like every other protected route. This is a considered decision, not an oversight — but it still means there is no way to type a prompt, see what the AI does, or evaluate output quality before creating an account. Every AI-generation competitor (Kittl, Placeit, even ChatGPT/Midjourney web) leads with a free/cheap first generation before the paywall; Bazaar currently asks for an account *before* showing the product's core value.
- Signup (`app/(auth)/signup`) itself is reasonable — full name (optional), username, email, password, or Google/Apple OAuth — but it's the wrong place to put the entire value proposition behind, given the finding above.
- Once authenticated, `components/create/CreateForm.tsx` is a clean, well-designed single-screen flow (prompt → style → persona → aspect ratio/quality → generate), with an honest fake-progress bar (the code comments explicitly that `ESTIMATED_SECONDS` is not a real signal, just something for a maker to watch) and clear "Private until listed" messaging.
- **First-time dashboard has no onboarding path.** `app/dashboard/page.tsx` renders a full analytics dashboard immediately — four stat cards, a chart, a "Top Earning" panel — that a day-0 user sees entirely zeroed out ("No activity yet," "Nothing has earned yet"). There's a single "Start creating" link buried in the empty-state, but no checklist ("generate → claim → customize your storefront") anywhere.

**Concrete fixes:**
1. Let an anonymous visitor use `CreateForm.tsx` / `/api/generate` and see a result. Gate only the claim/"Make live" step (where `ListingModal` already sits) behind signup — this reuses 100% of the existing form and generation pipeline; it only requires removing `/create` from `PROTECTED_ROUTES` in `lib/supabase/middleware.ts` (and gating `/api/generate` itself with a stricter anonymous rate limit than the logged-in `DAILY_CAP`, since the route currently assumes an authenticated `user_id` for quota counting per `lib/generation/quota.ts`).
2. Add a 3-step "getting started" checklist to the empty-state on `app/dashboard/page.tsx` (create → claim → visit your storefront) instead of a single unguided CTA — cheap, no new data model, the dashboard already has all three destinations as existing links.

---

## 3. Retention (Day 2 / 7 / 30)

Mapped to specific existing surfaces, not proposed as new subsystems:

- **`lib/data/notifications.ts` + the 4 DB triggers are real, but the loop never leaves the tab.** A creator who isn't sitting in the dashboard when someone claims their design, messages them, or earns them a royalty has no way to find out — the popover in `components/dashboard/NotificationBell.tsx` is the only surface, and `notificationEmail()` in `lib/email/templates.ts` sits fully written and unused. This is the single cheapest retention win available (see §6 #1).
- **No new-follower signal.** `public.follows` has no trigger analogous to `notify_on_claim`/`notify_on_message` in the baseline migration. A creator building an audience currently gets zero feedback when someone follows them — a moment competitors (and most creator platforms generally) treat as a core "someone cares about your work" loop.
- **The daily quota (`DAILY_CAP`, `lib/generation/quota.ts`) is a built-in Day-2 hook with no reminder wired to it.** Nothing tells a user "your 5 generations are back" — the gauge (`components/dashboard/CreationQuotaGauge.tsx`) only shows state to someone already in the dashboard.
- **The one non-transactional email channel is deliberately built to never nudge people back.** `newsletterWelcomeEmail()` in `lib/email/templates.ts` says outright: *"No daily digest, no drip sequence."* That's a legitimate anti-spam stance for the newsletter, but it means today there is no growth-owned re-engagement channel at all besides the still-unwired per-event notification emails above.
- **Messages** (`app/dashboard/messages`) are real and retention-relevant (conversations pull people back) but, like notifications, are in-app-only — no reply-by-email.

---

## 4. Repeat creation/purchase loop

- **Personas are the real mechanic here**, and they're comparable to what Kittl (a genuine AI-design competitor) does with saved "AI image styles" reusable across future prompts (see Research below). Gap: creating a persona (`app/dashboard/personas/actions.ts` → `createPersona`) requires manually re-uploading 10–50 image files from your device — there is no "turn this design into a persona" button on a design you already own in `components/dashboard/MyDesignsClient.tsx` / `app/dashboard/designs/actions.ts`. A maker has to download their own art and re-upload it to close a loop the app already has both halves of.
- **No remix, confirmed.** Nothing lets a buyer or browsing visitor say "make something like this" from someone else's listed design, and nothing lets a creator regenerate variations starting from one of their own past (not-currently-open) designs. `handleRedesign` in `CreateForm.tsx` only resets the current session.
- **No favorite/save-for-later**, confirmed absent by grep. A visitor who likes an unclaimed design but isn't ready to buy has nothing but browser history or the "More in [vibe]" carousel (recommendation, not save-for-later) to get back to it.
- **Follow isn't paired with anything.** Following a creator (`FollowButton.tsx`) doesn't add their new drops to any feed, digest, or notification — it's a count on a profile with no downstream effect (also see §3).
- **Share is a dead-end loop.** `ShareButton.tsx` copies a link with no referral code or credit — sharing a storefront benefits the sharer not at all.

---

## 5. Monetization / creator incentive ideas — grounded in what Bolt/Printify actually support

- **Bolt (`lib/payments/bolt.ts`, `checkout.ts`, `fulfil.ts`) is wired for one-time buyer checkout only.** There is no subscription/recurring-billing call anywhere in `lib/payments`. Any "subscribe to a creator" / membership idea (the kind Fourthwall runs at a 5% flat fee — see Research) is **not supported by the current integration** and would need a new Bolt product type or a second payment rail entirely. Flagging this explicitly rather than pitching it as a quick win.
- **The royalty *ledger* works; the royalty *payout* does not.** `lib/royalty.ts`'s own comment says nothing pays out against `ROYALTY_RATE_PERCENT`/`PAYOUT_THRESHOLD_CENTS` yet. The dashboard shows creators a "Pending Payout" number (`app/dashboard/page.tsx`) they cannot currently withdraw. This is the real prerequisite before pitching *any* new creator-monetization feature — a payout rail (Stripe Connect, PayPal Payouts, or whatever Bolt itself offers on the payout side) is infrastructure work, not a growth feature, but it blocks every monetization idea below it in priority.
- **"Upgrade to pro" already has a UI slot** — `components/layout/DashboardSidebar.tsx` has a hardcoded `disabled` `DropdownMenuItem` with a Crown icon. Nothing behind it. Cheapest realistic Pro perk once/if recurring billing exists: a higher `GENERATION_DAILY_CAP` (already an env-parameterized number in `lib/generation/quota.ts`) — no new concept, just billing gated on an existing knob.
- **Printify (`lib/printify/*`) already handles product sync, mockups, and fulfillment per design** — solid, unclaimed ground for "sell more variants of what you already made" ideas (more garment types via `lib/printify/garments.ts`) that touch zero payment code.

---

## 6. Prioritized shortlist (impact × how cheap it is given existing code)

1. **Wire notification emails.** Impact: high (fixes the single biggest "why didn't I know" gap in retention). Cost: trivial — `notificationEmail()` (`lib/email/templates.ts`) and `sendEmail()` (`lib/email/send.ts`) already exist and are used elsewhere (`lib/purchase/deliver.ts`). Needs one Supabase Database Webhook on `public.notifications` insert → one new API route that reads `notification_preferences` and calls the two existing functions. No new UI, no new schema, no new template.
2. **New-follower notification trigger.** Impact: medium-high. Cost: trivial — copy the shape of `notify_on_claim` (`supabase/migrations/20260811034201_baseline_schema.sql`) as a ~15-line `notify_on_follow` trigger on `public.follows` insert. The notifications table, RLS, bell UI, and (once #1 ships) the email path all already exist.
3. **Let anonymous visitors try the create form before signing up.** Impact: high (fixes the single biggest activation gap). Cost: medium — `CreateForm.tsx` and `/api/generate` already do the work; requires removing `/create` from `PROTECTED_ROUTES` in `lib/supabase/middleware.ts`, adding a stricter anonymous rate limit, and only requiring signup at the claim/"Make live" step where `ListingModal` already lives.
4. **"Turn this design into a persona" button on My Designs.** Impact: medium. Cost: low-medium — `MyDesignsClient.tsx` already has each owned design's image URL; `createPersona` (`app/dashboard/personas/actions.ts`) already accepts a list of image URLs (currently it just requires 10+, so this alone won't satisfy the minimum — bundling several of a maker's own designs, or lowering the minimum for this entry point, closes the gap). Removes a real "download then re-upload" friction without inventing a new subsystem.
5. **Favorite / save-for-later on designs.** Impact: medium (closest analog to Redbubble's Lists — see Research). Cost: higher — **requires new:** a `favorites` table + RLS policy + heart-icon UI across `DesignGallery`, `StorefrontGrid`, and `DesignDialog`, none of which exist today. A genuine net-new subsystem, not a wiring job, so ranked below the four above despite plausible impact.

**Explicitly out of scope for this shortlist** (real, but bigger and payments-gated, not growth features): the royalty payout rail, and any creator-membership/subscription product — both blocked on the same "Bolt is checkout-only today" fact from §5.

---

## Research: what comparable products actually do

- **Fourthwall** — runs automated abandoned-cart recovery: 3 emails (1h / 24h / 72h after cart abandonment) with an automatic 5%-off code baked in, claimed to recover up to 40% more abandoned checkouts. Also runs creator memberships (recurring revenue, tiered perks, member-only posts/video) at a flat 5% platform fee with no monthly cost. ([Abandoned Cart Recovery](https://help.fourthwall.com/manage-my-shop/shop-settings/abandoned-cart-recovery-with-automatic-discounts), [Fourthwall Features](https://fourthwall.com/features))
- **Redbubble** — shoppers save items to "Lists" with a single heart-click, viewable across web and app, and add straight to cart from the list when ready to buy. This is the closest real-world analog to shortlist item #5. ([What are lists?](https://help.redbubble.com/hc/en-us/articles/360036039371-What-are-lists))
- **Printify Pop-Up Store** — a free, fully hosted creator storefront with a live-preview, section-based store builder (banner, theme, logo, layout reordering), custom domain support, and live-preview product personalization (name/date/message on the product before purchase). Useful reference for where Bazaar's own storefront (`components/storefront/*`) could grow. ([Printify Pop-Up Store](https://printify.com/pop-up-store/), [Pop-Up Store tools and features](https://printify.com/blog/pop-up-store-tools-and-features/))
- **Kittl** (AI-first design platform, the closest direct competitor to Bazaar's "prompt → design" core loop) — lets a user save a reference image or canvas selection as a reusable custom "AI image style," reapplied across future prompts and projects, and shows the prompt/style metadata behind any past generation. This is essentially what Bazaar's Personas feature already does — good validation that Personas is the right shape, with the upload-friction gap noted in §4/#4 above as the place it falls short. ([Kittl AI features](https://www.kittl.com/features/ai), [Finding generated content](https://www.kittl.com/help/design/finding-generated-content))

---

## Summary

The single highest-leverage **cheap** win: wire `notificationEmail()` (`lib/email/templates.ts`) to actually send — the template, the trigger data, and the mailer (`lib/email/send.ts`) all already exist; only a Database Webhook + one API route is missing. The single highest-leverage **expensive** win: let anonymous visitors run the create flow before signup, since `/create` currently redirects every signed-out visitor straight to `/signup?next=/create` (confirmed live) and hides the entire AI-generation value prop behind an account wall — every real AI-design competitor leads with a free look at the output.
