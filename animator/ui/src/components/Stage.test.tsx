import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the engine client so the Stage mounts with a "real" status/evaluate.
// selectAt/moveSelection are vi.fn()s so tests assert the exact pointer→engine
// contract (screen→doc coords, ONE move command per drag, no command on cancel).
vi.mock('../engine/client', () => ({
  getEngineStatus: () => ({ kind: 'ok' as const, detail: 'mock' }),
  statusJson: vi.fn(() => ({
    playhead: 1,
    selection: [1],
    selection_rects: [{ id: 1, x: 0, y: 0, w: 100, h: 100, rotation: 0 }],
    selection_details: [
      // wire-faithful: the engine's SelDetailJson always carries the paint
      // attributes the Properties panel and the Eyedropper read.
      { id: 1, x: 0, y: 0, w: 100, h: 100, base_w: 100, base_h: 100, scale_x: 1, scale_y: 1, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 },
    ],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    fps: 24,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    event_log: [],
  })),
  evaluate: () => [{ id: 1, x: 0, y: 0, w: 100, h: 100, rotation: 0, fill: '#ff0000', stroke: null, stroke_width: 0 }],
  selectAt: vi.fn((_x: number, _y: number) => true),
  selectToggleAt: vi.fn((_x: number, _y: number) => true),
  selectInRect: vi.fn(),
  transformSelection: vi.fn(),
  moveSelection: vi.fn(),
  drawShape: vi.fn((_shape: string, _x: number, _y: number, _w: number, _h: number, _fill: string, _stroke: string | null, _strokeWidth: number) => 2),
  hasShapeDrawFacade: () => true,
  placeSymbol: vi.fn((_s: number, _x: number, _y: number) => 3),
  swapInstance: vi.fn((_i: number, _s: number) => true),
  setNodeProps: vi.fn(),
}))

import { drawShape, moveSelection, placeSymbol, selectAt, selectInRect, selectToggleAt, setNodeProps, statusJson, swapInstance, transformSelection } from '../engine/client'
import { Stage } from './Stage'
import { defaultToolColors, loadToolColors, resetToolColorsCacheForTests, setToolColors } from '../toolColors'
import { resetToolOptionsForTests, setToolOptions } from '../toolOptions'

/** Adobe: new objects are drawn with the Tools-panel Fill Color (default white). */
const DEFAULT_FILL = defaultToolColors().fill as string
/** Default Stroke Color (black, 1px) — shape tools honor it at draw time (Part 02b). */
const DEFAULT_STROKE = defaultToolColors().stroke as string
const DEFAULT_SW = defaultToolColors().strokeWidth

beforeEach(() => {
  window.localStorage.clear()
  resetToolColorsCacheForTests()
  resetToolOptionsForTests()
})

const selectAtMock = vi.mocked(selectAt)
const selectToggleAtMock = vi.mocked(selectToggleAt)
const selectInRectMock = vi.mocked(selectInRect)
const transformSelectionMock = vi.mocked(transformSelection)
const moveSelectionMock = vi.mocked(moveSelection)
const drawShapeMock = vi.mocked(drawShape)
const setNodePropsMock = vi.mocked(setNodeProps)

function renderStage(tool = 'select') {
  return render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool={tool} playhead={1} tick={0} />)
}

function drag(canvas: HTMLElement, from: [number, number], to: [number, number]) {
  fireEvent.mouseDown(canvas, { button: 0, clientX: from[0], clientY: from[1] })
  fireEvent.mouseMove(window, { clientX: to[0], clientY: to[1] })
  fireEvent.mouseUp(window)
}

