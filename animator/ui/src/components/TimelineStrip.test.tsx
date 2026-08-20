import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  setPlayhead: vi.fn(),
  setActiveLayer: vi.fn(() => true),
}))

vi.mock('../engine/actions', () => ({
  performAction: vi.fn(),
}))

import { setActiveLayer, setPlayhead } from '../engine/client'
import { performAction } from '../engine/actions'
import { TimelineStrip, CELL_W, NAME_W } from './TimelineStrip'
import type { StatusJson } from '../engine/wasmTypes'

const setPlayheadMock = vi.mocked(setPlayhead)
const setActiveLayerMock = vi.mocked(setActiveLayer)
const performActionMock = vi.mocked(performAction)
const notify = vi.fn()

function makeStatus(overrides: Partial<StatusJson> = {}): StatusJson {
  return {
    playhead: 1,
    selection: [],
    selection_rects: [],
    selection_details: [],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    layers: [
      {
        id: 1,
        name: 'Layer 1',
        visible: true,
        locked: false,
        active: true,
        selected_objects: 0,
        keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }, { frame: 20, blank: true }],
      },
      {
        id: 2,
        name: 'Layer 2',
        visible: true,
        locked: false,
        active: false,
        selected_objects: 0,
        keyframes: [{ frame: 1, blank: false }],
      },
    ],
    active_layer: 0,
    fps: 24,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    duration: 20,
    event_log: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  notify.mockClear()
})

describe('TimelineStrip — frame grid visual language (Part 07 §7.2)', () => {
  it('renders the frame ruler numbers (1, 5, 10, 15, 20)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    for (const f of [1, 5, 10, 15, 20]) {
      expect(screen.getByTestId(`frame-num-${f}`)).toBeInTheDocument()
    }
  })

  it('renders solid keyframe dots (blank=false) and hollow blank dots (blank=true)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('kf-dot-0-1')).toHaveAttribute('data-blank', 'false')
    expect(screen.getByTestId('kf-dot-0-10')).toHaveAttribute('data-blank', 'false')
    expect(screen.getByTestId('kf-dot-0-20')).toHaveAttribute('data-blank', 'true')
  })

  it('renders held cells between a content keyframe and the next keyframe', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('cell-0-2')).toHaveAttribute('data-kind', 'held')
    expect(screen.getByTestId('cell-0-9')).toHaveAttribute('data-kind', 'held')
    expect(screen.getByTestId('cell-0-10')).toHaveAttribute('data-kind', 'key')
    expect(screen.getByTestId('cell-0-21')).toHaveAttribute('data-kind', 'empty')
  })

  it('positions the playhead at the playhead frame', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 3 })} notify={notify} />)
    const left = NAME_W + (3 - 1) * CELL_W - 1
    expect(screen.getByTestId('playhead')).toHaveStyle(`left: ${left}px`)
  })

  it('shows a current-frame indicator on the ruler', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 4 })} notify={notify} />)
    const left = NAME_W + (4 - 1) * CELL_W
    expect(screen.getByTestId('current-frame-indicator')).toHaveStyle(`left: ${left}px`)
  })
})

