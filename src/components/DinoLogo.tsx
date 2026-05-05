export default function DinoLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 110"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* tail */}
      <ellipse cx="18" cy="72" rx="20" ry="9" fill="#34d399" transform="rotate(-25 18 72)" />
      <ellipse cx="8" cy="78" rx="10" ry="6" fill="#34d399" transform="rotate(-35 8 78)" />

      {/* body */}
      <ellipse cx="58" cy="68" rx="26" ry="21" fill="#34d399" />

      {/* belly */}
      <ellipse cx="58" cy="70" rx="16" ry="14" fill="#a7f3d0" />

      {/* neck */}
      <rect x="64" y="44" width="16" height="20" rx="8" fill="#34d399" />

      {/* head */}
      <ellipse cx="80" cy="36" rx="18" ry="15" fill="#34d399" />

      {/* snout */}
      <ellipse cx="95" cy="40" rx="9" ry="7" fill="#6ee7b7" />

      {/* mouth smile */}
      <path d="M88 44 Q95 50 102 44" stroke="#065f46" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* teeth */}
      <rect x="90" y="44" width="3" height="4" rx="1" fill="white" />
      <rect x="95" y="44" width="3" height="4" rx="1" fill="white" />

      {/* eye white */}
      <circle cx="84" cy="30" r="5" fill="white" />
      {/* pupil */}
      <circle cx="85" cy="30" r="3" fill="#1e293b" />
      {/* eye shine */}
      <circle cx="86" cy="29" r="1" fill="white" />

      {/* eyelash / brow */}
      <path d="M80 25 Q84 22 88 25" stroke="#065f46" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* nostril */}
      <circle cx="99" cy="38" r="1.2" fill="#065f46" />

      {/* LEFT arm raised holding barbell */}
      <line x1="48" y1="60" x2="22" y2="44" stroke="#34d399" strokeWidth="7" strokeLinecap="round" />

      {/* barbell bar */}
      <rect x="6" y="38" width="30" height="5" rx="2.5" fill="#94a3b8" />
      {/* left weight plate */}
      <rect x="4" y="32" width="7" height="17" rx="3" fill="#475569" />
      {/* right weight plate */}
      <rect x="31" y="32" width="7" height="17" rx="3" fill="#475569" />

      {/* RIGHT tiny arm */}
      <line x1="68" y1="63" x2="78" y2="56" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
      {/* tiny fist */}
      <circle cx="79" cy="55" r="4" fill="#34d399" />

      {/* legs */}
      <line x1="50" y1="86" x2="45" y2="102" stroke="#34d399" strokeWidth="8" strokeLinecap="round" />
      <line x1="66" y1="86" x2="71" y2="102" stroke="#34d399" strokeWidth="8" strokeLinecap="round" />

      {/* feet */}
      <ellipse cx="43" cy="103" rx="9" ry="4" fill="#34d399" />
      <ellipse cx="73" cy="103" rx="9" ry="4" fill="#34d399" />

      {/* toe claws */}
      <line x1="37" y1="104" x2="34" y2="108" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="43" y1="106" x2="41" y2="110" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="67" y1="106" x2="65" y2="110" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="73" y1="104" x2="76" y2="108" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />

      {/* back spikes */}
      <polygon points="60,46 64,36 68,46" fill="#10b981" />
      <polygon points="68,44 72,34 76,44" fill="#10b981" />

      {/* sweat drop (effort!) */}
      <ellipse cx="30" cy="28" rx="3" ry="4" fill="#7dd3fc" opacity="0.8" />
      <path d="M30 24 Q32 20 30 17 Q28 20 30 24" fill="#7dd3fc" opacity="0.8" />

      {/* spots on body */}
      <circle cx="52" cy="65" r="3.5" fill="#6ee7b7" opacity="0.5" />
      <circle cx="63" cy="74" r="2.5" fill="#6ee7b7" opacity="0.5" />
      <circle cx="45" cy="74" r="2" fill="#6ee7b7" opacity="0.5" />
    </svg>
  )
}
