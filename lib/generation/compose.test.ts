/** Run: `npx tsx lib/generation/compose.test.ts`
 *
 *  ponytail: the network call isn't worth mocking, but the two things that
 *  guard against a model behaving badly are. A title is a headline — an
 *  unbounded one breaks every card, tab title and receipt it lands in — and a
 *  direction that mentions the background gets the subject cut away by the
 *  background remover, which costs a real generation.
 */

import assert from "node:assert/strict"

import {
  cleanTitle,
  composeListing,
  composePrompt,
  FALLBACK_DESCRIPTION,
  titleFromIdea,
} from "./compose.ts"
import { findStyle } from "./styles.ts"

// Seven words, hard ceiling.
assert.equal(
  cleanTitle("one two three four five six seven eight nine"),
  "one two three four five six seven"
)
assert.equal(cleanTitle("Moth of Cathedral Glass"), "Moth of Cathedral Glass")

// Models like to wrap titles in quotes and end them with a full stop.
assert.equal(cleanTitle('"Moth of Cathedral Glass."'), "Moth of Cathedral Glass")
assert.equal(cleanTitle("**Neon Ronin**"), "Neon Ronin")
assert.equal(cleanTitle("   spaced   out   words  "), "spaced out words")
assert.equal(cleanTitle(""), "")

// The fallback name is short too — it is the reason designs stopped being
// titled with their entire prompt.
const longIdea =
  "a moth with cathedral windows for wings, wings spread wide, symmetrical"
assert.equal(titleFromIdea(longIdea).split(" ").length <= 7, true)
assert.equal(titleFromIdea(""), "Untitled design")

// No MUAPI_API_KEY: the transport throws, askKimi swallows it, the template
// runs and the title comes from the idea. Generation is never blocked on a
// text model.
delete process.env.MUAPI_API_KEY

const style = findStyle("woodcut-flash") ?? null
assert.ok(style, "expected a known style preset to test against")

const listing = await composeListing({ idea: longIdea, style: style! })

assert.equal(listing.composed, false)
assert.equal(listing.title, titleFromIdea(longIdea))
assert.equal(listing.description, FALLBACK_DESCRIPTION)

const composition = await composePrompt({
  idea: longIdea,
  style: style!,
  text: null,
})

assert.equal(composition.composed, false)
assert.match(composition.prompt, /Subject: a moth with cathedral windows/)
// The invariants live in code, so they survive the model being absent.
assert.match(composition.prompt, /Backdrop: one flat solid pure (black|white) field/)
assert.match(composition.prompt, /Do not include/)

console.log("compose.test.ts ok")
