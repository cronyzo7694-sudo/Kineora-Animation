import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * H06 — OPEN + OPEN RECENT (T-open-* matrix).
 *
 * The engine bridge is a stateful fake whose openDocJson VALIDATES the JSON
 * (invalid → 0, like the real engine). file.ts + the command registry are
 * REAL, so the session path map (docPaths / findDocByPath) and the H06 §6
 * flow (already-open → guard → load) are exercised for real.
 *
 * Session-reset (History::new, selection empty, playhead 1) and duplicate-ID
 * impossibility are engine invariants — proven natively in
 * core/tests (from_document_resets_selection_playhead_history,
 * h02_document_ids_are_never_duplicated_in_the_open_set).
 */

const fake = vi.hoisted(() => {
  interface FakeDoc {
    id: number
    title: string
    dirty: boolean
    undoLen: number
  }
  const state = {
    docs: [] as FakeDoc[],
    active: 0,
    nextId: 1,
  }
  const reset = () => {
    state.docs = []
    state.active = 0
    state.nextId = 1
  }
  const newDoc = (title: string): FakeDoc => {
    const d: FakeDoc = { id: state.nextId++, title, dirty: false, undoLen: 0 }
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
  return {
    state,
    reset,
    statusJson,
    docList: () => state.docs.map((d) => ({ id: d.id, title: d.title, dirty: d.dirty })),
    activeDocId: () => state.active,
    newDocFull: () => newDoc(`Untitled-${state.nextId}`).id,
    openDocJson: (json: string, title: string) => {
      try {
        JSON.parse(json)
      } catch {
        return 0 // engine: invalid project data → OPEN_FAILED
      }
      return newDoc(title || `Untitled-${state.nextId}`).id
    },
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
    setDocModifiedAt: vi.fn(() => true),
    markClean: vi.fn(() => true),
    projectJson: () => '{"settings":{"width":1920,"height":1080,"fps":24}}',
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

import { bus } from './bus'
import { getCommand, makeCommandContext } from './commands'
import type { CommandContext } from './commands'
import { openFromRecent, __resetDocPathsForTests, docPath, type RecentEntry } from './file'
import { platform } from './platform'
import { DocumentTabs } from './components/DocumentTabs'
import { menus } from './menus'

const VALID = '{"settings":{"width":1920,"height":1080,"fps":24,"background":"#ffffff","units":"px","platform":"HTML5 Canvas"}}'

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

interface CapEvent {
  name: string
  [k: string]: unknown
}
function capture(...names: string[]): { events: CapEvent[]; stop: () => void } {
  const events: CapEvent[] = []
  const offs = names.map((n) => bus.on(n as never, (p: never) => events.push({ name: n, ...(p as object) } as CapEvent)))
  return { events, stop: () => offs.forEach((off) => off()) }
}
const flush = () => new Promise((r) => setTimeout(r, 0))

function newDoc(): number {
  getCommand('file.new')!.run(makeCtx(), {
    platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
  })
  return fake.activeDocId()
}

function openWillReturn(name: string, path: string, content: string): void {
  vi.mocked(platform.openProject).mockResolvedValue({ name, path, content } as never)
}

/** Open a file through the real file.open command (guard = default proceed). */
async function openViaCommand(): Promise<void> {
  getCommand('file.open')!.run(makeCtx())
  await flush()
}

beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  vi.mocked(platform.openProject).mockResolvedValue(null)
  vi.mocked(platform.readProject).mockResolvedValue(null)
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H06 §13 — Open (interactive)', () => {
  it('T-open-valid + T-open-tab + T-open-event: valid open ADDS a doc, tab+activate, openSet→activeDoc', async () => {
    newDoc() // A (1)
    openWillReturn('v', '/p/v.json', VALID)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await openViaCommand()
    stop()
    expect(fake.docList()).toHaveLength(2)
    expect(fake.activeDocId()).toBe(2)
    expect(docPath(2)).toBe('/p/v.json')
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'added', docId: 2 },
      { name: 'activeDoc:changed', docId: 2 },
    ])
  })

  it('T-open-cancel: cancelled picker → unchanged, no events', async () => {
    newDoc() // A (1)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await openViaCommand() // openProject → null (default mock)
    stop()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    expect(events).toEqual([])
  })

  it('T-open-missing / T-open-corrupt (CASE A): failed load leaves the active doc EXACTLY intact', async () => {
    newDoc() // A (1) — make it dirty with a rich session
    fake.state.docs[0].dirty = true
    fake.state.docs[0].undoLen = 3
    // corrupt file → engine refuses (openDocJson → 0)
    openWillReturn('bad', '/p/bad.json', '{not-json')
    const notify = vi.fn()
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    getCommand('file.open')!.run(makeCtx({ notify }))
    await flush()
    stop()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(fake.state.docs[0].undoLen).toBe(3)
    expect(events).toEqual([])
    expect(notify.mock.calls.some((c) => String(c[0]).includes('open failed'))).toBe(true)
  })

  it('T-open-dirty: active DIRTY → guard first; cancel aborts, proceed opens (H04 handoff)', async () => {
    newDoc() // A (1) dirty
    fake.state.docs[0].dirty = true
    openWillReturn('v', '/p/v.json', VALID)
    // (a) cancel → no load, no change
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    getCommand('file.open')!.run(makeCtx({ confirmClose: vi.fn() as never }))
    await flush()
    stop()
    expect(fake.docList()).toHaveLength(1)
    expect(events).toEqual([])
    expect(platform.openProject).not.toHaveBeenCalled() // guard resolves before the picker
    // (b) proceed (default confirmClose) → the open happens
    getCommand('file.open')!.run(makeCtx())
    await flush()
    expect(fake.docList()).toHaveLength(2)
    expect(fake.activeDocId()).toBe(2)
  })

  it('T-open-already-open (D-AMB-001): same path → activate existing, NO reload, activeDoc only', async () => {
    newDoc() // A (1)
    openWillReturn('a', '/p/a.json', VALID)
    await openViaCommand() // B (2) at /p/a.json
    expect(fake.docList()).toHaveLength(2)
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active again
    // open the SAME path again — it is already represented by doc 2
    openWillReturn('a', '/p/a.json', VALID)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await openViaCommand()
    stop()
    expect(fake.docList()).toHaveLength(2)
    expect(fake.activeDocId()).toBe(2)
    expect(events).toEqual([{ name: 'activeDoc:changed', docId: 2 }]) // activation only — NO openSet, NO reload
  })
})

