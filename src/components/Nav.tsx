'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/history', label: 'History', icon: '📋' },
  { href: '/progress', label: 'Progress', icon: '📈' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe">
      <div className="max-w-lg mx-auto flex">
        {links.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
                active ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
