import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

/**
 * H11 — VISUAL / ACCESSIBILITY / ERROR / EDGE STATES (T-vis-*, T-a11y-*,
 * T-err-*, T-edge-*). Consolidated contract: SYS-01 tokens (INV-VIS-2),
 * one dirty-● design on the danger token (H11 §4/§8), error presentation
 * (INV-ERR-1/2/3), guard submitting state (no double-submit).
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

let saveProjectAsImpl: () => Promise<unknown> = async () => ({ path: '/p/x.json', name: 'x' })
const platformStub = vi.hoisted(() => ({
  kind: 'desktop' as const,
  isDesktop: () => true,
  openProject: vi.fn(async () => null),
  pickSavePath: vi.fn(async () => '/p/x.json'),
  saveProjectAs: vi.fn(() => saveProjectAsImpl()),
  writeProject: vi.fn(async () => true),
  readProject: vi.fn(async () => null),
  getShellStatus: vi.fn(async () => null),
  getIdentity: vi.fn(async () => null),
  approveClose: vi.fn(async () => {}),
  onCloseRequested: vi.fn(() => () => {}),
  exit: vi.fn(),
}))
// hoisted access for the save implementation switch (tests set this)
;(platformStub as unknown as { __setSave: (f: () => Promise<unknown>) => void }).__setSave = (f) => {
  saveProjectAsImpl = f
}

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
import { getCommand } from './commands'
import { platform } from './platform'

const SETTINGS = { platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px' }
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  fake.state.docs = []
  fake.state.active = 0
  fake.state.nextId = 1
  saveProjectAsImpl = async () => ({ path: '/p/x.json', name: 'x' })
  bus.clear()
  vi.clearAllMocks()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

function newDoc() {
  getCommand('file.new')!.run({
    engine: { kind: 'ok' as const, detail: 'attached' },
    notify: vi.fn(),
    getStatus: () => fake.statusJson(),
    confirmClose: (p: () => void) => p(),
  } as never, SETTINGS)
}

describe('H11 §4 — visual states (tokens, one dirty-● design)', () => {
  it('T-vis-tab-dirty: the tab ● uses the danger token; hidden on CLEAN', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<App />)
    const dot = screen.getByTestId('doc-tab-dirty-1')
    expect(dot.style.color).toBe('var(--kineora-danger)')
    unmount()
    // clean → no dot at all
    fake.state.docs[0].dirty = false
    const { unmount: u2 } = render(<App />)
    expect(screen.queryByTestId('doc-tab-dirty-1')).not.toBeInTheDocument()
    u2()
  })

  it('T-vis-guard-danger: the destructive Discard button is distinguished via the danger token', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    const discard = screen.getByTestId('dlg-close-discard')
    expect(discard.style.color).toBe('var(--kineora-danger)')
    expect(discard.style.border).toContain('var(--kineora-danger)')
    unmount()
  })

  it('T-vis-no-doc-empty: the no-document state uses SYS-01 tokens (no hard-coded colors)', () => {
    const { unmount } = render(<App />)
    const empty = screen.getByTestId('no-doc-tabs')
    expect(empty.style.color).toBe('var(--kineora-disabled-text)')
    expect(empty.style.background).toBe('var(--kineora-panel-2)')
    const openBtn = screen.getByTestId('no-doc-open')
    expect(openBtn.style.background).toBe('var(--kineora-btn-bg)')
    unmount()
  })

  it('T-vis-menu-states: a disabled-by-context menu item uses the disabled-text token + reason', () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    const save = screen.getByTestId('menu-item-file.save')
    expect(save).toBeDisabled()
    expect(save.style.color).toBe('var(--kineora-disabled-text)')
    expect(save).toHaveAttribute('title', expect.stringContaining('no document open'))
    unmount()
  })
})

describe('H11 §5 — accessibility (consolidated, ownership unchanged)', () => {
  it('T-a11y-tab-role + T-a11y-tab-focus: tablist/tab roles; activated tab receives focus (D-AMB-003)', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run({ notify: vi.fn(), getStatus: () => fake.statusJson(), confirmClose: (p: () => void) => p() } as never, 1)
    const { unmount } = render(<App />)
    expect(screen.getByTestId('doc-tabs')).toHaveAttribute('role', 'tablist')
    expect(screen.getByTestId('doc-tab-1')).toHaveAttribute('role', 'tab')
    expect(screen.getByTestId('doc-tab-1')).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByTestId('doc-tab-2'))
    expect(document.activeElement).toBe(screen.getByTestId('doc-tab-2'))
    unmount()
  })

  it('T-a11y-ctx-menu: role=menu/menuitem; Esc dismisses; focus returns to the tab', () => {
    newDoc()
    newDoc()
    getCommand('tab.activate')!.run({ notify: vi.fn(), getStatus: () => fake.statusJson(), confirmClose: (p: () => void) => p() } as never, 1)
    const { unmount } = render(<App />)
    const tab = screen.getByTestId('doc-tab-2')
    fireEvent.contextMenu(tab)
    const menu = screen.getByTestId('ctx-tab-menu')
    expect(menu).toHaveAttribute('role', 'menu')
    const item = screen.getByTestId('ctx-tab-close')
    expect(item).toHaveAttribute('role', 'menuitem')
    expect(item).toHaveAttribute('aria-label', 'Close Untitled-2')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('ctx-tab-menu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(tab) // focus returned
    unmount()
  })

  it('T-a11y-dirty-live: the ● is inside an always-present aria-live region labelled "unsaved changes"', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<App />)
    const dot = screen.getByTestId('doc-tab-dirty-1')
    expect(dot).toHaveAttribute('aria-label', 'unsaved changes')
    expect(dot.parentElement).toHaveAttribute('aria-live', 'polite')
    // the tab NAME carries the dirty marker (H02 §19)
    expect(screen.getByTestId('doc-tab-1')).toHaveAttribute('aria-label', 'Untitled-1 — unsaved')
    unmount()
  })

  it('T-a11y-guard-trap: Esc on the guard = Cancel (no mutation)', () => {
    newDoc()
    fake.state.docs[0].dirty = true
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('dlg-close')).not.toBeInTheDocument()
    expect(fake.docList()).toHaveLength(1)
    expect(fake.state.docs[0].dirty).toBe(true) // unchanged
    unmount()
  })

  it('T-a11y-save-announce: st.saving is aria-live and announces saved/error', async () => {
    newDoc()
    const { unmount } = render(<App />)
    const cell = screen.getByTestId('st-saving')
    expect(cell).toHaveAttribute('aria-live', 'polite')
    // a save success → "saved hh:mm" announced
    bus.emit('saving:changed', { state: 'saved', time: '10:00:00 AM' })
    await flush()
    expect(cell.textContent).toContain('saved 10:00:00 AM')
    unmount()
  })
})

describe('H11 §6 — error presentation (no silent failure)', () => {
  it('T-err-save-fail: "Save error" in the status (danger) + toast; doc stays DIRTY', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    // the DESKTOP save flow is pickSavePath → (open-path validation) → writeProject
    vi.mocked(platform.writeProject).mockResolvedValue(false)
    const { unmount } = render(<App />)
    const notify = vi.fn()
    getCommand('file.save')!.run({
      engine: { kind: 'ok' as const, detail: 'attached' },
      notify,
      getStatus: () => fake.statusJson(),
      openExport: vi.fn(),
      confirmClose: (p: () => void) => p(),
    } as never)
    await flush()
    const cell = screen.getByTestId('st-saving')
    expect(cell.textContent).toContain('save error')
    expect(cell.querySelector('span')!.style.color).toBe('var(--kineora-danger)')
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('Save error'))
    unmount()
  })

  it('T-err-open-fail (CASE A): a corrupt open leaves the active doc EXACTLY intact + toast', async () => {
    newDoc() // A (1) active, dirty
    fake.state.docs[0].dirty = true
    vi.mocked(platform.openProject).mockResolvedValue({ name: 'bad.json', path: '/p/bad.json', content: '{not-json' } as never)
    const notify = vi.fn()
    const { unmount } = render(<App />)
    getCommand('file.open')!.run({
      engine: { kind: 'ok' as const, detail: 'attached' },
      notify,
      getStatus: () => fake.statusJson(),
      confirmClose: (p: () => void) => p(),
    } as never)
    await flush()
    expect(fake.docList()).toHaveLength(1) // nothing added
    expect(fake.activeDocId()).toBe(1) // A still active
    expect(fake.state.docs[0].dirty).toBe(true) // A untouched
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('open failed'))
    unmount()
  })

  it('T-edge-empty-recent: an empty Open Recent shows the honest empty state', () => {
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.mouseEnter(screen.getByTestId('sub-menu.file-Open Recent'))
    expect(screen.getByText('No recent files')).toBeInTheDocument()
    unmount()
  })
})

describe('H11 §4 / H13 §6 — guard submitting state (no double-submit)', () => {
  it('double-clicking Save in the guard fires the H05 save exactly once (busy guard)', async () => {
    newDoc()
    fake.state.docs[0].dirty = true
    // a save that stays in flight until we release it → the guard stays busy
    let release!: (v: boolean) => void
    vi.mocked(platform.writeProject).mockImplementation(() => new Promise((r) => { release = r }))
    const { unmount } = render(<App />)
    fireEvent.click(screen.getByTestId('menu.file'))
    fireEvent.click(screen.getByTestId('menu-item-file.close'))
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    const saveBtn = screen.getByTestId('dlg-close-save')
    fireEvent.click(saveBtn)
    fireEvent.click(saveBtn) // double-submit attempt while in flight
    await flush()
    // the guard is busy: Save disabled + "Saving…", exactly one attempt fired
    expect(saveBtn).toBeDisabled()
    expect(saveBtn).toHaveTextContent('Saving…')
    expect(platform.writeProject).toHaveBeenCalledTimes(1)
    // release the write as a FAILURE → guard stays open, doc stays DIRTY
    release(false)
    await flush()
    expect(screen.getByTestId('dlg-close')).toBeInTheDocument()
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(platform.writeProject).toHaveBeenCalledTimes(1) // no second attempt
    unmount()
  })
})
