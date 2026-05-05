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
  const [newName, setNewName] = useState('')
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
    const name = (newName || query).trim()
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-slate-900 w-full max-w-lg mx-auto rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800">
          <input
            autoFocus
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 active:bg-slate-700 border-b border-slate-800/50 text-slate-100"
            >
              {ex.name}
            </button>
          ))}
          {query && filtered.length === 0 && (
            <div className="p-4">
              <button
                onClick={createAndSelect}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium disabled:opacity-50"
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
