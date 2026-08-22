import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { menus } from './menus'

/**
 * H09 — CANONICAL COMMAND REGISTRY (T-cmd-*).
 * "One semantic action = one commandId = one owner" (H09 §5). Verifies the
 * 17 canonical IDs, the file.close()/tab.close(docId) distinction, invocation
 * equivalence (menu/shortcut/tab → same commandId + input), enable/disable
 * conditions, and the HIDDEN legacy items.
 */

// stateful fake (same wire contract as the other suites)
const fake = vi.hoisted(() => {
  const state = { docs: [] as { id: number; title: string; dirty: boolean }[], active: 0, nextId: 1 }
  const newDoc = (title: string) => {
    const d = { id: state.nextId++, title, dirty: false }
    state.docs.push(d)
    state.active = d.id
    return d
  }
  return {
    state,
    statusJson: () => {
      const d = state.docs.find((x) => x.id === state.active)
      if (!d) return null
      return {
        playhead: 1, selection: [], selection_rects: [], selection_details: [], undo_len: 0, redo_len: 0,
        scene: 'Scene 1', layer: 'Layer 1', layers: [], active_layer: 0, fps: 24, doc_width: 1920,
        doc_height: 1080, background: '#ffffff', duration: 1, clipboard_len: 0, event_log: [],
        doc_id: d.id, doc_title: d.title, dirty: d.dirty, doc_count: state.docs.length,
        docs: state.docs.map((x) => ({ id: x.id, title: x.title, dirty: x.dirty })), units: 'px', platform: 'HTML5 Canvas',
      }
    },
    docList: () => state.docs.map((d) => ({ id: d.id, title: d.title, dirty: d.dirty })),
    activeDocId: () => state.active,
    newDocFull: () => newDoc(`Untitled-${state.nextId}`).id,
    openDocJson: (json: string, title: string) => {
      try { JSON.parse(json) } catch { return 0 }
      return newDoc(title || `Untitled-${state.nextId}`).id
    },
    setActiveDoc: (id: number) => (state.docs.some((d) => d.id === id) ? ((state.active = id), true) : false),
    closeDoc: (id: number) => {
      const i = state.docs.findIndex((d) => d.id === id)
      if (i < 0) return false
      state.docs.splice(i, 1)
      if (!state.docs.length) state.active = 0
      else {
        const b = state.docs.findIndex((d) => d.id === state.active)
        state.active = state.docs[b === -1 ? Math.min(i, state.docs.length - 1) : i < b ? b - 1 : b].id
      }
      return true
    },
    reorderDoc: vi.fn(() => true),
    setDocTitle: () => true,
    setDocModifiedAt: vi.fn(() => true),
    markClean: () => true,
    projectJson: () => '{}',
    getEngineStatus: () => ({ kind: 'ok' as const, detail: 'attached' }),
    getEngine: () => ({}),
  }
})

const platformStub = vi.hoisted(() => ({
  kind: 'desktop' as const,
  isDesktop: () => true,
  openProject: vi.fn(async () => null),
  pickSavePath: vi.fn(async () => null),
  saveProjectAs: vi.fn(async () => 'cancelled' as const),
  writeProject: vi.fn(async () => true),
  readProject: vi.fn(async () => null),
  getShellStatus: vi.fn(async () => null),
  getIdentity: vi.fn(async () => null),
  approveClose: vi.fn(async () => {}),
  onCloseRequested: vi.fn(() => () => {}),
  exit: vi.fn(),
}))

vi.mock('./engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/client')>()
  return {
    ...actual,
    statusJson: () => fake.statusJson(),
    docList: () => fake.docList(),
    activeDocId: () => fake.activeDocId(),
    newDocFull: fake.newDocFull,
    openDocJson: fake.openDocJson,
    setActiveDoc: fake.setActiveDoc,
    closeDoc: fake.closeDoc,
    reorderDoc: fake.reorderDoc,
    setDocTitle: fake.setDocTitle,
    setDocModifiedAt: fake.setDocModifiedAt,
    markClean: fake.markClean,
    projectJson: fake.projectJson,
    getEngineStatus: fake.getEngineStatus,
    getEngine: fake.getEngine,
    loadEngine: async () => ({ kind: 'ok' as const, detail: 'attached' }),
  }
})
vi.mock('./platform', () => ({ platform: platformStub }))
vi.mock('./engine/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine/actions')>()
  return { ...actual, downloadBlob: vi.fn(), stopPlayback: vi.fn() }
})

