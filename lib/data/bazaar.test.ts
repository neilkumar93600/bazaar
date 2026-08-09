/** Run: `npx tsx lib/data/bazaar.test.ts`
 *
 *  ponytail: assert-based, no framework. Only the query parsing is covered —
 *  `getBazaarData` needs a database, but the two rules worth guarding are pure:
 *  the `%`/`_` escape (an unescaped wildcard turns a search into a scan that
 *  matches every row) and the length clamp behind it.
 */

import assert from "node:assert/strict"

import { likePattern, MAX_QUERY_LENGTH, parseBazaarQuery } from "./bazaar.ts"

// LIKE wildcards typed by a searcher are literals, not operators.
assert.equal(likePattern("skull"), "%skull%")
assert.equal(likePattern("100%"), "%100\\%%")
assert.equal(likePattern("a_b"), "%a\\_b%")

// The backslash must be escaped before the wildcards, or `\%` becomes `\\%` —
// an escaped backslash followed by a live wildcard.
assert.equal(likePattern("a\\b"), "%a\\\\b%")
assert.equal(likePattern("\\%"), "%\\\\\\%%")

// Empty term never reaches the query; callers gate on `query.q` being truthy.
assert.equal(parseBazaarQuery({}).q, "")
assert.equal(parseBazaarQuery({ q: "   " }).q, "")

assert.equal(parseBazaarQuery({ q: "  wolf  " }).q, "wolf")

// Repeated ?q= takes the first, matching how every other param is read.
assert.equal(parseBazaarQuery({ q: ["wolf", "bear"] }).q, "wolf")

// Clamped, so the pattern stays cheap however long the URL is.
const long = "x".repeat(MAX_QUERY_LENGTH + 50)
assert.equal(parseBazaarQuery({ q: long }).q.length, MAX_QUERY_LENGTH)

// A search term must not disturb the other filters' defaults.
const parsed = parseBazaarQuery({ q: "wolf" })
assert.equal(parsed.availability, "all")
assert.equal(parsed.sort, "recent")
assert.equal(parsed.page, 1)
assert.deepEqual(parsed.vibes, [])

console.log("bazaar.test.ts: all assertions passed")
