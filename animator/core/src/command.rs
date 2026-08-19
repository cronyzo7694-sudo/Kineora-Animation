use std::collections::BTreeMap;

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

/// CMD-MOVE — move selection at the current frame via per-keyframe override.
pub struct MoveSelection {
    pub ids: Vec<NodeId>,
    pub dx: f64,
    pub dy: f64,
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    /// id → (before, after) for exact revert.
    before_after: Vec<(NodeId, Transform, Transform)>,
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
            before_after: Vec::new(),
        }
    }
}

impl Command for MoveSelection {
    fn label(&self) -> String {
        "Move selection".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        // capture effective transforms first (before mutation)
        let before: Vec<(NodeId, Transform)> = self
            .ids
            .iter()
            .filter_map(|id| {
                effective_override(doc, self.scene, self.layer, self.frame, *id)
                    .or_else(|| doc.nodes.get(id).map(|n| n.transform().clone()))
                    .map(|t| (*id, t))
            })
            .collect();

        if doc
            .ensure_keyframe(self.scene, self.layer, self.frame)
            .is_none()
        {
            return;
        }

        let mut after_map: BTreeMap<NodeId, Transform> = BTreeMap::new();
        for (id, t) in &before {
            let mut nt = t.clone();
            nt.x += self.dx;
            nt.y += self.dy;
            after_map.insert(*id, nt.clone());
            self.before_after.push((*id, t.clone(), nt));
        }
        if let Some(Frame::Keyframe { transforms, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            for (id, t) in after_map {
                transforms.insert(id, t);
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(Frame::Keyframe { transforms, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            for (id, before, _) in &self.before_after {
                transforms.insert(*id, before.clone());
            }
        }
    }
}

/// Effective override at a frame (before apply), or the node base transform.
fn effective_override(
    doc: &Document,
    scene: usize,
    layer: usize,
    frame: u32,
    id: NodeId,
) -> Option<Transform> {
    let layer_ = doc.layer(scene, layer)?;
    let entry = layer_.keyframes.range(..=frame).next_back()?;
    match entry.1 {
        Frame::Keyframe {
            transforms,
            content,
        } if content.contains(&id) => transforms
            .get(&id)
            .cloned()
            .or_else(|| doc.nodes.get(&id).map(|n| n.transform().clone())),
        _ => None,
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
