import { printifyConfig, printifyFetch } from "./client.ts"
import type { ShippingAddress } from "../orders/address.ts"

/** How Printify's ten statuses map onto our four.
 *
 *  Null means "no opinion" — leave `orders.status` where it is and record only
 *  the raw word. Guessing on an unrecognised status is how an order silently
 *  reads as fulfilled when it actually had issues. */
export function mapPrintifyStatus(
  raw: string
): "paid" | "fulfilled" | "refunded" | null {
  switch (raw) {
    case "in-production":
    case "sending-to-production":
    case "on-hold":
      return "paid"
    case "fulfilled":
    case "partially-fulfilled":
      return "fulfilled"
    case "canceled":
      return "refunded"
    default:
      return null
  }
}

/** Statuses we stop polling on. Anything else is still in flight. */
export const TERMINAL_PRINTIFY_STATUSES = ["fulfilled", "canceled"]

export type OrderPayload = {
  external_id: string
  line_items: { product_id: string; variant_id: number; quantity: number }[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: Record<string, string>
}

/** Pure, so the request body is testable without a network call. Field-name
 *  drift against Printify's snake_case is silent until a real order is
 *  rejected. */
export function buildOrderPayload({
  orderId,
  productId,
  variantId,
  address,
}: {
  orderId: string
  productId: string
  variantId: number
  address: ShippingAddress
}): OrderPayload {
  return {
    // Our order id. Printify treats it as the caller's key, so a retry cannot
    // create a second garment.
    external_id: orderId,
    line_items: [{ product_id: productId, variant_id: variantId, quantity: 1 }],
    // 1 is standard shipping. Express is not offered.
    shipping_method: 1,
    // We notify the buyer ourselves, through notify_on_order_status_change.
    send_shipping_notification: false,
    address_to: {
      first_name: address.firstName,
      last_name: address.lastName,
      email: address.email,
      phone: address.phone,
      country: address.country,
      region: address.region,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      zip: address.zip,
    },
  }
}

/** Off unless explicitly enabled.
 *
 *  Payment is still the mock adapter (lib/payments/checkout.ts). Submitting
 *  with this off would manufacture a real garment and ship it to a real address
 *  against money that never moved. Turning it on is a deliberate act and should
 *  not happen before real payment lands. */
export function ordersEnabled(): boolean {
  return process.env.PRINTIFY_SUBMIT_ORDERS === "true"
}

type PrintifyOrder = { id: string; status?: string }

/** Null when Printify isn't configured or submission is disabled — the caller
 *  treats that as "recorded but not sent", not as a failure. */
export async function submitPrintifyOrder(input: {
  orderId: string
  productId: string
  variantId: number
  address: ShippingAddress
}): Promise<{ printifyOrderId: string; status: string | null } | null> {
  const config = printifyConfig()
  if (!config || !ordersEnabled()) return null

  const created = await printifyFetch<PrintifyOrder>(
    config,
    `/v1/shops/${config.shopId}/orders.json`,
    { method: "POST", body: buildOrderPayload(input) }
  )

  return { printifyOrderId: created.id, status: created.status ?? null }
}

export async function fetchPrintifyOrderStatus(
  printifyOrderId: string
): Promise<string | null> {
  const config = printifyConfig()
  if (!config) return null

  const order = await printifyFetch<PrintifyOrder>(
    config,
    `/v1/shops/${config.shopId}/orders/${printifyOrderId}.json`
  )
  return order.status ?? null
}
