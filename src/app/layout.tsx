import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track your gains',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Workout',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/avatar.png',
    apple: '/avatar.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen antialiased`}>
        <div className="max-w-lg mx-auto px-5 pt-safe pb-nav">
          {children}
        </div>
        <Nav />
      </body>
    </html>
  )
}
