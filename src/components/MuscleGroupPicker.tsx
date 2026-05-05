'use client'

import { ALL_MUSCLE_GROUPS, infoFor } from '@/lib/muscleGroups'

interface Props {
  open: boolean
  exerciseName: string
  current: string | null | undefined
  onSelect: (group: string) => void
  onClose: () => void
}

export default function MuscleGroupPicker({ open, exerciseName, current, onSelect, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="px-5 pt-2 pb-3">
          <h3 className="text-lg font-semibold">Muscle Group</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {exerciseName}
          </p>
        </div>
        <div className="px-3 pb-4 grid grid-cols-2 gap-2">
          {ALL_MUSCLE_GROUPS.map((g) => {
            const info = infoFor(g)
            const active = current === g
            return (
              <button
                key={g}
                onClick={() => onSelect(g)}
                className="px-3 py-3 text-sm font-semibold rounded-xl transition-all text-left"
                style={{
                  background: active ? info.bg : 'var(--surface-elevated)',
                  color: active ? info.color : 'var(--text)',
                  border: `1px solid ${active ? info.color + '55' : 'var(--border)'}`,
                }}
              >
                {info.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
