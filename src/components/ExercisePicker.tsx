'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'

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
    const name = (query).trim()
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
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto flex flex-col"
        style={{ background: '#0d0d0d', borderTop: '1px solid #1c1c1c', maxHeight: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4" style={{ borderBottom: '1px solid #1c1c1c' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={{ background: '#111', color: '#f0ede8', border: '1px solid #222' }}
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left px-5 py-4 text-sm transition-opacity hover:opacity-70"
              style={{ color: '#f0ede8', borderBottom: '1px solid #141414' }}
            >
              {ex.name}
            </button>
          ))}
          {query && filtered.length === 0 && (
            <div className="p-5">
              <button
                onClick={createAndSelect}
                disabled={loading}
                className="w-full py-3 text-xs tracking-widest uppercase disabled:opacity-40"
                style={{ background: 'var(--gold)', color: '#080808' }}
              >
                {loading ? 'Adding...' : `Add "${query}"`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
