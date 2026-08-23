/** Turns what the maker typed into listing copy and an art-directed prompt,
 *  via Kimi. Two independent calls, not one.
 *
 *  WHY TWO CALLS. `composeListing` writes the title and the buyer-facing
 *  description — copywriting, read by a human deciding whether to buy.
 *  `composePrompt` writes the image-prompt direction — art direction, read by
 *  gpt-image-2. Bundling them into one JSON reply made the model split its
 *  attention across two different jobs with two different audiences, and a
 *  parse failure on one field (a truncated description, say) threw away a
 *  perfectly good prompt along with it. Split, either can fail on its own and
 *  the other still lands; they also run in parallel now instead of in series.
 *
 *  WHY A MODEL AT ALL, for the prompt half. The template in prompt.ts drops
 *  the raw idea into `Subject:` and leaves it there, so "a moth" stays "a
 *  moth" — and the gpt-image skill's craft notes are blunt about that being
 *  the weak case: "scene density beats adjectives" (references/craft.md §9).
 *  Kimi's job is to turn four words into the dense clause the gallery prompts
 *  actually use.
 *
 *  WHAT THE MODEL IS NOT ALLOWED TO WRITE, in the prompt half. Only Subject,
 *  Composition and Art direction. The backdrop line, the `Exact typography:`
 *  block and the negative constraints stay in prompt.ts. Those are not style —
 *  the backdrop is the chroma key the background remover cuts against, and the
 *  negatives are the letterform ban. A model improvising there returns a blank
 *  PNG or a garment printed with misspelled words, both of which somebody has
 *  already paid for.
 *
 *  PERSONA. An optional brand-voice line (lib/generation/personas.ts), folded
 *  into the prompt call only — it colours word choice, never the listing copy,
 *  and it is a soft nudge subordinate to the style's own hard rules.
 *
 *  FALLBACK. No key, a bad response, a timeout: each half falls back on its
 *  own — the template runs exactly as it did before for the prompt, and the
 *  title/description come from the idea and a generic line. Generation must
 *  never fail because a text model was slow.
 */

import { runModel } from "./muapi.ts"
import { buildPrompt, type PromptAspect, type PromptDirection } from "./prompt.ts"
import type { StylePreset } from "./styles.ts"

/** Kimi runs through MuAPI, not Moonshot direct — the same account and the
 *  same MUAPI_API_KEY that draws the images, so there is no second key to
 *  configure and no second transport to maintain. Submit, poll, read
 *  `outputs[0]`: identical to every image model here, except the first output
 *  is text rather than a URL. */
const MODEL_PATH = "/kimi-k3"

/** Past this the composer is holding up the image run inside the route's 300s
 *  maxDuration. kimi-k3 is not fast: observed 26s, 39s, 44s and once over 60s,
 *  and every timeout throws away a call that was paid for.
 *
 *  Both calls now run in parallel (Promise.all in the route), so paying this
 *  once no longer means paying it twice in series. */
const TIMEOUT_MS = 90_000

/** Headroom, not a target. At 600 the model wrote paragraphs and the JSON was
 *  cut off mid-string, which parses as nothing at all — a truncated reply is
 *  worse than a short one. Length is controlled by the instructions and by
 *  clampField below; this is only here so a verbose answer still closes its
 *  braces. */
const MAX_TOKENS = 1200

/** Per-field ceiling for the prompt-direction fields. The gallery prompts are
 *  dense but not essays, and a 200-word `Subject:` buries the composition and
 *  art direction that follow it. Cut on a sentence boundary so a clamped field
 *  still reads as prose. */
const FIELD_MAX_CHARS = 320

/** docs: the ask is 5-7 words. Seven is the hard ceiling, enforced on the way
 *  out rather than trusted to the model. */
const TITLE_MAX_WORDS = 7
const TITLE_MAX_CHARS = 80

/** A description is marketing copy, not a caption — one or two sentences read
 *  in a product grid, not a paragraph. */
const DESCRIPTION_MAX_CHARS = 240

/** What a design gets when no model wrote a description: the same line every
 *  Printify product used before per-design descriptions existed. Exported so
 *  lib/printify/sync.ts can fall back to it identically for designs generated
 *  before this column did. */
