// Engine client — the UI's ONLY doorway to the Rust core (IMP-DEC-002).
//
// LOADING MECHANISM (Vite public/ cannot be `import()`ed as a source module):
//   1. fetch the generated ESM glue as TEXT from the canonical public URL
//   2. evaluate it at runtime via a Blob URL (browser-native `import`)
//   3. fetch the `.wasm` binary ourselves and pass it EXPLICITLY to the
//      wasm-bindgen default init, so the glue never relies on `new URL(…,
//      import.meta.url)` (which breaks under a blob: base).
//
// Why this matches the generated package (wasm-bindgen `--target web`):
//   - the package is a self-contained ESM: `kineora_core.js` (glue) +
//     `kineora_core_bg.wasm` (binary), no `_bg.js` import
//   - its default export is the async init; it accepts an explicit
//     ArrayBuffer/Response and instantiates from it; only when called with NO
//     argument does it resolve the `.wasm` relative to `import.meta.url`
// [ASSUMPTION: standard wasm-bindgen --target web contract, stable across 0.2.x]
//
// Honest fallback: if the package is missing/unbuildable, status stays an
// explicit error naming the exact URL + the build command — never a fake
// "attached" state (no-fake-features rule).

import type { EngineStatus } from '../commands'
import { bus } from '../bus'
import type { LayerOp } from '../bus'
import type {
  KineoraWasm,
  LibraryItemJson,
  NodePropsPatchJson,
  RectItemJson,
  SettingsPatchJson,
  StatusJson,
  TransformPatchJson,
} from './wasmTypes'

/** Canonical generated module (must match scripts/build-wasm.sh output). */
export const WASM_PKG_URL = '/wasm/kineora_core.js'
/** Dependent binary, resolved EXPLICITLY by the loader. */
export const WASM_BG_URL = '/wasm/kineora_core_bg.wasm'

type WasmModule = KineoraWasm & {
  default?: (input?: ArrayBuffer | Response | string | URL) => Promise<unknown>
}

export interface LoaderDeps {
  fetchImpl?: (url: string) => Promise<Response>
  importImpl?: (url: string) => Promise<unknown>
  createObjectUrl?: (blob: Blob) => string
  revokeObjectUrl?: (url: string) => void
}

let status: EngineStatus = {
  kind: 'error',
  detail: 'WASM core not built — run `npm run wasm`, then reload.',
}
let mod: KineoraWasm | null = null

export function getEngineStatus(): EngineStatus {
  return status
}

export function getEngine(): KineoraWasm | null {
  return mod
}

/** Test-only: clear the singleton so loader tests run in isolation. */
export function resetEngineForTests(): void {
  mod = null
  status = { kind: 'error', detail: 'reset' }
}

