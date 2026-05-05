export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: { id: string; name: string; muscle_group: string | null; created_at: string }
        Insert: { id?: string; name: string; muscle_group?: string | null; created_at?: string }
        Update: { id?: string; name?: string; muscle_group?: string | null }
      }
      workouts: {
        Row: { id: string; date: string; notes: string | null; category: string | null; created_at: string }
        Insert: { id?: string; date?: string; notes?: string | null; category?: string | null }
        Update: { id?: string; date?: string; notes?: string | null; category?: string | null }
      }
      sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          set_number: number
          reps: number | null
          weight: number | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          set_number: number
          reps?: number | null
          weight?: number | null
        }
        Update: {
          reps?: number | null
          weight?: number | null
        }
      }
    }
  }
}

export type Exercise = Database['public']['Tables']['exercises']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type Set = Database['public']['Tables']['sets']['Row']

export type SetWithExercise = Set & { exercises: Exercise }

export type WorkoutWithSets = Workout & {
  sets: SetWithExercise[]
}

export type ExerciseGroup = {
  exercise: Exercise
  sets: Set[]
}
