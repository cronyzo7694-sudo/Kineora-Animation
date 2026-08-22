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
  /** Layer outline color when the item's scene layer is in outline mode
   *  (F-20-01) — the editor draws stroke-only; export ignores it. Optional for
   *  legacy test fixtures. */
  outline_color?: string | null
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
  kind?: string
  symbol_id?: number | null
  symbol_name?: string | null
  symbol_type?: string | null
  loop_mode?: string | null
  first_frame?: number | null
  empty?: boolean
}

/** Library entry (Part 12 §12.1). */
export interface LibraryItemJson {
  id: number
  name: string
  type: string
  use_count: number
  duration: number
}

/** Keyframe marker for the timeline (Part 07 §7.2). */
export interface FrameMarkerJson {
  frame: number
  blank: boolean
  /** Named frame label (Part 33.8) — red flag in the timeline. */
  label?: string
}

/** Classic tween span for the timeline (Part 09.2). */
export interface TweenJson {
  start: number
  end: number
  ease: number
}

/** Layer row for the Layers panel / timeline (matches Rust `LayerOut`). */
export interface LayerJson {
  id: number
  name: string
  visible: boolean
  locked: boolean
  /** Outline-mode view aid (F-07-02 E3 / F-20-01) — strokes-only rendering.
   *  Optional for legacy test fixtures. */
  outline?: boolean
  /** Layer outline color (Part 33 `layer.outlineColor`, F-20-01). */
  outline_color?: string
  active: boolean
  selected_objects: number
  keyframes: FrameMarkerJson[]
  tweens: TweenJson[]
  /** F-20-04/05 — "normal" | "folder". Optional for legacy fixtures. */
  kind?: string
  parent_id?: number
  collapsed?: boolean
  depth?: number
}

