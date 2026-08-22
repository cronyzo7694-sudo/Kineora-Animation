import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { makeCommandContext, type CommandContext } from '../commands'
import { MenuBar } from './MenuBar'

vi.mock('../engine/actions', () => ({
  performAction: vi.fn(),
  togglePlay: vi.fn(),
  stopPlayback: vi.fn(),
  pausePlayback: vi.fn(),
  seekPlayhead: vi.fn(),
  playbackState: () => 'IDLE',
  isPlaying: () => false,
  isPaused: () => false,
  isLoopEnabled: () => true,
  setLoopEnabled: vi.fn(),
  newProject: vi.fn(),
  openProjectFile: vi.fn(),
}))

import { performAction } from '../engine/actions'
const performActionMock = vi.mocked(performAction)

function ctx(overrides: Partial<CommandContext> = {}): CommandContext {
  return makeCommandContext({
    notify: vi.fn(),
    engine: { kind: 'ok', detail: 'attached' },
    panels: { tools: true, layers: true, properties: true, library: true, timeline: true, debug: true },
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MenuBar — open/close', () => {
  it('opens a dropdown on click and closes on Esc', () => {
    render(<MenuBar ctx={ctx()} />)
    expect(screen.queryByTestId('menu.file-dropdown')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.getByTestId('menu.file-dropdown')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('menu.file-dropdown')).not.toBeInTheDocument()
  })

  it('closes on an outside click', () => {
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.getByTestId('menu.file-dropdown')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('menu.file-dropdown')).not.toBeInTheDocument()
  })

  it('clicking a top-level menu toggles it closed', () => {
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.queryByTestId('menu.file-dropdown')).not.toBeInTheDocument()
  })

  it('submenu flyout opens on hover', () => {
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.queryByTestId('menu-item-file.export-image')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Export'))
    expect(screen.getByTestId('menu-item-file.export-image')).toBeInTheDocument()
  })
})

describe('MenuBar — command dispatch + honest states', () => {
  it('a functional menu item runs its command (ctx-driven)', () => {
    const openNewDialog = vi.fn()
    const c = ctx({ openNewDialog })
    render(<MenuBar ctx={c} />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.new'))
    expect(openNewDialog).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('menu.file-dropdown')).not.toBeInTheDocument() // closed
  })

  it('a functional engine item routes through the registry action', () => {
    const c = ctx()
    render(<MenuBar ctx={c} />)
    fireEvent.click(screen.getByTestId('menu.edit'))
    fireEvent.click(screen.getByTestId('menu-item-edit.selectAll'))
    expect(performActionMock).toHaveBeenCalledWith('edit.selectAll', c.notify)
  })

  it('DEFERRED items are visibly disabled and never clickable', () => {
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.text'))
    const item = screen.getByTestId('menu-item-text.font')
    expect(item).toBeDisabled()
    expect(item).toHaveAttribute('data-disabled', 'true')
    fireEvent.click(item)
    expect(performActionMock).not.toHaveBeenCalled()
  })

  it('engine-gated items are disabled with a reason when the engine is absent', () => {
    const c = ctx({ engine: { kind: 'error', detail: 'not attached' } })
    render(<MenuBar ctx={c} />)
    fireEvent.click(screen.getByTestId('menu.edit'))
    const undo = screen.getByTestId('menu-item-edit.undo')
    expect(undo).toBeDisabled()
    expect(undo).toHaveAttribute('title', expect.stringContaining('engine not attached'))
  })

  it('checked items show a checkmark for toggled panels', () => {
    const c = ctx({ panels: { tools: true, layers: true, properties: true, library: true, timeline: true, debug: false } })
    render(<MenuBar ctx={c} />)
    fireEvent.click(screen.getByTestId('menu.window'))
    expect(screen.getByTestId('menu-item-panel.show-timeline')).toHaveTextContent('✓')
    expect(screen.getByTestId('menu-item-panel.debug')).not.toHaveTextContent('✓')
  })

  it('Open Recent hover highlight clears on mouseleave (FINAL_GATE §3 #7)', () => {
    const now = Date.now()
    localStorage.setItem(
      'kineora.recentFiles',
      JSON.stringify([{ title: 'scene-a', name: 'scene-a.json', savedAt: now, json: '{}' }]),
    )
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Open Recent'))
    const row = screen.getByTestId('menu-item-recent-scene-a')
    fireEvent.mouseEnter(row)
    expect((row as HTMLButtonElement).style.background).not.toBe('transparent')
    fireEvent.mouseLeave(row)
    expect((row as HTMLButtonElement).style.background).toBe('transparent')
  })

  it('a disabled-by-context command (frame copy with no selection) is disabled with a reason', () => {
    render(<MenuBar ctx={ctx()} />)
    fireEvent.click(screen.getByTestId('menu.edit'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.edit-Timeline'))
    const copy = screen.getByTestId('menu-item-timeline.copy')
    expect(copy).toBeDisabled()
    expect(copy).toHaveAttribute('title', expect.stringContaining('select frames'))
  })
})