/// Load + initialize the WASM engine. Idempotent. All steps are injected so
/// the flow is unit-testable without a browser.
export async function loadEngine(deps: LoaderDeps = {}): Promise<EngineStatus> {
  if (mod) return status

  const fetchImpl = deps.fetchImpl ?? ((u: string) => fetch(u))
  const importImpl = deps.importImpl ?? ((u: string) => import(/* @vite-ignore */ u))
  const createObjectUrl = deps.createObjectUrl ?? ((b: Blob) => URL.createObjectURL(b))
  const revokeObjectUrl = deps.revokeObjectUrl ?? ((u: string) => URL.revokeObjectURL(u))

  let objectUrl: string | null = null
  try {
    // 1) glue source (public asset → text, not source-import).
    const jsResp = await fetchImpl(WASM_PKG_URL)
    if (!jsResp.ok) throw new Error(`HTTP ${jsResp.status} for ${WASM_PKG_URL}`)
    const jsSource = await jsResp.text()
    if (!jsSource || /<(!doctype|html)\b/i.test(jsSource)) {
      throw new Error(`${WASM_PKG_URL} did not serve the WASM module (missing build?)`)
    }

    // 2) dependent binary, fetched explicitly (correct resolution regardless
    //    of the module's own base URL).
    const bgResp = await fetchImpl(WASM_BG_URL)
    if (!bgResp.ok) throw new Error(`HTTP ${bgResp.status} for ${WASM_BG_URL}`)
    const wasmBytes = await bgResp.arrayBuffer()

    // 3) evaluate the glue as a real module, then run wasm-bindgen init.
    objectUrl = createObjectUrl(new Blob([jsSource], { type: 'text/javascript' }))
    const imported = (await importImpl(objectUrl)) as WasmModule
    if (typeof imported.default !== 'function') {
      throw new Error(`${WASM_PKG_URL} exports no default init (wrong wasm-pack --target?)`)
    }
    await imported.default(wasmBytes)

    mod = imported as KineoraWasm
    // Ensure a default document exists (the browser never called kineora_new;
    // the renderer needs width/height/background + a Session to evaluate).
    // kineora_new_default keeps the canonical stage size (1920×1080) in ONE
    // place — the Rust Settings::default() — so it can never drift.
    if (typeof mod.kineora_new_default === 'function') {
      // H01 meta ownership: the creation command stamps meta.createdAt;
      // wasm has no wall clock, so the caller supplies epoch-seconds.
      mod.kineora_new_default(Math.floor(Date.now() / 1000))
    } else if (typeof mod.kineora_new === 'function') {
      mod.kineora_new(1920, 1080, 24, '#ffffff')
    }
    status = { kind: 'ok', detail: 'WASM core attached (animator-core)' }
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    status = {
      kind: 'error',
      detail: `WASM core not attached (${WASM_PKG_URL}): ${why}. Build with \`npm run wasm\`.`,
    }
  } finally {
    if (objectUrl) {
      try {
        revokeObjectUrl(objectUrl)
      } catch {
        /* revoke is best-effort */
      }
    }
  }
  return status
}

// ——— typed facade helpers (all cross the bridge as JSON where relevant) ———

// u64 BRIDGE CONTRACT (wasm-bindgen): every Rust `u64` parameter MUST receive
// a JS `bigint` — passing a plain number throws TypeError AT THE BOUNDARY —
// and every `u64` RETURN arrives as a bigint (breaking `===` against the
// plain numbers that come out of JSON-parsed status/doc lists).
// ROOT CAUSE of the SYS-02 H01 manual-QA failure on the native desktop:
// tab switch / tab close / symbol-id ops silently crashed in the click
// handler — mocked UI tests could never see it (continuity lesson #9).
// The UI keeps plain numbers everywhere (ids are ≤ 2^53); conversion happens
// EXACTLY at this boundary and nowhere else. Guarded by client.u64.test.ts.
const asU64 = (id: number): bigint => BigInt(Math.trunc(id))
const asNum = (v: bigint | number | undefined): number =>
  typeof v === 'bigint' ? Number(v) : v ?? 0

/** H04 §10 / SYS-01 §27.1 — post-do event for DOCUMENT mutations only
 *  (edit/import/undo/redo — anything that may change the dirty snapshot
 *  relation). View/session/workspace/pref changes (selection, playhead,
 *  active layer, tab ops) and FILE-SYSTEM ops (save/markClean) must NEVER
 *  emit this. No engine attached => no event. Payload is advisory —
 *  consumers re-read the engine (H00 §27.0 stale rule). */
function docChanged(type: string): void {
  if (mod) bus.emit('document:changed', { type, targets: [] })
}

/** SYS-14 MOD-SELECTION — compute the full `selection:changed` payload from the
 *  core's status snapshot. Part 03 §3.9 / SYS-01 §27.1:
 *  `{prevTargets, targets, kind, commonType, bounds}`.
 *
 *  - kind: only OBJECT selection exists in the editor today; anchors/frames/
 *    bones/warpPins/camera are future SYS and are NOT invented (FL-0001/0010).
 *    Empty selection → 'none', otherwise → 'objects'.
 *  - commonType: the shared `selection_details[].kind` ("rect" | "instance" | …)
 *    when EVERY target has the same kind; omitted on a mixed selection so the
 *    Properties panel shows only common fields (Part 03 §3.4.10).
 *  - bounds: axis-aligned union of every per-node `selection_rects` (each is
 *    already a scene-space AABB with rotation applied by the core — Part 03
 *    §3.4.10/§3.8). null when the selection is empty.
 *
 *  Pure: callers pass prev + current; this function never reads the engine. */
