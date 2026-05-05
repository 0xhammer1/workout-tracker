'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import ProgressChart from '@/components/ProgressChart'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/lib/categories'

interface ChartPoint {
  date: string
  maxWeight: number
  totalVolume: number
}

type Period = 'week' | 'month' | 'year' | 'all'
type Mode = 'exercise' | 'category'

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

export default function ProgressPage() {
  const [mode, setMode] = useState<Mode>('exercise')
  const [period, setPeriod] = useState<Period>('month')

  // Exercise mode state
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>('maxWeight')

  // Category mode state
  const [selectedCategory, setSelectedCategory] = useState<Category>('push')

  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)

  // Load exercises (for exercise mode)
  useEffect(() => {
    supabase
      .from('sets')
      .select('exercise_id, exercises!inner(id, name, created_at)')
      .then(({ data }) => {
        if (!data) return
        const seen = new Set<string>()
        const unique: Exercise[] = []
        for (const row of data) {
          const ex = row.exercises as unknown as Exercise
          if (!seen.has(ex.id)) {
            seen.add(ex.id)
            unique.push(ex)
          }
        }
        unique.sort((a, b) => a.name.localeCompare(b.name))
        setExercises(unique)
        if (unique.length > 0 && !selectedId) setSelectedId(unique[0].id)
      })
  }, [selectedId])

  // Load chart data based on mode/period/selection
  useEffect(() => {
    setLoading(true)
    const cutoff = startDateFor(period)

    if (mode === 'exercise') {
      if (!selectedId) {
        setChartData([])
        setLoading(false)
        return
      }
      supabase
        .from('sets')
        .select('weight, reps, workouts!inner(date)')
        .eq('exercise_id', selectedId)
        .not('weight', 'is', null)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (!data) {
            setChartData([])
            setLoading(false)
            return
          }
          const byDate = new Map<string, { weights: number[]; volume: number }>()
          for (const row of data) {
            const date = (row.workouts as unknown as { date: string }).date
            if (cutoff && date < cutoff) continue
            const w = Number(row.weight)
            const r = Number(row.reps ?? 0)
            if (!byDate.has(date)) byDate.set(date, { weights: [], volume: 0 })
            const entry = byDate.get(date)!
            entry.weights.push(w)
            entry.volume += w * r
          }
          const points: ChartPoint[] = Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, { weights, volume }]) => ({
              date,
              maxWeight: Math.max(...weights),
              totalVolume: Math.round(volume),
            }))
          setChartData(points)
          setLoading(false)
        })
    } else {
      // Category mode: aggregate volume per workout in selected category
      supabase
        .from('sets')
        .select('weight, reps, workout_id, workouts!inner(date, category)')
        .not('weight', 'is', null)
        .then(({ data }) => {
          if (!data) {
            setChartData([])
            setLoading(false)
            return
          }
          const byDate = new Map<string, { volume: number; maxWeight: number }>()
          for (const row of data) {
            const meta = row.workouts as unknown as { date: string; category: string | null }
            if (meta.category !== selectedCategory) continue
            if (cutoff && meta.date < cutoff) continue
            const w = Number(row.weight)
            const r = Number(row.reps ?? 0)
            if (!byDate.has(meta.date)) byDate.set(meta.date, { volume: 0, maxWeight: 0 })
            const entry = byDate.get(meta.date)!
            entry.volume += w * r
            if (w > entry.maxWeight) entry.maxWeight = w
          }
          const points: ChartPoint[] = Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, { volume, maxWeight }]) => ({
              date,
              maxWeight,
              totalVolume: Math.round(volume),
            }))
          setChartData(points)
          setLoading(false)
        })
    }
  }, [mode, period, selectedId, selectedCategory])

  const totalVolume = chartData.reduce((sum, p) => sum + p.totalVolume, 0)
  const sessions = chartData.length
  const avg = sessions > 0 ? Math.round(totalVolume / sessions) : 0

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight pt-8 mb-6">Progress</h1>

      {/* Mode toggle */}
      <div
        className="flex p-1 mb-3 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {(['exercise', 'category'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize"
            style={{
              background: mode === m ? 'var(--surface-elevated)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-secondary)',
            }}
          >
            By {m}
          </button>
        ))}
      </div>

      {/* Time period */}
      <div
        className="flex p-1 mb-4 rounded-xl"
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

      {mode === 'exercise' && exercises.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Log some workouts first to see progress charts.
          </p>
        </div>
      ) : (
        <>
          {mode === 'exercise' && (
            <>
              <div className="relative mb-3">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-4 py-3.5 text-base font-medium rounded-2xl outline-none appearance-none pr-10"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ▼
                </span>
              </div>

              <div
                className="flex p-1 mb-4 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {(['maxWeight', 'totalVolume'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{
                      background: metric === m ? 'var(--surface-elevated)' : 'transparent',
                      color: metric === m ? 'var(--text)' : 'var(--text-secondary)',
                    }}
                  >
                    {m === 'maxWeight' ? 'Max Weight' : 'Volume'}
                  </button>
                ))}
              </div>
            </>
          )}

          {mode === 'category' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => {
                const active = selectedCategory === c
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className="px-3 py-1.5 text-sm font-semibold rounded-full transition-all"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--surface)',
                      color: active ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                )
              })}
            </div>
          )}

          <div
            className="p-5 rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                No data for this selection.
              </p>
            ) : (
              <ProgressChart
                data={chartData}
                metric={mode === 'category' ? 'totalVolume' : metric}
              />
            )}
            {chartData.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {mode === 'category' ? (
                  [
                    { label: 'Sessions', value: String(sessions) },
                    { label: 'Total', value: `${totalVolume.toLocaleString()} lbs` },
                    { label: 'Avg', value: `${avg.toLocaleString()} lbs` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="text-center py-3 rounded-xl"
                      style={{ background: 'var(--surface-elevated)' }}
                    >
                      <div className="text-base font-bold">{value}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { label: 'Sessions', value: String(chartData.length) },
                    {
                      label: 'Best',
                      value: `${Math.max(...chartData.map((d) => d[metric]))} lbs`,
                    },
                    {
                      label: 'Last',
                      value: `${chartData[chartData.length - 1]?.[metric]} lbs`,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="text-center py-3 rounded-xl"
                      style={{ background: 'var(--surface-elevated)' }}
                    >
                      <div className="text-base font-bold">{value}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
