'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'
import ConfirmDialog from '@/components/ConfirmDialog'
import CategoryBadge from '@/components/CategoryBadge'

interface WorkoutSummary extends Workout {
  exerciseCount: number
  setCount: number
}

type Period = 'week' | 'month' | 'year' | 'all'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
]

function startDateFor(period: Period): string | null {
  const now = new Date()
  if (period === 'week') now.setDate(now.getDate() - 7)
  else if (period === 'month') now.setMonth(now.getMonth() - 1)
  else if (period === 'year') now.setFullYear(now.getFullYear() - 1)
  else return null
  return now.toISOString().split('T')[0]
}

export default function HistoryPage() {
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('all')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: wsRaw } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })

      const ws = wsRaw as Workout[] | null
      if (!ws) {
        setLoading(false)
        return
      }

      const summaries: WorkoutSummary[] = await Promise.all(
        ws.map(async (w) => {
          const { data: sets } = await supabase
            .from('sets')
            .select('id, exercise_id')
            .eq('workout_id', w.id)
          const rows = sets as { id: string; exercise_id: string }[] | null
          const exerciseCount = new Set(rows?.map((s) => s.exercise_id)).size
          return { ...w, exerciseCount, setCount: rows?.length ?? 0 }
        })
      )
      setAllWorkouts(summaries)
      setLoading(false)
    }
    load()
  }, [])

  function requestDelete(e: React.MouseEvent, workoutId: string) {
    e.preventDefault()
    e.stopPropagation()
    setPendingDeleteId(workoutId)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    await supabase.from('workouts').delete().eq('id', pendingDeleteId)
    setAllWorkouts((prev) => prev.filter((w) => w.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  const cutoff = startDateFor(period)
  const workouts = cutoff ? allWorkouts.filter((w) => w.date >= cutoff) : allWorkouts

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight pt-8 mb-6">History</h1>

      <div
        className="flex p-1 mb-6 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: period === value ? 'var(--surface-elevated)' : 'transparent',
              color: period === value ? 'var(--text)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No workouts in this period.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {workouts.map((w, i) => (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="flex items-center justify-between px-4 py-4 transition-colors active:bg-white/5"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-medium">
                    {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <CategoryBadge category={w.category} />
                </div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {w.exerciseCount} exercise{w.exerciseCount !== 1 ? 's' : ''} · {w.setCount} set
                  {w.setCount !== 1 ? 's' : ''}
                </div>
                {w.notes && (
                  <div className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {w.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <button
                  onClick={(e) => requestDelete(e, w.id)}
                  className="text-sm font-medium transition-opacity active:opacity-60"
                  style={{ color: 'var(--danger)' }}
                >
                  Delete
                </button>
                <span className="text-lg" style={{ color: 'var(--text-tertiary)' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this workout?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
