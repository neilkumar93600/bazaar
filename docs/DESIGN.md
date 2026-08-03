# Shirt Bazaar — Style Reference

> molten orange on obsidian

**Theme:** dark only — there is no light mode. `:root` **is** the dark theme. Never author a `.light` block, never add `dark:` variants, never write a `prefers-color-scheme: light` branch.

Shirt Bazaar is a dark, cinematic marketplace canvas. Surfaces are near-black obsidian with barely-there lifts; the only chroma in the system is orange, and it arrives almost entirely as a **gradient** — ember → amber → gold — used for the one primary action, for category tags, and for ambient glow washes behind hero and section headers. Type is paired: a tall italic serif display face carries the hero and the big section headlines, while Inter handles everything else at near-tight tracking (-0.01em to -0.02em). Elevation is done with light, not shadow: cards separate from the canvas by a 1px white-alpha hairline plus a soft orange-tinted glow, because black-on-black drop shadows are invisible. Density is comfortable — 1400px max width, 80-120px section gaps, 16-24px card padding inside 12-20px radii.

## Implementation Rules

These are not stylistic preferences. Code review rejects violations.

1. **No inline styles.** No `style={{ ... }}` in TSX, no `<style>` tags in components. Everything is a Tailwind utility or a class defined in `app/globals.css`. The only exception is a value that is genuinely runtime-computed and unbounded (e.g. a progress-bar width driven by state) — those go through a CSS custom property set in `globals.css`, not a literal declaration block.
2. **Tailwind first, `globals.css` second.** Reach for a utility. If the thing needs a keyframe, a multi-layer gradient, a filter stack, or a pseudo-element, define one class in `app/globals.css` under `@layer components` and apply it by name.
3. **Tokens, not literals.** Use `bg-background`, `text-foreground`, `border-border`, `bg-surface-1`, `text-ember-orange`. Do not write `bg-white`, `text-zinc-900`, `bg-[#0C0C0C]`, or any raw hex in a component. Arbitrary values are for geometry (`h-[46px]`, `tracking-[-0.4px]`), never for color.
4. **Dark only.** No `dark:` prefixes anywhere — they are dead code in a single-theme app.
5. **Hero typography is frozen.** `components/home/Hero.tsx` keeps its exact font classes: `italic font-serif font-medium` on the `h1`, and its existing size/leading/tracking ramp. Color and background on the hero may change; the font stack, weight, style, and tracking may not. That same `font-serif italic` display treatment is available — and encouraged — for other section headlines.

## Tokens — Colors

| Name          | Value                                                                                        | Token                     | Role                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Obsidian      | `#0a0a0b`                                                                                    | `--color-obsidian`        | Page canvas — the near-black everything sits on                                                   |
| Pitch         | `#050506`                                                                                    | `--color-pitch`           | Deepest well: footer, hero video underlay, modal scrim base                                       |
| Graphite      | `#121214`                                                                                    | `--color-graphite`        | Surface 1 — default card and panel fill, one step off the canvas                                  |
| Slate Ink     | `#18181b`                                                                                    | `--color-slate-ink`       | Surface 2 — nested panels, inputs, popovers, hovered rows                                         |
| Gunmetal      | `#1f1f23`                                                                                    | `--color-gunmetal`        | Surface 3 — accent panels, selected states, table stripes                                         |
| Hairline      | `#26262b`                                                                                    | `--color-hairline`        | Default border — the 1px separation that replaces drop shadow in a dark system                    |
| Steel         | `#35353c`                                                                                    | `--color-steel`           | Strong border, input outline, divider that must be visible                                        |
| Bone          | `#fafafa`                                                                                    | `--color-bone`            | Primary text — headings and body. Never pure `#ffffff`; it glares on black                        |
| Ash Gray      | `#a1a1aa`                                                                                    | `--color-ash-gray`        | Secondary text, descriptions, metadata                                                            |
| Smoke         | `#71717a`                                                                                    | `--color-smoke`           | Muted text, placeholders, disabled labels                                                         |
| Ember Orange  | `#ff6a1f`                                                                                    | `--color-ember-orange`    | The primary action color and brand anchor — one per screen                                        |
| Molten Amber  | `#ffa832`                                                                                    | `--color-molten-amber`    | Gradient mid-stop, hover lift, active nav underline                                               |
| Deep Ember    | `#e0400d`                                                                                    | `--color-deep-ember`      | Gradient dark stop, pressed state, focus ring on orange fills                                     |
| Gold Leaf     | `#ffc861`                                                                                    | `--color-gold-leaf`       | Gradient light stop, rarity/1-of-1 accents, small highlight text                                  |
| Success       | `#3fbf7f`                                                                                    | `--color-success`         | Claimed / in-stock / paid — the one non-orange chroma allowed, status only                        |
| Danger        | `#f0453a`                                                                                    | `--color-danger`          | Destructive actions and errors, status only                                                       |

