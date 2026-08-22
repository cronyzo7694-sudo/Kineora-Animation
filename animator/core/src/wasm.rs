//! WASM facade (IMP-DEC-002). Exposes the Rust `Session` to JS via JSON strings.
//! Only compiled for `wasm32-unknown-unknown`; native `cargo test` ignores it.
//! Single-threaded pattern: thread_local RefCell (wasm has one JS thread for
//! synchronous engine calls; heavy jobs go through Tauri native commands later).
//!
//! Multi-document (SYS-02 §12): a `DocManager` holds the open documents; every
//! existing `kineora_*` edit/eval facade operates on the ACTIVE document, so
//! multi-doc is real (per-doc Session = per-doc undo history, selection,
//! playhead, library) — never a title-only fake.

#![cfg(target_arch = "wasm32")]

use std::cell::RefCell;

use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::doc_manager::DocManager;
use crate::edit_ops::{AlignOp, AlignSpace, ArrangeOp, PasteMode};
use crate::id::{NodeId, SymbolId};
use crate::model::{Document, LoopMode, SymbolType};
use crate::session::{NodePropsPatch, SettingsPatch, TransformPatch};
use crate::{Session, Settings};

thread_local! {
    static DOCS: RefCell<DocManager> = const { RefCell::new(DocManager::new()) };
}

/// Run `f` against the ACTIVE document's session (all edit/eval facades).
fn with_session<T>(f: impl FnOnce(&mut Session) -> T) -> Result<T, JsValue> {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        let doc = m
            .active_mut()
            .ok_or_else(|| JsValue::from_str("no document open — call kineora_new first"))?;
        Ok(f(&mut doc.session))
    })
}

/// Per-document entry for the tab strip (SYS-01 app.tab chrome).
#[derive(Serialize)]
struct DocOut {
    id: u64,
    title: String,
    dirty: bool,
}

#[derive(Serialize)]
struct SelRect {
    id: u64,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    rotation: f64,
}

/// Full per-selected-node detail: base (unscaled) dims + current scale/rotation
/// so the UI can compute exact scale/rotate transforms (Part 04 semantics),
/// plus base style props for the Properties panel (Part 26.2).
#[derive(Serialize)]
struct SelDetail {
    id: u64,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
    base_w: f64,
    base_h: f64,
    scale_x: f64,
    scale_y: f64,
    rotation: f64,
    fill: String,
    stroke: Option<String>,
    stroke_width: f64,
    /// "rect" | "instance" (Part 11 — the Properties panel branches on this).
    kind: &'static str,
    /// Present for instances: the referenced symbol's id, name, type, loop mode
    /// and first frame (Part 11 §11.4/§11.6 — drives the Properties controls).
    symbol_id: Option<u64>,
    symbol_name: Option<String>,
    symbol_type: Option<String>,
    loop_mode: Option<String>,
    first_frame: Option<u32>,
    /// Whether the instance's symbol currently has no drawable content at the
    /// playhead (an "empty" symbol — shown honestly in Properties).
    empty: bool,
}

/// Keyframe marker for the timeline (Part 07 §7.2): solid dot = keyframe,
/// hollow dot = blank keyframe; `label` = named-frame flag (red flag).
#[derive(Serialize)]
struct FrameMarkerOut {
    frame: u32,
    blank: bool,
    label: Option<String>,
}

/// Classic tween span for the timeline (Part 09.2).
#[derive(Serialize)]
struct TweenOut {
    start: u32,
    end: u32,
    ease: f64,
}

/// Layer row for the Layers panel / timeline (Part 20 / C-22 / Part 07).
#[derive(Serialize)]
struct LayerOut {
    id: u64,
    name: String,
    visible: bool,
    locked: bool,
    /// Outline-mode view aid (F-07-02 E3 / F-20-01) — strokes-only rendering.
    outline: bool,
    /// Layer outline color (Part 33 `layer.outlineColor`, F-20-01).
    outline_color: String,
    active: bool,
    /// number of selected objects that live on this layer at the playhead
    selected_objects: u32,
    /// sparse keyframe markers (ascending) for the timeline frame cells
    keyframes: Vec<FrameMarkerOut>,
    /// classic tween spans (ascending by start) for the timeline
    tweens: Vec<TweenOut>,
}

#[derive(serde::Deserialize)]
struct TransIn {
    id: u64,
    x: f64,
    y: f64,
    scale_x: f64,
    scale_y: f64,
    rotation: f64,
    skew_x: f64,
    skew_y: f64,
    pivot_x: f64,
    pivot_y: f64,
}

/// Transform field patch: absent/null = leave unchanged.
#[derive(serde::Deserialize)]
struct PatchIn {
    id: u64,
    #[serde(default)]
    x: Option<f64>,
    #[serde(default)]
    y: Option<f64>,
    #[serde(default)]
    scale_x: Option<f64>,
    #[serde(default)]
    scale_y: Option<f64>,
    #[serde(default)]
    rotation: Option<f64>,
}

/// Base-property patch: absent/null = leave unchanged.
#[derive(serde::Deserialize)]
struct PropsIn {
    id: u64,
    #[serde(default)]
    width: Option<f64>,
    #[serde(default)]
    height: Option<f64>,
    #[serde(default)]
    fill: Option<String>,
    #[serde(default)]
    stroke_enabled: Option<bool>,
    #[serde(default)]
    stroke: Option<String>,
    #[serde(default)]
    stroke_width: Option<f64>,
}

