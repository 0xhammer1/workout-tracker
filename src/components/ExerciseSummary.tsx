'use client'

import MuscleBadge from './MuscleBadge'

interface SetData {
  id: string
  set_number: number
  reps: number | null
  weight: number | null
  is_drop_set?: boolean
}

interface Props {
  exercise: { name: string; muscle_group?: string | null; is_bodyweight?: boolean | null }
  sets: SetData[]
  onEdit?: () => void
}

export default function ExerciseSummary({ exercise, sets, onEdit }: Props) {
  const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number)

  // Compute display set numbers (drop sets don't count toward the number)
  const displayNumbers = sortedSets.map((s, i) => {
    if (s.is_drop_set) return null
    return sortedSets.slice(0, i).filter((r) => !r.is_drop_set).length + 1
  })

  return (
    <div className="rounded-2xl p-5 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">{exercise.name}</h3>
          <MuscleBadge exercise={exercise} />
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-sm font-semibold transition-opacity active:opacity-60 shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            Edit
          </button>
        )}
      </div>

      {sortedSets.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No sets logged.</p>
      ) : (
        <>
          <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-3 text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
            <span>Set</span>
            <span className="text-center">Lbs</span>
            <span className="text-center">Reps</span>
          </div>
          {sortedSets.map((s, i) => {
            const isDropSet = s.is_drop_set ?? false
            const isBW = (exercise.is_bodyweight ?? false) && s.weight === null
            const weightDisplay = isBW ? 'BW' : (s.weight ?? '—')

            return (
              <div
                key={s.id}
                className="grid grid-cols-[2.5rem_1fr_1fr] gap-3 py-2.5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <span
                  className="text-base font-semibold text-center"
                  style={{ color: isDropSet ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
                >
                  {isDropSet ? '↳' : displayNumbers[i]}
                </span>
                <span
                  className="text-base text-center font-medium"
                  style={{ color: isBW ? 'var(--accent)' : undefined }}
                >
                  {weightDisplay}
                </span>
                <span className="text-base text-center font-medium">{s.reps ?? '—'}</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
