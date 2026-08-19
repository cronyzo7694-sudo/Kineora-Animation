import { describe, expect, it } from 'vitest'
import {
  clampZoom,
  createViewport,
  docRectToScreen,
  docToScreen,
  fitViewport,
  panBy,
  screenToDoc,
  zoomAt,
} from './viewport'

describe('viewport geometry', () => {
  it('identity viewport maps doc → screen 1:1', () => {
    const vp = createViewport()
    expect(docToScreen(vp, 10, 20)).toEqual({ x: 10, y: 20 })
    expect(screenToDoc(vp, 10, 20)).toEqual({ x: 10, y: 20 })
  })

  it('zoom scales and pan translates', () => {
    const vp = { zoom: 2, panX: 100, panY: 50 }
    expect(docToScreen(vp, 10, 20)).toEqual({ x: 10 * 2 + 100, y: 20 * 2 + 50 })
  })

  it('screenToDoc inverts docToScreen (round-trip)', () => {
    const vp = { zoom: 1.7, panX: -33, panY: 41 }
    const d = screenToDoc(vp, 123, 456)
    expect(docToScreen(vp, d.x, d.y)).toEqual({ x: 123, y: 456 })
  })

  it('docRectToScreen scales w/h by zoom only', () => {
    const vp = { zoom: 3, panX: 0, panY: 0 }
    expect(docRectToScreen(vp, { x: 5, y: 6, w: 10, h: 20 })).toEqual({ x: 15, y: 18, w: 30, h: 60 })
  })

  it('zoomAt keeps the anchor point fixed on screen', () => {
    const vp = { zoom: 1, panX: 0, panY: 0 }
    const anchor = { x: 50, y: 40 }
    const after = zoomAt(vp, anchor.x, anchor.y, 2)
    const p = docToScreen(after, 50, 40)
    expect(p.x).toBeCloseTo(anchor.x, 6)
    expect(p.y).toBeCloseTo(anchor.y, 6)
  })

  it('clampZoom bounds zoom to [MIN, MAX]', () => {
    expect(clampZoom(0)).toBeGreaterThanOrEqual(0.05)
    expect(clampZoom(1e9)).toBeLessThanOrEqual(32)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('panBy adds screen deltas', () => {
    const vp = panBy(createViewport(), 30, -20)
    expect(vp.panX).toBe(30)
    expect(vp.panY).toBe(-20)
  })

  it('fitViewport centers the doc with margin', () => {
    const vp = fitViewport(800, 600, 1000, 800)
    expect(vp.zoom).toBeGreaterThan(0)
    // center: doc center maps to view center
    const c = docToScreen(vp, 400, 300)
    expect(c.x).toBeCloseTo(500, 3)
    expect(c.y).toBeCloseTo(400, 3)
  })

  it('fitViewport returns identity for degenerate sizes', () => {
    expect(fitViewport(0, 0, 100, 100)).toEqual(createViewport())
  })
})
