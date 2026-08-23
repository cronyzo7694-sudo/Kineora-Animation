// Adobe Eraser (E) — helpx “Reshape lines and shapes”:
// Drag subtracts the nib from fills and cuts the crossed portion of a stroke.
// Faucet click still deletes a whole fill or stroke segment.

import { brushRibbon } from './brush'
import {
  distToSegment,
  listInk,
  pointInPoly,
  replaceInk,
  selectedInkIds,
  type InkItem,
  type InkPt,
} from './inkStore'

export type EraserMode = 'normal' | 'fills' | 'lines' | 'selected' | 'inside'
export type EraserShape = 'circle' | 'oval' | 'square' | 'rect' | 'diamond'

export function inkIsFill(it: InkItem): boolean {
  if (it.kind === 'text') return true
  if (it.kind === 'brush') return true
  return !!(it.closed && it.fill)
}

export function inkIsStroke(it: InkItem): boolean {
  if (it.kind === 'text') return false
  if (it.kind === 'brush' && it.fill && it.closed) return false
  return !!(it.stroke && it.strokeWidth > 0)
}

export function eraserRadius(size: number, shape: EraserShape): { rx: number; ry: number } {
  const r = Math.max(2, size / 2)
  const aspect = shape === 'oval' || shape === 'rect' ? 0.55 : 1
  return { rx: r, ry: r * aspect }
}

export function distToPath(pt: InkPt, path: InkPt[]): number {
  if (path.length === 0) return Infinity
  if (path.length === 1) return Math.hypot(pt.x - path[0].x, pt.y - path[0].y)
  let best = Infinity
  for (let i = 1; i < path.length; i++) {
    best = Math.min(best, distToSegment(pt, path[i - 1], path[i]))
  }
  return best
}

