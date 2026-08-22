// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// PURE PAYLOAD TESTS (no engine): buildSelectionPayload computes the full
// SYS-14 `selection:changed` payload from a StatusJson snapshot.
// ---------------------------------------------------------------------------
import { buildSelectionPayload } from './client'
import type { StatusJson } from './wasmTypes'

function status(partial: Partial<StatusJson>): StatusJson {
  return {
    playhead: 1,
    selection: [],
    selection_rects: [],
    selection_details: [],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    layers: [],
    active_layer: 0,
    fps: 24,
    doc_id: 1,
    doc_width: 800,
    doc_height: 600,
    duration: 1,
    background: '#ffffff',
    background_alpha: 1,
    event_log: [],
    ...partial,
  } as StatusJson
}

describe('SYS-14 buildSelectionPayload (Part 03 §3.9 / SYS-01 §27.1)', () => {
  it('empty selection → kind none, bounds null, no commonType', () => {
    const p = buildSelectionPayload([], status({ selection: [] }))
    expect(p).toEqual({ prevTargets: [], targets: [], kind: 'none', bounds: null })
  })

  it('single selection → kind objects, commonType = that kind, bounds = its rect', () => {
    const p = buildSelectionPayload(
      [],
      status({
        selection: [7],
        selection_details: [{ id: 7, kind: 'rect' } as never],
        selection_rects: [{ id: 7, x: 10, y: 20, w: 30, h: 40, rotation: 0 }],
      }),
    )
    expect(p.kind).toBe('objects')
    expect(p.targets).toEqual([7])
    expect(p.commonType).toBe('rect')
    expect(p.bounds).toEqual({ x: 10, y: 20, w: 30, h: 40 })
  })

  it('multiple same-type selection → commonType shared; bounds = union AABB', () => {
    const p = buildSelectionPayload(
      [1],
      status({
        selection: [7, 8],
        selection_details: [
          { id: 7, kind: 'rect' } as never,
          { id: 8, kind: 'rect' } as never,
        ],
        selection_rects: [
          { id: 7, x: 0, y: 0, w: 10, h: 10, rotation: 0 },
          { id: 8, x: 5, y: 5, w: 10, h: 10, rotation: 0 },
        ],
      }),
    )
    expect(p.prevTargets).toEqual([1])
    expect(p.targets).toEqual([7, 8])
    expect(p.commonType).toBe('rect')
    // union of [0,0]-[10,10] and [5,5]-[15,15]
    expect(p.bounds).toEqual({ x: 0, y: 0, w: 15, h: 15 })
  })

  it('mixed-type selection (rect + instance) → commonType omitted; bounds still union', () => {
    const p = buildSelectionPayload(
      [],
      status({
        selection: [7, 9],
        selection_details: [
          { id: 7, kind: 'rect' } as never,
          { id: 9, kind: 'instance' } as never,
        ],
        selection_rects: [
          { id: 7, x: 100, y: 100, w: 20, h: 20, rotation: 0 },
          { id: 9, x: 110, y: 110, w: 5, h: 5, rotation: 0 },
        ],
      }),
    )
    expect(p.commonType).toBeUndefined()
    expect(p.bounds).toEqual({ x: 100, y: 100, w: 20, h: 20 })
  })

  it('union bounds work with non-zero origin and negative extents', () => {
    const p = buildSelectionPayload(
      [],
      status({
        selection: [1, 2],
        selection_details: [
          { id: 1, kind: 'rect' } as never,
          { id: 2, kind: 'rect' } as never,
        ],
        selection_rects: [
          { id: 1, x: -50, y: -30, w: 20, h: 10, rotation: 0 },
          { id: 2, x: 100, y: 200, w: 40, h: 50, rotation: 0 },
        ],
      }),
    )
    expect(p.bounds).toEqual({ x: -50, y: -30, w: 190, h: 280 })
  })

  it('targets present but details missing → commonType omitted, bounds from rects', () => {
    const p = buildSelectionPayload(
      [],
      status({
        selection: [42],
        selection_details: [],
        selection_rects: [{ id: 42, x: 1, y: 2, w: 3, h: 4, rotation: 0 }],
      }),
    )
    expect(p.commonType).toBeUndefined()
    expect(p.bounds).toEqual({ x: 1, y: 2, w: 3, h: 4 })
  })
})

