import { describe, expect, it } from 'vitest'
import { brushDocSize, brushRibbon, constrainBrush } from './brush'

describe('brush (Adobe B)', () => {
  it('Shift constraint is H or V from the first point', () => {
    expect(constrainBrush({ x: 10, y: 10 }, { x: 40, y: 12 })).toEqual({ x: 40, y: 10 })
    expect(constrainBrush({ x: 10, y: 10 }, { x: 11, y: 50 })).toEqual({ x: 10, y: 50 })
  })

  it('ribbon is a closed fill outline', () => {
    const r = brushRibbon(
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ],
      6,
      'circle',
      0,
      20,
    )
    expect(r.length).toBeGreaterThanOrEqual(4)
  })

  it('zoom-with-stage off scales size by 1/zoom', () => {
    expect(brushDocSize(16, 2, true)).toBe(16)
    expect(brushDocSize(16, 2, false)).toBe(8)
  })
})
