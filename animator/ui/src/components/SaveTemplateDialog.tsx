import { useEffect, useRef, useState } from 'react'
import { listTemplates } from '../file'
import { useFocusTrap } from './useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  /** Wired by App to the canonical `file.saveAsTemplate` command. */
  onSave: (name: string) => void
}

/**
 * Save as Template (H01 v2 §5.4): a required name → serialize the current
 * document as a reusable preset-JSON template. Enter = confirm, Esc = cancel,
 * empty name → inline error + Confirm disabled. NON-DOCUMENT write (H00 §13:
 * no document dirty, no undo entry).
 *
 * AMB-H01-002 (provisional = guarded overwrite, pending user decision): a
 * DUPLICATE name shows an inline warning and the Confirm button explicitly
 * relabels to "Replace" — the overwrite only happens as the user's explicit
 * click, never silently (INV-DSTR: destructive only when explicit + guarded).
 */
export function SaveTemplateDialog({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, rootRef)

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

  const trimmed = name.trim()
  const isDuplicate = trimmed !== '' && listTemplates().some((t) => t.name === trimmed)

  const confirm = () => {
    if (!trimmed) return
    onSave(trimmed)
    onClose()
  }

  return (
    <div data-testid="dlg-save-template" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={rootRef}
        role="dialog"
        aria-label="Save as template"
        style={{ width: 340, maxWidth: '92vw', background: 'var(--kineora-surface)', color: 'var(--kineora-text)', border: '1px solid var(--kineora-border-2)', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', colorScheme: 'dark' }}
      >
        <h3 style={{ margin: '0 0 12px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>Save as Template</h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--kineora-text)' }}>
          <span>Template name</span>
          <input
            data-testid="dlg-save-template-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirm()
            }}
            style={{ background: 'var(--kineora-input-bg)', color: 'var(--kineora-text-bright)', border: '1px solid var(--kineora-input-border)', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
          />
          {trimmed === '' && <span data-testid="dlg-save-template-name-error" role="alert" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>a name is required</span>}
          {isDuplicate && (
            <span data-testid="dlg-save-template-dup-warning" role="alert" style={{ color: 'var(--kineora-warning)', fontSize: 10 }}>
              a template named "{trimmed}" already exists — saving will replace it
            </span>
          )}
        </label>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-save-template-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button data-testid="dlg-save-template-confirm" disabled={trimmed === ''} onClick={confirm} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: trimmed ? '#fff' : 'var(--kineora-disabled-text)', cursor: trimmed ? 'pointer' : 'not-allowed', fontSize: 13 }}>
            {isDuplicate ? 'Replace' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