/// Document-settings patch: absent/null = leave unchanged.
#[derive(serde::Deserialize)]
struct SettingsIn {
    #[serde(default)]
    width: Option<f64>,
    #[serde(default)]
    height: Option<f64>,
    #[serde(default)]
    fps: Option<u32>,
    #[serde(default, alias = "backgroundColor")]
    background: Option<String>,
    #[serde(default, rename = "backgroundAlpha", alias = "background_alpha")]
    background_alpha: Option<f64>,
}

#[derive(Serialize)]
struct StatusOut {
    playhead: u32,
    selection: Vec<u64>,
    selection_rects: Vec<SelRect>,
    selection_details: Vec<SelDetail>,
    undo_len: usize,
    redo_len: usize,
    scene: String,
    layer: String,
    layers: Vec<LayerOut>,
    active_layer: usize,
    fps: u32,
    doc_width: f64,
    doc_height: f64,
    background: String,
    /// Stage background opacity 0..=1 (Part 33 §33.1; H01).
    background_alpha: f64,
    /// derived timeline duration (max keyframe frame, min 1) — Part 07 §7.0
    duration: u32,
    /// number of records in the frame clipboard (session state, F-07-12)
    clipboard_len: usize,
    /// number of records in the stage-object clipboard (SYS-03)
    object_clipboard_len: usize,
    event_log: Vec<String>,
    // ——— SYS-02 document lifecycle ———
    /// Active document tab id (0 = no document open).
    doc_id: u64,
    /// Active document display title ("Untitled-1" | file name).
    doc_title: String,
    /// STM-DIRTY: active document has unsaved edits.
    dirty: bool,
    /// Number of open documents.
    doc_count: u32,
    /// Open-document list for the tab strip.
    docs: Vec<DocOut>,
    /// Document settings: ruler units + platform (Part 01 §1.7).
    units: String,
    platform: String,
}

/// Create a fresh document with the given core settings (legacy 4-arg form —
/// units/platform default). Returns true on success.
#[wasm_bindgen]
pub fn kineora_new(width: f64, height: f64, fps: u32, background: String) -> bool {
    let settings = Settings {
        width,
        height,
        fps,
        background,
        ..Settings::default()
    };
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        let title = m.next_untitled();
        m.push_new(settings, title);
    });
    true
}

/// Create a fresh document from a full Settings JSON (SYS-02 New dialog:
/// platform/W/H/fps/background/backgroundAlpha/units). The JSON may carry a
/// `createdAt` (epoch-seconds, stamped by the New command — H01 meta
/// ownership; wasm has no wall clock). Returns the new document's tab id.
#[wasm_bindgen]
pub fn kineora_new_full(settings_json: String) -> u64 {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&settings_json) else {
        return 0;
    };
    let created_at = value
        .get("createdAt")
        .and_then(serde_json::Value::as_u64)
        .unwrap_or(0);
    let Ok(settings) = serde_json::from_value::<Settings>(value) else {
        return 0;
    };
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        let title = m.next_untitled();
        m.push_new_with_meta(settings, title, created_at)
    })
}

/// Create a fresh document with the canonical defaults (1920×1080 @ 24fps,
/// #ffffff α=1, HTML5 Canvas, px). Single source of truth for the default
/// stage — the UI loader calls this so the size can never drift from the
/// Rust default. `created_at` = epoch-seconds from the caller (wasm has no
/// wall clock; non-finite/negative → 0 = unknown).
#[wasm_bindgen]
pub fn kineora_new_default(created_at: f64) -> bool {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        let title = m.next_untitled();
        let stamp = if created_at.is_finite() && created_at >= 0.0 {
            created_at as u64
        } else {
            0
        };
        m.push_new_with_meta(Settings::default(), title, stamp);
    });
    true
}

// ——— Multi-document manager facade (SYS-02 §12) ———

/// Number of open documents.
#[wasm_bindgen]
pub fn kineora_doc_count() -> u32 {
    DOCS.with(|d| d.borrow().len() as u32)
}

/// JSON array of open documents `[{id,title,dirty}, …]` for the tab strip.
#[wasm_bindgen]
pub fn kineora_doc_list() -> String {
    DOCS.with(|d| {
        let m = d.borrow();
        let out: Vec<DocOut> = m
            .docs()
            .iter()
            .map(|doc| DocOut {
                id: doc.id,
                title: doc.title.clone(),
                dirty: doc.session.is_dirty(),
            })
            .collect();
        serde_json::to_string(&out).unwrap_or_else(|_| "[]".into())
    })
}

/// The active document's stable tab id (0 when no document is open).
#[wasm_bindgen]
pub fn kineora_active_doc_id() -> u64 {
    DOCS.with(|d| d.borrow().active_id())
}

/// Switch the active document (SYS-02 tab activation → activeDoc:changed).
#[wasm_bindgen]
pub fn kineora_set_active_doc(id: u64) -> bool {
    DOCS.with(|d| d.borrow_mut().set_active(id))
}

/// Close a document by tab id. If it was active, the neighbour becomes active;
/// closing the last document leaves the no-document state.
#[wasm_bindgen]
pub fn kineora_close_doc(id: u64) -> bool {
    DOCS.with(|d| d.borrow_mut().close(id))
}

