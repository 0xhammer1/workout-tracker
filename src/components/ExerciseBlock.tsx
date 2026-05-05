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
  reps: string
  weight: string
  saved: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove, initialSets }: Props) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastWeight, setLastWeight] = useState<number | null>(null)

  useEffect(() => {
    if (initialSets && initialSets.length > 0) {
      setSets(
        initialSets.map((s) => ({
          id: s.id,
          reps: s.reps !== null ? String(s.reps) : '',
          weight: s.weight !== null ? String(s.weight) : '',
          saved: true,
        }))
      )
      return
    }

    supabase
      .from('sets')
      .select('weight')
      .eq('exercise_id', exercise.id)
      .neq('workout_id', workoutId)
      .not('weight', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const w = data?.[0]?.weight !== undefined && data?.[0]?.weight !== null ? Number(data[0].weight) : null
        setLastWeight(w)
        setSets([{ reps: '', weight: w !== null ? String(w) : '', saved: false }])
      })
  }, [exercise.id, workoutId, initialSets])

  function addSet() {
    const prev = sets[sets.length - 1]
    setSets((s) => [...s, { reps: prev?.reps ?? '', weight: prev?.weight ?? '', saved: false }])
  }

  function updateSet(index: number, field: 'reps' | 'weight', value: string) {
    setSets((s) => s.map((row, i) => (i === index ? { ...row, [field]: value, saved: false } : row)))
  }

  async function saveSet(index: number) {
    const row = sets[index]
    const reps = parseInt(row.reps)
    const weight = parseFloat(row.weight)
    if (!reps || isNaN(reps)) return

    const setNumber = index + 1
    const payload = {
      workout_id: workoutId,
      exercise_id: exercise.id,
      set_number: setNumber,
      reps,
      weight: isNaN(weight) ? null : weight,
    }

    if (row.id) {
      await supabase
        .from('sets')
        .update({ reps: payload.reps, weight: payload.weight, set_number: setNumber })
        .eq('id', row.id)
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

    const remaining = sets.filter((_, i) => i !== index)
    setSets(remaining)

    // Renumber remaining sets in the database to keep them contiguous
    await Promise.all(
      remaining.map((r, i) =>
        r.id ? supabase.from('sets').update({ set_number: i + 1 }).eq('id', r.id) : null
      )
    )
  }

  return (
    <div className="rounded-2xl p-5 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <button
          onClick={onRemove}
          className="text-sm font-medium transition-opacity active:opacity-60"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Remove
        </button>
      </div>

      {lastWeight !== null && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Last session: {lastWeight} lbs
        </p>
      )}
      {lastWeight === null && <div className="mb-3" />}

      <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-3 text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
        <span>Set</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Lbs</span>
        <span></span>
      </div>

      {sets.map((row, i) => (
        <div key={row.id ?? i} className="grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-3 items-center mb-2">
          <span className="text-base font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>
            {i + 1}
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={row.reps}
            onChange={(e) => updateSet(i, 'reps', e.target.value)}
            onBlur={() => saveSet(i)}
            className="px-3 py-3 text-center text-base font-medium rounded-xl outline-none transition-all"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: `1px solid ${row.saved ? 'var(--success)' : 'var(--border)'}`,
            }}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={row.weight}
            onChange={(e) => updateSet(i, 'weight', e.target.value)}
            onBlur={() => saveSet(i)}
            className="px-3 py-3 text-center text-base font-medium rounded-xl outline-none transition-all"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: `1px solid ${row.saved ? 'var(--success)' : 'var(--border)'}`,
            }}
          />
          <button
            onClick={() => removeSet(i)}
            className="text-2xl leading-none transition-opacity active:opacity-60"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addSet}
        className="mt-3 w-full py-3 text-sm font-semibold rounded-xl transition-colors"
        style={{ background: 'var(--surface-elevated)', color: 'var(--accent)' }}
      >
        + Add Set
      </button>
    </div>
  )
}
