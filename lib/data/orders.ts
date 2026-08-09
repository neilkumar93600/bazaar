import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import {
  fetchPrintifyOrderStatus,
  mapPrintifyStatus,
  TERMINAL_PRINTIFY_STATUSES,
} from "@/lib/printify/orders"

export type MyOrder = {
  id: string
  /** `claim` bought ownership of the design; `garment` bought a printed item. */
  kind: "claim" | "garment"
  designId: string
  designImageUrl: string | null
  size: string | null
  variantId: number | null
  amountCents: number
  status: "pending" | "paid" | "fulfilled" | "refunded"
  /** Printify's own word, which is finer-grained than `status`. */
  printifyStatus: string | null
  createdAt: string
}

/** How many open orders we will ask Printify about on one page render.
 *
 *  There is no webhook and no cron, so status is refreshed when the buyer looks
 *  at it. The cap is what stops a buyer with thirty open orders making thirty
 *  sequential API calls before the page renders. */
const MAX_STATUS_REFRESH = 10

export async function getMyOrders(): Promise<MyOrder[] | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, kind, design_id, size, variant_id, amount_cents, status, printify_status, printify_order_id, created_at"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  const orderList = orders ?? []
  if (orderList.length === 0) return []

  const refreshed = await refreshOpenOrders(orderList)

  const designIds = [...new Set(orderList.map((o) => o.design_id))]
  const { data: designRows } = await supabase
    .from("designs")
    .select("id, image_url")
    .in("id", designIds)
  const imageByDesignId = new Map(
    (designRows ?? []).map((d) => [d.id, d.image_url])
  )

  return orderList.map((o) => {
    const update = refreshed.get(o.id)
    return {
      id: o.id,
      kind: (o.kind ?? "claim") as MyOrder["kind"],
      designId: o.design_id,
      designImageUrl: imageByDesignId.get(o.design_id) ?? null,
      size: o.size,
      variantId: o.variant_id,
      amountCents: o.amount_cents,
      status: (update?.status ?? o.status) as MyOrder["status"],
      printifyStatus: update?.printifyStatus ?? o.printify_status,
      createdAt: o.created_at,
    }
  })
}

type OrderRow = {
  id: string
  kind: string | null
  printify_order_id: string | null
  printify_status: string | null
  status: string
}

/** Asks Printify about garment orders that are still in flight and writes back
 *  what it says.
 *
 *  Best-effort by design: a Printify outage must not break the orders page, so
 *  every failure is swallowed and the stored status is shown instead.
 *
 *  Writing `status` is also what makes `notify_on_order_status_change` fire, so
 *  buyers get order notifications without any extra plumbing. */
async function refreshOpenOrders(
  orders: OrderRow[]
): Promise<Map<string, { status: string; printifyStatus: string }>> {
  const results = new Map<string, { status: string; printifyStatus: string }>()

  const open = orders
    .filter(
      (order) =>
        order.kind === "garment" &&
        order.printify_order_id !== null &&
        !TERMINAL_PRINTIFY_STATUSES.includes(order.printify_status ?? "")
    )
    .slice(0, MAX_STATUS_REFRESH)

  if (open.length === 0) return results

  // Service role: `orders` has no client update policy — every write is made on
  // the buyer's behalf by trusted code.
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  await Promise.all(
    open.map(async (order) => {
      try {
        const raw = await fetchPrintifyOrderStatus(order.printify_order_id!)
        if (!raw || raw === order.printify_status) return

        // Null means Printify said something we don't have a mapping for.
        // Record the raw word and leave `status` alone rather than guessing.
        const mapped = mapPrintifyStatus(raw)
        const status = mapped ?? order.status

        await admin
          .from("orders")
          .update({ printify_status: raw, status })
          .eq("id", order.id)

        results.set(order.id, { status, printifyStatus: raw })
      } catch (error) {
        console.error(`[orders] status refresh failed for ${order.id}`, error)
      }
    })
  )

  return results
}
