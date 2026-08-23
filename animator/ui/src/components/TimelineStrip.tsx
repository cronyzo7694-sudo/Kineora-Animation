import { useEffect, useRef, useState } from 'react'
import { getCommand, makeCommandContext, timelineViewController } from '../commands'
import { useShortcutScope } from '../shortcuts'
import { performAction, isLoopEnabled, setLoopEnabled, playbackState, togglePlay } from '../engine/actions'
import { useBus } from '../useBus'
import {
  convertToBlankKeyframes,
  convertToKeyframes,
  copyFrames,
  createFolder,
  createLayer,
  cutFrames,
  deleteLayer,
  duplicateFrames,
  duplicateKeyframe,
  duplicateLayer,
  moveKeyframeSequence,
  pasteFrames,
  removeClassicTween,
  removeFrames,
  resizeSpan,
  reverseFrames,
  setClassicTween,
  setFrameLabel,
  setPlayhead,
} from '../engine/client'
import type { FrameMarkerJson, StatusJson, TweenJson } from '../engine/wasmTypes'
import { ResizeHandle } from './ResizeHandle'
import { TimelineChrome, CHROME_FLAG_W, CHROME_COLOR_W, CHROME_FLAGS_PAD } from './timeline/TimelineChrome'
import { displayRows } from './timeline/timelineRows'
import { TIMELINE_NAME_W, clamp } from '../panelLayout'
import {
  loadOnionPrefs,
  setOnionAnchorRange,
  setOnionPreset,
  subscribeOnionPrefs,
  toggleOnion,
  toggleOnionOutlines,
} from '../onionPrefs'
import { onionRange } from '../onion'
import { setAllLayersLocked, setAllLayersOutline, setAllLayersVisible } from '../engine/client'

/** Base cell width in px at 1× timeline zoom (exported for tests). */
export const CELL_W = 18
/** Grid-relative origin (U-13: ruler + playhead live in the grid column only).
 *  Kept as 0 so existing tests that add NAME_W to cell math stay valid. */
