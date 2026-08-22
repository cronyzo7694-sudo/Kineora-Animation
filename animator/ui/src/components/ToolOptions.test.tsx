import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToolOptions } from './ToolOptions'
import { loadToolOptions, resetToolOptionsForTests } from '../toolOptions'

/**
 * Adobe: "To switch the Zoom tool between zooming in or out, use the Enlarge or
 * Reduce modifiers (in the options area of the Tools panel when the Zoom tool
 * is selected) or Alt‑click."
 */
beforeEach(() => resetToolOptionsForTests())

describe('ToolOptions — Tools panel options area', () => {
  it('shows nothing for a tool without modifiers', () => {
    render(<ToolOptions tool="select" />)
    expect(screen.queryByTestId('tool-options')).not.toBeInTheDocument()
  })

  it('shows Enlarge / Reduce for the Zoom tool, Enlarge active by default', () => {
    render(<ToolOptions tool="zoom" />)
    expect(screen.getByTestId('zoom-mode-in')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('zoom-mode-out')).toHaveAttribute('aria-pressed', 'false')
  })

  it('switching to Reduce updates the shared tool option', () => {
    render(<ToolOptions tool="zoom" />)
    fireEvent.click(screen.getByTestId('zoom-mode-out'))
    expect(loadToolOptions().zoomMode).toBe('out')
    expect(screen.getByTestId('zoom-mode-out')).toHaveAttribute('aria-pressed', 'true')
  })
})
