import { likePattern } from "@/lib/data/bazaar"
import { createClient } from "@/lib/supabase/server"

export type CreatorResult = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  claimCount: number
}

/** Enough to answer "is the person I'm looking for here", not a directory. */
const CREATOR_LIMIT = 8

/** Handle or display name, whichever the searcher typed.
 *
 *  Storefront-owners only: a profile with nothing claimed has no page worth
 *  landing on, and `/creator/[handle]` is built around a claimed grid. Same
 *  quality gate the sitemap applies.
 */
export async function searchCreators(term: string): Promise<CreatorResult[]> {
  if (!term) return []

  const supabase = await createClient()
  const pattern = likePattern(term)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .or(`handle.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(CREATOR_LIMIT)

  const ids = (profiles ?? []).map((p) => p.id)
  if (ids.length === 0) return []

  const { data: claims } = await supabase
    .from("claims")
    .select("claimant_id")
    .in("claimant_id", ids)

  const claimCounts = new Map<string, number>()
  for (const claim of claims ?? []) {
    claimCounts.set(
      claim.claimant_id,
      (claimCounts.get(claim.claimant_id) ?? 0) + 1
    )
  }

  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      handle: p.handle,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      claimCount: claimCounts.get(p.id) ?? 0,
    }))
    .filter((p) => p.claimCount > 0)
    .sort((a, b) => b.claimCount - a.claimCount)
}
