import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from '../bus'
import { WASM_BG_URL, WASM_PKG_URL, loadEngine, resetEngineForTests } from './client'
import {
  createLayer,
  deleteLayer,
  duplicateLayer,
  moveLayer,
  renameLayer,
  setActiveLayer,
  setLayerLocked,
  setLayerOutline,
  setLayerOutlineColor,
  setLayerVisible,
  toggleOtherLayersVisible,
} from './client'

/**
 * SYS-01 §27.1 / INT-0010 — layer mutations must emit the canonical
 * `layer:changed{layerId, op}` (producer MOD-LAYER) IN ADDITION to
 * `document:changed{type:'layer'}`. The payload carries the layer's STABLE id
 * (never the index), and view-state changes (setActiveLayer) must NOT emit it.
 *
 * Wire-faithful fake module (same pattern as client.u64.test.ts) so the tests
 * prove facade → bus wiring, not mocked component behavior.
 */

interface LayerStub {
  id: number
  name: string
  visible: boolean
  locked: boolean
  outline: boolean
  active: boolean
  selected_objects: number
  keyframes: unknown[]
  tweens: unknown[]
}

let layers: LayerStub[]

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
    layers,
    active_layer: 0,
  })
}

const wireModule = {
  default: async (input: unknown) => input,
  kineora_status: () => statusJson(),
  kineora_set_active_layer: () => true,
  kineora_create_layer: () => {
    layers = [
      ...layers,
      { id: 3, name: 'Layer 3', visible: true, locked: false, outline: false, active: false, selected_objects: 0, keyframes: [], tweens: [] },
    ]
    return layers.length - 1
  },
  kineora_delete_layer: (index: number) => {
    layers = layers.filter((_, i) => i !== index)
    return true
  },
  kineora_rename_layer: () => true,
  kineora_set_layer_visible: () => true,
  kineora_set_layer_locked: () => true,
  kineora_set_layer_outline: () => true,
  kineora_set_layer_outline_color: () => true,
  kineora_move_layer: () => true,
  kineora_duplicate_layer: (index: number) => {
    const src = layers[index]
    layers = [
      ...layers.slice(0, index + 1),
      { ...src, id: 9, name: `${src.name} copy`, active: true },
      ...layers.slice(index + 1),
    ]
    return index + 1
  },
  kineora_toggle_other_layers_visible: (exclude: number) => {
    layers = layers.map((l, i) => ({ ...l, visible: i === exclude ? l.visible : !l.visible }))
    return true
  },
}

async function attach(): Promise<void> {
  const fetchImpl = async (url: string) => {
    if (url === WASM_PKG_URL) return new Response('export default async function init(i){ return i }', { status: 200 })
    if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
    throw new Error(`unexpected url ${url}`)
  }
  const status = await loadEngine({ fetchImpl, importImpl: async () => wireModule, createObjectUrl: () => 'blob:fake-layer-events', revokeObjectUrl: () => {} })
  expect(status.kind).toBe('ok')
}

beforeEach(() => {
  resetEngineForTests()
  layers = [
    { id: 1, name: 'Layer 1', visible: true, locked: false, outline: false, active: true, selected_objects: 0, keyframes: [], tweens: [] },
    { id: 2, name: 'Layer 2', visible: true, locked: false, outline: false, active: false, selected_objects: 0, keyframes: [], tweens: [] },
  ]
})

describe('client — layer:changed emission (SYS-01 §27.1 / INT-0010)', () => {
  it('single-layer mutations emit {layerId, op} with the STABLE id', async () => {
    await attach()
    const expectOne = (fn: () => unknown, layerId: number, op: string) => {
      const spy = vi.spyOn(bus, 'emit')
      fn()
      const layerEvents = spy.mock.calls.filter((c) => c[0] === 'layer:changed').map((c) => c[1])
      expect(layerEvents).toEqual([{ layerId, op }])
      spy.mockRestore()
    }
    expectOne(() => setLayerVisible(0, false), 1, 'visible')
    expectOne(() => setLayerLocked(1, true), 2, 'locked')
    expectOne(() => setLayerOutline(0, true), 1, 'outline')
    expectOne(() => setLayerOutlineColor(1, '#00ff00'), 2, 'outlineColor')
    expectOne(() => renameLayer(1, 'Renamed'), 2, 'renamed')
  })

  it('createLayer emits added with the NEW layer id; deleteLayer emits removed with the deleted id', async () => {
    await attach()
    let spy = vi.spyOn(bus, 'emit')
    const idx = createLayer()
    expect(idx).toBe(2)
    expect(spy.mock.calls.filter((c) => c[0] === 'layer:changed')).toEqual([['layer:changed', { layerId: 3, op: 'added' }]])
    spy.mockRestore()

    spy = vi.spyOn(bus, 'emit')
    deleteLayer(0)
    expect(spy.mock.calls.filter((c) => c[0] === 'layer:changed')).toEqual([['layer:changed', { layerId: 1, op: 'removed' }]])
  })

  it('moveLayer emits reordered with the moved layer id; duplicateLayer emits duplicated with the copy id', async () => {
    await attach()
    let spy = vi.spyOn(bus, 'emit')
    moveLayer(0, 1)
    expect(spy.mock.calls.filter((c) => c[0] === 'layer:changed')).toEqual([['layer:changed', { layerId: 1, op: 'reordered' }]])
    spy.mockRestore()

    spy = vi.spyOn(bus, 'emit')
    const newIdx = duplicateLayer(0)
    expect(newIdx).toBe(1)
    expect(spy.mock.calls.filter((c) => c[0] === 'layer:changed')).toEqual([['layer:changed', { layerId: 9, op: 'duplicated' }]])
  })

  it('batch "all others" emits ONE event per layer whose flag flipped', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    toggleOtherLayersVisible(0) // layer 0 excluded; layer 2 (id 2) flips
    const layerEvents = spy.mock.calls.filter((c) => c[0] === 'layer:changed').map((c) => c[1])
    expect(layerEvents).toEqual([{ layerId: 2, op: 'visible' }])
  })

  it('setActiveLayer (view state) NEVER emits layer:changed', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    setActiveLayer(1)
    expect(spy.mock.calls.some((c) => c[0] === 'layer:changed')).toBe(false)
    spy.mockRestore()
  })

  it('emits document:changed{type:layer} alongside layer:changed (H04 refresh)', async () => {
    await attach()
    const spy = vi.spyOn(bus, 'emit')
    setLayerVisible(0, false)
    const types = spy.mock.calls.filter((c) => c[0] === 'document:changed').map((c) => (c[1] as { type: string }).type)
    expect(types).toContain('layer')
  })

  it('no engine → no events (honest no-op)', () => {
    const spy = vi.spyOn(bus, 'emit')
    setLayerVisible(0, false)
    createLayer()
    expect(spy.mock.calls.some((c) => c[0] === 'layer:changed')).toBe(false)
  })
})
