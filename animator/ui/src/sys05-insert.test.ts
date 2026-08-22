// SYS-05 Insert menu — Insert ▸ Scene feature tests (Part 01 §1.2.4 +
// Part 25.1) + Insert-menu inventory honesty assertions. Engine bridge
// mocked at the same seam every suite uses; bus is real.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMock = vi.hoisted(() => ({
  // registry deps used across commands.ts (only what this suite touches)
  statusJson: vi.fn(() => ({
    doc_id: 1,
    doc_title: 'Doc',
    dirty: false,
    doc_count: 1,
    playhead: 1,
    scene: 'Scene 2',
    active_layer: 0,
    layers: [],
    duration: 1,
    fps: 24,
  })),
  createScene: vi.fn(() => 1),
  setClassicTween: vi.fn(() => true),
  alignSelection: vi.fn(),
  arrangeSelection: vi.fn(),
  copyObjects: vi.fn(),
  cutObjects: vi.fn(),
  deleteSelection: vi.fn(),
  duplicateObjects: vi.fn(),
  flipSelection: vi.fn(),
  pasteObjects: vi.fn(),
  removeTransform: vi.fn(),
  rotateSelection: vi.fn(),
}))
vi.mock('./engine/client', () => clientMock)

import { bus } from './bus'
import { getCommand } from './commands'
import { menus } from './menus'
import type { CommandContext } from './commands'

function ctx(over: Partial<CommandContext> = {}): CommandContext {
  return {
    notify: vi.fn(),
    getStatus: () => clientMock.statusJson() as never,
    engine: { kind: 'ok', detail: 'mock' },
    ...over,
  } as unknown as CommandContext
}

beforeEach(() => {
  vi.clearAllMocks()
  clientMock.createScene.mockImplementation(() => 1)
})

describe('Insert ▸ Scene (SYS-05 — Part 01 §1.2.4 + Part 25.1)', () => {
  it('is FUNCTIONAL, has NO shortcut (Blueprint "—"), no ellipsis (no dialog)', () => {
    const cmd = getCommand('insert.scene')!
    expect(cmd.status).toBe('FUNCTIONAL')
    expect(cmd.shortcut).toBeUndefined()
    expect(cmd.label).toBe('Scene')
  })

  it('run → ONE engine createScene call + activation feedback with the new name', () => {
    const c = ctx()
    getCommand('insert.scene')!.run(c, undefined)
    expect(clientMock.createScene).toHaveBeenCalledTimes(1)
    expect(c.notify).toHaveBeenCalledWith('scene "Scene 2" created — now active')
  })

  it('engine failure → honest feedback, nothing faked', () => {
    clientMock.createScene.mockImplementation(() => -1)
    const c = ctx()
    getCommand('insert.scene')!.run(c, undefined)
    expect(c.notify).toHaveBeenCalledWith('insert scene: engine not attached')
  })

  it('disabled without a document (enabled contract)', () => {
    const cmd = getCommand('insert.scene')!
    const noDoc = ctx({ getStatus: () => ({ ...clientMock.statusJson(), doc_id: 0 }) as never })
    expect(cmd.enabled!(noDoc)).toBe(false)
    expect(cmd.whyDisabled!(noDoc)).toBe('no document open')
    expect(cmd.enabled!(ctx())).toBe(true)
  })

  it('rapid repeat = independent creates (stateless command)', () => {
    const c = ctx()
    const cmd = getCommand('insert.scene')!
    cmd.run(c, undefined)
    cmd.run(c, undefined)
    cmd.run(c, undefined)
    expect(clientMock.createScene).toHaveBeenCalledTimes(3)
  })

  it('emits NO events from the command layer (the client seam owns document:changed)', () => {
    // the mocked client does not emit; the command must not emit anything itself
    const seen: string[] = []
    const offs = [
      bus.on('document:changed', () => seen.push('document:changed')),
      bus.on('saving:changed', () => seen.push('saving:changed')),
      bus.on('openSet:changed', () => seen.push('openSet:changed')),
    ]
    getCommand('insert.scene')!.run(ctx(), undefined)
    expect(seen).toEqual([])
    offs.forEach((f) => f())
  })
})

describe('Insert menu inventory (honesty — §1.2.4 coverage)', () => {
  it('contains exactly the Blueprint §1.2.4 surface (+ existing frame-op extras)', () => {
    const insert = menus.find((m) => m.id === 'menu.insert')!
    const ids: string[] = []
    const walk = (items: typeof insert.items) =>
      items.forEach((e) => {
        if (e.type === 'command') ids.push(e.id)
        if (e.type === 'submenu') walk(e.items)
      })
    walk(insert.items)
    for (const required of [
      'insert.newSymbol',
      'timeline.insertframe',
      'timeline.keyframe',
      'timeline.blank',
      'insert.motionTween',
      'insert.classicTween',
      'insert.shapeTween',
      'insert.scene',
    ]) {
      expect(ids).toContain(required)
    }
  })

  it('deferred items stay HONESTLY deferred (no dead functional claims)', () => {
    expect(getCommand('insert.motionTween')!.status).toBe('DEFERRED')
    expect(getCommand('insert.shapeTween')!.status).toBe('DEFERRED')
    // functional set
    expect(getCommand('insert.newSymbol')!.status).toBe('FUNCTIONAL')
    expect(getCommand('insert.classicTween')!.status).toBe('FUNCTIONAL')
    expect(getCommand('insert.scene')!.status).toBe('FUNCTIONAL')
    expect(getCommand('timeline.insertframe')!.shortcut).toBe('F5')
    expect(getCommand('timeline.keyframe')!.shortcut).toBe('F6')
    expect(getCommand('timeline.blank')!.shortcut).toBe('F7')
    expect(getCommand('insert.newSymbol')!.shortcut).toBe('Ctrl+F8')
  })
})