/** One open document in the tab strip (SYS-02 multi-document). */
export interface DocJson {
  id: number
  title: string
  dirty: boolean
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
  /** Stage background opacity 0..=1 (H01). Optional for legacy test fixtures. */
  background_alpha?: number
  duration: number
  clipboard_len: number
  /** SYS-03 stage-object clipboard length (session state). */
  object_clipboard_len?: number
  event_log: string[]
  /** SYS-02 document lifecycle (optional for legacy test fixtures) */
  doc_id?: number
  doc_title?: string
  dirty?: boolean
  doc_count?: number
  docs?: DocJson[]
  units?: string
  platform?: string
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
  /** createdAt = epoch-seconds (caller's clock; wasm has none). */
  kineora_new_default(createdAt: number): boolean
  // u64 BRIDGE (wasm-bindgen): every Rust `u64` crosses the wire as a JS
  // `bigint` — params REQUIRE bigint (a plain number throws TypeError at the
  // boundary) and returns ARRIVE as bigint. These members are typed at the
  // wire level; the typed facade in client.ts converts to/from plain numbers
  // (asU64/asNum) so the rest of the UI never touches a bigint.
  /** SYS-02 New dialog: full Settings JSON → new tab id. */
  kineora_new_full?(settingsJson: string): bigint
  /** Multi-document manager */
  kineora_doc_count?(): number
  kineora_doc_list?(): string
  kineora_active_doc_id?(): bigint
  kineora_set_active_doc?(id: bigint): boolean
  kineora_close_doc?(id: bigint): boolean
  /** H02 app.tab.reorder — move an open document within the open-set (view/
   *  session state; the active document is unchanged). toIndex = u32 → number. */
  kineora_reorder?(id: bigint, toIndex: number): boolean
  kineora_set_doc_title?(id: bigint, title: string): boolean
  /** Open a JSON document as a NEW tab (template seeding). Returns id. */
  kineora_open_json?(json: string, title: string): bigint
  /** H05 — stamp meta.modifiedAt on the active document (epoch seconds).
   *  Called by the save flow immediately before kineora_mark_clean. */
  kineora_set_modified_at?(epochSecs: number): boolean
  /** Mark the active document clean (Save success). */
  kineora_mark_clean?(): boolean
  kineora_draw_rect(x: number, y: number, w: number, h: number, fill: string): bigint
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
  kineora_insert_frame(frame: number): boolean
  kineora_delete_frame(frame: number): boolean
  kineora_move_keyframe(layer: number, from: number, to: number): boolean
  kineora_duplicate_keyframe(layer: number, from: number, to: number): boolean
  kineora_copy_frames(layer: number, start: number, end: number): boolean
  kineora_cut_frames(layer: number, start: number, end: number): boolean
  kineora_paste_frames(layer: number, at: number): boolean
  kineora_remove_frames(layer: number, start: number, end: number): boolean
  kineora_reverse_frames(layer: number, start: number, end: number): boolean
  kineora_set_classic_tween(layer: number, start: number, end: number, ease: number): boolean
  kineora_remove_classic_tween(layer: number, start: number): boolean
  kineora_move_keyframe_sequence(layer: number, from: number, to: number, overwrite: boolean): boolean
  kineora_resize_span(layer: number, anchor: number, delta: number): boolean
  kineora_duplicate_frames(layer: number, start: number, end: number): boolean
  kineora_convert_to_keyframes(layer: number, start: number, end: number): boolean
  kineora_convert_to_blank_keyframes(layer: number, start: number, end: number): boolean
  kineora_set_frame_label(layer: number, frame: number, label: string | null): boolean
  kineora_convert_to_symbol(name: string, symbolType: string, regGrid: number): bigint
  kineora_new_symbol(name: string, symbolType: string): bigint
  kineora_place_symbol(symbolId: bigint, x: number, y: number): bigint
  kineora_rename_symbol(symbolId: bigint, name: string): boolean
  kineora_delete_symbol(symbolId: bigint, breakApart: boolean): boolean
  kineora_swap_instance(instanceId: bigint, symbolId: bigint): boolean
  kineora_set_instance_loop(instanceId: bigint, loopMode: string, firstFrame: number): boolean
  kineora_library(): string
  kineora_undo(): boolean
  kineora_redo(): boolean
  kineora_evaluate(frame: number): string
  kineora_export_svg(frame: number): string
  kineora_export_svg_scaled(frame: number, scale: number): string
  kineora_save(path: string): boolean
  kineora_load(path: string): boolean
  kineora_status(): string
  kineora_project_json?(): string
  kineora_load_json?(json: string, title: string): boolean
  kineora_set_active_layer(index: number): boolean
  kineora_create_layer(): number
  kineora_create_folder?(): number
  /** Insert ▸ Scene (Part 25.1): returns the new 1-based scene number; 0 = failure. */
  kineora_create_scene?(): number
  kineora_set_layer_parent?(child: number, parent: number): boolean
  kineora_set_folder_collapsed?(index: number, collapsed: boolean): boolean
  kineora_delete_layer(index: number): boolean
  kineora_rename_layer(index: number, name: string): boolean
  kineora_set_layer_visible(index: number, visible: boolean): boolean
  kineora_set_layer_locked(index: number, locked: boolean): boolean
  kineora_set_layer_outline(index: number, outline: boolean): boolean
  kineora_set_layer_outline_color(index: number, color: string): boolean
  kineora_toggle_other_layers_visible(exclude: number): boolean
  kineora_toggle_other_layers_locked(exclude: number): boolean
  kineora_toggle_other_layers_outline(exclude: number): boolean
  kineora_duplicate_layer(index: number): number
  kineora_move_layer(from: number, to: number): boolean
  kineora_patch_transforms(json: string): void
  kineora_set_node_props(json: string): void
  kineora_set_document_settings(json: string): boolean
  kineora_copy_objects?(): boolean
  kineora_cut_objects?(): boolean
  kineora_delete_selection?(): boolean
  kineora_paste_objects?(mode: string): boolean
  kineora_duplicate_objects?(): boolean
  kineora_rotate_selection?(degrees: number): boolean
  kineora_flip_selection?(horizontal: boolean): boolean
  kineora_remove_transform?(): boolean
  kineora_arrange_selection?(op: string): boolean
  kineora_align_selection?(op: string, space: string): boolean
  /** wasm-bindgen --target web default init (accepts explicit wasm input). */
  default?: (input?: ArrayBuffer | Response | string | URL) => Promise<unknown>
}
