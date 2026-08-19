import { controls } from '../controlRegistry'
import type { EngineStatus } from '../controlRegistry'

export function DebugPanel({
  registryErrors,
  toasts,
  engine,
  engineLog,
}: {
  registryErrors: string[]
  toasts: string[]
  engine: EngineStatus
  engineLog: string[]
}) {
  return (
    <aside data-testid="debug-panel" aria-label="Developer panel" style={{ width: 300, borderLeft: '1px solid #333', background: '#161616', padding: 10, overflow: 'auto', fontSize: 12, color: '#aaa' }}>
      <h3 style={{ margin: '0 0 8px', color: '#ddd', fontSize: 13 }}>Dev Panel</h3>

      <section>
        <div><strong>Registry audit</strong></div>
        <div data-testid="dead-button-count" style={{ color: registryErrors.length === 0 ? '#4a4' : '#e66' }}>
          {registryErrors.length === 0 ? '✓ 0 dead buttons / duplicate IDs' : registryErrors.join(' · ')}
        </div>
      </section>

      <section style={{ marginTop: 10 }}>
        <div><strong>Engine</strong></div>
        <div data-testid="engine-detail" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66' }}>
          {engine.kind === 'ok' ? engine.detail : engine.detail}
        </div>
      </section>

      <section style={{ marginTop: 10 }}>
        <div><strong>Engine event log</strong></div>
        <ul data-testid="engine-log" style={{ margin: 0, paddingLeft: 16 }}>
          {engineLog.length === 0 ? <li>(none — engine not attached or no events yet)</li> : engineLog.slice(-8).map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>

      <section style={{ marginTop: 10 }}>
        <div><strong>UI events</strong></div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {toasts.length === 0 ? <li>(none)</li> : toasts.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>

      <section style={{ marginTop: 10 }}>
        <div><strong>Controls ({controls.length})</strong></div>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {controls.map((c) => (
            <li key={c.id}>
              {c.id} — {c.state}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
