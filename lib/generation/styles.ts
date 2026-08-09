/** The art directions a maker can pick from.
 *
 *  Code, not a database table: a preset is a bundle of prompt fragments, it
 *  ships with the prompt builder that understands it, and a preset absent from
 *  the deployed code cannot be generated anyway. A table would add a join and
 *  a way to get out of sync.
 *
 *  `cutField` is the load-bearing field. Artwork is keyed against a flat
 *  colour so `ai-background-remover` has a clean edge (lib/generation/adapter.ts),
 *  and a style painted in that same colour gets cut away entirely — an empty
 *  PNG, generated and paid for. Black-ink styles key against white; everything
 *  else keys against black. styles.test.ts enforces it across every preset.
 *
 *  `family` decides whether the prompt may emit letterforms at all. See
 *  lib/generation/prompt.ts — the blanket ban survives for `pictorial` and is
 *  replaced by an exact-string instruction for `typographic`. Nothing else in
 *  the system is allowed to weaken it.
 */

/** `pictorial`   — a drawn subject, no letterforms anywhere.
 *  `typographic` — the words ARE the artwork, no illustration.
 *  `illustrated` — both: an arched title, a hero illustration and a quote,
 *                  locked up as one broadside. This is the shape of a real
 *                  band/mythology tee, and neither of the other two can make
 *                  one: pictorial bans the text, typographic bans the picture. */
export type StyleFamily = "pictorial" | "typographic" | "illustrated"

export type StylePreset = {
  slug: string
  label: string
  /** `typographic` styles are the only ones allowed to emit letterforms, and
   *  only the maker's exact string. */
  family: StyleFamily
  /** Resolved to a vibe id at generation time. Slug, not id: ids differ
   *  between environments, slugs don't. */
  vibeSlug: string
  aesthetic: string
  linework: string
  palette: string[]
  cutField: "black" | "white"
  /** True when the artwork is a full-bleed plate rather than an isolated
   *  subject — a poster with a title and a line, or a bordered broadside.
   *
   *  Two consequences, both load-bearing:
   *
   *  1. **Background removal is skipped.** `ai-background-remover` isolates a
   *     *subject*, and on a poster it decides the subject is the character —
   *     so it deletes the title, the line and the scenery. Observed on LAST
   *     TRAIN: the finished PNG was the boy alone, with "LAST TRAIN" and
   *     "I MISSED IT ON PURPOSE" cut away. A plate has to survive whole.
   *
   *  2. **The garment must match the plate's ground**, because that ground now
   *     prints. A black plate on a maroon shirt is a black rectangle.
   *
   *  Enforced by REQUIRED_GARMENT_COLOUR and by the adapter's keepBackground. */
  fullBleed?: boolean
}

/** A full-bleed style prints its own ground, so the garment must match it.
 *  Keyed by `cutField` because that is the ground's colour. */
export const REQUIRED_GARMENT_COLOUR: Record<"black" | "white", string> = {
  black: "Black",
  white: "White",
}

/** The garment colour a preset demands, or null when any colour is fine. */
export function requiredColourFor(style: StylePreset): string | null {
  return style.fullBleed ? REQUIRED_GARMENT_COLOUR[style.cutField] : null
}

export const MAX_TEXT_WORDS = 7
export const MAX_TEXT_CHARS = 40

/** An `illustrated` design carries two strings, not one: a short arched title
 *  and a longer line underneath. Kept tighter than the typographic limits for
 *  the title and looser for the quote, because that is the proportion the
 *  layout wants — one word shouting, one sentence answering. */
export const MAX_TITLE_WORDS = 3
export const MAX_TITLE_CHARS = 22
export const MAX_QUOTE_WORDS = 10
export const MAX_QUOTE_CHARS = 60

