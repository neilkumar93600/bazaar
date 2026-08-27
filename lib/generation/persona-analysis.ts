/** Derives a persona's style summary from the maker's reference designs.
 *
 *  Server-only. `lib/generation/personas.ts` holds the static presets and is
 *  imported by CreateForm ("use client"), so this vision call lives in its
 *  own file rather than there — a client bundle must never see
 *  OPENROUTER_API_KEY.
 *
 *  MODEL. Talks to OpenRouter directly (see ./openrouter.ts), not MuAPI —
 *  MuAPI is this app's image *generation* transport; its `openrouter-vision`
 *  passthrough model caps `images_list` at 4 URLs, too few for a 10-50 image
 *  persona upload, and returned a bare 403 under real traffic besides.
 *  `gemini-2.5-flash` reads reference images well and is cheap for a call
 *  this infrequent (once per persona, not per generation).
 */

import { runVisionChat } from "./openrouter.ts"

const MODEL = "google/gemini-2.5-flash"

/** Every reference image goes in one call — the model needs to see them
 *  together to describe a *shared* style, not one description per image. */
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

  const reply = await runVisionChat({
    model: MODEL,
    systemPrompt: SYSTEM_PROMPT,
    prompt: `Derive the shared visual style from these ${imageUrls.length} reference designs.`,
    imageUrls,
    maxTokens: MAX_TOKENS,
  })

  const summary = clampSummary(reply)
  if (!summary) {
    throw new Error("Style analysis returned nothing usable")
  }

  return summary
}
