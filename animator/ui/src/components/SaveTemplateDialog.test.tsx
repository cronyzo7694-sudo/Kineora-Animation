import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SaveTemplateDialog } from './SaveTemplateDialog'

const TEMPLATES_KEY = 'kineora.templates'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem(TEMPLATES_KEY)
})

function renderDialog(onSave = vi.fn(), onClose = vi.fn()) {
  render(<SaveTemplateDialog open onClose={onClose} onSave={onSave} />)
  return { onSave, onClose }
}

describe('SaveTemplateDialog (H01 v2 §5.4)', () => {
  it('empty name → inline error + Confirm disabled (never a silent no-op)', () => {
    const { onSave } = renderDialog()
    expect(screen.getByTestId('dlg-save-template-name-error')).toHaveTextContent('a name is required')
    const confirm = screen.getByTestId('dlg-save-template-confirm') as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.click(confirm)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('valid name → onSave with the trimmed name, then closes', () => {
    const { onSave, onClose } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-save-template-name'), { target: { value: '  Character Rig  ' } })
    fireEvent.click(screen.getByTestId('dlg-save-template-confirm'))
    expect(onSave).toHaveBeenCalledWith('Character Rig')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Enter confirms; Esc cancels without saving', () => {
    const { onSave, onClose } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-save-template-name'), { target: { value: 'Banner' } })
    fireEvent.keyDown(screen.getByTestId('dlg-save-template-name'), { key: 'Enter' })
    expect(onSave).toHaveBeenCalledWith('Banner')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Esc cancels without saving', () => {
    const { onSave, onClose } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-save-template-name'), { target: { value: 'Banner' } })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })

  // AMB-H01-002 (provisional = guarded overwrite, pending user decision)
  it('duplicate name → inline warning + explicit Replace button (guarded overwrite, INV-DSTR)', () => {
    localStorage.setItem(
      TEMPLATES_KEY,
      JSON.stringify({ Banner: { name: 'Banner', savedAt: 1, json: '{}' } }),
    )
    const { onSave } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-save-template-name'), { target: { value: 'Banner' } })
    expect(screen.getByTestId('dlg-save-template-dup-warning')).toHaveTextContent('already exists')
    const confirm = screen.getByTestId('dlg-save-template-confirm') as HTMLButtonElement
    expect(confirm.textContent).toBe('Replace')
    expect(confirm.disabled).toBe(false)
    fireEvent.click(confirm)
    expect(onSave).toHaveBeenCalledWith('Banner') // explicit user click = the guard
  })
})
