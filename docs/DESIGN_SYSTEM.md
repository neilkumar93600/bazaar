# Shirt Bazaar — Design System

Working v1 direction — treat as a committed starting point, not a placeholder. Revise deliberately; don't drift.

## Principles
- The vibe-column feed is the hero interaction — auth, legal, and settings should feel calm and get out of the way by comparison.
- Asymmetry and scale contrast over centered, evenly-spaced templates.
- Motion makes column-browsing feel tactile, not decorative — anything that isn't reinforcing the browse or claim action gets cut.

## Color
- Base: near-black surface (`#0B0B0C`) with a warm off-white foreground (`#F4F1EC`) — the storefront reads dark by default; keep legal, blog, and dashboard on the same system rather than switching to a generic light theme.
- Accent: one saturated accent used sparingly for calls to action and claimed-state indicators (e.g. a warm amber `#E8A33D`) — pick one and use it nowhere else.
- Vibe columns each get a muted identity tint (desaturated, low-opacity tag color) so columns are visually distinguishable at a glance without competing with the accent.

## Typography
- Display/headlines: a condensed, slightly industrial grotesk at large, tight-tracking sizes for vibe names and design titles.
- Body/UI: a clean neutral sans at a 15-16px base, generous line-height (1.5-1.6) for legal and blog readability.
- Two weights only in UI chrome (regular and medium); reserve a heavier weight strictly for hero display type.

## Spacing & layout
- 8px base spacing scale.
- Feed columns: fixed-width cards, horizontal scroll/snap on mobile, CSS grid on desktop; generous gutter (24-32px) between columns so each vibe reads as its own shelf.
- Dashboard: standard sidebar plus content layout; sidebar collapses into a bottom/nav drawer on mobile.

## Motion
- Column load-in: staggered fade/rise per card, not a single blanket fade.
- Claim action: a short, satisfying confirmation state (a checkmark or ownership badge animating in) — this is the single most important micro-interaction in the product and should be treated accordingly.
- Hover states on design cards: a subtle scale or lift, no more than 2-3% scale change — avoid anything that shifts layout.

## Components needing explicit states
- Design card: default, hover, claimed, sold-out (if applicable), loading (generating).
- Claim button: default, processing, claimed-confirmation, error.
- Column: default, rented-takeover (needs a distinct visual marker so a paid takeover reads differently from an organic column).
