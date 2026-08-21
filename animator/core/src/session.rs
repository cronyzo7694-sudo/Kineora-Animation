use std::path::Path;

use crate::command::{
    ClearKeyframe, ConvertToBlankKeyframes, ConvertToKeyframes, ConvertToSymbol, CreateLayer,
    CreateSymbol, DeleteFrames, DeleteLayer, DeleteSymbol, DrawRect, DuplicateFrames,
    DuplicateKeyframe, History, InsertBlankKeyframe, InsertFrames, InsertKeyframe, MoveKeyframe,
    MoveKeyframeSequence, MoveSelection, PasteFrames, PlaceSymbol, RemoveClassicTween,
    RemoveFrames, RenameLayer, RenameSymbol, ReorderLayer, ResizeSpan, ReverseFrames,
    SetClassicTween, SetDocumentSettings, SetFrameLabel, SetInstanceLoop, SetLayerLocked,
    SetLayerVisible, SetNodeProps, SwapInstance, TransformSelection,
};
use crate::eval::{
    evaluate, hit_test, hits_in_rect, node_bounds, node_layer_index, node_transform_in_scene,
    RectItem,
};
use crate::export::{export_svg, export_svg_scaled};
use crate::id::{LayerId, NodeId, SymbolId};
use crate::model::{
    Document, Frame, Layer, LoopMode, Node, Settings, Symbol, SymbolType, Transform,
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

    pub fn set_playhead(&mut self, frame: u32) {
        self.playhead = frame.max(1);
        self.log(&format!("playhead:{frame}"));
    }

    pub fn draw_rect(&mut self, x: f64, y: f64, w: f64, h: f64, fill: &str) -> NodeId {
        // Draw-target contract (REQ-DRW-003): a hidden or locked layer is not a
        // valid draw target. Blocked → no command, no node (returns NodeId(0)).
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if !l.visible || l.locked {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.selection = vec![id];
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
                if !layer.visible || layer.locked {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("move:selection({dx},{dy}) @{}", self.playhead));
    }

    /// F6 — insert a keyframe copying the previous content. Returns true when a
    /// keyframe was created; false when it was a no-op. No-op cases (no command,
    /// no undo entry): the layer is locked (Part 20.2 "not editable") or the
    /// frame is already a CONTENT keyframe (F-07-08 M.1 "F6 at a keyframe →
    /// no-op"). F6 on a BLANK keyframe converts it to a content keyframe
    /// copying the pre-blank content (F-07-08 M.2).
    pub fn insert_keyframe(&mut self, frame: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.set_playhead(frame);
        self.log(&format!("keyframe:insert@{frame}"));
        true
    }

    /// F7 — insert a BLANK keyframe at `frame` (breaks the hold → empty
    /// content). Blocked on a locked layer ([OUR DESIGN DECISION]: frame ops on
    /// a locked layer are disabled, matching Part 20.2 "protect finished art";
    /// hidden layers still allow frame editing). Undoable.
    pub fn insert_blank_keyframe(&mut self, frame: u32) -> bool {
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if l.locked {
                self.log("blank-keyframe:blocked(locked)");
                return false;
            }
        }
        let cmd = InsertBlankKeyframe::new(self.active_scene, self.active_layer, frame);
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("blank-keyframe@{frame}"));
        true
    }

    /// Shift+F6 — remove the keyframe STATUS at `frame` (revert to hold).
    /// No-op (no command) when there is no keyframe there or the layer is
    /// locked. Undoable.
    pub fn clear_keyframe(&mut self, frame: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("insert-frame@{frame}"));
        true
    }

    /// Shift+F5 — delete one frame at `frame` on the ACTIVE layer: a keyframe
    /// there is removed, and every keyframe AFTER `frame` shifts left by one
    /// (timeline shortens). No-op (no command) when nothing is affected or the
    /// layer is locked.
    pub fn delete_frame(&mut self, frame: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("delete-frame@{frame}"));
        true
    }

    /// Drag a keyframe in time (Part 07 §7.4.9): relocate the record on `layer`
    /// (which may be any visible layer, not just the active one). No-op when
    /// from==to, no keyframe at `from`, a keyframe already at `to` (collision —
    /// overwrite prompt is a later unit), `to < 1`, or the layer is locked.
    pub fn move_keyframe(&mut self, layer: usize, from: u32, to: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("move-keyframe:{from}→{to}"));
        true
    }

    /// Alt/Option-drag a keyframe to DUPLICATE it (F-07-12 E1): deep-copy the
    /// record at `from` into `to` on `layer`. No-op on the same guards as move
    /// (collision blocked; the source must exist; `to` must be free).
    pub fn duplicate_keyframe(&mut self, layer: usize, from: u32, to: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("duplicate-keyframe:{from}→{to}"));
        true
    }

    // ——— Frame range selection + clipboard / sequence ops (Part 07 §7.4.6–10, F-07-12/13) ———

    /// COPY FRAMES: snapshot the keyframes within [start,end] into the frame
    /// clipboard (session state — no command, no document change). Read-only,
    /// so it is allowed on locked layers.
    pub fn copy_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("paste-frames@{at}"));
        true
    }

    /// REMOVE FRAMES: delete the keyframes within [start,end] leaving a GAP
    /// (later keyframes stay put). One undoable command. Locked layer blocked.
    pub fn remove_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("remove-frames:{start}..{end}"));
        true
    }

    /// REVERSE FRAMES: reverse the keyframe record order within [start,end]
    /// (content plays backwards). One undoable command. Locked layer blocked;
    /// <2 keyframes = no-op (F-07-13 M.1).
    pub fn reverse_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("reverse-frames:{start}..{end}"));
        true
    }

    // ——— Classic tween (Part 09.2, MOD-TWEEN) ———

    /// Create/update a classic tween span between two CONTENT keyframes holding
    /// the SAME non-empty object (Part 09.2.1). One undoable command. Blocked on
    /// locked layers; no-op when start ≥ end or the keyframes aren't the same
    /// object.
    pub fn set_classic_tween(&mut self, layer: usize, start: u32, end: u32, ease: f64) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("tween:{start}→{end} ease={ease}"));
        true
    }

    /// Remove a classic tween span (F-07-13 "Remove Tween"). One undoable
    /// command. Blocked on locked layers; no-op when no tween starts there.
    pub fn remove_classic_tween(&mut self, layer: usize, start: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("seq-move:{from}→{to}"));
        true
    }

    /// Drag the edge of a held span (Part 07 §7.4.11 / F-15-05): shift every
    /// keyframe after `anchor` by `delta`, extending (delta>0) or shortening
    /// (delta<0) the hold of the keyframe at `anchor`. The exposure is clamped
    /// to a minimum of 1 frame; zero-delta / no-next-keyframe / locked = no-op.
    pub fn resize_span(&mut self, layer: usize, anchor: u32, delta: i64) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("resize-span:{anchor} {d:+}"));
        true
    }

    /// Duplicate the selected frame range (Part 07 §7.4.8): copies the keyframes
    /// in [start,end] and inserts them immediately after, shifting later frames.
    /// One undoable command. No-op when the range holds no keyframes.
    pub fn duplicate_frames(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("duplicate-frames:{start}..{end}"));
        true
    }

    /// Convert held frames in [start,end] into keyframes (Part 07 §7.4.12),
    /// copying the hold's content + transforms so playback is unchanged.
    /// One undoable command.
    pub fn convert_to_keyframes(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("convert-keys:{start}..{end}"));
        true
    }

    /// Convert frames in [start,end] into BLANK keyframes (Part 07 §7.4.12).
    /// One undoable command.
    pub fn convert_to_blank_keyframes(&mut self, layer: usize, start: u32, end: u32) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("convert-blank:{start}..{end}"));
        true
    }

    /// Set or clear the label on a CONTENT keyframe (Part 07 §7.2 / Part 33.8).
    /// `label` = None or empty → clear. No-op when the frame isn't a content
    /// keyframe or the layer is locked.
    pub fn set_frame_label(&mut self, layer: usize, frame: u32, label: Option<&str>) -> bool {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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

        // ensure a keyframe at the playhead to host the instance
        if self
            .doc
            .ensure_keyframe(self.active_scene, self.active_layer, self.playhead)
            .is_none()
        {
            return NodeId(0);
        }

        let symbol_id = self.doc.alloc_symbol_id();
        let instance_id = self.doc.alloc_node_id();
        let node_ids = self.selection.clone();

        let inner_layer = Layer {
            id: LayerId(1),
            name: "Layer 1".into(),
            keyframes: std::collections::BTreeMap::from([(
                1u32,
                Frame::keyframe(node_ids.clone()),
            )]),
            tweens: std::collections::BTreeMap::new(),
            visible: true,
            locked: false,
        };
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.selection = vec![instance_id];
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
        let layer = Layer {
            id: LayerId(1),
            name: "Layer 1".into(),
            keyframes: std::collections::BTreeMap::from([(1u32, Frame::keyframe(vec![]))]),
            tweens: std::collections::BTreeMap::new(),
            visible: true,
            locked: false,
        };
        let symbol = Symbol {
            id,
            name: name.to_string(),
            symbol_type,
            registration: Transform::default(),
            timeline: vec![layer],
        };
        let cmd = CreateSymbol { symbol };
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.log(&format!("new-symbol:{id:?}"));
        id
    }

    /// Place an instance of `symbol_id` at (x, y) on the current frame
    /// (drag library → stage, Part 12 §12.2.11). Returns the instance id.
    pub fn place_symbol(&mut self, symbol_id: SymbolId, x: f64, y: f64) -> NodeId {
        if self.doc.symbol(symbol_id).is_none() {
            return NodeId(0);
        }
        if let Some(l) = self.doc.layer(self.active_scene, self.active_layer) {
            if !l.visible || l.locked {
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.selection = vec![instance_id];
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
        // prune selection of any now-removed instance nodes
        self.prune_selection_existence();
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        let layer = Layer {
            id: self.doc.alloc_layer_id(),
            name,
            keyframes: std::collections::BTreeMap::from([(1u32, Frame::keyframe(vec![]))]),
            tweens: std::collections::BTreeMap::new(),
            visible: true,
            locked: false,
        };
        let cmd = CreateLayer {
            scene,
            index,
            layer,
        };
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.active_layer = index;
        self.log(&format!("layer:create@{index}"));
        Some(index)
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
        let cmd = DeleteLayer::new(scene, index, layer);
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.sanitize_indices();
        self.prune_selection_existence();
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        let cmd = SetLayerVisible {
            scene: self.active_scene,
            layer_id: l.id,
            before: l.visible,
            after: visible,
        };
        self.history.execute(&mut self.doc, Box::new(cmd));
        if !visible {
            self.prune_selection_by_layer_state();
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
        let cmd = SetLayerLocked {
            scene: self.active_scene,
            layer_id: l.id,
            before: l.locked,
            after: locked,
        };
        self.history.execute(&mut self.doc, Box::new(cmd));
        if locked {
            self.prune_selection_by_layer_state();
        }
        self.log(&format!("layer:locked@{index}={locked}"));
        true
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
        let mut after = before.clone();
        let moved = after.remove(from);
        after.insert(to, moved);
        let active_id = sc.layers.get(self.active_layer).map(|l| l.id);
        let cmd = ReorderLayer {
            scene,
            before,
            after,
        };
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
        self.history.execute(&mut self.doc, Box::new(cmd));
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
                    if layer.visible && !layer.locked {
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
        let ok = self.history.undo(&mut self.doc);
        self.log(if ok { "undo" } else { "undo:(empty)" });
        if ok {
            // indices/selection may reference entities the command removed
            self.sanitize_indices();
            self.prune_selection_existence();
        }
        ok
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
        let ok = self.history.redo(&mut self.doc);
        self.log(if ok { "redo" } else { "redo:(empty)" });
        if ok {
            self.sanitize_indices();
            self.prune_selection_existence();
        }
        ok
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
