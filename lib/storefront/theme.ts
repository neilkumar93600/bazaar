/** Storefront theme tokens.
 *
 *  A creator describes their store in words; a model answers with this object;
 *  the public storefront renders it as CSS custom properties. The model never
 *  emits markup, class names, or CSS — only values from the schema below —
 *  because everything it returns crosses into a page other people load.
 *
 *  ponytail: colours + a few shape enums, not a layout engine. Cards
 *  (`DesignCard`) keep house styling; only the storefront chrome is themed.
 */

import type { CSSProperties } from "react"

export type StorefrontTheme = {
  /** Page behind the storefront. */
  bg: string
  /** Cards, header panel, tab bar. */
  surface: string
  /** Text, borders, hard shadows. */
  ink: string
  /** Active tab, badges, primary button. */
  accent: string
  radius: "sharp" | "soft" | "round"
  shadow: "hard" | "flat" | "soft"
  font: "sans" | "serif" | "mono"
  banner: "dots" | "solid" | "stripes"
  /** How the primary buttons, active tabs and status pills are filled:
   *  `solid` paints them in the accent, `outline` leaves them on the surface
   *  behind an accent rule. */
  button: "solid" | "outline"
  /** The weight of every rule on the page — card edges, panel edges, the line
   *  under the tab bar. */
  border: "hairline" | "bold" | "none"
}

/** The storefront exactly as it looks today — also the fallback for every
 *  field the model gets wrong, so a bad answer degrades to house style rather
 *  than to a broken page. */
export const DEFAULT_THEME: StorefrontTheme = {
  bg: "#ffffff",
  surface: "#fcfff7",
  ink: "#262626",
  accent: "#a3e635",
  radius: "soft",
  shadow: "hard",
  font: "sans",
  banner: "dots",
  button: "solid",
  border: "hairline",
}

/** Ceiling on the sentence a creator types. A theme is four colours and four
 *  enums — anything longer is an essay the model will ignore anyway. Lives
 *  here, not in theme-prompt.ts, so the settings form can enforce it without
 *  pulling a server-only module into the browser bundle. */
export const MAX_PROMPT_CHARS = 300

const RADIUS: Record<StorefrontTheme["radius"], string> = {
  sharp: "0px",
  soft: "0.75rem",
  round: "1.75rem",
}

/** Panels get RADIUS; the controls inside them get this. A tab pill carrying
 *  the panel's own 1.75rem looked like a lozenge in a bowl, and a 4px chip
 *  inside a round panel looked like a mistake — so the small radius tracks the
 *  large one instead of being fixed. */
const RADIUS_SM: Record<StorefrontTheme["radius"], string> = {
  sharp: "0px",
  soft: "0.5rem",
  round: "999px",
}

const FONT: Record<StorefrontTheme["font"], string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
}

/** WCAG AA for body text. Below this the storefront is unreadable, so the
 *  parser overrides the creator's ink rather than shipping it. */
const MIN_CONTRAST = 4.5

/** Near-black / near-white escape hatches when a chosen ink fails contrast. */
const DARK = "#171717"
const LIGHT = "#fafafa"

const HEX = /^#[0-9a-f]{6}$/

function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const raw = value.trim().toLowerCase()
  const hex = /^#[0-9a-f]{3}$/.test(raw)
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    : raw
  return HEX.test(hex) ? hex : fallback
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

export function contrastRatio(a: string, b: string): number {
  const light = Math.max(luminance(a), luminance(b))
  const dark = Math.min(luminance(a), luminance(b))
  return (light + 0.05) / (dark + 0.05)
}

