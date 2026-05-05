import { supabase } from './supabase'
import { CATEGORIES, CATEGORY_MUSCLE_GROUPS, type Category } from './categories'
import { muscleForExercise } from './muscleGroups'
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
  workouts?: { date: string }
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

  // Try to copy exercises from the most recent workout of the suggested category
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

  // Fallback: rotate from user's history matching the muscle groups for this category.
  // Variety scoring: prioritize exercises the user does often, but bump priority
  // for ones not done recently.
  if (exercises.length === 0) {
    const targetGroups = new Set<string>(CATEGORY_MUSCLE_GROUPS[suggested])
    const { data: allSets } = await supabase
      .from('sets')
      .select('exercise_id, exercises!inner(id, name, muscle_group, created_at), workouts!inner(date)')

    const today = new Date().toISOString().split('T')[0]
    const stats = new Map<string, { ex: Exercise; count: number; lastDate: string }>()
    for (const row of (allSets ?? []) as unknown as SetRowWithExercise[]) {
      const ex = row.exercises
      const m = muscleForExercise(ex)
      if (!targetGroups.has(m.group)) continue
      const date = row.workouts?.date ?? '1970-01-01'
      const entry = stats.get(ex.id)
      if (entry) {
        entry.count += 1
        if (date > entry.lastDate) entry.lastDate = date
      } else {
        stats.set(ex.id, { ex, count: 1, lastDate: date })
      }
    }

    // priority = count * sqrt(daysAgo+1) → favors frequent + stale
    const todayMs = new Date(today + 'T12:00:00').getTime()
    exercises = Array.from(stats.values())
      .map((v) => {
        const daysAgo = Math.max(
          0,
          Math.floor((todayMs - new Date(v.lastDate + 'T12:00:00').getTime()) / 86_400_000)
        )
        return { ...v, priority: v.count * Math.sqrt(daysAgo + 1) }
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map((v) => v.ex)
  } else {
    // We had a previous workout to copy from. Mix in variety: swap out 1-2 exercises
    // from the lineup with stale alternatives the user has done before.
    const lineupIds = new Set(exercises.map((e) => e.id))
    const targetGroups = new Set<string>(CATEGORY_MUSCLE_GROUPS[suggested])

    const { data: altSets } = await supabase
      .from('sets')
      .select('exercise_id, exercises!inner(id, name, muscle_group, created_at), workouts!inner(date)')

    const altStats = new Map<string, { ex: Exercise; count: number; lastDate: string }>()
    for (const row of (altSets ?? []) as unknown as SetRowWithExercise[]) {
      const ex = row.exercises
      if (lineupIds.has(ex.id)) continue
      const m = muscleForExercise(ex)
      if (!targetGroups.has(m.group)) continue
      const date = row.workouts?.date ?? '1970-01-01'
      const entry = altStats.get(ex.id)
      if (entry) {
        entry.count += 1
        if (date > entry.lastDate) entry.lastDate = date
      } else {
        altStats.set(ex.id, { ex, count: 1, lastDate: date })
      }
    }

    const todayMs = new Date(new Date().toISOString().split('T')[0] + 'T12:00:00').getTime()
    const stale = Array.from(altStats.values())
      .map((v) => {
        const daysAgo = Math.max(
          0,
          Math.floor((todayMs - new Date(v.lastDate + 'T12:00:00').getTime()) / 86_400_000)
        )
        return { ...v, daysAgo }
      })
      .filter((v) => v.daysAgo >= 14) // only swap in things not done in 2+ weeks
      .sort((a, b) => b.daysAgo - a.daysAgo)

    if (stale.length > 0 && exercises.length >= 3) {
      // Replace the last exercise in the lineup with a stale alternative
      exercises = [...exercises.slice(0, -1), stale[0].ex]
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
