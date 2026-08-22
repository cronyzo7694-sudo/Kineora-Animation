use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::id::{LayerId, NodeId, SceneId, SymbolId};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    pub width: f64,
    pub height: f64,
    pub fps: u32,
    /// Stage background color (Part 33 §33.1 `backgroundColor`). The legacy
    /// key `background` (pre-H01 files) still deserializes via the alias.
    #[serde(rename = "backgroundColor", alias = "background")]
    pub background: String,
    /// Stage background opacity 0..=1 (Part 33 §33.1 `backgroundAlpha`;
    /// H01 §5.2/§8 — New dialog field, default 1).
    #[serde(rename = "backgroundAlpha", default = "default_background_alpha")]
    pub background_alpha: f64,
    /// Ruler units (Part 01 §1.7): px | in | cm | mm. Default px (eng 03).
    #[serde(default = "default_units")]
    pub units: String,
    /// Document platform/type (Part 01 §1.7): the Blueprint platform types.
    /// Default = HTML5 Canvas (P-8 resolved — first/primary modern target).
    #[serde(default = "default_platform")]
    pub platform: String,
}

fn default_units() -> String {
    "px".into()
}
fn default_platform() -> String {
    "HTML5 Canvas".into()
}
fn default_background_alpha() -> f64 {
    1.0
}

impl Default for Settings {
    /// Canonical new-document defaults (Part 33 §33.1 / engineering 03):
    /// 1920×1080 px @ 24 fps, white background (α=1), HTML5 Canvas.
    fn default() -> Self {
        Self {
            width: 1920.0,
            height: 1080.0,
            fps: 24,
            background: "#ffffff".into(),
            background_alpha: 1.0,
            units: default_units(),
            platform: default_platform(),
        }
    }
}

/// Transform component (REQ-XFR-001). Rotation in degrees, clockwise (Y-down).
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Transform {
    pub x: f64,
    pub y: f64,
    pub scale_x: f64,
    pub scale_y: f64,
    pub rotation: f64,
    pub skew_x: f64,
    pub skew_y: f64,
    pub pivot_x: f64,
    pub pivot_y: f64,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            scale_x: 1.0,
            scale_y: 1.0,
            rotation: 0.0,
            skew_x: 0.0,
            skew_y: 0.0,
            pivot_x: 0.0,
            pivot_y: 0.0,
        }
    }
}

/// Symbol type (Part 11 §11.1): graphic syncs to the parent timeline; movie
/// clip runs a free clock; button is state-driven (slice-1: rendered as a
/// static frame-1 — interactivity deferred per UNIT H scope).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SymbolType {
    Graphic,
    MovieClip,
    Button,
}

/// Graphic-instance loop mode (Part 11 §11.4). Movie clips ignore this.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum LoopMode {
    Loop,
    PlayOnce,
    SingleFrame,
}

/// Symbol definition (Part 11 §11.10 / Part 33 §33.7): a reusable, self-contained
/// timeline stored once in the Library. `registration` = where the symbol's
/// (0,0) sits relative to its artwork (informational; content is re-based so
/// the chosen point is local (0,0)).
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Symbol {
    pub id: SymbolId,
    pub name: String,
    pub symbol_type: SymbolType,
    pub registration: Transform,
    pub timeline: Vec<Layer>,
}

impl Symbol {
    /// Derived duration of the symbol's internal timeline (max keyframe frame).
    pub fn duration(&self) -> u32 {
        let mut max = 0u32;
        for l in &self.timeline {
            for f in l.keyframes.keys() {
                max = max.max(*f);
            }
        }
        max.max(1)
    }
}

/// Content node (slice: rectangle + symbol instance).
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum Node {
    Rect {
        id: NodeId,
        transform: Transform,
        width: f64,
        height: f64,
        fill: String,
        stroke: Option<String>,
        stroke_width: f64,
    },
    SymbolInstance {
        id: NodeId,
        transform: Transform,
        symbol_id: SymbolId,
        loop_mode: LoopMode,
        first_frame: u32,
    },
}

