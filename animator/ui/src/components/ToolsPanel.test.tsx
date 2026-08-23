import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TOOLS_AREA, ToolsPanel, VIEW_AREA } from './ToolsPanel'
import { resetToolColorsCacheForTests } from '../toolColors'
import { resetToolOptionsForTests } from '../toolOptions'

/**
 * Adobe (helpx — Use the Stage and Tools panel for Animate): the Tools panel is
 * a vertical strip divided into a tools area, a view area, a colors area and an
 * options area; each tool is an icon whose name appears on hover.
 */
beforeEach(() => {
  window.localStorage.clear()
  resetToolColorsCacheForTests()
  resetToolOptionsForTests()
})

const renderPanel = (tool = 'select', onPick = vi.fn()) => {
  render(<ToolsPanel tool={tool} onPick={onPick} />)
  return onPick
}

describe('ToolsPanel — Adobe-style vertical icon strip', () => {
  it('renders every tool as an ICON-ONLY button (no text labels)', () => {
    renderPanel()
    for (const t of [...TOOLS_AREA, ...VIEW_AREA]) {
      const btn = screen.getByTestId(`tool-${t.id}`)
      expect(btn).toBeInTheDocument()
      // the visible content is an <svg>, never the tool name
      expect(btn.textContent).toBe('')
      expect(btn.querySelector('svg')).not.toBeNull()
    }
  })

  it('carries the name + shortcut as tooltip and accessible name', () => {
    renderPanel()
    const btn = screen.getByTestId('tool-hand')
    expect(btn).toHaveAttribute('title', 'Hand Tool (H)')
    expect(btn).toHaveAttribute('aria-label', 'Hand Tool (H)')
  })

  it('shows the name on hover and hides it again on leave', () => {
    renderPanel()
    expect(screen.queryByTestId('tool-tip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByTestId('tool-zoom'))
    expect(screen.getByTestId('tool-tip')).toHaveTextContent('Zoom Tool')
    expect(screen.getByTestId('tool-tip')).toHaveTextContent('(Z)')
    fireEvent.mouseLeave(screen.getByTestId('tool-zoom'))
    expect(screen.queryByTestId('tool-tip')).not.toBeInTheDocument()
  })

  it('keyboard focus also reveals the name (accessibility parity)', () => {
    renderPanel()
    fireEvent.focus(screen.getByTestId('tool-rect'))
    expect(screen.getByTestId('tool-tip')).toHaveTextContent('Rectangle Tool')
  })

  it('marks the active tool and switches on click', () => {
    const onPick = renderPanel('select')
    expect(screen.getByTestId('tool-select')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('tool-bucket')).toHaveAttribute('data-active', 'false')
    fireEvent.click(screen.getByTestId('tool-bucket'))
    expect(onPick).toHaveBeenCalledWith('bucket')
  })

  it('has the four Adobe sections: tools, view, colors, options', () => {
    render(<ToolsPanel tool="zoom" onPick={vi.fn()} />)
    expect(screen.getByTestId('tool-select')).toBeInTheDocument() // tools area
    expect(screen.getByTestId('tool-hand')).toBeInTheDocument() // view area
    expect(screen.getByTestId('tool-colors')).toBeInTheDocument() // colors area
    expect(screen.getByTestId('tool-options')).toBeInTheDocument() // options area (zoom modifiers)
  })

  it('the options area is empty for a tool without modifiers', () => {
    render(<ToolsPanel tool="hand" onPick={vi.fn()} />)
    expect(screen.queryByTestId('tool-options')).not.toBeInTheDocument()
  })

  it('every tool in the strip has a unique shortcut', () => {
    const keys = [...TOOLS_AREA, ...VIEW_AREA].map((t) => t.shortcut)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('ToolsPanel — rail layout contract (Blueprint §1.3.1)', () => {
  it('the rail is exactly 36px wide', () => {
    renderPanel()
    expect(screen.getByTestId('tools-panel').style.width).toBe('36px')
  })

  it('tools + view areas live in a scroll region that grows with the tool list', () => {
    renderPanel()
    const scroll = screen.getByTestId('tools-scroll')
    expect(scroll.style.overflowY).toBe('auto')
    expect(scroll.style.overflowX).toBe('hidden')
    expect(scroll.style.scrollbarWidth).toBe('none')
    expect(scroll.style.flex).toContain('1')
    // the sections that scroll: tools area, divider, view area
    expect(scroll.contains(screen.getByTestId('tool-select'))).toBe(true)
    expect(scroll.contains(screen.getByTestId('tool-zoom'))).toBe(true)
  })

  it('colors + options are PINNED at the bottom — never inside the scroll region', () => {
    render(<ToolsPanel tool="zoom" onPick={vi.fn()} />)
    const pinned = screen.getByTestId('tools-pinned')
    expect(pinned.contains(screen.getByTestId('tool-colors'))).toBe(true)
    expect(pinned.contains(screen.getByTestId('tool-options'))).toBe(true)
    expect(screen.getByTestId('tools-scroll').contains(screen.getByTestId('tool-colors'))).toBe(false)
  })
})
