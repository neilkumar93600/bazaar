/** Loads Bolt's checkout script and opens the modal.
 *
 *  Bolt's checkout is an embedded modal rather than a page you redirect to, so
 *  the browser has to carry its own weight here: fetch their script once, hand
 *  it the token the server minted, and wait for a callback. There is no return
 *  trip through a success URL to hang fulfilment off.
 *
 *  ponytail: the CDN host is the one thing that differs between Bolt's
 *  environments. NEXT_PUBLIC_BOLT_CDN_URL overrides it if the default ever
 *  drifts from your merchant dashboard's install snippet.
 */

const CDN_URL =
  process.env.NEXT_PUBLIC_BOLT_CDN_URL ??
  (process.env.NEXT_PUBLIC_BOLT_ENV === "production"
    ? "https://connect.boltapp.com"
    : "https://connect-sandbox.boltapp.com")

type BoltCheckout = {
  configure: (
    cart: { orderToken: string },
    hints: Record<string, unknown>,
    callbacks: {
      success?: (payload: Record<string, unknown>, callback: () => void) => void
      close?: () => void
      onError?: (error: unknown) => void
    },
  ) => { open: () => void }
}

declare global {
  interface Window {
    BoltCheckout?: BoltCheckout
  }
}

let loading: Promise<BoltCheckout> | null = null

function loadScript(id: string, src: string, publishableKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.setAttribute("data-publishable-key", publishableKey)
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Bolt's ${src} failed to load.`))
    document.head.appendChild(script)
  })
}

/** Two script tags, however many purchases. Cached as the promise rather than
 *  the result so two clicks in flight at once share a single load.
 *
 *  track.js must load alongside connect.js — Bolt's install snippet requires
 *  both, and without track.js connect.js loads fine but silently never
 *  exposes window.BoltCheckout. */
function loadBolt(publishableKey: string): Promise<BoltCheckout> {
  if (window.BoltCheckout) return Promise.resolve(window.BoltCheckout)

  return (loading ??= (async () => {
    try {
      await Promise.all([
        loadScript("bolt-track", `${CDN_URL}/track.js`, publishableKey),
        loadScript("bolt-connect", `${CDN_URL}/connect.js`, publishableKey),
      ])
    } catch (error) {
      loading = null
      throw error
    }

    if (!window.BoltCheckout) {
      loading = null
      throw new Error("Bolt loaded but exposed no checkout.")
    }
    return window.BoltCheckout
  })())
}

export type BoltResult =
  | { status: "success"; reference: string }
  | { status: "closed" }

/** Opens the modal and resolves once the shopper is done with it.
 *
 *  The reference in the success payload is the only thing worth keeping, and
 *  even that is only a lookup key — the server re-reads the transaction from
 *  Bolt before it claims anything, so a tampered payload buys nothing.
 */
export async function openBoltCheckout(
  orderToken: string,
  publishableKey: string,
): Promise<BoltResult> {
  const bolt = await loadBolt(publishableKey)

  return new Promise<BoltResult>((resolve, reject) => {
    const checkout = bolt.configure(
      { orderToken },
      {},
      {
        success(payload, callback) {
          const reference =
            typeof payload?.reference === "string"
              ? payload.reference
              : typeof payload?.transaction_reference === "string"
                ? payload.transaction_reference
                : ""

          // Bolt's contract: call this to let the modal finish closing. Do it
          // before resolving so the shopper isn't looking at a dead overlay
          // while fulfilment runs.
          callback()
          resolve({ status: "success", reference })
        },
        close() {
          resolve({ status: "closed" })
        },
        onError(error) {
          reject(error instanceof Error ? error : new Error("Bolt checkout failed."))
        },
      },
    )

    checkout.open()
  })
}