export const STYLE_PRESETS: StylePreset[] = [
  // --- Riot ---------------------------------------------------------------
  {
    slug: "woodcut-flash",
    label: "Woodcut Flash",
    family: "pictorial",
    vibeSlug: "riot",
    aesthetic: "screen-printed streetwear poster art",
    linework:
      "bold pictorial line art, thick confident linework, vintage woodcut and tattoo-flash influence",
    palette: ["antique gold", "bone white", "muted teal", "deep crimson"],
    cutField: "black",
  },
  {
    slug: "blackwork-tattoo",
    label: "Blackwork Tattoo",
    family: "pictorial",
    vibeSlug: "riot",
    aesthetic: "solid blackwork tattoo flash",
    linework:
      "heavy solid fills and fine dotwork shading, hard silhouettes, no grey midtones",
    palette: ["solid ink black", "deep charcoal grey"],
    cutField: "white",
  },
  {
    slug: "comic-halftone",
    label: "Comic Halftone Pop",
    family: "pictorial",
    vibeSlug: "riot",
    aesthetic: "silver-age comic book panel art",
    linework:
      "bold ink outlines with benday halftone dot shading and flat spot colour",
    palette: ["primary red", "cyan blue", "golden yellow", "heavy ink outline"],
    cutField: "white",
  },

  // --- Late Bloomer -------------------------------------------------------
  {
    slug: "manga-ink",
    label: "Manga Ink",
    family: "pictorial",
    vibeSlug: "late-bloomer",
    aesthetic: "black-and-white manga illustration",
    linework:
      "sharp G-pen linework with screentone gradients, speed lines and hatched shadow",
    palette: ["ink line", "screentone grey"],
    cutField: "white",
  },
  {
    slug: "anime-cel",
    label: "Anime Cel",
    family: "pictorial",
    vibeSlug: "late-bloomer",
    aesthetic: "1990s anime cel painting",
    linework:
      "clean cel-shaded fills with crisp outlines and hard two-tone shadows",
    palette: ["sky cyan", "coral pink", "warm sand", "pale lilac"],
    cutField: "black",
  },
  {
    slug: "watercolour-bloom",
    label: "Watercolour Bloom",
    family: "pictorial",
    vibeSlug: "late-bloomer",
    aesthetic: "loose watercolour illustration",
    linework:
      "wet-on-wet blooms, granulating pigment, visible brush edges, soft undefined boundaries",
    palette: ["indigo wash", "rose madder", "sap green", "raw ochre"],
    cutField: "black",
  },
  {
    slug: "botanical-plate",
    label: "Botanical Field Guide",
    family: "pictorial",
    vibeSlug: "late-bloomer",
    aesthetic: "19th-century botanical plate",
    linework:
      "fine engraved outlines with flat gouache fills and specimen-plate precision",
    palette: ["herbarium green", "dusty rose", "muted ochre", "slate blue"],
    cutField: "black",
  },

  // --- Dusk Atelier -------------------------------------------------------
  {
    slug: "vintage-riso",
    label: "Vintage Riso",
    family: "pictorial",
    vibeSlug: "dusk-atelier",
    aesthetic: "two-colour risograph print",
    linework:
      "coarse grain, deliberate misregistration, multiply overprint where the two inks cross",
    palette: ["riso fluorescent pink", "riso federal blue"],
    cutField: "black",
  },
  {
    slug: "art-nouveau-panel",
    label: "Art Nouveau Panel",
    family: "pictorial",
    vibeSlug: "dusk-atelier",
    aesthetic: "Mucha-style decorative panel",
    linework:
      "sinuous whiplash contour lines, flat ornamental fills, a circular halo motif behind the subject",
    palette: ["antique gold", "sage", "dusty mauve", "terracotta"],
    cutField: "black",
  },
  {
    slug: "minimal-line",
    label: "Minimal Line",
    family: "pictorial",
    vibeSlug: "dusk-atelier",
    aesthetic: "single-weight continuous line drawing",
    linework:
      "one unbroken contour line of even weight, no shading, generous negative space",
    palette: ["deep ink stroke"],
    cutField: "white",
  },

  // --- Insatiable ---------------------------------------------------------
  {
    slug: "psychedelic-liquid",
    label: "Psychedelic Liquid",
    family: "pictorial",
    vibeSlug: "insatiable",
    aesthetic: "1960s psychedelic poster art",
    linework:
      "melting concentric contours, warped bilateral symmetry, vibrating opposing hues",
    palette: ["acid orange", "electric violet", "lime", "hot magenta"],
    cutField: "black",
  },
  {
    slug: "chrome-y2k",
    label: "Chrome Y2K",
    family: "pictorial",
    vibeSlug: "insatiable",
    aesthetic: "Y2K chrome render",
    linework:
      "liquid metal forms with sharp specular highlights and iridescent reflections",
    palette: ["chrome silver", "iridescent teal", "hot pink sheen", "pale lilac"],
    cutField: "black",
  },
  {
    slug: "surreal-collage",
    label: "Surreal Collage",
    family: "pictorial",
    vibeSlug: "insatiable",
    aesthetic: "cut-paper surrealist collage",
    linework:
      "hard-edged torn layers at mismatched scale, visible fibre texture, impossible juxtaposition",
    palette: ["faded sepia", "cobalt", "brick red", "muted olive"],
    cutField: "black",
  },

  // --- Untamed Worldwide --------------------------------------------------
  {
    slug: "spray-stencil",
    label: "Spray Stencil",
    family: "pictorial",
    vibeSlug: "untamed-worldwide",
    aesthetic: "multi-layer street stencil",
    linework:
      "hard-edged stencil cuts with overspray halo and slight layer misregistration",
    palette: ["stencil crimson", "concrete grey", "spray teal"],
    cutField: "black",
  },
  {
    slug: "folk-woodblock",
    label: "Folk Woodblock",
    family: "pictorial",
    vibeSlug: "untamed-worldwide",
    aesthetic: "ukiyo-e woodblock print",
    linework:
      "flat carved colour areas behind a keyblock outline, bokashi gradient, visible grain",
    palette: ["prussian blue", "vermilion", "clay ochre", "seafoam"],
    cutField: "black",
  },

  // --- Compound -----------------------------------------------------------
  {
    slug: "photoreal-render",
    label: "Photoreal Render",
    family: "pictorial",
    vibeSlug: "compound",
    aesthetic: "photographic studio render",
    linework:
      "physically based materials, soft key light with rim separation, shallow depth of field",
    palette: ["neutral studio grey", "brushed steel", "deep navy", "warm amber"],
    cutField: "black",
  },
  {
    slug: "pixel-art",
    label: "Pixel Art",
    family: "pictorial",
    vibeSlug: "compound",
    aesthetic: "16-bit pixel art sprite",
    linework:
      "hard pixel grid, strictly limited palette, ordered dithering, no anti-aliasing",
    palette: ["console red", "console blue", "sand", "forest green"],
    cutField: "black",
  },
  {
    slug: "cyberpunk-neon",
    label: "Cyberpunk Neon",
    family: "pictorial",
    vibeSlug: "compound",
    aesthetic: "neon-lit cyberpunk key art",
    linework:
      "hard rim lighting from coloured practicals, wet reflective surfaces, atmospheric haze",
    palette: ["neon magenta", "cyan glow", "amber signage", "deep indigo"],
    cutField: "black",
  },

  // --- Typographic --------------------------------------------------------
  {
    slug: "slab-statement",
    label: "Slab Statement",
    family: "typographic",
    vibeSlug: "riot",
    aesthetic: "bold slab-serif statement tee",
    linework:
      "heavy condensed slab letterforms, tight tracking, stacked baselines filling the frame",
    palette: ["molten orange", "bone white"],
    cutField: "black",
  },
  {
    slug: "blackletter",
    label: "Blackletter",
    family: "typographic",
    vibeSlug: "riot",
    aesthetic: "gothic blackletter lettering",
    linework:
      "dense fraktur strokes with sharp terminals and hairline flourishes between words",
    palette: ["solid ink stroke", "blood red accent"],
    cutField: "white",
  },
  {
    slug: "script-signature",
    label: "Script Signature",
    family: "typographic",
    vibeSlug: "dusk-atelier",
    aesthetic: "flowing script signature lettering",
    linework:
      "connected brush-script strokes with high thick-thin contrast and a long entry flourish",
    palette: ["antique gold", "dusty rose"],
    cutField: "black",
  },
  {
    slug: "retro-serif-stack",
    label: "Retro Serif Stack",
    family: "typographic",
    vibeSlug: "dusk-atelier",
    aesthetic: "1970s stacked serif lockup",
    linework:
      "tightly stacked lines of chunky retro serif on arced baselines, no gaps between rows",
    palette: ["burnt orange", "mustard", "faded rust"],
    cutField: "black",
  },
  {
    slug: "graffiti-tag",
    label: "Graffiti Tag",
    family: "typographic",
    vibeSlug: "untamed-worldwide",
    aesthetic: "marker graffiti tag",
    linework:
      "fast one-stroke marker script with drips, a hard outline and a trailing arrow",
    palette: ["marker charcoal", "spray silver"],
    cutField: "white",
  },
  // --- Illustrated: title + picture + quote, one lockup ---------------------
  {
    slug: "mythic-broadside",
    label: "Mythic Broadside",
    family: "illustrated",
    vibeSlug: "dusk-atelier",
    aesthetic:
      "aged mythological broadside poster, printed on dark stock, heavy paper grain and foxing",
    linework:
      "dense copperplate engraving and cross-hatching, a single heroic figure centred inside a rayed halo, thin ornamental rule framing the whole plate, arched title above and a two-line inscription below",
    // Keyed against black, and the dark ground in a broadside like this IS the
    // shirt — only the gold and bone ink actually prints. That is why these
    // belong on a dark garment.
    palette: ["antique gold", "aged parchment", "oxblood", "ember orange"],
    cutField: "black",
      fullBleed: true,
  },
  {
    slug: "occult-almanac",
    label: "Occult Almanac",
    family: "illustrated",
    vibeSlug: "insatiable",
    aesthetic:
      "esoteric almanac plate printed on pale stock, alchemical frontispiece",
    linework:
      "fine dark engraved linework with astrological marginalia, a central emblem ringed by symbols, arched title above and an inscription below, hairline border",
    // Dark ink on a pale plate — the light counterpart to mythic-broadside, so
    // the two broadside styles do not produce the same shirt twice.
    palette: ["iron gall", "deep indigo", "oxidised copper", "dried rose"],
    cutField: "white",
      fullBleed: true,
  },
  {
    slug: "anime-poster",
    label: "Anime Poster",
    family: "illustrated",
    vibeSlug: "late-bloomer",
    aesthetic:
      "late-1990s cel-animation OVA key visual, printed as a tour poster",
    // Rewritten against the gpt-image skill's anime gallery, which pairs every
    // subject with a dense "Art direction:" block. The earlier version named
    // only cel shading and speed lines and produced flat, generic output.
    //
    // Era and technique anchors, never a studio or franchise: these are printed
    // and sold, and "in the style of <studio>'s <show>" is the IP problem.
    linework:
      "polished high-end anime rendering, genga-quality crisp line art with varied line weight, soft cel shading in two hard tones, luminous eyes, a hard rim light separating the figure from the ground, motion streaks and speed lines where there is movement, saturated but never neon, a strong readable silhouette that still holds at t-shirt size, bold display title arched above and a short line beneath",
    palette: ["sky cyan", "sunset coral", "warm sand", "deep violet"],
    cutField: "black",
    fullBleed: true,
  },
  {
    slug: "anime-villain",
    label: "Anime Villain",
    family: "illustrated",
    vibeSlug: "riot",
    aesthetic:
      "anime antagonist key visual, high-contrast villain poster, cel-animation era",
    linework:
      "genga-quality crisp line art with heavy cel shading, the figure framed from below and lit from behind so a hard rim light carves it out of the dark, face half in shadow with one eye catching a specular highlight, drifting embers and motion streaks, deep blacks against a narrow band of saturated colour, never neon, a strong readable silhouette that still holds at t-shirt size, bold display title arched above and a short line beneath",
    // Deliberately colder and higher-contrast than anime-poster, so a hero and
    // a villain never come out looking like the same shirt.
    palette: ["blood crimson", "bruised violet", "sulphur yellow", "cold steel"],
    cutField: "black",
    fullBleed: true,
  },
  {
    slug: "varsity-lockup",
    label: "Varsity Lockup",
    family: "illustrated",
    vibeSlug: "compound",
    aesthetic: "collegiate athletic department lockup",
    linework:
      "heavy block collegiate letterforms with a contrasting outline, the first line arched over a much larger second line, a small star and a horizontal rule beneath, tight and symmetrical",
    palette: ["team navy", "cream", "signal gold"],
    cutField: "black",
    fullBleed: true,
  },
  {
    slug: "kinetic-type-grid",
    label: "Kinetic Type Grid",
    family: "typographic",
    vibeSlug: "compound",
    aesthetic: "kinetic typographic grid poster",
    linework:
      "the words repeated and warped across a strict modular grid, letters treated as pure shape",
    palette: ["signal yellow", "deep violet", "bone white"],
    cutField: "black",
    fullBleed: true,
  },
]

