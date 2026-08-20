use std::collections::{BTreeMap, HashMap};

use crate::eval::{node_layer_index, node_transform_at};
use crate::id::{LayerId, NodeId};
use crate::model::{Document, Frame, Layer, Node, Settings, Transform};

/// All document mutations are Commands (REQ-SYS-002). Selection/view state is
/// not commanded; it is captured/restored by the Session around execute/undo.
pub trait Command {
    fn label(&self) -> String;
    fn apply(&mut self, doc: &mut Document);
    fn revert(&mut self, doc: &mut Document);
}

#[derive(Default)]
pub struct History {
    undo: Vec<Box<dyn Command>>,
    redo: Vec<Box<dyn Command>>,
}

impl History {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn execute(&mut self, doc: &mut Document, mut cmd: Box<dyn Command>) {
        cmd.apply(doc);
        self.undo.push(cmd);
        self.redo.clear(); // redo invalidation (Phase-3 Part 12)
    }

    pub fn undo(&mut self, doc: &mut Document) -> bool {
        let Some(mut c) = self.undo.pop() else {
            return false;
        };
        c.revert(doc);
        self.redo.push(c);
        true
    }

    pub fn redo(&mut self, doc: &mut Document) -> bool {
        let Some(mut c) = self.redo.pop() else {
            return false;
        };
        c.apply(doc);
        self.undo.push(c);
        true
    }

    pub fn undo_len(&self) -> usize {
        self.undo.len()
    }
    pub fn redo_len(&self) -> usize {
        self.redo.len()
    }
    pub fn undo_labels(&self) -> Vec<String> {
        self.undo.iter().map(|c| c.label()).collect()
    }
}

/// CMD-DRAW — draw a rectangle into the current frame's keyframe.
pub struct DrawRect {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub node: Node,
}

