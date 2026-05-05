'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/history', label: 'History' },
  { href: '/progress', label: 'Progress' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t" style={{ background: '#0d0d0d', borderColor: '#1c1c1c' }}>
      <div className="max-w-lg mx-auto flex">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-4 gap-1 text-xs tracking-widest uppercase transition-colors"
              style={{ color: active ? 'var(--gold)' : '#555' }}
            >
              {active && (
                <span className="w-4 h-px mb-1" style={{ background: 'var(--gold)' }} />
              )}
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