// ---------------------------------------------------------------------------
// PRODUCER TESTS (with a fake wasm module): each selection gesture emits
// selection:changed ONCE with the full payload. Existing consumers that only
// read .targets continue to work (additive payload).
// ---------------------------------------------------------------------------

const busEmit = vi.fn()
vi.mock('../bus', () => ({
  bus: { emit: (...a: unknown[]) => busEmit(...a) },
}))

const modState: { selection: number[]; rects: Array<{ id: number; x: number; y: number; w: number; h: number; rotation: number }>; details: Array<{ id: number; kind: string }> } = {
  selection: [],
  rects: [],
  details: [],
}

function makeStatus() {
  return status({
    selection: modState.selection,
    selection_rects: modState.rects,
    selection_details: modState.details as never,
  })
}

// Replace the wasm module + statusJson the client uses, then re-import.
vi.mock('./wasmTypes', async () => {
  const actual = await vi.importActual<typeof import('./wasmTypes')>('./wasmTypes')
  return { ...actual }
})

// Minimal fake module; we set process.statusJson via the loader seam.
const clientMod = await import('./client')
const modMock = {
  kineora_select_at: vi.fn((x: number, y: number) => {
    modState.selection = [1]
    modState.rects = [{ id: 1, x, y, w: 10, h: 10, rotation: 0 }]
    modState.details = [{ id: 1, kind: 'rect' }]
    return true
  }),
  kineora_select_toggle_at: vi.fn(() => {
    if (modState.selection.includes(2)) {
      modState.selection = [1]
      modState.rects = modState.rects.filter((r) => r.id !== 2)
      modState.details = modState.details.filter((d) => d.id !== 2)
    } else {
      modState.selection = [1, 2]
      modState.rects = [
        { id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0 },
        { id: 2, x: 20, y: 20, w: 10, h: 10, rotation: 0 },
      ]
      modState.details = [
        { id: 1, kind: 'rect' },
        { id: 2, kind: 'instance' },
      ]
    }
    return true
  }),
  kineora_select_in_rect: vi.fn(() => {
    modState.selection = [1, 2]
    modState.rects = [
      { id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0 },
      { id: 2, x: 20, y: 20, w: 10, h: 10, rotation: 0 },
    ]
    modState.details = [
      { id: 1, kind: 'rect' },
      { id: 2, kind: 'rect' },
    ]
  }),
  kineora_select_all: vi.fn(() => {
    modState.selection = [1, 2, 3]
    modState.rects = [
      { id: 1, x: 0, y: 0, w: 5, h: 5, rotation: 0 },
      { id: 2, x: 10, y: 10, w: 5, h: 5, rotation: 0 },
      { id: 3, x: 20, y: 20, w: 5, h: 5, rotation: 0 },
    ]
    modState.details = [
      { id: 1, kind: 'rect' },
      { id: 2, kind: 'rect' },
      { id: 3, kind: 'rect' },
    ]
  }),
  kineora_clear_selection: vi.fn(() => {
    modState.selection = []
    modState.rects = []
    modState.details = []
  }),
  kineora_delete_selection: vi.fn(() => {
    if (modState.selection.length === 0) return false
    modState.selection = []
    modState.rects = []
    modState.details = []
    return true
  }),
  kineora_paste_objects: vi.fn(() => {
    modState.selection = [99]
    modState.rects = [{ id: 99, x: 0, y: 0, w: 8, h: 8, rotation: 0 }]
    modState.details = [{ id: 99, kind: 'rect' }]
    return true
  }),
  kineora_duplicate_objects: vi.fn(() => {
    modState.selection = [1, 100]
    modState.rects = [
      { id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0 },
      { id: 100, x: 12, y: 0, w: 10, h: 10, rotation: 0 },
    ]
    modState.details = [
      { id: 1, kind: 'rect' },
      { id: 100, kind: 'rect' },
    ]
    return true
  }),
  kineora_cut_objects: vi.fn(() => {
    modState.selection = []
    modState.rects = []
    modState.details = []
    return true
  }),
}

let restore: (() => void) | null = null
beforeEach(() => {
  busEmit.mockClear()
  modState.selection = []
  modState.rects = []
  modState.details = []
  restore = clientMod.__attachEngineForTest(modMock as never, makeStatus)
})
afterEach(() => {
  restore?.()
  restore = null
  vi.restoreAllMocks()
})

