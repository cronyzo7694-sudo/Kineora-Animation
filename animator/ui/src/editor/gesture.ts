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