describe('Stage AI gesture-idle seam (AI-REQ-033)', () => {
  beforeEach(() => {
    drawShapeMock.mockClear()
  })

  it('reports an armed pointer gesture active until its commit finishes', () => {
    const onGestureActiveChange = vi.fn()
    render(
      <Stage
        engine={{ kind: 'ok', detail: 'mock' }}
        tool="oval"
        playhead={1}
        tick={0}
        onGestureActiveChange={onGestureActiveChange}
      />,
    )
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 20 })
    expect(onGestureActiveChange).toHaveBeenLastCalledWith(true)
    fireEvent.mouseMove(window, { clientX: 110, clientY: 70 })
    expect(onGestureActiveChange).toHaveBeenCalledTimes(1)
    fireEvent.mouseUp(window)
    expect(onGestureActiveChange.mock.calls).toEqual([[true], [false]])
  })

  it('returns to idle on pointer cancellation without committing the draw', () => {
    const onGestureActiveChange = vi.fn()
    render(
      <Stage
        engine={{ kind: 'ok', detail: 'mock' }}
        tool="rect"
        playhead={1}
        tick={0}
        onGestureActiveChange={onGestureActiveChange}
      />,
    )
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 110, clientY: 70 })
    fireEvent.pointerCancel(canvas)
    expect(onGestureActiveChange.mock.calls).toEqual([[true], [false]])
    expect(drawShapeMock).not.toHaveBeenCalled()
  })
})

describe('Stage viewport interaction wiring (regression)', () => {
  it('wheel zoom updates the readout immediately (canvas redraw triggered)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')

    fireEvent.wheel(canvas, { deltaY: -100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('110%'))

    fireEvent.wheel(canvas, { deltaY: 100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%'))
  })

  it('middle mousedown suppresses browser autoscroll (preventDefault called)', () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    expect(fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })).toBe(false)
    expect(fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })).toBe(true)
  })

  it('middle-button drag pans immediately and updates the pan readout', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    expect(screen.getByTestId('pan-readout')).toHaveTextContent('0,0')

    fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 30, clientY: 20 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('30,20'))
  })

  it('window mouseup safely ends a pan drag (no stale pan on later moves)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')

    fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 30, clientY: 0 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('30,0'))

    fireEvent.mouseUp(window)
    fireEvent.mouseMove(window, { clientX: 90, clientY: 0 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('30,0'))
  })

  it('double-click fits the viewport immediately', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')

    fireEvent.wheel(canvas, { deltaY: -100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('110%'))

    fireEvent.doubleClick(canvas)
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%'))
  })

  it('shows the document stage dimensions (the published frame)', () => {
    renderStage()
    expect(screen.getByTestId('stage-readout')).toHaveTextContent('1920×1080')
  })
})

