# Product Requirements Document — Shirt Bazaar

Status: reflects the product as it actually exists in the codebase on 2026-09-03. Written after a full audit of the live app (`localhost:3001`) and the code behind it — see [`FEATURE_INVENTORY.md`](./FEATURE_INVENTORY.md) for the file-by-file evidence this document is built on. This is not a wishlist; every "Shipped" claim below was verified by using the feature or reading the code that implements it.

## 1. One-liner

Type a prompt, get a shirt design that will only ever exist once. Claim it and it's permanently yours — full commercial IP, your own creator storefront, a cut of every future resale.

## 2. Problem & positioning

Print-on-demand tools (Printify, Placeit, Redbubble) treat AI-generated art as infinite inventory — anyone can reuse a prompt, a design, or a listing. Shirt Bazaar's bet is that **scarcity is the product**: each generation produces one artwork that is removed from the available pool the moment it's claimed, and the claimer owns it outright rather than licensing a print. This is closer to a 1-of-1 digital collectible model (NFT drop mechanics) applied to physical apparel, minus a blockchain — the scarcity guarantee is enforced by a Postgres row lock, not a token.

## 3. Users

- **Makers** — sign up, spend a prompt against a daily generation quota (5/24h by default), get one AI shirt design, and decide whether to keep generating, list it for sale, or claim it themselves.
- **Buyers / collectors** — browse the feed or shop grid, claim a design (free ones instantly, priced ones via Bolt checkout) to own it outright, or order a printed copy of a design they already claimed.
- **Creators** (a maker who has claimed at least once) — get an automatically provisioned storefront at `/creator/<handle>`, an AI-assisted theming tool, a dashboard with royalty/order/message tracking.

These are the same person moving through different states, not three separate account types — there's a single `profiles` row and no role field.

## 4. Core user journey (verified working end to end)

1. Visitor lands on `/` (a public, always-fresh masonry feed of designs) or `/shop` (filterable/sortable catalog).
2. Visitor clicks a design → design detail page (colorways, front/back, price, "What you get") → tries to Buy/Claim → gated to `/signup`.
3. New user signs up (email/password or Google/Apple OAuth) → redirected back to what they were doing.
4. **Generate**: `/create` — prompt, style, persona, aspect ratio, quality → polls a generation job → gets one image.
5. **List or claim**: the maker prices it (or leaves it free) and lists it, or claims it immediately for themselves.
6. **Claim = buy**: claiming a priced design goes through Bolt's hosted checkout; a free design claims instantly. Claiming is atomic and irreversible — one buyer, ever, enforced by a database row lock (`claim_design_for()`).
7. Claiming auto-provisions the buyer's own storefront (first claim only) and redirects them there.
8. The claimer can now order a **printed** copy of their own design (a second, separate purchase flow) — routed through Printify for fulfillment.
9. Everyone involved gets dashboard visibility: royalty totals, orders, messages, notifications.

## 5. Feature requirements, by area — current status

Status legend: **Shipped** (built and working), **Partial** (built but with a real gap), **Dormant** (schema/UI exists, nothing exercises it), **Not built**.

### Generation
- **Shipped.** Prompt → style preset → optional persona → aspect ratio/quality → one image (`IMAGES_PER_JOB = 1`, deliberately reduced from 4 for cost). Two parallel AI text calls (listing copy, art-direction) with independent template fallbacks so a text-model hiccup never fails the job. Fixed daily quota per user.
- **Shipped**: on-demand background removal/restoration, independent of the generation pipeline.
- **Not built**: no human moderation queue — every generation is auto-approved on the bet that the image model refuses unsafe prompts itself.

### Listing & claiming
- **Shipped.** List (price or free) → visible in feed/shop/search → claim is atomic, single-buyer, database-enforced. Claiming a design you made yourself is blocked.
- **Shipped**: automatic storefront provisioning on a user's first claim.

### Buying
- **Shipped**: buying the *design* (IP + file) — real Bolt checkout, signed webhook, idempotent fulfillment with an automatic refund if a claim is lost to a race.
- **Partial**: buying a **printed garment** of a design you already claimed. The flow exists end-to-end in the UI, but payment runs on a mock adapter (`lib/payments/checkout.ts` — "always succeeds"), and actually submitting the order to Printify for real fulfillment is gated behind `PRINTIFY_SUBMIT_ORDERS`, off by default, specifically so mock money can never trigger a real shipment.

