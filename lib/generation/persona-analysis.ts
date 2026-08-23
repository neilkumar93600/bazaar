/** Derives a persona's style summary from the maker's reference designs.
 *
 *  Server-only. `lib/generation/personas.ts` holds the static presets and is
 *  imported by CreateForm ("use client"), so this vision call lives in its
 *  own file rather than there — a client bundle must never see MUAPI_API_KEY.
 *
 *  MODEL. `openrouter-vision` (MuAPI), routed to a Gemini vision model behind
 *  the scenes. Discovered live against MuAPI's `/models` catalog and its own
 *  422 validation error, not documented anywhere: the endpoint wants
 *  `images_list` (an array — multi-image in one call, not one call per
 *  image), `system_prompt`, `max_tokens`, alongside the usual `prompt`. Its
 *  reply lands in `outputs[0]` exactly like every other MuAPI model, so
 *  `runModel()` needs no changes to support it.
 */

import { runModel } from "./muapi.ts"

const MODEL_PATH = "/openrouter-vision"

/** Same shape as compose.ts's own budget for a text call — this is one
 *  request, not a poll loop racing an image render, so it can be generous
 *  without holding anything else up. */
const TIMEOUT_MS = 90_000

const MAX_TOKENS = 400

/** One dense paragraph, not a report. Long enough to be specific, short
 *  enough to still read as a single "voice" line once folded into the
 *  image-prompt system instructions alongside a static persona's. */
const SUMMARY_MAX_CHARS = 500

const SYSTEM_PROMPT = [
  "You are a visual style analyst for a print-on-demand shirt marketplace.",
  "You will see several reference t-shirt designs a maker likes.",
  `Write ONE dense paragraph, 2 to 4 sentences, at most ${SUMMARY_MAX_CHARS} characters, describing the shared visual style across them: recurring linework technique, palette tendencies, subject motifs, composition habits, and mood.`,
  'Name concrete visual facts, not praise — no "amazing", "stunning", "beautiful", "cool".',
  "If the references disagree, describe the common thread across most of them, not every outlier.",
  "Never mention any brand name, logo, real person, or copyrighted character visible in the references.",
  "No preamble, no markdown. The first character of your reply is the description itself.",
].join(" ")

function clampSummary(text: string): string {
  const trimmed = text.replace(/["'`*_#]/g, "").replace(/\s+/g, " ").trim()
  if (trimmed.length <= SUMMARY_MAX_CHARS) return trimmed

  const head = trimmed.slice(0, SUMMARY_MAX_CHARS)
  const lastStop = head.lastIndexOf(". ")

  return lastStop > SUMMARY_MAX_CHARS * 0.5
    ? head.slice(0, lastStop + 1)
    : `${head.replace(/\s+\S*$/, "")}…`
}

/** Looks at every reference image at once and writes the one paragraph that
 *  becomes this persona's `style_summary`. Throws on failure — unlike the
 *  design composer, this runs inside a maker's own "create persona" button
 *  press, not a background generation, so there is nothing to silently fall
 *  back to. A maker who asked for this needs to be told it didn't happen,
 *  same reasoning as `removeBackground` in adapter.ts. */
export async function analyzePersonaStyle(imageUrls: string[]): Promise<string> {
  if (imageUrls.length === 0) {
    throw new Error("No reference images to analyze")
  }

  const reply = await Promise.race([
    runModel(MODEL_PATH, {
      prompt: `Derive the shared visual style from these ${imageUrls.length} reference designs.`,
      images_list: imageUrls,
      system_prompt: SYSTEM_PROMPT,
      max_tokens: MAX_TOKENS,
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
  ])

  if (!reply) {
    throw new Error(`Style analysis timed out after ${TIMEOUT_MS}ms`)
  }

  const summary = clampSummary(reply)
  if (!summary) {
    throw new Error("Style analysis returned nothing usable")
  }

  return summary
}
