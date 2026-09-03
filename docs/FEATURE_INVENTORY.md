# Feature Inventory — Shirt Bazaar

Ground-truth as of 2026-09-03, built by exercising the live dev app (`localhost:3001` — **not** `:3000`, which was found squatted by an unrelated "Echo" project during this audit) and cross-reading the code paths behind what was seen. This is a snapshot of what exists today, for a PRD writer — not a roadmap.

## Overview

Shirt Bazaar is a marketplace for **1-of-1 AI-generated shirt designs**. The core loop: a signed-in user generates artwork from a text prompt, picks a variant, and "claims" it — which transfers 100% commercial IP, provisions the claimer an automatic creator storefront at `/creator/[handle]`, and permanently removes that design from the pool (it can never be generated or claimed again). Anyone else can then buy a printed shirt of that design from the claimer's storefront; the original claimer earns a 10% royalty on every resale. Printify handles print-on-demand fulfillment; Bolt handles checkout. There is no shopping cart — every purchase is a single-item "Buy now" flow.

The product is well past a prototype: real Supabase auth (email+password, Google/Apple OAuth, OTP email verification), a real Printify integration (garments, mockups, print areas, order sync), a real Bolt checkout integration (hosted modal + webhook completion), a persona/reference-image system for style-consistent generation, a full creator dashboard (royalties, orders, messages, settings), and an AI-assisted storefront theming tool. Test coverage exists for most `lib/` business logic (`npm test` runs ~24 `.test.ts` suites). Marketing copy throughout (About, Careers, FAQ, Contact) is real, specific, and un-lorem-ipsum'd — the Careers page even states outright there are no open roles rather than faking listings.

The most significant gap is architectural rather than cosmetic: the actual live homepage is **only** the design feed (`app/(public)/(home)/page.tsx` renders `<Feed>` and nothing else). A full marketing homepage — hero video, prompt-to-generate box, claim spread, top-creators row, FAQ section — exists as built, unused components in `components/home/` with an explicit code comment saying they're kept "if the marketing page ever comes back." One of those dormant components (`Hero.tsx`) links to `/auctions`, a route that does not exist anywhere in the app — a dead link, but currently unreachable since Hero isn't rendered.

## Feature-by-feature breakdown

### Homepage feed (`/`)
- **Description**: The entire homepage is a masonry-style, multi-column feed of design cards (image, name, price or "Free", vibe tag, creator handle, claimed/unclaimed status, relative time). No hero, no explainer copy, no separate marketing content.
- **State**: Working. Real data (38 designs seeded across 6 "vibes": Compound, Dusk Atelier, Insatiable, Late Bloomer, Riot, Untamed Worldwide).
- **Code**: `app/(public)/(home)/page.tsx`, `components/home/Feed.tsx`, `lib/data/feed.ts`.
- **Note**: `components/home/Hero.tsx`, `HeroPromptForm.tsx`, `ClaimSpread.tsx`, `Gallery.tsx`, `HomeFaq.tsx`, `TopCreatorsRow.tsx`, `MastheadLedger.tsx` are all dormant/unused — not imported by the live route. `Hero.tsx` contains a nav link to `/auctions`, which has no matching route.

### Bazaar / shop (`/shop`)
- **Description**: Full catalog browse with a left sidebar of vibe filters (each showing a live count, e.g. "Riot 15"), an Availability filter (All / Unclaimed / Claimed), a sort dropdown (Most Recent / Oldest First), and a "Make your own" CTA linking to `/create`.
- **State**: Working. Filters and sort are real query-param-driven server filters (`/shop?vibe=riot`, `/shop?availability=unclaimed`), not client-side decoration.
- **Code**: `app/(public)/shop/page.tsx`.

### Search (`/search`)
- **Description**: A single search box ("Search designs and creators"), also present in the global navbar on every page. Copy explains scope: "Designs match on their name and description. Creators match on handle or name."
- **State**: Present with a real empty-state illustration; did not execute a live query during this audit, but the box and route are wired (not a stub placeholder).
- **Code**: `app/(public)/search/page.tsx`.

