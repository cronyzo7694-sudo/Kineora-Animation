// Adobe-style shape library (Rectangle flyout + PolyStar + extras).
// Built-ins are unit-box paths (0..1). Custom shapes are user-saved paths.

import type { InkPt } from './inkStore'

export type ShapeId =
  | 'rect'
  | 'roundrect'
  | 'oval'
  | 'ring'
  | 'triangle'
  | 'rtriangle'
  | 'diamond'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'polygon'
  | 'star4'
  | 'star5'
  | 'star6'
  | 'polystar'
  | 'arrow'
  | 'chevron'
  | 'cross'
  | 'plus'
  | 'heart'
  | 'burst'
  | 'speech'
  | `custom:${string}`

export interface ShapeDef {
  id: ShapeId
  label: string
  group: 'basic' | 'poly' | 'star' | 'symbol' | 'custom'
}

export const BUILTIN_SHAPES: ShapeDef[] = [
  { id: 'rect', label: 'Rectangle', group: 'basic' },
  { id: 'roundrect', label: 'Rounded Rectangle', group: 'basic' },
  { id: 'oval', label: 'Oval', group: 'basic' },
  { id: 'ring', label: 'Ring', group: 'basic' },
  { id: 'triangle', label: 'Triangle', group: 'poly' },
  { id: 'rtriangle', label: 'Right Triangle', group: 'poly' },
  { id: 'diamond', label: 'Diamond', group: 'poly' },
  { id: 'parallelogram', label: 'Parallelogram', group: 'poly' },
  { id: 'trapezoid', label: 'Trapezoid', group: 'poly' },
  { id: 'pentagon', label: 'Pentagon', group: 'poly' },
  { id: 'hexagon', label: 'Hexagon', group: 'poly' },
  { id: 'octagon', label: 'Octagon', group: 'poly' },
  { id: 'polygon', label: 'Polygon', group: 'poly' },
  { id: 'star4', label: '4-Point Star', group: 'star' },
  { id: 'star5', label: '5-Point Star', group: 'star' },
  { id: 'star6', label: '6-Point Star', group: 'star' },
  { id: 'arrow', label: 'Arrow', group: 'symbol' },
  { id: 'chevron', label: 'Chevron', group: 'symbol' },
  { id: 'cross', label: 'Cross', group: 'symbol' },
  { id: 'plus', label: 'Plus', group: 'symbol' },
  { id: 'heart', label: 'Heart', group: 'symbol' },
  { id: 'burst', label: 'Burst', group: 'symbol' },
  { id: 'speech', label: 'Speech', group: 'symbol' },
]

export interface CustomShape {
  id: string
  name: string
  /** Unit-box points 0..1 */
  points: InkPt[]
}

const CUSTOM_KEY = 'kineora.customShapes'
const listeners = new Set<() => void>()

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribeCustomShapes(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function listCustomShapes(): CustomShape[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomShape[]
    return Array.isArray(parsed) ? parsed.filter((s) => s && Array.isArray(s.points)) : []
  } catch {
    return []
  }
}

export function saveCustomShape(name: string, points: InkPt[]): CustomShape | null {
  const clean = name.trim()
  if (!clean || points.length < 3) return null
  const unit = normalizeToUnit(points)
  const rec: CustomShape = { id: `c${Date.now().toString(36)}`, name: clean, points: unit }
  const next = [...listCustomShapes().filter((s) => s.name !== clean), rec]
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
  } catch {
    return null
  }
  emit()
  return rec
}

export function deleteCustomShape(id: string): void {
  const next = listCustomShapes().filter((s) => s.id !== id)
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  emit()
}

export function normalizeToUnit(pts: InkPt[]): InkPt[] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const w = Math.max(1e-6, maxX - minX)
  const h = Math.max(1e-6, maxY - minY)
  return pts.map((p) => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }))
}

function poly(n: number, startDeg = -90): InkPt[] {
  const out: InkPt[] = []
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (360 * i) / n) * Math.PI) / 180
    out.push({ x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) })
  }
  return out
}

function star(points: number, inner = 0.45, startDeg = -90): InkPt[] {
  const out: InkPt[] = []
  const n = points * 2
  for (let i = 0; i < n; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.5 * inner
    const a = ((startDeg + (360 * i) / n) * Math.PI) / 180
    out.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) })
  }
  return out
}

function ovalPts(steps = 32): InkPt[] {
  return poly(steps, 0)
}

function roundRect(rx: number): InkPt[] {
  const r = Math.max(0.02, Math.min(0.49, rx))
  const s = 6
  const corner = (cx: number, cy: number, a0: number) => {
    const pts: InkPt[] = []
    for (let i = 0; i <= s; i++) {
      const a = ((a0 + (90 * i) / s) * Math.PI) / 180
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
    }
    return pts
  }
  return [
    ...corner(1 - r, r, 270),
    ...corner(1 - r, 1 - r, 0),
    ...corner(r, 1 - r, 90),
    ...corner(r, r, 180),
  ]
}