/** The most legible of the candidates against every background it sits on. */
function bestAgainst(candidates: string[], backgrounds: string[]): string {
  let best = candidates[0]
  let bestScore = -1
  for (const candidate of candidates) {
    const score = Math.min(...backgrounds.map((bg) => contrastRatio(candidate, bg)))
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Turns anything — a model's JSON, a stale DB row, `null` — into a theme that
 *  is safe to render. Trust boundary: never widen this to pass strings
 *  through, they end up inside CSS on a public page. */
export function parseTheme(raw: unknown): StorefrontTheme {
  if (!raw || typeof raw !== "object") return DEFAULT_THEME
  const input = raw as Record<string, unknown>

  const bg = normalizeHex(input.bg, DEFAULT_THEME.bg)
  const surface = normalizeHex(input.surface, DEFAULT_THEME.surface)
  const accent = normalizeHex(input.accent, DEFAULT_THEME.accent)

  const wanted = normalizeHex(input.ink, DEFAULT_THEME.ink)
  // Ink carries every word on the storefront, over both the page and the
  // cards. A creator who asks for "grey on grey" gets legible text anyway.
  const inkOk = Math.min(contrastRatio(wanted, surface), contrastRatio(wanted, bg)) >= MIN_CONTRAST
  const ink = inkOk ? wanted : bestAgainst([DARK, LIGHT], [surface, bg])

  return {
    bg,
    surface,
    ink,
    accent,
    radius: pickEnum(input.radius, ["sharp", "soft", "round"] as const, DEFAULT_THEME.radius),
    shadow: pickEnum(input.shadow, ["hard", "flat", "soft"] as const, DEFAULT_THEME.shadow),
    font: pickEnum(input.font, ["sans", "serif", "mono"] as const, DEFAULT_THEME.font),
    banner: pickEnum(input.banner, ["dots", "solid", "stripes"] as const, DEFAULT_THEME.banner),
    button: pickEnum(input.button, ["solid", "outline"] as const, DEFAULT_THEME.button),
    border: pickEnum(input.border, ["hairline", "bold", "none"] as const, DEFAULT_THEME.border),
  }
}

function bannerImage(theme: StorefrontTheme): string {
  switch (theme.banner) {
    case "solid":
      return "none"
    case "stripes":
      return `repeating-linear-gradient(45deg, ${theme.accent} 0 6px, transparent 6px 20px)`
    default:
      return `radial-gradient(${theme.accent} 1.5px, transparent 1.5px)`
  }
}

/** The custom properties the storefront reads. Applied once, on the page
 *  wrapper, so every child picks them up through the cascade. */
export function themeVars(theme: StorefrontTheme): CSSProperties {
  const shadow = {
    hard: `2px 2px 0px 0px ${theme.ink}`,
    flat: "none",
    soft: "0 10px 30px -18px rgba(0,0,0,0.55)",
  }[theme.shadow]

  /** A panel's shadow on a button or a chip is too heavy — the soft one in
   *  particular smears under anything small. */
  const shadowSm = {
    hard: `1px 1px 0px 0px ${theme.ink}`,
    flat: "none",
    soft: "0 4px 12px -8px rgba(0,0,0,0.5)",
  }[theme.shadow]

  // The cover banner is a slab that has to read as a slab. On a light page
  // that is the ink; on a dark page the ink is near-white, and painting the
  // banner with it turned a "midnight arcade" storefront's masthead into a
  // pale lavender field. The surface is the dark page's slab.
  const band = luminance(theme.bg) > 0.5 ? theme.ink : theme.surface

  return {
    "--sf-bg": theme.bg,
    "--sf-surface": theme.surface,
    "--sf-ink": theme.ink,
    "--sf-accent": theme.accent,
    // Secondary text: ink softened towards the surface it sits on, so it stays
    // in the palette instead of being a fifth colour the model has to invent.
    "--sf-muted": `color-mix(in oklab, ${theme.ink} 65%, ${theme.surface})`,
    "--sf-on-ink": bestAgainst([LIGHT, DARK], [theme.ink]),
    "--sf-on-accent": bestAgainst([DARK, LIGHT], [theme.accent]),
    "--sf-band": band,
    "--sf-on-band": bestAgainst([LIGHT, DARK], [band]),
    // DesignCard and the other shared components paint with the site's own
    // semantic tokens. Rebinding those here — rather than editing every shared
    // component — is what keeps a card's title and meta line readable when the
    // page under them goes dark, and changes nothing off the storefront.
    "--foreground": theme.ink,
    "--muted-foreground": `color-mix(in oklab, ${theme.ink} 65%, ${theme.surface})`,
    // Buttons, active tabs and status pills. Outline keeps the accent as a
    // rule and a label instead of a fill — the difference between a shop that
    // shouts and one that whispers, and the one thing four colours could not
    // express on their own.
    "--sf-btn-bg": theme.button === "solid" ? theme.accent : theme.surface,
    "--sf-btn-ink": theme.button === "solid" ? bestAgainst([DARK, LIGHT], [theme.accent]) : theme.accent,
    "--sf-btn-line": theme.accent,
    "--sf-border": { hairline: "1px", bold: "2px", none: "0px" }[theme.border],
    "--sf-radius": RADIUS[theme.radius],
    "--sf-radius-sm": RADIUS_SM[theme.radius],
    "--sf-shadow": shadow,
    "--sf-shadow-sm": shadowSm,
    "--sf-font": FONT[theme.font],
    "--sf-line": `color-mix(in oklab, ${theme.ink} 22%, ${theme.bg})`,
    // The "live status" wash — house style spends its one mint moment on the
    // Claimed pill and the verified chip; a themed storefront spends its
    // accent there instead.
    "--sf-wash": `color-mix(in oklab, ${theme.accent} 22%, ${theme.surface})`,
    "--sf-banner": bannerImage(theme),
    "--sf-banner-size": theme.banner === "dots" ? "18px 18px" : "auto",
    fontFamily: "var(--sf-font)",
  } as CSSProperties
}

/** The same theme, written as a `:root` rule for a `<style>` tag.
 *
 *  `themeVars` styles one element, which is enough for the storefront body but
 *  cannot reach the navbar, the logo or the footer — those are rendered by the
 *  shared public layout, above the page in the tree. A rule at `:root` reaches
 *  them, and because it is emitted by this route's own markup it exists only
 *  while a storefront is on screen.
 *
 *  The second half rebinds the site's shadcn tokens. Chrome paints with
 *  `bg-background`, `text-foreground`, `bg-card`, `bg-pitch` and friends, so
 *  rebinding those is what makes it follow the creator's colours without
 *  touching a single shared component.
 *
 *  Safe to interpolate: every value here is either a hex literal or an enum
 *  keyword that `parseTheme` produced — a string from the model never reaches
 *  this function unvalidated.
 */
export function themeCss(theme: StorefrontTheme): string {
  const vars = themeVars(theme) as Record<string, string>
  const own = Object.entries(vars)
    .filter(([key]) => key.startsWith("--"))
    .map(([key, value]) => `${key}:${value};`)
    .join("")

  const chrome = [
    `--background:${vars["--sf-bg"]};`,
    `--foreground:${vars["--sf-ink"]};`,
    `--card:${vars["--sf-surface"]};`,
    `--card-foreground:${vars["--sf-ink"]};`,
    `--popover:${vars["--sf-surface"]};`,
    `--popover-foreground:${vars["--sf-ink"]};`,
    `--secondary:${vars["--sf-surface"]};`,
    `--secondary-foreground:${vars["--sf-ink"]};`,
    `--muted:${vars["--sf-surface"]};`,
    `--muted-foreground:${vars["--sf-muted"]};`,
    // Filled blocks and accent text. House style puts ink here, not lime, and
    // the theme keeps that reading: ink block, on-ink label.
    `--primary:${vars["--sf-ink"]};`,
    `--primary-foreground:${vars["--sf-on-ink"]};`,
    // shadcn's --accent is the quiet hover tint, not the brand colour.
    `--accent:${vars["--sf-line"]};`,
    `--accent-foreground:${vars["--sf-ink"]};`,
    `--border:${vars["--sf-line"]};`,
    `--input:${vars["--sf-surface"]};`,
    `--ring:${vars["--sf-ink"]};`,
    // No `--color-*` overrides here, and it is not an oversight: globals.css
    // declares that palette inside `@theme inline`, so Tailwind bakes the
    // literal into `.bg-mint-wash` and friends at build time and a runtime
    // override never lands. The call sites that use those utilities on a
    // storefront read `var(--sf-…, <house token>)` directly instead — see
    // DesignCard's Claimed pill and Navbar's link greys.
    //
    // Shadows and the glass rim are plain custom properties, so they do work.
    `--shadow-card:${vars["--sf-shadow"]};`,
    `--shadow-card-hover:${vars["--sf-shadow"]};`,
    `--shadow-glow:${vars["--sf-shadow"]};`,
    `--shadow-xl-2:${vars["--sf-shadow"]};`,
    `--shadow-storefront-card:${vars["--sf-shadow"]};`,
    `--shadow-storefront-card-hover:${vars["--sf-shadow"]};`,
    `--glass-rim:${vars["--sf-line"]};`,
  ].join("")

  // `--font-sans` is the body voice: rebinding it is what carries the theme's
  // typeface into every shared component's `font-sans`, headings included.
  // `--font-mono` is left alone — the mono labels ("1-OF-1 BROADSHEET
  // CATALOGUE", prices, handles) are structural, not decorative.
  const font = `--font-sans:${vars["--sf-font"]};`

  return `:root{${own}${chrome}${font}}body{background:${vars["--sf-bg"]};font-family:${vars["--sf-font"]};}`
}
