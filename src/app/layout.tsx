import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dino-Sore',
  description: 'Track your gains',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen antialiased`} style={{ background: '#080808', color: '#f0ede8' }}>
        <div className="max-w-lg mx-auto px-5 pb-28 pt-4">
          {children}
        </div>
        <Nav />
      </body>
    </html>
  )
}
