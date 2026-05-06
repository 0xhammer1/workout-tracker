'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase JS auto-detects the OAuth response in the URL hash and
    // sets the session. We just wait briefly and then redirect home.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { router.replace('/login'); return }

      // If the user arrived via a shared workout link, auto-friend the owner.
      const ref = typeof window !== 'undefined' ? sessionStorage.getItem('loginRef') : null
      if (ref) sessionStorage.removeItem('loginRef')

      if (ref?.startsWith('/workout/')) {
        const workoutId = ref.split('/workout/')[1]?.split('?')[0]
        if (workoutId) {
          const { data: ownerId } = await supabase.rpc('auto_friend_from_workout', {
            p_workout_id: workoutId,
            p_new_user_id: data.session.user.id,
          })
          if (ownerId) {
            router.replace(`/friends/${ownerId}`)
            return
          }
        }
      }

      router.replace('/')
    }, 300)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}
