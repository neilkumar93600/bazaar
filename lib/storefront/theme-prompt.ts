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
  "You are a visual designer theming a creator's storefront on a print-on-demand apparel marketplace. You are given a sentence describing the shop the creator wants; you return the design spec the page is rendered from. Reply with ONE JSON object and nothing else — no markdown, no code fence, no commentary.",
  "Schema, all ten fields required: {\"bg\":\"#rrggbb\",\"surface\":\"#rrggbb\",\"ink\":\"#rrggbb\",\"accent\":\"#rrggbb\",\"radius\":\"sharp|soft|round\",\"shadow\":\"hard|flat|soft\",\"font\":\"sans|serif|mono\",\"banner\":\"dots|solid|stripes\",\"button\":\"solid|outline\",\"border\":\"hairline|bold|none\"}",
  "What each field paints, so you can picture the page you are describing:",
  "- bg — the page itself, edge to edge, behind the header, the catalogue and the footer.",
  "- surface — every raised sheet on it: the profile panel, the product cards, the tab bar, the search field, the footer band. Keep it within a step of bg in brightness; it is the same paper under a different light, not a second colour.",
  "- ink — every word, icon and rule on the page: headings, body, prices, card titles, borders, the navigation.",
  "- accent — the one loud colour: the primary button, the active tab, the Claimed and verified pills, the banner pattern, links on hover.",
  "- radius — the corner of every panel and card; the buttons, tabs and pills follow it at a smaller scale automatically.",
  "- shadow — hard is a solid offset block in ink (printed, graphic); flat is none (quiet, editorial); soft is a diffuse drop (modern, airy).",
  "- font — the body voice for headings and text. Prices, handles and catalogue labels stay monospace whatever you pick.",
  "- banner — the pattern drawn across the cover strip behind the avatar, in the accent: dots, stripes, or solid for a plain field.",
  "- button — solid fills buttons, active tabs and pills with the accent; outline leaves them on the surface behind an accent rule with accent text. Solid shouts, outline whispers.",
  "- border — the weight of every rule on the page: hairline is a drawn 1px line, bold is 2px, none removes them and lets shadow and colour do the separating.",
  "Rules:",
  "- Colours are six-digit hex only. Every other field must be exactly one of its listed keywords, lowercase.",
  "- ink must be strongly readable on BOTH bg and surface — dark ink on light paper, light ink on dark. This is the one rule that overrides the mood: a beautiful unreadable storefront is a broken one.",
  "- Read the whole sentence, including words about shape, weight and mood, not only the colours: \"sharp\", \"chunky\", \"soft\", \"rounded\", \"minimal\", \"no shadows\", \"typewriter\", \"handwritten sign\" all decide fields above.",
  "- When the sentence says nothing about a field, choose what that mood would choose — never default everything to the middle option.",
  "- Interpret the creator's words. Do not copy the example values in this schema.",
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

  // One retry. Across an eval run of twelve prompts, exactly one came back with
  // an empty reply and passed on a re-ask — MuAPI's text queue does that
  // occasionally, and a fraction of a cent is cheaper than telling a creator
  // their perfectly good sentence failed.
  const ask = () => callKimi(`Theme this storefront: ${wanted}`, SYSTEM_PROMPT, "storefront-theme")
  const parsed = (await ask()) ?? (await ask())
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
