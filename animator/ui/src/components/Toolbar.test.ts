import { describe, expect, it } from 'vitest'
import { computeVisibleCount } from './Toolbar'

describe('toolbar overflow math (T-toolbar-overflow)', () => {
  it('shows all buttons when they fit', () => {
    expect(computeVisibleCount([60, 60, 60], 6 * 2 + 180)).toBe(3)
  })

  it('collapses the tail into More when they do not fit', () => {
    // 3 × 80 + gaps = 252 > 200 → some must collapse
    expect(computeVisibleCount([80, 80, 80], 200)).toBeLessThan(3)
    expect(computeVisibleCount([80, 80, 80], 200)).toBeGreaterThanOrEqual(1)
  })

  it('never hides all buttons (at least one stays visible)', () => {
    expect(computeVisibleCount([999, 999, 999], 100)).toBe(1)
  })

  it('treats an unmeasured width (0) as "show everything"', () => {
    expect(computeVisibleCount([0, 0, 0], 0)).toBe(3)
  })

  it('empty list → 0', () => {
    expect(computeVisibleCount([], 500)).toBe(0)
  })
})
