import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from '../bus'

vi.mock('../engine/client', () => ({
  createLayer: vi.fn(() => 2),
  deleteLayer: vi.fn(() => true),
  duplicateLayer: vi.fn(() => 2),
  renameLayer: vi.fn(() => true),
  setActiveLayer: vi.fn(() => true),
  setLayerVisible: vi.fn(() => true),
  setLayerLocked: vi.fn(() => true),
  setLayerOutline: vi.fn(() => true),
  setLayerOutlineColor: vi.fn(() => true),
  toggleOtherLayersVisible: vi.fn(() => true),
  toggleOtherLayersLocked: vi.fn(() => true),
  toggleOtherLayersOutline: vi.fn(() => true),
  moveLayer: vi.fn(() => true),
}))

import {
  createLayer,
  deleteLayer,
  duplicateLayer,
  moveLayer,
  renameLayer,
  setActiveLayer,
  setLayerLocked,
  setLayerOutline,
  setLayerOutlineColor,
  setLayerVisible,
  toggleOtherLayersLocked,
  toggleOtherLayersOutline,
  toggleOtherLayersVisible,
} from '../engine/client'
import { LayersPanel } from './LayersPanel'
import type { StatusJson } from '../engine/wasmTypes'

const setActiveLayerMock = vi.mocked(setActiveLayer)
const setLayerVisibleMock = vi.mocked(setLayerVisible)
const setLayerLockedMock = vi.mocked(setLayerLocked)
const setLayerOutlineMock = vi.mocked(setLayerOutline)
const setLayerOutlineColorMock = vi.mocked(setLayerOutlineColor)
const toggleOtherVisibleMock = vi.mocked(toggleOtherLayersVisible)
const toggleOtherLockedMock = vi.mocked(toggleOtherLayersLocked)
const toggleOtherOutlineMock = vi.mocked(toggleOtherLayersOutline)
const createLayerMock = vi.mocked(createLayer)
const deleteLayerMock = vi.mocked(deleteLayer)
const duplicateLayerMock = vi.mocked(duplicateLayer)
const renameLayerMock = vi.mocked(renameLayer)
const moveLayerMock = vi.mocked(moveLayer)

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
      { id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0, keyframes: [], tweens: [] },
      { id: 2, name: 'Layer 2', visible: true, locked: false, active: false, selected_objects: 1, keyframes: [], tweens: [] },
    ],
    active_layer: 0,
    fps: 24,
    doc_width: 1920,
    doc_height: 1080,
    background: '#ffffff',
    duration: 60,
    clipboard_len: 0,
    event_log: [],
    ...overrides,
  }
}

const notify = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  notify.mockClear()
})

