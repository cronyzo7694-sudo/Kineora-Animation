import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  setPlayhead: vi.fn(),
  setActiveLayer: vi.fn(() => true),
  duplicateKeyframe: vi.fn(() => true),
  copyFrames: vi.fn(() => true),
  cutFrames: vi.fn(() => true),
  pasteFrames: vi.fn(() => true),
  removeFrames: vi.fn(() => true),
  reverseFrames: vi.fn(() => true),
  setClassicTween: vi.fn(() => true),
  removeClassicTween: vi.fn(() => true),
  moveKeyframeSequence: vi.fn(() => true),
  resizeSpan: vi.fn(() => true),
  duplicateFrames: vi.fn(() => true),
  convertToKeyframes: vi.fn(() => true),
  convertToBlankKeyframes: vi.fn(() => true),
  setFrameLabel: vi.fn(() => true),
}))

vi.mock('../engine/actions', () => ({
  performAction: vi.fn(),
  isLoopEnabled: () => true,
  isPlaying: () => false,
  isPaused: () => false,
  playbackState: () => 'IDLE',
  setLoopEnabled: vi.fn(),
  togglePlay: vi.fn(),
  stopPlayback: vi.fn(),
  pausePlayback: vi.fn(),
  seekPlayhead: vi.fn(),
}))

import {
  convertToBlankKeyframes,
  convertToKeyframes,
  copyFrames,
  cutFrames,
  duplicateFrames,
  duplicateKeyframe,
  moveKeyframeSequence,
  pasteFrames,
  removeClassicTween,
  removeFrames,
  resizeSpan,
  reverseFrames,
  setActiveLayer,
  setClassicTween,
  setFrameLabel,
  setPlayhead,
} from '../engine/client'
import { performAction, setLoopEnabled, seekPlayhead } from '../engine/actions'
import { TimelineStrip, CELL_W, NAME_W } from './TimelineStrip'
import type { StatusJson } from '../engine/wasmTypes'

