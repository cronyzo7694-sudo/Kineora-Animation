import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * H05 — SAVE + SAVE AS + FILE IDENTITY (T-save-* matrix).
 *
 * The engine bridge is a stateful fake (same wire contract as the other
 * suites); the platform stub models the DESKTOP H05 flow: pickSavePath
 * (dialog only) → validate → writeProject (atomic write). file.ts is REAL —
 * the session path map (docPaths / findDocByPath) is exercised for real,
 * which is what makes the already-open-path BLOCK (edge 15) meaningful.
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
    /** call-order record proving the H05 §7.1 binding order
     *  (setModifiedAt BEFORE markClean). */
    callOrder: [] as string[],
  }
  const reset = () => {
    state.docs = []
    state.active = 0
    state.nextId = 1
    state.callOrder = []
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
        return 0 // engine: invalid project data
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
    setDocModifiedAt: (epoch: number) => {
      const d = state.docs.find((x) => x.id === state.active)
      if (!d) return false
      state.callOrder.push(`setModifiedAt:${epoch}`)
      return true
    },
    markClean: () => {
      const d = state.docs.find((x) => x.id === state.active)
      if (!d) return false
      d.dirty = false
      state.callOrder.push('markClean')
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
import { saveDocument, __resetDocPathsForTests, docPath } from './file'
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

interface CapEvent {
  name: string
  [k: string]: unknown
}
function capture(...names: string[]): { events: CapEvent[]; stop: () => void } {
  const events: CapEvent[] = []
  const offs = names.map((n) => bus.on(n as never, (p: never) => events.push({ name: n, ...(p as object) } as CapEvent)))
  return { events, stop: () => offs.forEach((off) => off()) }
}
/** Create one document and (optionally) give it a path via a first save. */
async function newDocWithPath(path: string | null): Promise<number> {
  getCommand('file.new')!.run(makeCtx(), {
    platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
  })
  if (path) {
    vi.mocked(platform.pickSavePath).mockResolvedValue(path)
    expect(await saveDocument(vi.fn())).toBe(true)
  }
  return fake.activeDocId()
}
beforeEach(() => {
  fake.reset()
  __resetDocPathsForTests()
  bus.clear()
  vi.clearAllMocks()
  vi.mocked(platform.pickSavePath).mockResolvedValue(null)
  vi.mocked(platform.writeProject).mockResolvedValue(true)
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
})

// ————————————————————————————————————————————————————————————————
describe('H05 §13 — save flows (pick → validate → write → stamp → clean)', () => {
  it('T-save-untitled: first Save picks a path, writes, TITLED+CLEAN', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    const id = fake.activeDocId()
    fake.state.docs[0].dirty = true
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/untitled-proj.json')
    const { events, stop } = capture('saving:changed')
    const ok = await saveDocument(vi.fn())
    stop()
    expect(ok).toBe(true)
    expect(platform.pickSavePath).toHaveBeenCalledTimes(1)
    expect(platform.writeProject).toHaveBeenCalledWith('/p/untitled-proj.json', expect.anything(), expect.anything())
    expect(fake.state.docs[0].dirty).toBe(false)
    expect(docPath(id)).toBe('/p/untitled-proj.json')
    expect(events.map((e) => e.state)).toEqual(['saving', 'saved'])
  })

  it('T-save-titled: titled doc overwrites its known path — NO picker, NO confirm (P-1)', async () => {
    const id = await newDocWithPath('/p/a.json')
    fake.state.docs[0].dirty = true
    const picksBefore = vi.mocked(platform.pickSavePath).mock.calls.length
    const writesBefore = vi.mocked(platform.writeProject).mock.calls.length
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(vi.fn())).toBe(true)
    stop()
    expect(vi.mocked(platform.pickSavePath).mock.calls.length).toBe(picksBefore) // overwrite never re-prompts (P-1)
    expect(vi.mocked(platform.writeProject).mock.calls.length).toBe(writesBefore + 1)
    expect(platform.writeProject).toHaveBeenNthCalledWith(writesBefore + 1, '/p/a.json', expect.anything(), expect.anything())
    expect(fake.state.docs[0].dirty).toBe(false)
    expect(docPath(id)).toBe('/p/a.json')
    expect(events.map((e) => e.state)).toEqual(['saving', 'saved'])
  })

  it('T-save-as: Save As picks a NEW path; identity (Document ID) unchanged', async () => {
    const id = await newDocWithPath('/p/a.json')
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/b.json')
    const picksBefore = vi.mocked(platform.pickSavePath).mock.calls.length
    expect(await saveDocument(vi.fn(), { saveAs: true })).toBe(true)
    expect(vi.mocked(platform.pickSavePath).mock.calls.length).toBe(picksBefore + 1) // exactly one new pick
    expect(vi.mocked(platform.pickSavePath).mock.calls[picksBefore][0]).toBe('a')
    expect(fake.activeDocId()).toBe(id) // Document ID survives Save As
    expect(docPath(id)).toBe('/p/b.json')
    expect(fake.state.docs[0].dirty).toBe(false)
  })

  it('T-save-as-overwrite: Save As to a path on disk that NO open doc owns → overwrite, no confirm', async () => {
    await newDocWithPath('/p/a.json')
    getCommand('tab.activate')!.run(makeCtx(), 1)
    // the picker returns a different on-disk path — no open doc owns it
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/other.json')
    const writesBefore = vi.mocked(platform.writeProject).mock.calls.length
    expect(await saveDocument(vi.fn(), { saveAs: true })).toBe(true)
    expect(vi.mocked(platform.writeProject).mock.calls.length).toBe(writesBefore + 1)
    expect(platform.writeProject).toHaveBeenNthCalledWith(writesBefore + 1, '/p/other.json', expect.anything(), expect.anything())
    expect(fake.state.docs[0].dirty).toBe(false)
  })

  it('T-save-as-open-path-block: Save As to another OPEN doc\'s path → BLOCKED before any write', async () => {
    // doc 1 owns /p/a.json; doc 2 tries to Save As onto the same path.
    const a = await newDocWithPath('/p/a.json')
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    const b = fake.activeDocId()
    fake.state.docs[1].dirty = true
    const undoBefore = fake.state.docs[1].undoLen
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/a.json')
    const notify = vi.fn()
    const { events, stop } = capture('saving:changed')
    const writesBefore = vi.mocked(platform.writeProject).mock.calls.length
    const cleansBefore = fake.state.callOrder.filter((c) => c === 'markClean').length
    const ok = await saveDocument(notify, { saveAs: true })
    stop()
    expect(ok).toBe(false)
    expect(vi.mocked(platform.writeProject).mock.calls.length).toBe(writesBefore) // NO write — blocked pre-write
    expect(fake.state.docs[1].dirty).toBe(true) // source doc stays DIRTY (SAVE_ERROR)
    expect(fake.state.docs[1].undoLen).toBe(undoBefore) // History preserved
    expect(fake.state.callOrder.filter((c) => c === 'markClean').length).toBe(cleansBefore) // snapshot NOT advanced
    expect(docPath(b)).toBeUndefined() // path NOT taken
    expect(docPath(a)).toBe('/p/a.json') // the other doc keeps its path
    expect(events.map((e) => e.state)).toEqual(['saving', 'error'])
    expect(notify.mock.calls.some((c) => String(c[0]).includes('Save blocked'))).toBe(true)
  })

  it('T-save-fail / T-save-readonly / T-save-perm: write failure → SAVE_ERROR, dirty PRESERVED, last-good intact', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    fake.state.docs[0].dirty = true
    const undoBefore = fake.state.docs[0].undoLen
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/readonly.json')
    vi.mocked(platform.writeProject).mockResolvedValue(false) // disk/permission/read-only all surface as false
    const notify = vi.fn()
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(notify)).toBe(false)
    stop()
    expect(fake.state.docs[0].dirty).toBe(true) // stays DIRTY (SAVE_ERROR)
    expect(fake.state.docs[0].undoLen).toBe(undoBefore) // History preserved
    expect(events.map((e) => e.state)).toEqual(['saving', 'error'])
    expect(notify.mock.calls.some((c) => String(c[0]).includes('Save error'))).toBe(true)
  })

  it('T-save-clean: Save on a CLEAN doc is an idempotent write (P-6) — still writes + "Saved"', async () => {
    await newDocWithPath('/p/a.json') // now titled + CLEAN
    const writesBefore = vi.mocked(platform.writeProject).mock.calls.length
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(vi.fn())).toBe(true)
    stop()
    expect(vi.mocked(platform.writeProject).mock.calls.length).toBe(writesBefore + 1) // idempotent: it still writes
    expect(platform.writeProject).toHaveBeenNthCalledWith(writesBefore + 1, '/p/a.json', expect.anything(), expect.anything())
    expect(events.map((e) => e.state)).toEqual(['saving', 'saved'])
  })

  it('T-save-dialog: cancelled picker → saving{idle}, no write, document unchanged', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    fake.state.docs[0].dirty = true
    vi.mocked(platform.pickSavePath).mockResolvedValue(null) // cancelled
    const { events, stop } = capture('saving:changed')
    expect(await saveDocument(vi.fn())).toBe(false)
    stop()
    expect(platform.writeProject).not.toHaveBeenCalled()
    expect(fake.state.docs[0].dirty).toBe(true)
    expect(events.map((e) => e.state)).toEqual(['saving', 'idle'])
  })

  it('T-save-same: saving the same target path twice → both overwrites (identity same, path same)', async () => {
    await newDocWithPath('/p/a.json')
    const writesBefore = vi.mocked(platform.writeProject).mock.calls.length
    fake.state.docs[0].dirty = true
    expect(await saveDocument(vi.fn())).toBe(true)
    fake.state.docs[0].dirty = true
    expect(await saveDocument(vi.fn())).toBe(true)
    expect(vi.mocked(platform.writeProject).mock.calls.length).toBe(writesBefore + 2)
    expect(platform.writeProject).toHaveBeenNthCalledWith(writesBefore + 1, '/p/a.json', expect.anything(), expect.anything())
    expect(platform.writeProject).toHaveBeenNthCalledWith(writesBefore + 2, '/p/a.json', expect.anything(), expect.anything())
  })
})

