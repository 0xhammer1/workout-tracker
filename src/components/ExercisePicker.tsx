'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'
import MuscleBadge from './MuscleBadge'

interface Props {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExercisePicker({ onSelect, onClose }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => setExercises(data ?? []))
  }, [])

  const filtered = exercises.filter((e) =>
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
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto flex flex-col rounded-t-3xl"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', maxHeight: '80vh' }}
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
        <div className="overflow-y-auto flex-1 px-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left px-3 py-3.5 text-base rounded-xl transition-colors active:bg-white/5 flex items-center justify-between gap-2"
              style={{ color: 'var(--text)' }}
            >
              <span className="truncate">{ex.name}</span>
              <MuscleBadge exerciseName={ex.name} />
            </button>
          ))}
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
        <div className="h-4" />
      </div>
    </div>
  )
}
