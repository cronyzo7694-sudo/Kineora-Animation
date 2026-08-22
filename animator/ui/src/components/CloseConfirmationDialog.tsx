import { useEffect } from 'react'

export interface CloseConfirmationRequest {
  /** Human description of what is being closed ("the document" / "N documents"). */
  what: string
  /** Number of dirty documents (for the Save/Discard copy). */
  dirtyCount: number
}

interface Props {
  request: CloseConfirmationRequest | null
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
  /** H11 §4 / H13 §6: the guard is in the 'submitting' state (a Save is
   *  in flight) — all buttons disabled, no double-submit. */
  busy?: boolean
}

/**
 * The canonical unsaved-changes guard (SYS-02 §13.3, STM-DIRTY). Save =
 * persist then proceed; Discard = lose edits and proceed; Cancel = leave the
 * document exactly unchanged. Esc = Cancel. Triggered by DIRTY alone — never
 * by document identity.
 */
export function CloseConfirmationDialog({ request, onSave, onDiscard, onCancel, busy = false }: Props) {
  useEffect(() => {
    if (!request) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request, onCancel])

  if (!request) return null

  const n = request.dirtyCount
  const label = n > 1 ? `${n} documents have` : 'The document has'

  return (
    <div data-testid="dlg-close" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95 }}>
      <div role="alertdialog" aria-label="Unsaved changes" style={{ width: 360, maxWidth: '92vw', background: 'var(--kineora-surface)', color: 'var(--kineora-text)', border: '1px solid var(--kineora-border-2)', borderRadius: 8, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', colorScheme: 'dark' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>Unsaved changes</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--kineora-muted)', fontSize: 13 }}>
          {label} unsaved changes. Save before closing {request.what}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-close-cancel" onClick={onCancel} disabled={busy} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)', cursor: 'pointer', fontSize: 13, opacity: busy ? 0.5 : 1 }}>
            Cancel
          </button>
          {/* H11 §4: the destructive button is distinguished via the danger token */}
          <button data-testid="dlg-close-discard" onClick={onDiscard} disabled={busy} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--kineora-danger)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-danger)', cursor: 'pointer', fontSize: 13, opacity: busy ? 0.5 : 1 }}>
            Discard
          </button>
          <button data-testid="dlg-close-save" onClick={onSave} disabled={busy} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: 'var(--kineora-accent-text)', cursor: 'pointer', fontSize: 13, opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
