'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise, Set } from '@/lib/types'

interface Props {
  exercise: Exercise
  workoutId: string
  onRemove: () => void
}

interface SetRow {
  id?: string
  set_number: number
  reps: string
  weight: string
  saved: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove }: Props) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastWeight, setLastWeight] = useState<number | null>(null)

  useEffect(() => {
    // Load last weight used for this exercise (from any prior workout)
    supabase
      .from('sets')
      .select('weight, workouts!inner(id)')
      .eq('exercise_id', exercise.id)
      .neq('workout_id', workoutId)
      .not('weight', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const w = data?.[0]?.weight ?? null
        setLastWeight(w)
        setSets([{ set_number: 1, reps: '', weight: w !== null ? String(w) : '', saved: false }])
      })
  }, [exercise.id, workoutId])

  function addSet() {
    const prev = sets[sets.length - 1]
    setSets((s) => [
      ...s,
      { set_number: s.length + 1, reps: prev?.reps ?? '', weight: prev?.weight ?? '', saved: false },
    ])
  }

  function updateSet(index: number, field: 'reps' | 'weight', value: string) {
    setSets((s) => s.map((row, i) => (i === index ? { ...row, [field]: value, saved: false } : row)))
  }

  async function saveSet(index: number) {
    const row = sets[index]
    const reps = parseInt(row.reps)
    const weight = parseFloat(row.weight)
    if (!reps || isNaN(reps)) return

    const payload = {
      workout_id: workoutId,
      exercise_id: exercise.id,
      set_number: row.set_number,
      reps,
      weight: isNaN(weight) ? null : weight,
    }

    if (row.id) {
      await supabase.from('sets').update({ reps: payload.reps, weight: payload.weight }).eq('id', row.id)
    } else {
      const { data } = await supabase.from('sets').insert(payload).select().single()
      if (data) {
        setSets((s) => s.map((r, i) => (i === index ? { ...r, id: data.id, saved: true } : r)))
        return
      }
    }
    setSets((s) => s.map((r, i) => (i === index ? { ...r, saved: true } : r)))
  }

  async function removeSet(index: number) {
    const row = sets[index]
    if (row.id) await supabase.from('sets').delete().eq('id', row.id)
    setSets((s) => s.filter((_, i) => i !== index).map((r, i) => ({ ...r, set_number: i + 1 })))
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{exercise.name}</h3>
        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 text-sm px-2 py-1">
          Remove
        </button>
      </div>

      {lastWeight !== null && (
        <p className="text-xs text-slate-500 mb-3">Last: {lastWeight} lbs</p>
      )}

      <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs text-slate-500 mb-1 px-1">
        <span>Set</span>
        <span>Reps</span>
        <span>Weight (lbs)</span>
        <span></span>
      </div>

      {sets.map((row, i) => (
        <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center mb-2">
          <span className="text-slate-400 text-sm text-center">{row.set_number}</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={row.reps}
            onChange={(e) => updateSet(i, 'reps', e.target.value)}
            onBlur={() => saveSet(i)}
            className={`bg-slate-800 rounded-lg px-3 py-2 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500 ${
              row.saved ? 'ring-1 ring-emerald-600/40' : ''
            }`}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={row.weight}
            onChange={(e) => updateSet(i, 'weight', e.target.value)}
            onBlur={() => saveSet(i)}
            className={`bg-slate-800 rounded-lg px-3 py-2 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500 ${
              row.saved ? 'ring-1 ring-emerald-600/40' : ''
            }`}
          />
          <button
            onClick={() => removeSet(i)}
            className="text-slate-600 hover:text-red-400 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addSet}
        className="mt-2 w-full text-indigo-400 hover:text-indigo-300 text-sm py-2 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl transition-colors"
      >
        + Add Set
      </button>
    </div>
  )
}
