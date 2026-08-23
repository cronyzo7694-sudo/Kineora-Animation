import { describe, expect, it, beforeEach } from 'vitest'
import {
  appendPenPoint,
  clearPenDraft,
  constrain45,
  penPoints,
  penPreviewPoints,
  registerPenFinisher,
  requestPenFinish,
  resetPenDraftForTests,
  setPenCursor,
} from './penDraft'

beforeEach(() => resetPenDraftForTests())

describe('penDraft', () => {
  it('appends points and rubber-bands to the cursor', () => {
    appendPenPoint({ x: 0, y: 0 })
    appendPenPoint({ x: 10, y: 0 })
    setPenCursor({ x: 10, y: 10 })
    expect(penPoints()).toHaveLength(2)
    expect(penPreviewPoints(true)).toHaveLength(3)
    expect(penPreviewPoints(false)).toHaveLength(2)
  })

  it('constrains to 45°', () => {
    const p = constrain45({ x: 0, y: 0 }, { x: 10, y: 2 })
    expect(p.y).toBeCloseTo(0, 5)
    expect(p.x).toBeGreaterThan(9)
  })

  it('finish callback commits then can be cleared', () => {
    appendPenPoint({ x: 0, y: 0 })
    appendPenPoint({ x: 4, y: 0 })
    let closed: boolean | null = null
    registerPenFinisher((c) => {
      closed = c
      clearPenDraft()
      return true
    })
    expect(requestPenFinish(true)).toBe(true)
    expect(closed).toBe(true)
    expect(penPoints()).toHaveLength(0)
  })
})
