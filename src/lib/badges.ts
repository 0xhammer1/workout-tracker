// Badge catalog + earning logic. Earning is computed on demand from
// counts; we don't persist badge state. The celebration popup is a
// moment-in-time thing, fired from the spot that just crossed a milestone.

export type BadgeCategory = 'count' | 'type' | 'social' | 'influence'

export interface Badge {
  id: string
  category: BadgeCategory
  label: string
  description: string
  emoji: string
  congratsTitle: string
  congratsBody: string
}

// Count milestones
export const COUNT_MILESTONES = [1, 10, 25, 50, 100, 250, 500] as const

const COUNT_COPY: Record<number, { title: string; body: string }> = {
  1:   { title: 'First workout in the books!',    body: 'Welcome to the gym, friend.' },
  10:  { title: 'Congrats on your 10th workout!', body: "You're building a habit. Keep crushing." },
  25:  { title: 'Congrats on your 25th workout!', body: 'Quarter of the way to 100. Keep at it.' },
  50:  { title: 'Congrats on your 50th workout!', body: 'Keep crushing.' },
  100: { title: 'Congrats on your 100th workout!', body: 'Triple digits. Different breed.' },
  250: { title: 'Congrats on 250 workouts!',      body: 'Beast mode.' },
  500: { title: 'Congrats on 500 workouts!',      body: 'Legendary status.' },
}

const COUNT_EMOJI: Record<number, string> = {
  1: '🎯', 10: '💪', 25: '🔥', 50: '⭐️', 100: '💯', 250: '🏆', 500: '👑',
}

// Influence milestones (distinct people who copied any of your workouts)
export const INFLUENCE_MILESTONES = [1, 5, 10, 25, 50] as const

const INFLUENCE_COPY: Record<number, { label: string; title: string; body: string; emoji: string }> = {
  1:  { label: 'Workout Copied',  emoji: '📋', title: 'Someone copied your workout!',      body: 'Your training is inspiring. Keep at it.' },
  5:  { label: 'Trendsetter',     emoji: '📈', title: 'Trendsetter!',                       body: "5 people have used your workouts. You're setting the pace." },
  10: { label: 'Gym-fluencer',    emoji: '🌐', title: 'Gym-fluencer!',                      body: '10 people have used your workouts. The gym has an influencer.' },
  25: { label: 'Going Viral',     emoji: '🚀', title: 'Going viral!',                       body: '25 people have used your workouts. Certified gym content creator.' },
  50: { label: 'Cult Leader',     emoji: '🧠', title: 'Cult leader.',                       body: '50 people have trained off your workouts. You might need a podcast.' },
}

export const REACTION_MILESTONES = [10, 25, 50] as const

