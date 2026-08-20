import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock the engine client so the Stage mounts with a "real" status/evaluate.
vi.mock('../engine/client', () => ({
  getEngineStatus: () => ({ kind: 'ok' as const, detail: 'mock' }),
  statusJson: () => ({
    playhead: 1,
    selection: [],
    selection_rects: [],
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
  evaluate: () => [],
}))

import { Stage } from './Stage'

function renderStage() {
  return render(<Stage engine={{ kind: 'ok', detail: 'mock' }} tool="select" playhead={1} tick={0} />)
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
    // fireEvent returns FALSE when preventDefault() was called (dispatchEvent
    // semantics) → middle button must be prevented (autoscroll killed)…
    expect(fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })).toBe(false)
    // …left button must NOT be prevented (future tools use it).
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
    // drag has ended → a further move must NOT change the pan
    fireEvent.mouseMove(window, { clientX: 90, clientY: 0 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('30,0'))
  })

  it('pointer cancel safely ends a pan drag (Phase-3 §22 cleanup path)', async () => {
    renderStage()
    const canvas = screen.getByTestId('stage-canvas')

    fireEvent.mouseDown(canvas, { button: 1, clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 10, clientY: 0 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('10,0'))

    fireEvent.pointerCancel(canvas)
    fireEvent.mouseMove(window, { clientX: 50, clientY: 0 })
    await waitFor(() => expect(screen.getByTestId('pan-readout')).toHaveTextContent('10,0'))
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