export function findStyle(slug: string): StylePreset | null {
  return STYLE_PRESETS.find((preset) => preset.slug === slug) ?? null
}

export function stylesForVibeSlug(vibeSlug: string): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => preset.vibeSlug === vibeSlug)
}

export type TextValidation =
  | { ok: true; text: string | null }
  | { ok: false; error: string }

/** Typographic styles need the words; pictorial styles have nowhere to put
 *  them. Text supplied against a pictorial style is rejected rather than
 *  dropped — silently discarding something the maker typed is worse than
 *  telling them it has nowhere to go. */
export function validateStyleText(
  style: StylePreset,
  text: string
): TextValidation {
  const trimmed = text.trim()

  // An illustrated style uses `text` as its title. The quote is validated
  // separately by validateQuote — two strings, two rules.
  if (style.family === "illustrated") {
    if (trimmed === "") {
      return { ok: false, error: "Give it a title — one or two words." }
    }
    if (trimmed.length > MAX_TITLE_CHARS) {
      return { ok: false, error: `Titles are ${MAX_TITLE_CHARS} characters or fewer.` }
    }
    if (trimmed.split(/\s+/).length > MAX_TITLE_WORDS) {
      return { ok: false, error: `Titles are ${MAX_TITLE_WORDS} words or fewer.` }
    }
    return { ok: true, text: trimmed }
  }

  if (style.family === "pictorial") {
    if (trimmed !== "") {
      return {
        ok: false,
        error: `"${style.label}" is a picture style — pick a text style to put words on the shirt.`,
      }
    }
    return { ok: true, text: null }
  }

  if (trimmed === "") {
    return { ok: false, error: "Type the words you want on the shirt." }
  }
  if (trimmed.length > MAX_TEXT_CHARS) {
    return { ok: false, error: `Keep it to ${MAX_TEXT_CHARS} characters or fewer.` }
  }
  if (trimmed.split(/\s+/).length > MAX_TEXT_WORDS) {
    return { ok: false, error: `Keep it to ${MAX_TEXT_WORDS} words or fewer.` }
  }

  return { ok: true, text: trimmed }
}

/** The line under the illustration. Only `illustrated` styles have one; every
 *  other family must be given an empty string, and is told so rather than
 *  having it silently dropped. */
export function validateQuote(
  style: StylePreset,
  quote: string
): TextValidation {
  const trimmed = quote.trim()

  if (style.family !== "illustrated") {
    if (trimmed !== "") {
      return {
        ok: false,
        error: `"${style.label}" has no line underneath — pick an illustrated style for that.`,
      }
    }
    return { ok: true, text: null }
  }

  if (trimmed === "") {
    return { ok: false, error: "Write the line that goes underneath." }
  }
  if (trimmed.length > MAX_QUOTE_CHARS) {
    return { ok: false, error: `Keep the line to ${MAX_QUOTE_CHARS} characters or fewer.` }
  }
  if (trimmed.split(/\s+/).length > MAX_QUOTE_WORDS) {
    return { ok: false, error: `Keep the line to ${MAX_QUOTE_WORDS} words or fewer.` }
  }

  return { ok: true, text: trimmed }
}
