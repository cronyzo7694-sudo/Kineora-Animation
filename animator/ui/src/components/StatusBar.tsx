import { useState } from 'react'
import { isLoopEnabled, playbackState } from '../engine/actions'
import type { EngineStatus } from '../controlRegistry'
import type { StatusJson } from '../engine/wasmTypes'
import { useBus } from '../useBus'

interface Props {
  engine: EngineStatus
  tool: string
  toast: string
  status: StatusJson | null
  /** Edit depth (0 = document root) for the symbol breadcrumb cell. */
  editDepth?: number
  onFrameClick: () => void
}

const cell: React.CSSProperties = { whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }
const label = { color: '#777' } as const
const dim = '#888'

/** SYS-01 §6.4 / C-05 st.snap — projection of `snap:changed`, never a fake
 *  static "snap off". SYS-04 SnapEngine is not implemented → honest "—". */
function SnapCell() {
  const [mode, setMode] = useState<string | null>(null)
  useBus('snap:changed', (p) => setMode(p.mode || null))
  return (
    <span data-testid="st-snap" style={cell}>
      <span style={{ color: mode ? '#8ec8ff' : dim }}>{mode ? `snap ${mode}` : 'snap —'}</span>
    </span>
  )
}

/**
 * Status bar (C-05): the 12 state-visibility cells. UI-owned cells (tool,
 * playback, recording/saving/export/mode/snap) read live state; engine-owned
 * cells (selection, layer, frame, scene) read the engine status (re-read each
 * frame — §27.0 "stale → consumers re-read model"). Cells with no producing
 * system yet show an honest "—" (never a fake value).
 */
export function StatusBar({ engine, tool, toast, status, editDepth = 0, onFrameClick }: Props) {
  const selection = status?.selection ?? []
  const details = status?.selection_details ?? []
  const selKind =
    selection.length === 0 ? '' : details.length > 0 && details.every((d) => d.kind === details[0].kind) ? details[0].kind : 'mixed'
  const activeLayer = status?.layers?.[status.active_layer ?? 0]

  // STM-PLAYBACK cell (SYS-09): re-render on every transport transition so
  // the chip always reflects IDLE/PLAYING/PAUSED (FL-0013: no stale state).
  const [, forcePlayback] = useState(0)
  useBus('playback:started', () => forcePlayback((n) => n + 1))
  useBus('playback:stopped', () => forcePlayback((n) => n + 1))
  useBus('playback:paused', () => forcePlayback((n) => n + 1))
  const pb = playbackState()
  const loop = isLoopEnabled()

  // saving:changed (bus) → st.saving cell; produced by File ▸ Save.
  // H11 §4: st.saving states idle/saving/saved/error with success/danger tokens
  const [saving, setSaving] = useState<{ text: string; danger: boolean } | null>(null)
  useBus('saving:changed', (p) => {
    if (p.state === 'saved' && p.time) setSaving({ text: `saved ${p.time}`, danger: false })
    else if (p.state === 'saving') setSaving({ text: 'saving…', danger: false })
    else if (p.state === 'error') setSaving({ text: 'save error', danger: true })
    else setSaving(null)
  })

  return (
    <div data-testid="statusbar" aria-live="polite" style={{ display: 'flex', gap: 14, padding: '4px 12px', borderTop: '1px solid #333', background: '#1e1e1e', color: '#bbb', fontSize: 12, overflowX: 'auto', overflowY: 'hidden' }}>
      <span data-testid="st-activeTool" style={cell}>
        <span style={label}>tool</span> <strong style={{ color: '#eee' }}>{tool}</strong>
      </span>
      <span data-testid="st-selection" style={cell}>
        <span style={label}>sel</span>
        <span style={{ color: selection.length > 0 ? '#8ec8ff' : dim }}>{selection.length > 0 ? `${selection.length} ${selKind}` : '—'}</span>
      </span>
      <span data-testid="st-activeLayer" style={cell}>
        <span style={label}>layer</span>
        <span style={{ color: '#eee' }}>
          {activeLayer ? `${activeLayer.locked ? '🔒 ' : ''}${activeLayer.name}` : '—'}
        </span>
      </span>
      <button
        data-testid="st-activeFrame"
        title="Go to frame…"
        onClick={onFrameClick}
        style={{ ...cell, background: 'transparent', border: 'none', padding: 0, color: '#bbb', cursor: 'pointer', fontSize: 12 }}
      >
        <span style={label}>frame</span>
        <span style={{ color: '#eee', fontFamily: 'ui-monospace, monospace' }}>
          {status ? `${status.playhead} / ${Math.max(status.duration ?? 1, status.playhead)} · ${status.fps}fps` : '—'}
        </span>
      </button>
      <span data-testid="st-activeScene" style={cell}>
        <span style={label}>scene</span> <span style={{ color: '#eee' }}>{status?.scene ?? '—'}</span>
      </span>
      <span data-testid="st-activeSymbol" style={cell}>
        <span style={label}>symbol</span> <span style={{ color: editDepth > 0 ? '#8ec8ff' : dim }}>{editDepth > 0 ? `▸ depth ${editDepth}` : '—'}</span>
      </span>
      <span data-testid="st-recording" style={cell}>
        <span style={{ color: dim }}>rec —</span>
      </span>
      <span data-testid="st-playback" style={cell}>
        <span
          data-testid="st-playback-state"
          style={{ color: pb === 'IDLE' ? dim : '#8ec8ff' }}
        >
          {pb === 'PLAYING' ? '▶ playing' : pb === 'PAUSED' ? '⏸ paused' : '⏹ stopped'}
        </span>
        <span style={{ color: loop ? '#8ec8ff' : dim }}>{loop ? 'loop' : 'once'}</span>
      </span>
      <span data-testid="st-saving" style={cell} aria-live="polite">
        <span style={{ color: saving ? (saving.danger ? 'var(--kineora-danger)' : 'var(--kineora-accent-text)') : dim }}>{saving?.text ?? 'save —'}</span>
      </span>
      <span data-testid="st-export" style={cell}>
        <span style={{ color: dim }}>export —</span>
      </span>
      <span data-testid="st-mode" style={cell}>
        <span style={{ color: dim }}>mode —</span>
      </span>
      <SnapCell />
      <span data-testid="engine-status" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66', marginLeft: 'auto' }}>
        engine: {engine.kind === 'ok' ? 'attached' : 'not attached'}
      </span>
      {toast && <span data-testid="toast" style={{ color: '#eeb' }}>{toast}</span>}
    </div>
  )
}