describe('LayersPanel', () => {
  it('renders real engine layers, frontmost first', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('layer-row-0')).toBeInTheDocument()
    expect(screen.getByTestId('layer-row-1')).toBeInTheDocument()
    // frontmost layer (engine index 1 = "Layer 2") is listed first
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Layer 2')
    expect(rows[1]).toHaveTextContent('Layer 1')
  })

  it('highlights the active layer row', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('layer-row-0')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('layer-row-1')).toHaveAttribute('data-active', 'false')
  })

  it('clicking a row activates that layer (view state, engine call)', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-row-1'))
    expect(setActiveLayerMock).toHaveBeenCalledWith(1)
  })

  it('eye button toggles visibility on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-eye-0'))
    expect(setLayerVisibleMock).toHaveBeenCalledWith(0, false)
  })

  it('lock button toggles lock on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-lock-1'))
    expect(setLayerLockedMock).toHaveBeenCalledWith(1, true)
  })

  it('add button creates a layer on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layers-add'))
    expect(createLayerMock).toHaveBeenCalledTimes(1)
  })

  it('delete button is disabled when only one layer exists', () => {
    const one = makeStatus({ layers: [{ id: 1, name: 'Layer 1', visible: true, locked: false, active: true, selected_objects: 0, keyframes: [], tweens: [] }] })
    render(<LayersPanel status={one} notify={notify} />)
    expect(screen.getByTestId('layers-delete')).toBeDisabled()
  })

  it('delete button removes the active layer on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layers-delete'))
    expect(deleteLayerMock).toHaveBeenCalledWith(0) // active layer is index 0
  })

  it('double-click renames: Enter commits a real engine rename', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.doubleClick(screen.getByTestId('layer-row-1'))
    const input = screen.getByTestId('layer-rename-1')
    fireEvent.change(input, { target: { value: 'Foreground' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(renameLayerMock).toHaveBeenCalledWith(1, 'Foreground')
  })

  it('rename with Escape cancels without an engine call', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.doubleClick(screen.getByTestId('layer-row-1'))
    const input = screen.getByTestId('layer-rename-1')
    fireEvent.change(input, { target: { value: 'Should Not Commit' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(renameLayerMock).not.toHaveBeenCalled()
  })

  it('up/down buttons reorder on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-up-0')) // bottom layer moves up (front)
    expect(moveLayerMock).toHaveBeenCalledWith(0, 1)
    fireEvent.click(screen.getByTestId('layer-down-1'))
    expect(moveLayerMock).toHaveBeenCalledWith(1, 0)
  })

  it('shows a selection marker on layers holding selected objects', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('layer-sel-1')).toHaveTextContent('●')
    expect(screen.getByTestId('layer-sel-0')).toHaveTextContent('')
  })

  it('reports engine-not-attached honestly and disables actions', () => {
    render(<LayersPanel status={null} notify={notify} />)
    expect(screen.getByTestId('layers-empty')).toHaveTextContent('engine not attached')
    expect(screen.getByTestId('layers-add')).toBeDisabled()
    fireEvent.click(screen.getByTestId('layers-add'))
    expect(createLayerMock).not.toHaveBeenCalled()
  })

  // ——— Outline mode (F-07-02 E3, F-20-01) ———

  it('outline swatch toggles outline mode on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-outline-0'))
    expect(setLayerOutlineMock).toHaveBeenCalledWith(0, true)
  })

  it('outline swatch reflects the engine outline state and color', () => {
    const st = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: true, locked: false, outline: true, outline_color: '#00aa55', active: true, selected_objects: 0, keyframes: [], tweens: [] },
        { id: 2, name: 'Layer 2', visible: true, locked: false, active: false, selected_objects: 0, keyframes: [], tweens: [] },
      ],
    })
    render(<LayersPanel status={st} notify={notify} />)
    // Layer 1 (engine index 0) carries the outline flag/color
    expect(screen.getByTestId('layer-outline-0')).toHaveAttribute('data-outline', 'true')
    expect(screen.getByTestId('layer-outline-0')).toHaveAttribute('data-color', '#00aa55')
    expect(screen.getByTestId('layer-outline-1')).toHaveAttribute('data-outline', 'false')
  })

  it('double-clicking the outline swatch edits the outline color', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.doubleClick(screen.getByTestId('layer-outline-1'))
    const picker = screen.getByTestId('layer-outline-color-1')
    fireEvent.change(picker, { target: { value: '#123456' } })
    fireEvent.blur(picker)
    expect(setLayerOutlineColorMock).toHaveBeenCalledWith(1, '#123456')
  })

  it('Esc cancels the outline color edit without an engine call', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.doubleClick(screen.getByTestId('layer-outline-0'))
    const picker = screen.getByTestId('layer-outline-color-0')
    fireEvent.change(picker, { target: { value: '#fedcba' } })
    fireEvent.keyDown(picker, { key: 'Escape' })
    expect(setLayerOutlineColorMock).not.toHaveBeenCalled()
  })

  // ——— Alt+click "all others" batches (F-07-02 E1/E2/E3) ———

  it('Alt+click on the eye toggles every OTHER layer', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-eye-1'), { altKey: true })
    expect(setLayerVisibleMock).not.toHaveBeenCalled()
    expect(toggleOtherVisibleMock).toHaveBeenCalledWith(1)
  })

  it('Alt+click on the lock toggles every OTHER layer', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-lock-0'), { altKey: true })
    expect(setLayerLockedMock).not.toHaveBeenCalled()
    expect(toggleOtherLockedMock).toHaveBeenCalledWith(0)
  })

  it('Alt+click on the outline swatch toggles every OTHER layer', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layer-outline-0'), { altKey: true })
    expect(setLayerOutlineMock).not.toHaveBeenCalled()
    expect(toggleOtherOutlineMock).toHaveBeenCalledWith(0)
  })

  // ——— State indicators (F-07-02 E4/E7) ———

  it('shows a red X on hidden layers and an editable-state marker on the active row', () => {
    const st = makeStatus({
      layers: [
        { id: 1, name: 'Layer 1', visible: false, locked: false, active: true, selected_objects: 0, keyframes: [], tweens: [] },
        { id: 2, name: 'Layer 2', visible: true, locked: true, active: false, selected_objects: 0, keyframes: [], tweens: [] },
      ],
    })
    render(<LayersPanel status={st} notify={notify} />)
    // Layer 1 (hidden, active) has engine index 0 → its marker renders there
    expect(screen.getByTestId('layer-hidden-0')).toHaveTextContent('✕')
    // active + hidden → pencil-with-slash (blocked) state
    expect(screen.getByTestId('layer-edit-state-0')).toHaveTextContent('⊘')
  })

  it('shows the pencil marker on an active editable layer and nothing on inactive rows', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    expect(screen.getByTestId('layer-edit-state-0')).toHaveTextContent('✎')
    expect(screen.getByTestId('layer-edit-state-1')).toHaveTextContent('')
  })

  // ——— Duplicate layer (F-20-01) ———

  it('duplicate button deep-copies the ACTIVE layer on the engine', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.click(screen.getByTestId('layers-dup'))
    expect(duplicateLayerMock).toHaveBeenCalledWith(0) // active layer is engine index 0
  })
})

