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
  /** Raw PNG bytes, exactly as the model drew them — background included.
   *  Persisting them is the caller's job. */
  bytes: Uint8Array
  contentType: string
}

const TEXT_TO_IMAGE = "/gpt-image-2-text-to-image"
const BACKGROUND_REMOVER = "/ai-background-remover"

const RESOLUTION = "2K"

/** Draws the artwork. Nothing else.
 *
 *  Background removal used to run here, automatically, on every generation.
 *  It doesn't any more — see `removeBackground`. The prompt still keys the
 *  artwork against one flat field (`StylePreset.cutField`), because that flat
 *  field is exactly what gives the remover a clean edge whenever the maker
 *  decides to use it.
 */
export async function generate(input: {
  prompt: string
  references: string[]
  aspectRatio: AspectRatio
  quality: Quality
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
    bytes: await fetchOutput(generated),
    contentType: "image/png",
  }
}

/** Cuts the flat field off a finished design, on demand.
 *
 *  Artwork that goes on cloth generally shouldn't carry a background: an opaque
 *  field prints as a rectangle of ink and reads as a sticker on the mockup. But
 *  it is the maker's call, not the pipeline's — `ai-background-remover`
 *  isolates a *subject*, and on a poster with a title and a line it keeps the
 *  character and deletes everything else. Run automatically it silently
 *  destroyed those; run from a button, the maker sees the result and can decide.
 *
 *  A second model call rather than a flag because MuAPI's gpt-image-2 endpoint
 *  takes only prompt / aspect_ratio / resolution / quality — there is no
 *  transparency option to set.
 *
 *  Throws on failure. Unlike the old inline version there is nothing to salvage
 *  by returning the original: the caller is a button press, and a maker who
 *  asked for this needs to be told it didn't happen.
 */
export async function removeBackground(imageUrl: string): Promise<GeneratedImage> {
  const cut = await runModel(BACKGROUND_REMOVER, { image_url: imageUrl })

  return {
    bytes: await fetchOutput(cut),
    contentType: "image/png",
  }
}
