import { useState } from 'react'
import { isLoopEnabled, isPlaying } from '../engine/actions'
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

  const playing = isPlaying()
  const loop = isLoopEnabled()

  // saving:changed (bus) → st.saving cell; produced by File ▸ Save.
  const [saving, setSaving] = useState<string | null>(null)
  useBus('saving:changed', (p) => {
    setSaving(p.state === 'saved' && p.time ? `saved ${p.time}` : p.state === 'saving' ? 'saving…' : null)
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
        <span style={{ color: playing ? '#8ec8ff' : dim }}>{playing ? '▶ playing' : '⏸ stopped'}</span>
        <span style={{ color: loop ? '#8ec8ff' : dim }}>{loop ? 'loop' : 'once'}</span>
      </span>
      <span data-testid="st-saving" style={cell}>
        <span style={{ color: saving ? '#8ec8ff' : dim }}>{saving ?? 'save —'}</span>
      </span>
      <span data-testid="st-export" style={cell}>
        <span style={{ color: dim }}>export —</span>
      </span>
      <span data-testid="st-mode" style={cell}>
        <span style={{ color: dim }}>mode —</span>
      </span>
      <span data-testid="st-snap" style={cell}>
        <span style={{ color: dim }}>snap off</span>
      </span>
      <span data-testid="engine-status" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66', marginLeft: 'auto' }}>
        engine: {engine.kind === 'ok' ? 'attached' : 'not attached'}
      </span>
      {toast && <span data-testid="toast" style={{ color: '#eeb' }}>{toast}</span>}
    </div>
  )
}