export const FALLBACK_DESCRIPTION =
  "A one-of-a-kind AI design, claimed by a single owner and never reprinted for anyone else."

export type ListingCopy = {
  title: string
  description: string
  /** True when Kimi wrote both. False means the fallbacks ran. */
  composed: boolean
}

export type Composition = {
  prompt: string
  /** True when Kimi wrote the direction. False means the template ran. */
  composed: boolean
}

/** Five to seven words, title case, no trailing punctuation, no quotes.
 *  Exported for the test, and used on the fallback path too. */
export function cleanTitle(raw: string): string {
  const words = raw
    .replace(/["'`*_#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, TITLE_MAX_WORDS)

  return words.join(" ").replace(/[.,;:!?—-]+$/, "").slice(0, TITLE_MAX_CHARS)
}

/** The name a design gets when no model wrote one: the first few words of the
 *  idea. Still shorter and more readable than the whole prompt, which is what
 *  used to be shown. */
export function titleFromIdea(idea: string): string {
  return cleanTitle(idea) || "Untitled design"
}

/** Strips markdown noise and clamps to a sentence boundary, the same shape
 *  clampField below gives the prompt-direction fields. */
function cleanDescription(raw: string): string {
  const text = raw.replace(/["'`*_#]/g, "").replace(/\s+/g, " ").trim()
  if (!text) return ""
  if (text.length <= DESCRIPTION_MAX_CHARS) return text

  const head = text.slice(0, DESCRIPTION_MAX_CHARS)
  const lastStop = head.lastIndexOf(". ")

  return lastStop > DESCRIPTION_MAX_CHARS * 0.5
    ? head.slice(0, lastStop + 1)
    : `${head.replace(/\s+\S*$/, "")}…`
}

/** Pulls the JSON object out of a reply that may not be only JSON.
 *
 *  Told "JSON only", models still open with a sentence, wrap the object in
 *  ``` fences, or think out loud first. All three were costing a whole paid
 *  call. Slicing from the first `{` to the last `}` survives every one of them
 *  and still fails closed on a genuinely truncated reply, which is the case
 *  that must fall back. */
function parseJsonReply(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end <= start) return null

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** One Kimi call, shared by both composers. Returns null on anything at all
 *  going wrong — the caller falls back, and a text model is never allowed to
 *  fail a generation.
 *
 *  `image_url` is omitted rather than sent empty: the endpoint validates it as
 *  a URL and 422s on "". */
async function callKimi(
  idea: string,
  systemPrompt: string,
  logTag: string
): Promise<Record<string, unknown> | null> {
  try {
    // runModel polls to its own generous image-sized deadline, so the race is
    // what actually bounds this. Losing it costs a wasted request, not a
    // wedged generation.
    const reply = await Promise.race([
      runModel(MODEL_PATH, {
        prompt: idea,
        system_prompt: systemPrompt,
        temperature: 1,
        max_tokens: MAX_TOKENS,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ])

    if (!reply) {
      console.error(`[${logTag}] Kimi timed out after ${TIMEOUT_MS}ms`)
      return null
    }

    const parsed = parseJsonReply(reply)
    if (!parsed) {
      // The head of the reply, because "unparseable" alone cannot be debugged:
      // a preamble, a fence and a truncation all look identical from here.
      console.error(`[${logTag}] Kimi returned unparseable JSON: ${reply.slice(0, 200)}`)
      return null
    }

    return parsed
  } catch (error) {
    console.error(`[${logTag}] Kimi call failed`, error)
    return null
  }
}

const stringField = (parsed: Record<string, unknown>, key: string): string | null =>
  typeof parsed[key] === "string" ? (parsed[key] as string).trim() : null

// ---------------------------------------------------------------------------
// Listing copy: title + description. Copywriting, not art direction — a
// buyer's read, not gpt-image-2's.
// ---------------------------------------------------------------------------

function listingSystemPrompt(style: StylePreset): string {
  return [
    "You are the copywriter for a print-on-demand shirt marketplace.",
    "You receive a maker's rough idea and return JSON only.",
    "",
    "Return exactly these keys.",
    '- "title": a name for the design, 5 to 7 words, title case, no quotes, no full stop. Name the design; do not restate the prompt.',
    `- "description": one or two sentences, at most ${DESCRIPTION_MAX_CHARS} characters total, written for a buyer browsing the marketplace. Plain language, no art-technique jargon, no hype words ("stunning", "amazing", "must-have"). Say what the design shows and the feeling it carries.`,
    "",
    `The style is "${style.label}": ${style.aesthetic}. Let the description imply it without naming technique vocabulary — that belongs to the artwork, not the copy.`,
    "No preamble, no markdown, no code fences. JSON object only.",
    "No thinking out loud. The first character of your reply is {.",
  ].join("\n")
}

async function askListingCopy(
  idea: string,
  style: StylePreset
): Promise<{ title: string | null; description: string | null } | null> {
  const parsed = await callKimi(idea, listingSystemPrompt(style), "compose:listing")
  if (!parsed) return null

  return {
    title: stringField(parsed, "title"),
    description: stringField(parsed, "description"),
  }
}

/** Title and description for the listing. Runs independently of
 *  {@link composePrompt} — a maker's idea gets named and described the same
 *  way whether or not the art-direction call also lands. */
export async function composeListing(input: {
  idea: string
  style: StylePreset
}): Promise<ListingCopy> {
  const { idea, style } = input
  const kimi = await askListingCopy(idea, style)

  const title = kimi?.title ? cleanTitle(kimi.title) : ""
  const description = kimi?.description ? cleanDescription(kimi.description) : ""

  return {
    title: title || titleFromIdea(idea),
    description: description || FALLBACK_DESCRIPTION,
    composed: Boolean(title && description),
  }
}

// ---------------------------------------------------------------------------
// Image prompt: subject, composition, materials, lighting, art direction.
// Art direction, not copywriting — gpt-image-2's read, not a buyer's.
// ---------------------------------------------------------------------------

/** A model can be told not to mention the background and do it anyway. These
 *  two words are the ones that actually break something: the backdrop is a
 *  chroma key, and a subject described as sitting on a coloured ground gets cut
 *  away with it. Cheaper to drop the sentence than to pay for a blank PNG. */
function violatesBackdropRule(text: string | null | undefined): boolean {
  return Boolean(text && /\bbackdrop\b|\bbackground\b/i.test(text))
}

/** Observed: told "no colours", the model still wrote "rich jewel tones
 *  against deep umbers" into artDirection. The preset owns the palette and
 *  appends its own `Palette of …`, so a second one contradicts it. Drop the
 *  field rather than let two palettes argue in one prompt. */
function namesAPalette(text: string | null | undefined): boolean {
  return Boolean(text && /\b(colou?rs?|palette|tones?|hues?|tints?)\b/i.test(text))
}

/** One sentence, or the first few that fit. A hard slice mid-word reads as
 *  corruption; cutting at a full stop reads as brevity. */
function clampField(text: string | null | undefined): string | null {
  if (!text) return null
  if (text.length <= FIELD_MAX_CHARS) return text

  const head = text.slice(0, FIELD_MAX_CHARS)
  const lastStop = Math.max(head.lastIndexOf(". "), head.lastIndexOf("; "))

  return lastStop > FIELD_MAX_CHARS * 0.4
    ? head.slice(0, lastStop + 1)
    : `${head.replace(/\s+\S*$/, "")}.`
}

function promptSystemPrompt(style: StylePreset, persona: string | null): string {
  return [
    "You are the art director for a print-on-demand shirt marketplace.",
    "You receive a maker's rough idea and return JSON only.",
    "",
    "Return exactly these keys, in this order — lay out the frame before you fill it. Every value is ONE sentence. Dense, not long.",
    '- "composition": one sentence, at most 25 words, placing things in the frame — what is centred, what is around it, how the margins sit.',
    '- "subject": one sentence, at most 40 words. Name 5 to 12 concrete things — parts, objects, garments, growth, wear, posture. Concrete nouns beat adjectives: "brass helmet, cracked porthole glass, barnacle crust, kelp fronds through the air valve" beats "a beautiful ornate helmet".',
    '- "materials": one sentence, at most 20 words, naming surfaces and textures only — metal, cloth, stone, rust, grain, wear.',
    '- "lighting": one sentence, at most 15 words, describing how the SUBJECT is lit — direction, hardness, rim or edge light. Never a scene, never a sky, never a cast shadow.',
    '- "artDirection": one sentence, at most 20 words, of technique vocabulary only — line weight, shading method, texture, register. No colours, no palette.',
    "",
    "Hard rules:",
    `- The style is "${style.label}": ${style.aesthetic}. Stay inside it.`,
    ...(persona
      ? [`- Brand voice: ${persona}. Let it colour word choice — it never overrides the style above.`]
      : []),
    "- Never mention the background, the backdrop, or any background colour. That is set elsewhere.",
    "- Never mention a palette or specific colours. That is set elsewhere.",
    style.family === "pictorial"
      ? "- This design carries NO text. Never describe words, letters, numerals, lettering, banners with writing, or signage of any kind."
      : "- Any lettering in the artwork is fixed elsewhere. Do not invent, quote, or describe words.",
    "- Never describe a photograph, a mockup, or a shirt being worn. The artwork is flat art.",
    "- No preamble, no markdown, no code fences. JSON object only.",
    "- No thinking out loud. The first character of your reply is {.",
  ].join("\n")
}

async function askPromptDirection(
  idea: string,
  style: StylePreset,
  persona: string | null
): Promise<PromptDirection | null> {
  const parsed = await callKimi(idea, promptSystemPrompt(style, persona), "compose:prompt")
  if (!parsed) return null

  return {
    subject: stringField(parsed, "subject"),
    composition: stringField(parsed, "composition"),
    materials: stringField(parsed, "materials"),
    lighting: stringField(parsed, "lighting"),
    artDirection: stringField(parsed, "artDirection"),
  }
}

/** The image prompt gpt-image-2 actually renders. Runs independently of
 *  {@link composeListing} — the art direction the model reads has no reason to
 *  wait on, or be blocked by, the copywriting. */
export async function composePrompt(input: {
  idea: string
  style: StylePreset
  text: string | null
  quote?: string | null
  /** Whatever the create form asked the image model for. The opening line has
   *  to name the same canvas the API is given. */
  aspectRatio?: PromptAspect
  /** Optional brand-voice line from lib/generation/personas.ts. Null (the
   *  default) means no persona was picked — the same output as before this
   *  existed. */
  persona?: string | null
  /** The create form's toggle. False skips the Kimi call entirely — the idea
   *  goes into `Subject:` exactly as typed, template scaffolding and all.
   *  True (the default) is today's behaviour. This is not the same as Kimi
   *  failing: a skipped call is a maker's choice, not a fallback. */
  enhance?: boolean
}): Promise<Composition> {
  const {
    idea,
    style,
    text,
    quote = null,
    aspectRatio = "3:4",
    persona = null,
    enhance = true,
  } = input

  const kimi = enhance ? await askPromptDirection(idea, style, persona) : null

  // Each field is screened on its own, so one bad sentence costs that sentence
  // and the rest of the model's work still lands. A dropped field falls back
  // to the template's wording for that slot.
  const direction: PromptDirection | null = kimi
    ? {
        subject: violatesBackdropRule(kimi.subject) ? null : clampField(kimi.subject),
        composition: violatesBackdropRule(kimi.composition)
          ? null
          : clampField(kimi.composition),
        materials:
          violatesBackdropRule(kimi.materials) || namesAPalette(kimi.materials)
            ? null
            : clampField(kimi.materials),
        lighting: violatesBackdropRule(kimi.lighting) ? null : clampField(kimi.lighting),
        // Trailing stop removed: prompt.ts drops this into the middle of a
        // sentence — `Art direction: {…}. Palette of …` — so the model's own
        // full stop lands as "passes..".
        artDirection:
          violatesBackdropRule(kimi.artDirection) || namesAPalette(kimi.artDirection)
            ? null
            : clampField(kimi.artDirection)?.replace(/\.\s*$/, "") ?? null,
      }
    : null

  return {
    prompt: buildPrompt({ idea, style, text, quote, aspectRatio, direction }),
    composed: Boolean(kimi),
  }
}
