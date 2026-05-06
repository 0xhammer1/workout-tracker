// Badge catalog + earning logic. Earning is computed on demand from
// counts; we don't persist badge state. The celebration popup is a
// moment-in-time thing, fired from the spot that just crossed a
// milestone (workout Done, photo upload).

export type BadgeCategory = 'count' | 'type' | 'photo' | 'reactions'

export interface Badge {
  id: string
  category: BadgeCategory
  label: string
  description: string
  emoji: string
  congratsTitle: string
  congratsBody: string
}

// Count milestones — keep gaps wide enough that hitting one feels earned.
export const COUNT_MILESTONES = [1, 10, 25, 50, 100, 250, 500] as const

const COUNT_COPY: Record<number, { title: string; body: string }> = {
  1:   { title: 'First workout in the books!',   body: 'Welcome to the gym, friend.' },
  10:  { title: 'Congrats on your 10th workout!', body: 'You’re building a habit. Keep crushing.' },
  25:  { title: 'Congrats on your 25th workout!', body: 'Quarter of the way to 100. Keep at it.' },
  50:  { title: 'Congrats on your 50th workout!', body: 'Keep crushing.' },
  100: { title: 'Congrats on your 100th workout!', body: 'Triple digits. Different breed.' },
  250: { title: 'Congrats on 250 workouts!',     body: 'Beast mode.' },
  500: { title: 'Congrats on 500 workouts!',     body: 'Legendary status.' },
}

const COUNT_EMOJI: Record<number, string> = {
  1: '🎯', 10: '💪', 25: '🔥', 50: '⭐️', 100: '💯', 250: '🏆', 500: '👑',
}

export const BADGES: Badge[] = [
  ...COUNT_MILESTONES.map<Badge>((n) => ({
    id: `count_${n}`,
    category: 'count',
    label: n === 1 ? 'First Workout' : `${n} Workouts`,
    description: n === 1 ? 'Log your first workout' : `Hit ${n} workouts`,
    emoji: COUNT_EMOJI[n],
    congratsTitle: COUNT_COPY[n].title,
    congratsBody: COUNT_COPY[n].body,
  })),

  {
    id: 'type_push',
    category: 'type',
    label: 'First Push Day',
    description: 'Log your first push workout',
    emoji: '🤜',
    congratsTitle: 'First push day!',
    congratsBody: 'Chest, shoulders, triceps. Welcome.',
  },
  {
    id: 'type_pull',
    category: 'type',
    label: 'First Pull Day',
    description: 'Log your first pull workout',
    emoji: '🤛',
    congratsTitle: 'First pull day!',
    congratsBody: 'Back and biceps. Earned.',
  },
  {
    id: 'type_legs',
    category: 'type',
    label: 'First Leg Day',
    description: 'Log your first leg workout',
    emoji: '🦵',
    congratsTitle: 'First leg day!',
    congratsBody: 'You didn’t skip. Respect.',
  },

  {
    id: 'photo_first',
    category: 'photo',
    label: 'First Thirst Trap',
    description: 'Share your first workout photo',
    emoji: '🥵',
    congratsTitle: 'First thirst trap!',
    congratsBody: 'We’re parched. Keep showing off that progress.',
  },

  {
    id: 'reactions_10',
    category: 'reactions',
    label: '10 Likes',
    description: 'Get 10 likes on a single thirst trap',
    emoji: '🔥',
    congratsTitle: 'You’re on fire! 🔥',
    congratsBody: '10 likes on your thirst trap. The people demand more.',
  },
  {
    id: 'reactions_25',
    category: 'reactions',
    label: '25 Likes',
    description: 'Get 25 likes on a single thirst trap',
    emoji: '⚡️',
    congratsTitle: 'Certified hottie ⚡️',
    congratsBody: '25 likes on a single thirst trap. Beast.',
  },
  {
    id: 'reactions_50',
    category: 'reactions',
    label: '50 Likes',
    description: 'Get 50 likes on a single thirst trap',
    emoji: '🌟',
    congratsTitle: 'Main character energy 🌟',
    congratsBody: '50 likes on a thirst trap. The gym is a stage.',
  },
]

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

export interface UserBadgeStats {
  workoutCount: number
  categoriesEverDone: Set<string>
  photoCount: number
  // Highest reaction count on any single photo the user owns
  maxPhotoReactions: number
}

export const REACTION_MILESTONES = [10, 25, 50] as const

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
  return out
}

// Returns up to one badge per category, the highest/latest earned, suitable
// for showing on the profile preview (with "see all" for the rest).
export function previewBadges(earned: Set<string>): Badge[] {
  const out: Badge[] = []

  // Count: highest milestone earned
  let highestCount: Badge | null = null
  for (const n of COUNT_MILESTONES) {
    if (earned.has(`count_${n}`)) {
      const b = badgeById(`count_${n}`)
      if (b) highestCount = b
    }
  }
  if (highestCount) out.push(highestCount)

  // Type: include all earned type badges (max 3)
  for (const cat of ['push', 'pull', 'legs']) {
    const id = `type_${cat}`
    if (earned.has(id)) {
      const b = badgeById(id)
      if (b) out.push(b)
    }
  }

  // Photo
  if (earned.has('photo_first')) {
    const b = badgeById('photo_first')
    if (b) out.push(b)
  }

  // Reactions: highest milestone earned
  let highestReactions: Badge | null = null
  for (const n of REACTION_MILESTONES) {
    if (earned.has(`reactions_${n}`)) {
      const b = badgeById(`reactions_${n}`)
      if (b) highestReactions = b
    }
  }
  if (highestReactions) out.push(highestReactions)

  return out
}
