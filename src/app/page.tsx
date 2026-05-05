'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'

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

  return (
    <div>
      <div className="mt-10 mb-10">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>
          Good to see you
        </p>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#f0ede8' }}>
          Welcome, Mitchell.
        </h1>
        <p className="mt-2 text-sm tracking-wider" style={{ color: '#555' }}>
          Track your gains.
        </p>
      </div>

      <button
        onClick={startWorkout}
        disabled={starting}
        className="w-full font-semibold text-sm tracking-widest uppercase py-4 mb-10 transition-colors disabled:opacity-40"
        style={{ background: 'var(--gold)', color: '#080808', letterSpacing: '0.15em' }}
      >
        {starting ? 'Starting...' : 'Start Workout'}
      </button>

      <section>
        <h2 className="text-xs tracking-widest uppercase mb-4" style={{ color: '#444' }}>
          Recent Workouts
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded animate-pulse" style={{ background: '#111' }} />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: '#444' }}>
            No workouts yet.
          </p>
        ) : (
          <div className="space-y-px">
            {recentWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="flex items-center justify-between px-0 py-4 border-b transition-opacity hover:opacity-70"
                style={{ borderColor: '#1c1c1c' }}
              >
                <span className="text-sm" style={{ color: '#f0ede8' }}>
                  {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-xs" style={{ color: 'var(--gold)' }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
