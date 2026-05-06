'use client'

import type { Badge } from '@/lib/badges'

interface Props {
  badge: Badge | null
  onClose: () => void
}

export default function BadgeCelebration({ badge, onClose }: Props) {
  if (!badge) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 text-center"
        style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))',
            border: '1px solid rgba(99,102,241,0.45)',
          }}
        >
          {badge.emoji}
        </div>
        <p
          className="text-[10px] font-bold tracking-wider uppercase mb-1"
          style={{ color: 'var(--accent)' }}
        >
          Badge unlocked
        </p>
        <h2 className="text-xl font-bold tracking-tight mb-1">{badge.congratsTitle}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {badge.congratsBody}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Sweet
        </button>
      </div>
    </div>
  )
}