impl Node {
    pub fn id(&self) -> NodeId {
        match self {
            Node::Rect { id, .. } => *id,
            Node::SymbolInstance { id, .. } => *id,
        }
    }
    pub fn transform(&self) -> &Transform {
        match self {
            Node::Rect { transform, .. } => transform,
            Node::SymbolInstance { transform, .. } => transform,
        }
    }
    pub fn transform_mut(&mut self) -> &mut Transform {
        match self {
            Node::Rect { transform, .. } => transform,
            Node::SymbolInstance { transform, .. } => transform,
        }
    }
    /// The symbol id this node references, if it is an instance.
    pub fn symbol_id(&self) -> Option<SymbolId> {
        match self {
            Node::SymbolInstance { symbol_id, .. } => Some(*symbol_id),
            _ => None,
        }
    }
    /// Clone this node under a FRESH id — SYS-03 paste/duplicate AND SYS-16
    /// layer duplication (F-20-01 "Duplicate = deep copy (frames+content)").
    pub fn with_id(&self, id: NodeId) -> Node {
        match self {
            Node::Rect {
                transform,
                width,
                height,
                fill,
                stroke,
                stroke_width,
                ..
            } => Node::Rect {
                id,
                transform: transform.clone(),
                width: *width,
                height: *height,
                fill: fill.clone(),
                stroke: stroke.clone(),
                stroke_width: *stroke_width,
            },
            Node::SymbolInstance {
                transform,
                symbol_id,
                loop_mode,
                first_frame,
                ..
            } => Node::SymbolInstance {
                id,
                transform: transform.clone(),
                symbol_id: *symbol_id,
                loop_mode: *loop_mode,
                first_frame: *first_frame,
            },
        }
    }
    /// Clone this node with a replacement transform (clipboard bake).
    pub fn with_transform(&self, transform: Transform) -> Node {
        match self {
            Node::Rect {
                id,
                width,
                height,
                fill,
                stroke,
                stroke_width,
                ..
            } => Node::Rect {
                id: *id,
                transform,
                width: *width,
                height: *height,
                fill: fill.clone(),
                stroke: stroke.clone(),
                stroke_width: *stroke_width,
            },
            Node::SymbolInstance {
                id,
                symbol_id,
                loop_mode,
                first_frame,
                ..
            } => Node::SymbolInstance {
                id: *id,
                transform,
                symbol_id: *symbol_id,
                loop_mode: *loop_mode,
                first_frame: *first_frame,
            },
        }
    }
}

/// Sparse frame record (REQ-TIM-001). `transforms` = per-keyframe transform
/// overrides (classic whole-frame key model, slice-1 seed).
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum Frame {
    Keyframe {
        content: Vec<NodeId>,
        transforms: BTreeMap<NodeId, Transform>,
        /// Named frame label (Part 07 §7.2 "red flag" / Part 33.8 `label`) —
        /// goto targets. Display-only metadata; None = unlabeled.
        #[serde(default)]
        label: Option<String>,
    },
    Blank,
}

impl Layer {
    /// Hold rule on a single layer (Part 07 §7.3): content of the nearest
    /// keyframe ≤ `frame` (blank = empty). Used by symbol timelines too.
    pub fn content_at(&self, frame: u32) -> Vec<NodeId> {
        let mut content: Vec<NodeId> = vec![];
        for (_, fr) in self.keyframes.range(..=frame) {
            match fr {
                Frame::Keyframe { content: c, .. } => content = c.clone(),
                Frame::Blank => content = vec![],
            }
        }
        content
    }
}

impl Frame {
    pub fn keyframe(content: Vec<NodeId>) -> Self {
        Frame::Keyframe {
            content,
            transforms: BTreeMap::new(),
            label: None,
        }
    }
    pub fn blank() -> Self {
        Frame::Blank
    }
    pub fn is_keyframe(&self) -> bool {
        matches!(self, Frame::Keyframe { .. })
    }
    /// The frame label, if this is a labeled content keyframe.
    pub fn label(&self) -> Option<&str> {
        match self {
            Frame::Keyframe { label, .. } => label.as_deref(),
            Frame::Blank => None,
        }
    }
}

/// Layer type (F-20-04). Only `Normal` and `Folder` are implemented this
/// increment (F-20-05 folders). Other types (mask/guide/pose/…) remain
/// QUEUED — do not invent them here.
#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LayerKind {
    #[default]
    Normal,
    Folder,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Layer {
    pub id: LayerId,
    pub name: String,
    /// frame number (1-based) → frame record; held frames derived.
    pub keyframes: BTreeMap<u32, Frame>,
    /// Classic tween spans (Part 09.5 `{type:'classicTween', start, end, ease}`):
    /// start keyframe frame → { end frame, ease }. Sparse; a span interpolates
    /// between two content keyframes holding the SAME object. Held frames are
    /// NOT tweens (Part 08 §8.0 — frame-by-frame holds; tweening interpolates).
    #[serde(default)]
    pub tweens: BTreeMap<u32, ClassicTween>,
    pub visible: bool,
    pub locked: bool,
    /// Outline mode (F-07-02 E3 / F-20-01): render this layer's content as
    /// strokes only (authoring view aid). The content stays fully editable,
    /// selectable, and is EXPORTED fully — outline is view-only.
    #[serde(default)]
    pub outline: bool,
    /// Outline color (Part 33 `layer.outlineColor` / F-20-01 model). Used by
    /// the Layers panel swatch + the outline-mode stroke color. Default #ff0000
    /// per the F-20-01 reference model.
    #[serde(default = "default_outline_color")]
    pub outline_color: String,
    /// F-20-04/05: `normal` | `folder`. Default `normal` so old files load.
    #[serde(default)]
    pub kind: LayerKind,
    /// Folder parent (F-20-05). Organizational only — NOT transform parenting
    /// (F-20-06 / WISH W2 is a separate increment). Default None.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<LayerId>,
    /// Folder collapse (F-20-05 triangle). Persisted so reopen remembers.
    /// Ignored on non-folders. Default false (expanded).
    #[serde(default)]
    pub collapsed: bool,
}

