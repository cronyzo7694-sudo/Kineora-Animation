import { useEffect, useState } from 'react'
import { setPlayhead } from '../engine/client'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
  current: number
  duration: number
}

/**
 * Go-to-frame dialog (C-05 st.activeFrame click): jump the playhead to a
 * frame number. Real engine call (kineora_set_playhead); Enter commits,
 * Esc cancels. Frame clamped to [1, duration].
 */
export function GoToFrameDialog({ open, onClose, notify, current, duration }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue(String(current))
  }, [open, current])

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

  const commit = () => {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 1) {
      notify(`go to frame: enter a frame ≥ 1`)
      return
    }
    setPlayhead(Math.max(1, Math.min(Math.round(n), Math.max(1, duration))))
    notify(`go to frame: ${value}`)
    onClose()
  }

  return (
    <div data-testid="goto-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Go to frame" style={{ width: 260, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#eee', fontSize: 15 }}>Go to Frame</h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#bbb' }}>
          <span>Frame number (1–{Math.max(1, duration)})</span>
          <input
            data-testid="goto-input"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                commit()
              }
            }}
            style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 4, padding: '6px 8px', fontSize: 13 }}
          />
        </label>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button data-testid="goto-cancel" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button data-testid="goto-confirm" onClick={commit} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #0a7cff', background: '#0a3f7f', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            Go
          </button>
        </div>
      </div>
    </div>
  )
}
