// Pointer→tool gesture math (SELECT + MOVE unit). Pure + deterministic so the
// pointer lifecycle is unit-testable without a browser.
//
// Contract (Phase 3 §12 / Phase 1 Part 03–04):
// - drag must NOT begin before the threshold (no accidental click-to-move)
// - movement is computed in DOCUMENT coordinates (screen delta / zoom)
// - pan (view translation) never affects the doc delta (it cancels out)

/** Screen-space drag threshold in CSS pixels (Phase-1: ~3px desktop). */
export const DRAG_THRESHOLD_PX = 3

export interface Vec {
  x: number
  y: number
}

/** True once the pointer has moved far enough to turn a click into a drag. */
export function pastDragThreshold(dxScreen: number, dyScreen: number): boolean {
  return Math.hypot(dxScreen, dyScreen) >= DRAG_THRESHOLD_PX
}

/** Screen delta → document delta. Zoom must be > 0 (clamped defensively). */
export function screenDeltaToDoc(dxScreen: number, dyScreen: number, zoom: number): Vec {
  const z = zoom > 0 ? zoom : 1
  return { x: dxScreen / z, y: dyScreen / z }
}

/** Screen distance a delta represents in document space (for commit guards). */
export function screenDeltaToDocDistance(dxScreen: number, dyScreen: number, zoom: number): number {
  const d = screenDeltaToDoc(dxScreen, dyScreen, zoom)
  return Math.hypot(d.x, d.y)
}

// ——— Rect drawing (draw direction normalization + minimums) ———

/**
 * Minimum drawn-rect dimension in DOCUMENT units. Source-of-truth (Phase 1/2)
 * defines no shape minimum (only a 2px import minimum for bitmaps), so this is
 * [ENGINEERING DECISION]: a zero/sub-1px rectangle is a click — it creates no
 * object and no undo command.
 */
export const MIN_RECT_DIM = 1.0

export interface DocRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Normalize a corner-to-corner drag into a rect with a top-left origin and
 * positive width/height. Supports all four drag directions.
 */
export function normalizeRect(ax: number, ay: number, bx: number, by: number): DocRect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    w: Math.abs(bx - ax),
    h: Math.abs(by - ay),
  }
}

/** Blueprint T2B.4 modifiers — not invented: Shift = square, Alt = from center. */
export interface RectBuildOpts {
  square?: boolean
  fromCenter?: boolean
}

/**
 * Build a document-space rectangle from a drag, applying Blueprint T2B.4
 * modifiers. Unconstrained (`{}`) is identical to `normalizeRect`.
 *
 * - square: side = max(|dx|, |dy|); the start corner (or center) is the anchor
 * - fromCenter: start point is the center; pointer is a corner
 * - both: square grown from the start point as center
 */
export function buildRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  opts: RectBuildOpts = {},
): DocRect {
  const dx = bx - ax
  const dy = by - ay
  let hw = Math.abs(dx)
  let hh = Math.abs(dy)
  if (opts.square) {
    const side = Math.max(hw, hh)
    hw = side
    hh = side
  }
  if (opts.fromCenter) {
    return { x: ax - hw, y: ay - hh, w: hw * 2, h: hh * 2 }
  }
  const x = dx < 0 ? ax - hw : ax
  const y = dy < 0 ? ay - hh : ay
  return { x, y, w: hw, h: hh }
}

/** True when a normalized rect is big enough to create an object. */
export function isValidRect(r: DocRect): boolean {
  return r.w >= MIN_RECT_DIM && r.h >= MIN_RECT_DIM
}
