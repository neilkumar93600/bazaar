import { createClient } from "@/lib/supabase/server"

export type PayoutEntry = {
  id: string
  amountCents: number
  status: "paid" | "pending"
  paidAt: string | null
  createdAt: string
}

export type SettingsData = {
  email: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  totalEarnedCents: number
  pendingCents: number
  paidOutCents: number
  payouts: PayoutEntry[]
}

export async function getSettingsData(): Promise<SettingsData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: royalties }] = await Promise.all([
    supabase
      .from("profiles")
      .select("handle, display_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("royalty_ledger")
      .select("id, amount_cents, paid_at, created_at")
      .eq("original_claimant_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  const royaltyList = royalties ?? []
  const totalEarnedCents = royaltyList.reduce(
    (sum, r) => sum + r.amount_cents,
    0
  )
  const paidOutCents = royaltyList
    .filter((r) => r.paid_at)
    .reduce((sum, r) => sum + r.amount_cents, 0)
  const pendingCents = totalEarnedCents - paidOutCents

  return {
    email: user.email ?? "",
    handle: profile?.handle ?? "",
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    totalEarnedCents,
    pendingCents,
    paidOutCents,
    payouts: royaltyList.map((r) => ({
      id: r.id,
      amountCents: r.amount_cents,
      status: r.paid_at ? "paid" : "pending",
      paidAt: r.paid_at,
      createdAt: r.created_at,
    })),
  }
}
