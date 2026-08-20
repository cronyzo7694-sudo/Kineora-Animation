import { describe, expect, it } from 'vitest'
import { DRAG_THRESHOLD_PX, pastDragThreshold, screenDeltaToDoc } from './gesture'

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
