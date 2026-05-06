'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  loadReactionsForPhotos,
  loadCommentsForPhotos,
  type WorkoutPhoto,
  type PhotoReaction,
  type PhotoComment,
} from '@/lib/photos'
import PhotoCard, { type CommenterInfo } from '@/components/PhotoCard'
import CategoryBadge from '@/components/CategoryBadge'
import Avatar from '@/components/Avatar'
import { localDateStr } from '@/lib/dates'
import {
  COUNT_MILESTONES,
  badgeById,
  type Badge,
} from '@/lib/badges'
import BadgeCelebration from '@/components/BadgeCelebration'

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
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false)
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([])
  const [reactionsByPhoto, setReactionsByPhoto] = useState<Record<string, PhotoReaction[]>>({})
  const [commentsByPhoto, setCommentsByPhoto] = useState<Record<string, PhotoComment[]>>({})
  const [commenters, setCommenters] = useState<Record<string, CommenterInfo>>({})
  const [ownerInfo, setOwnerInfo] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
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
      const loadedPhotos = photosMap[id] ?? []
      setPhotos(loadedPhotos)
      await refreshSocial(loadedPhotos, w?.user_id ?? null)

      // If workout is from today and empty, default to edit mode
      const today = localDateStr()
      if (w?.date === today && (!setsRaw || setsRaw.length === 0)) {
        // No exercises yet, picker will be shown
      }

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function refreshSocial(currentPhotos: WorkoutPhoto[], ownerId: string | null) {
    if (currentPhotos.length === 0 && !ownerId) return
    const photoIds = currentPhotos.map((p) => p.id)
    const reactions: Record<string, PhotoReaction[]> =
      photoIds.length > 0 ? await loadReactionsForPhotos(photoIds) : {}
    const comments: Record<string, PhotoComment[]> =
      photoIds.length > 0 ? await loadCommentsForPhotos(photoIds) : {}
    const ownerProfile = ownerId
      ? await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', ownerId)
          .maybeSingle()
      : { data: null }
    setReactionsByPhoto(reactions)
    setCommentsByPhoto(comments)

    if (ownerProfile.data) {
      setOwnerInfo({
        display_name: (ownerProfile.data.display_name as string | null) ?? null,
        avatar_url: (ownerProfile.data.avatar_url as string | null) ?? null,
      })
    }

    // Build commenters map for whoever appears in comments
    const seenIds = new Set<string>()
    for (const list of Object.values(comments)) {
      for (const c of list) seenIds.add(c.user_id)
    }
    if (user) seenIds.add(user.id)
    if (ownerId) seenIds.add(ownerId)

    const map: Record<string, CommenterInfo> = {}
    if (seenIds.size > 0) {
      const { data: rows } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', [...seenIds])
      for (const r of rows ?? []) {
        map[r.user_id as string] = {
          display_name: r.display_name as string | null,
          avatar_url: r.avatar_url as string | null,
        }
      }
    }
    setCommenters(map)
  }

  async function refreshSocialOnly() {
    if (!workout) return
    await refreshSocial(photos, workout.user_id)
  }

  async function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const wasPromptOpen = showPhotoPrompt
    setUploadingPhoto(true)
    try {
      const photo = await uploadWorkoutPhoto(file, user.id, id)
      setPhotos((prev) => [...prev, photo])

      // First thirst trap ever for this user? Celebrate.
      const { count } = await supabase
        .from('workout_photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (count === 1) {
        const b = badgeById('photo_first')
        if (b) {
          // Stash so we show it after the post-Done flow if applicable, or
          // immediately otherwise.
          setPendingBadges((prev) => [...prev, b])
        }
      }

      // If the prompt was open (post-Done), upload's done — exit after badges
      if (wasPromptOpen) {
        setShowPhotoPrompt(false)
        // If the photo badge wasn't fired, exit immediately. If it was, the
        // dismissBadge handler will exit when the queue drains.
        if (count !== 1) finishAndExit()
      }
    } catch (err) {
      toast.error('Upload failed')
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
    const { error } = await supabase.from('workouts').update({ notes: notes || null, category: category || null }).eq('id', id)
    setSaving(false)

    if (error) {
      toast.error('Failed to save workout')
      return
    }

    const newlyEarned = await checkBadgesOnDone()
    if (newlyEarned.length > 0) {
      setPendingBadges(newlyEarned)
      return
    }

    // Prompt to add a photo if there isn't one yet — encourages sharing
    if (isOwner && photos.length === 0) {
      setShowPhotoPrompt(true)
      return
    }
    finishAndExit()
  }

  async function checkBadgesOnDone(): Promise<Badge[]> {
    if (!user) return []
    const { data: ws } = await supabase
      .from('workouts')
      .select('id, category')
      .eq('user_id', user.id)
    const list = (ws ?? []) as { category: string | null }[]
    const out: Badge[] = []

    // Count milestone: did this finish push the total exactly to a milestone?
    const total = list.length
    for (const n of COUNT_MILESTONES) {
      if (total === n) {
        const b = badgeById(`count_${n}`)
        if (b) out.push(b)
      }
    }

    // Type first: this workout's category appears exactly once across all workouts.
    const c = category
    if (c === 'push' || c === 'pull' || c === 'legs') {
      const same = list.filter((w) => w.category === c).length
      if (same === 1) {
        const b = badgeById(`type_${c}`)
        if (b) out.push(b)
      }
    }

    return out
  }

  function dismissBadge() {
    setPendingBadges((prev) => {
      const next = prev.slice(1)
      // When the queue empties, continue the post-Done flow
      if (next.length === 0) {
        if (isOwner && photos.length === 0) {
          setShowPhotoPrompt(true)
        } else {
          finishAndExit()
        }
      }
      return next
    })
  }

  function finishAndExit() {
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
          {!isOwner && ownerInfo && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                style={{ border: '1px solid var(--border)' }}
              >
                <Avatar src={ownerInfo.avatar_url} name={ownerInfo.display_name ?? '—'} size={28} />
              </div>
              <span className="text-sm font-semibold truncate">
                {ownerInfo.display_name ?? '—'}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight truncate">{dateLabel}</h1>
        </div>
        {isOwner && (
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
        )}
      </div>

      {!isOwner && photos.length > 0 && user && (
        <div className="mb-5">
          {photos.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              reactions={reactionsByPhoto[p.id] ?? []}
              comments={commentsByPhoto[p.id] ?? []}
              currentUserId={user.id}
              commenters={commenters}
              onChange={refreshSocialOnly}
            />
          ))}
        </div>
      )}

      {isOwner && (
        <div className="mb-5">
          {photos.length > 0 ? (
            <>
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
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full py-3 text-sm font-semibold rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {uploadingPhoto ? 'Uploading…' : 'Add Another Photo'}
              </button>
            </>
          ) : (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full px-4 py-4 rounded-2xl transition-colors disabled:opacity-60 text-left"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))',
                border: '1px solid rgba(99,102,241,0.35)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {uploadingPhoto ? 'Uploading…' : 'Share your progress with your friends!'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Tap to add a photo.
                  </p>
                </div>
              </div>
            </button>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoPicked}
            className="hidden"
          />
        </div>
      )}

      {isOwner ? (
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
      ) : (
        category && (
          <div className="mb-5">
            <CategoryBadge category={category} />
          </div>
        )
      )}

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
        isOwner && editingIds.has(exercise.id) ? (
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
            onEdit={isOwner ? () => toggleEdit(exercise.id) : undefined}
          />
        )
      )}

      {isOwner && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-4 text-base font-semibold rounded-2xl transition-colors mb-4"
          style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          + Add Exercise
        </button>
      )}

      {isOwner ? (
        <textarea
          placeholder="Notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 text-sm rounded-2xl outline-none resize-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      ) : (
        notes && (
          <div
            className="px-4 py-3 text-sm rounded-2xl"
            style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {notes}
          </div>
        )
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

      <BadgeCelebration badge={pendingBadges[0] ?? null} onClose={dismissBadge} />

      {showPhotoPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={() => {
            setShowPhotoPrompt(false)
            finishAndExit()
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1">Share your progress!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Add a photo so your friends can see your gains.
            </p>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full py-3 text-sm font-semibold rounded-xl mb-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {uploadingPhoto ? 'Uploading…' : 'Add a Photo'}
            </button>
            <button
              onClick={() => {
                setShowPhotoPrompt(false)
                finishAndExit()
              }}
              className="w-full py-3 text-sm font-medium transition-opacity active:opacity-60"
              style={{ color: 'var(--text-secondary)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
