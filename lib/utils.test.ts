/** Run: `npx tsx lib/utils.test.ts`
 *
 *  ponytail: assert-based, no framework. Only `designLabel` is covered — it
 *  decides what every card, <title> and dialog heading says, and its whole
 *  reason to exist is that falling back to `vibeName` made those identical
 *  across every design in a vibe.
 */

import assert from "node:assert/strict"

import { designLabel } from "./utils.ts"

// Priority: printed words, then the maker's prompt, then the category.
assert.equal(
  designLabel({ title: "PROMETHEUS", prompt: "a titan", vibeName: "Riot" }),
  "PROMETHEUS"
)
assert.equal(designLabel({ prompt: "a titan", vibeName: "Riot" }), "a titan")
assert.equal(designLabel({ vibeName: "Riot" }), "Riot")
assert.equal(designLabel({}), "Untitled design")

// Blank and whitespace-only fields fall through rather than rendering empty.
assert.equal(designLabel({ title: "", prompt: "a titan" }), "a titan")
assert.equal(designLabel({ title: "   ", prompt: "a titan" }), "a titan")
assert.equal(designLabel({ title: null, prompt: null, vibeName: null }), "Untitled design")

// Surrounding whitespace never reaches the page.
assert.equal(designLabel({ prompt: "  a titan  " }), "a titan")

// Under the limit is returned untouched — no stray ellipsis.
assert.equal(designLabel({ prompt: "a titan" }, 40), "a titan")
assert.equal(designLabel({ prompt: "x".repeat(40) }, 40), "x".repeat(40))

// Over the limit clips on a word boundary and never exceeds the limit.
const long = "a lighthouse keeper carrying the light down a spiral stair"
const clipped = designLabel({ prompt: long }, 30)
assert.ok(clipped.length <= 30, `got ${clipped.length}: ${clipped}`)
assert.ok(clipped.endsWith("…"))
assert.ok(!clipped.includes("  "))
// Word boundary: the clip must not land mid-word.
assert.ok(long.startsWith(clipped.slice(0, -1)))
assert.ok(!clipped.slice(0, -1).endsWith(" "))

// A single word longer than the limit has no boundary to use — still clipped,
// still within budget, rather than overflowing the <title>.
const oneWord = designLabel({ prompt: "x".repeat(100) }, 20)
assert.ok(oneWord.length <= 20)
assert.ok(oneWord.endsWith("…"))

console.log("utils.test.ts: all assertions passed")
