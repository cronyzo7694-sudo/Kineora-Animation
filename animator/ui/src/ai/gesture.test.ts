import { describe, expect, it } from 'vitest'
import { isGestureActive, setGestureActive } from './gesture'

describe('stage gesture occupancy', () => {
  it('is idle until Stage marks a pointer gesture', () => {
    setGestureActive(false)
    expect(isGestureActive()).toBe(false)
    setGestureActive(true)
    expect(isGestureActive()).toBe(true)
    setGestureActive(false)
    expect(isGestureActive()).toBe(false)
  })
})
