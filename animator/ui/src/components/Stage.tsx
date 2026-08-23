import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { makeCommandContext, stageViewController } from '../commands'
import { useShortcutScope } from '../shortcuts'
import type { EngineStatus } from '../controlRegistry'
import {
  clearSelection,
  deleteSelection,
  drawShape,
  evaluate,
  hasShapeDrawFacade,
  setNodeProps,
  moveSelection,
  placeSymbol,
  selectAt,
  selectInRect,
  selectToggleAt,
  statusJson,
  swapInstance,
  transformSelection,
} from '../engine/client'
import {
  addInk,
  clearInkSelection,
  deleteInkIds,
  hitInk,
  hitInkAnchor,
  inkBounds,
  inkInPolygon,
  inkInRect,
  listInk,
  moveInk,
  selectInk,
  selectedInkIds,
  setInkPoint,
  updateInk,
  simplifyPolyline,
  subscribeInk,
  type InkPt,
} from '../editor/inkStore'
import { render, type ColorPreview, type RenderState, HANDLE_HIT_RADIUS } from '../render/canvasRenderer'
import { loadViewPrefs, patchViewPrefs, subscribeViewPrefs } from '../viewPrefs'
import { loadToolColors, setToolColors, subscribeToolColors } from '../toolColors'
import { contrastOn } from '../contrast'
import { loadToolOptions, rectFullyInside, snapMoveDelta, subscribeToolOptions } from '../toolOptions'
import { loadOnionPrefs, subscribeOnionPrefs } from '../onionPrefs'
import { collectGhosts } from '../onion'
import {
  ZOOM_STEP_FINE,
  createViewport,
  docToScreen,
  fitViewport,
  panBy,
  screenToDoc,
  setZoomAt,
  sliderToZoom,
  zoomAt,
  zoomToRect,
  zoomToSlider,
  type Viewport,
} from '../render/viewport'
import { pastDragThreshold, screenDeltaToDoc, normalizeRect, buildRect, isValidRect, type DocRect } from '../editor/gesture'
import {
  handlePositions,
  oppositeHandle,
  pickHandle,
  rotationDelta,
  scaleFactors,
  scaleSelection,
  rotateSelection,
  selectionGeometry,
  type AbsTransformOut,
  type HandleKind,
  type Pt,
  type SelDetail,
} from '../editor/transformMath'
import type { RectItemJson } from '../engine/wasmTypes'

interface Props {
  engine: EngineStatus
  tool: string
  playhead: number
  tick: number
  notify?: (msg: string) => void
  /** Live color/stroke preview while a Properties field is being edited. */
  colorPreview?: ColorPreview | null
  /**
   * Tool self-switch channel — Adobe's Eyedropper "automatically changes to the
   * Paint Bucket tool" after picking up a fill.
   */
  onToolChange?: (tool: string) => void
}

/**
 * Pointer feedback per tool (Adobe's Tools panel cursors): the Hand tool grabs,
 * the Zoom tool magnifies, drawing tools cross-hair.
 */
const gearBtn: CSSProperties = {
  width: 22,
  height: 20,
  padding: 0,
  borderRadius: 3,
  border: '1px solid #3a3a3a',
  background: '#1e1e1e',
  color: '#ddd',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: '18px',
}

export function stageCursor(tool: string, zoomMode: 'in' | 'out' = 'in'): string {
  switch (tool) {
    case 'hand':
      return 'grab'
    case 'zoom':
      return zoomMode === 'out' ? 'zoom-out' : 'zoom-in'
    case 'rect':
    case 'oval':
    case 'line':
    case 'pen':
    case 'pencil':
    case 'brush':
    case 'eraser':
    case 'lasso':
    case 'text':
      return 'crosshair'
    case 'transform':
      return 'move'
    case 'bucket':
    case 'ink':
    case 'eyedropper':
      return 'crosshair'
    default:
      return 'default'
  }
}

interface SelectGesture {
  startX: number
  startY: number
  dragging: boolean
}

/** Drag-draw gesture shared by the Rectangle (T2B.4) and Oval (T2B.5) tools —
 *  same bounding-box drag, same Shift/Alt modifier math; `shape` picks the
 *  committed geometry (the tool-interface refactor lifts this into per-tool
 *  classes — Blueprint §1.3.2, next increment). */
interface RectGesture {
  startX: number
  startY: number
  dragging: boolean
  lastDocX: number
  lastDocY: number
  shape: 'rect' | 'oval'
}

interface TransformGesture {
  handle: HandleKind
  startDoc: Pt // doc-space pointer at mousedown
  anchor: Pt // doc-space scale anchor (opposite handle or center)
  center: Pt // doc-space rotate center (selection center)
  details: SelDetail[]
}