describe('Stage view commands (zoom in/out, 100%, fit — Part 01 §1.2.3)', () => {
  it('Ctrl+= zooms in ×2 (view only)', async () => {
    renderStage()
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')
    fireEvent.keyDown(window, { key: '=', ctrlKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%'))
  })

  it('Ctrl+- zooms out ÷2', async () => {
    renderStage()
    fireEvent.keyDown(window, { key: '=', ctrlKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%'))
    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%'))
  })

  it('Ctrl+1 resets to 100%', async () => {
    renderStage()
    fireEvent.keyDown(window, { key: '=', ctrlKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%'))
    fireEvent.keyDown(window, { key: '1', ctrlKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%'))
  })

  it('Ctrl+0 fits the stage in the window', () => {
    renderStage()
    // jsdom viewport is 0×0 → fit degenerates to identity (zoom 100%), no crash
    fireEvent.keyDown(window, { key: '0', ctrlKey: true })
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')
  })

  it('typing in a text input does NOT trigger view commands', () => {
    renderStage()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: '=', ctrlKey: true })
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')
    document.body.removeChild(input)
  })
})

describe('Stage select + move gestures', () => {
  beforeEach(() => {
    selectAtMock.mockClear()
    moveSelectionMock.mockClear()
    selectAtMock.mockReturnValue(true)
  })

  it('click hits the engine at DOCUMENT coordinates (screen→doc via viewport)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // zoom is 1 after fit in jsdom → screen == doc
    fireEvent.mouseDown(canvas, { button: 0, clientX: 40, clientY: 60 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(selectAtMock).toHaveBeenCalledWith(40, 60))
  })

  it('sub-threshold drag does NOT commit a move (no accidental click-to-move)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 2, clientY: 0 }) // < 3px
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('drag past threshold commits exactly ONE move command with the DOC delta', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // start inside the rect (50,50) — away from the transform handles
    drag(canvas, [50, 50], [81, 50])
    await waitFor(() => expect(moveSelectionMock).toHaveBeenCalledTimes(1))
    expect(moveSelectionMock).toHaveBeenCalledWith(31, 0)
  })

  it('multiple pointermoves during one drag produce exactly ONE command', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 50, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 60, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 75, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 91, clientY: 50 })
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).toHaveBeenCalledTimes(1)
    expect(moveSelectionMock).toHaveBeenCalledWith(41, 0)
  })

  it('movement uses document coordinates under zoom (screen px ÷ zoom)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // zoom to 110%
    fireEvent.wheel(canvas, { deltaY: -100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('110%'))
    // 11 screen px at 1.1 zoom = 10 doc px; start inside the rect away from handles
    fireEvent.mouseDown(canvas, { button: 0, clientX: 55, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 66, clientY: 50 })
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).toHaveBeenCalledTimes(1)
    expect(moveSelectionMock.mock.calls[0][0]).toBeCloseTo(10, 5)
    expect(moveSelectionMock.mock.calls[0][1]).toBeCloseTo(0, 5)
  })

  it('non-zero pan does not affect the document delta', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // pan by (20, 10) first
    fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 20, clientY: 10 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('20,10'))

    // drag 11px at zoom 100% → doc delta 11 regardless of pan
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 111, clientY: 100 })
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).toHaveBeenCalledTimes(1)
    expect(moveSelectionMock.mock.calls[0][0]).toBeCloseTo(11, 5)
    expect(moveSelectionMock.mock.calls[0][1]).toBeCloseTo(0, 5)
  })

  it('click on empty stage clears selection and creates NO move command', async () => {
    selectAtMock.mockReturnValue(false)
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 500, clientY: 500 })
    fireEvent.mouseUp(window)
    expect(selectAtMock).toHaveBeenCalled()
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('pointer cancel discards the drag — NO command (Phase D/G)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 40, clientY: 0 })
    fireEvent.pointerCancel(canvas)
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('drag starting off-object (no hit) never arms a move', async () => {
    selectAtMock.mockReturnValue(false)
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 500, clientY: 500 })
    fireEvent.mouseMove(window, { clientX: 600, clientY: 500 })
    fireEvent.mouseUp(window)
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('select tool only reacts to left button (right/middle are ignored by select)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 2, clientX: 0, clientY: 0 }) // right button
    fireEvent.mouseMove(window, { clientX: 50, clientY: 0 })
    fireEvent.mouseUp(window)
    expect(selectAtMock).not.toHaveBeenCalled()
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })
})

describe('Stage transform + multi-selection gestures', () => {
  beforeEach(() => {
    selectAtMock.mockClear()
    selectToggleAtMock.mockClear()
    selectInRectMock.mockClear()
    transformSelectionMock.mockClear()
    moveSelectionMock.mockClear()
    selectAtMock.mockReturnValue(true)
  })

  it('drag on a corner handle commits exactly ONE transformSelection command', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // tl handle is at (0,0); drag it to (20,20) → scale
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 20, clientY: 20 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(transformSelectionMock).toHaveBeenCalledTimes(1))
    expect(moveSelectionMock).not.toHaveBeenCalled() // transform, not move
    const arg = transformSelectionMock.mock.calls[0][0] as Array<Record<string, number>>
    expect(arg).toHaveLength(1)
    expect(arg[0].scale_x).toBeLessThan(1) // dragging tl inward shrinks
  })

  it('drag on empty stage draws a marquee and commits selectInRect', async () => {
    selectAtMock.mockReturnValue(false)
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    // start far from the mock rect (0..100) so no handle and no hit
    fireEvent.mouseDown(canvas, { button: 0, clientX: 500, clientY: 500 })
    fireEvent.mouseMove(window, { clientX: 560, clientY: 540 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(selectInRectMock).toHaveBeenCalledTimes(1))
  })

  it('plain click on empty stage clears selection via a zero-area marquee', async () => {
    selectAtMock.mockReturnValue(false)
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 500, clientY: 500 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(selectInRectMock).toHaveBeenCalledTimes(1))
  })

  it('shift+click toggles selection (selectToggleAt)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 40, clientY: 60, shiftKey: true })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(selectToggleAtMock).toHaveBeenCalledTimes(1))
    expect(selectAtMock).not.toHaveBeenCalled() // shift path, not plain select
  })
})

