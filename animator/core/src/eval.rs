use std::collections::{BTreeMap, BTreeSet};

use crate::id::NodeId;
use crate::model::{Document, Frame, Layer, Node, Transform};

/// A single draw command for the renderer (fill/stroke rect in slice 1).
/// This is the export-side of the render tree — authoring overlays (selection
/// box, handles, guides) are NEVER produced here (REQ-EXP-002).
#[derive(Clone, Debug, PartialEq)]
pub struct RectItem {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub fill: String,
    pub stroke: Option<String>,
    pub stroke_width: f64,
}

/// Effective transform of a node at a specific keyframe entry.
fn effective_at(entry: Option<(&u32, &Frame)>, doc: &Document, id: NodeId) -> Option<Transform> {
    let (_, fr) = entry?;
    match fr {
        Frame::Keyframe { content, transforms } if content.contains(&id) => {
            Some(transforms.get(&id).cloned().unwrap_or_else(|| base_transform(doc, id)))
        }
        _ => None,
    }
}

fn base_transform(doc: &Document, id: NodeId) -> Transform {
    doc.nodes.get(&id).map(|n| n.transform().clone()).unwrap_or_default()
}

/// Node → transform at `frame`: linearly interpolates x/y between the previous
/// and next keyframes that both hold the node (classic-tween seed, IMP-DEC-006).
fn node_states_at(doc: &Document, layer: &Layer, frame: u32) -> BTreeMap<NodeId, Transform> {
    let mut res = BTreeMap::new();
    let prev = layer.keyframes.range(..=frame).next_back();
    let next = layer.keyframes.range((frame + 1)..).next();

    let mut ids = BTreeSet::new();
    for entry in [prev, next].into_iter().flatten() {
        if let Frame::Keyframe { content, .. } = entry.1 {
            ids.extend(content.iter().copied());
        }
    }

    for id in ids {
        let p = effective_at(prev, doc, id);
        let n = effective_at(next, doc, id);
        match (p, n) {
            (Some(a), Some(b)) => {
                let pf = prev.map(|(f, _)| *f).unwrap_or(frame);
                let nf = next.map(|(f, _)| *f).unwrap_or(frame + 1);
                let span = (nf as f64 - pf as f64).max(1.0);
                let t = (frame as f64 - pf as f64) / span;
                let mut tr = a.clone();
                tr.x = a.x + (b.x - a.x) * t;
                tr.y = a.y + (b.y - a.y) * t;
                res.insert(id, tr);
            }
            (Some(a), None) => {
                res.insert(id, a);
            }
            (None, Some(b)) => {
                res.insert(id, b);
            }
            (None, None) => {}
        }
    }
    res
}

/// Evaluate the document at `frame` into a flat, ordered render-item list.
/// Bottom→top layers; back→front nodes (content order). Deterministic.
pub fn evaluate(doc: &Document, scene: usize, frame: u32) -> Vec<RectItem> {
    let mut out = Vec::new();
    let Some(scene_) = doc.scene(scene) else { return out };
    for layer in &scene_.layers {
        if !layer.visible {
            continue;
        }
        // preserve content order (back → front) for correct stacking
        let order = doc.content_at(scene, layer_index(scene_, layer), frame);
        let states = node_states_at(doc, layer, frame);
        for id in order {
            let Some(t) = states.get(&id) else { continue };
            match doc.nodes.get(&id) {
                Some(Node::Rect { width, height, fill, stroke, stroke_width, .. }) => {
                    out.push(RectItem {
                        x: t.x,
                        y: t.y,
                        w: width * t.scale_x,
                        h: height * t.scale_y,
                        fill: fill.clone(),
                        stroke: stroke.clone(),
                        stroke_width: *stroke_width,
                    });
                }
                None => {}
            }
        }
    }
    out
}

fn layer_index(scene: &crate::model::Scene, layer: &Layer) -> usize {
    scene
        .layers
        .iter()
        .position(|l| l.id == layer.id)
        .unwrap_or(0)
}

/// Hit test at (x,y): top layer first (last in vec), front node first (reverse
/// content order). Locked/hidden layers skipped (REQ-SEL-001).
pub fn hit_test(doc: &Document, scene: usize, frame: u32, x: f64, y: f64) -> Option<NodeId> {
    let scene_ = doc.scene(scene)?;
    for layer in scene_.layers.iter().rev() {
        if !layer.visible || layer.locked {
            continue;
        }
        let idx = layer_index(scene_, layer);
        let order = doc.content_at(scene, idx, frame);
        let states = node_states_at(doc, layer, frame);
        for id in order.into_iter().rev() {
            let Some(t) = states.get(&id) else { continue };
            if let Some(Node::Rect { width, height, .. }) = doc.nodes.get(&id) {
                let w = width * t.scale_x;
                let h = height * t.scale_y;
                if x >= t.x && x <= t.x + w && y >= t.y && y <= t.y + h {
                    return Some(id);
                }
            }
        }
    }
    None
}
