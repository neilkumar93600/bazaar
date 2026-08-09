/** The home hero's prompt survives the trip to /create.
 *
 *  Signed-in visitors get the draft through the URL. Signed-out ones are bounced
 *  to /login by the dashboard gate, which drops the query string — so the draft
 *  also rides in sessionStorage and the create form restores it after auth.
 *  sessionStorage rather than localStorage: an abandoned prompt should not
 *  resurface in a new tab a week later. */

export type HeroDraft = { prompt: string; vibeId: string | null }

const KEY = "bazaar:hero-draft"

/** No-ops outside the browser and swallows quota/private-mode failures — a lost
 *  draft is a small annoyance, a thrown error on submit is a broken page. */
export function stashHeroDraft(draft: HeroDraft): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Private mode or a full quota. Nothing to do but continue.
  }
}

/** Returns null when there's nothing stashed, or when what's there isn't a
 *  draft — a hand-edited value must not crash the create page. */
export function readHeroDraft(): HeroDraft | null {
  if (typeof sessionStorage === "undefined") return null

  let raw: string | null
  try {
    raw = sessionStorage.getItem(KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return null

    const { prompt, vibeId } = parsed as Record<string, unknown>
    if (typeof prompt !== "string" || prompt.trim() === "") return null

    return { prompt, vibeId: typeof vibeId === "string" ? vibeId : null }
  } catch {
    return null
  }
}

export function clearHeroDraft(): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Same as stash: never let storage break the page.
  }
}
