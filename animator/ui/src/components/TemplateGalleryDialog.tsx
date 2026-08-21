import { useEffect } from 'react'
import { createFromTemplate, listTemplates } from '../file'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}

/**
 * New from Template gallery (SYS-02 §9): the preset-JSON template mechanism.
 * Lists saved templates; picking one seeds a NEW document (real serialized
 * document, not a mock). Empty state is honest (no templates saved yet).
 */
export function TemplateGalleryDialog({ open, onClose, notify }: Props) {
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
      <div role="dialog" aria-label="New from template" style={{ width: 360, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#eee', fontSize: 15 }}>New from Template</h3>
        {templates.length === 0 ? (
          <div data-testid="template-empty" style={{ color: '#888', fontSize: 13, padding: '8px 0' }}>
            No templates saved yet — use File ▸ Save as Template to create one.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
            {templates.map((t) => (
              <li key={t.name}>
                <button
                  data-testid={`template-${t.name}`}
                  onClick={() => {
                    createFromTemplate(t.name, notify)
                    onClose()
                  }}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '8px 10px', fontSize: 13, background: 'transparent', color: '#ddd', border: 'none', borderBottom: '1px solid #2a2a2a', cursor: 'pointer' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0a3f7f')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="template-close" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
