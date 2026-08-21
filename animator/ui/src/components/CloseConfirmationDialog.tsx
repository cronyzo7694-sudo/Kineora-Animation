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
}

/**
 * The canonical unsaved-changes guard (SYS-02 §13.3, STM-DIRTY). Save =
 * persist then proceed; Discard = lose edits and proceed; Cancel = leave the
 * document exactly unchanged. Esc = Cancel. Triggered by DIRTY alone — never
 * by document identity.
 */
export function CloseConfirmationDialog({ request, onSave, onDiscard, onCancel }: Props) {
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
      <div role="alertdialog" aria-label="Unsaved changes" style={{ width: 360, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
        <h3 style={{ margin: '0 0 8px', color: '#eee', fontSize: 15 }}>Unsaved changes</h3>
        <p style={{ margin: '0 0 16px', color: '#aaa', fontSize: 13 }}>
          {label} unsaved changes. Save before closing {request.what}?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-close-cancel" onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button data-testid="dlg-close-discard" onClick={onDiscard} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #a33', background: '#3a1a1a', color: '#fbb', cursor: 'pointer', fontSize: 13 }}>
            Discard
          </button>
          <button data-testid="dlg-close-save" onClick={onSave} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
