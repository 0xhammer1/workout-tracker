'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'

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

  useEffect(() => {
    async function load() {
      const { data: wsRaw } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })

      const ws = wsRaw as Workout[] | null
      if (!ws) { setLoading(false); return }

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

  async function deleteWorkout(e: React.MouseEvent, workoutId: string) {
    e.preventDefault()
    if (!confirm('Delete this workout?')) return
    await supabase.from('workouts').delete().eq('id', workoutId)
    setAllWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
  }

  const cutoff = startDateFor(period)
  const workouts = cutoff ? allWorkouts.filter((w) => w.date >= cutoff) : allWorkouts

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mt-8 mb-6">History</h1>

      <div className="flex gap-px mb-8" style={{ border: '1px solid #1c1c1c' }}>
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-colors"
            style={{
              background: period === value ? 'var(--gold)' : '#0d0d0d',
              color: period === value ? '#080808' : '#555',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-px">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse" style={{ background: '#111' }} />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-sm text-center py-16" style={{ color: '#444' }}>
          No workouts in this period.
        </p>
      ) : (
        <div>
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="flex items-center justify-between py-4 border-b transition-opacity hover:opacity-70"
              style={{ borderColor: '#1c1c1c' }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: '#f0ede8' }}>
                  {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-xs mt-0.5 tracking-wide" style={{ color: '#444' }}>
                  {w.exerciseCount} exercise{w.exerciseCount !== 1 ? 's' : ''} · {w.setCount} set{w.setCount !== 1 ? 's' : ''}
                </div>
                {w.notes && <div className="text-xs mt-0.5 italic" style={{ color: '#555' }}>{w.notes}</div>}
              </div>
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <button
                  onClick={(e) => deleteWorkout(e, w.id)}
                  className="text-xs tracking-wider uppercase transition-opacity hover:opacity-60"
                  style={{ color: '#6b2020' }}
                >
                  Delete
                </button>
                <span style={{ color: 'var(--gold)' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
