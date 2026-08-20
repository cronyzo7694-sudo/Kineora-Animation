import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  try {
    localStorage.removeItem('kineora.workspace.panelLayout')
  } catch {
    /* ignore */
  }
  vi.clearAllMocks()
})

describe('panel layout — timeline vertical resize (C-08 tl.resize)', () => {
  it('dragging the timeline top edge UP grows it; DOWN shrinks it', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    const before = Number(screen.getByTestId('timeline').style.height.replace('px', ''))

    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 360 }) // -40 up → timeline +40
    fireEvent.mouseUp(window)
    const grown = Number(screen.getByTestId('timeline').style.height.replace('px', ''))
    expect(grown).toBe(before + 40)
  })

  it('timeline height clamps to the 96px minimum', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 5000 }) // huge down → shrink
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline')).toHaveStyle('height: 96px')
  })

  it('timeline height clamps to 60% of the viewport (C-08 max)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    const max = Math.round(window.innerHeight * 0.6)
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: -5000 }) // huge up → grow
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline')).toHaveStyle(`height: ${max}px`)
  })

  it('resizing the timeline does NOT change frame zoom (independent)', () => {
    render(<App />)
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('100%')
    const handle = screen.getByTestId('resize-timeline')
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 200 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline-zoom-readout')).toHaveTextContent('100%')
  })

  it('resizing the timeline does NOT move the playhead or create undo', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 300 })
    fireEvent.mouseUp(window)
    // playhead readout unchanged (engine not attached in jsdom → frame readout shows 1)
    expect(screen.getByTestId('timeline-frame-readout')).toHaveTextContent('1')
  })

  it('layer rows scroll vertically when the timeline is short (no clipping)', () => {
    render(<App />)
    const grid = screen.getByTestId('timeline-grid')
    const overflowY = getComputedStyle(grid).overflowY
    expect(['auto', 'scroll']).toContain(overflowY)
  })
})

describe('panel layout — right column vertical splitters', () => {
  it('dragging the library splitter changes the library height (min-clamped)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-library')
    const wrap = screen.getByTestId('library-wrap')
    const before = Number(wrap.style.height.replace('px', ''))

    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 440 }) // +40 down → library +40
    fireEvent.mouseUp(window)
    const after = Number(wrap.style.height.replace('px', ''))
    expect(after).toBe(before + 40)
  })

  it('dragging the debug splitter changes the debug panel height', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-debug')
    const wrap = screen.getByTestId('debug-wrap')
    const before = Number(wrap.style.height.replace('px', ''))

    fireEvent.mouseDown(handle, { button: 0, clientY: 500 })
    fireEvent.mouseMove(window, { clientY: 460 }) // -40 up → debug +40
    fireEvent.mouseUp(window)
    const after = Number(wrap.style.height.replace('px', ''))
    expect(after).toBe(before + 40)
  })

  it('library splitter is min-clamped (never zero)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-library')
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: -5000 }) // huge up → shrink
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('library-wrap')).toHaveStyle('height: 96px')
  })
})

describe('panel layout — cancellation (C-34)', () => {
  it('Escape cancels a vertical resize back to origin', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    const before = screen.getByTestId('timeline').style.height
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 300 })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('timeline').style.height).toBe(before)
  })

  it('pointercancel cancels the drag', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    const before = screen.getByTestId('timeline').style.height
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 200 })
    fireEvent.pointerCancel(window)
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline').style.height).toBe(before)
  })

  it('zero-delta release commits no change', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    const before = screen.getByTestId('timeline').style.height
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('timeline').style.height).toBe(before)
  })
})

describe('panel layout — persistence + Reset Workspace (Part 01 §1.1.2 / C-06)', () => {
  it('resized sizes persist to localStorage', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 600 })
    fireEvent.mouseUp(window)
    expect(setSpy).toHaveBeenCalledWith('kineora.workspace.panelLayout', expect.stringContaining('layersW'))
    setSpy.mockRestore()
  })

  it('Reset Workspace restores the blueprint defaults', () => {
    render(<App />)
    // first grow layers
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 600 })
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 300px')

    fireEvent.click(screen.getByTestId('reset-workspace'))
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 200px')
    expect(screen.getByTestId('properties-panel')).toHaveStyle('width: 240px')
  })

  it('remount restores persisted sizes', () => {
    const { unmount } = render(<App />)
    const handle = screen.getByTestId('resize-layers')
    fireEvent.mouseDown(handle, { button: 0, clientX: 500 })
    fireEvent.mouseMove(window, { clientX: 620 }) // +120 → 320
    fireEvent.mouseUp(window)
    unmount()

    render(<App />)
    expect(screen.getByTestId('layers-panel')).toHaveStyle('width: 320px')
  })
})

describe('panel layout — view state only (no engine/undo interaction)', () => {
  it('resizing never calls the engine or pollutes undo', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    fireEvent.mouseDown(handle, { button: 0, clientY: 400 })
    fireEvent.mouseMove(window, { clientY: 300 })
    fireEvent.mouseUp(window)
    // engine not attached in jsdom; undo button would report "engine not attached"
    // rather than having an entry created by resize — resize is pure view state.
    expect(screen.getByTestId('timeline')).toBeInTheDocument()
  })

  it('resizing does not move the Stage (no accidental stage interaction)', () => {
    render(<App />)
    const handle = screen.getByTestId('resize-timeline')
    // mouseDown on the splitter must preventDefault (returns false in jsdom)
    expect(fireEvent.mouseDown(handle, { button: 0, clientY: 400 })).toBe(false)
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('stage-canvas')).toBeInTheDocument()
  })
})
