import { useEffect, useRef, useState } from 'react'
import { performAction } from '../engine/actions'
import { setActiveLayer, setPlayhead } from '../engine/client'
import type { FrameMarkerJson, StatusJson } from '../engine/wasmTypes'

/** Cell width in px (exported for tests). */
export const CELL_W = 18
/** Layer-name column width in px (exported for tests). */
export const NAME_W = 92
const RULER_H = 20
const ROW_H = 22
/** Initial visible viewport width (cells). This is a VIEW convenience, NOT a
 *  document limit — navigation past it auto-extends the viewport. */
const MIN_CELLS = 60
/** Cells of headroom added past the pointer/duration when auto-extending. */
const EXTEND_MARGIN = 24

interface Props {
  status: StatusJson | null
  notify: (msg: string) => void
}

type CellKind = 'key' | 'blank' | 'held' | 'empty'

function cellKinds(markers: FrameMarkerJson[], n: number): CellKind[] {
  const byFrame = new Map(markers.map((m) => [m.frame, m]))
  const frames = markers.map((m) => m.frame).sort((a, b) => a - b)
  const out: CellKind[] = []
  for (let f = 1; f <= n; f++) {
    const m = byFrame.get(f)
    if (m) {
      out.push(m.blank ? 'blank' : 'key')
      continue
    }
    let last: FrameMarkerJson | null = null
    for (const kf of frames) {
      if (kf <= f) last = byFrame.get(kf)!
      else break
    }
    // held: gray span of a CONTENT keyframe; blank keyframes hold nothing (white)
    out.push(last !== null && !last.blank ? 'held' : 'empty')
  }
  return out
}

/**
 * Timeline (Part 07) — the "clock + score" panel.
 * Duration model (Part 07 §7.0): document duration is DERIVED (max keyframe
 * frame, min 1) — there is NO fixed length, so the visible viewport is a
 * horizontally scrollable, auto-extending strip. Navigation (ruler click/drag,
 * playhead-handle drag) can reach ANY frame ≥ 1 and extends the viewport on
 * demand, so users can author frames beyond the current derived duration
 * (F-07-08 "last frame → extends doc"). Playback still loops within
 * [1, duration] (engineering REQ-TIM-004).
 *
 * Hit-area separation (F-07-03/F-07-04 + blueprint §7.1.2–7.1.4):
 *  - ruler click = jump playhead; ruler drag = scrub
 *  - playhead handle drag = scrub
 *  - frame cell click = SELECT the frame (view state; playhead does NOT move);
 *    Shift/Ctrl/Cmd+click = toggle selection
 * Frame ops (Key F6 / Blank F7 / Clear Shift+F6) are undoable engine commands;
 * they are DISABLED when the active layer is locked (Part 20.2 "not editable").
 */
