// Viewport — document → screen coordinate mapping (Phase-3 §Render / Part-16
// "three zooms" model). View space (zoom/pan) is NEVER written back into
// document coordinates; it only affects how the renderer draws.

export interface Viewport {
  zoom: number
  panX: number // screen-space translation (CSS px)
  panY: number
}

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 32

export function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}

export function createViewport(): Viewport {
  return { zoom: 1, panX: 0, panY: 0 }
}

/**
 * Document point → screen (CSS px) point.
 * doc (0,0) is the stage top-left; screen (0,0) is the canvas top-left.
 */
export function docToScreen(vp: Viewport, x: number, y: number): { x: number; y: number } {
  return { x: x * vp.zoom + vp.panX, y: y * vp.zoom + vp.panY }
}

/** Screen (CSS px) point → document point. */
export function screenToDoc(vp: Viewport, x: number, y: number): { x: number; y: number } {
  return { x: (x - vp.panX) / vp.zoom, y: (y - vp.panY) / vp.zoom }
}

export interface DocRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ScreenRect {
  x: number
  y: number
  w: number
  h: number
}

/** Document rect → screen rect (CSS px). */
export function docRectToScreen(vp: Viewport, r: DocRect): ScreenRect {
  const p = docToScreen(vp, r.x, r.y)
  return { x: p.x, y: p.y, w: r.w * vp.zoom, h: r.h * vp.zoom }
}

/**
 * Fit a document into a viewport size, returning a viewport that centers the
 * doc with a small margin. Used for initial fit + double-click fit.
 */
export function fitViewport(docW: number, docH: number, viewW: number, viewH: number, margin = 24): Viewport {
  if (docW <= 0 || docH <= 0 || viewW <= 0 || viewH <= 0) return createViewport()
  const availW = Math.max(1, viewW - margin * 2)
  const availH = Math.max(1, viewH - margin * 2)
  const zoom = clampZoom(Math.min(availW / docW, availH / docH))
  const panX = (viewW - docW * zoom) / 2
  const panY = (viewH - docH * zoom) / 2
  return { zoom, panX, panY }
}

/** Zoom around a screen-space anchor point (keeps that point fixed on screen). */
export function zoomAt(vp: Viewport, anchorX: number, anchorY: number, factor: number): Viewport {
  const z = clampZoom(vp.zoom * factor)
  const doc = screenToDoc(vp, anchorX, anchorY)
  // keep anchor fixed: screen = doc*newZ + newPan  ⇒  newPan = screen - doc*newZ
  return { zoom: z, panX: anchorX - doc.x * z, panY: anchorY - doc.y * z }
}

/** Pan by a screen-space delta. */
export function panBy(vp: Viewport, dx: number, dy: number): Viewport {
  return { ...vp, panX: vp.panX + dx, panY: vp.panY + dy }
}
