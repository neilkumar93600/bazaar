/** Run: `npx tsx lib/storefront/theme.test.ts`
 *
 *  ponytail: assert-based, no framework. parseTheme is a trust boundary — its
 *  input is a language model's JSON and its output lands in CSS on a page
 *  strangers load. Two things are worth guarding: nothing but a hex literal or
 *  a known enum value ever gets through, and a creator cannot prompt their own
 *  storefront into unreadable text.
 */

import assert from "node:assert/strict"

import {
  DEFAULT_THEME,
  contrastRatio,
  parseTheme,
  themeCss,
  themeVars,
  type StorefrontTheme,
} from "./theme"

// --- parseTheme: shape ----------------------------------------------------

assert.deepEqual(parseTheme(null), DEFAULT_THEME)
assert.deepEqual(parseTheme("#a3e635"), DEFAULT_THEME)
assert.deepEqual(parseTheme({}), DEFAULT_THEME)

const full = parseTheme({
  bg: "#101010",
  surface: "#1c1c1c",
  ink: "#f5f5f5",
  accent: "#ff4d6d",
  radius: "round",
  shadow: "soft",
  font: "mono",
  banner: "stripes",
  button: "outline",
  border: "bold",
})
assert.deepEqual(full, {
  bg: "#101010",
  surface: "#1c1c1c",
  ink: "#f5f5f5",
  accent: "#ff4d6d",
  radius: "round",
  shadow: "soft",
  font: "mono",
  banner: "stripes",
  button: "outline",
  border: "bold",
} satisfies StorefrontTheme)

// A theme that predates these two fields — or a model that forgets them —
// still renders: they fall back like every other field.
assert.equal(parseTheme({ bg: "#101010" }).button, "solid")
assert.equal(parseTheme({ border: "chunky" }).border, "hairline")

// Solid spends the accent as a fill and picks a readable label; outline keeps
// the surface and spends the accent on the rule and the text.
const solid = themeVars(parseTheme({ accent: "#c7522a", surface: "#f5ebde", button: "solid" })) as Record<string, string>
assert.equal(solid["--sf-btn-bg"], "#c7522a")
assert.equal(solid["--sf-btn-ink"], "#fafafa")
const outline = themeVars(parseTheme({ accent: "#c7522a", surface: "#f5ebde", button: "outline" })) as Record<string, string>
assert.equal(outline["--sf-btn-bg"], "#f5ebde")
assert.equal(outline["--sf-btn-ink"], "#c7522a")
assert.equal((themeVars(parseTheme({ border: "none" })) as Record<string, string>)["--sf-border"], "0px")
assert.equal((themeVars(parseTheme({ border: "bold" })) as Record<string, string>)["--sf-border"], "2px")

// Shorthand and casing are the two ways a model writes a colour it means.
assert.equal(parseTheme({ accent: "#FA0" }).accent, "#ffaa00")
assert.equal(parseTheme({ accent: " #A3E635 " }).accent, "#a3e635")

// --- parseTheme: injection ------------------------------------------------

// Anything that is not a hex literal falls back. These are the shapes that
// would otherwise end up inside a style attribute.
for (const hostile of [
  "red; background: url(https://evil.example/x.png)",
  "url(javascript:alert(1))",
  "var(--sf-ink); position: fixed",
  "expression(alert(1))",
  "#a3e635; }",
  "rgb(163, 230, 53)",
  "papayawhip",
  42,
  { toString: () => "#000000" },
]) {
  assert.equal(parseTheme({ accent: hostile }).accent, DEFAULT_THEME.accent)
}

// Same for the enums — an unknown value is house style, never the raw string.
assert.equal(parseTheme({ radius: "9999px" }).radius, DEFAULT_THEME.radius)
assert.equal(parseTheme({ shadow: "0 0 0 red" }).shadow, DEFAULT_THEME.shadow)
assert.equal(parseTheme({ font: "Comic Sans" }).font, DEFAULT_THEME.font)
assert.equal(parseTheme({ banner: "<script>" }).banner, DEFAULT_THEME.banner)

// --- parseTheme: legibility ----------------------------------------------

// Grey on grey: the ink the creator asked for cannot be read, so it is
// replaced rather than rendered.
const unreadable = parseTheme({ bg: "#808080", surface: "#8a8a8a", ink: "#7d7d7d" })
assert.notEqual(unreadable.ink, "#7d7d7d")
assert.ok(contrastRatio(unreadable.ink, unreadable.surface) >= 4.5)
assert.ok(contrastRatio(unreadable.ink, unreadable.bg) >= 4.5)

