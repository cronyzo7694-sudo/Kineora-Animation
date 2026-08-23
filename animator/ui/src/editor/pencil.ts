// Adobe Pencil modes: Straighten / Smooth / Ink (helpx Draw lines and shapes).

import { distToSegment, simplifyPolyline, type InkPt } from './inkStore'

export type PencilMode = 'straighten' | 'smooth' | 'ink'

export function processPencil(pts: InkPt[], mode: PencilMode, smooth = 50): InkPt[] {
  if (pts.length < 2) return pts.slice()
  if (mode === 'ink') return simplifyPolyline(pts, 0.7)
  if (mode === 'smooth') {
    const amt = Math.max(0, Math.min(100, smooth))
    const passes = amt < 15 ? 0 : amt < 40 ? 1 : amt < 70 ? 2 : 3
    let out = pts.slice()
    for (let i = 0; i < passes; i++) out = movingAverage(out)
    const eps = 0.8 + (amt / 100) * 4
    return simplifyPolyline(out, eps)
  }
  return straighten(pts)
}

function movingAverage(pts: InkPt[]): InkPt[] {
  if (pts.length < 3) return pts.slice()
  const out: InkPt[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    out.push({
      x: (pts[i - 1].x + pts[i].x + pts[i + 1].x) / 3,
      y: (pts[i - 1].y + pts[i].y + pts[i + 1].y) / 3,
    })
  }
  out.push(pts[pts.length - 1])
  return out
}

function straighten(pts: InkPt[]): InkPt[] {
  const a = pts[0]
  const b = pts[pts.length - 1]
  let maxD = 0
  for (const p of pts) maxD = Math.max(maxD, distToSegment(p, a, b))
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (maxD < Math.max(6, len * 0.08)) {
    return [snap45(a, a), snap45(a, b)]
  }
  const coarse = simplifyPolyline(pts, Math.max(8, len * 0.12))
  const out: InkPt[] = [coarse[0]]
  for (let i = 1; i < coarse.length; i++) out.push(snap45(out[out.length - 1], coarse[i]))
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
