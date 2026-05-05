interface Props {
  className?: string
  hairColor?: string
  browColor?: string
  skinColor?: string
  skinShade?: string
  tankColor?: string
  shoeColor?: string
  shoeAccent?: string
}

// Stylized cartoon avatar — lean athletic build, bleached blonde + dark brows,
// black muscle tank, white converse, chain necklace, mid bicep curl.
export default function MitchellAvatar({
  className = '',
  hairColor = '#e8dcaa',
  browColor = '#2a1a10',
  skinColor = '#d9a878',
  skinShade = '#b8845d',
  tankColor = '#141414',
  shoeColor = '#f5f5f0',
  shoeAccent = '#1a1a1a',
}: Props) {
  const tankShade = '#0a0a0a'
  const goldChain = '#d4b34c'

  return (
    <svg viewBox="0 0 140 160" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Back leg */}
      <rect x="78" y="118" width="13" height="22" rx="5" fill={skinColor} />
      {/* Front leg */}
      <rect x="55" y="118" width="13" height="22" rx="5" fill={skinColor} />
      {/* Leg shading (hint of definition) */}
      <rect x="78" y="118" width="3" height="22" fill={skinShade} opacity="0.3" />
      <rect x="55" y="118" width="3" height="22" fill={skinShade} opacity="0.3" />

      {/* White Converse — back */}
      <rect x="74" y="138" width="20" height="9" rx="3" fill={shoeColor} />
      <rect x="74" y="146" width="20" height="3" fill={shoeAccent} />
      <circle cx="78" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="82" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="86" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="90" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="92" cy="143" r="2" fill={shoeColor} stroke={shoeAccent} strokeWidth="0.6" />

      {/* White Converse — front */}
      <rect x="51" y="138" width="20" height="9" rx="3" fill={shoeColor} />
      <rect x="51" y="146" width="20" height="3" fill={shoeAccent} />
      <circle cx="55" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="59" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="63" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="67" cy="143" r="0.8" fill={shoeAccent} />
      <circle cx="69" cy="143" r="2" fill={shoeColor} stroke={shoeAccent} strokeWidth="0.6" />

      {/* Torso — black tank, leaner silhouette */}
      <path
        d="M 52 68 Q 50 74 50 82 L 50 118 Q 50 122 54 122 L 92 122 Q 96 122 96 118 L 96 82 Q 96 74 94 68 Z"
        fill={tankColor}
      />
      {/* Tank shading */}
      <path d="M 88 72 L 90 118 L 96 118 L 96 82 Q 96 74 94 68 Z" fill={tankShade} opacity="0.7" />

      {/* Tank deep V neckline showing chest skin */}
      <path
        d="M 56 68 Q 60 60 70 60 Q 80 60 90 68 L 86 68 Q 80 64 73 70 L 73 80 L 70 84 L 67 80 L 67 70 Q 60 64 60 68 Z"
        fill={skinColor}
      />
      {/* Subtle ab definition hint */}
      <line x1="70" y1="78" x2="70" y2="84" stroke={skinShade} strokeWidth="0.6" opacity="0.5" />

      {/* Shoulders / arm openings showing skin */}
      <ellipse cx="50" cy="72" rx="4" ry="6" fill={skinColor} />
      <ellipse cx="96" cy="72" rx="4" ry="6" fill={skinColor} />

      {/* Chain necklace */}
      <path
        d="M 60 64 Q 70 70 80 64"
        stroke={goldChain}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="70" cy="69" r="1.2" fill={goldChain} />

      {/* Right arm — flexed up curling dumbbell */}
      <rect x="92" y="68" width="10" height="20" rx="5" fill={skinColor} />
      <rect x="92" y="48" width="10" height="22" rx="5" fill={skinColor} />
      {/* Bicep peak (definition) */}
      <ellipse cx="97" cy="64" rx="5.5" ry="4.2" fill={skinShade} opacity="0.55" />
      {/* Forearm shading */}
      <ellipse cx="97" cy="58" rx="3" ry="6" fill={skinShade} opacity="0.25" />
      {/* Hand */}
      <circle cx="97" cy="46" r="5.5" fill={skinColor} />

      {/* Dumbbell */}
      <rect x="89" y="40" width="16" height="3" rx="1" fill="#3a3a3a" />
      <rect x="85" y="36" width="6" height="11" rx="1.5" fill="#1a1a1a" />
      <rect x="103" y="36" width="6" height="11" rx="1.5" fill="#1a1a1a" />

      {/* Left arm — relaxed at side */}
      <rect x="44" y="68" width="10" height="34" rx="5" fill={skinColor} />
      <ellipse cx="49" cy="80" rx="4" ry="6" fill={skinShade} opacity="0.3" />
      {/* Hand */}
      <circle cx="49" cy="104" r="5" fill={skinColor} />

      {/* Neck */}
      <rect x="65" y="48" width="10" height="12" fill={skinColor} />
      <rect x="65" y="48" width="10" height="3" fill={skinShade} opacity="0.3" />

      {/* Head — slightly angular jaw */}
      <path
        d="M 52 32 Q 52 16 70 14 Q 88 16 88 32 L 88 42 Q 88 52 80 56 Q 75 58 70 58 Q 65 58 60 56 Q 52 52 52 42 Z"
        fill={skinColor}
      />
      {/* Jaw shadow */}
      <path
        d="M 60 54 Q 65 58 70 58 Q 75 58 80 54 L 80 50 Q 75 53 70 53 Q 65 53 60 50 Z"
        fill={skinShade}
        opacity="0.25"
      />

      {/* Hair — bleached short fade, thicker on top */}
      {/* Sides (faded) */}
      <path d="M 52 30 Q 52 22 56 18 L 56 32 Q 53 32 52 30 Z" fill={browColor} opacity="0.6" />
      <path d="M 88 30 Q 88 22 84 18 L 84 32 Q 87 32 88 30 Z" fill={browColor} opacity="0.6" />
      {/* Top hair */}
      <path
        d="M 53 28 Q 54 12 70 10 Q 86 12 87 28 Q 84 18 78 16 Q 72 15 68 18 Q 62 22 56 24 Q 53 26 53 28 Z"
        fill={hairColor}
      />
      {/* Hair texture strands */}
      <path
        d="M 60 16 Q 64 12 70 11 Q 76 12 80 16"
        stroke={hairColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 66 13 L 68 19" stroke="#d4c082" strokeWidth="0.8" opacity="0.6" />
      <path d="M 73 13 L 71 19" stroke="#d4c082" strokeWidth="0.8" opacity="0.6" />

      {/* Hairline — short crop visible at temples */}
      <path d="M 56 28 Q 58 26 62 26" stroke={hairColor} strokeWidth="1.2" fill="none" />
      <path d="M 84 28 Q 82 26 78 26" stroke={hairColor} strokeWidth="1.2" fill="none" />

      {/* Ears */}
      <ellipse cx="52" cy="38" rx="2.5" ry="4" fill={skinColor} />
      <ellipse cx="88" cy="38" rx="2.5" ry="4" fill={skinColor} />
      {/* Earring stud */}
      <circle cx="52" cy="41" r="0.8" fill={goldChain} />

      {/* Eyebrows — thick, dark */}
      <path
        d="M 58 32 Q 63 30 68 32"
        stroke={browColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 72 32 Q 77 30 82 32"
        stroke={browColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <ellipse cx="63" cy="37" rx="1.8" ry="2" fill="#3b2615" />
      <ellipse cx="77" cy="37" rx="1.8" ry="2" fill="#3b2615" />
      <circle cx="63.6" cy="36.5" r="0.6" fill="white" />
      <circle cx="77.6" cy="36.5" r="0.6" fill="white" />

      {/* Smile — confident */}
      <path
        d="M 64 46 Q 70 50 76 46"
        stroke={browColor}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Subtle cheek warmth */}
      <ellipse cx="58" cy="43" rx="2.5" ry="1.4" fill="#d68a6a" opacity="0.35" />
      <ellipse cx="82" cy="43" rx="2.5" ry="1.4" fill="#d68a6a" opacity="0.35" />

      {/* Sweat drop (effort!) */}
      <path
        d="M 38 32 Q 36 35 38 38 Q 40 35 38 32"
        fill="#7dd3fc"
        opacity="0.8"
      />
    </svg>
  )
}
