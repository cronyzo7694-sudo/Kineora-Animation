import { useEffect, useRef, useState } from 'react'
import type { EngineStatus } from '../controlRegistry'
import { evaluate, moveSelection, selectAt, statusJson } from '../engine/client'
import { render, type RenderState } from '../render/canvasRenderer'
import { createViewport, fitViewport, panBy, screenToDoc, zoomAt, type Viewport } from '../render/viewport'
import { pastDragThreshold, screenDeltaToDoc } from '../editor/gesture'

interface Props {
  engine: EngineStatus
  tool: string
  playhead: number
  tick: number // bump from App to trigger a redraw (status poll)
}

interface SelectGesture {
  startX: number // screen CSS px at pointerdown
  startY: number
  dragging: boolean // passed the drag threshold
}

export function Stage({ engine, tool, playhead, tick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const vpRef = useRef(createViewport())
  const toolRef = useRef(tool)
  toolRef.current = tool

  // Bump to re-run the render effect → immediate redraw on viewport/preview change.
  const [redrawVersion, setRedrawVersion] = useState(0)
  const [zoomReadout, setZoomReadout] = useState('100%')
  const [panReadout, setPanReadout] = useState('0,0')

  const panDragRef = useRef<{ x: number; y: number } | null>(null)
  const selectGestureRef = useRef<SelectGesture | null>(null)
  const previewRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  // Coalesced redraw: at most one canvas redraw per animation frame (Phase-3 rAF).
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

  // cancel any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Window-level drag handling: pointer/mouse keeps working when the cursor
  // leaves the canvas (Phase D), and browser autoscroll is bypassed.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()

      // middle-button pan
      if (panDragRef.current) {
        applyViewport(panBy(vpRef.current, e.clientX - panDragRef.current.x, e.clientY - panDragRef.current.y))
        panDragRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      // select-tool drag (left button)
      const g = selectGestureRef.current
      if (!g || toolRef.current !== 'select') return
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      if (!g.dragging) {
        if (!pastDragThreshold(sx - g.startX, sy - g.startY)) return // click, not yet a drag
        g.dragging = true
      }
      previewRef.current = screenDeltaToDoc(sx - g.startX, sy - g.startY, vpRef.current.zoom)
      scheduleRedraw()
    }

    const up = () => {
      // end pan
      panDragRef.current = null
      // end select drag → COMMIT exactly one move command
      const g = selectGestureRef.current
      selectGestureRef.current = null
      const p = previewRef.current
      previewRef.current = null
      if (g?.dragging && p && !(p.x === 0 && p.y === 0)) {
        moveSelection(p.x, p.y)
      }
      scheduleRedraw()
    }

    const cancel = () => {
      // pointer cancel / window blur: discard preview, NO command (Phase D/G)
      panDragRef.current = null
      selectGestureRef.current = null
      previewRef.current = null
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

  // render loop: redraw when props, viewport version, or the poll tick change
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // draw in CSS px

    const items = engine.kind === 'ok' ? evaluate(playhead) : []
    const state: RenderState = {
      background: status.background ?? '#ffffff',
      items,
      selection: status.selection_rects ?? [],
      previewDelta: previewRef.current,
    }
    render(ctx, vpRef.current, state, viewW, viewH)
  }, [engine.kind, playhead, tick, redrawVersion])

  // initial fit + refit on resize
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      const status = statusJson()
      if (!wrap || !status) return
      applyViewport(fitViewport(status.doc_width ?? 800, status.doc_height ?? 600, wrap.clientWidth, wrap.clientHeight))
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
      // middle button: autoscroll lives on mousedown in Chrome/Firefox — kill
      // it here, then start the pan (continued by the window listeners).
      e.preventDefault()
      panDragRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (e.button === 0 && toolRef.current === 'select') {
      // left button + Select tool: hit-test → select (or clear), then arm a
      // potential drag (committed only if the threshold is crossed).
      const d = screenToDoc(vpRef.current, sx, sy)
      const hit = selectAt(d.x, d.y)
      selectGestureRef.current = hit ? { startX: sx, startY: sy, dragging: false } : null
      previewRef.current = null
      scheduleRedraw() // selection overlay updates immediately
    }
  }

  const onDoubleClick = () => {
    const wrap = wrapRef.current
    const status = statusJson()
    if (!wrap || !status) return
    applyViewport(fitViewport(status.doc_width ?? 800, status.doc_height ?? 600, wrap.clientWidth, wrap.clientHeight))
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
        tool: {tool} · zoom: <span data-testid="zoom-readout">{zoomReadout}</span> · pan: <span data-testid="pan-readout">{panReadout}</span>
      </div>
    </div>
  )
}
