/** Run: `npx tsx lib/auth/next-url.test.ts`
 *
 *  ponytail: assert-based, no framework. This one guards an open redirect —
 *  `next` rides in the query string and is handed to a redirect on a real login
 *  page, which is exactly the shape a phish wants. The off-origin cases are the
 *  reason this file exists; the pass-through cases keep the guard from being so
 *  strict it silently drops every real destination.
 */

import assert from "node:assert/strict"

import { promptFromNext, safeNext } from "./next-url"

// Real destinations survive, query string and all.
assert.equal(safeNext("/create"), "/create")
assert.equal(
  safeNext("/create?prompt=neon%20koi&vibe=v1"),
  "/create?prompt=neon%20koi&vibe=v1",
  "the hero draft rides in the query string — dropping it retypes the prompt",
)
assert.equal(safeNext("/dashboard/orders"), "/dashboard/orders")

// Nothing supplied falls back, and the fallback is caller-chosen.
assert.equal(safeNext(null), "/")
assert.equal(safeNext(undefined), "/")
assert.equal(safeNext(""), "/")
assert.equal(safeNext(null, "/create"), "/create")

// Off-origin: the whole point.
assert.equal(safeNext("//evil.com"), "/", "protocol-relative resolves off-origin")
assert.equal(safeNext("https://evil.com"), "/", "absolute URL resolves off-origin")
assert.equal(safeNext("http://evil.com"), "/")
assert.equal(safeNext("/\\evil.com"), "/", "some parsers fold /\\ into //")
assert.equal(safeNext("javascript:alert(1)"), "/")
assert.equal(safeNext("evil.com"), "/", "bare host is not a relative path")

// Control characters can truncate a path or smuggle a header.
assert.equal(safeNext("/create\nLocation: https://evil.com"), "/")
assert.equal(safeNext("/create\r\nSet-Cookie: a=b"), "/")
assert.equal(safeNext("/create\x00.evil"), "/", "NUL truncates the path downstream")

// A trailing space is cosmetic, not off-origin — the guard leaves it alone
// rather than pretending to be a general-purpose sanitiser.
assert.equal(safeNext("/create "), "/create ")

// promptFromNext — the auth screens quote this back, so a wrong answer either
// shows a stranger's text or silently drops the proof that the work survived.
assert.equal(
  promptFromNext("/create?prompt=neon+koi+swimming&vibe=v1"),
  "neon koi swimming",
  "+ is a space in a query string",
)
assert.equal(
  promptFromNext("/create?prompt=neon%20koi&vibe=v1"),
  "neon koi",
  "percent-encoding decodes too",
)
assert.equal(promptFromNext("/create"), null, "no query, no prompt")
assert.equal(promptFromNext("/dashboard/orders"), null)
assert.equal(promptFromNext("/create?vibe=v1"), null, "vibe alone is not a prompt")
assert.equal(promptFromNext("/create?prompt="), null, "empty prompt is not a prompt")
assert.equal(promptFromNext("/create?prompt=+++"), null, "whitespace is not a prompt")
assert.equal(
  promptFromNext("/create?vibe=v1&prompt=a+hooded+elder"),
  "a hooded elder",
  "order in the query string must not matter",
)

console.log("next-url.test.ts OK")
