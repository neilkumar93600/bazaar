/** Run: `npx tsx lib/generation/styles.test.ts`
 *
 *  ponytail: assert-based, no framework. Two invariants here are the kind that
 *  fail silently in production — a preset keyed against a colour it paints
 *  with returns an empty PNG, and a typo'd vibe slug files designs into a
 *  column that does not exist. Both are mechanical, so they are checked across
 *  all 24 presets in a loop rather than eyeballed.
 */

import assert from "node:assert/strict"

import {
  STYLE_PRESETS,
  findStyle,
  stylesForVibeSlug,
  validateStyleText,
  MAX_TEXT_WORDS,
  MAX_TEXT_CHARS,
} from "./styles"

// The six vibes that exist. A preset naming anything else files its designs
// into a feed column nobody can see.
const VIBE_SLUGS = new Set([
  "dusk-atelier",
  "late-bloomer",
  "riot",
  "insatiable",
  "untamed-worldwide",
  "compound",
])

// Words that mean "this is essentially the background colour".
const READS_AS = {
  black: /black|charcoal|\bink\b|onyx/i,
  white: /white|bone|ivory|cream|paper/i,
}

assert.ok(STYLE_PRESETS.length >= 20, "the form promises 20+ styles")

{
  const slugs = STYLE_PRESETS.map((s) => s.slug)
  assert.equal(new Set(slugs).size, slugs.length, "slugs must be unique")
}

for (const preset of STYLE_PRESETS) {
  assert.ok(VIBE_SLUGS.has(preset.vibeSlug), `${preset.slug}: unknown vibe ${preset.vibeSlug}`)
  assert.ok(preset.palette.length > 0, `${preset.slug}: empty palette`)

  // The empty-PNG bug: artwork painted in the same colour as the field it is
  // keyed against gets cut away by the background remover.
  const collides = preset.palette.filter((colour) =>
    READS_AS[preset.cutField].test(colour),
  )
  assert.equal(
    collides.length,
    0,
    `${preset.slug}: cutField "${preset.cutField}" collides with palette ${collides.join(", ")}`,
  )
}

// Both families exist and are non-trivial.
assert.ok(STYLE_PRESETS.some((s) => s.family === "pictorial"))
assert.ok(
  STYLE_PRESETS.filter((s) => s.family === "typographic").length >= 4,
  "typographic needs enough variety to be a real choice",
)

assert.equal(findStyle("woodcut-flash")?.family, "pictorial")
assert.equal(findStyle("not-a-style"), null)
assert.ok(stylesForVibeSlug("riot").length > 0)
assert.equal(stylesForVibeSlug("nope").length, 0)

// --- validateStyleText ----------------------------------------------------

const pictorial = findStyle("woodcut-flash")!
const typographic = STYLE_PRESETS.find((s) => s.family === "typographic")!

// Pictorial takes no text at all.
assert.deepEqual(validateStyleText(pictorial, ""), { ok: true, text: null })
assert.deepEqual(validateStyleText(pictorial, "   "), { ok: true, text: null })
// Supplied anyway: rejected, not silently dropped. Losing something the maker
// typed is worse than telling them it has nowhere to go.
assert.equal(validateStyleText(pictorial, "hello there").ok, false)

// Typographic requires text.
assert.equal(validateStyleText(typographic, "").ok, false)
assert.equal(validateStyleText(typographic, "   ").ok, false)
assert.deepEqual(validateStyleText(typographic, "  stay weird  "), {
  ok: true,
  text: "stay weird",
})

{
  const sevenWords = "one two three four five six seven"
  assert.equal(sevenWords.split(/\s+/).length, MAX_TEXT_WORDS)
  assert.equal(validateStyleText(typographic, sevenWords).ok, true)
  assert.equal(validateStyleText(typographic, sevenWords + " eight").ok, false)
}

{
  const atLimit = "x".repeat(MAX_TEXT_CHARS)
  assert.equal(validateStyleText(typographic, atLimit).ok, true)
  assert.equal(validateStyleText(typographic, "x".repeat(MAX_TEXT_CHARS + 1)).ok, false)
}

console.log("styles.test.ts: all assertions passed")
