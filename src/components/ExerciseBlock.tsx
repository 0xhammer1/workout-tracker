'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'
import MuscleGroupPicker from './MuscleGroupPicker'
import { getLastBest, suggestProgression, type Suggested, type LastBest } from '@/lib/intelligence'

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
  onMuscleGroupChange?: (group: string) => void
  initialSets?: ExistingSet[]
}

interface SetRow {
  id?: string
  reps: string
  weight: string
  saved: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove, onDone, onMuscleGroupChange, initialSets }: Props) {
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastBest, setLastBest] = useState<LastBest | null>(null)
  const [suggested, setSuggested] = useState<Suggested | null>(null)
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
      // Still load last best for the suggestion banner
      getLastBest(exercise.id, workoutId).then((b) => {
        setLastBest(b)
        if (b) setSuggested(suggestProgression(b))
      })
      return
    }

    getLastBest(exercise.id, workoutId).then((b) => {
      setLastBest(b)
      const s = b ? suggestProgression(b) : null
      setSuggested(s)
      setSets([
        {
          reps: s ? String(s.reps) : '',
          weight: s ? String(s.weight) : '',
          saved: false,
        },
      ])
    })
  }, [exercise.id, workoutId, initialSets])

  async function addSet() {
    const prev = sets[sets.length - 1]
    const repsStr = prev?.reps ?? ''
    const weightStr = prev?.weight ?? ''
    const tempIndex = sets.length
    const setNumber = tempIndex + 1

    setSets((s) => [...s, { reps: repsStr, weight: weightStr, saved: false }])

    // Auto-save if prefill has valid values, so users who tap Add Set
    // without modifying inputs still get the set persisted.
    const reps = parseInt(repsStr)
    const weight = parseFloat(weightStr)
    if (reps && !isNaN(reps)) {
      const { data, error } = await supabase
        .from('sets')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          set_number: setNumber,
          reps,
          weight: isNaN(weight) ? null : weight,
        })
        .select()
        .single()
      if (error) {
        alert(`Failed to save set: ${error.message}`)
        return
      }
      if (data) {
        setSets((s) =>
          s.map((r, i) => (i === tempIndex ? { ...r, id: data.id as string, saved: true } : r))
        )
      }
    }
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
      const { error } = await supabase
        .from('sets')
        .update({ reps: payload.reps, weight: payload.weight, set_number: setNumber })
        .eq('id', row.id)
      if (error) {
        alert(`Failed to save: ${error.message}`)
        return
      }
      setSets((s) => s.map((r, i) => (i === index ? { ...r, reps: repsStr, weight: weightStr, saved: true } : r)))
    } else {
      const { data, error } = await supabase.from('sets').insert(payload).select().single()
      if (error) {
        alert(`Failed to save: ${error.message}`)
        return
      }
      if (data) {
        setSets((s) => s.map((r, i) => (i === index ? { ...r, id: data.id as string, reps: repsStr, weight: weightStr, saved: true } : r)))
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
          onMuscleGroupChange?.(g)
        }}
        onClose={() => setShowMusclePicker(false)}
      />

      {lastBest && suggested && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>Last: </span>
          <span style={{ color: 'var(--text)' }}>
            {lastBest.weight}×{lastBest.reps}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}> · Try: </span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {suggested.weight}×{suggested.reps}
          </span>
        </div>
      )}
      {!lastBest && <div className="mb-2" />}

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
