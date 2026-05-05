'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'
import CategoryBadge from '@/components/CategoryBadge'
import MuscleBadge from '@/components/MuscleBadge'
import RecoveryStrip from '@/components/RecoveryStrip'
import { suggestWorkout, startSuggestedWorkout, type Suggestion } from '@/lib/suggest'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/categories'
import { useAuth } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [startingSuggested, setStartingSuggested] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentWorkouts(data ?? [])
        setLoading(false)
      })

    suggestWorkout().then(setSuggestion)
  }, [])

  useEffect(() => {
    if (!user) return
    const fallback =
      (user.user_metadata as { full_name?: string; name?: string })?.full_name ||
      (user.user_metadata as { name?: string })?.name ||
      user.email?.split('@')[0] ||
      'You'
    supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName((data?.display_name as string) || fallback)
      })
  }, [user])

  async function startSuggested() {
    if (!suggestion) return
    setStartingSuggested(true)
    const id = await startSuggestedWorkout(suggestion)
    if (id) router.push(`/workout/${id}`)
    else setStartingSuggested(false)
  }

  async function startWorkout() {
    setStarting(true)
    const { data, error } = await supabase
      .from('workouts')
      .insert({ date: new Date().toISOString().split('T')[0] })
      .select()
      .single()
    if (data) {
      sessionStorage.setItem('freshWorkoutId', data.id as string)
      router.push(`/workout/${data.id}`)
    } else {
      alert(`Error: ${error?.message}`)
      setStarting(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div>
      <header className="pt-8 pb-8">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {greeting}
        </p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
          Track your gains.
        </p>
      </header>

      <button
        onClick={startWorkout}
        disabled={starting}
        className="w-full font-semibold text-base py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 mb-6"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        {starting ? 'Starting…' : 'Build Your Own Workout'}
      </button>

      <RecoveryStrip />

      {suggestion && (
        <div
          className="rounded-2xl p-5 mb-10"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Suggested Today
            </p>
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full shrink-0"
              style={{
                background: CATEGORY_COLORS[suggestion.category].bg,
                color: CATEGORY_COLORS[suggestion.category].color,
              }}
            >
              {CATEGORY_LABELS[suggestion.category]}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {suggestion.reason}
          </p>

          {suggestion.exercises.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {suggestion.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-elevated)' }}
                >
                  <span className="text-sm font-medium truncate">{ex.name}</span>
                  <MuscleBadge exercise={ex} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              No previous {CATEGORY_LABELS[suggestion.category]} day to copy from — start fresh.
            </p>
          )}

          <button
            onClick={startSuggested}
            disabled={startingSuggested}
            className="w-full font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: CATEGORY_COLORS[suggestion.category].bg,
              color: CATEGORY_COLORS[suggestion.category].color,
              border: `1px solid ${CATEGORY_COLORS[suggestion.category].color}55`,
            }}
          >
            {startingSuggested ? 'Starting…' : `Start ${CATEGORY_LABELS[suggestion.category]} Day`}
          </button>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Recent Workouts
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No workouts yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Tap Start to begin.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {recentWorkouts.map((w, i) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="flex items-center justify-between px-4 py-4 transition-colors active:bg-white/5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-medium">
                      {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <CategoryBadge category={w.category} />
                  </div>
                  {w.notes && (
                    <div className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {w.notes}
                    </div>
                  )}
                </div>
                <span className="text-lg ml-2" style={{ color: 'var(--text-tertiary)' }}>›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
