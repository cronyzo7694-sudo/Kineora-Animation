// Live Pen-tool draft (not yet committed to ink). Shared by Stage + Properties.

import type { InkPt } from './inkStore'

const listeners = new Set<() => void>()

let pts: InkPt[] = []
let cursor: InkPt | null = null
let dragging = false
let closeHover = false
let finisher: ((close: boolean) => boolean) | null = null

function emit(): void {
  for (const fn of [...listeners]) fn()
}

export function subscribePenDraft(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function penPoints(): InkPt[] {
  return pts
}

export function penCursor(): InkPt | null {
  return cursor
}

export function isPenDragging(): boolean {
  return dragging
}

export function isPenCloseHover(): boolean {
  return closeHover
}

export function setPenCloseHover(v: boolean): void {
  if (closeHover === v) return
  closeHover = v
  emit()
}

export function setPenDragging(v: boolean): void {
  dragging = v
}

export function setPenCursor(p: InkPt | null): void {
  cursor = p
  emit()
}

export function appendPenPoint(p: InkPt): void {
  pts = [...pts, { ...p }]
  emit()
}

export function updateLastPenPoint(patch: Partial<InkPt>): void {
  if (pts.length === 0) return
  const last = { ...pts[pts.length - 1], ...patch }
  pts = [...pts.slice(0, -1), last]
  emit()
}

export function clearPenDraft(): void {
  pts = []
  cursor = null
  dragging = false
  closeHover = false
  emit()
}

/** True when two doc points are within `px` screen pixels at `zoom`. */
export function screenNear(a: InkPt, b: InkPt, zoom: number, px = 12): boolean {
  const z = zoom > 1e-6 ? zoom : 1
  return Math.hypot(a.x - b.x, a.y - b.y) * z <= px
}

export function constrain45(from: InkPt, to: InkPt): InkPt {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const ang = Math.atan2(dy, dx)
  const snap = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
  const len = Math.hypot(dx, dy)
  return { x: from.x + Math.cos(snap) * len, y: from.y + Math.sin(snap) * len }
}

/** Rubber-band preview: committed anchors + optional live cursor. */
export function penPreviewPoints(rubberBand: boolean): InkPt[] {
  if (pts.length === 0) return []
  if (rubberBand && cursor && !dragging) return [...pts, cursor]
  return pts.slice()
}

export function registerPenFinisher(fn: ((close: boolean) => boolean) | null): void {
  finisher = fn
}

export function requestPenFinish(close: boolean): boolean {
  return finisher ? finisher(close) : false
}

export function resetPenDraftForTests(): void {
  clearPenDraft()
  finisher = null
}
