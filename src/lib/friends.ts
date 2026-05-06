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

// Save a friend's workout as the user's next suggested workout. Doesn't
// create a workout row yet — that happens when the user starts it from home.
export async function queueWorkoutFromFriend(
  selfId: string,
  sourceWorkoutId: string,
  sourceUserId: string
): Promise<{ ok: true } | { error: string }> {
  // upsert so this still works even if the user_profiles row was somehow
  // missing — handle_new_user() trigger should always create one but better
  // to defend against drift.
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: selfId,
        queued_source_workout_id: sourceWorkoutId,
        queued_source_user_id: sourceUserId,
      },
      { onConflict: 'user_id' }
    )
  if (error) return { error: error.message }
  return { ok: true }
}

export interface QueuedWorkoutInfo {
  source_workout_id: string
  source_user_id: string
  source_display_name: string | null
  source_avatar_url: string | null
  category: string | null
  exercise_ids: string[]
}

// Read the queued workout pointer plus enough source info to display it on
// the home screen. Returns null if no queue is set or if it can't be resolved
// (e.g. friendship ended or source workout was deleted).
export async function loadQueuedWorkout(selfId: string): Promise<QueuedWorkoutInfo | null> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('queued_source_workout_id, queued_source_user_id')
    .eq('user_id', selfId)
    .maybeSingle()

  const sourceId = profile?.queued_source_workout_id as string | null
  const sourceUserId = profile?.queued_source_user_id as string | null
  if (!sourceId || !sourceUserId) return null

  const [{ data: source }, { data: sets }, { data: friendProfile }] = await Promise.all([
    supabase.from('workouts').select('id, category').eq('id', sourceId).maybeSingle(),
    supabase.from('sets').select('exercise_id').eq('workout_id', sourceId),
    supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', sourceUserId)
      .maybeSingle(),
  ])

  if (!source) {
    // Source deleted or no longer visible — clear the queue.
    await clearQueuedWorkout(selfId)
    return null
  }

  const exercise_ids = [
    ...new Set(((sets ?? []) as { exercise_id: string }[]).map((s) => s.exercise_id)),
  ]

  return {
    source_workout_id: source.id as string,
    source_user_id: sourceUserId,
    source_display_name: (friendProfile?.display_name as string | null) ?? null,
    source_avatar_url: (friendProfile?.avatar_url as string | null) ?? null,
    category: (source.category as string | null) ?? null,
    exercise_ids,
  }
}

export async function clearQueuedWorkout(selfId: string) {
  return supabase
    .from('user_profiles')
    .update({ queued_source_workout_id: null, queued_source_user_id: null })
    .eq('user_id', selfId)
}

// Materialize the queued workout: create the workout row for today and
// clear the queue. Returns the new workout id + exercise IDs to pre-populate.
export async function consumeQueuedWorkout(
  selfId: string,
  queued: QueuedWorkoutInfo
): Promise<{ newWorkoutId: string; exerciseIds: string[] } | { error: string }> {
  const today = new Date().toISOString().split('T')[0]
  const { data: created, error } = await supabase
    .from('workouts')
    .insert({ date: today, category: queued.category })
    .select('id')
    .single()
  if (error || !created) return { error: error?.message ?? 'Could not create workout' }

  await clearQueuedWorkout(selfId)
  return { newWorkoutId: created.id as string, exerciseIds: queued.exercise_ids }
}

export async function loadFeed(selfId: string, friendIds: string[]): Promise<FeedWorkout[]> {
  const allIds = [selfId, ...friendIds]
  const { data: ws } = await supabase
    .from('workouts')
    .select('id, date, category, user_id')
    .in('user_id', allIds)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (ws ?? []) as { id: string; date: string; category: string | null; user_id: string }[]
  if (rows.length === 0) return []

  const { data: pRows } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url, default_privacy')
    .in('user_id', allIds)

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
    // Show our own workouts in full regardless of the privacy level we chose
    // for sharing — the privacy setting only affects what friends see.
    const privacy: PrivacyLevel = w.user_id === selfId ? 'full' : profile?.privacy ?? 'full'
    return {
      ...w,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      privacy,
      // strip category for friends sharing only the fact that they worked out
      category: privacy === 'minimal' ? null : w.category,
    }
  })
}
