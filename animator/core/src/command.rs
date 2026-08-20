use crate::eval::node_transform_at;
use crate::id::NodeId;
use crate::model::{Document, Frame, Node, Transform};

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
pub struct MoveSelection {
    pub ids: Vec<NodeId>,
    pub dx: f64,
    pub dy: f64,
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    /// Exact frame record BEFORE apply (for exact revert incl. keyframe creation).
    prev_frame: Option<Frame>,
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
            prev_frame: None,
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
        // capture interpolated/held "before" transforms (PHASE F correctness)
        let befores: Vec<(NodeId, Transform)> = self
            .ids
            .iter()
            .filter_map(|id| {
                node_transform_at(doc, self.scene, self.layer, self.frame, *id).map(|t| (*id, t))
            })
            .collect();
        if befores.is_empty() {
            return; // nothing selectable at this frame — no-op (no undo entry)
        }

        // remember frame existence for exact revert
        self.prev_frame = doc
            .layer(self.scene, self.layer)
            .and_then(|l| l.keyframes.get(&self.frame).cloned());

        // auto-key: ensure a keyframe at this frame (F6 copy semantics) so the
        // override has somewhere to live
        if doc
            .ensure_keyframe(self.scene, self.layer, self.frame)
            .is_none()
        {
            return;
        }

        if let Some(Frame::Keyframe { transforms, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            for (id, before) in &befores {
                let mut after = before.clone();
                after.x += self.dx;
                after.y += self.dy;
                transforms.insert(*id, after);
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        match &self.prev_frame {
            Some(prev) => {
                l.keyframes.insert(self.frame, prev.clone());
            }
            None => {
                // the keyframe was created by this command → remove it so the
                // frame reverts to its previous hold (exact undo)
                l.keyframes.remove(&self.frame);
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
        let prev_content = doc.content_at(self.scene, self.layer, self.frame);
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
