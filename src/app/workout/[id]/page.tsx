'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Exercise, Workout } from '@/lib/types'
import ExerciseBlock from '@/components/ExerciseBlock'
import ExerciseSummary from '@/components/ExerciseSummary'
import ExercisePicker from '@/components/ExercisePicker'

interface SetData {
  id: string
  set_number: number
  reps: number | null
  weight: number | null
}

interface ExerciseEntry {
  exercise: Exercise
  sets: SetData[]
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set())
  const [isNew, setIsNew] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: w } = await supabase.from('workouts').select('*').eq('id', id).single()
      if (w) {
        setWorkout(w)
        setNotes(w.notes ?? '')
      }

      const { data: setsRaw } = await supabase
        .from('sets')
        .select('id, set_number, reps, weight, exercise_id, exercises!inner(id, name, created_at)')
        .eq('workout_id', id)
        .order('set_number', { ascending: true })

      if (!setsRaw || setsRaw.length === 0) {
        setIsNew(true)
        setLoading(false)
        return
      }

      const map = new Map<string, ExerciseEntry>()
      for (const row of setsRaw) {
        const ex = row.exercises as unknown as Exercise
        if (!map.has(ex.id)) map.set(ex.id, { exercise: ex, sets: [] })
        map.get(ex.id)!.sets.push({
          id: row.id,
          set_number: row.set_number,
          reps: row.reps,
          weight: row.weight,
        })
      }
      setEntries(Array.from(map.values()))
      setLoading(false)
    }
    load()
  }, [id])

  function addExercise(ex: Exercise) {
    setShowPicker(false)
    if (!entries.find((e) => e.exercise.id === ex.id)) {
      setEntries((prev) => [...prev, { exercise: ex, sets: [] }])
      setEditingIds((prev) => new Set(prev).add(ex.id))
    }
  }

  function toggleEdit(exerciseId: string) {
    setEditingIds((prev) => {
      const next = new Set(prev)
      next.has(exerciseId) ? next.delete(exerciseId) : next.add(exerciseId)
      return next
    })
  }

  function removeExercise(exerciseId: string) {
    setEntries((prev) => prev.filter((e) => e.exercise.id !== exerciseId))
    setEditingIds((prev) => { const n = new Set(prev); n.delete(exerciseId); return n })
  }

  async function finishWorkout() {
    setSaving(true)
    await supabase.from('workouts').update({ notes: notes || null }).eq('id', id)
    router.push('/')
  }

  if (loading || !workout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const dateLabel = new Date(workout.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      <div className="flex items-start justify-between mt-8 mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>Workout</p>
          <h1 className="text-2xl font-bold tracking-tight">{dateLabel}</h1>
        </div>
        <button
          onClick={finishWorkout}
          disabled={saving}
          className="text-xs tracking-widest uppercase py-2 px-4 transition-opacity disabled:opacity-40 mt-1"
          style={{ background: 'var(--gold)', color: '#080808' }}
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>

      {entries.map(({ exercise, sets }) =>
        editingIds.has(exercise.id) ? (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            workoutId={id}
            onRemove={() => removeExercise(exercise.id)}
            initialSets={sets.length > 0 ? sets : undefined}
          />
        ) : (
          <ExerciseSummary
            key={exercise.id}
            name={exercise.name}
            sets={sets}
            onEdit={() => toggleEdit(exercise.id)}
          />
        )
      )}

      {(isNew || entries.length > 0) && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-4 text-xs tracking-widest uppercase mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'var(--gold)', border: '1px solid #1c1c1c' }}
        >
          + Add Exercise
        </button>
      )}

      <textarea
        placeholder="Notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full px-4 py-3 text-sm outline-none resize-none mb-4"
        style={{ background: '#0d0d0d', color: '#888', border: '1px solid #1c1c1c' }}
      />

      {showPicker && <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />}
    </div>
  )
}
