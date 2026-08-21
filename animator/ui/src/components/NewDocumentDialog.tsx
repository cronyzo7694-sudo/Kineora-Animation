import { useEffect, useState } from 'react'
import { DEFAULT_NEW_SETTINGS, PLATFORM_OPTIONS, UNIT_OPTIONS, createDocument } from '../file'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}

const fieldLabel = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' } as const
const inputStyle: React.CSSProperties = { background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 4, padding: '6px 8px', fontSize: 13 }

/**
 * New document dialog (SYS-02 §6.2): platform · width · height · fps ·
 * background · units. Defaults 1920×1080 px / 24 / #ffffff / HTML5 Canvas.
 * Validation: W/H ≥ 2, fps 1–120 (no upper bound on size — P-2). Invalid →
 * inline error + Create disabled (no document mutation). Enter = Create,
 * Esc = Cancel.
 */
export function NewDocumentDialog({ open, onClose, notify }: Props) {
  const [platform, setPlatform] = useState(DEFAULT_NEW_SETTINGS.platform)
  const [width, setWidth] = useState(String(DEFAULT_NEW_SETTINGS.width))
  const [height, setHeight] = useState(String(DEFAULT_NEW_SETTINGS.height))
  const [fps, setFps] = useState(String(DEFAULT_NEW_SETTINGS.fps))
  const [background, setBackground] = useState(DEFAULT_NEW_SETTINGS.background)
  const [units, setUnits] = useState(DEFAULT_NEW_SETTINGS.units)

  useEffect(() => {
    if (open) {
      setPlatform(DEFAULT_NEW_SETTINGS.platform)
      setWidth(String(DEFAULT_NEW_SETTINGS.width))
      setHeight(String(DEFAULT_NEW_SETTINGS.height))
      setFps(String(DEFAULT_NEW_SETTINGS.fps))
      setBackground(DEFAULT_NEW_SETTINGS.background)
      setUnits(DEFAULT_NEW_SETTINGS.units)
    }
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

  const w = Number(width)
  const h = Number(height)
  const f = Number(fps)
  const widthError = !Number.isFinite(w) || w < 2 ? 'width must be ≥ 2' : null
  const heightError = !Number.isFinite(h) || h < 2 ? 'height must be ≥ 2' : null
  const fpsError = !Number.isFinite(f) || f < 1 || f > 120 ? 'fps must be 1–120' : null
  const valid = !widthError && !heightError && !fpsError

  const create = () => {
    if (!valid) return
    createDocument({ platform, width: w, height: h, fps: Math.round(f), background, units }, notify)
    onClose()
  }

  return (
    <div data-testid="dlg-new" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="New document" style={{ width: 380, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#eee', fontSize: 15 }}>New Document</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={fieldLabel}>
            <span>Platform</span>
            <select data-testid="dlg-new-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldLabel}>
            <span>Units</span>
            <select data-testid="dlg-new-units" value={units} onChange={(e) => setUnits(e.target.value)} style={inputStyle}>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldLabel}>
            <span>Width (px)</span>
            <input data-testid="dlg-new-width" autoFocus value={width} onChange={(e) => setWidth(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: widthError ? '1px solid #e66' : inputStyle.border }} />
            {widthError && <span data-testid="dlg-new-width-error" style={{ color: '#e66', fontSize: 10 }}>{widthError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Height (px)</span>
            <input data-testid="dlg-new-height" value={height} onChange={(e) => setHeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: heightError ? '1px solid #e66' : inputStyle.border }} />
            {heightError && <span data-testid="dlg-new-height-error" style={{ color: '#e66', fontSize: 10 }}>{heightError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Frame rate (fps)</span>
            <input data-testid="dlg-new-fps" value={fps} onChange={(e) => setFps(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: fpsError ? '1px solid #e66' : inputStyle.border }} />
            {fpsError && <span data-testid="dlg-new-fps-error" style={{ color: '#e66', fontSize: 10 }}>{fpsError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Background</span>
            <input data-testid="dlg-new-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ height: 32, background: '#111', border: '1px solid #444', borderRadius: 4, padding: 2 }} />
          </label>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-new-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button data-testid="dlg-new-create" disabled={!valid} onClick={create} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: valid ? '#fff' : '#777', cursor: valid ? 'pointer' : 'not-allowed', fontSize: 13 }}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
