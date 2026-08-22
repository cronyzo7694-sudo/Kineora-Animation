import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

/**
 * H12 — UI → ENGINE CONNECTION MATRIX (wiring proof).
 * Every SYS-02 File control: CONTROL → COMMAND → TARGET → STATE → EVENT.
 * No orphan control, no command without consumer, no event without
 * producer/consumer (H12 §5). Plus the adversarial multi-doc stress cases
 * (directive §11): rapid Open already-open, close-inactive targeting.
 */

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
    setDocTitle: (id: number, title: string) => {
      const d = state.docs.find((x) => x.id === id)
      if (!d) return false
      d.title = title
      return true
    },
    setDocModifiedAt: vi.fn(() => true),
    markClean: () => true,
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
import { openDocument, __resetDocPathsForTests } from './file'
import { DocumentTabs } from './components/DocumentTabs'
import { platform } from './platform'

const SETTINGS = { platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px' }
const flush = () => new Promise((r) => setTimeout(r, 0))

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
function newDoc() {
  getCommand('file.new')!.run(ctx(), SETTINGS)
  return fake.activeDocId()
}
function capture(...names: string[]) {
  const events: Array<{ name: string; change?: string; docId?: number }> = []
  const offs = names.map((n) =>
    bus.on(n as never, (p: never) => events.push({ name: n, ...(p as object) } as { name: string; change?: string; docId?: number })),
  )
  return { events, stop: () => offs.forEach((o) => o()) }
}

beforeEach(() => {
  fake.state.docs = []
  fake.state.active = 0
  fake.state.nextId = 1
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

describe('H12 §3.3 — handoff controls (SYS-27): no engine call, no dirty, honest feedback', () => {
  it('T-import-stage / T-import-library: file.import(target) → SYS-27 handoff (no dirty, no engine mutation)', () => {
    newDoc()
    const before = fake.state.docs[0]
    const notify = vi.fn()
    getCommand('file.import')!.run(ctx({ notify }), 'stage')
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('SYS-27'))
    getCommand('file.import')!.run(ctx({ notify }), 'library')
    expect(notify).toHaveBeenCalledTimes(2)
    // non-mutating at the SYS-02 layer (the SYS-27 engine will mutate later)
    expect(fake.state.docs[0].dirty).toBe(before.dirty)
  })

  it('T-export: image + sequence → the working dialog; video/gif/movie → SYS-27 handoff; never dirties', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const openExport = vi.fn()
    getCommand('file.export')!.run(ctx({ openExport }), 'image')
    expect(openExport).toHaveBeenCalledTimes(1)
    // SYS-27 slice 1 (INT-AID-003): 'sequence' is now a REAL engine hosted in
    // the export dialog (range UI) — it opens the dialog instead of toasting.
    const openSeq = vi.fn()
    getCommand('file.export')!.run(ctx({ openExport: openSeq }), 'sequence')
    expect(openSeq).toHaveBeenCalledTimes(1)
    const notify = vi.fn()
    for (const f of ['video', 'gif', 'movie']) {
      getCommand('file.export')!.run(ctx({ openExport: vi.fn(), notify }), f)
    }
    expect(notify).toHaveBeenCalledTimes(3)
    expect(fake.state.docs[0].dirty).toBe(true) // export is NON-mUTATING (T-export-no-dirty)
  })

  it('T-publish-settings / T-publish / T-publish-profiles: SYS-27 handoffs, non-mutating', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const notify = vi.fn()
    for (const id of ['file.publishSettings', 'file.publish', 'file.publishProfiles']) {
      getCommand(id)!.run(ctx({ notify }))
    }
    expect(notify).toHaveBeenCalledTimes(3)
    expect(fake.state.docs[0].dirty).toBe(true)
  })
})

describe('H12 §3.4 — tab controls (VIEW/SESSION: no document mutation)', () => {
  it('T-tab-activate: tab.activate(docId) → activeDoc:changed only; no doc mutation', () => {
    const a = newDoc()
    newDoc() // second doc (switch target)
    const snapA = JSON.stringify(fake.state.docs.find((d) => d.id === a))
    const { events, stop } = capture('activeDoc:changed', 'openSet:changed')
    getCommand('tab.activate')!.run(ctx(), a)
    stop()
    expect(fake.activeDocId()).toBe(a)
    expect(events).toEqual([{ name: 'activeDoc:changed', docId: a }])
    expect(JSON.stringify(fake.state.docs.find((d) => d.id === a))).toBe(snapA)
  })

  it('T-tab-close (adversarial: close INACTIVE while another is active)', () => {
    const a = newDoc() // A active
    const b = newDoc()
    getCommand('tab.activate')!.run(ctx(), a)
    const { events, stop } = capture('activeDoc:changed', 'openSet:changed')
    getCommand('tab.close')!.run(ctx({ confirmClose: (p) => p() }), b) // close INACTIVE b
    stop()
    expect(fake.docList().map((d) => d.id)).toEqual([a])
    expect(fake.activeDocId()).toBe(a) // A untouched
    expect(events).toEqual([{ name: 'openSet:changed', change: 'removed', docId: b }]) // no activeDoc
  })
})

describe('H12 §3.5 — dirty indicator re-reads on document:changed', () => {
  it('T-dirty-indicator: document:changed flips the ● (event-driven, no poll)', () => {
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={ctx()} />)
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    fake.state.docs[0].dirty = true
    // the bus drives the re-read (no poll):
    act(() => {
      bus.emit('document:changed', { type: 'draw', targets: [] })
    })
    expect(screen.getByTestId('doc-tab-dirty-1')).toBeInTheDocument()
    fake.state.docs[0].dirty = false
    act(() => {
      bus.emit('document:changed', { type: 'undo', targets: [] })
    })
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    unmount()
  })
})

describe('H12 + directive §11 — adversarial multi-doc stress', () => {
  it('rapid Open of an already-open file: N opens → still ONE document, one tab', async () => {
    vi.mocked(platform.openProject).mockResolvedValue({ name: 'a', path: '/p/a.json', content: '{"settings":{"width":100,"height":100,"fps":24}}' } as never)
    openDocument(vi.fn())
    await flush()
    expect(fake.docList()).toHaveLength(1)
    // open the same path twice more in quick succession
    openDocument(vi.fn())
    openDocument(vi.fn())
    await flush()
    expect(fake.docList()).toHaveLength(1) // one document
    expect(fake.docList()[0].id).toBe(1) // same identity
    expect(fake.state.docs[0].dirty).toBe(false) // session preserved (not reloaded)
  })

  it('rapid tab switching: the active pointer always points at an open doc (no dangling pointer)', () => {
    const a = newDoc()
    const b = newDoc()
    for (const id of [a, b, a, b, b, a]) {
      getCommand('tab.activate')!.run(ctx(), id)
      expect(fake.activeDocId()).toBe(id)
      expect(fake.statusJson()?.doc_id).toBe(id) // the status always matches the pointer
    }
  })

  it('stale reference: a panel that re-reads on activeDoc:changed always sees the CURRENT doc', () => {
    const a = newDoc()
    const b = newDoc()
    let seen = -1
    const off = bus.on('activeDoc:changed', (p) => {
      seen = fake.statusJson()?.doc_id ?? -1 // consumer re-reads (H12 chain)
      expect(seen).toBe(p.docId)
    })
    getCommand('tab.activate')!.run(ctx(), a)
    getCommand('tab.activate')!.run(ctx(), b)
    off()
    expect(seen).toBe(b)
  })
})
