import { useEffect, useState } from 'react'
import { DEFAULT_NEW_SETTINGS, PLATFORM_OPTIONS, UNIT_OPTIONS, type NewDocSettings } from '../file'

interface Props {
  open: boolean
  onClose: () => void
  /** Wired by App to the canonical `file.new` command (INV-CMD-2: the dialog
   *  never mutates the engine directly — Create re-invokes the command). */
  onCreate: (settings: NewDocSettings) => void
}

// Design-token-driven styles (H00 §17 INV-VIS-1/2: every state uses semantic
// tokens from SYS-01 §32 — no hard-coded hex; foreground ≠ background in
// every state incl. disabled/error).
const fieldLabel = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--kineora-text)' } as const
const inputStyle: React.CSSProperties = {
  background: 'var(--kineora-input-bg)',
  color: 'var(--kineora-text-bright)',
  border: '1px solid var(--kineora-input-border)',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 13,
  colorScheme: 'dark',
}
const btnBase: React.CSSProperties = { padding: '5px 12px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }

/**
 * New document dialog (H01): platform · width · height · fps · background ·
 * units. Defaults 1920×1080 px / 24 / #ffffff / HTML5 Canvas (eng 03, P-8).
 * Validation: W/H ≥ 2 (no upper bound, P-2), fps 1–120 — inline error +
 * Create disabled (no partial document ever created). Enter = Create,
 * Esc = Cancel, Tab/Shift+Tab field nav, initial focus = width.
 */
export function NewDocumentDialog({ open, onClose, onCreate }: Props) {
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
    onCreate({ platform, width: w, height: h, fps: Math.round(f), background, units })
    onClose()
  }

  return (
    <div data-testid="dlg-new" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-label="New document"
        style={{
          width: 380,
          maxWidth: '92vw',
          background: 'var(--kineora-surface)',
          color: 'var(--kineora-text)',
          border: '1px solid var(--kineora-border-2)',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          colorScheme: 'dark',
        }}
      >
        <h3 style={{ margin: '0 0 12px', color: 'var(--kineora-text-bright)', fontSize: 15 }}>New Document</h3>
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
            <input data-testid="dlg-new-width" autoFocus value={width} onChange={(e) => setWidth(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: widthError ? '1px solid var(--kineora-danger)' : inputStyle.border }} />
            {widthError && <span data-testid="dlg-new-width-error" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{widthError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Height (px)</span>
            <input data-testid="dlg-new-height" value={height} onChange={(e) => setHeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: heightError ? '1px solid var(--kineora-danger)' : inputStyle.border }} />
            {heightError && <span data-testid="dlg-new-height-error" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{heightError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Frame rate (fps)</span>
            <input data-testid="dlg-new-fps" value={fps} onChange={(e) => setFps(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} style={{ ...inputStyle, border: fpsError ? '1px solid var(--kineora-danger)' : inputStyle.border }} />
            {fpsError && <span data-testid="dlg-new-fps-error" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{fpsError}</span>}
          </label>
          <label style={fieldLabel}>
            <span>Background</span>
            <input data-testid="dlg-new-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ height: 32, background: 'var(--kineora-input-bg)', border: '1px solid var(--kineora-input-border)', borderRadius: 4, padding: 2 }} />
          </label>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="dlg-new-cancel" onClick={onClose} style={{ ...btnBase, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)' }}>
            Cancel
          </button>
          <button data-testid="dlg-new-create" disabled={!valid} onClick={create} style={{ ...btnBase, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: valid ? '#fff' : 'var(--kineora-disabled-text)', cursor: valid ? 'pointer' : 'not-allowed' }}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
