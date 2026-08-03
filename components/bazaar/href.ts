import type { BazaarQuery } from "@/lib/data/bazaar"

/** Builds a `/shop` URL from the current query plus a patch. Any patch that
 *  doesn't name a page resets to page 1 — changing a filter while on page 3
 *  otherwise lands you on an empty result set. */
export function bazaarHref(
  query: BazaarQuery,
  patch: Partial<BazaarQuery>
): string {
  const next = { ...query, page: 1, ...patch }
  const params = new URLSearchParams()

  for (const vibe of next.vibes) params.append("vibe", vibe)
  if (next.availability !== "all") params.set("availability", next.availability)
  if (next.sort !== "recent") params.set("sort", next.sort)
  if (next.page > 1) params.set("page", String(next.page))

  const qs = params.toString()
  return qs ? `/shop?${qs}` : "/shop"
}

export function toggleVibe(vibes: string[], slug: string): string[] {
  return vibes.includes(slug)
    ? vibes.filter((v) => v !== slug)
    : [...vibes, slug]
}
