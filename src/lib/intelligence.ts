import { supabase } from './supabase'
import { muscleForExercise, type MuscleGroup } from './muscleGroups'
import type { Exercise } from './types'

// =================
//  Progressive overload
// =================

export interface LastBest {
  weight: number
  reps: number
  date: string
}

export interface Suggested {
  weight: number
  reps: number
  rationale: string
}

/**
 * Pull the heaviest top set the user did the last time they performed this exercise.
 */
export async function getLastBest(
  exerciseId: string,
  excludeWorkoutId?: string
): Promise<LastBest | null> {
  // Get last workout (by date) where this exercise was performed
  let q = supabase
    .from('sets')
    .select('weight, reps, workout_id, workouts!inner(id, date)')
    .eq('exercise_id', exerciseId)
    .not('weight', 'is', null)
  if (excludeWorkoutId) q = q.neq('workout_id', excludeWorkoutId)

  const { data } = await q
  if (!data || data.length === 0) return null

  // Group by workout, find most recent workout's sets, pick top set there
  type Row = { weight: number | string; reps: number | string | null; workout_id: string; workouts: { id: string; date: string } }
  const rows = data as unknown as Row[]
  const byWorkout = new Map<string, { date: string; sets: { weight: number; reps: number }[] }>()
  for (const r of rows) {
    const w = Number(r.weight)
    const reps = Number(r.reps ?? 0)
    if (!byWorkout.has(r.workout_id))
      byWorkout.set(r.workout_id, { date: r.workouts.date, sets: [] })
    byWorkout.get(r.workout_id)!.sets.push({ weight: w, reps })
  }

  const sortedWorkouts = Array.from(byWorkout.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  )
  const last = sortedWorkouts[0]
  if (!last || last.sets.length === 0) return null

  // Top set = max weight; tiebreaker = max reps
  let best = last.sets[0]
  for (const s of last.sets) {
    if (s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) best = s
  }
  return { weight: best.weight, reps: best.reps, date: last.date }
}

/**
 * Given a last best set, suggest a progression.
 * Heuristic:
 *   - reps >= 12 → bump weight ~5%, target 8 reps
 *   - reps in 8..11 → keep weight, +1 rep
 *   - reps < 8 → keep weight, +1 rep (or hold)
 */
export function suggestProgression(last: LastBest): Suggested {
  if (last.reps >= 12) {
    const bumped = bumpWeight(last.weight, 0.05)
    return {
      weight: bumped,
      reps: 8,
      rationale: `You hit ${last.reps} reps last time — bump weight, drop to 8.`,
    }
  }
  if (last.reps >= 8) {
    return {
      weight: last.weight,
      reps: last.reps + 1,
      rationale: `Try one more rep at ${last.weight}.`,
    }
  }
  return {
    weight: last.weight,
    reps: last.reps + 1,
    rationale: `Match weight, push for one more rep.`,
  }
}

function bumpWeight(w: number, pct: number): number {
  const raw = w * (1 + pct)
  // Round to nearest 5 lb if heavy, 2.5 lb if light
  if (raw >= 50) return Math.round(raw / 5) * 5
  return Math.round(raw / 2.5) * 2.5
}

// =================
//  Per-muscle recovery
// =================

export type RecoveryState = 'fresh' | 'worked' | 'fatigued'

export interface MuscleRecovery {
  group: MuscleGroup
  state: RecoveryState
  volumeLast3d: number
  daysAgo: number | null
}

/**
 * Sum volume (weight × reps) per muscle group over the last 3 days.
 * Classify into fresh / worked / fatigued bands.
 */
export async function getMuscleRecovery(): Promise<MuscleRecovery[]> {
  const since = new Date()
  since.setDate(since.getDate() - 3)
  const sinceStr = since.toISOString().split('T')[0]

  const { data } = await supabase
    .from('sets')
    .select('weight, reps, exercises!inner(id, name, muscle_group, created_at), workouts!inner(date)')
    .gte('workouts.date', sinceStr)
    .not('weight', 'is', null)

  type Row = {
    weight: number | string
    reps: number | string | null
    exercises: Exercise
    workouts: { date: string }
  }
  const rows = (data ?? []) as unknown as Row[]

  const today = new Date().toISOString().split('T')[0]
  const volumeByGroup = new Map<MuscleGroup, number>()
  const lastDateByGroup = new Map<MuscleGroup, string>()

  for (const r of rows) {
    const m = muscleForExercise(r.exercises)
    const vol = Number(r.weight) * Number(r.reps ?? 0)
    volumeByGroup.set(m.group, (volumeByGroup.get(m.group) ?? 0) + vol)
    const prev = lastDateByGroup.get(m.group)
    if (!prev || r.workouts.date > prev) lastDateByGroup.set(m.group, r.workouts.date)
  }

  // Threshold tuning: rough but better than nothing.
  // Below 2000 lbs total volume in last 3 days = fresh
  // 2000–6000 = worked
  // > 6000 = fatigued
  const groups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core']
  return groups.map((g) => {
    const vol = volumeByGroup.get(g) ?? 0
    const lastDate = lastDateByGroup.get(g) ?? null
    const daysAgo = lastDate
      ? Math.floor(
          (new Date(today + 'T12:00:00').getTime() - new Date(lastDate + 'T12:00:00').getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null
    let state: RecoveryState = 'fresh'
    if (vol > 6000) state = 'fatigued'
    else if (vol > 2000) state = 'worked'
    return { group: g, state, volumeLast3d: Math.round(vol), daysAgo }
  })
}
