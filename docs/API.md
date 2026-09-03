# API

Every server-reachable surface in this app: Next.js route handlers under `app/api/**/route.ts`, and Server Actions (`"use server"`) called from client components. Grounded in the code as of this writing — nothing here is aspirational.

There is no other API surface. No `pages/api`, no standalone backend, no tRPC/GraphQL layer. Mutations and reads that aren't route handlers go through Server Actions called directly from React components.

## Overview

The app is a single Next.js 16 (App Router) project. Two request shapes reach the server:

1. **Route handlers** (`app/api/**/route.ts`) — six of them. Three are Supabase auth redirects, two serve design artwork (watermarked vs. original), one runs AI image generation and returns a job id.
2. **Server Actions** — 27 exported `async function`s across 17 files, invoked from forms (`useActionState`) or directly from client components (`onClick` → imported action). These are Next.js's RPC mechanism: each compiles to a POST endpoint at build time, but there is no hand-written route for it.

External paid services called from the server: **MuAPI** (image generation + Kimi-K3 text composition, one account/key for both), **OpenRouter** (Gemini vision, persona style analysis only), **Printify** (product creation + order fulfillment), **Bolt** (card payments), **Resend/Gmail** (transactional email — not directly requested but documented since every purchase path triggers it).

## Auth model summary

