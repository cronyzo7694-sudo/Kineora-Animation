import { useEffect, useRef, useState } from 'react'
import type { EngineStatus } from '../controlRegistry'
import {
  drawRect,
  evaluate,
  moveSelection,
  selectAt,
  selectInRect,
  selectToggleAt,
  statusJson,
  transformSelection,
} from '../engine/client'
import { render, type RenderState, HANDLE_HIT_RADIUS } from '../render/canvasRenderer'
import { createViewport, docToScreen, fitViewport, panBy, screenToDoc, zoomAt, type Viewport } from '../render/viewport'
import { pastDragThreshold, screenDeltaToDoc, normalizeRect, isValidRect, type DocRect } from '../editor/gesture'
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
}

interface TransformGesture {
  handle: HandleKind
  startDoc: Pt // doc-space pointer at mousedown
  anchor: Pt // doc-space scale anchor (opposite handle or center)
  center: Pt // doc-space rotate center (selection center)
  details: SelDetail[]
}

export function Stage({ engine, tool, playhead, tick, notify }: Props) {
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

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const wrap = wrapRef.current
      if (!wrap) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        applyViewport(zoomAt(vpRef.current, wrap.clientWidth / 2, wrap.clientHeight / 2, 2))
      } else if (e.key === '-') {
        e.preventDefault()
        applyViewport(zoomAt(vpRef.current, wrap.clientWidth / 2, wrap.clientHeight / 2, 0.5))
      } else if (e.key === '1') {
        e.preventDefault()
        const status = statusJson()
        const docW = status?.doc_width ?? 1920
        const docH = status?.doc_height ?? 1080
        applyViewport({ zoom: 1, panX: (wrap.clientWidth - docW) / 2, panY: (wrap.clientHeight - docH) / 2 })
      } else if (e.key === '0') {
        e.preventDefault()
        const status = statusJson()
        applyViewport(fitViewport(status?.doc_width ?? 1920, status?.doc_height ?? 1080, wrap.clientWidth, wrap.clientHeight))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      if (toolRef.current === 'select') {
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
      if (rg && toolRef.current === 'rect') {
        if (!rg.dragging) {
          if (!pastDragThreshold(sx - rg.startX, sy - rg.startY)) return
          rg.dragging = true
        }
        const a = screenToDoc(vpRef.current, rg.startX, rg.startY)
        rectPreviewRef.current = normalizeRect(a.x, a.y, doc.x, doc.y)
        scheduleRedraw()
      }
    }

    const up = () => {
      panDragRef.current = null

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

      // commit rect draw
      const rg = rectGestureRef.current
      rectGestureRef.current = null
      const rp = rectPreviewRef.current
      rectPreviewRef.current = null
      if (rg?.dragging && rp && isValidRect(rp)) {
        const id = drawRect(rp.x, rp.y, rp.w, rp.h, '#3f9bf5')
        if (id === 0 && engine.kind === 'ok' && notify) {
          notify('draw blocked: active layer is locked or hidden')
        }
      }
      scheduleRedraw()
    }

    const cancel = () => {
      panDragRef.current = null
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

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('blur', cancel)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('blur', cancel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const state: RenderState = {
      background: status.background ?? '#ffffff',
      stageW: status.doc_width ?? 1920,
      stageH: status.doc_height ?? 1080,
      items: displayItems,
      selectedIds: status.selection ?? [],
      overlay,
      marquee: marqueeRef.current,
      previewDelta: previewRef.current,
      previewRect: rectPreviewRef.current,
    }
    render(ctx, vpRef.current, state, viewW, viewH)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.kind, playhead, tick, redrawVersion])

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

    if (e.button === 0 && toolRef.current === 'select') {
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

    if (e.button === 0 && toolRef.current === 'rect') {
      rectGestureRef.current = { startX: sx, startY: sy, dragging: false }
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

  return (
    <div ref={wrapRef} data-testid="stage-wrap" style={{ flex: 1, position: 'relative', background: '#111', minWidth: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        data-testid="stage-canvas"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
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
        tool: {tool} · zoom: <span data-testid="zoom-readout">{zoomReadout}</span> · pan: <span data-testid="pan-readout">{panReadout}</span> · stage: <span data-testid="stage-readout">{stageW}×{stageH}</span>
      </div>
    </div>
  )
}
