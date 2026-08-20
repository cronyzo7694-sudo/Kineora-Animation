import { useEffect, useRef, useState } from 'react'
import { performAction, isLoopEnabled, setLoopEnabled } from '../engine/actions'
import {
  copyFrames,
  cutFrames,
  duplicateKeyframe,
  moveKeyframe,
  pasteFrames,
  removeClassicTween,
  removeFrames,
  reverseFrames,
  setActiveLayer,
  setClassicTween,
  setPlayhead,
} from '../engine/client'
import type { FrameMarkerJson, StatusJson, TweenJson } from '../engine/wasmTypes'

/** Base cell width in px at 1× timeline zoom (exported for tests). */
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
/** Timeline zoom levels (cell-width multipliers) — [OUR DESIGN DECISION]: the
 *  blueprint requires "ruler zoom" with adaptive number spacing (F-07-03) but
 *  not the exact step size; geometric ×0.5/×1/×2/×4 matches Adobe's discrete
 *  frame-size presets [ADOBE REFERENCE]. */
const ZOOM_LEVELS = [0.5, 1, 2, 4]

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
    out.push(last !== null && !last.blank ? 'held' : 'empty')
  }
  return out
}

/** Adaptive ruler-number interval for a cell width (F-07-03 "sparser when
 *  zoomed out; denser when zoomed in"). */
function rulerInterval(cellW: number): number {
  if (cellW >= 60) return 1
  if (cellW >= 30) return 2
  if (cellW >= 15) return 5
  return 10
}

/**
 * Timeline (Part 07) — the "clock + score" panel.
 * View state that lives here (never in the engine, never persisted):
 *  - timeline zoom (ruler zoom, F-07-03) — cell-width ×0.5/×1/×2/×4 with
 *    adaptive ruler numbers; playhead/cells/dots/handle all remap exactly.
 *  - frame selection (click = select, Shift/Ctrl = toggle)
 *  - loop toggle (Part 07 §7.1.5) — stored in actions.ts (view state)
 * Navigation: ruler click = jump / drag = scrub; playhead handle = scrub;
 * `.`/`,` step; Alt+`,`/Alt+`.` keyframe-hop; Home/End; first/last/center
 * buttons. Frame ops (F5/F6/F7/Shift+F5/F6) are undoable engine commands.
 */
