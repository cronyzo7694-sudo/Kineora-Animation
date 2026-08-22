//! SYS-03 / SYS-06 document-mutation commands that are not timeline/symbol
//! ops: object clipboard paste, delete, and arrange (z-order).
//!
//! Transform rotate/flip/remove and align reuse `TransformSelection` (they
//! write per-keyframe transform overrides). Clipboard COPY is session state
//! (not a command) — same contract as the frame clipboard (F-07-12).

use std::collections::BTreeMap;

use crate::command::Command;
use crate::eval::node_layer_index;
use crate::id::NodeId;
use crate::model::{Document, Frame, Node};

/// One clipboard item: a full node snapshot with the EVALUATED transform
/// baked in (Blueprint 1.2.2: "Clipboard stores full object JSON, not pixels").
#[derive(Clone, Debug)]
pub struct ObjectClip {
    pub node: Node,
}

/// AMB-SYS03-001 PROVISIONAL — Blueprint 1.2.2 says Duplicate is
/// "copy+offset" but is silent on the delta. 10 document units is the
/// conventional editor nudge. Flagged, never silently finalized.
pub const DUPLICATE_OFFSET: f64 = 10.0;

/// Paste placement (Blueprint 1.2.2).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PasteMode {
    /// Same coordinates as the clipboard snapshot.
    InPlace,
    /// Translate the clipboard AABB so its center lands on the stage center.
    Center,
}

/// Z-order op (Blueprint 1.2.5 Arrange). Content-vec order is back → front
/// (DrawRect pushes = frontmost).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ArrangeOp {
    Front,
    Forward,
    Back,
    Backward,
}

/// Align op (Part 24.1 — the 6).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AlignOp {
    Left,
    CenterH,
    Right,
    Top,
    MiddleV,
    Bottom,
}

/// Alignment reference space (Part 24.0).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AlignSpace {
    Stage,
    Selection,
}

/// CMD-DELETE-SELECTION — remove the listed nodes from the CURRENT frame
/// only (other keyframes that still reference them keep the node). Nodes
/// that become unreferenced are dropped from `doc.nodes` (like DeleteLayer).
pub struct DeleteSelection {
    pub scene: usize,
    pub frame: u32,
    pub ids: Vec<NodeId>,
    prev_frames: BTreeMap<usize, Option<Frame>>,
    removed_nodes: BTreeMap<NodeId, Node>,
}

impl DeleteSelection {
    pub fn new(scene: usize, frame: u32, ids: Vec<NodeId>) -> Self {
        Self {
            scene,
            frame,
            ids,
            prev_frames: BTreeMap::new(),
            removed_nodes: BTreeMap::new(),
        }
    }
}

