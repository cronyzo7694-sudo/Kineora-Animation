// Engine client — the UI's ONLY doorway to the Rust core (IMP-DEC-002).
//
// The Rust core is compiled to WASM by `npm run wasm`, which outputs:
//     public/wasm/kineora_core.js  (+ kineora_core_bg.wasm, *.d.ts)
// `public/` is served at the site root, so the canonical module URL is
// `/wasm/kineora_core.js` in BOTH Vite dev and production builds.
//
// If the bundle hasn't been built, the loader reports an honest
// "not attached" state — never a fake control (no-fake-features rule).

import type { EngineStatus } from '../controlRegistry'
import type { KineoraWasm, RectItemJson, StatusJson } from './wasmTypes'

/** Canonical location of the generated WASM package (must match package.json `wasm` script). */
export const WASM_PKG_URL = '/wasm/kineora_core.js'

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

/// Attempt to load the generated WASM bundle. Idempotent; safe to call from a
/// React effect. On failure, keeps an honest error status that names the exact
/// path tried and the command to build it.
export async function loadEngine(): Promise<EngineStatus> {
  if (mod) return status
  try {
    // Variable (not a literal) so Vite leaves this as a runtime import and
    // does not fail the build when the generated package is absent.
    const url = WASM_PKG_URL
    const imported = (await import(/* @vite-ignore */ url)) as unknown as KineoraWasm & {
      default?: () => Promise<unknown>
    }
    await imported.default?.()
    mod = imported
    status = { kind: 'ok', detail: 'WASM core attached (animator-core)' }
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    status = {
      kind: 'error',
      detail: `WASM core not attached (tried ${WASM_PKG_URL}): ${why}. Build it with \`npm run wasm\`.`,
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
