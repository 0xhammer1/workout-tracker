'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'
import CategoryBadge from '@/components/CategoryBadge'

export default function Home() {
  const router = useRouter()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentWorkouts(data ?? [])
        setLoading(false)
      })
  }, [])

  async function startWorkout() {
    setStarting(true)
    const { data, error } = await supabase
      .from('workouts')
      .insert({ date: new Date().toISOString().split('T')[0] })
      .select()
      .single()
    if (data) router.push(`/workout/${data.id}`)
    else {
      alert(`Error: ${error?.message}`)
      setStarting(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div>
      <header className="pt-8 pb-8">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {greeting}
        </p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Welcome, Mitchell</h1>
        <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
          Track your gains.
        </p>
      </header>

      <button
        onClick={startWorkout}
        disabled={starting}
        className="w-full font-semibold text-base py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 mb-10"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        {starting ? 'Starting…' : 'Start Workout'}
      </button>

      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Recent Workouts
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No workouts yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Tap Start to begin.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {recentWorkouts.map((w, i) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="flex items-center justify-between px-4 py-4 transition-colors active:bg-white/5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-medium">
                      {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <CategoryBadge category={w.category} />
                  </div>
                  {w.notes && (
                    <div className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {w.notes}
                    </div>
                  )}
                </div>
                <span className="text-lg ml-2" style={{ color: 'var(--text-tertiary)' }}>›</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
