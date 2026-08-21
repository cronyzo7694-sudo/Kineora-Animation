import { useEffect, useRef, useState } from 'react'
import { listTemplates, templatePreview } from '../file'
import { useFocusTrap } from './useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  /** Wired by App to the canonical `file.newFromTemplate` command. */
  onCreateFromTemplate: (name: string) => void
}

const btnBase: React.CSSProperties = { padding: '5px 12px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }

/**
 * New-from-Template gallery (H01 v2 §5.3): tpl-new.list = selectable rows with
 * a platform/W×H/fps preview · tpl-new.open = primary, ENABLED ONLY while a
 * template is selected (disabled reason is visible, INV-ERR-1 — never a dead
 * button) · tpl-new.cancel = close, no change. Selection only highlights —
 * it never mutates anything. Opening seeds a NEW independent document (a
 * fresh engine parse — never the source instance). Empty state is honest.
 */
export function TemplateGalleryDialog({ open, onClose, onCreateFromTemplate }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, rootRef)

  useEffect(() => {
    if (open) setSelected(null) // fresh state every time the gallery opens
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
  const templates = listTemplates()

  const openSelected = () => {
    if (!selected) return // disabled state guards this — never a silent no-op
    onCreateFromTemplate(selected)
    onClose()
  }

  return (
    <div data-testid="tpl-new-gallery" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={rootRef}
        role="dialog"
        aria-label="New from template"
        style={{ width: 400, maxWidth: '92vw', background: 'var(--kineora-surface)', color: 'var(--kineora-text)', border: '1px solid var(--kineora-border-2)', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', colorScheme: 'dark' }}
      >
        <h3 style={{ margin: '0 0 12px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>New from Template</h3>
        {templates.length === 0 ? (
          <div data-testid="tpl-new-empty" style={{ color: 'var(--kineora-muted)', fontSize: 13, padding: '8px 0' }}>
            No templates saved yet — use File ▸ Save as Template to create one.
          </div>
        ) : (
          <ul data-testid="tpl-new-list" role="listbox" aria-label="Templates" style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
            {templates.map((t) => {
              const p = templatePreview(t)
              const active = selected === t.name
              return (
                <li key={t.name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-testid={`tpl-new-item-${t.name}`}
                    data-selected={active ? 'true' : 'false'}
                    onClick={() => setSelected(t.name)}
                    style={{
                      display: 'flex', width: '100%', boxSizing: 'border-box', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
                      textAlign: 'left', padding: '8px 10px', fontSize: 13, cursor: 'pointer',
                      background: active ? 'var(--kineora-btn-primary-bg)' : 'transparent',
                      color: active ? '#fff' : 'var(--kineora-text)',
                      border: 'none', borderBottom: '1px solid var(--kineora-border)',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span data-testid={`tpl-new-preview-${t.name}`} style={{ color: active ? '#fff' : 'var(--kineora-muted)', fontSize: 10, flexShrink: 0 }}>
                      {p ? `${p.platform} · ${p.width}×${p.height} · ${p.fps} fps` : 'unreadable preset'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" data-testid="tpl-new-cancel" onClick={onClose} style={{ ...btnBase, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)' }}>
            Cancel
          </button>
          <button
            type="button"
            data-testid="tpl-new-open"
            disabled={!selected}
            title={selected ? `Create a new document from "${selected}"` : 'Select a template first'}
            onClick={openSelected}
            style={{ ...btnBase, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: selected ? '#fff' : 'var(--kineora-disabled-text)', cursor: selected ? 'pointer' : 'not-allowed' }}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  )
}
