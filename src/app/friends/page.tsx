'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendRow,
  loadFriendData,
  loadFriendsFeed,
  type FriendUser,
  type FriendRequestRow,
  type FeedWorkout,
} from '@/lib/friends'
import Avatar from '@/components/Avatar'
import CategoryBadge from '@/components/CategoryBadge'
import PhotoCard, { type CommenterInfo } from '@/components/PhotoCard'
import {
  loadPhotosForWorkouts,
  loadReactionsForPhotos,
  loadCommentsForPhotos,
  type WorkoutPhoto,
  type PhotoReaction,
  type PhotoComment,
} from '@/lib/photos'
import { supabase } from '@/lib/supabase'

interface FriendEntry {
  request: FriendRequestRow
  other: FriendUser
}

export default function FriendsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [incoming, setIncoming] = useState<FriendEntry[]>([])
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([])
  const [feed, setFeed] = useState<FeedWorkout[]>([])
  const [photosByWorkout, setPhotosByWorkout] = useState<Record<string, WorkoutPhoto[]>>({})
  const [reactionsByPhoto, setReactionsByPhoto] = useState<Record<string, PhotoReaction[]>>({})
  const [commentsByPhoto, setCommentsByPhoto] = useState<Record<string, PhotoComment[]>>({})
  const [commenters, setCommenters] = useState<Record<string, CommenterInfo>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FriendUser[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  // commenters seed map from friend profiles + current user — refreshSocial will
  // fold in any stragglers (friends-of-friends commenting on shared photos).
  const friendCommenterSeed = useMemo(() => {
    const map: Record<string, CommenterInfo> = {}
    for (const f of friends) {
      map[f.other.id] = {
        display_name: f.other.display_name,
        avatar_url: f.other.avatar_url,
      }
    }
    return map
  }, [friends])

  async function refresh() {
    if (!user) return
    setLoading(true)
    const data = await loadFriendData(user.id)
    setFriends(data.friends)
    setIncoming(data.incoming)
    setOutgoing(data.outgoing)
    const feedRows = await loadFriendsFeed(data.friends.map((f) => f.other.id))
    setFeed(feedRows)
    await refreshSocial(feedRows)
    setLoading(false)
  }

  async function refreshSocial(feedRows: FeedWorkout[]) {
    if (!user) return
    const photos = await loadPhotosForWorkouts(feedRows.map((w) => w.id))
    setPhotosByWorkout(photos)

    const photoIds = Object.values(photos).flat().map((p) => p.id)
    const [reactions, comments] = await Promise.all([
      loadReactionsForPhotos(photoIds),
      loadCommentsForPhotos(photoIds),
    ])
    setReactionsByPhoto(reactions)
    setCommentsByPhoto(comments)

    // Build commenters map: friends + current user + anyone else whose profile
    // we can read (RLS will silently drop the ones we can't).
    const seenIds = new Set<string>()
    for (const list of Object.values(comments)) {
      for (const c of list) seenIds.add(c.user_id)
    }
    seenIds.add(user.id)

    const map: Record<string, CommenterInfo> = { ...friendCommenterSeed }
    const missing = [...seenIds].filter((id) => !(id in map))
    if (missing.length > 0) {
      const { data: rows } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', missing)
      for (const r of rows ?? []) {
        map[r.user_id as string] = {
          display_name: r.display_name as string | null,
          avatar_url: r.avatar_url as string | null,
        }
      }
    }
    setCommenters(map)
  }

  async function refreshSocialOnly() {
    await refreshSocial(feed)
  }

  useEffect(() => {
    if (user) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim().length < 2) return
    setSearchError(null)
    setSearchResults(null)
    setSearching(true)
    try {
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
    } catch (err) {
      setSearchError((err as Error).message)
    } finally {
      setSearching(false)
    }
  }

  async function send(target: FriendUser) {
    if (!user) return
    const existing =
      friends.find((f) => f.other.id === target.id) ||
      incoming.find((f) => f.other.id === target.id) ||
      outgoing.find((f) => f.other.id === target.id)
    if (existing) {
      setSearchError('You already have a request or friendship with this user.')
      return
    }
    setSending(target.id)
    const { error } = await sendFriendRequest(target.id, user.id)
    setSending(null)
    if (error) {
      setSearchError(error.message)
      return
    }
    setSearchResults((prev) => prev?.filter((u) => u.id !== target.id) ?? null)
    refresh()
  }

  async function accept(entry: FriendEntry) {
    await acceptFriendRequest(entry.request.id)
    refresh()
  }

  async function decline(entry: FriendEntry) {
    await deleteFriendRow(entry.request.id)
    refresh()
  }

  async function cancel(entry: FriendEntry) {
    await deleteFriendRow(entry.request.id)
    refresh()
  }

  async function unfriend(entry: FriendEntry) {
    await deleteFriendRow(entry.request.id)
    refresh()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight pt-8 mb-6">Friends</h1>

      {/* Search */}
      <form
        onSubmit={search}
        className="rounded-2xl p-4 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
          Add a friend by name or email
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 text-base rounded-xl outline-none"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            type="submit"
            disabled={searching || searchQuery.trim().length < 2}
            className="px-5 py-3 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {searching ? '…' : 'Find'}
          </button>
        </div>

        {searchResults && searchResults.length === 0 && (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            No matches. They might need to sign up first, or check the spelling.
          </p>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface-elevated)' }}
              >
                <div
                  className="w-10 h-10 rounded-full overflow-hidden shrink-0"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <Avatar
                    src={u.avatar_url}
                    name={u.display_name ?? u.email}
                    size={40}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {u.display_name ?? u.email}
                  </p>
                  {u.display_name && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {u.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => send(u)}
                  disabled={sending !== null}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {sending === u.id ? '…' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {searchError && (
          <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }}>
            {searchError}
          </p>
        )}
      </form>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <Section title={`Pending (${incoming.length})`}>
          {incoming.map((entry) => (
            <Row key={entry.request.id} entry={entry}>
              <button
                onClick={() => accept(entry)}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all active:scale-95"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Accept
              </button>
              <button
                onClick={() => decline(entry)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-opacity active:opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                Decline
              </button>
            </Row>
          ))}
        </Section>
      )}

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <Section title="Sent">
          {outgoing.map((entry) => (
            <Row key={entry.request.id} entry={entry}>
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ color: 'var(--text-tertiary)', background: 'var(--surface-elevated)' }}>
                Pending
              </span>
              <button
                onClick={() => cancel(entry)}
                className="text-sm font-medium transition-opacity active:opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </Row>
          ))}
        </Section>
      )}

      {/* Activity feed */}
      <Section title="Activity">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-elevated)' }} />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
            Add friends to see their workouts here.
          </p>
        ) : feed.length === 0 ? (
          <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
            No workouts from your friends yet.
          </p>
        ) : (
          <div className="space-y-3">
            {feed.map((w) => (
              <FeedRow
                key={w.id}
                workout={w}
                photos={photosByWorkout[w.id] ?? []}
                reactionsByPhoto={reactionsByPhoto}
                commentsByPhoto={commentsByPhoto}
                commenters={commenters}
                currentUserId={user?.id ?? ''}
                onSocialChange={refreshSocialOnly}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Friends list */}
      {friends.length > 0 && (
        <Section title={`Friends (${friends.length})`}>
          {friends.map((entry) => (
            <Row key={entry.request.id} entry={entry}>
              <button
                onClick={() => unfriend(entry)}
                className="text-sm font-medium transition-opacity active:opacity-60"
                style={{ color: 'var(--danger)' }}
              >
                Unfriend
              </button>
            </Row>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold tracking-wider uppercase mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </p>
      <div
        className="rounded-2xl p-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({
  entry,
  children,
}: {
  entry: FriendEntry
  children: React.ReactNode
}) {
  const name = entry.other.display_name ?? entry.other.email ?? '—'
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div
        className="w-10 h-10 rounded-full overflow-hidden shrink-0"
        style={{ border: '1px solid var(--border)' }}
      >
        <Avatar src={entry.other.avatar_url} name={name} size={40} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}

interface FeedRowProps {
  workout: FeedWorkout
  photos: WorkoutPhoto[]
  reactionsByPhoto: Record<string, PhotoReaction[]>
  commentsByPhoto: Record<string, PhotoComment[]>
  commenters: Record<string, CommenterInfo>
  currentUserId: string
  onSocialChange: () => void
}

function FeedRow({
  workout,
  photos,
  reactionsByPhoto,
  commentsByPhoto,
  commenters,
  currentUserId,
  onSocialChange,
}: FeedRowProps) {
  const name = workout.display_name ?? '—'
  const dateLabel = new Date(workout.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const action =
    workout.privacy === 'minimal' ? 'worked out' : 'completed a workout'

  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-10 h-10 rounded-full overflow-hidden shrink-0"
          style={{ border: '1px solid var(--border)' }}
        >
          <Avatar src={workout.avatar_url} name={name} size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{name}</span>
            <span style={{ color: 'var(--text-secondary)' }}> {action}</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {dateLabel}
          </p>
        </div>
        {workout.category && <CategoryBadge category={workout.category} />}
      </div>

      {photos.length > 0 && (
        <div className="mt-2">
          {photos.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              reactions={reactionsByPhoto[p.id] ?? []}
              comments={commentsByPhoto[p.id] ?? []}
              currentUserId={currentUserId}
              commenters={commenters}
              onChange={onSocialChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