describe('Stage rect-tool drawing (T2B.4)', () => {
  beforeEach(() => {
    drawShapeMock.mockClear()
    moveSelectionMock.mockClear()
  })

  function renderRectStage() {
    return render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool="rect" playhead={1} tick={0} />)
  }

  it('drag creates exactly ONE rect with normalized doc-space geometry', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 110, clientY: 70 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    // zoom is 1 after fit → screen == doc; Part 02b: fill AND stroke honored
    expect(drawShapeMock).toHaveBeenCalledWith('rect', 10, 20, 100, 50, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('reverse-direction drag normalizes to positive width/height', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 110, clientY: 70 }) // bottom-right
    fireEvent.mouseMove(window, { clientX: 10, clientY: 20 }) // → top-left
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('rect', 10, 20, 100, 50, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('sub-threshold click creates NO rect (no accidental object)', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 2, clientY: 1 })
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })

  it('pointer cancel discards the draw — NO rect, NO command', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 })
    fireEvent.pointerCancel(canvas)
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })

  it('two separate drags create two rect commands', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 50, clientY: 50 })
    fireEvent.mouseUp(window)
    fireEvent.mouseDown(canvas, { button: 0, clientX: 60, clientY: 60 })
    fireEvent.mouseMove(window, { clientX: 90, clientY: 90 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(2))
  })

  it('draw uses document coordinates under zoom (screen px ÷ zoom)', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.wheel(canvas, { deltaY: -100 }) // zoom to 110%
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('110%'))
    fireEvent.mouseDown(canvas, { button: 0, clientX: 11, clientY: 22 })
    fireEvent.mouseMove(window, { clientX: 22, clientY: 33 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    // 11px @1.1 zoom = 10 doc px; 22→22px=20doc
    expect(drawShapeMock.mock.calls[0][3]).toBeCloseTo(10, 5)
    expect(drawShapeMock.mock.calls[0][4]).toBeCloseTo(10, 5)
  })

  it('draw after pan keeps document coordinates correct', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    // pan (20,10)
    fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 20, clientY: 10 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('20,10'))
    // draw: screen (100,100)→(200,150); pan(20,10) → doc (80,90)→(180,140) = w100 h50
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 200, clientY: 150 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock.mock.calls[0][1]).toBeCloseTo(80, 5)
    expect(drawShapeMock.mock.calls[0][2]).toBeCloseTo(90, 5)
    expect(drawShapeMock.mock.calls[0][3]).toBeCloseTo(100, 5)
    expect(drawShapeMock.mock.calls[0][4]).toBeCloseTo(50, 5)
  })

  it('Shift-drag commits a square (longer side, start-corner anchor) — T2B.4', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50, shiftKey: true })
    fireEvent.mouseUp(window, { shiftKey: true })
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('rect', 0, 0, 100, 100, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('Alt-drag commits from the start point as center — T2B.4', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 120, altKey: true })
    fireEvent.mouseUp(window, { altKey: true })
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('rect', 50, 80, 100, 40, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('Escape mid-draw discards the rect — NO command (T2B.4 cancel)', async () => {
    renderRectStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })
})

