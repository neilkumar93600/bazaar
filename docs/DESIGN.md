# Brainfish — Style Reference

> lime-marker editorial broadsheet — a near-monochrome page where a single vivid green stroke does all the work

**Theme:** light

Brainfish operates as a minimalist editorial broadsheet: a near-monochrome canvas of paper white and deep ink, interrupted by a single highlighter-lime accent that makes every CTA feel like a mark on a page rather than a button on a screen. The type system pairs Geist's geometric clarity with Fraunces italic for one or two emphasis words inside a headline, creating a signature rhythm where a serif "actually" or "every" sits inside a sans-serif sentence. Components are printed rather than projected — 4px button corners, 2px hard offset shadows, 1px ink borders, and cream card surfaces that read as paper rather than glass. Color is rationed: lime appears only where action is requested or where a section needs punctuation.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Lime Sprint | `#a3e635` | `--color-lime-sprint` | Green action color for filled buttons, selected navigation states, and focused conversion moments. |
| Paper White | `#ffffff` | `--color-paper-white` | Primary page canvas and inverse text on dark surfaces |
| Cream | `#fcfff7` | `--color-cream` | Warm off-white surface for cards, stat tiles, and footer — a barely-there yellow-green tint that distinguishes a lifted surface from the page without introducing a new color |
| Ink | `#262626` | `--color-ink` | Primary text color, default border, icon stroke, and hard shadow color. The single dark token that does structural work across text, lines, and elevation |
| Black Ink | `#000000` | `--color-black-ink` | Strongest display text and filled icon glyphs where maximum weight is needed inside a headline or pull-quote |
| Depth | `#303030` | `--color-depth` | Dark button and surface background — the large primary action blocks where a heavier fill than ink is needed but true black would be too harsh |
| Rule | `#e5e5e5` | `--color-rule` | Hairline borders, card outlines, footer dividers, and the soft separator between sections |
| Muted | `#525252` | `--color-muted-ink` | Secondary body text, supporting descriptions, and the slightly softer voice below a heading |
| Muted Gray | `#737373` | `--color-muted-gray` | Tertiary helper text, badge labels, copyright fine print, and the most de-emphasized text in the hierarchy |
| Mint Edge | `#7ee2b8` | `--color-mint-edge` | Green accent for outlined action borders, linked labels, and lightweight interactive emphasis |
| Mint Wash | `#dcfff1` | `--color-mint-wash` | Status pill surface — paired with Mint Edge, and only for live/health indicators |

## Tokens — Typography

### Geist — primary interface and headline face · `--font-sans`

- **Weights:** 400, 500, 600
- **Sizes:** 14, 16, 18, 20, 28, 36, 48, 56px
- **Line height:** 1.16 display, 1.50 body 20px, 1.55 body 18px, 1.25 body 16px, 1.14 caption
- **Letter spacing:** 56px: -0.28px; 48px: -0.96px; 36px: -0.18px; 28px: -0.56px; body tracks normal
- **Role:** Navigation, buttons, body copy, and most display text. Weight 600 carries display sizes (28–56px) with consistently negative letter-spacing; 400 carries body and caption. The tight tracking on headings compresses the geometric forms into editorial density rather than the wide airy SaaS default.

### Fraunces — display serif, emphasis words only · `--font-serif`

- **Weights:** 500, 600
- **Sizes:** 36, 48, 56px
- **Line height:** 1.08–1.17
- **Role:** Reserved exclusively for one or two italic emphasis words inside a Geist headline. This single serif italic inside a sans-serif sentence is the site's editorial signature — it signals a system that thinks in typeset prose rather than product copy. Never body, never buttons, never a full headline, never upright.

### Geist Mono — technical labels · `--font-mono`

