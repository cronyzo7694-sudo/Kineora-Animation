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
      mod.kineora_new_default()
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
export function drawRect(x: number, y: number, w: number, h: number, fill: string): number {
  return mod?.kineora_draw_rect(x, y, w, h, fill) ?? 0
}

export function evaluate(frame: number): RectItemJson[] {
  if (!mod) return []
  try {
    return JSON.parse(mod.kineora_evaluate(frame)) as RectItemJson[]
  } catch {
    return []
  }
}

export function statusJson(): StatusJson | null {
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
  return mod?.kineora_undo() ?? false
}

export function redo(): boolean {
  return mod?.kineora_redo() ?? false
}

export function insertKeyframe(frame: number): boolean {
  return mod?.kineora_insert_keyframe(frame) ?? false
}

export function insertBlankKeyframe(frame: number): boolean {
  return mod?.kineora_insert_blank_keyframe(frame) ?? false
}

export function clearKeyframe(frame: number): boolean {
  return mod?.kineora_clear_keyframe(frame) ?? false
}

export function insertFrame(frame: number): boolean {
  return mod?.kineora_insert_frame(frame) ?? false
}

export function deleteFrame(frame: number): boolean {
  return mod?.kineora_delete_frame(frame) ?? false
}

export function moveKeyframe(layer: number, from: number, to: number): boolean {
  return mod?.kineora_move_keyframe(layer, from, to) ?? false
}

export function duplicateKeyframe(layer: number, from: number, to: number): boolean {
  return mod?.kineora_duplicate_keyframe(layer, from, to) ?? false
}

export function copyFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_copy_frames(layer, start, end) ?? false
}

export function cutFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_cut_frames(layer, start, end) ?? false
}

export function pasteFrames(layer: number, at: number): boolean {
  return mod?.kineora_paste_frames(layer, at) ?? false
}

export function removeFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_remove_frames(layer, start, end) ?? false
}

export function reverseFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_reverse_frames(layer, start, end) ?? false
}

export function setClassicTween(layer: number, start: number, end: number, ease: number): boolean {
  return mod?.kineora_set_classic_tween(layer, start, end, ease) ?? false
}

export function removeClassicTween(layer: number, start: number): boolean {
  return mod?.kineora_remove_classic_tween(layer, start) ?? false
}

export function moveKeyframeSequence(layer: number, from: number, to: number, overwrite: boolean): boolean {
  return mod?.kineora_move_keyframe_sequence(layer, from, to, overwrite) ?? false
}

export function resizeSpan(layer: number, anchor: number, delta: number): boolean {
  return mod?.kineora_resize_span(layer, anchor, delta) ?? false
}

export function duplicateFrames(layer: number, start: number, end: number): boolean {
  return mod?.kineora_duplicate_frames(layer, start, end) ?? false
}

export function convertToKeyframes(layer: number, start: number, end: number): boolean {
  return mod?.kineora_convert_to_keyframes(layer, start, end) ?? false
}

export function convertToBlankKeyframes(layer: number, start: number, end: number): boolean {
  return mod?.kineora_convert_to_blank_keyframes(layer, start, end) ?? false
}

export function setFrameLabel(layer: number, frame: number, label: string): boolean {
  return mod?.kineora_set_frame_label(layer, frame, label) ?? false
}

// ——— Symbols + Library (Part 11/12) ———

export function convertToSymbol(name: string, symbolType: string, regGrid: number): number {
  return mod?.kineora_convert_to_symbol(name, symbolType, regGrid) ?? 0
}

export function newSymbol(name: string, symbolType: string): number {
  return mod?.kineora_new_symbol(name, symbolType) ?? 0
}

export function placeSymbol(symbolId: number, x: number, y: number): number {
  return mod?.kineora_place_symbol(symbolId, x, y) ?? 0
}

export function renameSymbol(symbolId: number, name: string): boolean {
  return mod?.kineora_rename_symbol(symbolId, name) ?? false
}

export function deleteSymbol(symbolId: number, breakApart: boolean): boolean {
  return mod?.kineora_delete_symbol(symbolId, breakApart) ?? false
}

