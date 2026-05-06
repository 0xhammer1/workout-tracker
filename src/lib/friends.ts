import { supabase } from './supabase'

export interface FriendUser {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

export interface FriendRequestRow {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted'
  created_at: string
  responded_at: string | null
}

export async function searchUsers(query: string): Promise<FriendUser[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const { data, error } = await supabase.rpc('search_users', { query: trimmed })
  if (error || !data) return []
  return data as FriendUser[]
}

export async function sendFriendRequest(toUserId: string, fromUserId: string) {
  return supabase.from('friend_requests').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: 'pending',
  })
}

export async function acceptFriendRequest(requestId: string) {
  return supabase
    .from('friend_requests')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', requestId)
}

export async function deleteFriendRow(requestId: string) {
  return supabase.from('friend_requests').delete().eq('id', requestId)
}

export async function loadFriendData(userId: string) {
  const { data: rows } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  const requests = (rows ?? []) as FriendRequestRow[]

  const otherIds = new Set<string>()
  for (const r of requests) {
    otherIds.add(r.from_user_id === userId ? r.to_user_id : r.from_user_id)
  }

  let profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
  if (otherIds.size > 0) {
    const { data: pRows } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', [...otherIds])
    profiles = Object.fromEntries(
      (pRows ?? []).map((p) => [
        p.user_id as string,
        {
          display_name: p.display_name as string | null,
          avatar_url: p.avatar_url as string | null,
        },
      ])
    )
  }

  const friends: { request: FriendRequestRow; other: FriendUser }[] = []
  const incoming: { request: FriendRequestRow; other: FriendUser }[] = []
  const outgoing: { request: FriendRequestRow; other: FriendUser }[] = []

  for (const r of requests) {
    const otherId = r.from_user_id === userId ? r.to_user_id : r.from_user_id
    const profile = profiles[otherId] ?? { display_name: null, avatar_url: null }
    const other: FriendUser = {
      id: otherId,
      email: '',
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    }
    if (r.status === 'accepted') friends.push({ request: r, other })
    else if (r.from_user_id === userId) outgoing.push({ request: r, other })
    else incoming.push({ request: r, other })
  }

  return { friends, incoming, outgoing }
}

export type PrivacyLevel = 'none' | 'minimal' | 'type_only' | 'full'

export interface FeedWorkout {
  id: string
  date: string
  category: string | null
  user_id: string
  display_name: string | null
  avatar_url: string | null
  privacy: PrivacyLevel
}

export async function loadFriendsFeed(friendIds: string[]): Promise<FeedWorkout[]> {
  if (friendIds.length === 0) return []
  const { data: ws } = await supabase
    .from('workouts')
    .select('id, date, category, user_id')
    .in('user_id', friendIds)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (ws ?? []) as { id: string; date: string; category: string | null; user_id: string }[]
  if (rows.length === 0) return []

  const { data: pRows } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url, default_privacy')
    .in('user_id', friendIds)

  const profiles = Object.fromEntries(
    (pRows ?? []).map((p) => [
      p.user_id as string,
      {
        display_name: p.display_name as string | null,
        avatar_url: p.avatar_url as string | null,
        privacy: ((p.default_privacy as string) || 'full') as PrivacyLevel,
      },
    ])
  )

  return rows.map((w) => {
    const profile = profiles[w.user_id]
    const privacy = profile?.privacy ?? 'full'
    return {
      ...w,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      privacy,
      // strip category for users sharing only the fact that they worked out
      category: privacy === 'minimal' ? null : w.category,
    }
  })
}
