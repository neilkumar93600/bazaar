/** Run: `npx tsx lib/hero-draft.test.ts`
 *
 *  ponytail: assert-based, no framework. The round trip is the whole point —
 *  if it breaks, a signed-out visitor retypes their prompt after logging in and
 *  nothing errors to tell us. The garbage cases matter because the value is
 *  hand-editable in devtools and it feeds a form on a paid endpoint's page.
 */

import assert from "node:assert/strict"

// node has no sessionStorage. A Map-backed stand-in is enough: the module only
// uses getItem/setItem/removeItem.
const store = new Map<string, string>()
;(globalThis as { sessionStorage?: unknown }).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

const { stashHeroDraft, readHeroDraft, clearHeroDraft } = await import("./hero-draft")

// Nothing stashed yet.
assert.equal(readHeroDraft(), null, "empty storage must read as null")

// Round trip.
{
  stashHeroDraft({ prompt: "a neon koi swimming through static", vibeId: "vibe-1" })
  const draft = readHeroDraft()
  assert.deepEqual(draft, {
    prompt: "a neon koi swimming through static",
    vibeId: "vibe-1",
  })
}

// A missing vibe is a real state — the API accepts a null vibeId.
{
  stashHeroDraft({ prompt: "quiet storm", vibeId: null })
  assert.deepEqual(readHeroDraft(), { prompt: "quiet storm", vibeId: null })
}

// Clearing means the create form won't re-prefill on a later visit.
{
  clearHeroDraft()
  assert.equal(readHeroDraft(), null, "cleared storage must read as null")
}

// Hand-edited junk degrades to null rather than throwing into the form.
for (const junk of ["not json", "null", "[]", '{"prompt":42}', '{"prompt":"   "}']) {
  store.set("bazaar:hero-draft", junk)
  assert.equal(readHeroDraft(), null, `must reject ${junk}`)
}

// A bad vibeId type is dropped, not passed through — the route rejects unknown ids.
{
  store.set("bazaar:hero-draft", '{"prompt":"keep me","vibeId":7}')
  assert.deepEqual(readHeroDraft(), { prompt: "keep me", vibeId: null })
}

console.log("hero-draft: ok")
