'use client'

import { muscleFor } from '@/lib/muscleGroups'

export default function MuscleBadge({ exerciseName }: { exerciseName: string }) {
  const m = muscleFor(exerciseName)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full shrink-0"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}
