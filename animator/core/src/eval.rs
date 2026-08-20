use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

use crate::id::NodeId;
use crate::model::{Document, Frame, Layer, Node, Transform};

/// A single draw command for the renderer (fill/stroke rect in slice 1).
/// This is the export-side of the render tree — authoring overlays (selection
/// box, handles, guides) are NEVER produced here (REQ-EXP-002).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct RectItem {
    pub id: u64,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub rotation: f64,
    pub fill: String,
    pub stroke: Option<String>,
    pub stroke_width: f64,
}

/// Effective transform of a node at a specific keyframe entry.
fn effective_at(entry: Option<(&u32, &Frame)>, doc: &Document, id: NodeId) -> Option<Transform> {
    let (_, fr) = entry?;
    match fr {
        Frame::Keyframe {
            content,
            transforms,
        } if content.contains(&id) => Some(
            transforms
                .get(&id)
                .cloned()
                .unwrap_or_else(|| base_transform(doc, id)),
        ),
        _ => None,
    }
}

fn base_transform(doc: &Document, id: NodeId) -> Transform {
    doc.nodes
        .get(&id)
        .map(|n| n.transform().clone())
        .unwrap_or_default()
}

/// Node → transform at `frame`: linearly interpolates x/y between the previous
/// and next keyframes that both hold the node (classic-tween seed, IMP-DEC-006).
pub(crate) fn node_states_at(
    doc: &Document,
    layer: &Layer,
    frame: u32,
) -> BTreeMap<NodeId, Transform> {
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

/// Interpolated/held transform of a node at `frame` — the SAME value the
/// renderer draws. `None` if the node isn't present at this frame (blank
/// keyframe, before the first keyframe, hidden from content). This is what a
/// Move command must use as its "before" value so a drag on an ANIMATED object
/// does not jump (PHASE F — interpolated positions are authoritative).
pub(crate) fn node_transform_at(
    doc: &Document,
    scene: usize,
    layer: usize,
    frame: u32,
    id: NodeId,
) -> Option<Transform> {
    let layer_ = doc.layer(scene, layer)?;
    node_states_at(doc, layer_, frame).get(&id).cloned()
}

/// Evaluate the document at `frame` into a flat, ordered render-item list.
/// Bottom→top layers; back→front nodes (content order). Deterministic.
pub fn evaluate(doc: &Document, scene: usize, frame: u32) -> Vec<RectItem> {
    let mut out = Vec::new();
    let Some(scene_) = doc.scene(scene) else {
        return out;
    };
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
                Some(Node::Rect {
                    id,
                    width,
                    height,
                    fill,
                    stroke,
                    stroke_width,
                    ..
                }) => {
                    out.push(RectItem {
                        id: id.0,
                        x: t.x,
                        y: t.y,
                        w: width * t.scale_x,
                        h: height * t.scale_y,
                        rotation: t.rotation,
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

/// Point-in-rotated-rect test: rect has top-left (x,y), size (w,h), rotation
/// degrees around its CENTER (matches how the renderer draws it).
fn rect_contains(r: &RectItem, px: f64, py: f64) -> bool {
    if r.rotation == 0.0 {
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }
    let cx = r.x + r.w / 2.0;
    let cy = r.y + r.h / 2.0;
    let rad = -r.rotation.to_radians(); // undo the rotation
    let (cos, sin) = (rad.cos(), rad.sin());
    let dx = px - cx;
    let dy = py - cy;
    let lx = dx * cos - dy * sin;
    let ly = dx * sin + dy * cos;
    lx.abs() <= r.w / 2.0 && ly.abs() <= r.h / 2.0
}

/// All node ids whose rendered rect intersects (or is inside) the given
/// DOCUMENT-space axis-aligned rectangle — marquee selection (contact ON:
/// touching counts; a fully-inside test is the same when using bounds overlap).
pub fn hits_in_rect(
    doc: &Document,
    scene: usize,
    frame: u32,
    x0: f64,
    y0: f64,
    x1: f64,
    y1: f64,
) -> Vec<NodeId> {
    let (left, right) = if x0 <= x1 { (x0, x1) } else { (x1, x0) };
    let (top, bottom) = if y0 <= y1 { (y0, y1) } else { (y1, y0) };
    let mut out = Vec::new();
    let Some(scene_) = doc.scene(scene) else {
        return out;
    };
    for layer in scene_.layers.iter() {
        if !layer.visible || layer.locked {
            continue;
        }
        let idx = layer_index(scene_, layer);
        let order = doc.content_at(scene, idx, frame);
        let states = node_states_at(doc, layer, frame);
        for id in order {
            let Some(t) = states.get(&id) else { continue };
            if let Some(Node::Rect { width, height, .. }) = doc.nodes.get(&id) {
                let w = width * t.scale_x;
                let h = height * t.scale_y;
                // AABB of the (possibly rotated) rect for contact selection
                let (aabb_w, aabb_h) = rotated_aabb(t.rotation, w, h);
                let cx = t.x + w / 2.0;
                let cy = t.y + h / 2.0;
                if cx - aabb_w / 2.0 <= right
                    && cx + aabb_w / 2.0 >= left
                    && cy - aabb_h / 2.0 <= bottom
                    && cy + aabb_h / 2.0 >= top
                {
                    out.push(id);
                }
            }
        }
    }
    out
}

/// Axis-aligned bounding box size of a w×h rect rotated by `deg` degrees.
fn rotated_aabb(deg: f64, w: f64, h: f64) -> (f64, f64) {
    let rad = deg.to_radians();
    let (cos, sin) = (rad.cos().abs(), rad.sin().abs());
    (w * cos + h * sin, w * sin + h * cos)
}

fn layer_index(scene: &crate::model::Scene, layer: &Layer) -> usize {
    scene
        .layers
        .iter()
        .position(|l| l.id == layer.id)
        .unwrap_or(0)
}

/// Hit test at (x,y): top layer first (last in vec), front node first (reverse
/// content order). Locked/hidden layers skipped (REQ-SEL-001). Rotation-aware.
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
            if let Some(Node::Rect {
                width,
                height,
                fill,
                stroke,
                stroke_width,
                ..
            }) = doc.nodes.get(&id)
            {
                let item = RectItem {
                    id: id.0,
                    x: t.x,
                    y: t.y,
                    w: width * t.scale_x,
                    h: height * t.scale_y,
                    rotation: t.rotation,
                    fill: fill.clone(),
                    stroke: stroke.clone(),
                    stroke_width: *stroke_width,
                };
                if rect_contains(&item, x, y) {
                    return Some(id);
                }
            }
        }
    }
    None
}
