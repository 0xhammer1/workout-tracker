'use client'

import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from '@/lib/categories'

export default function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category || !(category in CATEGORY_LABELS)) return null
  const c = category as Category
  const colors = CATEGORY_COLORS[c]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full shrink-0"
      style={{ background: colors.bg, color: colors.color }}
    >
      {CATEGORY_LABELS[c]}
    </span>
  )
}
