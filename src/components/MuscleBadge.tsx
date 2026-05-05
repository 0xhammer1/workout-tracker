'use client'

import { muscleFor, muscleForExercise } from '@/lib/muscleGroups'

interface Props {
  exerciseName?: string
  exercise?: { name: string; muscle_group?: string | null }
  onClick?: () => void
}

export default function MuscleBadge({ exerciseName, exercise, onClick }: Props) {
  const m = exercise ? muscleForExercise(exercise) : muscleFor(exerciseName ?? '')
  const baseClass = 'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full shrink-0'

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClass} transition-opacity active:opacity-60 cursor-pointer`}
        style={{ background: m.bg, color: m.color }}
      >
        {m.label}
      </button>
    )
  }

  return (
    <span className={baseClass} style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  )
}