/// Reorder the open-set by stable document id (H02 `app.tab.reorder`).
/// View/SESSION state: the active document is NEVER changed by a reorder, and
/// no document content/History/dirty is touched. False when `id` is not open.
#[wasm_bindgen]
pub fn kineora_reorder(id: u64, to_index: u32) -> bool {
    DOCS.with(|d| d.borrow_mut().reorder(id, to_index as usize))
}

/// Set a document's display title (Save As naming / Open filename).
#[wasm_bindgen]
pub fn kineora_set_doc_title(id: u64, title: String) -> bool {
    DOCS.with(|d| d.borrow_mut().set_title(id, title))
}

/// Open a document from JSON as a NEW tab (New-from-template seeding). Returns
/// the new tab id (0 = parse failure). An EMPTY title means New-from-Template
/// seeding: the document gets its OWN Untitled-N title (H01; AMB-H01-003
/// provisional = UNTITLED — never the template's name).
#[wasm_bindgen]
pub fn kineora_open_json(json: String, title: String) -> u64 {
    let Ok(doc) = serde_json::from_str::<Document>(&json) else {
        return 0;
    };
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        if title.is_empty() {
            m.push_seed(doc)
        } else {
            m.push_opened(doc, title)
        }
    })
}

/// H05: stamp `meta.modifiedAt` (epoch seconds, caller-supplied — wasm has
/// no wall clock) on the ACTIVE document. The save flow calls this
/// IMMEDIATELY BEFORE `kineora_mark_clean` so the saved snapshot includes the
/// stamp (H05 §7.1 binding order: write → modifiedAt → snapshot advance →
/// CLEAN → `saving:changed{saved}`). Not a document mutation on its own —
/// it never sets DIRTY (dirty is resolved by the save flow itself).
#[wasm_bindgen]
pub fn kineora_set_modified_at(epoch_secs: u64) -> bool {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        if let Some(doc) = m.active_mut() {
            doc.session.doc.meta.modified_at = Some(epoch_secs);
            true
        } else {
            false
        }
    })
}

/// Mark the ACTIVE document clean (Save success → STM-DIRTY CLEAN).
#[wasm_bindgen]
pub fn kineora_mark_clean() -> bool {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        if let Some(doc) = m.active_mut() {
            doc.session.mark_clean();
            true
        } else {
            false
        }
    })
}

/// Draw a rectangle into the current frame/keyframe. Returns the new node id.
#[wasm_bindgen]
pub fn kineora_draw_rect(x: f64, y: f64, w: f64, h: f64, fill: String) -> u64 {
    with_session(|s| s.draw_rect(x, y, w, h, &fill).0).unwrap_or(0)
}

/// Hit-test at (x,y) and update the selection. Returns true if something hit.
#[wasm_bindgen]
pub fn kineora_select_at(x: f64, y: f64) -> bool {
    with_session(|s| s.select_at(x, y)).unwrap_or(false)
}

/// Shift+click toggle selection (add/remove). Returns true if something hit.
#[wasm_bindgen]
pub fn kineora_select_toggle_at(x: f64, y: f64) -> bool {
    with_session(|s| s.select_toggle_at(x, y)).unwrap_or(false)
}

/// Marquee selection: replace selection with nodes touching the doc-space rect.
#[wasm_bindgen]
pub fn kineora_select_in_rect(x0: f64, y0: f64, x1: f64, y1: f64) {
    let _ = with_session(|s| s.select_in_rect(x0, y0, x1, y1));
}

/// Apply absolute transforms to the selection (one undoable command).
/// `transforms_json` = JSON array of the full Transform shape.
#[wasm_bindgen]
pub fn kineora_transform_selection(transforms_json: String) {
    let parsed: Result<Vec<TransIn>, _> = serde_json::from_str(&transforms_json);
    let Ok(list) = parsed else { return };
    let after: Vec<(crate::id::NodeId, crate::model::Transform)> = list
        .into_iter()
        .map(|t| {
            (
                crate::id::NodeId(t.id),
                crate::model::Transform {
                    x: t.x,
                    y: t.y,
                    scale_x: t.scale_x,
                    scale_y: t.scale_y,
                    rotation: t.rotation,
                    skew_x: t.skew_x,
                    skew_y: t.skew_y,
                    pivot_x: t.pivot_x,
                    pivot_y: t.pivot_y,
                },
            )
        })
        .collect();
    let _ = with_session(|s| s.transform_selection(after));
}

#[wasm_bindgen]
pub fn kineora_select_all() {
    let _ = with_session(|s| s.select_all());
}

#[wasm_bindgen]
pub fn kineora_clear_selection() {
    let _ = with_session(|s| s.clear_selection());
}

#[wasm_bindgen]
pub fn kineora_move_selection(dx: f64, dy: f64) {
    let _ = with_session(|s| s.move_selection(dx, dy));
}

#[wasm_bindgen]
pub fn kineora_set_playhead(frame: u32) {
    let _ = with_session(|s| s.set_playhead(frame));
}

/// F6 — insert a keyframe copying previous content. Returns false when it was
/// a no-op (locked layer, or the frame is already a content keyframe).
#[wasm_bindgen]
pub fn kineora_insert_keyframe(frame: u32) -> bool {
    with_session(|s| s.insert_keyframe(frame)).unwrap_or(false)
}

