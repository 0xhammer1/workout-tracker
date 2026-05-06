'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login', '/auth/callback']

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, onboardingComplete } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p))
  const isOnboarding = pathname.startsWith('/onboarding')

  useEffect(() => {
    if (loading) return
    if (!session && !isPublic) {
      if (typeof window !== 'undefined' && pathname.startsWith('/workout/')) {
        sessionStorage.setItem('loginRef', pathname)
      }
      router.replace('/login')
      return
    }
    if (session && pathname === '/login') { router.replace('/'); return }
    // Onboarding redirect disabled — re-enable when flow is ready:
    // if (session && onboardingComplete === false && !isOnboarding) {
    //   router.replace('/onboarding')
    // }
  }, [session, loading, isPublic, isOnboarding, pathname, onboardingComplete, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!session && !isPublic) return null
  return <>{children}</>
}
