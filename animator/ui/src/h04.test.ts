import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from './bus'
import {
  WASM_BG_URL,
  WASM_PKG_URL,
  clearSelection,
  convertToSymbol,
  createLayer,
  deleteLayer,
  deleteSymbol,
  drawRect,
  evaluate,
  exportSvg,
  loadEngine,
  moveSelection,
  newSymbol,
  patchTransforms,
  redo,
  renameLayer,
  renameSymbol,
  selectAt,
  selectAll,
  setDocumentSettings,
  setFrameLabel,
  setInstanceLoop,
  setLayerLocked,
  setLayerVisible,
  setPlayhead,
  setActiveLayer,
  setNodeProps,
  swapInstance,
  transformSelection,
  undo,
  resetEngineForTests,
} from './engine/client'

/**
 * H04 §10 — `document:changed` emission contract, tested against the REAL
 * client (a wire-faithful fake module is injected — see client.u64.test.ts
 * for the pattern). This proves WHICH calls emit:
 *   - every DOCUMENT mutation emits post-do (edit/frame/tween/symbol/layer/
 *     transform/settings + undo/redo — T6/T7: undo/redo are mutations too)
 *   - VIEW/SESSION ops (selection, playhead, active layer) NEVER emit
 *   - FILE-SYSTEM ops (export, markClean via save) never emit document:changed
 *   - no engine attached ⇒ no event (honest fallback)
 */

const wireModule = {
  default: async (input: unknown) => input,
  kineora_status: () =>
    JSON.stringify({ playhead: 1, selection: [], undo_len: 1, redo_len: 1, scene: 'Scene 1', layer: 'Layer 1', fps: 24, event_log: [] }),
  kineora_evaluate: () => '[]',
  kineora_draw_rect: () => 7n,
  kineora_undo: () => true,
  kineora_redo: () => true,
  kineora_insert_keyframe: () => true,
  kineora_set_frame_label: () => true,
  kineora_set_classic_tween: () => true,
  kineora_convert_to_symbol: () => 11n,
  kineora_new_symbol: () => 12n,
  kineora_rename_symbol: (id: bigint, name: string) => id === 11n && name === 'r',
  kineora_delete_symbol: () => true,
  kineora_swap_instance: () => true,
  kineora_set_instance_loop: () => true,
  kineora_transform_selection: () => undefined,
  kineora_move_selection: () => undefined,
  kineora_patch_transforms: () => undefined,
  kineora_set_node_props: () => undefined,
  kineora_set_document_settings: () => true,
  kineora_create_layer: () => 2,
  kineora_delete_layer: () => true,
  kineora_rename_layer: () => true,
  kineora_set_layer_visible: () => true,
  kineora_set_layer_locked: () => true,
  kineora_select_at: () => true,
  kineora_select_all: () => undefined,
  kineora_clear_selection: () => undefined,
  kineora_set_playhead: () => undefined,
  kineora_set_active_layer: () => true,
  kineora_export_svg: () => '<svg/>',
}

async function attach(): Promise<void> {
  const fetchImpl = async (url: string) => {
    if (url === WASM_PKG_URL) return new Response('export default async function init(i){ return i }', { status: 200 })
    if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
    throw new Error(`unexpected url ${url}`)
  }
  const status = await loadEngine({
    fetchImpl,
    importImpl: async () => wireModule,
    createObjectUrl: () => 'blob:fake-h04-module',
    revokeObjectUrl: () => {},
  })
  expect(status.kind).toBe('ok')
}

function captureDocEvents(): { events: Array<{ type: string; targets: number[] }>; stop: () => void } {
  const events: Array<{ type: string; targets: number[] }> = []
  const off = bus.on('document:changed', (p) => events.push({ type: p.type, targets: p.targets }))
  return { events, stop: () => off() }
}

beforeEach(() => {
  resetEngineForTests()
  bus.clear()
  vi.clearAllMocks()
})

describe('H04 §10 — document:changed is emitted for every DOCUMENT mutation (post-do)', () => {
  it('draw / transform / move / patch / node-props emit', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    drawRect(0, 0, 10, 10, '#ff0000')
    transformSelection([{ id: 1, x: 5 }])
    moveSelection(3, -2)
    patchTransforms([{ id: 1, x: 5 }])
    setNodeProps([{ id: 1 } as never])
    stop()
    expect(events.map((e) => e.type)).toEqual(['draw', 'transform', 'transform', 'transform', 'transform'])
  })

  it('frame / tween / label ops emit', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    // insertKeyframe + setFrameLabel + setClassicTween (the wire fakes all succeed)
    const { insertKeyframe } = await import('./engine/client')
    insertKeyframe(5)
    setFrameLabel(0, 5, 'K')
    const { setClassicTween } = await import('./engine/client')
    setClassicTween(0, 1, 5, 0)
    stop()
    expect(events.map((e) => e.type)).toEqual(['frame', 'frame', 'tween'])
  })

  it('symbol ops emit (id-bearing + boolean wrappers)', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    expect(newSymbol('S', 'graphic')).toBe(12)
    expect(convertToSymbol('C', 'graphic', 4)).toBe(11)
    expect(swapInstance(1, 11)).toBe(true)
    expect(setInstanceLoop(1, 'loop', 1)).toBe(true)
    expect(renameSymbol(11, 'r')).toBe(true)
    expect(deleteSymbol(11, false)).toBe(true)
    stop()
    expect(events.map((e) => e.type)).toEqual(['symbol', 'symbol', 'symbol', 'symbol', 'symbol', 'symbol'])
  })

  it('layer ops emit', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    expect(createLayer()).toBe(2)
    expect(deleteLayer(1)).toBe(true)
    expect(renameLayer(0, 'L2')).toBe(true)
    expect(setLayerVisible(0, false)).toBe(true)
    expect(setLayerLocked(0, true)).toBe(true)
    stop()
    expect(events.map((e) => e.type)).toEqual(['layer', 'layer', 'layer', 'layer', 'layer'])
  })

  it('settings mutations emit', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    setDocumentSettings({ fps: 30 } as never)
    stop()
    expect(events.map((e) => e.type)).toEqual(['settings'])
  })

  it('undo / redo emit (they ARE document mutations — T6/T7)', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    undo()
    redo()
    stop()
    expect(events.map((e) => e.type)).toEqual(['undo', 'redo'])
  })

  it('payload is advisory: { type, targets: [] }', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    drawRect(0, 0, 10, 10, '#ff0000')
    stop()
    expect(events).toEqual([{ type: 'draw', targets: [] }])
  })
})

describe('H04 §6.1 — VIEW/SESSION/FILE-SYSTEM ops NEVER emit document:changed', () => {
  it('selection / playhead / active-layer are view state — no event', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    selectAt(5, 5)
    selectAll()
    clearSelection()
    setPlayhead(12)
    setActiveLayer(1)
    stop()
    expect(events).toEqual([])
  })

  it('export / evaluate / status are non-mutating — no event', async () => {
    await attach()
    const { events, stop } = captureDocEvents()
    expect(exportSvg(1)).toBe('<svg/>')
    expect(evaluate(1)).toEqual([])
    stop()
    expect(events).toEqual([])
  })
})

describe('H04 §10 — honest fallback: no engine ⇒ no event', () => {
  it('mutations with no attached engine emit nothing (and are no-ops)', () => {
    // resetEngineForTests() in beforeEach ⇒ mod === null
    const { events, stop } = captureDocEvents()
    drawRect(0, 0, 10, 10, '#ff0000')
    transformSelection([{ id: 1, x: 5 }])
    undo()
    selectAt(1, 1)
    stop()
    expect(events).toEqual([])
  })
})