/// F7 — insert a BLANK keyframe at `frame` (breaks the hold). Returns false
/// when the layer is locked (or the engine is absent).
#[wasm_bindgen]
pub fn kineora_insert_blank_keyframe(frame: u32) -> bool {
    with_session(|s| s.insert_blank_keyframe(frame)).unwrap_or(false)
}

/// Shift+F6 — remove the keyframe status at `frame` (revert to hold). Returns
/// false when there is no keyframe there or the layer is locked.
#[wasm_bindgen]
pub fn kineora_clear_keyframe(frame: u32) -> bool {
    with_session(|s| s.clear_keyframe(frame)).unwrap_or(false)
}

/// F5 — insert a frame (extend the hold at `frame`; later keyframes shift
/// right). Returns false on no-op / locked layer.
#[wasm_bindgen]
pub fn kineora_insert_frame(frame: u32) -> bool {
    with_session(|s| s.insert_frame(frame)).unwrap_or(false)
}

/// Shift+F5 — delete one frame at `frame` (later keyframes shift left).
/// Returns false on no-op / locked layer.
#[wasm_bindgen]
pub fn kineora_delete_frame(frame: u32) -> bool {
    with_session(|s| s.delete_frame(frame)).unwrap_or(false)
}

/// Drag a keyframe on `layer` from `from` to `to` (Part 07 §7.4.9). Returns
/// false on no-op / collision / locked layer.
#[wasm_bindgen]
pub fn kineora_move_keyframe(layer: u32, from: u32, to: u32) -> bool {
    with_session(|s| s.move_keyframe(layer as usize, from, to)).unwrap_or(false)
}

/// Alt/Option-drag a keyframe to duplicate it (F-07-12 E1). Returns false on
/// no-op / collision / locked layer.
#[wasm_bindgen]
pub fn kineora_duplicate_keyframe(layer: u32, from: u32, to: u32) -> bool {
    with_session(|s| s.duplicate_keyframe(layer as usize, from, to)).unwrap_or(false)
}

/// COPY FRAMES — snapshot keyframes in [start,end] into the frame clipboard
/// (session state, no command). Returns false when the range holds nothing.
#[wasm_bindgen]
pub fn kineora_copy_frames(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.copy_frames(layer as usize, start, end)).unwrap_or(false)
}

/// CUT FRAMES — copy + remove keyframes in [start,end] (one undoable command).
#[wasm_bindgen]
pub fn kineora_cut_frames(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.cut_frames(layer as usize, start, end)).unwrap_or(false)
}

/// PASTE FRAMES — insert clipboard records at `at` on `layer` (one command).
#[wasm_bindgen]
pub fn kineora_paste_frames(layer: u32, at: u32) -> bool {
    with_session(|s| s.paste_frames(layer as usize, at)).unwrap_or(false)
}

/// REMOVE FRAMES — delete keyframes in [start,end] leaving a gap (one command).
#[wasm_bindgen]
pub fn kineora_remove_frames(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.remove_frames(layer as usize, start, end)).unwrap_or(false)
}

/// REVERSE FRAMES — reverse keyframe order in [start,end] (one command).
#[wasm_bindgen]
pub fn kineora_reverse_frames(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.reverse_frames(layer as usize, start, end)).unwrap_or(false)
}

/// Create/update a classic tween span between two same-object keyframes
/// (Part 09.2). One undoable command.
#[wasm_bindgen]
pub fn kineora_set_classic_tween(layer: u32, start: u32, end: u32, ease: f64) -> bool {
    with_session(|s| s.set_classic_tween(layer as usize, start, end, ease)).unwrap_or(false)
}

/// Remove a classic tween span (F-07-13 "Remove Tween"). One undoable command.
#[wasm_bindgen]
pub fn kineora_remove_classic_tween(layer: u32, start: u32) -> bool {
    with_session(|s| s.remove_classic_tween(layer as usize, start)).unwrap_or(false)
}

/// Drag a keyframe together with its held span (Part 07 §7.4.9).
#[wasm_bindgen]
pub fn kineora_move_keyframe_sequence(layer: u32, from: u32, to: u32, overwrite: bool) -> bool {
    with_session(|s| s.move_keyframe_sequence(layer as usize, from, to, overwrite)).unwrap_or(false)
}

/// Drag a span edge to resize exposure (Part 07 §7.4.11 / F-15-05).
#[wasm_bindgen]
pub fn kineora_resize_span(layer: u32, anchor: u32, delta: i32) -> bool {
    with_session(|s| s.resize_span(layer as usize, anchor, delta as i64)).unwrap_or(false)
}

/// Duplicate the selected frame range (Part 07 §7.4.8).
#[wasm_bindgen]
pub fn kineora_duplicate_frames(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.duplicate_frames(layer as usize, start, end)).unwrap_or(false)
}

/// Convert held frames in [start,end] into keyframes (Part 07 §7.4.12).
#[wasm_bindgen]
pub fn kineora_convert_to_keyframes(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.convert_to_keyframes(layer as usize, start, end)).unwrap_or(false)
}

