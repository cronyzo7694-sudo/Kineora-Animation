// Authoring-side path / text objects. The WASM engine still only knows
// Rect + SymbolInstance; these tools must be usable now, so strokes and
// text live here, render on the Stage, and have their own undo stack.
// When the engine later grows Node::Path / Node::Text this store is the
// migration source (same JSON shape).

import { bus } from '../bus'

export type InkKind = 'line' | 'pencil' | 'brush' | 'pen' | 'text'

export interface InkPt {
  x: number
  y: number
}

export interface InkItem {
  id: number
  kind: InkKind
  points: InkPt[]
  closed: boolean
  fill: string | null
  stroke: string | null
  strokeWidth: number
  text?: string
  fontSize?: number
}

const ID_BASE = 1_000_000

let nextId = ID_BASE
let items: InkItem[] = []
let selected: number[] = []
const undoStack: InkItem[][] = []
const redoStack: InkItem[][] = []
const listeners = new Set<() => void>()

function snapshot(): InkItem[] {
  return items.map((it) => ({ ...it, points: it.points.map((p) => ({ ...p })) }))
}

function emit(): void {
  for (const l of listeners) l()
}

function pushUndo(): void {
  undoStack.push(snapshot())
  redoStack.length = 0
}

export function subscribeInk(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function listInk(): InkItem[] {
  return items
}

export function selectedInkIds(): number[] {
  return selected.slice()
}

export function isInkId(id: number): boolean {
  return id >= ID_BASE
}

export function resetInkForTests(): void {
  nextId = ID_BASE
  items = []
  selected = []
  undoStack.length = 0
  redoStack.length = 0
}

export function addInk(partial: Omit<InkItem, 'id'>): number {
  pushUndo()
  const id = nextId++
  items = [...items, { ...partial, id }]
  selected = [id]
  emit()
  bus.emit('document:changed', { type: 'draw', targets: [id] })
  return id
}

export function updateInk(id: number, patch: Partial<InkItem>): boolean {
  const i = items.findIndex((it) => it.id === id)
  if (i < 0) return false
  pushUndo()
  items = items.slice()
  items[i] = { ...items[i], ...patch }
  emit()
  bus.emit('document:changed', { type: 'transform', targets: [id] })
  return true
}

export function deleteInkIds(ids: number[]): boolean {
  if (ids.length === 0) return false
  const set = new Set(ids)
  if (!items.some((it) => set.has(it.id))) return false
  pushUndo()
  items = items.filter((it) => !set.has(it.id))
  selected = selected.filter((id) => !set.has(id))
  emit()
  bus.emit('document:changed', { type: 'edit', targets: ids })
  return true
}

export function selectInk(ids: number[], additive = false): void {
  selected = additive ? Array.from(new Set([...selected, ...ids])) : ids.slice()
  emit()
}

export function clearInkSelection(): void {
  if (selected.length === 0) return
  selected = []
  emit()
}

export function moveInk(ids: number[], dx: number, dy: number): void {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return
  const set = new Set(ids)
  pushUndo()
  items = items.map((it) =>
    set.has(it.id) ? { ...it, points: it.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } : it,
  )
  emit()
  bus.emit('document:changed', { type: 'transform', targets: ids })
}

export function setInkPoint(id: number, index: number, pt: InkPt): boolean {
  const it = items.find((x) => x.id === id)
  if (!it || index < 0 || index >= it.points.length) return false
  pushUndo()
  items = items.map((x) => {
    if (x.id !== id) return x
    const pts = x.points.slice()
    pts[index] = { ...pt }
    return { ...x, points: pts }
  })
  emit()
  bus.emit('document:changed', { type: 'transform', targets: [id] })
  return true
}

export function inkUndo(): boolean {
  const prev = undoStack.pop()
  if (!prev) return false
  redoStack.push(snapshot())
  items = prev
  selected = selected.filter((id) => items.some((it) => it.id === id))
  emit()
  return true
}

export function inkRedo(): boolean {
  const next = redoStack.pop()
  if (!next) return false
  undoStack.push(snapshot())
  items = next
  emit()
  return true
}

export function inkCanUndo(): boolean {
  return undoStack.length > 0
}

export function inkCanRedo(): boolean {
  return redoStack.length > 0
}

/** Distance from point to segment. */
export function distToSegment(p: InkPt, a: InkPt, b: InkPt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function pointInPoly(p: InkPt, poly: InkPt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const hit = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi
    if (hit) inside = !inside
  }
  return inside
}

export function inkBounds(it: InkItem): { x: number; y: number; w: number; h: number } {
  if (it.kind === 'text') {
    const p = it.points[0] ?? { x: 0, y: 0 }
    const w = Math.max(40, (it.text ?? '').length * (it.fontSize ?? 18) * 0.55)
    const h = (it.fontSize ?? 18) * 1.3
    return { x: p.x, y: p.y - h + 4, w, h }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of it.points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const pad = (it.strokeWidth || 1) / 2
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
}

export function hitInk(x: number, y: number): InkItem | null {
  const p = { x, y }
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    if (it.kind === 'text') {
      const b = inkBounds(it)
      if (x >= b.x && y >= b.y && x <= b.x + b.w && y <= b.y + b.h) return it
      continue
    }
    const tol = Math.max(4, (it.strokeWidth || 1) / 2 + 3)
    if (it.closed && it.fill && it.points.length >= 3 && pointInPoly(p, it.points)) return it
    for (let s = 1; s < it.points.length; s++) {
      if (distToSegment(p, it.points[s - 1], it.points[s]) <= tol) return it
    }
    if (it.closed && it.points.length > 2 && distToSegment(p, it.points[it.points.length - 1], it.points[0]) <= tol) {
      return it
    }
    if (it.points.length === 1 && Math.hypot(p.x - it.points[0].x, p.y - it.points[0].y) <= tol) return it
  }
  return null
}

export function hitInkAnchor(x: number, y: number, radius = 6): { id: number; index: number } | null {
  for (const it of items) {
    if (!selected.includes(it.id)) continue
    if (it.kind === 'text') continue
    for (let i = 0; i < it.points.length; i++) {
      if (Math.hypot(x - it.points[i].x, y - it.points[i].y) <= radius) return { id: it.id, index: i }
    }
  }
  return null
}

export function inkInPolygon(poly: InkPt[]): number[] {
  if (poly.length < 3) return []
  return items.filter((it) => it.points.some((p) => pointInPoly(p, poly))).map((it) => it.id)
}

export function inkInRect(x: number, y: number, w: number, h: number): number[] {
  const x1 = x + w
  const y1 = y + h
  return items
    .filter((it) => {
      const b = inkBounds(it)
      return b.x < x1 && b.x + b.w > x && b.y < y1 && b.y + b.h > y
    })
    .map((it) => it.id)
}

/** Ramer–Douglas–Peucker simplify. */
export function simplifyPolyline(pts: InkPt[], epsilon = 1.6): InkPt[] {
  if (pts.length < 3) return pts.slice()
  let maxD = 0
  let idx = 0
  const a = pts[0]
  const b = pts[pts.length - 1]
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i], a, b)
    if (d > maxD) {
      maxD = d
      idx = i
    }
  }
  if (maxD > epsilon) {
    const left = simplifyPolyline(pts.slice(0, idx + 1), epsilon)
    const right = simplifyPolyline(pts.slice(idx), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [a, b]
}