export function buildSelectionPayload(
  prev: number[],
  st: Pick<StatusJson, 'selection' | 'selection_details' | 'selection_rects'>,
): {
  prevTargets: number[]
  targets: number[]
  kind: 'objects' | 'none'
  commonType?: string
  bounds?: { x: number; y: number; w: number; h: number } | null
} {
  const targets = st.selection ?? []
  if (targets.length === 0) {
    return { prevTargets: prev, targets: [], kind: 'none', bounds: null }
  }

  // commonType — single shared detail kind, else undefined (mixed).
  let commonType: string | undefined
  const details = st.selection_details ?? []
  if (details.length > 0) {
    const first = details[0]?.kind
    if (first && details.every((d) => d.kind === first)) commonType = first
  }

  // bounds — union AABB across every selected node's scene-space rect.
  const rects = st.selection_rects ?? []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let any = false
  for (const r of rects) {
    any = true
    if (r.x < minX) minX = r.x
    if (r.y < minY) minY = r.y
    if (r.x + r.w > maxX) maxX = r.x + r.w
    if (r.y + r.h > maxY) maxY = r.y + r.h
  }
  const bounds = any ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null

  return { prevTargets: prev, targets, kind: 'objects', commonType, bounds }
}

/** Emit `selection:changed` with the full SYS-14 payload. Reads the CURRENT
 *  engine status, so callers MUST invoke it AFTER the core mutation that
 *  changed the selection (prev = targets captured before the mutation). */
function emitSelectionChanged(prev: number[]): void {
  if (!mod) return
  const st = statusJson()
  if (!st) {
    bus.emit('selection:changed', { prevTargets: prev, targets: [], kind: 'none', bounds: null })
    return
  }
  bus.emit('selection:changed', buildSelectionPayload(prev, st))
}

export function drawRect(x: number, y: number, w: number, h: number, fill: string): number {
  const prev = statusJson()?.selection ?? []
  const id = asNum(mod?.kineora_draw_rect(x, y, w, h, fill))
  if (id > 0) {
    docChanged('draw')
    emitSelectionChanged(prev)
  }
  return id
}

export function evaluate(frame: number): RectItemJson[] {
  if (!mod) return []
  try {
    return JSON.parse(mod.kineora_evaluate(frame)) as RectItemJson[]
  } catch {
    return []
  }
}

/** Test seam: override the wasm module + status source. Production never
 *  calls this; it exists so producer tests can drive selection:changed
 *  without a real WASM build. Returns a restore() that resets both. */
export function __attachEngineForTest(
  fakeMod: Partial<KineoraWasm> | null,
  statusSource: (() => StatusJson | null) | null,
): () => void {
  const prevMod = mod
  const prevSource = statusOverride
  mod = (fakeMod as KineoraWasm | null) ?? null
  statusOverride = statusSource
  return () => {
    mod = prevMod
    statusOverride = prevSource
  }
}

let statusOverride: (() => StatusJson | null) | null = null

export function statusJson(): StatusJson | null {
  if (statusOverride) return statusOverride()
  if (!mod) return null
  try {
    return JSON.parse(mod.kineora_status()) as StatusJson
  } catch {
    return null
  }
}

export function exportSvg(frame: number): string {
  return mod?.kineora_export_svg(frame) ?? ''
}

export function exportSvgScaled(frame: number, scale: number): string {
  return mod?.kineora_export_svg_scaled?.(frame, scale) ?? exportSvg(frame)
}

export function undo(): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_undo() ?? false
  if (ok) {
    docChanged('undo')
    // H01 §9 / INV-EDIT-2: undo restores prevSelection — emit so panels rebind.
    emitSelectionChanged(prev)
  }
  return ok
}

