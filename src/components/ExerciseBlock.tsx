'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'
import MuscleGroupPicker from './MuscleGroupPicker'

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
  onDone: () => void
  initialSets?: ExistingSet[]
}

interface SetRow {
  id?: string
  reps: string
  weight: string
  saved: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove, onDone, initialSets }: Props) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  const [muscleGroup, setMuscleGroup] = useState<string | null>(exercise.muscle_group ?? null)
  const [showMusclePicker, setShowMusclePicker] = useState(false)

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

  // Save using a fresh value from the input element to avoid any stale-state issues
  async function saveSetWithValues(index: number, repsStr: string, weightStr: string) {
    const reps = parseInt(repsStr)
    const weight = parseFloat(weightStr)
    if (!reps || isNaN(reps)) return

    const setNumber = index + 1
    const row = sets[index]
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
      setSets((s) => s.map((r, i) => (i === index ? { ...r, reps: repsStr, weight: weightStr, saved: true } : r)))
    } else {
      const { data } = await supabase.from('sets').insert(payload).select().single()
      if (data) {
        setSets((s) => s.map((r, i) => (i === index ? { ...r, id: data.id, reps: repsStr, weight: weightStr, saved: true } : r)))
      }
    }
  }

  async function removeSet(index: number) {
    const row = sets[index]
    if (row.id) await supabase.from('sets').delete().eq('id', row.id)

    const remaining = sets.filter((_, i) => i !== index)
    setSets(remaining)

    await Promise.all(
      remaining.map((r, i) =>
        r.id ? supabase.from('sets').update({ set_number: i + 1 }).eq('id', r.id) : null
      )
    )
  }

  return (
    <div
      className="rounded-2xl p-4 mb-3 overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-base font-semibold truncate">{exercise.name}</h3>
          <MuscleBadge
            exercise={{ name: exercise.name, muscle_group: muscleGroup }}
            onClick={() => setShowMusclePicker(true)}
          />
        </div>
        <button
          onClick={onRemove}
          className="text-xs font-medium transition-opacity active:opacity-60 shrink-0"
          style={{ color: 'var(--danger)' }}
        >
          Remove
        </button>
      </div>

      <MuscleGroupPicker
        open={showMusclePicker}
        exerciseName={exercise.name}
        current={muscleGroup}
        onSelect={async (g) => {
          setMuscleGroup(g)
          setShowMusclePicker(false)
          await supabase.from('exercises').update({ muscle_group: g }).eq('id', exercise.id)
        }}
        onClose={() => setShowMusclePicker(false)}
      />

      {lastWeight !== null && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Last session: {lastWeight} lbs
        </p>
      )}
      {lastWeight === null && <div className="mb-2" />}

      <div className="grid grid-cols-[1.75rem_1fr_1fr_1.5rem] gap-2 text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
        <span>Set</span>
        <span className="text-center">Lbs</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>

      {sets.map((row, i) => (
        <div key={row.id ?? `new-${i}`} className="grid grid-cols-[1.75rem_1fr_1fr_1.5rem] gap-2 items-center mb-2">
          <span className="text-base font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>
            {i + 1}
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={row.weight}
            onChange={(e) => updateSet(i, 'weight', e.target.value)}
            onBlur={(e) => saveSetWithValues(i, row.reps, e.target.value)}
            className="w-full min-w-0 px-2 py-2.5 text-center text-base font-medium rounded-lg outline-none transition-colors"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={row.reps}
            onChange={(e) => updateSet(i, 'reps', e.target.value)}
            onBlur={(e) => saveSetWithValues(i, e.target.value, row.weight)}
            className="w-full min-w-0 px-2 py-2.5 text-center text-base font-medium rounded-lg outline-none transition-colors"
            style={{
              background: 'var(--surface-elevated)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            onClick={() => removeSet(i)}
            className="text-xl leading-none transition-opacity active:opacity-60 text-center"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Remove set"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={addSet}
        className="mt-2 w-full py-2.5 text-sm font-semibold rounded-lg transition-colors"
        style={{ background: 'var(--surface-elevated)', color: 'var(--accent)' }}
      >
        + Add Set
      </button>

      <button
        onClick={onDone}
        className="mt-2 w-full py-3 text-sm font-semibold rounded-lg transition-all active:scale-[0.98]"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        Done
      </button>
    </div>
  )
}
