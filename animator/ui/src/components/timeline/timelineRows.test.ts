import { describe, expect, it } from 'vitest'
import { ancestorCollapsed, displayRows } from './timelineRows'

describe('timelineRows (U-1 / U-5 / U-6)', () => {
  const layers = [
    { id: 1, parent_id: 0 },
    { id: 2, parent_id: 0, collapsed: true },
    { id: 3, parent_id: 2 },
    { id: 4, parent_id: 0 },
  ]

  it('hides descendants of a collapsed folder', () => {
    expect(ancestorCollapsed(layers, layers[2])).toBe(true)
    expect(ancestorCollapsed(layers, layers[0])).toBe(false)
  })

  it('reverses engine order (front on top) and drops collapsed children', () => {
    const rows = displayRows(layers)
    expect(rows.map((r) => r.id)).toEqual([4, 2, 1])
    expect(rows.map((r) => r.engineIndex)).toEqual([3, 1, 0])
  })
})
