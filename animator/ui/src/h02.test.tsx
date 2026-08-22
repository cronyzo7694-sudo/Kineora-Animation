import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

// ============================================================================
// H02 — MULTI-DOCUMENT + TABS + ACTIVE DOCUMENT (T-tab-* suite).
//
// The fake engine below is a STATEFUL model of the real DocManager wire
// contract (push appends + activates; close → successor; set_active false on
// unknown id; reorder keeps the active document). It lets the tests exercise
// real UI behavior end-to-end: user action → command → client → engine state
// → bus event → UI result. The engine's deeper invariants (per-doc History/
// selection/playhead, id uniqueness, index mechanics of reorder) are
// natively proven in core/tests/doc_manager.rs (h02_* tests).
//
// NOTE: vitest matchers take no custom message argument — expectations are
// self-documenting via test names.
// ============================================================================

const fake = vi.hoisted(() => {
  interface FakeDoc {
    id: number
    title: string
    dirty: boolean
    selection: number[]
    playhead: number
    undoLen: number
  }
  const state = {
    docs: [] as FakeDoc[],
    active: 0,
    nextId: 1,
    opens: 0,
  }
  const reset = () => {
    state.docs = []
    state.active = 0
    state.nextId = 1
    state.opens = 0
  }
  const newDoc = (title: string): FakeDoc => {
    const d: FakeDoc = { id: state.nextId++, title, dirty: false, selection: [], playhead: 1, undoLen: 0 }
    state.docs.push(d)
    state.active = d.id
    return d
  }
  const statusJson = () => {
    const d = state.docs.find((x) => x.id === state.active)
    if (!d) return null
    return {
      playhead: d.playhead,
      selection: d.selection,
      selection_rects: [],
      selection_details: [],
      undo_len: d.undoLen,
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
  // Mirrors DocManager::close — successor (right neighbour) becomes active.
  const closeDoc = (id: number) => {
    const idx = state.docs.findIndex((d) => d.id === id)
    if (idx < 0) return false
    state.docs.splice(idx, 1)
    if (state.docs.length === 0) {
      state.active = 0
    } else {
      const before = state.docs.findIndex((d) => d.id === state.active)
      const actIdx =
        before === -1
          ? Math.min(idx, state.docs.length - 1)
          : idx < before
            ? before - 1
            : Math.min(before, state.docs.length - 1)
      state.active = state.docs[actIdx].id
    }
    return true
  }
  // Mirrors DocManager::reorder — the ACTIVE DOCUMENT is never changed.
  // (The fake's active pointer is an ID, so a reorder never touches it; the
  //  index-adjustment mechanics are proven natively in the h02_reorder_*
  //  tests in core/tests/doc_manager.rs.)
  const reorderDoc = (id: number, toIndex: number) => {
    const len = state.docs.length
    if (len === 0) return false
    const from = state.docs.findIndex((d) => d.id === id)
    if (from < 0) return false
    const to = Math.min(toIndex, len - 1)
    if (from === to) return true
    const doc = state.docs.splice(from, 1)[0]
    state.docs.splice(to, 0, doc)
    return true
  }
  return {
    state,
    reset,
    statusJson,
    docList: () => state.docs.map((d) => ({ id: d.id, title: d.title, dirty: d.dirty })),
    activeDocId: () => state.active,
    newDocFull: () => newDoc(`Untitled-${state.nextId}`).id,
    openDocJson: (_json: string, title: string) => {
      state.opens++
      return newDoc(title || `Untitled-${state.nextId}`).id
    },
    setActiveDoc: (id: number) => {
      if (!state.docs.some((d) => d.id === id)) return false
      state.active = id
      return true
    },
    closeDoc,
    reorderDoc,
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
      return true
    },
    projectJson: () => '{"settings":{"width":1920,"height":1080,"fps":24,"background":"#ffffff","units":"px","platform":"HTML5 Canvas"}}',
    loadProjectJson: () => {
      state.opens++
      return true
    },
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
    loadProjectJson: fake.loadProjectJson,
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
import { getCommand, makeCommandContext, validateCommands, commands } from './commands'
import type { CommandContext } from './commands'
import { openDocument, docPath, __resetDocPathsForTests, type NewDocSettings } from './file'
import { DocumentTabs } from './components/DocumentTabs'
import { platform } from './platform'

const SETTINGS: NewDocSettings = {
  platform: 'HTML5 Canvas',
  width: 1280,
  height: 720,
  fps: 30,
  background: '#ffffff',
  backgroundAlpha: 1,
  units: 'px',
}
const PROJ_JSON = '{"settings":{"width":960,"height":540,"fps":24,"background":"#ffffff","units":"px","platform":"HTML5 Canvas"}}'

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
  getCommand('file.new')!.run(makeCtx(), SETTINGS)
  return fake.activeDocId()
}

interface CapEvent {
  name: 'openSet:changed' | 'activeDoc:changed'
  change?: 'added' | 'removed' | 'reordered'
  docId?: number
}
function capture(): { events: CapEvent[]; stop: () => void } {
  const events: CapEvent[] = []
  const offSet = bus.on('openSet:changed', (p) => events.push({ name: 'openSet:changed', change: p.change, docId: p.docId }))
  const offActive = bus.on('activeDoc:changed', (p) => events.push({ name: 'activeDoc:changed', docId: p.docId }))
  return { events, stop: () => { offSet(); offActive() } }
}
const flush = () => new Promise((r) => setTimeout(r, 0))
const openProjectWillReturn = (name: string, path: string) => {
  vi.mocked(platform.openProject).mockResolvedValue({ name, path, content: PROJ_JSON } as never)
}

beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests() // file.ts's session path map (D-AMB-001 dedup state)
  bus.clear()
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H02 — registry (H02 §12, INV-CMD: canonical ids, no aliases)', () => {
  it('tab.activate + tab.close are FUNCTIONAL commands; no other tab.* aliases', () => {
    expect(getCommand('tab.activate')?.status).toBe('FUNCTIONAL')
    expect(getCommand('tab.close')?.status).toBe('FUNCTIONAL')
    expect(commands.filter((c) => c.id.startsWith('tab.'))).toHaveLength(2)
    const errors = validateCommands().filter((e) => e.includes('tab.'))
    expect(errors).toEqual([])
  })
})

describe('H02 — open-set model (T-tab-no-doc / one / two / many)', () => {
  it('T-tab-no-doc: 0 documents → honest no-document strip', () => {
    render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('no-doc-tabs')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tabs')).not.toBeInTheDocument()
  })

  it('T-tab-one: 1 document → one tab, active, tablist semantics', () => {
    newDoc()
    render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tabs')).toHaveAttribute('role', 'tablist')
    const tab = screen.getByTestId('doc-tab-1')
    expect(tab).toHaveAttribute('role', 'tab')
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveAttribute('tabindex', '0')
  })

  it('T-tab-two: 2 documents → 2 tabs, exactly one active', () => {
    newDoc()
    newDoc()
    render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-1')).toBeInTheDocument()
    expect(screen.getByTestId('doc-tab-2')).toBeInTheDocument()
    expect(document.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1)
  })

  it('T-tab-many: 4 documents → 4 tabs, exactly one active', () => {
    for (let i = 0; i < 4; i++) newDoc()
    render(<DocumentTabs ctx={makeCtx()} />)
    for (const id of [1, 2, 3, 4]) expect(screen.getByTestId(`doc-tab-${id}`)).toBeInTheDocument()
    expect(document.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1)
  })
})

describe('H02 — New (ST1: openSet:changed{added} FIRST → activeDoc:changed)', () => {
  it('T-tab-new-empty: New at 0 docs → events in locked order, new doc active', () => {
    const { events, stop } = capture()
    getCommand('file.new')!.run(makeCtx(), SETTINGS)
    stop()
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'added', docId: 1 },
      { name: 'activeDoc:changed', docId: 1 },
    ])
    expect(fake.activeDocId()).toBe(1)
    expect(fake.docList()).toHaveLength(1)
  })

  it('T-tab-new-many: New at N docs → N+1 tabs, new doc active, old docs preserved', () => {
    newDoc()
    newDoc()
    const { events, stop } = capture()
    getCommand('file.new')!.run(makeCtx(), SETTINGS)
    stop()
    expect(fake.docList()).toHaveLength(3)
    expect(fake.activeDocId()).toBe(3)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'added', docId: 3 },
      { name: 'activeDoc:changed', docId: 3 },
    ])
  })
})

