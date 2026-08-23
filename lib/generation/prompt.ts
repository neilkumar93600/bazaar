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
 *    2. `Composition:` — what is where, before anything else is described
 *    3. `Subject:` — what the layout above is holding
 *    4. `Backdrop:` — the ground, as its own element
 *    5. `Exact typography:` — a dash list, each line quoting the literal string
 *    6. `Art direction:` — technique vocabulary, then `Palette of …`, then the
 *       negative constraints inline at the end
 *
 *  Composition comes before Subject, not after: `references/craft.md` §2 is
 *  explicit that layout has to be stated before surface detail or "the model
 *  spends detail budget on the object and improvises the layout." All three
 *  families follow this now — it used to be Subject-then-Composition for
 *  `pictorial` alone, which meant the model had already half-composed the
 *  shot around the subject before it was told where anything actually goes.
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

/** Longest idea we accept. With enhance on, the composer still condenses a
 *  long idea into the template's dense fields; with enhance off the idea
 *  *is* the art direction, so the ceiling has to fit one written by hand. */
export const MAX_PROMPT_LENGTH = 1500
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

/** Visual facts, not praise. The old tail read "High contrast, crisp linework,
 *  print-ready, no CGI tell" — three of those four are adjectives the model
 *  cannot measure, and fal's gpt-image-2 guide is explicit that vague praise
 *  ("stunning, masterpiece, epic") is the single biggest source of generic
 *  output. These are things that are either present in the file or not. */
const INK_FACTS =
  "Flat spot-colour separations with hard edges, no gradient inside a fill, no drop shadow, no bevel, no photographic depth of field."

/** Spells a short string out letter by letter.
 *
 *  Straight from the guide's text-rendering section: "spell hard words letter
 *  by letter when the model struggles". Titles are short, they are set at
 *  display size where a dropped letter is the whole design, and they are the
 *  strings most often mangled — so the title always gets this treatment. The
 *  line does not: at ten words it would bury the instruction it is meant to
 *  reinforce. */
const spellOut = (value: string) =>
  value
    .split("")
    .map((character) => (character === " " ? "space" : character))
    .join("-")

/** The creative half of a prompt, when a model has written it.
 *
 *  Only these three fields are ever model-authored. The backdrop line, the
 *  `Exact typography:` block and the negative constraints stay in code below,
 *  because they are not art direction — they are the chroma key the background
 *  remover cuts against and the letterform ban that keeps garbled pseudo-text
 *  off a garment somebody pays for. A model that gets creative with those
 *  produces an empty PNG or a misspelled shirt.
 *
 *  See lib/generation/compose.ts. Any field absent falls back to the template. */
export type PromptDirection = {
  /** Replaces the bare user idea in `Subject:`. The gallery's own subjects run
   *  5–12 concrete nouns (references/craft.md §9, "scene density beats
   *  adjectives"); a bare idea is one noun and renders like one. */
  subject?: string | null
  /** Replaces the stock `Composition:` sentence. */
  composition?: string | null
  /** Surfaces and textures — brass, enamel, worn leather, chipped paint.
   *  Its own line, not folded into art direction: craft.md §12 keeps
   *  materials, lighting and palette as three separate controls, because
   *  compressing them into "premium" is what produces generic output. */
  materials?: string | null
  /** How the subject is lit. Never the backdrop — that is a flat key field. */
  lighting?: string | null
  /** Replaces the preset's `linework` clause. The palette sentence is still
   *  appended from the preset — palette is a style property, not a per-design
   *  one. */
  artDirection?: string | null
}

/** How the opening line names the canvas. The form offers three ratios and the
 *  prompt used to claim `3:4 portrait` regardless — so a maker who picked
 *  square was telling the model one thing and the API another. */
const CANVAS = {
  "1:1": "1:1 square",
  "3:4": "3:4 portrait",
  "4:3": "4:3 landscape",
} as const

export type PromptAspect = keyof typeof CANVAS

