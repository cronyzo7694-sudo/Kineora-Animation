use std::collections::{BTreeMap, HashMap};

use crate::eval::{collect_items, instance_child_frame, node_layer_index, node_transform_at};
use crate::id::{LayerId, NodeId, SymbolId};
use crate::model::{
    ClassicTween, Document, Frame, Layer, LoopMode, Node, Scene, Settings, ShapeKind, Symbol,
    Transform,
};

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
/// not commanded; it is captured/restored by the Session around execute/undo
/// (INV-EDIT-2 / eng 05 prevSelection). The Command trait stays mutation-only
/// so every existing impl remains valid — Session owns the snapshot.
pub trait Command {
    fn label(&self) -> String;
    fn apply(&mut self, doc: &mut Document);
    fn revert(&mut self, doc: &mut Document);
}

/// RSK-011 / eng 05: default History bound. Oldest entries drop first.
pub const HISTORY_BOUND: usize = 100;

struct HistoryEntry {
    cmd: Box<dyn Command>,
    /// Selection captured BEFORE apply (restored on undo).
    prev_selection: Vec<NodeId>,
    /// Selection after the Session method finished (restored on redo).
    post_selection: Vec<NodeId>,
}

pub struct History {
    undo: Vec<HistoryEntry>,
    redo: Vec<HistoryEntry>,
    /// The last-saved snapshot (H00 §7: dirty = "differs from last-saved
    /// snapshot"). `Some` from construction (New/Open start CLEAN against their
    /// own initial state) and refreshed by `mark_clean` on a successful write.
    saved: Option<Document>,
    /// Fast-path hint: `false` ⇒ known-clean (doc == saved); any mutation sets
    /// it `true`, after which `is_dirty` compares the document against the
    /// snapshot so an undo that returns to the exact saved state is CLEAN.
    dirty_hint: bool,
    /// E-AI-4 (A3, D-0010): monotonic document revision — bumped on EVERY
    /// execute/undo/redo. The AI snapshot carries it so the orchestrator can
    /// detect "the document changed since you looked" (06_SCENE_SNAPSHOT
    /// staleness). Monotonic per session; never persisted; not document
    /// content (like next_id, it does not participate in dirty checks).
    rev: u64,
}

impl History {
    /// A history for a freshly-created/loaded document: the current document
    /// state IS the saved baseline (New/Open start CLEAN per H00 §7).
    pub fn new(doc: &Document) -> Self {
        Self {
            undo: Vec::new(),
            redo: Vec::new(),
            saved: Some(doc.clone()),
            dirty_hint: false,
            rev: 0,
        }
    }

    /// Apply `cmd` and push it. `prev_selection` is the Session selection
    /// immediately before apply. Call `seal_last_post_selection` after the
    /// Session method has finished any post-command selection update.
    pub fn execute(
        &mut self,
        doc: &mut Document,
        mut cmd: Box<dyn Command>,
        prev_selection: Vec<NodeId>,
    ) {
        cmd.apply(doc);
        self.rev += 1;
        self.undo.push(HistoryEntry {
            cmd,
            prev_selection,
            post_selection: Vec::new(),
        });
        self.redo.clear(); // redo invalidation (Phase-3 Part 12)
        self.dirty_hint = true;
        while self.undo.len() > HISTORY_BOUND {
            self.undo.remove(0);
        }
    }

    pub fn seal_last_post_selection(&mut self, post: Vec<NodeId>) {
        if let Some(e) = self.undo.last_mut() {
            e.post_selection = post;
        }
    }

    /// Revert the top command. Returns the selection to restore (prev), or
    /// `None` when the stack is empty.
    pub fn undo(&mut self, doc: &mut Document) -> Option<Vec<NodeId>> {
        let mut e = self.undo.pop()?;
        self.rev += 1;
        e.cmd.revert(doc);
        let restore = e.prev_selection.clone();
        self.redo.push(e);
        self.dirty_hint = true;
        Some(restore)
    }

    /// Re-apply the top redo command. Returns the post-command selection.
    pub fn redo(&mut self, doc: &mut Document) -> Option<Vec<NodeId>> {
        let mut e = self.redo.pop()?;
        self.rev += 1;
        e.cmd.apply(doc);
        let restore = e.post_selection.clone();
        self.undo.push(e);
        self.dirty_hint = true;
        Some(restore)
    }

    /// H00 §7 (INV-DIRTY-1/2): dirty = "the document CONTENT differs from the
    /// last-saved snapshot" — NOT "an undo entry exists". An undo/redo that
    /// returns to the exact saved state is CLEAN; anything else is DIRTY.
    ///
    /// `next_id` is deliberately EXCLUDED from the comparison: it is a
    /// monotonic ID allocator that commands never roll back (IDs are never
    /// reused — a data-safety property), so it is not document content.
    pub fn is_dirty(&self, doc: &Document) -> bool {
        if !self.dirty_hint {
            return false;
        }
        match &self.saved {
            Some(snap) => {
                doc.settings != snap.settings
                    || doc.scenes != snap.scenes
                    || doc.nodes != snap.nodes
                    || doc.library != snap.library
                    || doc.meta != snap.meta
            }
            None => false,
        }
    }

