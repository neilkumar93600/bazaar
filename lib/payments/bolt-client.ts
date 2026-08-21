/** Loads Bolt's checkout script and opens the modal.
 *
 *  Bolt's checkout is an embedded modal rather than a page you redirect to, so
 *  the browser has to carry its own weight here: fetch their script once, hand
 *  it the token the server minted, and wait for a callback. There is no return
 *  trip through a success URL to hang fulfilment off.
 *
 *  ponytail: script host and element id are the two things that differ between
 *  Bolt's environments and their docs render badly enough that these are worth
 *  overriding without a code change. NEXT_PUBLIC_BOLT_CONNECT_URL wins if set;
 *  confirm the default against your merchant dashboard's install snippet.
 */

const CONNECT_URL =
  process.env.NEXT_PUBLIC_BOLT_CONNECT_URL ??
  (process.env.NEXT_PUBLIC_BOLT_ENV === "production"
    ? "https://connect.boltapp.com/connect.js"
    : "https://connect-sandbox.boltapp.com/connect.js")

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

/** One script tag, however many purchases. Cached as the promise rather than
 *  the result so two clicks in flight at once share a single load. */
function loadBolt(publishableKey: string): Promise<BoltCheckout> {
  if (window.BoltCheckout) return Promise.resolve(window.BoltCheckout)

  return (loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = CONNECT_URL
    script.async = true
    script.setAttribute("data-publishable-key", publishableKey)

    script.onload = () => {
      if (window.BoltCheckout) resolve(window.BoltCheckout)
      else reject(new Error("Bolt loaded but exposed no checkout."))
    }
    script.onerror = () => {
      // Cleared so a network blip doesn't poison every later attempt.
      loading = null
      reject(new Error("Bolt's checkout script failed to load."))
    }

    document.head.appendChild(script)
  }))
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
