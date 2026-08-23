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
  /** Incoming Bezier handle (absolute). Missing = corner. */
  inX?: number
  inY?: number
  /** Outgoing Bezier handle (absolute). */
  outX?: number
  outY?: number
}

export interface InkAnchor {
  id: number
  index: number
}

export interface InkItem {
  id: number
  kind: InkKind
  points: InkPt[]
  closed: boolean
  fill: string | null
  stroke: string | null
  strokeWidth: number
  /** Pencil / line dash (doc px). */
  strokeDash?: number[]
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontItalic?: boolean
  fontUnderline?: boolean
  textAlign?: 'left' | 'center' | 'right'
  letterSpacing?: number
  maxWidth?: number
  /** Degrees, clockwise. Text / extra ink transform (engine nodes use WASM). */
  rotation?: number
  scaleX?: number
  scaleY?: number
}

const ID_BASE = 1_000_000

let nextId = ID_BASE
let items: InkItem[] = []
let selected: number[] = []
let anchors: InkAnchor[] = []
let strokeEditOpen = false
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
  anchors = []
  strokeEditOpen = false
  undoStack.length = 0
  redoStack.length = 0
}

/** Snapshot for project save / tab switch (deep clone). */
export function serializeInk(): InkItem[] {
  return snapshot()
}

/** Replace the live ink layer without an undo step (load / tab switch). */
export function restoreInk(next: InkItem[]): void {
  items = next.map((it) => ({ ...it, points: it.points.map((p) => ({ ...p })) }))
  let max = ID_BASE
  for (const it of items) if (it.id >= max) max = it.id + 1
  nextId = max
  selected = []
  anchors = []
  strokeEditOpen = false
  undoStack.length = 0
  redoStack.length = 0
  emit()
}

/** Adobe Pencil/Object Drawing: strokes are not selected by default after draw. */
export function addInk(partial: Omit<InkItem, 'id'>, opts?: { select?: boolean }): number {
  pushUndo()
  const id = nextId++
  items = [...items, { ...partial, id }]
  if (opts?.select === false) {
    selected = selected.filter((s) => s !== id)
  } else {
    selected = [id]
  }
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
  if (!additive) anchors = []
  emit()
}

export function clearInkSelection(): void {
  if (selected.length === 0 && anchors.length === 0) return
  selected = []
  anchors = []
  emit()
}

export function selectedAnchors(): InkAnchor[] {
  return anchors.slice()
}

export function selectAnchors(next: InkAnchor[], additive = false): void {
  if (!additive) {
    anchors = next.slice()
  } else {
    const key = (a: InkAnchor) => `${a.id}:${a.index}`
    const have = new Set(anchors.map(key))
    const extra = next.filter((a) => !have.has(key(a)))
    anchors = [...anchors, ...extra]
  }
  const ids = new Set(anchors.map((a) => a.id))
  for (const id of ids) if (!selected.includes(id)) selected.push(id)
  emit()
}

export function clearAnchors(): void {
  if (anchors.length === 0) return
  anchors = []
  emit()
}

export function beginInkEdit(): void {
  if (strokeEditOpen) return
  pushUndo()
  strokeEditOpen = true
}

export function endInkEdit(): void {
  if (!strokeEditOpen) return
  strokeEditOpen = false
  bus.emit('document:changed', { type: 'transform', targets: selected })
}

export type InkArrangeOp = 'front' | 'forward' | 'back' | 'backward'

/**
 * Adobe Arrange (same layer, back → front = array order).
 * Bring to Front / Forward / Backward / Send to Back.
 */
