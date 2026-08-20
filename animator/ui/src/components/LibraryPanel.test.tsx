import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  library: vi.fn(() => [
    { id: 1, name: 'arm', type: 'graphic', use_count: 2, duration: 3 },
    { id: 2, name: 'walk', type: 'movieClip', use_count: 0, duration: 12 },
  ]),
  renameSymbol: vi.fn(() => true),
  deleteSymbol: vi.fn(() => true),
}))

import { deleteSymbol, library, renameSymbol } from '../engine/client'
import { LibraryPanel } from './LibraryPanel'

const libraryMock = vi.mocked(library)
const renameSymbolMock = vi.mocked(renameSymbol)
const deleteSymbolMock = vi.mocked(deleteSymbol)
const notify = vi.fn()
const onNewSymbol = vi.fn()

const DEFAULT_LIBRARY = [
  { id: 1, name: 'arm', type: 'graphic', use_count: 2, duration: 3 },
  { id: 2, name: 'walk', type: 'movieClip', use_count: 0, duration: 12 },
]

beforeEach(() => {
  vi.clearAllMocks()
  libraryMock.mockReturnValue(DEFAULT_LIBRARY)
  renameSymbolMock.mockReturnValue(true)
  deleteSymbolMock.mockReturnValue(true)
  notify.mockClear()
  onNewSymbol.mockClear()
})

describe('LibraryPanel (Part 12)', () => {
  it('renders symbols with name, type icon, and use-count', () => {
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    expect(screen.getByTestId('library-name-1')).toHaveTextContent('arm')
    expect(screen.getByTestId('library-use-1')).toHaveTextContent('×2')
    expect(screen.getByTestId('library-use-2')).toHaveTextContent('')
  })

  it('empty library shows an honest empty state', () => {
    libraryMock.mockReturnValue([])
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    expect(screen.getByTestId('library-empty')).toBeInTheDocument()
  })

  it('double-click renames (ID-safe) via the engine', () => {
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    fireEvent.doubleClick(screen.getByTestId('library-name-1'))
    const input = screen.getByTestId('library-rename-1')
    fireEvent.change(input, { target: { value: 'arm_L' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(renameSymbolMock).toHaveBeenCalledWith(1, 'arm_L')
  })

  it('deleting an unused symbol calls deleteSymbol(id, false)', () => {
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    fireEvent.click(screen.getByTestId('library-delete-2')) // walk, use_count 0
    expect(deleteSymbolMock).toHaveBeenCalledWith(2, false)
  })

  it('deleting an in-use symbol prompts and breaks apart on confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    fireEvent.click(screen.getByTestId('library-delete-1')) // arm, use_count 2
    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteSymbolMock).toHaveBeenCalledWith(1, true)
    confirmSpy.mockRestore()
  })

  it('deleting an in-use symbol does nothing when the prompt is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    fireEvent.click(screen.getByTestId('library-delete-1'))
    expect(deleteSymbolMock).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('dragging a row carries the symbol id', () => {
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    const dt = { setData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(screen.getByTestId('library-item-1'), { dataTransfer: dt })
    expect(dt.setData).toHaveBeenCalledWith('kineora/symbol', '1')
  })

  it('+ Symbol opens the new-symbol dialog', () => {
    render(<LibraryPanel notify={notify} onNewSymbol={onNewSymbol} />)
    fireEvent.click(screen.getByTestId('library-create'))
    expect(onNewSymbol).toHaveBeenCalled()
  })
})
