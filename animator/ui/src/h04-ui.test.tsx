import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

/**
 * H04 UI contract — dirty indicator (per-document, event-driven, a11y) and
 * the dirty-GUARD decision contract (Save reuses file.save; save-fail keeps
 * DIRTY and blocks the close; Discard is permanent; Cancel is unchanged).
 *
 * The engine bridge is a stateful fake (same wire contract as h02.test.tsx);
 * document:changed is emitted BY THE TESTS (the emission itself is proven
 * against the real client in h04.test.ts) to drive the indicator.
 */

const fake = vi.hoisted(() => {
  interface FakeDoc {
    id: number
    title: string
    dirty: boolean
  }
  const state = {
    docs: [] as FakeDoc[],
    active: 0,
    nextId: 1,
    markCleanCount: 0,
  }
  const reset = () => {
    state.docs = []
    state.active = 0
    state.nextId = 1
    state.markCleanCount = 0
  }
  const newDoc = (title: string): FakeDoc => {
    const d: FakeDoc = { id: state.nextId++, title, dirty: false }
    state.docs.push(d)
    state.active = d.id
    return d
  }
  const statusJson = () => {
    const d = state.docs.find((x) => x.id === state.active)
    if (!d) return null
    return {
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
      doc_id: d.id,
      doc_title: d.title,
      dirty: d.dirty,
      doc_count: state.docs.length,
      docs: state.docs.map((x) => ({ id: x.id, title: x.title, dirty: x.dirty })),
      units: 'px',
      platform: 'HTML5 Canvas',
    }
  }
  return {
    state,
    reset,
    statusJson,
    docList: () => state.docs.map((d) => ({ id: d.id, title: d.title, dirty: d.dirty })),
    activeDocId: () => state.active,
    newDocFull: () => newDoc(`Untitled-${state.nextId}`).id,
    openDocJson: (_json: string, title: string) => newDoc(title || `Untitled-${state.nextId}`).id,
    setActiveDoc: (id: number) => {
      if (!state.docs.some((d) => d.id === id)) return false
      state.active = id
      return true
    },
    closeDoc: (id: number) => {
      const idx = state.docs.findIndex((d) => d.id === id)
      if (idx < 0) return false
      state.docs.splice(idx, 1)
      if (state.docs.length === 0) state.active = 0
      else {
        const before = state.docs.findIndex((d) => d.id === state.active)
        const actIdx = before === -1 ? Math.min(idx, state.docs.length - 1) : idx < before ? before - 1 : Math.min(before, state.docs.length - 1)
        state.active = state.docs[actIdx].id
      }
      return true
    },
    reorderDoc: vi.fn(() => true),
    setDocTitle: (id: number, title: string) => {
      const d = state.docs.find((x) => x.id === id)
      if (!d) return false
      d.title = title
      return true
    },
    markClean: () => {
      const d = state.docs.find((x) => x.id === state.active)
      if (!d) return false
      d.dirty = false
      state.markCleanCount++
      return true
    },
    projectJson: () => '{"settings":{"width":1920,"height":1080,"fps":24}}',
    getEngineStatus: () => ({ kind: 'ok' as const, detail: 'attached' }),
    getEngine: () => ({}),
  }
})

