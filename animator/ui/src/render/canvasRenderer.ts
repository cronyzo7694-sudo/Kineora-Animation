// Canvas renderer — draws the Rust engine's evaluated RectItem[] onto a canvas.
// Pure geometry helpers are exported for unit tests; the ctx-based `render`
// is the thin imperative layer the Stage owns.
//
// Overlay separation (Phase-3 §06): the CONTENT pass (background + rects) is
// the only thing drawn here from evaluate(). Selection box, handles, marquee,
// drag preview, and draw preview are editor-only and drawn only by the editor
// canvas — export goes through the Rust `exportSvg`, which never contains them.

import type { RectItemJson } from '../engine/wasmTypes'
import type { Viewport } from './viewport'
import { docRectToScreen, docToScreen } from './viewport'

export interface Pt {
  x: number
  y: number
}

/**
 * Live color preview (Part 26.12 "color controls live" + C-09 "live preview;
 * commit on release"). Renderer-only — it overrides the DRAWN background or a
 * single object's style while a color/stroke-width field is being edited, and
 * is cleared on commit/cancel. It never touches engine state, so it cannot
 * leak into SVG export or the project save (REQ-EXP-002).
 */
export interface ColorPreview {
  /** Stage background override (document background being previewed). */
  background?: string
  /** Single-object style override (fill/stroke/stroke-width being previewed). */
  item?: {
    id: number
    fill?: string
    stroke?: string | null
    strokeWidth?: number
  }
}

export interface RenderState {
  background: string
  /** Stage background opacity 0..=1 (Part 33 §33.1 backgroundAlpha; H01).
   *  < 1 lets the pasteboard show through — exactly what export renders. */
  backgroundAlpha?: number
  /** Document stage bounds (doc units) — the published frame (Part 01 §1.4.1).
   *  The stage is filled with `background`; the pasteboard around it is gray. */
  stageW: number
  stageH: number
  items: RectItemJson[]
  /** Selected node ids (move-preview translates only these). */
  selectedIds?: number[]
  /** Doc-space overlay geometry (computed by the Stage from selection_details). */
  overlay?: {
    box: Pt[] // selection box corners (rotated for single, AABB for multi)
    handles: Array<[string, Pt]> // scale handles (tl/t/tr/r/br/b/bl/l) + rotate
    rotateHandle: Pt
    center: Pt
  } | null
  /** Editor-only marquee (doc-space rect, contact selection). */
  marquee?: { x: number; y: number; w: number; h: number } | null
  /** Editor-only drag preview: selected objects drawn translated by this DOC delta. */
  previewDelta?: { x: number; y: number } | null
  /** Editor-only draw preview: DOC-space rect being drawn (Rect tool). */
  previewRect?: { x: number; y: number; w: number; h: number } | null
  /** Editor-only live color preview (color/stroke-width field editing). */
  colorPreview?: ColorPreview | null
  /** SYS-04 view flags (defaults preserve the previous always-on behavior). */
  workArea?: boolean
  hideEdges?: boolean
  grid?: boolean
  gridSize?: number
  rulers?: boolean
  preview?: 'full' | 'outline'
}

export const SELECTION_STROKE = '#0a7cff'
export const HANDLE_SIZE = 7
export const HANDLE_HIT_RADIUS = 8 // screen px (pickHandle caller)
/** Pasteboard (work area) surround color — the gray around the stage. */
export const PASTEBOARD_COLOR = '#2b2b2b'
/** Stage border (authoring-only: drawn on the editor canvas, never exported). */
export const STAGE_BORDER = '#6a6a6a'

