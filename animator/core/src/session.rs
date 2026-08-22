use std::path::Path;

use crate::command::{
    ClearKeyframe, ConvertToBlankKeyframes, ConvertToKeyframes, ConvertToSymbol, CreateLayer,
    CreateScene, CreateSymbol, DeleteFrames, DeleteLayer, DeleteLayerGroup, DeleteSymbol, DrawRect,
    DuplicateFrames, DuplicateKeyframe, DuplicateLayer, History, InsertBlankKeyframe, InsertFrames,
    InsertKeyframe, LayerFlagKind, MoveKeyframe, MoveKeyframeSequence, MoveSelection, PasteFrames,
    PlaceSymbol, RemoveClassicTween, RemoveFrames, RenameLayer, RenameSymbol, ReorderLayer,
    ResizeSpan, ReverseFrames, SetClassicTween, SetDocumentSettings, SetFolderCollapsed,
    SetFrameLabel, SetInstanceLoop, SetLayerFlags, SetLayerLocked, SetLayerOutline,
    SetLayerOutlineColor, SetLayerParent, SetLayerVisible, SetNodeProps, SwapInstance,
    TransformSelection,
};
use crate::edit_ops::{
    app_object_clipboard, set_app_object_clipboard, AlignOp, AlignSpace, ArrangeOp,
    ArrangeSelection, DeleteSelection, ObjectClip, PasteMode, PasteObjects, DUPLICATE_OFFSET,
};
use crate::eval::{
    evaluate, hit_test, hits_in_rect, node_bounds, node_layer_index, node_transform_in_scene,
    RectItem,
};
use crate::export::{export_svg, export_svg_scaled};
use crate::id::{LayerId, NodeId, SymbolId};
use crate::model::{
    Document, Frame, Layer, LoopMode, Node, Scene, Settings, Symbol, SymbolType, Transform,
};
use crate::persist;

/// Partial transform edit (UI property fields). `None` = leave unchanged.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct TransformPatch {
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub scale_x: Option<f64>,
    pub scale_y: Option<f64>,
    pub rotation: Option<f64>,
}

/// Partial base-property edit for a node (width/height/fill/stroke).
#[derive(Clone, Debug, Default)]
pub struct NodePropsPatch {
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub fill: Option<String>,
    /// tri-state: None = leave stroke alone; Some(true) = enable with `stroke`
    /// color; Some(false) = remove stroke.
    pub stroke_enabled: Option<bool>,
    pub stroke: Option<String>,
    pub stroke_width: Option<f64>,
}

/// Partial document-settings edit (stage size / fps / background).
#[derive(Clone, Debug, Default)]
pub struct SettingsPatch {
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub fps: Option<u32>,
    pub background: Option<String>,
    /// Background opacity 0..=1 (Part 33 §33.1 `backgroundAlpha`; H01 field).
    pub background_alpha: Option<f64>,
}

/// Editor controller: owns the document + view state (selection/playhead) +
/// command history. This is the core's public API (bound to UI via WASM).
pub struct Session {
    pub doc: Document,
    pub history: History,
    pub selection: Vec<NodeId>,
    pub playhead: u32,
    pub active_scene: usize,
    pub active_layer: usize,
    /// Dev-mode observability (Phase-4 manual-test requirement).
    pub event_log: Vec<String>,
    /// Frame clipboard (F-07-12): session state only — NOT part of the
    /// document, NOT persisted, NOT undoable (like the OS clipboard). Holds
    /// (frame number, record) pairs captured by copy/cut.
    pub frame_clipboard: Vec<(u32, Frame)>,
}

impl Session {
    pub fn new(settings: Settings) -> Self {
        let doc = Document::new(settings);
        let mut s = Self {
            history: History::new(&doc),
            doc,
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:new".into()],
            frame_clipboard: Vec::new(),
        };
        s.log("document:created");
        s
    }

    fn log(&mut self, msg: &str) {
        self.event_log.push(msg.to_string());
        if self.event_log.len() > 200 {
            self.event_log.remove(0);
        }
    }

    /// SYS-03 C-2 / INV-EDIT-2: capture prevSelection, apply, then seal the
    /// post-command selection after any Session-side selection update.
    fn exec(&mut self, cmd: Box<dyn crate::command::Command>) {
        self.exec_then(cmd, |_| {});
    }

    fn exec_then(&mut self, cmd: Box<dyn crate::command::Command>, after: impl FnOnce(&mut Self)) {
        let prev = self.selection.clone();
        self.history.execute(&mut self.doc, cmd, prev);
        after(self);
        self.history
            .seal_last_post_selection(self.selection.clone());
    }

    pub fn set_playhead(&mut self, frame: u32) {
        self.playhead = frame.max(1);
        self.log(&format!("playhead:{frame}"));
    }

    pub fn draw_rect(&mut self, x: f64, y: f64, w: f64, h: f64, fill: &str) -> NodeId {
        // Draw-target contract (REQ-DRW-003): a hidden or locked layer is not a
        // valid draw target. Blocked → no command, no node (returns NodeId(0)).
        if self.doc.layer(self.active_scene, self.active_layer).is_some() {
            if self.active_layer_is_folder() {
                self.log("draw:blocked(folder)");
                return NodeId(0);
            }
            // BUG B-1: a layer inside a hidden/locked FOLDER is not a valid
            // draw target either.
            let (visible, locked) = self.layer_effective_state(self.active_layer);
            if !visible || locked {
                self.log("draw:blocked(layer hidden/locked)");
                return NodeId(0);
            }
        }
        let id = self.doc.alloc_node_id();
        let node = Node::Rect {
            id,
            transform: Transform {
                x,
                y,
                ..Transform::default()
            },
            width: w,
            height: h,
            fill: fill.to_string(),
            stroke: None,
            stroke_width: 0.0,
        };
        let cmd = DrawRect {
            scene: self.active_scene,
            layer: self.active_layer,
            frame: self.playhead,
            node,
        };
        self.exec_then(Box::new(cmd), |s| {
            s.selection = vec![id];
        });
        self.log(&format!("draw:rect id={:?} @{}", id, self.playhead));
        id
    }

    pub fn select_at(&mut self, x: f64, y: f64) -> bool {
        let hit = hit_test(&self.doc, self.active_scene, self.playhead, x, y);
        self.selection = hit.into_iter().collect();
        self.log(&format!(
            "select:at({x},{y}) → {:?}",
            self.selection.first()
        ));
        !self.selection.is_empty()
    }

    /// Select All (REQ-SEL): every object on the current frame across ALL
    /// layers, skipping hidden layers and locked layers (Part 20.2).
    pub fn select_all(&mut self) {
        let mut all = Vec::new();
        if let Some(sc) = self.doc.scene(self.active_scene) {
            for (i, layer) in sc.layers.iter().enumerate() {
                let (visible, locked) = crate::eval::effective_layer_state(&sc.layers, layer);
                if !visible || locked {
                    continue;
                }
                all.extend(self.doc.content_at(self.active_scene, i, self.playhead));
            }
        }
        self.selection = all;
        self.log("select:all");
    }

    pub fn clear_selection(&mut self) {
        self.selection.clear();
        self.log("select:clear");
    }

    /// Shift+click semantics (REQ-SEL): add if absent, remove if present.
    /// Returns true if something was hit (even if it was toggled off).
    pub fn select_toggle_at(&mut self, x: f64, y: f64) -> bool {
        let hit = hit_test(&self.doc, self.active_scene, self.playhead, x, y);
        match hit {
            Some(id) => {
                if let Some(pos) = self.selection.iter().position(|s| *s == id) {
                    self.selection.remove(pos);
                    self.log("select:toggle-off");
                } else {
                    self.selection.push(id);
                    self.log("select:toggle-on");
                }
                true
            }
            None => false,
        }
    }

    /// Marquee selection (REQ-SEL-004): replace selection with all nodes whose
    /// bounds touch the doc-space rectangle (contact-sensitive ON).
    pub fn select_in_rect(&mut self, x0: f64, y0: f64, x1: f64, y1: f64) {
        self.selection = hits_in_rect(&self.doc, self.active_scene, self.playhead, x0, y0, x1, y1);
        self.log(&format!("select:marquee({} hits)", self.selection.len()));
    }

    /// Apply absolute transforms to the selection (scale/rotate/translate fold
    /// into one command). Every id must still be present at the current frame.
    pub fn transform_selection(&mut self, after: Vec<(NodeId, Transform)>) {
        if self.selection.is_empty() || after.is_empty() {
            return;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log("transform:selection");
    }

    /// Current transform of a selected node at the playhead (interpolated).
    /// Scene-wide lookup: selection may span layers, so the node's layer is
    /// located automatically (not assumed to be the active layer).
    pub fn selected_transform(&self, id: NodeId) -> Option<Transform> {
        node_transform_in_scene(&self.doc, self.active_scene, self.playhead, id)
    }

    pub fn move_selection(&mut self, dx: f64, dy: f64) {
        if self.selection.is_empty() {
            return;
        }
        // zero-distance drag must not pollute undo history (PHASE G)
        if dx == 0.0 && dy == 0.0 {
            return;
        }
        let ids = self.selection.clone();
        let cmd = MoveSelection::new(
            ids,
            dx,
            dy,
            self.active_scene,
            self.active_layer,
            self.playhead,
        );
        self.exec(Box::new(cmd));
        self.log(&format!("move:selection({dx},{dy}) @{}", self.playhead));
    }

    /// BUG B-2/B-5 — central folder guard for frame ops: folders are
    /// organizational rows with NO frames (F-20-05), so F5/F6/F7/Shift+F5/
    /// Shift+F6 on a folder must be a silent no-op instead of writing frame
    /// records into a row that can never be rendered.
    fn layer_is_folder(&self, index: usize) -> bool {
        self.doc
            .layer(self.active_scene, index)
            .map(|l| l.is_folder())
            .unwrap_or(false)
    }

    fn active_layer_is_folder(&self) -> bool {
        self.layer_is_folder(self.active_layer)
    }

    /// BUG B-1 — (visible, locked) of a layer INCLUDING its folder chain:
    /// "the layer controls in the timeline affect all layers within a folder"
    /// (Adobe Animate — Create timeline layers). Used by every edit/selection
    /// guard so the stage, hit-test and the panels agree.
    fn layer_effective_state(&self, index: usize) -> (bool, bool) {
        let Some(sc) = self.doc.scene(self.active_scene) else {
            return (false, true);
        };
        let Some(l) = sc.layers.get(index) else {
            return (false, true);
        };
        crate::eval::effective_layer_state(&sc.layers, l)
    }

    /// F6 — insert a keyframe copying the previous content. Returns true when a
    /// keyframe was created; false when it was a no-op. No-op cases (no command,
    /// no undo entry): the layer is locked (Part 20.2 "not editable") or the
    /// frame is already a CONTENT keyframe (F-07-08 M.1 "F6 at a keyframe →
    /// no-op"). F6 on a BLANK keyframe converts it to a content keyframe
    /// copying the pre-blank content (F-07-08 M.2).
    pub fn insert_keyframe(&mut self, frame: u32) -> bool {
        if self.active_layer_is_folder() {
            self.log("keyframe:blocked(folder)");
            return false;
        }
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if l.locked {
                self.log("keyframe:blocked(locked)");
                return false;
            }
            if matches!(l.keyframes.get(&frame), Some(Frame::Keyframe { .. })) {
                self.log(&format!("keyframe:already@{frame}"));
                return false;
            }
        }
        let cmd = InsertKeyframe::new(self.active_scene, self.active_layer, frame);
        self.exec(Box::new(cmd));
        self.set_playhead(frame);
        self.log(&format!("keyframe:insert@{frame}"));
        true
    }