/** Rotate / flip / reset selected ink (including text). */
export function transformInk(op: { rotate?: number; flipH?: boolean; flipV?: boolean; reset?: boolean }): boolean {
  const ids = selected
  if (ids.length === 0) return false
  const set = new Set(ids)
  const targets = items.filter((it) => set.has(it.id))
  if (targets.length === 0) return false
  pushUndo()
  const union = targets.reduce(
    (acc, it) => {
      const b = inkBounds(it)
      return {
        x0: Math.min(acc.x0, b.x),
        y0: Math.min(acc.y0, b.y),
        x1: Math.max(acc.x1, b.x + b.w),
        y1: Math.max(acc.y1, b.y + b.h),
      }
    },
    { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
  )
  const cx = (union.x0 + union.x1) / 2
  const cy = (union.y0 + union.y1) / 2
  const deg = op.rotate ?? 0
  items = items.map((it) => {
    if (!set.has(it.id)) return it
    if (op.reset) {
      return { ...it, rotation: 0, scaleX: 1, scaleY: 1 }
    }
    if (it.kind === 'text') {
      let rotation = it.rotation ?? 0
      let scaleX = it.scaleX ?? 1
      let scaleY = it.scaleY ?? 1
      if (deg) rotation += deg
      if (op.flipH) scaleX *= -1
      if (op.flipV) scaleY *= -1
      return { ...it, rotation, scaleX, scaleY }
    }
    let sx = 1
    let sy = 1
    if (op.flipH) sx = -1
    if (op.flipV) sy = -1
    return {
      ...it,
      points: it.points.map((p) => mapInkPt(p, { x: cx, y: cy }, sx, sy, deg)),
    }
  })
  emit()
  bus.emit('document:changed', { type: 'transform', targets: ids })
  return true
}

export function arrangeInk(ids: number[], op: InkArrangeOp): boolean {
  if (ids.length === 0 || items.length < 2) return false
  const set = new Set(ids)
  if (!items.some((it) => set.has(it.id))) return false
  const before = items.map((it) => it.id).join(',')
  const next = items.slice()
  const isSel = (it: InkItem) => set.has(it.id)
  let after: InkItem[]
  if (op === 'front') {
    after = [...next.filter((it) => !isSel(it)), ...next.filter(isSel)]
  } else if (op === 'back') {
    after = [...next.filter(isSel), ...next.filter((it) => !isSel(it))]
  } else if (op === 'forward') {
    for (let i = next.length - 1; i > 0; i--) {
      if (isSel(next[i - 1]) && !isSel(next[i])) {
        const t = next[i - 1]
        next[i - 1] = next[i]
        next[i] = t
      }
    }
    after = next
  } else {
    for (let i = 0; i < next.length - 1; i++) {
      if (isSel(next[i + 1]) && !isSel(next[i])) {
        const t = next[i]
        next[i] = next[i + 1]
        next[i + 1] = t
      }
    }
    after = next
  }
  if (after.map((it) => it.id).join(',') === before) return false
  pushUndo()
  items = after
  emit()
  bus.emit('document:changed', { type: 'transform', targets: ids })
  return true
}

export function moveInk(ids: number[], dx: number, dy: number): void {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return
  const set = new Set(ids)
  pushUndo()
  items = items.map((it) =>
    set.has(it.id)
      ? {
          ...it,
          points: it.points.map((p) => shiftPt(p, dx, dy)),
        }
      : it,
  )
  emit()
  bus.emit('document:changed', { type: 'transform', targets: ids })
}

function shiftPt(p: InkPt, dx: number, dy: number): InkPt {
  const n: InkPt = { ...p, x: p.x + dx, y: p.y + dy }
  if (p.inX != null) n.inX = p.inX + dx
  if (p.inY != null) n.inY = p.inY + dy
  if (p.outX != null) n.outX = p.outX + dx
  if (p.outY != null) n.outY = p.outY + dy
  return n
}

export function setInkPoint(id: number, index: number, pt: InkPt): boolean {
  const it = items.find((x) => x.id === id)
  if (!it || index < 0 || index >= it.points.length) return false
  const prev = it.points[index]
  return moveAnchors([{ id, index }], pt.x - prev.x, pt.y - prev.y)
}

export function moveAnchors(list: InkAnchor[], dx: number, dy: number): boolean {
  if (list.length === 0 || (dx === 0 && dy === 0)) return false
  beginInkEdit()
  const want = new Set(list.map((a) => `${a.id}:${a.index}`))
  items = items.map((it) => ({
    ...it,
    points: it.points.map((p, i) => (want.has(`${it.id}:${i}`) ? shiftPt(p, dx, dy) : p)),
  }))
  emit()
  return true
}

export function setAnchorXY(id: number, index: number, x: number, y: number): boolean {
  const it = items.find((t) => t.id === id)
  if (!it || !it.points[index]) return false
  const p = it.points[index]
  return moveAnchors([{ id, index }], x - p.x, y - p.y)
}

export function setAnchorHandle(
  id: number,
  index: number,
  which: 'in' | 'out',
  hx: number,
  hy: number,
  mirror: boolean,
): boolean {
  const it = items.find((t) => t.id === id)
  if (!it || !it.points[index]) return false
  beginInkEdit()
  items = items.map((x) => {
    if (x.id !== id) return x
    const pts = x.points.slice()
    const p = { ...pts[index] }
    if (which === 'in') {
      p.inX = hx
      p.inY = hy
      if (mirror) {
        p.outX = p.x - (hx - p.x)
        p.outY = p.y - (hy - p.y)
      }
    } else {
      p.outX = hx
      p.outY = hy
      if (mirror) {
        p.inX = p.x - (hx - p.x)
        p.inY = p.y - (hy - p.y)
      }
    }
    pts[index] = p
    return { ...x, points: pts }
  })
  emit()
  return true
}

export function convertAnchors(mode: 'smooth' | 'corner'): boolean {
  if (anchors.length === 0) return false
  beginInkEdit()
  const want = new Set(anchors.map((a) => `${a.id}:${a.index}`))
  items = items.map((it) => ({
    ...it,
    points: it.points.map((p, i) => {
      if (!want.has(`${it.id}:${i}`)) return p
      if (mode === 'corner') {
        const n = { ...p }
        delete n.inX
        delete n.inY
        delete n.outX
        delete n.outY
        return n
      }
      const prev = it.points[i - 1] ?? (it.closed ? it.points[it.points.length - 1] : p)
      const next = it.points[i + 1] ?? (it.closed ? it.points[0] : p)
      const dx = (next.x - prev.x) / 6
      const dy = (next.y - prev.y) / 6
      return { ...p, inX: p.x - dx, inY: p.y - dy, outX: p.x + dx, outY: p.y + dy }
    }),
  }))
  emit()
  endInkEdit()
  return true
}

export function addAnchorOnSegment(id: number, segIndex: number, t: number): boolean {
  const it = items.find((x) => x.id === id)
  if (!it || it.kind === 'text' || it.points.length < 2) return false
  const a = it.points[segIndex]
  const b = it.points[segIndex + 1] ?? (it.closed ? it.points[0] : null)
  if (!a || !b) return false
  const pt: InkPt = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  pushUndo()
  items = items.map((x) => {
    if (x.id !== id) return x
    const pts = x.points.slice()
    pts.splice(segIndex + 1, 0, pt)
    return { ...x, points: pts }
  })
  selected = [id]
  anchors = [{ id, index: segIndex + 1 }]
  emit()
  bus.emit('document:changed', { type: 'transform', targets: [id] })
  return true
}

export function deleteSelectedAnchors(): boolean {
  if (anchors.length === 0) return false
  const byId = new Map<number, Set<number>>()
  for (const a of anchors) {
    if (!byId.has(a.id)) byId.set(a.id, new Set())
    byId.get(a.id)!.add(a.index)
  }
  let changed = false
  pushUndo()
  items = items.map((it) => {
    const drop = byId.get(it.id)
    if (!drop || it.kind === 'text') return it
    const keep = it.points.filter((_, i) => !drop.has(i))
    if (keep.length < 2) return it
    changed = true
    return { ...it, points: keep }
  })
  anchors = []
  emit()
  if (changed) bus.emit('document:changed', { type: 'edit', targets: selected })
  return changed
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

/** Unrotated text box (baseline-relative). */
export function textLocalBox(it: InkItem): { x: number; y: number; w: number; h: number } {
  const p = it.points[0] ?? { x: 0, y: 0 }
  const lines = (it.text ?? '').split('\n')
  const size = it.fontSize ?? 18
  const longest = lines.reduce((m, s) => Math.max(m, s.length), 1)
  const w = Math.max(16, longest * size * 0.62 + (it.letterSpacing ?? 0) * Math.max(0, longest - 1))
  const h = Math.max(size * 1.15, lines.length * size * 1.25)
  let x = p.x
  if (it.textAlign === 'center') x = p.x - w / 2
  if (it.textAlign === 'right') x = p.x - w
  return { x, y: p.y - size, w, h }
}

function rotateScaleBox(b: { x: number; y: number; w: number; h: number }, deg: number, sx: number, sy: number) {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const rad = (deg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const corners = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ].map((p) => {
    let x = (p.x - cx) * sx
    let y = (p.y - cy) * sy
    return { x: cx + x * c - y * s, y: cy + x * s + y * c }
  })
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 }
}

export function inkBounds(it: InkItem): { x: number; y: number; w: number; h: number } {
  if (it.kind === 'text') {
    const local = textLocalBox(it)
    const rot = it.rotation ?? 0
    const sx = it.scaleX ?? 1
    const sy = it.scaleY ?? 1
    if (!rot && sx === 1 && sy === 1) return local
    return rotateScaleBox(local, rot, sx, sy)
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

function hitTextBox(it: InkItem, x: number, y: number): boolean {
  const b = textLocalBox(it)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const rad = (-(it.rotation ?? 0) * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
  const sx = Math.abs(it.scaleX ?? 1) || 1
  const sy = Math.abs(it.scaleY ?? 1) || 1
  const px = lx / sx + cx
  const py = ly / sy + cy
  const pad = 6
  return px >= b.x - pad && py >= b.y - pad && px <= b.x + b.w + pad && py <= b.y + b.h + pad
}

export function hitInk(x: number, y: number): InkItem | null {
  const p = { x, y }
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    if (it.kind === 'text') {
      if (hitTextBox(it, x, y)) return it
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
  const pool = selected.length ? items.filter((it) => selected.includes(it.id)) : items
  for (const it of pool) {
    if (it.kind === 'text') continue
    for (let i = 0; i < it.points.length; i++) {
      if (Math.hypot(x - it.points[i].x, y - it.points[i].y) <= radius) return { id: it.id, index: i }
    }
  }
  return null
}

export function hitInkHandle(
  x: number,
  y: number,
  radius = 6,
): { id: number; index: number; which: 'in' | 'out' } | null {
  for (const it of items) {
    if (!selected.includes(it.id) || it.kind === 'text') continue
    for (let i = 0; i < it.points.length; i++) {
      const p = it.points[i]
      if (p.outX != null && p.outY != null && Math.hypot(x - p.outX, y - p.outY) <= radius) {
        return { id: it.id, index: i, which: 'out' }
      }
      if (p.inX != null && p.inY != null && Math.hypot(x - p.inX, y - p.inY) <= radius) {
        return { id: it.id, index: i, which: 'in' }
      }
    }
  }
  return null
}

export function closestInkSegment(
  x: number,
  y: number,
  maxDist = 8,
): { id: number; index: number; t: number; dist: number } | null {
  let best: { id: number; index: number; t: number; dist: number } | null = null
  const p = { x, y }
  for (const it of items) {
    if (it.kind === 'text' || it.points.length < 2) continue
    const segs = it.points.length - 1 + (it.closed ? 1 : 0)
    for (let s = 0; s < segs; s++) {
      const a = it.points[s]
      const b = it.points[s + 1] ?? it.points[0]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
      const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
      if (d <= maxDist && (!best || d < best.dist)) best = { id: it.id, index: s, t, dist: d }
    }
  }
  return best
}

export function anchorsInRect(x: number, y: number, w: number, h: number): InkAnchor[] {
  const x1 = x + w
  const y1 = y + h
  const out: InkAnchor[] = []
  for (const it of items) {
    if (it.kind === 'text') continue
    it.points.forEach((p, i) => {
      if (p.x >= x && p.x <= x1 && p.y >= y && p.y <= y1) out.push({ id: it.id, index: i })
    })
  }
  return out
}

export function hasSmooth(p: InkPt): boolean {
  return p.inX != null || p.outX != null
}

export function mapInkPt(p: InkPt, anchor: { x: number; y: number }, sx: number, sy: number, deg: number): InkPt {
  const apply = (x0: number, y0: number) => {
    let x = anchor.x + (x0 - anchor.x) * sx
    let y = anchor.y + (y0 - anchor.y) * sy
    if (deg) {
      const rad = (deg * Math.PI) / 180
      const dx = x - anchor.x
      const dy = y - anchor.y
      x = anchor.x + dx * Math.cos(rad) - dy * Math.sin(rad)
      y = anchor.y + dx * Math.sin(rad) + dy * Math.cos(rad)
    }
    return { x, y }
  }
  const a = apply(p.x, p.y)
  const n: InkPt = { ...p, x: a.x, y: a.y }
  if (p.inX != null && p.inY != null) {
    const q = apply(p.inX, p.inY)
    n.inX = q.x
    n.inY = q.y
  }
  if (p.outX != null && p.outY != null) {
    const q = apply(p.outX, p.outY)
    n.outX = q.x
    n.outY = q.y
  }
  return n
}

/** Write absolute points (Free Transform live preview). One undo via beginInkEdit. */
export function writeInkPoints(id: number, points: InkPt[]): boolean {
  const i = items.findIndex((it) => it.id === id)
  if (i < 0) return false
  beginInkEdit()
  items = items.slice()
  items[i] = { ...items[i], points: points.map((p) => ({ ...p })) }
  emit()
  return true
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
