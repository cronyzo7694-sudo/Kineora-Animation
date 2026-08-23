import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from '../bus'
import {
  WASM_BG_URL,
  WASM_PKG_URL,
  copyFrames,
  cutFrames,
  loadEngine,
  pasteFrames,
  resetEngineForTests,
} from './client'

/**
 * BUG B-8 (= BUG-TOOL-011) — `copyFrames` is a CLIPBOARD read: it fills the
 * session frame clipboard and mutates nothing. It must therefore NOT emit
 * `document:changed` (H04 "copy is not a mutation"); cut/paste, which DO
 * mutate, still must. Wire-faithful fake module so the test proves the
 * facade → bus wiring, not mocked component behavior.
 */

const calls: string[] = []

function statusJson(): string {
  return JSON.stringify({
    playhead: 1,
    selection: [],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    fps: 24,
    event_log: [],
    layers: [
      { id: 1, name: 'Layer 1', visible: true, locked: false, outline: false, active: true, selected_objects: 0, keyframes: [], tweens: [] },
    ],
    active_layer: 0,
  })
}

const wireModule = {
  default: async (input: unknown) => input,
  kineora_status: () => statusJson(),
  kineora_copy_frames: (layer: number, start: number, end: number) => {
    calls.push(`copy:${layer}:${start}:${end}`)
    return true
  },
  kineora_cut_frames: () => {
    calls.push('cut')
    return true
  },
  kineora_paste_frames: () => {
    calls.push('paste')
    return true
  },
}

async function attach(): Promise<void> {
  const fetchImpl = async (url: string) => {
    if (url === WASM_PKG_URL) return new Response('export default async function init(i){ return i }', { status: 200 })
    if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
    throw new Error(`unexpected url ${url}`)
  }
  const status = await loadEngine({ fetchImpl, importImpl: async () => wireModule, createObjectUrl: () => 'blob:fake-frame-clipboard', revokeObjectUrl: () => {} })
  expect(status.kind).toBe('ok')
}

beforeEach(() => {
  resetEngineForTests()
  calls.length = 0
})

describe('client — frame clipboard events (BUG B-8)', () => {
  it('copyFrames reaches the engine but emits NO document:changed', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    expect(copyFrames(0, 3, 6)).toBe(true)
    expect(calls).toEqual(['copy:0:3:6'])
    expect(spy.mock.calls.filter((c) => c[0] === 'document:changed')).toEqual([])
    spy.mockRestore()
  })

  it('cutFrames and pasteFrames DO emit document:changed (they mutate)', async () => {
    await attach()
    let spy = vi.spyOn(bus, 'emit')
    expect(cutFrames(0, 3, 6)).toBe(true)
    expect(spy.mock.calls.filter((c) => c[0] === 'document:changed')).toHaveLength(1)
    spy.mockRestore()

    spy = vi.spyOn(bus, 'emit')
    expect(pasteFrames(0, 3)).toBe(true)
    expect(spy.mock.calls.filter((c) => c[0] === 'document:changed')).toHaveLength(1)
    spy.mockRestore()
  })
})
