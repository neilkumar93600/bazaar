import { createClient } from "@/lib/supabase/server"

export type MyOrder = {
  id: string
  designImageUrl: string | null
  qualityTier: string | null
  size: string | null
  placementFront: boolean
  placementBack: boolean
  amountCents: number
  status: "pending" | "paid" | "fulfilled" | "refunded"
  createdAt: string
}

export async function getMyOrders(): Promise<MyOrder[] | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, design_id, quality_tier, size, placement_front, placement_back, amount_cents, status, created_at"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  const orderList = orders ?? []
  if (orderList.length === 0) return []

  const designIds = [...new Set(orderList.map((o) => o.design_id))]
  const { data: designRows } = await supabase
    .from("designs")
    .select("id, image_url")
    .in("id", designIds)
  const imageByDesignId = new Map(
    (designRows ?? []).map((d) => [d.id, d.image_url])
  )

  return orderList.map((o) => ({
    id: o.id,
    designImageUrl: imageByDesignId.get(o.design_id) ?? null,
    qualityTier: o.quality_tier,
    size: o.size,
    placementFront: o.placement_front,
    placementBack: o.placement_back,
    amountCents: o.amount_cents,
    status: o.status as MyOrder["status"],
    createdAt: o.created_at,
  }))
}
