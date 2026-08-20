import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  createLayer: vi.fn(() => 2),
  deleteLayer: vi.fn(() => true),
  renameLayer: vi.fn(() => true),
  setActiveLayer: vi.fn(() => true),
  setLayerVisible: vi.fn(() => true),
  setLayerLocked: vi.fn(() => true),
  moveLayer: vi.fn(() => true),
}))

import { createLayer, deleteLayer, moveLayer, renameLayer, setActiveLayer, setLayerLocked, setLayerVisible } from '../engine/client'
import { LayersPanel } from './LayersPanel'
import type { StatusJson } from '../engine/wasmTypes'

const setActiveLayerMock = vi.mocked(setActiveLayer)
const setLayerVisibleMock = vi.mocked(setLayerVisible)
const setLayerLockedMock = vi.mocked(setLayerLocked)
const createLayerMock = vi.mocked(createLayer)
const deleteLayerMock = vi.mocked(deleteLayer)
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
})