const setPlayheadMock = vi.mocked(setPlayhead)
// Commands (Home/End/step/keyframe-hop) route through SYS-09's seekPlayhead
// (which emits playhead:moved); the timeline's own ruler/scrub buttons call
// setPlayhead directly. Both are spied so tests assert the right boundary.
const seekPlayheadMock = vi.mocked(seekPlayhead)
const setActiveLayerMock = vi.mocked(setActiveLayer)
const moveKeyframeSequenceMock = vi.mocked(moveKeyframeSequence)
const duplicateKeyframeMock = vi.mocked(duplicateKeyframe)
const copyFramesMock = vi.mocked(copyFrames)
const cutFramesMock = vi.mocked(cutFrames)
const pasteFramesMock = vi.mocked(pasteFrames)
const removeFramesMock = vi.mocked(removeFrames)
const reverseFramesMock = vi.mocked(reverseFrames)
const setClassicTweenMock = vi.mocked(setClassicTween)
const removeClassicTweenMock = vi.mocked(removeClassicTween)
const resizeSpanMock = vi.mocked(resizeSpan)
const duplicateFramesMock = vi.mocked(duplicateFrames)
const convertToKeyframesMock = vi.mocked(convertToKeyframes)
const convertToBlankKeyframesMock = vi.mocked(convertToBlankKeyframes)
const setFrameLabelMock = vi.mocked(setFrameLabel)
const performActionMock = vi.mocked(performAction)
const setLoopEnabledMock = vi.mocked(setLoopEnabled)
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
        tweens: [],
      },
      {
        id: 2,
        name: 'Layer 2',
        visible: true,
        locked: false,
        active: false,
        selected_objects: 0,
        keyframes: [{ frame: 1, blank: false }],
        tweens: [],
      },
    ],
    active_layer: 0,
    fps: 24,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    duration: 20,
    clipboard_len: 0,
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
    fireEvent.mouseUp(window)
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('cell-0-7')).toHaveAttribute('data-selected', 'false')
    expect(screen.getByTestId('cell-0-3')).toHaveAttribute('data-selected', 'true')
  })

  it('shift+click toggles a cell in/out of the selection', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-5'), { button: 0 })
    fireEvent.mouseUp(window)
    fireEvent.mouseDown(screen.getByTestId('cell-0-8'), { button: 0, shiftKey: true })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('cell-0-5')).toHaveAttribute('data-selected', 'true')
    expect(screen.getByTestId('cell-0-8')).toHaveAttribute('data-selected', 'true')
    // toggle off
    fireEvent.mouseDown(screen.getByTestId('cell-0-8'), { button: 0, shiftKey: true })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('cell-0-8')).toHaveAttribute('data-selected', 'false')
  })

  it('keyframe cells are selectable like any cell', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-10'), { button: 0 }) // keyframe @10
    fireEvent.mouseUp(window)
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

  it('F5/Shift+F5 buttons dispatch insert/delete frame actions', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline.insertframe'))
    expect(performActionMock).toHaveBeenCalledWith('timeline.insertframe', notify)
    fireEvent.click(screen.getByTestId('timeline.deleteframe'))
    expect(performActionMock).toHaveBeenCalledWith('timeline.deleteframe', notify)
  })

  it('keyboard: F5=insert frame, Shift+F5=delete frame', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.keyDown(window, { key: 'F5' })
    expect(performActionMock).toHaveBeenCalledWith('timeline.insertframe', notify)
    fireEvent.keyDown(window, { key: 'F5', shiftKey: true })
    expect(performActionMock).toHaveBeenCalledWith('timeline.deleteframe', notify)
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
    expect(seekPlayheadMock).toHaveBeenCalledWith(1)
    fireEvent.keyDown(window, { key: 'End' })
    expect(seekPlayheadMock).toHaveBeenCalledWith(20)
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

describe('TimelineStrip — duration viewport (no artificial 60-frame limit)', () => {
  it('scrubbing far right auto-extends the viewport past frame 60 (no clamp)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // scrub the ruler out to frame 100 → the viewport must extend, not clamp
    const clientX = NAME_W + (100 - 1) * CELL_W + 2
    fireEvent.mouseDown(screen.getByTestId('timeline-ruler'), { button: 0, clientX })
    fireEvent.mouseUp(window)
    expect(setPlayheadMock).toHaveBeenCalledWith(100)
    // ruler + cells now extend well past 60
    expect(screen.getByTestId('frame-num-100')).toBeInTheDocument()
    expect(screen.getByTestId('cell-0-100')).toBeInTheDocument()
  })

  it('a playhead beyond 60 is rendered (viewport covers the playhead)', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 90, duration: 90 })} notify={notify} />)
    expect(screen.getByTestId('cell-0-90')).toBeInTheDocument()
    expect(screen.getByTestId('frame-num-90')).toBeInTheDocument()
  })

  it('the frame readout reflects the playhead, not a fixed cap', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 100, duration: 100 })} notify={notify} />)
    expect(screen.getByTestId('timeline-frame-readout')).toHaveTextContent('100')
  })
})

describe('TimelineStrip — locked-layer edit-state honesty', () => {
  it('frame-op buttons are disabled when the ACTIVE layer is locked', () => {
    const locked = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: true, locked: true, active: true, selected_objects: 0, keyframes: [{ frame: 1, blank: false }], tweens: [] },
        { id: 2, name: 'Layer 2', visible: true, locked: false, active: false, selected_objects: 0, keyframes: [], tweens: [] },
      ],
    })
    render(<TimelineStrip status={locked} notify={notify} />)
    expect(screen.getByTestId('timeline.key')).toBeDisabled()
    expect(screen.getByTestId('timeline.blank')).toBeDisabled()
    expect(screen.getByTestId('timeline.clear')).toBeDisabled()
    expect(screen.getByTestId('timeline-locked-hint')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('timeline.key'))
    expect(performActionMock).not.toHaveBeenCalled()
  })

  it('frame-op buttons are enabled when the active layer is unlocked', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('timeline.key')).toBeEnabled()
    expect(screen.getByTestId('timeline.blank')).toBeEnabled()
    expect(screen.getByTestId('timeline.clear')).toBeEnabled()
    expect(screen.getByTestId('timeline.insertframe')).toBeEnabled()
    expect(screen.getByTestId('timeline.deleteframe')).toBeEnabled()
  })
})