export function buildPrompt(input: {
  idea: string
  style: StylePreset
  /** The words. Null for pictorial; the whole artwork for typographic; the
   *  arched title for illustrated. */
  text: string | null
  /** The line under the illustration. Illustrated styles only. */
  quote?: string | null
  /** Must match what the API is asked for. Defaults to the house portrait. */
  aspectRatio?: PromptAspect
  direction?: PromptDirection | null
}): string {
  const {
    idea,
    style,
    text,
    quote = null,
    aspectRatio = "3:4",
    direction = null,
  } = input
  const trimmedIdea = idea.trim()

  const canvas = CANVAS[aspectRatio] ?? CANVAS["3:4"]
  const subject = direction?.subject?.trim() || trimmedIdea
  const linework = direction?.artDirection?.trim() || style.linework

  /** Optional blocks. Absent rather than empty — a labelled line with nothing
   *  after it reads to the model as a field it should invent. */
  const optional = (label: string, value: string | null | undefined) =>
    value?.trim() ? [`${label}: ${value.trim()}`, ""] : []

  const backdrop = `Backdrop: ${FIELD_PHRASE[style.cutField]} — no glow, no gradient, no texture, no scenery.`
  const palette = `Palette of ${style.palette.join(", ")}.`

  if (style.family === "illustrated") {
    const titleSpelling = text ? ` — spelled ${spellOut(text)}` : ""

    return [
      `A ${style.aesthetic}, ${canvas}, as ${ARTIFACT}.`,
      "",
      `Composition: ${
        direction?.composition?.trim() ||
        style.composition?.trim() ||
        "an arched display title across the top, a single hero illustration filling the centre, and the line set in two balanced centred rows beneath it. Title, illustration and line lock together as one designed plate, symmetrical, with generous margin on all four sides."
      }`,
      "",
      `Subject: ${subject}`,
      "",
      ...optional("Materials", direction?.materials),
      ...optional("Lighting", direction?.lighting),
      backdrop,
      "",
      "Exact typography:",
      // The label describes the same layout the Composition line just asked
      // for. When they disagree — "arched across the full width" against a
      // composition that wants type filling the upper two thirds behind the
      // subject — the model splits the difference and the plate comes out
      // crooked. So the interlocking presets get their own wording.
      //
      // The title also gets spelled out letter by letter — it is set at
      // display size where one dropped letter is the whole design, and it is
      // the string most often mangled. The line doesn't: at ten words spelling
      // it out would bury the instruction it's meant to reinforce.
      style.interlockType
        ? `- Title (enormous condensed capitals, set behind the subject): ${literal(text ?? "")}${titleSpelling}`
        : `- Title (large display capitals, arched across the full width): ${literal(text ?? "")}${titleSpelling}`,
      style.interlockType
        ? `- Line (small capitals, one centred row along the bottom): ${literal(quote ?? "")}`
        : `- Line (smaller capitals, two balanced centred rows): ${literal(quote ?? "")}`,
      "",
      `Art direction: ${linework}. ${palette} ${INK_FACTS} ${negatives(
        [
          "any word, letter or numeral that is not part of the exact typography above",
          "misspelling, duplicating or reordering those words",
          // A preset built around type *behind* a subject wants exactly the
          // overlap this line forbids, so it opts out. Everything else keeps
          // it: on a stacked plate an overlap reads as a printing mistake.
          ...(style.interlockType
            ? ["the subject sitting so low or so small that the title reads as a separate stacked block rather than one layered composition"]
            : ["letting the illustration overlap or obscure the title or the line"]),
          "photographic realism or a mockup of a physical shirt",
          MERGE_WARNING[style.cutField],
        ],
      )}`,
    ].join("\n")
  }

  if (style.family === "typographic") {
    return [
      `A ${style.aesthetic}, ${canvas}, as ${ARTIFACT}.`,
      "",
      `Composition: ${
        direction?.composition?.trim() ||
        "the words are the entire artwork, centred and filling the frame, with generous margin on all four sides. No illustration, no mascot, no scenery."
      }`,
      "",
      ...optional("Materials", direction?.materials),
      ...optional("Lighting", direction?.lighting),
      backdrop,
      "",
      "Exact typography:",
      `- The only text in the image: ${literal(text ?? "")}`,
      "",
      `Art direction: ${linework}. ${palette} ${subject}. ${INK_FACTS} ${negatives(
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
    `A ${style.aesthetic}, ${canvas}, as ${ARTIFACT}.`,
    "",
    `Composition: ${
      direction?.composition?.trim() ||
      "a single centred hero subject, symmetrical, with generous margin on all four sides."
    }`,
    "",
    `Subject: ${subject}`,
    "",
    ...optional("Materials", direction?.materials),
    ...optional("Lighting", direction?.lighting),
    backdrop,
    "",
    `Art direction: ${linework}. ${palette} ${INK_FACTS} ${negatives(
      [
        "any words, letters, numerals or letterforms anywhere in the image",
        "photographic realism or a mockup of a physical shirt",
        "any halo, vignette, gradient, panel or frame behind the subject",
        MERGE_WARNING[style.cutField],
      ],
    )}`,
  ].join("\n")
}