describe('H02 — Open (ST2: ADD, never replace · ST2b: duplicate-open)', () => {
  it('T-tab-open-clean: Open ADDS a document; the old document stays open', async () => {
    newDoc() // A (id 1)
    openProjectWillReturn('proj', '/p/proj.json')
    const { events, stop } = capture()
    openDocument(vi.fn())
    await flush()
    stop()
    expect(fake.docList()).toHaveLength(2)
    expect(fake.activeDocId()).toBe(2)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'added', docId: 2 },
      { name: 'activeDoc:changed', docId: 2 },
    ])
    // path recorded in the SYS-02 session map (D-AMB-001 dup-open detection)
    expect(docPath(2)).toBe('/p/proj.json')
  })

  it('T-tab-open-dirty: Open alongside a DIRTY active → NO guard (F-4/FL-0032); A preserved', async () => {
    newDoc() // A (id 1)
    fake.state.docs[0].dirty = true
    openProjectWillReturn('dirty', '/p/dirty.json')
    const { events, stop } = capture()
    getCommand('file.open')!.run(makeCtx())
    await flush()
    stop()
    // FINAL RECONCILIATION F-4: no dirty guard on Open — the dirty active
    // doc is preserved as INACTIVE (no data loss in the multi-doc model).
    expect(fake.docList()).toHaveLength(2)
    expect(fake.activeDocId()).toBe(2)
    expect(fake.state.docs[0].dirty).toBe(true) // A stays dirty + open
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'added', docId: 2 },
      { name: 'activeDoc:changed', docId: 2 },
    ])
  })

  it('T-tab-open-already-open: same path → activate existing, NO reload, NO second tab', async () => {
    newDoc() // A (id 1)
    openProjectWillReturn('a', '/p/a.json')
    openDocument(vi.fn())
    await flush() // B (id 2) now open, path recorded
    expect(fake.docList()).toHaveLength(2)
    getCommand('tab.activate')!.run(makeCtx(), 1) // switch back to A
    expect(fake.activeDocId()).toBe(1)

    const { events, stop } = capture()
    openProjectWillReturn('a', '/p/a.json') // SAME path again
    openDocument(vi.fn())
    await flush()
    stop()
    expect(fake.docList()).toHaveLength(2)
    expect(fake.state.opens).toBe(1)
    expect(fake.activeDocId()).toBe(2)
    // ST2b: activeDoc only, never openSet
    expect(events).toEqual([{ name: 'activeDoc:changed', docId: 2 }])
  })

  it('T-tab-open-already-open: Open A, Open A again → exactly one A tab', async () => {
    openProjectWillReturn('b', '/p/b.json')
    openDocument(vi.fn())
    await flush()
    openProjectWillReturn('b', '/p/b.json')
    openDocument(vi.fn())
    await flush()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.state.opens).toBe(1)
  })
})

