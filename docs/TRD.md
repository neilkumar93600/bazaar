# Shirt Bazaar — Technical Requirements Document

Maps each PRD requirement to the data, services, and jobs needed to build it. See `DATA_MODEL.md` for schema and `ARCHITECTURE.md` for routing and folder structure.

## Feed & vibe columns
- Data: `vibes` (columns), `designs` (each tagged to a vibe), `follows` (user to user).
- Read path: a paginated, windowed query per column, server-rendered on `/`.
- A logged-in user's feed blends default vibe columns with columns belonging to followed users — this needs a single query that unions "global vibe columns" with "columns owned by followed creators."

## Reference upload & generation
- Data: `reference_uploads` (user-owned images), `generation_jobs` (status: queued, generating, done, failed), `designs` (finished output).
- Generation is asynchronous: enqueue a job, then poll or subscribe (Supabase Realtime) for status, with a loading state rendered in `/dashboard/create`.
- Image-gen adapter interface: `generate(prompt, references[], quality_tier) -> { image_url, cost }`. Two quality tiers minimum: draft (cheap) and upscale (paid, applied to an existing draft rather than a fresh generation).

## Claim & storefront
- Data: `claims` (design_id, claimant_id, claimed_at) — this row is simultaneously "who owns it" and "proof of first use."
- On claim: mark the design as claimed with an owner, auto-create or attach a `storefronts` row with a slug, and require nothing beyond the base purchase price.
- Resale must happen on-platform only — no export of the underlying design asset before a claim transfer — to protect the royalty mechanic.

## Royalties
- Data: `royalty_ledger` (order_id, design_id, original_claimant_id, amount, paid_at).
- Every sale of an already-claimed design triggers a split payment: platform fee, proceeds to the seller, and — only when the seller is not the original claimant (a resold/gifted item) — a royalty transfer to the original claimant.
- Payments: Stripe Connect, destination charges with an application fee, plus a separate transfer for royalty payouts.

## Column takeover
- Data: `column_rentals` (renter_id, vibe_id, starts_at, ends_at).
- A rented column temporarily overrides the default column's contents with the renter's generated designs for the rental window.

## Fulfillment (print-on-demand)
- Data: `pod_provider_mapping` (quality_tier to provider — internal only, never exposed client-side), `orders` (design_id, buyer_id, placement config).
- Adapter interface: `submitOrder(design_asset, placement, size, provider) -> { order_id, tracking_url }`. Multiple providers behind one interface; provider selection happens server-side only, based on the tier the buyer picked.
- Print-ready asset requirement: transparent-background, front/back separated layers, matching each provider's print-area spec.

## Placement & customization
- Data: `order_items`-level fields — front/back flags, size, and placement position (small vs. large).

## Share flywheel
- Trigger: on successful claim, generate a clean composite share image (design on a plain mockup background) and email it to the buyer with a one-tap share call to action.
- This runs as a background job, not inline in the checkout request path — never block checkout on image compositing.

## Auth
- Supabase Auth handles email/password plus native email OTP (`signInWithOtp`) for signup and verification, and `resetPasswordForEmail` for the reset flow. No custom OTP infrastructure.

## Non-functional requirements
- Generation job latency needs a defined SLA once a provider is chosen; the UI must never appear to hang regardless of actual generation time.
- All monetary calculations — royalties, platform fees — happen server-side only and are never trusted from the client.
- Row Level Security is enabled on every table from day one (see `SECURITY.md`).