describe('Stage oval-tool drawing (T2B.5)', () => {
  beforeEach(() => {
    drawShapeMock.mockClear()
  })

  function renderOvalStage() {
    return render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool="oval" playhead={1} tick={0} />)
  }

  it('drag commits exactly ONE oval with the bounding-box geometry', async () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 20 })
    fireEvent.mouseMove(window, { clientX: 110, clientY: 70 })
    fireEvent.mouseUp(window)
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('oval', 10, 20, 100, 50, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('Shift-drag commits a circle (square bounding box) — T2B.5 §6', async () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50, shiftKey: true })
    fireEvent.mouseUp(window, { shiftKey: true })
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('oval', 0, 0, 100, 100, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('Alt-drag draws from the centre — T2B.5 §6', async () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 120, altKey: true })
    fireEvent.mouseUp(window, { altKey: true })
    await waitFor(() => expect(drawShapeMock).toHaveBeenCalledTimes(1))
    expect(drawShapeMock).toHaveBeenCalledWith('oval', 50, 80, 100, 40, DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_SW)
  })

  it('honors the Fill AND Stroke swatches at draw time (Part 02b preamble)', () => {
    setToolColors({ fill: '#112233', stroke: '#445566', strokeWidth: 3 })
    renderOvalStage()
    drag(screen.getByTestId('stage-canvas'), [10, 10], [110, 60])
    expect(drawShapeMock).toHaveBeenCalledWith('oval', 10, 10, 100, 50, '#112233', '#445566', 3)
  })

  it('Escape mid-draw discards the oval — NO command (T2B.5 §11 cancel)', async () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })

  it('sub-threshold click creates NO oval (no accidental object)', async () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 2, clientY: 1 })
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })

  it('pointer cancel discards the draw — NO oval, NO command', () => {
    renderOvalStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 })
    fireEvent.pointerCancel(canvas)
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled()
  })

  it('shows the drawing crosshair cursor like the other shape tools', () => {
    renderOvalStage()
    expect(screen.getByTestId('stage-canvas').style.cursor).toBe('crosshair')
  })
})

describe('Stage — library drag-drop (place + swap)', () => {
  beforeEach(() => {
    vi.mocked(placeSymbol).mockClear()
    vi.mocked(swapInstance).mockClear()
    vi.mocked(placeSymbol).mockReturnValue(3)
    vi.mocked(statusJson).mockReturnValue({
      playhead: 1,
      selection: [],
      selection_rects: [],
      selection_details: [],
      undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0,
      fps: 24, doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 60, clipboard_len: 0, event_log: [],
    })
  })

  it('dropping a library symbol places an instance at finite doc coordinates', () => {
    renderStage()
    const wrap = screen.getByTestId('stage-wrap')
    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', { value: { getData: () => '5' } })
    Object.defineProperty(event, 'clientX', { value: 100 })
    Object.defineProperty(event, 'clientY', { value: 80 })
    wrap.dispatchEvent(event)
    expect(vi.mocked(placeSymbol)).toHaveBeenCalledTimes(1)
    const [sid, x, y] = vi.mocked(placeSymbol).mock.calls[0]
    expect(sid).toBe(5)
    expect(Number.isFinite(x)).toBe(true)
    expect(Number.isFinite(y)).toBe(true)
    expect(vi.mocked(swapInstance)).not.toHaveBeenCalled()
  })

  it('dropping onto a selected instance swaps instead of placing', () => {
    vi.mocked(statusJson).mockReturnValue({
      playhead: 1,
      selection: [1],
      selection_rects: [],
      selection_details: [
        { id: 1, x: 0, y: 0, w: 100, h: 100, base_w: 100, base_h: 100, scale_x: 1, scale_y: 1, rotation: 0, fill: '', stroke: null, stroke_width: 0, kind: 'instance', symbol_name: 'a', symbol_type: 'graphic' },
      ],
      undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0,
      fps: 24, doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 60, clipboard_len: 0, event_log: [],
    })
    renderStage()
    const wrap = screen.getByTestId('stage-wrap')
    const event = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', { value: { getData: () => '9' } })
    Object.defineProperty(event, 'clientX', { value: 0 })
    Object.defineProperty(event, 'clientY', { value: 0 })
    wrap.dispatchEvent(event)
    expect(vi.mocked(swapInstance)).toHaveBeenCalledWith(1, 9)
    expect(vi.mocked(placeSymbol)).not.toHaveBeenCalled()
  })
})

// ————————————————————————————————————————————————————————————————
// View tools — Adobe Animate "Use the Stage and Tools panel":
//  · Hand tool: "select the Hand tool and drag the Stage"; "To temporarily
//    switch between another tool and the Hand tool, hold down the Spacebar."
//  · Zoom tool: "click the element" (in), "Alt-click (Windows)… to zoom out",
//    "To zoom in so that a specific area of your drawing fills the window,
//    drag a rectangular selection on the Stage with the Zoom tool."
// ————————————————————————————————————————————————————————————————

