import { describe, expect, it } from 'vitest'
import { SELECTION_STROKE, HANDLE_SIZE, PASTEBOARD_COLOR, STAGE_BORDER } from './canvasRenderer'

/**
 * Canvas contract tests: the editor-only overlay color, call order (pasteboard
 * → stage → content → overlays), stage boundary drawing, move preview
 * translating only the selection, and the rect draw preview. Geometry math
 * lives in the pure viewport/transformMath tests; the Rust `evaluate` tests
 * cover document-side determinism.
 */
describe('canvas renderer contract', () => {
  it('selection overlay uses the editor-only stroke color (never in export)', () => {
    expect(SELECTION_STROKE).toBe('#0a7cff')
    expect(HANDLE_SIZE).toBeGreaterThan(0)
  })

  it('draws pasteboard → stage → content → marquee/preview → overlay (content before overlays)', async () => {
    const { render } = await import('./canvasRenderer')
    const calls: string[] = []
    const fills: Array<Array<number>> = []
    const ctx = {
      clearRect: () => calls.push('clear'),
      fillRect: (...a: number[]) => {
        calls.push('fillRect')
        fills.push(a)
      },
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
        stageW: 1920,
        stageH: 1080,
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
    // first fill = pasteboard (whole canvas), second = stage rect
    expect(fills[0]).toEqual([0, 0, 100, 100])
    expect(fills[1]).toEqual([0, 0, 1920, 1080])
  })

  it('stage boundary is drawn from document bounds (pasteboard → stage fill → stage border)', async () => {
    const { render } = await import('./canvasRenderer')
    const fillStyles: string[] = []
    const fills: Array<Array<number>> = []
    const strokes: Array<Array<number>> = []
    const strokeStyles: string[] = []
    let currentFill = ''
    let currentStroke = ''
    const ctx = {
      clearRect: () => {},
      fillRect: (...a: number[]) => {
        fills.push(a)
        fillStyles.push(currentFill)
      },
      strokeRect: (...a: number[]) => {
        strokes.push(a)
        strokeStyles.push(currentStroke)
      },
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
        currentFill = v
      },
      set strokeStyle(v: string) {
        currentStroke = v
      },
      set lineWidth(_v: number) {},
      get fillStyle() {
        return currentFill
      },
      get strokeStyle() {
        return currentStroke
      },
      get lineWidth() {
        return 0
      },
    } as unknown as CanvasRenderingContext2D

    render(
      ctx,
      { zoom: 0.5, panX: 10, panY: 20 },
      {
        background: '#00ff00',
        stageW: 1920,
        stageH: 1080,
        items: [],
      },
      1000,
      800,
    )

    // pasteboard fill is gray; stage fill uses the doc background color
    expect(fillStyles[0]).toBe(PASTEBOARD_COLOR)
    expect(fillStyles[1]).toBe('#00ff00')
    // stage rect at doc(0,0) scaled by zoom + pan
    expect(fills[1]).toEqual([10, 20, 960, 540])
    // stage border stroked with the stage border color
    expect(strokes).toHaveLength(1)
    expect(strokeStyles[0]).toBe(STAGE_BORDER)
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
        stageW: 1920,
        stageH: 1080,
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
        stageW: 1920,
        stageH: 1080,
        items: [],
        previewRect: { x: 10, y: 20, w: 30, h: 40 }, // doc-space
      },
      200,
      200,
    )

    // fills[0] = pasteboard, fills[1] = stage, fills[2] = preview at screen coords (×2 zoom)
    expect(fills[2]).toEqual([20, 40, 60, 80])
    expect(fillStyles).toContain('rgba(63, 155, 245, 0.2)')
  })
})

describe('live color preview (Part 26.12 / C-09 — renderer-only, never exported)', () => {
  function recordingCtx() {
    const fillStyles: string[] = []
    const strokeStyles: string[] = []
    const lineWidths: number[] = []
    let currentFill = ''
    let currentStroke = ''
    let currentWidth = 0
    const ctx = {
      clearRect: () => {},
      fillRect: () => fillStyles.push(currentFill),
      strokeRect: () => {
        strokeStyles.push(currentStroke)
        lineWidths.push(currentWidth)
      },
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
        currentFill = v
      },
      set strokeStyle(v: string) {
        currentStroke = v
      },
      set lineWidth(v: number) {
        currentWidth = v
      },
      get fillStyle() {
        return currentFill
      },
      get strokeStyle() {
        return currentStroke
      },
      get lineWidth() {
        return currentWidth
      },
    } as unknown as CanvasRenderingContext2D
    return { ctx, fillStyles, strokeStyles, lineWidths }
  }

  it('colorPreview.background overrides the drawn stage fill (live doc-bg preview)', async () => {
    const { render } = await import('./canvasRenderer')
    const { ctx, fillStyles } = recordingCtx()
    render(
      ctx,
      { zoom: 1, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        stageW: 1920,
        stageH: 1080,
        items: [],
        colorPreview: { background: '#123456' },
      },
      100,
      100,
    )
    // fills: [pasteboard #2b2b2b, stage #123456]
    expect(fillStyles[1]).toBe('#123456')
  })

  it('colorPreview.item overrides fill/stroke/strokeWidth of the matching object', async () => {
    const { render } = await import('./canvasRenderer')
    const { ctx, fillStyles, strokeStyles, lineWidths } = recordingCtx()
    render(
      ctx,
      { zoom: 2, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        stageW: 1920,
        stageH: 1080,
        items: [
          { id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0, fill: '#ff0000', stroke: '#0000ff', stroke_width: 10 },
          { id: 2, x: 100, y: 0, w: 10, h: 10, rotation: 0, fill: '#00ff00', stroke: null, stroke_width: 0 },
        ],
        colorPreview: { item: { id: 1, fill: '#aa00aa', stroke: '#ffff00', strokeWidth: 4 } },
      },
      200,
      200,
    )
    // object 1 fill overridden; object 2 untouched
    expect(fillStyles[2]).toBe('#aa00aa') // fills[0]=pasteboard, [1]=stage, [2]=obj1
    expect(fillStyles[3]).toBe('#00ff00') // obj2 keeps its fill
    // strokeRect[0] = stage border; [1] = object 1 stroke (color + width×zoom); obj2 has no stroke
    expect(strokeStyles[1]).toBe('#ffff00')
    expect(lineWidths[1]).toBe(8) // 4 × zoom 2
  })

  it('without colorPreview the engine values are drawn unchanged', async () => {
    const { render } = await import('./canvasRenderer')
    const { ctx, fillStyles, strokeStyles, lineWidths } = recordingCtx()
    render(
      ctx,
      { zoom: 1, panX: 0, panY: 0 },
      {
        background: '#ffffff',
        stageW: 1920,
        stageH: 1080,
        items: [{ id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0, fill: '#ff0000', stroke: '#0000ff', stroke_width: 10 }],
      },
      100,
      100,
    )
    expect(fillStyles[2]).toBe('#ff0000')
    // strokeRect[0] = stage border; [1] = the object's stroke
    expect(strokeStyles[1]).toBe('#0000ff')
    expect(lineWidths[1]).toBe(10)
  })
})
