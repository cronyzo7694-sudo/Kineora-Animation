//! WASM facade (IMP-DEC-002). Exposes the Rust `Session` to JS via JSON strings.
//! Only compiled for `wasm32-unknown-unknown`; native `cargo test` ignores it.
//! Single-threaded pattern: thread_local RefCell (wasm has one JS thread for
//! synchronous engine calls; heavy jobs go through Tauri native commands later).

#![cfg(target_arch = "wasm32")]

use std::cell::RefCell;

use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::command::History;
use crate::model::Document;
use crate::{Session, Settings};

thread_local! {
    static SESSION: RefCell<Option<Session>> = const { RefCell::new(None) };
}

fn with_session<T>(f: impl FnOnce(&mut Session) -> T) -> Result<T, JsValue> {
    SESSION.with(|s| {
        let mut b = s.borrow_mut();
        let session = b
            .as_mut()
            .ok_or_else(|| JsValue::from_str("session not initialized — call kineora_new first"))?;
        Ok(f(session))
    })
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
/// so the UI can compute exact scale/rotate transforms (Part 04 semantics).
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
    fps: u32,
    doc_width: f64,
    doc_height: f64,
    background: String,
    event_log: Vec<String>,
}

/// Create a fresh document.
#[wasm_bindgen]
pub fn kineora_new(width: f64, height: f64, fps: u32, background: String) -> bool {
    let settings = Settings {
        width,
        height,
        fps,
        background,
    };
    SESSION.with(|s| *s.borrow_mut() = Some(Session::new(settings)));
    true
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

#[wasm_bindgen]
pub fn kineora_insert_keyframe(frame: u32) {
    let _ = with_session(|s| s.insert_keyframe(frame));
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

/// Save the document to the given absolute path (JSON).
#[wasm_bindgen]
pub fn kineora_save(path: String) -> bool {
    with_session(|s| s.save(std::path::Path::new(&path)).is_ok()).unwrap_or(false)
}

/// Load a document from the given absolute path.
#[wasm_bindgen]
pub fn kineora_load(path: String) -> bool {
    match Session::load(std::path::Path::new(&path)) {
        Ok(session) => {
            SESSION.with(|s| *s.borrow_mut() = Some(session));
            true
        }
        Err(_) => false,
    }
}

/// Serialize the whole document to JSON (browser-friendly Save).
#[wasm_bindgen]
pub fn kineora_project_json() -> String {
    with_session(|s| serde_json::to_string(&s.doc).unwrap_or_else(|_| "{}".into()))
        .unwrap_or_else(|_| "{}".into())
}

/// Replace the document from a JSON string (browser-friendly Load).
#[wasm_bindgen]
pub fn kineora_load_json(json: String) -> bool {
    match serde_json::from_str::<Document>(&json) {
        Ok(doc) => {
            SESSION.with(|s| {
                *s.borrow_mut() = Some(Session {
                    doc,
                    history: History::new(),
                    selection: Vec::new(),
                    playhead: 1,
                    active_scene: 0,
                    active_layer: 0,
                    event_log: vec!["session:loaded(json)".into()],
                })
            });
            true
        }
        Err(_) => false,
    }
}

/// Dev-mode observability: JSON status (Phase-4 manual-test requirement).
#[wasm_bindgen]
pub fn kineora_status() -> String {
    with_session(|s| {
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
        // Per-node detail (base dims + current scale/rotation) for exact math.
        let selection_details = s
            .selection
            .iter()
            .filter_map(|id| {
                let t = s.selected_transform(*id)?;
                let base = s.doc.nodes.get(id)?;
                let (base_w, base_h) = match base {
                    crate::model::Node::Rect { width, height, .. } => (*width, *height),
                };
                Some(SelDetail {
                    id: id.0,
                    x: t.x,
                    y: t.y,
                    w: base_w * t.scale_x,
                    h: base_h * t.scale_y,
                    base_w,
                    base_h,
                    scale_x: t.scale_x,
                    scale_y: t.scale_y,
                    rotation: t.rotation,
                })
            })
            .collect();

        let out = StatusOut {
            playhead: s.playhead,
            selection: sel,
            selection_rects,
            selection_details,
            undo_len: s.history.undo_len(),
            redo_len: s.history.redo_len(),
            scene,
            layer,
            fps: s.doc.settings.fps,
            doc_width: s.doc.settings.width,
            doc_height: s.doc.settings.height,
            background: s.doc.settings.background.clone(),
            event_log: s.event_log.clone(),
        };
        serde_json::to_string(&out).unwrap_or_else(|_| "{}".into())
    })
    .unwrap_or_else(|_| "{}".into())
}