impl Layer {
    pub fn is_folder(&self) -> bool {
        self.kind == LayerKind::Folder
    }

    pub fn new_normal(id: LayerId, name: impl Into<String>) -> Self {
        Self {
            id,
            name: name.into(),
            keyframes: BTreeMap::from([(1u32, Frame::keyframe(vec![]))]),
            tweens: BTreeMap::new(),
            visible: true,
            locked: false,
            outline: false,
            outline_color: default_outline_color(),
            kind: LayerKind::Normal,
            parent_id: None,
            collapsed: false,
        }
    }

    pub fn new_folder(id: LayerId, name: impl Into<String>) -> Self {
        Self {
            id,
            name: name.into(),
            keyframes: BTreeMap::new(),
            tweens: BTreeMap::new(),
            visible: true,
            locked: false,
            outline: false,
            outline_color: default_outline_color(),
            kind: LayerKind::Folder,
            parent_id: None,
            collapsed: false,
        }
    }
}

/// F-20-01 reference layer model's default outline color.
pub fn default_outline_color() -> String {
    "#ff0000".into()
}

/// Classic tween span record (Part 09.5): `ease` is the −100..+100 slider
/// value (Part 09.4.3); `end` is the frame of the end keyframe.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct ClassicTween {
    pub end: u32,
    pub ease: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Scene {
    pub id: SceneId,
    pub name: String,
    pub layers: Vec<Layer>, // bottom → top
}

/// Document metadata (Part 33 §33.1 `meta`). Field ownership is FIXED:
/// `created_at` = New / New-from-Template (SYS-02 H01 — the creation command
/// stamps it; 0 = unknown/legacy) · `modified_at` = Save (SYS-02 H05) ·
/// `title`/`author` = Document Properties (SYS-06/SYS-17), set AFTER creation.
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct Meta {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, rename = "createdAt")]
    pub created_at: u64,
    #[serde(
        default,
        rename = "modifiedAt",
        skip_serializing_if = "Option::is_none"
    )]
    pub modified_at: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub settings: Settings,
    pub scenes: Vec<Scene>,
    pub nodes: BTreeMap<NodeId, Node>,
    /// Library of symbol definitions (Part 12 — one per document).
    #[serde(default)]
    pub library: Vec<Symbol>,
    /// Part 33 §33.1 metadata block (default = legacy files without one).
    #[serde(default)]
    pub meta: Meta,
    pub next_id: u64,
}

impl Document {
    pub fn new(settings: Settings) -> Self {
        let layer = Layer {
            id: LayerId(1),
            name: "Layer 1".into(),
            keyframes: BTreeMap::from([(1u32, Frame::keyframe(vec![]))]),
            tweens: BTreeMap::new(),
            visible: true,
            locked: false,
            outline: false,
            outline_color: default_outline_color(),
        };
        let scene = Scene {
            id: SceneId(1),
            name: "Scene 1".into(),
            layers: vec![layer],
        };
        Self {
            settings,
            scenes: vec![scene],
            nodes: BTreeMap::new(),
            library: Vec::new(),
            meta: Meta::default(),
            next_id: 1,
        }
    }

    pub fn alloc_node_id(&mut self) -> NodeId {
        let id = NodeId(self.next_id);
        self.next_id += 1;
        id
    }

    /// Next unique LayerId (1 + max existing). Layer ids are stable (REQ-SYS-004).
    pub fn alloc_layer_id(&self) -> LayerId {
        let mut max = 0u64;
        for sc in &self.scenes {
            for l in &sc.layers {
                max = max.max(l.id.0);
            }
        }
        LayerId(max + 1)
    }

    /// Next unique SymbolId (1 + max existing in the Library).
    pub fn alloc_symbol_id(&self) -> SymbolId {
        let mut max = 0u64;
        for s in &self.library {
            max = max.max(s.id.0);
        }
        SymbolId(max + 1)
    }

    /// Look up a symbol definition by id.
    pub fn symbol(&self, id: SymbolId) -> Option<&Symbol> {
        self.library.iter().find(|s| s.id == id)
    }

