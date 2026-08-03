import { createClient } from "@/lib/supabase/server"

export type InboxThread = {
  otherUserId: string
  otherHandle: string
  otherAvatarUrl: string | null
  lastMessageBody: string
  lastMessageAt: string
  lastMessageIsMine: boolean
  unreadCount: number
}

export async function getInboxThreads(): Promise<InboxThread[] | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  const messageList = messages ?? []
  if (messageList.length === 0) return []

  const threadByOtherId = new Map<
    string,
    {
      lastMessageBody: string
      lastMessageAt: string
      lastMessageIsMine: boolean
      unreadCount: number
    }
  >()

  for (const m of messageList) {
    const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
    const isUnreadForMe = m.recipient_id === user.id && !m.read_at

    const existing = threadByOtherId.get(otherId)
    if (!existing) {
      threadByOtherId.set(otherId, {
        lastMessageBody: m.body,
        lastMessageAt: m.created_at,
        lastMessageIsMine: m.sender_id === user.id,
        unreadCount: isUnreadForMe ? 1 : 0,
      })
    } else if (isUnreadForMe) {
      existing.unreadCount += 1
    }
  }

  const otherIds = [...threadByOtherId.keys()]
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, handle, avatar_url")
    .in("id", otherIds)
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  return otherIds
    .map((otherId) => {
      const thread = threadByOtherId.get(otherId)!
      const profile = profileById.get(otherId)
      return {
        otherUserId: otherId,
        otherHandle: profile?.handle ?? "unknown",
        otherAvatarUrl: profile?.avatar_url ?? null,
        ...thread,
      }
    })
    .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
}

export type ThreadMessage = {
  id: string
  isMine: boolean
  body: string
  createdAt: string
}

export type ThreadDetail = {
  otherUserId: string
  otherHandle: string
  otherDisplayName: string | null
  otherAvatarUrl: string | null
  messages: ThreadMessage[]
}

export async function getThread(
  otherHandle: string
): Promise<ThreadDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: otherProfile } = await supabase
    .from("public_profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("handle", otherHandle)
    .maybeSingle()
  if (!otherProfile) return null

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })

  const messageList = messages ?? []

  const unreadIds = messageList
    .filter((m) => m.recipient_id === user.id && !m.read_at)
    .map((m) => m.id)
  if (unreadIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
  }

  return {
    otherUserId: otherProfile.id,
    otherHandle: otherProfile.handle,
    otherDisplayName: otherProfile.display_name,
    otherAvatarUrl: otherProfile.avatar_url,
    messages: messageList.map((m) => ({
      id: m.id,
      isMine: m.sender_id === user.id,
      body: m.body,
      createdAt: m.created_at,
    })),
  }
}
