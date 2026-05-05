export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'other'

export interface MuscleInfo {
  group: MuscleGroup
  label: string
  color: string
  bg: string
}

const INFO: Record<MuscleGroup, MuscleInfo> = {
  chest:     { group: 'chest',     label: 'Chest',     color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)' },
  back:      { group: 'back',      label: 'Back',      color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.15)' },
  shoulders: { group: 'shoulders', label: 'Shoulders', color: '#fcd34d', bg: 'rgba(234, 179, 8, 0.15)' },
  biceps:    { group: 'biceps',    label: 'Biceps',    color: '#c4b5fd', bg: 'rgba(139, 92, 246, 0.15)' },
  triceps:   { group: 'triceps',   label: 'Triceps',   color: '#f0abfc', bg: 'rgba(217, 70, 239, 0.18)' },
  legs:      { group: 'legs',      label: 'Legs',      color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)' },
  glutes:    { group: 'glutes',    label: 'Glutes',    color: '#fdba74', bg: 'rgba(249, 115, 22, 0.15)' },
  core:      { group: 'core',      label: 'Core',      color: '#67e8f9', bg: 'rgba(6, 182, 212, 0.15)' },
  other:     { group: 'other',     label: 'Other',     color: '#cbd5e1', bg: 'rgba(148, 163, 184, 0.15)' },
}

export function muscleFor(exerciseName: string): MuscleInfo {
  const n = exerciseName.toLowerCase()

  if (/(bench|chest|fly|pec|push.?up|dip)/i.test(n)) return INFO.chest
  if (/(squat|leg press|lunge|leg extension|leg curl|hamstring|quad|calf)/i.test(n)) return INFO.legs
  if (/(deadlift|hip thrust|rdl|romanian|glute)/i.test(n)) return INFO.glutes
  if (/(row|pulldown|pull.?up|chin.?up|lat\b|back)/i.test(n)) return INFO.back
  if (/(shoulder|lateral|front raise|overhead|ohp|press.+shoulder|military|face pull)/i.test(n)) return INFO.shoulders
  if (/(tricep|skull crusher|kickback|pushdown)/i.test(n)) return INFO.triceps
  if (/(bicep|curl)/i.test(n)) return INFO.biceps
  if (/(abs?|core|plank|crunch|sit.?up|leg raise|russian twist)/i.test(n)) return INFO.core
  if (/(press|shoulder)/i.test(n)) return INFO.shoulders

  return INFO.other
}
