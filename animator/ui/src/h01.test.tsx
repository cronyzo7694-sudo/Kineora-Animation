import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

// Mock the engine bridge; H01 is verified at the COMMAND → client → event
// boundary (the real DocManager identity/dirty invariants are natively proven
// in core/tests/doc_manager.rs).
const client = vi.hoisted(() => {
  let nextId = 7
  return {
    statusJson: vi.fn(() => ({
      playhead: 1, selection: [], selection_rects: [], selection_details: [], undo_len: 0, redo_len: 0,
      scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0, fps: 24,
      doc_width: 1920, doc_height: 1080, background: '#ffffff', duration: 1, clipboard_len: 0, event_log: [],
      doc_id: 1, doc_title: 'Untitled-1', dirty: false, doc_count: 1,
      docs: [{ id: 1, title: 'Untitled-1', dirty: false }], units: 'px', platform: 'HTML5 Canvas',
    })),
    getEngineStatus: vi.fn(() => ({ kind: 'ok', detail: 'attached' }) as { kind: 'ok' | 'error'; detail: string }),
    getEngine: vi.fn(() => ({})),
    newDocFull: vi.fn((_s: unknown) => nextId++),
    openDocJson: vi.fn((_json: string, _title: string) => nextId++),
    projectJson: vi.fn(() => '{"settings":{"width":1920.0}}'),
    docList: vi.fn(() => [
      { id: 1, title: 'Untitled-1', dirty: false },
      { id: 2, title: 'scene2', dirty: true },
    ]),
    activeDocId: vi.fn(() => 1),
    closeDoc: vi.fn(() => true),
    reorderDoc: vi.fn(() => true),
    setActiveDoc: vi.fn(() => true),
    setDocTitle: vi.fn(() => true),
    markClean: vi.fn(() => true),
    loadProjectJson: vi.fn(() => true),
  }
})
vi.mock('./engine/client', () => client)
vi.mock('./engine/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/actions')>()
  return { ...actual, downloadBlob: vi.fn(), stopPlayback: vi.fn() }
})

import { getCommand, makeCommandContext } from './commands'
import { bus } from './bus'
import { listTemplates } from './file'
import { DocumentTabs } from './components/DocumentTabs'
import type { CommandContext } from './commands'

const newDocFullMock = vi.mocked(client.newDocFull)
const openDocJsonMock = vi.mocked(client.openDocJson)
const closeDocMock = vi.mocked(client.closeDoc)