describe('TimelineStrip — hidden-layer indicator (F-07-02 E4)', () => {
  it('shows a red X marker next to a hidden layer name and none on visible layers', () => {
    const st = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0, keyframes: [{ frame: 1, blank: false }], tweens: [] },
        { id: 2, name: 'Layer 2', visible: false, locked: false, active: false, selected_objects: 0, keyframes: [], tweens: [] },
      ],
    })
    render(<TimelineStrip status={st} notify={notify} />)
    expect(screen.getByTestId('timeline-layer-hidden-1')).toBeInTheDocument()
    expect(screen.queryByTestId('timeline-layer-hidden-0')).not.toBeInTheDocument()
  })
})

describe('TimelineStrip — keyframe drag (move + Alt-duplicate)', () => {
  it('dragging a keyframe dot commits ONE moveKeyframeSequence(layer, from, to, overwrite)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10') // keyframe @10 on layer 0
    const startX = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: startX })
    fireEvent.mouseMove(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    fireEvent.mouseUp(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    expect(moveKeyframeSequenceMock).toHaveBeenCalledTimes(1)
    expect(moveKeyframeSequenceMock).toHaveBeenCalledWith(0, 10, 14, false)
    expect(duplicateKeyframeMock).not.toHaveBeenCalled()
  })

  it('Alt-dragging a keyframe dot commits ONE duplicateKeyframe', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const startX = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: startX, altKey: true })
    fireEvent.mouseMove(window, { clientX: NAME_W + (16 - 1) * CELL_W })
    fireEvent.mouseUp(window, { clientX: NAME_W + (16 - 1) * CELL_W, altKey: true })
    expect(duplicateKeyframeMock).toHaveBeenCalledTimes(1)
    expect(duplicateKeyframeMock).toHaveBeenCalledWith(0, 10, 16)
    expect(moveKeyframeSequenceMock).not.toHaveBeenCalled()
  })

  it('a plain click on a dot (below threshold) selects the cell, no command', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const x = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: x })
    fireEvent.mouseMove(window, { clientX: x + 1 }) // 1px < 3px threshold
    fireEvent.mouseUp(window, { clientX: x + 1 })
    expect(moveKeyframeSequenceMock).not.toHaveBeenCalled()
    expect(duplicateKeyframeMock).not.toHaveBeenCalled()
    expect(screen.getByTestId('cell-0-10')).toHaveAttribute('data-selected', 'true')
  })

  it('zero-delta drag commits no command', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const x = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: x })
    fireEvent.mouseMove(window, { clientX: x + 20 }) // past threshold
    fireEvent.mouseMove(window, { clientX: x }) // back to origin
    fireEvent.mouseUp(window, { clientX: x })
    expect(moveKeyframeSequenceMock).not.toHaveBeenCalled()
  })

  it('Escape cancels the drag — no command', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const x = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: x })
    fireEvent.mouseMove(window, { clientX: x + 40 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.mouseUp(window, { clientX: x + 40 })
    expect(moveKeyframeSequenceMock).not.toHaveBeenCalled()
    expect(duplicateKeyframeMock).not.toHaveBeenCalled()
  })
})

describe('TimelineStrip — timeline zoom (F-07-03 ruler zoom, view state)', () => {
  it('zoom in/out changes the readout and remaps the playhead position', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 3 })} notify={notify} />)
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('100%')
    const baseLeft = NAME_W + (3 - 1) * CELL_W - 1
    expect(screen.getByTestId('playhead')).toHaveStyle(`left: ${baseLeft}px`)

    fireEvent.click(screen.getByTestId('timeline-zoom-in')) // 200%
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('200%')
    expect(screen.getByTestId('playhead')).toHaveStyle(`left: ${NAME_W + (3 - 1) * CELL_W * 2 - 1}px`)

    fireEvent.click(screen.getByTestId('timeline-zoom-out'))
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('100%')
  })

  it('zoom is clamped to the 50%..400% range', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByTestId('timeline-zoom-in'))
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('400%')
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByTestId('timeline-zoom-out'))
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('50%')
  })

  it('ruler numbers adapt: sparser when zoomed out, denser when zoomed in', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // 1× (18px) → every 5
    expect(screen.getByTestId('frame-num-5')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('timeline-zoom-out')) // 0.5× (9px) → every 10
    expect(screen.queryByTestId('frame-num-5')).not.toBeInTheDocument()
    expect(screen.getByTestId('frame-num-10')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('timeline-zoom-in')) // back to 1×
    fireEvent.click(screen.getByTestId('timeline-zoom-in')) // 2× (36px) → every 2
    expect(screen.getByTestId('frame-num-2')).toBeInTheDocument()
  })

  it('zooming does NOT change the playhead frame (view-only)', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 7 })} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline-zoom-in'))
    fireEvent.click(screen.getByTestId('timeline-zoom-in'))
    expect(screen.getByTestId('timeline-frame-readout')).toHaveTextContent('7')
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })

  it('keyframe drag still targets the right frame after zooming', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline-zoom-in')) // 2× → cellW 36
    const dot = screen.getByTestId('kf-dot-0-10')
    const startX = NAME_W + (10 - 1) * CELL_W * 2
    fireEvent.mouseDown(dot, { button: 0, clientX: startX })
    fireEvent.mouseMove(window, { clientX: NAME_W + (14 - 1) * CELL_W * 2 })
    fireEvent.mouseUp(window, { clientX: NAME_W + (14 - 1) * CELL_W * 2 })
    expect(moveKeyframeSequenceMock).toHaveBeenCalledWith(0, 10, 14, false)
  })
})

