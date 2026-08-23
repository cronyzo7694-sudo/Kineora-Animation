// Pure transform math for the editor overlay (scale/rotate/selection geometry).
// All geometry is DOCUMENT-space; the renderer converts to screen. This module
// has no browser dependencies and is fully unit-tested.

export interface Pt {
  x: number
  y: number
}

/** Per-selected-object detail from the engine (matches Rust `SelDetail`). */
export interface SelDetail {
  id: number
  x: number
  y: number
  w: number
  h: number
  base_w: number
  base_h: number
  scale_x: number
  scale_y: number
  rotation: number
}

export type HandleKind = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'rotate'

/** Absolute transform the engine expects (matches Rust `Transform`). */
export interface AbsTransform {
  x: number
  y: number
  scale_x: number
  scale_y: number
  rotation: number
  skew_x: number
  skew_y: number
  pivot_x: number
  pivot_y: number
}

function centerOf(d: SelDetail): Pt {
  return { x: d.x + d.w / 2, y: d.y + d.h / 2 }
}

/** Rotate a point around an origin by `deg` degrees. */
export function rotatePt(p: Pt, o: Pt, deg: number): Pt {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - o.x
  const dy = p.y - o.y
  return { x: o.x + dx * cos - dy * sin, y: o.y + dx * sin + dy * cos }
}

/** 4 corners of a rect (top-left origin) rotated around its center. */
export function rectCorners(d: SelDetail): Pt[] {
  const c = centerOf(d)
  const hw = d.w / 2
  const hh = d.h / 2
  const pts = [
    { x: c.x - hw, y: c.y - hh },
    { x: c.x + hw, y: c.y - hh },
    { x: c.x + hw, y: c.y + hh },
    { x: c.x - hw, y: c.y + hh },
  ]
  if (d.rotation === 0) return pts
  return pts.map((p) => rotatePt(p, c, d.rotation))
}