const platformStub = vi.hoisted(() => ({
  kind: 'desktop' as const,
  isDesktop: () => true,
  openProject: vi.fn(),
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
import { bus } from './bus'
import { getCommand, makeCommandContext } from './commands'
import type { CommandContext } from './commands'
import { saveDocument, __resetDocPathsForTests } from './file'
import { DocumentTabs } from './components/DocumentTabs'
import { platform } from './platform'

function makeCtx(overrides: Partial<CommandContext> = {}): CommandContext {
  return makeCommandContext({
    notify: vi.fn(),
    engine: { kind: 'ok', detail: 'attached' },
    openNewDialog: vi.fn(),
    openTemplateGallery: vi.fn(),
    openSaveTemplate: vi.fn(),
    ...overrides,
  })
}

function newDoc(): number {
  getCommand('file.new')!.run(makeCtx(), {
    platform: 'HTML5 Canvas',
    width: 1280,
    height: 720,
    fps: 30,
    background: '#ffffff',
    backgroundAlpha: 1,
    units: 'px',
  })
  return fake.activeDocId()
}

interface CapEvent {
  name: string
  [k: string]: unknown
}
function capture(...names: string[]): { events: CapEvent[]; stop: () => void } {
  const events: CapEvent[] = []
  const offs = names.map((n) =>
    bus.on(n as never, (p: never) => events.push({ name: n, ...(p as object) } as CapEvent)),
  )
  return { events, stop: () => offs.forEach((off) => off()) }
}

beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  vi.mocked(platform.saveProjectAs).mockResolvedValue('cancelled' as never)
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H04 §9/§13 — dirty indicator (per-document, event-driven, a11y)', () => {
  it('T-dirty-new-clean: a new document starts CLEAN (no ●)', () => {
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    unmount()
  })

  it('T-dirty-indicator: document:changed flips the ● immediately (no poll, no activeDoc event)', () => {
    newDoc()
    const { events, stop } = capture('activeDoc:changed', 'document:changed')
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    // the document mutates (h04.test.ts proves the client emits this)
    fake.state.docs[0].dirty = true
    act(() => {
      bus.emit('document:changed', { type: 'draw', targets: [] })
    })
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    // …and clears on a mutation that returns to the snapshot (T6)
    fake.state.docs[0].dirty = false
    act(() => {
      bus.emit('document:changed', { type: 'undo', targets: [] })
    })
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    stop()
    // the indicator update must NOT be driven by (or disguised as) an
    // activeDoc:changed refresh hack — only document:changed fired
    expect(events.filter((e) => e.name === 'activeDoc:changed')).toEqual([])
    expect(events.filter((e) => e.name === 'document:changed')).toHaveLength(2)
    unmount()
  })

  it('T-dirty-indicator-aria: the ● is an aria-live region announcing "unsaved changes"', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    const dot = screen.getByTestId('doc-tab-dirty-1')
    expect(dot).toHaveAttribute('aria-label', 'unsaved changes')
    expect(dot.parentElement).toHaveAttribute('aria-live', 'polite')
    unmount()
  })

  it('T-dirty-tab-aria: the tab name includes the unsaved marker', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-1')).toHaveAttribute('aria-label', 'Untitled-1 — unsaved')
    unmount()
  })

  it('T-dirty-switch: ● follows each DOCUMENT across tab switches (per-doc, no transfer)', () => {
    newDoc() // A (1)
    newDoc() // B (2)
    fake.state.docs[0].dirty = true // A dirty, B clean
    getCommand('tab.activate')!.run(makeCtx(), 2) // switch to B
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-2')).not.toBeInTheDocument()
    getCommand('tab.activate')!.run(makeCtx(), 1) // back to A
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-2')).not.toBeInTheDocument()
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(fake.state.docs[1].dirty).toBe(false)
    unmount()
  })

  it('T-dirty-no-doc: with no document there is no dirty indicator', () => {
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('no-doc-tabs')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    unmount()
  })
})

