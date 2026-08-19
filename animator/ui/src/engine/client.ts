// Engine client — the UI's ONLY doorway to the Rust core (IMP-DEC-002).
//
// The core is compiled to WASM (animator-core/src/wasm.rs) and bundled into
// `src/wasm/pkg/kineora_core.js` by `npm run wasm`. This client dynamically
// imports that bundle. Until the bundle is built, it reports an honest
// "not attached" state — never a fake control (Phase-2.5 §2, no-fake-features).

import type { EngineStatus } from '../controlRegistry'
import type { KineoraWasm, RectItemJson, StatusJson } from './wasmTypes'

let status: EngineStatus = {
  kind: 'error',
  detail: 'WASM core not built — run `npm run wasm` (needs wasm-pack) then reload.',
}

let mod: KineoraWasm | null = null

export function getEngineStatus(): EngineStatus {
  return status
}

export function getEngine(): KineoraWasm | null {
  return mod
}

/// Attempt to load the generated WASM bundle. Idempotent; safe to call from a
/// React effect. On failure, keeps the honest error status.
export async function loadEngine(): Promise<EngineStatus> {
  if (mod) return status
  try {
    // Variable (not literal) so Vite skips static import analysis; the browser /
    // test runner resolves it at runtime and we catch a missing bundle here.
    const wasmModulePath = '../../wasm/pkg/kineora_core.js'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imported: any = await import(/* @vite-ignore */ wasmModulePath)
    await imported.default?.()
    mod = imported as KineoraWasm
    status = { kind: 'ok', detail: 'WASM core attached (animator-core)' }
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    status = {
      kind: 'error',
      detail: `WASM core not attached: ${why}. Build it with \`npm run wasm\`.`,
    }
  }
  return status
}

/// Typed helpers over the raw facade (JSON decode + minimal normalization).
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
