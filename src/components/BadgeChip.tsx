'use client'

import type { Badge } from '@/lib/badges'

export function BadgeChip({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: earned ? 'rgba(99,102,241,0.18)' : 'var(--surface-elevated)',
        color: earned ? 'var(--text)' : 'var(--text-tertiary)',
        border: `1px solid ${earned ? 'rgba(99,102,241,0.35)' : 'var(--border)'}`,
        opacity: earned ? 1 : 0.65,
      }}
    >
      <span style={{ filter: earned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</span>
      {badge.label}
    </span>
  )
}

export function BadgeRow({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: earned ? 1 : 0.55,
      }}
    >
      <span
        className="w-9 h-9 flex items-center justify-center rounded-xl text-lg shrink-0"
        style={{
          background: earned ? 'rgba(99,102,241,0.18)' : 'var(--surface-elevated)',
          filter: earned ? 'none' : 'grayscale(1)',
        }}
      >
        {badge.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{badge.label}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
          {earned ? 'Earned' : badge.description}
        </p>
      </div>
    </div>
  )
}
