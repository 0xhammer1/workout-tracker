'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  loadFriendProfile,
  type FriendProfileData,
} from '@/lib/friends'
import {
  BADGES,
  earnedBadgeIds,
  previewBadges,
  type BadgeCategory,
} from '@/lib/badges'
import { CATEGORIES, type Category } from '@/lib/categories'
import Avatar from '@/components/Avatar'
import CategoryBadge from '@/components/CategoryBadge'
import { BadgeChip, BadgeRow } from '@/components/BadgeChip'

export default function FriendProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<FriendProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllBadges, setShowAllBadges] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.id === id) {
      router.replace('/profile')
      return
    }
    loadFriendProfile(user.id, id).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [user?.id, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="pt-8">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium mb-6 transition-opacity active:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          ‹ Back
        </button>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Profile not available.
        </p>
      </div>
    )
  }

  const name = data.profile.display_name ?? '—'
  const earnedIds = earnedBadgeIds({
    workoutCount: data.workoutCount,
    categoriesEverDone: data.categoriesEverDone,
    photoCount: data.photoCount,
    maxPhotoReactions: data.maxPhotoReactions,
    workoutCopyCount: data.workoutCopyCount,
  })
  const previewBadgeList = previewBadges(earnedIds)

  return (
    <div>
      <div className="pt-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium mb-4 transition-opacity active:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          ‹ Back
        </button>
        <div className="flex items-center gap-4 mt-2">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden shrink-0"
            style={{ border: '1px solid var(--border)' }}
          >
            <Avatar src={data.profile.avatar_url} name={name} size={80} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{name}</h1>
          </div>
        </div>
      </div>

      {/* Lifetime workouts */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          Lifetime Workouts
        </p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">{data.workoutCount}</p>
      </div>

      {/* Badges */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Badges
          </p>
          {earnedIds.size > 0 && (
            <button
              onClick={() => setShowAllBadges(true)}
              className="text-xs font-semibold transition-opacity active:opacity-60"
              style={{ color: 'var(--accent)' }}
            >
              See all
            </button>
          )}
        </div>
        {previewBadgeList.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No badges yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {previewBadgeList.map((b) => (
              <BadgeChip key={b.id} badge={b} earned />
            ))}
          </div>
        )}
      </div>

      {/* Activity log */}
      {data.privacyLevel !== 'none' && data.recentWorkouts.length > 0 && (
        <div className="mb-3">
          <p
            className="text-xs font-semibold tracking-wider uppercase mb-2 px-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Activity
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {data.recentWorkouts.map((w, i) => {
              const dateLabel = new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
              const validCategory =
                w.category && (CATEGORIES as readonly string[]).includes(w.category)
                  ? (w.category as Category)
                  : null
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-sm font-semibold shrink-0">{dateLabel}</p>
                    {validCategory && <CategoryBadge category={validCategory} />}
                  </div>
                  {data.privacyLevel === 'full' && (
                    <Link
                      href={`/workout/${w.id}`}
                      className="text-sm font-semibold shrink-0 transition-opacity active:opacity-60"
                      style={{ color: 'var(--accent)' }}
                    >
                      Details →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All badges modal */}
      {showAllBadges && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowAllBadges(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">All Badges</h2>
              <button
                onClick={() => setShowAllBadges(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors active:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {(['count', 'type', 'social', 'influence'] as BadgeCategory[]).map((cat) => {
              const items = BADGES.filter((b) => b.category === cat)
              const labels: Record<BadgeCategory, string> = {
                count: 'Workout Milestones',
                type: 'Workout Types',
                social: 'Social',
                influence: 'Influence',
              }
              return (
                <div key={cat} className="mb-5 last:mb-0">
                  <p
                    className="text-xs font-semibold tracking-wider uppercase mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {labels[cat]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((b) => (
                      <BadgeRow key={b.id} badge={b} earned={earnedIds.has(b.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