describe('TimelineStrip — transport + loop (Part 07 §7.1.5, F-07-04)', () => {
  it('. and , step the playhead by one frame', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 5 })} notify={notify} />)
    fireEvent.keyDown(window, { key: '.' })
    expect(seekPlayheadMock).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(window, { key: ',' })
    expect(seekPlayheadMock).toHaveBeenLastCalledWith(4)
  })

  it(', clamps to frame 1', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 1 })} notify={notify} />)
    fireEvent.keyDown(window, { key: ',' })
    expect(seekPlayheadMock).toHaveBeenLastCalledWith(1)
  })

  it('Alt+. and Alt+, hop between keyframes on the active layer', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 5 })} notify={notify} />)
    // active layer 0 keyframes: 1, 10, 20
    fireEvent.keyDown(window, { key: '.', altKey: true })
    expect(seekPlayheadMock).toHaveBeenLastCalledWith(10)
    fireEvent.keyDown(window, { key: ',', altKey: true })
    expect(seekPlayheadMock).toHaveBeenLastCalledWith(1)
  })

  it('Alt+. at the last keyframe is a no-op', () => {
    render(<TimelineStrip status={makeStatus({ playhead: 20 })} notify={notify} />)
    seekPlayheadMock.mockClear()
    fireEvent.keyDown(window, { key: '.', altKey: true })
    expect(seekPlayheadMock).not.toHaveBeenCalled()
  })

  it('first/last buttons jump the playhead', () => {
    render(<TimelineStrip status={makeStatus({ duration: 20 })} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline-first'))
    expect(setPlayheadMock).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByTestId('timeline-last'))
    expect(setPlayheadMock).toHaveBeenCalledWith(20)
  })

  it('center button scrolls without throwing (no document change)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('timeline-center')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('timeline-center'))
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })

  it('loop toggle flips the loop view state (no engine call)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const loop = screen.getByTestId('timeline-loop')
    expect(loop).toHaveAttribute('data-on', 'true')
    fireEvent.click(loop)
    expect(loop).toHaveAttribute('data-on', 'false')
    expect(setLoopEnabledMock).toHaveBeenCalledWith(false)
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })
})