// ————————————————————————————————————————————————————————————————
describe('H05 §7.1/§9/§10 — binding order, events, meta, undo', () => {
  it('T-save-modifiedAt: modifiedAt is stamped (H05) and ordered BEFORE the snapshot advance', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    fake.state.docs[0].dirty = true
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/m.json')
    expect(await saveDocument(vi.fn())).toBe(true)
    const stampIdx = fake.state.callOrder.findIndex((c) => c.startsWith('setModifiedAt:'))
    const cleanIdx = fake.state.callOrder.indexOf('markClean')
    expect(stampIdx).toBeGreaterThanOrEqual(0)
    expect(cleanIdx).toBeGreaterThan(stampIdx) // H05 §7.1: (3) modifiedAt ← now BEFORE (4) snapshot advance
    const epoch = Number(fake.state.callOrder[stampIdx].split(':')[1])
    expect(epoch).toBeGreaterThan(1_700_000_000) // a real recent epoch stamp
  })

  it('T-save-undo-preserved: save does NOT clear the undo history (Part 12)', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    fake.state.docs[0].dirty = true
    fake.state.docs[0].undoLen = 4
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/u.json')
    expect(await saveDocument(vi.fn())).toBe(true)
    expect(fake.state.docs[0].undoLen).toBe(4) // history intact after save
  })

  it('T-save-event: exactly saving→saved — NO activeDoc, NO document:changed (save is not a mutation)', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    fake.state.docs[0].dirty = true
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/e.json')
    const { events, stop } = capture('saving:changed', 'activeDoc:changed', 'document:changed')
    await saveDocument(vi.fn())
    stop()
    expect(events.filter((e) => e.name === 'saving:changed').map((e) => e.state)).toEqual(['saving', 'saved'])
    expect(events.filter((e) => e.name === 'activeDoc:changed')).toEqual([]) // no fake activeDoc (FL-0007)
    expect(events.filter((e) => e.name === 'document:changed')).toEqual([]) // save is not a document mutation
  })

  it('T-save-title (PROVISIONAL — AMB-H05-001): tab title derives from the filename on first save', async () => {
    getCommand('file.new')!.run(makeCtx(), {
      platform: 'HTML5 Canvas', width: 100, height: 100, fps: 24, background: '#ffffff', backgroundAlpha: 1, units: 'px',
    })
    vi.mocked(platform.pickSavePath).mockResolvedValue('/p/my-project.json')
    expect(await saveDocument(vi.fn())).toBe(true)
    expect(fake.state.docs[0].title).toBe('my-project')
    // NOTE: PROVISIONAL — matches the spec's RECOMMENDATION; a product
    // decision may still change this (identity is never the title).
  })
})
