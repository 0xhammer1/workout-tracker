import type { MuscleGroup } from './muscleGroups'

export const CATEGORIES = ['push', 'pull', 'legs'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
}

export const CATEGORY_MUSCLE_GROUPS: Record<Category, MuscleGroup[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps'],
  legs: ['legs', 'glutes'],
}

export const CATEGORY_COLORS: Record<Category, { color: string; bg: string }> = {
  push: { color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)' },
  pull: { color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.15)' },
  legs: { color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)' },
}