describe('TimelineStrip — frame range selection + clipboard/sequence ops (UNIT E)', () => {
  it('dragging across cells selects a contiguous range (engineering 07 drag=range)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const startX = NAME_W + (3 - 1) * CELL_W
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0, clientX: startX })
    fireEvent.mouseMove(window, { clientX: NAME_W + (6 - 1) * CELL_W })
    fireEvent.mouseUp(window)
    for (const f of [3, 4, 5, 6]) {
      expect(screen.getByTestId(`cell-0-${f}`)).toHaveAttribute('data-selected', 'true')
    }
    expect(screen.getByTestId('cell-0-2')).toHaveAttribute('data-selected', 'false')
    expect(screen.getByTestId('cell-0-7')).toHaveAttribute('data-selected', 'false')
    // selection does NOT move the playhead
    expect(setPlayheadMock).not.toHaveBeenCalled()
  })

  it('copy button dispatches copyFrames(layer, min, max) for the selected range', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // select range 3..6 on layer 0
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0, clientX: NAME_W + (3 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (6 - 1) * CELL_W })
    fireEvent.mouseUp(window)
    fireEvent.click(screen.getByTestId('timeline-copy'))
    expect(copyFramesMock).toHaveBeenCalledWith(0, 3, 6)
  })

  it('cut/reverse/remove dispatch their engine ops with the selected range', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-4'), { button: 0, clientX: NAME_W + (4 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (8 - 1) * CELL_W })
    fireEvent.mouseUp(window)

    fireEvent.click(screen.getByTestId('timeline-cut'))
    expect(cutFramesMock).toHaveBeenCalledWith(0, 4, 8)
    fireEvent.click(screen.getByTestId('timeline-reverse'))
    expect(reverseFramesMock).toHaveBeenCalledWith(0, 4, 8)
    fireEvent.click(screen.getByTestId('timeline-remove'))
    expect(removeFramesMock).toHaveBeenCalledWith(0, 4, 8)
  })

  it('paste button dispatches pasteFrames(activeLayer, playhead)', () => {
    render(<TimelineStrip status={makeStatus({ clipboard_len: 2, playhead: 7 })} notify={notify} />)
    expect(screen.getByTestId('timeline-paste')).toBeEnabled()
    fireEvent.click(screen.getByTestId('timeline-paste'))
    expect(pasteFramesMock).toHaveBeenCalledWith(0, 7)
  })

  it('sequence-op buttons are disabled without a selection', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('timeline-copy')).toBeDisabled()
    expect(screen.getByTestId('timeline-cut')).toBeDisabled()
    expect(screen.getByTestId('timeline-reverse')).toBeDisabled()
    expect(screen.getByTestId('timeline-remove')).toBeDisabled()
  })

  it('paste button is disabled with an empty clipboard', () => {
    render(<TimelineStrip status={makeStatus({ clipboard_len: 0 })} notify={notify} />)
    expect(screen.getByTestId('timeline-paste')).toBeDisabled()
  })

  it('mutating sequence-ops are disabled on locked layers; copy stays enabled (read-only)', () => {
    const locked = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: true, locked: true, active: true, selected_objects: 0, keyframes: [{ frame: 1, blank: false }], tweens: [] },
      ],
    })
    render(<TimelineStrip status={locked} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-copy')).toBeEnabled()
    expect(screen.getByTestId('timeline-cut')).toBeDisabled()
    expect(screen.getByTestId('timeline-reverse')).toBeDisabled()
    expect(screen.getByTestId('timeline-remove')).toBeDisabled()
  })
})