export function redo(): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_redo() ?? false
  if (ok) {
    docChanged('redo')
    emitSelectionChanged(prev)
  }
  return ok
}

export function insertKeyframe(frame: number): boolean {
  const ok = mod?.kineora_insert_keyframe(frame) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function insertBlankKeyframe(frame: number): boolean {
  const ok = mod?.kineora_insert_blank_keyframe(frame) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function clearKeyframe(frame: number): boolean {
  const ok = mod?.kineora_clear_keyframe(frame) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function insertFrame(frame: number): boolean {
  const ok = mod?.kineora_insert_frame(frame) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function deleteFrame(frame: number): boolean {
  const ok = mod?.kineora_delete_frame(frame) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function moveKeyframe(layer: number, from: number, to: number): boolean {
  const ok = mod?.kineora_move_keyframe(layer, from, to) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function duplicateKeyframe(layer: number, from: number, to: number): boolean {
  const ok = mod?.kineora_duplicate_keyframe(layer, from, to) ?? false
  if (ok) docChanged('frame')
  return ok
}

/** COPY FRAMES is session clipboard only — never emits document:changed (B-8 / H04). */
export function copyFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_copy_frames(layer, start, end) ?? false
}

export function cutFrames(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_cut_frames(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function pasteFrames(layer: number, at: number): boolean {
  const ok = mod?.kineora_paste_frames(layer, at) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function removeFrames(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_remove_frames(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function reverseFrames(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_reverse_frames(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function setClassicTween(layer: number, start: number, end: number, ease: number): boolean {
  const ok = mod?.kineora_set_classic_tween(layer, start, end, ease) ?? false
  if (ok) docChanged('tween')
  return ok
}

export function removeClassicTween(layer: number, start: number): boolean {
  const ok = mod?.kineora_remove_classic_tween(layer, start) ?? false
  if (ok) docChanged('tween')
  return ok
}

export function moveKeyframeSequence(layer: number, from: number, to: number, overwrite: boolean): boolean {
  const ok = mod?.kineora_move_keyframe_sequence(layer, from, to, overwrite) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function resizeSpan(layer: number, anchor: number, delta: number): boolean {
  const ok = mod?.kineora_resize_span(layer, anchor, delta) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function duplicateFrames(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_duplicate_frames(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function convertToKeyframes(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_convert_to_keyframes(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function convertToBlankKeyframes(layer: number, start: number, end: number): boolean {
  const ok = mod?.kineora_convert_to_blank_keyframes(layer, start, end) ?? false
  if (ok) docChanged('frame')
  return ok
}

export function setFrameLabel(layer: number, frame: number, label: string): boolean {
  const ok = mod?.kineora_set_frame_label(layer, frame, label) ?? false
  if (ok) docChanged('frame')
  return ok
}

// ——— Symbols + Library (Part 11/12) ———

export function convertToSymbol(name: string, symbolType: string, regGrid: number): number {
  const id = asNum(mod?.kineora_convert_to_symbol(name, symbolType, regGrid))
  if (id > 0) docChanged('symbol')
  return id
}

export function newSymbol(name: string, symbolType: string): number {
  const id = asNum(mod?.kineora_new_symbol(name, symbolType))
  if (id > 0) docChanged('symbol')
  return id
}

export function placeSymbol(symbolId: number, x: number, y: number): number {
  const id = asNum(mod?.kineora_place_symbol(asU64(symbolId), x, y))
  if (id > 0) docChanged('symbol')
  return id
}

export function renameSymbol(symbolId: number, name: string): boolean {
  const ok = mod?.kineora_rename_symbol(asU64(symbolId), name) ?? false
  if (ok) docChanged('symbol')
  return ok
}

export function deleteSymbol(symbolId: number, breakApart: boolean): boolean {
  const ok = mod?.kineora_delete_symbol(asU64(symbolId), breakApart) ?? false
  if (ok) docChanged('symbol')
  return ok
}

export function swapInstance(instanceId: number, symbolId: number): boolean {
  const ok = mod?.kineora_swap_instance(asU64(instanceId), asU64(symbolId)) ?? false
  if (ok) docChanged('symbol')
  return ok
}

export function setInstanceLoop(instanceId: number, loopMode: string, firstFrame: number): boolean {
  const ok = mod?.kineora_set_instance_loop(asU64(instanceId), loopMode, firstFrame) ?? false
  if (ok) docChanged('symbol')
  return ok
}

export function library(): LibraryItemJson[] {
  if (!mod) return []
  try {
    return JSON.parse(mod.kineora_library()) as LibraryItemJson[]
  } catch {
    return []
  }
}

/** True when the attached engine exposes the Symbols/Library facade — lets the
 *  UI distinguish "empty library" from "engine build out of date" honestly. */
export function hasSymbolFacade(): boolean {
  return !!mod && typeof mod.kineora_library === 'function'
}

export function setPlayhead(frame: number): void {
  mod?.kineora_set_playhead(frame)
}

export function selectAt(x: number, y: number): boolean {
  const prev = statusJson()?.selection ?? []
  const hit = mod?.kineora_select_at(x, y) ?? false
  // SYS-14: a click is one selection gesture — emit ONCE after the mutation so
  // Properties/Transform/overlay refresh (FL-0006; Part 03 §3.9 "once/gesture").
  emitSelectionChanged(prev)
  return hit
}

/** Select everything on visible, unlocked layers (view state — not undoable). */
export function selectAll(): void {
  const prev = statusJson()?.selection ?? []
  mod?.kineora_select_all()
  emitSelectionChanged(prev)
}

/** Clear the stage selection (view state — not undoable). */
export function clearSelection(): void {
  const prev = statusJson()?.selection ?? []
  mod?.kineora_clear_selection()
  emitSelectionChanged(prev)
}

/** New document from the engine's default settings (File ▸ New fallback).
 *  `created_at` = epoch-seconds supplied by the caller (wasm has no wall
 *  clock — H01 §7 meta ownership). */
export function newDefaultDocument(): boolean {
  return mod?.kineora_new_default(Math.floor(Date.now() / 1000)) ?? false
}

export function selectToggleAt(x: number, y: number): boolean {
  const prev = statusJson()?.selection ?? []
  const hit = mod?.kineora_select_toggle_at(x, y) ?? false
  // SYS-14: shift-click is one selection gesture.
  emitSelectionChanged(prev)
  return hit
}

export function selectInRect(x0: number, y0: number, x1: number, y1: number): void {
  const prev = statusJson()?.selection ?? []
  mod?.kineora_select_in_rect(x0, y0, x1, y1)
  // SYS-14: marquee drag commit is one selection gesture.
  emitSelectionChanged(prev)
}

export function transformSelection(transforms: Array<Record<string, number>>): void {
  if (!mod) return
  mod.kineora_transform_selection(JSON.stringify(transforms))
  docChanged('transform')
}

export function moveSelection(dx: number, dy: number): void {
  if (!mod) return
  mod.kineora_move_selection(dx, dy)
  docChanged('transform')
}

export function projectJson(): string {
  return mod?.kineora_project_json?.() ?? ''
}

/** Open (replace the ACTIVE document) from JSON — SYS-02 Open semantics. */
export function loadProjectJson(json: string, title: string): boolean {
  return mod?.kineora_load_json?.(json, title) ?? false
}

// ——— SYS-02 document manager ———

/** New document from full Settings (platform/units/W/H/fps/background + α).
 *  `createdAt` = epoch-seconds stamp for meta (H01 ownership). Returns id. */
export function newDocFull(settings: { width: number; height: number; fps: number; background: string; backgroundAlpha?: number; units: string; platform: string; createdAt?: number }): number {
  return asNum(mod?.kineora_new_full?.(JSON.stringify(settings)))
}

export function docCount(): number {
  return mod?.kineora_doc_count?.() ?? 0
}

export function docList(): import('./wasmTypes').DocJson[] {
  if (!mod?.kineora_doc_list) return []
  try {
    return JSON.parse(mod.kineora_doc_list()) as import('./wasmTypes').DocJson[]
  } catch {
    return []
  }
}

export function activeDocId(): number {
  return asNum(mod?.kineora_active_doc_id?.())
}

export function setActiveDoc(id: number): boolean {
  return mod?.kineora_set_active_doc?.(asU64(id)) ?? false
}

export function closeDoc(id: number): boolean {
  return mod?.kineora_close_doc?.(asU64(id)) ?? false
}

/** H02 app.tab.reorder — move an open document to `toIndex` within the
 *  open-set. View/SESSION state: the active document is unchanged and no
 *  document content/History/dirty is touched. False when the id is not open. */
export function reorderDoc(id: number, toIndex: number): boolean {
  return mod?.kineora_reorder?.(asU64(id), toIndex) ?? false
}

export function setDocTitle(id: number, title: string): boolean {
  return mod?.kineora_set_doc_title?.(asU64(id), title) ?? false
}

/** Open a JSON document as a NEW tab (New-from-template seeding). */
export function openDocJson(json: string, title: string): number {
  return asNum(mod?.kineora_open_json?.(json, title))
}

/** H05 — stamp `meta.modifiedAt` on the active document (epoch seconds).
 *  FILE-SYSTEM class: never emits `document:changed` (save is not a document
 *  mutation). The save flow orders it BEFORE markClean (H05 §7.1). */
export function setDocModifiedAt(epochSecs: number): boolean {
  return mod?.kineora_set_modified_at?.(epochSecs) ?? false
}

/** Mark the active document clean (Save success → STM-DIRTY CLEAN). */
export function markClean(): boolean {
  return mod?.kineora_mark_clean?.() ?? false
}

/** Whether the engine exposes the multi-document manager (build honesty). */
export function hasDocManager(): boolean {
  return !!mod && typeof mod.kineora_doc_list === 'function'
}

// ——— Layers (MOD-LAYER) ———
//
// Every layer MUTATION below emits BOTH `document:changed{type:'layer'}` (the
// dirty/refresh signal, H04 §10) AND the canonical `layer:changed{layerId,op}`
// (SYS-01 §27.1, INT-0010 approved; producer MOD-LAYER, payload advisory).
// `layerId` is the layer's STABLE id resolved from the live status AFTER the
// mutation — never the index (indices shift on reorder/delete). Batch
// "all others" ops emit ONE event per affected layer. `setActiveLayer` is
// VIEW state (no command/undo) → it emits neither event.

function layerIdAt(index: number): number {
  return statusJson()?.layers?.[index]?.id ?? 0
}

function emitLayerChanged(layerId: number, op: LayerOp): void {
  if (mod && layerId > 0) bus.emit('layer:changed', { layerId, op })
}

/** Layers before a batch toggle: id → flag value (for per-layer events). */
function layerFlagsSnapshot(kind: 'visible' | 'locked' | 'outline'): Map<number, boolean> {
  const m = new Map<number, boolean>()
  for (const l of statusJson()?.layers ?? []) {
    const v = kind === 'visible' ? l.visible : kind === 'locked' ? l.locked : (l.outline ?? false)
    m.set(l.id, v)
  }
  return m
}

/** Emit one `layer:changed` per layer whose flag actually flipped. */
function emitLayerFlagFlips(before: Map<number, boolean>, kind: 'visible' | 'locked' | 'outline'): void {
  for (const l of statusJson()?.layers ?? []) {
    const after = kind === 'visible' ? l.visible : kind === 'locked' ? l.locked : (l.outline ?? false)
    if (before.get(l.id) !== after) emitLayerChanged(l.id, kind)
  }
}

export function setActiveLayer(index: number): boolean {
  return mod?.kineora_set_active_layer(index) ?? false
}

/** Returns the new layer's index, or -1 if the engine is absent. */
export function createLayer(): number {
  if (!mod) return -1
  const idx = mod.kineora_create_layer()
  if (idx >= 0) {
    docChanged('layer')
    emitLayerChanged(layerIdAt(idx), 'added')
  }
  return idx
}

export function createFolder(): number {
  if (!mod?.kineora_create_folder) return -1
  const idx = mod.kineora_create_folder()
  if (idx >= 0) {
    docChanged('layer')
    emitLayerChanged(layerIdAt(idx), 'added')
  }
  return idx
}

/** SYS-05 Insert ▸ Scene (Part 01 §1.2.4 + Part 25.1): append "Scene N" with
 *  a default timeline and ACTIVATE it. Returns the new 0-based scene index,
 *  -1 on failure. Emits `document:changed{type:'scene'}` (DOCUMENT MUTATION —
 *  scene list changed); activation itself is session/view state carried by
 *  the same status re-read (Edit bar + timeline re-bind, Part 25.4). */
export function createScene(): number {
  if (!mod?.kineora_create_scene) return -1
  const n = mod.kineora_create_scene()
  if (n === 0) return -1
  docChanged('scene')
  return n - 1
}

/** Nest `child` under folder `parent`. Pass parent = null to un-nest. */
export function setLayerParent(child: number, parent: number | null): boolean {
  if (!mod?.kineora_set_layer_parent) return false
  const id = layerIdAt(child)
  const p = parent === null ? 0xffffffff : parent
  const ok = mod.kineora_set_layer_parent(child, p)
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'parented')
  }
  return ok
}

export function setFolderCollapsed(index: number, collapsed: boolean): boolean {
  if (!mod?.kineora_set_folder_collapsed) return false
  const id = layerIdAt(index)
  const ok = mod.kineora_set_folder_collapsed(index, collapsed)
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'collapsed')
  }
  return ok
}

export function deleteLayer(index: number): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_delete_layer(index) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'removed')
  }
  return ok
}

export function renameLayer(index: number, name: string): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_rename_layer(index, name) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'renamed')
  }
  return ok
}

export function setLayerVisible(index: number, visible: boolean): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_set_layer_visible(index, visible) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'visible')
  }
  return ok
}

export function setLayerLocked(index: number, locked: boolean): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_set_layer_locked(index, locked) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'locked')
  }
  return ok
}

export function moveLayer(from: number, to: number): boolean {
  const id = layerIdAt(from)
  const ok = mod?.kineora_move_layer(from, to) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'reordered')
  }
  return ok
}