export function render(ctx: CanvasRenderingContext2D, vp: Viewport, s: RenderState, viewW: number, viewH: number): void {
  ctx.clearRect(0, 0, viewW, viewH)

  const workArea = s.workArea !== false
  const viewOutline = s.preview === 'outline'

  // 1) pasteboard (work area) — gray surround, distinct from the stage.
  //    View ▸ Work Area OFF (Part 01 §1.4.1 / Ctrl+Shift+W) hides the gray.
  if (workArea) {
    ctx.fillStyle = PASTEBOARD_COLOR
    ctx.fillRect(0, 0, viewW, viewH)
  } else {
    ctx.fillStyle = s.colorPreview?.background ?? s.background
    ctx.fillRect(0, 0, viewW, viewH)
  }

  // 2) the document stage — the published frame (Part 01 §1.4.1), filled with
  //    the document background and outlined so the user sees "THIS is my page".
  //    A live background preview (doc-bg field) overrides the drawn fill only.
  const stage = docRectToScreen(vp, { x: 0, y: 0, w: s.stageW, h: s.stageH })
  ctx.save()
  ctx.globalAlpha = s.backgroundAlpha ?? 1
  ctx.fillStyle = s.colorPreview?.background ?? s.background
  ctx.fillRect(stage.x, stage.y, stage.w, stage.h)
  ctx.restore()
  ctx.strokeStyle = STAGE_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(stage.x + 0.5, stage.y + 0.5, stage.w - 1, stage.h - 1)

  if (s.grid) {
    drawGrid(ctx, vp, s.stageW, s.stageH, s.gridSize && s.gridSize > 0 ? s.gridSize : 20)
  }

  const preview = s.previewDelta ?? null
  const selected = new Set(s.selectedIds ?? [])
  const pv = s.colorPreview?.item ?? null

  for (const it of s.items) {
    const off = preview && selected.has(it.id) ? preview : { x: 0, y: 0 }
    // Outline mode (F-20-03): items whose scene layer is outlined render as
    // strokes in the layer's outline color — a VIEW aid; `renderContent` (the
    // export rasterizer) builds its own styles and ignores this entirely, and
    // the Rust `exportSvg` never sees it either.
    const layerOutline = it.outline_color ?? null
    const base: ItemStyle = layerOutline
      ? { fill: 'rgba(0,0,0,0)', stroke: layerOutline, strokeWidth: 1 }
      : viewOutline
        ? { fill: 'transparent', stroke: it.fill || '#888888', strokeWidth: it.stroke_width > 0 ? it.stroke_width : 1 }
        : { fill: it.fill, stroke: it.stroke, strokeWidth: it.stroke_width }
    const style: ItemStyle = pv && pv.id === it.id
      ? {
          fill: pv.fill ?? base.fill,
          stroke: pv.stroke !== undefined ? pv.stroke : base.stroke,
          strokeWidth: pv.strokeWidth ?? base.strokeWidth,
        }
      : base
    drawRectItem(ctx, vp, it, off, style)
  }

  // marquee (editor-only)
  if (s.marquee) {
    drawMarquee(ctx, vp, s.marquee)
  }

  // rect draw preview (editor-only)
  if (s.previewRect) {
    drawRectPreview(ctx, vp, s.previewRect)
  }

  // selection overlay (editor-only, never exported). Hide Edges (Ctrl+Shift+E)
  // suppresses it so the user can edit without seeing the highlight (WISH W6).
  if (s.overlay && !s.hideEdges) {
    drawOverlay(ctx, vp, s.overlay)
  }

  if (s.rulers) {
    drawRulers(ctx, vp, s.stageW, s.stageH, viewW, viewH)
  }
}

/** Effective draw style for a rect (engine value, or live preview override). */
interface ItemStyle {
  fill: string
  stroke: string | null
  strokeWidth: number
}

function drawRectItem(ctx: CanvasRenderingContext2D, vp: Viewport, it: RectItemJson, off: Pt, style: ItemStyle): void {
  const cx = it.x + it.w / 2 + off.x
  const cy = it.y + it.h / 2 + off.y
  const p = docToScreen(vp, cx, cy)
  const w = it.w * vp.zoom
  const h = it.h * vp.zoom
  ctx.save()
  ctx.translate(p.x, p.y)
  if (it.rotation !== 0) ctx.rotate((it.rotation * Math.PI) / 180)
  ctx.fillStyle = style.fill
  ctx.fillRect(-w / 2, -h / 2, w, h)
  if (style.stroke) {
    ctx.strokeStyle = style.stroke
    ctx.lineWidth = style.strokeWidth * vp.zoom
    ctx.strokeRect(-w / 2, -h / 2, w, h)
  }
  ctx.restore()
}

// ——— export rasterizer (Part 28.1 image export: PNG/JPEG/WebP) ———

/** Minimal content-only draw state for export (no overlays, no viewport). */
export interface ContentState {
  background: string
  stageW: number
  stageH: number
  items: RectItemJson[]
}

/**
 * Content-only draw pass — the raster equivalent of the Rust `exportSvg`:
 * fills the stage rect with the document background, then draws each item
 * (rotation around center, scale via w/h, stroke). NO pasteboard, NO stage
 * border, NO selection overlay/marquee/preview — so it can never leak into an
 * export (REQ-EXP-002). Given an identity viewport + a stage-sized canvas, its
 * geometry matches the SVG export exactly (authoring = export).
 */
export function renderContent(ctx: CanvasRenderingContext2D, vp: Viewport, s: ContentState): void {
  const r = docRectToScreen(vp, { x: 0, y: 0, w: s.stageW, h: s.stageH })
  ctx.fillStyle = s.background
  ctx.fillRect(r.x, r.y, r.w, r.h)
  for (const it of s.items) {
    drawRectItem(ctx, vp, it, { x: 0, y: 0 }, { fill: it.fill, stroke: it.stroke, strokeWidth: it.stroke_width })
  }
}

/**
 * Rasterize the content pass into an offscreen canvas at exactly
 * `stageW × stageH × scale` pixels (Part 28.1 "Match Movie (stage size)" +
 * "Scale 1×/2×/4×"). Returns null when a 2D context is unavailable. The result
 * is independent of the editor viewport (zoom/pan), selection, and overlays.
 */
