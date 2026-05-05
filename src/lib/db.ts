import { supabase } from './supabase'

export async function getLastWeightForExercise(
  exerciseId: string,
  currentWorkoutId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('sets')
    .select('weight, workouts!inner(id, date)')
    .eq('exercise_id', exerciseId)
    .neq('workout_id', currentWorkoutId)
    .not('weight', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.weight ?? null
}

export async function getExerciseHistory(exerciseId: string) {
  const { data } = await supabase
    .from('sets')
    .select('weight, reps, set_number, workouts!inner(id, date)')
    .eq('exercise_id', exerciseId)
    .not('weight', 'is', null)
    .order('created_at', { ascending: true })

  return data ?? []
}
