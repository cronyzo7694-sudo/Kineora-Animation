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
  fill: string
  stroke: string | null
  stroke_width: number
}

/** Keyframe marker for the timeline (Part 07 §7.2). */
export interface FrameMarkerJson {
  frame: number
  blank: boolean
}

/** Layer row for the Layers panel / timeline (matches Rust `LayerOut`). */
export interface LayerJson {
  id: number
  name: string
  visible: boolean
  locked: boolean
  active: boolean
  selected_objects: number
  keyframes: FrameMarkerJson[]
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
  layers: LayerJson[]
  active_layer: number
  fps: number
  doc_width: number
  doc_height: number
  background: string
  duration: number
  event_log: string[]
}

/** Partial transform field edit (absent field = leave unchanged). */
export interface TransformPatchJson {
  id: number
  x?: number
  y?: number
  scale_x?: number
  scale_y?: number
  rotation?: number
}

/** Partial base-property edit (absent field = leave unchanged). */
export interface NodePropsPatchJson {
  id: number
  width?: number
  height?: number
  fill?: string
  stroke_enabled?: boolean
  stroke?: string
  stroke_width?: number
}

/** Partial document-settings edit (absent field = leave unchanged). */
export interface SettingsPatchJson {
  width?: number
  height?: number
  fps?: number
  background?: string
}

export interface KineoraWasm {
  kineora_new(width: number, height: number, fps: number, background: string): boolean
  kineora_new_default(): boolean
  kineora_draw_rect(x: number, y: number, w: number, h: number, fill: string): number
  kineora_select_at(x: number, y: number): boolean
  kineora_select_toggle_at(x: number, y: number): boolean
  kineora_select_in_rect(x0: number, y0: number, x1: number, y1: number): void
  kineora_transform_selection(transformsJson: string): void
  kineora_select_all(): void
  kineora_clear_selection(): void
  kineora_move_selection(dx: number, dy: number): void
  kineora_set_playhead(frame: number): void
  kineora_insert_keyframe(frame: number): boolean
  kineora_insert_blank_keyframe(frame: number): boolean
  kineora_clear_keyframe(frame: number): boolean
  kineora_undo(): boolean
  kineora_redo(): boolean
  kineora_evaluate(frame: number): string
  kineora_export_svg(frame: number): string
  kineora_export_svg_scaled(frame: number, scale: number): string
  kineora_save(path: string): boolean
  kineora_load(path: string): boolean
  kineora_status(): string
  kineora_project_json?(): string
  kineora_load_json?(json: string): boolean
  kineora_set_active_layer(index: number): boolean
  kineora_create_layer(): number
  kineora_delete_layer(index: number): boolean
  kineora_rename_layer(index: number, name: string): boolean
  kineora_set_layer_visible(index: number, visible: boolean): boolean
  kineora_set_layer_locked(index: number, locked: boolean): boolean
  kineora_move_layer(from: number, to: number): boolean
  kineora_patch_transforms(json: string): void
  kineora_set_node_props(json: string): void
  kineora_set_document_settings(json: string): boolean
  /** wasm-bindgen --target web default init (accepts explicit wasm input). */
  default?: (input?: ArrayBuffer | Response | string | URL) => Promise<unknown>
}
