// SYS-28 MOD-AUTOSAVE + recovery tests. The engine bridge and the platform
// adapter are the seams (mocked, matching the file.test.ts pattern); the
// unit under test is the autosave timer / slot / recovery logic itself.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const clientMock = vi.hoisted(() => ({
  activeDocId: vi.fn(() => 1),
  openDocJson: vi.fn(() => 9),
  markClean: vi.fn(() => true),
  projectJson: vi.fn(() => '{"settings":{"width":1920.0}}'),
  statusJson: vi.fn(() => ({
    doc_id: 1,
    doc_title: 'My Project',
    dirty: true,
    doc_count: 1,
    playhead: 1,
  })),
}))
vi.mock('./engine/client', () => clientMock)

const platformMock = vi.hoisted(() => ({
  platform: {
    isDesktop: vi.fn(() => false),
    readProject: vi.fn(async (_p: string) => null as string | null),
    writeProject: vi.fn(async (_p: string | null, _n: string, _c: string) => true),
  },
}))
vi.mock('./platform', () => platformMock)

import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_INTERVAL_MS,
  BROWSER_DEV_SLOT_KEY,
  HANDLED_SLOT_KEY,
  __resetAutosaveForTests,
  acceptRecovery,
  autosaveSlotPath,
  checkRecovery,
  discardRecovery,
  initAutosave,
  onManualSaveSuccess,
  type AutosaveDeps,
  type RecoveryCandidate,
} from './autosave'
import { bus } from './bus'
import { checksumHex, stampFormatVersion } from './persist'

const deps = (over: Partial<AutosaveDeps> = {}): AutosaveDeps => ({
  getDocPath: () => undefined,
  listRecentPaths: () => [],
  adoptDocPath: vi.fn(),
  ...over,
})

function makeEnvelope(content: string, projectPath: string | null = null): string {
  return JSON.stringify({
    v: 1,
    checksum: checksumHex(content),
    savedAt: 1700000000000,
    projectPath,
    title: 'My Project',
    content,
  })
}

const VALID_CONTENT = stampFormatVersion('{"settings":{"width":1920.0}}')!

let dispose: (() => void) | null = null

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  localStorage.removeItem(BROWSER_DEV_SLOT_KEY)
  localStorage.removeItem(HANDLED_SLOT_KEY)
  platformMock.platform.isDesktop.mockReturnValue(false)
  clientMock.statusJson.mockReturnValue({ doc_id: 1, doc_title: 'My Project', dirty: true, doc_count: 1, playhead: 1 })
  clientMock.activeDocId.mockReturnValue(1)
})

afterEach(() => {
  dispose?.()
  dispose = null
  __resetAutosaveForTests()
  vi.useRealTimers()
})