    /// F7 — insert a BLANK keyframe at `frame` (breaks the hold → empty
    /// content). Blocked on a locked layer ([OUR DESIGN DECISION]: frame ops on
    /// a locked layer are disabled, matching Part 20.2 "protect finished art";
    /// hidden layers still allow frame editing). Undoable.
    pub fn insert_blank_keyframe(&mut self, frame: u32) -> bool {
        if self.active_layer_is_folder() {
            self.log("blank-keyframe:blocked(folder)");
            return false;
        }
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if l.locked {
                self.log("blank-keyframe:blocked(locked)");
                return false;
            }
        }
        let cmd = InsertBlankKeyframe::new(self.active_scene, self.active_layer, frame);
        self.exec(Box::new(cmd));
        self.log(&format!("blank-keyframe@{frame}"));
        true
    }

    /// Shift+F6 — remove the keyframe STATUS at `frame` (revert to hold).
    /// No-op (no command) when there is no keyframe there or the layer is
    /// locked. Undoable.
    pub fn clear_keyframe(&mut self, frame: u32) -> bool {
        if self.active_layer_is_folder() {
            self.log("clear-keyframe:blocked(folder)");
            return false;
        }
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if l.locked {
                self.log("clear-keyframe:blocked(locked)");
                return false;
            }
            if !l.keyframes.contains_key(&frame) {
                self.log("clear-keyframe:(none)");
                return false;
            }
        }
        let cmd = ClearKeyframe::new(self.active_scene, self.active_layer, frame);
        self.exec(Box::new(cmd));
        self.log(&format!("clear-keyframe@{frame}"));
        true
    }

    /// Derived timeline duration (max keyframe frame, min 1) — Part 07 §7.0.
    pub fn timeline_duration(&self) -> u32 {
        self.doc.timeline_duration(self.active_scene)
    }

    /// F5 — insert a frame at `frame` on the ACTIVE layer: every keyframe
    /// AFTER `frame` shifts right by one (the hold covering `frame` extends).
    /// No-op (no command) when there is nothing to shift or the layer is locked.
    pub fn insert_frame(&mut self, frame: u32) -> bool {
        if self.active_layer_is_folder() {
            self.log("insert-frame:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        let layer = self.active_layer;
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("insert-frame:blocked(locked)");
            return false;
        }
        let any_later = l.keyframes.keys().any(|k| *k > frame);
        if !any_later {
            self.log("insert-frame:(nothing to shift)");
            return false;
        }
        let cmd = InsertFrames::new(scene, layer, frame);
        self.exec(Box::new(cmd));
        self.log(&format!("insert-frame@{frame}"));
        true
    }

    /// Shift+F5 — delete one frame at `frame` on the ACTIVE layer: a keyframe
    /// there is removed, and every keyframe AFTER `frame` shifts left by one
    /// (timeline shortens). No-op (no command) when nothing is affected or the
    /// layer is locked.
    pub fn delete_frame(&mut self, frame: u32) -> bool {
        if self.active_layer_is_folder() {
            self.log("delete-frame:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        let layer = self.active_layer;
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("delete-frame:blocked(locked)");
            return false;
        }
        let has_at = l.keyframes.contains_key(&frame);
        let has_later = l.keyframes.keys().any(|k| *k > frame);
        if !has_at && !has_later {
            self.log("delete-frame:(nothing)");
            return false;
        }
        let cmd = DeleteFrames::new(scene, layer, frame);
        self.exec(Box::new(cmd));
        self.log(&format!("delete-frame@{frame}"));
        true
    }

    /// Drag a keyframe in time (Part 07 §7.4.9): relocate the record on `layer`
    /// (which may be any visible layer, not just the active one). No-op when
    /// from==to, no keyframe at `from`, a keyframe already at `to` (collision —
    /// overwrite prompt is a later unit), `to < 1`, or the layer is locked.
    pub fn move_keyframe(&mut self, layer: usize, from: u32, to: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("move-keyframe:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if from == to || to < 1 {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("move-keyframe:blocked(locked)");
            return false;
        }
        if !l.keyframes.contains_key(&from) {
            self.log("move-keyframe:(no source)");
            return false;
        }
        if l.keyframes.contains_key(&to) {
            self.log("move-keyframe:(target occupied)");
            return false;
        }
        let cmd = MoveKeyframe::new(scene, layer, from, to);
        self.exec(Box::new(cmd));
        self.log(&format!("move-keyframe:{from}→{to}"));
        true
    }

    /// Alt/Option-drag a keyframe to DUPLICATE it (F-07-12 E1): deep-copy the
    /// record at `from` into `to` on `layer`. No-op on the same guards as move
    /// (collision blocked; the source must exist; `to` must be free).
    pub fn duplicate_keyframe(&mut self, layer: usize, from: u32, to: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("duplicate-keyframe:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if to < 1 {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("duplicate-keyframe:blocked(locked)");
            return false;
        }
        if !l.keyframes.contains_key(&from) {
            self.log("duplicate-keyframe:(no source)");
            return false;
        }
        if l.keyframes.contains_key(&to) {
            self.log("duplicate-keyframe:(target occupied)");
            return false;
        }
        let cmd = DuplicateKeyframe::new(scene, layer, from, to);
        self.exec(Box::new(cmd));
        self.log(&format!("duplicate-keyframe:{from}→{to}"));
        true
    }

    // ——— Frame range selection + clipboard / sequence ops (Part 07 §7.4.6–10, F-07-12/13) ———

    /// COPY FRAMES: snapshot the keyframes within [start,end] into the frame
    /// clipboard (session state — no command, no document change). Read-only,
    /// so it is allowed on locked layers.
    pub fn copy_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("copy-frames:blocked(folder)");
            return false;
        }
        let Some(l) = self.doc.layer(self.active_scene, layer) else {
            return false;
        };
        let mut recs: Vec<(u32, Frame)> = l
            .keyframes
            .iter()
            .filter(|(k, _)| **k >= start && **k <= end)
            .map(|(k, f)| (*k, f.clone()))
            .collect();
        recs.sort_by_key(|(f, _)| *f);
        if recs.is_empty() {
            self.log("copy-frames:(none)");
            return false;
        }
        self.frame_clipboard = recs;
        self.log(&format!("copy-frames:{start}..{end}"));
        true
    }

    /// CUT FRAMES: copy to the clipboard + REMOVE the keyframes in the range
    /// (leaving a gap). One undoable command (the remove). Locked layer blocked.
    pub fn cut_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
        if !self.copy_frames(layer, start, end) {
            return false;
        }
        if !self.remove_frames(layer, start, end) {
            return false;
        }
        self.log(&format!("cut-frames:{start}..{end}"));
        true
    }

    /// PASTE FRAMES: insert the clipboard records at `at` on `layer`,
    /// preserving relative offsets; collisions OVERWRITE. One undoable command.
    /// Locked layer blocked; empty clipboard = no-op.
    pub fn paste_frames(&mut self, layer: usize, at: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("paste-frames:blocked(folder)");
            return false;
        }
        let Some(l) = self.doc.layer(self.active_scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("paste-frames:blocked(locked)");
            return false;
        }
        if self.frame_clipboard.is_empty() {
            self.log("paste-frames:(empty clipboard)");
            return false;
        }
        let cmd = PasteFrames::new(self.active_scene, layer, at, self.frame_clipboard.clone());
        self.exec(Box::new(cmd));
        self.log(&format!("paste-frames@{at}"));
        true
    }

    /// REMOVE FRAMES: delete the keyframes within [start,end] leaving a GAP
    /// (later keyframes stay put). One undoable command. Locked layer blocked.
    pub fn remove_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("remove-frames:blocked(folder)");
            return false;
        }
        let Some(l) = self.doc.layer(self.active_scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("remove-frames:blocked(locked)");
            return false;
        }
        let any = l.keyframes.keys().any(|k| *k >= start && *k <= end);
        if !any {
            self.log("remove-frames:(none)");
            return false;
        }
        let cmd = RemoveFrames::new(self.active_scene, layer, start, end);
        self.exec(Box::new(cmd));
        self.log(&format!("remove-frames:{start}..{end}"));
        true
    }

    /// REVERSE FRAMES: reverse the keyframe record order within [start,end]
    /// (content plays backwards). One undoable command. Locked layer blocked;
    /// <2 keyframes = no-op (F-07-13 M.1).
    pub fn reverse_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("reverse-frames:blocked(folder)");
            return false;
        }
        let Some(l) = self.doc.layer(self.active_scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("reverse-frames:blocked(locked)");
            return false;
        }
        let count = l
            .keyframes
            .keys()
            .filter(|k| **k >= start && **k <= end)
            .count();
        if count < 2 {
            self.log("reverse-frames:(needs ≥2 keyframes)");
            return false;
        }
        let cmd = ReverseFrames::new(self.active_scene, layer, start, end);
        self.exec(Box::new(cmd));
        self.log(&format!("reverse-frames:{start}..{end}"));
        true
    }

    // ——— Classic tween (Part 09.2, MOD-TWEEN) ———

    /// Create/update a classic tween span between two CONTENT keyframes holding
    /// the SAME non-empty object (Part 09.2.1). One undoable command. Blocked on
    /// locked layers; no-op when start ≥ end or the keyframes aren't the same
    /// object.
    pub fn set_classic_tween(&mut self, layer: usize, start: u32, end: u32, ease: f64) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("tween:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if start >= end {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("tween:blocked(locked)");
            return false;
        }
        let content_of = |frame: u32| -> Option<Vec<NodeId>> {
            match l.keyframes.get(&frame) {
                Some(Frame::Keyframe { content, .. }) => Some(content.clone()),
                _ => None,
            }
        };
        let (Some(c0), Some(c1)) = (content_of(start), content_of(end)) else {
            self.log("tween:needs two content keyframes");
            return false;
        };
        if c0.is_empty() || c0 != c1 {
            self.log("tween:keyframes must hold the same object");
            return false;
        }
        let cmd = SetClassicTween::new(scene, layer, start, end, ease);
        self.exec(Box::new(cmd));
        self.log(&format!("tween:{start}→{end} ease={ease}"));
        true
    }

    /// Remove a classic tween span (F-07-13 "Remove Tween"). One undoable
    /// command. Blocked on locked layers; no-op when no tween starts there.
    pub fn remove_classic_tween(&mut self, layer: usize, start: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("remove-tween:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("remove-tween:blocked(locked)");
            return false;
        }
        if !l.tweens.contains_key(&start) {
            self.log("remove-tween:(none)");
            return false;
        }
        let cmd = RemoveClassicTween::new(scene, layer, start);
        self.exec(Box::new(cmd));
        self.log(&format!("remove-tween@{start}"));
        true
    }

    // ——— Frame sequences, exposure, labels (Part 07 §7.4.8–12, §7.2) ———

    /// Drag a keyframe TOGETHER WITH its held span (Part 07 §7.4.9 / F-07-12 E2):
    /// moves the keyframe at `from` and the NEXT keyframe by the same delta,
    /// preserving exposure. `overwrite` = replace any keyframes at the target
    /// frames. No-op (no command) on zero delta, missing source, locked layer,
    /// or collision with overwrite=false (the UI prompts first).
    pub fn move_keyframe_sequence(
        &mut self,
        layer: usize,
        from: u32,
        to: u32,
        overwrite: bool,
    ) -> bool {
        let scene = self.active_scene;
        if from == to || to < 1 {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("seq-move:blocked(locked)");
            return false;
        }
        if !l.keyframes.contains_key(&from) {
            self.log("seq-move:(no source)");
            return false;
        }
        // pre-check collision (so a blocked move never creates a command)
        if !overwrite {
            let next = l.keyframes.keys().copied().filter(|k| *k > from).min();
            let delta = to as i64 - from as i64;
            let target_next = next.map(|n| (n as i64 + delta) as u32);
            let occupied =
                |f: u32, mover: Option<u32>| l.keyframes.contains_key(&f) && mover != Some(f);
            if occupied(to, Some(from)) || target_next.map(|tn| occupied(tn, next)).unwrap_or(false)
            {
                self.log("seq-move:(target occupied)");
                return false;
            }
        }
        let cmd = MoveKeyframeSequence::new(scene, layer, from, to, overwrite);
        self.exec(Box::new(cmd));
        self.log(&format!("seq-move:{from}→{to}"));
        true
    }

    /// Drag the edge of a held span (Part 07 §7.4.11 / F-15-05): shift every
    /// keyframe after `anchor` by `delta`, extending (delta>0) or shortening
    /// (delta<0) the hold of the keyframe at `anchor`. The exposure is clamped
    /// to a minimum of 1 frame; zero-delta / no-next-keyframe / locked = no-op.
    pub fn resize_span(&mut self, layer: usize, anchor: u32, delta: i64) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("resize-span:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if delta == 0 {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("resize-span:blocked(locked)");
            return false;
        }
        if !l.keyframes.contains_key(&anchor) {
            self.log("resize-span:(no anchor keyframe)");
            return false;
        }
        let next = l.keyframes.keys().copied().filter(|k| *k > anchor).min();
        let Some(next) = next else {
            // the last keyframe holds to infinity — nothing to shift
            self.log("resize-span:(no span end)");
            return false;
        };
        // clamp: exposure (next - anchor) must stay ≥ 1
        let exposure = (next - anchor) as i64;
        let d = if delta < 0 {
            delta.max(1 - exposure)
        } else {
            delta
        };
        if d == 0 {
            self.log("resize-span:(min exposure)");
            return false;
        }
        let cmd = ResizeSpan::new(scene, layer, anchor, d);
        self.exec(Box::new(cmd));
        self.log(&format!("resize-span:{anchor} {d:+}"));
        true
    }

    /// Duplicate the selected frame range (Part 07 §7.4.8): copies the keyframes
    /// in [start,end] and inserts them immediately after, shifting later frames.
    /// One undoable command. No-op when the range holds no keyframes.
    pub fn duplicate_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("duplicate-frames:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if start > end {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("duplicate-frames:blocked(locked)");
            return false;
        }
        let any = l.keyframes.keys().any(|k| *k >= start && *k <= end);
        if !any {
            self.log("duplicate-frames:(none)");
            return false;
        }
        let cmd = DuplicateFrames::new(scene, layer, start, end);
        self.exec(Box::new(cmd));
        self.log(&format!("duplicate-frames:{start}..{end}"));
        true
    }

    /// Convert held frames in [start,end] into keyframes (Part 07 §7.4.12),
    /// copying the hold's content + transforms so playback is unchanged.
    /// One undoable command.
    pub fn convert_to_keyframes(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("convert-keys:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if start > end {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("convert-keys:blocked(locked)");
            return false;
        }
        // need a content hold at `start` and at least one non-keyframe frame
        let hold = l
            .keyframes
            .range(..=start)
            .next_back()
            .and_then(|(_, fr)| match fr {
                Frame::Keyframe { .. } => Some(()),
                Frame::Blank => None,
            });
        if hold.is_none() {
            self.log("convert-keys:(no content hold)");
            return false;
        }
        let any_gap = (start..=end).any(|f| !l.keyframes.contains_key(&f));
        if !any_gap {
            self.log("convert-keys:(already keyframes)");
            return false;
        }
        let cmd = ConvertToKeyframes::new(scene, layer, start, end);
        self.exec(Box::new(cmd));
        self.log(&format!("convert-keys:{start}..{end}"));
        true
    }

    /// Convert frames in [start,end] into BLANK keyframes (Part 07 §7.4.12).
    /// One undoable command.
    pub fn convert_to_blank_keyframes(&mut self, layer: usize, start: u32, end: u32) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("convert-blank:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        if start > end {
            return false;
        }
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("convert-blank:blocked(locked)");
            return false;
        }
        let any_nonblank =
            (start..=end).any(|f| !matches!(l.keyframes.get(&f), Some(Frame::Blank)));
        if !any_nonblank {
            self.log("convert-blank:(already blank)");
            return false;
        }
        let cmd = ConvertToBlankKeyframes::new(scene, layer, start, end);
        self.exec(Box::new(cmd));
        self.log(&format!("convert-blank:{start}..{end}"));
        true
    }

    /// Set or clear the label on a CONTENT keyframe (Part 07 §7.2 / Part 33.8).
    /// `label` = None or empty → clear. No-op when the frame isn't a content
    /// keyframe or the layer is locked.
    pub fn set_frame_label(&mut self, layer: usize, frame: u32, label: Option<&str>) -> bool {
        // BUG B-2/B-5: a folder row has no frames of its own (Adobe: frames of
        // a folder come from the layers it CONTAINS), so frame ops on it are a
        // silent no-op instead of writing unreachable records.
        if self.layer_is_folder(layer) {
            self.log("set-label:blocked(folder)");
            return false;
        }
        let scene = self.active_scene;
        let Some(l) = self.doc.layer(scene, layer) else {
            return false;
        };
        if l.locked {
            self.log("set-label:blocked(locked)");
            return false;
        }
        let matches_content = matches!(l.keyframes.get(&frame), Some(Frame::Keyframe { .. }));
        if !matches_content {
            self.log("set-label:(not a content keyframe)");
            return false;
        }
        let after = label
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let before = l
            .keyframes
            .get(&frame)
            .and_then(|f| f.label().map(|s| s.to_string()));
        if before == after {
            return false; // unchanged → no command
        }
        let cmd = SetFrameLabel::new(scene, layer, frame, after);
        self.exec(Box::new(cmd));
        self.log(&format!("set-label@{frame}"));
        true
    }

    // ——— Symbols + Library (Part 11/12, engineering P4) ———

    /// Convert the current selection into a symbol (F8, Part 11 §11.2).
    /// `reg_grid` = 0..8 (TL/TC/TR/ML/C/MR/BL/BC/BR, 4 = center). The wrapped
    /// nodes are re-based so the registration point is the symbol's local (0,0)
    /// and replaced by one instance on the current frame. Returns the new
    /// instance id (0 on no-op).
    pub fn convert_selection_to_symbol(
        &mut self,
        name: &str,
        symbol_type: SymbolType,
        reg_grid: u8,
    ) -> NodeId {
        if self.selection.is_empty() {
            return NodeId(0);
        }
        // REQ-DRW-003 / Part 20.2 / F-03-15: locked layers are not editable.
        // If ANY selected node lives on a locked layer, block the whole convert
        // (no partial mutation, no undo entry).
        for id in &self.selection {
            if let Some(lidx) = node_layer_index(&self.doc, self.active_scene, self.playhead, *id) {
                if let Some(l) = self.doc.layer(self.active_scene, lidx) {
                    if l.locked {
                        self.log("convert-to-symbol:blocked(locked)");
                        return NodeId(0);
                    }
                }
            }
        }
        // selection bounds (scene-wide)
        let mut minx = f64::INFINITY;
        let mut miny = f64::INFINITY;
        let mut maxx = f64::NEG_INFINITY;
        let mut maxy = f64::NEG_INFINITY;
        for id in &self.selection {
            if let Some((a, b, c, d)) =
                node_bounds(&self.doc, self.active_scene, self.playhead, *id)
            {
                minx = minx.min(a);
                miny = miny.min(b);
                maxx = maxx.max(c);
                maxy = maxy.max(d);
            }
        }
        if !minx.is_finite() {
            return NodeId(0);
        }
        // 9-point registration grid
        let cx = (minx + maxx) / 2.0;
        let cy = (miny + maxy) / 2.0;
        let (reg_x, reg_y) = match reg_grid {
            0 => (minx, miny),
            1 => (cx, miny),
            2 => (maxx, miny),
            3 => (minx, cy),
            5 => (maxx, cy),
            6 => (minx, maxy),
            7 => (cx, maxy),
            8 => (maxx, maxy),
            _ => (cx, cy), // 4 (center) and any fallback
        };

        // INV-EDIT-1: do NOT mutate the document here. ConvertToSymbol.apply
        // auto-keys the playhead if needed and reverts that keyframe on undo.
        if self
            .doc
            .layer(self.active_scene, self.active_layer)
            .is_none()
        {
            return NodeId(0);
        }

        let symbol_id = self.doc.alloc_symbol_id();
        let instance_id = self.doc.alloc_node_id();
        let node_ids = self.selection.clone();

        let mut inner_layer = Layer::new_normal(LayerId(1), "Layer 1");
        inner_layer.keyframes =
            std::collections::BTreeMap::from([(1u32, Frame::keyframe(node_ids.clone()))]);
        let symbol = Symbol {
            id: symbol_id,
            name: name.trim().to_string(),
            symbol_type,
            registration: Transform {
                x: reg_x - minx,
                y: reg_y - miny,
                ..Transform::default()
            },
            timeline: vec![inner_layer],
        };
        let instance = Node::SymbolInstance {
            id: instance_id,
            transform: Transform {
                x: reg_x,
                y: reg_y,
                ..Transform::default()
            },
            symbol_id,
            loop_mode: LoopMode::Loop,
            first_frame: 1,
        };
        let cmd = ConvertToSymbol::new(
            self.active_scene,
            self.active_layer,
            self.playhead,
            symbol,
            instance,
            node_ids,
        );
        self.exec_then(Box::new(cmd), |s| {
            s.selection = vec![instance_id];
        });
        self.log(&format!("convert-to-symbol:{symbol_id:?}"));
        instance_id
    }

    /// New Symbol (Ctrl+F8, Part 12 §12.2.2): create an empty symbol in the
    /// Library. Returns its id (0 on failure).
    pub fn new_symbol(&mut self, name: &str, symbol_type: SymbolType) -> SymbolId {
        let name = name.trim();
        if name.is_empty() {
            return SymbolId(0);
        }
        let id = self.doc.alloc_symbol_id();
        let layer = Layer::new_normal(LayerId(1), "Layer 1");
        let symbol = Symbol {
            id,
            name: name.to_string(),
            symbol_type,
            registration: Transform::default(),
            timeline: vec![layer],
        };
        let cmd = CreateSymbol { symbol };
        self.exec(Box::new(cmd));
        self.log(&format!("new-symbol:{id:?}"));
        id
    }

    /// Place an instance of `symbol_id` at (x, y) on the current frame
    /// (drag library → stage, Part 12 §12.2.11). Returns the instance id.
    pub fn place_symbol(&mut self, symbol_id: SymbolId, x: f64, y: f64) -> NodeId {
        if self.doc.symbol(symbol_id).is_none() {
            return NodeId(0);
        }
        if self.doc.layer(self.active_scene, self.active_layer).is_some() {
            // BUG B-5: folders cannot host content (same rule as draw/paste).
            if self.active_layer_is_folder() {
                self.log("place-symbol:blocked(folder)");
                return NodeId(0);
            }
            let (visible, locked) = self.layer_effective_state(self.active_layer);
            if !visible || locked {
                return NodeId(0);
            }
        }
        let instance_id = self.doc.alloc_node_id();
        let instance = Node::SymbolInstance {
            id: instance_id,
            transform: Transform {
                x,
                y,
                ..Transform::default()
            },
            symbol_id,
            loop_mode: LoopMode::Loop,
            first_frame: 1,
        };
        let cmd = PlaceSymbol::new(
            self.active_scene,
            self.active_layer,
            self.playhead,
            instance,
        );
        self.exec_then(Box::new(cmd), |s| {
            s.selection = vec![instance_id];
        });
        self.log(&format!("place-symbol:{symbol_id:?}"));
        instance_id
    }

    /// Rename a symbol (ID-safe, Part 12 §12.2.3).
    pub fn rename_symbol(&mut self, symbol_id: SymbolId, name: &str) -> bool {
        let name = name.trim();
        if name.is_empty() {
            return false;
        }
        let Some(s) = self.doc.symbol(symbol_id).cloned() else {
            return false;
        };
        if s.name == name {
            return false;
        }
        let cmd = RenameSymbol {
            symbol_id,
            before: s.name,
            after: name.to_string(),
        };
        self.exec(Box::new(cmd));
        self.log(&format!("rename-symbol:{symbol_id:?}"));
        true
    }

    /// Delete a symbol from the Library (Part 12 §12.2.5). `break_apart` =
    /// leave its instances as raw content. In-use deletion WITHOUT break_apart
    /// is blocked (the UI prompts first). Returns true on success.
    pub fn delete_symbol(&mut self, symbol_id: SymbolId, break_apart: bool) -> bool {
        if self.doc.symbol(symbol_id).is_none() {
            return false;
        }
        let in_use = self.doc.symbol_use_count(symbol_id) > 0;
        if in_use && !break_apart {
            self.log("delete-symbol:blocked(in use)");
            return false;
        }
        let cmd = DeleteSymbol::new(symbol_id, break_apart);
        self.exec_then(Box::new(cmd), |s| {
            s.prune_selection_existence();
        });
        self.log(&format!("delete-symbol:{symbol_id:?}"));
        true
    }

    /// Swap an instance's symbol (Part 11 §11.6), keeping its transform.
    pub fn swap_instance(&mut self, instance_id: NodeId, symbol_id: SymbolId) -> bool {
        if self.doc.symbol(symbol_id).is_none() {
            return false;
        }
        let Some(before) = self.doc.nodes.get(&instance_id).and_then(|n| n.symbol_id()) else {
            return false;
        };
        if before == symbol_id {
            return false;
        }
        let cmd = SwapInstance {
            instance_id,
            before,
            after: symbol_id,
        };
        self.exec(Box::new(cmd));
        self.log(&format!("swap-instance:{instance_id:?}"));
        true
    }

    /// Set a graphic instance's loop mode / first frame (Part 11 §11.4).
    pub fn set_instance_loop(
        &mut self,
        instance_id: NodeId,
        loop_mode: LoopMode,
        first_frame: u32,
    ) -> bool {
        let before = match self.doc.nodes.get(&instance_id) {
            Some(Node::SymbolInstance {
                loop_mode,
                first_frame,
                ..
            }) => (*loop_mode, *first_frame),
            _ => return false,
        };
        if before == (loop_mode, first_frame.max(1)) {
            return false;
        }
        let cmd = SetInstanceLoop {
            instance_id,
            before,
            after: (loop_mode, first_frame.max(1)),
        };
        self.exec(Box::new(cmd));
        self.log(&format!("set-instance-loop:{instance_id:?}"));
        true
    }

    /// Library snapshot (id, name, type, use-count, duration) for the UI.
    pub fn library(&self) -> Vec<(SymbolId, String, SymbolType, u32, u32)> {
        self.doc
            .library
            .iter()
            .map(|s| {
                (
                    s.id,
                    s.name.clone(),
                    s.symbol_type,
                    self.doc.symbol_use_count(s.id),
                    s.duration(),
                )
            })
            .collect()
    }

    // ——— SYS-03 object clipboard + SYS-06 transform/arrange/align ———

    /// Nodes in the current selection that live on a visible, unlocked layer
    /// at the playhead (Part 20.2 — locked = not editable).
    fn selected_editable(&self) -> Vec<NodeId> {
        self.selection
            .iter()
            .copied()
            .filter(
                |id| match node_layer_index(&self.doc, self.active_scene, self.playhead, *id) {
                    Some(lidx) => {
                        let (visible, locked) = self.layer_effective_state(lidx);
                        visible && !locked
                    }
                    None => false,
                },
            )
            .collect()
    }

    /// Nodes in the current selection that exist at the playhead (copy is
    /// read-only — locked layers are allowed, matching copy_frames).
    fn selected_present(&self) -> Vec<NodeId> {
        self.selection
            .iter()
            .copied()
            .filter(|id| {
                node_layer_index(&self.doc, self.active_scene, self.playhead, *id).is_some()
            })
            .collect()
    }

    /// COPY objects: snapshot selected nodes with their EVALUATED transform
    /// baked in. Session state only — no command, no dirty. Empty = no-op.
    pub fn copy_objects(&mut self) -> bool {
        let ids = self.selected_present();
        if ids.is_empty() {
            self.log("copy:nothing");
            return false;
        }
        let mut clips = Vec::new();
        for id in ids {
            let Some(node) = self.doc.nodes.get(&id).cloned() else {
                continue;
            };
            let t = self
                .selected_transform(id)
                .unwrap_or_else(|| node.transform().clone());
            clips.push(ObjectClip {
                node: node.with_transform(t),
            });
        }
        if clips.is_empty() {
            self.log("copy:nothing");
            return false;
        }
        set_app_object_clipboard(clips);
        self.log(&format!("copy:objects({})", app_object_clipboard().len()));
        true
    }

    /// CUT objects: copy + delete from the current frame (one undoable
    /// delete). Locked-layer nodes are copied but not deleted.
    pub fn cut_objects(&mut self) -> bool {
        if !self.copy_objects() {
            return false;
        }
        if !self.delete_selection() {
            // copy succeeded; delete may no-op if everything was locked
            self.log("cut:copied-locked-only");
            return true;
        }
        self.log("cut:objects");
        true
    }

    /// DELETE the editable selection from the current frame. No-op when
    /// nothing is editable. One undoable command.
    pub fn delete_selection(&mut self) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            self.log("delete:nothing");
            return false;
        }
        let cmd = DeleteSelection::new(self.active_scene, self.playhead, ids);
        self.exec_then(Box::new(cmd), |s| {
            s.prune_selection_existence();
        });
        self.log("delete:selection");
        true
    }

    /// PASTE the object clipboard onto the active layer at the playhead.
    /// `mode` = InPlace (same coords) or Center (AABB → stage center).
    /// Blocked on locked/hidden active layer; empty clipboard = no-op.
    pub fn paste_objects(&mut self, mode: PasteMode) -> bool {
        let clips = app_object_clipboard();
        if clips.is_empty() {
            self.log("paste:empty");
            return false;
        }
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            // Folders are organizational containers — they hold no frames and
            // cannot host drawable content (consistent with draw_rect
            // blocking on folders). Paste/Duplicate must not silently create
            // orphan nodes that cannot be reached by the renderer.
            if l.is_folder() {
                self.log("paste:blocked(active layer is a folder)");
                return false;
            }
        } else {
            return false;
        }
        let (visible, locked) = self.layer_effective_state(self.active_layer);
        if !visible || locked {
            self.log("paste:blocked(layer hidden/locked)");
            return false;
        }

        // compute AABB of clipboard items (using baked transforms)
        let mut minx = f64::INFINITY;
        let mut miny = f64::INFINITY;
        let mut maxx = f64::NEG_INFINITY;
        let mut maxy = f64::NEG_INFINITY;
        for clip in &clips {
            let t = clip.node.transform();
            match &clip.node {
                Node::Rect { width, height, .. } => {
                    let w = width * t.scale_x;
                    let h = height * t.scale_y;
                    minx = minx.min(t.x);
                    miny = miny.min(t.y);
                    maxx = maxx.max(t.x + w);
                    maxy = maxy.max(t.y + h);
                }
                Node::SymbolInstance { .. } => {
                    minx = minx.min(t.x);
                    miny = miny.min(t.y);
                    maxx = maxx.max(t.x);
                    maxy = maxy.max(t.y);
                }
            }
        }
        let (dx, dy) = match mode {
            PasteMode::InPlace => (0.0, 0.0),
            PasteMode::Center => {
                if minx.is_finite() {
                    let cx = (minx + maxx) / 2.0;
                    let cy = (miny + maxy) / 2.0;
                    (
                        self.doc.settings.width / 2.0 - cx,
                        self.doc.settings.height / 2.0 - cy,
                    )
                } else {
                    (0.0, 0.0)
                }
            }
        };

        let mut items = Vec::new();
        let mut new_sel = Vec::new();
        for clip in &clips {
            let nid = self.doc.alloc_node_id();
            let mut node = clip.node.with_id(nid);
            node.transform_mut().x += dx;
            node.transform_mut().y += dy;
            new_sel.push(nid);
            items.push(node);
        }
        if items.is_empty() {
            return false;
        }
        let cmd = PasteObjects::new(self.active_scene, self.active_layer, self.playhead, items);
        self.exec_then(Box::new(cmd), |s| {
            s.selection = new_sel;
        });
        self.log(&format!("paste:{mode:?}"));
        true
    }

    /// DUPLICATE = copy + paste-in-place + offset (AMB-SYS03-001).
    /// One undoable paste. The clipboard keeps the un-offset snapshot so a
    /// subsequent Paste In Place still lands at the original coordinates.
    pub fn duplicate_objects(&mut self) -> bool {
        if !self.copy_objects() {
            return false;
        }
        let mut clips = app_object_clipboard();
        for clip in &mut clips {
            clip.node.transform_mut().x += DUPLICATE_OFFSET;
            clip.node.transform_mut().y += DUPLICATE_OFFSET;
        }
        set_app_object_clipboard(clips);
        let ok = self.paste_objects(PasteMode::InPlace);
        let mut clips = app_object_clipboard();
        for clip in &mut clips {
            clip.node.transform_mut().x -= DUPLICATE_OFFSET;
            clip.node.transform_mut().y -= DUPLICATE_OFFSET;
        }
        set_app_object_clipboard(clips);
        if ok {
            self.log("duplicate:objects");
        }
        ok
    }

    /// Rotate the editable selection by `degrees` (SYS-06). One command.
    pub fn rotate_selection(&mut self, degrees: f64) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            return false;
        }
        let mut after = Vec::new();
        for id in ids {
            let Some(mut t) = self.selected_transform(id) else {
                continue;
            };
            t.rotation += degrees;
            after.push((id, t));
        }
        if after.is_empty() {
            return false;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log(&format!("rotate:{degrees}"));
        true
    }

    /// Flip the editable selection horizontally or vertically around each
    /// object's visual center (rects) / registration (instances).
    pub fn flip_selection(&mut self, horizontal: bool) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            return false;
        }
        let mut after = Vec::new();
        for id in ids {
            let Some(mut t) = self.selected_transform(id) else {
                continue;
            };
            match self.doc.nodes.get(&id) {
                Some(Node::Rect { width, height, .. }) => {
                    if horizontal {
                        let vis_w = *width * t.scale_x;
                        let cx = t.x + vis_w / 2.0;
                        t.scale_x = -t.scale_x;
                        t.x = cx - (*width * t.scale_x) / 2.0;
                    } else {
                        let vis_h = *height * t.scale_y;
                        let cy = t.y + vis_h / 2.0;
                        t.scale_y = -t.scale_y;
                        t.y = cy - (*height * t.scale_y) / 2.0;
                    }
                }
                Some(Node::SymbolInstance { .. }) => {
                    if horizontal {
                        t.scale_x = -t.scale_x;
                    } else {
                        t.scale_y = -t.scale_y;
                    }
                }
                None => continue,
            }
            after.push((id, t));
        }
        if after.is_empty() {
            return false;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log(if horizontal { "flip:h" } else { "flip:v" });
        true
    }

    /// Remove Transform (Blueprint 1.2.5): reset scale/rotation/skew, keep x/y.
    pub fn remove_transform(&mut self) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            return false;
        }
        let mut after = Vec::new();
        for id in ids {
            let Some(mut t) = self.selected_transform(id) else {
                continue;
            };
            if t.scale_x == 1.0
                && t.scale_y == 1.0
                && t.rotation == 0.0
                && t.skew_x == 0.0
                && t.skew_y == 0.0
            {
                continue;
            }
            t.scale_x = 1.0;
            t.scale_y = 1.0;
            t.rotation = 0.0;
            t.skew_x = 0.0;
            t.skew_y = 0.0;
            after.push((id, t));
        }
        if after.is_empty() {
            return false;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log("transform:remove");
        true
    }

    /// Arrange (z-order) the editable selection. One command.
    pub fn arrange_selection(&mut self, op: ArrangeOp) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            return false;
        }
        let cmd = ArrangeSelection::new(self.active_scene, self.playhead, ids, op);
        self.exec(Box::new(cmd));
        self.log(&format!("arrange:{op:?}"));
        true
    }

    /// Align the editable selection (Part 24). Single object → Align to Stage
    /// (Part 24.5); two or more → Align to Selection unless `space` is Stage.
    pub fn align_selection(&mut self, op: AlignOp, space: AlignSpace) -> bool {
        let ids = self.selected_editable();
        if ids.is_empty() {
            return false;
        }
        let space = if ids.len() == 1 {
            AlignSpace::Stage
        } else {
            space
        };
        let mut bounds: Vec<(NodeId, f64, f64, f64, f64)> = Vec::new();
        for id in &ids {
            if let Some(b) = node_bounds(&self.doc, self.active_scene, self.playhead, *id) {
                bounds.push((*id, b.0, b.1, b.2, b.3));
            }
        }
        if bounds.is_empty() {
            return false;
        }
        let (ref_l, ref_t, ref_r, ref_b) = match space {
            AlignSpace::Stage => (0.0, 0.0, self.doc.settings.width, self.doc.settings.height),
            AlignSpace::Selection => {
                let l = bounds.iter().map(|b| b.1).fold(f64::INFINITY, f64::min);
                let t = bounds.iter().map(|b| b.2).fold(f64::INFINITY, f64::min);
                let r = bounds.iter().map(|b| b.3).fold(f64::NEG_INFINITY, f64::max);
                let b = bounds.iter().map(|b| b.4).fold(f64::NEG_INFINITY, f64::max);
                (l, t, r, b)
            }
        };
        let mut after = Vec::new();
        for (id, l, t, r, btm) in bounds {
            let Some(mut xf) = self.selected_transform(id) else {
                continue;
            };
            let (dx, dy) = match op {
                AlignOp::Left => (ref_l - l, 0.0),
                AlignOp::CenterH => {
                    let ref_c = (ref_l + ref_r) / 2.0;
                    let obj_c = (l + r) / 2.0;
                    (ref_c - obj_c, 0.0)
                }
                AlignOp::Right => (ref_r - r, 0.0),
                AlignOp::Top => (0.0, ref_t - t),
                AlignOp::MiddleV => {
                    let ref_c = (ref_t + ref_b) / 2.0;
                    let obj_c = (t + btm) / 2.0;
                    (0.0, ref_c - obj_c)
                }
                AlignOp::Bottom => (0.0, ref_b - btm),
            };
            if dx == 0.0 && dy == 0.0 {
                continue;
            }
            xf.x += dx;
            xf.y += dy;
            after.push((id, xf));
        }
        if after.is_empty() {
            return false;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log(&format!("align:{op:?}/{space:?}"));
        true
    }

    // ——— Layers (MOD-LAYER, Part 20) ———

    /// Layer snapshot for the UI (bottom → top, engine order).
    pub fn layers(&self) -> Vec<Layer> {
        self.doc
            .scene(self.active_scene)
            .map(|sc| sc.layers.clone())
            .unwrap_or_default()
    }

    /// Set the active layer (VIEW state — no command, no undo). The active
    /// layer is where new draws land; it is not persisted (ENT-selection).
    pub fn set_active_layer(&mut self, index: usize) -> bool {
        let count = self
            .doc
            .scene(self.active_scene)
            .map(|sc| sc.layers.len())
            .unwrap_or(0);
        if index >= count {
            return false;
        }
        self.active_layer = index;
        self.log(&format!("layer:active({index})"));
        true
    }

    /// Create a new normal layer ABOVE the active one; it becomes active
    /// (Part 20.1). Returns the new layer's index.
    pub fn create_layer(&mut self) -> Option<usize> {
        let scene = self.active_scene;
        let count = self.doc.scene(scene)?.layers.len();
        let index = (self.active_layer + 1).min(count);
        let name = self.next_layer_name();
        let layer = Layer::new_normal(self.doc.alloc_layer_id(), name);
        let cmd = CreateLayer {
            scene,
            index,
            layer,
        };
        self.exec(Box::new(cmd));
        self.active_layer = index;
        self.log(&format!("layer:create@{index}"));
        Some(index)
    }

    /// Create a folder ABOVE the active layer (F-20-05 / Part 20.1). Becomes
    /// active. Folders store no frames (organizational only).
    pub fn create_folder(&mut self) -> Option<usize> {
        let scene = self.active_scene;
        let count = self.doc.scene(scene)?.layers.len();
        let index = (self.active_layer + 1).min(count);
        let name = self.next_folder_name();
        let layer = Layer::new_folder(self.doc.alloc_layer_id(), name);
        let cmd = CreateLayer {
            scene,
            index,
            layer,
        };
        self.exec(Box::new(cmd));
        self.active_layer = index;
        self.log(&format!("folder:create@{index}"));
        Some(index)
    }

    fn next_folder_name(&self) -> String {
        let mut n = 1;
        loop {
            let candidate = format!("Folder {n}");
            let taken = self
                .doc
                .scenes
                .iter()
                .flat_map(|sc| sc.layers.iter())
                .any(|l| l.name == candidate);
            if !taken {
                return candidate;
            }
            n += 1;
        }
    }

    /// Nest `child` under `parent` (must be a folder). `parent == None` un-nests.
    /// Cycle / non-folder parent / self = no-op (no command).
    pub fn set_layer_parent(&mut self, child: usize, parent: Option<usize>) -> bool {
        let scene = self.active_scene;
        let Some(sc) = self.doc.scene(scene) else {
            return false;
        };
        let Some(child_l) = sc.layers.get(child).cloned() else {
            return false;
        };
        let after = if let Some(p) = parent {
            let Some(pl) = sc.layers.get(p) else {
                return false;
            };
            if !pl.is_folder() {
                self.log("nest:blocked(parent not folder)");
                return false;
            }
            if self.doc.layer_is_ancestor(scene, child_l.id, pl.id) {
                self.log("nest:blocked(cycle)");
                return false;
            }
            Some(pl.id)
        } else {
            None
        };
        if child_l.parent_id == after {
            return false;
        }
        let cmd = SetLayerParent {
            scene,
            layer_id: child_l.id,
            before: child_l.parent_id,
            after,
        };
        self.exec(Box::new(cmd));
        self.log("layer:parent");
        true
    }

    pub fn set_folder_collapsed(&mut self, index: usize, collapsed: bool) -> bool {
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if !l.is_folder() || l.collapsed == collapsed {
            return false;
        }
        let cmd = SetFolderCollapsed {
            scene: self.active_scene,
            layer_id: l.id,
            before: l.collapsed,
            after: collapsed,
        };
        self.exec(Box::new(cmd));
        self.log(&format!("folder:collapsed@{index}={collapsed}"));
        true
    }

    fn next_layer_name(&self) -> String {
        let mut n = 1;
        loop {
            let candidate = format!("Layer {n}");
            let taken = self
                .doc
                .scenes
                .iter()
                .flat_map(|sc| sc.layers.iter())
                .any(|l| l.name == candidate);
            if !taken {
                return candidate;
            }
            n += 1;
        }
    }

    // ————— SYS-05 Insert ▸ Scene (Part 01 §1.2.4 + Part 25.1) —————

    /// Insert ▸ Scene: APPEND a scene with a default timeline ("Layer 1"
    /// with its blank keyframe @1 — the same default `Document::new` seeds)
    /// named "Scene N" (first unused N, mirroring layer naming), and make it
    /// ACTIVE (Part 25.1 "becomes active"). Activation re-binds the editing
    /// context (Part 25.4): selection cleared, active layer 0, playhead 1.
    /// ONE undo step; undo removes the scene and `sanitize_indices()`
    /// re-clamps the active pointer (selection restore = History contract).
    pub fn create_scene(&mut self) -> Option<usize> {
        let name = self.next_scene_name();
        let layer = Layer::new_normal(self.doc.alloc_layer_id(), "Layer 1");
        let scene = Scene {
            id: self.doc.alloc_scene_id(),
            name,
            layers: vec![layer],
        };
        let index = self.doc.scenes.len();
        self.exec(Box::new(CreateScene { scene }));
        self.active_scene = index;
        self.active_layer = 0;
        self.playhead = 1;
        self.selection.clear();
        self.log(&format!("scene:create@{index}"));
        Some(index)
    }

    /// First unused "Scene N" (display name only — identity is SceneId).
    fn next_scene_name(&self) -> String {
        let mut n = 1;
        loop {
            let candidate = format!("Scene {n}");
            if !self.doc.scenes.iter().any(|sc| sc.name == candidate) {
                return candidate;
            }
            n += 1;
        }
    }

    /// Delete a layer. The LAST remaining layer cannot be deleted
    /// ([OUR DESIGN DECISION] — an editor always keeps ≥1 draw target).
    pub fn delete_layer(&mut self, index: usize) -> bool {
        let scene = self.active_scene;
        let Some(sc) = self.doc.scene(scene) else {
            return false;
        };
        if sc.layers.len() <= 1 {
            self.log("layer:delete(blocked:last)");
            return false;
        }
        let Some(layer) = sc.layers.get(index).cloned() else {
            return false;
        };
        if layer.is_folder() {
            let mut desc = self.doc.layer_descendants(scene, layer.id);
            desc.push(layer.id);
            if sc.layers.len() <= desc.len() {
                self.log("layer:delete(blocked:would empty)");
                return false;
            }
            let mut pack: Vec<(usize, Layer)> = sc
                .layers
                .iter()
                .enumerate()
                .filter(|(_, l)| desc.contains(&l.id))
                .map(|(i, l)| (i, l.clone()))
                .collect();
            pack.sort_by_key(|(i, _)| std::cmp::Reverse(*i));
            let cmd = DeleteLayerGroup::new(scene, pack);
            self.exec(Box::new(cmd));
        } else {
            let cmd = DeleteLayer::new(scene, index, layer);
            self.exec(Box::new(cmd));
        }
        self.sanitize_indices();
        self.prune_selection_existence();
        self.history
            .seal_last_post_selection(self.selection.clone());
        self.log(&format!("layer:delete@{index}"));
        true
    }

    /// Rename a layer (display-only name; ids stable). Empty name = no-op.
    pub fn rename_layer(&mut self, index: usize, name: &str) -> bool {
        let name = name.trim();
        if name.is_empty() {
            return false;
        }
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if l.name == name {
            return false;
        }
        let cmd = RenameLayer {
            scene: self.active_scene,
            layer_id: l.id,
            before: l.name,
            after: name.to_string(),
        };
        self.exec(Box::new(cmd));
        self.log(&format!("layer:rename@{index}"));
        true
    }

    /// Eye toggle (undoable). Hiding a layer drops its objects from selection.
    pub fn set_layer_visible(&mut self, index: usize, visible: bool) -> bool {
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if l.visible == visible {
            return false;
        }
        if l.is_folder() {
            self.cascade_flag(index, LayerFlagKind::Visible, visible);
        } else {
            let cmd = SetLayerVisible {
                scene: self.active_scene,
                layer_id: l.id,
                before: l.visible,
                after: visible,
            };
            self.exec(Box::new(cmd));
        }
        if !visible {
            self.prune_selection_by_layer_state();
            self.history
                .seal_last_post_selection(self.selection.clone());
        }
        self.log(&format!("layer:visible@{index}={visible}"));
        true
    }

    /// Padlock toggle (undoable). Locking a layer drops its objects from
    /// selection and from Select All (Part 20.2).
    pub fn set_layer_locked(&mut self, index: usize, locked: bool) -> bool {
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if l.locked == locked {
            return false;
        }
        // BUG B-3: locking a FOLDER must cascade to its descendants (the folder
        // row itself holds no content), exactly like visible/outline do.
        if l.is_folder() {
            self.cascade_flag(index, LayerFlagKind::Locked, locked);
        } else {
            let cmd = SetLayerLocked {
                scene: self.active_scene,
                layer_id: l.id,
                before: l.locked,
                after: locked,
            };
            self.exec(Box::new(cmd));
        }
        if locked {
            self.prune_selection_by_layer_state();
            self.history
                .seal_last_post_selection(self.selection.clone());
        }
        self.log(&format!("layer:locked@{index}={locked}"));
        true
    }

    /// Outline-mode toggle (undoable; F-07-02 E3 / F-20-01). Outline is a view
    /// aid — no selection impact.
    pub fn set_layer_outline(&mut self, index: usize, outline: bool) -> bool {
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if l.outline == outline {
            return false;
        }
        if l.is_folder() {
            self.cascade_flag(index, LayerFlagKind::Outline, outline);
        } else {
            let cmd = SetLayerOutline {
                scene: self.active_scene,
                layer_id: l.id,
                before: l.outline,
                after: outline,
            };
            self.exec(Box::new(cmd));
        }
        self.log(&format!("layer:outline@{index}={outline}"));
        true
    }

    /// F-20-05: folder lock/hide/outline cascade to all descendants as ONE undo.
    fn cascade_flag(&mut self, index: usize, kind: LayerFlagKind, after_val: bool) {
        let scene = self.active_scene;
        let Some(sc) = self.doc.scene(scene) else {
            return;
        };
        let Some(root) = sc.layers.get(index) else {
            return;
        };
        let mut ids = self.doc.layer_descendants(scene, root.id);
        ids.insert(0, root.id);
        let mut before = Vec::new();
        let mut after = Vec::new();
        for id in ids {
            if let Some(l) = sc.layers.iter().find(|l| l.id == id) {
                let cur = match kind {
                    LayerFlagKind::Visible => l.visible,
                    LayerFlagKind::Locked => l.locked,
                    LayerFlagKind::Outline => l.outline,
                };
                before.push((id, cur));
                after.push((id, after_val));
            }
        }
        let cmd = SetLayerFlags {
            scene,
            kind,
            before,
            after,
        };
        self.exec(Box::new(cmd));
    }

    /// Outline color (undoable; F-07-02 E6 "Layer Properties → outline color" /
    /// Part 33 `layer.outlineColor`). Empty string = no-op.
    pub fn set_layer_outline_color(&mut self, index: usize, color: &str) -> bool {
        let color = color.trim();
        if color.is_empty() {
            return false;
        }
        let Some(l) = self
            .doc
            .scene(self.active_scene)
            .and_then(|sc| sc.layers.get(index))
            .cloned()
        else {
            return false;
        };
        if l.outline_color == color {
            return false;
        }
        let cmd = SetLayerOutlineColor {
            scene: self.active_scene,
            layer_id: l.id,
            before: l.outline_color,
            after: color.to_string(),
        };
        self.exec(Box::new(cmd));
        self.log(&format!("layer:outline-color@{index}={color}"));
        true
    }

    /// Alt+click "all others" batch toggle (F-07-02 E1/E2/E3 + M.3): flips the
    /// given flag on EVERY layer except `exclude`, as ONE undo step. Returns
    /// false when there are no other layers (nothing to toggle).
    ///
    /// M.3 edge case (eye): when EVERY layer is hidden, the Alt+click shows
    /// ALL layers — so the clicked layer joins the batch in that case too.
    /// [OUR DESIGN DECISION — registered: the evidence table says "toggle all
    /// OTHERS" while M.3 says "all hidden → shows all"; the M.3 rescue only
    /// fires when literally every layer is hidden.]
    fn batch_flag_toggle(&mut self, exclude: usize, kind: LayerFlagKind) -> bool {
        let Some(sc) = self.doc.scene(self.active_scene) else {
            return false;
        };
        let count = sc.layers.len();
        if count <= 1 {
            return false;
        }
        let all_hidden = kind == LayerFlagKind::Visible && sc.layers.iter().all(|l| !l.visible);
        let mut before = Vec::new();
        let mut after = Vec::new();
        for (i, l) in sc.layers.iter().enumerate() {
            // Lock/outline batches never touch the clicked layer; the eye batch
            // touches it ONLY in the M.3 all-hidden rescue.
            if i == exclude && !(kind == LayerFlagKind::Visible && all_hidden) {
                continue;
            }
            let cur = match kind {
                LayerFlagKind::Visible => l.visible,
                LayerFlagKind::Locked => l.locked,
                LayerFlagKind::Outline => l.outline,
            };
            before.push((l.id, cur));
            after.push((l.id, !cur));
        }
        if before.is_empty() {
            return false;
        }
        let cmd = SetLayerFlags {
            scene: self.active_scene,
            kind,
            before,
            after,
        };
        self.exec(Box::new(cmd));
        if kind == LayerFlagKind::Visible {
            self.prune_selection_by_layer_state();
            self.history
                .seal_last_post_selection(self.selection.clone());
        }
        self.log(&format!("layer:batch-{kind:?}:exclude={exclude}"));
        true
    }

    pub fn toggle_other_layers_visible(&mut self, exclude: usize) -> bool {
        self.batch_flag_toggle(exclude, LayerFlagKind::Visible)
    }

    pub fn toggle_other_layers_locked(&mut self, exclude: usize) -> bool {
        self.batch_flag_toggle(exclude, LayerFlagKind::Locked)
    }

    pub fn toggle_other_layers_outline(&mut self, exclude: usize) -> bool {
        self.batch_flag_toggle(exclude, LayerFlagKind::Outline)
    }

    /// Deep-copy one layer: every node it references gets a fresh NodeId, so
    /// the copy is fully independent of the source (F-20-01). `copied_nodes`
    /// accumulates the new nodes for the (undoable) command.
    fn clone_layer_deep(
        &mut self,
        src: &Layer,
        id: LayerId,
        name: String,
        parent_id: Option<LayerId>,
        copied_nodes: &mut std::collections::BTreeMap<NodeId, Node>,
    ) -> Layer {
        // (Clone the nodes out first so the immutable read and the mutable
        // id-allocation phases never overlap.)
        let mut remap: std::collections::BTreeMap<NodeId, NodeId> =
            std::collections::BTreeMap::new();
        let mut pending: Vec<(NodeId, Node)> = Vec::new();
        for fr in src.keyframes.values() {
            if let Frame::Keyframe { content, .. } = fr {
                for id in content {
                    if pending.iter().any(|(pid, _)| pid == id) {
                        continue;
                    }
                    if let Some(node) = self.doc.nodes.get(id) {
                        pending.push((*id, node.clone()));
                    }
                }
            }
        }
        for (id, node) in pending {
            let new_id = self.doc.alloc_node_id();
            remap.insert(id, new_id);
            copied_nodes.insert(new_id, node.with_id(new_id));
        }
        let mut keyframes: std::collections::BTreeMap<u32, Frame> =
            std::collections::BTreeMap::new();
        for (f, fr) in &src.keyframes {
            match fr {
                Frame::Blank => {
                    keyframes.insert(*f, Frame::Blank);
                }
                Frame::Keyframe {
                    content,
                    transforms,
                    label,
                } => {
                    let content2: Vec<NodeId> = content
                        .iter()
                        .filter_map(|id| remap.get(id).copied())
                        .collect();
                    let transforms2: std::collections::BTreeMap<NodeId, Transform> = transforms
                        .iter()
                        .filter_map(|(id, t)| remap.get(id).map(|nid| (*nid, t.clone())))
                        .collect();
                    keyframes.insert(
                        *f,
                        Frame::Keyframe {
                            content: content2,
                            transforms: transforms2,
                            label: label.clone(),
                        },
                    );
                }
            }
        }
        Layer {
            id,
            name,
            keyframes,
            tweens: src.tweens.clone(),
            visible: src.visible,
            locked: src.locked,
            outline: src.outline,
            outline_color: src.outline_color.clone(),
            kind: src.kind,
            parent_id,
            collapsed: src.collapsed,
        }
    }

    /// Duplicate a layer ABOVE the source: deep copy of frames AND content
    /// (Part 20.1 / F-20-01). The copy becomes active. Returns its index.
    ///
    /// BUG B-4: duplicating a FOLDER duplicates the WHOLE subtree (the folder
    /// row + every descendant folder/layer, with their frames and content)
    /// instead of just the empty folder row; `parent_id`s are remapped through
    /// the new ids so the copied hierarchy keeps its nesting, and the whole
    /// thing is ONE undo step.
    pub fn duplicate_layer(&mut self, index: usize) -> Option<usize> {
        let scene = self.active_scene;
        let count = self.doc.scene(scene)?.layers.len();
        if index >= count {
            return None;
        }
        let src = self.doc.scene(scene)?.layers[index].clone();

        // Source subtree in stable stack order: the row itself, then every
        // descendant in the order they appear in the layer stack.
        let mut sources: Vec<Layer> = vec![src.clone()];
        if src.is_folder() {
            let desc = self.doc.layer_descendants(scene, src.id);
            if let Some(sc) = self.doc.scene(scene) {
                for l in sc.layers.iter() {
                    if desc.contains(&l.id) {
                        sources.push(l.clone());
                    }
                }
            }
        }

        let mut copied_nodes: std::collections::BTreeMap<NodeId, Node> =
            std::collections::BTreeMap::new();
        let mut layer_remap: std::collections::BTreeMap<LayerId, LayerId> =
            std::collections::BTreeMap::new();
        let mut copies: Vec<Layer> = Vec::new();
        // Names are uniquified against the document AND the copies made in this
        // same pass (they are not in the document yet).
        let mut reserved: Vec<String> = Vec::new();
        // `alloc_layer_id()` derives max+1 from the layers ALREADY in the
        // document, so it would hand out the same id twice while the copies are
        // still detached — count up locally instead (ids stay unique/stable).
        let mut next_layer_id = self.doc.alloc_layer_id().0;
        for source in &sources {
            let name = self.next_copy_name(&source.name, &reserved);
            reserved.push(name.clone());
            let id = LayerId(next_layer_id);
            next_layer_id += 1;
            // Parents are remapped in a second pass, so the stack order of the
            // descendants cannot matter.
            let copy =
                self.clone_layer_deep(source, id, name, source.parent_id, &mut copied_nodes);
            layer_remap.insert(source.id, copy.id);
            copies.push(copy);
        }
        // Re-parent the copies onto their COPIED ancestors (the root copy keeps
        // the source's own parent, which is outside the duplicated subtree).
        for copy in copies.iter_mut().skip(1) {
            copy.parent_id = copy
                .parent_id
                .and_then(|pid| layer_remap.get(&pid).copied());
        }

        let cmd = DuplicateLayer {
            scene,
            source_index: index,
            layers: copies,
            copied_nodes,
        };
        self.exec(Box::new(cmd));
        self.active_layer = index + 1;
        self.log(&format!("layer:duplicate@{index}"));
        Some(index + 1)
    }

    /// Unique name for a duplicated layer, Animate-style: "arm", "arm copy",
    /// "arm copy 2", "arm copy 3", … — duplicates of a copy keep counting from
    /// the original stem instead of stacking "copy copy".
    fn next_copy_name(&self, base: &str, reserved: &[String]) -> String {
        let taken = |n: &str| {
            self.doc
                .scenes
                .iter()
                .flat_map(|sc| sc.layers.iter())
                .any(|l| l.name == n)
                || reserved.iter().any(|r| r == n)
        };
        let stem = strip_copy_suffix(base);
        let first = format!("{stem} copy");
        if !taken(&first) {
            return first;
        }
        let mut i = 2;
        loop {
            let c = format!("{stem} copy {i}");
            if !taken(&c) {
                return c;
            }
            i += 1;
        }
    }

    /// Reorder a layer (undoable). The active layer follows its id.
    pub fn move_layer(&mut self, from: usize, to: usize) -> bool {
        let scene = self.active_scene;
        let Some(sc) = self.doc.scene(scene) else {
            return false;
        };
        let n = sc.layers.len();
        if from >= n || to >= n || from == to {
            return false;
        }
        let before: Vec<LayerId> = sc.layers.iter().map(|l| l.id).collect();
        let from_is_folder = sc.layers[from].is_folder();
        let active_id = sc.layers.get(self.active_layer).map(|l| l.id);
        let moved_id = before[from];

        // BUG (LAYER research: "reorder must keep parent/children consistent")
        // — Adobe: folders "can contain both layers and other folders, allowing
        // you to organize layers in much the same way you organize files on
        // your computer", so dragging a FOLDER carries its whole subtree.
        // Moving the folder row alone left its children stranded in the stack.
        let block: Vec<LayerId> = if from_is_folder {
            let desc = self.doc.layer_descendants(scene, moved_id);
            before
                .iter()
                .copied()
                .filter(|id| *id == moved_id || desc.contains(id))
                .collect()
        } else {
            vec![moved_id]
        };
        // A drop position INSIDE the moved block is meaningless — keep walking
        // in the direction of travel until a row outside the block is found
        // (so "move up" on a folder steps over its own children instead of
        // being blocked). No such row = the block is already at that edge.
        let step: isize = if to > from { 1 } else { -1 };
        let mut t = to as isize;
        while t >= 0 && (t as usize) < n && block.contains(&before[t as usize]) {
            t += step;
        }
        if t < 0 || (t as usize) >= n {
            self.log("layer:reorder(no room past own subtree)");
            return false;
        }
        let target_id = before[t as usize];

        let mut after: Vec<LayerId> = before
            .iter()
            .copied()
            .filter(|id| !block.contains(id))
            .collect();
        let Some(pos) = after.iter().position(|id| *id == target_id) else {
            return false;
        };
        let insert_at = if to > from { pos + 1 } else { pos };
        for (i, id) in block.iter().copied().enumerate() {
            after.insert(insert_at + i, id);
        }

        let cmd = ReorderLayer {
            scene,
            before,
            after,
        };
        self.exec(Box::new(cmd));
        if let Some(aid) = active_id {
            if let Some(new_idx) = self
                .doc
                .scene(scene)
                .and_then(|s| s.layers.iter().position(|l| l.id == aid))
            {
                self.active_layer = new_idx;
            }
        }
        self.log(&format!("layer:reorder({from}→{to})"));
        true
    }

    // ——— Object properties (MOD-XFR / MOD-SHAPE base props, Part 26) ———

    /// Edit BASE node properties (width/height/fill/stroke). One command covers
    /// every patched node → one undo entry per commit.
    pub fn set_node_props(&mut self, patches: Vec<(NodeId, NodePropsPatch)>) {
        let mut updates: Vec<(NodeId, Node, Node)> = Vec::new();
        for (id, patch) in patches {
            let Some(before) = self.doc.nodes.get(&id).cloned() else {
                continue;
            };
            let after = apply_node_props(&before, &patch);
            if after == before {
                continue;
            }
            updates.push((id, before, after));
        }
        if updates.is_empty() {
            return;
        }
        let cmd = SetNodeProps { updates };
        self.exec(Box::new(cmd));
        self.log("props:node");
    }

    /// Edit transform fields (x/y/scale/rotation) at the CURRENT playhead.
    /// The "before" is the node's interpolated/held transform (so an edit on an
    /// animated frame never jumps); the override is written with auto-key via
    /// the existing TransformSelection command (one undo entry).
    pub fn patch_node_transforms(&mut self, patches: Vec<(NodeId, TransformPatch)>) {
        if patches.is_empty() {
            return;
        }
        let mut after: Vec<(NodeId, Transform)> = Vec::new();
        for (id, patch) in patches {
            let Some(before) = self.selected_transform(id) else {
                continue;
            };
            let merged = apply_transform_patch(&before, &patch);
            if merged == before {
                continue;
            }
            after.push((id, merged));
        }
        if after.is_empty() {
            return;
        }
        let cmd =
            TransformSelection::new(after, self.active_scene, self.active_layer, self.playhead);
        self.exec(Box::new(cmd));
        self.log("transform:patch");
    }

    /// Edit document settings (stage size / fps / background) — undoable.
    pub fn set_document_settings(&mut self, patch: SettingsPatch) -> bool {
        let before = self.doc.settings.clone();
        let after = Settings {
            width: patch.width.unwrap_or(before.width).max(2.0),
            height: patch.height.unwrap_or(before.height).max(2.0),
            fps: patch.fps.unwrap_or(before.fps).clamp(1, 120),
            background: patch
                .background
                .unwrap_or_else(|| before.background.clone()),
            background_alpha: patch
                .background_alpha
                .unwrap_or(before.background_alpha)
                .clamp(0.0, 1.0),
            // units/platform are document-level settings (Part 01 §1.7); the
            // current patch surface (SYS-17) edits width/height/fps/background
            // only — preserve the rest.
            units: before.units.clone(),
            platform: before.platform.clone(),
        };
        if after == before {
            return false;
        }
        let cmd = SetDocumentSettings { before, after };
        self.exec(Box::new(cmd));
        self.log("document:settings");
        true
    }

    // ——— selection hygiene ———

    /// Clamp active_scene/active_layer into valid ranges after undo/redo or
    /// layer deletion. View-state only.
    fn sanitize_indices(&mut self) {
        if self.active_scene >= self.doc.scenes.len() {
            self.active_scene = self.doc.scenes.len().saturating_sub(1);
        }
        let n = self
            .doc
            .scene(self.active_scene)
            .map(|sc| sc.layers.len())
            .unwrap_or(1);
        if self.active_layer >= n {
            self.active_layer = n.saturating_sub(1);
        }
    }

    /// Drop selected ids whose node no longer exists in the document (e.g. a
    /// layer delete orphaned them, or an undo removed them).
    fn prune_selection_existence(&mut self) {
        let before = self.selection.len();
        self.selection.retain(|id| self.doc.nodes.contains_key(id));
        if self.selection.len() != before {
            self.log("select:pruned(existence)");
        }
    }

    /// Drop selected ids that live on a hidden or locked layer at the playhead
    /// (those objects are no longer selectable — REQ-SEL-001 / Part 20.2).
    fn prune_selection_by_layer_state(&mut self) {
        let before = self.selection.len();
        let scene = self.active_scene;
        let frame = self.playhead;
        let mut keep = Vec::new();
        if let Some(sc) = self.doc.scene(scene) {
            for id in self.selection.iter().copied() {
                let mut on_layer = None;
                for (i, layer) in sc.layers.iter().enumerate() {
                    if self.doc.content_at(scene, i, frame).contains(&id) {
                        on_layer = Some(layer);
                        break;
                    }
                }
                if let Some(layer) = on_layer {
                    // BUG B-1: an object inside a hidden/locked FOLDER is no
                    // longer selectable either.
                    let (vis, lock) = crate::eval::effective_layer_state(&sc.layers, layer);
                    if vis && !lock {
                        keep.push(id);
                    }
                } else {
                    keep.push(id); // not held anywhere → prune by existence later
                }
            }
        }
        self.selection = keep;
        if self.selection.len() != before {
            self.log("select:pruned(layer state)");
        }
    }

    pub fn undo(&mut self) -> bool {
        let Some(sel) = self.history.undo(&mut self.doc) else {
            self.log("undo:(empty)");
            return false;
        };
        self.sanitize_indices();
        self.selection = sel;
        self.prune_selection_existence();
        self.log("undo");
        true
    }

    /// STM-DIRTY / H00 §7: has the document unsaved edits — i.e. does the
    /// current document differ from the last-saved snapshot?
    pub fn is_dirty(&self) -> bool {
        self.history.is_dirty(&self.doc)
    }

    /// Mark the document clean (successful Save). Load/New set their own
    /// baseline at construction.
    pub fn mark_clean(&mut self) {
        self.history.mark_clean(&self.doc);
    }

    pub fn redo(&mut self) -> bool {
        let Some(sel) = self.history.redo(&mut self.doc) else {
            self.log("redo:(empty)");
            return false;
        };
        self.sanitize_indices();
        self.selection = sel;
        self.prune_selection_existence();
        self.log("redo");
        true
    }

    pub fn evaluate(&self, frame: u32) -> Vec<RectItem> {
        evaluate(&self.doc, self.active_scene, frame)
    }

    pub fn current_frame(&self) -> Vec<RectItem> {
        self.evaluate(self.playhead)
    }

    pub fn export_svg(&self, frame: u32) -> String {
        export_svg(&self.doc, self.active_scene, frame)
    }

    /// SVG export with a supersampling scale (1×/2×/4× — Part 28.1).
    pub fn export_svg_scaled(&self, frame: u32, scale: f64) -> String {
        export_svg_scaled(&self.doc, self.active_scene, frame, scale)
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        persist::save(&self.doc, path)
    }

    pub fn load(path: &Path) -> Result<Self, String> {
        let doc = persist::load(path)?;
        Ok(Self::from_document(doc))
    }

    /// Wrap an existing document in a fresh session (selection empty, playhead
    /// 1, clean history) — the Open/New-from-template reload contract (SYS-02
    /// §16: selection reset, playhead reset, history reset).
    pub fn from_document(doc: Document) -> Self {
        Self {
            history: History::new(&doc),
            doc,
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:loaded".into()],
            frame_clipboard: Vec::new(),
        }
    }
}

