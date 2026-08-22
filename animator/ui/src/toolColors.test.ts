import { beforeEach, describe, expect, it } from 'vitest'
import {
  TOOL_COLORS_KEY,
  defaultToolColors,
  isHexColor,
  loadToolColors,
  resetToolColors,
  resetToolColorsCacheForTests,
  setToolColors,
  subscribeToolColors,
  swapToolColors,
} from './toolColors'

/**
 * Tools-panel colors area (Adobe — "Strokes, fills, and gradients with
 * Animate"): "The Tools panel Stroke Color and Fill Color controls set the
 * painting attributes of new objects you create with the drawing and painting
 * tools… the Colors section has controls for quickly resetting colors to the
 * default, setting the stroke and fill color settings to None, and swapping
 * fill and stroke colors."
 *
 * App preference, never document state: no undo entry, never persisted into the
 * project file.
 */
beforeEach(() => {
  window.localStorage.clear()
  resetToolColorsCacheForTests()
})

describe('toolColors', () => {
  it('defaults to Adobe\u2019s black stroke / white fill', () => {
    expect(loadToolColors()).toEqual({ fill: '#ffffff', stroke: '#000000', strokeWidth: 1 })
  })

  it('persists to localStorage and reloads exactly', () => {
    setToolColors({ fill: '#123456', strokeWidth: 3 })
    resetToolColorsCacheForTests()
    expect(loadToolColors()).toEqual({ fill: '#123456', stroke: '#000000', strokeWidth: 3 })
    expect(window.localStorage.getItem(TOOL_COLORS_KEY)).toContain('#123456')
  })

  it('supports the "None" modifier for fill and stroke', () => {
    setToolColors({ fill: null, stroke: null })
    expect(loadToolColors().fill).toBeNull()
    expect(loadToolColors().stroke).toBeNull()
  })

  it('swaps fill and stroke', () => {
    setToolColors({ fill: '#aaaaaa', stroke: '#222222' })
    swapToolColors()
    expect(loadToolColors().fill).toBe('#222222')
    expect(loadToolColors().stroke).toBe('#aaaaaa')
  })

  it('resets to the default colors', () => {
    setToolColors({ fill: '#123456', stroke: null, strokeWidth: 9 })
    resetToolColors()
    expect(loadToolColors()).toEqual(defaultToolColors())
  })

  it('rejects junk instead of guessing (garbage colour → default, negative width → 0)', () => {
    window.localStorage.setItem(TOOL_COLORS_KEY, JSON.stringify({ fill: 'red', stroke: 42, strokeWidth: -5 }))
    resetToolColorsCacheForTests()
    const c = loadToolColors()
    expect(c.fill).toBe('#ffffff')
    expect(c.stroke).toBe('#000000')
    expect(c.strokeWidth).toBe(0)
  })

  it('survives corrupt storage', () => {
    window.localStorage.setItem(TOOL_COLORS_KEY, '{not json')
    resetToolColorsCacheForTests()
    expect(loadToolColors()).toEqual(defaultToolColors())
  })

  it('notifies subscribers on every change and stops after unsubscribe', () => {
    let n = 0
    const off = subscribeToolColors(() => {
      n += 1
    })
    setToolColors({ fill: '#010101' })
    swapToolColors()
    expect(n).toBe(2)
    off()
    setToolColors({ fill: '#020202' })
    expect(n).toBe(2)
  })

  it('isHexColor accepts #rgb and #rrggbb only', () => {
    expect(isHexColor('#fff')).toBe(true)
    expect(isHexColor('#ff00aa')).toBe(true)
    expect(isHexColor('fff')).toBe(false)
    expect(isHexColor('rgb(1,2,3)')).toBe(false)
    expect(isHexColor(null)).toBe(false)
  })
})