/** jsdom gives elements a 0×0 box — give the stage a real size when the test
 *  exercises view math that depends on the viewport size (fit / zoom-to-area). */
function sizeStage(w: number, h: number): void {
  const wrap = screen.getByTestId('stage-wrap')
  Object.defineProperty(wrap, 'clientWidth', { value: w, configurable: true })
  Object.defineProperty(wrap, 'clientHeight', { value: h, configurable: true })
}

describe('Stage — Hand tool (H)', () => {
  it('dragging with the Hand tool pans the view', async () => {
    renderStage('hand')
    const canvas = screen.getByTestId('stage-canvas')
    expect(screen.getByTestId('pan-readout')).toHaveTextContent('0,0')

    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 140, clientY: 130 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('40,30'))
    fireEvent.mouseUp(window)

    // pan ended: further movement must not keep panning
    fireEvent.mouseMove(window, { clientX: 300, clientY: 300 })
    expect(screen.getByTestId('pan-readout')).toHaveTextContent('40,30')
  })

  it('the Hand tool never touches the document (no selection / draw calls)', () => {
    renderStage('hand')
    const canvas = screen.getByTestId('stage-canvas')
    drag(canvas, [10, 10], [80, 60])
    expect(selectAtMock).not.toHaveBeenCalled()
    expect(drawShapeMock).not.toHaveBeenCalled()
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('shows a grab cursor and marks the canvas with the active tool', () => {
    renderStage('hand')
    const canvas = screen.getByTestId('stage-canvas')
    expect(canvas).toHaveAttribute('data-tool', 'hand')
    expect(canvas.style.cursor).toBe('grab')
  })
})

describe('Stage — Spacebar = temporary Hand tool', () => {
  it('holding Space pans with any tool active, and releasing restores it', async () => {
    renderStage('rect')
    const canvas = screen.getByTestId('stage-canvas')

    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    await waitFor(() => expect(screen.getByTestId('tool-readout')).toHaveTextContent('hand (space)'))
    expect(canvas).toHaveAttribute('data-tool', 'hand')

    fireEvent.mouseDown(canvas, { button: 0, clientX: 50, clientY: 50 })
    fireEvent.mouseMove(window, { clientX: 70, clientY: 90 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('20,40'))
    fireEvent.mouseUp(window)
    expect(drawShapeMock).not.toHaveBeenCalled() // the rect tool did NOT draw

    fireEvent.keyUp(window, { code: 'Space', key: ' ' })
    await waitFor(() => expect(screen.getByTestId('tool-readout')).toHaveTextContent('rect'))
  })

  it('Space typed into a text field never hijacks the tool', () => {
    renderStage('select')
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { code: 'Space', key: ' ' })
    expect(screen.getByTestId('tool-readout')).toHaveTextContent('select')
    input.remove()
  })

  it('window blur releases a stuck Spacebar override', async () => {
    renderStage('select')
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    await waitFor(() => expect(screen.getByTestId('tool-readout')).toHaveTextContent('hand (space)'))
    fireEvent.blur(window)
    await waitFor(() => expect(screen.getByTestId('tool-readout')).toHaveTextContent('select'))
  })
})

describe('Stage — Zoom tool (Z)', () => {
  it('click zooms IN around the pointer', async () => {
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(window, { clientX: 100, clientY: 100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%'))
  })

  it('Alt+click zooms OUT (Adobe: "Alt‑click (Windows) … to zoom out")', async () => {
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(window, { clientX: 100, clientY: 100, altKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('50%'))
  })

  it('dragging a rectangle magnifies that area (and never edits the document)', async () => {
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    sizeStage(800, 600)
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10 })
    fireEvent.mouseMove(window, { clientX: 210, clientY: 110 })
    fireEvent.mouseUp(window, { clientX: 210, clientY: 110 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).not.toHaveTextContent('100%'))
    expect(selectInRectMock).not.toHaveBeenCalled()
    expect(drawShapeMock).not.toHaveBeenCalled()
    expect(moveSelectionMock).not.toHaveBeenCalled()
  })

  it('Escape cancels an in-progress zoom marquee (view unchanged)', async () => {
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 10, clientY: 10 })
    fireEvent.mouseMove(window, { clientX: 210, clientY: 110 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.mouseUp(window, { clientX: 210, clientY: 110 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%'))
  })

  it('shows the magnifier cursor', () => {
    renderStage('zoom')
    expect(screen.getByTestId('stage-canvas').style.cursor).toBe('zoom-in')
  })
})

describe('Stage — Free Transform tool (Q) drives the pointer (BUG-TOOL-005)', () => {
  it('clicking with the transform tool selects, like the Selection tool', () => {
    renderStage('transform')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 40, clientY: 40 })
    fireEvent.mouseUp(window)
    expect(selectAtMock).toHaveBeenCalled()
  })

  it('dragging the selection with the transform tool commits ONE move command', () => {
    renderStage('transform')
    const canvas = screen.getByTestId('stage-canvas')
    drag(canvas, [40, 40], [90, 70])
    expect(moveSelectionMock).toHaveBeenCalledTimes(1)
  })

  it('dragging a scale handle commits one transformSelection command', () => {
    renderStage('transform')
    const canvas = screen.getByTestId('stage-canvas')
    // the mocked selection is the doc rect (0,0,100,100); its bottom-right
    // handle sits at doc (100,100) = screen (100,100) at zoom 1 / pan 0.
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(window)
    expect(transformSelectionMock).toHaveBeenCalledTimes(1)
  })

  it('the rect tool is unaffected by the transform tool wiring', () => {
    renderStage('rect')
    const canvas = screen.getByTestId('stage-canvas')
    drag(canvas, [10, 10], [60, 50])
    expect(drawShapeMock).toHaveBeenCalled()
  })
})

// ————————————————————————————————————————————————————————————————
// Paint tools — Adobe "Strokes, fills, and gradients with Animate":
//  · "The Tools panel Stroke Color and Fill Color controls set the painting
//    attributes of new objects you create with the drawing and painting tools."
//  · Paint Bucket "fills enclosed areas with color… change the color of already
//    painted areas."
//  · Ink Bottle changes "the stroke color, width, and style".
//  · Eyedropper "copies fill and stroke attributes"; clicking a filled area
//    "automatically changes to the Paint Bucket tool".
// ————————————————————————————————————————————————————————————————

/** A wire-faithful status snapshot with ONE painted rect selected. Set
 *  explicitly because earlier describes replace the shared statusJson mock. */
function mockPaintedRectStatus(over: { fill?: string; stroke?: string | null; stroke_width?: number } = {}): void {
  vi.mocked(statusJson).mockReturnValue({
    playhead: 1,
    selection: [1],
    selection_rects: [{ id: 1, x: 0, y: 0, w: 100, h: 100, rotation: 0 }],
    selection_details: [
      {
        id: 1, x: 0, y: 0, w: 100, h: 100, base_w: 100, base_h: 100, scale_x: 1, scale_y: 1, rotation: 0,
        fill: over.fill ?? '#ff0000', stroke: over.stroke ?? null, stroke_width: over.stroke_width ?? 0,
      },
    ],
    undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0,
    fps: 24, doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 60, clipboard_len: 0, event_log: [],
  })
}

describe('Stage — Rectangle tool uses the Fill Color swatch (BUG-TOOL-007)', () => {
  it('draws with the current fill, not a hard-coded blue', () => {
    mockPaintedRectStatus()
    setToolColors({ fill: '#22cc88' })
    renderStage('rect')
    const canvas = screen.getByTestId('stage-canvas')
    drag(canvas, [10, 10], [110, 60])
    expect(drawShapeMock).toHaveBeenLastCalledWith('rect', 10, 10, 100, 50, '#22cc88', DEFAULT_STROKE, DEFAULT_SW)
  })
})

describe('Stage — Paint Bucket tool (K)', () => {
  beforeEach(() => {
    setNodePropsMock.mockClear()
    selectAtMock.mockClear()
    selectAtMock.mockReturnValue(true)
    mockPaintedRectStatus()
  })

  it('clicking an object repaints it with the current fill (one command)', () => {
    setToolColors({ fill: '#ff8800' })
    renderStage('bucket')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    expect(setNodePropsMock).toHaveBeenCalledTimes(1)
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, fill: '#ff8800' }])
  })

  it('clicking empty stage paints nothing', () => {
    selectAtMock.mockReturnValue(false)
    vi.mocked(statusJson).mockReturnValue({
      playhead: 1, selection: [], selection_rects: [], selection_details: [],
      undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0,
      fps: 24, doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 60, clipboard_len: 0, event_log: [],
    })
    renderStage('bucket')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 900, clientY: 900 })
    expect(setNodePropsMock).not.toHaveBeenCalled()
  })

  it('a fill of None paints nothing (Adobe "no color" modifier)', () => {
    setToolColors({ fill: null })
    renderStage('bucket')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    expect(setNodePropsMock).not.toHaveBeenCalled()
  })
})

