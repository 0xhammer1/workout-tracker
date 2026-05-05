'use client'

interface AvatarProps {
  src: string | null
  name: string
  size?: number
  className?: string
}

export default function Avatar({ src, name, size = 96, className = '' }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Profile'}
        className={`object-cover w-full h-full ${className}`}
      />
    )
  }
  const initials = computeInitials(name)
  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold tracking-tight ${className}`}
      style={{
        background: colorFromName(name),
        color: 'white',
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials}
    </div>
  )
}

function computeInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 42%)`
}