### Gradients

Orange is deployed as a gradient far more often than as a flat fill. Five gradient swatches, all in the orange family — the palette is monochromatic on purpose.

| Name              | Value                                                                                                              | Token                        | Role                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------- |
| Ember Flow        | `linear-gradient(100deg, #ff4d0f 0%, #ff6a1f 45%, #ffa832 100%)`                                                   | `--gradient-ember-flow`      | **The** primary gradient — CTA fills, active pills, brand marks             |
| Molten Rise       | `linear-gradient(180deg, #ffa832 0%, #ff6a1f 55%, #e0400d 100%)`                                                   | `--gradient-molten-rise`     | Vertical variant for tall elements: sidebars, rails, progress bars          |
| Sunset Sweep      | `linear-gradient(43deg, #e0400d 20%, #ff6a1f 60%, #ffc861 100%)`                                                   | `--gradient-sunset-sweep`    | Category tags, badges, decorative chips                                     |
| Forge Glow        | `radial-gradient(120% 120% at 25% 15%, #ffa832 0%, #ff6a1f 45%, #e0400d 100%)`                                     | `--gradient-forge-glow`      | Feature card swatches, avatar rings, icon tiles                             |
| Ash Ember         | `linear-gradient(180deg, #1f1f23 0%, #121214 100%)`                                                                | `--gradient-ash-ember`       | Neutral surface gradient for large panels that need depth without chroma    |
| Hero Atmosphere   | `radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,106,31,0.22) 0%, rgba(224,64,13,0.10) 40%, transparent 72%)`  | `--gradient-hero-atmosphere` | Ambient orange bloom behind the hero and major section heads                |
| Section Fade      | `linear-gradient(180deg, #050506 0%, #0a0a0b 100%)`                                                                | `--gradient-section-fade`    | Bridges the hero into the feed so the seam never pops                       |

Gradient text (`bg-clip-text text-transparent` over Ember Flow) is allowed on **one** phrase per page — typically two or three words inside a section headline. More than that and it stops reading as emphasis.

## Tokens — Typography

Two families. No new webfonts are loaded for the theme change.

### Display Serif — hero and major section headlines · `--font-display`

- **Stack:** `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif` — i.e. Tailwind's `font-serif`, always set `italic`
- **Weights:** 500
- **Sizes:** 44px → 88px on the hero ramp; 32-48px for section heads
- **Line height:** 1.02 display, 1.1 section
- **Letter spacing:** -1.5px at 44px, -3px at 56px, -5px at 88px; -0.64px at 32px
- **Role:** The hero `h1` uses this and must not be changed. Reuse it — `font-serif italic` — on section headlines that need the same editorial weight. Never on body copy, buttons, labels, or anything under 24px.

### Inter — everything else · `--font-sans`

