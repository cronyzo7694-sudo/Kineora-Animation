// Canvas renderer — draws the Rust engine's evaluated RectItem[] onto a canvas.
// Pure geometry helpers are exported for unit tests; the ctx-based `render`
// is the thin imperative layer the Stage owns.
//
// Overlay separation (Phase-3 §06): the CONTENT pass (background + rects) is
// the only thing drawn here from evaluate(). The SELECTION overlay is a
// separate pass drawn only by the editor canvas — export goes through the Rust
// `exportSvg`, which never contains overlays.

import type { RectItemJson, SelRectJson } from '../engine/wasmTypes'
import type { Viewport } from './viewport'
import { docRectToScreen } from './viewport'

export interface RenderState {
  background: string
  items: RectItemJson[]
  selection: SelRectJson[]
}

export const SELECTION_STROKE = '#0a7cff'
export const HANDLE_SIZE = 6

/** Content pass + selection overlay, using CSS-pixel coordinates (dpr pre-scaled by caller). */
export function render(ctx: CanvasRenderingContext2D, vp: Viewport, s: RenderState, viewW: number, viewH: number): void {
  ctx.clearRect(0, 0, viewW, viewH)

  // background (document)
  ctx.fillStyle = s.background
  ctx.fillRect(0, 0, viewW, viewH)

  // draw order = evaluate() order (bottom→top layer, back→front node)
  for (const it of s.items) {
    drawRectItem(ctx, vp, it)
  }

  // selection overlay (editor-only, never exported)
  for (const sel of s.selection) {
    drawSelection(ctx, vp, sel)
  }
}

function drawRectItem(ctx: CanvasRenderingContext2D, vp: Viewport, it: RectItemJson): void {
  const r = docRectToScreen(vp, { x: it.x, y: it.y, w: it.w, h: it.h })
  ctx.fillStyle = it.fill
  ctx.fillRect(r.x, r.y, r.w, r.h)
  if (it.stroke) {
    ctx.strokeStyle = it.stroke
    ctx.lineWidth = it.stroke_width * vp.zoom
    ctx.strokeRect(r.x, r.y, r.w, r.h)
  }
}

function drawSelection(ctx: CanvasRenderingContext2D, vp: Viewport, sel: SelRectJson): void {
  const r = docRectToScreen(vp, { x: sel.x, y: sel.y, w: sel.w, h: sel.h })
  ctx.strokeStyle = SELECTION_STROKE
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.strokeRect(r.x, r.y, r.w, r.h)
  ctx.setLineDash([])

  // corner handles
  ctx.fillStyle = '#ffffff'
  for (const [hx, hy] of corners(r)) {
    ctx.strokeStyle = SELECTION_STROKE
    ctx.lineWidth = 1
    ctx.strokeRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
  }
}

function corners(r: { x: number; y: number; w: number; h: number }): Array<[number, number]> {
  return [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x, r.y + r.h],
    [r.x + r.w, r.y + r.h],
  ]
}