describe('SYS-14 selection producers emit once per gesture with full payload', () => {
  it('selectAt emits selection:changed with kind/commonType/bounds', () => {
    clientMod.selectAt(30, 40)
    expect(busEmit).toHaveBeenCalledTimes(1)
    const [evt, payload] = busEmit.mock.calls[0]
    expect(evt).toBe('selection:changed')
    expect(payload.targets).toEqual([1])
    expect(payload.kind).toBe('objects')
    expect(payload.commonType).toBe('rect')
    expect(payload.bounds).toMatchObject({ x: 30, y: 40, w: 10, h: 10 })
  })

  it('selectToggleAt (mixed) emits once with commonType omitted', () => {
    // pre-select 1 then toggle 2 (instance)
    modState.selection = [1]
    modState.rects = [{ id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0 }]
    modState.details = [{ id: 1, kind: 'rect' }]
    clientMod.selectToggleAt(0, 0)
    expect(busEmit).toHaveBeenCalledTimes(1)
    const payload = busEmit.mock.calls[0][1]
    expect(payload.targets).toEqual([1, 2])
    expect(payload.commonType).toBeUndefined()
  })

  it('selectInRect emits once with union bounds + same-type commonType', () => {
    clientMod.selectInRect(0, 0, 100, 100)
    expect(busEmit).toHaveBeenCalledTimes(1)
    const payload = busEmit.mock.calls[0][1]
    expect(payload.targets).toEqual([1, 2])
    expect(payload.commonType).toBe('rect')
    expect(payload.bounds).toEqual({ x: 0, y: 0, w: 30, h: 30 })
  })

  it('clearSelection emits kind none + bounds null', () => {
    modState.selection = [1]
    clientMod.clearSelection()
    expect(busEmit).toHaveBeenCalledTimes(1)
    expect(busEmit.mock.calls[0][1]).toMatchObject({ targets: [], kind: 'none', bounds: null })
  })

  it('selectAll emits once with all targets + union bounds', () => {
    clientMod.selectAll()
    expect(busEmit).toHaveBeenCalledTimes(1)
    const payload = busEmit.mock.calls[0][1]
    expect(payload.targets).toEqual([1, 2, 3])
    expect(payload.bounds).toEqual({ x: 0, y: 0, w: 25, h: 25 })
  })

  it('deleteSelection emits selection:changed with empty targets (and no event when nothing selected)', () => {
    modState.selection = [1]
    modState.rects = [{ id: 1, x: 0, y: 0, w: 10, h: 10, rotation: 0 }]
    modState.details = [{ id: 1, kind: 'rect' }]
    busEmit.mockClear()
    expect(clientMod.deleteSelection()).toBe(true)
    const selEvents = busEmit.mock.calls.filter((c) => c[0] === 'selection:changed')
    expect(selEvents).toHaveLength(1)
    expect(selEvents[0][1].targets).toEqual([])
    // document:changed also fires (the deletion mutation) — distinct event.
    expect(busEmit.mock.calls.some((c) => c[0] === 'document:changed')).toBe(true)

    busEmit.mockClear()
    expect(clientMod.deleteSelection()).toBe(false)
    expect(busEmit.mock.calls.filter((c) => c[0] === 'selection:changed')).toHaveLength(0)
  })

  it('paste/duplicate/cut each emit one selection:changed with the new/cleared selection', () => {
    clientMod.pasteObjects('center')
    let sel = busEmit.mock.calls.filter((c) => c[0] === 'selection:changed')
    expect(sel).toHaveLength(1)
    expect(sel[0][1].targets).toEqual([99])

    busEmit.mockClear()
    modState.selection = [1]
    clientMod.duplicateObjects()
    sel = busEmit.mock.calls.filter((c) => c[0] === 'selection:changed')
    expect(sel).toHaveLength(1)
    expect(sel[0][1].targets).toEqual([1, 100])

    busEmit.mockClear()
    clientMod.cutObjects()
    sel = busEmit.mock.calls.filter((c) => c[0] === 'selection:changed')
    expect(sel).toHaveLength(1)
    expect(sel[0][1].targets).toEqual([])
  })

  it('existing consumers reading only .targets still work (additive payload)', () => {
    clientMod.selectAt(5, 5)
    const payload = busEmit.mock.calls[0][1]
    // Old-consumer contract preserved:
    expect(Array.isArray(payload.prevTargets)).toBe(true)
    expect(Array.isArray(payload.targets)).toBe(true)
    // New fields are present but extra fields never break old destructuring.
    expect('kind' in payload).toBe(true)
    expect('bounds' in payload).toBe(true)
  })
})
