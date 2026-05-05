'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'

interface ExistingSet {
  id: string
  set_number: number
  reps: number | null
  weight: number | null
}

interface Props {
  exercise: Exercise
  workoutId: string
  onRemove: () => void
  initialSets?: ExistingSet[]
}

interface SetRow {
  id?: string
  set_number: number
  reps: string
  weight: string
  saved: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove, initialSets }: Props) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastWeight, setLastWeight] = useState<number | null>(null)

  useEffect(() => {
    if (initialSets && initialSets.length > 0) {
      setSets(initialSets.map((s) => ({
        id: s.id,
        set_number: s.set_number,
        reps: s.reps !== null ? String(s.reps) : '',
        weight: s.weight !== null ? String(s.weight) : '',
        saved: true,
      })))
      return
    }

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
  }, [exercise.id, workoutId, initialSets])

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
    <div className="mb-6 pb-6 border-b" style={{ borderColor: '#1c1c1c' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#f0ede8' }}>
          {exercise.name}
        </h3>
        <button
          onClick={onRemove}
          className="text-xs tracking-wider uppercase transition-opacity hover:opacity-60"
          style={{ color: '#555' }}
        >
          Remove
        </button>
      </div>

      {lastWeight !== null && (
        <p className="text-xs mb-4" style={{ color: 'var(--gold)' }}>
          Last session: {lastWeight} lbs
        </p>
      )}

      <div className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-3 text-xs tracking-widest uppercase mb-2" style={{ color: '#444' }}>
        <span>Set</span>
        <span>Reps</span>
        <span>Lbs</span>
        <span></span>
      </div>

      {sets.map((row, i) => (
        <div key={i} className="grid grid-cols-[2rem_1fr_1fr_1.5rem] gap-3 items-center mb-2">
          <span className="text-xs text-center" style={{ color: '#555' }}>{row.set_number}</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={row.reps}
            onChange={(e) => updateSet(i, 'reps', e.target.value)}
            onBlur={() => saveSet(i)}
            className="px-3 py-2 text-center text-sm outline-none transition-colors"
            style={{
              background: '#111',
              color: '#f0ede8',
              border: `1px solid ${row.saved ? '#2a3a2a' : '#1c1c1c'}`,
            }}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={row.weight}
            onChange={(e) => updateSet(i, 'weight', e.target.value)}
            onBlur={() => saveSet(i)}
            className="px-3 py-2 text-center text-sm outline-none transition-colors"
            style={{
              background: '#111',
              color: '#f0ede8',
              border: `1px solid ${row.saved ? '#2a3a2a' : '#1c1c1c'}`,
            }}
          />
          <button
            onClick={() => removeSet(i)}
            className="text-base leading-none transition-opacity hover:opacity-60"
            style={{ color: '#444' }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addSet}
        className="mt-3 w-full py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
        style={{ color: 'var(--gold)', border: '1px solid #1c1c1c' }}
      >
        + Add Set
      </button>
    </div>
  )
}
