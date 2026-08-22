import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from '../bus'
import {
  WASM_BG_URL,
  WASM_PKG_URL,
  loadEngine,
  redo,
  resetEngineForTests,
  undo,
} from './client'

/**
 * SYS-03 H01 §9 / INT-AIA-003 — undo/redo must emit the locked
 * `selection:changed{prevTargets,targets}` after `document:changed`.
 * Facade-level only (wire-faithful fake module); engine restore is covered
 * by animator/core/tests/undo_selection.rs.
 */

let selection: number[] = []

function statusJson(): string {
  return JSON.stringify({
    playhead: 1,
    selection,
    undo_len: 1,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    fps: 24,
    event_log: [],
    layers: [],
    active_layer: 0,
  })
}

const wireModule = {
  default: async (input: unknown) => input,
  kineora_status: () => statusJson(),
  kineora_undo: () => {
    selection = [2]
    return true
  },
  kineora_redo: () => {
    selection = [3]
    return true
  },
  kineora_select_at: () => {
    selection = [9]
    return true
  },
  kineora_select_toggle_at: () => {
    selection = [1, 9]
    return true
  },
  kineora_select_in_rect: () => {
    selection = [4, 5]
  },
}

async function attach(): Promise<void> {
  const fetchImpl = async (url: string) => {
    if (url === WASM_PKG_URL) {
      return new Response('export default async function init(i){ return i }', { status: 200 })
    }
    if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
    throw new Error(`unexpected url ${url}`)
  }
  const status = await loadEngine({
    fetchImpl,
    importImpl: async () => wireModule,
    createObjectUrl: () => 'blob:fake-undo-selection',
    revokeObjectUrl: () => {},
  })
  expect(status.kind).toBe('ok')
}

beforeEach(() => {
  resetEngineForTests()
  selection = [1]
})

describe('client — undo/redo emit selection:changed (H01 §9 / INT-AIA-003)', () => {
  it('undo emits document:changed then selection:changed with prev/post targets', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    expect(undo()).toBe(true)
    const events = spy.mock.calls.map((c) => [c[0], c[1]])
    expect(events).toEqual([
      ['document:changed', { type: 'undo', targets: [] }],
      [
        'selection:changed',
        expect.objectContaining({ prevTargets: [1], targets: [2], kind: 'objects', bounds: null }),
      ],
    ])
  })

  it('redo emits document:changed then selection:changed with prev/post targets', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    expect(redo()).toBe(true)
    const events = spy.mock.calls.map((c) => [c[0], c[1]])
    expect(events).toEqual([
      ['document:changed', { type: 'redo', targets: [] }],
      [
        'selection:changed',
        expect.objectContaining({ prevTargets: [1], targets: [3], kind: 'objects', bounds: null }),
      ],
    ])
  })

  it('empty undo is a no-op (no events)', async () => {
    await attach()
    wireModule.kineora_undo = () => false
    const spy = vi.spyOn(bus, 'emit')
    expect(undo()).toBe(false)
    expect(spy).not.toHaveBeenCalled()
    wireModule.kineora_undo = () => {
      selection = [2]
      return true
    }
  })

  it('no engine → no events (honest no-op)', () => {
    const spy = vi.spyOn(bus, 'emit')
    expect(undo()).toBe(false)
    expect(redo()).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('client — view selection emits selection:changed only', () => {
  it('selectAt emits selection:changed and never document:changed', async () => {
    const { selectAt } = await import('./client')
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    selectAt(1, 1)
    const names = spy.mock.calls.map((c) => c[0])
    expect(names).toContain('selection:changed')
    expect(names).not.toContain('document:changed')
  })

  it('selectToggleAt / selectInRect emit selection:changed and never document:changed', async () => {
    const { selectToggleAt, selectInRect } = await import('./client')
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    selectToggleAt(2, 2)
    selectInRect(0, 0, 10, 10)
    const names = spy.mock.calls.map((c) => c[0])
    expect(names.filter((n) => n === 'selection:changed')).toHaveLength(2)
    expect(names).not.toContain('document:changed')
  })
})
