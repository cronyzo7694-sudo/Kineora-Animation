import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  library: vi.fn(() => [
    { id: 1, name: 'arm', type: 'graphic', use_count: 2, duration: 3 },
    { id: 2, name: 'walk', type: 'movieClip', use_count: 0, duration: 12 },
  ]),
  renameSymbol: vi.fn(() => true),
  deleteSymbol: vi.fn(() => true),
  hasSymbolFacade: vi.fn(() => true),
  placeSymbol: vi.fn(() => 9),
  statusJson: vi.fn(() => ({ doc_width: 1920, doc_height: 1080 })),
}))

import { deleteSymbol, hasSymbolFacade, library, placeSymbol, renameSymbol } from '../engine/client'
import { LibraryPanel } from './LibraryPanel'
import type { EngineStatus } from '../controlRegistry'

const libraryMock = vi.mocked(library)
const renameSymbolMock = vi.mocked(renameSymbol)
const deleteSymbolMock = vi.mocked(deleteSymbol)
const hasSymbolFacadeMock = vi.mocked(hasSymbolFacade)
const notify = vi.fn()
const onNewSymbol = vi.fn()
const OK: EngineStatus = { kind: 'ok', detail: 'mock' }

const DEFAULT_LIBRARY = [
  { id: 1, name: 'arm', type: 'graphic', use_count: 2, duration: 3 },
  { id: 2, name: 'walk', type: 'movieClip', use_count: 0, duration: 12 },
]

function renderLib(props: Partial<Parameters<typeof LibraryPanel>[0]> = {}) {
  return render(<LibraryPanel engine={OK} notify={notify} onNewSymbol={onNewSymbol} {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  libraryMock.mockReturnValue(DEFAULT_LIBRARY)
  renameSymbolMock.mockReturnValue(true)
  deleteSymbolMock.mockReturnValue(true)
  hasSymbolFacadeMock.mockReturnValue(true)
  notify.mockClear()
  onNewSymbol.mockClear()
})

describe('LibraryPanel (Part 12)', () => {
  it('renders symbols with name, type icon, and use-count', () => {
    renderLib()
    expect(screen.getByTestId('library-name-1')).toHaveTextContent('arm')
    expect(screen.getByTestId('library-use-1')).toHaveTextContent('×2')
    expect(screen.getByTestId('library-use-2')).toHaveTextContent('')
  })

  it('empty library shows an honest empty state (distinct from engine failure)', () => {
    libraryMock.mockReturnValue([])
    renderLib()
    expect(screen.getByTestId('library-empty')).toBeInTheDocument()
  })

  it('engine unattached → explicit rebuild hint, not a false empty list', () => {
    renderLib({ engine: { kind: 'error', detail: 'not built' } })
    expect(screen.getByTestId('library-engine-error')).toBeInTheDocument()
    expect(screen.queryByTestId('library-empty')).not.toBeInTheDocument()
    expect(screen.getByTestId('library-create')).toBeDisabled()
  })

  it('engine build out of date (facade missing) → stale-engine hint', () => {
    hasSymbolFacadeMock.mockReturnValue(false)
    renderLib()
    expect(screen.getByTestId('library-stale')).toBeInTheDocument()
    expect(screen.queryByTestId('library-empty')).not.toBeInTheDocument()
  })

  it('double-click renames (ID-safe) via the engine', () => {
    renderLib()
    fireEvent.doubleClick(screen.getByTestId('library-name-1'))
    const input = screen.getByTestId('library-rename-1')
    fireEvent.change(input, { target: { value: 'arm_L' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(renameSymbolMock).toHaveBeenCalledWith(1, 'arm_L')
  })

  it('deleting an unused symbol calls deleteSymbol(id, false)', () => {
    renderLib()
    fireEvent.click(screen.getByTestId('library-delete-2')) // walk, use_count 0
    expect(deleteSymbolMock).toHaveBeenCalledWith(2, false)
  })

  it('deleting an in-use symbol prompts and breaks apart on confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderLib()
    fireEvent.click(screen.getByTestId('library-delete-1')) // arm, use_count 2
    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteSymbolMock).toHaveBeenCalledWith(1, true)
    confirmSpy.mockRestore()
  })

  it('deleting an in-use symbol does nothing when the prompt is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderLib()
    fireEvent.click(screen.getByTestId('library-delete-1'))
    expect(deleteSymbolMock).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('dragging a row carries the symbol id', () => {
    renderLib()
    const dt = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(screen.getByTestId('library-item-1'), { dataTransfer: dt })
    expect(dt.setData).toHaveBeenCalledWith('kineora/symbol', '1')
  })

  it('+ Symbol opens the new-symbol dialog', () => {
    renderLib()
    fireEvent.click(screen.getByTestId('library-create'))
    expect(onNewSymbol).toHaveBeenCalled()
  })

  it('list refreshes after a mutation (re-render re-reads the engine)', () => {
    const first = renderLib()
    expect(screen.getByTestId('library-name-1')).toHaveTextContent('arm')
    // simulate a create: the mock now returns a third symbol
    libraryMock.mockReturnValue([
      ...DEFAULT_LIBRARY,
      { id: 3, name: 'newone', type: 'graphic', use_count: 0, duration: 1 },
    ])
    first.rerender(<LibraryPanel engine={OK} notify={notify} onNewSymbol={onNewSymbol} />)
    expect(screen.getByTestId('library-name-3')).toHaveTextContent('newone')
  })

  it('highlightId marks the newly created row', () => {
    renderLib({ highlightId: 2 })
    expect(screen.getByTestId('library-item-2')).toHaveAttribute('data-highlighted', 'true')
    expect(screen.getByTestId('library-item-1')).toHaveAttribute('data-highlighted', 'false')
  })
})
