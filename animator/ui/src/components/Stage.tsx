import { useEffect, useRef, useState } from 'react'
import type { EngineStatus } from '../controlRegistry'
import { evaluate, statusJson } from '../engine/client'
import { render, type RenderState } from '../render/canvasRenderer'
import { createViewport, fitViewport, panBy, zoomAt } from '../render/viewport'

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
  const [zoomReadout, setZoomReadout] = useState('100%')
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  // render loop: redraw whenever props change or the viewport changes
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
    setZoomReadout(`${Math.round(vpRef.current.zoom * 100)}%`)
  }, [engine.kind, playhead, tick])

  // initial fit + refit on resize
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      const status = statusJson()
      if (!wrap || !status) return
      vpRef.current = fitViewport(status.doc_width ?? 800, status.doc_height ?? 600, wrap.clientWidth, wrap.clientHeight)
      setZoomReadout(`${Math.round(vpRef.current.zoom * 100)}%`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [engine.kind])

  const onWheel = (e: React.WheelEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    vpRef.current = zoomAt(vpRef.current, e.clientX - rect.left, e.clientY - rect.top, factor)
    setZoomReadout(`${Math.round(vpRef.current.zoom * 100)}%`)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    // middle-button drag pans (right-drag panning comes with the tool system)
    if (e.button === 1) {
      e.preventDefault()
      dragRef.current = { x: e.clientX, y: e.clientY }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    vpRef.current = panBy(vpRef.current, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y)
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    dragRef.current = null
  }
  const onDoubleClick = () => {
    const wrap = wrapRef.current
    const status = statusJson()
    if (!wrap || !status) return
    vpRef.current = fitViewport(status.doc_width ?? 800, status.doc_height ?? 600, wrap.clientWidth, wrap.clientHeight)
    setZoomReadout(`${Math.round(vpRef.current.zoom * 100)}%`)
  }

  // (pointer doc-coord readout arrives with the pointer→tool unit; nothing to
  //  do on hover yet — kept as a no-op hook so future tools can attach here.)
  const onHover = () => {}

  return (
    <div ref={wrapRef} data-testid="stage-wrap" style={{ flex: 1, position: 'relative', background: '#111', minWidth: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        data-testid="stage-canvas"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onMouseMove={onHover}
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
        tool: {tool} · zoom: <span data-testid="zoom-readout">{zoomReadout}</span>
      </div>
    </div>
  )
}
