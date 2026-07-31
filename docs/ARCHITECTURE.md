# Shirt Bazaar — Architecture

## Folder conventions
- Every route lives under `app/`, one folder per route, using standard Next.js App Router files (`page.tsx`, and `layout.tsx` where a route needs its own layout).
- A route's `page.tsx` is a thin composition file only. All real UI for that route lives in a sibling `components/` folder inside the same route folder — e.g. `app/dashboard/create/components/VibePicker.tsx`.
- Persistent chrome — `Sidebar`, `Header`, `Navbar`, `Footer` — lives once, in a top-level `components/layout/` folder, and is composed into the relevant root/segment layouts. It is never duplicated per route.
- Anything used by two or more routes is promoted to a top-level `components/shared/` folder. Copy-pasting a component into a second route is the signal to promote it instead.
- Everything else stays local to its route's `components/` folder until a second route actually needs it.

## Route table

| Path | Purpose | Auth required |
|---|---|---|
| `/` | Home / vibe-column feed | No |
| `/design/[id]` | Design detail + claim/purchase | No (purchase requires auth) |
| `/creator/[handle]` | Claimant's personal storefront | No |
| `/search` | Cross-vibe, cross-creator search | No |
| `/login` | Login | No |
| `/signup` | Sign up | No |
| `/forgot-password` | Request password reset | No |
| `/verify-otp` | OTP verification | No |
| `/reset-password` | Set new password | No |
| `/terms` | Terms of service | No |
| `/privacy` | Privacy policy | No |
| `/child-safety` | Child protection policy | No |
| `/cookies` | Cookie policy | No |
| `/refund-policy` | Refund policy | No |
| `/acceptable-use` | Acceptable use policy | No |
| `/blog`, `/blog/[slug]` | Blog index + post | No |
| `/about` | About | No |
| `/contact` | Contact | No |
| `/careers` | Careers | No |
| `/faq` | FAQ | No |
| `/onboarding` | First-session flow | Yes |
| `/dashboard` | Overview | Yes |
| `/dashboard/create` | Generation flow | Yes |
| `/dashboard/designs` | Owned designs & claims | Yes |
| `/dashboard/messages` | Inbox | Yes |
| `/dashboard/settings` | Account / Notifications / Twin / AI / Payouts tabs | Yes |
| `/dashboard/orders` | Purchase history | Yes |

## System overview

```
Browser (Next.js App Router, server components by default)
        |
        |-- Supabase Auth (session, OTP, reset)
        |-- Supabase Postgres + RLS (all application data)
        |-- Supabase Storage (reference uploads, generated + print-ready assets)
        |
        |-- Image-gen adapter -- pluggable provider(s), draft + upscale tiers
        |-- POD adapter -- pluggable provider(s), selected server-side by tier
        `-- Stripe Connect -- purchase charge, platform fee, royalty transfers
```

## Adapter boundary
Both the image-gen and print-on-demand integrations are reached only through a single server-side adapter interface each (see `TRD.md`). No route or client component ever imports a provider SDK directly. This is what makes providers swappable, and what keeps provider identity out of anything the client can see — matching the "buyers only see quality tiers, never vendors" requirement in the PRD.

## Background jobs
- Generation job worker (draft and upscale).
- Royalty payout worker (triggered on resale of an already-claimed design).
- Share-image compositing worker (triggered on claim).