describe('TimelineStrip — classic tween (Part 09.2: span visuals + create/remove/ease)', () => {
  it('renders a blue tween span with an arrow at the end cell', () => {
    const tweened = makeStatus({
      layers: [
        {
          id: 1,
          name: 'Layer 1',
          visible: true,
          locked: false,
          active: true,
          selected_objects: 0,
          keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }],
          tweens: [{ start: 1, end: 10, ease: 0 }],
        },
      ],
    })
    render(<TimelineStrip status={tweened} notify={notify} />)
    for (const f of [1, 5, 10]) {
      expect(screen.getByTestId(`cell-0-${f}`)).toHaveAttribute('data-tween', 'true')
    }
    expect(screen.getByTestId('cell-0-11')).toHaveAttribute('data-tween', 'false')
    expect(screen.getByTestId('cell-0-10')).toHaveTextContent('▶')
  })

  it('Create Tween dispatches setClassicTween(layer, k1, k2, 0) when exactly 2 keyframes are selected', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // select cells 1..10 (keyframes at 1 and 10)
    fireEvent.mouseDown(screen.getByTestId('cell-0-1'), { button: 0, clientX: NAME_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (10 - 1) * CELL_W })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-create-tween')).toBeEnabled()
    fireEvent.click(screen.getByTestId('timeline-create-tween'))
    expect(setClassicTweenMock).toHaveBeenCalledWith(0, 1, 10, 0)
  })

  it('Create Tween is disabled when the selection has ≠2 keyframes', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // select only frame 1 (1 keyframe)
    fireEvent.mouseDown(screen.getByTestId('cell-0-1'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-create-tween')).toBeDisabled()
  })

  it('Remove Tween dispatches removeClassicTween(layer, start) for a selected span', () => {
    const tweened = makeStatus({
      layers: [
        {
          id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0,
          keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }],
          tweens: [{ start: 1, end: 10, ease: 0 }],
        },
      ],
    })
    render(<TimelineStrip status={tweened} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-remove-tween')).toBeEnabled()
    fireEvent.click(screen.getByTestId('timeline-remove-tween'))
    expect(removeClassicTweenMock).toHaveBeenCalledWith(0, 1)
  })

  it('ease slider shows the tween ease and commits setClassicTween on release', () => {
    const tweened = makeStatus({
      layers: [
        {
          id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0,
          keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }],
          tweens: [{ start: 1, end: 10, ease: 0 }],
        },
      ],
    })
    render(<TimelineStrip status={tweened} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-5'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-ease-value')).toHaveTextContent('0')
    fireEvent.change(screen.getByTestId('timeline-ease-slider'), { target: { value: '60' } })
    expect(screen.getByTestId('timeline-ease-value')).toHaveTextContent('60') // live preview
    fireEvent.mouseUp(screen.getByTestId('timeline-ease-slider'))
    expect(setClassicTweenMock).toHaveBeenCalledWith(0, 1, 10, 60)
  })

  it('no ease slider when no tween is selected', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-3'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.queryByTestId('timeline-ease-slider')).not.toBeInTheDocument()
  })

  it('one ease gesture = ONE command across pointerup/mouseup/keyup/blur', () => {
    const tweened = makeStatus({
      layers: [
        {
          id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0,
          keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }],
          tweens: [{ start: 1, end: 10, ease: 0 }],
        },
      ],
    })
    render(<TimelineStrip status={tweened} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-5'), { button: 0 })
    fireEvent.mouseUp(window)
    const slider = screen.getByTestId('timeline-ease-slider')
    fireEvent.change(slider, { target: { value: '60' } })
    fireEvent.pointerUp(slider)
    fireEvent.mouseUp(slider)
    fireEvent.keyUp(slider, { key: 'ArrowRight' })
    fireEvent.blur(slider)
    expect(setClassicTweenMock).toHaveBeenCalledTimes(1)
    expect(setClassicTweenMock).toHaveBeenCalledWith(0, 1, 10, 60)
  })

  it('releasing the ease slider at its current value commits nothing', () => {
    const tweened = makeStatus({
      layers: [
        {
          id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0,
          keyframes: [{ frame: 1, blank: false }, { frame: 10, blank: false }],
          tweens: [{ start: 1, end: 10, ease: 0 }],
        },
      ],
    })
    render(<TimelineStrip status={tweened} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-5'), { button: 0 })
    fireEvent.mouseUp(window)
    const slider = screen.getByTestId('timeline-ease-slider')
    fireEvent.change(slider, { target: { value: '0' } }) // back to the same value
    fireEvent.pointerUp(slider)
    fireEvent.blur(slider)
    expect(setClassicTweenMock).not.toHaveBeenCalled()
  })
})

