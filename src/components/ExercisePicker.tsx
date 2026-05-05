'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'
import { muscleForExercise } from '@/lib/muscleGroups'
import { CATEGORY_MUSCLE_GROUPS, CATEGORY_LABELS, type Category } from '@/lib/categories'

interface Props {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  filterCategory?: Category | null
}

export default function ExercisePicker({ onSelect, onClose, filterCategory }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => setExercises(data ?? []))
  }, [])

  // Apply category filter (unless user toggled "Show all")
  const categoryFiltered =
    filterCategory && !showAll
      ? exercises.filter((ex) => {
          const m = muscleForExercise(ex)
          return CATEGORY_MUSCLE_GROUPS[filterCategory].includes(m.group)
        })
      : exercises

  const filtered = categoryFiltered.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  )

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
          {filtered.map((ex) => {
            const exWithExtras = ex as typeof ex & { equipment?: string[] | null }
            const equipment = exWithExtras.equipment?.[0]
            return (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full text-left px-3 py-3 text-base rounded-xl transition-colors active:bg-white/5"
                style={{ color: 'var(--text)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate flex-1">{ex.name}</span>
                  <MuscleBadge exercise={ex} />
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
