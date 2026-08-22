import { useEffect, useRef, useState } from 'react'
import { makeCommandContext, stageViewController } from '../commands'
import { useShortcutScope } from '../shortcuts'
import type { EngineStatus } from '../controlRegistry'
import {
  drawRect,
  evaluate,
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
import { render, type ColorPreview, type RenderState, HANDLE_HIT_RADIUS } from '../render/canvasRenderer'
import { loadViewPrefs, subscribeViewPrefs } from '../viewPrefs'
import { loadToolColors, setToolColors, subscribeToolColors } from '../toolColors'
import { loadToolOptions, subscribeToolOptions } from '../toolOptions'
import { createViewport, docToScreen, fitViewport, panBy, screenToDoc, zoomAt, zoomToRect, type Viewport } from '../render/viewport'
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
export function stageCursor(tool: string, zoomMode: 'in' | 'out' = 'in'): string {
  switch (tool) {
    case 'hand':
      return 'grab'
    case 'zoom':
      return zoomMode === 'out' ? 'zoom-out' : 'zoom-in'
    case 'rect':
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

interface RectGesture {
  startX: number
  startY: number
  dragging: boolean
  lastDocX: number
  lastDocY: number
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
  const [panReadout, setPanReadout] = useState('0,0')

  // live document stage size for the readout (canonical default when detached)
  const liveStatus = statusJson()
  const stageW = liveStatus?.doc_width ?? 1920
  const stageH = liveStatus?.doc_height ?? 1080

  const panDragRef = useRef<{ x: number; y: number } | null>(null)
  const selectGestureRef = useRef<SelectGesture | null>(null)
  const previewRef = useRef<{ x: number; y: number } | null>(null)
  const rectGestureRef = useRef<RectGesture | null>(null)
  const rectPreviewRef = useRef<DocRect | null>(null)
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
  const [zoomMode, setZoomMode] = useState(loadToolOptions().zoomMode)
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

  useEffect(() => subscribeViewPrefs(() => scheduleRedraw()), [])
  useEffect(() => subscribeToolColors(() => scheduleRedraw()), [])
  useEffect(() => subscribeToolOptions(() => setZoomMode(loadToolOptions().zoomMode)), [])

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

      // rect-tool draw
      const rg = rectGestureRef.current
      if (rg && activeTool() === 'rect') {
        if (!rg.dragging) {
          if (!pastDragThreshold(sx - rg.startX, sy - rg.startY)) return
          rg.dragging = true
        }
        rg.lastDocX = doc.x
        rg.lastDocY = doc.y
        const a = screenToDoc(vpRef.current, rg.startX, rg.startY)
        rectPreviewRef.current = buildRect(a.x, a.y, doc.x, doc.y, {
          square: e.shiftKey,
          fromCenter: e.altKey,
        })
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
        } else {
          // click (no drag) on empty stage → clear selection (Phase-1 03.3.1)
          selectInRect(ms.x, ms.y, ms.x, ms.y)
        }
      }

      // commit select drag (move)
      const g = selectGestureRef.current
      selectGestureRef.current = null
      const p = previewRef.current
      previewRef.current = null
      if (g?.dragging && p && !(p.x === 0 && p.y === 0)) {
        moveSelection(p.x, p.y)
      }

      // commit rect draw — rebuild from last pointer + modifiers at release
      // so Shift/Alt held through mouseup still apply (T2B.4).
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
          // BUG-TOOL-007: the Rectangle tool used a hard-coded #3f9bf5. Adobe:
          // "The Tools panel Stroke Color and Fill Color controls set the
          // painting attributes of new objects you create with the drawing and
          // painting tools."
          const id = drawRect(rp.x, rp.y, rp.w, rp.h, loadToolColors().fill ?? '#ffffff')
          if (id === 0 && engine.kind === 'ok' && notify) {
            notify('draw blocked: active layer is locked, hidden, or a folder')
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
      scheduleRedraw()
    }

    // Blueprint T2B.4: Esc discards an in-progress rect (no command, no undo).
    // Capture so we win over edit.exitOneLevel when a draw is live.
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return
      if (!rectGestureRef.current && !zoomStartRef.current) return
      ev.preventDefault()
      ev.stopPropagation()
      rectGestureRef.current = null
      rectPreviewRef.current = null
      zoomStartRef.current = null
      zoomMarqueeRef.current = null
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
      colorPreview,
      workArea: view.workArea,
      hideEdges: view.hideEdges,
      grid: view.grid,
      gridSize: view.gridSize,
      rulers: view.rulers,
      preview: view.preview,
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
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    applyViewport(zoomAt(vpRef.current, e.clientX - rect.left, e.clientY - rect.top, factor))
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

    if (e.button === 0 && isSelectLike()) {
      const doc = screenToDoc(vpRef.current, sx, sy)

      // 1) handle hit-test → arm transform gesture
      const status = statusJson()
      const details = status?.selection_details ?? []
      if (details.length > 0) {
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

      // 2) shift → toggle
      if (e.shiftKey) {
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

    if (e.button === 0 && activeTool() === 'rect') {
      const startDoc = screenToDoc(vpRef.current, sx, sy)
      rectGestureRef.current = {
        startX: sx,
        startY: sy,
        dragging: false,
        lastDocX: startDoc.x,
        lastDocY: startDoc.y,
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
          <div style={{ color: '#b33', textAlign: 'center', maxWidth: 360, fontSize: 14, background: '#1a1a1a', padding: 12, borderRadius: 6 }}>
            <strong>Core not attached</strong>
            <p style={{ marginTop: 8, color: '#666' }}>{engine.detail}</p>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 4, left: 8, color: '#888', fontSize: 12, pointerEvents: 'none' }}>
        tool: <span data-testid="tool-readout">{spaceHeld ? 'hand (space)' : tool}</span> · zoom: <span data-testid="zoom-readout">{zoomReadout}</span> · pan: <span data-testid="pan-readout">{panReadout}</span> · stage: <span data-testid="stage-readout">{stageW}×{stageH}</span>
      </div>
    </div>
  )
}
