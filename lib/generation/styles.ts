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

export type StyleFamily = "pictorial" | "typographic"

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
}

export const MAX_TEXT_WORDS = 7
export const MAX_TEXT_CHARS = 40

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