- **Session**: Supabase Auth, cookie-based, via `@supabase/ssr`. `lib/supabase/middleware.ts` (`updateSession`, wired into `middleware.ts` at the repo root — not read in this pass, but the export is called from there) refreshes the session cookie on every request and gates two path prefixes:
  - `/dashboard/*` and `/create/*` are **protected** — no session → redirect to `/login` (or `/signup` for `/create`, since that's the new-visitor entry point) with `?next=` carrying the original destination.
  - `/login` and `/signup` are **auth routes** — an existing session → redirect away (to `next` or `/`).
  - Every other path (`/`, `/design/[id]`, `/creator/[handle]`, `/shop`, etc.) is public at the middleware layer; some Server Actions reachable from those pages still check for a session internally (see per-action notes below).
- **Route handlers check auth individually** — the middleware does not cover `/api/*`. Each handler either checks `supabase.auth.getUser()` itself (`/api/generate`, `/api/design-image/[id]/original`) or is deliberately open (`/api/design-image/[id]`, the two `/api/auth/*` redirect handlers, which are themselves how a session gets established).
- **Server Actions check auth individually** — Next.js gives every action a POST endpoint regardless of what page imports it; there is no framework-level gate. Each action that mutates user-owned data calls `supabase.auth.getUser()` and checks `user.id` against ownership, OR relies on Postgres RLS to turn an unauthorized write into "0 rows affected" (both patterns are used — noted per-action below).
- **Service-role client** (`createServiceClient`, service_role key) bypasses RLS entirely and is used only in trusted server code that has already established who it's acting on behalf of: the generation worker, Printify sync, Bolt fulfilment, guest-account creation. It is never reachable directly from a request body.
- **Open redirect guard**: `lib/auth/next-url.ts`'s `safeNext()` is the single chokepoint every auth exit routes `?next=` through — rejects absolute URLs, protocol-relative (`//evil.com`), backslash tricks, and control characters. Used by the login action, signup action, verify-otp action, and both `/api/auth/*` handlers.
- **Bolt webhook** authenticates by HMAC signature, not session (see below) — it's server-to-server, not a user action.

---

## Route Handlers

### `GET /api/auth/callback`

**Auth**: Public (this *is* part of establishing a session — OAuth code exchange).

**Request**: Query params `code` (OAuth code from Supabase) and `next` (post-login destination, passed through `safeNext()`, defaults to `/dashboard`).

**Response**: 302 redirect. Success → `next`. No code, or `exchangeCodeForSession` errors → `/login?error=oauth_failed`.

**Side effects**: Exchanges the code for a Supabase session, setting session cookies via the SSR client.

**Errors**: No explicit error responses — every failure path is a redirect to the login page with an error query param.

---

### `GET /api/auth/confirm`

**Auth**: Public.

**Request**: Query params `token_hash`, `type` (`EmailOtpType` — signup, recovery, email_change, invite, etc.), `next` (defaults to `/dashboard`, **not** passed through `safeNext()` here — see note below).

**Response**: 302 redirect.
- `type === "recovery"` with a `token_hash` → redirects to `/reset-password/confirm?token_hash=...&type=...&next=...` **without verifying the OTP**. This is deliberate: Supabase's recovery token is single-use, and a mail client or security scanner prefetching the link would silently burn it before the human clicks. Verification is deferred to a page that requires an actual click (`confirmRecovery` action).
- Any other type with `token_hash` → calls `supabase.auth.verifyOtp({ type, token_hash })` immediately; success → `next`, failure → `/login?error=confirmation_failed`.
- Missing `token_hash`/`type` → `/login?error=confirmation_failed`.

**Side effects**: For non-recovery types, verifies the OTP and establishes a session.

**Errors**: All failures are redirects, no JSON error body.

**Note**: `next` here is read straight off the query string and interpolated into a redirect URL without going through `safeNext()` — worth flagging, though the recovery branch re-validates it isn't attacker-reachable from an untrusted `next` alone (Supabase controls `token_hash`/`type`; the redirect target itself is still open to whatever `next` says, same shape `safeNext` exists to close elsewhere).

---

### `POST /api/bolt/webhook`

**Auth**: HMAC signature (`X-Bolt-Hmac-Sha256` header), not a user session — this is a server-to-server callback from Bolt.

**Request**: Raw request body (read via `request.text()`, never `.json()` — signature verification hashes the exact bytes Bolt sent). JSON payload shape: `{ type: string, reference?: string, data?: { reference?: string } }`.

**Response**:
- `400` "Invalid signature." — signature missing/wrong, or `BOLT_SIGNING_SECRET` unset (fails closed: an unconfigured webhook is treated as untrusted, not trusting).
- `400` "Malformed body." — body isn't valid JSON.
- `200` `{ received: true }` — event type isn't one that means money moved (only `payment`, `auth`, `capture` are acted on; e.g. `pending`/`rejected_*` are acknowledged and ignored so Bolt doesn't retry forever).
- `400` "No transaction reference." — settled event but no `reference` found (checked top-level, then `data.reference`).
- `500` — `fulfilBoltTransaction` threw, or returned `{ ok: false }` with an error not containing `"refunded"` (a refunded race is terminal and should not be retried by Bolt; anything else should be).
- `200` `{ received: true }` — fulfilment succeeded (or the "already refunded" terminal case).