### Design detail page (`/design/[id]`)
- **Description**: Breadcrumb (Home / Bazaar / Creator / Design name), a Shirt/Art image toggle, 11 shirt colorway swatches, front/back print-side toggle, price, "Buy now" CTA, expandable "Design details" (edition, status, vibe, mint date, file type) and "What you get" sections, a "STOREFRONT" card linking to the maker's storefront with their listed-item count, "More from [Creator]" and "More in [Vibe]" horizontal carousels.
- **State**: Working, richly built. Live-tested on a real unclaimed design ("Tiger Moving Softly Through River Currents", $49.99).
- **Code**: `app/(public)/design/[id]/page.tsx`, `components/design/DesignDetailPanel.tsx`, `components/design/BuyForm.tsx`, `components/shared/ShirtMockup.tsx`.

### Buy / claim flow
- **Description**: "Buy now — $X" expands inline to a guest-checkout-style form (full name, email) with copy clarifying the design file and receipt go to that email, and — for signed-out visitors — that the email itself becomes the new account. Confirming opens Bolt's hosted checkout modal over the current page (no navigation away); a $0 design instead claims instantly server-side. On success, the buyer is redirected to their own new storefront.
- **State**: Working, no shopping cart at any point — this is a single-item, immediate-purchase flow only.
- **Code**: `components/design/BuyForm.tsx`, `app/(public)/design/[id]/actions.ts`, `app/(public)/design/[id]/order-actions.ts`, `lib/payments/bolt-client.ts`, `lib/payments/bolt.ts`, `app/api/bolt/webhook/route.ts`, `lib/payments/fulfil.ts`.