import App from './App'
import { getCommand, findShortcutInvocation, validateCommands } from './commands'

const CANONICAL_17 = [
  'file.new', 'file.newFromTemplate', 'file.saveAsTemplate',
  'file.open', 'file.openExternalLibrary',
  'file.save', 'file.saveAs',
  'file.close', 'file.closeAll', 'file.exit',
  'file.import', 'file.export',
  'file.publishSettings', 'file.publish', 'file.publishProfiles',
  'tab.activate', 'tab.close',
]

beforeEach(() => {
  fake.state.docs = []
  fake.state.active = 0
  fake.state.nextId = 1
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

describe('H09 §5 — canonical registry (T-cmd-single-id)', () => {
  it('exactly the 17 canonical commandIds exist — no aliases, no duplicates, no removed IDs', () => {
    for (const id of CANONICAL_17) {
      expect(getCommand(id), `missing canonical command ${id}`).toBeDefined()
      expect(getCommand(id)!.status).toBe('FUNCTIONAL')
    }
    // removed/drifted IDs must NOT exist as separate commands (H09 §5)
    for (const gone of ['file.openRecent', 'file.importStage', 'file.importLibrary', 'file.exportVideo', 'file.exportGif', 'file.exportMovie', 'file.exportSequence']) {
      expect(getCommand(gone), `${gone} must not exist (reuses its canonical commandId)`).toBeUndefined()
    }
    // duplicate-id / collision lint clean
    expect(validateCommands().filter((e) => e.includes('duplicate') || e.includes('conflict'))).toEqual([])
  })

  it('T-cmd-close vs T-cmd-tab-close: file.close() closes ACTIVE; tab.close(docId) closes TARGETED (distinct, never merged)', async () => {
    const newDoc = () => getCommand('file.new')!.run(makeCtx(), SETTINGS)
    newDoc() // A (1)
    newDoc() // B (2) active
    // file.close() → the ACTIVE doc (B)
    getCommand('file.close')!.run(makeCtx({ confirmClose: (p: () => void) => p() }))
    expect(fake.docList().map((d) => d.id)).toEqual([1]) // B (active) closed
    // tab.close(docId) → the TARGETED doc even when inactive
    getCommand('file.new')!.run(makeCtx(), SETTINGS) // C (3) active
    getCommand('tab.close')!.run(makeCtx({ confirmClose: (p: () => void) => p() }), 1) // close INACTIVE A
    expect(fake.docList().map((d) => d.id)).toEqual([3]) // A closed, C (active) survives
  })
})

describe('H09 §5/§10 — parameterized commands (file.import(target), file.export(format))', () => {
  it('T-cmd-import: one command, two menu entries + shortcut aliases carry the target', () => {
    const cmd = getCommand('file.import')!
    // menu entries resolve to the SAME commandId with their input (H12 §3.3)
    // the Import submenu has 3 entries; the two import entries are the same
    // commandId with different inputs (Open External Library is SYS-18's)
    const importEntries = importEntriesOf().filter((e) => e.id === 'file.import')
    expect(importEntries.map((e) => e.id)).toEqual(['file.import', 'file.import'])
    expect(importEntries.map((e) => e.input)).toEqual(['stage', 'library'])
    // shortcut aliases carry the input (invocation equivalence)
    expect(findShortcutInvocation({ key: 'r', ctrlKey: true })).toEqual({ cmd, input: 'stage' })
    expect(findShortcutInvocation({ key: 'i', ctrlKey: true })).toEqual({ cmd, input: 'library' })
    // the input selects the handoff target
    const notify = vi.fn()
    cmd.run(makeCtx({ notify }), 'library')
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('to library'))
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('SYS-27'))
  })

  it('T-cmd-export: one command, five formats; Ctrl+Shift+R binds the working image export', () => {
    const cmd = getCommand('file.export')!
    const exportEntries = exportEntriesOf()
    expect(exportEntries.map((e) => e.id)).toEqual(['file.export', 'file.export', 'file.export', 'file.export', 'file.export'])
    expect(exportEntries.map((e) => e.input)).toEqual(['image', 'video', 'gif', 'movie', 'sequence'])
    expect(findShortcutInvocation({ key: 'r', ctrlKey: true, shiftKey: true })).toEqual({ cmd, input: 'image' })
    // image → the working in-app dialog; others → honest SYS-27 handoff
    const openExport = vi.fn()
    const notify = vi.fn()
    cmd.run(makeCtx({ openExport, notify }), 'image')
    expect(openExport).toHaveBeenCalledTimes(1)
    cmd.run(makeCtx({ openExport: vi.fn(), notify }), 'gif')
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('Animated GIF'))
  })
})