/** Outline-mode toggle (F-07-02 E3 / F-20-01 state matrix) — strokes-only
 *  view aid. */
export function setLayerOutline(index: number, outline: boolean): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_set_layer_outline(index, outline) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'outline')
  }
  return ok
}

/** Outline color (F-07-02 E6 / Part 33 `layer.outlineColor`). */
export function setLayerOutlineColor(index: number, color: string): boolean {
  const id = layerIdAt(index)
  const ok = mod?.kineora_set_layer_outline_color(index, color) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerChanged(id, 'outlineColor')
  }
  return ok
}

/** Alt+click "all others" batch toggles (F-07-02 E1/E2/E3 + M.3) — each is
 *  ONE undo step for the whole batch; `layer:changed` fires once per layer
 *  whose flag actually flipped. */
export function toggleOtherLayersVisible(exclude: number): boolean {
  const before = layerFlagsSnapshot('visible')
  const ok = mod?.kineora_toggle_other_layers_visible(exclude) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerFlagFlips(before, 'visible')
  }
  return ok
}

export function toggleOtherLayersLocked(exclude: number): boolean {
  const before = layerFlagsSnapshot('locked')
  const ok = mod?.kineora_toggle_other_layers_locked(exclude) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerFlagFlips(before, 'locked')
  }
  return ok
}

