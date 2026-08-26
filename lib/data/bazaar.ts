import type { DesignCardData } from "@/components/shared/DesignCard"
import { createClient } from "@/lib/supabase/server"
import { designImageSrc } from "@/lib/images/design-src"

export const BAZAAR_PAGE_SIZE = 24

export type BazaarAvailability = "all" | "unclaimed" | "claimed"
export type BazaarSort = "recent" | "oldest"

export type BazaarQuery = {
  vibes: string[]
  availability: BazaarAvailability
  sort: BazaarSort
  page: number
  /** Free-text match against the design's name and description. Never the
   *  prompt: a filter you can probe a character at a time reads that column out
   *  loud whether or not the page ever renders it. Empty string means no term —
   *  `/shop` never sets it, `/search` always does. */
  q: string
}

export type BazaarDesign = DesignCardData

export type BazaarVibeFacet = { name: string; slug: string; count: number }

export type BazaarData = {
  designs: BazaarDesign[]
  facets: BazaarVibeFacet[]
  totalCount: number
  page: number
  pageCount: number
}

const AVAILABILITY_VALUES: BazaarAvailability[] = [
  "all",
  "unclaimed",
  "claimed",
]
const SORT_VALUES: BazaarSort[] = ["recent", "oldest"]

function toArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

/** URL is the only filter state. Anything unrecognised falls back to the default
 *  rather than 404ing — a hand-edited query string should still render a page. */
export function parseBazaarQuery(
  searchParams: Record<string, string | string[] | undefined>
): BazaarQuery {
  const availability = toArray(searchParams.availability)[0]
  const sort = toArray(searchParams.sort)[0]
  const page = Number(toArray(searchParams.page)[0])

  return {
    vibes: [...new Set(toArray(searchParams.vibe).filter(Boolean))],
    availability: AVAILABILITY_VALUES.includes(
      availability as BazaarAvailability
    )
      ? (availability as BazaarAvailability)
      : "all",
    sort: SORT_VALUES.includes(sort as BazaarSort)
      ? (sort as BazaarSort)
      : "recent",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    q: (toArray(searchParams.q)[0] ?? "").trim().slice(0, MAX_QUERY_LENGTH),
  }
}

/** Long enough for a sentence someone actually typed, short enough that the
 *  `ilike` pattern stays cheap. */
export const MAX_QUERY_LENGTH = 80

/** PostgREST passes the pattern through to `LIKE`, where `%` and `_` are
 *  wildcards — an unescaped `%` turns a search into a full scan that matches
 *  everything. Backslash-escape them, and the backslash itself first. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`
}

/** The public search surface: what a design is called and what it says it is.
 *  Both are written to be read.
 *
 *  Must stay in step with the column grants in
 *  20260824120000_hide_prompt_column.sql — the browser's key cannot read
 *  `prompt` any more, so a filter on it would 403 as well as leak. */
export function searchFilter(term: string): string {
  // Double-quoted: `or()` is a comma-separated grammar, so an unquoted term
  // containing a comma splits into two half-filters and PostgREST rejects the
  // lot. Inside the quotes only `"` needs escaping; `%` is still a LIKE
  // wildcard, which is what likePattern is for.
  const pattern = likePattern(term).replace(/"/g, '\\"')
  return `title.ilike."${pattern}",description.ilike."${pattern}"`
}

export async function getBazaarData(query: BazaarQuery): Promise<BazaarData> {
  const supabase = await createClient()

  const { data: vibeRows } = await supabase
    .from("vibes")
    .select("id, name, slug")
    .order("name", { ascending: true })

  const vibes = vibeRows ?? []
  const selectedVibeIds = vibes
    .filter((v) => query.vibes.includes(v.slug))
    .map((v) => v.id)

  // Facet counts ignore the vibe selection (so you can see what else is there)
  // but do respect availability — otherwise the numbers contradict the grid.
  const claimedFilter =
    query.availability === "all" ? null : query.availability === "claimed"

  const facetCounts = await Promise.all(
    vibes.map(async (vibe) => {
      let q = supabase
        .from("designs")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "approved")
        // Must match the design query below: a facet count that included
        // unlisted designs would promise more rows than the filter returns.
        .not("listed_at", "is", null)
        .eq("vibe_id", vibe.id)
      if (claimedFilter !== null) q = q.eq("is_claimed", claimedFilter)
      if (query.q) q = q.or(searchFilter(query.q))

      const { count } = await q
      return { name: vibe.name, slug: vibe.slug, count: count ?? 0 }
    })
  )

  const from = (query.page - 1) * BAZAAR_PAGE_SIZE
  let designQuery = supabase
    .from("designs")
    .select(
      "id, image_url, mockup_url, is_claimed, price_cents, title, created_at, vibe_id, claimed_by",
      { count: "exact" }
    )
    .eq("moderation_status", "approved")
    .not("listed_at", "is", null)

  if (claimedFilter !== null)
    designQuery = designQuery.eq("is_claimed", claimedFilter)
  if (query.vibes.length > 0)
    designQuery = designQuery.in("vibe_id", selectedVibeIds)
  if (query.q) designQuery = designQuery.or(searchFilter(query.q))

  const { data: designRows, count } = await designQuery
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(from, from + BAZAAR_PAGE_SIZE - 1)

  const rows = designRows ?? []
  const claimantIds = [
    ...new Set(
      rows.map((d) => d.claimed_by).filter((id): id is string => id !== null)
    ),
  ]

  const { data: profileRows } = claimantIds.length
    ? await supabase.from("profiles").select("id, handle").in("id", claimantIds)
    : { data: [] }

  const vibeById = new Map(vibes.map((v) => [v.id, v]))
  const handleById = new Map((profileRows ?? []).map((p) => [p.id, p.handle]))

  const totalCount = count ?? 0

  return {
    designs: rows.map((d) => ({
      id: d.id,
      imageUrl: designImageSrc(d.id),
      mockupUrl: d.mockup_url ?? null,
      isClaimed: d.is_claimed,
      priceCents: d.price_cents,
      title: d.title ?? null,
      createdAt: d.created_at,
      vibeName: (d.vibe_id ? vibeById.get(d.vibe_id)?.name : null) ?? null,
      claimantHandle: d.claimed_by
        ? (handleById.get(d.claimed_by) ?? null)
        : null,
    })),
    facets: facetCounts,
    totalCount,
    page: query.page,
    pageCount: Math.max(1, Math.ceil(totalCount / BAZAAR_PAGE_SIZE)),
  }
}