describe('TimelineStrip — UNIT G: sequences, exposure, labels (Part 07 §7.4.8–12, §7.2)', () => {
  it('dot drag commits moveKeyframeSequence(layer, from, to, overwrite=false)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const startX = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: startX })
    fireEvent.mouseMove(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    fireEvent.mouseUp(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    expect(moveKeyframeSequenceMock).toHaveBeenCalledTimes(1)
    expect(moveKeyframeSequenceMock).toHaveBeenCalledWith(0, 10, 14, false)
  })

  it('collision prompts overwrite and retries with overwrite=true', () => {
    moveKeyframeSequenceMock.mockReturnValueOnce(false)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const dot = screen.getByTestId('kf-dot-0-10')
    const startX = NAME_W + (10 - 1) * CELL_W
    fireEvent.mouseDown(dot, { button: 0, clientX: startX })
    fireEvent.mouseMove(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    fireEvent.mouseUp(window, { clientX: NAME_W + (14 - 1) * CELL_W })
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(moveKeyframeSequenceMock).toHaveBeenLastCalledWith(0, 10, 14, true)
    confirmSpy.mockRestore()
  })

  it('span-edge drag commits resizeSpan(anchor, delta) and zero-delta commits nothing', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    // cell-0-9 is the last held cell of the span starting at keyframe 1
    const edge = screen.getByTestId('span-end-0-9')
    fireEvent.mouseDown(edge, { button: 0, clientX: 100 })
    fireEvent.mouseUp(window, { clientX: 100 + 2 * CELL_W })
    expect(resizeSpanMock).toHaveBeenCalledWith(0, 1, 2)

    resizeSpanMock.mockClear()
    fireEvent.mouseDown(edge, { button: 0, clientX: 100 })
    fireEvent.mouseUp(window, { clientX: 100 })
    expect(resizeSpanMock).not.toHaveBeenCalled() // zero delta
  })

  it('span-edge drag works at 2× timeline zoom (frame-accurate)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('timeline-zoom-in')) // 2× → cellW 36
    const edge = screen.getByTestId('span-end-0-9')
    fireEvent.mouseDown(edge, { button: 0, clientX: 200 })
    fireEvent.mouseUp(window, { clientX: 200 + 3 * CELL_W * 2 })
    expect(resizeSpanMock).toHaveBeenCalledWith(0, 1, 3)
  })

  it('Escape cancels a span-edge resize', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    const edge = screen.getByTestId('span-end-0-9')
    fireEvent.mouseDown(edge, { button: 0, clientX: 100 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.mouseUp(window, { clientX: 200 })
    expect(resizeSpanMock).not.toHaveBeenCalled()
  })

  it('duplicate / convert / convert-blank buttons dispatch their engine ops on the selected range', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-2'), { button: 0, clientX: NAME_W + (2 - 1) * CELL_W })
    fireEvent.mouseMove(window, { clientX: NAME_W + (8 - 1) * CELL_W })
    fireEvent.mouseUp(window)

    fireEvent.click(screen.getByTestId('timeline-duplicate'))
    expect(duplicateFramesMock).toHaveBeenCalledWith(0, 2, 8)
    fireEvent.click(screen.getByTestId('timeline-convert'))
    expect(convertToKeyframesMock).toHaveBeenCalledWith(0, 2, 8)
    fireEvent.click(screen.getByTestId('timeline-convert-blank'))
    expect(convertToBlankKeyframesMock).toHaveBeenCalledWith(0, 2, 8)
  })

  it('label input appears for a single selected content keyframe and commits setFrameLabel', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-1'), { button: 0 }) // keyframe @1 (content)
    fireEvent.mouseUp(window)
    const input = screen.getByTestId('timeline-label-input')
    fireEvent.change(input, { target: { value: 'walk_01' } })
    fireEvent.blur(input)
    expect(setFrameLabelMock).toHaveBeenCalledWith(0, 1, 'walk_01')
  })

  it('a labeled keyframe shows a red flag marker', () => {
    const labeled = makeStatus({
      layers: [
        {
          id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0,
          keyframes: [
            { frame: 1, blank: false, label: 'start' },
            { frame: 10, blank: false },
          ],
          tweens: [],
        },
      ],
    })
    render(<TimelineStrip status={labeled} notify={notify} />)
    expect(screen.getByTestId('kf-label-0-1')).toBeInTheDocument()
    expect(screen.getByTestId('kf-dot-0-1')).toHaveAttribute('data-label', 'start')
    expect(screen.queryByTestId('kf-label-0-10')).not.toBeInTheDocument()
  })

  it('span-end markers appear only on the last held cell (view-only)', () => {
    render(<TimelineStrip status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('span-end-0-9')).toBeInTheDocument()
    expect(screen.getByTestId('span-end-0-19')).toBeInTheDocument()
    expect(screen.queryByTestId('span-end-0-5')).not.toBeInTheDocument()
    expect(screen.queryByTestId('span-end-0-10')).not.toBeInTheDocument() // keyframe, not edge
  })

  it('sequence/resize/convert buttons are disabled on a locked layer', () => {
    const locked = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: true, locked: true, active: true, selected_objects: 0, keyframes: [{ frame: 1, blank: false }], tweens: [] },
      ],
    })
    render(<TimelineStrip status={locked} notify={notify} />)
    fireEvent.mouseDown(screen.getByTestId('cell-0-1'), { button: 0 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-duplicate')).toBeDisabled()
    expect(screen.getByTestId('timeline-convert')).toBeDisabled()
    expect(screen.getByTestId('timeline-convert-blank')).toBeDisabled()
  })
})