/// Merge a transform patch over an existing transform (None = keep current).
fn apply_transform_patch(t: &Transform, p: &TransformPatch) -> Transform {
    Transform {
        x: p.x.unwrap_or(t.x),
        y: p.y.unwrap_or(t.y),
        scale_x: p.scale_x.unwrap_or(t.scale_x),
        scale_y: p.scale_y.unwrap_or(t.scale_y),
        rotation: p.rotation.unwrap_or(t.rotation),
        skew_x: t.skew_x,
        skew_y: t.skew_y,
        pivot_x: t.pivot_x,
        pivot_y: t.pivot_y,
    }
}

/// Apply a base-property patch over a node (None = keep current). Dimensions
/// are clamped ≥ 0; stroke_enabled drives whether a stroke exists at all.
fn apply_node_props(node: &Node, p: &NodePropsPatch) -> Node {
    match node {
        Node::Rect {
            id,
            transform,
            width,
            height,
            fill,
            stroke,
            stroke_width,
        } => {
            let mut w = *width;
            let mut h = *height;
            let mut f = fill.clone();
            let mut s = stroke.clone();
            let mut sw = *stroke_width;
            if let Some(v) = p.width {
                w = v.max(0.0);
            }
            if let Some(v) = p.height {
                h = v.max(0.0);
            }
            if let Some(v) = &p.fill {
                f = v.clone();
            }
            match p.stroke_enabled {
                Some(true) => {
                    s = Some(
                        p.stroke
                            .clone()
                            .unwrap_or_else(|| s.clone().unwrap_or_else(|| "#000000".to_string())),
                    );
                }
                Some(false) => {
                    s = None;
                }
                None => {
                    if let Some(v) = &p.stroke {
                        s = Some(v.clone());
                    }
                }
            }
            if let Some(v) = p.stroke_width {
                sw = v.max(0.0);
            }
            Node::Rect {
                id: *id,
                transform: transform.clone(),
                width: w,
                height: h,
                fill: f,
                stroke: s,
                stroke_width: sw,
            }
        }
        // instances have no base rect props — patch is a no-op for them
        other => other.clone(),
    }
}

/// Strip an Animate-style copy suffix ("arm copy", "arm copy 2") back to the
/// original stem, so duplicating a copy keeps counting ("arm copy 2", …)
/// instead of stacking "copy copy".
fn strip_copy_suffix(name: &str) -> &str {
    if let Some(rest) = name.strip_suffix(" copy") {
        return rest;
    }
    if let Some(idx) = name.rfind(" copy ") {
        let suffix = &name[idx + " copy ".len()..];
        if !suffix.is_empty() && suffix.chars().all(|c| c.is_ascii_digit()) {
            return &name[..idx];
        }
    }
    name
}