**Side effects**: Calls `fulfilBoltTransaction(reference)` (`lib/payments/fulfil.ts`), which: re-reads the transaction from Bolt (never trusts the webhook body's amount/status beyond the reference), looks up the matching `checkout_intents` row, checks for an existing `orders` row with that `payment_ref` (idempotency), mints a guest Supabase Auth account if the buyer wasn't signed in, calls the `claim_design_for` Postgres RPC (row-locked, atomic), sends receipt + design-file emails, and syncs the Printify product (backfill, normally a no-op). On a losing race (someone else claimed first), issues a Bolt refund via `creditTransaction`.

**Signature verification — confirmed by reading the code**: `verifyWebhook()` in `lib/payments/bolt.ts` computes `HMAC-SHA256(BOLT_SIGNING_SECRET, rawBody)`, base64-encodes it, and compares against the `X-Bolt-Hmac-Sha256` header using `crypto.timingSafeEqual` (not `===`, to avoid a timing side-channel). Returns `false` (rejecting the request) if `BOLT_SIGNING_SECRET` is unset or the header is missing. **This is checked before anything else in the handler** — the body is not even parsed as JSON until the signature passes. No auth weakness here.

---

### `GET /api/design-image/[id]`

**Auth**: Deliberately none — this is intentional, documented in the file's own comment, not an oversight.

**Request**: Path param `id` (design id). Query param `w` (requested max edge in px, clamped to `MAX_PREVIEW_EDGE = 900`).

**Response**: `image/webp` bytes, watermarked and downsized. `404 "Not found"` if the design doesn't exist, has no `image_url`, or `moderation_status !== "approved"`, or the storage object can't be found/downloaded.

**Side effects**: Downloads the original from Supabase Storage (service-role client, bucket `designs`) and runs it through `watermarkedPreview()` (`lib/images/watermark.ts`, not read in this pass but invoked here).

**Errors**: All non-2xx paths are `404`, never `403` — deliberately, so a stranger probing an id can't distinguish "doesn't exist" from "exists but you can't see the original."

**Why no auth check is correct here, per the code's own reasoning**: every `<Image>` on the site rewrites to `/_next/image?url=/api/design-image/<id>`, and Next's image optimizer fetches this server-side and caches the *result* keyed by URL with no cookie/session in the cache key. If this route ever returned different bytes to different callers (e.g., unwatermarked for the owner), the optimizer would cache one version and serve it to every subsequent visitor regardless of who they are. The route is capped at 900px and always watermarked — the security property is that it's *safe to be public and cacheable*, not that owner-vs-stranger distinction is missing by accident. Full-resolution originals are served exclusively from the next route, which is deliberately excluded from the image optimizer's cache path.

---

### `GET /api/design-image/[id]/original`

**Auth**: Required — signed-in session, and the caller must be the design's `claimed_by` (owner) or `creator_id` (maker). Checked via `supabase.auth.getUser()`.

**Request**: Path param `id`.

**Response**: Raw original file bytes (`Content-Type` from storage, `image/png` fallback), headers `Cache-Control: private, no-store, max-age=0` and `Vary: Cookie` — explicitly uncacheable, and never routed through `next/image`. `404 "Not found"` for: no session, design missing/unapproved, caller is neither owner nor maker, or storage download fails.

**Side effects**: Downloads from Supabase Storage via service-role client.

**Errors**: Always `404`, never `403` — same reasoning as the watermarked route: a `403` would confirm the design exists and that the requester specifically isn't allowed to see it, which tells a prober more than a flat "not found" does.

---

### `POST /api/generate`

**Auth**: Required — `401 { error: "Sign in to generate." }` if no session.

**Request** (JSON body):
```
{
  prompt: string,       // MIN_PROMPT_LENGTH(3)–MAX_PROMPT_LENGTH(1500) chars, required
  styleSlug: string,    // must resolve via findStyle() — one of STYLE_PRESETS
  text?: string,        // required/forbidden/optional depending on style.family
  quote?: string,       // illustrated styles only
  aspectRatio?: "1:1"|"3:4"|"4:3",  // falls back to "3:4" if invalid (not a 400)
  quality?: "low"|"medium"|"high",  // falls back to "medium" if invalid
  persona?: string,     // a static persona slug, "saved:<personaId>", or omitted → default
  enhance?: boolean,    // default true; false skips the Kimi prompt-composition call
}
```

**Response**:
- `400` — prompt length out of range, unknown style, text/quote validation failure (style family mismatch, over word/char limits).
- `500` "Could not start generation." — style names a vibe slug missing from the `vibes` table (deploy-time bug), the daily-quota count query failed, or the `generation_jobs` insert failed.
- `429` — daily quota exceeded (`used >= DAILY_CAP`, default `DAILY_CAP=5` via `GENERATION_DAILY_CAP` env, `IMAGES_PER_JOB=1`, so effectively 5 generations/user/24h rolling window).
- `202 { jobId: string }` — job accepted; **generation runs in the background** (Next's `after()`) after the response is sent. The client polls the `generation_jobs` row by id for status (`queued` → `generating` → `done`/`failed`) and the resulting `designs` row (`generation_job_id`).

**Side effects** (inside `after()`, service-role client):
1. `composeListing()` and `composePrompt()` run in parallel — two independent Kimi (via MuAPI) calls: one writes title+description (buyer-facing copy), one writes the art-direction prompt fields (subject/composition/materials/lighting/artDirection). Either can fail independently and falls back to a template/generic line; a text-model failure never fails the job.
2. `generate()` (`lib/generation/adapter.ts`) calls MuAPI's `/gpt-image-2-text-to-image` model — **one paid image generation** (`IMAGES_PER_JOB = 1`, previously 4, reduced deliberately for cost — see quota.ts comment).
3. Uploads the PNG to Supabase Storage (`designs` bucket) and inserts a `designs` row: `moderation_status: "approved"` **always** — there is no human review queue; the design decision documented in the code is that the model refuses policy violations at generation time.
4. Job status flips to `"done"` (with `result_design_id`) if at least one image landed, `"failed"` only if none did.

**maxDuration**: 300s (Vercel function limit). Each image is two sequential MuAPI calls worst-case (generate + optional background removal via a separate button, not inline here) with a 180s poll timeout — the route comment flags this budget as tight.

**External calls**: MuAPI, twice per job (Kimi text composition ×2 in parallel, then gpt-image-2 image generation ×1). Real cost per invocation.

---

## Server Actions

All 17 files below start with `"use server"` at the top (file-level directive — every export is a Server Action). No inline function-level `"use server"` directives exist elsewhere in the repo (verified via a full-repo grep excluding `node_modules`/`.next`).

### Auth (`app/(auth)/*/actions.ts`)

**`login(prevState, formData)`** — `app/(auth)/login/actions.ts`
Public. Accepts `email` (or a username handle — resolved to an email via a public `profiles.handle` lookup, then `auth.admin.getUserById` with the service client to read the private `auth.users.email`) and `password`. Calls `signInWithPassword`. Error messages are deliberately generic ("Incorrect email or password") for both "no such user" and "wrong password" to avoid user enumeration. Redirects to `next` (via `safeNext`, default `/`) on success.

**`signup(prevState, formData)`** — `app/(auth)/signup/actions.ts`
Public. Accepts `fullName` (optional), `username`, `email`, `password` (min 8 chars, no confirm-password field). Calls `supabase.auth.signUp`. Detects Supabase's decoy-user response (an already-registered, already-confirmed email returns 200 with `identities.length === 0` and sends no email) and surfaces a real error instead of silently stranding the user on the OTP page. Redirects to `/verify-otp?email=...&next=...` on success — no session yet.

**`requestPasswordReset(prevState, formData)`** — `app/(auth)/forgot-password/actions.ts`
Public. Accepts `email`. Calls `resetPasswordForEmail` with a redirect to `/api/auth/confirm?next=/reset-password`. **Always returns `{ submitted: true }`** regardless of whether the email exists — no enumeration.

**`resetPassword(prevState, formData)`** — `app/(auth)/reset-password/actions.ts`
Requires an active (recovery) session — `supabase.auth.updateUser({ password })` operates on "whoever this session belongs to," which by this point in the flow is the recovery token's owner. Accepts `password`/`confirmPassword` (min 8 chars, must match). Redirects to `/dashboard`.

**`confirmRecovery(formData)`** — `app/(auth)/reset-password/confirm/actions.ts`
Public. Accepts `token_hash`, `type`, `next`. This is the deferred verification step `/api/auth/confirm` redirects recovery links to — runs `verifyOtp` only behind a real form submit (user click), not a bare GET, so an email-client link-prefetch can no longer burn the single-use token. Redirects to `next` or `/login?error=confirmation_failed`.

**`verifyOtp(prevState, formData)`** — `app/(auth)/verify-otp/actions.ts`
Public. Accepts `email`, `token`. Calls `verifyOtp({ type: "signup" })`. On success, writes `handle`/`display_name` to the new `profiles` row from the signup-time metadata, then redirects to `next` (default `/`).

**`resendOtp(email)`** — `app/(auth)/verify-otp/actions.ts`
Public. Re-sends a signup OTP. No rate limiting visible in this function itself (relies on Supabase's own resend throttling).

### Create / generation

**`removeDesignBackground(designId)`** — `app/dashboard/designs/actions.ts`
Requires session. Ownership check: `design.creator_id !== user.id` → error (explicit app-level check, not just RLS). Blocked once `design.claimed_by` is set — "somebody owns this now, its artwork is fixed." Calls `removeBackground()` (MuAPI `/ai-background-remover`, a second paid model call), uploads the cut PNG as a **new** storage object (preserves the original at `original_image_url` on first cut only), updates `designs.image_url`.

**`restoreDesignBackground(designId)`** — same file
Requires the row to have an `original_image_url` set. Also blocked once claimed. No `auth.getUser()` call in this function specifically — relies on RLS to scope the `update` (worth noting: less defense-in-depth than its sibling `removeDesignBackground`, which does check `creator_id` explicitly).

**`createPersona(prevState, formData)`** — `app/dashboard/personas/actions.ts`
Requires session. Accepts `name` (≤60 chars) and `imageUrls` (10–50 URLs, form field repeated). Verifies every URL contains `/designs/persona-refs/<user.id>/` before trusting it (images are uploaded client-side directly to Storage under the user's own session *before* this action runs, to dodge the ~4.5MB serverless body-size ceiling — this action only ever sees resulting URLs). Calls `analyzePersonaStyle()` (OpenRouter, `google/gemini-2.5-flash` vision call over all reference images at once) and inserts a `personas` row.

**`deletePersona(personaId)`** — same file
Requires session. Deletes with `.eq("id", personaId).eq("owner_id", user.id)` — explicit ownership filter in addition to RLS ("belt-and-suspenders," per the code comment). Reference images are **not** swept from storage (documented as a known gap, `ponytail:` comment flags it as future work).

### Orders / purchase

**`getDesignDialogData(designId)`** — `app/(public)/design/[id]/actions.ts`
Public (works for anonymous viewers; personalizes `viewerEmail`/`viewerName` if signed in). Read-only: fetches design detail, Printify order options (colours/sizes), viewer profile. Never throws.

**`buyDesign(designId, expectedCents, rawBuyer)`** — same file
Public (works for guests). `rawBuyer` is validated via `validateBuyer()`. **Never trusts the client-sent price** — re-fetches `price_cents` from the row and compares against `expectedCents` (a mismatch is treated as a stale client, not fatal to security since the actual charge always uses the row's value). Two paths:
- **Priced**: writes a `checkout_intents` row (service client — no client insert policy on that table), then calls Bolt's `createOrderToken` and returns `{ boltToken, boltPublishableKey }` for the browser to open Bolt's modal with. No claim happens here — that's deferred to `fulfilBoltTransaction`, invoked either by the webhook or by `completeBoltPurchase` below.
- **Free**: resolves/creates a buyer account (guest → `resolveBuyerId`, admin `auth.createUser`), calls the `claim_design_for` Postgres RPC (atomic row-locked claim — this is where the *real* "only one buyer" enforcement lives, not application code), sends receipt/file emails and syncs the Printify product in `after()`, redirects to the new owner's storefront.

**`completeBoltPurchase(reference)`** — same file
Public. The "fast path" companion to the Bolt webhook — called from the browser the instant Bolt's modal reports success, so the buyer doesn't sit on a spinner waiting for the webhook queue. Calls the same `fulfilBoltTransaction()` the webhook calls; idempotent (re-reads the transaction from Bolt itself, never trusts the browser payload beyond the reference string, which is only a lookup key).

**`getOrderOptions(garmentSlug)`** — `app/(public)/design/[id]/order-actions.ts`
Public. Reads the live Printify catalogue (colours/sizes/pricing) for a garment. Never throws (catches and returns `null`) — every design page calls this for the swatch row, so a Printify outage must not take down page rendering.

**`placeGarmentOrder(designId, variantId, rawAddress)`** — same file
Requires session (`"Sign in to order."`). Validates `rawAddress` via `validateAddress()`. Re-reads the design server-side (never trusts client-sent design state). Checks `orderEligibility()` (claimed + has a Printify product + variant is currently sellable) before allowing the order. Charges via `lib/payments/checkout.ts`'s `charge()` — **this is a mock/stub payment adapter**, not a real processor; garment (re-print) orders are not wired to real payment yet, unlike the original design purchase which goes through Bolt. Inserts a `paid` `orders` row, then in `after()`: sends a confirmation email and submits to Printify (only if `PRINTIFY_SUBMIT_ORDERS=true` env flag — off by default, so garment fulfillment is a no-op in most environments even after "payment").

### Storefront / creator

**`toggleFollow(profileId, handle)`** — `app/(public)/creator/[handle]/actions.ts`
Requires session (throws `Error` rather than returning a state object — this action isn't backing a `useActionState` form, it's called directly and the caller must catch). Toggles a `follows` row.

**`listDesign(designId, config, free, dollars)`** — `app/dashboard/designs/actions.ts`
No explicit `auth.getUser()`/ownership check in the action itself — relies entirely on the `designs_update_creator_unclaimed` RLS policy to restrict the UPDATE to the maker (and only while unclaimed). The code comment is explicit this is deliberate: "a second check in application code is one more thing that can drift out of agreement with the policy." Validates price via `validateListingPrice()`, validates `config` (garment/variant/placement) against the *live* Printify catalogue if provided. Mints the Printify product in `after()` via `syncDesignProduct()`.

**`delistDesign(designId)`** — same file
Same RLS-only pattern as `listDesign` — no explicit auth check, relies on the update policy.

**`updateProfile(prevState, formData)`** — `app/dashboard/settings/actions.ts`
Requires session. Handle uniqueness check (regex `^[a-z0-9_]{3,30}$`, queried against other users). Email change routes through `supabase.auth.updateUser` (Supabase's own re-confirmation flow, not applied instantly). Avatar/banner file uploads go to the `avatars` Storage bucket **using the user's own session client** (not service-role) — falls back to embedding the file as a base64 data URL directly in the `profiles` row if the Storage upload fails, which is worth flagging: an unbounded-size data URL landing in a Postgres text column on upload failure is an unusual failure mode, not obviously bounded by any check in this function.

**`updateNotificationPreferences(prevState, formData)`** — same file
Requires session. Upserts `notification_preferences` from checkbox fields.

**`applyStorefrontThemePrompt(prevState, formData)`** — same file
Requires session. Two sub-flows on one action, dispatched by `formData.get("intent")`:
- `intent === "reset"` — clears `storefront_theme` to `null`.
- `intent === "banner"` — calls `generateBannerFromPrompt()` (MuAPI `/gpt-image-2-text-to-image`, **~$0.09/press per the code's own comment** — a real paid call, separated into its own button specifically because of cost), uploads to the `designs` bucket via service-role client, updates `profiles.banner_url`.
- default — calls `generateThemeFromPrompt()` (Kimi via MuAPI, `lib/storefront/theme-prompt.ts`; one retry on an empty reply). The model's raw JSON reply is **never** written directly — `parseTheme()` validates every field into hex literals / known enum values before it reaches the `profiles.storefront_theme` column, so a hostile or malformed model reply can only ever degrade to house-default fields, not inject arbitrary content.

### Dashboard / account

**`signOut()`** — `app/dashboard/actions.ts`
Calls `supabase.auth.signOut()`, redirects to `/login`. No auth check needed (signing out with no session is a no-op).

**`sendMessage(recipientId, handle, body)`** — `app/dashboard/messages/actions.ts`
Requires session (throws if not). Inserts a `messages` row.

**`markAllNotificationsRead()`** — `app/dashboard/notifications/actions.ts`
Requires session (throws if not). Bulk-updates the caller's own unread `notifications`.

---

## External API calls made server-side

| Service | Called from | What for | Cost signal in code |
|---|---|---|---|
| **MuAPI** (`api.muapi.ai`) — image gen | `POST /api/generate` → `lib/generation/adapter.ts generate()` | `/gpt-image-2-text-to-image`, 1 image per generation job | Real per-call cost; `IMAGES_PER_JOB` was deliberately cut from 4→1 to control spend |
| **MuAPI** — background removal | `removeDesignBackground` action (`app/dashboard/designs/actions.ts`) | `/ai-background-remover` | Second paid model call, on-demand button press only (was removed from the automatic generation path for cost + quality reasons) |
| **MuAPI** — text (Kimi-K3) | `POST /api/generate` (via `composeListing`/`composePrompt`) | Listing copy + image-prompt art direction, 2 parallel calls per job | "Cost is four decimal places of a cent either way" per code comment — cheap relative to image gen |
| **MuAPI** — text (Kimi-K3) | `applyStorefrontThemePrompt` action (theme sub-flow) | Storefront theme JSON from a prompt | Cheap; one retry on empty reply |
| **MuAPI** — image gen | `applyStorefrontThemePrompt` action (banner sub-flow) | Storefront cover banner, 16:9 | **~$0.09/press** — explicit cost comment, why it's a separate button from the (cheap) theme call |
| **OpenRouter** (`openrouter.ai`) — vision | `createPersona` action → `analyzePersonaStyle()` | `google/gemini-2.5-flash`, reads 10–50 reference images at once | Called once per persona creation, not per generation — "cheap for a call this infrequent" per code comment |
| **Printify** (`api.printify.com`) | `syncDesignProduct`/`remintDesignProduct` (triggered from `listDesign`, `buyDesign`, `fulfilBoltTransaction`), `createDesignProduct`, `getOrderOptions`, `placeGarmentOrder` → `submitPrintifyOrder` | Product creation (on listing), catalogue reads (variants/colours), mockup polling, order submission | Printify bills on **order**, not product creation — an unsold listed product costs nothing per the code's own reasoning; order submission itself is gated behind `PRINTIFY_SUBMIT_ORDERS=true`, off by default |
| **Bolt** (`api.boltapp.com` / sandbox) | `buyDesign` → `createOrderToken`; `POST /api/bolt/webhook` and `completeBoltPurchase` → `fulfilBoltTransaction` → `getTransaction`, `creditTransaction` | Real card payments for design purchases | Sandbox unless `BOLT_ENV=production`; refunds issued automatically on a losing claim race |
| **Resend** (`api.resend.com`) / Gmail SMTP fallback | `deliverDesignPurchase`, `placeGarmentOrder`, `submitContactMessage`, `subscribeToNewsletter` | Transactional email (receipts, design file delivery, contact form routing, newsletter welcome) | Not a generation-cost concern, but every purchase path fires 2 emails; optional (logs and no-ops if neither `RESEND_API_KEY` nor Gmail creds are set) |

---

## Generation pipeline as a contract (`/api/generate`)

**Input** → **Output**, end to end:

1. Client posts `{ prompt, styleSlug, text?, quote?, aspectRatio?, quality?, persona?, enhance? }`.
2. Server validates and inserts a `generation_jobs` row (`status: "queued"`), returns `202 { jobId }` immediately.
3. In the background (`after()`):
   a. `composeListing({ idea: prompt, style })` and `composePrompt({ idea, style, text, quote, aspectRatio, persona, enhance })` run **in parallel** — both are independent Kimi-K3 calls (via MuAPI `/kimi-k3`) with per-field fallback to a hand-written template on any failure (bad JSON, timeout at 90s, no API key). Neither can fail the job.
   b. The resolved image prompt (`buildPrompt()`, `lib/generation/prompt.ts`) is a fixed-structure text block: opening line (artifact/style/aspect ratio) → `Composition:` → `Subject:` → optional `Materials:`/`Lighting:` → `Backdrop:` (a flat chroma-key field, black or white per style) → typographic styles' `Exact typography:` block (literal quoted strings, letter-spelled for titles) → `Art direction:` (technique + palette + hard negative constraints). Model-authored fields (subject/composition/materials/lighting/artDirection) are individually screened for policy violations (naming the backdrop, contradicting a fixed palette) before being spliced in — a violating field is dropped in favor of the template's own wording, never sent through as-is.
   c. `generate()` calls MuAPI `/gpt-image-2-text-to-image` with `{ prompt, aspect_ratio, resolution: "2K", quality }`. `IMAGES_PER_JOB = 1`.
   d. Result PNG uploaded to Supabase Storage bucket `designs`; a `designs` row inserted with `moderation_status: "approved"` unconditionally (no human review queue — the model is trusted to refuse policy-violating prompts at generation time, per the code's own stated design decision), `listed_at: null` (private until the maker explicitly lists it).
   e. Job flips to `"done"` (pointing at the design via `result_design_id`) or `"failed"` if the image generation threw.
4. Client polls the `generation_jobs` row (and resulting `designs` row) by id — there's no server-sent completion event, this is pure polling.

**Quota**: `countRecentGenerations()` counts `generation_jobs` rows (not `designs`, and not filtered by success) in the trailing 24h per user, compared against `DAILY_CAP` (`GENERATION_DAILY_CAP` env, default 5). Counting *jobs* rather than successful designs is deliberate — a broken prompt retried forever should still cost quota, since it costs real money either way.

**Background removal is separate**: not part of the generate pipeline at all. `removeBackground()` (`/ai-background-remover`) is only reachable via the `removeDesignBackground` dashboard action, on an already-generated, unclaimed design — a second paid model call gated behind a maker's explicit button press, because automatic removal was observed to silently destroy poster/broadside-style designs that need their full plate intact.

---

## Notes on things worth a second look

- **`resendOtp`** has no visible rate limiting in application code — relies entirely on whatever Supabase's own OTP-resend throttling does server-side.
- **`restoreDesignBackground`** doesn't call `auth.getUser()` itself, unlike its sibling `removeDesignBackground` — it relies on RLS alone to scope the update to the owner. Functionally probably fine (RLS should cover it), but it's an inconsistency in the file's own defense-in-depth pattern, worth a deliberate look rather than an assumption.
- **`listDesign`/`delistDesign`** likewise carry no explicit `auth.getUser()`/ownership check — entirely RLS-gated by design (per an explicit code comment reasoning that a second check risks drifting out of sync with the policy). This is a stated architectural choice, not an oversight, but it does mean these two actions have *zero* defense-in-depth if the RLS policy is ever misconfigured.
- **`/api/auth/confirm`**'s `next` query param is used directly in a redirect without running through `safeNext()` (every other auth exit point in the codebase does). Given Supabase controls `token_hash`/`type` and the redirect fallback is `/login?error=...` on failure, the practical exposure looks narrow, but it's the one auth-adjacent redirect in the six route handlers that doesn't use the shared guard.
- **`updateProfile`**'s avatar/banner upload failure path falls back to embedding the raw file as a base64 data URL directly into the `profiles` row (`avatar_url`/`banner_url` columns) — no explicit file-size cap visible in this function before that happens.
