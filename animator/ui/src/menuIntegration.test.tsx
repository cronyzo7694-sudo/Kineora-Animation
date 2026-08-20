import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('menu bar + command architecture integration', () => {
  it('renders the 11 top-level menus', () => {
    render(<App />)
    for (const label of ['File', 'Edit', 'View', 'Insert', 'Modify', 'Text', 'Commands', 'Control', 'Debug', 'Window', 'Help']) {
      expect(screen.getByText(label, { selector: 'button' })).toBeInTheDocument()
    }
  })

  it('Ctrl+K opens the command palette; Esc closes it', () => {
    render(<App />)
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByTestId('command-palette')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByTestId('palette-input'), { key: 'Escape' })
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument()
  })

  it('Window ▸ Timeline hides and restores the timeline panel (same command as Ctrl+Alt+T)', () => {
    render(<App />)
    expect(screen.getByTestId('timeline')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.click(screen.getByTestId('menu-item-panel.timeline'))
    expect(screen.queryByTestId('timeline')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.click(screen.getByTestId('menu-item-panel.timeline'))
    expect(screen.getByTestId('timeline')).toBeInTheDocument()
  })

  it('Ctrl+Alt+T hides the timeline (shortcut and menu share the same command)', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 't', ctrlKey: true, altKey: true })
    expect(screen.queryByTestId('timeline')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 't', ctrlKey: true, altKey: true })
    expect(screen.getByTestId('timeline')).toBeInTheDocument()
  })

  it('Window ▸ Tools hides the toolbar', () => {
    render(<App />)
    expect(screen.getByTestId('tool.select')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('menu.window'))
    fireEvent.click(screen.getByTestId('menu-item-panel.tools'))
    expect(screen.queryByTestId('tool.select')).not.toBeInTheDocument()
  })

  it('Control ▸ Loop toggles the timeline loop state (same executor as the Loop button)', () => {
    render(<App />)
    expect(screen.getByTestId('timeline-loop')).toHaveAttribute('data-on', 'true')
    fireEvent.click(screen.getByTestId('menu.control'))
    fireEvent.click(screen.getByTestId('menu-item-control.loop'))
    expect(screen.getByTestId('timeline-loop')).toHaveAttribute('data-on', 'false')
  })

  it('View ▸ Zoom In runs the stage view controller (stage zoom changes)', () => {
    render(<App />)
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')
    fireEvent.click(screen.getByTestId('menu.view'))
    fireEvent.click(screen.getByTestId('menu-item-view.zoomIn'))
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('200%')
  })

  it('Help ▸ About opens the About dialog; Help ▸ Keyboard Shortcuts opens the viewer', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.help'))
    fireEvent.click(screen.getByTestId('menu-item-help.about'))
    expect(screen.getByTestId('about-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('about-close'))

    fireEvent.click(screen.getByTestId('menu.help'))
    fireEvent.click(screen.getByTestId('menu-item-help.shortcuts'))
    expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('shortcuts-close'))
  })

  it('F8 / Ctrl+F8 still open the symbol dialogs through the shared dispatcher', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'F8' })
    expect(screen.getByText('Convert to Symbol')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('symbol-cancel'))
    fireEvent.keyDown(window, { key: 'F8', ctrlKey: true })
    expect(screen.getByText('New Symbol')).toBeInTheDocument()
  })

  it('tool shortcuts V / R / Q switch tools through the registry', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'r' })
    expect(screen.getByTestId('statusbar')).toHaveTextContent('rect')
    fireEvent.keyDown(window, { key: 'q' })
    expect(screen.getByTestId('statusbar')).toHaveTextContent('transform')
    fireEvent.keyDown(window, { key: 'v' })
    expect(screen.getByTestId('statusbar')).toHaveTextContent('select')
  })
})
