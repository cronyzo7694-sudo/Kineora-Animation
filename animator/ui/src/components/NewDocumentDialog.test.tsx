import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('../engine/client', () => ({
  newDocFull: vi.fn(() => 5),
  docList: vi.fn(() => []),
  getEngine: vi.fn(() => ({})),
  getEngineStatus: vi.fn(() => ({ kind: 'ok', detail: 'attached' })),
}))
vi.mock('../engine/actions', () => ({ downloadBlob: vi.fn() }))

import { NewDocumentDialog } from './NewDocumentDialog'
import { newDocFull } from '../engine/client'

beforeEach(() => vi.clearAllMocks())

describe('NewDocumentDialog (SYS-02 §6.2)', () => {
  it('renders the six fields with canonical defaults', () => {
    render(<NewDocumentDialog open onClose={() => {}} notify={vi.fn()} />)
    expect(screen.getByTestId('dlg-new-platform')).toHaveValue('HTML5 Canvas')
    expect(screen.getByTestId('dlg-new-units')).toHaveValue('px')
    expect(screen.getByTestId('dlg-new-width')).toHaveValue('1920')
    expect(screen.getByTestId('dlg-new-height')).toHaveValue('1080')
    expect(screen.getByTestId('dlg-new-fps')).toHaveValue('24')
    expect(screen.getByTestId('dlg-new-background')).toBeInTheDocument()
  })

  it('invalid width (below 2) → inline error + Create disabled, no mutation', () => {
    render(<NewDocumentDialog open onClose={() => {}} notify={vi.fn()} />)
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1' } })
    expect(screen.getByTestId('dlg-new-width-error')).toHaveTextContent('width must be ≥ 2')
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(newDocFull).not.toHaveBeenCalled()
  })

  it('fps outside 1–120 → inline error', () => {
    render(<NewDocumentDialog open onClose={() => {}} notify={vi.fn()} />)
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '200' } })
    expect(screen.getByTestId('dlg-new-fps-error')).toHaveTextContent('fps must be 1–120')
  })

  it('valid Create creates the document with the chosen settings', () => {
    render(<NewDocumentDialog open onClose={() => {}} notify={vi.fn()} />)
    fireEvent.change(screen.getByTestId('dlg-new-width'), { target: { value: '1280' } })
    fireEvent.change(screen.getByTestId('dlg-new-height'), { target: { value: '720' } })
    fireEvent.change(screen.getByTestId('dlg-new-fps'), { target: { value: '30' } })
    fireEvent.click(screen.getByTestId('dlg-new-create'))
    expect(newDocFull).toHaveBeenCalledWith({
      platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30, background: '#ffffff', units: 'px',
    })
  })

  it('Enter creates the document', () => {
    const onClose = vi.fn()
    render(<NewDocumentDialog open onClose={onClose} notify={vi.fn()} />)
    fireEvent.keyDown(screen.getByTestId('dlg-new-width'), { key: 'Enter' })
    expect(newDocFull).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('Cancel closes without mutation', () => {
    const onClose = vi.fn()
    render(<NewDocumentDialog open onClose={onClose} notify={vi.fn()} />)
    fireEvent.click(screen.getByTestId('dlg-new-cancel'))
    expect(newDocFull).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