/// Convert frames in [start,end] into blank keyframes (Part 07 §7.4.12).
#[wasm_bindgen]
pub fn kineora_convert_to_blank_keyframes(layer: u32, start: u32, end: u32) -> bool {
    with_session(|s| s.convert_to_blank_keyframes(layer as usize, start, end)).unwrap_or(false)
}

/// Set/clear a keyframe label (Part 07 §7.2 / Part 33.8).
#[wasm_bindgen]
pub fn kineora_set_frame_label(layer: u32, frame: u32, label: Option<String>) -> bool {
    with_session(|s| s.set_frame_label(layer as usize, frame, label.as_deref())).unwrap_or(false)
}

// ——— Symbols + Library (Part 11/12) ———

/// F8 — convert the selection into a symbol. `reg_grid` = 0..8 (9-point grid,
/// 4 = center). Returns the new instance id (0 on no-op).
#[wasm_bindgen]
pub fn kineora_convert_to_symbol(name: String, symbol_type: String, reg_grid: u32) -> u64 {
    let ty = match symbol_type.as_str() {
        "movieClip" => SymbolType::MovieClip,
        "button" => SymbolType::Button,
        _ => SymbolType::Graphic,
    };
    with_session(|s| s.convert_selection_to_symbol(&name, ty, reg_grid as u8).0).unwrap_or(0)
}

/// Ctrl+F8 — create an empty symbol. Returns its id (0 on failure).
#[wasm_bindgen]
pub fn kineora_new_symbol(name: String, symbol_type: String) -> u64 {
    let ty = match symbol_type.as_str() {
        "movieClip" => SymbolType::MovieClip,
        "button" => SymbolType::Button,
        _ => SymbolType::Graphic,
    };
    with_session(|s| s.new_symbol(&name, ty).0).unwrap_or(0)
}

/// Place an instance of a symbol at (x, y) on the current frame. Returns the
/// instance id (0 on failure).
#[wasm_bindgen]
pub fn kineora_place_symbol(symbol_id: u64, x: f64, y: f64) -> u64 {
    with_session(|s| s.place_symbol(SymbolId(symbol_id), x, y).0).unwrap_or(0)
}

#[wasm_bindgen]
pub fn kineora_rename_symbol(symbol_id: u64, name: String) -> bool {
    with_session(|s| s.rename_symbol(SymbolId(symbol_id), &name)).unwrap_or(false)
}