export function toggleOtherLayersOutline(exclude: number): boolean {
  const before = layerFlagsSnapshot('outline')
  const ok = mod?.kineora_toggle_other_layers_outline(exclude) ?? false
  if (ok) {
    docChanged('layer')
    emitLayerFlagFlips(before, 'outline')
  }
  return ok
}

/** Duplicate a layer above the source — deep copy of frames + content
 *  (Part 20.1 / F-20-01). Returns the new layer's index, or -1 if the engine
 *  is absent / 0 if the duplicate was blocked (0 is never a valid result). */
export function duplicateLayer(index: number): number {
  if (!mod) return -1
  const idx = mod.kineora_duplicate_layer(index)
  if (idx > 0) {
    docChanged('layer')
    emitLayerChanged(layerIdAt(idx), 'duplicated')
  }
  return idx
}

// ——— Object / document properties (Part 26) ———

/** Edit transform fields at the current playhead (one undoable command). */
export function patchTransforms(patches: TransformPatchJson[]): void {
  if (!mod) return
  mod.kineora_patch_transforms(JSON.stringify(patches))
  docChanged('transform')
}

/** Edit base node properties (one undoable command across all patched nodes). */
export function setNodeProps(patches: NodePropsPatchJson[]): void {
  if (!mod) return
  mod.kineora_set_node_props(JSON.stringify(patches))
  docChanged('transform')
}

