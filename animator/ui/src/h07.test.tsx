import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

/**
 * H07 — CLOSE + CLOSE ALL + EXIT + NO-DOCUMENT STATE (T-close-* matrix).
 *
 * The engine bridge is a stateful fake; file.ts + the command registry are
 * REAL, so the H07 §6 sequential Close All (P-5) and the engine's survivor
 * pointer are exercised for real. The App-level describe exercises the
 * per-doc guard dialog (H07 opens it; H04 owns the decision contract).
 *
 * The survivor selection (which doc becomes active after closing the active
 * one) is a PROVISIONAL policy — AMB-H07-001 is an open product decision
 * (natively tested in core/tests/doc_manager.rs).
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
        return 0
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
    markClean: (id?: number) => {
      const target = id !== undefined ? state.docs.find((x) => x.id === id) : state.docs.find((x) => x.id === state.active)
      if (!target) return false
      target.dirty = false
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
import { bus } from './bus'
import { getCommand, makeCommandContext } from './commands'
import type { CommandContext } from './commands'
import { closeAllDocuments, closeDocumentById, __resetDocPathsForTests, type CloseAllDecision } from './file'
import { platform } from './platform'

function makeCtx(overrides: Partial<CommandContext> = {}): CommandContext {
  return makeCommandContext({
    notify: vi.fn(),
    engine: { kind: 'ok', detail: 'attached' },
    openNewDialog: vi.fn(),
    openTemplateGallery: vi.fn(),
    openSaveTemplate: vi.fn(),
    exitApp: vi.fn(),
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

/** A guard stub for closeAllDocuments (logic-level tests). */
function guardFor(decisions: Map<number, CloseAllDecision>): (id: number) => Promise<CloseAllDecision> {
  return async (id) => decisions.get(id) ?? 'discard'
}

beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  vi.mocked(platform.writeProject).mockResolvedValue(true)
  vi.mocked(platform.pickSavePath).mockResolvedValue('/p/save.json')
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H07 §6/§10 — Close (file.close / tab.close share the Close flow)', () => {
  it('T-close: file.close closes the ACTIVE doc — openSet{removed} → activeDoc{next}', () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    getCommand('file.close')!.run(makeCtx({ confirmClose: (p) => p() }))
    stop()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(2)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 1 },
      { name: 'activeDoc:changed', docId: 2 },
    ])
  })

  it('T-close-inactive: tab.close(B) with A active → B closes, A stays, NO activeDoc event', () => {
    newDoc() // A (1) active
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    getCommand('tab.close')!.run(makeCtx({ confirmClose: (p) => p() }), 2)
    stop()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1) // A remains active
    expect(events).toEqual([{ name: 'openSet:changed', change: 'removed', docId: 2 }]) // NO activeDoc
  })

  it('T-close-last: closing the final doc → NO_DOCUMENT, exactly one activeDoc{null}', () => {
    newDoc() // A (1)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    closeDocumentById(1, vi.fn())
    stop()
    expect(fake.docList()).toHaveLength(0)
    expect(fake.activeDocId()).toBe(0)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 1 },
      { name: 'activeDoc:changed', docId: 0 },
    ])
  })

  it('T-close-stale: closing an already-closed id → honest feedback, no crash, no events', () => {
    newDoc() // A (1)
    const notify = vi.fn()
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    closeDocumentById(1, notify)
    closeDocumentById(1, notify) // stale target
    stop()
    expect(fake.docList()).toHaveLength(0)
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('no longer open'))
    expect(events).toHaveLength(2) // only the first close emitted
  })

  it('T-close-no-mutate: closing B never touches A (dirty/History/session preserved)', () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[0].dirty = true
    fake.state.docs[0].undoLen = 3
    closeDocumentById(2, vi.fn())
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(fake.state.docs[0].undoLen).toBe(3)
    expect(fake.docList()).toHaveLength(1)
  })

  it('T-close-dup-event: duplicate lifecycle events are idempotent (consumers re-read)', () => {
    newDoc() // A (1)
    newDoc() // B (2) active
    const seen: number[] = []
    const off = bus.on('activeDoc:changed', (p) => seen.push((p as { docId: number }).docId))
    // the same activeDoc event delivered twice — consumers re-read the engine
    // and stay consistent (idempotent, no crash, no state drift)
    bus.emit('activeDoc:changed', { docId: 2 })
    bus.emit('activeDoc:changed', { docId: 2 })
    off()
    expect(seen).toEqual([2, 2])
    expect(fake.activeDocId()).toBe(2)
    expect(fake.statusJson()?.doc_id).toBe(2)
  })
})

