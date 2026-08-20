use std::collections::{BTreeMap, HashMap};

use crate::eval::{node_layer_index, node_transform_at};
use crate::id::{LayerId, NodeId};
use crate::model::{ClassicTween, Document, Frame, Layer, Node, Settings, Transform};

/// Remove tweens whose start OR end keyframe is the removed frame `frame`.
fn drop_tweens_at(tweens: &mut BTreeMap<u32, ClassicTween>, frame: u32) {
    tweens.retain(|start, tw| *start != frame && tw.end != frame);
}

/// Shift tween start/end frames greater than `gt` by `delta` (follows the
/// keyframes they reference when F5/Shift+F5 shift the timeline).
fn shift_tweens(tweens: &mut BTreeMap<u32, ClassicTween>, gt: u32, delta: i64) {
    let mut out = BTreeMap::new();
    for (start, tw) in tweens.iter() {
        let mut s = *start;
        let mut e = tw.end;
        if s > gt {
            s = (s as i64 + delta) as u32;
        }
        if e > gt {
            e = (e as i64 + delta) as u32;
        }
        out.insert(
            s,
            ClassicTween {
                end: e,
                ease: tw.ease,
            },
        );
    }
    *tweens = out;
}

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
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl InsertBlankKeyframe {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev_entry: None,
            prev_tweens: None,
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
        self.prev_tweens = Some(l.tweens.clone());
        if let Some(l) = doc.layer_mut(self.scene, self.layer) {
            l.keyframes.insert(self.frame, Frame::Blank);
            drop_tweens_at(&mut l.tweens, self.frame);
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
        if let Some(tw) = &self.prev_tweens {
            l.tweens = tw.clone();
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
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl ClearKeyframe {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev_entry: None,
            existed: false,
            prev_tweens: None,
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
            self.prev_tweens = Some(l.tweens.clone());
            if let Some(l) = doc.layer_mut(self.scene, self.layer) {
                l.keyframes.remove(&self.frame);
                drop_tweens_at(&mut l.tweens, self.frame);
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
        if let Some(tw) = &self.prev_tweens {
            l.tweens = tw.clone();
        }
    }
}

/// CMD-INSERT-FRAME — F5: +1 held frame; every keyframe AFTER `frame` shifts
/// right by one, so the hold covering `frame` lasts one frame longer (Part 07
/// §7.4.1 / F-07-07). The last keyframe holds to infinity, so F5 at/after the
/// last keyframe shifts nothing (no-op, handled by the Session guard).
pub struct InsertFrames {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    prev: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl InsertFrames {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev: None,
            prev_tweens: None,
        }
    }
}

impl Command for InsertFrames {
    fn label(&self) -> String {
        "Insert frame".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());
        let moved: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k > self.frame)
            .collect();
        if moved.is_empty() {
            return;
        }
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        for k in moved.into_iter().rev() {
            // descending order avoids collision when shifting right
            if let Some(fr) = l.keyframes.remove(&k) {
                l.keyframes.insert(k + 1, fr);
            }
        }
        shift_tweens(&mut l.tweens, self.frame, 1);
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-DELETE-FRAME — Shift+F5: removes one frame — a keyframe at `frame` is
/// deleted (content collapses into the previous hold), and every keyframe
/// AFTER `frame` shifts LEFT by one, shortening the timeline (Part 07 §7.4.4).
pub struct DeleteFrames {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    prev: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl DeleteFrames {
    pub fn new(scene: usize, layer: usize, frame: u32) -> Self {
        Self {
            scene,
            layer,
            frame,
            prev: None,
            prev_tweens: None,
        }
    }
}

impl Command for DeleteFrames {
    fn label(&self) -> String {
        "Delete frame".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());
        let moved: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k > self.frame)
            .collect();
        if moved.is_empty() && !l.keyframes.contains_key(&self.frame) {
            return;
        }
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        l.keyframes.remove(&self.frame);
        for k in moved {
            // ascending order avoids collision when shifting left
            if let Some(fr) = l.keyframes.remove(&k) {
                l.keyframes.insert(k - 1, fr);
            }
        }
        drop_tweens_at(&mut l.tweens, self.frame);
        shift_tweens(&mut l.tweens, self.frame, -1);
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-MOVE-KEYFRAME — drag a keyframe in time (Part 07 §7.4.9): relocate the
/// record verbatim (content + transforms preserved). Colliding with an existing
/// keyframe is blocked by the Session guard (overwrite prompt is a later unit).
pub struct MoveKeyframe {
    pub scene: usize,
    pub layer: usize,
    pub from: u32,
    pub to: u32,
    prev: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl MoveKeyframe {
    pub fn new(scene: usize, layer: usize, from: u32, to: u32) -> Self {
        Self {
            scene,
            layer,
            from,
            to,
            prev: None,
            prev_tweens: None,
        }
    }
}

impl Command for MoveKeyframe {
    fn label(&self) -> String {
        "Move keyframe".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(fr) = l.keyframes.remove(&self.from) {
            l.keyframes.insert(self.to, fr);
        }
        // a tween STARTING at the moved keyframe follows it; a tween whose END
        // was moved away dies (broken → removed).
        let followed = l.tweens.get(&self.from).cloned();
        l.tweens.retain(|_start, tw| tw.end != self.from);
        if let Some(tw) = followed {
            l.tweens.remove(&self.from);
            l.tweens.insert(self.to, tw);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-DUPLICATE-KEYFRAME — Alt/Option-drag a keyframe to copy it (F-07-12 E1):
/// deep-copy the record at `from` into `to`. Collision blocked by the guard.
pub struct DuplicateKeyframe {
    pub scene: usize,
    pub layer: usize,
    pub from: u32,
    pub to: u32,
    prev: Option<BTreeMap<u32, Frame>>,
}

impl DuplicateKeyframe {
    pub fn new(scene: usize, layer: usize, from: u32, to: u32) -> Self {
        Self {
            scene,
            layer,
            from,
            to,
            prev: None,
        }
    }
}

impl Command for DuplicateKeyframe {
    fn label(&self) -> String {
        "Duplicate keyframe".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        let Some(source) = l.keyframes.get(&self.from).cloned() else {
            return;
        };
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        l.keyframes.insert(self.to, source);
    }
    fn revert(&mut self, doc: &mut Document) {
        if let (Some(prev), Some(l)) = (self.prev.clone(), doc.layer_mut(self.scene, self.layer)) {
            l.keyframes = prev;
        }
    }
}

/// CMD-REMOVE-FRAMES — remove the keyframes within [start,end] and LEAVE A GAP
/// (later keyframes stay put — Part 07 §7.4.6, distinct from Delete which
/// shifts left). One command; bit-exact revert via full-map snapshot.
pub struct RemoveFrames {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    prev: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl RemoveFrames {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            prev: None,
            prev_tweens: None,
        }
    }
}

impl Command for RemoveFrames {
    fn label(&self) -> String {
        "Remove frames".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());
        let victims: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k >= self.start && *k <= self.end)
            .collect();
        if victims.is_empty() {
            return;
        }
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        for k in victims {
            l.keyframes.remove(&k);
        }
        // tweens whose start or end keyframe was removed die with it
        l.tweens.retain(|s, tw| {
            !(*s >= self.start && *s <= self.end) && !(tw.end >= self.start && tw.end <= self.end)
        });
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-PASTE-FRAMES — insert clipboard records at `at`, preserving their
/// relative offsets (F-07-12 "pastes at the playhead"). Collisions OVERWRITE
/// ([OUR DESIGN DECISION]: the overwrite-vs-insert dialog is a later unit).
/// One command; bit-exact revert.
pub struct PasteFrames {
    pub scene: usize,
    pub layer: usize,
    pub at: u32,
    pub records: Vec<(u32, Frame)>,
    prev: Option<BTreeMap<u32, Frame>>,
}

impl PasteFrames {
    pub fn new(scene: usize, layer: usize, at: u32, records: Vec<(u32, Frame)>) -> Self {
        Self {
            scene,
            layer,
            at,
            records,
            prev: None,
        }
    }
}

impl Command for PasteFrames {
    fn label(&self) -> String {
        "Paste frames".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.records.is_empty() {
            return;
        }
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        let min = self.records.iter().map(|(f, _)| *f).min().unwrap_or(1);
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        for (f, rec) in &self.records {
            let target = self.at + (*f - min);
            l.keyframes.insert(target, rec.clone());
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let (Some(prev), Some(l)) = (self.prev.clone(), doc.layer_mut(self.scene, self.layer)) {
            l.keyframes = prev;
        }
    }
}

/// CMD-REVERSE-FRAMES — reverse the ORDER of the keyframe records within
/// [start,end] (content plays backwards, Part 07 §7.4.10 / F-07-13 E1). The
/// frame positions stay; the records swap. One command; bit-exact revert.
pub struct ReverseFrames {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    prev: Option<BTreeMap<u32, Frame>>,
}

impl ReverseFrames {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            prev: None,
        }
    }
}

impl Command for ReverseFrames {
    fn label(&self) -> String {
        "Reverse frames".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = Some(l.keyframes.clone());
        let mut positions: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k >= self.start && *k <= self.end)
            .collect();
        positions.sort_unstable();
        if positions.len() < 2 {
            return; // single keyframe reverse = no-op (F-07-13 M.1)
        }
        let records: Vec<Frame> = positions
            .iter()
            .filter_map(|p| l.keyframes.get(p).cloned())
            .collect();
        let reversed: Vec<Frame> = records.into_iter().rev().collect();
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        for (i, p) in positions.into_iter().enumerate() {
            l.keyframes.insert(p, reversed[i].clone());
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let (Some(prev), Some(l)) = (self.prev.clone(), doc.layer_mut(self.scene, self.layer)) {
            l.keyframes = prev;
        }
    }
}

/// CMD-TWEEN-CLASSIC — create/update a classic tween span between two content
/// keyframes holding the SAME object (Part 09.2.1). One command; bit-exact
/// revert via the previous tween record.
pub struct SetClassicTween {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    pub ease: f64,
    prev: Option<ClassicTween>,
}

impl SetClassicTween {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32, ease: f64) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            ease,
            prev: None,
        }
    }
}

impl Command for SetClassicTween {
    fn label(&self) -> String {
        "Create classic tween".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = l.tweens.get(&self.start).cloned();
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        l.tweens.insert(
            self.start,
            ClassicTween {
                end: self.end,
                ease: self.ease,
            },
        );
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        match &self.prev {
            Some(prev) => {
                l.tweens.insert(self.start, prev.clone());
            }
            None => {
                l.tweens.remove(&self.start);
            }
        }
    }
}

/// CMD-TWEEN-REMOVE — remove a classic tween span (F-07-13 "Remove Tween").
pub struct RemoveClassicTween {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    prev: Option<ClassicTween>,
}

impl RemoveClassicTween {
    pub fn new(scene: usize, layer: usize, start: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            prev: None,
        }
    }
}

impl Command for RemoveClassicTween {
    fn label(&self) -> String {
        "Remove tween".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev = l.tweens.get(&self.start).cloned();
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        l.tweens.remove(&self.start);
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = &self.prev {
            l.tweens.insert(self.start, prev.clone());
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
