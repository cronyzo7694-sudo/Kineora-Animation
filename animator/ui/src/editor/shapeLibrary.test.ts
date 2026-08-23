import { describe, expect, it } from 'vitest'
import { isEngineShape, shapeInBox, unitPath } from './shapeLibrary'

describe('shapeLibrary', () => {
  it('builds closed polygons for stars and hex', () => {
    expect(unitPath('hexagon').length).toBe(6)
    expect(unitPath('star5').length).toBe(10)
    expect(unitPath('triangle').length).toBe(3)
  })

  it('places a triangle in a document box', () => {
    const pts = shapeInBox('triangle', { x: 10, y: 20, w: 100, h: 50 })
    expect(pts[0]).toEqual({ x: 60, y: 20 })
    expect(pts[1].x).toBeCloseTo(110)
    expect(pts[2].y).toBeCloseTo(70)
  })

  it('marks only rect/oval as engine shapes', () => {
    expect(isEngineShape('rect')).toBe(true)
    expect(isEngineShape('oval')).toBe(true)
    expect(isEngineShape('star5')).toBe(false)
  })
})
