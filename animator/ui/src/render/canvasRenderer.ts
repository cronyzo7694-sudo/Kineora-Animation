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
import { textLocalBox, type InkItem, type InkPt } from '../editor/inkStore'
import { contrastOn, tooClose } from '../contrast'

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
  /** Editor-only draw preview: DOC-space bounds of the shape being drawn
   *  (Rectangle / Oval tools — `shape` picks the preview outline). */
  previewRect?: { x: number; y: number; w: number; h: number; shape?: 'rect' | 'oval' } | null
  /** Editor-only live color preview (color/stroke-width field editing). */
  colorPreview?: ColorPreview | null
  /** SYS-04 view flags (defaults preserve the previous always-on behavior). */
  workArea?: boolean
  hideEdges?: boolean
  grid?: boolean
  gridSize?: number
  rulers?: boolean
  preview?: 'full' | 'outline'
  /** Editor-only onion ghosts (Blueprint 15.2). Never passed to renderContent. */
  onionGhosts?: Array<{ items: RectItemJson[]; tint: string; alpha: number; outlines: boolean }>
  /** Path / text objects authored by the remaining tools (UI ink store). */
  inkItems?: InkItem[]
  inkSelected?: number[]
  /** Subselection (A): highlight these anchors + draw Bezier handles. */
  inkAnchors?: Array<{ id: number; index: number }>
  showInkAnchors?: boolean
  objExtras?: Record<number, { opacity?: number; blend?: string; fillImage?: string | null; locked?: boolean }>
  previewStroke?: InkPt[] | null
  previewStrokeWidth?: number
  previewStrokeColor?: string | null
  previewFill?: string | null
  previewClosed?: boolean
  previewText?: { x: number; y: number; text: string; size: number; fill: string } | null
}