- **Loaded in** `app/layout.tsx` via `next/font/google` at weights 300, 400, 500, 700
- **Sizes:** 12px, 14px, 15px, 16px, 18px, 20px, 24px
- **Line height:** 1.2 for UI, 1.5 for prose
- **Letter spacing:** -0.01em throughout; 0.14em only on small all-caps labels
- **Role:** Body, buttons, inputs, nav, cards, tables, forms. 300 for long-form paragraphs, 400 for compact UI, 500 for chrome, 700 for numeric stat displays.

### Geist Mono · `--font-mono`

- **Role:** Prompt text, design IDs, token hashes, price ticks. Never for prose.

### Type Scale

| Role       | Size | Line Height | Letter Spacing | Token               |
| ---------- | ---- | ----------- | -------------- | ------------------- |
| caption    | 12px | 1.2         | -0.12px        | `--text-caption`    |
| body-sm    | 14px | 1.5         | -0.14px        | `--text-body-sm`    |
| body       | 16px | 1.5         | -0.16px        | `--text-body`       |
| subheading | 20px | 1.2         | -0.2px         | `--text-subheading` |
| heading-sm | 24px | 1.2         | -0.24px        | `--text-heading-sm` |
| heading    | 32px | 1.1         | -0.64px        | `--text-heading`    |
| heading-lg | 40px | 1.1         | -0.52px        | `--text-heading-lg` |
| display    | 48px | 1.1         | -0.96px        | `--text-display`    |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

### Spacing Scale

| Name | Value | Token           |
| ---- | ----- | --------------- |
| 4    | 4px   | `--spacing-4`   |
| 8    | 8px   | `--spacing-8`   |
| 12   | 12px  | `--spacing-12`  |
| 16   | 16px  | `--spacing-16`  |
| 20   | 20px  | `--spacing-20`  |
| 24   | 24px  | `--spacing-24`  |
| 32   | 32px  | `--spacing-32`  |
| 48   | 48px  | `--spacing-48`  |
| 60   | 60px  | `--spacing-60`  |
| 64   | 64px  | `--spacing-64`  |
| 80   | 80px  | `--spacing-80`  |
| 124  | 124px | `--spacing-124` |

### Border Radius

| Element      | Value   |
| ------------ | ------- |
| tags         | 9999px  |
| buttons      | 9999px  |
| inputs       | 12px    |
| cards        | 16px    |
| images       | 16-20px |
| featureCards | 20px    |
| sheets       | 24px    |

### Elevation

Dark UI cannot use drop shadow for separation — a black shadow on a black canvas is nothing. Depth comes from a **hairline border + inner top highlight + an orange-tinted outer glow**.

| Name       | Value                                                                                                             | Token                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | --------------------- |
| hairline   | `inset 0 1px 0 0 rgba(255,255,255,0.05)`                                                                          | `--shadow-hairline`   |
| card       | `inset 0 1px 0 0 rgba(255,255,255,0.05), 0 8px 32px -12px rgba(0,0,0,0.9)`                                        | `--shadow-card`       |
| card-hover | `inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,106,31,0.28), 0 12px 40px -12px rgba(255,106,31,0.22)` | `--shadow-card-hover` |
| button     | `inset 0 1px 0 0 rgba(255,255,255,0.18), 0 6px 20px -8px rgba(255,106,31,0.55)`                                    | `--shadow-button`     |
| glow       | `0 0 48px -8px rgba(255,106,31,0.35)`                                                                             | `--shadow-glow`       |

### Layout

- **Page max-width:** 1400px (1200px for prose/legal)
- **Section gap:** 80-120px
- **Card padding:** 16-24px
- **Element gap:** 8-12px

## Surfaces

