import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

// Mock the engine bridge, spreading the real module so every component import
// (hasSymbolFacade, isPlaying, …) resolves; override only the lifecycle seam.
vi.mock('./engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/client')>()
  return {
    ...actual,
    statusJson: vi.fn(),
    getEngineStatus: () => ({ kind: 'ok' as const, detail: 'attached' }),
    getEngine: () => ({}),
    loadEngine: async () => ({ kind: 'ok' as const, detail: 'attached' }),
    docList: vi.fn(() => []),
    setActiveDoc: vi.fn(() => true),
    closeDoc: vi.fn(() => true),
    activeDocId: vi.fn(() => 1),
  }
})
vi.mock('./engine/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/actions')>()
  return { ...actual, downloadBlob: vi.fn(), stopPlayback: vi.fn() }
})

import App from './App'
import { activeDocId, closeDoc, docList, setActiveDoc, statusJson } from './engine/client'

const statusJsonMock = vi.mocked(statusJson)
const setActiveDocMock = vi.mocked(setActiveDoc)
const closeDocMock = vi.mocked(closeDoc)
const docListMock = vi.mocked(docList)
const activeDocIdMock = vi.mocked(activeDocId)

const baseStatus = () => ({
  playhead: 1,
  selection: [],
  selection_rects: [],
  selection_details: [],
  undo_len: 0,
  redo_len: 0,
  scene: 'Scene 1',
  layer: 'Layer 1',
  layers: [],
  active_layer: 0,
  fps: 24,
  doc_width: 1920,
  doc_height: 1080,
  background: '#ffffff',
  duration: 1,
  clipboard_len: 0,
  event_log: [],
  doc_id: 1,
  doc_title: 'Untitled-1',
  dirty: false,
  doc_count: 2,
  docs: [
    { id: 1, title: 'Untitled-1', dirty: false },
    { id: 2, title: 'scene2', dirty: true },
  ],
  units: 'px',
  platform: 'HTML5 Canvas',
})

beforeEach(() => {
  vi.clearAllMocks()
  statusJsonMock.mockReturnValue(baseStatus() as never)
  docListMock.mockReturnValue([
    { id: 1, title: 'Untitled-1', dirty: false },
    { id: 2, title: 'scene2', dirty: true },
  ])
  try {
    localStorage.removeItem('kineora.workspace')
    localStorage.removeItem('kineora.recentFiles')
  } catch {
    /* ignore */
  }
})

describe('SYS-02 document tabs (multi-document)', () => {
  it('renders a tab per open document with a dirty dot', () => {
    render(<App />)
    expect(screen.getByTestId('doc-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('doc-tab-title-1')).toHaveTextContent('Untitled-1')
    expect(screen.getByTestId('doc-tab-title-2')).toHaveTextContent('scene2')
    expect(screen.getByTestId('doc-tab-dirty-2')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
  })

  it('clicking a tab activates that document (engine set_active_doc)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('doc-tab-2'))
    expect(setActiveDocMock).toHaveBeenCalledWith(2)
  })

  it('header shows the active document title + dirty dot', () => {
    statusJsonMock.mockReturnValue({ ...baseStatus(), doc_id: 2, doc_title: 'scene2', dirty: true } as never)
    render(<App />)
    expect(screen.getByTestId('header-doc-title')).toHaveTextContent('scene2')
    expect(screen.getByTestId('header-dirty-dot')).toBeInTheDocument()
  })
})

describe('SYS-02 close guard + lifecycle', () => {
  it('closing a CLEAN active document closes directly (no confirmation)', () => {
    statusJsonMock.mockReturnValue({ ...baseStatus(), doc_id: 1, doc_title: 'Untitled-1', dirty: false } as never)
    docListMock.mockReturnValue([
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: true },
    ])
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
    expect(closeDocMock).toHaveBeenCalledWith(1)
  })

  it('closing a DIRTY document opens the Close Confirmation; Discard proceeds', () => {
    statusJsonMock.mockReturnValue({ ...baseStatus(), doc_id: 2, doc_title: 'scene2', dirty: true } as never)
    docListMock.mockReturnValue([
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: true },
    ])
    activeDocIdMock.mockReturnValue(2)
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(closeDocMock).toHaveBeenCalledWith(2)
  })

  it('Cancel leaves the document open (no close)', () => {
    statusJsonMock.mockReturnValue({ ...baseStatus(), doc_id: 2, doc_title: 'scene2', dirty: true } as never)
    docListMock.mockReturnValue([
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: true },
    ])
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(closeDocMock).not.toHaveBeenCalled()
  })

  it('tab × runs the same canonical close command as File ▸ Close (dirty guard)', () => {
    statusJsonMock.mockReturnValue({ ...baseStatus(), doc_id: 2, doc_title: 'scene2', dirty: true } as never)
    docListMock.mockReturnValue([
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: true },
    ])
    render(<App />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
  })
})

describe('SYS-02 File menu + hidden controls', () => {
  it('File menu lists the required SYS-02 entries', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    for (const id of ['file.new', 'file.newFromTemplate', 'file.open', 'file.close', 'file.closeAll', 'file.save', 'file.saveAs', 'file.saveAsTemplate', 'file.exit']) {
      expect(screen.getByTestId(`menu-item-${id}`)).toBeInTheDocument()
    }
    // submenu entries (Import / Export / Publish)
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Import'))
    expect(screen.getByTestId('menu-item-file.import-stage')).toBeInTheDocument() // H09: file.import('stage')
    expect(screen.getByTestId('menu-item-file.import-library')).toBeInTheDocument() // H09: file.import('library')
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Export'))
    expect(screen.getByTestId('menu-item-file.export-image')).toBeInTheDocument() // H09: file.export('image')
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Publish'))
    expect(screen.getByTestId('menu-item-file.publishSettings')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-file.publish')).toBeInTheDocument()
  })

  it('AIR Settings / Print / Page Setup are HIDDEN (no dead UI — §7)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.queryByText('AIR Settings')).not.toBeInTheDocument()
    expect(screen.queryByText('Print…')).not.toBeInTheDocument()
    expect(screen.queryByText('Page Setup…')).not.toBeInTheDocument()
  })

  it('Ctrl+N opens the New document dialog', () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true })
    expect(screen.getByTestId('dlg-new')).toBeInTheDocument()
  })

  it('File ▸ Exit shows the honest application-exit screen', () => {
    docListMock.mockReturnValue([
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: false },
    ])
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.exit'))
    expect(screen.getByTestId('exit-screen')).toBeInTheDocument()
    expect(screen.getByTestId('exit-restart')).toBeInTheDocument()
  })

  it('handoff commands report the owning system honestly (never fake success)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Import'))
    fireEvent.click(screen.getByTestId('menu-item-file.import-stage'))
    expect(screen.getByTestId('toast')).toHaveTextContent('SYS-27')
  })

  it('no-document state offers New / Open', () => {
    statusJsonMock.mockReturnValue(null)
    docListMock.mockReturnValue([])
    render(<App />)
    expect(screen.getByTestId('no-doc-state')).toBeInTheDocument()
    expect(screen.getByTestId('no-doc-new')).toBeInTheDocument()
    expect(screen.getByTestId('no-doc-open')).toBeInTheDocument()
    expect(screen.getByTestId('no-doc-tabs')).toHaveTextContent('No document open')
  })
})
