import { beforeEach, describe, expect, it } from 'vitest'
import {
  WASM_BG_URL,
  WASM_PKG_URL,
  activeDocId,
  closeDoc,
  convertToSymbol,
  deleteSymbol,
  docCount,
  docList,
  drawRect,
  loadEngine,
  newDocFull,
  newSymbol,
  openDocJson,
  placeSymbol,
  renameSymbol,
  resetEngineForTests,
  setActiveDoc,
  setDocTitle,
  setInstanceLoop,
  swapInstance,
} from './client'

/**
 * Regression tests for the SYS-02 H01 manual-QA failure on the native
 * desktop: TABS WOULD NOT SWITCH (and tab-close / symbol-id ops would have
 * failed too).
 *
 * ROOT CAUSE: wasm-bindgen crosses every Rust `u64` as a JS `bigint`.
 *   - a u64 PARAMETER given a plain number throws TypeError AT THE BOUNDARY
 *     (React swallowed it in the click handler → the user saw "nothing
 *     happens on tab click"), and
 *   - a u64 RETURN arrives as bigint, silently breaking `===` comparisons
 *     against the plain numbers produced by JSON-parsed status/doc lists.
 *
 * Mocked UI tests could never catch this (continuity lesson #9: mocks prove
 * wiring, not engine integration). These tests instead load the client
 * against a WIRE-FAITHFUL fake module — one that enforces the REAL
 * wasm-bindgen u64 contract — so a regression here fails the suite.
 */

/** Wrap a fake wire fn so it behaves like REAL wasm-bindgen glue: any u64
 *  parameter index receives a non-bigint → TypeError, exactly like the Web
 *  API does for i64/u64 parameters. */
function withBigintParams<F extends (...args: never[]) => unknown>(fn: F, ...paramIdx: number[]): F {
  const wrapped = (...args: unknown[]) => {
    for (const i of paramIdx) {
      if (typeof args[i] !== 'bigint') {
        throw new TypeError(`u64 wire param ${i} expects bigint, got ${typeof args[i]}`)
      }
    }
    return fn(...(args as never[]))
  }
  return wrapped as unknown as F
}

/** Wire-faithful module: u64 params REQUIRE bigint; u64 returns ARE bigint. */
const wireModule = {
  default: async (input: unknown) => input,
  kineora_new_default: () => true,
  kineora_status: () =>
    JSON.stringify({ playhead: 1, selection: [], undo_len: 0, redo_len: 0, scene: 'Scene 1', layer: 'Layer 1', fps: 24, event_log: [] }),
  // — u64 returns arrive as bigint —
  kineora_new_full: (_settingsJson: string) => 7n,
  kineora_active_doc_id: () => 5n,
  kineora_open_json: (_json: string, _title: string) => 9n,
  kineora_draw_rect: (_x: number, _y: number, _w: number, _h: number, _fill: string) => 33n,
  kineora_convert_to_symbol: (_name: string, _type: string, _grid: number) => 41n,
  kineora_new_symbol: (_name: string, _type: string) => 42n,
  // — u64 params require bigint (plain number ⇒ TypeError, like the real glue) —
  kineora_set_active_doc: withBigintParams((id: bigint) => id === 4n, 0),
  kineora_close_doc: withBigintParams((_id: bigint) => true, 0),
  kineora_set_doc_title: withBigintParams((_id: bigint, _title: string) => true, 0),
  kineora_place_symbol: withBigintParams((_symbolId: bigint, _x: number, _y: number) => 55n, 0),
  kineora_rename_symbol: withBigintParams((_symbolId: bigint, _name: string) => true, 0),
  kineora_delete_symbol: withBigintParams((_symbolId: bigint, _breakApart: boolean) => true, 0),
  kineora_swap_instance: withBigintParams((_i: bigint, _s: bigint) => true, 0, 1),
  kineora_set_instance_loop: withBigintParams((_i: bigint, _mode: string, _first: number) => true, 0),
  // — plain-number members stay plain —
  kineora_doc_count: () => 2,
  kineora_doc_list: () =>
    JSON.stringify([
      { id: 4, title: 'A', dirty: false },
      { id: 5, title: 'B', dirty: true },
    ]),
  kineora_mark_clean: () => true,
}

async function attachWireModule(): Promise<void> {
  const fetchImpl = async (url: string) => {
    if (url === WASM_PKG_URL) return new Response('export default async function init(i){ return i }', { status: 200 })
    if (url === WASM_BG_URL) return new Response(new ArrayBuffer(8), { status: 200 })
    throw new Error(`unexpected url ${url}`)
  }
  const status = await loadEngine({
    fetchImpl,
    importImpl: async () => wireModule,
    createObjectUrl: () => 'blob:fake-u64-module',
    revokeObjectUrl: () => {},
  })
  expect(status.kind).toBe('ok')
}

describe('u64 bridge conversion (SYS-02 H01 desktop tab-switch failure regression)', () => {
  beforeEach(() => resetEngineForTests())

  it('converts plain-number ids → bigint u64 params (tab switch / close / title)', async () => {
    await attachWireModule()
    // The manual-QA failure: each of these threw TypeError at the wire and
    // the click handler swallowed it — the tab never switched.
    expect(setActiveDoc(4)).toBe(true)
    expect(closeDoc(5)).toBe(true)
    expect(setDocTitle(4, 'Renamed')).toBe(true)
  })

  it('converts bigint u64 returns → plain numbers, === comparable with JSON ids', async () => {
    await attachWireModule()
    expect(
      newDocFull({ width: 1920, height: 1080, fps: 24, background: '#ffffff', units: 'px', platform: 'html5' }),
    ).toBe(7)
    expect(openDocJson('{}', 'Seed')).toBe(9)
    // the killer comparison: bigint 5n === number 5 is false — the facade
    // must downgrade the wire bigint to a plain number.
    expect(activeDocId()).toBe(5)
    expect(activeDocId() === docList()[1].id).toBe(true)
  })

  it('converts symbol-id u64 params and returns (library/symbol ops)', async () => {
    await attachWireModule()
    expect(convertToSymbol('Head', 'graphic', 5)).toBe(41)
    expect(newSymbol('Body', 'graphic')).toBe(42)
    expect(placeSymbol(41, 10, 20)).toBe(55)
    expect(renameSymbol(41, 'Torso')).toBe(true)
    expect(deleteSymbol(41, false)).toBe(true)
    expect(swapInstance(1, 2)).toBe(true)
    expect(setInstanceLoop(55, 'loop', 1)).toBe(true)
  })

  it('converts node-id u64 returns (drawRect); plain-u32 members untouched', async () => {
    await attachWireModule()
    expect(drawRect(0, 0, 10, 10, '#ff0000')).toBe(33)
    expect(docCount()).toBe(2)
    expect(docList().map((d) => d.id)).toEqual([4, 5])
  })
})
