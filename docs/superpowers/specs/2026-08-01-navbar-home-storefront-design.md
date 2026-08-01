# Navbar + Home Storefront Design

Date: 2026-08-01

## Context

Bazaar is "SHIRT BAZAAR" — a marketplace where designs are one-of-one claims with resale royalties, each with a creator storefront. Today's `Navbar` has two links (Browse, Search) and simple signed-in/out buttons. The Home page (`app/(public)/page.tsx`) already has a hero and a `Feed` of vibe columns.

This spec covers only the navbar shell and Home page polish. It intentionally does **not** cover the real Bazaar catalog, the Bid/auction system, or Cart/checkout — those are independent subsystems with no existing backend and each gets its own future spec. This round adds nav entry points and placeholder pages for them so the navbar ships complete.

## Scope

In scope:
- Navbar redesign (desktop + mobile): logo, center nav links, search popover, notification bell, cart icon, user profile menu
- Home page polish: small heading above the existing catalog feed
- Placeholder routes: `/shop`, `/auctions`, `/cart`

Out of scope (future specs):
- Real catalog/filtering on `/shop`
- Real auction/bidding data model and flow on `/auctions`
- Real cart/checkout on `/cart`
- Live search results (popover only submits to `/search`)

## Routes

| Path | Purpose | This round |
|---|---|---|
| `/` | Home — storefront landing | Polish only (see below) |
| `/shop` | Bazaar — full catalog/browse | New `ComingSoon` placeholder page |
| `/auctions` | Bid — auction/bidding system | New `ComingSoon` placeholder page |
| `/cart` | Cart | New `ComingSoon` placeholder page |
| `/search` | Search results | Unchanged (existing `ComingSoon` placeholder) |

Placeholder pages reuse the existing `components/shared/ComingSoon.tsx` pattern (same as current `/search`), each with a title/description specific to the section. No new tables or data layers for these three routes.

## Navbar

### Desktop (`md:` and up)

```
[Logo]        [Home] [Bazaar] [Bid] [🔍]              [right-side controls]
```

- Left: existing `Logo` component, unchanged.
- Center nav links: `Home` (`/`), `Bazaar` (`/shop`), `Bid` (`/auctions`) — same active-link underline treatment as today's `NAV_LINKS` map.
- Search: icon button (not a text link) that opens a `Popover` containing a single text input. Submitting (Enter or a submit button) navigates to `/search?q=<value>`. Empty query does not navigate.
- Right side, **logged out**: `Sign in` (ghost button → `/login`) and `Sign up` (primary button → `/signup`). Same buttons as today, `Get started` relabeled to `Sign up` for clarity against `Sign in`.
- Right side, **logged in**, left to right:
  1. `NotificationBell` — reused as-is from `components/dashboard/NotificationBell.tsx`. Takes real `items`/`unreadCount` from `getNotifications()`.
  2. Cart icon button — static, no badge (no cart data exists yet), links to `/cart`.
  3. `UserMenu` (new component) — avatar trigger opens a dropdown with: Dashboard (`/dashboard`), My designs (`/dashboard/designs`), Orders (`/dashboard/orders`), Settings (`/dashboard/settings`), a separator, then Log out. Mirrors the account dropdown already in `components/layout/DashboardSidebar.tsx` (same `DropdownMenu` primitive, same `signOut` server action), but trimmed to the four links above instead of the sidebar's full set (no "Upgrade to pro" / "Add account" placeholders — those are dashboard-specific affordances, not navbar ones).

### Mobile

Collapsed header bar: `Logo` — `NotificationBell` — Cart icon — hamburger trigger (all visible at all times when logged in; logged out shows just `Logo` — hamburger, or optionally a compact `Sign in` if there's room — match today's pattern of hiding auth buttons on mobile in favor of the sheet).

Sheet (opened via hamburger) contains: nav links (Home, Bazaar, Bid, Search — Search here is a plain link/input, not a popover, since there's no popover-over-sheet nesting), then at the bottom either the two auth buttons (logged out) or the `UserMenu` items inline (logged in) — following the existing sheet structure in `Navbar.tsx` today.

## Home page

No structural rebuild. Changes:
- Hero: unchanged (copy, layout, CTA already read as ecommerce landing).
- Catalog: add a small section heading above `Feed` (e.g. "New drops") so the grid reads as a labeled catalog section. No changes to `VibeColumn` or `DesignCard`.
- No categories, trending, or creator-spotlight sections this round (explicitly deferred — keep Home lean, that's what `/shop` is for later).

## Data flow

`app/(public)/layout.tsx` currently fetches only a boolean `user`. It needs to additionally fetch, **only when a user is present** (avoid the query when logged out):
- `getNotifications()` from `lib/data/notifications.ts` (already exists, used by dashboard today)
- the `profiles` row (`handle`, `display_name`, `avatar_url`) — same query shape as `dashboard/layout.tsx`

Both are passed down to the new navbar controls. No new data-layer code — this is wiring that already exists in the dashboard layout, applied to the public layout too.

## New components

- `components/layout/UserMenu.tsx` — avatar + dropdown, described above. Trigger uses `Avatar`/`AvatarFallback` like `DashboardSidebar`; content uses the existing `DropdownMenu` primitives.
- Navbar search popover — small addition inside `components/layout/Navbar.tsx`, using the existing `Popover` primitive (same one `NotificationBell` uses).
- Three placeholder pages, following the existing `(public)` route group structure: `app/(public)/shop/page.tsx`, `app/(public)/auctions/page.tsx`, `app/(public)/cart/page.tsx`, each using `ComingSoon`.

No new components for cart icon or nav links — plain `Link`/`Button` usage matching existing style.

## Edge cases

- Logged-out users never trigger the notifications/profile queries in `(public)/layout.tsx`.
- Avatar with no `avatar_url` falls back to first-letter initial, same as `DashboardSidebar`.
- Search popover: blank submit is a no-op, does not navigate to `/search` with an empty query.
- `/shop`, `/auctions`, `/cart` are publicly browsable (no auth redirect) — browsing before signup is normal for an ecommerce site. Only account-specific data (notifications, avatar, dashboard links) requires auth, which already redirects via existing patterns elsewhere in the app.

## Testing

Manual verification in dev: logged-out and logged-in states in browser, desktop and mobile viewport widths, confirm the active-link indicator works for the new `/shop` and `/auctions` links, confirm the bell shows real notification data (reusing existing dashboard data path), confirm all three placeholder pages render without errors.
