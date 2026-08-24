import { createClient } from "@/lib/supabase/server"
import { countRecentGenerations, DAILY_CAP } from "@/lib/generation/quota"
import { designLabel } from "@/lib/utils"

export type ActivityItem = {
  id: string
  type: "claim" | "royalty" | "order"
  label: string
  designImageUrl: string | null
  amountCents: number | null
  occurredAt: string
}

/** This calendar month against the one before it. Every "vs last month" figure
 *  on the dashboard is one of these pairs — none of them is estimated, and a
 *  pair of zeros renders as "no activity" rather than an invented percentage. */
export type MonthOverMonth = {
  royaltiesCents: number
  prevRoyaltiesCents: number
  orders: number
  prevOrders: number
  claims: number
  prevClaims: number
}

export type TopDesign = {
  id: string
  imageUrl: string | null
  label: string
  royaltyCents: number
}

export type DashboardOverview = {
  handle: string | null
  claimedCount: number
  orderCount: number
  totalRoyaltiesCents: number
  pendingRoyaltiesCents: number
  recentActivity: ActivityItem[]
  monthly: MonthOverMonth
  /** Last seven days, oldest first. Royalties are the only per-day signal this
   *  schema records — there is no view tracking, so the chart does not pretend
   *  to have any. */
  royaltyByDay: { day: string; cents: number }[]
  /** The user's designs ranked by what they have actually earned. */
  topDesigns: TopDesign[]
  /** Real generation allowance, from the same constant the API route enforces. */
  quota: { used: number; total: number }
}

const RECENT_ACTIVITY_LIMIT = 8
const TOP_DESIGNS_LIMIT = 5
const CHART_DAYS = 7

const monthKey = (iso: string) => iso.slice(0, 7)
const dayKey = (iso: string) => iso.slice(0, 10)

/** Sum of `amount_cents` over rows whose timestamp falls in `month`. */
function sumInMonth<T extends { amount_cents: number }>(
  rows: T[],
  month: string,
  at: (row: T) => string
) {
  return rows
    .filter((row) => monthKey(at(row)) === month)
    .reduce((sum, row) => sum + row.amount_cents, 0)
}

function countInMonth<T>(rows: T[], month: string, at: (row: T) => string) {
  return rows.filter((row) => monthKey(at(row)) === month).length
}

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: claims }, { data: royalties }, { data: orders }] =
    await Promise.all([
      supabase.from("profiles").select("handle").eq("id", user.id).single(),
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

  const [{ data: designRows }, generationsUsed] = await Promise.all([
    designIds.length
      ? supabase.from("designs").select("id, image_url, title").in("id", designIds)
      : Promise.resolve({ data: [] as { id: string; image_url: string; title: string | null }[] }),
    countRecentGenerations(supabase, user.id),
  ])

  const designById = new Map((designRows ?? []).map((d) => [d.id, d]))
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

  // Calendar months, in the server's zone. Good enough for a "vs last month"
  // caption; anything finer would need the user's zone, which nothing stores.
  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7)

  const monthly: MonthOverMonth = {
    royaltiesCents: sumInMonth(royaltyList, thisMonth, (r) => r.created_at),
    prevRoyaltiesCents: sumInMonth(royaltyList, prevMonth, (r) => r.created_at),
    orders: countInMonth(orderList, thisMonth, (o) => o.created_at),
    prevOrders: countInMonth(orderList, prevMonth, (o) => o.created_at),
    claims: countInMonth(claimList, thisMonth, (c) => c.claimed_at),
    prevClaims: countInMonth(claimList, prevMonth, (c) => c.claimed_at),
  }

  // Seven buckets always exist, so an empty week draws a flat chart rather
  // than a chart with missing days.
  const centsByDay = new Map<string, number>()
  for (const royalty of royaltyList) {
    const key = dayKey(royalty.created_at)
    centsByDay.set(key, (centsByDay.get(key) ?? 0) + royalty.amount_cents)
  }

  const royaltyByDay = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (CHART_DAYS - 1 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      day: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      cents: centsByDay.get(key) ?? 0,
    }
  })

  const royaltyByDesign = new Map<string, number>()
  for (const royalty of royaltyList) {
    if (!royalty.design_id) continue
    royaltyByDesign.set(
      royalty.design_id,
      (royaltyByDesign.get(royalty.design_id) ?? 0) + royalty.amount_cents
    )
  }

  const topDesigns: TopDesign[] = [...royaltyByDesign.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_DESIGNS_LIMIT)
    .map(([designId, cents]) => ({
      id: designId,
      imageUrl: imageByDesignId.get(designId) ?? null,
      label: designLabel(
        {
          title: designById.get(designId)?.title ?? null,
        },
        40
      ),
      royaltyCents: cents,
    }))

  return {
    handle: profile?.handle ?? null,
    claimedCount: claimList.length,
    orderCount: orderList.length,
    totalRoyaltiesCents,
    pendingRoyaltiesCents,
    recentActivity: activity,
    monthly,
    royaltyByDay,
    topDesigns,
    // null from the counter means the query failed, not that nothing was used.
    // Showing 0 used would invite a user to generate past a cap the route will
    // then enforce, so an unknown count reads as the cap being spent.
    quota: { used: generationsUsed ?? DAILY_CAP, total: DAILY_CAP },
  }
}
