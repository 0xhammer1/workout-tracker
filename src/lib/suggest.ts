import { supabase } from './supabase'
import { CATEGORIES, type Category } from './categories'
import type { Exercise } from './types'

export interface Suggestion {
  category: Category
  reason: string
  exercises: Exercise[]
}

interface WorkoutRow {
  id: string
  date: string
  category: string | null
}

interface SetRowWithExercise {
  exercise_id: string
  workout_id: string
  exercises: Exercise
}

export async function suggestWorkout(): Promise<Suggestion> {
  // Pull recent workouts (last 30 days is enough to know what's been done)
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]

  const { data: workoutsData } = await supabase
    .from('workouts')
    .select('id, date, category')
    .gte('date', sinceStr)
    .order('date', { ascending: false })

  const workouts = (workoutsData ?? []) as WorkoutRow[]

  // Find the most recent date each category was performed
  const lastDoneByCategory = new Map<Category, string>()
  for (const w of workouts) {
    if (!w.category) continue
    if ((CATEGORIES as readonly string[]).includes(w.category)) {
      const c = w.category as Category
      if (!lastDoneByCategory.has(c)) lastDoneByCategory.set(c, w.date)
    }
  }

  // Pick the category done longest ago (or one never done)
  let suggested: Category = 'push'
  let reason = 'A solid place to start.'

  const neverDone = CATEGORIES.find((c) => !lastDoneByCategory.has(c))
  if (neverDone) {
    suggested = neverDone
    reason = `You haven't done ${neverDone} in the last 30 days.`
  } else {
    // All categories done at least once recently — pick the oldest
    let oldest: Category = 'push'
    let oldestDate = '9999-99-99'
    for (const c of CATEGORIES) {
      const d = lastDoneByCategory.get(c)
      if (d && d < oldestDate) {
        oldestDate = d
        oldest = c
      }
    }
    suggested = oldest
    const daysAgo = Math.floor(
      (Date.now() - new Date(oldestDate + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
    )
    reason =
      daysAgo === 0
        ? `Your last ${oldest} day was today — pick something else if you'd rather rest it.`
        : `Last ${oldest} day was ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago.`
  }

  // Find the most recent workout of the suggested category and pull its exercises
  const lastWorkoutOfCategory = workouts.find((w) => w.category === suggested)
  let exercises: Exercise[] = []

  if (lastWorkoutOfCategory) {
    const { data: setsData } = await supabase
      .from('sets')
      .select('exercise_id, workout_id, exercises!inner(id, name, muscle_group, created_at)')
      .eq('workout_id', lastWorkoutOfCategory.id)

    const seen = new Set<string>()
    for (const row of (setsData ?? []) as unknown as SetRowWithExercise[]) {
      const ex = row.exercises
      if (!seen.has(ex.id)) {
        seen.add(ex.id)
        exercises.push(ex)
      }
    }
  }

  return { category: suggested, reason, exercises }
}

export async function startSuggestedWorkout(suggestion: Suggestion): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0]

  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({ date: today, category: suggestion.category })
    .select()
    .single()

  if (error || !workout) {
    alert(`Error: ${error?.message ?? 'failed to create workout'}`)
    return null
  }

  const workoutId = workout.id as string

  // Stash suggested exercise IDs so the workout page can pre-populate them in edit mode.
  if (suggestion.exercises.length > 0) {
    sessionStorage.setItem(
      `suggestedExercises:${workoutId}`,
      JSON.stringify(suggestion.exercises.map((e) => e.id))
    )
  }
  sessionStorage.setItem('freshWorkoutId', workoutId)

  return workoutId
}
