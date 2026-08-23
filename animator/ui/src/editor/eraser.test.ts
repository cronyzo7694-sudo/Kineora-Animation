import { describe, expect, it, beforeEach } from 'vitest'
import { collectEraserHits, faucetTarget, inkIsFill, inkIsStroke } from './eraser'
import { addInk, listInk, resetInkForTests, selectInk } from './inkStore'

beforeEach(() => resetInkForTests())

describe('eraser classify', () => {
  it('treats brush and closed fills as fills, pencil as stroke', () => {
    const fillId = addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ],
      closed: true,
      fill: '#f00',
      stroke: '#000',
      strokeWidth: 1,
    })
    const lineId = addInk({
      kind: 'pencil',
      points: [
        { x: 100, y: 0 },
        { x: 140, y: 0 },
      ],
      closed: false,
      fill: null,
      stroke: '#111',
      strokeWidth: 2,
    })
    expect(fillId).toBeGreaterThan(0)
    const fill = listInk().find((i) => i.id === fillId)!
    const line = listInk().find((i) => i.id === lineId)!
    expect(inkIsFill(fill)).toBe(true)
    expect(inkIsStroke(line)).toBe(true)
  })
})

describe('collectEraserHits', () => {
  it('Erase Lines skips a closed fill', () => {
    addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 40 },
        { x: 0, y: 40 },
      ],
      closed: true,
      fill: '#0af',
      stroke: null,
      strokeWidth: 0,
    })
    const hits = collectEraserHits(
      [
        { x: 10, y: 10 },
        { x: 12, y: 12 },
      ],
      'lines',
      16,
      null,
    )
    expect(hits).toEqual([])
  })

  it('Erase Selected Fills only hits the selected fill', () => {
    const a = addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ],
      closed: true,
      fill: '#111',
      stroke: null,
      strokeWidth: 0,
    }, { select: false })
    const b = addInk({
      kind: 'pen',
      points: [
        { x: 80, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 20 },
        { x: 80, y: 20 },
      ],
      closed: true,
      fill: '#222',
      stroke: null,
      strokeWidth: 0,
    }, { select: false })
    selectInk([b])
    const hits = collectEraserHits(
      [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
      ],
      'selected',
      8,
      null,
    )
    expect(hits).toEqual([b])
    expect(hits).not.toContain(a)
  })
})

describe('faucetTarget', () => {
  it('returns the fill under the click', () => {
    addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 30 },
        { x: 0, y: 30 },
      ],
      closed: true,
      fill: '#abc',
      stroke: null,
      strokeWidth: 0,
    })
    expect(faucetTarget(10, 10, 'normal')?.kind).toBe('pen')
    expect(faucetTarget(200, 200, 'normal')).toBeNull()
  })
})
