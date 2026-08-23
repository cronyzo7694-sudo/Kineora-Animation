import { describe, expect, it, beforeEach } from 'vitest'
import { applyEraserStroke, splitOpenPath } from './eraser'
import { addInk, listInk, resetInkForTests } from './inkStore'

beforeEach(() => resetInkForTests())

describe('splitOpenPath', () => {
  it('cuts the middle of a stroke and keeps both ends', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]
    const erase = [
      { x: 48, y: 0 },
      { x: 52, y: 0 },
    ]
    const bits = splitOpenPath(line, erase, 6)
    expect(bits.length).toBe(2)
    expect(bits[0][0].x).toBeLessThan(45)
    expect(bits[1][bits[1].length - 1].x).toBeGreaterThan(55)
  })
})

describe('applyEraserStroke', () => {
  it('punches a hole in a fill instead of deleting the object', () => {
    addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 80, y: 80 },
        { x: 0, y: 80 },
      ],
      closed: true,
      fill: '#f00',
      stroke: null,
      strokeWidth: 0,
    })
    expect(applyEraserStroke([{ x: 40, y: 40 }], 'normal', 16, 'circle', null)).toBe(true)
    const left = listInk()
    expect(left).toHaveLength(1)
    expect(left[0].holes?.length).toBe(1)
    expect(left[0].points.length).toBe(4)
  })

  it('splits a pencil stroke instead of deleting it', () => {
    addInk({
      kind: 'pencil',
      points: [
        { x: 0, y: 10 },
        { x: 120, y: 10 },
      ],
      closed: false,
      fill: null,
      stroke: '#111',
      strokeWidth: 2,
    })
    applyEraserStroke(
      [
        { x: 58, y: 10 },
        { x: 62, y: 10 },
      ],
      'normal',
      12,
      'circle',
      null,
    )
    const left = listInk()
    expect(left.length).toBeGreaterThanOrEqual(2)
    expect(left.every((it) => it.kind === 'pencil')).toBe(true)
  })
})
