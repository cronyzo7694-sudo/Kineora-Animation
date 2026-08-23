import { useEffect, useState } from 'react'
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

/** Edit ▸ Preferences — Auto-Save (app prefs, not document). */
export function PreferencesDialog({ open, onClose, notify }: Props) {
  const [enabled, setEnabled] = useState(true)
  const [intervalSec, setIntervalSec] = useState(30)

  useEffect(() => {
    if (!open) return
    const p = loadAutosavePrefs()
    setEnabled(p.enabled)
    setIntervalSec(p.intervalSec)
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

  return (
    <div
      data-testid="prefs-dialog"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-label="Preferences" style={{ width: 380, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 14px', color: '#eee', fontSize: 15 }}>Preferences</h3>
        <section data-testid="prefs-autosave" style={{ border: '1px solid #333', borderRadius: 6, padding: 12 }}>
          <div style={{ color: '#7eb8ff', fontSize: 12, fontWeight: 700, letterSpacing: 0.4, marginBottom: 10 }}>AUTO-SAVE</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ddd', fontSize: 13, cursor: 'pointer' }}>
            <input
              data-testid="prefs-autosave-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                const on = e.target.checked
                setEnabled(on)
                patchAutosavePrefs({ enabled: on })
                notify(on ? 'auto-save: on' : 'auto-save: off')
              }}
            />
            Enable Auto-Save
          </label>
          <p style={{ color: '#888', fontSize: 11, margin: '8px 0 10px', lineHeight: 1.45 }}>
            Writes a recovery snapshot (never overwrites your last Save). Crash recovery still prompts on next launch.
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' }}>
            <span>Interval</span>
            <select
              data-testid="prefs-autosave-interval"
              disabled={!enabled}
              value={intervalSec}
              onChange={(e) => {
                const n = Number(e.target.value)
                setIntervalSec(n)
                patchAutosavePrefs({ intervalSec: n })
                notify(`auto-save interval: ${formatAutosaveInterval(n)}`)
              }}
              style={{ background: '#111', color: enabled ? '#eee' : '#666', border: '1px solid #444', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
            >
              {AUTOSAVE_INTERVAL_PRESETS.map((s) => (
                <option key={s} value={s}>
                  {formatAutosaveInterval(s)}
                </option>
              ))}
            </select>
          </label>
        </section>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="prefs-close" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
