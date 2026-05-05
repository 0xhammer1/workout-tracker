'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import ProgressChart from '@/components/ProgressChart'

interface ChartPoint {
  date: string
  maxWeight: number
  totalVolume: number
}

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>('maxWeight')
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)

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
          if (!seen.has(ex.id)) { seen.add(ex.id); unique.push(ex) }
        }
        unique.sort((a, b) => a.name.localeCompare(b.name))
        setExercises(unique)
        if (unique.length > 0) setSelectedId(unique[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    supabase
      .from('sets')
      .select('weight, reps, workouts!inner(date)')
      .eq('exercise_id', selectedId)
      .not('weight', 'is', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) { setChartData([]); setLoading(false); return }
        const byDate = new Map<string, { weights: number[]; volume: number }>()
        for (const row of data) {
          const date = (row.workouts as unknown as { date: string }).date
          const w = row.weight as number
          const r = row.reps ?? 0
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
  }, [selectedId])

  const selectedExercise = exercises.find((e) => e.id === selectedId)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mt-8 mb-6">Progress</h1>

      {exercises.length === 0 ? (
        <p className="text-sm text-center py-16" style={{ color: '#444' }}>
          Log some workouts first to see progress charts.
        </p>
      ) : (
        <>
          <div className="mb-4" style={{ border: '1px solid #1c1c1c' }}>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none appearance-none"
              style={{ background: '#0d0d0d', color: '#f0ede8' }}
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-px mb-6" style={{ border: '1px solid #1c1c1c' }}>
            {(['maxWeight', 'totalVolume'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-colors"
                style={{
                  background: metric === m ? 'var(--gold)' : '#0d0d0d',
                  color: metric === m ? '#080808' : '#555',
                }}
              >
                {m === 'maxWeight' ? 'Max Weight' : 'Volume'}
              </button>
            ))}
          </div>

          {selectedExercise && (
            <div className="p-5" style={{ border: '1px solid #1c1c1c' }}>
              <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>
                {selectedExercise.name}
              </p>
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-5 h-5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <ProgressChart data={chartData} metric={metric} />
              )}
              {chartData.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Sessions', value: String(chartData.length) },
                    { label: 'Best', value: `${Math.max(...chartData.map((d) => d.maxWeight))} lbs` },
                    { label: 'Last', value: `${chartData[chartData.length - 1]?.maxWeight} lbs` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center py-3" style={{ border: '1px solid #1c1c1c' }}>
                      <div className="text-base font-semibold" style={{ color: '#f0ede8' }}>{value}</div>
                      <div className="text-xs tracking-widest uppercase mt-1" style={{ color: '#444' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
