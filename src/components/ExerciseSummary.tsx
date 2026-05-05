'use client'

interface SetData {
  id: string
  set_number: number
  reps: number | null
  weight: number | null
}

interface Props {
  name: string
  sets: SetData[]
  onEdit: () => void
}

export default function ExerciseSummary({ name, sets, onEdit }: Props) {
  return (
    <div className="mb-6 pb-6 border-b" style={{ borderColor: '#1c1c1c' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#f0ede8' }}>
          {name}
        </h3>
        <button
          onClick={onEdit}
          className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
          style={{ color: 'var(--gold)' }}
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-[2rem_1fr_1fr] gap-3 text-xs tracking-widest uppercase mb-2" style={{ color: '#444' }}>
        <span>Set</span>
        <span>Reps</span>
        <span>Lbs</span>
      </div>

      {sets.length === 0 ? (
        <p className="text-xs" style={{ color: '#444' }}>No sets logged.</p>
      ) : (
        sets.map((s) => (
          <div key={s.id} className="grid grid-cols-[2rem_1fr_1fr] gap-3 py-2 border-b" style={{ borderColor: '#141414' }}>
            <span className="text-xs text-center" style={{ color: '#555' }}>{s.set_number}</span>
            <span className="text-sm text-center" style={{ color: '#f0ede8' }}>
              {s.reps ?? '—'}
            </span>
            <span className="text-sm text-center" style={{ color: '#f0ede8' }}>
              {s.weight ?? '—'}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
