# Security Review

Grounded in the code as of this review, not a generic checklist. Every finding below was verified
by reading the referenced file(s); nothing here is speculative. File:line references point at the
exact code discussed.

## Executive summary

Overall risk posture is **moderate-low**. The core money paths (Bolt webhook signature
verification, claim/order RPCs, watermarking) and the RLS schema are unusually careful — signature
checks use `timingSafeEqual`, payment amounts are re-read from the processor rather than trusted
from the client, and Postgres RLS policies are narrow and well-commented. The one finding that
actually matters is an **open redirect** in the OTP/password-recovery confirmation flow: the same
`safeNext()` guard applied everywhere else in the auth system was not applied to
`app/api/auth/confirm/route.ts` or `app/(auth)/reset-password/confirm/actions.ts`, so those two
exits can send a victim off-domain from a link that starts on the real site — a phishing primitive,
not a data breach, but worth fixing before it's used against a user. Everything else found is
Medium/Low: an unvalidated avatar-upload fallback, a weak (substring) URL ownership check on
persona references, and the absence of standard security response headers (CSP, X-Frame-Options,
HSTS). No missing RLS, no unauthenticated webhook, no secret leaking into client code, and no SQL/
command injection were found.

## Findings

| Severity | Area | Description | Evidence | Recommendation |
|---|---|---|---|---|
| High | Auth / open redirect | `next` param not sanitized before redirect in the OTP-confirm and password-recovery flows | `app/api/auth/confirm/route.ts:9,32,41`; `app/(auth)/reset-password/confirm/page.tsx:14,46`; `app/(auth)/reset-password/confirm/actions.ts:18,31` | Route every `next` through `safeNext()` before it reaches a `redirect()` call, same as the callback route and login/signup/verify-otp actions already do |
| Medium | File upload | Avatar/banner upload has no size or content-type validation; failure path stores the raw file as base64 directly in the `profiles` row | `app/dashboard/settings/actions.ts:61-106` | Validate MIME type and size before upload; drop the base64-into-DB fallback, return an error instead |
| Low | Access control | Persona reference-image ownership check uses `String.includes()` instead of a proper prefix/origin check | `app/dashboard/personas/actions.ts:57-59` | Use `new URL(url).pathname.startsWith(...)` against the known Supabase Storage origin, not a substring match |
| Low | Infrastructure | No security response headers configured (CSP, X-Frame-Options, HSTS, X-Content-Type-Options) | `next.config.ts` (no `headers()`); confirmed live — see below | Add a `headers()` block in `next.config.ts` |
| Low | Abuse control | Public, unauthenticated insert policies (`newsletter_subscribers`, contact form, etc.) have no rate limiting | `supabase/migrations/20260811034201_baseline_schema.sql:316-317` | Low priority; add rate limiting if spam becomes a real problem |

---

## [HIGH] Open redirect in `/api/auth/confirm` and password-recovery confirm

**Location:**
- `app/api/auth/confirm/route.ts:9` (`const next = searchParams.get("next") ?? "/dashboard"` — no `safeNext()`)
- `app/api/auth/confirm/route.ts:32` (unsanitized `next` forwarded into the recovery confirm URL)
- `app/api/auth/confirm/route.ts:41` (`NextResponse.redirect(\`${origin}${next}\`)`)
- `app/(auth)/reset-password/confirm/page.tsx:14,46` (reads `next` from `searchParams`, stuffs it into a hidden form field, unsanitized)
- `app/(auth)/reset-password/confirm/actions.ts:18,31` (`redirect(next)` — `next` used as-is)

**Description:** The codebase has a deliberate, well-documented open-redirect guard —
`lib/auth/next-url.ts`'s `safeNext()`, with its own test file (`lib/auth/next-url.test.ts`) built
specifically around this threat class. It is correctly applied in four places:
`app/api/auth/callback/route.ts:10`, `app/(auth)/login/actions.ts:43`,
`app/(auth)/signup/actions.ts:64`, and `app/(auth)/verify-otp/actions.ts:44`. It is **not** applied
in the fifth and sixth auth exit: the `/api/auth/confirm` route (used for signup/email-change/
invite links, and to hand off to the password-recovery confirm page) and the recovery confirm
action that runs after it.

Two distinct exploitable paths:

1. **`app/api/auth/confirm/route.ts:41`** — for any non-recovery OTP type (`signup`, `email_change`,
   `invite`), a successful `verifyOtp` redirects to `` `${origin}${next}` `` with `next` taken
   straight from the query string. Because `next` is concatenated onto `origin` rather than
   resolved against it, an absolute URL like `https://evil.tld` doesn't parse as a valid redirect —
   but `next=@evil.tld/phish` does: `` `${origin}@evil.tld/phish` `` (e.g.
   `https://bazaar.app@evil.tld/phish`) is a syntactically valid URL where `bazaar.app` becomes
   *userinfo* and `evil.tld` becomes the actual host. Browsers navigate to `evil.tld`.
2. **`app/(auth)/reset-password/confirm/actions.ts:31`** — `redirect(next)` uses Next.js's
   `redirect()` from `next/navigation`, which accepts a fully-qualified external URL with no
   same-origin restriction (this is standard, documented Next.js behavior, used elsewhere in the
   app for exactly that reason — e.g. redirecting to Bolt). No trick is required here: `next=`
   `https://evil.tld/login` redirects the browser off-site directly, no bypass needed.

**Impact:** Both are phishing primitives, not direct data breaches. The attack doesn't require
compromising the *victim's* token — an attacker only needs *some* valid `token_hash`/`type` pair
routed through the real domain, which they can generate for free against their own account (their
own signup confirmation, email-change confirmation, or their own password-reset email). They then
send a victim a link that visibly begins `https://<real-bazaar-domain>/...` — the kind of link a
user is trained to trust — with a crafted `next`. Clicking it verifies the *attacker's own* harmless
token (no effect on the victim's account) and then bounces the victim's browser to an attacker page
that can pixel-perfectly clone the real login/reset form to harvest credentials. This is exactly the
scenario `next-url.ts`'s own comment warns about ("an unchecked value turns every auth exit into an
open redirect that phishes with a real login page") — the guard exists, it just wasn't wired into
these two exits.

**Proof of concept (path 2, no bypass trick needed):**
1. Attacker requests a password reset for their own email via `/forgot-password`.
2. Supabase emails a link of the form `/api/auth/confirm?token_hash=<real>&type=recovery&next=/reset-password`.
3. Attacker rewrites the `next` param before sending it to a victim:
   `https://<real-domain>/api/auth/confirm?token_hash=<attacker's real token>&type=recovery&next=https://evil.tld/login`.
4. `type === "recovery"` forwards unsanitized to `/reset-password/confirm?token_hash=...&next=https://evil.tld/login` (`route.ts:29-33`).
5. Victim clicks (the visible domain up to this point is real). The confirm page's form posts to
   `confirmRecovery`, which calls `verifyOtp` (succeeds — it's a valid, if unrelated, token), then
   runs `redirect("https://evil.tld/login")` (`actions.ts:31`) — victim's browser leaves the real site.

**Recommendation:** Apply the existing guard consistently.

```ts
// app/api/auth/confirm/route.ts
import { safeNext } from "@/lib/auth/next-url";
// ...
const next = safeNext(searchParams.get("next"), "/dashboard");
```

```ts
// app/(auth)/reset-password/confirm/actions.ts
import { safeNext } from "@/lib/auth/next-url";
// ...
const next = safeNext(String(formData.get("next") ?? ""), "/dashboard");
// ...
redirect(next);
```

And sanitize on the way into the hidden form field too (`app/(auth)/reset-password/confirm/page.tsx:14`),
so a malicious link can't even get `next` as far as the form.

---

## [MEDIUM] Avatar/banner upload: no size/type validation, base64-into-database fallback

**Location:** `app/dashboard/settings/actions.ts:61-106`

**Description:** `updateProfile` accepts `avatarFile`/`bannerFile` from the form with no check on
`.size` or `.type` before attempting to upload to Supabase Storage's `avatars` bucket. That bucket
is never created or given a storage policy anywhere in `supabase/migrations/*` (grepped the whole
directory — only the `designs` bucket is provisioned, in
`20260811034201_baseline_schema.sql:639-646`, plus one storage.objects policy for
`persona-refs/` in `20260827000000_persona_refs_owner_upload.sql`). Whether `avatars` exists as
out-of-band infrastructure or not, the code's own `catch` blocks (lines 78-81, 102-105) treat upload
failure as expected: on any error, the raw file bytes are base64-encoded and written directly into
`profiles.avatar_url` / `profiles.banner_url` — a plain `text` column, rendered as `<img src>` on
public storefront/profile pages — with the only real ceiling being
`next.config.ts:6`'s `serverActions.bodySizeLimit: "10mb"`.

**Impact:** An authenticated user can bloat their own profile row with up to ~10MB of arbitrary
binary content with no verification it's actually an image, and (if the `avatars` bucket does exist
server-side) upload a non-image file under an image-looking name into public storage with no
type allowlist. This is self-directed (own row, own storage namespace) — not cross-user — so it's a
data-integrity/storage-cost issue rather than an account-compromise one, but the missing validation
is a real gap regardless of which code path executes.

**Recommendation:**
```ts
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

if (avatarFile && avatarFile.size > 0) {
  if (avatarFile.size > MAX_AVATAR_BYTES) return { error: "Image is too large (max 5MB)." };
  if (!ALLOWED_TYPES.has(avatarFile.type)) return { error: "Use a PNG, JPEG, or WebP image." };
  // ... upload; on failure, return an error rather than falling back to storing the file inline.
}
```
Also confirm the `avatars` bucket actually exists with an owner-scoped insert policy (same pattern
as `persona_refs_owner_insert`), and track its creation in a migration rather than out-of-band.

---

## [LOW] Persona reference-image ownership check uses substring match

**Location:** `app/dashboard/personas/actions.ts:57-59`

```ts
const ownPrefix = `/designs/persona-refs/${user.id}/`
if (imageUrls.some((url) => !url.includes(ownPrefix))) {
  return { error: "Those images weren't uploaded by you. Try again." }
}
```

**Description:** The comment above this check states the intent clearly: "confirm every URL
actually points at this user's own persona-refs prefix rather than trusting whatever the form
posted." `String.includes()` doesn't do that — it only checks that the substring appears
*somewhere* in the URL, not that the URL's path is rooted there. A URL like
`https://attacker.example/x?r=/designs/persona-refs/<own-uid>/y.png` passes this check while
actually pointing at attacker-controlled infrastructure.

**Impact:** Low. This only lets a user smuggle arbitrary external image URLs into their *own*
persona's `analyzePersonaStyle()` call (`lib/generation/persona-analysis.ts`), which forwards them
to OpenRouter's vision model. No cross-user access, no server-side fetch of the URL by this app's
own infrastructure (the vision model provider fetches it, not this server) — so this is not a
direct SSRF against Bazaar's own infra, but it defeats the intended access boundary for what should
be a closed, storage-scoped upload flow.

**Recommendation:**
```ts
const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
const ok = imageUrls.every((url) => {
  try {
    const u = new URL(url);
    return u.origin === supabaseOrigin && u.pathname.includes(ownPrefix);
  } catch { return false; }
});
if (!ok) return { error: "Those images weren't uploaded by you. Try again." };
```

---

## [LOW] No security response headers

**Location:** `next.config.ts` — no `headers()` export.

**Description:** Verified live against the dev server (`http://localhost:3001/`): the response
carries no `Content-Security-Policy`, no `X-Frame-Options`/`frame-ancestors`, no
`Strict-Transport-Security`, and no `X-Content-Type-Options`. `X-Powered-By: Next.js` is also
present (Next's default; minor information disclosure, trivially fixed with `poweredByHeader: false`).

**Impact:** No known active XSS or clickjacking vector was found to chain this into during this
review, so this is a defense-in-depth gap rather than an exploitable finding on its own — but
without `frame-ancestors`/`X-Frame-Options`, auth and purchase pages can be iframed by another
origin (clickjacking on login/buy/claim actions), and without a CSP an XSS found later has no
secondary containment.

**Recommendation:**
```ts
// next.config.ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  },
  // ...
};
```
A full CSP is a larger effort (needs an inventory of every inline script/style and third-party
origin — Bolt's checkout script, Supabase Storage, etc.) and can follow separately.

---

## [LOW] No throttling on public write endpoints

**Location:** `supabase/migrations/20260811034201_baseline_schema.sql:313-317` (`newsletter_subscribers_insert_public`, `with check (true)`, granted to `anon, authenticated`)

**Description:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` is in the browser bundle by design, and this table
grants unauthenticated insert with no row-level restriction beyond the column's own `unique`
constraint. Anyone can POST directly to PostgREST (bypassing the app's client-side email-regex
check) to mass-insert garbage strings as "emails." Same absence of rate limiting applies to the
contact form (`app/actions/contact.ts`) and other public Server Actions — none of them are
attached to a rate limiter. Not a data-exposure issue (write-only, no read policy on this table),
just spam/cost exposure.

**Recommendation:** Low priority. If abuse becomes real, put a rate limiter (e.g. Upstash
`@upstash/ratelimit`, keyed by IP) in front of the newsletter/contact Server Actions.

---

## Working as intended

Worth calling out explicitly so they aren't second-guessed later:

- **Bolt webhook (`app/api/bolt/webhook/route.ts`, `lib/payments/bolt.ts:171-184`)** — signature is
  verified with HMAC-SHA256 over the raw request body (`request.text()`, never `.json()`, so
  re-serialization can't invalidate the signature) and compared with `timingSafeEqual`, not `===`.
  An unconfigured signing secret fails closed (`verifyWebhook` returns `false`), not open.
  Fulfilment (`lib/payments/fulfil.ts`) never trusts the webhook body's amount/reference — it
  re-reads the transaction from Bolt's API (`getTransaction`) and compares the charged amount
  against `checkout_intents.expected_cents` before claiming anything, and refunds automatically if
  a race means the design was already claimed by someone else.
- **`claim_design`/`claim_design_for` (`supabase/migrations/...baseline_schema.sql:1042-1157`)** —
  `security definer`, row-locked (`for update`), price re-checked against the row rather than the
  client, and `claim_design_for` (the one that can claim on behalf of an arbitrary buyer, needed for
  the webhook path with no session) is explicitly revoked from `anon`/`authenticated` and granted
  only to `service_role` — closing the exact privilege-escalation hole a naive version of this
  function would open.
- **RLS is enabled on every table** (`baseline_schema.sql:208-223` plus every later migration that
  adds one), including a deny-by-default `checkout_intents` table (RLS enabled, zero client
  policies, holding buyer PII, only reachable by the service role) and a column-level revoke on
  `designs.prompt` (`20260824120000_hide_prompt_column.sql`) specifically to close a PostgREST
  `select=id,prompt` bulk-read the migration's own comment documents having found in production
  logs.
- **Watermark/original image split (`app/api/design-image/[id]/*`)** — the watermarked route is
  intentionally unauthenticated (correct: it's fed through Next's image optimizer, which caches
  by URL with no cookie in the key, so any auth-gated branch here would eventually leak a clean
  image to the cache). The `original` route does check auth and ownership
  (`user.id !== design.claimed_by && user.id !== design.creator_id` → 404), sets
  `Cache-Control: private, no-store` and `Vary: Cookie`, and returns 404 (not 403) for both
  "doesn't exist" and "not yours," avoiding existence-confirmation. Verified live and in code.
- **`safeNext()` (`lib/auth/next-url.ts`)** — where it *is* used (login, signup, verify-otp, OAuth
  callback), it correctly rejects protocol-relative (`//evil.com`), absolute, backslash-folded, and
  control-character payloads, with a dedicated test file covering each case.
- **Server actions generally check auth and re-derive authorization from the DB** rather than
  trusting client-sent IDs/prices — e.g. `buyDesign` (`app/(public)/design/[id]/actions.ts:132-145`)
  re-fetches `price_cents` server-side and only compares the client's `expectedCents` against it
  (never charges the client-sent number); `deletePersona`/`removeDesignBackground` re-check
  ownership in application code even where RLS already enforces it, as an explicit belt-and-suspenders
  choice the comments call out.
- **Email templates escape all interpolated user input** (`lib/email/layout.ts:40-46`,
  `escapeHtml()` applied to every dynamic field including the contact form's `name`/`subject`/
  `message`), and the one `mailto:` CTA href built from a user-supplied address
  (`app/actions/contact.ts:129`) is passed through `encodeURI()` before being placed in an HTML
  attribute (`lib/email/layout.ts:124`), which percent-encodes `"`/`<`/`>` and closes off
  attribute-breakout.
- **Secrets are server-only.** `SUPABASE_SERVICE_ROLE_KEY`, `MUAPI_API_KEY`, `OPENROUTER_API_KEY`,
  `PRINTIFY_API_TOKEN`, `BOLT_API_KEY`, `BOLT_SIGNING_SECRET`, `RESEND_API_KEY`, and
  `GMAIL_APP_PASSWORD` do not appear in any `"use client"` component (grepped every `.tsx` file);
  only the intentionally-public `NEXT_PUBLIC_*` values (anon key, Bolt publishable key/env, site
  URL) are exposed.
- **Generation is rate-limited and bounded**: `app/api/generate/route.ts` requires auth, validates
  prompt length (`MIN_PROMPT_LENGTH`/`MAX_PROMPT_LENGTH`), and enforces a rolling 24h cap per user
  (`lib/generation/quota.ts`) that fails closed on a DB read error rather than defaulting to
  unlimited.
- **Password hashing/session management** is delegated entirely to Supabase Auth (bcrypt under the
  hood, httpOnly session cookies via `@supabase/ssr`), never hand-rolled.
