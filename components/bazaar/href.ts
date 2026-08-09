import type { BazaarQuery } from "@/lib/data/bazaar"

/** Builds a `/shop` (or `/search`) URL from the current query plus a patch. Any
 *  patch that doesn't name a page resets to page 1 — changing a filter while on
 *  page 3 otherwise lands you on an empty result set.
 *
 *  `basePath` exists because `/search` renders the same grid and pagination
 *  against the same query shape; only the route it links back to differs. */
export function bazaarHref(
  query: BazaarQuery,
  patch: Partial<BazaarQuery>,
  basePath: string = "/shop"
): string {
  const next = { ...query, page: 1, ...patch }
  const params = new URLSearchParams()

  for (const vibe of next.vibes) params.append("vibe", vibe)
  if (next.availability !== "all") params.set("availability", next.availability)
  if (next.sort !== "recent") params.set("sort", next.sort)
  if (next.page > 1) params.set("page", String(next.page))
  if (next.q) params.set("q", next.q)

  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function toggleVibe(vibes: string[], slug: string): string[] {
  return vibes.includes(slug)
    ? vibes.filter((v) => v !== slug)
    : [...vibes, slug]
}
