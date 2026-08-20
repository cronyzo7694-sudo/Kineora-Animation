import { useEffect, useRef, useState } from 'react'
import type { EngineStatus } from '../controlRegistry'
import { evaluate, statusJson } from '../engine/client'
import { render, type RenderState } from '../render/canvasRenderer'
import { createViewport, fitViewport, panBy, zoomAt, type Viewport } from '../render/viewport'

interface Props {
  engine: EngineStatus
  tool: string
  playhead: number
  tick: number // bump from App to trigger a redraw (status poll)
}

export function Stage({ engine, tool, playhead, tick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const vpRef = useRef(createViewport())
  // Bump this to re-run the render effect → immediate canvas redraw on any
  // viewport mutation (zoom/pan/fit). This is the interaction-wiring fix:
  // previously viewport refs changed without triggering a redraw.
  const [vpVersion, setVpVersion] = useState(0)
  const [zoomReadout, setZoomReadout] = useState('100%')
  const [panReadout, setPanReadout] = useState('0,0')
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  // Coalesced redraw: at most one canvas redraw per animation frame, no matter
  // how many zoom/pan events arrive (Phase-3 Step 7 / rAF strategy).
  const applyViewport = (vp: Viewport) => {
    vpRef.current = vp
    setZoomReadout(`${Math.round(vp.zoom * 100)}%`)
    setPanReadout(`${Math.round(vp.panX)},${Math.round(vp.panY)}`)
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setVpVersion((v) => v + 1)
      })
    }
  }

  // cancel any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Middle-button pan uses WINDOW-level mouse listeners so the drag keeps
  // working when the pointer leaves the canvas. (Middle button is mouse-only,
  // and `mousedown` is where browsers trigger autoscroll — handled below.)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return
      applyViewport(panBy(vpRef.current, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y))
      dragRef.current = { x: e.clientX, y: e.clientY }
    }
    const up = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
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
    }
    render(ctx, vpRef.current, state, viewW, viewH)
  }, [engine.kind, playhead, tick, vpVersion])

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

  // Middle-button autoscroll is triggered by `mousedown` in Chrome/Firefox and
  // is NOT stopped by pointer-event preventDefault — suppress it here, and start
  // the pan drag (continued by the window-level listeners above).
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return
    e.preventDefault()
    dragRef.current = { x: e.clientX, y: e.clientY }
  }

  // Phase-3 §22: pointer must never be "lost" mid-drag — every end/cancel path
  // safely terminates the gesture (mouse path handled by window mouseup).
  const endPan = () => {
    dragRef.current = null
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
        onPointerUp={endPan}
        onPointerCancel={endPan}
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
