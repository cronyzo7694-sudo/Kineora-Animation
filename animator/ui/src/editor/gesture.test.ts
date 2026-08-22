import { describe, expect, it } from 'vitest'
import { DRAG_THRESHOLD_PX, MIN_RECT_DIM, buildRect, isValidRect, normalizeRect, pastDragThreshold, screenDeltaToDoc } from './gesture'

describe('pointer→tool gesture math (select + move)', () => {
  it('drag threshold is 3px and rejects sub-threshold movement', () => {
    expect(pastDragThreshold(2.9, 0)).toBe(false)
    expect(pastDragThreshold(0, 2.9)).toBe(false)
    expect(pastDragThreshold(DRAG_THRESHOLD_PX, 0)).toBe(true)
    expect(pastDragThreshold(2, 2)).toBe(false) // hypot(2,2)=2.83 < 3
    expect(pastDragThreshold(3, 1)).toBe(true) // hypot(3,1)=3.16 ≥ 3
  })

  it('screen delta converts to document delta by dividing by zoom', () => {
    expect(screenDeltaToDoc(10, 0, 1)).toEqual({ x: 10, y: 0 })
    expect(screenDeltaToDoc(10, 20, 2)).toEqual({ x: 5, y: 10 })
  })

  it('movement is correct at extreme zooms (5% and 500%)', () => {
    // 5% zoom: 50 screen px = 1000 doc px
    const low = screenDeltaToDoc(50, 0, 0.05)
    expect(low.x).toBeCloseTo(1000, 6)
    // 500% zoom: 50 screen px = 10 doc px
    const high = screenDeltaToDoc(50, 0, 5)
    expect(high.x).toBeCloseTo(10, 6)
  })

  it('zero zoom is clamped defensively to 1', () => {
    expect(screenDeltaToDoc(7, 0, 0)).toEqual({ x: 7, y: 0 })
  })

  it('pan never affects the document delta (delta only divides by zoom)', () => {
    // pan is a screen translation; the delta between two screen points is
    // pan-independent, so the doc delta depends only on zoom.
    expect(screenDeltaToDoc(30, 40, 1)).toEqual({ x: 30, y: 40 })
  })
})

describe('rect normalization (4 draw directions + minimums)', () => {
  it('normalizes top-left → bottom-right (already positive)', () => {
    expect(normalizeRect(0, 0, 100, 50)).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })

  it('normalizes bottom-right → top-left (negative drag)', () => {
    expect(normalizeRect(100, 50, 0, 0)).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })

  it('normalizes top-right → bottom-left (negative x)', () => {
    expect(normalizeRect(100, 0, 0, 50)).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })

  it('normalizes bottom-left → top-right (negative y)', () => {
    expect(normalizeRect(0, 50, 100, 0)).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })

  it('valid rects pass; zero and sub-minimum rects are rejected', () => {
    expect(isValidRect({ x: 0, y: 0, w: 100, h: 50 })).toBe(true)
    expect(isValidRect({ x: 0, y: 0, w: 0, h: 0 })).toBe(false) // click → no rect
    expect(isValidRect({ x: 0, y: 0, w: 100, h: 0 })).toBe(false) // zero height
    expect(isValidRect({ x: 0, y: 0, w: MIN_RECT_DIM, h: MIN_RECT_DIM })).toBe(true)
    expect(isValidRect({ x: 0, y: 0, w: MIN_RECT_DIM - 0.1, h: 5 })).toBe(false)
  })
})

describe('rect modifiers (Blueprint T2B.4 — Shift square, Alt from-center)', () => {
  it('unconstrained buildRect matches normalizeRect in all four directions', () => {
    expect(buildRect(0, 0, 100, 50)).toEqual(normalizeRect(0, 0, 100, 50))
    expect(buildRect(100, 50, 0, 0)).toEqual(normalizeRect(100, 50, 0, 0))
    expect(buildRect(100, 0, 0, 50)).toEqual(normalizeRect(100, 0, 0, 50))
    expect(buildRect(0, 50, 100, 0)).toEqual(normalizeRect(0, 50, 100, 0))
  })

  it('Shift (square) uses the longer side and keeps the start-corner anchor', () => {
    // 100×50 right-down → 100×100 from (0,0)
    expect(buildRect(0, 0, 100, 50, { square: true })).toEqual({ x: 0, y: 0, w: 100, h: 100 })
    // 40×90 right-down → 90×90
    expect(buildRect(10, 10, 50, 100, { square: true })).toEqual({ x: 10, y: 10, w: 90, h: 90 })
    // left-up from (100,100) to (50,80): |dx|=50 |dy|=20 → side 50 → (50,50,50,50)
    expect(buildRect(100, 100, 50, 80, { square: true })).toEqual({ x: 50, y: 50, w: 50, h: 50 })
  })

  it('Alt (from-center) grows both ways from the start point', () => {
    // start (100,100) → (150,120): hw=50 hh=20 → (50,80,100,40)
    expect(buildRect(100, 100, 150, 120, { fromCenter: true })).toEqual({
      x: 50,
      y: 80,
      w: 100,
      h: 40,
    })
  })

  it('Shift+Alt is a square grown from the start point as center', () => {
    // start (100,100) → (150,120): side=50 → (50,50,100,100)
    expect(buildRect(100, 100, 150, 120, { square: true, fromCenter: true })).toEqual({
      x: 50,
      y: 50,
      w: 100,
      h: 100,
    })
  })
})
