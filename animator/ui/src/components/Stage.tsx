import type { EngineStatus } from '../controlRegistry'

export function Stage({ engine, tool }: { engine: EngineStatus; tool: string }) {
  return (
    <div style={{ flex: 1, position: 'relative', background: '#111', minWidth: 0 }}>
      <div
        data-testid="stage"
        style={{
          position: 'absolute',
          inset: 24,
          background: '#ffffff',
          border: '1px solid #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {engine.kind === 'error' ? (
          <div data-testid="stage-notice" style={{ color: '#b33', textAlign: 'center', maxWidth: 360, fontSize: 14 }}>
            <strong>Core not attached</strong>
            <p style={{ marginTop: 8, color: '#666' }}>{engine.detail}</p>
          </div>
        ) : (
          <div style={{ color: '#333' }}>Canvas renderer (next unit)</div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 4, left: 8, color: '#888', fontSize: 12 }}>tool: {tool}</div>
    </div>
  )
}
