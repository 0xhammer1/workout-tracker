interface Props {
  className?: string
}

// Stylized "character portrait" avatar — video game splash art aesthetic.
// Bleached blonde fade, dark brows, tan skin, black tank, white converse, gold chain.
export default function MitchellAvatar({ className = '' }: Props) {
  // Palette
  const skin = '#d8a071'
  const skinMid = '#b87a4d'
  const skinShadow = '#8b5530'
  const skinHighlight = '#ecc395'
  const hair = '#f0e2a8'
  const hairShadow = '#b8a466'
  const hairHighlight = '#fff5cc'
  const brow = '#1a0e08'
  const tank = '#0a0a0a'
  const tankHighlight = '#2a2a2a'
  const shoeWhite = '#f7f5f0'
  const shoeRubber = '#e8e3d8'
  const shoeBlack = '#0e0e0e'
  const gold = '#e0c047'
  const goldShadow = '#9a7e2c'
  const metal = '#3d3d42'
  const metalDark = '#1c1c20'
  const metalLight = '#6f6f78'
  const bgTop = '#262838'
  const bgBottom = '#13141d'
  const rimLight = '#7c8aff'

  return (
    <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={bgTop} />
          <stop offset="100%" stopColor={bgBottom} />
        </radialGradient>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={skinHighlight} />
          <stop offset="50%" stopColor={skin} />
          <stop offset="100%" stopColor={skinMid} />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={hairHighlight} />
          <stop offset="60%" stopColor={hair} />
          <stop offset="100%" stopColor={hairShadow} />
        </linearGradient>
        <linearGradient id="tankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={tankHighlight} />
          <stop offset="50%" stopColor={tank} />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fce58a" />
          <stop offset="100%" stopColor={goldShadow} />
        </linearGradient>
        <radialGradient id="shoeGrad" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={shoeWhite} />
          <stop offset="100%" stopColor={shoeRubber} />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background — character select feel */}
      <circle cx="100" cy="100" r="98" fill="url(#bgGrad)" />
      {/* Rim light glow */}
      <circle cx="100" cy="100" r="98" fill="none" stroke={rimLight} strokeWidth="0.6" opacity="0.4" />

      {/* === LEGS === */}
      {/* Back leg (right) */}
      <path d="M 110 162 Q 109 175 113 192 L 124 192 Q 124 178 122 162 Z" fill="url(#skinGrad)" />
      <path d="M 119 162 L 124 192 L 122 162 Z" fill={skinShadow} opacity="0.4" />

      {/* Front leg (left) */}
      <path d="M 78 162 Q 77 175 81 192 L 92 192 Q 92 178 90 162 Z" fill="url(#skinGrad)" />
      <path d="M 87 162 L 92 192 L 90 162 Z" fill={skinShadow} opacity="0.4" />

      {/* Knee highlight */}
      <ellipse cx="84" cy="178" rx="3" ry="2" fill={skinHighlight} opacity="0.6" />
      <ellipse cx="116" cy="178" rx="3" ry="2" fill={skinHighlight} opacity="0.6" />

      {/* === CONVERSE — back === */}
      <path
        d="M 108 188 Q 108 198 112 200 L 132 200 Q 130 196 128 192 L 124 192 L 110 192 Z"
        fill="url(#shoeGrad)"
      />
      <rect x="108" y="198" width="24" height="3" fill={shoeBlack} />
      <path d="M 108 192 L 132 192 L 130 195 L 110 195 Z" fill={shoeBlack} />
      {/* Eyelets */}
      <circle cx="114" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="118" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="122" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="126" cy="194" r="0.7" fill={shoeBlack} />
      {/* Star/circle logo */}
      <circle cx="129" cy="196" r="2.2" fill={shoeWhite} stroke={shoeBlack} strokeWidth="0.5" />

      {/* === CONVERSE — front === */}
      <path
        d="M 76 188 Q 76 198 80 200 L 100 200 Q 98 196 96 192 L 92 192 L 78 192 Z"
        fill="url(#shoeGrad)"
      />
      <rect x="76" y="198" width="24" height="3" fill={shoeBlack} />
      <path d="M 76 192 L 100 192 L 98 195 L 78 195 Z" fill={shoeBlack} />
      <circle cx="82" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="86" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="90" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="94" cy="194" r="0.7" fill={shoeBlack} />
      <circle cx="97" cy="196" r="2.2" fill={shoeWhite} stroke={shoeBlack} strokeWidth="0.5" />

      {/* === TORSO — black tank, dramatic shading === */}
      <path
        d="M 76 92 Q 73 100 73 110 L 73 162 Q 73 167 78 167 L 124 167 Q 129 167 129 162 L 129 110 Q 129 100 126 92 Z"
        fill="url(#tankGrad)"
      />
      {/* Tank fold/wrinkle highlight */}
      <path
        d="M 90 100 Q 88 130 92 160"
        stroke={tankHighlight}
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 110 100 Q 112 130 108 160"
        stroke={tankHighlight}
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      {/* Tank rim light along right edge */}
      <path d="M 126 92 Q 129 100 129 110 L 129 162 Q 128 165 125 165" stroke={rimLight} strokeWidth="0.8" fill="none" opacity="0.4" />

      {/* Deep V neckline — exposed chest */}
      <path
        d="M 82 92 Q 88 80 100 80 Q 112 80 118 92 L 113 92 Q 108 84 102 92 L 102 108 L 100 112 L 98 108 L 98 92 Q 92 84 87 92 Z"
        fill="url(#skinGrad)"
      />
      {/* Chest definition */}
      <path d="M 92 88 Q 96 96 100 96 Q 104 96 108 88" stroke={skinMid} strokeWidth="0.8" fill="none" opacity="0.5" />
      <line x1="100" y1="96" x2="100" y2="112" stroke={skinShadow} strokeWidth="0.8" opacity="0.6" />
      {/* Subtle ab hint */}
      <ellipse cx="100" cy="116" rx="3" ry="2" fill={skinHighlight} opacity="0.3" />

      {/* Arm holes — shoulder skin */}
      <ellipse cx="73" cy="98" rx="5" ry="8" fill="url(#skinGrad)" />
      <ellipse cx="129" cy="98" rx="5" ry="8" fill="url(#skinGrad)" />

      {/* === GOLD CHAIN === */}
      <path d="M 86 86 Q 100 96 114 86" stroke="url(#goldGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="93" r="2" fill="url(#goldGrad)" stroke={goldShadow} strokeWidth="0.4" />
      <circle cx="100.5" cy="92.5" r="0.6" fill="#fff5b8" />

      {/* === LEFT ARM (relaxed) === */}
      <path d="M 64 92 Q 62 110 64 138 L 74 138 Q 76 110 73 92 Z" fill="url(#skinGrad)" />
      {/* Bicep shadow */}
      <ellipse cx="68" cy="108" rx="4" ry="9" fill={skinShadow} opacity="0.35" />
      {/* Bicep highlight */}
      <ellipse cx="71" cy="105" rx="2" ry="6" fill={skinHighlight} opacity="0.6" />
      {/* Forearm */}
      <ellipse cx="68" cy="130" rx="4" ry="6" fill={skinMid} opacity="0.3" />
      {/* Hand */}
      <ellipse cx="69" cy="142" rx="6" ry="6.5" fill="url(#skinGrad)" />

      {/* === RIGHT ARM (curling, flexed) === */}
      {/* Upper arm */}
      <path d="M 126 92 Q 124 105 126 118 L 138 118 Q 138 105 135 92 Z" fill="url(#skinGrad)" />
      {/* Forearm bent up */}
      <path d="M 126 64 Q 125 80 128 92 L 138 92 Q 138 80 138 64 Z" fill="url(#skinGrad)" />
      {/* Bicep peak — dramatic flex */}
      <ellipse cx="132" cy="92" rx="9" ry="7" fill="url(#skinGrad)" />
      <ellipse cx="130" cy="89" rx="6" ry="4" fill={skinHighlight} opacity="0.7" />
      <path d="M 124 96 Q 132 98 140 96" stroke={skinShadow} strokeWidth="1" fill="none" opacity="0.6" />
      {/* Forearm definition */}
      <path d="M 130 70 Q 132 80 130 90" stroke={skinShadow} strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M 134 70 Q 136 80 134 90" stroke={skinHighlight} strokeWidth="0.6" fill="none" opacity="0.6" />
      {/* Hand gripping */}
      <ellipse cx="133" cy="60" r="6.5" fill="url(#skinGrad)" rx="6.5" ry="6" />
      <path d="M 128 60 L 138 60" stroke={skinShadow} strokeWidth="0.6" opacity="0.5" />

      {/* === DUMBBELL === */}
      <rect x="124" y="51" width="20" height="4" rx="1" fill={metal} />
      <rect x="124" y="51" width="20" height="1.5" fill={metalLight} />
      {/* Knurling */}
      <line x1="126" y1="55" x2="126" y2="51" stroke={metalDark} strokeWidth="0.4" />
      <line x1="129" y1="55" x2="129" y2="51" stroke={metalDark} strokeWidth="0.4" />
      <line x1="139" y1="55" x2="139" y2="51" stroke={metalDark} strokeWidth="0.4" />
      <line x1="142" y1="55" x2="142" y2="51" stroke={metalDark} strokeWidth="0.4" />
      {/* Plates */}
      <rect x="118" y="44" width="8" height="18" rx="2" fill={metalDark} />
      <rect x="118" y="44" width="3" height="18" fill={metalLight} opacity="0.5" />
      <rect x="142" y="44" width="8" height="18" rx="2" fill={metalDark} />
      <rect x="146" y="44" width="2" height="18" fill={metalLight} opacity="0.4" />

      {/* === NECK === */}
      <path d="M 92 66 L 92 80 Q 92 84 96 84 L 104 84 Q 108 84 108 80 L 108 66 Z" fill="url(#skinGrad)" />
      {/* Neck shadow */}
      <path d="M 92 80 Q 100 84 108 80 L 108 84 Q 100 86 92 84 Z" fill={skinShadow} opacity="0.4" />

      {/* === HEAD === */}
      <path
        d="M 76 44 Q 76 24 100 22 Q 124 24 124 44 L 124 58 Q 124 70 116 76 Q 108 80 100 80 Q 92 80 84 76 Q 76 70 76 58 Z"
        fill="url(#skinGrad)"
        filter="url(#softShadow)"
      />

      {/* Jaw shading */}
      <path
        d="M 84 72 Q 92 78 100 78 Q 108 78 116 72 L 116 66 Q 108 72 100 72 Q 92 72 84 66 Z"
        fill={skinShadow}
        opacity="0.3"
      />
      {/* Cheekbone highlight */}
      <ellipse cx="86" cy="56" rx="3" ry="4" fill={skinHighlight} opacity="0.5" />
      <ellipse cx="114" cy="56" rx="3" ry="4" fill={skinHighlight} opacity="0.5" />

      {/* === HAIR === */}
      {/* Faded sides */}
      <path d="M 76 42 Q 75 32 80 26 L 82 44 Q 78 44 76 42 Z" fill={brow} opacity="0.55" />
      <path d="M 124 42 Q 125 32 120 26 L 118 44 Q 122 44 124 42 Z" fill={brow} opacity="0.55" />

      {/* Top — bleached blonde with volume */}
      <path
        d="M 76 38 Q 76 18 100 14 Q 124 18 124 38 Q 122 24 116 20 Q 108 16 100 18 Q 92 16 84 22 Q 78 28 76 38 Z"
        fill="url(#hairGrad)"
      />
      {/* Hair strands / streaks */}
      <path d="M 88 22 Q 92 18 98 18" stroke={hairHighlight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M 102 18 Q 108 18 114 22" stroke={hairHighlight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M 96 16 L 98 24" stroke={hairShadow} strokeWidth="0.8" opacity="0.5" />
      <path d="M 104 16 L 102 24" stroke={hairShadow} strokeWidth="0.8" opacity="0.5" />
      {/* Front fringe shadow */}
      <path d="M 84 28 Q 90 32 100 30 Q 110 32 116 28 L 116 36 Q 100 40 84 36 Z" fill={hairShadow} opacity="0.3" />

      {/* === EARS === */}
      <ellipse cx="76" cy="50" rx="3" ry="5" fill="url(#skinGrad)" />
      <ellipse cx="124" cy="50" rx="3" ry="5" fill="url(#skinGrad)" />
      <path d="M 75 50 Q 76 52 76 54" stroke={skinShadow} strokeWidth="0.4" fill="none" opacity="0.5" />
      {/* Earring */}
      <circle cx="76" cy="54" r="1.2" fill="url(#goldGrad)" />

      {/* === EYEBROWS — bold, expressive === */}
      <path
        d="M 84 44 Q 90 40 96 44"
        stroke={brow}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 104 44 Q 110 40 116 44"
        stroke={brow}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Brow shading underneath */}
      <path d="M 86 45 Q 90 43 94 45" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M 106 45 Q 110 43 114 45" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* === EYES === */}
      {/* Eye whites */}
      <ellipse cx="90" cy="51" rx="3.5" ry="2.5" fill="#fff" />
      <ellipse cx="110" cy="51" rx="3.5" ry="2.5" fill="#fff" />
      {/* Iris */}
      <ellipse cx="90" cy="51" rx="2.2" ry="2.4" fill="#5a3a1f" />
      <ellipse cx="110" cy="51" rx="2.2" ry="2.4" fill="#5a3a1f" />
      {/* Pupil */}
      <circle cx="90" cy="51" r="1.1" fill={brow} />
      <circle cx="110" cy="51" r="1.1" fill={brow} />
      {/* Shine */}
      <circle cx="91" cy="50" r="0.7" fill="#fff" />
      <circle cx="111" cy="50" r="0.7" fill="#fff" />
      {/* Lash line */}
      <path d="M 87 49 Q 90 48 93 49" stroke={brow} strokeWidth="0.7" fill="none" />
      <path d="M 107 49 Q 110 48 113 49" stroke={brow} strokeWidth="0.7" fill="none" />

      {/* === NOSE — subtle === */}
      <path d="M 99 56 Q 100 62 102 64" stroke={skinShadow} strokeWidth="0.8" fill="none" opacity="0.4" />
      <ellipse cx="101" cy="64" rx="0.6" ry="0.4" fill={skinShadow} opacity="0.5" />

      {/* === SMIRK / CONFIDENT SMILE === */}
      <path
        d="M 92 70 Q 100 74 108 70"
        stroke={brow}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lip shadow */}
      <path d="M 94 71 Q 100 73 106 71" stroke="#a8694a" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* Cheek warmth */}
      <ellipse cx="84" cy="64" rx="3" ry="1.8" fill="#d2755a" opacity="0.3" />
      <ellipse cx="116" cy="64" rx="3" ry="1.8" fill="#d2755a" opacity="0.3" />

      {/* Sweat drop with shine */}
      <path d="M 60 44 Q 58 48 60 51 Q 62 48 60 44" fill="#7dd3fc" />
      <ellipse cx="60.6" cy="46" rx="0.5" ry="1" fill="#fff" opacity="0.9" />

      {/* Rim light on hair (top) */}
      <path d="M 80 22 Q 100 14 120 22" stroke={rimLight} strokeWidth="0.6" fill="none" opacity="0.5" />
    </svg>
  )
}
