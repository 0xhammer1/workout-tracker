'use client'

import { useState, useEffect } from 'react'
import { getMuscleRecovery, type MuscleRecovery } from '@/lib/intelligence'
import { infoFor } from '@/lib/muscleGroups'
import { useAuth } from '@/lib/auth'

export default function RecoveryStrip() {
  const { user } = useAuth()
  const [data, setData] = useState<MuscleRecovery[]>([])

  useEffect(() => {
    if (!user) return
    getMuscleRecovery(user.id).then(setData)
  }, [user?.id])

  if (data.length === 0) return null

  const STATE_LABEL: Record<MuscleRecovery['state'], string> = {
    fresh: 'Fresh',
    worked: 'Worked',
    fatigued: 'Fatigued',
  }

  const STATE_COLOR: Record<MuscleRecovery['state'], { bg: string; text: string; dot: string }> = {
    fresh:    { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', dot: '#10b981' },
    worked:   { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', dot: '#f59e0b' },
    fatigued: { bg: 'rgba(239, 68, 68, 0.12)',  text: '#fb7185', dot: '#ef4444' },
  }

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Muscle Recovery
      </h2>
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
        {data.map((m) => {
          const info = infoFor(m.group)
          const colors = STATE_COLOR[m.state]
          return (
            <div
              key={m.group}
              className="shrink-0 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {info.label}
              </span>
              <span
                className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                style={{ background: colors.bg, color: colors.text }}
              >
                {STATE_LABEL[m.state]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
