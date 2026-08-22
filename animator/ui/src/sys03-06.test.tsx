import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getCommand, makeCommandContext, validateCommands, commands } from './commands'
import { menus, type MenuEntry } from './menus'
import { bus } from './bus'
import {
  copyObjects,
  cutObjects,
  pasteObjects,
  rotateSelection,
  resetEngineForTests,
  loadEngine,
  WASM_PKG_URL,
  WASM_BG_URL,
} from './engine/client'
import { resetViewPrefsForTests, loadViewPrefs } from './viewPrefs'

function* walk(entries: MenuEntry[]): Generator<MenuEntry> {
  for (const e of entries) {
    yield e
    if (e.type === 'submenu') yield* walk(e.items)
  }
}

let wireSelection = [1]
const wire = {
  default: async (input: unknown) => input,
  kineora_status: () =>
    JSON.stringify({
      playhead: 1,
      selection: wireSelection,
      object_clipboard_len: 1,
      undo_len: 0,
      redo_len: 0,
      scene: 'Scene 1',
      layer: 'Layer 1',
      fps: 24,
      event_log: [],
      doc_id: 1,
    }),
  kineora_evaluate: () => '[]',
  kineora_copy_objects: () => true,
  kineora_cut_objects: () => {
    wireSelection = []
    return true
  },
  kineora_paste_objects: () => true,
  kineora_delete_selection: () => true,
  kineora_duplicate_objects: () => true,
  kineora_rotate_selection: () => true,
  kineora_flip_selection: () => true,
  kineora_remove_transform: () => true,
  kineora_arrange_selection: () => true,
  kineora_align_selection: () => true,
  kineora_set_classic_tween: () => true,
}

async function attach(): Promise<void> {
  const status = await loadEngine({
    fetchImpl: async (url: string) => {
      if (url === WASM_PKG_URL) return new Response('export default async function init(i){ return i }', { status: 200 })
      if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
      throw new Error(url)
    },
    importImpl: async () => wire,
    createObjectUrl: () => 'blob:fake-sys03',
    revokeObjectUrl: () => {},
  })
  expect(status.kind).toBe('ok')
}

beforeEach(() => {
  resetEngineForTests()
  resetViewPrefsForTests()
  bus.clear()
  vi.clearAllMocks()
  wireSelection = [1]
})

describe('SYS-03/04/06 command registry', () => {
  it('registry stays valid after the SYS-03/04/06 promotions', () => {
    expect(validateCommands(commands)).toEqual([])
  })

  it('Edit clipboard + Modify transform/arrange/align + View overlays are FUNCTIONAL', () => {
    for (const id of [
      'edit.cut',
      'edit.copy',
      'edit.paste',
      'edit.delete',
      'edit.duplicate',
      'edit.findReplace',
      'view.rulers',
      'view.grid',
      'view.hideEdges',
      'view.workArea',
      'view.previewFull',
      'view.previewOutline',
      'insert.classicTween',
      'modify.transformRotate90cw',
      'modify.transformRotate90ccw',
      'modify.transformFlipH',
      'modify.transformFlipV',
      'modify.transformRemove',
      'modify.arrangeFront',
      'modify.arrangeForward',
      'modify.arrangeBackward',
      'modify.arrangeBack',
      'modify.align',
    ]) {
      expect(getCommand(id)?.status, id).toBe('FUNCTIONAL')
    }
  })

  it('SYS-07 Text commands stay DEFERRED with a reason (no text node in the model)', () => {
    for (const c of commands.filter((x) => x.id.startsWith('text.'))) {
      expect(c.status, c.id).toBe('DEFERRED')
      expect(c.reason).toMatch(/text engine/i)
    }
  })

  it('shape/boolean/group/find/prefs stay DEFERRED (unspecified or owned elsewhere)', () => {
    for (const id of [
      'edit.preferences',
      'view.guides',
      'view.snapping',
      'insert.motionTween',
      'insert.shapeTween',
      // insert.scene → FUNCTIONAL since the SYS-05 Insert▸Scene increment
      // (AI-D, INT-AID-006) — removed from the deferred inventory.
      'modify.group',
      'modify.ungroup',
      'modify.combineUnion',
      'modify.breakApart',
    ]) {
      expect(getCommand(id)?.status, id).toBe('DEFERRED')
      expect(getCommand(id)?.reason, id).toBeTruthy()
    }
  })

  it('Modify ▸ Align menu entries all resolve to modify.align with an input', () => {
    const modify = menus.find((m) => m.id === 'menu.modify')!
    const align = [...walk(modify.items)].filter((e) => e.type === 'command' && e.id === 'modify.align') as Array<{
      type: 'command'
      id: string
      input?: unknown
    }>
    expect(align.map((e) => e.input)).toEqual(['left', 'centerH', 'right', 'top', 'middleV', 'bottom'])
  })
})

describe('SYS-03/06 command execution (wire-faithful)', () => {
  it('copy does NOT emit document:changed (session state)', async () => {
    await attach()
    const events: string[] = []
    const off = bus.on('document:changed', (p) => events.push(p.type))
    expect(copyObjects()).toBe(true)
    off()
    expect(events).toEqual([])
  })

  it('cut / paste / rotate emit document:changed', async () => {
    await attach()
    const events: string[] = []
    const off = bus.on('document:changed', (p) => events.push(p.type))
    expect(cutObjects()).toBe(true)
    expect(pasteObjects('center')).toBe(true)
    expect(rotateSelection(90)).toBe(true)
    off()
    expect(events).toEqual(['edit', 'edit', 'transform'])
  })

  it('edit.copy / edit.paste run the engine facades (not a no-op)', async () => {
    await attach()
    const notes: string[] = []
    const ctx = makeCommandContext({
      notify: (m) => notes.push(m),
      engine: { kind: 'ok', detail: '' },
      getStatus: () => ({ selection: [1], object_clipboard_len: 1, playhead: 1 } as never),
    })
    getCommand('edit.copy')!.run(ctx)
    getCommand('edit.paste')!.run(ctx)
    expect(notes.some((n) => n.startsWith('copy:'))).toBe(true)
    expect(notes.some((n) => n.startsWith('paste:'))).toBe(true)
  })

  it('view.grid toggle is view-only (no document:changed)', () => {
    const events: string[] = []
    const off = bus.on('document:changed', (p) => events.push(p.type))
    const notes: string[] = []
    getCommand('view.grid')!.run(makeCommandContext({ notify: (m) => notes.push(m) }))
    off()
    expect(loadViewPrefs().grid).toBe(true)
    expect(events).toEqual([])
    expect(notes[0]).toBe('grid: on')
  })

  it('modify.align without input does not invent an operation', () => {
    const notes: string[] = []
    getCommand('modify.align')!.run(
      makeCommandContext({
        notify: (m) => notes.push(m),
        engine: { kind: 'ok', detail: '' },
        getStatus: () => ({ selection: [1] } as never),
      }),
    )
    expect(notes[0]).toMatch(/pick an operation/)
  })
})
