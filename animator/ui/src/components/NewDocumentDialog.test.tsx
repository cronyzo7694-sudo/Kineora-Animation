import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NewDocumentDialog } from './NewDocumentDialog'

beforeEach(() => vi.clearAllMocks())

function renderDialog(onCreate = vi.fn(), onClose = vi.fn()) {
  render(<NewDocumentDialog open onClose={onClose} onCreate={onCreate} />)
  return { onCreate, onClose }
}

describe('NewDocumentDialog (H01 §6.2)', () => {
  it('renders the six fields with canonical defaults', () => {
    renderDialog()
    expect(screen.getByTestId('dlg-new-platform')).toHaveValue('HTML5 Canvas')
    expect(screen.getByTestId('dlg-new-units')).toHaveValue('px')
    expect(screen.getByTestId('dlg-new-width')).toHaveValue('1920')
    expect(screen.getByTestId('dlg-new-height')).toHaveValue('1080')
    expect(screen.getByTestId('dlg-new-fps')).toHaveValue('24')
    expect(screen.getByTestId('dlg-new-background')).toBeInTheDocument()
  })

  it('invalid width (below 2) → inline error + Create disabled, no create', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1' } })
    expect(screen.getByTestId('dlg-new-width-error')).toHaveTextContent('width must be ≥ 2')
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('fps outside 1–120 → inline error', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '200' } })
    expect(screen.getByTestId('dlg-new-fps-error')).toHaveTextContent('fps must be 1–120')
  })

  it('valid Create passes the chosen settings to the onCreate callback', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1280' } })
    fireEvent.change(screen.getByTestId('dlg-new-height'), { target: { value: '720' } })
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '30' } })
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate).toHaveBeenCalledWith({
      platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30, background: '#ffffff', units: 'px',
    })
  })

  it('editing fields never creates a document (only Create does)', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1280' } })
    fireEvent.change(screen.getByTestId('dlg-new-height'), { target: { value: '720' } })
    fireEvent.change(screen.getByTestId('dlg-new-platform'), { target: { value: 'WebGL' } })
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('Enter = Create; Cancel/Esc = close without creating', () => {
    const { onCreate, onClose } = renderDialog()
    fireEvent.keyDown(screen.getByTestId('dlg-new-width'), { key: 'Enter' })
    expect(onCreate).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('dlg-new-cancel'))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onCreate).toHaveBeenCalledTimes(1) // cancel created nothing
  })

  it('Esc closes without creating', () => {
    const { onCreate, onClose } = renderDialog()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('NewDocumentDialog — visual constitution (H00 §17 INV-VIS)', () => {
  it('uses design tokens, not hard-coded colors (no white-on-white)', () => {
    renderDialog()
    const dialog = screen.getByTestId('dlg-new')
    const styles = Object.values((dialog as HTMLElement).style)
    // The dialog must reference semantic tokens (single source of truth).
    expect(screen.getByRole('dialog').getAttribute('style')).toContain('var(--kineora-surface)')
    expect(screen.getByRole('dialog').getAttribute('style')).toContain('var(--kineora-text)')
    // No hard-coded white background on the dialog (white-on-white failure class).
    expect(screen.getByRole('dialog').getAttribute('style')).not.toMatch(/background:\s*#fff/i)
    expect(styles).toBeDefined()
  })

  it('every state has defined contrast: error text uses the danger token', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1' } })
    expect(screen.getByTestId('dlg-new-width-error').getAttribute('style')).toContain('var(--kineora-danger)')
  })

  it('disabled Create is visible with disabled-text, not invisible', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1' } })
    const create = screen.getByTestId('dlg-new-create') as HTMLButtonElement
    expect(create.disabled).toBe(true)
    expect(create.getAttribute('style')).toContain('var(--kineora-disabled-text)')
  })
})
