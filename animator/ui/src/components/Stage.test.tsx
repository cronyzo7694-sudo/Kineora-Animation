import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the engine client so the Stage mounts with a "real" status/evaluate.
// selectAt/moveSelection are vi.fn()s so tests assert the exact pointer→engine
// contract (screen→doc coords, ONE move command per drag, no command on cancel).
vi.mock('../engine/client', () => ({
  getEngineStatus: () => ({ kind: 'ok' as const, detail: 'mock' }),
  statusJson: () => ({
    playhead: 1,
    selection: [1],
    selection_rects: [{ id: 1, x: 0, y: 0, w: 100, h: 100 }],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    fps: 24,
    doc_width: 800,
    doc_height: 600,
    background: '#ffffff',
    event_log: [],
  }),
  evaluate: () => [{ id: 1, x: 0, y: 0, w: 100, h: 100, fill: '#ff0000', stroke: null, stroke_width: 0 }],
  selectAt: vi.fn((_x: number, _y: number) => true),
  moveSelection: vi.fn(),
}))

import { moveSelection, selectAt } from '../engine/client'
import { Stage } from './Stage'

const selectAtMock = vi.mocked(selectAt)
const moveSelectionMock = vi.mocked(moveSelection)

function renderStage(tool = 'select') {
  return render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool={tool} playhead={1} tick={0} />)
}

function drag(canvas: HTMLElement, from: [number, number], to: [number, number]) {
  fireEvent.mouseDown(canvas, { button: 0, clientX: from[0], clientY: from[1] })
  fireEvent.mouseMove(window, { clientX: to[0], clientY: to[1] })
  fireEvent.mouseUp(window)
}

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
    drag(canvas, [0, 0], [31, 0])
    await waitFor(() => expect(moveSelectionMock).toHaveBeenCalledTimes(1))
    expect(moveSelectionMock).toHaveBeenCalledWith(31, 0)
  })

  it('multiple pointermoves during one drag produce exactly ONE command', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 10, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 25, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 41, clientY: 0 })
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
    // 11 screen px at 1.1 zoom = 10 doc px
    fireEvent.mouseDown(canvas, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 11, clientY: 0 })
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
