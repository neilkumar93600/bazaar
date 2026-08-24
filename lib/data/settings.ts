import { createClient } from "@/lib/supabase/server"
import { DEFAULT_THEME, parseTheme, type StorefrontTheme } from "@/lib/storefront/theme"

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
  bannerUrl: string | null
  bio: string | null
  storefrontTheme: StorefrontTheme
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url, bio")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  // Same guarded read as lib/data/storefront.ts — both columns landed after the
  // baseline schema, so neither may be allowed to fail the settings page.
  let bannerUrl: string | null = null
  let storefrontTheme = DEFAULT_THEME
  try {
    const { data: extra } = await supabase
      .from("profiles")
      .select("banner_url, storefront_theme")
      .eq("id", user.id)
      .single()
    if (extra) {
      const row = extra as { banner_url?: string | null; storefront_theme?: unknown }
      bannerUrl = row.banner_url ?? null
      if (row.storefront_theme) storefrontTheme = parseTheme(row.storefront_theme)
    }
  } catch {
    bannerUrl = null
  }

  const { data: royalties } = await supabase
    .from("royalty_ledger")
    .select("id, amount_cents, paid_at, created_at")
    .eq("original_claimant_id", user.id)
    .order("created_at", { ascending: false })

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
    handle: profile.handle ?? "",
    displayName: profile.display_name ?? null,
    avatarUrl: profile.avatar_url ?? null,
    bannerUrl,
    bio: (profile as Record<string, unknown>).bio as string | null ?? null,
    storefrontTheme,
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
