/** OpenRouter transport — text and vision chat completions.
 *
 *  Distinct from muapi.ts: MuAPI is this app's image *generation* pipeline
 *  (text-to-image, background removal). Style analysis needs a vision model
 *  reading multiple reference images at once and replying with prose, which
 *  is a plain OpenAI-compatible chat completion, so it talks to OpenRouter
 *  directly rather than through MuAPI's `openrouter-vision` passthrough —
 *  that passthrough caps `images_list` at 4 URLs (undocumented, discovered
 *  via its own 422), too few for a 10-50 image persona upload.
 */

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

const REQUEST_TIMEOUT_MS = 90_000

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured")
  return key
}

type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

type ChatResponse = {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string }
}

/** One vision chat completion: a system prompt, a text prompt, and however
 *  many reference images the model should look at together. */
export async function runVisionChat(params: {
  model: string
  systemPrompt: string
  prompt: string
  imageUrls: string[]
  maxTokens: number
}): Promise<string> {
  const content: ChatContent[] = [
    { type: "text", text: params.prompt },
    ...params.imageUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
  ]

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Shirt Bazaar",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content },
      ],
      max_tokens: params.maxTokens,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  })

  const result = (await response.json().catch(() => null)) as ChatResponse | null

  if (!response.ok) {
    throw new Error(
      `OpenRouter ${response.status} on chat/completions: ${result?.error?.message ?? "no detail"}`,
    )
  }

  const text = result?.choices?.[0]?.message?.content
  if (!text) throw new Error("OpenRouter returned no message content")

  return text
}