export const BADGES: Badge[] = [
  // ── Workout count ───────────────────────────────────────────────────────
  ...COUNT_MILESTONES.map<Badge>((n) => ({
    id: `count_${n}`,
    category: 'count' as BadgeCategory,
    label: n === 1 ? 'First Workout' : `${n} Workouts`,
    description: n === 1 ? 'Log your first workout' : `Hit ${n} workouts`,
    emoji: COUNT_EMOJI[n],
    congratsTitle: COUNT_COPY[n].title,
    congratsBody: COUNT_COPY[n].body,
  })),

  // ── Workout type ─────────────────────────────────────────────────────────
  {
    id: 'type_push', category: 'type',
    label: 'First Push Day', description: 'Log your first push workout',
    emoji: '🤜', congratsTitle: 'First push day!', congratsBody: 'Chest, shoulders, triceps. Welcome.',
  },
  {
    id: 'type_pull', category: 'type',
    label: 'First Pull Day', description: 'Log your first pull workout',
    emoji: '🤛', congratsTitle: 'First pull day!', congratsBody: 'Back and biceps. Earned.',
  },
  {
    id: 'type_legs', category: 'type',
    label: 'First Leg Day', description: 'Log your first leg workout',
    emoji: '🦵', congratsTitle: 'First leg day!', congratsBody: "You didn't skip. Respect.",
  },

  // ── Social (photos + likes) ───────────────────────────────────────────────
  {
    id: 'photo_first', category: 'social',
    label: 'First Thirst Trap', description: 'Share your first workout photo',
    emoji: '🥵', congratsTitle: 'First thirst trap!', congratsBody: "We're parched. Keep showing off that progress.",
  },
  {
    id: 'reactions_10', category: 'social',
    label: '10 Likes', description: 'Get 10 likes on a single thirst trap',
    emoji: '🔥', congratsTitle: "You're on fire! 🔥", congratsBody: '10 likes on your thirst trap. The people demand more.',
  },
  {
    id: 'reactions_25', category: 'social',
    label: '25 Likes', description: 'Get 25 likes on a single thirst trap',
    emoji: '⚡️', congratsTitle: 'Certified hottie ⚡️', congratsBody: '25 likes on a single thirst trap. Beast.',
  },
  {
    id: 'reactions_50', category: 'social',
    label: '50 Likes', description: 'Get 50 likes on a single thirst trap',
    emoji: '🌟', congratsTitle: 'Main character energy 🌟', congratsBody: '50 likes on a thirst trap. The gym is a stage.',
  },

  // ── Influence (workout copies) ────────────────────────────────────────────
  ...INFLUENCE_MILESTONES.map<Badge>((n) => ({
    id: `influence_${n}`,
    category: 'influence' as BadgeCategory,
    label: INFLUENCE_COPY[n].label,
    description: INFLUENCE_COPY[n].body,
    emoji: INFLUENCE_COPY[n].emoji,
    congratsTitle: INFLUENCE_COPY[n].title,
    congratsBody: INFLUENCE_COPY[n].body,
  })),
]

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

export interface UserBadgeStats {
  workoutCount: number
  categoriesEverDone: Set<string>
  photoCount: number
  maxPhotoReactions: number
  workoutCopyCount: number
}

export function earnedBadgeIds(stats: UserBadgeStats): Set<string> {
  const out = new Set<string>()
  for (const n of COUNT_MILESTONES) {
    if (stats.workoutCount >= n) out.add(`count_${n}`)
  }
  for (const cat of ['push', 'pull', 'legs']) {
    if (stats.categoriesEverDone.has(cat)) out.add(`type_${cat}`)
  }
  if (stats.photoCount >= 1) out.add('photo_first')
  for (const n of REACTION_MILESTONES) {
    if (stats.maxPhotoReactions >= n) out.add(`reactions_${n}`)
  }
  for (const n of INFLUENCE_MILESTONES) {
    if (stats.workoutCopyCount >= n) out.add(`influence_${n}`)
  }
  return out
}

// Returns up to one badge per category (highest earned) for the profile preview.
export function previewBadges(earned: Set<string>): Badge[] {
  const out: Badge[] = []

  // Count: highest milestone
  for (const n of [...COUNT_MILESTONES].reverse()) {
    if (earned.has(`count_${n}`)) { const b = badgeById(`count_${n}`); if (b) { out.push(b); break } }
  }

  // Type: all earned (max 3)
  for (const cat of ['push', 'pull', 'legs']) {
    const b = badgeById(`type_${cat}`)
    if (b && earned.has(b.id)) out.push(b)
  }

  // Social: highest likes badge (or first photo if no likes yet)
  let highestSocial: Badge | null = null
  for (const n of REACTION_MILESTONES) {
    if (earned.has(`reactions_${n}`)) { highestSocial = badgeById(`reactions_${n}`) ?? null }
  }
  if (highestSocial) out.push(highestSocial)
  else if (earned.has('photo_first')) { const b = badgeById('photo_first'); if (b) out.push(b) }

  // Influence: highest milestone
  for (const n of [...INFLUENCE_MILESTONES].reverse()) {
    if (earned.has(`influence_${n}`)) { const b = badgeById(`influence_${n}`); if (b) { out.push(b); break } }
  }

  return out
}