describe('Stage — Ink Bottle tool (S)', () => {
  beforeEach(() => {
    setNodePropsMock.mockClear()
    selectAtMock.mockReturnValue(true)
    mockPaintedRectStatus()
  })

  it('applies the stroke color AND width to the clicked object', () => {
    setToolColors({ stroke: '#123456', strokeWidth: 4 })
    renderStage('ink')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    expect(setNodePropsMock).toHaveBeenCalledWith([
      { id: 1, stroke_enabled: true, stroke: '#123456', stroke_width: 4 },
    ])
  })

  it('a stroke of None removes the stroke', () => {
    setToolColors({ stroke: null })
    renderStage('ink')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    expect(setNodePropsMock).toHaveBeenCalledWith([{ id: 1, stroke_enabled: false }])
  })
})

describe('Stage — Eyedropper tool (I)', () => {
  beforeEach(() => {
    setNodePropsMock.mockClear()
    selectAtMock.mockReturnValue(true)
    mockPaintedRectStatus()
  })

  it('copies the clicked object\u2019s paint attributes into the swatches', () => {
    renderStage('eyedropper')
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    // the mocked object has fill #ff0000 and no stroke
    expect(loadToolColors().fill).toBe('#ff0000')
    expect(loadToolColors().stroke).toBeNull()
    expect(setNodePropsMock).not.toHaveBeenCalled() // picking never edits the document
  })

  it('switches to the Paint Bucket after picking a fill (Adobe behavior)', () => {
    const onToolChange = vi.fn()
    render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool="eyedropper" playhead={1} tick={0} onToolChange={onToolChange} />)
    fireEvent.mouseDown(screen.getByTestId('stage-canvas'), { button: 0, clientX: 30, clientY: 30 })
    expect(onToolChange).toHaveBeenCalledWith('bucket')
  })
})

