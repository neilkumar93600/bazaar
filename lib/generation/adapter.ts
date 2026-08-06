/** Image-generation adapter.
 *
 *  Signature is the one docs/TRD.md specifies —
 *  `generate(prompt, references[], quality_tier)` — so reference uploads and
 *  the paid upscale tier can land later without touching callers. Both are
 *  accepted and rejected here rather than being absent from the type, which
 *  is what keeps the eventual change additive.
 *
 *  The provider is a server-side detail and must never reach the client
 *  (docs/PRD.md: tiers are described "only by feel and price"). Never import
 *  this from a client component — it reads OPENAI_API_KEY, so doing so would
 *  fail the build rather than leak, but the rule is the point.
 */

export type QualityTier = "draft" | "upscale"

export type GeneratedImage = {
  /** Raw PNG bytes. Persisting them is the caller's job. */
  bytes: Uint8Array
  contentType: string
}

/** `draft` is the only tier this pass generates; see the spec. Kept as a map
 *  rather than a literal so adding `upscale` is a one-line change. */
const TIER_QUALITY: Record<QualityTier, "low" | "medium" | "high"> = {
  draft: "medium",
  upscale: "high",
}

const MODEL = "gpt-image-2"
const SIZE = "1024x1536" // portrait 2:3, matching the house composition

export async function generate(
  prompt: string,
  references: string[],
  tier: QualityTier,
): Promise<GeneratedImage> {
  if (references.length > 0) {
    throw new Error("Reference images are not supported yet")
  }
  if (tier !== "draft") {
    throw new Error(`Quality tier "${tier}" is not available yet`)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: SIZE,
      quality: TIER_QUALITY[tier],
      n: 1,
    }),
  })

  if (!response.ok) {
    // Body carries the actual reason (content policy, quota, bad key). Keep it
    // for the server log; the route is what decides the user-facing message.
    const detail = await response.text().catch(() => "")
    throw new Error(`Image generation failed (${response.status}): ${detail.slice(0, 500)}`)
  }

  const payload = (await response.json()) as {
    data?: { b64_json?: string }[]
  }
  const b64 = payload.data?.[0]?.b64_json
  if (!b64) throw new Error("Image generation returned no image data")

  return {
    bytes: Uint8Array.from(Buffer.from(b64, "base64")),
    contentType: "image/png",
  }
}
