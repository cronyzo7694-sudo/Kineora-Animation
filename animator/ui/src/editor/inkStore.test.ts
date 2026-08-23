import { describe, expect, it, beforeEach } from 'vitest'
import {
  addAnchorOnSegment,
  addInk,
  arrangeInk,
  convertAnchors,
  deleteInkIds,
  deleteSelectedAnchors,
  moveAnchors,
  selectAnchors,
  distToSegment,
  hitInk,
  inkUndo,
  listInk,
  moveInk,
  pointInPoly,
  resetInkForTests,
  selectedInkIds,
  simplifyPolyline,
  transformInk,
} from './inkStore'

beforeEach(() => resetInkForTests())

describe('inkStore', () => {
  it('adds a line and hits it', () => {
    const id = addInk({
      kind: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
      ],
      closed: false,
      fill: null,
      stroke: '#000',
      strokeWidth: 2,
    })
    expect(id).toBeGreaterThan(0)
    expect(hitInk(20, 1)?.id).toBe(id)
    expect(hitInk(20, 40)).toBeNull()
  })

  it('undo removes the last add', () => {
    addInk({
      kind: 'pencil',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      closed: false,
      fill: null,
      stroke: '#111',
      strokeWidth: 1,
    })
    expect(listInk()).toHaveLength(1)
    expect(inkUndo()).toBe(true)
    expect(listInk()).toHaveLength(0)
  })

  it('move + delete selected', () => {
    const id = addInk({
      kind: 'line',
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
      ],
      closed: false,
      fill: null,
      stroke: '#111',
      strokeWidth: 1,
    })
    moveInk(selectedInkIds(), 5, 0)
    expect(listInk()[0].points[0].x).toBe(15)
    expect(deleteInkIds([id])).toBe(true)
    expect(listInk()).toHaveLength(0)
  })

  it('arrange bring-to-front / send-to-back / step', () => {
    const stroke = (n: number) =>
      addInk({
        kind: 'pencil',
        points: [
          { x: n, y: 0 },
          { x: n + 4, y: 0 },
        ],
        closed: false,
        fill: null,
        stroke: '#000',
        strokeWidth: 1,
      })
    const a = stroke(0)
    const b = stroke(10)
    const c = stroke(20)
    expect(listInk().map((it) => it.id)).toEqual([a, b, c])
    expect(arrangeInk([a], 'front')).toBe(true)
    expect(listInk().map((it) => it.id)).toEqual([b, c, a])
    expect(arrangeInk([a], 'backward')).toBe(true)
    expect(listInk().map((it) => it.id)).toEqual([b, a, c])
    expect(arrangeInk([c], 'back')).toBe(true)
    expect(listInk().map((it) => it.id)).toEqual([c, b, a])
    expect(arrangeInk([c], 'forward')).toBe(true)
    expect(listInk().map((it) => it.id)).toEqual([b, c, a])
    expect(inkUndo()).toBe(true)
    expect(listInk().map((it) => it.id)).toEqual([c, b, a])
  })

  it('subselect: move / add / delete / smooth anchors', () => {
    const id = addInk({
      kind: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ],
      closed: false,
      fill: null,
      stroke: '#000',
      strokeWidth: 1,
    })
    selectAnchors([{ id, index: 1 }])
    expect(moveAnchors([{ id, index: 1 }], 0, 10)).toBe(true)
    expect(listInk()[0].points[1].y).toBe(10)
    expect(addAnchorOnSegment(id, 0, 0.5)).toBe(true)
    expect(listInk()[0].points).toHaveLength(4)
    selectAnchors([{ id, index: 1 }])
    expect(convertAnchors('smooth')).toBe(true)
    expect(listInk()[0].points[1].outX).toBeDefined()
    selectAnchors([{ id, index: 1 }])
    expect(deleteSelectedAnchors()).toBe(true)
    expect(listInk()[0].points.length).toBe(3)
  })

  it('text hit and move stay on the glyphs', () => {
    addInk({
      kind: 'text',
      points: [{ x: 40, y: 40 }],
      closed: false,
      fill: '#111',
      stroke: null,
      strokeWidth: 0,
      text: 'Hi',
      fontSize: 24,
    })
    expect(hitInk(50, 38)?.kind).toBe('text')
    moveInk(selectedInkIds(), 10, 5)
    expect(listInk()[0].points[0]).toEqual({ x: 50, y: 45 })
    expect(hitInk(60, 43)?.kind).toBe('text')
  })

  it('rotate / flip / reset text', () => {
    addInk({
      kind: 'text',
      points: [{ x: 40, y: 40 }],
      closed: false,
      fill: '#111',
      stroke: null,
      strokeWidth: 0,
      text: 'Hi',
      fontSize: 24,
    })
    expect(transformInk({ rotate: 90 })).toBe(true)
    expect(listInk()[0].rotation).toBe(90)
    expect(transformInk({ flipH: true })).toBe(true)
    expect(listInk()[0].scaleX).toBe(-1)
    expect(transformInk({ reset: true })).toBe(true)
    expect(listInk()[0].rotation).toBe(0)
    expect(listInk()[0].scaleX).toBe(1)
  })

  it('point-in-poly and simplify', () => {
    expect(pointInPoly({ x: 1, y: 1 }, [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ])).toBe(true)
    const s = simplifyPolyline(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0.01 },
        { x: 10, y: 0 },
      ],
      0.5,
    )
    expect(s.length).toBe(2)
    expect(distToSegment({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 10 })).toBe(0)
  })
})