export function densifyPath(pts: InkPt[], step = 2): InkPt[] {
  if (pts.length === 0) return []
  const out: InkPt[] = [{ x: pts[0].x, y: pts[0].y }]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const n = Math.max(1, Math.ceil(d / Math.max(0.5, step)))
    for (let k = 1; k <= n; k++) {
      const t = k / n
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

/** Keep leftover open-path pieces after subtracting a circular nib trail. */
export function splitOpenPath(pts: InkPt[], erase: InkPt[], radius: number): InkPt[][] {
  if (pts.length < 2) return []
  const dense = densifyPath(pts, Math.max(1, radius / 3))
  const keep = dense.map((p) => distToPath(p, erase) > radius)
  const chunks: InkPt[][] = []
  let cur: InkPt[] = []
  for (let i = 0; i < dense.length; i++) {
    if (keep[i]) {
      cur.push(dense[i])
    } else if (cur.length) {
      if (cur.length >= 2) chunks.push(cur)
      cur = []
    }
  }
  if (cur.length >= 2) chunks.push(cur)
  return chunks
}

export function eraserHole(erase: InkPt[], size: number, shape: EraserShape): InkPt[] {
  const r = Math.max(3, size / 2)
  const path = erase.length === 1 ? [erase[0], { x: erase[0].x + 0.25, y: erase[0].y }] : erase
  return brushRibbon(path, r, shape, 0, 0)
}

function modeAllows(it: InkItem, mode: EraserMode, startInsideId: number | null): { fill: boolean; stroke: boolean } {
  const fill = inkIsFill(it)
  const stroke = inkIsStroke(it)
  const sel = new Set(selectedInkIds())
  if (mode === 'fills') return { fill, stroke: false }
  if (mode === 'lines') return { fill: false, stroke }
  if (mode === 'selected') return { fill: fill && sel.has(it.id), stroke: false }
  if (mode === 'inside') return { fill: fill && startInsideId === it.id, stroke: false }
  return { fill, stroke }
}

function cloneSansId(it: InkItem): Omit<InkItem, 'id'> {
  const { id: _id, ...rest } = it
  return {
    ...rest,
    points: it.points.map((p) => ({ ...p })),
    holes: it.holes?.map((h) => h.map((p) => ({ ...p }))),
  }
}

function fillCovered(it: InkItem, erase: InkPt[], r: number): boolean {
  if (it.points.length < 3) return distToPath(it.points[0] ?? { x: 0, y: 0 }, erase) <= r
  return it.points.every((p) => distToPath(p, erase) <= r * 1.15)
}

/** Subtract the nib from matching ink. Returns whether anything changed. */
export function applyEraserStroke(
  raw: InkPt[],
  mode: EraserMode,
  size: number,
  shape: EraserShape,
  startInsideId: number | null,
): boolean {
  const erase = densifyPath(raw.length ? raw : [], 3)
  if (erase.length === 0) return false
  const r = Math.max(3, size / 2)
  const hole = eraserHole(erase, size, shape)
  let changed = false
  for (const it of [...listInk()]) {
    const allow = modeAllows(it, mode, startInsideId)
    if (it.kind === 'text') {
      if (allow.fill && distToPath(it.points[0], erase) <= r + (it.fontSize ?? 18) * 0.35) {
        replaceInk(it.id, [])
        changed = true
      }
      continue
    }
    const isClosedFill = !!(it.closed && it.fill && it.points.length >= 3)
    if (isClosedFill && allow.fill) {
      const hits =
        erase.some((p) => pointInPoly(p, it.points) && !(it.holes ?? []).some((h) => h.length >= 3 && pointInPoly(p, h))) ||
        it.points.some((p) => distToPath(p, erase) <= r)
      if (!hits) continue
      if (fillCovered(it, erase, r)) {
        replaceInk(it.id, [])
        changed = true
        continue
      }
      const next = cloneSansId(it)
      next.holes = [...(next.holes ?? []), hole]
      replaceInk(it.id, [next])
      changed = true
      continue
    }
    if (allow.stroke || (it.kind === 'brush' && allow.fill)) {
      const pad = r + (it.strokeWidth || 0) / 2
      const near = it.points.some((p) => distToPath(p, erase) <= pad)
      if (!near) {
        for (let i = 1; i < it.points.length && !near; i++) {
          if (erase.some((p) => distToSegment(p, it.points[i - 1], it.points[i]) <= pad)) {
            /* hit */
          }
        }
      }
      const hit =
        it.points.some((p) => distToPath(p, erase) <= pad) ||
        it.points.some((p, i) => i > 0 && erase.some((e) => distToSegment(e, it.points[i - 1], p) <= pad))
      if (!hit) continue
      const pieces = splitOpenPath(it.points, erase, pad)
      if (pieces.length === 0) {
        replaceInk(it.id, [])
        changed = true
        continue
      }
      if (pieces.length === 1 && pieces[0].length === it.points.length) continue
      replaceInk(
        it.id,
        pieces.map((pts) => ({
          ...cloneSansId(it),
          points: pts,
          closed: false,
          fill: it.kind === 'brush' ? null : it.fill,
        })),
      )
      changed = true
    }
  }
  return changed
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
    if (fill && it.closed && it.fill && it.points.length >= 3 && pointInPoly(p, it.points)) {
      if (!(it.holes ?? []).some((h) => h.length >= 3 && pointInPoly(p, h))) return it
    }
    if (fill && it.kind === 'text') {
      const q = it.points[0]
      if (q && Math.hypot(x - q.x, y - q.y) < (it.fontSize ?? 18)) return it
    }
    if ((stroke || it.kind === 'brush') && distToPath(p, it.points) <= Math.max(4, (it.strokeWidth || 1) / 2 + 3)) return it
  }
  return null
}

export function engineShapeToInk(
  it: { x: number; y: number; w: number; h: number; shape?: string; fill: string; stroke: string | null; stroke_width: number },
): Omit<InkItem, 'id'> {
  const oval = it.shape === 'oval'
  const pts: InkPt[] = []
  if (oval) {
    const cx = it.x + it.w / 2
    const cy = it.y + it.h / 2
    const rx = Math.abs(it.w / 2)
    const ry = Math.abs(it.h / 2)
    for (let i = 0; i < 32; i++) {
      const t = (i / 32) * Math.PI * 2
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry })
    }
  } else {
    pts.push({ x: it.x, y: it.y }, { x: it.x + it.w, y: it.y }, { x: it.x + it.w, y: it.y + it.h }, { x: it.x, y: it.y + it.h })
  }
  return {
    kind: 'pen',
    points: pts,
    closed: true,
    fill: it.fill || '#ffffff',
    stroke: it.stroke,
    strokeWidth: it.stroke_width || 0,
  }
}

export function engineHitsEraser(
  it: { x: number; y: number; w: number; h: number },
  erase: InkPt[],
  radius: number,
): boolean {
  const cx = it.x + it.w / 2
  const cy = it.y + it.h / 2
  if (erase.some((p) => p.x >= it.x - radius && p.x <= it.x + it.w + radius && p.y >= it.y - radius && p.y <= it.y + it.h + radius)) {
    return erase.some((p) => {
      const dx = Math.max(it.x - p.x, 0, p.x - (it.x + it.w))
      const dy = Math.max(it.y - p.y, 0, p.y - (it.y + it.h))
      return Math.hypot(dx, dy) <= radius || (p.x >= it.x && p.x <= it.x + it.w && p.y >= it.y && p.y <= it.y + it.h)
    })
  }
  return distToPath({ x: cx, y: cy }, erase) <= Math.max(it.w, it.h) / 2 + radius
}
