import type { MuscleGroup } from './muscleGroups'

export const CATEGORIES = ['push', 'pull', 'legs', 'posterior', 'anterior'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  posterior: 'Posterior',
  anterior: 'Anterior',
}

export const CATEGORY_MUSCLE_GROUPS: Record<Category, MuscleGroup[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps'],
  legs: ['legs', 'glutes'],
  posterior: ['glutes', 'back', 'legs'],
  anterior: ['chest', 'shoulders', 'core', 'legs'],
}

export const CATEGORY_COLORS: Record<Category, { color: string; bg: string }> = {
  push:      { color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)' },
  pull:      { color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.15)' },
  legs:      { color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)' },
  posterior: { color: '#fdba74', bg: 'rgba(249, 115, 22, 0.15)' },
  anterior:  { color: '#c4b5fd', bg: 'rgba(139, 92, 246, 0.15)' },
}
