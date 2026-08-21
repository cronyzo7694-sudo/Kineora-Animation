import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

/**
 * H03 — TAB CONTEXT MENU + DESTRUCTIVE SAFETY (T-ctx-* matrix).
 *
 * Contract under test (H03-RELEASE):
 *  - right-click → context menu with EXACTLY ONE item ("Close") — no
 *    invented items, no "Close Others" (Adobe-only, excluded)
 *  - opening the menu is NON-DESTRUCTIVE: no close, no mutation, NO events,
 *    and NO activation of the target (INV-DSTR-1/2)
 *  - the menu targets the right-clicked document's STABLE id — never the
 *    active pointer, never a DOM index, never a stale closure
 *  - Close item → `tab.close(targetDocId)` (the SAME commandId as the tab ×)
 *  - dirty target → H04/H07 guard; cancel leaves state unchanged
 *  - Esc / outside-click → CANCEL (no mutation); target removed while open
 *    → DISMISS (safe invalidation)
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
  }
  const reset = () => {
    state.docs = []
    state.active = 0
    state.nextId = 1
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
    reorderDoc: (id: number, toIndex: number) => {
      const from = state.docs.findIndex((d) => d.id === id)
      if (from < 0) return false
      const to = Math.min(toIndex, state.docs.length - 1)
      if (from === to) return true
      const doc = state.docs.splice(from, 1)[0]
      state.docs.splice(to, 0, doc)
      return true
    },
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
import { getCommand, makeCommandContext, commands } from './commands'
import type { CommandContext } from './commands'
import { reorderDocument, __resetDocPathsForTests } from './file'
import { DocumentTabs } from './components/DocumentTabs'

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

function capture(): { events: Array<{ name: string; docId?: number; change?: string }>; stop: () => void } {
  const events: Array<{ name: string; docId?: number; change?: string }> = []
  const offSet = bus.on('openSet:changed', (p) => events.push({ name: 'openSet:changed', change: p.change, docId: p.docId }))
  const offActive = bus.on('activeDoc:changed', (p) => events.push({ name: 'activeDoc:changed', docId: p.docId }))
  return { events, stop: () => { offSet(); offActive() } }
}

function rightClickTab(id: number): void {
  fireEvent.contextMenu(screen.getByTestId(`doc-tab-${id}`), { clientX: 120, clientY: 60 })
}

beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H03 §6 — the menu opens, non-destructively, with exactly one item', () => {
  it('T-ctx-open-active: right-click the ACTIVE tab → menu opens, no mutation, no activation, no events', () => {
    newDoc() // A (1) active
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    stop()
    expect(screen.getByTestId('ctx-tab-menu')).toHaveAttribute('role', 'menu')
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('role', 'menuitem')
    expect(fake.activeDocId()).toBe(1) // right-click does NOT activate
    expect(fake.docList()).toHaveLength(1) // opening the menu is non-destructive
    expect(events).toEqual([]) // no event on menu open (H03 §14)
    unmount()
  })

  it('T-ctx-open-inactive: right-click an INACTIVE tab → menu targets the INACTIVE doc (by ID), active unchanged', () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1) // A active, B inactive
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2)
    stop()
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    // the menu item is bound to B's title — the target is B, not active A
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-2')
    expect(fake.activeDocId()).toBe(1) // no activation on right-click
    expect(events).toEqual([])
    unmount()
  })

  it('T-ctx-open-many: right-click one of many → menu targets the clicked one', () => {
    for (let i = 0; i < 4; i++) newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(3)
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-3')
    expect(fake.activeDocId()).toBe(1)
    unmount()
  })

  it('T-ctx-no-doc: no document → no tab to right-click, menu cannot open', () => {
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    expect(screen.getByTestId('no-doc-tabs')).toBeInTheDocument()
    expect(screen.queryByTestId('doc-tab-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument()
    unmount()
  })

  it('T-ctx-tab-close: exactly ONE menu item, bound to the canonical tab.close commandId (no drift, no invented items)', () => {
    // registry: exactly two tab.* commands (activate + close) — no close-others
    expect(commands.filter((c) => c.id.startsWith('tab.'))).toHaveLength(2)
    expect(getCommand('tab.close')?.status).toBe('FUNCTIONAL')
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    // exactly one menu item, labelled "Close"
    expect(screen.getByTestId('ctx-tab-menu').querySelectorAll('[role="menuitem"]')).toHaveLength(1)
    expect(screen.getByTestId('ctx-tab-close')).toHaveTextContent('Close')
    unmount()
  })
})

// ————————————————————————————————————————————————————————————————
describe('H03 §17 — menu lifecycle: CANCEL (Esc / outside-click), DISMISS (target removed)', () => {
  it('T-ctx-esc: open then Esc → menu cancels, NO mutation, NO events', () => {
    newDoc()
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    stop()
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument()
    expect(fake.docList()).toHaveLength(1) // cancel never mutates
    expect(events).toEqual([])
    unmount()
  })

  it('T-ctx-outside: open then outside-click → menu cancels, NO mutation', () => {
    newDoc()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument()
    expect(fake.docList()).toHaveLength(1)
    unmount()
  })

  it('T-ctx-dismiss-removed: target closed elsewhere while the menu is open → menu DISMISSES (safe invalidation)', () => {
    newDoc() // A (1) active
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2) // menu targets B
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    // B is closed through a DIFFERENT path while the menu is open
    act(() => {
      getCommand('tab.close')!.run(makeCtx(), 2)
    })
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument(), 'menu dismissed — target no longer exists'
    expect(fake.docList()).toHaveLength(1)
    unmount()
  })

  it('T-ctx-dismiss-busy: a lifecycle transition (doc added) while open → menu DISMISSES', () => {
    newDoc() // A (1) active
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2)
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    // a New-document lifecycle transition while the menu is open
    act(() => {
      getCommand('file.new')!.run(makeCtx(), {
        platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
      })
    })
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument(), 'lifecycle in progress → dismiss'
    unmount()
  })

  it('T-ctx-rapid: rapid right-clicks → each open captures a FRESH target, no double-mutation', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    rightClickTab(2) // re-targets to B — single menu, fresh target
    stop()
    const menus = document.querySelectorAll('[role="menu"]')
    expect(menus).toHaveLength(1) // rapid re-open never stacks menus
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-2') // fresh target captured
    expect(events).toEqual([]) // right-clicks themselves never mutate
    unmount()
  })
})

// ————————————————————————————————————————————————————————————————
describe('H03 §13/§14 — Close from the menu (canonical tab.close, guard handoff)', () => {
  it('T-ctx-close-clean: select Close on a CLEAN inactive target → closes; active unchanged; events per H02 ST5', () => {
    // THE H03 CRITICAL TEST: A active, B inactive → right-click B → Close B.
    // B must close. A must remain active. B must never have been activated.
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2)
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1) // A remains active — B was never activated, then closed
    expect(events).toEqual([{ name: 'openSet:changed', change: 'removed', docId: 2 }]) // ST5: openSet only, no activeDoc
  })

  it('T-ctx-target-active: Close the ACTIVE target (via menu) → successor active (H02 ST4)', () => {
    newDoc() // A (1)
    newDoc() // B (2)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1) // menu targets active A
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(2) // successor active
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 1 },
      { name: 'activeDoc:changed', docId: 2 },
    ])
  })

  it('T-ctx-open-last: Close the last tab from the menu → NO_DOCUMENT (valid)', () => {
    newDoc()
    const { events, stop } = capture()
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(1)
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    stop()
    unmount()
    expect(fake.docList()).toHaveLength(0)
    expect(fake.activeDocId()).toBe(0)
    expect(events).toEqual([
      { name: 'openSet:changed', change: 'removed', docId: 1 },
      { name: 'activeDoc:changed', docId: 0 },
    ])
  })

  it('T-ctx-close-dirty + T-ctx-cancel: dirty target → guard; Cancel leaves state unchanged (App-level)', async () => {
    newDoc() // A (1) active + CLEAN
    newDoc() // B (2) inactive + DIRTY
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    rightClickTab(2)
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    // the guard targets B — the CLICKED doc — not the active doc (A is clean:
    // if the guard keyed off the active pointer, no dialog would appear at all)
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-cancel'))
    expect(fake.docList()).toHaveLength(2) // cancel → unchanged
    expect(fake.activeDocId()).toBe(1)
    expect(fake.state.docs[1].dirty).toBe(true)
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
  })

  it('T-ctx-discard: dirty target → guard → Discard → doc removed, non-undoable (App-level)', async () => {
    newDoc() // A (1) active
    newDoc() // B (2) inactive + DIRTY
    getCommand('tab.activate')!.run(makeCtx(), 1)
    fake.state.docs[1].dirty = true
    render(<App />)
    rightClickTab(2)
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dlg-close-discard'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1) // B discarded + closed; A remains
  })

  it('T-ctx-target-inactive / T-ctx-target-active: target identity survives activation changes while the menu is open', () => {
    newDoc() // A (1) active
    newDoc() // B (2) inactive
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2) // menu targets B
    // the active document changes while the menu is open (keyboard activation)
    getCommand('tab.activate')!.run(makeCtx(), 2) // B becomes active
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-2') // still targets B by ID
    // …and back
    getCommand('tab.activate')!.run(makeCtx(), 1)
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-2') // still targets B by ID
    // selecting Close closes B — not "whatever is active now"
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    expect(fake.docList()).toHaveLength(1)
    expect(fake.activeDocId()).toBe(1)
    unmount()
  })

  it('T-ctx-target-reorder: reorder while the menu is open → target ID unchanged, menu valid', () => {
    newDoc() // A (1) active
    newDoc() // B (2)
    newDoc() // C (3)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(3) // menu targets C
    // drag-reorder A across while the menu is open (openSet{reordered})
    reorderDocument(1, 2, makeCtx().notify)
    expect(screen.getByTestId('ctx-tab-menu')).toBeInTheDocument(), 'reorder keeps the menu valid'
    expect(screen.getByTestId('ctx-tab-close')).toHaveAttribute('aria-label', 'Close Untitled-3')
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    expect(fake.docList().map((d) => d.id)).toEqual([2, 1]) // C closed by ID
    unmount()
  })

  it('T-ctx-target-dirty / T-ctx-target-clean: dirty state changes while open do not disable the item (guard decides on select)', () => {
    newDoc() // A (1) active
    newDoc() // B (2) inactive, clean
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2)
    expect(screen.getByTestId('ctx-tab-close')).toBeInTheDocument()
    // B becomes dirty while the menu is open — the item stays (H03 §10:
    // dirty consequences are handled by the guard, not by disabling)
    fake.state.docs[1].dirty = true
    expect(screen.getByTestId('ctx-tab-close')).toBeInTheDocument()
    unmount()
  })

  it('T-ctx-seq: multiple closes in sequence → each targets its own doc by ID', () => {
    for (let i = 0; i < 3; i++) newDoc() // A(1) B(2) C(3)
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(3)
    fireEvent.click(screen.getByTestId('ctx-tab-close')) // close C
    expect(fake.docList().map((d) => d.id)).toEqual([1, 2])
    rightClickTab(2)
    fireEvent.click(screen.getByTestId('ctx-tab-close')) // close B
    expect(fake.docList().map((d) => d.id)).toEqual([1])
    expect(fake.activeDocId()).toBe(1) // A was never touched
    unmount()
  })

  it('T-ctx-stale-target: the target is the captured Doc ID — never a DOM position or stale closure', () => {
    newDoc() // A (1) active
    newDoc() // B (2)
    newDoc() // C (3)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2) // capture target = 2
    // reorder so B physically MOVES in the strip — the menu must still close 2
    act(() => {
      reorderDocument(2, 0, makeCtx().notify)
    })
    fireEvent.click(screen.getByTestId('ctx-tab-close'))
    expect(fake.docList().map((d) => d.id)).toEqual([1, 3]) // doc 2 closed even though its strip position changed
    unmount()
  })
})

// ————————————————————————————————————————————————————————————————
describe('H03 §16 — accessibility', () => {
  it('menu takes focus on open; Esc returns focus to the target tab', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run(makeCtx(), 1)
    const { unmount } = render(<DocumentTabs ctx={makeCtx()} />)
    rightClickTab(2)
    expect(document.activeElement).toBe(screen.getByTestId('ctx-tab-close'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(screen.getByTestId('doc-tab-2'))
    unmount()
  })
})
