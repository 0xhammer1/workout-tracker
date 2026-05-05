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
  if (period === 'week') {
    now.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    now.setMonth(now.getMonth() - 1)
  } else if (period === 'year') {
    now.setFullYear(now.getFullYear() - 1)
  } else {
    return null
  }
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
  const workouts = cutoff
    ? allWorkouts.filter((w) => w.date >= cutoff)
    : allWorkouts

  return (
    <div>
      <h1 className="text-2xl font-bold mt-6 mb-4">History</h1>

      <div className="flex gap-2 mb-6">
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-16">
          No workouts in this period.
        </p>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="block bg-slate-900 hover:bg-slate-800 rounded-2xl px-4 py-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {w.exerciseCount} exercise{w.exerciseCount !== 1 ? 's' : ''} · {w.setCount} set{w.setCount !== 1 ? 's' : ''}
                  </div>
                  {w.notes && <div className="text-sm text-slate-400 mt-1 italic">{w.notes}</div>}
                </div>
                <button
                  onClick={(e) => deleteWorkout(e, w.id)}
                  className="ml-3 mt-0.5 bg-red-950 hover:bg-red-900 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Delete
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
