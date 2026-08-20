import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DocumentSettingsDialog } from './DocumentSettingsDialog'

vi.mock('../engine/client', () => ({
  setDocumentSettings: vi.fn(() => true),
  statusJson: vi.fn(() => ({
    playhead: 1, selection: [], selection_rects: [], selection_details: [], undo_len: 0, redo_len: 0,
    scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0, fps: 24,
    doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 1, clipboard_len: 0, event_log: [],
  })),
}))

import { setDocumentSettings } from '../engine/client'
const setDocumentSettingsMock = vi.mocked(setDocumentSettings)

beforeEach(() => vi.clearAllMocks())

describe('DocumentSettingsDialog (Modify ▸ Document / Ctrl+J)', () => {
  it('renders the four document fields when open', () => {
    render(<DocumentSettingsDialog open onClose={() => {}} notify={vi.fn()} />)
    expect(screen.getByTestId('doc-settings-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('doc-settings-width')).toHaveValue('1920')
    expect(screen.getByTestId('doc-settings-height')).toHaveValue('1080')
    expect(screen.getByTestId('doc-settings-fps')).toHaveValue('24')
    expect(screen.getByTestId('doc-settings-bg')).toBeInTheDocument()
  })

  it('commits width via the real engine command on blur', () => {
    const notify = vi.fn()
    render(<DocumentSettingsDialog open onClose={() => {}} notify={notify} />)
    const w = screen.getByTestId('doc-settings-width')
    fireEvent.change(w, { target: { value: '1280' } })
    fireEvent.blur(w)
    expect(setDocumentSettingsMock).toHaveBeenCalledWith({ width: 1280 })
    expect(notify).toHaveBeenCalledWith('document settings updated')
  })

  it('Done closes the dialog', () => {
    const onClose = vi.fn()
    render(<DocumentSettingsDialog open onClose={onClose} notify={vi.fn()} />)
    fireEvent.click(screen.getByTestId('doc-settings-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
