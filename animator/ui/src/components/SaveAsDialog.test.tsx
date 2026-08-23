import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SaveAsDialog } from './SaveAsDialog'

describe('SaveAsDialog (browser Save / Save As)', () => {
  it('Enter confirms the trimmed name without .json', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<SaveAsDialog open suggested="Untitled-1.json" onCancel={onCancel} onConfirm={onConfirm} />)
    const input = screen.getByTestId('dlg-save-as-name') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  My Scene.json  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith('My Scene')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('Esc cancels without saving', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<SaveAsDialog open suggested="demo" onCancel={onCancel} onConfirm={onConfirm} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('empty name keeps Save disabled', () => {
    const onConfirm = vi.fn()
    render(<SaveAsDialog open suggested="x" onCancel={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.change(screen.getByTestId('dlg-save-as-name'), { target: { value: '   ' } })
    expect((screen.getByTestId('dlg-save-as-confirm') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByTestId('dlg-save-as-confirm'))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
