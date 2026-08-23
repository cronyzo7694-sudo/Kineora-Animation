import { useEffect, useState } from 'react'
import { isLoopEnabled, playbackState } from '../engine/actions'
import { selectedInkIds, subscribeInk } from '../editor/inkStore'
import type { EngineStatus } from '../controlRegistry'
import type { StatusJson } from '../engine/wasmTypes'
import { useBus } from '../useBus'

interface Props {
  engine: EngineStatus
  tool: string
  toast: string
  status: StatusJson | null
  editDepth?: number
  onFrameClick: () => void
}

const cell: React.CSSProperties = { whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }
const label = { color: '#777' } as const
const dim = '#666'

function SnapCellInner() {
  const [mode, setMode] = useState<string | null>(null)
  useBus('snap:changed', (p) => setMode(p.mode || null))
  return <span style={{ color: mode ? '#8ec8ff' : dim }}>{mode ? `snap ${mode}` : 'snap —'}</span>
}

export function StatusBar({ engine, tool, toast, status, editDepth = 0, onFrameClick }: Props) {
  const [, setInkTick] = useState(0)
  useEffect(() => subscribeInk(() => setInkTick((n) => n + 1)), [])
  const inkN = selectedInkIds().length
  const selection = status?.selection ?? []
  const details = status?.selection_details ?? []
  const selKind =
    inkN > 0 && selection.length === 0
      ? 'ink'
      : selection.length === 0
        ? ''
        : details.length > 0 && details.every((d) => d.kind === details[0].kind)
          ? details[0].kind
          : 'mixed'
  const selCount = selection.length + inkN
  const activeLayer = status?.layers?.[status.active_layer ?? 0]

  const [, forcePlayback] = useState(0)
  useBus('playback:started', () => forcePlayback((n) => n + 1))
  useBus('playback:stopped', () => forcePlayback((n) => n + 1))
  useBus('playback:paused', () => forcePlayback((n) => n + 1))
  const pb = playbackState()
  const loop = isLoopEnabled()

  const [saving, setSaving] = useState<{ text: string; danger: boolean } | null>(null)
  useBus('saving:changed', (p) => {
    if (p.state === 'saved' && p.time) setSaving({ text: `saved ${p.time}`, danger: false })
    else if (p.state === 'saving') setSaving({ text: 'saving…', danger: false })
    else if (p.state === 'error') setSaving({ text: 'save error', danger: true })
    else setSaving(null)
  })

  return (
    <div data-testid="statusbar" aria-live="polite" style={{ display: 'flex', gap: 10, padding: '4px 12px', borderTop: '1px solid #2a2a2a', background: '#161616', color: '#aaa', fontSize: 11, overflowX: 'auto', overflowY: 'hidden', alignItems: 'center', scrollbarWidth: 'thin' }}>
      <span data-testid="st-activeTool" style={{ ...cell, background: '#232323', padding: '2px 8px', borderRadius: 3 }}>
        <span style={label}>tool</span> <strong style={{ color: '#eee' }}>{tool}</strong>
      </span>
      <span data-testid="st-selection" style={{ ...cell, background: selCount > 0 ? 'rgba(126,184,255,0.12)' : 'transparent', padding: '2px 8px', borderRadius: 3, opacity: selCount > 0 ? 1 : 0.5 }}>
        <span style={label}>sel</span>
        <span style={{ color: selCount > 0 ? '#8ec8ff' : dim }}>{selCount > 0 ? `${selCount} ${selKind}` : '—'}</span>
      </span>
      <span data-testid="st-activeLayer" style={cell}>
        <span style={label}>layer</span>
        <span style={{ color: '#ddd', fontWeight: 500 }}>
          {activeLayer ? `${activeLayer.locked ? '🔒 ' : ''}${activeLayer.name}` : '—'}
        </span>
      </span>
      <button
        data-testid="st-activeFrame"
        title="Go to frame… (click to jump)"
        onClick={onFrameClick}
        style={{ ...cell, background: '#232323', border: '1px solid #333', padding: '2px 8px', borderRadius: 3, color: '#bbb', cursor: 'pointer', fontSize: 12 }}
      >
        <span style={label}>frame</span>
        <span style={{ color: '#eee', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
          {status ? `${status.playhead} / ${Math.max(status.duration ?? 1, status.playhead)} · ${status.fps}fps` : '—'}
        </span>
      </button>
      <span data-testid="st-activeScene" style={cell}>
        <span style={label}>scene</span> <span style={{ color: '#ddd' }}>{status?.scene ?? '—'}</span>
      </span>
      <span data-testid="st-activeSymbol" style={{ ...cell, background: editDepth > 0 ? 'rgba(126,184,255,0.15)' : 'transparent', padding: editDepth > 0 ? '2px 8px' : '2px 4px', borderRadius: 3, opacity: editDepth > 0 ? 1 : 0.4 }}>
        <span style={label}>symbol</span> <span style={{ color: editDepth > 0 ? '#8ec8ff' : dim }}>{editDepth > 0 ? `▸ depth ${editDepth}` : '—'}</span>
      </span>
      <span data-testid="st-playback" style={cell}>
        <span data-testid="st-playback-state" style={{ color: pb === 'IDLE' ? dim : pb === 'PLAYING' ? '#4a4' : '#e8a020', fontWeight: pb !== 'IDLE' ? 600 : 400 }}>
          {pb === 'PLAYING' ? '▶ playing' : pb === 'PAUSED' ? '⏸ paused' : '⏹ stopped'}
        </span>
        <span style={{ color: loop ? '#8ec8ff' : dim, fontSize: 10, border: loop ? '1px solid #2d5aa7' : '1px solid transparent', padding: '0 4px', borderRadius: 2 }}>{loop ? 'loop' : 'once'}</span>
      </span>
      <span data-testid="st-saving" style={{ ...cell, background: saving ? (saving.danger ? 'rgba(229,85,85,0.15)' : 'rgba(74,170,74,0.12)') : 'transparent', padding: saving ? '2px 8px' : '2px 4px', borderRadius: 3, opacity: saving ? 1 : 0.4 }} aria-live="polite">
        <span style={{ color: saving ? (saving.danger ? 'var(--kineora-danger)' : '#4a4') : dim }}>{saving?.text ?? 'save —'}</span>
      </span>
      <span data-testid="st-recording" style={{ ...cell, opacity: 0.3 }}><span style={{ color: dim }}>rec —</span></span>
      <span data-testid="st-export" style={{ ...cell, opacity: 0.3 }}><span style={{ color: dim }}>export —</span></span>
      <span data-testid="st-mode" style={{ ...cell, opacity: 0.3 }}><span style={{ color: dim }}>mode —</span></span>
      <span data-testid="st-snap" style={{ ...cell, opacity: 0.4 }}><SnapCellInner /></span>
      <span data-testid="engine-status" style={{ color: engine.kind === 'ok' ? '#4a4' : '#e66', marginLeft: 'auto', fontSize: 11, background: engine.kind === 'ok' ? 'rgba(74,170,74,0.12)' : 'rgba(229,85,85,0.12)', padding: '2px 8px', borderRadius: 3 }}>
        {engine.kind === 'ok' ? '● attached' : '○ not attached'}
      </span>
      {toast && <span data-testid="toast" style={{ color: '#eeb', background: '#2a2a2a', padding: '2px 8px', borderRadius: 3, borderLeft: '2px solid #eeb' }}>{toast}</span>}
    </div>
  )
}