describe('H09 §6/§9 — menu mapping + enable/disable', () => {
  function renderApp() {
    return render(<App />)
  }

  it('T-cmd-disabled-no-doc: NO_DOCUMENT → doc-scoped commands disabled with reason; New/Open/Exit enabled', async () => {
    renderApp()
    fireEvent.click(screen.getByTestId('menu.file'))
    // doc-scoped (top level) → disabled-by-context with the honest reason
    for (const id of ['file.close', 'file.closeAll', 'file.save', 'file.saveAs', 'file.saveAsTemplate']) {
      const el = screen.getByTestId(`menu-item-${id}`)
      expect(el).toBeDisabled()
      expect(el).toHaveAttribute('title', expect.stringContaining('no document'))
    }
    // the parameterized Export entry is disabled too (H09 §9)
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Export'))
    expect(screen.getByTestId('menu-item-file.export-image')).toBeDisabled()
    // always enabled
    for (const id of ['file.new', 'file.open', 'file.exit']) {
      expect(screen.getByTestId(`menu-item-${id}`)).toBeEnabled()
    }
  })

  it('T-cmd-hidden-print: AIR Settings / Print / Page Setup are HIDDEN (no command, no trigger)', () => {
    renderApp()
    fireEvent.click(screen.getByTestId('menu.file'))
    expect(screen.queryByText('AIR Settings')).not.toBeInTheDocument()
    expect(screen.queryByText('Print…')).not.toBeInTheDocument()
    expect(screen.queryByText('Page Setup…')).not.toBeInTheDocument()
    expect(getCommand('file.airSettings')).toBeUndefined()
    expect(getCommand('file.print')).toBeUndefined()
    expect(getCommand('file.pageSetup')).toBeUndefined()
  })

  it('T-cmd-open-recent: recent entries reuse file.open (one commandId for Open + Open Recent)', async () => {
    // a recent entry (snapshot) → clicking it runs file.open with the entry
    const { addRecent } = await import('./file')
    addRecent('proj-x', '{"settings":{"width":100,"height":100,"fps":24}}')
    renderApp()
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Open Recent'))
    fireEvent.click(screen.getByTestId('menu-item-recent-proj-x'))
    await new Promise((r) => setTimeout(r, 0))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.docList()[0].title).toBe('proj-x')
  })
})

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    engine: { kind: 'ok' as const, detail: 'attached' },
    notify: vi.fn(),
    setTool: vi.fn(),
    togglePanel: vi.fn(),
    panels: {},
    openExport: vi.fn(),
    openDocumentSettings: vi.fn(),
    openShortcuts: vi.fn(),
    openAbout: vi.fn(),
    openSymbolDialog: vi.fn(),
    openPalette: vi.fn(),
    resetWorkspace: vi.fn(),
    getStatus: () => fake.statusJson(),
    collapsed: {},
    toggleCollapse: vi.fn(),
    activeWorkspace: () => 'Essentials',
    listWorkspaces: () => [],
    saveWorkspace: vi.fn(),
    loadWorkspace: vi.fn(),
    editDepth: () => 0,
    exitEditOne: vi.fn(),
    exitEditRoot: vi.fn(),
    openGoToFrame: vi.fn(),
    confirmClose: (p: () => void) => p(),
    confirmCloseDoc: async (): Promise<'discard'> => 'discard',
    openNewDialog: vi.fn(),
    openTemplateGallery: vi.fn(),
    openSaveTemplate: vi.fn(),
    exitApp: vi.fn(),
    ...overrides,
  } as never
}

const SETTINGS = { platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px' }

// menu-tree helpers (H09 §6: entries → canonical commandId + input)
function entriesOf(submenuLabel: string): { id: string; input?: unknown }[] {
  const file = menus.find((m) => m.id === 'menu.file')!
  const sub = file.items.find((i) => i.type === 'submenu' && i.label === submenuLabel)
  if (sub?.type !== 'submenu') return []
  return sub.items.filter((i): i is { type: 'command'; id: string; input?: unknown } => i.type === 'command')
}
function importEntriesOf() {
  return entriesOf('Import')
}
function exportEntriesOf() {
  return entriesOf('Export')
}