export function pathD(pts: InkPt[], closed: boolean): string {
  if (pts.length === 0) return ''
  const parts = [`M${pts[0].x} ${pts[0].y}`]
  const n = pts.length
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    if (a.outX != null || b.inX != null) {
      const c1x = a.outX ?? a.x
      const c1y = a.outY ?? a.y
      const c2x = b.inX ?? b.x
      const c2y = b.inY ?? b.y
      parts.push(`C${c1x} ${c1y} ${c2x} ${c2y} ${b.x} ${b.y}`)
    } else {
      parts.push(`L${b.x} ${b.y}`)
    }
  }
  if (closed) parts.push('Z')
  return parts.join(' ')
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

  // Ghost pass UNDER the current frame (15.2.2). Export never sees this field.
  for (const g of s.onionGhosts ?? []) {
    for (const it of g.items) {
      const style: ItemStyle = g.outlines
        ? { fill: 'rgba(0,0,0,0)', stroke: g.tint, strokeWidth: 1 }
        : { fill: tintFill(it.fill, g.tint, g.alpha), stroke: it.stroke ? tintFill(it.stroke, g.tint, g.alpha) : null, strokeWidth: it.stroke_width }
      drawRectItem(ctx, vp, it, { x: 0, y: 0 }, style)
    }
  }

  for (const it of s.items) {
    const off = preview && selected.has(it.id) ? preview : { x: 0, y: 0 }
    // Outline mode (F-20-01): items whose scene layer is outlined render as
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
    const extra = s.objExtras?.[it.id]
    const vis = visibleOnStage(style, s.background)
    ctx.save()
    if (extra?.opacity != null) ctx.globalAlpha = Math.max(0, Math.min(1, extra.opacity / 100))
    if (extra?.blend && extra.blend !== 'normal') ctx.globalCompositeOperation = extra.blend as GlobalCompositeOperation
    drawRectItem(ctx, vp, it, off, vis, extra?.fillImage ?? null)
    ctx.restore()
  }

  drawInkItems(ctx, vp, s.inkItems ?? [], s.inkSelected ?? [], preview, s.background, s.inkAnchors, s.showInkAnchors, s.objExtras)
  if (s.previewStroke && s.previewStroke.length > 0) {
    drawPolyline(
      ctx,
      vp,
      s.previewStroke,
      s.previewStrokeColor ?? '#111111',
      Math.max(1.5, s.previewStrokeWidth ?? 2),
      s.previewFill ?? null,
      !!s.previewClosed,
    )
  }
  if (s.previewText) {
    const p = docToScreen(vp, s.previewText.x, s.previewText.y)
    ctx.save()
    ctx.fillStyle = s.previewText.fill
    ctx.font = `${s.previewText.size * vp.zoom}px system-ui, sans-serif`
    ctx.fillText(s.previewText.text, p.x, p.y)
    ctx.restore()
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

/** Stage authoring: never draw a fill that vanishes into the document background. */
function visibleOnStage(style: ItemStyle, bg: string): ItemStyle {
  let { fill, stroke, strokeWidth } = style
  if (tooClose(fill, bg)) {
    if (!stroke || tooClose(stroke, bg)) {
      stroke = '#111111'
      strokeWidth = Math.max(strokeWidth || 0, 2)
    }
  }
  return { fill, stroke, strokeWidth }
}

const imageCache = new Map<string, HTMLImageElement>()
const imageWaiters = new Set<() => void>()

export function subscribeFillImages(fn: () => void): () => void {
  imageWaiters.add(fn)
  return () => imageWaiters.delete(fn)
}

export function getFillImage(src: string | null | undefined): HTMLImageElement | null {
  if (!src) return null
  let im = imageCache.get(src)
  if (!im) {
    im = new Image()
    im.onload = () => {
      for (const w of [...imageWaiters]) w()
    }
    im.src = src
    imageCache.set(src, im)
  }
  return im.complete && im.naturalWidth > 0 ? im : null
}

function exportItemStyle(it: RectItemJson, bg: string): ItemStyle {
  const fill = it.fill || '#ffffff'
  let stroke = it.stroke
  let sw = it.stroke_width
  if ((!stroke || tooClose(stroke, bg)) && tooClose(fill, bg)) {
    stroke = '#111111'
    sw = Math.max(sw || 0, 1.5)
  }
  return { fill, stroke, strokeWidth: sw }
}

/** Mix a fill toward `tint` and bake `alpha` into rgba (no ctx.globalAlpha). */
export function tintFill(src: string, tint: string, alpha: number): string {
  const [sr, sg, sb] = parseColor(src)
  const [tr, tg, tb] = parseColor(tint)
  const r = Math.round(sr * (1 - 0.55) + tr * 0.55)
  const g = Math.round(sg * (1 - 0.55) + tg * 0.55)
  const b = Math.round(sb * (1 - 0.55) + tb * 0.55)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function parseColor(c: string): [number, number, number] {
  const s = c.trim()
  if (s.startsWith('#') && (s.length === 7 || s.length === 4)) {
    if (s.length === 4) {
      const r = parseInt(s[1] + s[1], 16)
      const g = parseInt(s[2] + s[2], 16)
      const b = parseInt(s[3] + s[3], 16)
      return [r, g, b]
    }
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
  }
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  return [180, 180, 180]
}

function drawRectItem(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  it: RectItemJson,
  off: Pt,
  style: ItemStyle,
  fillImage?: string | null,
): void {
  const cx = it.x + it.w / 2 + off.x
  const cy = it.y + it.h / 2 + off.y
  const p = docToScreen(vp, cx, cy)
  const w = it.w * vp.zoom
  const h = it.h * vp.zoom
  ctx.save()
  ctx.translate(p.x, p.y)
  if (it.rotation !== 0) ctx.rotate((it.rotation * Math.PI) / 180)
  if (it.shape === 'oval') {
    // T2B.5: the ellipse INSCRIBED in the item's bounding box — the exact same
    // geometry the engine hit-tests and the SVG <ellipse> export emits.
    ctx.beginPath()
    ctx.ellipse(0, 0, Math.max(0, w / 2), Math.max(0, h / 2), 0, 0, Math.PI * 2)
    ctx.fillStyle = style.fill
    ctx.fill()
    const im = getFillImage(fillImage)
    if (im) {
      ctx.save()
      ctx.clip()
      ctx.drawImage(im, -w / 2, -h / 2, Math.max(1, w), Math.max(1, h))
      ctx.restore()
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke
      ctx.lineWidth = Math.max(1, style.strokeWidth * vp.zoom)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = style.fill
    ctx.fillRect(-w / 2, -h / 2, w, h)
    const im = getFillImage(fillImage)
    if (im) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(-w / 2, -h / 2, w, h)
      ctx.clip()
      ctx.drawImage(im, -w / 2, -h / 2, Math.max(1, w), Math.max(1, h))
      ctx.restore()
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke
      ctx.lineWidth = Math.max(1, style.strokeWidth * vp.zoom)
      ctx.strokeRect(-w / 2, -h / 2, w, h)
    }
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
  /** Optional ink overlay (Pen/Pencil/Brush/Text) — omitted in legacy tests. */
  inkItems?: InkItem[]
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
    drawRectItem(ctx, vp, it, { x: 0, y: 0 }, exportItemStyle(it, s.background))
  }
  if (s.inkItems && s.inkItems.length > 0) {
    drawInkItems(ctx, vp, s.inkItems, [], null, s.background)
  }
}

/** Serialize ink objects as SVG fragments (no chrome) so File ▸ Export includes
 *  Pen/Pencil/Brush/Text — the Rust exporter still only knows rect/oval. */
export function inkToSvg(items: InkItem[], background = '#ffffff'): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const parts: string[] = []
  for (const it of items) {
    if (it.kind === 'text') {
      const p = it.points[0] ?? { x: 0, y: 0 }
      const fam = esc(it.fontFamily || 'system-ui,sans-serif')
      const weight = it.fontWeight === 'bold' ? 'bold' : 'normal'
      const fstyle = it.fontItalic ? 'italic' : 'normal'
      const anchor = it.textAlign === 'center' ? 'middle' : it.textAlign === 'right' ? 'end' : 'start'
      const deco = it.fontUnderline ? ' text-decoration="underline"' : ''
      const ls = it.letterSpacing ? ` letter-spacing="${it.letterSpacing}"` : ''
      const rot = it.rotation ? ` transform="rotate(${it.rotation} ${p.x} ${p.y})"` : ''
      const scx = it.scaleX ?? 1
      const scy = it.scaleY ?? 1
      const flip = scx !== 1 || scy !== 1 ? ` transform="translate(${p.x} ${p.y}) scale(${scx} ${scy}) translate(${-p.x} ${-p.y})"` : rot
      parts.push(
        `<text x="${p.x}" y="${p.y}" fill="${esc(contrastOn(it.fill, background))}" font-size="${it.fontSize ?? 18}" font-family="${fam}" font-weight="${weight}" font-style="${fstyle}" text-anchor="${anchor}"${deco}${ls}${flip}>${esc(it.text || '')}</text>`,
      )
      continue
    }
    if (it.points.length < 2) continue
    const d = pathD(it.points, it.closed)
    const sw = it.kind === 'brush' ? Math.max(it.strokeWidth, 8) : it.strokeWidth
    const fill = it.fill && it.closed ? it.fill : 'none'
    const stroke = it.stroke ?? 'none'
    parts.push(
      `<path d="${d}" fill="${esc(fill)}" stroke="${esc(stroke)}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
  }
  return parts.join('')
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

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  pts: InkPt[],
  stroke: string | null,
  strokeWidth: number,
  fill: string | null,
  closed: boolean,
): void {
  if (pts.length === 0) return
  ctx.save()
  ctx.beginPath()
  const a = docToScreen(vp, pts[0].x, pts[0].y)
  ctx.moveTo(a.x, a.y)
  const last = closed ? pts.length : pts.length - 1
  for (let i = 0; i < last; i++) {
    const A = pts[i]
    const B = pts[(i + 1) % pts.length]
    if (A.outX != null || B.inX != null) {
      const c1 = docToScreen(vp, A.outX ?? A.x, A.outY ?? A.y)
      const c2 = docToScreen(vp, B.inX ?? B.x, B.inY ?? B.y)
      const b = docToScreen(vp, B.x, B.y)
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y)
    } else {
      const b = docToScreen(vp, B.x, B.y)
      ctx.lineTo(b.x, b.y)
    }
  }
  if (closed) ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = Math.max(1, strokeWidth * vp.zoom)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.restore()
}

function drawInkItems(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  items: InkItem[],
  selectedIds: number[],
  preview: { x: number; y: number } | null,
  background?: string,
  inkAnchors?: Array<{ id: number; index: number }>,
  showAnchors?: boolean,
  extras?: RenderState['objExtras'],
): void {
  const sel = new Set(selectedIds)
  const picked = new Set((inkAnchors ?? []).map((a) => `${a.id}:${a.index}`))
  for (const it of items) {
    const off = preview && sel.has(it.id) ? preview : { x: 0, y: 0 }
    const pts = it.points.map((p) => ({
      ...p,
      x: p.x + off.x,
      y: p.y + off.y,
      inX: p.inX != null ? p.inX + off.x : undefined,
      inY: p.inY != null ? p.inY + off.y : undefined,
      outX: p.outX != null ? p.outX + off.x : undefined,
      outY: p.outY != null ? p.outY + off.y : undefined,
    }))
    const extra = extras?.[it.id]
    ctx.save()
    if (extra?.opacity != null) ctx.globalAlpha = Math.max(0, Math.min(1, extra.opacity / 100))
    if (it.kind === 'text') {
      drawInkText(ctx, vp, it, pts[0] ?? { x: 0, y: 0 }, background ?? '#ffffff')
    } else {
      const sw = it.kind === 'brush' ? Math.max(it.strokeWidth, 8) : it.strokeWidth
      const vis = visibleOnStage({ fill: it.fill ?? 'transparent', stroke: it.stroke, strokeWidth: sw }, background ?? '#ffffff')
      drawPolyline(ctx, vp, pts, vis.stroke, vis.strokeWidth, it.fill, it.closed)
      const im = getFillImage(extra?.fillImage)
      if (im && it.closed && pts.length >= 3) {
        const b = { x: Math.min(...pts.map((p) => p.x)), y: Math.min(...pts.map((p) => p.y)), w: 0, h: 0 }
        b.w = Math.max(...pts.map((p) => p.x)) - b.x
        b.h = Math.max(...pts.map((p) => p.y)) - b.y
        const tl = docToScreen(vp, b.x, b.y)
        ctx.save()
        ctx.beginPath()
        const a0 = docToScreen(vp, pts[0].x, pts[0].y)
        ctx.moveTo(a0.x, a0.y)
        for (let i = 1; i < pts.length; i++) {
          const q = docToScreen(vp, pts[i].x, pts[i].y)
          ctx.lineTo(q.x, q.y)
        }
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(im, tl.x, tl.y, Math.max(1, b.w * vp.zoom), Math.max(1, b.h * vp.zoom))
        ctx.restore()
      }
    }
    ctx.restore()
    if (it.kind !== 'text' && (sel.has(it.id) || showAnchors)) {
      pts.forEach((p, i) => {
        const hot = picked.has(`${it.id}:${i}`)
        const s = docToScreen(vp, p.x, p.y)
        if (hot && (p.inX != null || p.outX != null)) {
          ctx.strokeStyle = '#c9a227'
          ctx.lineWidth = 1
          ctx.beginPath()
          if (p.inX != null && p.inY != null) {
            const h = docToScreen(vp, p.inX, p.inY)
            ctx.moveTo(s.x, s.y)
            ctx.lineTo(h.x, h.y)
            ctx.fillStyle = '#c9a227'
            ctx.fillRect(h.x - 3, h.y - 3, 6, 6)
          }
          if (p.outX != null && p.outY != null) {
            const h = docToScreen(vp, p.outX, p.outY)
            ctx.moveTo(s.x, s.y)
            ctx.lineTo(h.x, h.y)
            ctx.fillStyle = '#c9a227'
            ctx.fillRect(h.x - 3, h.y - 3, 6, 6)
          }
          ctx.stroke()
        }
        ctx.fillStyle = hot ? '#0a7cff' : '#ffffff'
        ctx.strokeStyle = SELECTION_STROKE
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect(s.x - 3.5, s.y - 3.5, 7, 7)
        ctx.fill()
        ctx.stroke()
      })
    }
  }
}

function drawInkText(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  it: InkItem,
  origin: InkPt,
  background: string,
): void {
  const z = vp.zoom
  const size = Math.max(1, (it.fontSize ?? 18) * z)
  const local = textLocalBox({ ...it, points: [origin], rotation: 0, scaleX: 1, scaleY: 1 })
  const ox = (local.x + local.w / 2 - origin.x) * z
  const oy = (local.y + local.h / 2 - origin.y) * z
  const p = docToScreen(vp, origin.x, origin.y)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.translate(ox, oy)
  const rot = it.rotation ?? 0
  if (rot) ctx.rotate((rot * Math.PI) / 180)
  const sx = it.scaleX ?? 1
  const sy = it.scaleY ?? 1
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy)
  ctx.translate(-ox, -oy)
  ctx.fillStyle = contrastOn(it.fill, background)
  const fam = it.fontFamily || 'system-ui, sans-serif'
  const weight = it.fontWeight === 'bold' ? 'bold' : 'normal'
  const italic = it.fontItalic ? 'italic' : 'normal'
  ctx.font = `${italic} ${weight} ${size}px ${fam}`
  ctx.textAlign = it.textAlign === 'center' || it.textAlign === 'right' ? it.textAlign : 'left'
  ctx.textBaseline = 'alphabetic'
  if (it.letterSpacing) {
    try {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(it.letterSpacing ?? 0) * z}px`
    } catch {
      /* ignore */
    }
  }
  const lines = (it.text || '').split('\n')
  const lh = size * 1.25
  lines.forEach((line, i) => {
    const y = i * lh
    ctx.fillText(line, 0, y)
    if (it.fontUnderline) {
      const w = ctx.measureText(line).width
      let x0 = 0
      if (it.textAlign === 'center') x0 = -w / 2
      if (it.textAlign === 'right') x0 = -w
      ctx.strokeStyle = ctx.fillStyle as string
      ctx.lineWidth = Math.max(1, size / 16)
      ctx.beginPath()
      ctx.moveTo(x0, y + 2)
      ctx.lineTo(x0 + w, y + 2)
      ctx.stroke()
    }
  })
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

function drawRectPreview(ctx: CanvasRenderingContext2D, vp: Viewport, r: { x: number; y: number; w: number; h: number; shape?: 'rect' | 'oval' }): void {
  ctx.fillStyle = 'rgba(63, 155, 245, 0.2)'
  ctx.strokeStyle = '#3f9bf5'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  if (r.shape === 'oval') {
    // T2B.5: rubber-band = the ellipse itself, not its bounding box.
    const c = docToScreen(vp, r.x + r.w / 2, r.y + r.h / 2)
    ctx.beginPath()
    ctx.ellipse(c.x, c.y, Math.max(0, (r.w / 2) * vp.zoom), Math.max(0, (r.h / 2) * vp.zoom), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
    return
  }
  const p = docToScreen(vp, r.x, r.y)
  ctx.fillRect(p.x, p.y, r.w * vp.zoom, r.h * vp.zoom)
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

  // Selection tool: dashed box only (Adobe black arrow). Handles are Free Transform.
  if (o.handles.length === 0) return

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