export function rasterizeContent(s: ContentState, scale = 1): HTMLCanvasElement | null {
  const z = scale > 0 && Number.isFinite(scale) ? scale : 1
  const cw = Math.max(1, Math.round(s.stageW * z))
  const ch = Math.max(1, Math.round(s.stageH * z))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  renderContent(ctx, { zoom: z, panX: 0, panY: 0 }, s)
  return canvas
}

function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, stageW: number, stageH: number, size: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(120, 120, 120, 0.45)'
  ctx.lineWidth = 1
  for (let x = 0; x <= stageW + 0.001; x += size) {
    const a = docToScreen(vp, x, 0)
    const b = docToScreen(vp, x, stageH)
    ctx.moveTo(a.x + 0.5, a.y)
    ctx.lineTo(b.x + 0.5, b.y)
  }
  for (let y = 0; y <= stageH + 0.001; y += size) {
    const a = docToScreen(vp, 0, y)
    const b = docToScreen(vp, stageW, y)
    ctx.moveTo(a.x, a.y + 0.5)
    ctx.lineTo(b.x, b.y + 0.5)
  }
  ctx.stroke()
  ctx.restore()
}

const RULER = 16

function drawRulers(ctx: CanvasRenderingContext2D, vp: Viewport, stageW: number, stageH: number, viewW: number, viewH: number): void {
  ctx.save()
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, viewW, RULER)
  ctx.fillRect(0, 0, RULER, viewH)
  ctx.strokeStyle = '#555'
  ctx.fillStyle = '#888'
  ctx.lineWidth = 1
  ctx.font = '9px system-ui, sans-serif'
  const step = vp.zoom >= 1 ? 50 : 100
  ctx.beginPath()
  for (let x = 0; x <= stageW; x += step) {
    const p = docToScreen(vp, x, 0)
    if (p.x < RULER) continue
    ctx.moveTo(p.x + 0.5, 0)
    ctx.lineTo(p.x + 0.5, RULER)
    ctx.fillText(String(x), p.x + 2, 11)
  }
  for (let y = 0; y <= stageH; y += step) {
    const p = docToScreen(vp, 0, y)
    if (p.y < RULER) continue
    ctx.moveTo(0, p.y + 0.5)
    ctx.lineTo(RULER, p.y + 0.5)
    ctx.fillText(String(y), 2, p.y + 10)
  }
  ctx.stroke()
  ctx.restore()
}

function drawMarquee(ctx: CanvasRenderingContext2D, vp: Viewport, m: { x: number; y: number; w: number; h: number }): void {
  const p = docToScreen(vp, m.x, m.y)
  ctx.strokeStyle = SELECTION_STROKE
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.strokeRect(p.x, p.y, m.w * vp.zoom, m.h * vp.zoom)
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(10, 124, 255, 0.06)'
  ctx.fillRect(p.x, p.y, m.w * vp.zoom, m.h * vp.zoom)
}

function drawRectPreview(ctx: CanvasRenderingContext2D, vp: Viewport, r: { x: number; y: number; w: number; h: number }): void {
  const p = docToScreen(vp, r.x, r.y)
  ctx.fillStyle = 'rgba(63, 155, 245, 0.2)'
  ctx.fillRect(p.x, p.y, r.w * vp.zoom, r.h * vp.zoom)
  ctx.strokeStyle = '#3f9bf5'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.strokeRect(p.x, p.y, r.w * vp.zoom, r.h * vp.zoom)
  ctx.setLineDash([])
}

function drawOverlay(ctx: CanvasRenderingContext2D, vp: Viewport, o: NonNullable<RenderState['overlay']>): void {
  // selection box polygon
  if (o.box.length > 1) {
    ctx.strokeStyle = SELECTION_STROKE
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    const first = docToScreen(vp, o.box[0].x, o.box[0].y)
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < o.box.length; i++) {
      const p = docToScreen(vp, o.box[i].x, o.box[i].y)
      ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  }

  // rotate connector line
  const center = docToScreen(vp, o.center.x, o.center.y)
  const rot = docToScreen(vp, o.rotateHandle.x, o.rotateHandle.y)
  ctx.strokeStyle = SELECTION_STROKE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.lineTo(rot.x, rot.y)
  ctx.stroke()

  // scale handles (squares)
  for (const [, hp] of o.handles) {
    const p = docToScreen(vp, hp.x, hp.y)
    ctx.strokeStyle = SELECTION_STROKE
    ctx.lineWidth = 1
    ctx.strokeRect(p.x - HANDLE_SIZE / 2, p.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(p.x - HANDLE_SIZE / 2, p.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
  }

  // rotate handle (circle)
  ctx.beginPath()
  ctx.arc(rot.x, rot.y, HANDLE_SIZE / 1.6, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = SELECTION_STROKE
  ctx.lineWidth = 1
  ctx.stroke()
}
