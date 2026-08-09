/** MuAPI transport.
 *
 *  Every MuAPI model works the same way: POST the model's path, get a
 *  `request_id`, poll one shared result endpoint until `status` is terminal, and
 *  read a URL out of `outputs`. So this is one function, not one per model.
 *
 *  Relative `.ts` imports elsewhere in this file's neighbours exist because
 *  scripts/ runs them through plain node — nothing here imports anything, but
 *  keep it dependency-free for the same reason.
 */

const BASE_URL = "https://api.muapi.ai/api/v1"

/** Between polls. MuAPI's own sample uses 500ms; images take tens of seconds,
 *  so that is mostly wasted requests. */
const POLL_INTERVAL_MS = 2_000

/** Ceiling on one model run. Generation happens inside `after()` under the
 *  route's maxDuration of 300s, and a run has to leave room for the second call
 *  (background removal) plus the upload. */
const POLL_TIMEOUT_MS = 120_000

/** Per HTTP request. A hung socket must not eat the whole poll budget. */
const REQUEST_TIMEOUT_MS = 30_000

type SubmitResponse = { request_id?: string }

type PollResponse = {
  status?: string
  outputs?: unknown
  error?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function apiKey(): string {
  const key = process.env.MUAPI_API_KEY
  if (!key) throw new Error("MUAPI_API_KEY is not configured")
  return key
}

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "x-api-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`MuAPI ${response.status} on ${path}: ${detail.slice(0, 300)}`)
  }

  return (await response.json()) as T
}

/** `outputs` is an array of URLs in every model MuAPI documents, but the field
 *  is loosely typed across their playground samples (some show `output`), so
 *  narrow rather than index blindly. */
function firstOutputUrl(result: PollResponse): string | null {
  const outputs = result.outputs
  if (typeof outputs === "string") return outputs
  if (Array.isArray(outputs) && typeof outputs[0] === "string") return outputs[0]
  return null
}

/** Submits a MuAPI model run and blocks until it produces an output URL.
 *
 *  @param path model path, e.g. `/gpt-image-2-text-to-image`
 *  @param body the model's own parameters */
export async function runModel(
  path: string,
  body: Record<string, unknown>
): Promise<string> {
  const submitted = await call<SubmitResponse>(path, { method: "POST", body })
  const requestId = submitted.request_id

  if (!requestId) throw new Error(`MuAPI returned no request_id for ${path}`)

  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)

    const result = await call<PollResponse>(`/predictions/${requestId}/result`)

    if (result.status === "completed") {
      const url = firstOutputUrl(result)
      if (!url) throw new Error(`MuAPI ${path} completed with no output URL`)
      return url
    }

    if (result.status === "failed") {
      throw new Error(`MuAPI ${path} failed: ${result.error ?? "no reason given"}`)
    }
  }

  throw new Error(`MuAPI ${path} timed out after ${POLL_TIMEOUT_MS}ms (${requestId})`)
}

/** Downloads a MuAPI output. Its URLs are short-lived CDN links, so callers
 *  persist the bytes rather than storing the URL. */
export async function fetchOutput(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`Could not download MuAPI output (${response.status}): ${url}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}
