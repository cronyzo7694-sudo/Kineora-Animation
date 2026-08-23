import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToolColors } from './ToolColors'
import { loadToolColors, resetToolColorsCacheForTests, setToolColors } from '../toolColors'

/**
 * The Tools-panel colors area (Blueprint Part 01 §1.3.1: Fill chip, Stroke
 * chip, swap, black&white, no-color; "clicking a chip opens Color picker").
 * Numeric values (stroke width) live in a popover, never loose on the rail.
 */
beforeEach(() => {
  window.localStorage.clear()
  resetToolColorsCacheForTests()
})

describe('ToolColors — rail carries buttons only', () => {
  it('shows the fill + stroke chips and the swap / black&white / width buttons', () => {
    render(<ToolColors vertical />)
    expect(screen.getByTestId('tool-fill-chip')).toBeInTheDocument()
    expect(screen.getByTestId('tool-stroke-chip')).toBeInTheDocument()
    expect(screen.getByTestId('tool-colors-swap')).toBeInTheDocument()
    expect(screen.getByTestId('tool-colors-default')).toBeInTheDocument()
    expect(screen.getByTestId('tool-stroke-width-btn')).toBeInTheDocument()
  })

  it('the rail has NO loose color picker or numeric field until a chip is clicked', () => {
    render(<ToolColors vertical />)
    expect(screen.queryByTestId('tool-fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tool-stroke')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tool-stroke-width')).not.toBeInTheDocument()
  })

  it('clicking a chip opens its color popover (Blueprint: chip → Color picker)', () => {
    setToolColors({ fill: '#112233', stroke: '#445566', strokeWidth: 2 })
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    expect(screen.getByTestId('tool-color-popover')).toBeInTheDocument()
    expect(screen.getByTestId('tool-fill')).toHaveValue('#112233')
    fireEvent.click(screen.getByTestId('tool-stroke-chip'))
    expect(screen.getByTestId('tool-stroke')).toHaveValue('#445566')
    expect(screen.queryByTestId('tool-fill')).not.toBeInTheDocument()
  })

  it('clicking the same chip again closes the popover', () => {
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    expect(screen.getByTestId('tool-color-popover')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    expect(screen.queryByTestId('tool-color-popover')).not.toBeInTheDocument()
  })

  it('picking a fill updates the shared authoring state', () => {
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    fireEvent.change(screen.getByTestId('tool-fill'), { target: { value: '#00ff00' } })
    expect(loadToolColors().fill).toBe('#00ff00')
  })

  it('No color clears the colour and marks the chip with the slash', () => {
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-stroke-chip'))
    fireEvent.click(screen.getByTestId('tool-stroke-none-btn'))
    expect(loadToolColors().stroke).toBeNull()
    expect(screen.getByTestId('tool-stroke-none')).toBeInTheDocument()
  })

  it('swap exchanges fill and stroke', () => {
    setToolColors({ fill: '#aabbcc', stroke: '#001122' })
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-colors-swap'))
    expect(loadToolColors().fill).toBe('#001122')
    expect(loadToolColors().stroke).toBe('#aabbcc')
  })

  it('black&white restores the default black stroke / white fill', () => {
    setToolColors({ fill: '#123456', stroke: null, strokeWidth: 7 })
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-colors-default'))
    expect(loadToolColors()).toEqual({ fill: '#ffffff', stroke: '#000000', strokeWidth: 1 })
  })

  it('the W button opens the stroke-width popover (numeric lives off the rail)', () => {
    setToolColors({ strokeWidth: 3 })
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-stroke-width-btn'))
    expect(screen.getByTestId('tool-color-popover')).toHaveTextContent('Stroke width')
    expect(screen.getByTestId('tool-stroke-width')).toHaveValue(3)
    fireEvent.change(screen.getByTestId('tool-stroke-width'), { target: { value: '5' } })
    expect(loadToolColors().strokeWidth).toBe(5)
  })

  it('the popover closes on Escape and on an outside pointer press', () => {
    render(<ToolColors vertical />)
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('tool-color-popover')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('tool-fill-chip'))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByTestId('tool-color-popover')).not.toBeInTheDocument()
  })
})
