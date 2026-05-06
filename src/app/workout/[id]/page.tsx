'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase'
import type { Exercise, Workout } from '@/lib/types'
import ExerciseBlock from '@/components/ExerciseBlock'
import ExerciseSummary from '@/components/ExerciseSummary'
import ExercisePicker from '@/components/ExercisePicker'
import ConfirmDialog from '@/components/ConfirmDialog'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, type Category } from '@/lib/categories'
import { useAuth } from '@/lib/auth'
import {
  uploadWorkoutPhoto,
  deleteWorkoutPhoto,
  loadPhotosForWorkouts,
  type WorkoutPhoto,
} from '@/lib/photos'

function fireworks() {
  const duration = 800
  const end = Date.now() + duration
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  const burst = () => {
    const timeLeft = end - Date.now()
    if (timeLeft <= 0) return
    const particleCount = Math.max(20, 50 * (timeLeft / duration))
    confetti({
      startVelocity: 28,
      spread: 360,
      ticks: 40,
      zIndex: 9999,
      particleCount,
      colors,
      origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() * 0.3 + 0.2 },
    })
    confetti({
      startVelocity: 28,
      spread: 360,
      ticks: 40,
      zIndex: 9999,
      particleCount,
      colors,
      origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() * 0.3 + 0.2 },
    })
    setTimeout(burst, 200)
  }
  burst()
}

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
  const [showPicker, setShowPicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photos, setPhotos] = useState<WorkoutPhoto[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<WorkoutPhoto | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const isOwner = !!user && !!workout && workout.user_id === user.id

  useEffect(() => {
    async function load() {
      const { data: w } = await supabase.from('workouts').select('*').eq('id', id).single()
      if (w) {
        setWorkout(w)
        setNotes(w.notes ?? '')
        if (w.category && (CATEGORIES as readonly string[]).includes(w.category)) {
          setCategory(w.category as Category)
        }
      }

      const { data: setsRaw } = await supabase
        .from('sets')
        .select('id, set_number, reps, weight, exercise_id, exercises!inner(id, name, muscle_group, created_at)')
        .eq('workout_id', id)
        .order('set_number', { ascending: true })

      const map = new Map<string, ExerciseEntry>()
      if (setsRaw && setsRaw.length > 0) {
        for (const row of setsRaw) {
          const ex = row.exercises as unknown as Exercise
          if (!map.has(ex.id)) map.set(ex.id, { exercise: ex, sets: [] })
          map.get(ex.id)!.sets.push({
            id: row.id,
            set_number: row.set_number,
            reps: row.reps !== null ? Number(row.reps) : null,
            weight: row.weight !== null ? Number(row.weight) : null,
          })
        }
      }

      // Pull in any suggested exercises stashed in sessionStorage (from the suggestion flow)
      const suggestedKey = `suggestedExercises:${id}`
      const suggested = sessionStorage.getItem(suggestedKey)
      if (suggested) {
        try {
          const exerciseIds = JSON.parse(suggested) as string[]
          const missing = exerciseIds.filter((eid) => !map.has(eid))
          if (missing.length > 0) {
            const { data: exData } = await supabase
              .from('exercises')
              .select('id, name, muscle_group, created_at')
              .in('id', missing)
            for (const ex of (exData ?? []) as Exercise[]) {
              map.set(ex.id, { exercise: ex, sets: [] })
            }
          }
          // Put all suggested exercises into edit mode by default
          setEditingIds(new Set(exerciseIds))
        } catch {
          // Ignore parse errors
        }
        sessionStorage.removeItem(suggestedKey)
      }

      setEntries(Array.from(map.values()))

      const photosMap = await loadPhotosForWorkouts([id])
      setPhotos(photosMap[id] ?? [])

      // If workout is from today and empty, default to edit mode
      const today = new Date().toISOString().split('T')[0]
      if (w?.date === today && (!setsRaw || setsRaw.length === 0)) {
        // No exercises yet, picker will be shown
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPhoto(true)
    try {
      const photo = await uploadWorkoutPhoto(file, user.id, id)
      setPhotos((prev) => [...prev, photo])
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`)
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function confirmDeletePhoto() {
    if (!photoToDelete) return
    const target = photoToDelete
    setPhotoToDelete(null)
    await deleteWorkoutPhoto(target)
    setPhotos((prev) => prev.filter((p) => p.id !== target.id))
  }

  function addExercise(ex: Exercise) {
    setShowPicker(false)
    if (!entries.find((e) => e.exercise.id === ex.id)) {
      setEntries((prev) => [...prev, { exercise: ex, sets: [] }])
      setEditingIds((prev) => new Set(prev).add(ex.id))
    } else {
      setEditingIds((prev) => new Set(prev).add(ex.id))
    }
  }

  function toggleEdit(exerciseId: string) {
    setEditingIds((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
        // Reload sets for this exercise from DB to reflect any changes
        reloadExerciseSets(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }

  async function reloadExerciseSets(exerciseId: string) {
    const { data } = await supabase
      .from('sets')
      .select('id, set_number, reps, weight')
      .eq('workout_id', id)
      .eq('exercise_id', exerciseId)
      .order('set_number', { ascending: true })

    if (!data) return

    setEntries((prev) =>
      prev.map((e) =>
        e.exercise.id === exerciseId
          ? {
              ...e,
              sets: data.map((s) => ({
                id: s.id,
                set_number: s.set_number,
                reps: s.reps !== null ? Number(s.reps) : null,
                weight: s.weight !== null ? Number(s.weight) : null,
              })),
            }
          : e
      )
    )
  }

  async function removeExercise(exerciseId: string) {
    // Delete all sets for this exercise in this workout
    await supabase
      .from('sets')
      .delete()
      .eq('workout_id', id)
      .eq('exercise_id', exerciseId)

    setEntries((prev) => prev.filter((e) => e.exercise.id !== exerciseId))
    setEditingIds((prev) => {
      const n = new Set(prev)
      n.delete(exerciseId)
      return n
    })
  }

  async function setWorkoutCategory(c: Category | '') {
    setCategory(c)
    await supabase.from('workouts').update({ category: c || null }).eq('id', id)
  }

  async function deleteWorkout() {
    await supabase.from('workouts').delete().eq('id', id)
    sessionStorage.removeItem('freshWorkoutId')
    router.push('/history')
  }

  async function finishWorkout() {
    setSaving(true)
    await supabase.from('workouts').update({ notes: notes || null, category: category || null }).eq('id', id)
    const isFresh = sessionStorage.getItem('freshWorkoutId') === id
    if (isFresh) {
      sessionStorage.removeItem('freshWorkoutId')
      fireworks()
      setTimeout(() => router.push('/'), 1500)
    } else {
      router.push('/')
    }
  }

  if (loading || !workout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
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
      <div className="flex items-start justify-between pt-4 mb-6 gap-2">
        <div className="min-w-0">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium mb-2 transition-opacity active:opacity-60"
            style={{ color: 'var(--text-secondary)' }}
          >
            ‹ Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight truncate">{dateLabel}</h1>
        </div>
        <div className="flex items-center gap-2 mt-7 shrink-0">
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm font-semibold py-2 px-3 rounded-full transition-opacity active:opacity-60"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            Delete
          </button>
          <button
            onClick={finishWorkout}
            disabled={saving}
            className="text-sm font-semibold py-2 px-4 rounded-full transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
          Workout Type
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c
            const colors = CATEGORY_COLORS[c]
            return (
              <button
                key={c}
                onClick={() => setWorkoutCategory(active ? '' : c)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full transition-all"
                style={{
                  background: active ? colors.bg : 'var(--surface)',
                  color: active ? colors.color : 'var(--text-secondary)',
                  border: `1px solid ${active ? colors.color + '55' : 'var(--border)'}`,
                }}
              >
                {CATEGORY_LABELS[c]}
              </button>
            )
          })}
        </div>
      </div>

      {entries.length === 0 && (
        <div
          className="text-center py-12 rounded-2xl mb-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            No exercises yet
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Add an exercise to get started.
          </p>
        </div>
      )}

      {entries.map(({ exercise, sets }) =>
        editingIds.has(exercise.id) ? (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            workoutId={id}
            onRemove={() => removeExercise(exercise.id)}
            onDone={() => toggleEdit(exercise.id)}
            onMuscleGroupChange={(g) =>
              setEntries((prev) =>
                prev.map((e) =>
                  e.exercise.id === exercise.id
                    ? { ...e, exercise: { ...e.exercise, muscle_group: g } }
                    : e
                )
              )
            }
            initialSets={sets.length > 0 ? sets : undefined}
          />
        ) : (
          <ExerciseSummary
            key={exercise.id}
            exercise={exercise}
            sets={sets}
            onEdit={() => toggleEdit(exercise.id)}
          />
        )
      )}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-4 text-base font-semibold rounded-2xl transition-colors mb-4"
        style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)' }}
      >
        + Add Exercise
      </button>

      <textarea
        placeholder="Notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full px-4 py-3 text-sm rounded-2xl outline-none resize-none"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
      />

      {isOwner && (
        <div className="mt-5">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Photos
          </p>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.public_url} alt="Workout photo" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoToDelete(p)}
                    aria-label="Delete photo"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
                    style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-full py-3 text-sm font-semibold rounded-2xl transition-colors disabled:opacity-60"
            style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            {uploadingPhoto ? 'Uploading…' : '+ Add Photo'}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoPicked}
            className="hidden"
          />
        </div>
      )}

      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          filterCategory={category || null}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this workout?"
        message="This will remove all exercises and sets logged. Cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteWorkout}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={photoToDelete !== null}
        title="Delete this photo?"
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  )
}