/** Axis-aligned bounding box of a set of points. */
export function aabbOf(pts: Pt[]): { x: number; y: number; w: number; h: number } {
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
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
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export interface SelectionGeometry {
  /** Single selection: the rotated box corners; multi: the AABB box corners. */
  box: Pt[]
  /** Selection bounds center (scale/rotate anchor for multi; rotate anchor for single). */
  center: Pt
  aabb: { x: number; y: number; w: number; h: number }
}

/** Translate overlay points by a live move preview (Adobe: box rides with the drag). */
export function translatePts(pts: Pt[], dx: number, dy: number): Pt[] {
  if (!dx && !dy) return pts
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

export function translatePt(p: Pt, dx: number, dy: number): Pt {
  if (!dx && !dy) return p
  return { x: p.x + dx, y: p.y + dy }
}

/** True when (x,y) is inside any selected AABB (click-on-selected keeps the set). */
export function pointInRects(x: number, y: number, rects: Array<{ x: number; y: number; w: number; h: number }>): boolean {
  return rects.some((r) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h)
}

export function selectionGeometry(details: SelDetail[]): SelectionGeometry {
  const allCorners = details.flatMap(rectCorners)
  const aabb = aabbOf(allCorners)
  const center = { x: aabb.x + aabb.w / 2, y: aabb.y + aabb.h / 2 }
  if (details.length === 1) {
    const box = rectCorners(details[0])
    return { box, center: centerOf(details[0]), aabb }
  }
  // multi: axis-aligned union box (Phase-1 Part 03.4.10)
  const box = [
    { x: aabb.x, y: aabb.y },
    { x: aabb.x + aabb.w, y: aabb.y },
    { x: aabb.x + aabb.w, y: aabb.y + aabb.h },
    { x: aabb.x, y: aabb.y + aabb.h },
  ]
  return { box, center, aabb }
}

/** The 9 handle positions (8 scale handles + rotate) for a selection box. */
export function handlePositions(geom: SelectionGeometry): Record<HandleKind, Pt> {
  const b = geom.box // tl, tr, br, bl order
  const [tl, tr, br, bl] = b
  const mid = (a: Pt, c: Pt): Pt => ({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 })
  const t = mid(tl, tr)
  const r = mid(tr, br)
  const btm = mid(br, bl)
  const l = mid(bl, tl)
  // rotate handle: `rotOffset` doc units outward from the top-center handle
  // along the direction from the selection center (works for rotated boxes too).
  const rotOffset = 24
  const dir = { x: t.x - geom.center.x, y: t.y - geom.center.y }
  const len = Math.hypot(dir.x, dir.y) || 1
  const rot: Pt = { x: t.x + (dir.x / len) * rotOffset, y: t.y + (dir.y / len) * rotOffset }
  return { tl, t, tr, r, br, b: btm, bl, l, rotate: rot }
}

export interface AbsTransformOut extends AbsTransform {
  id: number
}

/** New absolute transforms after SCALING around `anchor` by (sx, sy). */
export function scaleSelection(details: SelDetail[], anchor: Pt, sx: number, sy: number): AbsTransformOut[] {
  return details.map((d) => {
    const c = centerOf(d)
    const nc = { x: anchor.x + (c.x - anchor.x) * sx, y: anchor.y + (c.y - anchor.y) * sy }
    const nsx = d.scale_x * sx
    const nsy = d.scale_y * sy
    const nw = d.base_w * nsx
    const nh = d.base_h * nsy
    return {
      id: d.id,
      x: nc.x - nw / 2,
      y: nc.y - nh / 2,
      scale_x: nsx,
      scale_y: nsy,
      rotation: d.rotation,
      skew_x: 0,
      skew_y: 0,
      pivot_x: 0,
      pivot_y: 0,
    }
  })
}

/** New absolute transforms after ROTATING all selection centers around `o` by `deg`. */
export function rotateSelection(details: SelDetail[], o: Pt, deg: number): AbsTransformOut[] {
  return details.map((d) => {
    const c = centerOf(d)
    const nc = rotatePt(c, o, deg)
    return {
      id: d.id,
      x: nc.x - d.w / 2,
      y: nc.y - d.h / 2,
      scale_x: d.scale_x,
      scale_y: d.scale_y,
      rotation: d.rotation + deg,
      skew_x: 0,
      skew_y: 0,
      pivot_x: 0,
      pivot_y: 0,
    }
  })
}

/** Which handle (if any) is under a SCREEN point, given handle screen positions. */
export function pickHandle(screenHandles: Record<HandleKind, Pt>, px: number, py: number, radius: number): HandleKind | null {
  let best: HandleKind | null = null
  let bestDist = radius
  for (const [kind, p] of Object.entries(screenHandles) as [HandleKind, Pt][]) {
    const d = Math.hypot(p.x - px, p.y - py)
    if (d <= bestDist) {
      bestDist = d
      best = kind
    }
  }
  return best
}

/**
 * Scale factors for a handle drag: pointer vs start-handle relative to the
 * anchor. Edge handles scale one axis; corner handles scale both; Shift forces
 * uniform proportional scale on corners.
 */
export function scaleFactors(
  handle: HandleKind,
  startHandle: Pt,
  anchor: Pt,
  pointer: Pt,
  shift: boolean,
): { sx: number; sy: number } {
  const corner = handle === 'tl' || handle === 'tr' || handle === 'bl' || handle === 'br'
  const guard = (num: number, den: number, fallback: number): number =>
    Math.abs(den) < 1e-9 ? fallback : num / den
  if (corner) {
    const sx = guard(pointer.x - anchor.x, startHandle.x - anchor.x, 1)
    const sy = guard(pointer.y - anchor.y, startHandle.y - anchor.y, 1)
    if (shift) {
      const d0 = Math.hypot(startHandle.x - anchor.x, startHandle.y - anchor.y)
      const d1 = Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y)
      const u = guard(d1, d0, 1)
      return { sx: u, sy: u }
    }
    return { sx, sy }
  }
  if (handle === 'l' || handle === 'r') {
    return { sx: guard(pointer.x - anchor.x, startHandle.x - anchor.x, 1), sy: 1 }
  }
  return { sx: 1, sy: guard(pointer.y - anchor.y, startHandle.y - anchor.y, 1) }
}

/** Rotation delta (degrees) from dragging around `center`. Shift snaps to 15°. */
export function rotationDelta(center: Pt, startPointer: Pt, pointer: Pt, shift: boolean): number {
  const a0 = (Math.atan2(startPointer.y - center.y, startPointer.x - center.x) * 180) / Math.PI
  const a1 = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI
  let d = a1 - a0
  if (shift) d = Math.round(d / 15) * 15
  return d
}

/** Opposing anchor point for a scale handle (for proportional / anchor logic). */
export function oppositeHandle(geom: SelectionGeometry, kind: HandleKind): Pt {
  const { box } = geom
  const [tl, tr, br, bl] = box
  const mid = (a: Pt, c: Pt): Pt => ({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 })
  switch (kind) {
    case 'tl':
      return br
    case 'tr':
      return bl
    case 'br':
      return tl
    case 'bl':
      return tr
    case 't':
      return mid(bl, br)
    case 'b':
      return mid(tl, tr)
    case 'l':
      return mid(tr, br)
    case 'r':
      return mid(tl, bl)
    default:
      return geom.center
  }
}