    /// How many instance nodes reference this symbol (use-count, Part 12.1).
    pub fn symbol_use_count(&self, id: SymbolId) -> u32 {
        self.nodes
            .values()
            .filter(|n| n.symbol_id() == Some(id))
            .count() as u32
    }

    /// All node ids referenced by ANY layer's keyframe content (any frame).
    /// Used to find orphaned nodes when a layer is deleted.
    pub fn referenced_node_ids(&self) -> std::collections::BTreeSet<NodeId> {
        let mut set = std::collections::BTreeSet::new();
        for sc in &self.scenes {
            for l in &sc.layers {
                for fr in l.keyframes.values() {
                    if let Frame::Keyframe { content, .. } = fr {
                        set.extend(content.iter().copied());
                    }
                }
            }
        }
        set
    }

    /// F6 copy source: the content of the nearest CONTENT keyframe at or before
    /// `frame` (blank keyframes hold nothing and are skipped — F-07-08 M.2
    /// "F7 then F6 → content from the pre-blank key").
    pub fn content_before_for_keyframe(
        &self,
        scene: usize,
        layer: usize,
        frame: u32,
    ) -> Vec<NodeId> {
        let Some(layer_) = self.layer(scene, layer) else {
            return vec![];
        };
        for (_, fr) in layer_.keyframes.range(..=frame).rev() {
            if let Frame::Keyframe { content, .. } = fr {
                return content.clone();
            }
        }
        vec![]
    }

    /// Derived timeline duration (Part 07 §7.0): max keyframe frame across all
    /// layers of the scene, minimum 1. Computed, never stored.
    pub fn timeline_duration(&self, scene: usize) -> u32 {
        let Some(sc) = self.scene(scene) else {
            return 1;
        };
        let mut max = 0u32;
        for l in &sc.layers {
            for f in l.keyframes.keys() {
                max = max.max(*f);
            }
        }
        max.max(1)
    }

    pub fn scene(&self, i: usize) -> Option<&Scene> {
        self.scenes.get(i)
    }

    pub fn layer(&self, scene: usize, layer: usize) -> Option<&Layer> {
        self.scenes.get(scene)?.layers.get(layer)
    }

    pub fn layer_mut(&mut self, scene: usize, layer: usize) -> Option<&mut Layer> {
        self.scenes.get_mut(scene)?.layers.get_mut(layer)
    }

    /// Depth of a layer in the folder tree (F-20-05). Unlimited nesting.
    pub fn layer_depth(&self, scene: usize, layer_id: LayerId) -> usize {
        let Some(sc) = self.scene(scene) else {
            return 0;
        };
        let mut depth = 0;
        let mut cur = sc.layers.iter().find(|l| l.id == layer_id).and_then(|l| l.parent_id);
        let mut guard = 0;
        while let Some(pid) = cur {
            depth += 1;
            cur = sc.layers.iter().find(|l| l.id == pid).and_then(|l| l.parent_id);
            guard += 1;
            if guard > sc.layers.len() {
                break; // cycle guard
            }
        }
        depth
    }

    /// Direct + nested descendants of `folder_id` (F-20-05 cascade).
    pub fn layer_descendants(&self, scene: usize, folder_id: LayerId) -> Vec<LayerId> {
        let Some(sc) = self.scene(scene) else {
            return vec![];
        };
        let mut out = Vec::new();
        let mut frontier = vec![folder_id];
        while let Some(pid) = frontier.pop() {
            for l in &sc.layers {
                if l.parent_id == Some(pid) && !out.contains(&l.id) {
                    out.push(l.id);
                    frontier.push(l.id);
                }
            }
        }
        out
    }

    /// True if `maybe_ancestor` is an ancestor of `child` (cycle check).
    pub fn layer_is_ancestor(&self, scene: usize, maybe_ancestor: LayerId, child: LayerId) -> bool {
        self.layer_descendants(scene, maybe_ancestor).contains(&child) || maybe_ancestor == child
    }

    /// Hold rule: nearest keyframe (or blank) at or before `frame`.
    pub fn content_at(&self, scene: usize, layer: usize, frame: u32) -> Vec<NodeId> {
        self.layer(scene, layer)
            .map(|l| l.content_at(frame))
            .unwrap_or_default()
    }

    /// Copy the previous keyframe's content into a new keyframe at `frame`
    /// (Insert Keyframe / F6 semantics: content copied, then edited).
    pub fn ensure_keyframe(&mut self, scene: usize, layer: usize, frame: u32) -> Option<()> {
        let prev_content = self.content_at(scene, layer, frame);
        let layer_ = self.layer_mut(scene, layer)?;
        if let Some(Frame::Keyframe { .. }) = layer_.keyframes.get(&frame) {
            return Some(()); // already a keyframe
        }
        layer_
            .keyframes
            .insert(frame, Frame::keyframe(prev_content));
        Some(())
    }
}
