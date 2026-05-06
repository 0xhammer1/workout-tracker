'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  onboardingComplete: boolean | null
  markOnboardingComplete: () => void
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  onboardingComplete: null,
  markOnboardingComplete: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) setOnboardingComplete(null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  // Load onboarding status once we know who the user is
  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) return
    supabase
      .from('user_profiles')
      .select('onboarding_complete')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingComplete((data?.onboarding_complete as boolean) ?? false)
      })
  }, [session?.user?.id])

  function markOnboardingComplete() {
    setOnboardingComplete(true)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, onboardingComplete, markOnboardingComplete }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export async function signOut() {
  await supabase.auth.signOut()
}
