import { createClient } from "@/lib/supabase/server"

export type NotificationPreferences = {
  notifyClaims: boolean
  notifyRoyalties: boolean
  notifyMessages: boolean
  notifyOrders: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notifyClaims: true,
  notifyRoyalties: true,
  notifyMessages: true,
  notifyOrders: true,
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("notification_preferences")
    .select("notify_claims, notify_royalties, notify_messages, notify_orders")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return DEFAULT_PREFERENCES

  return {
    notifyClaims: data.notify_claims,
    notifyRoyalties: data.notify_royalties,
    notifyMessages: data.notify_messages,
    notifyOrders: data.notify_orders,
  }
}

export type NotificationItem = {
  id: string
  type: "claim" | "royalty" | "message" | "order"
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
}

const NOTIFICATIONS_LIMIT = 20

export async function getNotifications(): Promise<{
  items: NotificationItem[]
  unreadCount: number
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATIONS_LIMIT),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ])

  return {
    items: (notifications ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: Boolean(n.read_at),
      createdAt: n.created_at,
    })),
    unreadCount: unreadCount ?? 0,
  }
}
