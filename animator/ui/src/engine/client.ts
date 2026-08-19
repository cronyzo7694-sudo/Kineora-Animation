// Engine client — the UI's ONLY doorway to the Rust core (IMP-DEC-002).
// Slice 1: the WASM bridge is the next implementation unit; the client reports
// its status explicitly so the UI never pretends the core is present.

import type { EngineStatus } from '../controlRegistry'

let status: EngineStatus = {
  kind: 'error',
  detail: 'Core WASM bridge not built yet (IMP-DEC-002). Next unit: wasm-bindgen glue → `npm run wasm`.',
}

export function getEngineStatus(): EngineStatus {
  return status
}

// Reserved surface the bridge will fill (mirrors the Rust `Session` API):
//   drawRect, selectAt, moveSelection, insertKeyframe, setPlayhead,
//   undo, redo, evaluate(frame), exportSvg(frame), save(path), load(path)
export interface Engine {
  drawRect(x: number, y: number, w: number, h: number, fill: string): number
  evaluate(frame: number): unknown[]
}
