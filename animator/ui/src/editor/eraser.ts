// Adobe Eraser (E) — helpx “Reshape lines and shapes”:
// Erase Normal / Fills / Lines / Selected Fills / Inside, Faucet click,
// Eraser Shape + size. Pressure/Tilt only with a stylus (not invented here).
// Engine cannot boolean-punch a fill; intersecting objects are deleted.

import { distToSegment, listInk, pointInPoly, selectedInkIds, type InkItem, type InkPt } from './inkStore'

export type EraserMode = 'normal' | 'fills' | 'lines' | 'selected' | 'inside'
export type EraserShape = 'circle' | 'oval' | 'square' | 'rect' | 'diamond'

export function inkIsFill(it: InkItem): boolean {
  if (it.kind === 'text') return true
  if (it.kind === 'brush') return true
  return !!(it.closed && it.fill)
}

export function inkIsStroke(it: InkItem): boolean {
  if (it.kind === 'text') return false
  if (it.kind === 'brush') return false
  return !!(it.stroke && it.strokeWidth > 0)
}

export function eraserRadius(size: number, shape: EraserShape): { rx: number; ry: number } {
  const r = Math.max(2, size / 2)
  const aspect = shape === 'oval' || shape === 'rect' ? 0.55 : 1
  return { rx: r, ry: r * aspect }
}

function nearPath(pt: InkPt, path: InkPt[], rx: number, ry: number): boolean {
  const r = Math.max(rx, ry)
  if (path.length === 1) return Math.hypot(pt.x - path[0].x, pt.y - path[0].y) <= r
  for (let i = 1; i < path.length; i++) {
    if (distToSegment(pt, path[i - 1], path[i]) <= r) return true
  }
  return false
}

function strokeHitsPath(it: InkItem, path: InkPt[], r: number): boolean {
  if (it.points.length === 0) return false
  if (it.points.length === 1) return nearPath(it.points[0], path, r, r)
  for (let i = 1; i < it.points.length; i++) {
    const a = it.points[i - 1]
    const b = it.points[i]
    for (const p of path) {
      if (distToSegment(p, a, b) <= r + (it.strokeWidth || 0) / 2) return true
    }
  }
  return false
}

function fillHitsPath(it: InkItem, path: InkPt[], r: number): boolean {
  if (it.kind === 'text') return it.points.some((p) => nearPath(p, path, r, r))
  if (it.closed && it.fill && it.points.length >= 3) {
    return path.some((p) => pointInPoly(p, it.points) || nearPath(p, it.points, r, r))
  }
  if (it.kind === 'brush') return strokeHitsPath(it, path, r)
  return false
}

export function collectEraserHits(
  path: InkPt[],
  mode: EraserMode,
  size: number,
  startInsideId: number | null,
): number[] {
  const r = Math.max(2, size / 2)
  const sel = new Set(selectedInkIds())
  const out: number[] = []
  for (const it of listInk()) {
    const fill = inkIsFill(it)
    const stroke = inkIsStroke(it)
    if (mode === 'fills' && !fill) continue
    if (mode === 'lines' && !stroke) continue
    if (mode === 'selected' && !(fill && sel.has(it.id))) continue
    if (mode === 'inside') {
      if (!fill || startInsideId == null || it.id !== startInsideId) continue
    }
    const hit = fill && !stroke ? fillHitsPath(it, path, r) : strokeHitsPath(it, path, r) || (fill && fillHitsPath(it, path, r))
    if (hit) out.push(it.id)
  }
  return out
}

export function faucetTarget(x: number, y: number, mode: EraserMode): InkItem | null {
  const p = { x, y }
  const sel = new Set(selectedInkIds())
  const items = listInk()
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    const fill = inkIsFill(it)
    const stroke = inkIsStroke(it)
    if (mode === 'fills' && !fill) continue
    if (mode === 'lines' && !stroke) continue
    if (mode === 'selected' && !(fill && sel.has(it.id))) continue
    if (mode === 'inside' && !fill) continue
    if (fill && it.closed && it.fill && it.points.length >= 3 && pointInPoly(p, it.points)) return it
    if (fill && it.kind === 'text') {
      const q = it.points[0]
      if (q && Math.hypot(x - q.x, y - q.y) < (it.fontSize ?? 18)) return it
    }
    if (stroke && strokeHitsPath(it, [p], Math.max(4, (it.strokeWidth || 1) / 2 + 3))) return it
    if (it.kind === 'brush' && strokeHitsPath(it, [p], Math.max(4, (it.strokeWidth || 8) / 2))) return it
  }
  return null
}
