'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Exercise, Workout } from '@/lib/types'
import ExerciseBlock from '@/components/ExerciseBlock'
import ExercisePicker from '@/components/ExercisePicker'

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setWorkout(data)
          setNotes(data.notes ?? '')
        }
      })

    // Load exercises already in this workout
    supabase
      .from('sets')
      .select('exercise_id, exercises!inner(id, name, created_at)')
      .eq('workout_id', id)
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
        setExercises(unique)
      })
  }, [id])

  function addExercise(ex: Exercise) {
    setShowPicker(false)
    if (!exercises.find((e) => e.id === ex.id)) {
      setExercises((prev) => [...prev, ex])
    }
  }

  function removeExercise(exerciseId: string) {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId))
  }

  async function finishWorkout() {
    setSaving(true)
    await supabase.from('workouts').update({ notes: notes || null }).eq('id', id)
    router.push('/')
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Workout</h1>
          <p className="text-sm text-slate-500">{dateLabel}</p>
        </div>
        <button
          onClick={finishWorkout}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Finish'}
        </button>
      </div>

      {exercises.map((ex) => (
        <ExerciseBlock
          key={ex.id}
          exercise={ex}
          workoutId={id}
          onRemove={() => removeExercise(ex.id)}
        />
      ))}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-indigo-500 text-indigo-400 font-medium py-4 rounded-2xl transition-colors mb-4"
      >
        + Add Exercise
      </button>

      <div className="mb-4">
        <textarea
          placeholder="Notes (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-slate-900 rounded-xl px-4 py-3 text-slate-300 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-sm"
        />
      </div>

      {showPicker && <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />}
    </div>
  )
}