export function swapInstance(instanceId: number, symbolId: number): boolean {
  return mod?.kineora_swap_instance(instanceId, symbolId) ?? false
}

export function setInstanceLoop(instanceId: number, loopMode: string, firstFrame: number): boolean {
  return mod?.kineora_set_instance_loop(instanceId, loopMode, firstFrame) ?? false
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
  return mod?.kineora_select_at(x, y) ?? false
}

/** Select everything on visible, unlocked layers (view state — not undoable). */
export function selectAll(): void {
  mod?.kineora_select_all()
}

/** Clear the stage selection (view state — not undoable). */
export function clearSelection(): void {
  mod?.kineora_clear_selection()
}

/** Replace the document with the canonical default (File ▸ New). */
export function newDefaultDocument(): boolean {
  return mod?.kineora_new_default() ?? false
}

export function selectToggleAt(x: number, y: number): boolean {
  return mod?.kineora_select_toggle_at(x, y) ?? false
}

export function selectInRect(x0: number, y0: number, x1: number, y1: number): void {
  mod?.kineora_select_in_rect(x0, y0, x1, y1)
}

export function transformSelection(transforms: Array<Record<string, number>>): void {
  mod?.kineora_transform_selection(JSON.stringify(transforms))
}

export function moveSelection(dx: number, dy: number): void {
  mod?.kineora_move_selection(dx, dy)
}

export function projectJson(): string {
  return mod?.kineora_project_json?.() ?? ''
}

/** Open (replace the ACTIVE document) from JSON — SYS-02 Open semantics. */
export function loadProjectJson(json: string, title: string): boolean {
  return mod?.kineora_load_json?.(json, title) ?? false
}

// ——— SYS-02 document manager ———

/** New document from full Settings (platform/units/W/H/fps/background). Returns id. */
export function newDocFull(settings: { width: number; height: number; fps: number; background: string; units: string; platform: string }): number {
  return mod?.kineora_new_full?.(JSON.stringify(settings)) ?? 0
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
  return mod?.kineora_active_doc_id?.() ?? 0
}

export function setActiveDoc(id: number): boolean {
  return mod?.kineora_set_active_doc?.(id) ?? false
}

export function closeDoc(id: number): boolean {
  return mod?.kineora_close_doc?.(id) ?? false
}

export function setDocTitle(id: number, title: string): boolean {
  return mod?.kineora_set_doc_title?.(id, title) ?? false
}

/** Open a JSON document as a NEW tab (New-from-template seeding). */
export function openDocJson(json: string, title: string): number {
  return mod?.kineora_open_json?.(json, title) ?? 0
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

export function setActiveLayer(index: number): boolean {
  return mod?.kineora_set_active_layer(index) ?? false
}

/** Returns the new layer's index, or -1 if the engine is absent. */
export function createLayer(): number {
  if (!mod) return -1
  return mod.kineora_create_layer()
}

export function deleteLayer(index: number): boolean {
  return mod?.kineora_delete_layer(index) ?? false
}

export function renameLayer(index: number, name: string): boolean {
  return mod?.kineora_rename_layer(index, name) ?? false
}

export function setLayerVisible(index: number, visible: boolean): boolean {
  return mod?.kineora_set_layer_visible(index, visible) ?? false
}

export function setLayerLocked(index: number, locked: boolean): boolean {
  return mod?.kineora_set_layer_locked(index, locked) ?? false
}

export function moveLayer(from: number, to: number): boolean {
  return mod?.kineora_move_layer(from, to) ?? false
}

// ——— Object / document properties (Part 26) ———

/** Edit transform fields at the current playhead (one undoable command). */
export function patchTransforms(patches: TransformPatchJson[]): void {
  mod?.kineora_patch_transforms(JSON.stringify(patches))
}

/** Edit base node properties (one undoable command across all patched nodes). */
export function setNodeProps(patches: NodePropsPatchJson[]): void {
  mod?.kineora_set_node_props(JSON.stringify(patches))
}

export function setDocumentSettings(patch: SettingsPatchJson): boolean {
  return mod?.kineora_set_document_settings(JSON.stringify(patch)) ?? false
}
