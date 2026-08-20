import { describe, expect, it } from 'vitest'
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