async function flushAsync(): Promise<void> {
  // let the async flush settle after timers fire
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('SYS-28 autosave — debounced slot writes (eng 13, H10 §5.3)', () => {
  it('writes the browser dev slot 2s after the last change — not before', async () => {
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
    vi.advanceTimersByTime(1)
    await flushAsync()
    const raw = localStorage.getItem(BROWSER_DEV_SLOT_KEY)
    expect(raw).not.toBeNull()
    const env = JSON.parse(raw!)
    expect(env.checksum).toBe(checksumHex(env.content))
    // slot content is formatVersion-stamped (write boundary applies to autosave too)
    expect(JSON.parse(env.content).formatVersion).toBe(1)
  })

  it('rapid changes collapse into ONE write, 2s after the LAST change', async () => {
    dispose = initAutosave(deps())
    const writes = () => (localStorage.getItem(BROWSER_DEV_SLOT_KEY) ? 1 : 0)
    for (let t = 0; t < 3; t++) {
      bus.emit('document:changed', { type: 'draw', targets: [] })
      vi.advanceTimersByTime(1000)
      await flushAsync()
    }
    expect(writes()).toBe(0) // still inside the moving debounce window
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS)
    await flushAsync()
    expect(writes()).toBe(1)
  })

  it('a continuous edit stream still autosaves by the 30s cap', async () => {
    dispose = initAutosave(deps())
    let elapsed = 0
    while (elapsed < AUTOSAVE_MAX_INTERVAL_MS + 1000) {
      bus.emit('document:changed', { type: 'draw', targets: [] })
      vi.advanceTimersByTime(1900) // always inside the 2s debounce
      await flushAsync()
      elapsed += 1900
      if (localStorage.getItem(BROWSER_DEV_SLOT_KEY)) break
    }
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).not.toBeNull()
    expect(elapsed).toBeLessThanOrEqual(AUTOSAVE_MAX_INTERVAL_MS + 1000)
  })

  it('never autosaves a CLEAN document', async () => {
    clientMock.statusJson.mockReturnValue({ doc_id: 1, doc_title: 'My Project', dirty: false, doc_count: 1, playhead: 1 })
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
  })

  it('does nothing with no document open (empty state)', async () => {
    clientMock.activeDocId.mockReturnValue(0)
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
  })

  it('NEVER emits saving:changed (manual save only — H10 §5.3) and never touches dirty', async () => {
    const savingEvents: unknown[] = []
    const off = bus.on('saving:changed', (p) => savingEvents.push(p))
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).not.toBeNull()
    expect(savingEvents).toEqual([])
    off()
  })

  it('desktop: writes to <projectPath>.autosave via the platform atomic seam', async () => {
    platformMock.platform.isDesktop.mockReturnValue(true)
    dispose = initAutosave(deps({ getDocPath: () => '/tmp/proj.json' }))
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(platformMock.platform.writeProject).toHaveBeenCalledTimes(1)
    expect(platformMock.platform.writeProject.mock.calls[0][0]).toBe(autosaveSlotPath('/tmp/proj.json'))
  })

  it('desktop: a PATHLESS (never-saved) document is NOT autosaved (AMB-D-001 — registered, not invented)', async () => {
    platformMock.platform.isDesktop.mockReturnValue(true)
    dispose = initAutosave(deps({ getDocPath: () => undefined }))
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(platformMock.platform.writeProject).not.toHaveBeenCalled()
  })

  it('a pending autosave is cancelled when the active document switches (AS-D6)', async () => {
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    clientMock.activeDocId.mockReturnValue(2)
    bus.emit('activeDoc:changed', { docId: 2 })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
  })
})

describe('SYS-28 autosave — manual save supersedes the slot (INV-AS-1)', () => {
  it('onManualSaveSuccess clears the slot and cancels the pending write', async () => {
    dispose = initAutosave(deps())
    bus.emit('document:changed', { type: 'draw', targets: [] })
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, makeEnvelope(VALID_CONTENT))
    await onManualSaveSuccess(1, undefined)
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull() // pending cancelled
  })

  it('desktop: clears by blanking <path>.autosave — but ONLY when a slot exists (AS-D3/AS-D3a)', async () => {
    platformMock.platform.isDesktop.mockReturnValue(true)
    // no slot this session, none on disk → NO write (a save never creates a
    // stray blank .autosave file)
    platformMock.platform.readProject.mockResolvedValue(null)
    await onManualSaveSuccess(1, '/tmp/proj.json')
    expect(platformMock.platform.writeProject).not.toHaveBeenCalled()
    // slot written this session → cleared via the atomic seam
    dispose = initAutosave(deps({ getDocPath: () => '/tmp/proj.json' }))
    bus.emit('document:changed', { type: 'draw', targets: [] })
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS + 10)
    await flushAsync()
    expect(platformMock.platform.writeProject).toHaveBeenCalledTimes(1) // the autosave itself
    await onManualSaveSuccess(1, '/tmp/proj.json')
    expect(platformMock.platform.writeProject).toHaveBeenLastCalledWith(autosaveSlotPath('/tmp/proj.json'), '', '')
    // leftover from a PREVIOUS session (not in the session write-set) → probed + cleared
    platformMock.platform.writeProject.mockClear()
    platformMock.platform.readProject.mockResolvedValue(makeEnvelope(VALID_CONTENT, '/tmp/proj.json'))
    await onManualSaveSuccess(1, '/tmp/proj.json')
    expect(platformMock.platform.writeProject).toHaveBeenCalledWith(autosaveSlotPath('/tmp/proj.json'), '', '')
  })
})

