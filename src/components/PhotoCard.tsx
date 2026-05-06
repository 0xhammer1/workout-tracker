'use client'

import { useState } from 'react'
import {
  toggleReaction,
  addComment,
  deleteComment,
  type WorkoutPhoto,
  type PhotoReaction,
  type PhotoComment,
} from '@/lib/photos'

export interface CommenterInfo {
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  photo: WorkoutPhoto
  reactions: PhotoReaction[]
  comments: PhotoComment[]
  currentUserId: string
  /** Map of user_id → display_name + avatar for everyone who appears in comments */
  commenters: Record<string, CommenterInfo>
  onChange: () => void
}

export default function PhotoCard({
  photo,
  reactions,
  comments,
  currentUserId,
  commenters,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingReaction, setPendingReaction] = useState<'heart' | 'flame' | null>(null)

  const heartCount = reactions.filter((r) => r.reaction === 'heart').length
  const flameCount = reactions.filter((r) => r.reaction === 'flame').length
  const myHeart = reactions.some((r) => r.reaction === 'heart' && r.user_id === currentUserId)
  const myFlame = reactions.some((r) => r.reaction === 'flame' && r.user_id === currentUserId)

  async function handleReact(kind: 'heart' | 'flame') {
    setPendingReaction(kind)
    try {
      await toggleReaction(photo.id, currentUserId, kind, reactions)
      onChange()
    } finally {
      setPendingReaction(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setSubmitting(true)
    try {
      await addComment(photo.id, currentUserId, draft)
      setDraft('')
      onChange()
    } catch (err) {
      alert(`Could not post: ${(err as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    await deleteComment(commentId)
    onChange()
  }

  const visibleComments = expanded ? comments : comments.slice(-1)

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ background: 'var(--surface-elevated)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.public_url} alt="Workout photo" className="w-full h-auto block" />

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => handleReact('heart')}
            disabled={pendingReaction !== null}
            className="flex items-center gap-1 transition-opacity active:opacity-60 disabled:opacity-40"
            aria-label="Heart"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={myHeart ? '#ef4444' : 'none'}
              stroke={myHeart ? '#ef4444' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {heartCount > 0 && (
              <span className="text-sm font-semibold tabular-nums">{heartCount}</span>
            )}
          </button>

          <button
            onClick={() => handleReact('flame')}
            disabled={pendingReaction !== null}
            className="flex items-center gap-1 transition-opacity active:opacity-60 disabled:opacity-40"
            aria-label="Flame"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={myFlame ? '#f97316' : 'none'}
              stroke={myFlame ? '#f97316' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            {flameCount > 0 && (
              <span className="text-sm font-semibold tabular-nums">{flameCount}</span>
            )}
          </button>

          <div className="flex items-center gap-1 ml-auto" style={{ color: 'var(--text-tertiary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {comments.length > 0 && (
              <span className="text-sm font-semibold tabular-nums">{comments.length}</span>
            )}
          </div>
        </div>

        {comments.length > 1 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs font-medium mb-1 transition-opacity active:opacity-60"
            style={{ color: 'var(--text-tertiary)' }}
          >
            View all {comments.length} comments
          </button>
        )}

        {visibleComments.map((c) => {
          const author = commenters[c.user_id] ?? { display_name: null, avatar_url: null }
          const name = author.display_name ?? '—'
          const canDelete = c.user_id === currentUserId || photo.user_id === currentUserId
          return (
            <div key={c.id} className="text-sm py-0.5 flex items-start gap-2">
              <span className="font-semibold shrink-0">{name}</span>
              <span className="break-words flex-1">{c.body}</span>
              {canDelete && (
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete comment"
                  className="shrink-0 transition-opacity active:opacity-60"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || submitting}
            className="text-sm font-semibold transition-opacity active:opacity-60 disabled:opacity-40"
            style={{ color: 'var(--accent)' }}
          >
            {submitting ? '…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  )
}
