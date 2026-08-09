/** House art direction for every generated design.
 *
 *  The user supplies an idea, never the whole prompt. Raw user text sent
 *  straight to the model drifts hard — within seconds it degenerates into
 *  generic merch covered in garbled pseudo-lettering. Pinning the medium,
 *  palette and composition here keeps output deliberate, and the letterform
 *  rule is the single most important thing in the file.
 *
 *  That rule is now conditional, and the condition is the only one there is:
 *  `pictorial` styles keep the blanket ban verbatim, because the model cannot
 *  spell and is therefore never asked to. `typographic` styles are the sole
 *  exception — there the words *are* the artwork, so the ban is replaced by an
 *  instruction to render one exact string and nothing else. Nothing outside
 *  lib/generation/styles.ts may widen that exception.
 *
 *  Structured as a config block rather than prose deliberately — GPT Image 2
 *  follows schema-shaped prompts far more closely on scenes with several
 *  interacting systems (subject, palette, lighting, composition).
 *
 *  The flat background field is a chroma key, not a look. MuAPI's gpt-image-2
 *  endpoint has no transparency flag, so alpha comes from a second pass through
 *  ai-background-remover (lib/generation/adapter.ts) and that pass needs one
 *  uniform field to cut against. Which colour is per style: black for most,
 *  white for the black-ink styles that would otherwise be cut away along with
 *  the background. See `StylePreset.cutField`.
 */

import type { StylePreset } from "./styles"

/** Longest idea we accept. Past this the user is writing the art direction,
 *  which is the model's drift failure mode, not a feature. */
export const MAX_PROMPT_LENGTH = 200
export const MIN_PROMPT_LENGTH = 3

/** The flat field the artwork is keyed against, phrased for the model. */
const FIELD_PHRASE = {
  black: "one flat solid pure black field, edge to edge",
  white: "one flat solid pure white field, edge to edge",
} as const

/** The subject must not be painted in the field colour or the background
 *  remover cuts it away with the background. Mirrors the invariant enforced in
 *  styles.test.ts. */
const MERGE_WARNING = {
  black:
    "any part of the subject rendered in pure black, which would merge into the background",
  white:
    "any part of the subject rendered in pure white, which would merge into the background",
} as const

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

  // An illustrated design is a lockup: title, picture, line. It gets its own
  // branch rather than being squeezed into either of the other two, because
  // pictorial forbids the text and typographic forbids the picture.
  if (style.family === "illustrated") {
    return buildIllustratedPrompt({ idea, style, title: text ?? "", quote: quote ?? "" })
  }

  const isTypographic = style.family === "typographic"

  const letterformRules = isTypographic
    ? [
        "any word, letter or numeral that is not part of TEXT_CONTENT",
        "misspelling, duplicating or reordering the words in TEXT_CONTENT",
      ]
    : ["any words, letters, numerals or letterforms anywhere in the image"]

  const subject = isTypographic
    ? { key: "TEXT_CONTENT", value: text ?? "", direction: idea.trim() }
    : { key: "SUBJECT", value: idea.trim(), direction: null }

  return `/* SHIRT_PRINT_CONFIG: 1-of-1 Design
   VERSION: 2.0.0
   STYLE: ${style.slug} */
{
  "GLOBAL_SETTINGS": {
    "artifact": "flat screen-print artwork for the front of a t-shirt, not a photograph of a shirt",
    "aesthetic": ${JSON.stringify(style.aesthetic)},
    "style": ${JSON.stringify(style.linework)}
  },
  ${JSON.stringify(subject.key)}: ${JSON.stringify(subject.value)},${
    subject.direction
      ? `\n  "ART_DIRECTION": ${JSON.stringify(subject.direction)},`
      : ""
  }
  "COMPOSITION": {
    "framing": ${JSON.stringify(
      isTypographic
        ? "the words are the whole artwork, centred, filling the frame, generous margin on all four sides"
        : "single centred hero subject, symmetrical, generous margin on all four sides",
    )},
    "background": ${JSON.stringify(
      `${FIELD_PHRASE[style.cutField]}, no glow, no gradient, no texture, no scenery`,
    )}
  },
  "PALETTE": ${JSON.stringify(style.palette)},
  "RENDER_FLAGS": ["high_contrast", "crisp_linework", "print_ready", "no_CGI_tell"],
  "AVOID": ${JSON.stringify([
    ...letterformRules,
    "photographic realism or a mockup of a physical shirt",
    "any halo, vignette, gradient, panel or frame behind the subject",
    MERGE_WARNING[style.cutField],
  ])}
}`
}

/** A broadside: arched title, hero illustration, line underneath, all one
 *  lockup on a flat field.
 *
 *  Two text slots rather than one, and both are pinned verbatim. The model is
 *  told exactly what may appear and forbidden everything else — the same guard
 *  the typographic branch uses, widened only to two strings.
 *
 *  Composition is spelled out slot by slot because "title, picture, quote" is a
 *  layout, not a subject, and describing it loosely produces a picture with
 *  words floating over it instead of a designed plate. */
function buildIllustratedPrompt(input: {
  idea: string
  style: StylePreset
  title: string
  quote: string
}): string {
  const { idea, style, title, quote } = input

  return `/* SHIRT_PRINT_CONFIG: 1-of-1 Design
   VERSION: 2.1.0
   STYLE: ${style.slug} (illustrated broadside) */
{
  "GLOBAL_SETTINGS": {
    "artifact": "flat screen-print artwork for the front of a t-shirt, not a photograph of a shirt",
    "aesthetic": ${JSON.stringify(style.aesthetic)},
    "style": ${JSON.stringify(style.linework)}
  },
  "LAYOUT": {
    "top": "the TITLE, set large in display capitals on a gentle upward arch, spanning the full width",
    "middle": "the SUBJECT, rendered as the hero illustration, centred and dominant",
    "bottom": "the LINE, set in two balanced rows of smaller capitals, centred"
  },
  "TITLE": ${JSON.stringify(title)},
  "SUBJECT": ${JSON.stringify(idea.trim())},
  "LINE": ${JSON.stringify(quote)},
  "COMPOSITION": {
    "framing": "one symmetrical vertical plate, title and line locked to the illustration as a single designed unit, generous margin on all four sides",
    "background": ${JSON.stringify(
      `${FIELD_PHRASE[style.cutField]}, no glow, no gradient, no scenery`,
    )}
  },
  "PALETTE": ${JSON.stringify(style.palette)},
  "RENDER_FLAGS": ["high_contrast", "crisp_linework", "print_ready", "no_CGI_tell"],
  "AVOID": ${JSON.stringify([
    "any word, letter or numeral that is not part of TITLE or LINE",
    "misspelling, duplicating or reordering the words in TITLE or LINE",
    "letting the illustration overlap or obscure the TITLE or the LINE",
    "photographic realism or a mockup of a physical shirt",
    MERGE_WARNING[style.cutField],
  ])}
}`
}
