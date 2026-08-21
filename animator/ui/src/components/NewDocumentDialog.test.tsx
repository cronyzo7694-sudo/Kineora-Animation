import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { NewDocumentDialog } from './NewDocumentDialog'

beforeEach(() => vi.clearAllMocks())

function renderDialog(onCreate = vi.fn(), onClose = vi.fn()) {
  render(<NewDocumentDialog open onClose={onClose} onCreate={onCreate} />)
  return { onCreate, onClose }
}

describe('NewDocumentDialog (H01 v2 §5.2)', () => {
  it('renders all seven fields with canonical defaults (1920×1080/24/#ffffff α1/px/HTML5 Canvas)', () => {
    renderDialog()
    expect(screen.getByTestId('dlg-new-platform')).toHaveValue('HTML5 Canvas')
    expect(screen.getByTestId('dlg-new-units')).toHaveValue('px')
    expect(screen.getByTestId('dlg-new-width')).toHaveValue('1920')
    expect(screen.getByTestId('dlg-new-height')).toHaveValue('1080')
    expect(screen.getByTestId('dlg-new-fps')).toHaveValue('24')
    expect(screen.getByTestId('dlg-new-background')).toBeInTheDocument()
    expect(screen.getByTestId('dlg-new-background-alpha')).toHaveValue('1')
  })

  it('initial focus = the platform field (first field, §5.2 dialog contract)', () => {
    renderDialog()
    expect(screen.getByTestId('dlg-new-platform')).toHaveFocus()
  })

  it('numeric fields announce their range (a11y §9)', () => {
    renderDialog()
    expect(screen.getByTestId('dlg-new-width-hint')).toHaveTextContent('minimum 2')
    expect(screen.getByTestId('dlg-new-fps-hint')).toHaveTextContent('1–120')
    expect(screen.getByTestId('dlg-new-background-alpha-hint')).toHaveTextContent('0–1')
  })

  it('invalid width (below 2) → inline error + Create disabled, no create', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1' } })
    expect(screen.getByTestId('dlg-new-width-error')).toHaveTextContent('width must be ≥ 2')
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('empty width → invalid (Create disabled)', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '' } })
    expect(screen.getByTestId('dlg-new-width-error')).toBeInTheDocument()
    expect((screen.getByTestId('dlg-new-create') as HTMLButtonElement).disabled).toBe(true)
  })

  // ——— fps rule (v2 reconciled §5.2): EMPTY = invalid; typed out-of-range = CLAMP on commit ———
  it('fps EMPTY → inline error + Create disabled', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '' } })
    expect(screen.getByTestId('dlg-new-fps-error')).toHaveTextContent('fps must be 1–120')
    expect((screen.getByTestId('dlg-new-create') as HTMLButtonElement).disabled).toBe(true)
  })

  it('fps 999 is NOT an error — it clamps to 120 on commit', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '999' } })
    expect(screen.queryByTestId('dlg-new-fps-error')).toBeNull()
    expect((screen.getByTestId('dlg-new-create') as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate.mock.calls[0][0].fps).toBe(120)
  })

  it('fps 0 clamps up to 1 on commit', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '0' } })
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate.mock.calls[0][0].fps).toBe(1)
  })

  it('background alpha outside 0–1 → inline error + Create disabled', () => {
    renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-background-alpha'), { target: { value: '1.5' } })
    expect(screen.getByTestId('dlg-new-background-alpha-error')).toHaveTextContent('alpha must be 0–1')
    expect((screen.getByTestId('dlg-new-create') as HTMLButtonElement).disabled).toBe(true)
  })

  it('valid Create passes the chosen settings (incl. alpha) to onCreate', () => {
    const { onCreate } = renderDialog()
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1280' } })
    fireEvent.change(screen.getByTestId('dlg-new-height'), { target: { value: '720' } })
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '30' } })
    fireEvent.change(screen.getByTestId('dlg-new-background-alpha'), { target: { value: '0.5' } })
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(onCreate).toHaveBeenCalledWith({
      platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30,
      background: '#ffffff', backgroundAlpha: 0.5, units: 'px',
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

  it('outside-click (overlay) = Cancel — no state change', () => {
    const { onCreate, onClose } = renderDialog()
    fireEvent.mouseDown(screen.getByTestId('dlg-new'))
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
