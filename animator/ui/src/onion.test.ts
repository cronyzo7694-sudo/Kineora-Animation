import { beforeEach, describe, expect, it } from 'vitest'
import { collectGhosts, ghostAlpha, onionRange } from './onion'
import {
  defaultOnionPrefs,
  loadOnionPrefs,
  patchOnionPrefs,
  resetOnionPrefsForTests,
  setOnionAnchorRange,
  setOnionPreset,
  toggleOnion,
  toggleOnionOutlines,
} from './onionPrefs'
import type { RectItemJson } from './engine/wasmTypes'

beforeEach(() => {
  resetOnionPrefsForTests()
})

describe('onion range math (08_ONION_SKIN.md §5)', () => {
  it('follow ±2 around the playhead, clamped to frame 1', () => {
    const p = { ...defaultOnionPrefs(), mode: 'follow' as const, prev: 2, next: 2 }
    expect(onionRange(p, 1, 20)).toEqual({ start: 1, end: 3 })
    expect(onionRange(p, 5, 20)).toEqual({ start: 3, end: 7 })
  })

  it('anchor keeps start/end when the playhead leaves the band', () => {
    const p = { ...defaultOnionPrefs(), mode: 'anchor' as const, start: 2, end: 6 }
    expect(onionRange(p, 20, 30)).toEqual({ start: 2, end: 6 })
  })

  it('alpha falls off by decreaseBy each step and hits 0', () => {
    expect(ghostAlpha(1, 0.5, 0.2)).toBeCloseTo(0.4)
    expect(ghostAlpha(2, 0.5, 0.2)).toBeCloseTo(0.32)
    expect(ghostAlpha(0, 0.5, 0.2)).toBe(0)
    expect(ghostAlpha(1, 0.5, 1)).toBe(0)
  })
})

describe('collectGhosts', () => {
  const item = (id: number): RectItemJson => ({
    id, x: 0, y: 0, w: 10, h: 10, rotation: 0, fill: '#fff', stroke: null, stroke_width: 0,
  })
  const evaluate = (f: number): RectItemJson[] => (f === 3 ? [] : [item(f)])

  it('skips the playhead and empty evaluates; tints past vs future', () => {
    const prefs = { ...defaultOnionPrefs(), on: true, mode: 'follow' as const, prev: 2, next: 2 }
    const ghosts = collectGhosts(evaluate, prefs, 5, 20)
    // frame 3 evaluates empty → omitted; 4 past, 6/7 future
    expect(ghosts.map((g) => g.frame)).toEqual([4, 6, 7])
    expect(ghosts[0].tint).toBe('#ff6666')
    expect(ghosts[1].tint).toBe('#66cc66')
    expect(ghosts.every((g) => g.frame !== 5)).toBe(true)
  })

  it('off → no extra evaluate', () => {
    let calls = 0
    collectGhosts((f) => {
      calls += 1
      return evaluate(f)
    }, { ...defaultOnionPrefs(), on: false }, 5, 20)
    expect(calls).toBe(0)
  })
})

describe('onion prefs (session only)', () => {
  it('toggle does not invent document fields', () => {
    expect(loadOnionPrefs().on).toBe(false)
    expect(toggleOnion().on).toBe(true)
    expect(toggleOnionOutlines().outlines).toBe(true)
  })

  it('Onion 2 / 5 / All presets', () => {
    expect(setOnionPreset('5').prev).toBe(5)
    expect(setOnionPreset('all', 40)).toEqual(expect.objectContaining({ mode: 'anchor', start: 1, end: 40, on: true }))
  })

  it('dragging markers switches to an anchored range', () => {
    expect(setOnionAnchorRange(4, 9)).toEqual(expect.objectContaining({ mode: 'anchor', start: 4, end: 9, on: true }))
  })

  it('patch clamps garbage', () => {
    const next = patchOnionPrefs({ prev: -3, startOpacity: 4, decreaseBy: -1 })
    expect(next.prev).toBe(0)
    expect(next.startOpacity).toBe(1)
    expect(next.decreaseBy).toBe(0)
  })
})