export function unitPath(
  id: string,
  opts: { sides?: number; inner?: number; corner?: number } = {},
): InkPt[] {
  const sides = Math.max(3, Math.min(32, Math.round(opts.sides ?? 5)))
  const inner = Math.max(0.1, Math.min(0.9, opts.inner ?? 0.45))
  const corner = Math.max(0, Math.min(0.49, (opts.corner ?? 20) / 100))
  if (id.startsWith('custom:')) {
    const cid = id.slice(7)
    const found = listCustomShapes().find((s) => s.id === cid)
    return found ? found.points.map((p) => ({ ...p })) : poly(4, 45)
  }
  switch (id) {
    case 'rect':
      return [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]
    case 'roundrect':
      return roundRect(corner)
    case 'oval':
      return ovalPts()
    case 'ring':
      return ovalPts()
    case 'triangle':
      return [
        { x: 0.5, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]
    case 'rtriangle':
      return [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]
    case 'diamond':
      return [
        { x: 0.5, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 1 },
        { x: 0, y: 0.5 },
      ]
    case 'parallelogram':
      return [
        { x: 0.2, y: 0 },
        { x: 1, y: 0 },
        { x: 0.8, y: 1 },
        { x: 0, y: 1 },
      ]
    case 'trapezoid':
      return [
        { x: 0.2, y: 0 },
        { x: 0.8, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]
    case 'pentagon':
      return poly(5)
    case 'hexagon':
      return poly(6)
    case 'octagon':
      return poly(8)
    case 'star4':
      return star(4, inner)
    case 'star5':
      return star(5, inner)
    case 'star6':
      return star(6, inner)
    case 'arrow':
      return [
        { x: 0, y: 0.3 },
        { x: 0.6, y: 0.3 },
        { x: 0.6, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.6, y: 1 },
        { x: 0.6, y: 0.7 },
        { x: 0, y: 0.7 },
      ]
    case 'chevron':
      return [
        { x: 0, y: 0 },
        { x: 0.7, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.7, y: 1 },
        { x: 0, y: 1 },
        { x: 0.3, y: 0.5 },
      ]
    case 'cross':
      return [
        { x: 0.35, y: 0 },
        { x: 0.65, y: 0 },
        { x: 0.65, y: 0.35 },
        { x: 1, y: 0.35 },
        { x: 1, y: 0.65 },
        { x: 0.65, y: 0.65 },
        { x: 0.65, y: 1 },
        { x: 0.35, y: 1 },
        { x: 0.35, y: 0.65 },
        { x: 0, y: 0.65 },
        { x: 0, y: 0.35 },
        { x: 0.35, y: 0.35 },
      ]
    case 'plus':
      return [
        { x: 0.4, y: 0 },
        { x: 0.6, y: 0 },
        { x: 0.6, y: 0.4 },
        { x: 1, y: 0.4 },
        { x: 1, y: 0.6 },
        { x: 0.6, y: 0.6 },
        { x: 0.6, y: 1 },
        { x: 0.4, y: 1 },
        { x: 0.4, y: 0.6 },
        { x: 0, y: 0.6 },
        { x: 0, y: 0.4 },
        { x: 0.4, y: 0.4 },
      ]
    case 'heart':
      return [
        { x: 0.5, y: 0.95 },
        { x: 0.08, y: 0.55 },
        { x: 0.05, y: 0.28 },
        { x: 0.22, y: 0.08 },
        { x: 0.42, y: 0.12 },
        { x: 0.5, y: 0.28 },
        { x: 0.58, y: 0.12 },
        { x: 0.78, y: 0.08 },
        { x: 0.95, y: 0.28 },
        { x: 0.92, y: 0.55 },
      ]
    case 'burst':
      return star(12, 0.55)
    case 'speech':
      return [
        { x: 0.08, y: 0.08 },
        { x: 0.92, y: 0.08 },
        { x: 0.92, y: 0.62 },
        { x: 0.38, y: 0.62 },
        { x: 0.18, y: 0.92 },
        { x: 0.28, y: 0.62 },
        { x: 0.08, y: 0.62 },
      ]
    case 'polystar':
      return star(sides, inner)
    case 'polygon':
      return poly(sides)
    default:
      return poly(4, 45)
  }
}

export function shapeInBox(
  id: string,
  box: { x: number; y: number; w: number; h: number },
  opts?: { sides?: number; inner?: number; corner?: number },
): InkPt[] {
  return unitPath(id, opts).map((p) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h }))
}

export function isEngineShape(id: string): id is 'rect' | 'oval' {
  return id === 'rect' || id === 'oval'
}

export function shapeLabel(id: string): string {
  if (id.startsWith('custom:')) {
    const f = listCustomShapes().find((s) => s.id === id.slice(7))
    return f?.name ?? 'Custom'
  }
  return BUILTIN_SHAPES.find((s) => s.id === id)?.label ?? id
}
