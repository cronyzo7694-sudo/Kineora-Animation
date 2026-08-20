import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../engine/client', () => ({
  convertToSymbol: vi.fn(() => 7),
  newSymbol: vi.fn(() => 5),
}))

import { convertToSymbol, newSymbol } from '../engine/client'
import { SymbolDialog } from './SymbolDialog'

const convertToSymbolMock = vi.mocked(convertToSymbol)
const newSymbolMock = vi.mocked(newSymbol)
const notify = vi.fn()
const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  notify.mockClear()
  onClose.mockClear()
})

describe('SymbolDialog (Part 11 §11.2 / Part 12 §12.2.2)', () => {
  it('convert mode submits convertToSymbol(name, type, grid)', () => {
    render(<SymbolDialog open mode="convert" onClose={onClose} notify={notify} />)
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'arm' } })
    fireEvent.change(screen.getByTestId('symbol-type'), { target: { value: 'movieClip' } })
    fireEvent.click(screen.getByTestId('reg-2')) // TR
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(convertToSymbolMock).toHaveBeenCalledWith('arm', 'movieClip', 2)
    expect(onClose).toHaveBeenCalled()
  })

  it('default registration is center (grid 4)', () => {
    render(<SymbolDialog open mode="convert" onClose={onClose} notify={notify} />)
    expect(screen.getByTestId('reg-4')).toHaveAttribute('data-selected', 'true')
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'x' } })
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(convertToSymbolMock).toHaveBeenCalledWith('x', 'graphic', 4)
  })

  it('new mode submits newSymbol(name, type) and hides the grid', () => {
    render(<SymbolDialog open mode="new" onClose={onClose} notify={notify} />)
    expect(screen.queryByTestId('symbol-grid')).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'walk' } })
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(newSymbolMock).toHaveBeenCalledWith('walk', 'graphic')
  })

  it('empty name is rejected with a toast (no engine call)', () => {
    render(<SymbolDialog open mode="new" onClose={onClose} notify={notify} />)
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(notify).toHaveBeenCalledWith('symbol: enter a name')
    expect(newSymbolMock).not.toHaveBeenCalled()
  })

  it('convert with an empty selection reports a friendly error', () => {
    convertToSymbolMock.mockReturnValue(0)
    render(<SymbolDialog open mode="convert" onClose={onClose} notify={notify} />)
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'x' } })
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(notify).toHaveBeenCalledWith('convert: select objects on the stage first')
  })

  it('Cancel closes without submitting; Enter submits; Esc closes', () => {
    render(<SymbolDialog open mode="new" onClose={onClose} notify={notify} />)
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'a' } })
    fireEvent.keyDown(screen.getByTestId('symbol-name'), { key: 'Enter' })
    expect(newSymbolMock).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'b' } })
    fireEvent.keyDown(screen.getByTestId('symbol-name'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closed dialog renders nothing', () => {
    render(<SymbolDialog open={false} mode="convert" onClose={onClose} notify={notify} />)
    expect(screen.queryByTestId('symbol-dialog')).not.toBeInTheDocument()
  })
})

describe('SymbolDialog — New Symbol feedback', () => {
  it('new symbol calls onCreated with the new id and a clear toast', () => {
    const onCreated = vi.fn()
    newSymbolMock.mockReturnValue(5)
    render(<SymbolDialog open mode="new" onClose={onClose} notify={notify} onCreated={onCreated} />)
    fireEvent.change(screen.getByTestId('symbol-name'), { target: { value: 'walk' } })
    fireEvent.click(screen.getByTestId('symbol-confirm'))
    expect(onCreated).toHaveBeenCalledWith(5)
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('created in Library'))
  })
})
