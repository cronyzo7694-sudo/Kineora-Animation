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
  addAnchorOnSegment,
  anchorsInRect,
  clearInkSelection,
  closestInkSegment,
  convertAnchors,
  deleteInkIds,
  deleteSelectedAnchors,
  endInkEdit,
  mapInkPt,
  writeInkPoints,
  pointInPoly,
  hitInk,
  hitInkAnchor,
  hitInkHandle,
  inkBounds,
  inkInPolygon,
  inkInRect,
  listInk,
  moveAnchors,
  moveInk,
  selectAnchors,
  selectInk,
  selectedAnchors,
  selectedInkIds,
  setAnchorHandle,
  updateInk,
  simplifyPolyline,
  subscribeInk,
  type InkPt,
} from '../editor/inkStore'
import { render, subscribeFillImages, type ColorPreview, type RenderState, HANDLE_HIT_RADIUS } from '../render/canvasRenderer'
import { loadViewPrefs, patchViewPrefs, subscribeViewPrefs } from '../viewPrefs'
import { loadToolColors, setToolColors, subscribeToolColors } from '../toolColors'
import { contrastOn, tooClose } from '../contrast'
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
  pointInRects,
  rotationDelta,
  scaleFactors,
  scaleSelection,
  rotateSelection,
  selectionGeometry,
  translatePt,
  translatePts,
  type AbsTransformOut,
  type HandleKind,
  type Pt,
  type SelDetail,
} from '../editor/transformMath'
import type { RectItemJson } from '../engine/wasmTypes'
import { anyLocked, serializeObjExtras, subscribeObjProps } from '../editor/objectProps'
import { isEngineShape, shapeInBox } from '../editor/shapeLibrary'
import { dashForStyle, processPencil } from '../editor/pencil'
import {
  appendPenPoint,
  clearPenDraft,
  constrain45,
  isPenCloseHover,
  isPenDragging,
  penPoints,
  penPreviewPoints,
  registerPenFinisher,
  setPenCloseHover,
  setPenCursor,
  setPenDragging,
  screenNear,
  subscribePenDraft,
  updateLastPenPoint,
} from '../editor/penDraft'

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
    case 'subselect':
      return 'default'
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
  startDoc: Pt
  startHandle: Pt
  anchor: Pt
  center: Pt
  details: SelDetail[]
  inkStart: Array<{ id: number; points: InkPt[] }>
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
  const subAnchorRef = useRef<{
    kind: 'point' | 'handle' | 'pull'
    id: number
    index: number
    which?: 'in' | 'out'
    last: InkPt
    mirror: boolean
  } | null>(null)
  const subMarqueeRef = useRef<Pt | null>(null)
  const previewStrokeRef = useRef<InkPt[] | null>(null)
  const transformRef = useRef<TransformGesture | null>(null)
  const pendingRef = useRef<Map<number, AbsTransformOut> | null>(null)
  const marqueeRef = useRef<DocRect | null>(null)
  const marqueeStartRef = useRef<Pt | null>(null)
  const rafRef = useRef<number | null>(null)
  const commitPenRef = useRef<(close: boolean) => boolean>(() => false)
  const penDownRef = useRef<{ sx: number; sy: number } | null>(null)
  // ——— view tools (Adobe: Hand H / Zoom Z, helpx "Use the Stage and Tools
  // panel for Animate") ———
  // `spaceHeld` = the Spacebar override ("To temporarily switch between another
  // tool and the Hand tool, hold down the Spacebar"). `zoomMarquee` is the
  // Zoom tool's drag rectangle ("drag a rectangular selection on the Stage").
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [viewPrefs, setViewPrefs] = useState(loadViewPrefs)
  const [zoomMode, setZoomMode] = useState(loadToolOptions().zoomMode)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; sx: number; sy: number; value: string; editId?: number } | null>(null)
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
  /** Selection + Free Transform: 8 scale squares + a rotate knob on the box. */
  const showTransformHandles = () => {
    const t = activeTool()
    return t === 'select' || t === 'transform'
  }

  const scheduleRedraw = () => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setRedrawVersion((v) => v + 1)
      })
    }
  }

  const commitPen = (close: boolean): boolean => {
    const pts = penPoints()
    if (pts.length < 2) return false
    const colors = loadToolColors()
    addInk({
      kind: 'pen',
      points: pts.map((p) => ({ ...p })),
      closed: close,
      fill: close ? colors.fill : null,
      stroke: colors.stroke ?? '#111111',
      strokeWidth: Math.max(1, colors.strokeWidth),
    })
    clearPenDraft()
    penDownRef.current = null
    setPenDragging(false)
    previewStrokeRef.current = null
    notify?.(close ? 'path closed' : 'path finished')
    scheduleRedraw()
    return true
  }
  commitPenRef.current = commitPen

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
  useEffect(() => subscribeObjProps(() => scheduleRedraw()), [])
  useEffect(() => subscribeFillImages(() => scheduleRedraw()), [])
  useEffect(() => subscribePenDraft(() => scheduleRedraw()), [])
  useEffect(() => {
    registerPenFinisher((close) => commitPenRef.current(close))
    return () => registerPenFinisher(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Overlay geometry from current status (selection box + handles).
  const overlayFromStatus = () => {
    const status = statusJson()
    const details = status?.selection_details ?? []
    const inkSel = listInk().filter((it) => selectedInkIds().includes(it.id))
    if (details.length === 0 && inkSel.length === 0) return null
    const geom = details.length > 0 ? selectionGeometry(details) : { box: [] as Pt[], center: { x: 0, y: 0 }, aabb: { x: 0, y: 0, w: 0, h: 0 } }
    let box = geom.box
    let center = geom.center
    if (inkSel.length > 0) {
      const pts = [...box]
      for (const it of inkSel) {
        const b = inkBounds(it)
        pts.push({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h })
      }
      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const x0 = Math.min(...xs)
      const y0 = Math.min(...ys)
      const x1 = Math.max(...xs)
      const y1 = Math.max(...ys)
      box = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ]
      center = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
    }
    const dlt = previewRef.current
    const dx = dlt?.x ?? 0
    const dy = dlt?.y ?? 0
    const handles = handlePositions({ box, center, aabb: geom.aabb })
    const textOnly = details.length === 0 && inkSel.length > 0 && inkSel.every((it) => it.kind === 'text')
    const skipHandles = textOnly && toolRef.current === 'select'
    const hs = skipHandles
      ? []
      : (Object.entries(handles).filter(([k]) => k !== 'rotate') as Array<[string, Pt]>).map(
          ([k, p]) => [k, translatePt(p, dx, dy)] as [string, Pt],
        )
    return {
      box: translatePts(box, dx, dy),
      handles: hs,
      rotateHandle: skipHandles ? translatePt(center, dx, dy) : translatePt(handles.rotate, dx, dy),
      center: translatePt(center, dx, dy),
    }
  }

  /** Live overlay while a scale/rotate handle is being dragged. */
  const overlayFromPending = (details: SelDetail[], pending: Map<number, AbsTransformOut> | null) => {
    if (!pending || pending.size === 0 || details.length === 0) return null
    const live: SelDetail[] = details.map((d) => {
      const t = pending.get(d.id)
      if (!t) return d
      return {
        ...d,
        x: t.x,
        y: t.y,
        w: d.base_w * t.scale_x,
        h: d.base_h * t.scale_y,
        scale_x: t.scale_x,
        scale_y: t.scale_y,
        rotation: t.rotation,
      }
    })
    const geom = selectionGeometry(live)
    const handles = handlePositions(geom)
    const hs = (Object.entries(handles).filter(([k]) => k !== 'rotate') as Array<[string, Pt]>)
    return { box: geom.box, handles: hs, rotateHandle: handles.rotate, center: geom.center }
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
          let sx = 1
          let sy = 1
          let deg = 0
          if (g.handle === 'rotate') {
            deg = rotationDelta(g.center, g.startDoc, doc, e.shiftKey)
            if (g.details.length) pendingRef.current = new Map(rotateSelection(g.details, g.center, deg).map((t) => [t.id, t]))
          } else {
            const f = scaleFactors(g.handle, g.startHandle, g.anchor, doc, e.shiftKey)
            sx = f.sx
            sy = f.sy
            if (g.details.length) pendingRef.current = new Map(scaleSelection(g.details, g.anchor, sx, sy).map((t) => [t.id, t]))
          }
          for (const snap of g.inkStart) {
            writeInkPoints(
              snap.id,
              snap.points.map((p) => mapInkPt(p, g.handle === 'rotate' ? g.center : g.anchor, sx, sy, deg)),
            )
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
          const raw = screenDeltaToDoc(sx - g.startX, sy - g.startY, vpRef.current.zoom)
          const st = statusJson()
          const opts = loadToolOptions()
          const selectedBoxes = (st?.selection_rects ?? []).map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }))
          const selIds = new Set(st?.selection ?? [])
          const others = (evaluate(st?.playhead ?? 1) ?? [])
            .filter((it) => !selIds.has(it.id))
            .map((it) => ({ x: it.x, y: it.y, w: it.w, h: it.h }))
          previewRef.current = snapMoveDelta(raw.x, raw.y, selectedBoxes, others, st?.doc_width ?? 1920, st?.doc_height ?? 1080, opts)
          scheduleRedraw()
          return
        }
      }

      if (subAnchorRef.current) {
        const g = subAnchorRef.current
        if (g.kind === 'handle' || g.kind === 'pull') {
          const which = g.which ?? 'out'
          setAnchorHandle(g.id, g.index, which, doc.x, doc.y, g.mirror && !e.altKey)
        } else {
          const dx = doc.x - g.last.x
          const dy = doc.y - g.last.y
          const group = selectedAnchors()
          const list = group.some((a) => a.id === g.id && a.index === g.index) ? group : [{ id: g.id, index: g.index }]
          moveAnchors(list, dx, dy)
          g.last = doc
        }
        scheduleRedraw()
        return
      }

      if (subMarqueeRef.current) {
        const m = normalizeRect(subMarqueeRef.current.x, subMarqueeRef.current.y, doc.x, doc.y)
        if (m.w >= 1 || m.h >= 1) marqueeRef.current = m
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

      if (activeTool() === 'pen' && (penPoints().length > 0 || penDownRef.current)) {
        let p = { ...doc }
        const draft = penPoints()
        if (e.shiftKey && draft.length > 0) p = constrain45(draft[draft.length - 1], p)
        const arm = penDownRef.current
        if (arm && !isPenDragging() && pastDragThreshold(sx - arm.sx, sy - arm.sy)) {
          setPenDragging(true)
        }
        if (isPenDragging() && draft.length > 0) {
          const last = draft[draft.length - 1]
          updateLastPenPoint({
            outX: p.x,
            outY: p.y,
            inX: last.x - (p.x - last.x),
            inY: last.y - (p.y - last.y),
          })
        } else {
          setPenCursor(p)
          setPenCloseHover(draft.length >= 2 && screenNear(p, draft[0], vpRef.current.zoom, 12))
        }
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
        const box = buildRect(a.x, a.y, doc.x, doc.y, {
          square: e.shiftKey,
          fromCenter: e.altKey,
        })
        const raw = loadToolOptions().shapePreset
        const preset = !raw || raw === 'rect' ? rg.shape : raw
        if (isEngineShape(preset)) {
          rectPreviewRef.current = { ...box, shape: preset }
          previewStrokeRef.current = null
        } else {
          rectPreviewRef.current = null
          const o = loadToolOptions()
          previewStrokeRef.current = shapeInBox(preset, box, {
            sides: o.polySides,
            inner: o.starInner,
            corner: o.cornerRadius,
          })
        }
        scheduleRedraw()
      }
    }

    const up = (e: MouseEvent) => {
      panDragRef.current = null
      if (isPenDragging()) setPenDragging(false)
      penDownRef.current = null

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
      if (tg) {
        endInkEdit()
        if (pending && pending.size > 0) {
          if (anyLocked([...pending.keys()])) {
            notify?.('locked object — unlock in Properties to transform')
          } else {
            transformSelection([...pending.values()].map((t) => ({ ...t })))
          }
        }
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
        const lockIds = [...(statusJson()?.selection ?? []), ...selectedInkIds()]
        if (anyLocked(lockIds)) {
          notify?.('locked object — unlock in Properties to move')
          scheduleRedraw()
          return
        }
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

      if (subAnchorRef.current) {
        endInkEdit()
        subAnchorRef.current = null
      }
      const sm = subMarqueeRef.current
      subMarqueeRef.current = null
      if (sm) {
        const box = marqueeRef.current
        if (box) selectAnchors(anchorsInRect(box.x, box.y, box.w, box.h), e.shiftKey)
        else if (!subAnchorRef.current) {
          /* empty click handled below */
        }
        if (!ms) marqueeRef.current = null
      }

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
          const loop = sg.pts.length >= 3 ? [...sg.pts, sg.pts[0]] : sg.pts
          const ids = inkInPolygon(loop.length >= 3 ? loop : sg.pts)
          selectInk(ids)
          const items = evaluate(statusJson()?.playhead ?? 1)
          const hits = items.filter((it) => {
            const corners = [
              { x: it.x, y: it.y },
              { x: it.x + it.w, y: it.y },
              { x: it.x + it.w, y: it.y + it.h },
              { x: it.x, y: it.y + it.h },
              { x: it.x + it.w / 2, y: it.y + it.h / 2 },
            ]
            return corners.some((p) => pointInPoly(p, sg.pts))
          })
          if (hits.length === 0) {
            clearSelection()
          } else {
            selectAt(hits[0].x + hits[0].w / 2, hits[0].y + hits[0].h / 2)
            for (let i = 1; i < hits.length; i++) {
              selectToggleAt(hits[i].x + hits[i].w / 2, hits[i].y + hits[i].h / 2)
            }
          }
          notify?.(hits.length + ids.length ? `lasso: ${hits.length + ids.length} selected` : 'lasso: nothing inside')
        } else {
          const o = loadToolOptions()
          const pts =
            sg.kind === 'line'
              ? sg.pts
              : sg.kind === 'pencil'
                ? processPencil(sg.pts, o.pencilMode || 'smooth', o.pencilSmooth ?? 50, o.pencilRecognize !== false)
                : simplifyPolyline(sg.pts, sg.kind === 'brush' ? 2.4 : 1.4)
          const size = o.inkSize
          const sw = sg.kind === 'brush' ? Math.max(8, size) : Math.max(1, sg.kind === 'pencil' ? size : colors.strokeWidth)
          addInk({
            kind: sg.kind,
            points: pts,
            closed: false,
            fill: null,
            stroke: colors.stroke ?? '#111111',
            strokeWidth: sw,
            ...(sg.kind === 'pencil'
              ? { strokeDash: dashForStyle(o.pencilStyle, sw), lineCap: o.pencilCap || 'round', lineJoin: 'round' as const }
              : {}),
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
          const bg = statusJson()?.background ?? '#ffffff'
          const fill = colors.fill ?? '#ffffff'
          let stroke = colors.stroke
          let sw = colors.strokeWidth
          if (!stroke || tooClose(stroke, bg)) {
            stroke = '#111111'
            sw = Math.max(sw || 0, 1)
          }
          const raw = loadToolOptions().shapePreset
          const preset = !raw || raw === 'rect' || raw === 'oval' ? rg.shape : raw
          if (isEngineShape(preset)) {
            const id = drawShape(preset, rp.x, rp.y, rp.w, rp.h, fill, stroke, sw)
            if (id === 0 && engine.kind === 'ok' && notify) {
              notify(
                preset === 'oval' && !hasShapeDrawFacade()
                  ? 'Oval tool: engine build too old — rebuild with `npm run wasm`'
                  : 'draw blocked: active layer is locked, hidden, or a folder',
              )
            }
          } else {
            const o = loadToolOptions()
            addInk({
              kind: 'pen',
              points: shapeInBox(preset, rp, { sides: o.polySides, inner: o.starInner, corner: o.cornerRadius }),
              closed: true,
              fill,
              stroke,
              strokeWidth: Math.max(1, sw),
            })
          }
          previewStrokeRef.current = null
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
      subMarqueeRef.current = null
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
      if (!typing && activeTool() === 'subselect' && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
        ev.preventDefault()
        const step = ev.shiftKey ? 10 : 1
        let dx = 0
        let dy = 0
        if (ev.key === 'ArrowLeft') dx = -step
        if (ev.key === 'ArrowRight') dx = step
        if (ev.key === 'ArrowUp') dy = -step
        if (ev.key === 'ArrowDown') dy = step
        const pts = selectedAnchors()
        if (pts.length) {
          moveAnchors(pts, dx, dy)
          endInkEdit()
        }
        scheduleRedraw()
        return
      }
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
      if (!typing && (ev.key === 'Enter' || ev.key === 'NumpadEnter') && penPoints().length >= 2) {
        ev.preventDefault()
        ev.stopPropagation()
        commitPenRef.current(ev.shiftKey)
        return
      }
      if (ev.key !== 'Escape') return
      if (!rectGestureRef.current && !zoomStartRef.current && !strokeRef.current && penPoints().length === 0) return
      ev.preventDefault()
      ev.stopPropagation()
      rectGestureRef.current = null
      rectPreviewRef.current = null
      zoomStartRef.current = null
      zoomMarqueeRef.current = null
      strokeRef.current = null
      previewStrokeRef.current = null
      clearPenDraft()
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

    const overlay = overlayFromPending(status.selection_details ?? [], pending) ?? overlayFromStatus()
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
      inkItems: listInk().filter((it) => it.id !== textDraft?.editId),
      inkSelected: selectedInkIds(),
      inkAnchors: selectedAnchors(),
      showInkAnchors: tool === 'subselect',
      objExtras: serializeObjExtras(),
      previewStroke:
        previewStrokeRef.current ??
        (penPoints().length ? penPreviewPoints(loadToolOptions().penRubberBand !== false) : null),
      previewStrokeWidth: tool === 'pencil' || tool === 'brush' ? loadToolOptions().inkSize : loadToolColors().strokeWidth,
      previewStrokeColor: loadToolColors().stroke,
      previewStrokeDash: tool === 'pencil' ? dashForStyle(loadToolOptions().pencilStyle, loadToolOptions().inkSize) : undefined,
      previewLineCap: tool === 'pencil' ? loadToolOptions().pencilCap : undefined,
      previewClosed: strokeRef.current?.kind === 'lasso' || (penPoints().length >= 2 && isPenCloseHover()),
      previewFill: null,
      colorPreview,
      workArea: view.workArea,
      hideEdges: view.hideEdges,
      grid: view.grid,
      gridSize: view.gridSize,
      rulers: view.rulers,
      preview: view.preview,
      onionGhosts: onion.on && engine.kind === 'ok' ? collectGhosts(evaluate, onion, playhead, status.duration ?? 1) : undefined,
    }
    try {
      render(ctx, vpRef.current, state, viewW, viewH)
    } catch (err) {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, viewW, viewH)
      ctx.fillStyle = '#e66'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(err instanceof Error ? err.message : 'stage draw error', 12, 24)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.kind, playhead, tick, redrawVersion, colorPreview])

  // Fit once when the wrap first has size / engine attaches. Later resizes
  // only redraw — never steal the user's zoom/pan (that felt like a freeze).
  useEffect(() => {
    let fitted = false
    let lastW = 0
    let lastH = 0
    const onSize = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (w < 2 || h < 2) return
      const sizeChanged = w !== lastW || h !== lastH
      lastW = w
      lastH = h
      const status = statusJson()
      if (!fitted && status) {
        fitted = true
        applyViewport(fitViewport(status.doc_width ?? 1920, status.doc_height ?? 1080, w, h))
        return
      }
      if (sizeChanged) scheduleRedraw()
    }
    onSize()
    const ro = new ResizeObserver(onSize)
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
      const existing = hitInk(doc.x, doc.y)
      if (existing && existing.kind === 'text') {
        const scr = docToScreen(vpRef.current, existing.points[0].x, existing.points[0].y)
        setTextDraft({ x: existing.points[0].x, y: existing.points[0].y, sx: scr.x, sy: scr.y, value: existing.text || '', editId: existing.id })
        selectInk([existing.id])
        scheduleRedraw()
        return
      }
      setTextDraft({ x: doc.x, y: doc.y, sx, sy, value: 'Text' })
      scheduleRedraw()
      return
    }

    if (e.button === 0 && activeTool() === 'pen') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const draft = penPoints()
      if ((e.ctrlKey || e.metaKey) && draft.length >= 2) {
        commitPen(false)
        return
      }
      if (draft.length >= 3 && Math.hypot(doc.x - draft[0].x, doc.y - draft[0].y) < 10) {
        commitPen(true)
        return
      }
      if (draft.length === 0) {
        const rad = 8 / vpRef.current.zoom
        const anc = hitInkAnchor(doc.x, doc.y, rad)
        if (anc) {
          selectAnchors([anc])
          notify?.(deleteSelectedAnchors() ? 'anchor deleted' : 'need ≥2 points')
          scheduleRedraw()
          return
        }
        const seg = closestInkSegment(doc.x, doc.y, rad)
        if (seg) {
          notify?.(addAnchorOnSegment(seg.id, seg.index, seg.t) ? 'anchor added' : 'cannot add here')
          scheduleRedraw()
          return
        }
      }
      let p = { ...doc }
      if (e.shiftKey && draft.length > 0) p = constrain45(draft[draft.length - 1], p)
      appendPenPoint(p)
      setPenDragging(true)
      scheduleRedraw()
      return
    }

    if (e.button === 0 && activeTool() === 'subselect') {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const rad = 8 / vpRef.current.zoom
      const handle = hitInkHandle(doc.x, doc.y, rad)
      if (handle) {
        subAnchorRef.current = {
          kind: 'handle',
          id: handle.id,
          index: handle.index,
          which: handle.which,
          last: doc,
          mirror: !e.altKey,
        }
        return
      }
      const anchor = hitInkAnchor(doc.x, doc.y, rad)
      if (anchor) {
        selectAnchors([anchor], e.shiftKey)
        clearSelection()
        if (e.altKey) {
          convertAnchors('smooth')
          subAnchorRef.current = { kind: 'pull', id: anchor.id, index: anchor.index, which: 'out', last: doc, mirror: true }
        } else {
          subAnchorRef.current = { kind: 'point', id: anchor.id, index: anchor.index, last: doc, mirror: false }
        }
        scheduleRedraw()
        return
      }
      const hit = hitInk(doc.x, doc.y)
      if (hit) {
        selectInk([hit.id])
        clearSelection()
        const it = listInk().find((x) => x.id === hit.id)
        if (it) selectAnchors(it.points.map((_, i) => ({ id: hit.id, index: i })))
      } else {
        subMarqueeRef.current = doc
        marqueeRef.current = null
      }
      scheduleRedraw()
      return
    }

    if (e.button === 0 && isSelectLike()) {
      const doc = screenToDoc(vpRef.current, sx, sy)
      const status = statusJson()
      const details = status?.selection_details ?? []

      if (showTransformHandles()) {
        const ov = overlayFromStatus()
        if (ov && ov.handles.length > 0) {
          const screenHandles = { rotate: docToScreen(vpRef.current, ov.rotateHandle.x, ov.rotateHandle.y) } as Record<HandleKind, Pt>
          for (const [k, p] of ov.handles as [HandleKind, Pt][]) {
            screenHandles[k] = docToScreen(vpRef.current, p.x, p.y)
          }
          const hit = pickHandle(screenHandles, sx, sy, HANDLE_HIT_RADIUS)
          if (hit) {
            const geom = details.length
              ? selectionGeometry(details)
              : { box: ov.box, center: ov.center, aabb: { x: ov.box[0]?.x ?? 0, y: ov.box[0]?.y ?? 0, w: 1, h: 1 } }
            const anchor = hit === 'rotate' ? ov.center : e.altKey ? ov.center : oppositeHandle(geom, hit)
            const inkIds = selectedInkIds()
            transformRef.current = {
              handle: hit,
              startDoc: doc,
              startHandle: (ov.handles.find(([k]) => k === hit)?.[1] as Pt | undefined) ?? ov.rotateHandle,
              anchor,
              center: ov.center,
              details,
              inkStart: listInk()
                .filter((it) => inkIds.includes(it.id))
                .map((it) => ({ id: it.id, points: it.points.map((pt) => ({ ...pt })) })),
            }
            pendingRef.current = null
            return
          }
        }
      }

      const inkHit = hitInk(doc.x, doc.y)
      if (inkHit) {
        const alreadyInk = selectedInkIds().includes(inkHit.id)
        if (e.shiftKey || e.ctrlKey || e.metaKey) selectInk([inkHit.id], true)
        else if (!alreadyInk) {
          selectInk([inkHit.id])
          clearSelection()
        }
        selectGestureRef.current = { startX: sx, startY: sy, dragging: false }
        previewRef.current = null
        scheduleRedraw()
        return
      }

      // 2) Shift / Ctrl / Cmd → add or remove (Adobe additive select)
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        selectToggleAt(doc.x, doc.y)
        clearInkSelection()
        const nowSel = statusJson()?.selection ?? []
        if (nowSel.length > 0) {
          selectGestureRef.current = { startX: sx, startY: sy, dragging: false }
          previewRef.current = null
        }
        scheduleRedraw()
        return
      }

      // 3) Click on an already-selected object keeps the WHOLE set (Adobe /
      // Blender: drag any member → every selected object moves together).
      if (pointInRects(doc.x, doc.y, status?.selection_rects ?? [])) {
        clearInkSelection()
        selectGestureRef.current = { startX: sx, startY: sy, dragging: false }
        previewRef.current = null
        scheduleRedraw()
        return
      }

      // 4) New target replaces the set; empty stage arms a marquee.
      clearInkSelection()
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

  const onDoubleClick = (e: React.MouseEvent) => {
    if (activeTool() === 'pen') {
      e.preventDefault()
      if (penPoints().length >= 2) commitPen(false)
      return
    }
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const doc = screenToDoc(vpRef.current, e.clientX - rect.left, e.clientY - rect.top)
    const hit = hitInk(doc.x, doc.y)
    if (hit && hit.kind === 'text') {
      e.preventDefault()
      const scr = docToScreen(vpRef.current, hit.points[0].x, hit.points[0].y)
      setTextDraft({ x: hit.points[0].x, y: hit.points[0].y, sx: scr.x, sy: scr.y, value: hit.text || '', editId: hit.id })
      selectInk([hit.id])
      scheduleRedraw()
      return
    }
    const status = statusJson()
    if (!status) return
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
        <textarea
          data-testid="stage-text-input"
          autoFocus
          rows={Math.max(1, textDraft.value.split('\n').length)}
          value={textDraft.value}
          onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
          onBlur={() => {
            const d = textDraft
            setTextDraft(null)
            const raw = d?.value ?? ''
            if (d && raw.trim()) {
              if (d.editId != null) {
                updateInk(d.editId, { text: raw })
              } else {
                const colors = loadToolColors()
                const o = loadToolOptions()
                addInk({
                  kind: 'text',
                  points: [{ x: d.x, y: d.y }],
                  closed: false,
                  fill: contrastOn(colors.fill, statusJson()?.background ?? '#ffffff'),
                  stroke: null,
                  strokeWidth: 0,
                  text: raw,
                  fontSize: o.fontSize,
                  fontFamily: o.fontFamily,
                  fontWeight: o.fontWeight,
                  fontItalic: o.fontItalic,
                  fontUnderline: o.fontUnderline,
                  textAlign: o.textAlign,
                  letterSpacing: o.letterSpacing,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                })
              }
            }
            scheduleRedraw()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ;(e.target as HTMLTextAreaElement).blur()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              setTextDraft(null)
            }
          }}
          style={{
            position: 'absolute',
            left: textDraft.sx,
            top: textDraft.sy - 18,
            zIndex: 20,
            minWidth: 80,
            resize: 'both',
            background: '#111',
            color: '#eee',
            border: '1px solid #0a7cff',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.25,
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