describe('Stage — Zoom tool Enlarge/Reduce modifier (Adobe options area)', () => {
  beforeEach(() => resetToolOptionsForTests())

  it('Reduce mode makes a plain click zoom OUT', async () => {
    setToolOptions({ zoomMode: 'out' })
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(window, { clientX: 100, clientY: 100 })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('50%'))
  })

  it('Alt+click reverses the modifier (Reduce + Alt = zoom in)', async () => {
    setToolOptions({ zoomMode: 'out' })
    renderStage('zoom')
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(window, { clientX: 100, clientY: 100, altKey: true })
    await waitFor(() => expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%'))
  })

  it('the cursor shows which direction the click will zoom', async () => {
    renderStage('zoom')
    expect(screen.getByTestId('stage-canvas').style.cursor).toBe('zoom-in')
    setToolOptions({ zoomMode: 'out' })
    await waitFor(() => expect(screen.getByTestId('stage-canvas').style.cursor).toBe('zoom-out'))
  })
})

describe('Stage — engine-missing notice is actionable', () => {
  it('tells the user the exact command that builds the engine bundle', () => {
    render(<Stage engine={{ kind: 'error', detail: 'wasm not found' }} tool="select" playhead={1} tick={0} />)
    expect(screen.getByTestId('stage-notice')).toHaveTextContent('Core not attached')
    expect(screen.getByTestId('stage-notice-fix')).toHaveTextContent('npm run wasm')
  })
})
