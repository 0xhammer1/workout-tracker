'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'
import MuscleGroupPicker from './MuscleGroupPicker'
import { getLastBest, suggestProgression, type Suggested, type LastBest } from '@/lib/intelligence'
import { useAuth } from '@/lib/auth'

interface ExistingSet {
  id: string
  set_number: number
  reps: number | null
  weight: number | null
  is_drop_set?: boolean
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
  isDropSet: boolean
}

export default function ExerciseBlock({ exercise, workoutId, onRemove, onDone, onMuscleGroupChange, initialSets }: Props) {
  const { user } = useAuth()
  const [sets, setSets] = useState<SetRow[]>([])
  const [lastBest, setLastBest] = useState<LastBest | null>(null)
  const [suggested, setSuggested] = useState<Suggested | null>(null)
  const [muscleGroup, setMuscleGroup] = useState<string | null>(exercise.muscle_group ?? null)
  const [showMusclePicker, setShowMusclePicker] = useState(false)
  const [isBodyweight, setIsBodyweight] = useState(exercise.is_bodyweight ?? false)
  const [bodyWeight, setBodyWeight] = useState<number | null>(null)

  useEffect(() => {
    if (!isBodyweight) { setBodyWeight(null); return }
    supabase
      .from('weight_logs')
      .select('weight')
      .order('date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setBodyWeight(Number(data.weight))
      })
  }, [isBodyweight])

  useEffect(() => {
    if (!user) return
    if (initialSets && initialSets.length > 0) {
      setSets(
        initialSets.map((s) => ({
          id: s.id,
          reps: s.reps !== null ? String(s.reps) : '',
          weight: s.weight !== null ? String(s.weight) : '',
          saved: true,
          isDropSet: s.is_drop_set ?? false,
        }))
      )
      getLastBest(exercise.id, workoutId, user.id).then((b) => {
        setLastBest(b)
        if (b) setSuggested(suggestProgression(b))
      })
      return
    }

    getLastBest(exercise.id, workoutId, user.id).then((b) => {
      setLastBest(b)
      const s = b ? suggestProgression(b) : null
      setSuggested(s)
      setSets([
        {
          reps: s ? String(s.reps) : '',
          weight: s ? String(s.weight) : '',
          saved: false,
          isDropSet: false,
        },
      ])
    })
  }, [exercise.id, workoutId, initialSets, user?.id])

  async function addSet() {
    const prev = sets[sets.length - 1]
    const repsStr = prev?.reps ?? ''
    const weightStr = prev?.weight ?? ''
    const tempIndex = sets.length
    const setNumber = tempIndex + 1

    setSets((s) => [...s, { reps: repsStr, weight: weightStr, saved: false, isDropSet: false }])

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
          is_drop_set: false,
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

  async function addDropSet(afterIndex: number) {
    const prev = sets[afterIndex]
    const insertSetNumber = afterIndex + 2 // 1-indexed

    // Shift set_numbers for all sets after the insertion point
    const setsAfter = sets.slice(afterIndex + 1)
    await Promise.all(
      setsAfter
        .filter((s) => s.id)
        .map((s, i) =>
          supabase.from('sets').update({ set_number: afterIndex + 3 + i }).eq('id', s.id!)
        )
    )

    // Auto-save if the parent has valid reps
    const reps = parseInt(prev.reps)
    const weight = parseFloat(prev.weight)
    let newId: string | undefined

    if (reps && !isNaN(reps)) {
      const { data } = await supabase
        .from('sets')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.id,
          set_number: insertSetNumber,
          reps,
          weight: isNaN(weight) ? null : weight,
          is_drop_set: true,
        })
        .select('id')
        .single()
      newId = data?.id as string | undefined
    }

    setSets((s) => [
      ...s.slice(0, afterIndex + 1),
      { reps: prev.reps, weight: prev.weight, saved: !!newId, isDropSet: true, id: newId },
      ...s.slice(afterIndex + 1),
    ])
  }

  function updateSet(index: number, field: 'reps' | 'weight', value: string) {
    setSets((s) => s.map((row, i) => (i === index ? { ...row, [field]: value, saved: false } : row)))
  }

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
      is_drop_set: row.isDropSet,
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

  async function toggleBodyweight() {
    const next = !isBodyweight
    setIsBodyweight(next)
    await supabase.from('exercises').update({ is_bodyweight: next }).eq('id', exercise.id)
  }

  // Count normal (non-drop) sets up to but not including index i, to get display set number
  function normalSetNumber(i: number) {
    return (i + 1) - sets.slice(0, i).filter((s) => s.isDropSet).length
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
          <button
            onClick={toggleBodyweight}
            title="Toggle bodyweight mode"
            className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 transition-colors"
            style={{
              background: isBodyweight ? 'var(--accent)' : 'var(--surface-elevated)',
              color: isBodyweight ? 'white' : 'var(--text-secondary)',
              border: isBodyweight ? 'none' : '1px solid var(--border)',
            }}
          >
            BW
          </button>
        </div>
        <button
          onClick={onRemove}
          className="text-xs font-medium transition-opacity active:opacity-60 shrink-0"
          style={{ color: 'var(--danger)' }}
        >
          Remove
        </button>
      </div>

      {isBodyweight && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          {bodyWeight !== null
            ? <>Body weight: <span style={{ color: 'var(--text)' }}>{bodyWeight} lbs</span> · +lbs column adds to that</>
            : 'Log your weight on the Profile tab to auto-fill body weight'}
        </p>
      )}

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
        <span className="text-center">{isBodyweight ? '+Lbs' : 'Lbs'}</span>
        <span className="text-center">Reps</span>
        <span />
      </div>

      {sets.map((row, i) => (
        <div key={row.id ?? `new-${i}`}>
          <div className="grid grid-cols-[1.75rem_1fr_1fr_1.5rem] gap-2 items-center mb-1">
            <span
              className="text-base font-semibold text-center"
              style={{ color: row.isDropSet ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
            >
              {row.isDropSet ? '↳' : normalSetNumber(i)}
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
          <button
            onClick={() => addDropSet(i)}
            className="text-xs mb-2 transition-opacity active:opacity-60"
            style={{ color: 'var(--text-tertiary)', paddingLeft: 'calc(1.75rem + 0.5rem)' }}
          >
            + drop set
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
