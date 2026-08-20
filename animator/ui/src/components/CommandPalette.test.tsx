import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { makeCommandContext, type CommandContext } from '../commands'
import { CommandPalette } from './CommandPalette'

function ctx(overrides: Partial<CommandContext> = {}): CommandContext {
  return makeCommandContext({
    notify: vi.fn(),
    engine: { kind: 'ok', detail: 'attached' },
    panels: { tools: true, layers: true, properties: true, library: true, timeline: true, debug: true },
    ...overrides,
  })
}

describe('CommandPalette (C-04)', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={() => {}} ctx={ctx()} />)
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument()
  })

  it('fuzzy-filters the whole registry', () => {
    render(<CommandPalette open onClose={() => {}} ctx={ctx()} />)
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'undo' } })
    expect(screen.getByTestId('palette-item-edit.undo')).toBeInTheDocument()
    expect(screen.queryByTestId('palette-item-file.save')).not.toBeInTheDocument()
  })

  it('shows an honest empty state for no matches', () => {
    render(<CommandPalette open onClose={() => {}} ctx={ctx()} />)
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'zzzzzz' } })
    expect(screen.getByTestId('palette-empty')).toBeInTheDocument()
  })

  it('Enter runs the selected command and closes the palette', () => {
    const onClose = vi.fn()
    const openAbout = vi.fn()
    render(<CommandPalette open onClose={onClose} ctx={ctx({ openAbout })} />)
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'about' } })
    fireEvent.keyDown(screen.getByTestId('palette-input'), { key: 'Enter' })
    expect(openAbout).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Esc closes the palette', () => {
    const onClose = vi.fn()
    render(<CommandPalette open onClose={onClose} ctx={ctx()} />)
    fireEvent.keyDown(screen.getByTestId('palette-input'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('DEFERRED entries are disabled and tagged "future"', () => {
    render(<CommandPalette open onClose={() => {}} ctx={ctx()} />)
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'break apart' } })
    const item = screen.getByTestId('palette-item-modify.breakApart')
    expect(item).toBeDisabled()
    expect(item).toHaveTextContent('future')
  })

  it('clicking a result runs the command', () => {
    const openShortcuts = vi.fn()
    render(<CommandPalette open onClose={() => {}} ctx={ctx({ openShortcuts })} />)
    fireEvent.change(screen.getByTestId('palette-input'), { target: { value: 'keyboard shortcuts' } })
    fireEvent.click(screen.getByTestId('palette-item-help.shortcuts'))
    expect(openShortcuts).toHaveBeenCalledTimes(1)
  })
})
