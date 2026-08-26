/** Run: `npx tsx lib/images/storage-path.test.ts`
 *
 *  ponytail: assert-based, no framework. Every design image is fetched through
 *  this — a wrong answer is either a 404 on the whole catalogue or, worse, the
 *  wrong object served for a design.
 */

import assert from "node:assert/strict"

import { storagePathFromUrl } from "./storage-path"

const BASE = "https://zwrvpmwrnazohqzinqzl.supabase.co"

// The shape actually stored in the designs table today.
assert.equal(
  storagePathFromUrl(
    `${BASE}/storage/v1/object/public/designs/fe906c80-a8bf-42c4-92f6-1bbdba28e9bc.png`,
    "designs",
  ),
  "fe906c80-a8bf-42c4-92f6-1bbdba28e9bc.png",
)

// The same object once the bucket is private, signed, or addressed directly —
// the flip must not need a row rewrite.
for (const variant of ["sign", "authenticated"]) {
  assert.equal(
    storagePathFromUrl(`${BASE}/storage/v1/object/${variant}/designs/a.png`, "designs"),
    "a.png",
    `${variant} URLs must resolve to the same path`,
  )
}
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/designs/a.png`, "designs"),
  "a.png",
)

// Nested keys keep their whole path.
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/public/designs/user/123/art.png`, "designs"),
  "user/123/art.png",
)

// A signed URL carries its token in the query string, which is not part of the key.
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/sign/designs/a.png?token=abc.def`, "designs"),
  "a.png",
)

// Percent-encoding is decoded — the storage API wants the real key.
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/public/designs/my%20art.png`, "designs"),
  "my art.png",
)

// Another bucket must not resolve. Serving an avatar because the URL happened
// to parse would leak the wrong object entirely.
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/public/avatars/a.png`, "designs"),
  null,
  "a different bucket must not resolve",
)
// ...and a bucket that merely starts with the same letters must not either.
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/public/designs-archive/a.png`, "designs"),
  null,
)

// Junk in, null out — never a guess.
for (const junk of [
  "",
  "not a url",
  `${BASE}/storage/v1/object/public/designs/`,
  `${BASE}/some/other/path.png`,
  "https://images-api.printify.com/mockup/abc/1/2/x.jpg",
]) {
  assert.equal(storagePathFromUrl(junk, "designs"), null, `must reject: ${junk}`)
}

// A malformed escape must not throw — decodeURIComponent raises on "%".
assert.equal(
  storagePathFromUrl(`${BASE}/storage/v1/object/public/designs/bad%.png`, "designs"),
  null,
  "a malformed escape must return null rather than throw",
)

console.log("storage-path.test.ts OK")
