import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import { AuthProvider } from '@/lib/auth'
import AuthGate from '@/components/AuthGate'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lift Labs',
  description: 'Track your gains',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Lift Labs',
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
        <AuthProvider>
          <AuthGate>
            <div className="max-w-lg mx-auto px-5 pt-safe pb-nav">
              {children}
            </div>
            <NavWithAuth />
          </AuthGate>
        </AuthProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}

// Hide the bottom nav on the login screen
function NavWithAuth() {
  return <Nav />
}
