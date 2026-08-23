import { describe, expect, it } from 'vitest'
import { dashForStyle, processPencil } from './pencil'

describe('processPencil', () => {
  it('ink keeps most of a wiggly stroke', () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({ x: i, y: i % 2 }))
    const out = processPencil(pts, 'ink', 50)
    expect(out.length).toBeGreaterThan(2)
  })

  it('straighten collapses a near-line to two points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0.4 },
      { x: 20, y: -0.3 },
      { x: 40, y: 0.2 },
    ]
    const out = processPencil(pts, 'straighten', 50)
    expect(out).toHaveLength(2)
  })

  it('smooth reduces point count vs raw', () => {
    const pts = Array.from({ length: 40 }, (_, i) => ({ x: i, y: Math.sin(i / 3) * 2 }))
    const out = processPencil(pts, 'smooth', 80)
    expect(out.length).toBeLessThan(pts.length)
  })

  it('straighten recognizes a rough oval loop', () => {
    const pts = Array.from({ length: 36 }, (_, i) => {
      const t = (i / 35) * Math.PI * 2
      return { x: 40 + Math.cos(t) * 20 + (i % 3) * 0.2, y: 40 + Math.sin(t) * 16 }
    })
    const out = processPencil(pts, 'straighten', 50, true)
    expect(out.length).toBeGreaterThan(8)
  })
})

describe('dashForStyle', () => {
  it('maps Adobe-like stroke styles', () => {
    expect(dashForStyle('solid', 4)).toBeUndefined()
    expect(dashForStyle('dashed', 4)?.length).toBe(2)
    expect(dashForStyle('dotted', 4)?.[0]).toBeLessThan(2)
  })
})