    /// Called by Save (successful write) — the document becomes the new saved
    /// baseline. Does NOT touch the undo/redo stacks (INV-UNDO-1 / INV-009).
    pub fn mark_clean(&mut self, doc: &Document) {
        self.saved = Some(doc.clone());
        self.dirty_hint = false;
    }

    pub fn undo_len(&self) -> usize {
        self.undo.len()
    }
    pub fn redo_len(&self) -> usize {
        self.redo.len()
    }
    pub fn undo_labels(&self) -> Vec<String> {
        self.undo.iter().map(|e| e.cmd.label()).collect()
    }

    /// A5 transaction compiler seam. A staging `Session` executes the existing
    /// checked Session facades against a cloned live document, then transfers
    /// each already-built Command into one `CompositeCommand` on the real
    /// Session. This is crate-private so normal editor code cannot bypass
    /// History; production execution still enters through `execute_grouped`.
    pub(crate) fn take_last_command(&mut self) -> Option<Box<dyn Command>> {
        self.undo.pop().map(|entry| entry.cmd)
    }

    /// E-AI-4: current document revision (0 for a fresh/loaded document; +1 per
    /// execute/undo/redo).
    pub fn revision(&self) -> u64 {
        self.rev
    }
}

/// CMD-DRAW — draw a parametric shape (E1: rectangle / oval) into the current
/// frame's keyframe. The struct keeps its pre-E1 name; the undo label follows
/// the ShapeKind so History reads "Draw oval" for an oval.
pub struct DrawRect {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub node: Node,
}