export const NAME_W = 0
const DEFAULT_CHROME_W = 200
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
  /** Fixed panel height (px) from the workspace layout (C-08 §tl.resize). When
   *  omitted, the timeline auto-sizes to fit its layers (backward compat). */
  height?: number
  /** Chrome (name+flags) width. Prefs-owned (U-G9). */
  nameW?: number
  onNameW?: (w: number) => void
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
export function TimelineStrip({ status, notify, height, nameW: nameWProp, onNameW }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const chromeRef = useRef<HTMLDivElement | null>(null)
  const [nameW, setNameW] = useState(() => clamp(nameWProp ?? DEFAULT_CHROME_W, TIMELINE_NAME_W[0], TIMELINE_NAME_W[1]))
  const nameWOrigin = useRef(nameW)
  useEffect(() => { onNameW?.(nameW) }, [nameW]) // eslint-disable-line react-hooks/exhaustive-deps
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
  // refs so the (once-registered) timeline view controller always sees live
  // selection / loop / notify state (Edit ▸ Timeline + Control ▸ Loop menus).
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const selLayerRef = useRef(selLayer)
  selLayerRef.current = selLayer
  const selFramesRef = useRef(selFrames)
  selFramesRef.current = selFrames
  const layersRef = useRef<StatusJson['layers']>([])
  const loopOnRef = useRef(false)
  const doRangeRef = useRef<(op: (layer: number, start: number, end: number) => boolean, verb: string) => void>(() => {})
  const doPasteRef = useRef<() => void>(() => {})
  const toggleLoopRef = useRef<() => void>(() => {})
  const keyDragRef = useRef<{ layer: number; from: number; startX: number; moved: boolean } | null>(null)
  const spanResizeRef = useRef<{ layer: number; anchor: number; startX: number } | null>(null)
  const [zoomIdx, setZoomIdx] = useState(1) // ZOOM_LEVELS[1] = 1×
  const [loopOn, setLoopOn] = useState(isLoopEnabled)
  loopOnRef.current = loopOn
  const [easeDraft, setEaseDraft] = useState<number | null>(null)
  const [labelDraft, setLabelDraft] = useState<string | null>(null)
  const [onionTick, setOnionTick] = useState(0)
  const [activeOnly, setActiveOnly] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [hiddenBtns, setHiddenBtns] = useState<Set<string>>(() => new Set())
  const [markersOpen, setMarkersOpen] = useState(false)
  useEffect(() => subscribeOnionPrefs(() => setOnionTick((n) => n + 1)), [])
  // idempotency guard for the ease commit (multiple release events per gesture
  // — pointerup/mouseup/keyup/blur — must produce ONE undoable command).
  const easeCommitRef = useRef<number | null>(null)

  const zoomFactor = ZOOM_LEVELS[zoomIdx]
  const cellW = Math.round(CELL_W * zoomFactor)

  const attached = status !== null
  const playhead = status?.playhead ?? 1
  const layers = status?.layers ?? []
  layersRef.current = layers
  const onion = loadOnionPrefs()
  void onionTick
  const allRows = displayRows(layers)
  const rows = activeOnly ? allRows.filter((l) => l.active) : allRows
  const activeLayer = layers[status?.active_layer ?? 0]
  const activeIsFolder = activeLayer?.kind === 'folder'
  const activeLayerLocked = (activeLayer?.locked ?? false) || !!activeIsFolder
  const [, setPbTick] = useState(0)
  useBus('playback:started', () => setPbTick((n) => n + 1))
  useBus('playback:paused', () => setPbTick((n) => n + 1))
  useBus('playback:stopped', () => setPbTick((n) => n + 1))
  const pb = playbackState()

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

  // a label can be edited when exactly ONE CONTENT keyframe is selected
  const labelTarget =
    selLayer !== null && selFrames.size === 1
      ? selLayerObj?.keyframes.find((k) => k.frame === selMin && !k.blank) ?? null
      : null

  const commitLabel = () => {
    if (selLayer === null || labelTarget === null) return
    const value = (labelDraft ?? labelTarget.label ?? '').trim()
    if (value === (labelTarget.label ?? '')) {
      setLabelDraft(null)
      return
    }
    notify(setFrameLabel(selLayer, labelTarget.frame, value) ? (value ? `label → ${value}` : 'label cleared') : 'label: not a content keyframe')
    setLabelDraft(null)
  }

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
        // Alt-drag = duplicate a single keyframe (F-07-12 E1)
        notify(duplicateKeyframe(g.layer, g.from, target) ? `keyframe duplicated ${g.from} → ${target}` : 'duplicate keyframe: target occupied or locked')
      } else {
        // drag = move the keyframe TOGETHER WITH its held span (Part 07 §7.4.9)
        const ok = moveKeyframeSequence(g.layer, g.from, target, false)
        if (ok) {
          notify(`frame span moved ${g.from} → ${target}`)
        } else if (window.confirm('The target has keyframes. Overwrite them?')) {
          const ow = moveKeyframeSequence(g.layer, g.from, target, true)
          notify(ow ? `frame span moved ${g.from} → ${target} (overwrite)` : 'move frame span: blocked')
        }
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

  // span-edge resize (Part 07 §7.4.11 / F-15-05): drag the end of a held span
  // to extend/shorten the exposure of the keyframe at `anchor`. One command on
  // release; zero-delta = no command; Esc cancels.
  const onSpanEdgeDown = (e: React.MouseEvent, layerIdx: number, anchor: number) => {
    if (e.button !== 0) return
    const locked = layers[layerIdx]?.locked ?? false
    if (locked) return
    e.preventDefault()
    e.stopPropagation()
    spanResizeRef.current = { layer: layerIdx, anchor, startX: e.clientX }
    const up = (ev: MouseEvent) => {
      const g = spanResizeRef.current
      spanResizeRef.current = null
      window.removeEventListener('mouseup', up)
      window.removeEventListener('keydown', onKey)
      if (!g) return
      const delta = Math.round((ev.clientX - g.startX) / cellW)
      if (delta === 0) return
      notify(resizeSpan(g.layer, g.anchor, delta) ? `span resized by ${delta}` : 'resize span: nothing to resize')
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        spanResizeRef.current = null
        window.removeEventListener('mouseup', up)
        window.removeEventListener('keydown', onKey)
      }
    }
    window.addEventListener('mouseup', up)
    window.addEventListener('keydown', onKey)
  }

  // keyboard: frame ops + transport (Part 29.5/29.6, F-07-03/04) — the
  // shortcut→command mapping lives in commands.ts; this component owns the
  // scope of timeline/transport commands (its window listener dispatches
  // through the single registry).
  useShortcutScope(
    new Set([
      'timeline.insertframe',
      'timeline.keyframe',
      'timeline.blank',
      'timeline.deleteframe',
      'timeline.clear',
      'control.firstFrame',
      'control.lastFrame',
      'control.stepForward',
      'control.stepBackward',
      'control.nextKeyframe',
      'control.prevKeyframe',
    ]),
    makeCommandContext({ notify, engine: attached ? { kind: 'ok', detail: '' } : { kind: 'error', detail: 'not attached' }, getStatus: () => statusRef.current }),
  )

  const zoomIn = () => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
  const zoomOut = () => setZoomIdx((i) => Math.max(0, i - 1))
  const toggleLoop = () => {
    const next = !loopOn
    setLoopOn(next)
    setLoopEnabled(next)
  }
  toggleLoopRef.current = toggleLoop

  // Register the timeline as the executor of Edit ▸ Timeline + Control ▸ Loop
  // menu commands (one source of truth — no duplicated frame-op logic).
  useEffect(() => {
    timelineViewController.current = {
      selection: () => {
        const l = selLayerRef.current
        const fs = selFramesRef.current
        if (l === null || fs.size === 0) return null
        return { layer: l, count: fs.size, locked: layersRef.current[l]?.locked ?? false }
      },
      hasClipboard: () => (statusRef.current?.clipboard_len ?? 0) > 0,
      copy: () => doRangeRef.current(copyFrames, 'copy frames'),
      cut: () => doRangeRef.current(cutFrames, 'cut frames'),
      paste: () => doPasteRef.current(),
      remove: () => doRangeRef.current(removeFrames, 'remove frames'),
      reverse: () => doRangeRef.current(reverseFrames, 'reverse frames'),
      duplicate: () => doRangeRef.current(duplicateFrames, 'duplicate frames'),
      convert: () => doRangeRef.current(convertToKeyframes, 'convert to keyframes'),
      convertBlank: () => doRangeRef.current(convertToBlankKeyframes, 'convert to blank keyframes'),
      loopEnabled: () => loopOnRef.current,
      toggleLoop: () => toggleLoopRef.current(),
      createClassicTween: () => {
        const l = selLayerRef.current
        const fs = selFramesRef.current
        const layer = l !== null ? layersRef.current[l] : undefined
        if (l === null || !layer) {
          notifyRef.current('classic tween: select two keyframes on the timeline')
          return
        }
        if (layer.locked) {
          notifyRef.current('classic tween: locked layer — unlock to edit')
          return
        }
        const keys = layer.keyframes
          .filter((k) => !k.blank && fs.has(k.frame))
          .map((k) => k.frame)
          .sort((a, b) => a - b)
        if (keys.length !== 2) {
          notifyRef.current('classic tween: select exactly two content keyframes')
          return
        }
        notifyRef.current(
          setClassicTween(l, keys[0], keys[1], 0)
            ? `tween ${keys[0]} → ${keys[1]}`
            : 'tween: the two keyframes must hold the same object',
        )
      },
    }
    return () => {
      timelineViewController.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const centerFrame = () => {
    const grid = gridRef.current
    if (!grid) return
    grid.scrollLeft = Math.max(0, NAME_W + (playhead - 1) * cellW - grid.clientWidth / 2)
  }

  const iconBtnStyle = (disabled: boolean, on = false): React.CSSProperties => ({
    width: 22,
    height: 20,
    padding: 0,
    borderRadius: 2,
    border: 'none',
    background: on ? '#2d5aa7' : 'transparent',
    color: '#d0d0d0',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 11,
    lineHeight: '20px',
    flexShrink: 0,
    opacity: disabled ? 0.35 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const btn = (id: string, label: string, title: string, action: string) => {
    const disabled = !attached || activeLayerLocked
    const reason = activeIsFolder ? 'folder — not a frame target' : activeLayerLocked ? 'layer locked — unlock to edit' : ''
    return (
      <button
        data-testid={id}
        data-locked={activeLayerLocked ? 'true' : 'false'}
        className="tl-ico"
        aria-label={title}
        title={reason ? `${title} (${reason})` : title}
        disabled={disabled}
        onClick={() => performAction(action, notify)}
        style={iconBtnStyle(disabled)}
      >
        {label}
      </button>
    )
  }

  const twBtnStyle = (disabled: boolean): React.CSSProperties => ({
    ...iconBtnStyle(disabled),
    width: 'auto',
    padding: '0 6px',
  })

  const navBtn = (id: string, label: string, title: string, onClick: () => void, on = false, disabled = !attached) => (
    <button
      data-testid={id}
      className="tl-ico"
      aria-label={title}
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={iconBtnStyle(disabled, on)}
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
  doRangeRef.current = doRange

  // paste at playhead (shared by the Paste button and Edit ▸ Timeline ▸ Paste)
  const doPaste = () => {
    if (!attached) return
    notify(pasteFrames(status?.active_layer ?? 0, status?.playhead ?? 1) ? 'frames pasted at playhead' : 'paste: clipboard empty or layer locked')
  }
  doPasteRef.current = doPaste

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
        style={twBtnStyle(disabled)}
      >
        {label}
      </button>
    )
  }

  const interval = rulerInterval(cellW)

  const fps = status?.fps ?? 24
  const elapsed = ((playhead - 1) / Math.max(1, fps)).toFixed(3)

  return (
    <div data-testid="timeline" style={{ height: height ?? 48 + RULER_H + Math.max(1, rows.length) * ROW_H + 8, borderTop: '1px solid #1a1a1a', background: '#2b2b2b', display: 'flex', flexDirection: 'column', flexShrink: 0, fontFamily: 'system-ui, Segoe UI, sans-serif' }}>
      <style>{`
        [data-testid="timeline"] button.tl-ico:hover:not(:disabled) { background: #3d3d3d; }
        [data-testid="timeline"] button.tl-ico:disabled { cursor: not-allowed; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', background: '#323232', borderBottom: '1px solid #1f1f1f', flexWrap: 'wrap', minHeight: 26 }}>
        {navBtn('timeline-add-layer', '+', 'New layer', () => { const i = createLayer(); if (i >= 0) notify(`layer added (index ${i})`) })}
        {navBtn('timeline-add-folder', '📁', 'New folder', () => { const i = createFolder(); if (i >= 0) notify(`folder added (index ${i})`) })}
        {navBtn('timeline-dup-layer', '⧉', 'Duplicate active layer', () => { const a = layers.findIndex((l) => l.active); const i = a >= 0 ? duplicateLayer(a) : -1; notify(i > 0 ? `layer duplicated (index ${i})` : 'duplicate layer: failed') }, false, !attached || layers.length === 0)}
        {navBtn('timeline-del-layer', '🗑', 'Delete active layer', () => { if (deleteLayer(layers.findIndex((l) => l.active))) notify('layer deleted') }, false, !attached || layers.length <= 1)}
        <span style={{ width: 1, height: 14, background: '#4a4a4a', margin: '0 4px' }} />
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, color: '#bdbdbd', fontSize: 11, minWidth: 168, fontVariantNumeric: 'tabular-nums' }}>
          <span title="Document frame rate"><strong style={{ color: '#f2f2f2', fontWeight: 600 }}>{fps.toFixed(2)}</strong> FPS</span>
          <span title="Current frame"><strong data-testid="timeline-frame-readout" style={{ color: '#f2f2f2', fontWeight: 600 }}>{playhead}</strong> F</span>
          <span data-testid="timeline-time-readout" title="Elapsed time (frame − 1) / fps" style={{ color: '#9a9a9a' }}>{elapsed}s</span>
        </span>
        <span style={{ width: 1, height: 14, background: '#4a4a4a', margin: '0 4px' }} />
        {navBtn('timeline-first', '⏮', 'Go to first frame (Home)', () => setPlayhead(1))}
        {navBtn(
          'timeline-play',
          pb === 'PLAYING' ? '⏸' : '▶',
          pb === 'PLAYING' ? 'Pause (Enter)' : 'Play (Enter)',
          () => togglePlay(notify),
          pb === 'PLAYING',
        )}
        {navBtn('timeline-last', '⏭', 'Go to last frame (End)', () => setPlayhead(Math.max(1, status?.duration ?? 1)))}
        {navBtn('timeline-center', '◎', 'Center playhead', centerFrame)}
        <span style={{ width: 1, height: 14, background: '#4a4a4a', margin: '0 4px' }} />
        {btn('timeline.key', '●', 'Insert keyframe (F6)', 'timeline.keyframe')}
        {btn('timeline.blank', '○', 'Insert blank keyframe (F7)', 'timeline.blank')}
        {btn('timeline.clear', '✕', 'Clear keyframe (Shift+F6)', 'timeline.clear')}
        {btn('timeline.insertframe', '+', 'Insert frame (F5)', 'timeline.insertframe')}
        {btn('timeline.deleteframe', '−', 'Delete frame (Shift+F5)', 'timeline.deleteframe')}
        <span style={{ flex: 1, minWidth: 8 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {navBtn('timeline-zoom-out', '−', 'Timeline zoom out', zoomOut)}
          <span data-testid="timeline-zoom-readout" style={{ color: '#9a9a9a', fontSize: 10, minWidth: 32, textAlign: 'center' }}>{Math.round(zoomFactor * 100)}%</span>
          {navBtn('timeline-zoom-in', '+', 'Timeline zoom in', zoomIn)}
        </span>
        <button
          data-testid="timeline-loop"
          data-on={loopOn ? 'true' : 'false'}
          className="tl-ico"
          aria-label="Loop playback"
          title="Loop playback"
          onClick={toggleLoop}
          style={iconBtnStyle(false, loopOn)}
        >
          ⟳
        </button>
        <span style={{ width: 1, height: 14, background: '#4a4a4a', margin: '0 4px' }} />
        {!hiddenBtns.has('timeline-onion') && navBtn('timeline-onion', '▣', 'Onion Skin (Ctrl+Alt+O)', () => notify(toggleOnion().on ? 'onion skin: on' : 'onion skin: off'), onion.on)}
        {!hiddenBtns.has('timeline-onion-outlines') && navBtn('timeline-onion-outlines', '▢', 'Onion Skin Outlines (Shift+O)', () => notify(toggleOnionOutlines().outlines ? 'onion outlines: on' : 'onion outlines: off'), onion.outlines)}
        <span style={{ position: 'relative' }}>
          {navBtn('timeline-onion-markers', '⚐', 'Modify onion markers', () => setMarkersOpen((v) => !v), markersOpen)}
          {markersOpen && (
            <div data-testid="timeline-onion-markers-menu" style={{ position: 'absolute', bottom: 22, left: 0, zIndex: 20, background: '#2a2a2a', border: '1px solid #555', borderRadius: 3, minWidth: 140, padding: 4 }}>
              {([['2', 'Onion 2'], ['5', 'Onion 5'], ['all', 'Onion All']] as const).map(([k, lab]) => (
                <button key={k} type="button" data-testid={`timeline-onion-preset-${k}`} onClick={() => { setOnionPreset(k, status?.duration ?? 1); setMarkersOpen(false); notify(`onion: ${lab}`) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ddd', fontSize: 11, padding: '3px 6px', cursor: 'pointer' }}>{lab}</button>
              ))}
              <button type="button" data-testid="timeline-onion-preset-anchor" onClick={() => { setOnionAnchorRange(Math.max(1, playhead - 2), playhead + 2); setMarkersOpen(false); notify('onion: Anchor markers') }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ddd', fontSize: 11, padding: '3px 6px', cursor: 'pointer' }}>Anchor Markers</button>
            </div>
          )}
        </span>
        {!hiddenBtns.has('timeline-emf') && <button data-testid="timeline-emf" className="tl-ico" title="Edit Multiple Frames — AMB-TL-020 (write rules open)" aria-label="Edit Multiple Frames" disabled onClick={() => notify(getCommand('view.editMultipleFrames')?.reason ?? 'EMF deferred')} style={iconBtnStyle(true)}>✎</button>}
        {!hiddenBtns.has('timeline-camera') && <button data-testid="timeline-camera" className="tl-ico" title="Add Camera — Part 16 / SYS-25 (no camera layer in this engine)" aria-label="Add Camera" disabled onClick={() => notify(getCommand('timeline.addCamera')?.reason ?? 'camera deferred')} style={iconBtnStyle(true)}>📷</button>}
        {!hiddenBtns.has('timeline-mute') && <button data-testid="timeline-mute" className="tl-ico" title="Mute Sounds (Ctrl+Alt+M) — SYS-26 audio engine" aria-label="Mute Sounds" onClick={() => getCommand('control.mute')?.run(makeCommandContext({ notify, engine: attached ? { kind: 'ok', detail: '' } : { kind: 'error', detail: 'not attached' }, getStatus: () => statusRef.current }))} style={iconBtnStyle(!attached)}>🔇</button>}
        {!hiddenBtns.has('timeline-parenting') && <button data-testid="timeline-parenting" className="tl-ico" title="Layer Parenting View — WISH W2 (folder parent_id is not transform parenting)" aria-label="Layer Parenting View" disabled onClick={() => notify(getCommand('timeline.parentingView')?.reason ?? 'parenting deferred')} style={iconBtnStyle(true)}>⛓</button>}
        {!hiddenBtns.has('timeline-active-only') && navBtn('timeline-active-only', '☰', 'Active layer only', () => setActiveOnly((v) => !v), activeOnly)}
        <span style={{ position: 'relative' }}>
          {navBtn('timeline-customize', '⋯', 'Customize timeline toolbar', () => setCustomizeOpen((v) => !v), customizeOpen)}
          {customizeOpen && (
            <div data-testid="timeline-customize-panel" style={{ position: 'absolute', bottom: 22, right: 0, zIndex: 20, background: '#2a2a2a', border: '1px solid #555', borderRadius: 3, minWidth: 180, padding: 6 }}>
              <div style={{ color: '#aaa', fontSize: 10, marginBottom: 4 }}>Show buttons</div>
              {(['timeline-onion', 'timeline-onion-outlines', 'timeline-onion-markers', 'timeline-emf', 'timeline-camera', 'timeline-mute', 'timeline-parenting', 'timeline-active-only'] as const).map((id) => (
                <label key={id} style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ddd', fontSize: 11, padding: '2px 0' }}>
                  <input type="checkbox" checked={!hiddenBtns.has(id)} onChange={() => setHiddenBtns((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })} />
                  {id.replace('timeline-', '')}
                </label>
              ))}
              <button type="button" data-testid="timeline-customize-reset" onClick={() => setHiddenBtns(new Set())} style={{ marginTop: 4, fontSize: 11, background: '#333', color: '#ddd', border: '1px solid #555', borderRadius: 2, cursor: 'pointer' }}>Reset</button>
            </div>
          )}
        </span>
        {activeLayerLocked && <span data-testid="timeline-locked-hint" style={{ color: '#e88', fontSize: 10 }}>{activeIsFolder ? 'folder — not a frame target' : 'layer locked'}</span>}
        {!attached && <span data-testid="timeline-not-attached" style={{ color: '#e88', fontSize: 10 }}>engine not attached</span>}
      </div>

      <div data-testid="timeline-sequence-row" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '1px 6px', background: '#2e2e2e', borderBottom: '1px solid #1f1f1f', flexWrap: 'wrap', minHeight: 22 }}>
        <span style={{ color: '#808080', fontSize: 10, minWidth: 110 }}>
          {selLayer !== null ? `${selFrames.size} selected (${layers[selLayer]?.name ?? 'layer'})` : 'no frames selected'}
        </span>
        {seqBtn('timeline-copy', 'Copy', 'Copy selected frames (to clipboard)', () => doRange(copyFrames, 'copy frames'))}
        {seqBtn('timeline-cut', 'Cut', 'Cut selected frames', () => doRange(cutFrames, 'cut frames'))}
        {seqBtn('timeline-paste', 'Paste', 'Paste frames at playhead', doPaste)}
        {seqBtn('timeline-reverse', 'Reverse', 'Reverse selected keyframes', () => doRange(reverseFrames, 'reverse frames'))}
        {seqBtn('timeline-remove', 'Remove', 'Remove selected frames (leave gap)', () => doRange(removeFrames, 'remove frames'))}
        {seqBtn('timeline-duplicate', '⧉ Dup', 'Duplicate the selected frame range', () => doRange(duplicateFrames, 'duplicate frames'))}
        {seqBtn('timeline-convert', '▣ Keys', 'Convert held frames to keyframes', () => doRange(convertToKeyframes, 'convert to keyframes'))}
        {seqBtn('timeline-convert-blank', '□ Blanks', 'Convert frames to blank keyframes', () => doRange(convertToBlankKeyframes, 'convert to blank keyframes'))}
        <span style={{ width: 1, height: 16, background: '#333', display: 'inline-block' }} />
        {labelTarget !== null && (
          <span data-testid="timeline-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#888', fontSize: 11 }}>label</span>
            <input
              data-testid="timeline-label-input"
              value={labelDraft ?? labelTarget.label ?? ''}
              placeholder="name"
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') {
                  setLabelDraft(null)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              style={{ width: 80, background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '2px 5px', fontSize: 11 }}
            />
          </span>
        )}
        <button
          data-testid="timeline-create-tween"
          className="tl-ico"
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
          className="tl-ico"
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

      <div data-testid="timeline-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div
          ref={chromeRef}
          data-testid="timeline-chrome-scroll"
          onScroll={() => {
            if (gridRef.current && chromeRef.current) gridRef.current.scrollTop = chromeRef.current.scrollTop
          }}
          style={{ width: nameW, flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', borderRight: '1px solid #2a2a2a' }}
        >
          <div
            data-testid="timeline-chrome-header"
            style={{ height: RULER_H, borderBottom: '1px solid #1f1f1f', flexShrink: 0, display: 'flex', alignItems: 'center', background: '#333', paddingLeft: 4 }}
          >
            <span style={{ flex: 1 }} />
            <button
              type="button"
              data-testid="timeline-header-eye"
              title="Visibility column — click to hide/show ALL layers (one undo)"
              aria-label="Hide or show all layers"
              disabled={!attached}
              onClick={() => {
                const anyOn = layers.some((l) => l.visible)
                const ok = setAllLayersVisible(!anyOn)
                notify(ok ? (anyOn ? 'all layers hidden' : 'all layers shown') : 'hide/show all: rebuild wasm (kineora_set_all_layers_visible)')
              }}
              style={{ width: CHROME_FLAG_W, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a8a', background: 'transparent', border: 'none', padding: 0, cursor: attached ? 'pointer' : 'default' }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M1.5 6 C3 3.5 5 2.8 6 2.8 S9 3.5 10.5 6 C9 8.5 7 9.2 6 9.2 S3 8.5 1.5 6 Z M6 4.6 A1.4 1.4 0 1 1 6 7.4 A1.4 1.4 0 1 1 6 4.6" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
            <button
              type="button"
              data-testid="timeline-header-lock"
              title="Lock column — click to lock/unlock ALL layers (one undo)"
              aria-label="Lock or unlock all layers"
              disabled={!attached}
              onClick={() => {
                const anyOn = layers.some((l) => l.locked)
                const ok = setAllLayersLocked(!anyOn)
                notify(ok ? (anyOn ? 'all layers unlocked' : 'all layers locked') : 'lock all: rebuild wasm (kineora_set_all_layers_locked)')
              }}
              style={{ width: CHROME_FLAG_W, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a8a', background: 'transparent', border: 'none', padding: 0, cursor: attached ? 'pointer' : 'default' }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M4 5.4 V3.8 A2 2 0 0 1 8 3.8 V5.4 M3.4 5.4 H8.6 V10.2 H3.4 Z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
            <button
              type="button"
              data-testid="timeline-header-outline"
              title="Outline column — click to outline ALL layers (one undo)"
              aria-label="Outline all layers"
              disabled={!attached}
              onClick={() => {
                const anyOn = layers.some((l) => l.outline)
                const ok = setAllLayersOutline(!anyOn)
                notify(ok ? (anyOn ? 'all outlines off' : 'all layers outline') : 'outline all: rebuild wasm (kineora_set_all_layers_outline)')
              }}
              style={{ width: CHROME_COLOR_W, height: 10, marginRight: CHROME_FLAGS_PAD, border: '1px solid #666', background: 'transparent', boxSizing: 'border-box', padding: 0, cursor: attached ? 'pointer' : 'default' }}
            />
          </div>
          <TimelineChrome status={status} notify={notify} variant="chrome" rowHeight={ROW_H} onlyActive={activeOnly} />
        </div>
        <ResizeHandle
          testId="resize-timeline-name"
          direction={1}
          onBegin={() => { nameWOrigin.current = nameW }}
          onDelta={(dx) => setNameW((w) => clamp(w + dx, TIMELINE_NAME_W[0], TIMELINE_NAME_W[1]))}
          onCancel={() => setNameW(nameWOrigin.current)}
        />
      <div ref={gridRef} data-testid="timeline-grid" onScroll={() => {
        if (gridRef.current && chromeRef.current) chromeRef.current.scrollTop = gridRef.current.scrollTop
      }} style={{ position: 'relative', overflowX: 'auto', overflowY: 'auto', flex: 1, minWidth: 0 }}>
        <div style={{ width: totalWidth, position: 'relative', minHeight: '100%' }}>
          <div data-testid="timeline-ruler" onMouseDown={onRulerDown} style={{ height: RULER_H, position: 'relative', borderBottom: '1px solid #1f1f1f', cursor: 'pointer', background: '#333' }}>
            {Array.from({ length: cells }, (_, i) => (
              <span
                key={`tick-${i + 1}`}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: NAME_W + i * cellW,
                  bottom: 0,
                  width: 1,
                  height: (i + 1) % interval === 1 || i === 0 ? 8 : 4,
                  background: '#555',
                  pointerEvents: 'none',
                }}
              />
            ))}
            {Array.from({ length: Math.ceil(cells / interval) }, (_, i) => (i === 0 ? 1 : i * interval)).map((f) => (
              <span key={f} data-testid={`frame-num-${f}`} style={{ position: 'absolute', left: NAME_W + (f - 1) * cellW + 2, top: 1, color: f === playhead ? '#ff4d4d' : '#9a9a9a', fontWeight: f === playhead ? 700 : 400, fontSize: 9 }}>
                {f}
              </span>
            ))}
            {Array.from({ length: Math.floor((cells - 1) / Math.max(1, fps)) + 1 }, (_, s) => {
              const f = 1 + s * fps
              if (f > cells) return null
              return (
                <span key={`sec-${s}`} data-testid={`ruler-sec-${s}`} style={{ position: 'absolute', left: NAME_W + (f - 1) * cellW + 2, bottom: 0, color: '#6a8aaa', fontSize: 8, pointerEvents: 'none' }}>
                  {s}s
                </span>
              )
            })}
            {onion.on ? (
              <OnionBand onion={onion} playhead={playhead} duration={Math.max(cells, status?.duration ?? 1)} cellW={cellW} frameFromClientX={frameFromClientX} />
            ) : null}
            <span data-testid="current-frame-indicator" style={{ position: 'absolute', left: NAME_W + (playhead - 1) * cellW, top: 0, width: cellW, height: '100%', boxShadow: 'inset 0 0 0 1px #e33', background: 'rgba(227,51,51,0.12)', pointerEvents: 'none' }} />
          </div>

          {rows.map((l) => {
            const engineIndex = layers.findIndex((x) => x.id === l.id)
            const isFolder = l.kind === 'folder'
            const kinds = cellKinds(l.keyframes, cells)
            return (
              <div key={l.id} data-testid={`timeline-layer-${engineIndex}`} style={{ height: ROW_H, position: 'relative', borderBottom: '1px solid #1f1f1f', background: l.active ? '#24344a' : isFolder ? '#222' : '#2b2b2b' }}>
                {isFolder ? (
                  <div data-testid={`timeline-folder-strip-${engineIndex}`} aria-hidden style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(90deg, #262626 0 8px, #222 8px 18px)' }} />
                ) : (
                <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
                  {kinds.map((kind, i) => {
                    const f = i + 1
                    const selected = selLayer === engineIndex && selFrames.has(f)
                    const tw = tweenAt(l, f)
                    const bg = tw ? '#4a7aaa' : kind === 'key' || kind === 'held' ? '#c4c4c4' : kind === 'blank' ? '#9a9a9a' : '#2b2b2b'
                    const marker = l.keyframes.find((m) => m.frame === f)
                    const label = marker?.label ?? undefined
                    // span edge = the LAST held cell of a span (next cell isn't held)
                    const isEdge = kind === 'held' && (i + 1 >= kinds.length || kinds[i + 1] !== 'held')
                    // the anchor (start keyframe) of the hold that this edge ends
                    const anchor = (() => {
                      let last: number | null = null
                      for (const m of l.keyframes) {
                        if (m.frame <= f && !m.blank) last = m.frame
                        if (m.frame > f) break
                      }
                      return last
                    })()
                    return (
                      <div
                        key={f}
                        data-testid={`cell-${engineIndex}-${f}`}
                        data-kind={kind}
                        data-tween={tw ? 'true' : 'false'}
                        data-selected={selected ? 'true' : 'false'}
                        onMouseDown={(e) => onCellDown(e, engineIndex, f)}
                        style={{ position: 'absolute', left: (f - 1) * cellW, top: 0, width: cellW, height: '100%', background: bg, borderRight: kind === 'empty' ? '1px solid #333' : '1px solid #b0b0b0', boxShadow: selected ? 'inset 0 0 0 1px #1473e6' : 'none', color: tw ? '#e8f2ff' : '#333', fontSize: 9, lineHeight: `${ROW_H}px`, textAlign: 'center' }}
                      >
                        {tw && f === tw.end ? '▶' : ''}
                        {(kind === 'key' || kind === 'blank') && (
                          <span
                            data-testid={`kf-dot-${engineIndex}-${f}`}
                            data-blank={kind === 'blank' ? 'true' : 'false'}
                            data-label={label ?? ''}
                            title={label ? `label: ${label}` : undefined}
                            onMouseDown={(e) => onDotDown(e, engineIndex, f)}
                            style={{ position: 'absolute', left: cellW / 2 - 3, top: ROW_H / 2 - 3, width: 6, height: 6, borderRadius: '50%', background: kind === 'blank' ? 'transparent' : '#111', border: '1.5px solid #111', cursor: 'grab', boxSizing: 'border-box' }}
                          />
                        )}
                        {label && (
                          <span
                            data-testid={`kf-label-${engineIndex}-${f}`}
                            style={{ position: 'absolute', left: cellW / 2 + 3, top: 0, color: '#e33', fontSize: 9, pointerEvents: 'none' }}
                          >
                            ▸
                          </span>
                        )}
                        {/* end-of-span marker (F-07-05 E2/E4: hollow rectangle at the
                            last held frame) — view-only, never exported */}
                        {isEdge && (
                          <span
                            data-testid={`span-end-${engineIndex}-${f}`}
                            onMouseDown={(e) => anchor !== null && onSpanEdgeDown(e, engineIndex, anchor)}
                            style={{ position: 'absolute', right: 1, top: 3, width: 5, height: ROW_H - 6, border: '1.5px solid #333', cursor: 'ew-resize', background: 'transparent', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                )}
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
    </div>
  )
}

function OnionBand({
  onion,
  playhead,
  duration,
  cellW,
  frameFromClientX,
}: {
  onion: ReturnType<typeof loadOnionPrefs>
  playhead: number
  duration: number
  cellW: number
  frameFromClientX: (x: number) => number
}) {
  const band = onionRange(onion, playhead, duration)
  const left = NAME_W + (band.start - 1) * cellW
  const width = Math.max(cellW, (band.end - band.start + 1) * cellW)
  const onMarkerDown = (which: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const move = (ev: MouseEvent) => {
      const f = frameFromClientX(ev.clientX)
      if (which === 'start') setOnionAnchorRange(f, Math.max(f, band.end))
      else setOnionAnchorRange(Math.min(band.start, f), f)
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  return (
    <>
      <span data-testid="onion-band" style={{ position: 'absolute', left, top: 14, width, height: 6, background: 'rgba(80,140,220,0.35)', pointerEvents: 'none' }} />
      <span data-testid="onion-marker-start" onMouseDown={onMarkerDown('start')} style={{ position: 'absolute', left: left - 3, top: 12, width: 6, height: 8, background: '#6af', cursor: 'ew-resize' }} />
      <span data-testid="onion-marker-end" onMouseDown={onMarkerDown('end')} style={{ position: 'absolute', left: left + width - 3, top: 12, width: 6, height: 8, background: '#6af', cursor: 'ew-resize' }} />
    </>
  )
}
