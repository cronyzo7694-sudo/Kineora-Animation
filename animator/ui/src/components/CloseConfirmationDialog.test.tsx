import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CloseConfirmationDialog } from './CloseConfirmationDialog'

describe('CloseConfirmationDialog (SYS-02 §13.3 canonical guard)', () => {
  it('renders nothing when there is no request', () => {
    render(<CloseConfirmationDialog request={null} onSave={() => {}} onDiscard={() => {}} onCancel={() => {}} />)
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('offers Save / Discard / Cancel', () => {
    render(<CloseConfirmationDialog request={{ what: 'this document', dirtyCount: 1 }} onSave={() => {}} onDiscard={() => {}} onCancel={() => {}} />)
    expect(screen.getByTestId('dlg-close-save')).toBeInTheDocument()
    expect(screen.getByTestId('dlg-close-discard')).toBeInTheDocument()
    expect(screen.getByTestId('dlg-close-cancel')).toBeInTheDocument()
  })

  it('Save → onSave; Discard → onDiscard; Cancel → onCancel', () => {
    const onSave = vi.fn()
    const onDiscard = vi.fn()
    const onCancel = vi.fn()
    render(<CloseConfirmationDialog request={{ what: 'this document', dirtyCount: 1 }} onSave={onSave} onDiscard={onDiscard} onCancel={onCancel} />)
    fireEvent.click(screen.getByTestId('dlg-close-save'))
    expect(onSave).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(onDiscard).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc = Cancel', () => {
    const onCancel = vi.fn()
    render(<CloseConfirmationDialog request={{ what: 'this document', dirtyCount: 1 }} onSave={() => {}} onDiscard={() => {}} onCancel={onCancel} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('pluralises for multiple dirty documents', () => {
    render(<CloseConfirmationDialog request={{ what: 'all documents', dirtyCount: 3 }} onSave={() => {}} onDiscard={() => {}} onCancel={() => {}} />)
    expect(screen.getByText(/3 documents have/)).toBeInTheDocument()
  })
})