### Creator storefronts (`/creator/[handle]`)
- **Description**: Profile header (display name, "Verified Creator" badge, @handle, Claimed count, Followers count), Follow button, Share button, tabs ("All" / "Created", and presumably "Owned" when a creator has claimed others' work — not observed live), and a grid of that creator's listed designs.
- **State**: Working for the storefront page itself. **Follow requires auth** — clicking it while signed out routes to `/login` rather than doing anything inline. **Share is clipboard-copy only** — `ShareButton.tsx` copies the storefront URL to the clipboard and shows a 1.5s "Copied" confirmation; there is no native share sheet, no social-network share intent, no OG-image-specific share flow.
- **Bare `/creator` route**: Not a directory/browse-all-creators page. It's a redirect helper only — signed-in users land on their own storefront, everyone else is bounced to `/shop`. **There is no page to browse/discover the list of creators.**
- **Code**: `app/(public)/creator/page.tsx` (redirect logic), `app/(public)/creator/[handle]/page.tsx`, `components/storefront/StorefrontHeader.tsx`, `components/storefront/StorefrontGrid.tsx`, `components/storefront/FollowButton.tsx`, `components/storefront/ShareButton.tsx`.

### Create / AI generation studio (`/create`)
- **Description**: A protected route (signed-out visitors are bounced to `/signup?next=/create`, draft preserved via sessionStorage). Full generation form: (1) prompt textarea with an "Enhance" toggle (AI expands the idea vs. sending it verbatim — tooltip explains the distinction from style), (2) Art Direction/Style popover picker, (3) Brand Persona selector (user's own saved personas, or platform presets — "Manage personas" / "Create from your designs" links to `/dashboard/personas`), (4) aspect ratio (Square/Portrait/Wide), (5) print quality (Low/Medium/High), and a submit button showing a live daily-image-cap count. Generation polls a `generation_jobs` row every 2s (240s ceiling) with a "Rendering… Ns" counter against an honest code comment that this is a fake progress bar (the job only ever reports pending/done/failed). On completion: background removal/restoration toggle (real cutout, not just an image swap), "Redesign" (reruns with the same inputs), and "Make live" which opens a listing modal (garment, price, placement) before the design goes public.
- **State**: Working, and one of the most fully-built surfaces in the app — real polling against Supabase, real `/api/generate` backend (`lib/generation/adapter.ts`, `compose.ts`, `styles.ts`, `quota.ts`), a real daily generation quota, and a real background-removal pipeline.
- **Code**: `app/(public)/create/page.tsx`, `components/create/CreateForm.tsx`, `components/create/StylePopoverPicker.tsx`, `app/api/generate/route.ts`, `lib/generation/*`, `app/dashboard/designs/actions.ts` (bg removal), `components/dashboard/ListingModal.tsx`.

### Personas (`/dashboard/personas`)
- **Description**: Users upload 10–50 reference images (their own past designs, or anything representing a "brand" aesthetic) to `PERSONA_PRESETS`-adjacent custom personas; images upload client-side directly to Supabase Storage (bypassing the 4.5MB server-action payload cap), then a server action creates the persona. Saved personas appear in the Create form's persona dropdown alongside built-in presets, steering future generations toward a consistent look.
- **State**: Working, non-trivial feature (this is closer to a lightweight style-conditioning system than a cosmetic dropdown).
- **Code**: `components/dashboard/PersonaManager.tsx`, `app/dashboard/personas/actions.ts`, `lib/data/personas.ts`, `lib/generation/personas.ts`.

### Dashboard overview (`/dashboard`)
- **Description**: Stat cards (Total Royalties, Designs Claimed, Orders Placed, Pending Payout — each with a real vs.-last-month delta, or an honest "No activity yet" instead of a fabricated 0%), a royalty-by-day chart, a "Top Earning" designs list, a "Creation Studio" quota gauge, a Recent Activity feed, and a payout-progress gauge toward the payout threshold.
- **State**: Working, all data-driven (`getDashboardOverview()`), with real empty states throughout rather than fake/sample data. A code comment notes a previous version of this page showed two disagreeing hardcoded quota numbers and was fixed to show one real one.
- **Code**: `app/dashboard/page.tsx`, `lib/data/dashboard.ts`, `components/dashboard/DashboardAnalyticsChart.tsx`, `RoyaltyGoalGauge.tsx`, `CreationQuotaGauge.tsx`.

### My Designs (`/dashboard/designs`)
- **Description**: A creator's own generated/claimed designs, grouped, with the same listing/garment/pricing controls as the Create flow's "Make live" step.
- **State**: Working.
- **Code**: `app/dashboard/designs/page.tsx`, `components/dashboard/MyDesignsClient.tsx`, `lib/data/my-designs.ts`.

### Messages (`/dashboard/messages`, `/dashboard/messages/[handle]`)
- **Description**: A real creator-to-creator direct-message inbox — thread list with avatar, unread badge, last message preview, relative timestamp; empty state reads "Conversations with other creators will show up here."
- **State**: Working (inbox at least; not exercised live due to auth gate).
- **Code**: `app/dashboard/messages/page.tsx`, `app/dashboard/messages/[handle]/page.tsx`, `lib/data/messages.ts`.

### Orders (`/dashboard/orders`)
- **Description**: A table of the user's own purchases — design thumbnail, kind (design-ownership claim vs. printed garment order, with size + Printify fulfillment status for the latter), status badge (pending/paid/fulfilled/refunded), date, amount. Real empty state with a "Browse designs" CTA.
- **State**: Working.
- **Code**: `app/dashboard/orders/page.tsx`, `lib/data/orders.ts`.

### Notifications
- **Description**: Not a dedicated page — a bell dropdown/panel rendered inside the dashboard layout and navbar (desktop dropdown + mobile bottom-nav badge), backed by `getNotifications()` with unread counts and mark-read server actions.
- **State**: Working as an in-app notification center. No dedicated `/dashboard/notifications` page exists (`app/dashboard/notifications/` contains only `actions.ts` — this is intentional, not a missing route).
- **Code**: `lib/data/notifications.ts`, `app/dashboard/notifications/actions.ts`, wired in `app/dashboard/layout.tsx` and `components/layout/Navbar.tsx`.

### Settings (`/dashboard/settings`)
Five tabs:
- **Profile** — `AccountForm.tsx`: handle, email, display name, avatar, banner, bio.
- **Storefront** — `StorefrontThemePrompt.tsx` (AI-assisted theming: rather than calling an LLM itself, this generates a copy-pasteable prompt for the creator's *own* ChatGPT/Claude asking for a mood-based theme description, which is pasted back into a free-text box and applied via `applyStorefrontThemePrompt` to `lib/storefront/theme.ts`'s theme tokens) plus `StorefrontPreferencesForm.tsx`.
- **Earnings** — Total Earned / Pending Payouts / Paid Out metric cards, a payout-history table with a real empty state. **The "Direct Payout Account… Connected" status badge is static markup, not tied to any real linked-account state** — there is no bank-account/Stripe Connect linking flow anywhere in the codebase (grep confirms `settings/page.tsx` is the *only* file referencing a connected payout account). This reads as a UI placeholder standing in for payout-method setup that doesn't exist yet.
- **Notifications** — `NotificationPreferencesForm.tsx`, backed by `lib/data/notifications.ts` preferences.
- **Security** — `SecuritySettingsForm.tsx` (password/session management, by name).
- **State**: Working except the Earnings tab's "Connected" payout status, which is a stub/placeholder.
- **Code**: `app/dashboard/settings/page.tsx`, `lib/data/settings.ts`, `app/dashboard/settings/actions.ts`.

### Auth: signup / login / OTP / password reset
- **Signup** (`/signup`): Google and Apple OAuth buttons, plus email form (optional full name, username, email, password ≥8 chars). Redirects to `/verify-otp` after submit.
- **Login** (`/login`): Mirrors signup; per recent git history, sign-in now also accepts a **username** in the email field, not just an email address.
- **OTP verify** (`/verify-otp`): A real 6-digit-digit-box code entry UI with Resend, gated by a filled email. Not completed during this audit per task instructions.
- **Password reset** (`/forgot-password`, `/reset-password`, `/reset-password/confirm`): Present as routes; not exercised live.
- **Auth gating**: `/create` and every `/dashboard/*` route redirect signed-out visitors to `/login?next=<path>` (verified live for `/dashboard/designs`). This is enforced in `lib/supabase/middleware.ts`.
- **State**: Working (Supabase-backed).
- **Code**: `app/(auth)/*`, `lib/supabase/middleware.ts`, `lib/supabase/client.ts` / `server.ts`.

### About / Careers / Contact / FAQ
- **About** (`/about`): A real, specific manifesto/philosophy page (1-of-1 exclusivity model, 100% IP transfer, 10% resale royalty, zero upfront inventory) — not placeholder copy.
- **Careers** (`/careers`): Honest "No open roles right now" with a description of what they'd hire for first (generation quality, fulfilment/ops, product design) and an email-with-work-samples CTA instead of a fake job board.
- **Contact** (`/contact`): A structured inquiry form (topic selector: Orders & Reprints, Claims & Storefronts, Privacy & Data Request, Legal & DMCA, General Inquiry; name, email, optional order number, subject, message) plus a directory of department inboxes. Backed by a real server action (`app/actions/contact.ts`), not a dead `<form>`.
- **FAQ** (`/faq`): Real, substantial accordion content organized by section (IP Ownership & Merch Store, Claiming, etc.), not filler.
- **State**: All working, all real content.

### Legal pages
- `/terms`, `/privacy`, `/ip-policy` ("Commercial IP & DMCA"), `/refund-policy`, `/cookies` all exist and are linked from the footer.
- **State**: Present; content not fully read during this audit but routes and footer links are wired correctly.

### Payments (Bolt)
- **State**: Working, real SDK integration — hosted checkout modal opened client-side (`openBoltCheckout`), a webhook (`app/api/bolt/webhook/route.ts`) that completes purchases idempotently, and a client-side "complete" call as a fast-path so the buyer doesn't wait on webhook latency.
- **Code**: `lib/payments/bolt.ts`, `bolt-client.ts`, `checkout.ts`, `fulfil.ts`.

### Fulfillment (Printify)
- **State**: Working, real integration — garment catalog sync, print-area mapping per garment/placement, mockup generation, and order-status sync modules, each with its own test file.
- **Code**: `lib/printify/client.ts`, `garments.ts`, `mockups.ts`, `orders.ts`, `print-areas.ts`, `products.ts`, `sync.ts`, `tones.ts`.

### Email
- **Templates present**: purchase receipt, design-file delivery, garment-order confirmation, generic notification email, newsletter-welcome.
- **State**: Working per code structure (`lib/email/templates.ts`, `send.ts`, `layout.ts`, with a test file); not observed live (no test purchase completed).
- **Note**: this is the full extent of email — no marketing drip sequence, no abandoned-checkout email, no "your design sold" digest beyond what these five templates cover.

## Explicitly Missing / Not Implemented

- **No shopping cart.** Every purchase is a single-item "Buy now" → guest form → Bolt checkout. No add-to-cart, no multi-item checkout.
- **No wishlist / favorites / saved designs.** Nothing in the UI or codebase (`\bwishlist\b` / `\bfavorite\b` do not appear as a feature anywhere).
- **No reviews or ratings.** Nothing on design or storefront pages; no schema or UI for star ratings, review text, or verified-purchase badges.
- **No creator directory.** `/creator` is a redirect-only helper (to your own storefront if signed in, else `/shop`) — there is no page to browse or discover the list of creators on the platform.
- **No search-result filtering beyond the base query** (no price range, no color, no size, no "sort by relevance" observed — the search page itself is a single query box).
- **No recommendation engine.** The feed is chronological/vibe-tagged, not personalized; "More from [Creator]" and "More in [Vibe]" on design pages are simple same-author/same-vibe lookups, not collaborative filtering.
- **No analytics or tracking scripts in page source.** No Google Analytics, GA4/gtag, PostHog, Segment, Mixpanel, or Vercel Analytics/Speed Insights found anywhere in the codebase (a `logTag` string in `lib/generation/compose.ts` is the only "tag"-adjacent match — a false positive).
- **Social sharing is clipboard-copy only.** `ShareButton.tsx` copies the storefront URL and shows a "Copied" toast; there's no native Web Share API call, no per-network share intents (Twitter/X, Instagram, etc.), despite the footer listing social handles for the brand itself.
- **No real payout/bank-account connection flow.** Settings → Earnings shows a static "Connected" badge with no linking UI anywhere in the codebase — royalties are tracked and totaled, but there's no way, visibly, to actually connect a payout destination.
- **`/auctions` is a dead link** referenced only in dormant, unused code (`components/home/Hero.tsx`, not rendered by the live homepage) — no such route exists.
- **The marketing homepage doesn't exist live.** A hero, prompt-to-generate box, claim spread, top-creators row, and homepage FAQ are all built as components but explicitly disconnected from the live `/` route in favor of a feed-only homepage (see code comment in `app/(public)/(home)/page.tsx`).
- **No public API docs page**, though `docs/API.md` exists in the repo (not surfaced in-app).

## Rough User Journey Map

1. **Discover** — Land on `/` (feed) or `/shop` (filtered catalog). Real, working browse/filter/sort. *(Real)*
2. **Sign up** — `/signup`, email+password or Google/Apple OAuth, then 6-digit email OTP at `/verify-otp`. *(Real; not completed end-to-end in this audit per instructions — OTP delivery/verification itself untested live.)*
3. **Generate a design** — `/create` (auth-gated): prompt + style + persona + aspect ratio + quality → `/api/generate` → poll `generation_jobs` → land on artwork, optionally cut background, optionally regenerate. *(Real, fully wired backend.)*
4. **Claim / list it** — "Make live" opens `ListingModal` (garment, price, placement) → design goes public and provisions/updates the creator's storefront at `/creator/[handle]`. *(Real.)*
5. **Someone else discovers and buys it** — From feed/shop/search/storefront → design detail page → "Buy now" → guest or signed-in checkout form → Bolt hosted modal (or instant claim if free) → webhook + client-side fast-path complete the purchase. *(Real integration; a live payment was not run in this audit.)*
6. **Fulfillment** — Printify order created and status-synced back into the buyer's `/dashboard/orders`. *(Real integration per code; not observed live — no order existed to inspect.)*
7. **Original claimer earns a royalty** — 10% of the resale, reflected in the seller's `/dashboard` royalty stats, Settings → Earnings totals, and payout-progress gauge. *(Real tracking logic; the actual payout **destination** — where that money goes — has no visible connection flow, i.e. this step's final leg is a stub.)*
8. **Ongoing** — Messages between creators, notifications (bell dropdown), settings (profile/storefront theme/notifications/security) all real and reachable once authenticated.

**Bottom line on the core loop (generate → claim → storefront → sale → fulfillment → royalty):** every step up through Printify fulfillment is a real, code-complete integration, not a mockup — this was not something guessable from folder names alone; it required reading the actual generation polling loop, the Bolt webhook, and the Printify sync modules to confirm. The one genuine soft spot in that specific loop is the payout **destination** (Earnings tab shows royalties accruing correctly but the "connect a payout account" affordance is decorative), and the one soft spot just outside that loop is discovery — there's no cart, no creator directory, and the buzz-generating marketing homepage that would drive top-of-funnel traffic isn't actually live.
