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
      router.replace(data.session ? '/' : '/login')
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