export function setDocumentSettings(patch: SettingsPatchJson): boolean {
  const ok = mod?.kineora_set_document_settings(JSON.stringify(patch)) ?? false
  if (ok) docChanged('settings')
  return ok
}

// ——— SYS-03 object clipboard + SYS-06 transform / arrange / align ———

/** COPY is session state — never emits document:changed. */
export function copyObjects(): boolean {
  return mod?.kineora_copy_objects?.() ?? false
}

export function cutObjects(): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_cut_objects?.() ?? false
  if (!ok) return false
  // AI-A H04 repair (locked-only cut copies but does NOT delete): that is not
  // a document mutation — only emit document:changed / selection:changed when
  // the selection actually changed. Preserve SYS-14 full-payload emission.
  const after = statusJson()?.selection ?? []
  const mutated = after.length !== prev.length || after.some((id, i) => id !== prev[i])
  if (mutated) {
    docChanged('edit')
    emitSelectionChanged(prev)
  }
  return true
}

export function deleteSelection(): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_delete_selection?.() ?? false
  if (ok) {
    docChanged('edit')
    // Deletion clears the selection in the core; propagate that so Properties/
    // overlay/context-menu drop the (now-deleted) targets (SYS-14).
    emitSelectionChanged(prev)
  }
  return ok
}