describe('H02 — activation (ST3, edge 11/12/20/21/22/23)', () => {
  it('T-tab-activate: left-click on tab B activates B (stable id; activeDoc:changed only)', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    fireEvent.click(screen.getByTestId('doc-tab-2'))
    stop()
    unmount()
    expect(fake.activeDocId()).toBe(2)
    expect(events).toEqual([{ name: 'activeDoc:changed', docId: 2 }])
  })

  it('T-tab-activate-self: clicking the active tab is an idempotent no-op', () => {
    newDoc()
    const notify = vi.fn()
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx({ notify })} />)
    fireEvent.click(screen.getByTestId('doc-tab-1'))
    stop()
    unmount()
    expect(fake.activeDocId()).toBe(1)
    expect(events).toEqual([])
    expect(notify).not.toHaveBeenCalled()
  })

  it('T-tab-switch-aba: A→B→A restores A exactly (two events, per-doc sessions untouched)', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[0].undoLen = 3
    const { events, stop } = capture()
    getCommand('tab.activate')!.run(makeCtx(), 2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    stop()
    expect(events.map((e) => e.docId)).toEqual([2, 1])
    expect(fake.activeDocId()).toBe(1)
    expect(fake.state.docs[0].undoLen).toBe(3)
  })

  it('T-tab-rapid: rapid A→B→A→B → clean final state, one event per switch', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture()
    for (const id of [2, 1, 2, 1, 2]) getCommand('tab.activate')!.run(makeCtx(), id)
    stop()
    expect(events).toHaveLength(5)
    expect(fake.activeDocId()).toBe(2)
    expect(fake.docList()).toHaveLength(2)
    expect(fake.statusJson()?.doc_id).toBe(2)
  })

  it('T-tab-stale-ref: on activeDoc:changed, consumers re-read the NEW document (never a stale ref)', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    let seenDocId: number | null = null
    const off = bus.on('activeDoc:changed', (p) => {
      // The exact consumer pattern App/panels use: re-read the engine on event.
      seenDocId = fake.statusJson()?.doc_id ?? null
      expect(seenDocId).toBe(p.docId)
    })
    getCommand('tab.activate')!.run(makeCtx(), 2)
    off()
    expect(seenDocId).toBe(2)
  })

  it('T-tab-event / T-tab-event-dup: activeDoc:changed consumers are idempotent', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    let renders = 0
    const off = bus.on('activeDoc:changed', () => {
      renders++
      expect(fake.statusJson()?.doc_id).toBe(2)
    })
    getCommand('tab.activate')!.run(makeCtx(), 2) // real switch → first delivery
    bus.emit('activeDoc:changed', { docId: 2 }) // duplicate delivery — idempotent
    off()
    expect(renders).toBe(2)
    expect(fake.statusJson()?.doc_id).toBe(2)
  })
})

