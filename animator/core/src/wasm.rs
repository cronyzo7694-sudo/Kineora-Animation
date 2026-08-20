//! WASM facade (IMP-DEC-002). Exposes the Rust `Session` to JS via JSON strings.
//! Only compiled for `wasm32-unknown-unknown`; native `cargo test` ignores it.
//! Single-threaded pattern: thread_local RefCell (wasm has one JS thread for
//! synchronous engine calls; heavy jobs go through Tauri native commands later).

#![cfg(target_arch = "wasm32")]

use std::cell::RefCell;

use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::command::History;
use crate::id::NodeId;
use crate::model::Document;
use crate::session::{NodePropsPatch, SettingsPatch, TransformPatch};
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
}

/// Layer row for the Layers panel (Part 20 / C-22).
#[derive(Serialize)]
struct LayerOut {
    id: u64,
    name: String,
    visible: bool,
    locked: bool,
    active: bool,
    /// number of selected objects that live on this layer at the playhead
    selected_objects: u32,
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
    #[serde(default)]
    background: Option<String>,
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
        })
    })
    .unwrap_or(false)
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
        // Per-node detail (base dims + current scale/rotation + base style)
        // for exact math and the Properties panel (Part 26.2).
        let selection_details = s
            .selection
            .iter()
            .filter_map(|id| {
                let t = s.selected_transform(*id)?;
                let base = s.doc.nodes.get(id)?;
                let (base_w, base_h, fill, stroke, stroke_width) = match base {
                    crate::model::Node::Rect {
                        width,
                        height,
                        fill,
                        stroke,
                        stroke_width,
                        ..
                    } => (*width, *height, fill.clone(), stroke.clone(), *stroke_width),
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
                    fill,
                    stroke,
                    stroke_width,
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
                        LayerOut {
                            id: l.id.0,
                            name: l.name.clone(),
                            visible: l.visible,
                            locked: l.locked,
                            active: i == s.active_layer,
                            selected_objects,
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
            event_log: s.event_log.clone(),
        };
        serde_json::to_string(&out).unwrap_or_else(|_| "{}".into())
    })
    .unwrap_or_else(|_| "{}".into())
}
