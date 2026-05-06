'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/history', label: 'History' },
  { href: '/progress', label: 'Progress' },
  { href: '/friends', label: 'Friends' },
  { href: '/profile', label: 'Profile' },
]

const HIDE_ON = ['/login', '/auth/callback']

export default function Nav() {
  const pathname = usePathname()

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 backdrop-blur-xl"
      style={{
        background: 'rgba(15, 16, 20, 0.85)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="max-w-lg mx-auto flex">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex items-center justify-center py-3.5 text-sm font-medium transition-colors min-h-[48px]"
              style={{
                color: active ? 'var(--text)' : 'var(--text-tertiary)',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