impl Command for DeleteSelection {
    fn label(&self) -> String {
        "Delete".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.ids.is_empty() {
            return;
        }
        // group by the layer that currently holds each id
        let mut per_layer: BTreeMap<usize, Vec<NodeId>> = BTreeMap::new();
        for id in &self.ids {
            if let Some(lidx) = node_layer_index(doc, self.scene, self.frame, *id) {
                per_layer.entry(lidx).or_default().push(*id);
            }
        }
        for (lidx, ids) in &per_layer {
            self.prev_frames.insert(
                *lidx,
                doc.layer(self.scene, *lidx)
                    .and_then(|l| l.keyframes.get(&self.frame).cloned()),
            );
            if doc.ensure_keyframe(self.scene, *lidx, self.frame).is_none() {
                continue;
            }
            if let Some(Frame::Keyframe {
                content,
                transforms,
                ..
            }) = doc
                .layer_mut(self.scene, *lidx)
                .and_then(|l| l.keyframes.get_mut(&self.frame))
            {
                content.retain(|n| !ids.contains(n));
                for id in ids {
                    transforms.remove(id);
                }
            }
        }
        let still = doc.referenced_node_ids();
        for id in &self.ids {
            if !still.contains(id) {
                if let Some(n) = doc.nodes.remove(id) {
                    self.removed_nodes.insert(*id, n);
                }
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for (id, n) in &self.removed_nodes {
            doc.nodes.insert(*id, n.clone());
        }
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

/// CMD-PASTE-OBJECTS — insert already-reassigned node clones onto the
/// active layer at the playhead (one command).
pub struct PasteObjects {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub items: Vec<Node>,
    prev_frame: Option<Option<Frame>>,
}

impl PasteObjects {
    pub fn new(scene: usize, layer: usize, frame: u32, items: Vec<Node>) -> Self {
        Self {
            scene,
            layer,
            frame,
            items,
            prev_frame: None,
        }
    }
}

impl Command for PasteObjects {
    fn label(&self) -> String {
        "Paste".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.items.is_empty() {
            return;
        }
        self.prev_frame = Some(
            doc.layer(self.scene, self.layer)
                .and_then(|l| l.keyframes.get(&self.frame).cloned()),
        );
        for n in &self.items {
            doc.nodes.insert(n.id(), n.clone());
        }
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
            for n in &self.items {
                content.push(n.id());
            }
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for n in &self.items {
            doc.nodes.remove(&n.id());
        }
        if let (Some(prev), Some(l)) = (
            self.prev_frame.clone(),
            doc.layer_mut(self.scene, self.layer),
        ) {
            match prev {
                Some(p) => {
                    l.keyframes.insert(self.frame, p);
                }
                None => {
                    l.keyframes.remove(&self.frame);
                }
            }
        }
    }
}

/// CMD-ARRANGE — reorder selected ids inside each affected layer's current
/// keyframe content (back → front). Auto-keys the frame so a held frame
/// gets an explicit record (same as transform).
pub struct ArrangeSelection {
    pub scene: usize,
    pub frame: u32,
    pub ids: Vec<NodeId>,
    pub op: ArrangeOp,
    prev_frames: BTreeMap<usize, Option<Frame>>,
}

impl ArrangeSelection {
    pub fn new(scene: usize, frame: u32, ids: Vec<NodeId>, op: ArrangeOp) -> Self {
        Self {
            scene,
            frame,
            ids,
            op,
            prev_frames: BTreeMap::new(),
        }
    }
}

fn arrange_content(content: &mut Vec<NodeId>, selected: &[NodeId], op: ArrangeOp) {
    if selected.is_empty() || content.len() < 2 {
        return;
    }
    let is_sel = |id: &NodeId| selected.contains(id);
    match op {
        ArrangeOp::Front => {
            let kept: Vec<NodeId> = content.iter().copied().filter(|id| !is_sel(id)).collect();
            let moved: Vec<NodeId> = content.iter().copied().filter(is_sel).collect();
            *content = kept;
            content.extend(moved);
        }
        ArrangeOp::Back => {
            let moved: Vec<NodeId> = content.iter().copied().filter(is_sel).collect();
            let kept: Vec<NodeId> = content.iter().copied().filter(|id| !is_sel(id)).collect();
            *content = moved;
            content.extend(kept);
        }
        ArrangeOp::Forward => {
            // walk back→front; swap each selected with the next unselected
            let mut i = content.len().saturating_sub(1);
            while i > 0 {
                if is_sel(&content[i - 1]) && !is_sel(&content[i]) {
                    content.swap(i - 1, i);
                }
                i -= 1;
            }
        }
        ArrangeOp::Backward => {
            // walk front→back; swap each selected with the previous unselected
            for i in 0..content.len().saturating_sub(1) {
                if is_sel(&content[i + 1]) && !is_sel(&content[i]) {
                    content.swap(i, i + 1);
                }
            }
        }
    }
}

impl Command for ArrangeSelection {
    fn label(&self) -> String {
        match self.op {
            ArrangeOp::Front => "Bring to Front",
            ArrangeOp::Forward => "Bring Forward",
            ArrangeOp::Back => "Send to Back",
            ArrangeOp::Backward => "Send Backward",
        }
        .into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.ids.is_empty() {
            return;
        }
        let mut per_layer: BTreeMap<usize, Vec<NodeId>> = BTreeMap::new();
        for id in &self.ids {
            if let Some(lidx) = node_layer_index(doc, self.scene, self.frame, *id) {
                per_layer.entry(lidx).or_default().push(*id);
            }
        }
        for (lidx, ids) in &per_layer {
            self.prev_frames.insert(
                *lidx,
                doc.layer(self.scene, *lidx)
                    .and_then(|l| l.keyframes.get(&self.frame).cloned()),
            );
            if doc.ensure_keyframe(self.scene, *lidx, self.frame).is_none() {
                continue;
            }
            if let Some(Frame::Keyframe { content, .. }) = doc
                .layer_mut(self.scene, *lidx)
                .and_then(|l| l.keyframes.get_mut(&self.frame))
            {
                arrange_content(content, ids, self.op);
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
