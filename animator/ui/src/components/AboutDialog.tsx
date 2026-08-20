import { useEffect } from 'react'
import type { EngineStatus } from '../commands'

interface Props {
  open: boolean
  onClose: () => void
  engine: EngineStatus
}

const VERSION = '0.2.0'

/**
 * Help ▸ About Kineora Animation — brand identity, version, and an honest
 * engine-status readout. No external links (offline-first).
 */
export function AboutDialog({ open, onClose, engine }: Props) {
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
    <div data-testid="about-dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="About Kineora Animation" style={{ width: 380, background: '#1d1d1d', border: '1px solid #3a3a3a', borderRadius: 8, padding: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 1, color: '#8ef' }}>KINEORA</div>
        <div style={{ color: '#bbb', marginTop: 2 }}>Animation</div>
        <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>v{VERSION} — a local-first, 2D vector animation editor</div>
        <div style={{ marginTop: 16, fontSize: 12, color: '#aaa', textAlign: 'left', lineHeight: 1.7 }}>
          <div>Rust + WASM core (animator-core), React/TypeScript UI.</div>
          <div>Offline-first · Linux-first · no telemetry.</div>
          <div data-testid="about-engine" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66' }}>
            engine: {engine.kind === 'ok' ? 'attached' : 'not attached'}
          </div>
        </div>
        <button data-testid="about-close" onClick={onClose} style={{ marginTop: 18, padding: '6px 18px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#ddd', cursor: 'pointer', fontSize: 13 }}>
          Close
        </button>
      </div>
    </div>
  )
}