| Level | Name      | Value     | Purpose                                                                          |
| ----- | --------- | --------- | ---------------------------------------------------------------------------------- |
| -1    | Pitch     | `#050506` | Footer, hero underlay, scrim — the well below the canvas                          |
| 0     | Canvas    | `#0a0a0b` | Base page background, plus the fixed ambient ember field                          |
| 1     | Graphite  | `rgba(18,18,20,0.62)` | Surface 1 — `--card`. Translucent by default; every card is a glass pane |
| 2     | Slate Ink | `rgba(22,22,26,0.74)` | Surface 2 — `--popover`. Dialogs, sheets, dropdowns, popovers            |
| 3     | Gunmetal  | `#1f1f23` | Accent panels, selected states — opaque, it sits *on* glass, not beside it        |
| Glass | Frost     | `rgba(255,255,255,0.07)` + `backdrop-blur` | Chrome over imagery: navbar pill, hero controls  |

### Liquid glass

Glass is the surface language, not a one-off effect. Two rules make it work:

1. **The tokens carry the translucency.** `--card` and `--popover` are already
   `rgba(...)`, so a `bg-card` or `bg-popover` utility *is* a glass fill. Never
   re-declare an opaque background to "fix" a pane.
2. **`.glass-surface` adds the optics, never the colour** — blur, saturation, the
   1px rim ring, the inner top highlight, the drop. Pair it with the background
   utility: `bg-card glass-surface`. It sets no `background`, so the two never
   fight over specificity. Add `.glass-surface-interactive` for the ember hover
   ring (it also responds to a `group/card` hover).

Glass over a flat black canvas refracts nothing and reads as flat gray, so `body`
paints a fixed three-stop ember field behind everything. That field is what the
panes bend — it is why the system reads as glass rather than as translucency.

Tune the whole language from `--glass-blur`, `--glass-saturate`, `--glass-rim`
and `--glass-highlight`. `prefers-reduced-transparency: reduce` solidifies the
tokens and drops every blur and the ambient field at once — do not defeat it.

Do **not** hand-write a `-webkit-backdrop-filter` pair: Lightning CSS merges the
two declarations, keeps the last, and silently drops the standard property. It
adds the prefix itself.

## Components

### Primary Gradient Button

**Role:** The single main call-to-action per screen

Ember Flow gradient fill, `#0a0a0b` text (dark text on orange beats white for contrast), `9999px` radius, `12px 24px` padding, Inter 500 at 16px, tracking -0.4px. `--shadow-button` gives it an inner top highlight and a warm outer bloom. On hover the gradient shifts one stop warmer and the bloom widens. Class: `.btn-ember` in `globals.css`.

### Ghost Glass Button

**Role:** Secondary action paired with the primary

`rgba(255,255,255,0.06)` fill, `backdrop-blur-md`, 1px `rgba(255,255,255,0.12)` border, `text-foreground`, `9999px` radius, same padding as primary. No gradient — it must lose against the CTA.

### Navigation Bar

**Role:** Top site navigation

Over the hero: chromeless, transparent, `text-foreground` links, an inner pill at `rgba(255,255,255,0.06)` with blur. Past the hero: collapses to a floating pill — `bg-background/80`, `border-border/60`, `backdrop-blur-xl`, 9999px radius. Logo left, center link pill, right-side actions with one Ember Flow "Get Started" button. Active link gets a Molten Amber underline, not a color swap.

### Design Card

**Role:** The feed's atomic unit

Graphite surface, 16px radius, `border-border`, `--shadow-card`. Image fills the top with a 16px radius and a `from-pitch/80` bottom scrim so overlaid text stays legible on any artwork. Body has the design title in Inter 500 at 16px, creator handle in `text-muted-foreground` 14px, and a price in Geist Mono. Hover swaps to `--shadow-card-hover` — the orange ring is the entire hover affordance.

### Category / Vibe Tag

**Role:** Small functional labels

Pill, `9999px`, 4-6px vertical / 10-12px horizontal padding, Inter 500 at 12px. Two variants only: **gradient** (Sunset Sweep fill, `#0a0a0b` text) for category and rarity, and **ghost** (`bg-white/[0.06]`, `text-muted-foreground`, hairline border) for everything else.

### Section Header

**Role:** Introduces every band below the hero