- **Weights:** 400
- **Role:** Tabular meta, sequence markers, inline identifiers and prices. Achromatic like everything else — mono earns its distinction from form, not color.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 14px | 1.14 | — | `--text-caption` |
| body-sm | 16px | 1.25 | — | `--text-body-sm` |
| body | 18px | 1.55 | — | `--text-body` |
| subheading | 20px | 1.5 | — | `--text-subheading` |
| heading-sm | 28px | 1.14 | -0.56px | `--text-heading-sm` |
| heading | 36px | 1.14 | -0.18px | `--text-heading` |
| heading-lg | 48px | 1.08 | -0.96px | `--text-heading-lg` |
| display | 56px | 1.16 | -0.28px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

**Spacing scale:** 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 56, 60, 64, 80, 120, 156 (px)

### Border Radius

| Element | Value |
|---------|-------|
| tags | 9999px |
| pills | 9999px |
| cards | 8px |
| inputs | 4px |
| buttons | 4px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| subtle | `rgb(38,38,38) -1px 0 0 0, rgb(38,38,38) 0 -1px 0 0` | `--shadow-subtle` |
| subtle-2 | `rgb(38,38,38) 2px 2px 0 0` | `--shadow-subtle-2` |
| subtle-3 | `rgb(255,255,255) 2px 2px 0 0` | `--shadow-subtle-3` |

### Layout

- **Page max-width:** 1200px in the reference; **this site runs 1440px** via the
  `--container-page` token (use `max-w-page`, never a literal)
- **Section gap:** 80px
- **Card padding:** 24px
- **Element gap:** 8px

## Components

### Lime Primary Button

The only filled chromatic button in the system. Background `#a3e635`, text `#262626`, 4px radius, 6px/14px padding, 1px solid `#262626` border, `2px 2px 0 0 #262626` hard offset on hover/active. Geist 16px weight 500. Used sparingly — typically once per view.

### Dark Block Button

Background `#303030`, text `#ffffff`, 0px radius, 24px padding, 1px solid `#ffffff` border, `2px 2px 0 0 #262626` offset. Geist 16–18px weight 500. Reads as a stamped block rather than a rounded pill.

### Outlined Secondary Button

Background `#ffffff`, text `#262626`, 4px radius, 8px/16px padding, 1px solid `#262626`. No shadow. Geist 16px weight 500. Pairs with a lime primary.

### Ghost Text Link

Transparent, text `#262626`, no radius, no padding, optional 1px underline on hover. Geist 16px weight 500 for nav, 400 for body links.

### Cream Stat Card

Background `#fcfff7`, 8px radius, 1px solid `#e5e5e5`, **no shadow**, 24–32px padding. Number at 48px weight 600 in ink; description at 18px weight 400 in `#525252`; source at 14px weight 400 in `#737373`.

### Status Pill Badge

Background `#dcfff1`, 1px solid `#7ee2b8`, 9999px radius, 6px/12px padding, 14px weight 500 ink text, small mint dot. The only place the mint pair appears.

### Pill Tag

Transparent, ink text, 9999px radius, 4–6px/10–12px padding, 1px solid `#262626`. Geist 12–14px weight 500, 0.08em uppercase tracking on labels.

### Top Navigation Bar

White, 67px tall, full width with a max-width inner container. Wordmark left, links centered in 16px weight 500 ink, `Sign in` text link plus the lime CTA right. No drop shadow, no bottom border — reads as a single line on paper.

### Feature Mockup Card

Product UI as a floating card: 8px radius, 1px solid `#262626`, `2px 2px 0 0 #262626` offset, 0 internal padding. Always paired with a text block on the opposite side of a 2-column layout.

### Testimonial Quote Section

Full-width cream band. Pull-quote at 36–48px weight 600 in ink with Fraunces italic emphasis, left two-thirds. Right column: 48px circular portrait, name 16px weight 500, role 14px weight 400 in `#737373`. No card container — the band is the surface.

## Do's and Don'ts

### Do

- Use lime exclusively for primary CTAs and the hero halo — never as a text color, icon fill, or decorative background.
- Pair every weight-600 headline with exactly one Fraunces italic emphasis word.
- Give buttons the `2px 2px 0 0 #262626` hard offset **at rest** and take it away as they are pressed — never blur-based drop shadows, and never spawn the offset on hover.
- Keep button radius at 4px (inline) or 0px (large blocks). Pills are tags and status only.
- Use cream as the only card/band surface above white.
- Set headings at 48–56px with negative tracking between -0.28px and -0.96px.
- Reserve uppercase 0.08em tracking for tiny labels and tabular meta.

