import { describe, expect, it } from 'vitest'
import { SELECTION_STROKE, HANDLE_SIZE } from './canvasRenderer'

/**
 * Canvas contract tests: the editor-only overlay color, call order (content
 * before overlays), move preview translating only the selection, and the rect
 * draw preview. Geometry math lives in the pure viewport/transformMath tests;
 * the Rust `evaluate` tests cover document-side determinism.
 */
describe('canvas renderer contract', () => {
  it('selection overlay uses the editor-only stroke color (never in export)', () => {
    expect(SELECTION_STROKE).toBe('#0a7cff')
    expect(HANDLE_SIZE).toBeGreaterThan(0)
  })

  it('draws background → content → marquee/preview → overlay (content before overlays)', async () => {
    const { render } = await import('./canvasRenderer')
    const calls: string[] = []
    const ctx = {
      clearRect: () => calls.push('clear'),
      fillRect: () => calls.push('fillRect'),
      strokeRect: () => calls.push('strokeRect'),
      setLineDash: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => calls.push('path-stroke'),
      fill: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
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
        items: [{ id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 }],
        overlay: {
          box: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          handles: [['tl', { x: 0, y: 0 }]],
          rotateHandle: { x: 5, y: -24 },
          center: { x: 5, y: 5 },
        },
      },
      100,
      100,
    )

    const firstFill = calls.indexOf('fillRect')
    const firstOverlayStroke = calls.indexOf('path-stroke')
    expect(firstFill).toBeGreaterThan(-1)
    expect(firstOverlayStroke).toBeGreaterThan(firstFill) // overlay AFTER content
    expect(calls[0]).toBe('clear')
  })

  it('move preview translates ONLY the selected rect (center-based)', async () => {
    const { render } = await import('./canvasRenderer')
    const translates: Array<Array<number>> = []
    const ctx = {
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      setLineDash: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      translate: (...a: number[]) => translates.push(a),
      rotate: () => {},
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
          { id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 }, // selected
          { id: 2, x: 100, y: 0, w: 10, h: 10, rotation: 0, fill: '#00ff00', stroke: null, stroke_width: 0 }, // not selected
        ],
        selectedIds: [1],
        previewDelta: { x: 5, y: 3 },
      },
      200,
      200,
    )

    // translate calls: [selected center+off], [unselected center]
    expect(translates[0]).toEqual([10, 8]) // center (5,5) + (5,3)
    expect(translates[1]).toEqual([105, 5]) // center (105,5), no offset
  })

  it('rect draw preview is drawn AFTER content (editor-only, translucent fill)', async () => {
    const { render } = await import('./canvasRenderer')
    const fills: Array<Array<number>> = []
    const fillStyles: string[] = []
    const ctx = {
      clearRect: () => {},
      fillRect: (...a: number[]) => fills.push(a),
      strokeRect: () => {},
      setLineDash: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      set fillStyle(v: string) {
        fillStyles.push(v)
      },
      set strokeStyle(_v: string) {},
      set lineWidth(_v: number) {},
      get fillStyle() {
        return fillStyles[fillStyles.length - 1] ?? ''
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
      { zoom: 2, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        items: [],
        previewRect: { x: 10, y: 20, w: 30, h: 40 }, // doc-space
      },
      200,
      200,
    )

    // fills[0] = background; fills[1] = preview rect at screen coords (×2 zoom)
    expect(fills[1]).toEqual([20, 40, 60, 80])
    expect(fillStyles).toContain('rgba(63, 155, 245, 0.2)')
  })
})
