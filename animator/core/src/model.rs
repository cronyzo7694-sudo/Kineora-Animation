use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::id::{LayerId, NodeId, SceneId};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Settings {
    pub width: f64,
    pub height: f64,
    pub fps: u32,
    pub background: String,
}

impl Default for Settings {
    /// Canonical new-document defaults (Part 33 §33.1 / engineering 03):
    /// 1920×1080 px @ 24 fps, white background.
    fn default() -> Self {
        Self {
            width: 1920.0,
            height: 1080.0,
            fps: 24,
            background: "#ffffff".into(),
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

/// Content node (slice 1: rectangle only; grows into shape/group/instance/text/bitmap).
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
}

impl Node {
    pub fn id(&self) -> NodeId {
        match self {
            Node::Rect { id, .. } => *id,
        }
    }
    pub fn transform(&self) -> &Transform {
        match self {
            Node::Rect { transform, .. } => transform,
        }
    }
    pub fn transform_mut(&mut self) -> &mut Transform {
        match self {
            Node::Rect { transform, .. } => transform,
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
    },
    Blank,
}

impl Frame {
    pub fn keyframe(content: Vec<NodeId>) -> Self {
        Frame::Keyframe {
            content,
            transforms: BTreeMap::new(),
        }
    }
    pub fn blank() -> Self {
        Frame::Blank
    }
    pub fn is_keyframe(&self) -> bool {
        matches!(self, Frame::Keyframe { .. })
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Layer {
    pub id: LayerId,
    pub name: String,
    /// frame number (1-based) → frame record; held frames derived.
    pub keyframes: BTreeMap<u32, Frame>,
    pub visible: bool,
    pub locked: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Scene {
    pub id: SceneId,
    pub name: String,
    pub layers: Vec<Layer>, // bottom → top
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub settings: Settings,
    pub scenes: Vec<Scene>,
    pub nodes: BTreeMap<NodeId, Node>,
    pub next_id: u64,
}

impl Document {
    pub fn new(settings: Settings) -> Self {
        let layer = Layer {
            id: LayerId(1),
            name: "Layer 1".into(),
            keyframes: BTreeMap::from([(1u32, Frame::keyframe(vec![]))]),
            visible: true,
            locked: false,
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

    pub fn scene(&self, i: usize) -> Option<&Scene> {
        self.scenes.get(i)
    }

    pub fn layer(&self, scene: usize, layer: usize) -> Option<&Layer> {
        self.scenes.get(scene)?.layers.get(layer)
    }

    pub fn layer_mut(&mut self, scene: usize, layer: usize) -> Option<&mut Layer> {
        self.scenes.get_mut(scene)?.layers.get_mut(layer)
    }

    /// Hold rule: nearest keyframe (or blank) at or before `frame`.
    pub fn content_at(&self, scene: usize, layer: usize, frame: u32) -> Vec<NodeId> {
        let Some(layer_) = self.layer(scene, layer) else {
            return vec![];
        };
        let mut content: Vec<NodeId> = vec![];
        for (_, fr) in layer_.keyframes.range(..=frame) {
            match fr {
                Frame::Keyframe { content: c, .. } => content = c.clone(),
                Frame::Blank => content = vec![],
            }
        }
        content
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
