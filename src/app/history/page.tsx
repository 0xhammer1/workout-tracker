'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'
import ConfirmDialog from '@/components/ConfirmDialog'
import CategoryBadge from '@/components/CategoryBadge'
import { useAuth } from '@/lib/auth'
import { localDateStr } from '@/lib/dates'
import {
  muscleForExercise,
  type MuscleGroup,
  infoFor,
  majorGroupFor,
  MAJOR_GROUPS,
  MAJOR_LABEL,
  MAJOR_COLOR,
  type MajorGroup,
} from '@/lib/muscleGroups'

interface WorkoutSummary extends Workout {
  exerciseCount: number
  setCount: number
  muscleCounts: Map<MuscleGroup, number>
  majorCounts: Partial<Record<MajorGroup, number>>
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
  return localDateStr(now)
}

interface SetRow {
  id: string
  workout_id: string
  exercises: { name: string; muscle_group: string | null } | null
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: wsRaw } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      const ws = wsRaw as Workout[] | null
      if (!ws || ws.length === 0) {
        setAllWorkouts([])
        setLoading(false)
        return
      }

      const { data: setsRaw } = await supabase
        .from('sets')
        .select('id, workout_id, exercises(name, muscle_group)')
        .in(
          'workout_id',
          ws.map((w) => w.id)
        )

      const sets = (setsRaw ?? []) as unknown as SetRow[]

      const setsByWorkout = new Map<string, SetRow[]>()
      for (const s of sets) {
        const list = setsByWorkout.get(s.workout_id) ?? []
        list.push(s)
        setsByWorkout.set(s.workout_id, list)
      }

      const summaries: WorkoutSummary[] = ws.map((w) => {
        const wSets = setsByWorkout.get(w.id) ?? []
        const muscleCounts = new Map<MuscleGroup, number>()
        const majorCounts: Partial<Record<MajorGroup, number>> = {}
        const exerciseSet = new Set<string>()
        for (const s of wSets) {
          if (!s.exercises) continue
          exerciseSet.add(s.exercises.name)
          const m = muscleForExercise(s.exercises).group
          muscleCounts.set(m, (muscleCounts.get(m) ?? 0) + 1)
          const major = majorGroupFor(s.exercises)
          if (major) majorCounts[major] = (majorCounts[major] ?? 0) + 1
        }
        return {
          ...w,
          exerciseCount: exerciseSet.size,
          setCount: wSets.length,
          muscleCounts,
          majorCounts,
        }
      })
      setAllWorkouts(summaries)
      setLoading(false)
    }
    load()
  }, [user?.id])

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

  const weeklySummary = (() => {
    if (period !== 'week') return null
    const days = new Set(workouts.map((w) => w.date))
    const totals: Partial<Record<MajorGroup, number>> = {}
    for (const w of workouts) {
      for (const [g, n] of Object.entries(w.majorCounts)) {
        totals[g as MajorGroup] = (totals[g as MajorGroup] ?? 0) + (n ?? 0)
      }
    }
    return { dayCount: days.size, totals }
  })()

  return (
    <div>
      <header className="pt-8 mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <Link
          href="/progress"
          className="px-4 py-2 text-sm font-semibold rounded-full transition-all active:scale-95 flex items-center gap-1.5"
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Personal Records
        </Link>
      </header>

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

      {weeklySummary && !loading && workouts.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
              Sets This Week
            </p>
            <p className="text-sm font-medium">
              <span className="text-lg font-bold">{weeklySummary.dayCount}</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {' '}day{weeklySummary.dayCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MAJOR_GROUPS.map((g) => {
              const n = weeklySummary.totals[g] ?? 0
              const c = MAJOR_COLOR[g]
              return (
                <div
                  key={g}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: c.bg }}
                >
                  <span className="text-xs font-semibold" style={{ color: c.color }}>
                    {MAJOR_LABEL[g]}
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: c.color }}>
                    {n}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
          {workouts.map((w, i) => {
            const muscles = [...w.muscleCounts.entries()].sort((a, b) => b[1] - a[1])
            return (
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
                  {muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {muscles.map(([m, n]) => {
                        const info = infoFor(m)
                        return (
                          <span
                            key={m}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                            style={{ background: info.bg, color: info.color }}
                          >
                            {info.label}
                            <span className="tabular-nums opacity-80">{n}</span>
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {w.notes && (
                    <div className="text-sm mt-1.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
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
            )
          })}
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
