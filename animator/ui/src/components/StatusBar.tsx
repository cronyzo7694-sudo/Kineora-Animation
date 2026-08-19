import type { EngineStatus } from '../controlRegistry'

export function StatusBar({
  engine,
  tool,
  toast,
  playhead,
  fps,
}: {
  engine: EngineStatus
  tool: string
  toast: string
  playhead: number
  fps: number
}) {
  return (
    <div data-testid="statusbar" style={{ display: 'flex', gap: 16, padding: '4px 12px', borderTop: '1px solid #333', background: '#1e1e1e', color: '#bbb', fontSize: 12 }}>
      <span>tool: <strong>{tool}</strong></span>
      <span data-testid="playhead-readout">frame: {playhead} / {fps}fps</span>
      <span>scene: Scene 1</span>
      <span data-testid="engine-status" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66' }}>
        engine: {engine.kind === 'ok' ? 'attached' : 'not attached'}
      </span>
      {toast && <span data-testid="toast" style={{ color: '#eeb' }}>{toast}</span>}
    </div>
  )
}
