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
    // Only show exercises that have been logged
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

        // Group by workout date
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
      <h1 className="text-2xl font-bold mt-6 mb-6">Progress</h1>

      {exercises.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-16">
          Log some workouts first to see progress charts.
        </p>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-slate-900 rounded-xl px-4 py-3 text-slate-100 outline-none mb-4 appearance-none"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMetric('maxWeight')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                metric === 'maxWeight'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Max Weight
            </button>
            <button
              onClick={() => setMetric('totalVolume')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                metric === 'totalVolume'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Total Volume
            </button>
          </div>

          {selectedExercise && (
            <div className="bg-slate-900 rounded-2xl p-4">
              <h2 className="font-semibold mb-4">{selectedExercise.name}</h2>
              {loading ? (
                <div className="h-56 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ProgressChart data={chartData} metric={metric} />
              )}
              {chartData.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Stat
                    label="Sessions"
                    value={String(chartData.length)}
                  />
                  <Stat
                    label="Best"
                    value={`${Math.max(...chartData.map((d) => d.maxWeight))} lbs`}
                  />
                  <Stat
                    label="Last"
                    value={`${chartData[chartData.length - 1]?.maxWeight} lbs`}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
