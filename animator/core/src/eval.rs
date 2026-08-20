use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::easing::ease_classic;
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

fn base_transform(doc: &Document, id: NodeId) -> Transform {
    doc.nodes
        .get(&id)
        .map(|n| n.transform().clone())
        .unwrap_or_default()
}

/// Node → transform at `frame`.
/// Hold rule (Part 07 §7.3): content holds from the nearest keyframe ≤ frame.
/// A **classic tween span** (Part 09.2) interpolates the transforms of nodes
/// present in BOTH the start and end keyframes (same object); frame-by-frame
/// keyframes HOLD (Part 08 §8.0). A tween whose end keyframe is missing or
/// whose content differs is BROKEN → holds the start (dashed in the UI).
pub(crate) fn node_states_at(
    doc: &Document,
    layer: &Layer,
    frame: u32,
) -> BTreeMap<NodeId, Transform> {
    let mut res = BTreeMap::new();
    let Some((&pf, prev_fr)) = layer.keyframes.range(..=frame).next_back() else {
        return res; // before the first keyframe → empty
    };
    let (prev_content, prev_xforms) = match prev_fr {
        Frame::Keyframe {
            content,
            transforms,
        } => (content, transforms),
        Frame::Blank => return res, // blank keyframe holds nothing
    };

    // HOLD: every node in the prev keyframe holds its effective transform.
    for id in prev_content {
        let t = prev_xforms
            .get(id)
            .cloned()
            .unwrap_or_else(|| base_transform(doc, *id));
        res.insert(*id, t);
    }

    // CLASSIC TWEEN: interpolate nodes shared by the start and end keyframes.
    if let Some(tw) = layer.tweens.get(&pf) {
        if tw.end > pf && frame <= tw.end {
            if let Some(Frame::Keyframe {
                content: c1,
                transforms: t1,
            }) = layer.keyframes.get(&tw.end)
            {
                let span = (tw.end - pf) as f64;
                let t = ease_classic(tw.ease, (frame - pf) as f64 / span);
                for id in prev_content {
                    if !c1.contains(id) {
                        continue; // not the same object → holds start
                    }
                    let a = prev_xforms
                        .get(id)
                        .cloned()
                        .unwrap_or_else(|| base_transform(doc, *id));
                    let b = t1
                        .get(id)
                        .cloned()
                        .unwrap_or_else(|| base_transform(doc, *id));
                    res.insert(*id, lerp_transform(&a, &b, t));
                }
            }
        }
    }
    res
}

/// Linear transform interpolation for classic tween: x/y/scale lerp; rotation
/// shortest-path (Part 08 §8.2). Skew/pivot are not tweened in this unit.
fn lerp_transform(a: &Transform, b: &Transform, t: f64) -> Transform {
    let mut d = b.rotation - a.rotation;
    while d > 180.0 {
        d -= 360.0;
    }
    while d < -180.0 {
        d += 360.0;
    }
    Transform {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        scale_x: a.scale_x + (b.scale_x - a.scale_x) * t,
        scale_y: a.scale_y + (b.scale_y - a.scale_y) * t,
        rotation: a.rotation + d * t,
        skew_x: a.skew_x,
        skew_y: a.skew_y,
        pivot_x: a.pivot_x,
        pivot_y: a.pivot_y,
    }
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

/// Scene-wide transform lookup: a selection can span layers (marquee / Select
/// All), so the effective transform is found by scanning every layer for the
/// first one that holds the node at `frame`. Returns `None` if the node isn't
/// held on any layer at this frame.
pub(crate) fn node_transform_in_scene(
    doc: &Document,
    scene: usize,
    frame: u32,
    id: NodeId,
) -> Option<Transform> {
    let scene_ = doc.scene(scene)?;
    for layer in &scene_.layers {
        let idx = layer_index(scene_, layer);
        if let Some(t) = node_transform_at(doc, scene, idx, frame, id) {
            return Some(t);
        }
    }
    None
}

/// Index of the layer that holds `id` at `frame` (scene-wide). Commands use
/// this so cross-layer selections write their overrides into the RIGHT layer.
pub(crate) fn node_layer_index(
    doc: &Document,
    scene: usize,
    frame: u32,
    id: NodeId,
) -> Option<usize> {
    let scene_ = doc.scene(scene)?;
    scene_
        .layers
        .iter()
        .enumerate()
        .find(|(i, _)| doc.content_at(scene, *i, frame).contains(&id))
        .map(|(i, _)| i)
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
