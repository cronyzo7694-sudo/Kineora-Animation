import { describe, expect, it } from 'vitest'
import { inkToSvg } from './canvasRenderer'
import type { InkItem } from '../editor/inkStore'

describe('inkToSvg', () => {
  it('emits a path for a two-point line', () => {
    const items: InkItem[] = [
      {
        id: 1,
        kind: 'line',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 4 },
        ],
        closed: false,
        fill: null,
        stroke: '#111111',
        strokeWidth: 2,
      },
    ]
    expect(inkToSvg(items)).toContain('M0 0 L10 4')
    expect(inkToSvg(items)).toContain('stroke="#111111"')
  })

  it('emits escaped text', () => {
    const items: InkItem[] = [
      {
        id: 2,
        kind: 'text',
        points: [{ x: 3, y: 8 }],
        closed: false,
        fill: '#00aa00',
        stroke: null,
        strokeWidth: 0,
        text: 'A&B',
        fontSize: 20,
      },
    ]
    expect(inkToSvg(items)).toContain('A&amp;B')
    expect(inkToSvg(items)).toContain('font-size="20"')
  })
})
