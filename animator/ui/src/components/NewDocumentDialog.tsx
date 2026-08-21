import { useEffect, useRef, useState } from 'react'
import { DEFAULT_NEW_SETTINGS, PLATFORM_OPTIONS, UNIT_OPTIONS, type NewDocSettings } from '../file'
import { useFocusTrap } from './useFocusTrap'

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
const hintStyle: React.CSSProperties = { color: 'var(--kineora-muted)', fontSize: 10 }

/**
 * New document dialog (H01 v2): platform · width · height · fps ·
 * background+alpha · units. Defaults 1920×1080 px / 24 / #ffffff α=1 /
 * HTML5 Canvas (eng 03, P-8).
 * Validation (§5.2): W/H ≥ 2 (no upper bound, P-2) → inline error + Create
 * disabled; fps EMPTY = invalid (Create disabled) while a typed out-of-range
 * value CLAMPS to 1–120 on commit (v2 reconciliation); backgroundAlpha must
 * be 0–1 → inline error. Behavior: initial focus = platform, Enter = Create
 * (when valid — single-submit form implicit submission), Esc = Cancel,
 * outside-click = Cancel, focus trap, numeric fields announce their range.
 */
export function NewDocumentDialog({ open, onClose, onCreate }: Props) {
  const [platform, setPlatform] = useState(DEFAULT_NEW_SETTINGS.platform)
  const [width, setWidth] = useState(String(DEFAULT_NEW_SETTINGS.width))
  const [height, setHeight] = useState(String(DEFAULT_NEW_SETTINGS.height))
  const [fps, setFps] = useState(String(DEFAULT_NEW_SETTINGS.fps))
  const [background, setBackground] = useState(DEFAULT_NEW_SETTINGS.background)
  const [backgroundAlpha, setBackgroundAlpha] = useState(String(DEFAULT_NEW_SETTINGS.backgroundAlpha))
  const [units, setUnits] = useState(DEFAULT_NEW_SETTINGS.units)
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, rootRef)

  useEffect(() => {
    if (open) {
      setPlatform(DEFAULT_NEW_SETTINGS.platform)
      setWidth(String(DEFAULT_NEW_SETTINGS.width))
      setHeight(String(DEFAULT_NEW_SETTINGS.height))
      setFps(String(DEFAULT_NEW_SETTINGS.fps))
      setBackground(DEFAULT_NEW_SETTINGS.background)
      setBackgroundAlpha(String(DEFAULT_NEW_SETTINGS.backgroundAlpha))
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
  const a = Number(backgroundAlpha)
  const widthError = !Number.isFinite(w) || w < 2 ? 'width must be ≥ 2' : null
  const heightError = !Number.isFinite(h) || h < 2 ? 'height must be ≥ 2' : null
  // fps (§5.2 reconciled): EMPTY/non-numeric = invalid; a typed out-of-range
  // value is NOT an error — it clamps to 1–120 on commit.
  const fpsError = fps.trim() === '' || !Number.isFinite(Number(fps)) ? 'fps must be 1–120' : null
  const alphaError = !Number.isFinite(a) || a < 0 || a > 1 ? 'alpha must be 0–1' : null
  const valid = !widthError && !heightError && !fpsError && !alphaError

  const create = () => {
    if (!valid) return
    // Commit-time clamp (§5.2): typed 999 → 120, typed 0 → 1.
    const f = Math.min(120, Math.max(1, Math.round(Number(fps))))
    onCreate({ platform, width: w, height: h, fps: f, background, backgroundAlpha: a, units })
    onClose()
  }

  // Enter = Create (dialog contract) — routed through the form's submit path
  // (single code path) with implicit-submission default prevented, so a real
  // browser can never double-create.
  const enterCreates = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const form = (e.target as HTMLElement).closest('form')
    if (form?.requestSubmit) form.requestSubmit()
    else create()
  }

  return (
    <div data-testid="dlg-new" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={rootRef}
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
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create()
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={fieldLabel}>
              <span>Platform</span>
              <select data-testid="dlg-new-platform" autoFocus value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
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
              <input
                data-testid="dlg-new-width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                onKeyDown={enterCreates}
                aria-invalid={!!widthError}
                aria-describedby="dlg-new-width-hint"
                style={{ ...inputStyle, border: widthError ? '1px solid var(--kineora-danger)' : inputStyle.border }}
              />
              <span id="dlg-new-width-hint" data-testid="dlg-new-width-hint" style={hintStyle}>minimum 2 (no upper limit)</span>
              {widthError && <span data-testid="dlg-new-width-error" role="alert" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{widthError}</span>}
            </label>
            <label style={fieldLabel}>
              <span>Height (px)</span>
              <input
                data-testid="dlg-new-height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onKeyDown={enterCreates}
                aria-invalid={!!heightError}
                aria-describedby="dlg-new-height-hint"
                style={{ ...inputStyle, border: heightError ? '1px solid var(--kineora-danger)' : inputStyle.border }}
              />
              <span id="dlg-new-height-hint" data-testid="dlg-new-height-hint" style={hintStyle}>minimum 2 (no upper limit)</span>
              {heightError && <span data-testid="dlg-new-height-error" role="alert" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{heightError}</span>}
            </label>
            <label style={fieldLabel}>
              <span>Frame rate (fps)</span>
              <input
                data-testid="dlg-new-fps"
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                onKeyDown={enterCreates}
                aria-invalid={!!fpsError}
                aria-describedby="dlg-new-fps-hint"
                style={{ ...inputStyle, border: fpsError ? '1px solid var(--kineora-danger)' : inputStyle.border }}
              />
              <span id="dlg-new-fps-hint" data-testid="dlg-new-fps-hint" style={hintStyle}>1–120 (out-of-range clamps)</span>
              {fpsError && <span data-testid="dlg-new-fps-error" role="alert" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{fpsError}</span>}
            </label>
            <label style={fieldLabel}>
              <span>Background</span>
              <input data-testid="dlg-new-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} style={{ height: 32, background: 'var(--kineora-input-bg)', border: '1px solid var(--kineora-input-border)', borderRadius: 4, padding: 2 }} />
            </label>
            <label style={fieldLabel}>
              <span>Background opacity</span>
              <input
                data-testid="dlg-new-background-alpha"
                value={backgroundAlpha}
                onChange={(e) => setBackgroundAlpha(e.target.value)}
                onKeyDown={enterCreates}
                aria-invalid={!!alphaError}
                aria-describedby="dlg-new-background-alpha-hint"
                style={{ ...inputStyle, border: alphaError ? '1px solid var(--kineora-danger)' : inputStyle.border }}
              />
              <span id="dlg-new-background-alpha-hint" data-testid="dlg-new-background-alpha-hint" style={hintStyle}>0–1 (0 = transparent)</span>
              {alphaError && <span data-testid="dlg-new-background-alpha-error" role="alert" style={{ color: 'var(--kineora-danger)', fontSize: 10 }}>{alphaError}</span>}
            </label>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" data-testid="dlg-new-cancel" onClick={onClose} style={{ ...btnBase, border: '1px solid var(--kineora-btn-border)', background: 'var(--kineora-btn-bg)', color: 'var(--kineora-text)' }}>
              Cancel
            </button>
            <button type="submit" data-testid="dlg-new-create" disabled={!valid} style={{ ...btnBase, border: '1px solid var(--kineora-btn-primary-border)', background: 'var(--kineora-btn-primary-bg)', color: valid ? '#fff' : 'var(--kineora-disabled-text)', cursor: valid ? 'pointer' : 'not-allowed' }}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