impl Command for DrawRect {
    fn label(&self) -> String {
        "Draw rectangle".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let id = self.node.id();
        doc.nodes.insert(id, self.node.clone());
        if doc
            .ensure_keyframe(self.scene, self.layer, self.frame)
            .is_none()
        {
            return;
        }
        if let Some(Frame::Keyframe { content, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            content.push(id);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let id = self.node.id();
        if let Some(Frame::Keyframe { content, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            content.retain(|n| *n != id);
        }
        doc.nodes.remove(&id);
    }
}

/// CMD-MOVE — move a selection at the current frame via a per-keyframe
/// transform override. "before" is the node's INTERPOLATED/HELD transform at
/// that frame (not the nearest-keyframe override), so moving an animated object
/// lands exactly where the preview showed it.
///
/// Layer-aware: a selection may span layers (marquee / Select All), so each
/// node's OWN layer is resolved and the override written there (not blindly
/// into the active layer). Undo is bit-exact via per-layer frame snapshots.
pub struct MoveSelection {
    pub ids: Vec<NodeId>,
    pub dx: f64,
    pub dy: f64,
    pub scene: usize,
    /// Active layer at command time (informational; actual target is resolved
    /// per node via `node_layer_index`).
    pub layer: usize,
    pub frame: u32,
    /// Exact frame records BEFORE apply, keyed by layer index (for exact
    /// revert incl. auto-created keyframes).
    prev_frames: BTreeMap<usize, Option<Frame>>,
}

impl MoveSelection {
    pub fn new(ids: Vec<NodeId>, dx: f64, dy: f64, scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            ids,
            dx,
            dy,
            scene,
            layer,
            frame,
            prev_frames: BTreeMap::new(),
        }
    }
}

impl Command for MoveSelection {
    fn label(&self) -> String {
        "Move selection".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.ids.is_empty() {
            return;
        }
        // resolve (node → its layer) and capture interpolated/held "before"
        // transforms (PHASE F correctness) grouped by layer.
        let mut per_layer: BTreeMap<usize, Vec<(NodeId, Transform)>> = BTreeMap::new();
        for id in &self.ids {
            let Some(lidx) = node_layer_index(doc, self.scene, self.frame, *id) else {
                continue;
            };
            let Some(before) = node_transform_at(doc, self.scene, lidx, self.frame, *id) else {
                continue;
            };
            per_layer.entry(lidx).or_default().push((*id, before));
        }
        if per_layer.is_empty() {
            return; // nothing selectable at this frame — no-op (no undo entry)
        }

        for (lidx, befores) in &per_layer {
            // remember frame existence for exact revert
            self.prev_frames.insert(
                *lidx,
                doc.layer(self.scene, *lidx)
                    .and_then(|l| l.keyframes.get(&self.frame).cloned()),
            );
            // auto-key: ensure a keyframe at this frame (F6 copy semantics)
            if doc.ensure_keyframe(self.scene, *lidx, self.frame).is_none() {
                continue;
            }
            if let Some(Frame::Keyframe { transforms, .. }) = doc
                .layer_mut(self.scene, *lidx)
                .and_then(|l| l.keyframes.get_mut(&self.frame))
            {
                for (id, before) in befores {
                    let mut after = before.clone();
                    after.x += self.dx;
                    after.y += self.dy;
                    transforms.insert(*id, after);
                }
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for (lidx, prev) in &self.prev_frames {
            let Some(l) = doc.layer_mut(self.scene, *lidx) else {
                continue;
            };
            match prev {
                Some(p) => {
                    l.keyframes.insert(self.frame, p.clone());
                }
                None => {
                    // keyframe was created by this command → remove it so the
                    // frame reverts to its previous hold (exact undo)
                    l.keyframes.remove(&self.frame);
                }
            }
        }
    }
}

/// CMD-TRANSFORM — apply absolute transforms to a selection at the current
/// frame via per-keyframe overrides. One command per completed gesture
/// (scale / rotate / translate all fold through here). Layer-aware (see
/// MoveSelection); undo is bit-exact via per-layer frame snapshots.
pub struct TransformSelection {
    pub after: Vec<(NodeId, Transform)>,
    pub scene: usize,
    /// Active layer at command time (informational; target resolved per node).
    pub layer: usize,
    pub frame: u32,
    prev_frames: BTreeMap<usize, Option<Frame>>,
}

impl TransformSelection {
    pub fn new(after: Vec<(NodeId, Transform)>, scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            after,
            scene,
            layer,
            frame,
            prev_frames: BTreeMap::new(),
        }
    }
}

impl Command for TransformSelection {
    fn label(&self) -> String {
        "Transform selection".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.after.is_empty() {
            return;
        }
        // group absolute transforms by the node's OWN layer
        let mut per_layer: BTreeMap<usize, Vec<(NodeId, Transform)>> = BTreeMap::new();
        for (id, t) in &self.after {
            let Some(lidx) = node_layer_index(doc, self.scene, self.frame, *id) else {
                continue;
            };
            per_layer.entry(lidx).or_default().push((*id, t.clone()));
        }
        for (lidx, entries) in &per_layer {
            self.prev_frames.insert(
                *lidx,
                doc.layer(self.scene, *lidx)
                    .and_then(|l| l.keyframes.get(&self.frame).cloned()),
            );
            if doc.ensure_keyframe(self.scene, *lidx, self.frame).is_none() {
                continue;
            }
            if let Some(Frame::Keyframe { transforms, .. }) = doc
                .layer_mut(self.scene, *lidx)
                .and_then(|l| l.keyframes.get_mut(&self.frame))
            {
                for (id, t) in entries {
                    transforms.insert(*id, t.clone());
                }
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for (lidx, prev) in &self.prev_frames {
            let Some(l) = doc.layer_mut(self.scene, *lidx) else {
                continue;
            };
            match prev {
                Some(p) => {
                    l.keyframes.insert(self.frame, p.clone());
                }
                None => {
                    l.keyframes.remove(&self.frame);
                }
            }
        }
    }
}

/// CMD-INSERT-KEY — copy previous content into a new keyframe (F6).
pub struct InsertKeyframe {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    prev_entry: Option<Frame>,
    existed: bool,
}

impl InsertKeyframe {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev_entry: None,
            existed: false,
        }
    }
}

impl Command for InsertKeyframe {
    fn label(&self) -> String {
        "Insert keyframe".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(layer_) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_entry = layer_.keyframes.get(&self.frame).cloned();
        self.existed = self.prev_entry.is_some();
        // F6 copies the PRE-BLANK content (F-07-08 M.2), not the blank's empty
        // hold — a blank keyframe holds nothing, so skip it when copying.
        let prev_content = doc.content_before_for_keyframe(self.scene, self.layer, self.frame);
        if let Some(l) = doc.layer_mut(self.scene, self.layer) {
            l.keyframes
                .insert(self.frame, Frame::keyframe(prev_content));
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        match (&self.prev_entry, self.existed) {
            (Some(prev), true) => {
                l.keyframes.insert(self.frame, prev.clone());
            }
            _ => {
                l.keyframes.remove(&self.frame);
            }
        }
    }
}

/// CMD-SET-PROPERTY — edit object BASE properties (width/height/fill/stroke/
/// stroke-width). These live on the Node record (not per-keyframe), so the edit
/// applies across all frames (slice-1 model: only transforms are per-keyframe).
/// `updates` = (id, before, after) full-node snapshots → undo is bit-exact.
pub struct SetNodeProps {
    pub updates: Vec<(NodeId, Node, Node)>,
}

impl Command for SetNodeProps {
    fn label(&self) -> String {
        "Edit object properties".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        for (id, _, after) in &self.updates {
            doc.nodes.insert(*id, after.clone());
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for (id, before, _) in &self.updates {
            doc.nodes.insert(*id, before.clone());
        }
    }
}

/// CMD-SET-DOC — edit document settings (stage size / fps / background).
pub struct SetDocumentSettings {
    pub before: Settings,
    pub after: Settings,
}

impl Command for SetDocumentSettings {
    fn label(&self) -> String {
        "Edit document settings".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        doc.settings = self.after.clone();
    }
    fn revert(&mut self, doc: &mut Document) {
        doc.settings = self.before.clone();
    }
}

/// CMD-INSERT-BLANK-KEY — F7: convert the current frame to an EMPTY keyframe
/// (breaks the hold; content disappears from here until the next keyframe).
/// Part 07 §7.4.3.
pub struct InsertBlankKeyframe {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    prev_entry: Option<Frame>,
}

impl InsertBlankKeyframe {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev_entry: None,
        }
    }
}

impl Command for InsertBlankKeyframe {
    fn label(&self) -> String {
        "Insert blank keyframe".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_entry = l.keyframes.get(&self.frame).cloned();
        if let Some(l) = doc.layer_mut(self.scene, self.layer) {
            l.keyframes.insert(self.frame, Frame::Blank);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        match &self.prev_entry {
            Some(prev) => {
                l.keyframes.insert(self.frame, prev.clone());
            }
            None => {
                l.keyframes.remove(&self.frame);
            }
        }
    }
}

/// CMD-CLEAR-KEY — Shift+F6: remove the keyframe STATUS (the frame reverts to
/// a held/static frame) but keep the timeline length. Part 07 §7.4.5.
/// Deleting the LAST remaining keyframe leaves the layer empty (Part 08 §8.4.2).
pub struct ClearKeyframe {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    prev_entry: Option<Frame>,
    existed: bool,
}

impl ClearKeyframe {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev_entry: None,
            existed: false,
        }
    }
}

impl Command for ClearKeyframe {
    fn label(&self) -> String {
        "Clear keyframe".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_entry = l.keyframes.get(&self.frame).cloned();
        self.existed = self.prev_entry.is_some();
        if self.existed {
            if let Some(l) = doc.layer_mut(self.scene, self.layer) {
                l.keyframes.remove(&self.frame);
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if !self.existed {
            return;
        }
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = &self.prev_entry {
            l.keyframes.insert(self.frame, prev.clone());
        }
    }
}

/// CMD-LAYER-ADD — insert a new layer above the active one (Part 20.1).
pub struct CreateLayer {
    pub scene: usize,
    pub index: usize,
    pub layer: Layer,
}

impl Command for CreateLayer {
    fn label(&self) -> String {
        "Add layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        let idx = self.index.min(sc.layers.len());
        sc.layers.insert(idx, self.layer.clone());
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        sc.layers.retain(|l| l.id != self.layer.id);
    }
}

/// CMD-LAYER-DEL — remove a layer + its frames. Nodes that become orphaned
/// (no longer referenced by ANY layer) are removed too and restored exactly on
/// undo (Part 20.1 "remove layer + its frames").
pub struct DeleteLayer {
    pub scene: usize,
    pub index: usize,
    pub layer: Layer,
    removed_nodes: BTreeMap<NodeId, Node>,
}

impl DeleteLayer {
    pub fn new(scene: usize, index: usize, layer: Layer) -> Self {
        Self {
            scene,
            index,
            layer,
            removed_nodes: BTreeMap::new(),
        }
    }
}

impl Command for DeleteLayer {
    fn label(&self) -> String {
        "Delete layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        sc.layers.retain(|l| l.id != self.layer.id);

        // gather this layer's node ids across all of its frames
        let layer_ids: std::collections::BTreeSet<NodeId> = self
            .layer
            .keyframes
            .values()
            .filter_map(|f| match f {
                Frame::Keyframe { content, .. } => Some(content.as_slice()),
                Frame::Blank => None,
            })
            .flatten()
            .copied()
            .collect();
        let still_referenced = doc.referenced_node_ids();
        for id in layer_ids {
            if !still_referenced.contains(&id) {
                if let Some(n) = doc.nodes.remove(&id) {
                    self.removed_nodes.insert(id, n);
                }
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for (id, n) in &self.removed_nodes {
            doc.nodes.insert(*id, n.clone());
        }
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        let idx = self.index.min(sc.layers.len());
        sc.layers.insert(idx, self.layer.clone());
    }
}

/// CMD-LAYER-RENAME — names are display-only; ids are stable (REQ-SYS-004).
pub struct RenameLayer {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: String,
    pub after: String,
}

impl Command for RenameLayer {
    fn label(&self) -> String {
        "Rename layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.name = self.after.clone();
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.name = self.before.clone();
        }
    }
}

/// CMD-LAYER-VISIBLE — eye toggle (hidden = not rendered/selectable/exported).
pub struct SetLayerVisible {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: bool,
    pub after: bool,
}

impl Command for SetLayerVisible {
    fn label(&self) -> String {
        "Show/hide layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.visible = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.visible = self.before;
        }
    }
}

/// CMD-LAYER-LOCKED — padlock toggle (locked = renders, not selectable/editable).
pub struct SetLayerLocked {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: bool,
    pub after: bool,
}

impl Command for SetLayerLocked {
    fn label(&self) -> String {
        "Lock/unlock layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.locked = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.locked = self.before;
        }
    }
}

/// CMD-LAYER-REORDER — change render order (layers[] index, bottom → top).
/// Stored as full id-order lists so undo/redo are exact regardless of indices.
pub struct ReorderLayer {
    pub scene: usize,
    pub before: Vec<LayerId>,
    pub after: Vec<LayerId>,
}

fn order_layers(layers: &mut [Layer], order: &[LayerId]) {
    let pos: HashMap<LayerId, usize> = order.iter().enumerate().map(|(i, id)| (*id, i)).collect();
    layers.sort_by_key(|l| pos.get(&l.id).copied().unwrap_or(usize::MAX));
}

impl Command for ReorderLayer {
    fn label(&self) -> String {
        "Reorder layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(sc) = doc.scenes.get_mut(self.scene) {
            order_layers(&mut sc.layers, &self.after);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(sc) = doc.scenes.get_mut(self.scene) {
            order_layers(&mut sc.layers, &self.before);
        }
    }
}