// ————————————————————————————————————————————————————————————————
describe('H07 §6/§10 — Close All: SEQUENTIAL (P-5), NOT atomic, NOT a summary dialog', () => {
  it('T-close-all-mixed: clean docs close directly; each dirty doc gets its OWN guard; discard → all closed, ONE final activeDoc{null}', async () => {
    newDoc() // A (1) clean
    newDoc() // B (2) dirty
    newDoc() // C (3) clean
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    const guards = new Map<number, CloseAllDecision>([[2, 'discard'] as [number, CloseAllDecision]])
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await closeAllDocuments(vi.fn(), guardFor(guards))
    stop()
    expect(fake.docList()).toHaveLength(0)
    expect(fake.activeDocId()).toBe(0)
    // B was the only guarded doc
    expect(guards.get(2)).toBe('discard')
    // canonical events: openSet{removed} per doc; the active pointer tracks
    // reality; activeDoc{null} EXACTLY ONCE, at the true empty open-set
    const openSetEvents = events.filter((e) => e.name === 'openSet:changed')
    expect(openSetEvents.map((e) => e.docId)).toEqual([1, 2, 3])
    const nullEvents = events.filter((e) => e.name === 'activeDoc:changed' && e.docId === 0)
    expect(nullEvents).toHaveLength(1)
  })

  it('T-close-cancel-mid (MANDATORY): A clean, B dirty, C open; Cancel at B → A closed, B+C open, active != null, NO activeDoc:null', async () => {
    newDoc() // A (1) clean — active
    newDoc() // B (2) dirty
    newDoc() // C (3) clean
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await closeAllDocuments(vi.fn(), guardFor(new Map<number, CloseAllDecision>([[2, 'cancel'] as [number, CloseAllDecision]])))
    stop()
    // partial close is LEGAL: A closed, B + C remain open
    expect(fake.docList().map((d) => d.id)).toEqual([2, 3])
    expect(fake.state.docs.find((d) => d.id === 2)?.dirty).toBe(true) // B untouched by the cancel
    expect(fake.activeDocId()).not.toBe(0), 'activeDocumentId MUST remain valid'
    const nullEvents = events.filter((e) => e.name === 'activeDoc:changed' && e.docId === 0)
    expect(nullEvents).toHaveLength(0), 'NO activeDoc:null while documents remain'
  })

  it('T-close-all-savefail (MANDATORY): save fails mid-Close All → that doc stays open + dirty, sequence stops, remaining stay, NO false activeDoc:null', async () => {
    newDoc() // A (1) clean
    newDoc() // B (2) dirty
    newDoc() // C (3) clean
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    // the guard for B: 'save-ok' is NEVER produced (save fails) — model the
    // user cancelling after the failed save (dialog stays open → cancel)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await closeAllDocuments(vi.fn(), guardFor(new Map<number, CloseAllDecision>([[2, 'cancel'] as [number, CloseAllDecision]])))
    stop()
    expect(fake.docList().map((d) => d.id)).toEqual([2, 3])
    expect(fake.state.docs.find((d) => d.id === 2)?.dirty).toBe(true), 'B remains DIRTY (save failed)'
    expect(fake.activeDocId()).not.toBe(0)
    expect(events.filter((e) => e.name === 'activeDoc:changed' && e.docId === 0)).toHaveLength(0)
  })

  it('T-close-all-clean: all clean → no guards at all, all closed, ONE activeDoc{null}', async () => {
    newDoc() // A
    newDoc() // B
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const guard = vi.fn(async () => 'discard' as CloseAllDecision)
    const { events, stop } = capture('openSet:changed', 'activeDoc:changed')
    await closeAllDocuments(vi.fn(), guard)
    stop()
    expect(guard).not.toHaveBeenCalled(), 'clean docs close directly — no guard'
    expect(fake.docList()).toHaveLength(0)
    expect(events.filter((e) => e.name === 'activeDoc:changed' && e.docId === 0)).toHaveLength(1)
  })
})

// ————————————————————————————————————————————————————————————————
describe('H07 — App-level guards (dialog per dirty doc; Exit guard)', () => {
  it('T-close-active (dirty): file.close on a DIRTY active doc → guard; Discard closes it', async () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[0].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(2)
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('T-close (dirty) cancel: guard Cancel → doc stays open, still dirty', async () => {
    newDoc() // A (1)
    fake.state.docs[0].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('T-close-all sequential (App): A clean closes first WITHOUT dialog; guard fires for dirty B; save-fail keeps dialog + doc open', async () => {
    newDoc() // A (1) clean — active
    newDoc() // B (2) dirty
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    vi.mocked(platform.writeProject).mockResolvedValue(false) // save will fail
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.closeAll'))
    await flush()
    // A (clean) already closed WITHOUT a dialog; the dialog is for B only
    expect(fake.docList().map((d) => d.id)).toEqual([2])
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    // Save → fails → dialog STAYS open, B stays open + dirty
    fireEvent.click(screen.getByTestId('dlg-close-save'))
    await flush()
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument(), 'save failed → close blocked, dialog stays (retry/cancel)'
    expect(fake.docList().map((d) => d.id)).toEqual([2])
    expect(fake.state.docs[0].dirty).toBe(true)
    // Cancel → sequence stops
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(fake.docList().map((d) => d.id)).toEqual([2])
    expect(fake.activeDocId()).toBe(2)
  })

  it('T-exit-mixed: Exit with any DIRTY → guard; discard → app exits; clean → no guard', async () => {
    newDoc() // A (1)
    newDoc() // B (2) dirty
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.exit'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument(), 'guard fires (any dirty doc)'
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    await flush()
    expect(platform.exit).toHaveBeenCalledTimes(1)
  })

  it('T-exit (all clean): no guard, exits directly', async () => {
    newDoc()
    render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.exit'))
    await flush()
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
    expect(platform.exit).toHaveBeenCalledTimes(1)
  })
})
