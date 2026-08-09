/** House art direction for every generated design.
 *
 *  The user supplies an idea, never the whole prompt. Raw user text sent
 *  straight to the model drifts hard — within seconds it degenerates into
 *  generic merch covered in garbled pseudo-lettering.
 *
 *  STRUCTURE: this follows the gpt-image skill's Reference Gallery exactly,
 *  rather than the JSON-ish config block that used to live here. Every prompt
 *  in that gallery is prose in the same order:
 *
 *    1. an opening line naming the artifact, the style and the aspect ratio
 *    2. `Composition:` — what is where
 *    3. `Backdrop:` — the ground, as its own element
 *    4. `Exact typography:` — a dash list, each line quoting the literal string
 *    5. `Art direction:` — technique vocabulary, then `Palette of …`, then the
 *       negative constraints inline at the end
 *
 *  See `references/gallery-anime-and-manga.md` No. 1 and
 *  `references/gallery-typography-and-posters.md` No. 35. The gallery's own
 *  examples anchor to named studios and franchises; these designs are printed
 *  and sold, so presets anchor to era and technique instead.
 *
 *  The letterform rule is the single most important thing in the file, and it
 *  is conditional on the family: `pictorial` keeps the blanket ban verbatim,
 *  because the model cannot spell and is therefore never asked to.
 *  `typographic` and `illustrated` are the only exceptions, and they pin the
 *  exact strings instead. Nothing outside lib/generation/styles.ts may widen
 *  that exception.
 *
 *  The flat background field is a chroma key, not a look — for the styles that
 *  still get cut. MuAPI's gpt-image-2 endpoint has no transparency flag (three
 *  phrasings tested, all returned opaque RGB), so alpha comes from a second
 *  pass through ai-background-remover and that pass needs one uniform field to
 *  cut against. Full-bleed plates skip removal entirely and keep their ground.
 */

import type { StylePreset } from "./styles"

/** Longest idea we accept. Past this the user is writing the art direction,
 *  which is the model's drift failure mode, not a feature. */
export const MAX_PROMPT_LENGTH = 200
export const MIN_PROMPT_LENGTH = 3

const ARTIFACT =
  "flat screen-print artwork for the front of a t-shirt, not a photograph of a shirt"

/** The flat field the artwork is keyed against, phrased for the model. */
const FIELD_PHRASE = {
  black: "one flat solid pure black field, edge to edge",
  white: "one flat solid pure white field, edge to edge",
} as const

/** The subject must not be painted in the field colour or the background
 *  remover cuts it away with the background. Mirrors the invariant enforced in
 *  styles.test.ts. */
const MERGE_WARNING = {
  black: "any part of the subject rendered in pure black, which would merge into the background",
  white: "any part of the subject rendered in pure white, which would merge into the background",
} as const

/** Quoted the way the gallery quotes literal in-image copy, and escaped so a
 *  quote or newline in user text cannot break out of the line it belongs to. */
const literal = (value: string) => JSON.stringify(value)

const negatives = (items: string[]) => `Do not include ${items.join("; ")}.`

export function buildPrompt(input: {
  idea: string
  style: StylePreset
  /** The words. Null for pictorial; the whole artwork for typographic; the
   *  arched title for illustrated. */
  text: string | null
  /** The line under the illustration. Illustrated styles only. */
  quote?: string | null
}): string {
  const { idea, style, text, quote = null } = input
  const trimmedIdea = idea.trim()

  const backdrop = `Backdrop: ${FIELD_PHRASE[style.cutField]} — no glow, no gradient, no texture, no scenery.`
  const palette = `Palette of ${style.palette.join(", ")}.`

  if (style.family === "illustrated") {
    return [
      `A ${style.aesthetic}, 3:4 portrait, as ${ARTIFACT}.`,
      "",
      "Composition: an arched display title across the top, a single hero illustration filling the centre, and the line set in two balanced centred rows beneath it. Title, illustration and line lock together as one designed plate, symmetrical, with generous margin on all four sides.",
      "",
      `Subject: ${trimmedIdea}`,
      "",
      backdrop,
      "",
      "Exact typography:",
      `- Title (large display capitals, arched across the full width): ${literal(text ?? "")}`,
      `- Line (smaller capitals, two balanced centred rows): ${literal(quote ?? "")}`,
      "",
      `Art direction: ${style.linework}. ${palette} High contrast, crisp linework, print-ready, no CGI tell. ${negatives(
        [
          "any word, letter or numeral that is not part of the exact typography above",
          "misspelling, duplicating or reordering those words",
          "letting the illustration overlap or obscure the title or the line",
          "photographic realism or a mockup of a physical shirt",
          MERGE_WARNING[style.cutField],
        ],
      )}`,
    ].join("\n")
  }

  if (style.family === "typographic") {
    return [
      `A ${style.aesthetic}, 3:4 portrait, as ${ARTIFACT}.`,
      "",
      "Composition: the words are the entire artwork, centred and filling the frame, with generous margin on all four sides. No illustration, no mascot, no scenery.",
      "",
      backdrop,
      "",
      "Exact typography:",
      `- The only text in the image: ${literal(text ?? "")}`,
      "",
      `Art direction: ${style.linework}. ${palette} ${trimmedIdea}. High contrast, crisp linework, print-ready, no CGI tell. ${negatives(
        [
          "any word, letter or numeral that is not the exact text above",
          "misspelling, duplicating or reordering those words",
          "photographic realism or a mockup of a physical shirt",
          MERGE_WARNING[style.cutField],
        ],
      )}`,
    ].join("\n")
  }

  return [
    `A ${style.aesthetic}, 3:4 portrait, as ${ARTIFACT}.`,
    "",
    `Subject: ${trimmedIdea}`,
    "",
    "Composition: a single centred hero subject, symmetrical, with generous margin on all four sides.",
    "",
    backdrop,
    "",
    `Art direction: ${style.linework}. ${palette} High contrast, crisp linework, print-ready, no CGI tell. ${negatives(
      [
        "any words, letters, numerals or letterforms anywhere in the image",
        "photographic realism or a mockup of a physical shirt",
        "any halo, vignette, gradient, panel or frame behind the subject",
        MERGE_WARNING[style.cutField],
      ],
    )}`,
  ].join("\n")
}
