// Adobe Brush (B) — helpx “Paint with the Brush tool”:
// fill paint (not a stroke), size + shape, Shift constrains H/V,
// Smoothing in Properties, Zoom size with Stage.

import { type InkPt } from './inkStore'
import { processPencil } from './pencil'

export type BrushMode = 'normal' | 'fills' | 'behind' | 'selection' | 'inside'
export type BrushShape = 'circle' | 'oval' | 'square' | 'rect' | 'diamond'

export function brushDocSize(size: number, zoom: number, zoomWithStage: boolean): number {
  const s = Math.max(8, size)
  if (zoomWithStage !== false) return s
  return Math.max(4, s / Math.max(0.05, zoom))
}

export function constrainBrush(first: InkPt, p: InkPt): InkPt {
  const dx = Math.abs(p.x - first.x)
  const dy = Math.abs(p.y - first.y)
  return dx > dy ? { x: p.x, y: first.y } : { x: first.x, y: p.y }
}

/** Closed fill outline of a brush stamp trail (Adobe paints a fill). */
export function brushRibbon(
  raw: InkPt[],
  radius: number,
  shape: BrushShape = 'circle',
  angleDeg = 0,
  smooth = 50,
): InkPt[] {
  const pts = processPencil(raw, 'smooth', smooth)
  if (pts.length === 0) return []
  const r = Math.max(2, radius)
  const aspect = shape === 'oval' || shape === 'rect' ? 0.55 : 1
  const diamond = shape === 'diamond'
  const squareish = shape === 'square' || shape === 'rect' || diamond
  const rot = ((diamond ? angleDeg + 45 : angleDeg) * Math.PI) / 180
  if (pts.length === 1) return stampOutline(pts[0], r, aspect, rot, squareish)

  const left: InkPt[] = []
  const right: InkPt[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    let nx = a.y - b.y
    let ny = b.x - a.x
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    const ox = nx * r
    const oy = ny * r * aspect
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    const rx = ox * c - oy * s
    const ry = ox * s + oy * c
    left.push({ x: pts[i].x + rx, y: pts[i].y + ry })
    right.push({ x: pts[i].x - rx, y: pts[i].y - ry })
  }
  return left.concat(right.reverse())
}

function stampOutline(p: InkPt, r: number, aspect: number, rot: number, square: boolean): InkPt[] {
  const n = square ? 4 : 16
  const out: InkPt[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + (square ? Math.PI / 4 : 0)
    const lx = Math.cos(t) * r
    const ly = Math.sin(t) * r * aspect
    out.push({ x: p.x + lx * Math.cos(rot) - ly * Math.sin(rot), y: p.y + lx * Math.sin(rot) + ly * Math.cos(rot) })
  }
  return out
}

export function clipPtsToRect(
  pts: InkPt[],
  box: { x: number; y: number; w: number; h: number },
): InkPt[] {
  return pts.filter((p) => p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h)
}
