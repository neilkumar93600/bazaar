/** Optional brand-voice nudge for the image prompt.
 *
 *  Distinct from StylePreset: a style fixes technique, palette and letterform
 *  family — the thing that must not drift. A persona only colours tone, so it
 *  layers on top of whatever style is chosen rather than competing with it.
 *  See composePrompt in ./compose.ts, which folds `voice` into the system
 *  instructions as a soft nudge, never a replacement for the style's rules.
 */
export type PersonaPreset = {
  slug: string
  label: string
  /** The picker's secondary line. */
  hint: string
  /** Folded into the image-prompt system instructions verbatim. Null for
   *  "standard" — no persona line at all rather than an empty one. */
  voice: string | null
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    slug: "standard",
    label: "Standard / Raw Concept",
    hint: "Direct prompt translation",
    voice: null,
  },
  {
    slug: "broadsheet",
    label: "Editorial Broadsheet",
    hint: "Paper white, ink linework, & lime accents",
    voice:
      "restrained editorial gravitas — considered, quiet confidence, broadsheet-poster reserve",
  },
  {
    slug: "cyberpunk",
    label: "Cyberpunk & High-Tech",
    hint: "Vivid neon glows & dark ink depth",
    voice: "urgent tech-noir attitude — electric, high-energy, a little dangerous",
  },
  {
    slug: "streetwear",
    label: "Underground Streetwear",
    hint: "Bold graphic prints & heavy lines",
    voice: "raw underground energy — confident, unpolished, a little defiant",
  },
]

export const DEFAULT_PERSONA_SLUG = "standard"

export function findPersona(slug: string): PersonaPreset | null {
  return PERSONA_PRESETS.find((preset) => preset.slug === slug) ?? null
}