`font-serif italic` at 32-40px in `text-foreground`, optionally with two or three words wrapped in the Ember Flow gradient-text treatment. A `text-muted-foreground` 16px sub-line underneath. Left-aligned in content bands, centered in full-bleed bands.

### Hero

**Role:** Front door

Full-bleed background video on a Pitch underlay with a `bg-pitch/55` wash plus the Hero Atmosphere orange bloom above it — enough darkening that Bone text clears contrast on every frame. Headline in the frozen `italic font-serif font-medium` treatment. Eyebrow and sub-line in `text-foreground/75`. Two buttons: Ember Flow primary, glass secondary. Proof line at the bottom in `text-foreground/70`.

### Input / Search Field

**Role:** Forms and the search popover

Slate Ink fill, 12px radius, 1px `border-border`, `text-foreground`, placeholder `text-muted-foreground`, 12px 16px padding. Focus ring is Ember Orange at 40% — never a solid orange border.

### Footer

**Role:** Site foot

Pitch background, hairline top border, four link columns in `text-muted-foreground` 14px with `hover:text-foreground`, newsletter input in the standard field treatment with an Ember Flow submit. Any background image sits under a `bg-pitch/85` wash.

## Do's and Don'ts

### Do

- Use the Ember Flow gradient for exactly one primary action per screen
- Put **dark** text (`#0a0a0b`) on orange fills — white on orange fails contrast at body sizes
- Separate surfaces with a hairline border plus an orange-tinted glow, not a black drop shadow
- Keep `font-serif italic` for the hero and reuse it on section headlines
- Keep body copy in Inter at 16px / 1.5, tracking -0.01em
- Step surfaces in order — Canvas → Graphite → Slate Ink → Gunmetal — never skip a level to fake depth
- Reach for `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border` before any named color

### Don't

- Do not add a light theme, a `dark:` variant, or a theme toggle — the app is dark-only
- Do not write `style={{ ... }}` or a `<style>` tag in a component
- Do not use raw hex or `bg-white` / `text-zinc-*` / `bg-black` in a component; those are token bypasses
- Do not use pure `#ffffff` for text — it glares; Bone `#fafafa` is the ceiling
- Do not introduce a second chroma family. Green and red exist for status only; purple, blue, magenta are gone
- Do not scatter the orange gradient across decorative elements — it marks actions and categories, nothing else
- Do not change the hero's font family, style, weight, or tracking
- Do not use sharp 0px radii on cards or images

## Imagery

Photography and product renders sit on Pitch with a 16-20px radius and always carry a bottom scrim (`bg-gradient-to-t from-pitch/80`) when text overlays them. Brand logos in the proof band render at 60% opacity in `text-muted-foreground` and lift to full on hover. Icons are Lucide at 1.5px stroke in `text-muted-foreground`, or `#0a0a0b` when sitting on an orange gradient tile. The generated shirt artwork is the only place saturated non-orange color appears — it is content, not chrome, and the surrounding UI must stay neutral so it reads.

## Layout

Max-width 1400px, centered. The hero is full-bleed video into a Section Fade band that bridges into the feed. Below it, bands alternate Canvas and Graphite with 80-120px gaps. The feed is a multi-column marquee of design cards; feature sections use a 3-column card grid; platform sections use 2-column text-plus-visual. Navigation is a compact horizontal bar — no sidebar on public routes, no mega-menu. The dashboard is the one exception: a Graphite sidebar rail against a Canvas content area.

## Quick Start

Both blocks live in `app/globals.css`. `@theme` generates the Tailwind utilities; `:root` holds the shadcn semantic layer. There is no second theme block.

### Tailwind v4 — `@theme`

