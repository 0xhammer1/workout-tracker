'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth, signOut } from '@/lib/auth'
import ConfirmDialog from '@/components/ConfirmDialog'

type Privacy = 'none' | 'minimal' | 'type_only' | 'full'

const PRIVACY_OPTIONS: { value: Privacy; title: string; body: string }[] = [
  { value: 'full', title: 'Full details', body: 'Friends see your category, exercises, sets, reps, and weights.' },
  { value: 'type_only', title: 'Type only', body: 'Friends see the date and category (push/pull/legs).' },
  { value: 'minimal', title: 'Minimal', body: 'Friends see that you worked out, nothing else.' },
  { value: 'none', title: 'Private', body: 'Workouts don’t appear in friends’ feeds.' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [privacy, setPrivacy] = useState<Privacy>('full')
  const [openSection, setOpenSection] = useState<'privacy' | null>('privacy')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_profiles')
      .select('default_privacy')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.default_privacy) setPrivacy(data.default_privacy as Privacy)
      })
  }, [user?.id])

  async function deleteAccount() {
    if (!user) return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setDeleting(false)
      setShowDeleteConfirm(false)
      alert(`Could not delete account: ${error.message}`)
      return
    }
    await signOut()
    router.replace('/')
  }

  async function setPrivacyLevel(level: Privacy) {
    if (!user) return
    setPrivacy(level)
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, default_privacy: level }, { onConflict: 'user_id' })
    if (error) alert(`Could not save: ${error.message}`)
  }

  return (
    <div>
      <header className="pt-8 pb-6 flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to profile"
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors active:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </header>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setOpenSection(openSection === 'privacy' ? null : 'privacy')}
          className="w-full flex items-center justify-between px-4 py-4 transition-colors active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-base font-semibold">Privacy</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'var(--text-tertiary)',
              transform: openSection === 'privacy' ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {openSection === 'privacy' && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {PRIVACY_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setPrivacyLevel(opt.value)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors active:bg-white/5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <div
                  className="w-5 h-5 rounded-full mt-0.5 shrink-0 flex items-center justify-center"
                  style={{
                    border: `2px solid ${privacy === opt.value ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: privacy === opt.value ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {privacy === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'white' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{opt.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {opt.body}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          className="px-5 py-2 text-sm font-semibold rounded-full transition-opacity active:opacity-60 disabled:opacity-40"
          style={{
            background: 'var(--surface)',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
          }}
        >
          {deleting ? 'Deleting…' : 'Delete Account'}
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete your account?"
        message="This permanently deletes all your workouts, weight logs, photos, and profile. There is no undo."
        confirmLabel="Delete Forever"
        destructive
        onConfirm={deleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
