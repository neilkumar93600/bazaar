import type { SupabaseClient } from "@supabase/supabase-js"

/** Generations allowed per user per rolling 24h.
 *
 *  Defaulted in code so a missing env var fails closed rather than uncapping
 *  the API bill. Single source of truth: the route enforces it and the
 *  dashboard sidebar displays it, so the number a user is shown is the number
 *  they actually get. */
export const DAILY_CAP = Number(process.env.GENERATION_DAILY_CAP ?? 5)

/** Images produced by one generation. Lives here beside DAILY_CAP because the
 *  two numbers together are the spend ceiling: DAILY_CAP × IMAGES_PER_JOB is
 *  what one user can cost per day.
 *
 *  One, not four. Four existed so the maker could pick a favourite, but it
 *  spent four model runs on three images nobody kept and made every generation
 *  four times slower and four times dearer. A maker who dislikes the one they
 *  get regenerates, and that costs a quarter of what a fan-out did.
 *
 *  The cap counts *jobs*, deliberately. Counting design rows instead would stop
 *  charging for failed generations — which is the abuse case the cap exists
 *  for, since a broken prompt retried forever still costs money. */
export const IMAGES_PER_JOB = 1
export const DAILY_IMAGE_CAP = DAILY_CAP * IMAGES_PER_JOB

const WINDOW_MS = 24 * 60 * 60 * 1000

/** Generations this user has started in the last 24h.
 *
 *  Counted from generation_jobs rather than a separate ledger so there's no
 *  second source of truth to drift. Failed attempts count on purpose — a
 *  broken prompt retried forever still costs money. */
export async function countRecentGenerations(
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count, error } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since)

  // null means "couldn't tell" — callers decide whether that's fatal. The
  // route refuses; the sidebar just shows nothing used.
  if (error) return null
  return count ?? 0
}
