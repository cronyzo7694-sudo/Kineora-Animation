// Types mirroring the Rust `RectItem` and the wasm facade (kineora_*).
// Serde snake_case ↔ camelCase mapping is explicit here (the bridge returns
// snake_case JSON; the UI adapter normalizes to camelCase where it renders).

export interface RectItemJson {
  id: number
  x: number
  y: number
  w: number
  h: number
  rotation: number
  fill: string
  stroke: string | null
  stroke_width: number
}

export interface SelRectJson {
  id: number
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface SelDetailJson {
  id: number
  x: number
  y: number
  w: number
  h: number
  base_w: number
  base_h: number
  scale_x: number
  scale_y: number
  rotation: number
}

export interface StatusJson {
  playhead: number
  selection: number[]
  selection_rects: SelRectJson[]
  selection_details: SelDetailJson[]
  undo_len: number
  redo_len: number
  scene: string
  layer: string
  fps: number
  doc_width: number
  doc_height: number
  background: string
  event_log: string[]
}

export interface KineoraWasm {
  kineora_new(width: number, height: number, fps: number, background: string): boolean
  kineora_draw_rect(x: number, y: number, w: number, h: number, fill: string): number
  kineora_select_at(x: number, y: number): boolean
  kineora_select_toggle_at(x: number, y: number): boolean
  kineora_select_in_rect(x0: number, y0: number, x1: number, y1: number): void
  kineora_transform_selection(transformsJson: string): void
  kineora_select_all(): void
  kineora_clear_selection(): void
  kineora_move_selection(dx: number, dy: number): void
  kineora_set_playhead(frame: number): void
  kineora_insert_keyframe(frame: number): void
  kineora_undo(): boolean
  kineora_redo(): boolean
  kineora_evaluate(frame: number): string
  kineora_export_svg(frame: number): string
  kineora_save(path: string): boolean
  kineora_load(path: string): boolean
  kineora_status(): string
  kineora_project_json?(): string
  kineora_load_json?(json: string): boolean
  /** wasm-bindgen --target web default init (accepts explicit wasm input). */
  default?: (input?: ArrayBuffer | Response | string | URL) => Promise<unknown>
}
