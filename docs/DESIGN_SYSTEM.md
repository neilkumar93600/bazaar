# Shirt Bazaar — Design System

Working v1 direction — treat as a committed starting point, not a placeholder. Revise deliberately; don't drift.

## Principles
- The vibe-column feed is the hero interaction — auth, legal, and settings should feel calm and get out of the way by comparison.
- Asymmetry and scale contrast over centered, evenly-spaced templates.
- Motion makes column-browsing feel tactile, not decorative — anything that isn't reinforcing the browse or claim action gets cut.

## Color
Adopted wholesale from `DESIGN.md` (the n8n reference) — this is now the site's actual palette, not just inspiration.
- Base: violet-black surface (`#0E0918`) — never a neutral/warm dark gray, the violet undertone is load-bearing. Body text is warm-gray (`#D1CECE`), headings/high-emphasis text is pure white (`#FFFFFF`). Storefront, legal, blog, and dashboard all share this system — no light theme anywhere.
- Two gradients carry the entire accent identity, never a solid brand color:
  - **Ember** `linear-gradient(30deg, #fd8925, #ff0c00)` — exclusively on primary CTA buttons and claimed-state indicators.
  - **Electric Current** `linear-gradient(141deg, #077ac7, #6b21ef)` — exclusively on link hovers, focus rings, and connective/active states.
  - Never use either gradient as a section or banner background fill.
- Card surfaces step up from the base in two tiers (`#1A1624`, then `#1B1728` for larger panels) — elevation is expressed through this color-stepping, never a drop shadow.
- Vibe columns each get a muted identity tint (desaturated, low-opacity tag color) so columns are visually distinguishable at a glance without competing with either gradient.

## Typography
- Single family (Inter, substituting for geomanist) for all headline/display and body copy — weight 300 for display, 400 for body. This restriction is scoped to that headline/body register (the `text-display`/`text-heading-*`/`text-body*` scale in `globals.css`); it does not extend to reused shadcn primitives (button/badge/input labels etc.), which keep their own stock weights as ordinary UI chrome.
- Display/headlines: weight 300 at large, tight-tracking sizes (48-54px, tracking -0.86px to -1.08px, leading 0.88-0.94) for vibe names and design titles — headlines whisper, they don't shout.
- Body/UI copy: weight 400 at 15-18px, generous line-height (1.4-1.7) for legal and blog readability.

## Spacing & layout
- 8px base spacing scale.
- Radius tiers: 8px buttons/inputs, 16px standard cards, 24px large panels/badges, pill (9999px) reserved for tags/status/circular icon wrappers only — never on cards or section containers.
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