// ————————————————————————————————————————————————————————————————
describe('H04 §7.1/§12 — saving:changed transitions (T2/T3/T4/T5)', () => {
  it('T-dirty-save-ok: save success → saving{saving} → saving{saved}; dirty clears', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    vi.mocked(platform.saveProjectAs).mockResolvedValue({ name: 'a.json', path: '/p/a.json' } as never)
    const { events, stop } = capture('saving:changed')
    const ok = await saveDocument(vi.fn())
    stop()
    expect(ok).toBe(true)
    expect(events.map((e) => e.state)).toEqual(['saving', 'saved'])
    expect(fake.state.docs[0].dirty).toBe(false)
  })

  it('T-dirty-save-fail: write failure → saving{saving} → saving{error}; dirty PRESERVED', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    vi.mocked(platform.saveProjectAs).mockResolvedValue('failed' as never)
    const notify = vi.fn()
    const { events, stop } = capture('saving:changed')
    const ok = await saveDocument(notify)
    stop()
    expect(ok).toBe(false)
    expect(events.map((e) => e.state)).toEqual(['saving', 'error'])
    expect(fake.state.docs[0].dirty).toBe(true) // stays DIRTY (SAVE_ERROR)
    expect(notify.mock.calls.some((c) => String(c[0]).includes('Save error'))).toBe(true)
  })

  it('T-dirty-save-retry: a retry after failure resolves ok → saved + CLEAN', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    vi.mocked(platform.saveProjectAs)
      .mockResolvedValueOnce('failed' as never)
      .mockResolvedValue({ name: 'a.json', path: '/p/a.json' } as never)
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(vi.fn())).toBe(false)
    expect(await saveDocument(vi.fn())).toBe(true)
    stop()
    expect(events.map((e) => e.state)).toEqual(['saving', 'error', 'saving', 'saved'])
    expect(fake.state.docs[0].dirty).toBe(false)
  })

  it('cancelled save → saving{idle}; document unchanged', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    vi.mocked(platform.saveProjectAs).mockResolvedValue('cancelled' as never)
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(vi.fn())).toBe(false)
    stop()
    expect(events.map((e) => e.state)).toEqual(['saving', 'idle'])
    expect(fake.state.docs[0].dirty).toBe(true)
  })
})

// ————————————————————————————————————————————————————————————————
describe('H04 §8/§9 — dirty GUARD decision contract (Save/Discard/Cancel)', () => {
  it('T-guard-save: Save from the guard → file.save runs → CLEAN → close proceeds', async () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active, B inactive
    fake.state.docs[1].dirty = true
    vi.mocked(platform.saveProjectAs).mockResolvedValue({ name: 'b.json', path: '/p/b.json' } as never)
    render(<App />)
    const { events, stop } = capture('saving:changed')
    fireEvent.click(screen.getByTestId('doc-tab-close-2')) // dirty INACTIVE B
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-save'))
    await new Promise((r) => setTimeout(r, 0))
    stop()
    expect(events.map((e) => e.state)).toEqual(['saving', 'saved'])
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1) // B saved + closed; A remains active
  })

  it('T-guard-save-fail: save fails in the guard → stays DIRTY, close BLOCKED, dialog stays open', async () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    vi.mocked(platform.saveProjectAs).mockResolvedValue('failed' as never)
    render(<App />)
    const { events, stop } = capture('saving:changed')
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-save'))
    await new Promise((r) => setTimeout(r, 0))
    stop()
    expect(events.map((e) => e.state)).toEqual(['saving', 'error'])
    expect(fake.docList()).toHaveLength(2) // close did NOT proceed on a failed save
    expect(fake.state.docs[1].dirty).toBe(true) // stays DIRTY (SAVE_ERROR)
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument() // 
  })

  it('T-guard-discard: Discard from the guard → doc removed (permanent, non-undoable)', async () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('T-guard-cancel: Cancel from the guard → document unchanged, nothing closed', async () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(fake.docList()).toHaveLength(2) // cancel → unchanged: both docs remain open
    expect(fake.activeDocId()).toBe(1)
    expect(fake.state.docs[1].dirty).toBe(true)
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('T-dirty-close-all: Close All with a mixed dirty set guards the dirty doc (per-doc, sequential)', async () => {
    newDoc() // A (1) clean
    newDoc() // B (2) dirty
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.closeAll'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument() // guard fires for the dirty doc
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(fake.docList()).toHaveLength(0) // all closed after the guard resolved
    expect(fake.activeDocId()).toBe(0)
  })

  it('T-dirty-exit: Exit with a dirty document shows the guard; cancel keeps everything', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.exit'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(platform.exit).not.toHaveBeenCalled()
  })
})
