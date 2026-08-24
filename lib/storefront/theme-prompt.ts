/** Prompt -> storefront theme.
 *
 *  Server-only: `callKimi` reaches for MUAPI_API_KEY, and `theme.ts` next door
 *  is imported by client components — same split as `personas.ts` /
 *  `persona-analysis.ts`.
 *
 *  The transport, the JSON-out-of-a-chatty-reply parsing and the timeout are
 *  all `callKimi`'s, shared with the design composers. This file is only the
 *  system prompt and the validation, and the validation is the part that
 *  matters: whatever comes back is untrusted, and `parseTheme` decides what
 *  reaches the page.
 */

import { callKimi } from "@/lib/generation/compose"

import { DEFAULT_THEME, MAX_PROMPT_CHARS, parseTheme, type StorefrontTheme } from "./theme"

const SYSTEM_PROMPT = [
  "You are a visual designer theming a creator's storefront on a print-on-demand apparel marketplace.",
  "Reply with ONE JSON object and nothing else. No markdown, no code fence, no commentary.",
  'Schema: {"bg":"#rrggbb","surface":"#rrggbb","ink":"#rrggbb","accent":"#rrggbb","radius":"sharp|soft|round","shadow":"hard|flat|soft","font":"sans|serif|mono","banner":"dots|solid|stripes"}',
  "bg is the page behind everything. surface is the cards and panels, and must stay close to bg in brightness. ink is every word and border. accent is the one loud colour: active tabs, badges, the primary button.",
  "ink must be strongly readable on both bg and surface — dark ink on light backgrounds, light ink on dark ones.",
  "Colours are six-digit hex only. Every other field must be exactly one of the listed words.",
  "Interpret the mood the creator describes; do not copy the example values.",
].join(" ")

/** Asks the model for a theme and returns one that is safe to render.
 *
 *  Throws when the call gave nothing back — unlike a generation, there is no
 *  silent fallback here, because a creator pressed a button and is owed an
 *  answer either way. A malformed or hostile field is not that case: it just
 *  falls back to house style inside `parseTheme`.
 */
export async function generateThemeFromPrompt(prompt: string): Promise<StorefrontTheme> {
  const wanted = prompt.trim().slice(0, MAX_PROMPT_CHARS)
  if (!wanted) throw new Error("No prompt to theme from")

  const parsed = await callKimi(`Theme this storefront: ${wanted}`, SYSTEM_PROMPT, "storefront-theme")
  if (!parsed) throw new Error("Theme generation returned nothing usable")

  const theme = parseTheme(parsed)
  // Every field falling back means the reply was JSON with no theme in it —
  // worth surfacing, rather than telling the creator their prompt was applied
  // when nothing changed.
  const untouched = (Object.keys(DEFAULT_THEME) as (keyof StorefrontTheme)[]).every(
    (key) => theme[key] === DEFAULT_THEME[key],
  )
  if (untouched) throw new Error("Theme generation returned nothing usable")

  return theme
}
