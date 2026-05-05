'use client'

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {message && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onCancel}
            className="py-3.5 text-sm font-semibold transition-colors active:bg-white/5"
            style={{ color: 'var(--text)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="py-3.5 text-sm font-semibold transition-colors active:bg-white/5"
            style={{
              borderLeft: '1px solid var(--border)',
              color: destructive ? 'var(--danger)' : 'var(--accent)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
