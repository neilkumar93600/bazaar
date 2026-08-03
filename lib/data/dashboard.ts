import { createClient } from "@/lib/supabase/server"

export type ActivityItem = {
  id: string
  type: "claim" | "royalty" | "order"
  label: string
  designImageUrl: string | null
  amountCents: number | null
  occurredAt: string
}

export type DashboardOverview = {
  claimedCount: number
  orderCount: number
  totalRoyaltiesCents: number
  pendingRoyaltiesCents: number
  recentActivity: ActivityItem[]
}

const RECENT_ACTIVITY_LIMIT = 8

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: claims }, { data: royalties }, { data: orders }] =
    await Promise.all([
      supabase
        .from("claims")
        .select("id, design_id, claimed_at")
        .eq("claimant_id", user.id)
        .order("claimed_at", { ascending: false }),
      supabase
        .from("royalty_ledger")
        .select("id, design_id, amount_cents, paid_at, created_at")
        .eq("original_claimant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, design_id, amount_cents, status, created_at")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false }),
    ])

  const claimList = claims ?? []
  const royaltyList = royalties ?? []
  const orderList = orders ?? []

  const designIds = [
    ...new Set(
      [...claimList, ...royaltyList, ...orderList]
        .map((r) => r.design_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const { data: designRows } = designIds.length
    ? await supabase.from("designs").select("id, image_url").in("id", designIds)
    : { data: [] }
  const imageByDesignId = new Map(
    (designRows ?? []).map((d) => [d.id, d.image_url])
  )

  const totalRoyaltiesCents = royaltyList.reduce(
    (sum, r) => sum + r.amount_cents,
    0
  )
  const pendingRoyaltiesCents = royaltyList
    .filter((r) => !r.paid_at)
    .reduce((sum, r) => sum + r.amount_cents, 0)

  const activity: ActivityItem[] = [
    ...claimList.map((c) => ({
      id: `claim-${c.id}`,
      type: "claim" as const,
      label: "Claimed a design",
      designImageUrl: imageByDesignId.get(c.design_id) ?? null,
      amountCents: null,
      occurredAt: c.claimed_at,
    })),
    ...royaltyList.map((r) => ({
      id: `royalty-${r.id}`,
      type: "royalty" as const,
      label: r.paid_at ? "Royalty paid out" : "Royalty earned",
      designImageUrl: imageByDesignId.get(r.design_id) ?? null,
      amountCents: r.amount_cents,
      occurredAt: r.created_at,
    })),
    ...orderList.map((o) => ({
      id: `order-${o.id}`,
      type: "order" as const,
      label: `Order ${o.status}`,
      designImageUrl: imageByDesignId.get(o.design_id) ?? null,
      amountCents: o.amount_cents,
      occurredAt: o.created_at,
    })),
  ]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, RECENT_ACTIVITY_LIMIT)

  return {
    claimedCount: claimList.length,
    orderCount: orderList.length,
    totalRoyaltiesCents,
    pendingRoyaltiesCents,
    recentActivity: activity,
  }
}