export function TimelineStrip({ status, notify }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const scrubRef = useRef(false)
  // frame selection is single-layer (per row, like Animate's frame selection):
  // selLayer = the layer the selection lives on; selFrames = the frames on it.
  const [selLayer, setSelLayer] = useState<number | null>(null)
  const [selFrames, setSelFrames] = useState<Set<number>>(new Set())
  const rangeRef = useRef<{ layer: number; start: number; startX: number; moved: boolean } | null>(null)
  const [cells, setCells] = useState(MIN_CELLS)
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const statusRef = useRef<StatusJson | null>(status)
  statusRef.current = status
  const keyDragRef = useRef<{ layer: number; from: number; startX: number; moved: boolean } | null>(null)
  const [zoomIdx, setZoomIdx] = useState(1) // ZOOM_LEVELS[1] = 1×
  const [loopOn, setLoopOn] = useState(isLoopEnabled)
  const [easeDraft, setEaseDraft] = useState<number | null>(null)
  // idempotency guard for the ease commit (multiple release events per gesture
  // — pointerup/mouseup/keyup/blur — must produce ONE undoable command).
  const easeCommitRef = useRef<number | null>(null)

  const zoomFactor = ZOOM_LEVELS[zoomIdx]
  const cellW = Math.round(CELL_W * zoomFactor)

  const attached = status !== null
  const playhead = status?.playhead ?? 1
  const layers = status?.layers ?? []
  const rows = [...layers].reverse()
  const activeLayerLocked = layers[status?.active_layer ?? 0]?.locked ?? false

  // selected range + tween state (view state; the engine validates mutations)
  const selSorted = selLayer !== null ? [...selFrames].sort((a, b) => a - b) : []
  const selMin = selSorted[0] ?? 0
  const selMax = selSorted[selSorted.length - 1] ?? 0
  const selLayerObj = selLayer !== null ? layers[selLayer] : null
  const selKeyframes = selLayerObj
    ? selLayerObj.keyframes.filter((k) => k.frame >= selMin && k.frame <= selMax).map((k) => k.frame).sort((a, b) => a - b)
    : []
  // a tween whose span INTERSECTS the selection (so clicking any cell of a
  // tween span lets you remove it or edit its ease)
  const selTween = selLayerObj
    ? selLayerObj.tweens.find((tw) => tw.end >= selMin && tw.start <= selMax)
    : undefined
  const activeEase = easeDraft ?? (selTween?.ease ?? 0)

  const tweenAt = (layer: StatusJson['layers'][number], f: number): TweenJson | null =>
    layer.tweens.find((tw) => f >= tw.start && f <= tw.end) ?? null

  // reset the ease commit guard + pending draft when the selected tween changes
  useEffect(() => {
    easeCommitRef.current = null
    setEaseDraft(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selLayer, selTween?.start, selTween?.end])

  // Commit the ease slider (Part 09.4.3): ONE undoable command per gesture.
  // Idempotent across pointerup/mouseup/keyup/blur so a single drag produces a
  // single command even when several release events fire. The draft is kept
  // until the engine status reflects it, so the slider never snaps back.
  const commitEase = () => {
    if (selLayer === null || !selTween || easeDraft === null) return
    if (easeDraft !== selTween.ease && easeCommitRef.current !== easeDraft) {
      setClassicTween(selLayer, selTween.start, selTween.end, easeDraft)
      notify(`tween ease → ${easeDraft}`)
    }
    easeCommitRef.current = easeDraft
  }

  // keep the viewport covering duration + playhead + the current cell width
  useEffect(() => {
    const grid = gridRef.current
    const viewW = grid ? grid.clientWidth : 0
    const fitCells = viewW > NAME_W ? Math.ceil((viewW - NAME_W) / cellW) + EXTEND_MARGIN : 0
    setCells((c) => Math.max(c, MIN_CELLS, status?.duration ?? 1, (status?.playhead ?? 1) + EXTEND_MARGIN, fitCells))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.duration, status?.playhead, zoomFactor])

  const totalWidth = NAME_W + cells * cellW

  const frameFromClientX = (clientX: number): number => {
    const grid = gridRef.current
    if (!grid) return 1
    const rect = grid.getBoundingClientRect()
    const left = rect.left + NAME_W
    const raw = 1 + Math.floor((clientX - left + grid.scrollLeft) / cellW)
    const f = Math.max(1, raw)
    if (f > cellsRef.current) {
      const next = f + EXTEND_MARGIN
      cellsRef.current = next
      setCells(next)
    }
    return f
  }

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

  // single-frame selection (plain click, or toggle on the same layer)
  const selectCell = (layerIdx: number, frame: number, toggle: boolean) => {
    setSelLayer(layerIdx)
    setSelFrames((prev) => {
      if (!toggle || prev.size === 0) return new Set([frame])
      const next = new Set(prev)
      if (next.has(frame)) next.delete(frame)
      else next.add(frame)
      return next
    })
  }

  // contiguous range selection on a layer [a..b]
  const selectRange = (layerIdx: number, a: number, b: number) => {
    setSelLayer(layerIdx)
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const next = new Set<number>()
    for (let f = lo; f <= hi; f++) next.add(f)
    setSelFrames(next)
  }

  // frame cell: plain mousedown arms a range drag; without movement (click) it
  // selects a single frame; with movement it selects a contiguous range
  // (engineering 07 "drag=range"). Shift/Ctrl/Cmd+click toggles immediately.
  const onCellDown = (e: React.MouseEvent, layerIdx: number, frame: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      selectCell(layerIdx, frame, true)
      return
    }
    rangeRef.current = { layer: layerIdx, start: frame, startX: e.clientX, moved: false }
    const move = (ev: MouseEvent) => {
      const g = rangeRef.current
      if (!g) return
      if (!g.moved && Math.abs(ev.clientX - g.startX) < 3) return
      g.moved = true
      const f = frameFromClientX(ev.clientX)
      selectRange(g.layer, g.start, f)
    }
    const up = () => {
      const g = rangeRef.current
      rangeRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('keydown', onKey)
      if (g && !g.moved) selectCell(g.layer, g.start, false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        rangeRef.current = null
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
        window.removeEventListener('keydown', onKey)
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('keydown', onKey)
  }

  const onDotDown = (e: React.MouseEvent, layerIdx: number, frame: number) => {
    if (e.button !== 0) return
    const locked = layers[layerIdx]?.locked ?? false
    if (locked) return
    e.preventDefault()
    e.stopPropagation()
    keyDragRef.current = { layer: layerIdx, from: frame, startX: e.clientX, moved: false }
    const move = (ev: MouseEvent) => {
      const g = keyDragRef.current
      if (!g) return
      if (!g.moved && Math.abs(ev.clientX - g.startX) < 3) return
      g.moved = true
    }
    const up = (ev: MouseEvent) => {
      const g = keyDragRef.current
      keyDragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('keydown', onKey)
      if (!g) return
      if (!g.moved) {
        selectCell(g.layer, g.from, false)
        return
      }
      const target = frameFromClientX(ev.clientX)
      if (target === g.from) return
      if (ev.altKey) {
        notify(duplicateKeyframe(g.layer, g.from, target) ? `keyframe duplicated ${g.from} → ${target}` : 'duplicate keyframe: target occupied or locked')
      } else {
        notify(moveKeyframe(g.layer, g.from, target) ? `keyframe moved ${g.from} → ${target}` : 'move keyframe: target occupied or locked')
      }
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        keyDragRef.current = null
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
        window.removeEventListener('keydown', onKey)
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('keydown', onKey)
  }

  // active layer's keyframes (sorted) for Alt+,/. hop
  const activeKeyframes = (): number[] => {
    const st = statusRef.current
    const layer = st?.layers?.[st.active_layer ?? 0]
    if (!layer) return []
    return layer.keyframes.map((k) => k.frame).sort((a, b) => a - b)
  }

  // keyboard: frame ops + transport + zoom (Part 29.5/29.6, F-07-03/04)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'F5') {
        e.preventDefault()
        performAction(e.shiftKey ? 'timeline.deleteframe' : 'timeline.insertframe', notify)
      } else if (e.key === 'F6') {
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
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault()
        const st = statusRef.current
        const cur = st?.playhead ?? 1
        if (e.altKey) {
          // keyframe hop (F-07-04 Alt+,/. / F-03-08 E4)
          const keys = activeKeyframes()
          const target = e.key === '.' ? keys.find((k) => k > cur) : [...keys].reverse().find((k) => k < cur)
          if (target !== undefined) setPlayhead(target)
        } else {
          setPlayhead(e.key === '.' ? cur + 1 : Math.max(1, cur - 1))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const zoomIn = () => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
  const zoomOut = () => setZoomIdx((i) => Math.max(0, i - 1))
  const toggleLoop = () => {
    const next = !loopOn
    setLoopOn(next)
    setLoopEnabled(next)
  }
  const centerFrame = () => {
    const grid = gridRef.current
    if (!grid) return
    grid.scrollLeft = Math.max(0, NAME_W + (playhead - 1) * cellW - grid.clientWidth / 2)
  }

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

  const twBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid #555',
    background: '#2a2a2a',
    color: '#eee',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12,
    opacity: disabled ? 0.5 : 1,
  })

  const navBtn = (id: string, label: string, title: string, onClick: () => void) => (
    <button
      data-testid={id}
      aria-label={title}
      title={title}
      disabled={!attached}
      onClick={onClick}
      style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: attached ? 'pointer' : 'not-allowed', fontSize: 12, opacity: attached ? 1 : 0.5 }}
    >
      {label}
    </button>
  )

  // run a range op (copy/cut/reverse/remove) against the SELECTED layer+range
  const doRange = (op: (layer: number, start: number, end: number) => boolean, verb: string) => {
    if (!attached || selLayer === null || selFrames.size === 0) return
    const locked = layers[selLayer]?.locked ?? false
    if (locked) {
      notify(`${verb}: locked layer — unlock to edit frames`)
      return
    }
    const sorted = [...selFrames].sort((a, b) => a - b)
    const ok = op(selLayer, sorted[0], sorted[sorted.length - 1])
    notify(ok ? `${verb}: done` : `${verb}: nothing to do`)
  }

  const seqBtn = (id: string, label: string, title: string, onClick: () => void) => {
    const hasSel = selLayer !== null && selFrames.size > 0
    const selLocked = selLayer !== null && (layers[selLayer]?.locked ?? false)
    const isPaste = id === 'timeline-paste'
    const isCopy = id === 'timeline-copy'
    const hasClip = (status?.clipboard_len ?? 0) > 0
    // copy is read-only → allowed even on locked layers; mutating ops are gated
    const disabled = !attached || (isPaste ? !hasClip || activeLayerLocked : isCopy ? !hasSel : !hasSel || selLocked)
    return (
      <button
        data-testid={id}
        data-disabled={disabled ? 'true' : 'false'}
        aria-label={title}
        title={title}
        disabled={disabled}
        onClick={onClick}
        style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, opacity: disabled ? 0.5 : 1 }}
      >
        {label}
      </button>
    )
  }

  const interval = rulerInterval(cellW)

  return (
    <div data-testid="timeline" style={{ height: 48 + RULER_H + Math.max(1, rows.length) * ROW_H + 8, borderTop: '1px solid #333', background: '#1e1e1e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 12px', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap' }}>
        <span style={{ color: '#aaa', fontSize: 11, minWidth: 120 }}>
          frame <strong data-testid="timeline-frame-readout" style={{ color: '#eee' }}>{playhead}</strong> / {Math.max(cells, playhead)}
        </span>
        {navBtn('timeline-first', '⏮', 'Go to first frame (Home)', () => setPlayhead(1))}
        {navBtn('timeline-last', '⏭', 'Go to last frame (End)', () => setPlayhead(Math.max(1, status?.duration ?? 1)))}
        {navBtn('timeline-center', '◎', 'Center playhead', centerFrame)}
        {btn('timeline.key', '◈ Key', 'Insert keyframe (F6)', 'timeline.keyframe')}
        {btn('timeline.blank', '○ Blank', 'Insert blank keyframe (F7)', 'timeline.blank')}
        {btn('timeline.clear', '✕ Clear', 'Clear keyframe (Shift+F6)', 'timeline.clear')}
        {btn('timeline.insertframe', '＋ Frame', 'Insert frame (F5)', 'timeline.insertframe')}
        {btn('timeline.deleteframe', '− Frame', 'Delete frame (Shift+F5)', 'timeline.deleteframe')}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
          {navBtn('timeline-zoom-out', '−', 'Timeline zoom out', zoomOut)}
          <span data-testid="timeline-zoom-readout" style={{ color: '#888', fontSize: 11, minWidth: 34, textAlign: 'center' }}>{Math.round(zoomFactor * 100)}%</span>
          {navBtn('timeline-zoom-in', '+', 'Timeline zoom in', zoomIn)}
        </span>
        <button
          data-testid="timeline-loop"
          data-on={loopOn ? 'true' : 'false'}
          aria-label="Loop playback"
          title="Loop playback"
          onClick={toggleLoop}
          style={{ padding: '2px 8px', borderRadius: 4, border: loopOn ? '1px solid #0a7cff' : '1px solid #555', background: loopOn ? '#0a3f7f' : '#2a2a2a', color: '#eee', cursor: 'pointer', fontSize: 12 }}
        >
          ⟳ Loop
        </button>
        {activeLayerLocked && <span data-testid="timeline-locked-hint" style={{ color: '#e66', fontSize: 11 }}>🔒 layer locked</span>}
        {!attached && <span data-testid="timeline-not-attached" style={{ color: '#e66', fontSize: 11 }}>engine not attached</span>}
      </div>

      <div data-testid="timeline-sequence-row" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 12px', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap' }}>
        <span style={{ color: '#888', fontSize: 11, minWidth: 120 }}>
          frames: {selLayer !== null ? selFrames.size : 0} selected{selLayer !== null ? ` (${layers[selLayer]?.name ?? 'layer'})` : ''}
        </span>
        {seqBtn('timeline-copy', 'Copy', 'Copy selected frames (to clipboard)', () => doRange(copyFrames, 'copy frames'))}
        {seqBtn('timeline-cut', 'Cut', 'Cut selected frames', () => doRange(cutFrames, 'cut frames'))}
        {seqBtn('timeline-paste', 'Paste', 'Paste frames at playhead', () => {
          if (!attached) return
          notify(pasteFrames(status?.active_layer ?? 0, status?.playhead ?? 1) ? 'frames pasted at playhead' : 'paste: clipboard empty or layer locked')
        })}
        {seqBtn('timeline-reverse', 'Reverse', 'Reverse selected keyframes', () => doRange(reverseFrames, 'reverse frames'))}
        {seqBtn('timeline-remove', 'Remove', 'Remove selected frames (leave gap)', () => doRange(removeFrames, 'remove frames'))}
        <span style={{ width: 1, height: 16, background: '#333', display: 'inline-block' }} />
        <button
          data-testid="timeline-create-tween"
          data-disabled={(!attached || selLayer === null || selKeyframes.length !== 2 || (selLayerObj?.locked ?? false)) ? 'true' : 'false'}
          aria-label="Create classic tween"
          title="Create classic tween between the two selected keyframes"
          disabled={!attached || selLayer === null || selKeyframes.length !== 2 || (selLayerObj?.locked ?? false)}
          onClick={() => {
            if (selLayer === null) return
            notify(setClassicTween(selLayer, selKeyframes[0], selKeyframes[1], 0) ? `tween ${selKeyframes[0]} → ${selKeyframes[1]}` : 'tween: the two keyframes must hold the same object')
          }}
          style={twBtnStyle(!attached || selLayer === null || selKeyframes.length !== 2 || (selLayerObj?.locked ?? false))}
        >
          ~ Tween
        </button>
        <button
          data-testid="timeline-remove-tween"
          data-disabled={(!attached || !selTween || (selLayerObj?.locked ?? false)) ? 'true' : 'false'}
          aria-label="Remove tween"
          title="Remove the classic tween in the selection"
          disabled={!attached || !selTween || (selLayerObj?.locked ?? false)}
          onClick={() => {
            if (selLayer === null || !selTween) return
            notify(removeClassicTween(selLayer, selTween.start) ? `tween removed @ ${selTween.start}` : 'remove tween: none')
          }}
          style={twBtnStyle(!attached || !selTween || (selLayerObj?.locked ?? false))}
        >
          ✕ Tween
        </button>
        {selTween && (
          <span data-testid="timeline-ease" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#888', fontSize: 11 }}>ease</span>
            <input
              type="range"
              data-testid="timeline-ease-slider"
              min={-100}
              max={100}
              step={1}
              value={activeEase}
              onChange={(e) => setEaseDraft(Number(e.target.value))}
              onPointerUp={commitEase}
              onMouseUp={commitEase}
              onKeyUp={commitEase}
              onBlur={commitEase}
              style={{ width: 70 }}
            />
            <span data-testid="timeline-ease-value" style={{ color: '#8ec8ff', fontSize: 11, minWidth: 26 }}>{Math.round(activeEase)}</span>
          </span>
        )}
      </div>

      <div ref={gridRef} data-testid="timeline-grid" style={{ position: 'relative', overflowX: 'auto', overflowY: 'hidden', flex: 1 }}>
        <div style={{ width: totalWidth, position: 'relative', minHeight: '100%' }}>
          <div data-testid="timeline-ruler" onMouseDown={onRulerDown} style={{ height: RULER_H, position: 'relative', borderBottom: '1px solid #2a2a2a', cursor: 'pointer' }}>
            {Array.from({ length: Math.ceil(cells / interval) }, (_, i) => (i === 0 ? 1 : i * interval)).map((f) => (
              <span key={f} data-testid={`frame-num-${f}`} style={{ position: 'absolute', left: NAME_W + (f - 1) * cellW, top: 3, color: f === playhead ? '#e33' : '#666', fontWeight: f === playhead ? 700 : 400, fontSize: 10 }}>
                {f}
              </span>
            ))}
            <span data-testid="current-frame-indicator" style={{ position: 'absolute', left: NAME_W + (playhead - 1) * cellW, top: 0, width: cellW, height: '100%', boxShadow: 'inset 0 0 0 1px #e33', pointerEvents: 'none' }} />
          </div>

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
                    const selected = selLayer === engineIndex && selFrames.has(f)
                    const tw = tweenAt(l, f)
                    const bg = tw ? '#1d4e7f' : kind === 'held' ? '#333333' : 'transparent'
                    return (
                      <div
                        key={f}
                        data-testid={`cell-${engineIndex}-${f}`}
                        data-kind={kind}
                        data-tween={tw ? 'true' : 'false'}
                        data-selected={selected ? 'true' : 'false'}
                        onMouseDown={(e) => onCellDown(e, engineIndex, f)}
                        style={{ position: 'absolute', left: (f - 1) * cellW, top: 0, width: cellW, height: '100%', background: bg, borderRight: '1px solid #2a2a2a', boxShadow: selected ? 'inset 0 0 0 1px #0a7cff' : 'none', color: '#8ec8ff', fontSize: 9, lineHeight: `${ROW_H}px`, textAlign: 'center' }}
                      >
                        {tw && f === tw.end ? '▶' : ''}
                        {(kind === 'key' || kind === 'blank') && (
                          <span
                            data-testid={`kf-dot-${engineIndex}-${f}`}
                            data-blank={kind === 'blank' ? 'true' : 'false'}
                            onMouseDown={(e) => onDotDown(e, engineIndex, f)}
                            style={{ position: 'absolute', left: cellW / 2 - 4, top: ROW_H / 2 - 4, width: 8, height: 8, borderRadius: '50%', background: kind === 'blank' ? 'transparent' : '#ddd', border: '1px solid #888', cursor: 'grab' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div
            data-testid="playhead"
            style={{ position: 'absolute', left: NAME_W + (playhead - 1) * cellW - 1, top: 0, bottom: 0, width: 2, background: '#e33', pointerEvents: 'none' }}
          />
          <div
            data-testid="playhead-handle"
            onMouseDown={onHandleDown}
            style={{ position: 'absolute', left: NAME_W + (playhead - 1) * cellW - 5, top: 0, width: 10, height: RULER_H, cursor: 'ew-resize' }}
          />
        </div>
      </div>
    </div>
  )
}
