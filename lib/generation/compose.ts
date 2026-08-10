/** Turns what the maker typed into a name and an art-directed prompt, via Kimi.
 *
 *  WHY A MODEL AT ALL. The template in prompt.ts drops the raw idea into
 *  `Subject:` and leaves it there, so "a moth" stays "a moth" — and the
 *  gpt-image skill's craft notes are blunt about that being the weak case:
 *  "scene density beats adjectives" (references/craft.md §9). Kimi's job is to
 *  turn four words into the dense clause the gallery prompts actually use.
 *
 *  WHAT THE MODEL IS NOT ALLOWED TO WRITE. Only Subject, Composition and Art
 *  direction. The backdrop line, the `Exact typography:` block and the negative
 *  constraints stay in prompt.ts. Those are not style — the backdrop is the
 *  chroma key the background remover cuts against, and the negatives are the
 *  letterform ban. A model improvising there returns a blank PNG or a garment
 *  printed with misspelled words, both of which somebody has already paid for.
 *
 *  FALLBACK. No key, a bad response, a timeout: the template runs exactly as it
 *  did before and the title is derived from the idea. Generation must never
 *  fail because a text model was slow.
 */

import { runModel } from "./muapi"
import { buildPrompt, type PromptAspect, type PromptDirection } from "./prompt"
import type { StylePreset } from "./styles"

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
 *  The budget got easier when generation dropped from four images to one —
 *  one render, no background pass, ~180s worst case. 90 + 180 leaves 30s of
 *  headroom. Raising this further means raising maxDuration with it. */
const TIMEOUT_MS = 90_000

/** Headroom, not a target. At 600 the model wrote paragraphs and the JSON was
 *  cut off mid-string, which parses as nothing at all — a truncated reply is
 *  worse than a short one. Length is controlled by the instructions and by
 *  clampField below; this is only here so a verbose answer still closes its
 *  braces. */
const MAX_TOKENS = 1200

/** Per-field ceiling. The gallery prompts are dense but not essays, and a
 *  200-word `Subject:` buries the composition and art direction that follow
 *  it. Cut on a sentence boundary so a clamped field still reads as prose. */
const FIELD_MAX_CHARS = 320

/** docs: the ask is 5-7 words. Seven is the hard ceiling, enforced on the way
 *  out rather than trusted to the model. */
const TITLE_MAX_WORDS = 7
const TITLE_MAX_CHARS = 80

export type Composition = {
  title: string
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

function systemPrompt(style: StylePreset): string {
  return [
    "You are the art director for a print-on-demand shirt marketplace.",
    "You receive a maker's rough idea and return JSON only.",
    "",
    "Return exactly these keys. Every value is ONE sentence. Dense, not long.",
    '- "title": a name for the design, 5 to 7 words, title case, no quotes, no full stop. Name the design; do not restate the prompt.',
    '- "subject": one sentence, at most 40 words. Name 5 to 12 concrete things — parts, objects, garments, growth, wear, posture. Concrete nouns beat adjectives: "brass helmet, cracked porthole glass, barnacle crust, kelp fronds through the air valve" beats "a beautiful ornate helmet".',
    '- "composition": one sentence, at most 25 words, placing things in the frame — what is centred, what is around it, how the margins sit.',
    '- "materials": one sentence, at most 20 words, naming surfaces and textures only — metal, cloth, stone, rust, grain, wear.',
    '- "lighting": one sentence, at most 15 words, describing how the SUBJECT is lit — direction, hardness, rim or edge light. Never a scene, never a sky, never a cast shadow.',
    '- "artDirection": one sentence, at most 20 words, of technique vocabulary only — line weight, shading method, texture, register. No colours, no palette.',
    "",
    "Hard rules:",
    `- The style is "${style.label}": ${style.aesthetic}. Stay inside it.`,
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

type KimiDirection = PromptDirection & { title?: string }

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

/** One Kimi call. Returns null on anything at all going wrong — the caller
 *  falls back, and a text model is never allowed to fail a generation.
 *
 *  `image_url` is omitted rather than sent empty: the endpoint validates it as
 *  a URL and 422s on "". */
async function askKimi(
  idea: string,
  style: StylePreset
): Promise<KimiDirection | null> {
  try {
    // runModel polls to its own generous image-sized deadline, so the race is
    // what actually bounds this. Losing it costs a wasted request, not a
    // wedged generation.
    const reply = await Promise.race([
      runModel(MODEL_PATH, {
        prompt: idea,
        system_prompt: systemPrompt(style),
        temperature: 1,
        max_tokens: MAX_TOKENS,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ])

    if (!reply) {
      console.error(`[compose] Kimi timed out after ${TIMEOUT_MS}ms`)
      return null
    }

    const parsed = parseJsonReply(reply)
    if (!parsed) {
      // The head of the reply, because "unparseable" alone cannot be debugged:
      // a preamble, a fence and a truncation all look identical from here.
      console.error(
        `[compose] Kimi returned unparseable JSON: ${reply.slice(0, 200)}`
      )
      return null
    }

    const field = (key: string) =>
      typeof parsed[key] === "string" ? (parsed[key] as string).trim() : null

    return {
      title: field("title") ?? undefined,
      subject: field("subject"),
      composition: field("composition"),
      materials: field("materials"),
      lighting: field("lighting"),
      artDirection: field("artDirection"),
    }
  } catch (error) {
    console.error("[compose] Kimi call failed", error)
    return null
  }
}

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

export async function composeDesign(input: {
  idea: string
  style: StylePreset
  text: string | null
  quote?: string | null
  /** Whatever the create form asked the image model for. The opening line has
   *  to name the same canvas the API is given. */
  aspectRatio?: PromptAspect
}): Promise<Composition> {
  const { idea, style, text, quote = null, aspectRatio = "3:4" } = input

  const kimi = await askKimi(idea, style)

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

  const title = kimi?.title ? cleanTitle(kimi.title) : ""

  return {
    title: title || titleFromIdea(idea),
    prompt: buildPrompt({ idea, style, text, quote, aspectRatio, direction }),
    composed: Boolean(kimi),
  }
}
