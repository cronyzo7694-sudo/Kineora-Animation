use std::path::Path;

use crate::command::{
    CreateLayer, DeleteLayer, DrawRect, History, InsertKeyframe, MoveSelection, RenameLayer,
    ReorderLayer, SetDocumentSettings, SetLayerLocked, SetLayerVisible, SetNodeProps,
    TransformSelection,
};
use crate::eval::{evaluate, hit_test, hits_in_rect, node_transform_in_scene, RectItem};
use crate::export::export_svg;
use crate::id::{LayerId, NodeId};
use crate::model::{Document, Frame, Layer, Node, Settings, Transform};
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
}

impl Session {
    pub fn new(settings: Settings) -> Self {
        let mut s = Self {
            doc: Document::new(settings),
            history: History::new(),
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:new".into()],
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

    pub fn insert_keyframe(&mut self, frame: u32) {
        let cmd = InsertKeyframe::new(self.active_scene, self.active_layer, frame);
        self.history.execute(&mut self.doc, Box::new(cmd));
        self.set_playhead(frame);
        self.log(&format!("keyframe:insert@{frame}"));
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

    pub fn save(&self, path: &Path) -> Result<(), String> {
        persist::save(&self.doc, path)
    }

    pub fn load(path: &Path) -> Result<Self, String> {
        let doc = persist::load(path)?;
        Ok(Self {
            doc,
            history: History::new(),
            selection: Vec::new(),
            playhead: 1,
            active_scene: 0,
            active_layer: 0,
            event_log: vec!["session:loaded".into()],
        })
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
    }
}