export function pasteObjects(mode: 'inplace' | 'center'): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_paste_objects?.(mode) ?? false
  if (ok) {
    docChanged('edit')
    // Paste selects the freshly-pasted objects (one gesture → one event).
    emitSelectionChanged(prev)
  }
  return ok
}

export function duplicateObjects(): boolean {
  const prev = statusJson()?.selection ?? []
  const ok = mod?.kineora_duplicate_objects?.() ?? false
  if (ok) {
    docChanged('edit')
    // Duplicate selects the new copies (one gesture → one event).
    emitSelectionChanged(prev)
  }
  return ok
}

export function rotateSelection(degrees: number): boolean {
  const ok = mod?.kineora_rotate_selection?.(degrees) ?? false
  if (ok) docChanged('transform')
  return ok
}

export function flipSelection(horizontal: boolean): boolean {
  const ok = mod?.kineora_flip_selection?.(horizontal) ?? false
  if (ok) docChanged('transform')
  return ok
}

export function removeTransform(): boolean {
  const ok = mod?.kineora_remove_transform?.() ?? false
  if (ok) docChanged('transform')
  return ok
}

export function arrangeSelection(op: 'front' | 'forward' | 'back' | 'backward'): boolean {
  const ok = mod?.kineora_arrange_selection?.(op) ?? false
  if (ok) docChanged('transform')
  return ok
}

export function alignSelection(
  op: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom',
  space: 'stage' | 'selection' = 'selection',
): boolean {
  const ok = mod?.kineora_align_selection?.(op, space) ?? false
  if (ok) docChanged('transform')
  return ok
}