describe('SYS-28 recovery — launch scan (T12) + accept (T13) + discard (T14)', () => {
  it('browser: a valid slot yields a candidate', async () => {
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, makeEnvelope(VALID_CONTENT))
    const scan = await checkRecovery(deps())
    expect(scan.corruptSkipped).toBe(0)
    expect(scan.candidate?.title).toBe('My Project')
    expect(scan.candidate?.content).toBe(VALID_CONTENT)
  })

  it('browser: no slot (or a blank slot) = no prompt', async () => {
    expect((await checkRecovery(deps())).candidate).toBeNull()
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, '   ')
    expect((await checkRecovery(deps())).candidate).toBeNull()
  })

  it('a checksum-mismatched slot is SKIPPED and counted (H10 §10)', async () => {
    const env = JSON.parse(makeEnvelope(VALID_CONTENT))
    env.checksum = '0000000000000000'
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, JSON.stringify(env))
    const scan = await checkRecovery(deps())
    expect(scan.candidate).toBeNull()
    expect(scan.corruptSkipped).toBe(1)
  })

  it('desktop: scans recent paths most-recent-first; corrupt slots skipped, first valid wins', async () => {
    platformMock.platform.isDesktop.mockReturnValue(true)
    const slots: Record<string, string> = {
      [autosaveSlotPath('/a.json')]: 'garbage-not-an-envelope',
      [autosaveSlotPath('/b.json')]: makeEnvelope(VALID_CONTENT, '/b.json'),
    }
    platformMock.platform.readProject.mockImplementation(async (p: string) => slots[p] ?? null)
    const scan = await checkRecovery(
      deps({
        listRecentPaths: () => [
          { title: 'A', path: '/a.json' },
          { title: 'B', path: '/b.json' },
        ],
      }),
    )
    expect(scan.corruptSkipped).toBe(1)
    expect(scan.candidate?.projectPath).toBe('/b.json')
  })

  it('accept: loads via validate→migrate, adopts the path, emits openSet FIRST then activeDoc (H02 §14)', async () => {
    const order: string[] = []
    const off1 = bus.on('openSet:changed', () => order.push('openSet'))
    const off2 = bus.on('activeDoc:changed', () => order.push('activeDoc'))
    const adopt = vi.fn()
    const c: RecoveryCandidate = {
      source: 'native',
      title: 'My Project',
      content: VALID_CONTENT,
      savedAt: 1,
      projectPath: '/b.json',
    }
    const id = await acceptRecovery(c, deps({ adoptDocPath: adopt }))
    expect(id).toBe(9)
    expect(clientMock.openDocJson).toHaveBeenCalledTimes(1)
    expect(adopt).toHaveBeenCalledWith(9, '/b.json')
    expect(order).toEqual(['openSet', 'activeDoc'])
    off1()
    off2()
  })

  it('accept with INVALID autosaved content fails honestly — no events, returns 0', async () => {
    const events: string[] = []
    const off = bus.on('openSet:changed', () => events.push('openSet'))
    const c: RecoveryCandidate = { source: 'browser-dev', title: 'X', content: '###', savedAt: 1, projectPath: null }
    expect(await acceptRecovery(c, deps())).toBe(0)
    expect(clientMock.openDocJson).not.toHaveBeenCalled()
    expect(events).toEqual([])
    off()
  })

  it('discard clears the slot and emits nothing (T14)', async () => {
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, makeEnvelope(VALID_CONTENT))
    const events: string[] = []
    const off = bus.on('activeDoc:changed', () => events.push('activeDoc'))
    await discardRecovery({ source: 'browser-dev', title: 'X', content: VALID_CONTENT, savedAt: 1, projectPath: null })
    expect(localStorage.getItem(BROWSER_DEV_SLOT_KEY)).toBeNull()
    expect(events).toEqual([])
    off()
  })

  it('does not re-prompt the same snapshot after Discard (even if the slot reappears)', async () => {
    const env = makeEnvelope(VALID_CONTENT)
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, env)
    await discardRecovery({ source: 'browser-dev', title: 'X', content: VALID_CONTENT, savedAt: 1700000000000, projectPath: null })
    localStorage.setItem(BROWSER_DEV_SLOT_KEY, env)
    expect((await checkRecovery(deps())).candidate).toBeNull()
  })
})
