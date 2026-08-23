import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { controls, validateRegistry } from './controlRegistry'
import { getCommand, makeCommandContext } from './commands'

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

  it('engine/doc-gated buttons are disabled with an honest reason; UI-only controls stay enabled', () => {
    render(<App />)
    // engine absent → Undo is disabled (state-aware), and the tooltip names why.
    expect(screen.getByTestId('edit.undo')).toBeDisabled()
    expect(screen.getByTestId('edit.undo')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('edit.undo')).toHaveAttribute('title', expect.stringContaining('engine not attached'))
    // Export requires a document (SYS-02 §7 "enabled: doc open") → disabled with reason.
    expect(screen.getByTestId('file.export')).toBeDisabled()
    expect(screen.getByTestId('file.export')).toHaveAttribute('title', expect.stringContaining('no document open'))
    // UI-only controls remain enabled (they do not need the engine or a doc).
    expect(screen.getByTestId('panel.layers')).toBeEnabled()
    // tools live in the left Tools panel now (Adobe layout) and are UI-only
    expect(screen.getByTestId('tool-select')).toBeEnabled()
  })

  it('renders Properties by default; Layers dock is off (U-G7 — one list on the timeline)', () => {
    render(<App />)
    expect(screen.queryByTestId('layers-panel')).not.toBeInTheDocument()
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-chrome')).toBeInTheDocument()
  })

  it('panel.layers toggle shows the optional Layers dock (AMB-TL-010)', () => {
    render(<App />)
    expect(screen.queryByTestId('layers-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('panel.layers'))
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('panel.layers'))
    expect(screen.queryByTestId('layers-panel')).not.toBeInTheDocument()
  })
})

describe('A6.7 Kineora AI overlay', () => {
  it('canonical App control opens/closes/reopens the self-contained overlay', () => {
    render(<App />)
    expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-panel-button'))
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-close'))
    expect(screen.queryByTestId('ai-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-panel-button'))
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument()
  })

  it('overlay does not alter panelLayout/workspace-rendered editor regions', () => {
    render(<App />)
    const dock = screen.getByTestId('right-dock')
    const before = dock.getAttribute('style')
    fireEvent.click(screen.getByTestId('ai-panel-button'))
    expect(screen.getByTestId('ai-panel')).toHaveStyle('position: fixed')
    expect(screen.getByTestId('right-dock').getAttribute('style')).toBe(before)
    expect(screen.getByTestId('timeline-chrome')).toBeInTheDocument()
    expect(screen.getByTestId('stage-canvas')).toBeInTheDocument()
  })

  it('composer focus suppresses editor shortcuts; shortcuts resume after blur/close', async () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('ai-panel-button'))
    const composer = screen.getByTestId('ai-composer')
    composer.focus()
    fireEvent.keyDown(composer, { key: 'z', ctrlKey: true })
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    fireEvent.blur(composer)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('Undo: engine not attached')
    fireEvent.click(screen.getByTestId('ai-close'))
    expect(document.activeElement).not.toBe(composer)
  })
})

describe('workspace panel resizing (C-06 pnl.resize)', () => {
  beforeEach(() => {
    try {
      localStorage.removeItem('kineora.workspace.panelLayout')
      localStorage.removeItem('kineora.workspace')
    } catch {
      /* ignore */
    }
  })

  it('dragging the Layers resize handle widens the panel (live, min-clamped)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('panel.layers'))
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 530 }) // +30
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 230px')
  })

  it('dragging the Properties resize handle left widens it; right narrows it (default 240)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-props')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 400 }) // -100 → properties +100
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 340px')

    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 560 }) // +60 → properties -60
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 280px')
  })

  it('Properties width is min-clamped to the blueprint 240px (C-09)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-props')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 5000 }) // +4500 → properties -4500
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 240px') // PROPS_W min
  })

  it('resize is min-clamped (never zero — C-06)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('panel.layers'))
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 0 })
    fireEvent.mouseMove(window, { clientX: -5000 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 140px') // LAYERS_MIN
  })

  it('Escape cancels the resize back to its origin width (C-06)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('panel.layers'))
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
    fireEvent.click(screen.getByTestId('panel.layers'))
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
  it('Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y report the honest disabled reason when the engine is absent', async () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('Undo: engine not attached')
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('Redo: engine not attached')
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(await screen.findByTestId('toast')).toHaveTextContent('Redo: engine not attached')
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
  it('Export is doc-gated (SYS-02 §7): disabled with no document, wired to the dialog via the registry', () => {
    render(<App />)
    // No document in jsdom → the Export command is disabled-by-context (honest).
    expect(screen.getByTestId('file.export')).toBeDisabled()
    // The command itself is still wired to the export dialog (single commandId).
    const cmd = getCommand('file.export')
    expect(cmd?.status).toBe('FUNCTIONAL')
    const openExport = vi.fn()
    cmd?.run({ ...makeCommandContext({ notify: vi.fn() }), openExport } as never)
    expect(openExport).toHaveBeenCalledTimes(1)
  })
})