describe('TimelineStrip — interaction: ruler/handle navigate, cells select (no playhead move)', () => {
  it('clicking the RULER jumps the playhead (engine setPlayhead)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const clientX = NAME_W + (7 - 1) * CELL_W + 2
    fireEvent.mouseDown(screen.getByTestId('timeline-ruler'), { button: 0, clientX })
    fireEvent.mouseUp(window)
    expect(setPlayheadMock).toHaveBeenCalledWith(7)
  })

  it('dragging on the RULER scrubs the playhead', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('timeline-ruler'), { button: 0, clientX: NAME_W + (2 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (4 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (9 - 1) * CELL_W })
    fireEvent.mouseUp(window)
    expect(setPlayheadMock).toHaveBeenCalledWith(2)
    expect(setPlayheadMock).toHaveBeenCalledWith(4)
    expect(setPlayheadMock).toHaveBeenCalledWith(9)
  })

  it('dragging the PLAYHEAD HANDLE scrubs the playhead', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 3 })} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('playhead-handle'), { button: 0, clientX: NAME_W + (3 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (6 - 1) * CELL_W })
    fireEvent.mouseUp(window)
    expect(setPlayheadMock).toHaveBeenCalledWith(6)
  })

  it('clicking a frame CELL selects it WITHOUT moving the playhead', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-7'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('cell-0-7')).toHaveAttribute('data-selected', 'true')
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })

  it('clicking another cell moves the selection (single selection)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-7'), { button: 0 })
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0 })
    expect(screen.getByTestId('cell-0-7')).toHaveAttribute('data-selected', 'false')
    expect(screen.getByTestId('cell-0-3')).toHaveAttribute('data-selected', 'true')
  })

  it('shift+click toggles a cell in/out of the selection', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-5'), { button: 0 })
    fireEvent.mouseDown(screen.getByTestId('cell-0-8'), { button: 0, shiftKey: true })
    expect(screen.getByTestId('cell-0-5')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('cell-0-8')).toHaveAttribute('data-selected', 'true')
    // toggle off
    fireEvent.mouseDown(screen.getByTestId('cell-0-8'), { button: 0, shiftKey: true })
    expect(screen.getByTestId('cell-0-8')).toHaveAttribute('data-selected', 'false')
  })

  it('keyframe cells are selectable like any cell', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-10'), { button: 0 }) // keyframe @10
    expect(screen.getByTestId('cell-0-10')).toHaveAttribute('data-selected', 'true')
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })

  it('clicking a layer name activates that layer', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline-layer-name-1'))
    expect(setActiveLayerMock).toHaveBeenCalledWith(1)
  })
})

describe('TimelineStrip — frame ops + keyboard', () => {
  it('frame-op buttons dispatch the right engine actions', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline.key'))
    expect(performActionMock).toHaveBeenCalledWith('timeline.keyframe', notify)
    fireEvent.click(screen.getByTestId('timeline.blank'))
    expect(performActionMock).toHaveBeenCalledWith('timeline.blank', notify)
    fireEvent.click(screen.getByTestId('timeline.clear'))
    expect(performActionMock).toHaveBeenCalledWith('timeline.clear', notify)
  })

  it('keyboard: F6=keyframe, F7=blank, Shift+F6=clear, Home/End jump', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 5, duration: 20 })} notify={notify} />)
    fireEvent.keyDown(window, { key: 'F6' })
    expect(performActionMock).toHaveBeenCalledWith('timeline.keyframe', notify)
    fireEvent.keyDown(window, { key: 'F7' })
    expect(performActionMock).toHaveBeenCalledWith('timeline.blank', notify)
    fireEvent.keyDown(window, { key: 'F6', shiftKey: true })
    expect(performActionMock).toHaveBeenCalledWith('timeline.clear', notify)
    fireEvent.keyDown(window, { key: 'Home' })
    expect(setPlayheadMock).toHaveBeenCalledWith(1)
    fireEvent.keyDown(window, { key: 'End' })
    expect(setPlayheadMock).toHaveBeenCalledWith(20)
  })

  it('typing in an input does NOT trigger timeline shortcuts', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'F6' })
    expect(performActionMock).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('engine not attached → honest hint, disabled buttons, no engine calls', () => {
    render(<TimelineStrip status={null} notify={notify} />)
    expect(screen.getByTestId('timeline-not-attached')).toBeInTheDocument()
    expect(screen.getByTestId('timeline.key')).toBeDisabled()
    expect(screen.getByTestId('timeline.blank')).toBeDisabled()
    expect(screen.getByTestId('timeline.clear')).toBeDisabled()
    fireEvent.click(screen.getByTestId('timeline.key'))
    expect(performActionMock).not.toHaveBeenCalled()
  })
})
