interface Props {
  className?: string
  hairColor?: string
  skinColor?: string
  tankColor?: string
  shoeColor?: string
}

// Cute cartoon avatar — a person mid-bicep-curl in a muscle tank and converse.
// Easily tweakable colors via props (hair, skin, tank, shoes).
export default function MitchellAvatar({
  className = '',
  hairColor = '#3b2417',
  skinColor = '#f3c9a8',
  tankColor = '#6366f1',
  shoeColor = '#1a1a1a',
}: Props) {
  const skinShade = '#e0a98a'
  const tankShade = '#4f52d4'
  const shoeStripe = '#ffffff'

  return (
    <svg viewBox="0 0 140 160" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Back leg */}
      <rect x="78" y="118" width="14" height="22" rx="6" fill={skinColor} />
      {/* Front leg */}
      <rect x="54" y="118" width="14" height="22" rx="6" fill={skinColor} />

      {/* Converse — back shoe */}
      <rect x="74" y="138" width="22" height="9" rx="3" fill={shoeColor} />
      <rect x="74" y="146" width="22" height="3" fill={shoeStripe} />
      <circle cx="79" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="83" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="87" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="91" cy="143" r="0.8" fill={shoeStripe} />

      {/* Converse — front shoe */}
      <rect x="50" y="138" width="22" height="9" rx="3" fill={shoeColor} />
      <rect x="50" y="146" width="22" height="3" fill={shoeStripe} />
      <circle cx="55" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="59" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="63" cy="143" r="0.8" fill={shoeStripe} />
      <circle cx="67" cy="143" r="0.8" fill={shoeStripe} />

      {/* Torso — muscle tank */}
      <path
        d="M 50 64 Q 48 70 48 80 L 48 118 Q 48 122 52 122 L 94 122 Q 98 122 98 118 L 98 80 Q 98 70 96 64 Z"
        fill={tankColor}
      />
      {/* Tank shading down the side */}
      <path d="M 90 70 L 92 118 L 98 118 L 98 80 Q 98 72 96 64 Z" fill={tankShade} opacity="0.5" />

      {/* Tank straps + neckline cutout (showing skin) */}
      <path d="M 56 64 Q 60 56 70 56 Q 80 56 90 64 L 86 64 Q 80 60 70 60 Q 60 60 60 64 Z" fill={skinColor} />

      {/* Shoulders / upper chest skin showing through arm holes */}
      <ellipse cx="48" cy="68" rx="4" ry="6" fill={skinColor} />
      <ellipse cx="98" cy="68" rx="4" ry="6" fill={skinColor} />

      {/* Right arm — bent up doing curl with dumbbell */}
      {/* Upper arm (relaxed, hanging) */}
      <rect x="92" y="64" width="11" height="20" rx="5" fill={skinColor} />
      {/* Forearm (bent up, flexed) */}
      <rect x="92" y="44" width="11" height="22" rx="5" fill={skinColor} />
      {/* Bicep peak */}
      <ellipse cx="97" cy="62" rx="6.5" ry="4.5" fill={skinShade} opacity="0.6" />
      {/* Hand */}
      <circle cx="97" cy="42" r="6" fill={skinColor} />

      {/* Dumbbell in right hand */}
      <rect x="89" y="36" width="16" height="3" rx="1" fill="#3a3a3a" />
      <rect x="85" y="32" width="6" height="11" rx="1.5" fill="#1a1a1a" />
      <rect x="103" y="32" width="6" height="11" rx="1.5" fill="#1a1a1a" />

      {/* Left arm — at side */}
      <rect x="43" y="64" width="11" height="34" rx="5" fill={skinColor} />
      {/* Hand */}
      <circle cx="48.5" cy="100" r="5" fill={skinColor} />

      {/* Neck */}
      <rect x="64" y="46" width="12" height="10" fill={skinColor} />

      {/* Head */}
      <ellipse cx="70" cy="34" rx="18" ry="20" fill={skinColor} />

      {/* Hair — short, swept */}
      <path
        d="M 53 28 Q 56 14 70 14 Q 86 14 88 30 Q 88 22 84 18 Q 80 16 75 17 Q 68 18 62 22 Q 55 26 53 28 Z"
        fill={hairColor}
      />
      <path d="M 54 26 Q 58 18 70 16 Q 82 16 86 26 L 86 30 Q 80 22 70 22 Q 60 22 54 30 Z" fill={hairColor} />

      {/* Ears */}
      <ellipse cx="52" cy="36" rx="3" ry="4" fill={skinColor} />
      <ellipse cx="88" cy="36" rx="3" ry="4" fill={skinColor} />

      {/* Eyebrows */}
      <path d="M 60 30 Q 64 28 67 30" stroke={hairColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M 73 30 Q 76 28 80 30" stroke={hairColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="63" cy="35" r="1.8" fill="#1a1a1a" />
      <circle cx="77" cy="35" r="1.8" fill="#1a1a1a" />
      <circle cx="63.5" cy="34.5" r="0.6" fill="white" />
      <circle cx="77.5" cy="34.5" r="0.6" fill="white" />

      {/* Smile */}
      <path d="M 65 42 Q 70 46 75 42" stroke="#5a3825" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <ellipse cx="59" cy="40" rx="2.5" ry="1.5" fill="#f4a89a" opacity="0.5" />
      <ellipse cx="81" cy="40" rx="2.5" ry="1.5" fill="#f4a89a" opacity="0.5" />

      {/* Sweat drop (effort!) */}
      <path
        d="M 38 30 Q 36 33 38 36 Q 40 33 38 30"
        fill="#7dd3fc"
        opacity="0.8"
      />
    </svg>
  )
}
