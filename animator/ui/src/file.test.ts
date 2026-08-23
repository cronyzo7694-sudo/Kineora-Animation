import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the engine client (file.ts is the unit under test — the engine bridge
// is the seam; these tests verify SYS-02 lifecycle logic, not the WASM core).
const clientMock = vi.hoisted(() => ({
  getEngine: vi.fn(() => ({})),
  getEngineStatus: vi.fn(() => ({ kind: 'ok' as const, detail: 'attached' })),
  statusJson: vi.fn(() => ({
    doc_id: 1,
    doc_title: 'Untitled-1',
    dirty: false,
    doc_count: 1,
    playhead: 1,
  })),
  activeDocId: vi.fn(() => 1),
  closeDoc: vi.fn(() => true),
  docList: vi.fn(() => []),
  loadProjectJson: vi.fn(() => true),
  markClean: vi.fn(() => true),
  setDocModifiedAt: vi.fn(() => true),
  newDocFull: vi.fn(() => 7),
  openDocJson: vi.fn(() => 8),
  projectJson: vi.fn(() => '{"settings":{"width":1920.0}}'),
  setDocTitle: vi.fn(() => true),
  reorderDoc: vi.fn(() => true),
}))
vi.mock('./engine/client', () => clientMock)

// file.ts calls downloadBlob from actions — stub it (no real download in jsdom)
vi.mock('./engine/actions', () => ({ downloadBlob: vi.fn() }))

import { bus } from './bus'
import { registerSaveNamePicker } from './platform'
import {
  addRecent,
  createDocument,
  createFromTemplate,
  isTitled,
  titleFromSavedPath,
  listRecent,
  listTemplates,
  openFromRecent,
  saveDocument,
  saveTemplate,
  __resetDocPathsForTests,
} from './file'

beforeEach(() => {
  vi.clearAllMocks()
  registerSaveNamePicker(null)
  __resetDocPathsForTests()
  try {
    localStorage.removeItem('kineora.recentFiles')
    localStorage.removeItem('kineora.templates')
  } catch {
    /* ignore */
  }
})

describe('SYS-02 file — identity + New', () => {
  it('isTitled distinguishes Untitled-N from a real name', () => {
    expect(isTitled('Untitled-1')).toBe(false)
    expect(isTitled('Untitled')).toBe(false)
    expect(isTitled('')).toBe(false)
    expect(isTitled('my-project')).toBe(true)
  })

  it('titleFromSavedPath strips .json and File-System-Access session tokens', () => {
    expect(titleFromSavedPath('/home/u/my-project.json', 'x')).toBe('my-project')
    expect(titleFromSavedPath('fsa:3:shot', 'x')).toBe('shot')
    expect(titleFromSavedPath('fsa:3:shot.json', 'x')).toBe('shot')
  })

  it('createDocument creates a doc and emits openSet{added} → activeDoc (H02 §14 ST1 order)', () => {
    const seen: Array<{ name: string; payload: unknown }> = []
    const off1 = bus.on('openSet:changed', (p) => seen.push({ name: 'openSet', payload: p }))
    const off2 = bus.on('activeDoc:changed', (p) => seen.push({ name: 'activeDoc', payload: p }))
    createDocument({ platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30, background: '#ffffff', backgroundAlpha: 1, units: 'px' }, vi.fn())
    off1()
    off2()
    const payload = (clientMock.newDocFull as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>
    expect(payload).toMatchObject({
      platform: 'HTML5 Canvas', width: 1280, height: 720, fps: 30, background: '#ffffff', units: 'px',
      backgroundAlpha: 1, // H01 §8 default fill
    })
    expect(typeof payload.createdAt).toBe('number') // H01 §7 meta stamp
    expect(seen).toEqual([
      { name: 'openSet', payload: { change: 'added', docId: 7 } },
      { name: 'activeDoc', payload: { docId: 7 } },
    ])
  })

  it('createDocument reports honestly when the engine is absent', () => {
    ;(clientMock.getEngineStatus as ReturnType<typeof vi.fn>).mockReturnValue({ kind: 'error', detail: 'x' })
    const notify = vi.fn()
    createDocument({ platform: 'HTML5 Canvas', width: 1, height: 1, fps: 24, background: '#fff', backgroundAlpha: 1, units: 'px' }, notify)
    expect(notify).toHaveBeenCalledWith('new: engine not attached')
    ;(clientMock.getEngineStatus as ReturnType<typeof vi.fn>).mockReturnValue({ kind: 'ok', detail: 'attached' })
  })
})

describe('SYS-02 file — Save / Save As', () => {
  it('untitled Save routes to a name prompt and marks clean on success', async () => {
    window.prompt = () => 'my-project'
    const notify = vi.fn()
    const ok = await saveDocument(notify)
    expect(ok).toBe(true)
    expect(clientMock.setDocTitle).toHaveBeenCalledWith(1, 'my-project')
    expect(clientMock.markClean).toHaveBeenCalled()
    expect(notify.mock.calls.some((c) => String(c[0]).includes('saved'))).toBe(true)
  })

  it('Save cancelled → no state change (no clean, no title)', async () => {
    window.prompt = () => null
    const notify = vi.fn()
    const ok = await saveDocument(notify)
    expect(ok).toBe(false)
    expect(clientMock.markClean).not.toHaveBeenCalled()
    expect(clientMock.setDocTitle).not.toHaveBeenCalled()
  })

  it('titled Save overwrites without prompting (P-1)', async () => {
    ;(clientMock.statusJson as ReturnType<typeof vi.fn>).mockReturnValue({ doc_id: 1, doc_title: 'scene1', dirty: true, doc_count: 1, playhead: 1 })
    const promptSpy = vi.spyOn(window, 'prompt')
    const ok = await saveDocument(vi.fn())
    expect(ok).toBe(true)
    expect(promptSpy).not.toHaveBeenCalled()
    expect(clientMock.markClean).toHaveBeenCalled()
  })

  it('Save As with no native picker prompts for a name', async () => {
    window.prompt = () => 'copy'
    const ok = await saveDocument(vi.fn(), { saveAs: true })
    expect(ok).toBe(true)
    expect(clientMock.setDocTitle).toHaveBeenCalledWith(1, 'copy')
  })
})

describe('SYS-02 file — templates (preset-JSON mechanism)', () => {
  it('saveTemplate persists and lists a template', () => {
    const notify = vi.fn()
    saveTemplate('Character Rig', notify)
    expect(listTemplates().map((t) => t.name)).toEqual(['Character Rig'])
    expect(notify).toHaveBeenCalledWith('template "Character Rig" saved')
  })

  it('saveTemplate rejects an empty name', () => {
    const notify = vi.fn()
    saveTemplate('   ', notify)
    expect(notify).toHaveBeenCalledWith('save template: a name is required')
    expect(listTemplates()).toEqual([])
  })

  it('createFromTemplate seeds a NEW independent document (H01 §7 meta, AMB-H01-003 untitled title)', () => {
    saveTemplate('Banner', vi.fn())
    const notify = vi.fn()
    createFromTemplate('Banner', notify)
    const [json, title] = (clientMock.openDocJson as ReturnType<typeof vi.fn>).mock.calls[0] as [string, string]
    expect(title).toBe('')
    const parsed = JSON.parse(json) as { settings: { width: number }; meta: { createdAt: number; modifiedAt: null; title: null; author: null } }
    expect(parsed.settings.width).toBe(1920.0)
    expect(typeof parsed.meta.createdAt).toBe('number')
    expect(parsed.meta.modifiedAt).toBeNull()
    expect(parsed.meta.title).toBeNull()
    expect(parsed.meta.author).toBeNull()
    expect(notify.mock.calls.some((c) => String(c[0]).includes('created from template'))).toBe(true)
  })

  it('createFromTemplate reports a missing template', () => {
    const notify = vi.fn()
    createFromTemplate('Nope', notify)
    expect(notify).toHaveBeenCalledWith('template "Nope" not found')
  })
})

describe('SYS-02 file — recent files (unbounded, most-recent-first)', () => {
  it('addRecent pushes most-recent-first and dedupes by title', () => {
    addRecent('a', '{}')
    addRecent('b', '{}')
    addRecent('a', '{}')
    expect(listRecent().map((r) => r.title)).toEqual(['a', 'b'])
  })

  it('recent list survives reload (localStorage)', () => {
    addRecent('proj', '{}')
    // simulate a fresh read (module state is already localStorage-backed)
    expect(listRecent().find((r) => r.title === 'proj')).toBeTruthy()
  })

  it('openFromRecent ADDS a document to the open-set with the locked event order (H06)', async () => {
    addRecent('proj', '{"settings":{}}')
    const seen: Array<{ name: string; payload: unknown }> = []
    const off1 = bus.on('openSet:changed', (p) => seen.push({ name: 'openSet', payload: p }))
    const off2 = bus.on('activeDoc:changed', (p) => seen.push({ name: 'activeDoc', payload: p }))
    await openFromRecent({ title: 'proj', name: 'proj.json', savedAt: Date.now(), json: '{"settings":{}}' }, vi.fn())
    off1()
    off2()
    // SYS-28 read boundary (H10 §5.2, wired): the engine receives the
    // MIGRATED content — a legacy (v0) snapshot is stamped to the current
    // formatVersion before the engine parse (eng 13 loader order).
    expect(clientMock.openDocJson).toHaveBeenCalledWith('{"settings":{},"formatVersion":1}', 'proj')
    expect(clientMock.loadProjectJson).not.toHaveBeenCalled() // Open never replaces the active doc (H02 §3)
    expect(seen).toEqual([
      { name: 'openSet', payload: { change: 'added', docId: 8 } },
      { name: 'activeDoc', payload: { docId: 8 } },
    ])
  })

  it('openFromRecent reports a stale/missing entry honestly', async () => {
    const notify = vi.fn()
    await openFromRecent({ title: 'ghost', name: 'ghost.json', savedAt: Date.now() }, notify)
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('stale or unavailable'))
    expect(clientMock.loadProjectJson).not.toHaveBeenCalled()
  })
})