### Creator storefronts
- **Shipped**: auto-provisioned page at `/creator/<handle>`, follow, AI-assisted theming (prompt → validated theme tokens, XSS-safe by construction), AI banner generation.
- **Not built**: no directory/browse-all-creators page — `/creator` is a redirect helper only, not a listing.
- **Partial**: Share is clipboard-copy only, no native share sheet or social intents.

### Royalties (headline claim: "earn 10% on every resale")
- **Dormant — this is the most important gap in the product.** `ROYALTY_RATE_PERCENT = 10` and a `royalty_ledger` table exist, and the dashboard reads and displays from that table — but nothing in the codebase ever writes to it, because **there is no resale mechanism at all**. A claim is permanent and singular (`is_claimed` flips once, forever); a claimed design cannot currently be sold again to a second buyer. The marketing promise of "royalty on every resale" is not a bug fix away from working — it requires building a resale flow that doesn't exist yet. This is a product-integrity risk, not just a missing feature: creators see a real 10% figure and an empty ledger with no path to it filling up.

### Homepage / marketing / discovery
- **Shipped**: the live homepage is the design feed — real data, always fresh, works well as browse/discovery.
- **Not built (but not missing — dormant)**: a fully-built marketing homepage (hero video, prompt box, claim spread, top-creators row, FAQ) sits unused in `components/home/`, kept per an explicit code comment "if the marketing page ever comes back." One of its components links to `/auctions`, a route that doesn't exist.
- **Not built**: creator directory (see above), cart, wishlist/favorites, reviews/ratings, view-count or "trending" social proof, a recommendation engine (the feed is chronological/vibe-tagged, not personalized).

### Dashboard & account
- **Shipped**: royalty/order stat cards with honest empty states (no fabricated zeros), messages, personas (a real style-conditioning system, not a cosmetic dropdown), settings.
- **Partial**: a "Notifications" section exists (bell popover, DB triggers for claim/royalty/message/order-status events) but there's no `/dashboard/notifications` page — only the popover, capped at 20 items, no "view all." Notification **emails** are fully written (`notificationEmail()`) but never sent — nothing wires the DB trigger to an actual email dispatch.
- **Not built**: no real payout destination for accrued royalties — a "Connected" badge shows in Settings → Earnings with no actual bank/Stripe-Connect linking flow behind it.

## 6. Explicitly out of scope (confirmed absent, not assumed)

Cart, wishlist/favorites, reviews/ratings, native/social sharing beyond clipboard copy, analytics/tracking scripts, personalized recommendations, creator directory, abandoned-checkout recovery, resale of a claimed design, royalty payouts, real (non-mocked) garment-reorder payments, anonymous preview of the generation flow.

## 7. Known risks worth product-level attention

1. **The core monetization promise to creators (resale royalties) has no mechanism behind it.** Either build a resale flow or change the marketing claim — the gap between "10% on every resale, forever" and zero resale capability is a trust liability the longer it sits.
2. **`/create` is gated behind signup**, hiding the entire AI-generation value proposition from a first-time visitor. Every comparable AI-generation product (Kittl, Placeit) leads with a free first generation.
3. Security: an open-redirect gap in the OTP/password-recovery confirmation flow (see [`SECURITY.md`](./SECURITY.md)) is a live phishing primitive, not just a hardening nit.
4. **Garment reorders can't yet convert real money into real shipments** — the payment adapter is a mock and Printify submission is deliberately switched off, so this revenue line is currently zero regardless of demand.

## 8. Success signals (not yet instrumented — no analytics exist today)

Since there is no analytics/tracking in the codebase at all, none of these are currently measurable without adding instrumentation first:
- Activation: % of signups that complete a first generation; % of generations that get listed or claimed.
- Retention: day-7/day-30 return rate tied to the existing daily-quota reset (a Duolingo-hearts-style structural hook that nothing currently notifies the user about).
- Monetization: claimed-design conversion rate, average price, (once built) resale rate.

See [`GROWTH_AND_RETENTION.md`](./GROWTH_AND_RETENTION.md) for the full activation/retention audit and prioritized recommendations.

## Related documents

- [`FEATURE_INVENTORY.md`](./FEATURE_INVENTORY.md) — the ground-truth evidence this PRD is built on
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how it's built
- [`TRD.md`](./TRD.md) — technical requirements and non-functional constraints
- [`DATA_MODEL.md`](./DATA_MODEL.md) — schema
- [`API.md`](./API.md) — every route and server action
- [`SECURITY.md`](./SECURITY.md) — security findings
- [`GROWTH_AND_RETENTION.md`](./GROWTH_AND_RETENTION.md) — activation/retention recommendations
