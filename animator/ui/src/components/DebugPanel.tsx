import { controls } from '../controlRegistry'
import type { EngineStatus } from '../controlRegistry'

export function DebugPanel({
  registryErrors,
  toasts,
  engine,
}: {
  registryErrors: string[]
  toasts: string[]
  engine: EngineStatus
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
        <div>{engine.kind === 'ok' ? engine.detail : engine.detail.slice(0, 90) + '…'}</div>
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

      <section style={{ marginTop: 10 }}>
        <div><strong>Event log</strong></div>
        <ul data-testid="event-log" style={{ margin: 0, paddingLeft: 16 }}>
          {toasts.length === 0 ? <li>(no events — core not attached)</li> : toasts.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>
    </aside>
  )
}