// ——— Drag-through multi-toggle (F-07-02 E1/E2 "drag through the column") ———

describe('LayersPanel — drag-through column toggle', () => {
  it('pointer-down toggles the initial row; pointer-enter toggles rows dragged over', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.pointerDown(screen.getByTestId('layer-eye-1')) // Layer 2 (visible → hidden)
    fireEvent.pointerEnter(screen.getByTestId('layer-eye-0')) // Layer 1 (visible → hidden)
    fireEvent.pointerUp(window)
    expect(setLayerVisibleMock).toHaveBeenCalledWith(1, false)
    expect(setLayerVisibleMock).toHaveBeenCalledWith(0, false)
  })

  it('a row is toggled at most ONCE per gesture (repeat pointer-enter is ignored)', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.pointerDown(screen.getByTestId('layer-lock-1'))
    fireEvent.pointerEnter(screen.getByTestId('layer-lock-0'))
    fireEvent.pointerEnter(screen.getByTestId('layer-lock-0'))
    fireEvent.pointerEnter(screen.getByTestId('layer-lock-1')) // already toggled
    fireEvent.pointerUp(window)
    expect(setLayerLockedMock).toHaveBeenCalledTimes(2)
  })

  it('the row-click that follows a column drag never activates the layer', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.pointerDown(screen.getByTestId('layer-eye-1'))
    fireEvent.pointerEnter(screen.getByTestId('layer-eye-0'))
    fireEvent.pointerUp(window)
    fireEvent.click(screen.getByTestId('layer-eye-0'), { detail: 1 })
    expect(setActiveLayerMock).not.toHaveBeenCalled()
    // a subsequent plain row click activates normally again
    fireEvent.click(screen.getByTestId('layer-row-0'))
    expect(setActiveLayerMock).toHaveBeenCalledWith(0)
  })

  it('Escape cancels an active drag (no further toggles)', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.pointerDown(screen.getByTestId('layer-outline-1'))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.pointerEnter(screen.getByTestId('layer-outline-0'))
    fireEvent.pointerUp(window)
    expect(setLayerOutlineMock).toHaveBeenCalledTimes(1) // only the initial row
  })

  it('Alt+pointer-down performs the batch "all others" (not a drag)', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    // fireEvent.pointerDown does not forward modifiers in jsdom — dispatch a
    // native pointerdown (jsdom lacks PointerEvent, so a MouseEvent-typed
    // pointerdown; React reads altKey off the native event — real browsers
    // carry altKey on PointerEvent).
    screen.getByTestId('layer-eye-1').dispatchEvent(
      new MouseEvent('pointerdown', { altKey: true, bubbles: true }),
    )
    fireEvent.pointerEnter(screen.getByTestId('layer-eye-0'))
    fireEvent.pointerUp(window)
    expect(toggleOtherVisibleMock).toHaveBeenCalledWith(1)
    expect(setLayerVisibleMock).not.toHaveBeenCalled()
  })

  it('a column drag never starts an HTML5 row-reorder', () => {
    render(<LayersPanel status={makeStatus()} notify={notify} />)
    fireEvent.dragStart(screen.getByTestId('layer-eye-1'))
    fireEvent.dragOver(screen.getByTestId('layer-row-0'))
    fireEvent.drop(screen.getByTestId('layer-row-0'))
    fireEvent.dragEnd(window)
    expect(moveLayerMock).not.toHaveBeenCalled()
  })
})

// ——— layer:changed row flash (SYS-01 §27.1 / INT-0010) ———

describe('LayersPanel — layer:changed flash', () => {
  it('flashes the affected row and clears it after the flash window', () => {
    vi.useFakeTimers()
    try {
      render(<LayersPanel status={makeStatus()} notify={notify} />)
      act(() => bus.emit('layer:changed', { layerId: 2, op: 'visible' }))
      expect(screen.getByTestId('layer-row-1')).toHaveAttribute('data-changed', 'true')
      expect(screen.getByTestId('layer-row-0')).toHaveAttribute('data-changed', 'false')
      act(() => vi.advanceTimersByTime(1000))
      expect(screen.getByTestId('layer-row-1')).toHaveAttribute('data-changed', 'false')
    } finally {
      vi.useRealTimers()
    }
  })
})
