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

  const flexCount = reactions.filter((r) => r.reaction === 'heart').length
  const hotCount = reactions.filter((r) => r.reaction === 'flame').length
  const myFlex = reactions.some((r) => r.reaction === 'heart' && r.user_id === currentUserId)
  const myHot = reactions.some((r) => r.reaction === 'flame' && r.user_id === currentUserId)

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
            aria-label="Flex"
          >
            <span className="text-xl leading-none" style={{ opacity: myFlex ? 1 : 0.35 }}>💪</span>
            {flexCount > 0 && (
              <span className="text-sm font-semibold tabular-nums">{flexCount}</span>
            )}
          </button>

          <button
            onClick={() => handleReact('flame')}
            disabled={pendingReaction !== null}
            className="flex items-center gap-1 transition-opacity active:opacity-60 disabled:opacity-40"
            aria-label="Hot"
          >
            <span className="text-xl leading-none" style={{ opacity: myHot ? 1 : 0.35 }}>🥵</span>
            {hotCount > 0 && (
              <span className="text-sm font-semibold tabular-nums">{hotCount}</span>
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
