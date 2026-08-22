import { useEffect, useState } from 'react'
import { controls } from '../controlRegistry'
import type { EngineStatus } from '../controlRegistry'
import type { Identity, ShellStatus } from '../platform'
import { outputLog, type OutputEntry } from '../outputLog'
import { debugViewController } from '../commands'
import { PanelHeader } from './PanelHeader'

interface Props {
  registryErrors: string[]
  toasts: string[]
  engine: EngineStatus
  engineLog: string[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
  shellStatus?: ShellStatus | null
  identity?: Identity | null
}

const LEVEL_COLOR: Record<OutputEntry['level'], string> = {
  info: '#9ab',
  warn: '#e6b85c',
  error: '#e66',
  debug: '#7a8a99',
}

function timestamp(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/**
 * Developer panel (SYS-10). The Blueprint's Debug menu is ActionScript
 * (historical only); Kineora ships an inspector for its own layer: the
 * command-registry audit, engine + shell status, event log, toasts, and the
 * Output console. The panel registers a DebugViewController so Debug-menu
 * commands (Clear / Copy output) can act without importing React internals.
 */
export function DebugPanel({
  registryErrors,
  toasts,
  engine,
  engineLog,
  collapsed = false,
  onToggleCollapse,
  onClose,
  shellStatus = null,
  identity = null,
}: Props) {
  const [entries, setEntries] = useState<OutputEntry[]>(() => outputLog.all())

  useEffect(() => outputLog.subscribe(setEntries), [])

  // Expose clear/copy to Debug-menu commands (FL-0009: no panel imports the
  // command registry; the registry calls back through this view controller).
  useEffect(() => {
    debugViewController.current = {
      clearOutput: () => outputLog.clear(),
      outputText: () =>
        outputLog
          .all()
          .map((e) => `${timestamp(e.t)} [${e.level}] ${e.source}: ${e.message}`)
          .join('\n'),
    }
    return () => {
      debugViewController.current = null
    }
  }, [])

  const errorCount = entries.filter((e) => e.level === 'error').length
  const warnCount = entries.filter((e) => e.level === 'warn').length

  return (
    <aside
      data-testid="debug-panel"
      aria-label="Developer panel"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: '100%',
        borderLeft: '1px solid #333',
        background: '#161616',
        overflow: 'auto',
        fontSize: 12,
        color: '#aaa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PanelHeader
        id="debug"
        title="Dev"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse ?? (() => {})}
        onClose={onClose ?? (() => {})}
      />

      {!collapsed && (
        <div style={{ padding: 10, overflow: 'auto', flex: 1 }}>
          <section>
            <div>
              <strong>Registry audit</strong>
            </div>
            <div data-testid="dead-button-count" style={{ color: registryErrors.length === 0 ? '#4a4' : '#e66' }}>
              {registryErrors.length === 0 ? '✓ 0 dead buttons / duplicate IDs' : registryErrors.join(' · ')}
            </div>
          </section>

          <section style={{ marginTop: 10 }}>
            <div>
              <strong>Engine</strong>
            </div>
            <div data-testid="engine-detail" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66' }}>
              {engine.kind === 'ok' ? engine.detail : engine.detail}
            </div>
          </section>

          {shellStatus && (
            <section style={{ marginTop: 10 }}>
              <div>
                <strong>Desktop shell</strong>
              </div>
              <div data-testid="shell-status" style={{ color: '#8ec8ff' }}>
                {shellStatus.product} v{shellStatus.version} · {shellStatus.build_mode} · {shellStatus.platform}/{shellStatus.arch} · engine {shellStatus.engine}
              </div>
              {identity && (
                <div data-testid="shell-identity" style={{ color: '#eeb' }}>
                  identity: {identity.display_name} {identity.dev_only ? '(DEVELOPMENT ONLY)' : ''}
                </div>
              )}
            </section>
          )}

          <section style={{ marginTop: 10 }}>
            <div>
              <strong>Engine event log</strong>
            </div>
            <ul data-testid="engine-log" style={{ margin: 0, paddingLeft: 16 }}>
              {engineLog.length === 0 ? <li>(none — engine not attached or no events yet)</li> : engineLog.slice(-8).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>

          <section style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>Output</strong>
              <span data-testid="output-count" style={{ fontSize: 10, color: '#777' }}>
                {entries.length}
                {errorCount > 0 ? ` · ${errorCount} err` : ''}
                {warnCount > 0 ? ` · ${warnCount} warn` : ''}
              </span>
            </div>
            <ul
              data-testid="output-log"
              aria-label="Output console"
              role="log"
              aria-live="polite"
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                maxHeight: 180,
                overflow: 'auto',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                background: '#101010',
                border: '1px solid #262626',
                borderRadius: 3,
                padding: 4,
              }}
            >
              {entries.length === 0 ? (
                <li style={{ color: '#555' }}>(no output — notifications, bus errors and handoffs appear here)</li>
              ) : (
                entries
                  .slice(-100)
                  .map((e) => (
                    <li key={e.id} data-testid={`output-entry-${e.id}`} style={{ color: LEVEL_COLOR[e.level] }}>
                      <span style={{ color: '#555' }}>{timestamp(e.t)}</span> <span style={{ color: '#788' }}>[{e.source}]</span> {e.message}
                    </li>
                  ))
              )}
            </ul>
          </section>

          <section style={{ marginTop: 10 }}>
            <div>
              <strong>UI events</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {toasts.length === 0 ? <li>(none)</li> : toasts.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>

          <section style={{ marginTop: 10 }}>
            <div>
              <strong>Controls ({controls.length})</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {controls.map((c) => (
                <li key={c.id}>
                  {c.id} — {c.state}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </aside>
  )
}
