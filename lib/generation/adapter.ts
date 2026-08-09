/** Image-generation adapter.
 *
 *  docs/TRD.md specifies `generate(prompt, references[], quality_tier)`.
 *  Deliberate deviation: `quality_tier` meant `draft | upscale`, a pricing
 *  concept that never shipped, while quality and aspect ratio are now direct
 *  user controls on the create form. `references` still stays in the signature,
 *  accepted and rejected rather than absent, which is what keeps reference
 *  uploads an additive change later.
 *
 *  The provider is a server-side detail and must never reach the client
 *  (docs/PRD.md: tiers are described "only by feel and price"). Never import
 *  this from a client component — it reads MUAPI_API_KEY, so doing so would
 *  fail the build rather than leak, but the rule is the point.
 */

import { runModel, fetchOutput } from "./muapi.ts"

export type AspectRatio = "1:1" | "3:4" | "4:3"
export type Quality = "low" | "medium" | "high"

/** MuAPI also accepts `auto`, `16:9` and `9:16`. None of the three are useful
 *  on a chest print, so they are not offered. The mockup uses object-contain,
 *  so artwork just sits shorter or wider in the print area rather than being
 *  cropped. */
export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "3:4", "4:3"]
export const QUALITIES: Quality[] = ["low", "medium", "high"]

export type GeneratedImage = {
  /** Raw PNG bytes, background already cut. Persisting them is the caller's job. */
  bytes: Uint8Array
  contentType: string
}

const TEXT_TO_IMAGE = "/gpt-image-2-text-to-image"
const BACKGROUND_REMOVER = "/ai-background-remover"

const RESOLUTION = "2K"

export async function generate(input: {
  prompt: string
  references: string[]
  aspectRatio: AspectRatio
  quality: Quality
  /** Which flat field the prompt keyed the artwork against. The remover needs
   *  to know what it is cutting, so this is not purely a prompt concern. */
  cutField: "black" | "white"
  /** Skip background removal and keep the artwork exactly as generated.
   *
   *  Set for full-bleed plates. `ai-background-remover` isolates a *subject*,
   *  and a poster has no single subject — asked to cut one, it keeps the
   *  character and deletes the title, the line and the scenery. The plate has
   *  to survive whole, and the garment matches its ground instead. */
  keepBackground?: boolean
}): Promise<GeneratedImage> {
  if (input.references.length > 0) {
    throw new Error("Reference images are not supported yet")
  }

  const generated = await runModel(TEXT_TO_IMAGE, {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    resolution: RESOLUTION,
    quality: input.quality,
  })

  return {
    bytes: await fetchOutput(
      input.keepBackground ? generated : await cutBackground(generated)
    ),
    contentType: "image/png",
  }
}

/** Artwork goes on cloth, so it cannot carry a background: an opaque field
 *  prints as a rectangle of ink and reads as a sticker on every mockup, drawn or
 *  photographic.
 *
 *  This is a second call rather than a flag because MuAPI's gpt-image-2 endpoint
 *  takes only prompt / aspect_ratio / resolution / quality — there is no
 *  transparency option to set. The prompt keys the artwork against one flat
 *  field precisely so this model has a clean edge to cut against. Which colour
 *  is per style (`StylePreset.cutField`): black for most, white for the
 *  black-ink styles that would otherwise be cut away along with the field.
 *
 *  Falls back to the opaque original on failure. A design with a white block
 *  behind it is worse than one without, but it is much better than a create flow
 *  that fails after the expensive call has already been paid for. */
async function cutBackground(imageUrl: string): Promise<string> {
  try {
    return await runModel(BACKGROUND_REMOVER, { image_url: imageUrl })
  } catch (error) {
    console.error("[generate] background removal failed, keeping opaque art:", error)
    return imageUrl
  }
}