// ————————————————————————————————————————————————————————————————
describe('H06 §13 — Open Recent (reuses file.open; known entry)', () => {
  function entry(over: Partial<RecentEntry>): RecentEntry {
    return { title: 'r', name: 'r.json', savedAt: Date.now(), ...over }
  }

  it('T-open-recent-valid (snapshot): entry with stored JSON opens without a disk read', async () => {
    await openFromRecent(entry({ title: 'r', json: VALID }), vi.fn())
    expect(fake.docList()).toHaveLength(1)
    expect(platform.readProject).not.toHaveBeenCalled()
  })

  it('T-open-recent-valid (path): entry without JSON reads the native path', async () => {
    vi.mocked(platform.readProject).mockResolvedValue(VALID)
    await openFromRecent(entry({ title: 'r', path: '/p/r.json' }), vi.fn())
    expect(platform.readProject).toHaveBeenCalledWith('/p/r.json')
    expect(fake.docList()).toHaveLength(1)
    expect(docPath(1)).toBe('/p/r.json')
  })

  it('T-open-recent-stale: no JSON, no path → toast + skip, nothing opened', async () => {
    const notify = vi.fn()
    await openFromRecent(entry({ title: 'ghost' }), notify)
    expect(fake.docList()).toHaveLength(0)
    expect(notify.mock.calls.some((c) => String(c[0]).includes('stale or unavailable'))).toBe(true)
  })

  it('T-open-recent-removed: path exists in the entry but the file is gone → toast + skip', async () => {
    vi.mocked(platform.readProject).mockResolvedValue(null)
    const notify = vi.fn()
    await openFromRecent(entry({ title: 'gone', path: '/p/gone.json' }), notify)
    expect(fake.docList()).toHaveLength(0)
    expect(notify.mock.calls.some((c) => String(c[0]).includes('no longer available'))).toBe(true)
  })

  it('T-open-recent-already-open: path already open → activate WITHOUT guard and WITHOUT load', async () => {
    newDoc() // A (1)
    openWillReturn('a', '/p/a.json', VALID)
    await openViaCommand() // B (2) at /p/a.json
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active
    // a recent entry for the already-open path, while the active doc is DIRTY
    fake.state.docs[0].dirty = true
    const confirmClose = vi.fn()
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    getCommand('file.open')!.run(makeCtx({ confirmClose }) as CommandContext, entry({ title: 'a', path: '/p/a.json' }))
    stop()
    expect(fake.activeDocId()).toBe(2)
    expect(confirmClose).not.toHaveBeenCalled(), 'H06 §6 step 1 comes BEFORE the guard'
    expect(events).toEqual([{ name: 'activeDoc:changed', docId: 2 }])
    expect(fake.state.docs[0].dirty).toBe(true)
  })

  it('T-open-dirty (recent): NOT already-open + active DIRTY → guard applies (cancel aborts)', async () => {
    newDoc() // A (1) dirty
    fake.state.docs[0].dirty = true
    const confirmClose = vi.fn()
    getCommand('file.open')!.run(makeCtx({ confirmClose }) as CommandContext, entry({ title: 'n', json: VALID }))
    await flush()
    expect(confirmClose).toHaveBeenCalledTimes(1)
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
  })
})

// ————————————————————————————————————————————————————————————————
describe('H06 §8 — single commandId (file.open reused by Open Recent)', () => {
  it('the registry has file.open and NO separate openRecent command (no drift)', () => {
    expect(getCommand('file.open')).toBeDefined()
    expect(getCommand('file.openRecent')).toBeUndefined()
    // the Open Recent submenu exists and its rows run file.open with the entry
    const fileMenu = menus.find((m) => m.id === 'menu.file')!
    expect(JSON.stringify(fileMenu)).toContain('recentList')
  })

  it('T-open-session-reset + T-open-dup-id: engine invariants (proven natively)', async () => {
    // Session::from_document = History::new, selection empty, playhead 1
    // (core/tests/document_lifecycle.rs from_document_resets_selection_playhead_history);
    // duplicate Document IDs are structurally impossible — the engine mints a
    // fresh id per load (core/tests/doc_manager.rs
    // h02_document_ids_are_never_duplicated_in_the_open_set). AMB-002
    // collision-RECOVERY stays deferred to H10 — NOT falsely closed here.
    // UI-level smoke: two opens mint two distinct tab ids.
    openWillReturn('a', '/p/a.json', VALID)
    await openViaCommand()
    openWillReturn('b', '/p/b.json', VALID)
    await openViaCommand()
    const ids = fake.docList().map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    // strip reflects both tabs, one active
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('doc-tab-1')).toBeInTheDocument()
    expect(screen.getByTestId('doc-tab-2')).toBeInTheDocument()
    expect(document.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1)
    unmount()
  })
})
