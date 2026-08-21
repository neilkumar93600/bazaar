/** Bolt, the payment processor.
 *
 *  No SDK — Bolt publishes an OpenAPI spec and three HTTP calls is the whole
 *  server-side integration:
 *
 *    POST /v1/merchant/orders            mint an order token for the modal
 *    GET  /v1/merchant/transactions/:ref read back what actually happened
 *    (webhook)                           Bolt tells us a payment landed
 *
 *  Optional the same way Printify is: with no BOLT_API_KEY the app builds and
 *  runs, and a *priced* purchase is the only thing that refuses. Free claims
 *  never touch this file.
 *
 *  The shape worth understanding: Bolt's checkout is an embedded modal, not a
 *  hosted page you redirect to. The server's job is to mint a token; the
 *  browser opens the modal with it. So there is no "checkout URL" here and no
 *  return trip to key fulfilment off — the webhook is the primary signal, and
 *  the modal's success callback is the fast one.
 */

import { envValue } from "@/lib/site"

/** Sandbox until BOLT_ENV says otherwise. The safer default by a mile: a
 *  mistake here means charging real cards from a dev branch. */
function apiBase() {
  return envValue("BOLT_ENV") === "production"
    ? "https://api.boltapp.com"
    : "https://api-sandbox.boltapp.com"
}

export function boltConfigured() {
  return Boolean(envValue("BOLT_API_KEY"))
}

function apiKey(): string {
  const key = envValue("BOLT_API_KEY")
  if (!key) {
    throw new Error("BOLT_API_KEY is not set — priced purchases are off.")
  }
  return key
}

async function boltFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Bolt ${init?.method ?? "GET"} ${path} — ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

export type OrderTokenInput = {
  /** Ours. Bolt requires it unique per successful transaction, and it is the
   *  only thing that crosses the wire — everything we know about the buyer
   *  stays in checkout_intents, keyed by this. */
  orderReference: string
  designId: string
  designLabel: string
  imageUrl: string
  priceCents: number
}

/** Mints the token the browser needs to open the Bolt modal. */
export async function createOrderToken(input: OrderTokenInput): Promise<string> {
  const data = await boltFetch("/v1/merchant/orders", {
    method: "POST",
    body: JSON.stringify({
      channel: "browser",
      cart: {
        order_reference: input.orderReference,
        // Bolt requires the field; it can be an empty string, and we have no
        // second id worth showing a shopper.
        display_id: "",
        currency: "USD",
        total_amount: input.priceCents,
        items: [
          {
            reference: input.designId,
            name: input.designLabel,
            // `digital`: there is nothing to ship. It is also what keeps Bolt
            // from asking the shopper for a delivery address.
            type: "digital",
            unit_price: input.priceCents,
            total_amount: input.priceCents,
            quantity: 1,
            image_url: input.imageUrl,
            details_url: `${envValue("NEXT_PUBLIC_SITE_URL") ?? ""}/design/${input.designId}`,
          },
        ],
      },
    }),
  })

  const token = data?.token
  if (typeof token !== "string" || !token) {
    throw new Error("Bolt returned no order token.")
  }
  return token
}

/** What Bolt says about a transaction, reduced to the four facts fulfilment
 *  needs. Every field in Bolt's response is nullable — their spec says so
 *  explicitly — so nothing here assumes a shape. */
export type BoltTransaction = {
  reference: string
  status: string
  amountCents: number | null
  orderReference: string | null
}

/** `completed` is an auto-captured payment; `authorized` is a manual capture
 *  that has cleared risk. Both mean the money is committed. Anything else —
 *  `pending` under fraud review, `rejected_*`, `failed` — must not claim a
 *  design, because a claim is permanent and a reversal is not. */
const SETTLED = new Set(["completed", "authorized"])

export function isSettled(status: string) {
  return SETTLED.has(status)
}

/** Re-reads the transaction from Bolt rather than trusting what arrived.
 *
 *  The webhook is signed, so its body is authentic — but the success callback
 *  in the browser is not, and both paths funnel through here. Asking Bolt
 *  directly means one answer, from the only party that knows. */
export async function getTransaction(reference: string): Promise<BoltTransaction> {
  const data = await boltFetch(`/v1/merchant/transactions/${encodeURIComponent(reference)}`)

  return {
    reference: typeof data?.reference === "string" ? data.reference : reference,
    status: typeof data?.status === "string" ? data.status : "unknown",
    amountCents: typeof data?.amount?.amount === "number" ? data.amount.amount : null,
    orderReference:
      typeof data?.order?.cart?.order_reference === "string"
        ? data.order.cart.order_reference
        : null,
  }
}

/** Gives the money back, in full.
 *
 *  Bolt processes credits synchronously, so a success here means refunded —
 *  not queued. The only caller is the race in fulfilment where somebody else
 *  claimed the design first, which is exactly the case where a buyer must not
 *  be left paid-up with nothing to show for it. */
export async function creditTransaction(reference: string, amountCents: number) {
  await boltFetch("/v1/merchant/transactions/credit", {
    method: "POST",
    body: JSON.stringify({
      transaction_reference: reference,
      amount: amountCents,
      currency: "USD",
    }),
  })
}

/** Bolt signs the raw body with the dashboard's signing secret: HMAC-SHA256,
 *  Base64, in X-Bolt-Hmac-Sha256.
 *
 *  timingSafeEqual, not `===`: comparing two strings byte by byte leaks where
 *  they first differ, and a forger who can measure that can find a valid
 *  signature one byte at a time. */
export async function verifyWebhook(rawBody: string, signature: string | null) {
  const secret = envValue("BOLT_SIGNING_SECRET")
  if (!secret || !signature) return false

  const { createHmac, timingSafeEqual } = await import("node:crypto")

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64")

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)

  // timingSafeEqual throws on a length mismatch, which is itself an answer.
  return a.length === b.length && timingSafeEqual(a, b)
}
