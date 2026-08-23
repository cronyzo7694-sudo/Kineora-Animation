import { describe, expect, it, beforeEach } from 'vitest'
import {
  defaultToolOptions,
  loadToolOptions,
  rectFullyInside,
  resetToolOptionsForTests,
  setToolOptions,
  snapMoveDelta,
} from './toolOptions'

beforeEach(() => resetToolOptionsForTests())

describe('toolOptions', () => {
  it('preserves fontSize when patching another field', () => {
    setToolOptions({ fontSize: 36 })
    setToolOptions({ inkSize: 8 })
    expect(loadToolOptions().fontSize).toBe(36)
    expect(loadToolOptions().inkSize).toBe(8)
  })

  it('keeps pencil fields when patching another option', () => {
    setToolOptions({ pencilMode: 'ink', pencilSmooth: 80, pencilStyle: 'dashed' })
    setToolOptions({ inkSize: 6 })
    expect(loadToolOptions()).toMatchObject({ pencilMode: 'ink', pencilSmooth: 80, pencilStyle: 'dashed', inkSize: 6 })
  })

  it('defaults match Adobe selection modifiers', () => {
    expect(defaultToolOptions()).toMatchObject({
      snapToObjects: true,
      snapToPixels: false,
      contactSensitive: true,
    })
  })
})

describe('snapMoveDelta / enclose', () => {
  it('snaps a near-edge move onto the stage', () => {
    const r = snapMoveDelta(4, 0, [{ x: 0, y: 0, w: 10, h: 10 }], [], 200, 200, {
      snapToObjects: true,
      snapToPixels: false,
    })
    expect(r.x).toBe(0)
    expect(r.y).toBe(0)
  })

  it('snapToPixels rounds the delta', () => {
    const r = snapMoveDelta(3.6, -1.2, [{ x: 10, y: 10, w: 8, h: 8 }], [], 200, 200, {
      snapToObjects: false,
      snapToPixels: true,
    })
    expect(r).toEqual({ x: 4, y: -1 })
  })

  it('rectFullyInside is exclusive of overflow', () => {
    expect(rectFullyInside({ x: 2, y: 2, w: 4, h: 4 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(true)
    expect(rectFullyInside({ x: 2, y: 2, w: 20, h: 4 }, { x: 0, y: 0, w: 10, h: 10 })).toBe(false)
  })
})
