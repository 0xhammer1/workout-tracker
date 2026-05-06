'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import Avatar from '@/components/Avatar'
import {
  sendFriendRequest,
  type FriendUser,
} from '@/lib/friends'

// Contacts Picker API (Chrome Android / Safari iOS 14.5+)
interface ContactsManager {
  select(props: string[], opts?: { multiple?: boolean }): Promise<Array<{ name?: string[]; email?: string[] }>>
}
declare global {
  interface Navigator { contacts?: ContactsManager }
}

type Step = 1 | 2 | 3

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const { user, markOnboardingComplete } = useAuth()

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Step 1 — birthdate
  const [birthdate, setBirthdate] = useState('')

  // Step 2 — height
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')

  // Step 3 — contacts
  const [contactMatches, setContactMatches] = useState<FriendUser[] | null>(null)
  const [contactsSearching, setContactsSearching] = useState(false)
  const [contactsUnsupported, setContactsUnsupported] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const contactsSupported = typeof navigator !== 'undefined' && 'contacts' in navigator

  async function saveAndAdvance(fields: Record<string, unknown>) {
    if (!user) return
    await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' })
  }

  async function handleStep1(skip = false) {
    if (!skip && birthdate) await saveAndAdvance({ birthdate })
    setStep(2)
  }

  async function handleStep2(skip = false) {
    if (!skip) {
      const f = parseInt(feet)
      const i = parseInt(inches || '0')
      if (!isNaN(f) && f > 0) {
        const cm = Math.round(f * 30.48 + i * 2.54)
        await saveAndAdvance({ height_cm: cm })
      }
    }
    setStep(3)
  }

  async function syncContacts() {
    if (!navigator.contacts) { setContactsUnsupported(true); return }
    setContactsSearching(true)
    try {
      const raw = await navigator.contacts.select(['name', 'email'], { multiple: true })
      const emails = raw.flatMap((c) => c.email ?? []).filter(Boolean)
      if (emails.length === 0) { setContactMatches([]); return }

      // Search for each email in parallel, deduplicate by id
      const results = await Promise.all(
        emails.map((email) =>
          supabase.rpc('search_users', { query: email }).then(({ data }) => data ?? [])
        )
      )
      const seen = new Set<string>()
      const matches: FriendUser[] = []
      for (const batch of results) {
        for (const u of batch as FriendUser[]) {
          if (!seen.has(u.id)) { seen.add(u.id); matches.push(u) }
        }
      }
      setContactMatches(matches)
    } catch {
      // User dismissed the contacts picker — treat as empty result
      setContactMatches([])
    } finally {
      setContactsSearching(false)
    }
  }

  async function addFriend(target: FriendUser) {
    if (!user) return
    await sendFriendRequest(target.id, user.id)
    setSentIds((prev) => new Set(prev).add(target.id))
  }

  async function finish() {
    if (!user) return
    setSaving(true)
    await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, onboarding_complete: true }, { onConflict: 'user_id' })
    markOnboardingComplete()
    router.replace('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-14 pb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                background: s === step ? 'var(--accent)' : s < step ? 'rgba(99,102,241,0.4)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* ── Step 1: Birthdate ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col min-h-[60vh] justify-between">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                Step 1 of {TOTAL_STEPS}
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-2">When were you born?</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Helps us tailor recommendations as you progress.
              </p>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-4 text-base rounded-2xl outline-none"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>
            <div className="flex flex-col gap-3 pt-8">
              <button
                onClick={() => handleStep1(false)}
                className="w-full py-4 text-base font-semibold rounded-2xl transition-all active:scale-[0.98]"
                style={{ background: 'var(--accent)', color: 'white', opacity: birthdate ? 1 : 0.5 }}
                disabled={!birthdate}
              >
                Continue
              </button>
              <button
                onClick={() => handleStep1(true)}
                className="w-full py-3 text-sm font-medium transition-opacity active:opacity-60"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Height ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col min-h-[60vh] justify-between">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                Step 2 of {TOTAL_STEPS}
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-2">How tall are you?</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Used to track your physique progress over time.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Feet
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="5"
                    min={1}
                    max={8}
                    value={feet}
                    onChange={(e) => setFeet(e.target.value)}
                    className="w-full px-4 py-4 text-base rounded-2xl outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Inches
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="10"
                    min={0}
                    max={11}
                    value={inches}
                    onChange={(e) => setInches(e.target.value)}
                    className="w-full px-4 py-4 text-base rounded-2xl outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-8">
              <button
                onClick={() => handleStep2(false)}
                className="w-full py-4 text-base font-semibold rounded-2xl transition-all active:scale-[0.98]"
                style={{ background: 'var(--accent)', color: 'white', opacity: feet ? 1 : 0.5 }}
                disabled={!feet}
              >
                Continue
              </button>
              <button
                onClick={() => handleStep2(true)}
                className="w-full py-3 text-sm font-medium transition-opacity active:opacity-60"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contacts ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col min-h-[60vh]">
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                Step 3 of {TOTAL_STEPS}
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Find your gym buddies</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                See who from your contacts is already on Lift Labs.
              </p>

              {contactMatches === null && (
                <>
                  {contactsUnsupported || !contactsSupported ? (
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-sm font-semibold mb-1">Not available on this browser</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        You can find friends manually from the Friends tab after setup.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={syncContacts}
                      disabled={contactsSearching}
                      className="w-full py-4 text-base font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: 'var(--surface)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                    >
                      {contactsSearching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                          Searching…
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Sync Contacts
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {contactMatches !== null && contactMatches.length === 0 && (
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm font-semibold mb-1">No matches found</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    None of your contacts are on Lift Labs yet. Invite them!
                  </p>
                </div>
              )}

              {contactMatches && contactMatches.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold px-4 pt-4 pb-2" style={{ color: 'var(--text-secondary)' }}>
                    {contactMatches.length} match{contactMatches.length > 1 ? 'es' : ''} found
                  </p>
                  {contactMatches.map((u, i) => {
                    const name = u.display_name ?? u.email ?? '—'
                    const sent = sentIds.has(u.id)
                    return (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                          <Avatar src={u.avatar_url} name={name} size={40} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{name}</p>
                          {u.display_name && (
                            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => addFriend(u)}
                          disabled={sent}
                          className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-60 shrink-0"
                          style={sent
                            ? { background: 'var(--surface-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }
                            : { background: 'var(--accent)', color: 'white' }
                          }
                        >
                          {sent ? 'Sent ✓' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-8">
              <button
                onClick={finish}
                disabled={saving}
                className="w-full py-4 text-base font-semibold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {saving ? 'Finishing up…' : "Let's go!"}
              </button>
              {contactMatches === null && contactsSupported && !contactsUnsupported && (
                <button
                  onClick={finish}
                  disabled={saving}
                  className="w-full py-3 text-sm font-medium transition-opacity active:opacity-60"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