/// Delete a symbol. `break_apart` = leave its instances as raw content.
#[wasm_bindgen]
pub fn kineora_delete_symbol(symbol_id: u64, break_apart: bool) -> bool {
    with_session(|s| s.delete_symbol(SymbolId(symbol_id), break_apart)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_swap_instance(instance_id: u64, symbol_id: u64) -> bool {
    with_session(|s| s.swap_instance(NodeId(instance_id), SymbolId(symbol_id))).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_set_instance_loop(instance_id: u64, loop_mode: String, first_frame: u32) -> bool {
    let mode = match loop_mode.as_str() {
        "playOnce" => LoopMode::PlayOnce,
        "singleFrame" => LoopMode::SingleFrame,
        _ => LoopMode::Loop,
    };
    with_session(|s| s.set_instance_loop(NodeId(instance_id), mode, first_frame)).unwrap_or(false)
}

/// Library snapshot as JSON: [{id, name, type, use_count, duration}].
#[wasm_bindgen]
pub fn kineora_library() -> String {
    #[derive(serde::Serialize)]
    struct LibOut {
        id: u64,
        name: String,
        #[serde(rename = "type")]
        symbol_type: String,
        use_count: u32,
        duration: u32,
    }
    with_session(|s| {
        let list: Vec<LibOut> = s
            .library()
            .into_iter()
            .map(|(id, name, ty, use_count, dur)| LibOut {
                id: id.0,
                name,
                symbol_type: match ty {
                    SymbolType::Graphic => "graphic".into(),
                    SymbolType::MovieClip => "movieClip".into(),
                    SymbolType::Button => "button".into(),
                },
                use_count,
                duration: dur,
            })
            .collect();
        serde_json::to_string(&list).unwrap_or_else(|_| "[]".into())
    })
    .unwrap_or_else(|_| "[]".into())
}

#[wasm_bindgen]
pub fn kineora_undo() -> bool {
    with_session(|s| s.undo()).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_redo() -> bool {
    with_session(|s| s.redo()).unwrap_or(false)
}

/// Evaluate a frame → JSON array of RectItems (render/export tree).
#[wasm_bindgen]
pub fn kineora_evaluate(frame: u32) -> String {
    with_session(|s| serde_json::to_string(&s.evaluate(frame)).unwrap_or_else(|_| "[]".into()))
        .unwrap_or_else(|_| "[]".into())
}

/// Export the current scene at `frame` as SVG (no authoring overlays).
#[wasm_bindgen]
pub fn kineora_export_svg(frame: u32) -> String {
    with_session(|s| s.export_svg(frame)).unwrap_or_default()
}

/// SVG export with a supersampling scale (1×/2×/4× — Part 28.1). Same content
/// pass as `kineora_export_svg`; only the outer width/height scale.
#[wasm_bindgen]
pub fn kineora_export_svg_scaled(frame: u32, scale: f64) -> String {
    with_session(|s| s.export_svg_scaled(frame, scale)).unwrap_or_default()
}

/// Save the ACTIVE document to the given absolute path (JSON) and mark clean.
#[wasm_bindgen]
pub fn kineora_save(path: String) -> bool {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        let Some(doc) = m.active_mut() else {
            return false;
        };
        if doc.session.save(std::path::Path::new(&path)).is_ok() {
            doc.session.mark_clean();
            true
        } else {
            false
        }
    })
}

/// Load a document from the given absolute path, REPLACING the active document.
#[wasm_bindgen]
pub fn kineora_load(path: String) -> bool {
    match Session::load(std::path::Path::new(&path)) {
        Ok(session) => {
            DOCS.with(|d| {
                let mut m = d.borrow_mut();
                let title = path
                    .rsplit('/')
                    .next()
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| m.next_untitled());
                if let Some(doc) = m.active_mut() {
                    doc.session = session;
                    doc.title = title;
                } else {
                    m.push_session(session, title);
                }
            });
            true
        }
        Err(_) => false,
    }
}

/// Serialize the ACTIVE document to JSON (browser-friendly Save).
#[wasm_bindgen]
pub fn kineora_project_json() -> String {
    with_session(|s| serde_json::to_string(&s.doc).unwrap_or_else(|_| "{}".into()))
        .unwrap_or_else(|_| "{}".into())
}

/// Replace the ACTIVE document from a JSON string (browser-friendly Open —
/// SYS-02 §13.3 "replaces active doc", same tab slot). Returns false on parse
/// failure (no state change).
#[wasm_bindgen]
pub fn kineora_load_json(json: String, title: String) -> bool {
    match serde_json::from_str::<Document>(&json) {
        Ok(doc) => DOCS.with(|d| d.borrow_mut().replace_active(doc, title)),
        Err(_) => false,
    }
}

// ——— Layers (MOD-LAYER, Part 20) ———

#[wasm_bindgen]
pub fn kineora_set_active_layer(index: u32) -> bool {
    with_session(|s| s.set_active_layer(index as usize)).unwrap_or(false)
}

/// Create a new layer above the active one. Returns its index.
#[wasm_bindgen]
pub fn kineora_create_layer() -> u32 {
    with_session(|s| s.create_layer().unwrap_or(0) as u32).unwrap_or(0)
}

#[wasm_bindgen]
pub fn kineora_delete_layer(index: u32) -> bool {
    with_session(|s| s.delete_layer(index as usize)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_rename_layer(index: u32, name: String) -> bool {
    with_session(|s| s.rename_layer(index as usize, &name)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_set_layer_visible(index: u32, visible: bool) -> bool {
    with_session(|s| s.set_layer_visible(index as usize, visible)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_set_layer_locked(index: u32, locked: bool) -> bool {
    with_session(|s| s.set_layer_locked(index as usize, locked)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_move_layer(from: u32, to: u32) -> bool {
    with_session(|s| s.move_layer(from as usize, to as usize)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_set_layer_outline(index: u32, outline: bool) -> bool {
    with_session(|s| s.set_layer_outline(index as usize, outline)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_set_layer_outline_color(index: u32, color: String) -> bool {
    with_session(|s| s.set_layer_outline_color(index as usize, &color)).unwrap_or(false)
}

/// Alt+click "all others" batch toggles (F-07-02 E1/E2/E3 + M.3) — one undo
/// step for the whole batch.
#[wasm_bindgen]
pub fn kineora_toggle_other_layers_visible(exclude: u32) -> bool {
    with_session(|s| s.toggle_other_layers_visible(exclude as usize)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_toggle_other_layers_locked(exclude: u32) -> bool {
    with_session(|s| s.toggle_other_layers_locked(exclude as usize)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_toggle_other_layers_outline(exclude: u32) -> bool {
    with_session(|s| s.toggle_other_layers_outline(exclude as usize)).unwrap_or(false)
}

/// Duplicate a layer above the source (deep copy of frames + content).
/// Returns the new layer's index (0 on failure — a real layer never has idx 0
/// after a successful duplicate because the copy sits above the source).
#[wasm_bindgen]
pub fn kineora_duplicate_layer(index: u32) -> u32 {
    with_session(|s| s.duplicate_layer(index as usize).unwrap_or(0) as u32).unwrap_or(0)
}

// ——— Object / document properties (Part 26) ———

/// Edit transform fields at the current playhead (one undoable command).
#[wasm_bindgen]
pub fn kineora_patch_transforms(json: String) {
    let Ok(list) = serde_json::from_str::<Vec<PatchIn>>(&json) else {
        return;
    };
    let patches: Vec<(NodeId, TransformPatch)> = list
        .into_iter()
        .map(|p| {
            (
                NodeId(p.id),
                TransformPatch {
                    x: p.x,
                    y: p.y,
                    scale_x: p.scale_x,
                    scale_y: p.scale_y,
                    rotation: p.rotation,
                },
            )
        })
        .collect();
    let _ = with_session(|s| s.patch_node_transforms(patches));
}

/// Edit base node properties (one undoable command across all patched nodes).
#[wasm_bindgen]
pub fn kineora_set_node_props(json: String) {
    let Ok(list) = serde_json::from_str::<Vec<PropsIn>>(&json) else {
        return;
    };
    let patches: Vec<(NodeId, NodePropsPatch)> = list
        .into_iter()
        .map(|p| {
            (
                NodeId(p.id),
                NodePropsPatch {
                    width: p.width,
                    height: p.height,
                    fill: p.fill,
                    stroke_enabled: p.stroke_enabled,
                    stroke: p.stroke,
                    stroke_width: p.stroke_width,
                },
            )
        })
        .collect();
    let _ = with_session(|s| s.set_node_props(patches));
}

/// Edit document settings (one undoable command).
#[wasm_bindgen]
pub fn kineora_set_document_settings(json: String) -> bool {
    let Ok(p) = serde_json::from_str::<SettingsIn>(&json) else {
        return false;
    };
    with_session(|s| {
        s.set_document_settings(SettingsPatch {
            width: p.width,
            height: p.height,
            fps: p.fps,
            background: p.background,
            background_alpha: p.background_alpha,
        })
    })
    .unwrap_or(false)
}

// ——— SYS-03 object clipboard + SYS-06 transform / arrange / align ———

#[wasm_bindgen]
pub fn kineora_copy_objects() -> bool {
    with_session(|s| s.copy_objects()).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_cut_objects() -> bool {
    with_session(|s| s.cut_objects()).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_delete_selection() -> bool {
    with_session(|s| s.delete_selection()).unwrap_or(false)
}

/// `mode` = "inplace" | "center" (Blueprint 1.2.2).
#[wasm_bindgen]
pub fn kineora_paste_objects(mode: String) -> bool {
    let m = if mode == "center" {
        PasteMode::Center
    } else {
        PasteMode::InPlace
    };
    with_session(|s| s.paste_objects(m)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_duplicate_objects() -> bool {
    with_session(|s| s.duplicate_objects()).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_rotate_selection(degrees: f64) -> bool {
    with_session(|s| s.rotate_selection(degrees)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_flip_selection(horizontal: bool) -> bool {
    with_session(|s| s.flip_selection(horizontal)).unwrap_or(false)
}

#[wasm_bindgen]
pub fn kineora_remove_transform() -> bool {
    with_session(|s| s.remove_transform()).unwrap_or(false)
}

/// `op` = "front" | "forward" | "back" | "backward".
#[wasm_bindgen]
pub fn kineora_arrange_selection(op: String) -> bool {
    let a = match op.as_str() {
        "front" => ArrangeOp::Front,
        "forward" => ArrangeOp::Forward,
        "back" => ArrangeOp::Back,
        "backward" => ArrangeOp::Backward,
        _ => return false,
    };
    with_session(|s| s.arrange_selection(a)).unwrap_or(false)
}

/// `op` = left|centerH|right|top|middleV|bottom; `space` = stage|selection.
#[wasm_bindgen]
pub fn kineora_align_selection(op: String, space: String) -> bool {
    let a = match op.as_str() {
        "left" => AlignOp::Left,
        "centerH" => AlignOp::CenterH,
        "right" => AlignOp::Right,
        "top" => AlignOp::Top,
        "middleV" => AlignOp::MiddleV,
        "bottom" => AlignOp::Bottom,
        _ => return false,
    };
    let sp = if space == "stage" {
        AlignSpace::Stage
    } else {
        AlignSpace::Selection
    };
    with_session(|s| s.align_selection(a, sp)).unwrap_or(false)
}

/// Dev-mode observability: JSON status (Phase-4 manual-test requirement).
/// Includes the SYS-02 document-lifecycle fields (doc_id/doc_title/dirty/
/// doc_count/docs/units/platform) so the tab strip and dirty state stay live.
#[wasm_bindgen]
pub fn kineora_status() -> String {
    DOCS.with(|d| {
        let mut m = d.borrow_mut();
        // Doc-meta first (immutable borrows), so the mutable session borrow
        // below can span the whole status body without aliasing `m`.
        let doc_count = m.len() as u32;
        let docs: Vec<DocOut> = m
            .docs()
            .iter()
            .map(|x| DocOut {
                id: x.id,
                title: x.title.clone(),
                dirty: x.session.is_dirty(),
            })
            .collect();
        let (doc_id, doc_title) = match m.active_mut() {
            Some(doc) => (doc.id, doc.title.clone()),
            None => return "{}".to_string(),
        };
        let s = &mut m.active_mut().expect("active doc exists").session;
        let scene = s
            .doc
            .scenes
            .get(s.active_scene)
            .map(|sc| sc.name.clone())
            .unwrap_or_default();
        let layer = s
            .doc
            .scene(s.active_scene)
            .and_then(|sc| sc.layers.get(s.active_layer))
            .map(|l| l.name.clone())
            .unwrap_or_default();
        let sel: Vec<u64> = s.selection.iter().map(|id| id.0).collect();
        // Selection bounds at the CURRENT playhead (authoring overlay source).
        let selection_rects = s
            .evaluate(s.playhead)
            .into_iter()
            .filter(|it| sel.contains(&it.id))
            .map(|it| SelRect {
                id: it.id,
                x: it.x,
                y: it.y,
                w: it.w,
                h: it.h,
                rotation: it.rotation,
            })
            .collect();
        // Per-node detail (base dims + current scale/rotation + base style)
        // for exact math and the Properties panel (Part 26.2). Instances carry
        // their symbol's name/type (Part 11 — Properties shows the symbol name).
        let selection_details = s
            .selection
            .iter()
            .filter_map(|id| {
                let t = s.selected_transform(*id)?;
                let base = s.doc.nodes.get(id)?;
                let (
                    base_w,
                    base_h,
                    fill,
                    stroke,
                    stroke_width,
                    kind,
                    sid,
                    name,
                    ty,
                    loop_mode,
                    first_frame,
                    empty,
                ) = match base {
                    crate::model::Node::Rect {
                        width,
                        height,
                        fill,
                        stroke,
                        stroke_width,
                        ..
                    } => (
                        *width,
                        *height,
                        fill.clone(),
                        stroke.clone(),
                        *stroke_width,
                        "rect",
                        None,
                        None,
                        None,
                        None,
                        None,
                        false,
                    ),
                    crate::model::Node::SymbolInstance {
                        symbol_id,
                        loop_mode,
                        first_frame,
                        ..
                    } => {
                        let sym = s.doc.symbol(*symbol_id);
                        let name = sym.map(|x| x.name.clone());
                        let ty = sym.map(|x| {
                            match x.symbol_type {
                                crate::model::SymbolType::Graphic => "graphic",
                                crate::model::SymbolType::MovieClip => "movieClip",
                                crate::model::SymbolType::Button => "button",
                            }
                            .to_string()
                        });
                        // real rendered bounds (incl. the empty-symbol marker)
                        let (bw, bh, is_empty) =
                            match crate::eval::node_bounds(&s.doc, s.active_scene, s.playhead, *id)
                            {
                                Some((a, b, c, d)) => (c - a, d - b, false),
                                None => (0.0, 0.0, true),
                            };
                        let lm = match loop_mode {
                            crate::model::LoopMode::Loop => "loop",
                            crate::model::LoopMode::PlayOnce => "playOnce",
                            crate::model::LoopMode::SingleFrame => "singleFrame",
                        };
                        (
                            bw,
                            bh,
                            String::new(),
                            None,
                            0.0,
                            "instance",
                            Some(symbol_id.0),
                            name,
                            ty,
                            Some(lm.to_string()),
                            Some(*first_frame),
                            is_empty,
                        )
                    }
                };
                // instance bounds are already scene-space (transform applied by
                // node_bounds); rect base dims are unscaled.
                let (w, h) = if kind == "instance" {
                    (base_w, base_h)
                } else {
                    (base_w * t.scale_x, base_h * t.scale_y)
                };
                Some(SelDetail {
                    id: id.0,
                    x: t.x,
                    y: t.y,
                    w,
                    h,
                    base_w,
                    base_h,
                    scale_x: t.scale_x,
                    scale_y: t.scale_y,
                    rotation: t.rotation,
                    fill,
                    stroke,
                    stroke_width,
                    kind,
                    symbol_id: sid,
                    symbol_name: name,
                    symbol_type: ty,
                    loop_mode,
                    first_frame,
                    empty,
                })
            })
            .collect();

        // Layer rows (bottom → top) with selection markers for the Layers panel.
        let layers = s
            .doc
            .scene(s.active_scene)
            .map(|sc| {
                sc.layers
                    .iter()
                    .enumerate()
                    .map(|(i, l)| {
                        let content = s.doc.content_at(s.active_scene, i, s.playhead);
                        let selected_objects =
                            content.iter().filter(|id| sel.contains(&id.0)).count() as u32;
                        let keyframes = l
                            .keyframes
                            .iter()
                            .map(|(f, fr)| FrameMarkerOut {
                                frame: *f,
                                blank: matches!(fr, crate::model::Frame::Blank),
                                label: match fr {
                                    crate::model::Frame::Keyframe { label, .. } => label.clone(),
                                    crate::model::Frame::Blank => None,
                                },
                            })
                            .collect();
                        let tweens = l
                            .tweens
                            .iter()
                            .map(|(start, tw)| TweenOut {
                                start: *start,
                                end: tw.end,
                                ease: tw.ease,
                            })
                            .collect();
                        LayerOut {
                            id: l.id.0,
                            name: l.name.clone(),
                            visible: l.visible,
                            locked: l.locked,
                            outline: l.outline,
                            outline_color: l.outline_color.clone(),
                            active: i == s.active_layer,
                            selected_objects,
                            keyframes,
                            tweens,
                        }
                    })
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        let out = StatusOut {
            playhead: s.playhead,
            selection: sel,
            selection_rects,
            selection_details,
            undo_len: s.history.undo_len(),
            redo_len: s.history.redo_len(),
            scene,
            layer,
            layers,
            active_layer: s.active_layer,
            fps: s.doc.settings.fps,
            doc_width: s.doc.settings.width,
            doc_height: s.doc.settings.height,
            background: s.doc.settings.background.clone(),
            background_alpha: s.doc.settings.background_alpha,
            duration: s.timeline_duration(),
            clipboard_len: s.frame_clipboard.len(),
            object_clipboard_len: crate::edit_ops::app_object_clipboard_len(),
            event_log: s.event_log.clone(),
            doc_id,
            doc_title,
            dirty: s.is_dirty(),
            doc_count,
            docs,
            units: s.doc.settings.units.clone(),
            platform: s.doc.settings.platform.clone(),
        };
        serde_json::to_string(&out).unwrap_or_else(|_| "{}".into())
    })
}
