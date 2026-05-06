'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'
import { muscleForExercise } from '@/lib/muscleGroups'
import { CATEGORY_MUSCLE_GROUPS, CATEGORY_LABELS, type Category } from '@/lib/categories'
import { useAuth } from '@/lib/auth'

interface Props {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  filterCategory?: Category | null
}

export default function ExercisePicker({ onSelect, onClose, filterCategory }: Props) {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [usageCount, setUsageCount] = useState<Map<string, number>>(new Map())
  const [lastUsed, setLastUsed] = useState<Map<string, string>>(new Map())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      const [{ data: exData }, { data: setsData }] = await Promise.all([
        supabase.from('exercises').select('*').order('name'),
        supabase
          .from('sets')
          .select('exercise_id, workouts!inner(date, user_id)')
          .eq('workouts.user_id', user!.id)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return

      setExercises(exData ?? [])

      const counts = new Map<string, number>()
      const last = new Map<string, string>()
      type Row = { exercise_id: string; workouts: { date: string } }
      for (const row of (setsData ?? []) as unknown as Row[]) {
        counts.set(row.exercise_id, (counts.get(row.exercise_id) ?? 0) + 1)
        const prev = last.get(row.exercise_id)
        if (!prev || row.workouts.date > prev) last.set(row.exercise_id, row.workouts.date)
      }
      setUsageCount(counts)
      setLastUsed(last)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Apply category filter (unless user toggled "Show all")
  const categoryFiltered =
    filterCategory && !showAll
      ? exercises.filter((ex) => {
          const m = muscleForExercise(ex)
          return CATEGORY_MUSCLE_GROUPS[filterCategory].includes(m.group)
        })
      : exercises

  // Rank: used exercises first (by recency, then frequency), then never-used alphabetical
  const ranked = [...categoryFiltered].sort((a, b) => {
    const aCount = usageCount.get(a.id) ?? 0
    const bCount = usageCount.get(b.id) ?? 0
    const aLast = lastUsed.get(a.id) ?? ''
    const bLast = lastUsed.get(b.id) ?? ''

    // Both used: recent date first, then frequency
    if (aCount > 0 && bCount > 0) {
      if (aLast !== bLast) return bLast.localeCompare(aLast)
      return bCount - aCount
    }
    // One used, one not: used wins
    if (aCount > 0) return -1
    if (bCount > 0) return 1
    // Neither used: alphabetical
    return a.name.localeCompare(b.name)
  })

  const filtered = ranked.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  )

  // Index of first never-used exercise — used to render a divider
  const firstUnusedIndex = filtered.findIndex((e) => (usageCount.get(e.id) ?? 0) === 0)

  async function createAndSelect() {
    const name = query.trim()
    if (!name) return
    setLoading(true)
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name })
      .select()
      .single()
    setLoading(false)
    if (data) onSelect(data)
    else if (error) alert(`Error: ${error.message}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto flex flex-col rounded-t-3xl"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
        </div>
        <div className="px-5 pt-2 pb-3">
          <input
            autoFocus
            type="text"
            placeholder="Search or add exercise…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-base rounded-xl outline-none"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>

        {filterCategory && (
          <div className="flex items-center justify-between px-5 pb-3 gap-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {showAll
                ? 'Showing all exercises'
                : `Filtered to ${CATEGORY_LABELS[filterCategory]} day`}
            </span>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold px-3 py-1 rounded-full transition-opacity active:opacity-60"
              style={{
                background: 'var(--surface-elevated)',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
              }}
            >
              {showAll ? `Filter to ${CATEGORY_LABELS[filterCategory]}` : 'Show all'}
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-2">
          {filtered.length === 0 && !query && filterCategory && !showAll && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No exercises matching {CATEGORY_LABELS[filterCategory]}.
              </p>
              <button
                onClick={() => setShowAll(true)}
                className="mt-2 text-sm font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Show all exercises
              </button>
            </div>
          )}
          {filtered.length > 0 && firstUnusedIndex !== 0 && !query && (
            <div
              className="text-[10px] font-semibold tracking-wider uppercase px-3 pt-2 pb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Your Exercises
            </div>
          )}
          {filtered.map((ex, i) => {
            const exWithExtras = ex as typeof ex & { equipment?: string[] | null }
            const equipment = exWithExtras.equipment?.[0]
            const count = usageCount.get(ex.id) ?? 0
            const showDivider = !query && firstUnusedIndex > 0 && i === firstUnusedIndex
            return (
              <div key={ex.id}>
                {showDivider && (
                  <div
                    className="text-[10px] font-semibold tracking-wider uppercase px-3 pt-3 pb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    All Exercises
                  </div>
                )}
                <button
                  onClick={() => onSelect(ex)}
                  className="w-full text-left px-3 py-3 text-base rounded-xl transition-colors active:bg-white/5"
                  style={{ color: 'var(--text)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex-1">{ex.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {count > 0 && (
                        <span
                          className="text-[10px] font-semibold tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          ×{count}
                        </span>
                      )}
                      <MuscleBadge exercise={ex} />
                    </div>
                  </div>
                  {equipment && (
                    <div
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {equipment}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
          {query && filtered.length === 0 && (
            <button
              onClick={createAndSelect}
              disabled={loading}
              className="w-full mx-1 my-2 py-3 text-sm font-semibold rounded-xl disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {loading ? 'Adding…' : `+ Add "${query}"`}
            </button>
          )}
        </div>
        <div className="px-5 py-3 text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Exercise data from{' '}
          <a
            href="https://wger.de"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            wger.de
          </a>
          {' '}· CC-BY-SA 4.0
        </div>
      </div>
    </div>
  )
}