function ctx(overrides: Partial<CommandContext> = {}): CommandContext {
  return makeCommandContext({
    notify: vi.fn(),
    engine: { kind: 'ok', detail: 'attached' },
    openNewDialog: vi.fn(),
    openTemplateGallery: vi.fn(),
    openSaveTemplate: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  try {
    localStorage.removeItem('kineora.templates')
  } catch {
    /* ignore */
  }
})

describe('H01 — command registration (INV-CMD-1/3/4, INV-014)', () => {
  it('file.new / file.newFromTemplate / file.saveAsTemplate are FUNCTIONAL with real runs', () => {
    for (const id of ['file.new', 'file.newFromTemplate', 'file.saveAsTemplate']) {
      const cmd = getCommand(id)
      expect(cmd, id).toBeDefined()
      expect(cmd!.status).toBe('FUNCTIONAL')
      expect(typeof cmd!.run).toBe('function')
    }
  })

  it('file.new is bound to Ctrl+N and opens the dialog with no input', () => {
    const cmd = getCommand('file.new')!
    expect(cmd.shortcut).toBe('Ctrl+N')
    const c = ctx()
    cmd.run(c)
    expect(c.openNewDialog).toHaveBeenCalledTimes(1)
    expect(newDocFullMock).not.toHaveBeenCalled()
  })
})

describe('H01 — New document lifecycle (T1 → activeDoc:changed → CLEAN)', () => {
  it('file.new with settings creates the document and emits activeDoc:changed', () => {
    const events: Array<{ docId: number }> = []
    bus.on('activeDoc:changed', (p) => events.push(p))
    const settings = { platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30, background: '#ffffff', units: 'px' }
    getCommand('file.new')!.run(ctx(), settings)

    expect(newDocFullMock).toHaveBeenCalledTimes(1)
    const payload = newDocFullMock.mock.calls[0][0] as unknown as Record<string, unknown>
    expect(payload).toMatchObject({ ...settings, backgroundAlpha: 1 }) // alpha default-fill (H01 §8)
    expect(typeof payload.createdAt).toBe('number') // H01 §7: New stamps meta.createdAt
    expect(events).toEqual([{ docId: 7 }])
    expect(client.markClean).not.toHaveBeenCalled() // New is already CLEAN — no save needed
  })

  it('two New commands produce two distinct document identities', () => {
    const ids: number[] = []
    bus.on('activeDoc:changed', (p) => ids.push(p.docId))
    const settings = { platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', units: 'px' }
    getCommand('file.new')!.run(ctx(), settings)
    getCommand('file.new')!.run(ctx(), settings)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('failed creation (engine detached) reports honestly and emits nothing', () => {
    client.getEngineStatus.mockReturnValueOnce({ kind: 'error', detail: 'x' })
    const notify = vi.fn()
    const events: Array<{ docId: number }> = []
    bus.on('activeDoc:changed', (p) => events.push(p))
    getCommand('file.new')!.run(ctx({ notify, engine: { kind: 'error', detail: 'x' } }), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#fff', units: 'px',
    })
    expect(notify).toHaveBeenCalledWith('new: engine not attached')
    expect(newDocFullMock).not.toHaveBeenCalled()
    expect(events).toEqual([])
  })
})

describe('H01 — templates (independent seed, never the source instance)', () => {
  it('Save-as-Template (command) persists a template', () => {
    const notify = vi.fn()
    getCommand('file.saveAsTemplate')!.run(ctx({ notify }), 'Character Rig')
    expect(listTemplates().map((t) => t.name)).toEqual(['Character Rig'])
    expect(notify.mock.calls.some((c) => String(c[0]).includes('template "Character Rig" saved'))).toBe(true)
  })

  it('New-from-Template (command) seeds a NEW independent document from the stored JSON', () => {
    getCommand('file.saveAsTemplate')!.run(ctx(), 'Banner')
    const events: number[] = []
    bus.on('activeDoc:changed', (p) => events.push(p.docId))

    getCommand('file.newFromTemplate')!.run(ctx(), 'Banner')
    getCommand('file.newFromTemplate')!.run(ctx(), 'Banner')

    expect(openDocJsonMock).toHaveBeenCalledTimes(2)
    // both seeds carry the SAME source content (settings identical), but two
    // DISTINCT document ids — never the same instance
    const j0 = JSON.parse(openDocJsonMock.mock.calls[0][0]) as { settings: unknown; meta: { createdAt: unknown; modifiedAt: unknown; title: unknown; author: unknown } }
    const j1 = JSON.parse(openDocJsonMock.mock.calls[1][0]) as { settings: unknown }
    expect(j0.settings).toEqual(j1.settings)
    // H01 §7 meta ownership: fresh createdAt, cleared modifiedAt/title/author
    expect(typeof j0.meta.createdAt).toBe('number')
    expect(j0.meta.createdAt).toBeGreaterThan(0)
    expect(j0.meta.modifiedAt).toBeNull()
    expect(j0.meta.title).toBeNull()
    expect(j0.meta.author).toBeNull()
    // AMB-H01-003 (provisional = UNTITLED): empty title → engine assigns Untitled-N
    expect(openDocJsonMock.mock.calls[0][1]).toBe('')
    expect(events).toHaveLength(2)
    expect(events[0]).not.toBe(events[1])
  })

  it('New-from-Template with no input opens the gallery', () => {
    const c = ctx()
    getCommand('file.newFromTemplate')!.run(c)
    expect(c.openTemplateGallery).toHaveBeenCalledTimes(1)
    expect(openDocJsonMock).not.toHaveBeenCalled()
  })
})

describe('H01 — destructive safety (H00 §10 INV-DSTR-1/2, INV-013)', () => {
  // H02: DocumentTabs reads the open-set from the engine (single source of
  // truth) — the mocked docList/activeDocId above drive the strip.
  function renderTabs() {
    const c = ctx()
    render(<DocumentTabs ctx={c} />)
    return c
  }

  it('right-clicking a tab does NOT close any document (no destructive action)', () => {
    renderTabs()
    fireEvent.contextMenu(screen.getByTestId('doc-tab-1'))
    fireEvent.contextMenu(screen.getByTestId('doc-tab-2'))
    expect(closeDocMock).not.toHaveBeenCalled()
    // both tabs still present
    expect(screen.getByTestId('doc-tab-1')).toBeInTheDocument()
    expect(screen.getByTestId('doc-tab-2')).toBeInTheDocument()
  })

  it('left-click still activates; the per-tab × still closes (explicit action only)', () => {
    renderTabs()
    fireEvent.click(screen.getByTestId('doc-tab-2'))
    expect(client.setActiveDoc).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByTestId('doc-tab-close-1'))
    expect(closeDocMock).toHaveBeenCalledWith(1)
  })

  it('tab activation emits activeDoc:changed (H00 §12 → document-bound UI rebinds)', () => {
    const events: number[] = []
    bus.on('activeDoc:changed', (p) => events.push(p.docId))
    renderTabs()
    fireEvent.click(screen.getByTestId('doc-tab-2'))
    expect(events).toEqual([2])
  })
})
