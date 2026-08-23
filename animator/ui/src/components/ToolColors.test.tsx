import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToolColors } from './ToolColors'
import { loadToolColors, resetToolColorsCacheForTests, setToolColors } from '../toolColors'

/**
 * The Tools-panel colors area (Adobe: fill + stroke swatches, "no color",
 * swap, and reset-to-default controls).
 */
beforeEach(() => {
  window.localStorage.clear()
  resetToolColorsCacheForTests()
})

describe('ToolColors — Tools panel colors area', () => {
  it('shows the current fill and stroke swatches', () => {
    setToolColors({ fill: '#112233', stroke: '#445566', strokeWidth: 2 })
    render(<ToolColors />)
    expect(screen.getByTestId('tool-fill')).toHaveValue('#112233')
    expect(screen.getByTestId('tool-stroke')).toHaveValue('#445566')
    expect(screen.getByTestId('tool-stroke-width')).toHaveValue(2)
  })

  it('picking a fill updates the shared authoring state', () => {
    render(<ToolColors />)
    fireEvent.change(screen.getByTestId('tool-fill'), { target: { value: '#00ff00' } })
    expect(loadToolColors().fill).toBe('#00ff00')
  })

  it('the None button clears the colour and marks the swatch', () => {
    render(<ToolColors />)
    fireEvent.click(screen.getByTestId('tool-stroke-none-btn'))
    expect(loadToolColors().stroke).toBeNull()
    expect(screen.getByTestId('tool-stroke-none')).toBeInTheDocument()
  })

  it('swap exchanges fill and stroke, and the swatches follow', () => {
    setToolColors({ fill: '#aabbcc', stroke: '#001122' })
    render(<ToolColors />)
    fireEvent.click(screen.getByTestId('tool-colors-swap'))
    expect(screen.getByTestId('tool-fill')).toHaveValue('#001122')
    expect(screen.getByTestId('tool-stroke')).toHaveValue('#aabbcc')
  })

  it('reset restores Adobe\u2019s default black stroke / white fill', () => {
    setToolColors({ fill: '#123456', stroke: null, strokeWidth: 7 })
    render(<ToolColors />)
    fireEvent.click(screen.getByTestId('tool-colors-default'))
    expect(loadToolColors()).toEqual({ fill: '#ffffff', stroke: '#000000', strokeWidth: 1 })
  })

  it('stroke width edits are kept (used by the Ink Bottle)', () => {
    render(<ToolColors />)
    fireEvent.change(screen.getByTestId('tool-stroke-width'), { target: { value: '5' } })
    expect(loadToolColors().strokeWidth).toBe(5)
  })
})
