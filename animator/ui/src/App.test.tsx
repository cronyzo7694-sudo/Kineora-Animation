import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { controls, validateRegistry } from './controlRegistry'

describe('control registry (zero dead button)', () => {
  it('has no duplicate IDs, unbound FUNCTIONAL controls, or missing a11y labels', () => {
    expect(validateRegistry(controls)).toEqual([])
  })

  it('every control has a unique test id = control id', () => {
    const ids = controls.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('app shell', () => {
  it('renders P0 controls (Undo, Redo, Play, Keyframe, Save, Export)', () => {
    render(<App />)
    for (const id of ['edit.undo', 'edit.redo', 'timeline.play', 'timeline.keyframe', 'file.save', 'file.export']) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })

  it('renders a real stage canvas (no fake placeholder artwork)', () => {
    render(<App />)
    expect(screen.getByTestId('stage-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('zoom-readout')).toBeInTheDocument()
  })

  it('reports engine not-attached state explicitly (no fake functionality)', () => {
    render(<App />)
    expect(screen.getByTestId('engine-status')).toHaveTextContent('not attached')
    expect(screen.getByTestId('stage-notice')).toBeInTheDocument()
  })

  it('debug panel reports zero dead buttons', () => {
    render(<App />)
    expect(screen.getByTestId('dead-button-count')).toHaveTextContent('0 dead buttons')
  })

  it('button click reports blocker instead of silently doing nothing', async () => {
    render(<App />)
    screen.getByTestId('edit.undo').click()
    expect(await screen.findByTestId('toast')).toHaveTextContent('undo: engine not attached')
  })

  it('renders engine-backed Layers and Properties panels by default', () => {
    render(<App />)
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument()
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
  })

  it('panel.layers toggle hides the Layers panel (real panel control)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('panel.layers'))
    expect(screen.queryByTestId('layers-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('panel.layers'))
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument()
  })
})

describe('workspace panel resizing (C-06 pnl.resize)', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem('kineora.workspace.panelWidths')
    } catch {
      /* ignore */
    }
  })

  it('dragging the Layers resize handle widens the panel (live, min-clamped)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 530 }) // +30
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 230px')
  })

  it('dragging the Properties resize handle left widens it; right narrows it', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-props')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 470 }) // -30 → properties +30
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 250px')

    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 560 }) // +60 → properties -60
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 190px')
  })

  it('resize is min-clamped (never zero — C-06)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 0 })
    fireEvent.mouseMove(window, { clientX: -5000 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 140px') // LAYERS_MIN
  })

  it('Escape cancels the resize back to its origin width (C-06)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 600 }) // +100
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 300px')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 200px') // origin
  })

  it('resizing does not change zoom or document state (view-only)', () => {
    render(<App />)
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%')
    const handle = screen.getByTestId('resize-props')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 400 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('zoom-readout')).toHaveTextContent('100%') // zoom untouched
    expect(screen.getByTestId('stage-wrap')).toBeInTheDocument() // stage intact
  })

  it('panels never overlap: stage remains present beside resized panels', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 0 })
    fireEvent.mouseMove(window, { clientX: 5000 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 480px') // LAYERS_MAX
    expect(screen.getByTestId('stage-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
  })
})

describe('global undo/redo shortcuts (Part 29.2)', () => {
  it('Ctrl+Z triggers undo; Ctrl+Shift+Z / Ctrl+Y trigger redo', async () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('undo: engine not attached')
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('redo: engine not attached')
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('redo: engine not attached')
  })

  it('undo shortcuts are skipped while typing in an input', async () => {
    render(<App />)
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true })
    expect(screen.queryByText('undo: engine not attached')).not.toBeInTheDocument()
    document.body.removeChild(input)
  })
})

describe('symbol dialogs + library panel wiring (Part 11/12)', () => {
  it('F8 opens the Convert to Symbol dialog; Ctrl+F8 opens New Symbol', () => {
    render(<App />)
    expect(screen.queryByTestId('symbol-dialog')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'F8' })
    expect(screen.getByTestId('symbol-dialog')).toBeInTheDocument()
    expect(screen.getByText('Convert to Symbol')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('symbol-cancel'))

    fireEvent.keyDown(window, { key: 'F8', ctrlKey: true })
    expect(screen.getByText('New Symbol')).toBeInTheDocument()
  })

  it('renders the Library panel by default and panel.library toggles it', () => {
    render(<App />)
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('panel.library'))
    expect(screen.queryByTestId('library-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('panel.library'))
    expect(screen.getByTestId('library-panel')).toBeInTheDocument()
  })
})

describe('export dialog wiring', () => {
  it('the Export toolbar control opens the export dialog (C-31 exp.image)', () => {
    render(<App />)
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('file.export'))
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument()
    // engine not attached in jsdom → honest disabled export
    expect(screen.getByTestId('export-not-attached')).toBeInTheDocument()
    expect(screen.getByTestId('export-confirm')).toBeDisabled()
  })
})
