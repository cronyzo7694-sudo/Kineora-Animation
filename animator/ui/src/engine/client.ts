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

import type { EngineStatus } from '../controlRegistry'
import type { KineoraWasm, RectItemJson, StatusJson } from './wasmTypes'

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

export function undo(): boolean {
  return mod?.kineora_undo() ?? false
}

export function redo(): boolean {
  return mod?.kineora_redo() ?? false
}

export function insertKeyframe(frame: number): void {
  mod?.kineora_insert_keyframe(frame)
}

export function setPlayhead(frame: number): void {
  mod?.kineora_set_playhead(frame)
}

export function selectAt(x: number, y: number): boolean {
  return mod?.kineora_select_at(x, y) ?? false
}

export function moveSelection(dx: number, dy: number): void {
  mod?.kineora_move_selection(dx, dy)
}

export function projectJson(): string {
  return mod?.kineora_project_json?.() ?? ''
}

export function loadProjectJson(json: string): boolean {
  return mod?.kineora_load_json?.(json) ?? false
}