describe('H02 — close targeting (P0: target = the clicked document, always)', () => {
  it('T-tab-close-active: × on the ACTIVE tab closes it; successor becomes active', () => {
    newDoc() // A (id 1)
    newDoc() // B (id 2) active
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 2 },
      { name: 'activeDoc:changed', docId: 1 },
    ])
  })

  it('T-tab-close-inactive: × on INACTIVE tab B closes B; A REMAINS active (no activeDoc event)', () => {
    // THE P0 bug scenario: A active, B inactive → click B's ×.
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    expect(fake.activeDocId()).toBe(1)
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    // ST5: openSet only — the active document was never touched
    expect(events).toEqual([{ name: 'openSet:changed', change: 'removed', docId: 2 }])
  })

  it('T-tab-close-last: closing the last document → NO_DOCUMENT (activeDoc:changed{null})', () => {
    newDoc()
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    fireEvent.click(screen.getByTestId('doc-tab-close-1'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(0)
    expect(fake.activeDocId()).toBe(0)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 1 },
      { name: 'activeDoc:changed', docId: 0 },
    ])
  })

  it('T-tab-close: a DIRTY inactive tab triggers the guard targeting THAT doc (App-level)', () => {
    // A active + CLEAN, B inactive + DIRTY. If the guard still targeted the
    // active-by-inference, no dialog would appear (A is clean). The dialog
    // appearing proves the guard targets B — the clicked document.
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('doc-tab-close-2'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
  })
})

describe('H02 — reorder (ST7: openSet{reordered} only; active unchanged)', () => {
  it('T-tab-reorder: drag tab C onto tab A reorders the open-set; active doc unchanged', () => {
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    newDoc() // C (id 3)
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active
    fake.state.docs[0].undoLen = 2
    fake.state.docs[0].dirty = true
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    const dt = { setData: vi.fn(), getData: vi.fn(() => '3'), effectAllowed: '', dropEffect: '' } as never
    fireEvent.dragStart(screen.getByTestId('doc-tab-3'), { dataTransfer: dt })
    fireEvent.dragOver(screen.getByTestId('doc-tab-1'), { dataTransfer: dt })
    fireEvent.drop(screen.getByTestId('doc-tab-1'), { dataTransfer: dt })
    stop()
    unmount()
    expect(fake.docList().map((d) => d.id)).toEqual([3, 1, 2])
    expect(fake.activeDocId()).toBe(1)
    expect(events).toEqual([{ name: 'openSet:changed', change: 'reordered', docId: 3 }])
    const a = fake.state.docs.find((d) => d.id === 1)!
    expect(a.undoLen).toBe(2)
    expect(a.dirty).toBe(true)
  })

  it('T-tab-openset-dup: duplicate openSet:changed → strip stays consistent (idempotent)', () => {
    newDoc()
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    bus.emit('openSet:changed', { change: 'reordered', docId: 2 })
    bus.emit('openSet:changed', { change: 'reordered', docId: 2 })
    expect(screen.getByTestId('doc-tab-1')).toBeInTheDocument()
    expect(screen.getByTestId('doc-tab-2')).toBeInTheDocument()
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(2)
    unmount()
  })
})

describe('H02 — openSet-only changes never rebind document panels', () => {
  it('T-tab-openset-event: close-inactive fires openSet WITHOUT any activeDoc event', () => {
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    newDoc() // C (id 3)
    getCommand('tab.activate')!.run(makeCtx(), 2) // B active
    const { events, stop } = capture()
    getCommand('tab.close')!.run(makeCtx(), 3) // close INACTIVE C
    stop()
    expect(events).toEqual([{ name: 'openSet:changed', change: 'removed', docId: 3 }])
    expect(fake.activeDocId()).toBe(2)
  })
})

