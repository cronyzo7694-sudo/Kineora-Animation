import { useEffect, useState } from 'react'
import { saveTemplate } from '../file'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}

/**
 * Save as Template (SYS-02 §6.2): a required name → serialize the current
 * document as a reusable preset-JSON template (usable by New from Template).
 * Enter = confirm, Esc = cancel, empty name → inline error.
 */
export function SaveTemplateDialog({ open, onClose, notify }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const confirm = () => {
    if (!name.trim()) return
    saveTemplate(name, notify)
    onClose()
  }

  return (
    <div data-testid="save-template-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Save as template" style={{ width: 320, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#eee', fontSize: 15 }}>Save as Template</h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' }}>
          <span>Template name</span>
          <input
            data-testid="dlg-template-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirm()
            }}
            style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
          />
          {name.trim() === '' && <span data-testid="dlg-template-name-error" style={{ color: '#e66', fontSize: 10 }}>a name is required</span>}
        </label>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-template-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button data-testid="dlg-template-confirm" disabled={name.trim() === ''} onClick={confirm} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: name.trim() ? '#fff' : '#777', cursor: name.trim() ? 'pointer' : 'not-allowed', fontSize: 13 }}>
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}