export function Stage({ engine, tool, playhead, tick, notify, colorPreview, onToolChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const vpRef = useRef(createViewport())
  const toolRef = useRef(tool)
  toolRef.current = tool

  const [redrawVersion, setRedrawVersion] = useState(0)
  const [zoomReadout, setZoomReadout] = useState('100%')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panReadout, setPanReadout] = useState('0,0')

  // live document stage size for the readout (canonical default when detached)
  const liveStatus = statusJson()
  const stageW = liveStatus?.doc_width ?? 1920
  const stageH = liveStatus?.doc_height ?? 1080

  const panDragRef = useRef<{ x: number; y: number } | null>(null)
  const selectGestureRef = useRef<SelectGesture | null>(null)
  const previewRef = useRef<{ x: number; y: number } | null>(null)
  const rectGestureRef = useRef<RectGesture | null>(null)
  const rectPreviewRef = useRef<(DocRect & { shape: 'rect' | 'oval' }) | null>(null)
  const strokeRef = useRef<{ kind: 'line' | 'pencil' | 'brush' | 'eraser' | 'lasso'; pts: InkPt[] } | null>(null)
  const penPtsRef = useRef<InkPt[]>([])
  const subAnchorRef = useRef<{ id: number; index: number } | null>(null)
  const previewStrokeRef = useRef<InkPt[] | null>(null)
  const transformRef = useRef<TransformGesture | null>(null)
  const pendingRef = useRef<Map<number, AbsTransformOut> | null>(null)
  const marqueeRef = useRef<DocRect | null>(null)
  const marqueeStartRef = useRef<Pt | null>(null)
  const rafRef = useRef<number | null>(null)
  // ——— view tools (Adobe: Hand H / Zoom Z, helpx "Use the Stage and Tools
  // panel for Animate") ———
  // `spaceHeld` = the Spacebar override ("To temporarily switch between another
  // tool and the Hand tool, hold down the Spacebar"). `zoomMarquee` is the
  // Zoom tool's drag rectangle ("drag a rectangular selection on the Stage").
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [viewPrefs, setViewPrefs] = useState(loadViewPrefs)
  const [zoomMode, setZoomMode] = useState(loadToolOptions().zoomMode)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; sx: number; sy: number; value: string } | null>(null)
  const spaceHeldRef = useRef(false)
  const zoomMarqueeRef = useRef<DocRect | null>(null)
  const zoomStartRef = useRef<{ doc: Pt; sx: number; sy: number; dragging: boolean } | null>(null)
  /** The tool actually driving the pointer right now (Spacebar wins). */
  const activeTool = () => (spaceHeldRef.current ? 'hand' : toolRef.current)
  /**
   * BUG-TOOL-005 — the Free Transform tool (Q) was registered but the pointer
   * router only understood 'select', so picking it did nothing. In Adobe the
   * Free Transform tool selects objects AND shows the transform handles, i.e.
   * it drives the same pointer paths as the Selection tool.
   */
  const isSelectLike = () => {
    const t = activeTool()
    return t === 'select' || t === 'transform'
  }
  /** Adobe: scale/rotate handles belong to Free Transform, not the black arrow. */
  const showTransformHandles = () => activeTool() === 'transform'

  const scheduleRedraw = () => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setRedrawVersion((v) => v + 1)
      })
    }
  }

  const applyViewport = (vp: Viewport) => {
    vpRef.current = vp
    setZoomLevel(vp.zoom)
    setZoomReadout(`${Math.round(vp.zoom * 100)}%`)
    setPanReadout(`${Math.round(vp.panX)},${Math.round(vp.panY)}`)
    scheduleRedraw()
  }
  const applyViewportRef = useRef(applyViewport)
  applyViewportRef.current = applyViewport

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => subscribeViewPrefs(() => {
    setViewPrefs(loadViewPrefs())
    scheduleRedraw()
  }), [])
  useEffect(() => subscribeToolColors(() => scheduleRedraw()), [])
  useEffect(() => subscribeToolOptions(() => setZoomMode(loadToolOptions().zoomMode)), [])
  useEffect(() => subscribeOnionPrefs(() => scheduleRedraw()), [])
  useEffect(() => subscribeInk(() => scheduleRedraw()), [])

  // Overlay geometry from current status (selection box + handles).
  const overlayFromStatus = () => {
    const status = statusJson()
    const details = status?.selection_details ?? []
    if (details.length === 0) return null
    const geom = selectionGeometry(details)
    const handles = handlePositions(geom)
    const hs = Object.entries(handles).filter(([k]) => k !== 'rotate') as Array<[string, Pt]>
    return {
      box: geom.box,
      handles: hs,
      rotateHandle: handles.rotate,
      center: geom.center,
    }
  }

  // ——— view commands (Part 01 §1.2.3 / Part 29 §29.9) ———
  // Ctrl/Cmd + = zoom in ×2 · Ctrl/Cmd + - zoom out ÷2 · Ctrl/Cmd+1 = 100% ·
  // Ctrl/Cmd+0 = Fit in Window. Zoom/pan change ONLY the view, never the doc.
  // The mapping lives in commands.ts (view.zoom*) — this component only
  // REGISTERS its viewport as the executor and owns this shortcut scope.
  useEffect(() => {
    stageViewController.current = {
      zoomIn: () => {
        const wrap = wrapRef.current
        if (!wrap) return
        applyViewportRef.current(zoomAt(vpRef.current, wrap.clientWidth / 2, wrap.clientHeight / 2, 2))
      },
      zoomOut: () => {
        const wrap = wrapRef.current
        if (!wrap) return
        applyViewportRef.current(zoomAt(vpRef.current, wrap.clientWidth / 2, wrap.clientHeight / 2, 0.5))
      },
      zoom100: () => {
        const wrap = wrapRef.current
        if (!wrap) return
        const status = statusJson()
        const docW = status?.doc_width ?? 1920
        const docH = status?.doc_height ?? 1080
        applyViewportRef.current({ zoom: 1, panX: (wrap.clientWidth - docW) / 2, panY: (wrap.clientHeight - docH) / 2 })
      },
      zoomFit: () => {
        const wrap = wrapRef.current
        if (!wrap) return
        const status = statusJson()
        applyViewportRef.current(fitViewport(status?.doc_width ?? 1920, status?.doc_height ?? 1080, wrap.clientWidth, wrap.clientHeight))
      },
    }
    return () => {
      stageViewController.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useShortcutScope(
    new Set(['view.zoomIn', 'view.zoomOut', 'view.zoom100', 'view.zoomFit']),
    makeCommandContext({ notify: notify ?? (() => {}) }),
  )

  // ——— window-level drag handling ———
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const doc = screenToDoc(vpRef.current, sx, sy)

      if (panDragRef.current) {
        applyViewport(panBy(vpRef.current, e.clientX - panDragRef.current.x, e.clientY - panDragRef.current.y))
        panDragRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      // Zoom-tool marquee
      const zg = zoomStartRef.current
      if (zg) {
        if (!zg.dragging) {
          if (!pastDragThreshold(sx - zg.sx, sy - zg.sy)) return
          zg.dragging = true
        }
        zoomMarqueeRef.current = normalizeRect(zg.doc.x, zg.doc.y, doc.x, doc.y)
        scheduleRedraw()
        return
      }

      if (isSelectLike()) {
        // transform gesture (scale/rotate handles)
        if (transformRef.current) {
          const g = transformRef.current
          if (g.handle === 'rotate') {
            const deg = rotationDelta(g.center, g.startDoc, doc, e.shiftKey)
            pendingRef.current = new Map(rotateSelection(g.details, g.center, deg).map((t) => [t.id, t]))
          } else {
            const hs = handlePositions(selectionGeometry(g.details))
            const startHandle = hs[g.handle]
            const f = scaleFactors(g.handle, startHandle, g.anchor, doc, e.shiftKey)
            pendingRef.current = new Map(scaleSelection(g.details, g.anchor, f.sx, f.sy).map((t) => [t.id, t]))
          }
          scheduleRedraw()
          return
        }

        // marquee
        if (marqueeStartRef.current) {
          const m = normalizeRect(marqueeStartRef.current.x, marqueeStartRef.current.y, doc.x, doc.y)
          if (m.w >= 1 || m.h >= 1) marqueeRef.current = m
          scheduleRedraw()
          return
        }

        // select drag (move)
        const g = selectGestureRef.current
        if (g) {
          if (!g.dragging) {
            if (!pastDragThreshold(sx - g.startX, sy - g.startY)) return
            g.dragging = true
          }
          previewRef.current = screenDeltaToDoc(sx - g.startX, sy - g.startY, vpRef.current.zoom)
          scheduleRedraw()
          return
        }
      }

      if (subAnchorRef.current) {
        setInkPoint(subAnchorRef.current.id, subAnchorRef.current.index, doc)
        scheduleRedraw()
        return
      }

      const sg = strokeRef.current
      if (sg) {
        if (sg.kind === 'line') {
          let end = { ...doc }
          if (e.shiftKey) {
            const a = sg.pts[0]
            const dx = Math.abs(doc.x - a.x)
            const dy = Math.abs(doc.y - a.y)
            if (dx > dy) end = { x: doc.x, y: a.y }
            else end = { x: a.x, y: doc.y }
          }
          sg.pts = [sg.pts[0], end]
        } else {
          const last = sg.pts[sg.pts.length - 1]
          if (!last || Math.hypot(doc.x - last.x, doc.y - last.y) >= 1.2) sg.pts.push(doc)
        }
        previewStrokeRef.current = sg.pts.slice()
        scheduleRedraw()
        return
      }

      // shape-tool draw (Rectangle T2B.4 / Oval T2B.5 — shared drag gesture)
      const rg = rectGestureRef.current
      if (rg && (activeTool() === 'rect' || activeTool() === 'oval')) {
        if (!rg.dragging) {
          if (!pastDragThreshold(sx - rg.startX, sy - rg.startY)) return
          rg.dragging = true
        }
        rg.lastDocX = doc.x
        rg.lastDocY = doc.y
        const a = screenToDoc(vpRef.current, rg.startX, rg.startY)
        rectPreviewRef.current = {
          ...buildRect(a.x, a.y, doc.x, doc.y, {
            square: e.shiftKey,
            fromCenter: e.altKey,
          }),
          shape: rg.shape,
        }
        scheduleRedraw()
      }
    }

    const up = (e: MouseEvent) => {
      panDragRef.current = null

      // ——— Zoom tool commit (Adobe: click = zoom in, Alt/Option+click = zoom
      // out, drag = the dragged area fills the window) ———
      const zg = zoomStartRef.current
      zoomStartRef.current = null
      const zm = zoomMarqueeRef.current
      zoomMarqueeRef.current = null
      if (zg) {
        const wrap = wrapRef.current
        if (wrap) {
          if (zg.dragging && zm && zm.w > 0 && zm.h > 0) {
            applyViewport(zoomToRect(vpRef.current, zm, wrap.clientWidth, wrap.clientHeight))
          } else {
            // Adobe: the Enlarge / Reduce modifier decides the direction, and
            // Alt-click inverts whatever the modifier says.
            const reduce = loadToolOptions().zoomMode === 'out'
            const out = e.altKey ? !reduce : reduce
            applyViewport(zoomAt(vpRef.current, zg.sx, zg.sy, out ? 0.5 : 2))
          }
        }
        scheduleRedraw()
        return
      }

      // commit transform (one command)
      const tg = transformRef.current
      transformRef.current = null
      const pending = pendingRef.current
      pendingRef.current = null
      if (tg && pending && pending.size > 0) {
        transformSelection([...pending.values()].map((t) => ({ ...t })))
      }

      // commit marquee selection (or clear on a plain empty click)
      const ms = marqueeStartRef.current
      marqueeStartRef.current = null
      const mq = marqueeRef.current
      marqueeRef.current = null
      if (ms) {
        if (mq) {
          selectInRect(mq.x, mq.y, mq.x + mq.w, mq.y + mq.h)
          const contact = loadToolOptions().contactSensitive
          let inkIds = inkInRect(mq.x, mq.y, mq.w, mq.h)
          if (!contact) {
            const st = statusJson()
            const extras = (st?.selection_rects ?? []).filter((r) => !rectFullyInside(r, mq))
            for (const r of extras) selectToggleAt(r.x + r.w / 2, r.y + r.h / 2)
            inkIds = inkIds.filter((id) => {
              const it = listInk().find((x) => x.id === id)
              return it ? rectFullyInside(inkBounds(it), mq) : false
            })
          }
          selectInk(inkIds)
        } else {
          // click (no drag) on empty stage → clear selection (Phase-1 03.3.1)
          selectInRect(ms.x, ms.y, ms.x, ms.y)
          clearInkSelection()
        }
      }

      // commit select drag (move)
      const g = selectGestureRef.current
      selectGestureRef.current = null
      const p = previewRef.current
      previewRef.current = null
      if (g?.dragging && p && !(p.x === 0 && p.y === 0)) {
        const st = statusJson()
        const opts = loadToolOptions()
        const selectedBoxes = (st?.selection_rects ?? []).map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }))
        const selIds = new Set(st?.selection ?? [])
        const others = (evaluate(st?.playhead ?? 1) ?? [])
          .filter((it) => !selIds.has(it.id))
          .map((it) => ({ x: it.x, y: it.y, w: it.w, h: it.h }))
        const snapped = snapMoveDelta(p.x, p.y, selectedBoxes, others, st?.doc_width ?? 1920, st?.doc_height ?? 1080, opts)
        moveSelection(snapped.x, snapped.y)
        moveInk(selectedInkIds(), snapped.x, snapped.y)
      }

      subAnchorRef.current = null

      const sg = strokeRef.current
      strokeRef.current = null
      previewStrokeRef.current = null
      if (sg && sg.pts.length >= 2) {
        const colors = loadToolColors()
        if (sg.kind === 'eraser') {
          const hitIds = new Set<number>()
          for (const pt of sg.pts) {
            const h = hitInk(pt.x, pt.y)
            if (h) hitIds.add(h.id)
          }
          if (hitIds.size) deleteInkIds([...hitIds])
          const last = sg.pts[sg.pts.length - 1]
          if (selectAt(last.x, last.y)) deleteSelection()
          notify?.('erased')
        } else if (sg.kind === 'lasso') {
          const ids = inkInPolygon(sg.pts)
          selectInk(ids)
          const xs = sg.pts.map((p) => p.x)
          const ys = sg.pts.map((p) => p.y)
          selectInRect(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))
        } else {
          const pts = sg.kind === 'line' ? sg.pts : simplifyPolyline(sg.pts, sg.kind === 'brush' ? 2.4 : 1.4)
          const size = loadToolOptions().inkSize
          addInk({
            kind: sg.kind,
            points: pts,
            closed: false,
            fill: null,
            stroke: colors.stroke ?? '#111111',
            strokeWidth: sg.kind === 'brush' ? Math.max(8, size) : Math.max(1, sg.kind === 'pencil' ? size : colors.strokeWidth),
          })
        }
      }

      // commit shape draw — rebuild from last pointer + modifiers at release
      // so Shift/Alt held through mouseup still apply (T2B.4, T2B.5 §6).
      const rg = rectGestureRef.current
      rectGestureRef.current = null
      rectPreviewRef.current = null
      if (rg?.dragging) {
        const a = screenToDoc(vpRef.current, rg.startX, rg.startY)
        const rp = buildRect(a.x, a.y, rg.lastDocX, rg.lastDocY, {
          square: e.shiftKey,
          fromCenter: e.altKey,
        })
        if (isValidRect(rp)) {
          // Part 02b preamble: drawing tools honor the current stroke AND
          // fill style. BUG-TOOL-007: no more hard-coded blue — the Colors
          // section decides what new objects look like.
          const colors = loadToolColors()
          const id = drawShape(rg.shape, rp.x, rp.y, rp.w, rp.h, colors.fill ?? '#ffffff', colors.stroke, colors.strokeWidth)
          if (id === 0 && engine.kind === 'ok' && notify) {
            notify(
              rg.shape === 'oval' && !hasShapeDrawFacade()
                ? 'Oval tool: engine build too old — rebuild with `npm run wasm`'
                : 'draw blocked: active layer is locked, hidden, or a folder',
            )
          }
        }
      }
      scheduleRedraw()
    }

    const cancel = () => {
      panDragRef.current = null
      zoomStartRef.current = null
      zoomMarqueeRef.current = null
      selectGestureRef.current = null
      previewRef.current = null
      rectGestureRef.current = null
      rectPreviewRef.current = null
      transformRef.current = null
      pendingRef.current = null
      marqueeStartRef.current = null
      marqueeRef.current = null
      strokeRef.current = null
      previewStrokeRef.current = null
      subAnchorRef.current = null
      scheduleRedraw()
    }

    // Blueprint T2B.4: Esc discards an in-progress rect (no command, no undo).
    // Capture so we win over edit.exitOneLevel when a draw is live.
    const onKey = (ev: KeyboardEvent) => {
      const typing = (() => {
        const el = ev.target as HTMLElement | null
        if (!el || !el.tagName) return false
        const tag = el.tagName.toLowerCase()
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true
      })()
      if (!typing && isSelectLike() && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
        ev.preventDefault()
        const step = ev.shiftKey ? 10 : 1
        let dx = 0
        let dy = 0
        if (ev.key === 'ArrowLeft') dx = -step
        if (ev.key === 'ArrowRight') dx = step
        if (ev.key === 'ArrowUp') dy = -step
        if (ev.key === 'ArrowDown') dy = step
        const st = statusJson()
        const opts = loadToolOptions()
        const selectedBoxes = (st?.selection_rects ?? []).map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }))
        const selIds = new Set(st?.selection ?? [])
        const others = (evaluate(st?.playhead ?? 1) ?? [])
          .filter((it) => !selIds.has(it.id))
          .map((it) => ({ x: it.x, y: it.y, w: it.w, h: it.h }))
        const snapped = snapMoveDelta(dx, dy, selectedBoxes, others, st?.doc_width ?? 1920, st?.doc_height ?? 1080, opts)
        if (selIds.size) moveSelection(snapped.x, snapped.y)
        if (selectedInkIds().length) moveInk(selectedInkIds(), snapped.x, snapped.y)
        scheduleRedraw()
        return
      }
      if (ev.key === 'Enter' && penPtsRef.current.length >= 2) {
        ev.preventDefault()
        ev.stopPropagation()
        const colors = loadToolColors()
        addInk({
          kind: 'pen',
          points: penPtsRef.current.slice(),
          closed: ev.shiftKey,
          fill: ev.shiftKey ? colors.fill : null,
          stroke: colors.stroke ?? '#111111',
          strokeWidth: Math.max(1, colors.strokeWidth),
        })
        penPtsRef.current = []
        previewStrokeRef.current = null
        scheduleRedraw()
        return
      }
      if (ev.key !== 'Escape') return
      if (!rectGestureRef.current && !zoomStartRef.current && !strokeRef.current && penPtsRef.current.length === 0) return
      ev.preventDefault()
      ev.stopPropagation()
      rectGestureRef.current = null
      rectPreviewRef.current = null
      zoomStartRef.current = null
      zoomMarqueeRef.current = null
      strokeRef.current = null
      previewStrokeRef.current = null
      penPtsRef.current = []
      scheduleRedraw()
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('keydown', onKey, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ——— Spacebar = temporary Hand tool (Adobe: "To temporarily switch between
  // another tool and the Hand tool, hold down the Spacebar") ———
  // Ignored while typing in a field, and released on blur so the override can
  // never get stuck.
  useEffect(() => {
    const typing = (t: EventTarget | null): boolean => {
      const el = t as HTMLElement | null
      if (!el || !el.tagName) return false
      const tag = el.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true
    }
    const setHeld = (v: boolean) => {
      if (spaceHeldRef.current === v) return
      spaceHeldRef.current = v
      setSpaceHeld(v)
    }
    const down = (ev: KeyboardEvent) => {
      if (ev.code !== 'Space' && ev.key !== ' ') return
      if (typing(ev.target)) return
      if (ev.repeat) return
      ev.preventDefault() // no page scroll, no button re-trigger
      setHeld(true)
    }
    const up = (ev: KeyboardEvent) => {
      if (ev.code !== 'Space' && ev.key !== ' ') return
      setHeld(false)
      panDragRef.current = null
    }
    const release = () => {
      setHeld(false)
      panDragRef.current = null
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
    }
  }, [])

  // ——— render loop ———
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const status = statusJson()
    if (!status) return

    const viewW = wrap.clientWidth
    const viewH = wrap.clientHeight
    const dpr = window.devicePixelRatio || 1
    const bw = Math.max(1, Math.round(viewW * dpr))
    const bh = Math.max(1, Math.round(viewH * dpr))
    if (canvas.width !== bw) canvas.width = bw
    if (canvas.height !== bh) canvas.height = bh

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const items = engine.kind === 'ok' ? evaluate(playhead) : []
    // apply pending transform preview to items
    const pending = pendingRef.current
    const displayItems: RectItemJson[] = pending
      ? items.map((it) => {
          const t = pending.get(it.id)
          if (!t) return it
          const base = status.selection_details?.find((d) => d.id === it.id)
          const w = (base?.base_w ?? it.w) * t.scale_x
          const h = (base?.base_h ?? it.h) * t.scale_y
          return { ...it, x: t.x, y: t.y, w, h, rotation: t.rotation }
        })
      : items

    const overlay = pending ? null : overlayFromStatus()
    const view = loadViewPrefs()
    const onion = loadOnionPrefs()

    const state: RenderState = {
      background: status.background ?? '#ffffff',
      backgroundAlpha: status.background_alpha ?? 1,
      stageW: status.doc_width ?? 1920,
      stageH: status.doc_height ?? 1080,
      items: displayItems,
      selectedIds: status.selection ?? [],
      overlay,
      marquee: marqueeRef.current ?? zoomMarqueeRef.current,
      previewDelta: previewRef.current,
      previewRect: rectPreviewRef.current,
      inkItems: listInk(),
      inkSelected: selectedInkIds(),
      previewStroke: previewStrokeRef.current ?? (penPtsRef.current.length ? penPtsRef.current : null),
      previewStrokeWidth: loadToolColors().strokeWidth,
      previewStrokeColor: loadToolColors().stroke,
      colorPreview,
      workArea: view.workArea,
      hideEdges: view.hideEdges,
      grid: view.grid,
      gridSize: view.gridSize,
      rulers: view.rulers,
      preview: view.preview,
      onionGhosts: onion.on && engine.kind === 'ok' ? collectGhosts(evaluate, onion, playhead, status.duration ?? 1) : undefined,
    }
    render(ctx, vpRef.current, state, viewW, viewH)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.kind, playhead, tick, redrawVersion, colorPreview])

  // initial fit + refit on resize
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      const status = statusJson()
      if (!wrap || !status) return
      applyViewport(fitViewport(status.doc_width ?? 1920, status.doc_height ?? 1080, wrap.clientWidth, wrap.clientHeight))
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.kind])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? ZOOM_STEP_FINE : 1 / ZOOM_STEP_FINE
    applyViewport(zoomAt(vpRef.current, e.clientX - rect.left, e.clientY - rect.top, factor))
  }

  const zoomAroundCenter = (next: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    applyViewport(setZoomAt(vpRef.current, wrap.clientWidth / 2, wrap.clientHeight / 2, next))
  }

  const nudgeZoom = (dir: 1 | -1) => {
    zoomAroundCenter(vpRef.current.zoom * (dir > 0 ? ZOOM_STEP_FINE : 1 / ZOOM_STEP_FINE))
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (e.button === 1) {
      e.preventDefault()
      panDragRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    // ——— Hand tool (H) / Spacebar override: drag the Stage to move the view ———
    if (e.button === 0 && activeTool() === 'hand') {
      e.preventDefault()
      panDragRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    // ——— Paint tools: Paint Bucket (K) / Ink Bottle (S) / Eyedropper (I) ———
    // Adobe: the Paint Bucket "fills enclosed areas with color" using the Fill
    // Color; the Ink Bottle changes "stroke color, width, and style"; the
    // Eyedropper copies a clicked object's attributes and then "automatically
    // changes to the Paint Bucket tool" (fill) / "Ink Bottle tool" (stroke).
    if (e.button === 0 && (activeTool() === 'bucket' || activeTool() === 'ink' || activeTool() === 'eyedropper')) {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const inkHit = hitInk(doc.x, doc.y)
      if (inkHit) {
        const colors = loadToolColors()
        if (activeTool() === 'bucket') {
          if (colors.fill) {
            updateInk(inkHit.id, { fill: colors.fill })
            notify?.(`filled with ${colors.fill}`)
          } else notify?.('paint bucket: fill color is None')
        } else if (activeTool() === 'ink') {
          updateInk(inkHit.id, colors.stroke === null ? { stroke: null } : { stroke: colors.stroke, strokeWidth: colors.strokeWidth })
          notify?.(colors.stroke ? `stroke ${colors.stroke}` : 'stroke removed')
        } else {
          setToolColors({
            fill: inkHit.fill,
            stroke: inkHit.stroke,
            strokeWidth: inkHit.strokeWidth || loadToolColors().strokeWidth,
          })
          onToolChange?.('bucket')
          notify?.(`picked up ${inkHit.fill || inkHit.stroke || 'none'} → Paint Bucket`)
        }
        scheduleRedraw()
        return
      }
      const hit = selectAt(doc.x, doc.y)
      const target = statusJson()?.selection ?? []
      if (!hit || target.length === 0) {
        notify?.(`${activeTool()}: nothing under the pointer`)
        scheduleRedraw()
        return
      }
      const colors = loadToolColors()
      const id = target[0]
      if (activeTool() === 'bucket') {
        if (colors.fill === null) {
          notify?.('paint bucket: fill color is None')
        } else {
          setNodeProps([{ id, fill: colors.fill }])
          notify?.(`filled with ${colors.fill}`)
        }
      } else if (activeTool() === 'ink') {
        if (colors.stroke === null) {
          setNodeProps([{ id, stroke_enabled: false }])
          notify?.('stroke removed')
        } else {
          setNodeProps([{ id, stroke_enabled: true, stroke: colors.stroke, stroke_width: colors.strokeWidth }])
          notify?.(`stroke ${colors.stroke} · ${colors.strokeWidth}px`)
        }
      } else {
        // Eyedropper: copy the clicked object's paint attributes…
        const d = statusJson()?.selection_details?.find((x) => x.id === id)
        if (d) {
          setToolColors({
            fill: d.fill && d.fill.length > 0 ? d.fill : null,
            stroke: d.stroke ?? null,
            strokeWidth: d.stroke_width > 0 ? d.stroke_width : loadToolColors().strokeWidth,
          })
          // …then switch tools exactly like Animate does.
          onToolChange?.('bucket')
          notify?.(`picked up ${d.fill || 'no fill'} → Paint Bucket`)
        }
      }
      scheduleRedraw()
      return
    }

    // ——— Zoom tool (Z): click = in, Alt+click = out, drag = zoom to area ———
    if (e.button === 0 && activeTool() === 'zoom') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      zoomStartRef.current = { doc, sx, sy, dragging: false }
      zoomMarqueeRef.current = null
      return
    }

    if (e.button === 0 && (activeTool() === 'line' || activeTool() === 'pencil' || activeTool() === 'brush' || activeTool() === 'eraser' || activeTool() === 'lasso')) {
      const doc = screenToDoc(vpRef.current, sx, sy)
      strokeRef.current = { kind: activeTool() as 'line' | 'pencil' | 'brush' | 'eraser' | 'lasso', pts: [doc] }
      previewStrokeRef.current = [doc]
      return
    }

    if (e.button === 0 && activeTool() === 'text') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      setTextDraft({ x: doc.x, y: doc.y, sx, sy, value: 'Text' })
      scheduleRedraw()
      return
    }

    if (e.button === 0 && activeTool() === 'pen') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const pts = penPtsRef.current
      if (pts.length >= 3 && Math.hypot(doc.x - pts[0].x, doc.y - pts[0].y) < 10) {
        const colors = loadToolColors()
        addInk({
          kind: 'pen',
          points: pts.slice(),
          closed: true,
          fill: colors.fill,
          stroke: colors.stroke ?? '#111111',
          strokeWidth: Math.max(1, colors.strokeWidth),
        })
        penPtsRef.current = []
        previewStrokeRef.current = null
        scheduleRedraw()
        return
      }
      pts.push(doc)
      previewStrokeRef.current = pts.slice()
      scheduleRedraw()
      return
    }

    if (e.button === 0 && activeTool() === 'subselect') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const anchor = hitInkAnchor(doc.x, doc.y, 8 / vpRef.current.zoom)
      if (anchor) {
        subAnchorRef.current = anchor
        return
      }
      const hit = hitInk(doc.x, doc.y)
      if (hit) {
        selectInk([hit.id])
        clearSelection()
      } else {
        clearInkSelection()
      }
      scheduleRedraw()
      return
    }

    if (e.button === 0 && isSelectLike()) {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const inkHit = hitInk(doc.x, doc.y)
      if (inkHit) {
        if (e.shiftKey || e.ctrlKey || e.metaKey) selectInk([inkHit.id], true)
        else {
          selectInk([inkHit.id])
          clearSelection()
        }
        selectGestureRef.current = { startX: sx, startY: sy, dragging: false }
        previewRef.current = null
        scheduleRedraw()
        return
      }
      clearInkSelection()

      // 1) handle hit-test → arm transform gesture (Free Transform only)
      const status = statusJson()
      const details = status?.selection_details ?? []
      if (showTransformHandles() && details.length > 0) {
        const geom = selectionGeometry(details)
        const handles = handlePositions(geom)
        const screenHandles = {} as Record<HandleKind, Pt>
        for (const [k, p] of Object.entries(handles) as [HandleKind, Pt][]) {
          screenHandles[k] = docToScreen(vpRef.current, p.x, p.y)
        }
        const hit = pickHandle(screenHandles, sx, sy, HANDLE_HIT_RADIUS)
        if (hit) {
          const anchor = hit === 'rotate' ? geom.center : e.altKey ? geom.center : oppositeHandle(geom, hit)
          transformRef.current = { handle: hit, startDoc: doc, anchor, center: geom.center, details }
          pendingRef.current = null
          return
        }
      }

      // 2) Shift / Ctrl / Cmd → add or remove (Adobe additive select)
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        selectToggleAt(doc.x, doc.y)
        scheduleRedraw()
        return
      }

      // 3) plain click: select (or arm marquee on empty)
      const hit = selectAt(doc.x, doc.y)
      if (hit) {
        selectGestureRef.current = { startX: sx, startY: sy, dragging: false }
        previewRef.current = null
      } else {
        marqueeStartRef.current = doc
        marqueeRef.current = null
      }
      scheduleRedraw()
      return
    }

    if (e.button === 0 && (activeTool() === 'rect' || activeTool() === 'oval')) {
      const startDoc = screenToDoc(vpRef.current, sx, sy)
      rectGestureRef.current = {
        startX: sx,
        startY: sy,
        dragging: false,
        lastDocX: startDoc.x,
        lastDocY: startDoc.y,
        shape: activeTool() === 'oval' ? 'oval' : 'rect',
      }
      rectPreviewRef.current = null
      scheduleRedraw()
    }
  }

  const onDoubleClick = () => {
    const wrap = wrapRef.current
    const status = statusJson()
    if (!wrap || !status) return
    applyViewport(fitViewport(status.doc_width ?? 1920, status.doc_height ?? 1080, wrap.clientWidth, wrap.clientHeight))
  }

  // Library drag-drop (Part 12 §12.2.11 place · §12.2.12 swap): dropping a
  // symbol onto a SELECTED instance swaps it; otherwise places a new instance
  // at the drop point.
  const onDrop = (e: React.DragEvent) => {
    const symbolId = Number(e.dataTransfer.getData('kineora/symbol'))
    if (!symbolId) return
    e.preventDefault()
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const doc = screenToDoc(vpRef.current, e.clientX - rect.left, e.clientY - rect.top)
    const st = statusJson()
    const sel = st?.selection ?? []
    if (sel.length === 1) {
      // swap when the single selected object is an instance
      const detail = st?.selection_details?.find((d) => d.id === sel[0])
      if (detail?.kind === 'instance') {
        const ok = swapInstance(sel[0], symbolId)
        notify?.(ok ? `symbol swapped` : 'swap: blocked')
        scheduleRedraw()
        return
      }
    }
    const id = placeSymbol(symbolId, doc.x, doc.y)
    notify?.(id !== 0 ? 'symbol placed' : 'place symbol: blocked (locked/hidden layer)')
    scheduleRedraw()
  }

  return (
    <div ref={wrapRef} data-testid="stage-wrap" style={{ flex: 1, position: 'relative', background: '#111', minWidth: 0, overflow: 'hidden' }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <canvas
        ref={canvasRef}
        data-testid="stage-canvas"
        data-tool={spaceHeld ? 'hand' : tool}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: stageCursor(spaceHeld ? 'hand' : tool, zoomMode) }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      />
      {engine.kind === 'error' && (
        <div data-testid="stage-notice" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ color: '#b33', textAlign: 'center', maxWidth: 420, fontSize: 14, background: '#1a1a1a', padding: 14, borderRadius: 6 }}>
            <strong>Core not attached</strong>
            <p style={{ marginTop: 8, color: '#666' }}>{engine.detail}</p>
            {/* The engine is a Rust→WASM bundle that is BUILT per machine and is
                not committed (`animator/ui/public/wasm/` is git-ignored). Saying
                only "not attached" left people staring at a blank stage, so the
                exact command to fix it is shown here. */}
            <p data-testid="stage-notice-fix" style={{ marginTop: 10, color: '#bbb', fontSize: 12, lineHeight: 1.5 }}>
              The engine bundle is missing. Build it once, then reload:
              <br />
              <code style={{ display: 'inline-block', marginTop: 6, background: '#111', border: '1px solid #333', borderRadius: 4, padding: '3px 7px', color: '#8ec8ff' }}>
                cd animator/ui &amp;&amp; npm run wasm
              </code>
              <br />
              <span style={{ color: '#777' }}>(needs Rust + wasm-pack · the Tools panel, menus and panels work meanwhile)</span>
            </p>
          </div>
        </div>
      )}
      {textDraft && (
        <input
          data-testid="stage-text-input"
          autoFocus
          value={textDraft.value}
          onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
          onBlur={() => {
            const d = textDraft
            setTextDraft(null)
            if (d && d.value.trim()) {
              const colors = loadToolColors()
              addInk({
                kind: 'text',
                points: [{ x: d.x, y: d.y }],
                closed: false,
                fill: contrastOn(colors.fill, statusJson()?.background ?? '#ffffff'),
                stroke: null,
                strokeWidth: 0,
                text: d.value.trim(),
                fontSize: loadToolOptions().fontSize,
              })
            }
            scheduleRedraw()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setTextDraft(null)
          }}
          style={{
            position: 'absolute',
            left: textDraft.sx,
            top: textDraft.sy - 18,
            zIndex: 20,
            minWidth: 80,
            background: '#111',
            color: '#eee',
            border: '1px solid #0a7cff',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 14,
          }}
        />
      )}
      {viewPrefs.zoomGear ? (
      <div
        data-testid="stage-zoom-gear"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation()
          e.preventDefault()
          nudgeZoom(e.deltaY < 0 ? 1 : -1)
        }}
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#b0b0b0',
          fontSize: 11,
          pointerEvents: 'auto',
          background: 'rgba(16,16,16,0.88)',
          border: '1px solid #333',
          borderRadius: 6,
          padding: '4px 8px',
          fontVariantNumeric: 'tabular-nums',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          zIndex: 8,
        }}
      >
        <span data-testid="tool-readout" style={{ color: '#777', pointerEvents: 'none' }}>{spaceHeld ? 'hand (space)' : tool}</span>
        <span style={{ color: '#444' }}>|</span>
        <button type="button" data-testid="stage-zoom-out" title="Zoom out 10%" aria-label="Zoom out" onClick={() => nudgeZoom(-1)} style={gearBtn}>
          −
        </button>
        <input
          data-testid="stage-zoom-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={zoomToSlider(zoomLevel)}
          title="Drag to zoom — one notch at a time"
          aria-label="Stage zoom"
          onChange={(e) => zoomAroundCenter(sliderToZoom(Number(e.target.value)))}
          style={{ width: 92, accentColor: '#0a7cff', cursor: 'pointer' }}
        />
        <button type="button" data-testid="stage-zoom-in" title="Zoom in 10%" aria-label="Zoom in" onClick={() => nudgeZoom(1)} style={gearBtn}>
          +
        </button>
        <button
          type="button"
          data-testid="zoom-readout"
          title="Reset to 100%"
          onClick={() => stageViewController.current?.zoom100()}
          style={{ ...gearBtn, minWidth: 44, fontSize: 11, fontWeight: 600, color: '#eee' }}
        >
          {zoomReadout}
        </button>
        <button type="button" data-testid="stage-zoom-fit" title="Fit stage" onClick={() => stageViewController.current?.zoomFit()} style={{ ...gearBtn, fontSize: 10 }}>
          Fit
        </button>
        <button
          type="button"
          data-testid="stage-zoom-hide"
          title="Hide zoom controls (View ▸ Show Zoom Controls to restore)"
          aria-label="Hide zoom controls"
          onClick={() => patchViewPrefs({ zoomGear: false })}
          style={gearBtn}
        >
          ×
        </button>
        <span style={{ color: '#444' }}>|</span>
        <span data-testid="pan-readout" style={{ color: '#666', pointerEvents: 'none' }}>{panReadout}</span>
        <span data-testid="stage-readout" style={{ color: '#666', pointerEvents: 'none' }}>{stageW}×{stageH}</span>
      </div>
      ) : (
      <div
        data-testid="stage-zoom-gear-collapsed"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#888',
          fontSize: 11,
          pointerEvents: 'auto',
          background: 'rgba(16,16,16,0.72)',
          border: '1px solid #2a2a2a',
          borderRadius: 6,
          padding: '3px 7px',
          zIndex: 8,
        }}
      >
        <span data-testid="tool-readout" style={{ color: '#777' }}>{spaceHeld ? 'hand (space)' : tool}</span>
        <button type="button" data-testid="zoom-readout" title="Show zoom controls" onClick={() => patchViewPrefs({ zoomGear: true })} style={{ ...gearBtn, minWidth: 40, fontSize: 11 }}>
          {zoomReadout}
        </button>
        <span data-testid="pan-readout" style={{ display: 'none' }}>{panReadout}</span>
        <span data-testid="stage-readout" style={{ color: '#666' }}>{stageW}×{stageH}</span>
      </div>
      )}
    </div>
  )
}
