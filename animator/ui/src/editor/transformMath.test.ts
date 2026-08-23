import { describe, expect, it } from 'vitest'
import {
  aabbOf,
  handlePositions,
  oppositeHandle,
  pickHandle,
  pointInRects,
  rotationDelta,
  rotateSelection,
  scaleFactors,
  scaleSelection,
  selectionGeometry,
  translatePt,
  translatePts,
  type SelDetail,
} from './transformMath'

function detail(over: Partial<SelDetail> = {}): SelDetail {
  return {
    id: 1,
    x: 0,
    y: 0,
    w: 100,
    h: 50,
    base_w: 100,
    base_h: 50,
    scale_x: 1,
    scale_y: 1,
    rotation: 0,
    ...over,
  }
}

describe('selection geometry', () => {
  it('single unrotated rect: box corners = rect corners', () => {
    const g = selectionGeometry([detail()])
    expect(g.box).toHaveLength(4)
    expect(g.center).toEqual({ x: 50, y: 25 })
    expect(aabbOf(g.box)).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })

  it('rotated rect corners are rotated around center', () => {
    const g = selectionGeometry([detail({ rotation: 90 })])
    // 100×50 rotated 90° → AABB 50×100, center unchanged
    expect(aabbOf(g.box).w).toBeCloseTo(50, 4)
    expect(aabbOf(g.box).h).toBeCloseTo(100, 4)
    expect(g.center.x).toBeCloseTo(50, 4)
    expect(g.center.y).toBeCloseTo(25, 4)
  })

  it('multi-selection uses the AABB union box', () => {
    const g = selectionGeometry([detail(), detail({ id: 2, x: 200, y: 0 })])
    expect(aabbOf(g.box)).toEqual({ x: 0, y: 0, w: 300, h: 50 })
    expect(g.center).toEqual({ x: 150, y: 25 })
  })

  it('handle positions produce 8 scale handles + rotate handle', () => {
    const g = selectionGeometry([detail()])
    const h = handlePositions(g)
    expect(Object.keys(h)).toHaveLength(9)
    expect(h.tl).toEqual({ x: 0, y: 0 })
    expect(h.br).toEqual({ x: 100, y: 50 })
    expect(h.rotate.y).toBeLessThan(h.t.y) // rotate is above top-center
  })
})

describe('scale factors + scale selection', () => {
  it('corner handle scales both axes', () => {
    // tl handle at (0,0), anchor br at (100,50); drag tl to (-50,0) → sx=(50)/(100)=0.5
    const f = scaleFactors('tl', { x: 0, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 0 }, false)
    expect(f.sx).toBeCloseTo(0.5, 4)
    expect(f.sy).toBeCloseTo(1, 4)
  })

  it('shift forces uniform proportional scale on corners', () => {
    const f = scaleFactors('tl', { x: 0, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 0 }, true)
    expect(f.sx).toBeCloseTo(f.sy, 4)
  })

  it('edge handle scales only its axis', () => {
    const f = scaleFactors('r', { x: 100, y: 25 }, { x: 0, y: 25 }, { x: 200, y: 25 }, false)
    expect(f.sx).toBeCloseTo(2, 4)
    expect(f.sy).toBe(1)
  })

  it('scaleSelection scales around the anchor (opposite corner)', () => {
    const out = scaleSelection([detail()], { x: 100, y: 50 }, 2, 2) // anchor = br, ×2
    const t = out[0]
    // center (50,25) scaled around (100,50): new center = (0,0); scale_x=2 → w=200,h=100 → top-left = (-100,-50)
    expect(t.scale_x).toBe(2)
    expect(t.x).toBeCloseTo(-100, 4)
    expect(t.y).toBeCloseTo(-50, 4)
  })
})

describe('rotation', () => {
  it('rotationDelta computes pointer angle delta', () => {
    const c = { x: 0, y: 0 }
    expect(rotationDelta(c, { x: 100, y: 0 }, { x: 0, y: 100 }, false)).toBeCloseTo(90, 4)
  })

  it('shift snaps rotation to 15°', () => {
    const c = { x: 0, y: 0 }
    const d = rotationDelta(c, { x: 100, y: 0 }, { x: 70, y: 40 }, true)
    expect(Math.abs(d % 15)).toBeLessThan(1e-6)
  })

  it('rotateSelection rotates centers around the anchor and adds rotation', () => {
    const out = rotateSelection([detail()], { x: 50, y: 25 }, 90)
    const t = out[0]
    expect(t.rotation).toBeCloseTo(90, 4)
    // center stays (rotation around own center), top-left unchanged (w/h unchanged)
    expect(t.x).toBeCloseTo(0, 4)
    expect(t.y).toBeCloseTo(0, 4)
  })
})

describe('handle picking', () => {
  it('pickHandle finds the handle within radius', () => {
    const h = {
      tl: { x: 0, y: 0 },
      t: { x: 50, y: 0 },
      tr: { x: 100, y: 0 },
      r: { x: 100, y: 25 },
      br: { x: 100, y: 50 },
      b: { x: 50, y: 50 },
      bl: { x: 0, y: 50 },
      l: { x: 0, y: 25 },
      rotate: { x: 50, y: -24 },
    }
    expect(pickHandle(h, 100, 50, 8)).toBe('br')
    expect(pickHandle(h, 100, 50, 8)).toBe('br')
    expect(pickHandle(h, 999, 999, 8)).toBeNull()
  })

  it('oppositeHandle returns the opposite corner/edge', () => {
    const g = selectionGeometry([detail()])
    expect(oppositeHandle(g, 'tl')).toEqual({ x: 100, y: 50 })
    expect(oppositeHandle(g, 't')).toEqual({ x: 50, y: 50 })
  })
})
