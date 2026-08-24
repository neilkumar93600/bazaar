/** Prompt -> storefront cover banner.
 *
 *  Server-only, same reason as theme-prompt.ts: it reaches MuAPI.
 *
 *  MODEL. `/gpt-image-2-text-to-image`, the same endpoint the design pipeline
 *  draws artwork with. It is called directly rather than through
 *  `lib/generation/adapter.ts`: that module's `AspectRatio` union is
 *  deliberately narrow (1:1, 3:4, 4:3 — the shapes that make sense on a chest
 *  print), and a cover banner is the one wide image in the product. MuAPI's
 *  own endpoint accepts 16:9, which the header then crops with object-cover.
 *
 *  Costs a real ~$0.09 per press, so it is its own button in settings rather
 *  than something the theming prompt fires off on every save.
 */

import { fetchOutput, runModel } from "@/lib/generation/muapi"

import { MAX_PROMPT_CHARS } from "./theme"

const TEXT_TO_IMAGE = "/gpt-image-2-text-to-image"

/** Wide: the header slot is 4:1 on mobile and 5:1 above it, and 16:9 is the
 *  widest shape this endpoint takes. object-cover trims the rest. */
const ASPECT_RATIO = "16:9"

const RESOLUTION = "2K"

/** A banner is a backdrop behind the avatar and the creator's name. "high"
 *  buys detail nobody reads at that size and costs more per press. */
const QUALITY = "medium"

/** Image models cannot spell. Every banner that came back with lettering in it
 *  came back with *misspelt* lettering, and the header already prints the
 *  creator's name over this — so the prompt bans text outright. */
const DIRECTION = [
  "Wide storefront cover banner for an apparel shop, edge-to-edge composition.",
  "No text, no lettering, no words, no logos, no watermarks, no people's faces.",
  "Keep the centre calm and uncluttered — a name and an avatar are printed over it.",
  "Style and palette:",
].join(" ")

export type GeneratedBanner = { bytes: Uint8Array; contentType: string }

/** Draws the banner. Persisting it is the caller's job — MuAPI's output URLs
 *  are short-lived CDN links. */
export async function generateBannerFromPrompt(prompt: string): Promise<GeneratedBanner> {
  const wanted = prompt.trim().slice(0, MAX_PROMPT_CHARS)
  if (!wanted) throw new Error("No prompt to draw a banner from")

  const url = await runModel(TEXT_TO_IMAGE, {
    prompt: `${DIRECTION} ${wanted}`,
    aspect_ratio: ASPECT_RATIO,
    resolution: RESOLUTION,
    quality: QUALITY,
  })

  return { bytes: await fetchOutput(url), contentType: "image/png" }
}
