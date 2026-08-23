import { useEffect, useState } from 'react'
import { setDocumentSettings, statusJson } from '../engine/client'
import {
  AUTOSAVE_INTERVAL_PRESETS,
  formatAutosaveInterval,
  loadAutosavePrefs,
  patchAutosavePrefs,
} from '../autosavePrefs'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}

/**
 * Modify ▸ Document… (Ctrl+J) — the same engine command as the Properties
 * panel's Document section (kineora_set_document_settings), exposed as a menu
 * dialog. Width/Height/FPS/Background; fps is load-bearing (Part 01 §1.7).
 */
export function DocumentSettingsDialog({ open, onClose, notify }: Props) {
  const [w, setW] = useState('1920')
  const [h, setH] = useState('1080')
  const [fps, setFps] = useState('24')
  const [bg, setBg] = useState('#ffffff')
  const [asOn, setAsOn] = useState(true)
  const [asSec, setAsSec] = useState(30)

  useEffect(() => {
    if (!open) return
    const st = statusJson()
    setW(String(st?.doc_width ?? 1920))
    setH(String(st?.doc_height ?? 1080))
    setFps(String(st?.fps ?? 24))
    setBg(st?.background ?? '#ffffff')
    const as = loadAutosavePrefs()
    setAsOn(as.enabled)
    setAsSec(as.intervalSec)
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

  const commit = (patch: { width?: number; height?: number; fps?: number; background?: string }) => {
    const ok = setDocumentSettings(patch)
    notify(ok ? 'document settings updated' : 'document settings: engine not attached')
  }

  const field = (testId: string, label: string, value: string, onChange: (v: string) => void, onBlur: () => void) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' }}>
      <span>{label}</span>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
      />
    </label>
  )

  const num = (s: string): number | undefined => {
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
  }

  return (
    <div data-testid="doc-settings-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Document settings" style={{ width: 340, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#eee', fontSize: 15 }}>Document Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {field('doc-settings-width', 'Width (px)', w, setW, () => {
            const n = num(w)
            if (n && n >= 2) commit({ width: n })
          })}
          {field('doc-settings-height', 'Height (px)', h, setH, () => {
            const n = num(h)
            if (n && n >= 2) commit({ height: n })
          })}
          {field('doc-settings-fps', 'Frame rate (fps)', fps, setFps, () => {
            const n = num(fps)
            if (n && n >= 1 && n <= 120) commit({ fps: Math.round(n) })
          })}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' }}>
            <span>Background</span>
            <input
              data-testid="doc-settings-bg"
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              onBlur={() => commit({ background: bg })}
              style={{ height: 32, background: '#111', border: '1px solid #444', borderRadius: 4, padding: 2 }}
            />
          </label>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="doc-settings-close" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
