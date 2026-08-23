import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  suggested: string
  onCancel: () => void
  onConfirm: (name: string) => void
}

/**
 * Browser Save / Save As name dialog — used when the File System Access
 * picker is unavailable. Replaces the amateur window.prompt so Save As is
 * a real, cancellable, keyboard-driven dialog (Enter = save, Esc = cancel).
 */
export function SaveAsDialog({ open, suggested, onCancel, onConfirm }: Props) {
  const [value, setValue] = useState(suggested)

  useEffect(() => {
    if (open) setValue(suggested.replace(/\.json$/i, '') || 'kineora-project')
  }, [open, suggested])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const clean = value.trim().replace(/\.json$/i, '')
  const commit = () => {
    if (!clean) return
    onConfirm(clean)
  }

  return (
    <div
      data-testid="dlg-save-as"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-label="Save project"
        style={{
          width: 360,
          background: 'var(--kineora-surface)',
          border: '1px solid var(--kineora-border-2)',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        }}
      >
        <h3 style={{ margin: '0 0 6px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>Save As</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--kineora-muted)', fontSize: 12 }}>
          Project is saved as a <code>.json</code> file. Next Save overwrites this name.
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--kineora-text)' }}>
          File name
          <input
            data-testid="dlg-save-as-name"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
            }}
            style={{
              background: 'var(--kineora-input-bg)',
              color: 'var(--kineora-text-bright)',
              border: '1px solid var(--kineora-input-border)',
              borderRadius: 4,
              padding: '6px 8px',
              fontSize: 13,
            }}
          />
        </label>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            data-testid="dlg-save-as-cancel"
            onClick={onCancel}
            style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)', cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="dlg-save-as-confirm"
            disabled={!clean}
            onClick={commit}
            style={{
              padding: '5px 12px',
              borderRadius: 4,
              border: '1px solid var(--kineora-btn-primary-border)',
              background: 'var(--kineora-btn-primary-bg)',
              color: clean ? '#fff' : 'var(--kineora-disabled-text)',
              cursor: clean ? 'pointer' : 'not-allowed',
              fontSize: 13,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