export function TimelineStrip({ status, notify }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const scrubRef = useRef(false)
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [cells, setCells] = useState(MIN_CELLS)
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const statusRef = useRef<StatusJson | null>(status)
  statusRef.current = status

  const attached = status !== null
  const playhead = status?.playhead ?? 1
  const layers = status?.layers ?? []
  // frontmost layer at top (engine order = bottom→top)
  const rows = [...layers].reverse()
  const activeLayerLocked = layers[status?.active_layer ?? 0]?.locked ?? false

  // keep the viewport covering duration + playhead (never shrinks below MIN_CELLS)
  useEffect(() => {
    setCells((c) => Math.max(c, MIN_CELLS, status?.duration ?? 1, (status?.playhead ?? 1) + EXTEND_MARGIN))
  }, [status?.duration, status?.playhead])

  const totalWidth = NAME_W + cells * CELL_W

  const frameFromClientX = (clientX: number): number => {
    const grid = gridRef.current
    if (!grid) return 1
    const rect = grid.getBoundingClientRect()
    const left = rect.left + NAME_W
    // scrollLeft keeps the mapping correct when the strip is scrolled
    const raw = 1 + Math.floor((clientX - left + grid.scrollLeft) / CELL_W)
    const f = Math.max(1, raw)
    // auto-extend the viewport instead of clamping (no artificial limit)
    if (f > cellsRef.current) {
      const next = f + EXTEND_MARGIN
      cellsRef.current = next
      setCells(next)
    }
    return f
  }

  // scrub: jump then follow the mouse until mouseup (used by ruler + handle)
  const startScrub = (clientX: number) => {
    setPlayhead(frameFromClientX(clientX))
    scrubRef.current = true
    const move = (ev: MouseEvent) => {
      if (scrubRef.current) setPlayhead(frameFromClientX(ev.clientX))
    }
    const up = () => {
      scrubRef.current = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const onRulerDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !attached) return
    e.preventDefault()
    startScrub(e.clientX)
  }

  const onHandleDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !attached) return
    e.preventDefault()
    e.stopPropagation()
    startScrub(e.clientX)
  }

  // frame cell: click = select (no playhead move); shift/ctrl/cmd = toggle
  const onCellDown = (e: React.MouseEvent, layerIdx: number, frame: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const key = `${layerIdx}:${frame}`
    setSelectedFrames((prev) => {
      const next = new Set(prev)
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        if (next.has(key)) next.delete(key)
        else next.add(key)
      } else {
        next.clear()
        next.add(key)
      }
      return next
    })
  }

  // keyboard frame ops + transport (Part 29.5/29.6)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'F6') {
        e.preventDefault()
        performAction(e.shiftKey ? 'timeline.clear' : 'timeline.keyframe', notify)
      } else if (e.key === 'F7') {
        e.preventDefault()
        performAction('timeline.blank', notify)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setPlayhead(1)
      } else if (e.key === 'End') {
        e.preventDefault()
        setPlayhead(Math.max(1, statusRef.current?.duration ?? 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const btn = (id: string, label: string, title: string, action: string) => {
    const disabled = !attached || activeLayerLocked
    return (
      <button
        data-testid={id}
        data-locked={activeLayerLocked ? 'true' : 'false'}
        aria-label={title}
        title={activeLayerLocked ? `${title} (layer locked — unlock to edit)` : title}
        disabled={disabled}
        onClick={() => performAction(action, notify)}
        style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, opacity: disabled ? 0.5 : 1 }}
      >
        {label}
      </button>
    )
  }

  return (
    <div data-testid="timeline" style={{ height: 24 + RULER_H + Math.max(1, rows.length) * ROW_H + 8, borderTop: '1px solid #333', background: '#1e1e1e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 12px', borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ color: '#aaa', fontSize: 11, minWidth: 120 }}>
          frame <strong data-testid="timeline-frame-readout" style={{ color: '#eee' }}>{playhead}</strong> / {Math.max(cells, playhead)}
        </span>
        {btn('timeline.key', '◈ Key', 'Insert keyframe (F6)', 'timeline.keyframe')}
        {btn('timeline.blank', '○ Blank', 'Insert blank keyframe (F7)', 'timeline.blank')}
        {btn('timeline.clear', '✕ Clear', 'Clear keyframe (Shift+F6)', 'timeline.clear')}
        {activeLayerLocked && <span data-testid="timeline-locked-hint" style={{ color: '#e66', fontSize: 11 }}>🔒 layer locked</span>}
        {!attached && <span data-testid="timeline-not-attached" style={{ color: '#e66', fontSize: 11 }}>engine not attached</span>}
      </div>

      <div ref={gridRef} data-testid="timeline-grid" style={{ position: 'relative', overflowX: 'auto', overflowY: 'hidden', flex: 1 }}>
        <div style={{ width: totalWidth, position: 'relative', minHeight: '100%' }}>
          {/* ruler: click = jump, drag = scrub (F-07-03) */}
          <div data-testid="timeline-ruler" onMouseDown={onRulerDown} style={{ height: RULER_H, position: 'relative', borderBottom: '1px solid #2a2a2a', cursor: 'pointer' }}>
            {Array.from({ length: Math.ceil(cells / 5) }, (_, i) => (i === 0 ? 1 : i * 5)).map((f) => (
              <span key={f} data-testid={`frame-num-${f}`} style={{ position: 'absolute', left: NAME_W + (f - 1) * CELL_W, top: 3, color: f === playhead ? '#e33' : '#666', fontWeight: f === playhead ? 700 : 400, fontSize: 10 }}>
                {f}
              </span>
            ))}
            <span data-testid="current-frame-indicator" style={{ position: 'absolute', left: NAME_W + (playhead - 1) * CELL_W, top: 0, width: CELL_W, height: '100%', boxShadow: 'inset 0 0 0 1px #e33', pointerEvents: 'none' }} />
          </div>

          {/* layer rows */}
          {rows.map((l, ri) => {
            const engineIndex = layers.length - 1 - ri
            const kinds = cellKinds(l.keyframes, cells)
            return (
              <div key={l.id} data-testid={`timeline-layer-${engineIndex}`} style={{ height: ROW_H, position: 'relative', borderBottom: '1px solid #242424', background: l.active ? '#232f3d' : 'transparent' }}>
                <span
                  data-testid={`timeline-layer-name-${engineIndex}`}
                  title={l.locked ? `${l.name} (locked)` : l.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (attached) setActiveLayer(engineIndex)
                  }}
                  style={{ position: 'absolute', left: 4, top: 3, width: NAME_W - 8, color: l.locked ? '#777' : '#bbb', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  {l.locked ? '🔒 ' : ''}{l.name}
                </span>
                <div style={{ position: 'absolute', left: NAME_W, top: 0, right: 0, bottom: 0 }}>
                  {kinds.map((kind, i) => {
                    const f = i + 1
                    const selected = selectedFrames.has(`${engineIndex}:${f}`)
                    const bg = kind === 'held' ? '#333333' : 'transparent'
                    return (
                      <div
                        key={f}
                        data-testid={`cell-${engineIndex}-${f}`}
                        data-kind={kind}
                        data-selected={selected ? 'true' : 'false'}
                        onMouseDown={(e) => onCellDown(e, engineIndex, f)}
                        style={{ position: 'absolute', left: (f - 1) * CELL_W, top: 0, width: CELL_W, height: '100%', background: bg, borderRight: '1px solid #2a2a2a', boxShadow: selected ? 'inset 0 0 0 1px #0a7cff' : 'none' }}
                      >
                        {(kind === 'key' || kind === 'blank') && (
                          <span
                            data-testid={`kf-dot-${engineIndex}-${f}`}
                            data-blank={kind === 'blank' ? 'true' : 'false'}
                            style={{ position: 'absolute', left: CELL_W / 2 - 3, top: ROW_H / 2 - 3, width: 6, height: 6, borderRadius: '50%', background: kind === 'blank' ? 'transparent' : '#ddd', border: '1px solid #888' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* playhead line (non-interactive) */}
          <div
            data-testid="playhead"
            style={{ position: 'absolute', left: NAME_W + (playhead - 1) * CELL_W - 1, top: 0, bottom: 0, width: 2, background: '#e33', pointerEvents: 'none' }}
          />
          {/* playhead handle (drag = scrub, F-07-04) */}
          <div
            data-testid="playhead-handle"
            onMouseDown={onHandleDown}
            style={{ position: 'absolute', left: NAME_W + (playhead - 1) * CELL_W - 5, top: 0, width: 10, height: RULER_H, cursor: 'ew-resize' }}
          />
        </div>
      </div>
    </div>
  )
}