// A dark storefront keeps its light ink — legible ink is never overridden.
assert.equal(parseTheme({ bg: "#101010", surface: "#1c1c1c", ink: "#f5f5f5" }).ink, "#f5f5f5")

// Ink is judged against both the page and the cards, not just one: readable on
// the near-black page, invisible on the near-white cards.
const mixed = parseTheme({ bg: "#0a0a0a", surface: "#fafafa", ink: "#eeeeee" })
assert.ok(contrastRatio(mixed.ink, mixed.surface) >= 4.5)

// --- themeVars ------------------------------------------------------------

const darkVars = themeVars(parseTheme({ ink: "#111111", accent: "#a3e635" })) as Record<string, string>
// Text on the accent chip flips with the accent's own brightness.
assert.equal(darkVars["--sf-on-accent"], "#171717")
assert.equal(darkVars["--sf-on-ink"], "#fafafa")
assert.equal(
  (themeVars(parseTheme({ accent: "#3b0764" })) as Record<string, string>)["--sf-on-accent"],
  "#fafafa",
)

// Hard shadow is drawn in the theme's own ink, and "flat" really is none.
assert.equal(darkVars["--sf-shadow"], "2px 2px 0px 0px #111111")
assert.equal(
  (themeVars(parseTheme({ shadow: "flat" })) as Record<string, string>)["--sf-shadow"],
  "none",
)

// The banner is a gradient built from the accent, and only dots need tiling.
assert.match(darkVars["--sf-banner"], /^radial-gradient\(#a3e635 /)
assert.equal(darkVars["--sf-banner-size"], "18px 18px")
assert.equal(
  (themeVars(parseTheme({ banner: "solid" })) as Record<string, string>)["--sf-banner"],
  "none",
)

// The cover banner slab follows the page, not the ink: dark ink on a light
// page, the surface on a dark one, so it never turns pale under a dark theme.
assert.equal(darkVars["--sf-band"], "#111111")
const darkPage = themeVars(parseTheme({ bg: "#0b0a10", surface: "#171520", ink: "#f0edf7" })) as Record<string, string>
assert.equal(darkPage["--sf-band"], "#171520")
assert.equal(darkPage["--sf-on-band"], "#fafafa")

// Shared components (DesignCard) paint with the site's semantic tokens, so the
// theme rebinds those too — otherwise card titles stay near-black on a dark
// storefront.
assert.equal(darkPage["--foreground"], "#f0edf7")

// Controls track the panel radius instead of holding a fixed 4px: a square
// chip inside a 1.75rem panel was the tell that the theme had only reached
// half the page.
assert.equal((themeVars(parseTheme({ radius: "round" })) as Record<string, string>)["--sf-radius-sm"], "999px")
assert.equal((themeVars(parseTheme({ radius: "sharp" })) as Record<string, string>)["--sf-radius-sm"], "0px")

// …and they take a lighter shadow than the panels they sit in.
assert.equal(darkVars["--sf-shadow-sm"], "1px 1px 0px 0px #111111")
assert.equal(
  (themeVars(parseTheme({ shadow: "flat" })) as Record<string, string>)["--sf-shadow-sm"],
  "none",
)

// The :root rule is what reaches the navbar and footer. It carries the theme's
// own tokens, the shadcn tokens the shared components paint with, and the body
// typeface — but never a `--color-*`, which `@theme inline` has already baked
// into the utilities.
const css = themeCss(parseTheme({ bg: "#0b0a10", surface: "#171520", ink: "#f0edf7", font: "serif" }))
assert.match(css, /^:root\{/)
assert.ok(css.includes("--background:#0b0a10;"))
assert.ok(css.includes("--foreground:#f0edf7;"))
assert.ok(css.includes("--font-sans:var(--font-serif);"))
assert.ok(!css.includes("--color-"), "themeCss must not emit --color-* overrides")
// Nothing but hex, keywords and color-mix() reaches the stylesheet.
assert.ok(!/[<>]/.test(css), "themeCss must never emit markup characters")

// --- contrastRatio --------------------------------------------------------

assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21)
assert.equal(contrastRatio("#123456", "#123456"), 1)

console.log("lib/storefront/theme.test.ts ok")
