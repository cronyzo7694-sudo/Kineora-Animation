// Adobe Pencil (Y) — helpx “Draw lines and shapes with Adobe Animate”:
// Straighten / Smooth / Ink. Smooth slider 0–100 only in Smooth mode.

import { distToSegment, simplifyPolyline, type InkPt } from './inkStore'

export type PencilMode = 'straighten' | 'smooth' | 'ink'

export function processPencil(pts: InkPt[], mode: PencilMode, smooth = 50, recognize = true): InkPt[] {
  if (pts.length < 2) return pts.slice()
  if (mode === 'ink') return simplifyPolyline(pts, 0.55)
  if (mode === 'smooth') return smoothStroke(pts, smooth)
  return straighten(pts, recognize)
}

function smoothStroke(pts: InkPt[], smooth: number): InkPt[] {
  const amt = Math.max(0, Math.min(100, smooth))
  if (amt <= 2) return simplifyPolyline(pts, 0.6)
  const passes = amt < 20 ? 1 : amt < 45 ? 2 : amt < 70 ? 3 : amt < 90 ? 4 : 5
  let out = pts.slice()
  for (let i = 0; i < passes; i++) out = chaikin(out)
  const eps = 0.45 + (amt / 100) * 5.2
  return simplifyPolyline(out, eps)
}

/** Chaikin corner-cutting — Adobe Smooth feel. */
function chaikin(pts: InkPt[]): InkPt[] {
  if (pts.length < 3) return pts.slice()
  const out: InkPt[] = [pts[0]]
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 })
    out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
  }
  out.push(pts[pts.length - 1])
  return out
}

function straighten(pts: InkPt[], recognize: boolean): InkPt[] {
  if (recognize) {
    const shape = recognizeShape(pts)
    if (shape) return shape
  }
  const a = pts[0]
  const b = pts[pts.length - 1]
  let maxD = 0
  for (const p of pts) maxD = Math.max(maxD, distToSegment(p, a, b))
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (maxD < Math.max(6, len * 0.08)) {
    return [a, snap45(a, b)]
  }
  const coarse = simplifyPolyline(pts, Math.max(7, len * 0.1))
  const out: InkPt[] = [coarse[0]]
  for (let i = 1; i < coarse.length; i++) out.push(snap45(out[out.length - 1], coarse[i]))
  return mergeColinear(out)
}

function mergeColinear(pts: InkPt[]): InkPt[] {
  if (pts.length < 3) return pts
  const out: InkPt[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1]
    const b = pts[i]
    const c = pts[i + 1]
    const ab = Math.atan2(b.y - a.y, b.x - a.x)
    const bc = Math.atan2(c.y - b.y, c.x - b.x)
    let d = Math.abs(ab - bc)
    while (d > Math.PI) d = Math.abs(d - Math.PI * 2)
    if (d > 0.12) out.push(b)
  }
  out.push(pts[pts.length - 1])
  return out
}

function snap45(from: InkPt, to: InkPt): InkPt {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const ang = Math.atan2(dy, dx)
  const snap = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
  const len = Math.hypot(dx, dy)
  return { x: from.x + Math.cos(snap) * len, y: from.y + Math.sin(snap) * len }
}

function bbox(pts: InkPt[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of pts) {
    x0 = Math.min(x0, p.x)
    y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x)
    y1 = Math.max(y1, p.y)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

function closedEnough(pts: InkPt[]): boolean {
  const a = pts[0]
  const b = pts[pts.length - 1]
  const box = bbox(pts)
  const span = Math.max(box.w, box.h, 1)
  return Math.hypot(b.x - a.x, b.y - a.y) < span * 0.22
}

/** Adobe Straighten: triangles / ovals / rectangles from a rough loop. */
export function recognizeShape(pts: InkPt[]): InkPt[] | null {
  if (pts.length < 8 || !closedEnough(pts)) return null
  const box = bbox(pts)
  if (box.w < 8 || box.h < 8) return null
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const rx = box.w / 2
  const ry = box.h / 2
  let ovalErr = 0
  let rectErr = 0
  for (const p of pts) {
    const nx = (p.x - cx) / rx
    const ny = (p.y - cy) / ry
    ovalErr += Math.abs(nx * nx + ny * ny - 1)
    const dx = Math.min(Math.abs(p.x - box.x), Math.abs(p.x - (box.x + box.w)))
    const dy = Math.min(Math.abs(p.y - box.y), Math.abs(p.y - (box.y + box.h)))
    rectErr += Math.min(dx, dy)
  }
  ovalErr /= pts.length
  rectErr /= pts.length
  const span = Math.max(box.w, box.h)
  if (ovalErr < 0.28 && ovalErr * span < rectErr * 1.4) {
    const n = 24
    const oval: InkPt[] = []
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2
      oval.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry })
    }
    return oval
  }
  if (rectErr < span * 0.08) {
    return [
      { x: box.x, y: box.y },
      { x: box.x + box.w, y: box.y },
      { x: box.x + box.w, y: box.y + box.h },
      { x: box.x, y: box.y + box.h },
    ]
  }
  const corners = simplifyPolyline(pts, Math.max(10, span * 0.14))
  if (corners.length === 4 || corners.length === 3) {
    const loop = corners.slice()
    if (Math.hypot(loop[0].x - loop[loop.length - 1].x, loop[0].y - loop[loop.length - 1].y) > 4) {
      /* keep open-ish triangle/rect */
    }
    return loop
  }
  return null
}

export function dashForStyle(style: 'solid' | 'dashed' | 'dotted' | undefined, width: number): number[] | undefined {
  if (style === 'dashed') return [Math.max(6, width * 3), Math.max(4, width * 2)]
  if (style === 'dotted') return [Math.max(1, width * 0.35), Math.max(3, width * 1.6)]
  return undefined
}
