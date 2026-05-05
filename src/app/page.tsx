'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Workout } from '@/lib/types'
import DinoLogo from '@/components/DinoLogo'

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
      <div className="flex flex-col items-center mt-6 mb-6">
        <DinoLogo className="w-32 h-32" />
        <h1 className="text-2xl font-bold mt-2">Dino-Sore</h1>
        <p className="text-slate-500 text-sm">Track your gains 🦕</p>
      </div>

      <button
        onClick={startWorkout}
        disabled={starting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-lg py-4 rounded-2xl transition-colors disabled:opacity-60 mb-8"
      >
        {starting ? 'Starting...' : 'Start Workout'}
      </button>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Recent Workouts
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No workouts yet. Hit Start to begin!
          </p>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="block bg-slate-900 hover:bg-slate-800 rounded-2xl px-4 py-3 transition-colors"
              >
                <div className="font-medium">
                  {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                {w.notes && <div className="text-sm text-slate-500 mt-0.5">{w.notes}</div>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
