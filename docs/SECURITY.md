# Shirt Bazaar — Security

## Auth & session
- Supabase Auth handles session issuance; no custom session or JWT logic.
- OTP and password-reset endpoints are rate-limited per email and per IP to prevent enumeration and abuse.
- Session cookies are httpOnly, secure, and at minimum SameSite=Lax.

## Row Level Security (minimum one policy per table)
- `profiles`: publicly readable (needed for storefront/creator-handle lookups); a user can update only their own row.
- `designs`: publicly readable (feed/storefront); insert and update restricted to the owning generation job or the claimant.
- `claims`: inserted only via a server-side function that validates payment completion; a user can read their own claims plus the public claim metadata (owner handle) needed to render storefronts.
- `storefronts`: publicly readable; updatable only by the owning user via a server function.
- `follows`: a user can create or delete only their own follow rows; reads are public.
- `orders`, `royalty_ledger`: readable only by the owning user (buyer or original claimant) and the service role; never client-writable, only written by server functions or payment webhooks.
- `reference_uploads`: readable and writable only by the owning user.
- `column_rentals`: publicly readable (to render the takeover); writable only by the renting user via a server function that validates payment.
- `vibes`: publicly readable; writable only by the service role — vibe/column names are curated, not user-created, in v1.
- `generation_jobs`: readable and writable only by the owning user.
- `pod_provider_mapping`: readable and writable only by the service role; never exposed to any client, admin-only by design.
- `messages`: readable only by the sender or recipient; insertable by an authenticated user only when the recipient exists.

## Content moderation
- Every generated and uploaded image passes a moderation check before it can (a) appear in the public feed, or (b) be submitted to a print-on-demand provider. At minimum this must catch trademarked or branded logos, NSFW content, and hate symbols.
- A moderation failure blocks print submission even for an already-purchased design; this requires a refund-or-regenerate flow for that case.

## Payments
- All charge, fee, and royalty calculations happen server-side; the client only ever sends a design or order reference, never an amount.
- Stripe webhooks are the source of truth for payment state — the app must never mark an order "paid" from a client-side redirect alone.
- Payout account (Stripe Connect) verification is required before a user can withdraw royalty earnings.

## Child safety
- The `/child-safety` page must reflect actual practice, not boilerplate: no account-creation path should be reachable by users who self-identify as minors below the platform's stated minimum age, and a standard reporting mechanism must exist for any concerning content or user.
- Add an explicit minimum-age assertion at signup; add a full age-verification gate if any target market requires one.

## Fulfillment & data handling
- Shipping addresses are personal data: RLS-restricted to the buyer and the service role, and not exposed to the seller or claimant beyond what fulfillment status requires.