describe('H02 — document-bound rebind matrix (H02 §11)', () => {
  it('T-tab-library-rebind / timeline / properties: on activeDoc:changed the engine re-reads return the NEW doc', () => {
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[0].playhead = 7
    fake.state.docs[0].selection = [10, 11]
    fake.state.docs[0].undoLen = 4
    fake.state.docs[1].playhead = 1
    fake.state.docs[1].selection = []
    fake.state.docs[1].undoLen = 0
    let rebindSeen: { docId: number; playhead: number; selection: number[]; undoLen: number } | null = null
    const off = bus.on('activeDoc:changed', (p) => {
      const st = fake.statusJson()!
      rebindSeen = { docId: p.docId, playhead: st.playhead, selection: st.selection, undoLen: st.undo_len }
    })
    getCommand('tab.activate')!.run(makeCtx(), 2)
    off()
    // re-read = B (timeline/properties/library state of the NEW active doc)
    expect(rebindSeen).toEqual({ docId: 2, playhead: 1, selection: [], undoLen: 0 })
    // and back: A restored exactly (T-tab-selection-per-doc / playhead / undo)
    const off2 = bus.on('activeDoc:changed', () => {
      const st = fake.statusJson()!
      expect(st.playhead).toBe(7)
      expect(st.selection).toEqual([10, 11])
      expect(st.undo_len).toBe(4)
    })
    getCommand('tab.activate')!.run(makeCtx(), 1)
    off2()
  })

  it('T-tab-dirty-per-doc: the ● follows each document, never the active pointer', () => {
    newDoc() // A (id 1)
    newDoc() // B (id 2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[0].dirty = true // A dirty
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-2')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('doc-tab-2')) // switch to B
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-dirty-2')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('doc-tab-1'))
    expect(fake.state.docs[0].dirty).toBe(true)
    unmount()
  })
})

describe('H02 — accessibility (H02 §19, D-AMB-003)', () => {
  it('T-tab-focus: clicking tab B → B activates AND receives focus', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    const tabB = screen.getByTestId('doc-tab-2')
    fireEvent.click(tabB)
    expect(fake.activeDocId()).toBe(2)
    expect(document.activeElement).toBe(tabB)
    unmount()
  })

  it('T-tab-focus: keyboard Enter activates the focused tab; Space on active = no-op', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    const tabB = screen.getByTestId('doc-tab-2')
    tabB.focus()
    fireEvent.keyDown(tabB, { key: 'Enter' })
    expect(fake.activeDocId()).toBe(2)
    fireEvent.keyDown(tabB, { key: ' ' })
    expect(fake.activeDocId()).toBe(2)
    unmount()
  })

  it('tab naming = title + dirty (aria-label) and role/tablist present', () => {
    newDoc()
    newDoc()
    fake.state.docs[1].dirty = true
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tabs')).toHaveAttribute('role', 'tablist')
    expect(screen.getByTestId('doc-tab-2')).toHaveAttribute('aria-label', 'Untitled-2 — unsaved')
    expect(screen.getByTestId('doc-tab-1')).toHaveAttribute('aria-label', 'Untitled-1')
    unmount()
  })
})

describe('H02 — edge cases', () => {
  it('T-tab-dup-title: two documents with the same title → two distinct tabs', () => {
    newDoc()
    newDoc()
    fake.setDocTitle(2, 'Scene')
    fake.setDocTitle(1, 'Scene')
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-1')).toHaveTextContent('Scene')
    expect(screen.getByTestId('doc-tab-2')).toHaveTextContent('Scene')
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(2)
    unmount()
  })

  it('T-tab-switch-fail: activating an unavailable document → honest feedback, stay put, no event', () => {
    newDoc()
    const notify = vi.fn()
    const { events, stop } = capture()
    getCommand('tab.activate')!.run(makeCtx({ notify }), 99)
    stop()
    expect(notify).toHaveBeenCalledWith('switch failed: document 99 is not available')
    expect(fake.activeDocId()).toBe(1)
    expect(events).toEqual([])
  })

  it('T-tab-dup-id: the UI surfaces exactly the engine ids (no invented tab identity)', () => {
    // ids come from the engine; the UI can never mint one. The native test
    // h02_document_ids_are_never_duplicated_in_the_open_set proves the
    // open-set invariant; here we assert the strip maps 1:1 to engine ids.
    newDoc()
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
    expect(tabs.map((t) => t.getAttribute('data-testid'))).toEqual(['doc-tab-1', 'doc-tab-2'])
    unmount()
  })
})
