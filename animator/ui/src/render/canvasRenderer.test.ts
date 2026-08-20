import { describe, expect, it } from 'vitest'
import { SELECTION_STROKE } from './canvasRenderer'

/**
 * Renderer determinism/geometry is covered by the pure viewport tests above and
 * the Rust `evaluate` tests; here we assert the canvas contract's stable parts:
 * the selection overlay color (editor-only) and that a mocked 2D context
 * receives the expected call order (content before selection).
 */
describe('canvas renderer contract', () => {
  it('selection overlay uses the editor-only stroke color (never in export)', () => {
    expect(SELECTION_STROKE).toBe('#0a7cff')
  })

  it('draws background → rects → selection in that order', async () => {
    // Import the render function and drive a fake ctx recording call order.
    const { render } = await import('./canvasRenderer')
    const calls: string[] = []
    const ctx = {
      clearRect: () => calls.push('clear'),
      fillRect: () => calls.push('fillRect'),
      strokeRect: () => calls.push('strokeRect'),
      setLineDash: () => {},
      set fillStyle(_v: string) {},
      set strokeStyle(_v: string) {},
      set lineWidth(_v: number) {},
      get fillStyle() {
        return ''
      },
      get strokeStyle() {
        return ''
      },
      get lineWidth() {
        return 0
      },
    } as unknown as CanvasRenderingContext2D

    render(
      ctx,
      { zoom: 1, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        items: [{ id: 1, x: 0, y: 0, w: 10, h: 10, fill: '#ff0000', stroke: null, stroke_width: 0 }],
        selection: [{ id: 1, x: 0, y: 0, w: 10, h: 10 }],
      },
      100,
      100,
    )

    const firstFill = calls.indexOf('fillRect')
    const firstStroke = calls.indexOf('strokeRect')
    expect(firstFill).toBeGreaterThan(-1)
    expect(firstStroke).toBeGreaterThan(firstFill) // selection stroke AFTER content fill
    expect(calls[0]).toBe('clear')
  })

  it('drag preview translates the SELECTED rect in document space (renderer-only)', async () => {
    const { render } = await import('./canvasRenderer')
    const fills: Array<Array<number>> = []
    const ctx = {
      clearRect: () => {},
      fillRect: (...a: number[]) => fills.push(a),
      strokeRect: () => {},
      setLineDash: () => {},
      set fillStyle(_v: string) {},
      set strokeStyle(_v: string) {},
      set lineWidth(_v: number) {},
      get fillStyle() {
        return ''
      },
      get strokeStyle() {
        return ''
      },
      get lineWidth() {
        return 0
      },
    } as unknown as CanvasRenderingContext2D

    render(
      ctx,
      { zoom: 1, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        items: [
          { id: 1, x: 0, y: 0, w: 10, h: 10, fill: '#ff0000', stroke: null, stroke_width: 0 }, // selected
          { id: 2, x: 100, y: 0, w: 10, h: 10, fill: '#00ff00', stroke: null, stroke_width: 0 }, // not selected
        ],
        selection: [{ id: 1, x: 0, y: 0, w: 10, h: 10 }],
        previewDelta: { x: 5, y: 3 },
      },
      200,
      200,
    )

    // fills[0] = background; fills[1] = selected rect (translated); fills[2] = unselected rect (unchanged)
    expect(fills[1]).toEqual([5, 3, 10, 10])
    expect(fills[2]).toEqual([100, 0, 10, 10])
  })
})