```css
@theme {
  /* Neutrals */
  --color-obsidian: #0a0a0b;
  --color-pitch: #050506;
  --color-graphite: #121214;
  --color-slate-ink: #18181b;
  --color-gunmetal: #1f1f23;
  --color-hairline: #26262b;
  --color-steel: #35353c;
  --color-bone: #fafafa;
  --color-ash-gray: #a1a1aa;
  --color-smoke: #71717a;

  /* Orange */
  --color-ember-orange: #ff6a1f;
  --color-molten-amber: #ffa832;
  --color-deep-ember: #e0400d;
  --color-gold-leaf: #ffc861;

  /* Status */
  --color-success: #3fbf7f;
  --color-danger: #f0453a;

  /* Gradients (Tailwind exposes these as bg-* utilities) */
  --background-image-ember-flow: linear-gradient(100deg, #ff4d0f 0%, #ff6a1f 45%, #ffa832 100%);
  --background-image-molten-rise: linear-gradient(180deg, #ffa832 0%, #ff6a1f 55%, #e0400d 100%);
  --background-image-sunset-sweep: linear-gradient(43deg, #e0400d 20%, #ff6a1f 60%, #ffc861 100%);
  --background-image-forge-glow: radial-gradient(120% 120% at 25% 15%, #ffa832 0%, #ff6a1f 45%, #e0400d 100%);
  --background-image-ash-ember: linear-gradient(180deg, #1f1f23 0%, #121214 100%);
  --background-image-hero-atmosphere: radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255, 106, 31, 0.22) 0%, rgba(224, 64, 13, 0.1) 40%, transparent 72%);
  --background-image-section-fade: linear-gradient(180deg, #050506 0%, #0a0a0b 100%);

  /* Fonts */
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
  --font-display: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
```

### shadcn semantic layer — `:root`

```css
:root {
  --background: #0a0a0b;
  --foreground: #fafafa;
  --card: #121214;
  --card-foreground: #fafafa;
  --popover: #18181b;
  --popover-foreground: #fafafa;
  --primary: #ff6a1f;
  --primary-foreground: #0a0a0b;
  --secondary: #18181b;
  --secondary-foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --accent: #1f1f23;
  --accent-foreground: #fafafa;
  --destructive: #f0453a;
  --destructive-foreground: #fafafa;
  --border: #26262b;
  --input: #35353c;
  --ring: #ff6a1f;
  --radius: 0.75rem;
}
```

## Agent Prompt Guide

Quick reference when generating a component:

- **canvas:** `bg-background` (#0a0a0b) · **card:** `bg-card` (#121214) · **nested:** `bg-secondary` (#18181b)
- **text:** `text-foreground` (#fafafa) · **secondary:** `text-muted-foreground` (#a1a1aa)
- **border:** `border-border` (#26262b) · **strong:** `border-input` (#35353c)
- **primary action:** `bg-ember-flow text-background` — gradient fill, dark text, one per screen
- **display type:** `font-serif italic` · **everything else:** `font-sans`
- **never:** inline styles, `dark:` variants, raw hex, `bg-white`, `text-zinc-*`

**Example — design card:** Graphite card, `rounded-2xl border border-border bg-card shadow-card`. Image top with `rounded-t-2xl` and a `bg-gradient-to-t from-pitch/80` scrim. Title `text-base font-medium text-foreground`, handle `text-sm text-muted-foreground`, price `font-mono text-sm text-gold-leaf`. Hover: `hover:shadow-card-hover`.

**Example — section header:** `font-serif italic text-[40px] leading-[1.1] tracking-[-0.52px] text-foreground`, with the key phrase in `bg-ember-flow bg-clip-text text-transparent`. Sub-line `mt-3 text-base text-muted-foreground`.

**Example — category tag:** `inline-flex rounded-full bg-sunset-sweep px-3 py-1 text-xs font-medium text-background`.

## Similar Brands

- **Linear (dark)** — near-black canvas, hairline separation, tight-tracked headlines, a single accent
- **Vercel** — monochrome system, one bold action color, product UI over illustration
- **Arc** — gradient-as-brand, warm chroma against deep neutral, glass chrome over media
- **Stripe Sessions** — editorial serif display against a technical sans, gradient used as emphasis rather than decoration
