// Relative, with the extension, not the `@/` alias: scripts/generate-designs.ts
// imports this module through plain `node`, which resolves neither. The app's
// bundler is happy either way.
import { siteName, siteUrl } from "../site.ts"

const API_ORIGIN = "https://api.printify.com"

/** Printify rejects requests without one, and asks integrations to identify
 *  themselves. */
const USER_AGENT = `${siteName.replace(/\s+/g, "")} (${siteUrl})`

/** Every call is a network hop inside a request the user is waiting on (or an
 *  `after()` callback with its own budget) — none of them may hang. */
const TIMEOUT_MS = 15_000

export class PrintifyError extends Error {
  // Assigned in the body, not as constructor parameter properties: node's
  // type-stripping loader rejects those, and scripts/ runs this file directly.
  readonly status: number
  readonly body: string

  constructor(status: number, body: string, path: string) {
    super(`Printify ${status} on ${path}: ${body.slice(0, 200)}`)
    this.name = "PrintifyError"
    this.status = status
    this.body = body
  }
}

export type PrintifyConfig = {
  token: string
  shopId: string
  blueprintId: number
  printProviderId: number
}

/** Returns null when the integration isn't configured, which is a supported
 *  state rather than an error: the app runs without Printify and every surface
 *  falls back to the drawn mockup. Callers branch on null; they never throw for
 *  missing credentials. */
export function printifyConfig(): PrintifyConfig | null {
  const token = process.env.PRINTIFY_API_TOKEN
  const shopId = process.env.PRINTIFY_SHOP_ID
  const blueprintId = Number(process.env.PRINTIFY_BLUEPRINT_ID)
  const printProviderId = Number(process.env.PRINTIFY_PRINT_PROVIDER_ID)

  if (!token || !shopId) return null
  if (!Number.isInteger(blueprintId) || !Number.isInteger(printProviderId)) {
    return null
  }

  // No pinned variant list any more: the buyer picks the colour and size at
  // checkout, so a product has to carry every variant the provider offers. An
  // env var narrowing that set would silently make colours unbuyable.
  return { token, shopId, blueprintId, printProviderId }
}

export async function printifyFetch<T>(
  config: PrintifyConfig,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Catalog responses are cached by Printify and change rarely, but a product
    // read is polled for freshly generated mockups — never serve those from a
    // cache.
    cache: "no-store",
  })

  if (!response.ok) {
    throw new PrintifyError(response.status, await response.text(), path)
  }

  return (await response.json()) as T
}