impl Command for DrawRect {
    fn label(&self) -> String {
        match &self.node {
            Node::Rect {
                shape: ShapeKind::Oval,
                ..
            } => "Draw oval".into(),
            _ => "Draw rectangle".into(),
        }
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
            !(*s >= self.start && *s <= self.end || tw.end >= self.start && tw.end <= self.end)
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

/// CMD-SEQ-MOVE — drag a keyframe TOGETHER WITH its held span (Part 07 §7.4.9
/// "drag a frame/span"; F-07-12 E2): the keyframe at `from` and the NEXT
/// keyframe (the end of its exposure) shift by the same delta, preserving the
/// exposure length. Collisions at the target frames overwrite when
/// `overwrite` is true. One command; bit-exact revert.
pub struct MoveKeyframeSequence {
    pub scene: usize,
    pub layer: usize,
    pub from: u32,
    pub to: u32,
    pub overwrite: bool,
    prev_kf: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl MoveKeyframeSequence {
    pub fn new(scene: usize, layer: usize, from: u32, to: u32, overwrite: bool) -> Self {
        Self {
            scene,
            layer,
            from,
            to,
            overwrite,
            prev_kf: None,
            prev_tweens: None,
        }
    }
}

impl Command for MoveKeyframeSequence {
    fn label(&self) -> String {
        "Move frame span".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_kf = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());

        let Some(start_rec) = l.keyframes.get(&self.from).cloned() else {
            return; // nothing to move
        };
        let delta = self.to as i64 - self.from as i64;
        if delta == 0 {
            return;
        }
        // the span's end = the NEXT keyframe after `from`, if any
        let next: Option<u32> = l.keyframes.keys().copied().filter(|k| *k > self.from).min();
        let next_rec = next.and_then(|n| l.keyframes.get(&n).cloned());

        let target_start = self.to;
        let target_next = next.map(|n| (n as i64 + delta) as u32);

        // collision check when NOT overwriting: a target frame is blocked if a
        // keyframe OTHER than the one moving there already occupies it.
        if !self.overwrite {
            let occupied =
                |f: u32, mover: Option<u32>| l.keyframes.contains_key(&f) && mover != Some(f);
            let b1 = occupied(target_start, Some(self.from));
            let b2 = target_next.map(|tn| occupied(tn, next)).unwrap_or(false);
            if b1 || b2 {
                return; // collision, no overwrite → no-op
            }
        }

        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        // drop tweens anchored to the moving keyframes (broken span)
        l.tweens.retain(|s, tw| {
            !(*s == self.from
                || tw.end == self.from
                || next.map(|n| *s == n || tw.end == n).unwrap_or(false))
        });
        // remove the moving keyframes from their old positions
        l.keyframes.remove(&self.from);
        if let Some(n) = next {
            l.keyframes.remove(&n);
        }
        // remove collision targets when overwriting
        if self.overwrite {
            l.keyframes.remove(&target_start);
            if let Some(tn) = target_next {
                l.keyframes.remove(&tn);
            }
        }
        // place at the new positions
        l.keyframes.insert(target_start, start_rec);
        if let (Some(rec), Some(tn)) = (next_rec, target_next) {
            l.keyframes.insert(tn, rec);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev_kf.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-RESIZE-SPAN — drag the edge of a held span (Part 07 §7.4.11 / F-15-05
/// exposure editing): shift every keyframe AFTER `anchor` by `delta`, so the
/// hold of the keyframe at `anchor` extends (delta>0) or shortens (delta<0).
/// The Session clamps the exposure to a minimum of 1 frame. One command.
pub struct ResizeSpan {
    pub scene: usize,
    pub layer: usize,
    pub anchor: u32,
    pub delta: i64,
    prev_kf: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl ResizeSpan {
    pub fn new(scene: usize, layer: usize, anchor: u32, delta: i64) -> Self {
        Self {
            scene,
            layer,
            anchor,
            delta,
            prev_kf: None,
            prev_tweens: None,
        }
    }
}

impl Command for ResizeSpan {
    fn label(&self) -> String {
        "Resize frame span".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if self.delta == 0 {
            return;
        }
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_kf = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        let moved: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k > self.anchor)
            .collect();
        // descending for positive delta, ascending for negative (collision-safe)
        let mut ordered = moved;
        if self.delta > 0 {
            ordered.sort_unstable_by(|a, b| b.cmp(a));
        } else {
            ordered.sort_unstable();
        }
        for k in ordered {
            if let Some(fr) = l.keyframes.remove(&k) {
                l.keyframes.insert((k as i64 + self.delta) as u32, fr);
            }
        }
        shift_tweens(&mut l.tweens, self.anchor, self.delta);
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev_kf.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-DUPLICATE-FRAMES — duplicate the selected frame range (Part 07 §7.4.8):
/// copy the keyframes in [start,end] and insert them IMMEDIATELY AFTER the
/// range (preserving relative offsets), shifting later keyframes right to make
/// room. One command; bit-exact revert.
pub struct DuplicateFrames {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    prev_kf: Option<BTreeMap<u32, Frame>>,
    prev_tweens: Option<BTreeMap<u32, ClassicTween>>,
}

impl DuplicateFrames {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            prev_kf: None,
            prev_tweens: None,
        }
    }
}

impl Command for DuplicateFrames {
    fn label(&self) -> String {
        "Duplicate frames".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_kf = Some(l.keyframes.clone());
        self.prev_tweens = Some(l.tweens.clone());

        let recs: Vec<(u32, Frame)> = l
            .keyframes
            .iter()
            .filter(|(k, _)| **k >= self.start && **k <= self.end)
            .map(|(k, f)| (*k, f.clone()))
            .collect();
        if recs.is_empty() {
            return;
        }
        let len = (self.end - self.start + 1) as i64; // frame-range length
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        // shift keyframes after `end` right by len (descending to avoid collisions)
        let after: Vec<u32> = l
            .keyframes
            .keys()
            .copied()
            .filter(|k| *k > self.end)
            .collect();
        let mut ordered = after;
        ordered.sort_unstable_by(|a, b| b.cmp(a));
        for k in ordered {
            if let Some(fr) = l.keyframes.remove(&k) {
                l.keyframes.insert((k as i64 + len) as u32, fr);
            }
        }
        shift_tweens(&mut l.tweens, self.end, len);
        // insert the duplicated records after the range
        for (f, rec) in recs {
            l.keyframes.insert((f as i64 + len) as u32, rec);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev_kf.clone() {
            l.keyframes = prev;
        }
        if let Some(tw) = self.prev_tweens.clone() {
            l.tweens = tw;
        }
    }
}

/// CMD-CONVERT-KEYS — convert held frames in [start,end] into keyframes
/// (Part 07 §7.4.12): every non-keyframe frame in the range becomes a content
/// keyframe copying the hold's content AND transforms, so playback is visually
/// unchanged. One command; bit-exact revert.
pub struct ConvertToKeyframes {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    prev_kf: Option<BTreeMap<u32, Frame>>,
}

impl ConvertToKeyframes {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            prev_kf: None,
        }
    }
}

impl Command for ConvertToKeyframes {
    fn label(&self) -> String {
        "Convert to keyframes".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_kf = Some(l.keyframes.clone());
        // the hold at `start` = nearest keyframe ≤ start (content + transforms)
        let hold: Option<(Vec<NodeId>, BTreeMap<NodeId, Transform>)> = l
            .keyframes
            .range(..=self.start)
            .next_back()
            .and_then(|(_, fr)| match fr {
                Frame::Keyframe {
                    content,
                    transforms,
                    ..
                } => Some((content.clone(), transforms.clone())),
                Frame::Blank => None,
            });
        let Some((content, transforms)) = hold else {
            return; // nothing to hold → nothing to convert
        };
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        let mut made = false;
        for f in self.start..=self.end {
            l.keyframes.entry(f).or_insert_with(|| {
                made = true;
                Frame::Keyframe {
                    content: content.clone(),
                    transforms: transforms.clone(),
                    label: None,
                }
            });
        }
        if !made {
            self.prev_kf = None; // no change → no command
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev_kf.clone() {
            l.keyframes = prev;
        }
    }
}

/// CMD-CONVERT-BLANK — convert frames in [start,end] into BLANK keyframes
/// (Part 07 §7.4.12 "Convert to Blank Keyframes"): every non-blank frame in the
/// range becomes an explicit empty keyframe. One command; bit-exact revert.
pub struct ConvertToBlankKeyframes {
    pub scene: usize,
    pub layer: usize,
    pub start: u32,
    pub end: u32,
    prev_kf: Option<BTreeMap<u32, Frame>>,
}

impl ConvertToBlankKeyframes {
    pub fn new(scene: usize, layer: usize, start: u32, end: u32) -> Self {
        Self {
            scene,
            layer,
            start,
            end,
            prev_kf: None,
        }
    }
}

impl Command for ConvertToBlankKeyframes {
    fn label(&self) -> String {
        "Convert to blank keyframes".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        self.prev_kf = Some(l.keyframes.clone());
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        let mut made = false;
        for f in self.start..=self.end {
            if !matches!(l.keyframes.get(&f), Some(Frame::Blank)) {
                l.keyframes.insert(f, Frame::Blank);
                made = true;
            }
        }
        if !made {
            self.prev_kf = None;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(prev) = self.prev_kf.clone() {
            l.keyframes = prev;
        }
    }
}

/// CMD-SET-LABEL — set or clear the label on a CONTENT keyframe (Part 07 §7.2
/// "red flag" / Part 33.8 `label`). One command; bit-exact revert.
pub struct SetFrameLabel {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub after: Option<String>,
    before: Option<Option<String>>,
}

impl SetFrameLabel {
    pub fn new(scene: usize, layer: usize, frame: u32, after: Option<String>) -> Self {
        Self {
            scene,
            layer,
            frame,
            after,
            before: None,
        }
    }
}

impl Command for SetFrameLabel {
    fn label(&self) -> String {
        "Set frame label".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer(self.scene, self.layer) else {
            return;
        };
        let Some(Frame::Keyframe { label, .. }) = l.keyframes.get(&self.frame) else {
            return; // only content keyframes carry labels
        };
        self.before = Some(label.clone());
        let l = doc.layer_mut(self.scene, self.layer).expect("layer exists");
        if let Some(Frame::Keyframe { label, .. }) = l.keyframes.get_mut(&self.frame) {
            *label = self.after.clone();
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        let Some(l) = doc.layer_mut(self.scene, self.layer) else {
            return;
        };
        if let Some(before) = self.before.clone() {
            if let Some(Frame::Keyframe { label, .. }) = l.keyframes.get_mut(&self.frame) {
                *label = before;
            }
        }
    }
}

/// CMD-CONVERT-SYMBOL — F8: wrap the selected nodes into a symbol definition
/// and replace them (on the current frame) with one instance (Part 11 §11.2).
/// The wrapped nodes' base transforms are re-based so the chosen registration
/// point becomes the symbol's local (0,0); the instance's x/y = the registration
/// point's stage position. Exact undo restores base transforms + frame content.
pub struct ConvertToSymbol {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub symbol: Symbol,
    pub instance: Node,
    pub node_ids: Vec<NodeId>,
    prev_content: Option<Vec<NodeId>>,
    prev_transforms: Option<Vec<(NodeId, Transform)>>,
    /// True when apply() created the host keyframe (INV-EDIT-1: Session must
    /// not mutate the document before execute). Revert removes that keyframe.
    created_keyframe: bool,
}

impl ConvertToSymbol {
    /// `instance` must be a SymbolInstance whose transform.x/y IS the
    /// registration point's stage position (re-base subtracts it).
    pub fn new(
        scene: usize,
        layer: usize,
        frame: u32,
        symbol: Symbol,
        instance: Node,
        node_ids: Vec<NodeId>,
    ) -> Self {
        Self {
            scene,
            layer,
            frame,
            symbol,
            instance,
            node_ids,
            prev_content: None,
            prev_transforms: None,
            created_keyframe: false,
        }
    }
}

impl Command for ConvertToSymbol {
    fn label(&self) -> String {
        "Convert to symbol".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        // snapshot wrapped-node base transforms + the frame content
        self.prev_transforms = Some(
            self.node_ids
                .iter()
                .filter_map(|id| doc.nodes.get(id).map(|n| (*id, n.transform().clone())))
                .collect(),
        );
        let existed = matches!(
            doc.layer(self.scene, self.layer)
                .and_then(|l| l.keyframes.get(&self.frame)),
            Some(Frame::Keyframe { .. })
        );
        if !existed {
            // INV-EDIT-1: auto-key lives INSIDE the command (not Session).
            if doc
                .ensure_keyframe(self.scene, self.layer, self.frame)
                .is_none()
            {
                return;
            }
            self.created_keyframe = true;
        }
        self.prev_content = doc
            .layer(self.scene, self.layer)
            .and_then(|l| l.keyframes.get(&self.frame))
            .and_then(|fr| match fr {
                Frame::Keyframe { content, .. } => Some(content.clone()),
                Frame::Blank => None,
            });

        // insert the symbol + instance
        doc.library.push(self.symbol.clone());
        doc.nodes.insert(self.instance.id(), self.instance.clone());

        // re-base the wrapped nodes (registration point → local 0,0); the
        // instance's transform.x/y IS the registration point's stage position
        let (reg_x, reg_y) = match &self.instance {
            Node::SymbolInstance { transform, .. } => (transform.x, transform.y),
            _ => (0.0, 0.0),
        };
        for id in &self.node_ids {
            if let Some(n) = doc.nodes.get_mut(id) {
                let t = n.transform_mut();
                t.x -= reg_x;
                t.y -= reg_y;
            }
        }

        // replace the wrapped nodes with the instance on the current frame
        if let Some(Frame::Keyframe { content, .. }) = doc
            .layer_mut(self.scene, self.layer)
            .and_then(|l| l.keyframes.get_mut(&self.frame))
        {
            content.retain(|id| !self.node_ids.contains(id));
            content.push(self.instance.id());
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        // remove the instance + symbol
        doc.nodes.remove(&self.instance.id());
        doc.library.retain(|s| s.id != self.symbol.id);
        // restore base transforms
        if let Some(prev) = &self.prev_transforms {
            for (id, t) in prev {
                if let Some(n) = doc.nodes.get_mut(id) {
                    *n.transform_mut() = t.clone();
                }
            }
        }
        // restore EXACT original frame: if we created the host keyframe,
        // remove it (hold resumes); otherwise put the original content back.
        if let Some(l) = doc.layer_mut(self.scene, self.layer) {
            if self.created_keyframe {
                l.keyframes.remove(&self.frame);
            } else if let Some(prev) = self.prev_content.clone() {
                if let Some(Frame::Keyframe { content, .. }) = l.keyframes.get_mut(&self.frame) {
                    *content = prev;
                }
            }
        }
    }
}

/// CMD-CREATE-SYMBOL — Ctrl+F8: add an empty symbol to the Library.
pub struct CreateSymbol {
    pub symbol: Symbol,
}

impl Command for CreateSymbol {
    fn label(&self) -> String {
        "New symbol".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        doc.library.push(self.symbol.clone());
    }
    fn revert(&mut self, doc: &mut Document) {
        doc.library.retain(|s| s.id != self.symbol.id);
    }
}

/// CMD-PLACE-SYMBOL — place an instance of a symbol on the current frame
/// (drag library → stage, or after New Symbol).
pub struct PlaceSymbol {
    pub scene: usize,
    pub layer: usize,
    pub frame: u32,
    pub instance: Node,
    prev_content: Option<Vec<NodeId>>,
}

impl PlaceSymbol {
    pub fn new(scene: usize, layer: usize, frame: u32, instance: Node) -> Self {
        Self {
            scene,
            layer,
            frame,
            instance,
            prev_content: None,
        }
    }
}

impl Command for PlaceSymbol {
    fn label(&self) -> String {
        "Place symbol instance".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        self.prev_content = doc
            .layer(self.scene, self.layer)
            .and_then(|l| l.keyframes.get(&self.frame))
            .and_then(|fr| match fr {
                Frame::Keyframe { content, .. } => Some(content.clone()),
                Frame::Blank => None,
            });
        doc.nodes.insert(self.instance.id(), self.instance.clone());
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
            content.push(self.instance.id());
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        doc.nodes.remove(&self.instance.id());
        if let (Some(prev), Some(l)) = (
            self.prev_content.clone(),
            doc.layer_mut(self.scene, self.layer),
        ) {
            if let Some(Frame::Keyframe { content, .. }) = l.keyframes.get_mut(&self.frame) {
                *content = prev;
            } else {
                l.keyframes.remove(&self.frame);
            }
        }
    }
}

/// CMD-RENAME-SYMBOL — rename a symbol (ID-safe; Part 12 §12.2.3).
pub struct RenameSymbol {
    pub symbol_id: SymbolId,
    pub before: String,
    pub after: String,
}

impl Command for RenameSymbol {
    fn label(&self) -> String {
        "Rename symbol".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(s) = doc.library.iter_mut().find(|s| s.id == self.symbol_id) {
            s.name = self.after.clone();
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(s) = doc.library.iter_mut().find(|s| s.id == self.symbol_id) {
            s.name = self.before.clone();
        }
    }
}

/// CMD-SWAP-INSTANCE — replace an instance's symbol (Part 11 §11.6), keeping
/// its transform.
pub struct SwapInstance {
    pub instance_id: NodeId,
    pub before: SymbolId,
    pub after: SymbolId,
}

impl Command for SwapInstance {
    fn label(&self) -> String {
        "Swap symbol".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(Node::SymbolInstance { symbol_id, .. }) = doc.nodes.get_mut(&self.instance_id) {
            *symbol_id = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(Node::SymbolInstance { symbol_id, .. }) = doc.nodes.get_mut(&self.instance_id) {
            *symbol_id = self.before;
        }
    }
}

/// CMD-SET-INSTANCE-LOOP — set the graphic loop mode / first frame.
pub struct SetInstanceLoop {
    pub instance_id: NodeId,
    pub before: (LoopMode, u32),
    pub after: (LoopMode, u32),
}

impl Command for SetInstanceLoop {
    fn label(&self) -> String {
        "Set instance loop".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(Node::SymbolInstance {
            loop_mode,
            first_frame,
            ..
        }) = doc.nodes.get_mut(&self.instance_id)
        {
            *loop_mode = self.after.0;
            *first_frame = self.after.1.max(1);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(Node::SymbolInstance {
            loop_mode,
            first_frame,
            ..
        }) = doc.nodes.get_mut(&self.instance_id)
        {
            *loop_mode = self.before.0;
            *first_frame = self.before.1;
        }
    }
}

/// CMD-DELETE-SYMBOL — delete a symbol from the Library (Part 12 §12.2.5).
/// With `break_apart`, every instance of the symbol is flattened into raw rect
/// content (full flatten, depth-capped) before the definition is removed.
/// Undo = full-document snapshot (rare, exact).
pub struct DeleteSymbol {
    pub symbol_id: SymbolId,
    pub break_apart: bool,
    prev_doc: Option<Document>,
}

impl DeleteSymbol {
    pub fn new(symbol_id: SymbolId, break_apart: bool) -> Self {
        Self {
            symbol_id,
            break_apart,
            prev_doc: None,
        }
    }
}

impl Command for DeleteSymbol {
    fn label(&self) -> String {
        "Delete symbol".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        self.prev_doc = Some(doc.clone());

        if self.break_apart {
            // instances referencing this symbol
            let inst_ids: Vec<NodeId> = doc
                .nodes
                .values()
                .filter(|n| n.symbol_id() == Some(self.symbol_id))
                .map(|n| n.id())
                .collect();
            // flatten each instance → cloned rect nodes (allocated + inserted)
            let mut repl: std::collections::HashMap<NodeId, Vec<NodeId>> =
                std::collections::HashMap::new();
            for iid in inst_ids {
                let Some(Node::SymbolInstance {
                    symbol_id,
                    loop_mode,
                    first_frame,
                    ..
                }) = doc.nodes.get(&iid)
                else {
                    continue;
                };
                let (t, lm, ff, sid) = (
                    doc.nodes.get(&iid).unwrap().transform().clone(),
                    *loop_mode,
                    *first_frame,
                    *symbol_id,
                );
                let Some(sym) = doc.symbol(sid).cloned() else {
                    continue;
                };
                let child = instance_child_frame(&sym, lm, ff, 1);
                let mut items = Vec::new();
                collect_items(
                    doc,
                    &sym.timeline,
                    child,
                    0,
                    Some(&t),
                    false,
                    None,
                    &mut items,
                );
                let clones: Vec<NodeId> = items
                    .into_iter()
                    .map(|it| {
                        let nid = doc.alloc_node_id();
                        doc.nodes.insert(
                            nid,
                            Node::Rect {
                                id: nid,
                                transform: Transform {
                                    x: it.x,
                                    y: it.y,
                                    scale_x: 1.0,
                                    scale_y: 1.0,
                                    rotation: it.rotation,
                                    ..Transform::default()
                                },
                                width: it.w,
                                height: it.h,
                                fill: it.fill.clone(),
                                stroke: it.stroke.clone(),
                                stroke_width: it.stroke_width,
                                shape: it.shape,
                            },
                        );
                        nid
                    })
                    .collect();
                repl.insert(iid, clones);
                doc.nodes.remove(&iid);
            }
            // sweep every content list, replacing instance ids with clones
            for sc in doc.scenes.iter_mut() {
                for layer in sc.layers.iter_mut() {
                    for fr in layer.keyframes.values_mut() {
                        if let Frame::Keyframe { content, .. } = fr {
                            let mut next = Vec::new();
                            for c in content.iter() {
                                if let Some(cl) = repl.get(c) {
                                    next.extend(cl.iter().copied());
                                } else {
                                    next.push(*c);
                                }
                            }
                            *content = next;
                        }
                    }
                }
            }
        }

        doc.library.retain(|s| s.id != self.symbol_id);
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(prev) = self.prev_doc.clone() {
            *doc = prev;
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

/// CMD-SCENE-CREATE — Insert ▸ Scene (Part 01 §1.2.4 + Part 25.1): APPEND a
/// scene with a default timeline to the END of the scene list. Undo removes
/// exactly that scene (by stable SceneId); other scenes untouched.
pub struct CreateScene {
    pub scene: Scene,
}

impl Command for CreateScene {
    fn label(&self) -> String {
        "Add scene".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        doc.scenes.push(self.scene.clone());
    }
    fn revert(&mut self, doc: &mut Document) {
        doc.scenes.retain(|sc| sc.id != self.scene.id);
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

/// CMD-LAYER-OUTLINE — outline-mode toggle (F-07-02 E3 / F-20-01). Outline is
/// an authoring VIEW aid (strokes only): content stays editable, selectable,
/// and exported fully — so this command never touches selection or evaluate.
pub struct SetLayerOutline {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: bool,
    pub after: bool,
}

impl Command for SetLayerOutline {
    fn label(&self) -> String {
        "Toggle layer outline".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.outline = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.outline = self.before;
        }
    }
}

/// CMD-LAYER-OUTLINE-COLOR — outline color (F-07-02 E6 "Layer Properties →
/// outline color" / Part 33 `layer.outlineColor`). Display metadata only.
pub struct SetLayerOutlineColor {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: String,
    pub after: String,
}

impl Command for SetLayerOutlineColor {
    fn label(&self) -> String {
        "Set layer outline color".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.outline_color = self.after.clone();
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.outline_color = self.before.clone();
        }
    }
}

/// Which per-layer flag a batch toggle (Alt+click "all others") addresses.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum LayerFlagKind {
    Visible,
    Locked,
    Outline,
}

/// CMD-LAYER-FLAGS — Alt+click "all others" batch toggle (F-07-02 E1/E2/E3,
/// M.3 "Alt+click eye with all hidden → shows all" proves toggle semantics).
/// ONE undo step for the whole batch; before/after are explicit so undo/redo
/// are exact regardless of layer count or later reordering.
pub struct SetLayerFlags {
    pub scene: usize,
    pub kind: LayerFlagKind,
    pub before: Vec<(LayerId, bool)>,
    pub after: Vec<(LayerId, bool)>,
}

fn apply_layer_flags(
    doc: &mut Document,
    scene: usize,
    kind: LayerFlagKind,
    pairs: &[(LayerId, bool)],
) {
    let Some(sc) = doc.scenes.get_mut(scene) else {
        return;
    };
    for (id, val) in pairs {
        if let Some(l) = sc.layers.iter_mut().find(|l| l.id == *id) {
            match kind {
                LayerFlagKind::Visible => l.visible = *val,
                LayerFlagKind::Locked => l.locked = *val,
                LayerFlagKind::Outline => l.outline = *val,
            }
        }
    }
}

impl Command for SetLayerFlags {
    fn label(&self) -> String {
        match self.kind {
            LayerFlagKind::Visible => "Show/hide other layers".into(),
            LayerFlagKind::Locked => "Lock/unlock other layers".into(),
            LayerFlagKind::Outline => "Toggle outline on other layers".into(),
        }
    }
    fn apply(&mut self, doc: &mut Document) {
        apply_layer_flags(doc, self.scene, self.kind, &self.after);
    }
    fn revert(&mut self, doc: &mut Document) {
        apply_layer_flags(doc, self.scene, self.kind, &self.before);
    }
}

/// CMD-LAYER-DUP — duplicate a layer (or a folder + its descendants) as ONE
/// undo (Part 20.1 / F-20-01 / B-4). Each copy carries a fresh LayerId and
/// every content node is cloned under a NEW NodeId, so the two trees are
/// fully independent. `layers` is inserted as a contiguous block at
/// `insert_at` (engine order). Undo removes every copy + its nodes exactly.
pub struct DuplicateLayer {
    pub scene: usize,
    pub insert_at: usize,
    pub layers: Vec<Layer>,
    pub copied_nodes: BTreeMap<NodeId, Node>,
}

impl Command for DuplicateLayer {
    fn label(&self) -> String {
        "Duplicate layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        for (id, n) in &self.copied_nodes {
            doc.nodes.insert(*id, n.clone());
        }
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        let mut idx = self.insert_at.min(sc.layers.len());
        for layer in &self.layers {
            sc.layers.insert(idx, layer.clone());
            idx += 1;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for id in self.copied_nodes.keys() {
            doc.nodes.remove(id);
        }
        let Some(sc) = doc.scenes.get_mut(self.scene) else {
            return;
        };
        sc.layers
            .retain(|l| !self.layers.iter().any(|c| c.id == l.id));
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

/// CMD-LAYER-PARENT — nest/un-nest a layer under a folder (F-20-05).
/// Organizational only (no transform inheritance — that is F-20-06 / W2).
pub struct SetLayerParent {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: Option<LayerId>,
    pub after: Option<LayerId>,
}

impl Command for SetLayerParent {
    fn label(&self) -> String {
        "Nest layer".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.parent_id = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.parent_id = self.before;
        }
    }
}

/// CMD-FOLDER-COLLAPSE — triangle expand/collapse (F-20-05). Persisted.
pub struct SetFolderCollapsed {
    pub scene: usize,
    pub layer_id: LayerId,
    pub before: bool,
    pub after: bool,
}

impl Command for SetFolderCollapsed {
    fn label(&self) -> String {
        "Collapse folder".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.collapsed = self.after;
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        if let Some(l) = doc
            .scenes
            .get_mut(self.scene)
            .and_then(|sc| sc.layers.iter_mut().find(|l| l.id == self.layer_id))
        {
            l.collapsed = self.before;
        }
    }
}

/// CMD-LAYER-DEL-GROUP — delete a folder and its descendants as ONE undo
/// (F-20-05). Snapshots each removed layer + orphaned nodes.
pub struct DeleteLayerGroup {
    pub scene: usize,
    /// (original index, layer) in descending index order for apply.
    pub layers: Vec<(usize, Layer)>,
    removed_nodes: BTreeMap<NodeId, Node>,
}

impl DeleteLayerGroup {
    pub fn new(scene: usize, layers: Vec<(usize, Layer)>) -> Self {
        Self {
            scene,
            layers,
            removed_nodes: BTreeMap::new(),
        }
    }
}

impl Command for DeleteLayerGroup {
    fn label(&self) -> String {
        "Delete folder".into()
    }
    fn apply(&mut self, doc: &mut Document) {
        let ids: std::collections::BTreeSet<LayerId> =
            self.layers.iter().map(|(_, l)| l.id).collect();
        if let Some(sc) = doc.scenes.get_mut(self.scene) {
            sc.layers.retain(|l| !ids.contains(&l.id));
        }
        let mut layer_ids: std::collections::BTreeSet<NodeId> = std::collections::BTreeSet::new();
        for (_, layer) in &self.layers {
            for f in layer.keyframes.values() {
                if let Frame::Keyframe { content, .. } = f {
                    layer_ids.extend(content.iter().copied());
                }
            }
        }
        let still = doc.referenced_node_ids();
        for id in layer_ids {
            if !still.contains(&id) {
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
        let mut restored = self.layers.clone();
        restored.sort_by_key(|(i, _)| *i);
        for (idx, layer) in restored {
            let i = idx.min(sc.layers.len());
            sc.layers.insert(i, layer);
        }
    }
}

/// CMD-COMPOSITE (E-AI-1 / D-0010) — an ordered group of child commands that
/// History treats as ONE undo entry: "one user request = one Ctrl+Z" (the AI
/// transaction primitive — TOOLS_RESEARCH/AI_AGENT/09_UNDO_TRANSACTION_MODEL).
///
/// Children apply in order and revert in REVERSE order, so position- and
/// index-sensitive children always unwind against the exact document state
/// their own revert was written for.
///
/// Atomicity contract: `Command::apply`/`revert` are infallible — existing
/// commands never validate at apply time; all precondition checks live in the
/// Session facades that BUILD commands (they return false WITHOUT pushing when
/// a child cannot be built). Grouped execution is therefore all-or-nothing at
/// CONSTRUCTION time: build every child first; if any child build fails, drop
/// the whole group and push nothing. A group that reaches `History::execute`
/// applies to completion, and a revert restores the exact pre-group state
/// (tests/composite.rs proves bit-exactness on real command mixes).
pub struct CompositeCommand {
    label: String,
    children: Vec<Box<dyn Command>>,
}

impl CompositeCommand {
    /// `children` apply in slice order and revert in reverse. Empty groups are
    /// constructible (a degenerate value) but `Session::execute_grouped`
    /// refuses them — a no-op undo entry would corrupt the user's undo
    /// expectations for nothing.
    pub fn new(label: impl Into<String>, children: Vec<Box<dyn Command>>) -> Self {
        Self {
            label: label.into(),
            children,
        }
    }

    pub fn len(&self) -> usize {
        self.children.len()
    }

    pub fn is_empty(&self) -> bool {
        self.children.is_empty()
    }
}

impl Command for CompositeCommand {
    /// ONE history label for the whole group (e.g. "AI — red ball bounce") —
    /// child labels stay internal, so Edit-menu/undo lists show a single row.
    fn label(&self) -> String {
        self.label.clone()
    }
    fn apply(&mut self, doc: &mut Document) {
        for child in &mut self.children {
            child.apply(doc);
        }
    }
    fn revert(&mut self, doc: &mut Document) {
        for child in self.children.iter_mut().rev() {
            child.revert(doc);
        }
    }
}