### Don't

- Don't introduce a second chromatic accent beyond lime and mint.
- Don't use soft blurred drop-shadows — every shadow is a 2px solid ink offset, or it doesn't exist.
- Don't round buttons to 8px or more.
- Don't use Fraunces for body, buttons, or full headlines, and never upright.
- Don't use `#000000` for borders or large fills — ink `#262626` does all structural dark.
- Don't add gradients to body backgrounds or card surfaces. The lime hero halo is the only one.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Paper Canvas | `#ffffff` | Default page background and inverse text surface |
| 1 | Cream Sheet | `#fcfff7` | Cards, stat tiles, footer, warm bands — the only lift above paper |
| 2 | Depth Block | `#303030` | Dark button and large action block surface |
| 3 | Mint Pill | `#dcfff1` | Status indicator surface only |

## Imagery

Illustration and product UI, not photography. Product mockups appear as floating UI cards with thin ink borders and no device chrome. Customer logos sit in one monochrome "Trusted by" row. The reference runs a topographic contour-line watermark beneath sections; this site substitutes its own market footage in the hero frame, which is the one photographic surface. The lime halo is the only atmospheric color effect and appears only in the hero's upper-right quadrant.

## Layout

Max-width `max-w-page` centered with generous horizontal padding — one token, so
the nav, the full-bleed bands and the main column cannot drift apart. White nav (67px), then a hero split: headline one side, floating UI card the other, lime halo anchored right. Section rhythm alternates white and cream full-width bands at 80px gaps. Stat grids sit inside a cream strip. Feature sections pair a text block with a product mockup in two columns. No sidebar, no mega-menu.

## How this maps onto the codebase

The theme lives entirely in `app/globals.css`. Token *names* there are legacy —
they date from an earlier dark theme — so read them as slots, not literal
colors. Brainfish's own names (`--color-ink`, `--color-cream`,
`--color-lime-sprint`, …) are also registered; **prefer those in new code.**

| Legacy token | Brainfish role |
|-------|-------------|
| `--color-pitch`, `--color-obsidian` | Paper White `#ffffff` — page background |
| `--color-graphite` | Cream `#fcfff7` — card surface |
| `--color-bone` | Ink — primary text |
| `--color-ash-gray`, `--color-smoke` | Muted / Muted Gray — secondary and tertiary text |
| `--color-hairline` | Rule `#e5e5e5` |
| `--color-steel` | Ink — the structural border color |
| `--color-ember-orange` | Lime Sprint — **fills only**, never text or icons |
| `--color-molten-amber`, `--color-gold-leaf` | Ink — the slots that used to carry a data hue |
| `--color-success` | Mint Edge — status pill border |
| `bg-ember-flow` | flat lime (the CTA fill behind `.btn-ember`) |
| `bg-sunset-sweep`, `bg-molten-rise` | flat Depth `#303030` |
| `bg-hero-atmosphere` | the lime radial halo — the system's only gradient |
| `--shadow-card` | 1px Rule ring, no blur |
| `--shadow-card-hover`, `--shadow-glow` | `2px 2px 0 0` ink offset |
| `--shadow-xl-2` | ink offset **plus** a 1px ink ring — the Feature Mockup Card |

Two traps worth knowing:

- **`text-muted` is not Brainfish's Muted.** The shadcn layer owns `--muted` as
  a cream *surface*, so `text-muted` paints cream on white. Use
  `text-muted-ink` (`#525252`) or `text-muted-foreground` (`#737373`).
- **`.btn-ember` pins 4px radius from an unlayered rule**, so legacy
  `rounded-full` CTA call sites can't reintroduce a pill. Its label is ink, not
  white — white on lime fails contrast outright.

Radius in utilities: `rounded-lg` is the 4px button/input step, `rounded-xl`
and up are the 8px card step, `rounded-full` is tags and status pills.
