import { useEffect } from 'react'
import { listTemplates } from '../file'

interface Props {
  open: boolean
  onClose: () => void
  /** Wired by App to the canonical `file.newFromTemplate` command. */
  onCreateFromTemplate: (name: string) => void
}

/**
 * New-from-Template gallery (H01): the preset-JSON template mechanism. Picking
 * a template seeds a NEW independent document (a fresh engine parse — the
 * template source is never the same mutable instance). Empty state is honest.
 */
export function TemplateGalleryDialog({ open, onClose, onCreateFromTemplate }: Props) {
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

  return (
    <div data-testid="template-gallery" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-label="New from template"
        style={{ width: 360, maxWidth: '92vw', background: 'var(--kineora-surface)', color: 'var(--kineora-text)', border: '1px solid var(--kineora-border-2)', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', colorScheme: 'dark' }}
      >
        <h3 style={{ margin: '0 0 12px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>New from Template</h3>
        {templates.length === 0 ? (
          <div data-testid="template-empty" style={{ color: 'var(--kineora-muted)', fontSize: 13, padding: '8px 0' }}>
            No templates saved yet — use File ▸ Save as Template to create one.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
            {templates.map((t) => (
              <li key={t.name}>
                <button
                  data-testid={`template-${t.name}`}
                  onClick={() => {
                    onCreateFromTemplate(t.name)
                    onClose()
                  }}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '8px 10px', fontSize: 13, background: 'transparent', color: 'var(--kineora-text)', border: 'none', borderBottom: '1px solid var(--kineora-border)', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--kineora-btn-primary-bg)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="template-close" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
