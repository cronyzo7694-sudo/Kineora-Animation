use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::easing::ease_classic;
use crate::id::NodeId;
use crate::model::{
    layer_and_ancestors_unlocked, layer_and_ancestors_visible, Document, Frame, Layer, LoopMode,
    Node, Symbol, SymbolType, Transform,
};

/// Maximum symbol nesting depth (engineering RSK-002 "Depth cap 32").
pub const MAX_DEPTH: u32 = 32;

/// A single draw command for the renderer (fill/stroke rect). Flattened
/// render-tree leaf — authoring overlays (selection box, handles, guides) are
/// NEVER produced here (REQ-EXP-002).
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
    /// Set when the item's SCENE layer is in outline mode (F-07-02 E3 /
    /// F-20-01): the layer's outline color. Propagates through symbol nesting,
    /// so everything placed on an outline layer renders as strokes. This is a
    /// VIEW aid only — SVG export and the export rasterizer ignore it and
    /// always draw the full content (F-20-01 "outline exports fully").
    #[serde(default)]
    pub outline_color: Option<String>,
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
/// whose content differs is BROKEN → holds the start.
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
            ..
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
                ..
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
/// renderer draws. `None` if the node isn't present at this frame.
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

/// Scene-wide transform lookup for a selection (may span layers).
pub(crate) fn node_transform_in_scene(
    doc: &Document,
    scene: usize,
    frame: u32,
    id: NodeId,
) -> Option<Transform> {
    let scene_ = doc.scene(scene)?;
    for (idx, _) in scene_.layers.iter().enumerate() {
        if let Some(t) = node_transform_at(doc, scene, idx, frame, id) {
            return Some(t);
        }
    }
    None
}

/// Index of the layer that holds `id` at `frame` (scene-wide).
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
        .find(|(_, l)| l.content_at(frame).contains(&id))
        .map(|(i, _)| i)
}

// ——— transform composition (Part 11.8 nested evaluation) ———

/// Apply a transform to a point (rotate around the origin, scale, translate).
fn apply_point(t: &Transform, px: f64, py: f64) -> (f64, f64) {
    let rad = t.rotation.to_radians();
    let (cos, sin) = (rad.cos(), rad.sin());
    let rx = px * cos - py * sin;
    let ry = px * sin + py * cos;
    (rx * t.scale_x + t.x, ry * t.scale_y + t.y)
}

/// Inverse-apply a transform to a point (for hit-testing INTO an instance).
fn inverse_point(t: &Transform, px: f64, py: f64) -> (f64, f64) {
    let lx = (px - t.x) / t.scale_x;
    let ly = (py - t.y) / t.scale_y;
    let rad = -t.rotation.to_radians();
    let (cos, sin) = (rad.cos(), rad.sin());
    (lx * cos - ly * sin, lx * sin + ly * cos)
}

/// Compose parent ∘ child (rigid approximation: rotations add, scales multiply,
/// the child's translation is transformed by the parent). Exact for uniform
/// scale or zero rotation; non-uniform-scale + rotation skew is approximated
/// (our Transform has no skew field) — documented limitation.
pub(crate) fn compose_transforms(parent: &Transform, child: &Transform) -> Transform {
    let (x, y) = apply_point(parent, child.x, child.y);
    Transform {
        x,
        y,
        scale_x: parent.scale_x * child.scale_x,
        scale_y: parent.scale_y * child.scale_y,
        rotation: parent.rotation + child.rotation,
        skew_x: child.skew_x,
        skew_y: child.skew_y,
        pivot_x: child.pivot_x,
        pivot_y: child.pivot_y,
    }
}

/// Apply an instance context to a flattened rect item (Part 11.8).
fn compose_rect_item(it: &RectItem, ctx: &Transform) -> RectItem {
    let cx = it.x + it.w / 2.0;
    let cy = it.y + it.h / 2.0;
    let (ncx, ncy) = apply_point(ctx, cx, cy);
    let w = it.w * ctx.scale_x;
    let h = it.h * ctx.scale_y;
    RectItem {
        id: it.id,
        x: ncx - w / 2.0,
        y: ncy - h / 2.0,
        w,
        h,
        rotation: it.rotation + ctx.rotation,
        fill: it.fill.clone(),
        stroke: it.stroke.clone(),
        stroke_width: it.stroke_width * ((ctx.scale_x.abs() + ctx.scale_y.abs()) / 2.0),
        outline_color: it.outline_color.clone(),
    }
}

/// The internal frame a symbol shows at `parent` (Part 11 §11.4 / §11.8):
/// graphic syncs to the parent clock (loop / play-once / single-frame with
/// first-frame); movie clip runs a free clock; button shows frame 1.
pub(crate) fn instance_child_frame(
    sym: &Symbol,
    loop_mode: LoopMode,
    first_frame: u32,
    parent: u32,
) -> u32 {
    let dur = sym.duration().max(1);
    match sym.symbol_type {
        SymbolType::MovieClip => ((parent - 1) % dur) + 1,
        SymbolType::Button => 1,
        SymbolType::Graphic => {
            let first = first_frame.max(1).min(dur);
            match loop_mode {
                LoopMode::Loop => ((first - 1 + (parent - 1)) % dur) + 1,
                LoopMode::PlayOnce => (first + (parent - 1)).min(dur),
                LoopMode::SingleFrame => first,
            }
        }
    }
}

/// Recursively flatten a layer stack at `frame` into render items, applying the
/// accumulated instance context `ctx` (None = identity). `skip_locked` gates
/// locked layers (used by hit-testing/marquee; rendering keeps locked layers).
/// `outline` = the outline color inherited from the originating SCENE layer
/// (None = normal rendering); a layer in outline mode overrides it with its own
/// color (F-20-01 view aid, propagated through symbol nesting).
// The 8 parameters are the natural recursion payload; grouping them into a
// struct would obscure the hot path for no caller benefit.
#[allow(clippy::too_many_arguments)]
pub(crate) fn collect_items(
    doc: &Document,
    layers: &[Layer],
    frame: u32,
    depth: u32,
    ctx: Option<&Transform>,
    skip_locked: bool,
    outline: Option<&str>,
    out: &mut Vec<RectItem>,
) {
    for layer in layers {
        // B-1: a child of a hidden folder must not render even if its own
        // visible flag is still true (nest-after-hide). B-3: skip_locked
        // also honors a locked ancestor folder.
        if !layer_and_ancestors_visible(layers, layer)
            || (skip_locked && !layer_and_ancestors_unlocked(layers, layer))
        {
            continue;
        }
        let layer_outline = if layer.outline {
            Some(layer.outline_color.as_str())
        } else {
            outline
        };
        let states = node_states_at(doc, layer, frame);
        for id in layer.content_at(frame) {
            let Some(t) = states.get(&id).cloned() else {
                continue;
            };
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
                    let it = RectItem {
                        id: id.0,
                        x: t.x,
                        y: t.y,
                        w: width * t.scale_x,
                        h: height * t.scale_y,
                        rotation: t.rotation,
                        fill: fill.clone(),
                        stroke: stroke.clone(),
                        stroke_width: *stroke_width,
                        outline_color: layer_outline.map(str::to_string),
                    };
                    out.push(match ctx {
                        Some(c) => compose_rect_item(&it, c),
                        None => it,
                    });
                }
                Some(Node::SymbolInstance {
                    symbol_id,
                    loop_mode,
                    first_frame,
                    ..
                }) => {
                    if depth >= MAX_DEPTH {
                        continue;
                    }
                    let Some(sym) = doc.symbol(*symbol_id) else {
                        continue;
                    };
                    let child = instance_child_frame(sym, *loop_mode, *first_frame, frame);
                    let composed = match ctx {
                        Some(c) => compose_transforms(c, &t),
                        None => t.clone(),
                    };
                    collect_items(
                        doc,
                        &sym.timeline,
                        child,
                        depth + 1,
                        Some(&composed),
                        skip_locked,
                        layer_outline,
                        out,
                    );
                }
                None => {}
            }
        }
    }
}

/// Evaluate the document at `frame` into a flat, ordered render-item list
/// (nested symbols flattened per Part 11.8). Deterministic.
pub fn evaluate(doc: &Document, scene: usize, frame: u32) -> Vec<RectItem> {
    let mut out = Vec::new();
    let Some(scene_) = doc.scene(scene) else {
        return out;
    };
    collect_items(doc, &scene_.layers, frame, 0, None, false, None, &mut out);
    out
}

/// Point-in-rotated-rect test (rotation around the rect CENTER).
fn rect_contains(r: &RectItem, px: f64, py: f64) -> bool {
    if r.rotation == 0.0 {
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }
    let cx = r.x + r.w / 2.0;
    let cy = r.y + r.h / 2.0;
    let rad = -r.rotation.to_radians();
    let (cos, sin) = (rad.cos(), rad.sin());
    let dx = px - cx;
    let dy = py - cy;
    let lx = dx * cos - dy * sin;
    let ly = dx * sin + dy * cos;
    lx.abs() <= r.w / 2.0 && ly.abs() <= r.h / 2.0
}

/// Axis-aligned bounding box size of a w×h rect rotated by `deg` degrees.
fn rotated_aabb(deg: f64, w: f64, h: f64) -> (f64, f64) {
    let rad = deg.to_radians();
    let (cos, sin) = (rad.cos().abs(), rad.sin().abs());
    (w * cos + h * sin, w * sin + h * cos)
}

fn aabb_overlaps(it: &RectItem, left: f64, right: f64, top: f64, bottom: f64) -> bool {
    let (aabb_w, aabb_h) = rotated_aabb(it.rotation, it.w, it.h);
    let cx = it.x + it.w / 2.0;
    let cy = it.y + it.h / 2.0;
    cx - aabb_w / 2.0 <= right
        && cx + aabb_w / 2.0 >= left
        && cy - aabb_h / 2.0 <= bottom
        && cy + aabb_h / 2.0 >= top
}

/// All top-level node ids whose rendered geometry touches the marquee rect
/// (contact ON). Instances are matched when ANY of their flattened content
/// overlaps; the instance id is returned (Part 03 — click selects the instance).
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
        let states = node_states_at(doc, layer, frame);
        for id in layer.content_at(frame) {
            let Some(t) = states.get(&id).cloned() else {
                continue;
            };
            match doc.nodes.get(&id) {
                Some(Node::Rect { width, height, .. }) => {
                    let it = RectItem {
                        id: id.0,
                        x: t.x,
                        y: t.y,
                        w: width * t.scale_x,
                        h: height * t.scale_y,
                        rotation: t.rotation,
                        fill: String::new(),
                        stroke: None,
                        stroke_width: 0.0,
                        outline_color: None,
                    };
                    if aabb_overlaps(&it, left, right, top, bottom) {
                        out.push(id);
                    }
                }
                Some(Node::SymbolInstance {
                    symbol_id,
                    loop_mode,
                    first_frame,
                    ..
                }) => {
                    let Some(sym) = doc.symbol(*symbol_id) else {
                        continue;
                    };
                    // content overlap OR the empty-instance marker (so an empty
                    // symbol can still be marquee-selected).
                    let (minx, miny, maxx, maxy) =
                        instance_select_bounds(doc, sym, *loop_mode, *first_frame, frame, &t);
                    if minx <= right && maxx >= left && miny <= bottom && maxy >= top {
                        out.push(id);
                    }
                }
                None => {}
            }
        }
    }
    out
}

/// Recursive hit test into a layer stack (top layer first, front node first).
/// Returns the OUTERMOST node id — clicking an instance selects the instance
/// (double-click drills in, a later unit), never its inner rect.
fn hit_layers(
    doc: &Document,
    layers: &[Layer],
    frame: u32,
    x: f64,
    y: f64,
    depth: u32,
) -> Option<NodeId> {
    for layer in layers.iter().rev() {
        if !layer_and_ancestors_visible(layers, layer)
            || !layer_and_ancestors_unlocked(layers, layer)
        {
            continue;
        }
        let states = node_states_at(doc, layer, frame);
        for id in layer.content_at(frame).into_iter().rev() {
            let Some(t) = states.get(&id).cloned() else {
                continue;
            };
            match doc.nodes.get(&id) {
                Some(Node::Rect {
                    width,
                    height,
                    fill,
                    stroke,
                    stroke_width,
                    ..
                }) => {
                    let it = RectItem {
                        id: id.0,
                        x: t.x,
                        y: t.y,
                        w: width * t.scale_x,
                        h: height * t.scale_y,
                        rotation: t.rotation,
                        fill: fill.clone(),
                        stroke: stroke.clone(),
                        stroke_width: *stroke_width,
                        outline_color: None,
                    };
                    if rect_contains(&it, x, y) {
                        return Some(id);
                    }
                }
                Some(Node::SymbolInstance {
                    symbol_id,
                    loop_mode,
                    first_frame,
                    ..
                }) => {
                    if depth >= MAX_DEPTH {
                        continue;
                    }
                    let Some(sym) = doc.symbol(*symbol_id) else {
                        continue;
                    };
                    let child = instance_child_frame(sym, *loop_mode, *first_frame, frame);
                    let (lx, ly) = inverse_point(&t, x, y);
                    if hit_layers(doc, &sym.timeline, child, lx, ly, depth + 1).is_some() {
                        return Some(id);
                    }
                    // EMPTY symbol: no content to hit — fall back to the
                    // deterministic marker so the instance stays selectable.
                    let (minx, miny, maxx, maxy) =
                        instance_select_bounds(doc, sym, *loop_mode, *first_frame, frame, &t);
                    if x >= minx && x <= maxx && y >= miny && y <= maxy {
                        return Some(id);
                    }
                }
                None => {}
            }
        }
    }
    None
}

/// Hit test at (x,y): top layer first, front node first; locked/hidden skipped
/// (REQ-SEL-001); rotation-aware; recurses into symbol instances.
pub fn hit_test(doc: &Document, scene: usize, frame: u32, x: f64, y: f64) -> Option<NodeId> {
    let scene_ = doc.scene(scene)?;
    hit_layers(doc, &scene_.layers, frame, x, y, 0)
}

/// Axis-aligned bounds of a node's rendered appearance at `frame` (scene-wide).
/// Used to compute the selection bounds for Convert-to-Symbol's registration
/// grid. Recurses into symbol instances (depth-capped). Empty symbol instances
/// report a deterministic minimal marker so they remain selectable (honest
/// placeholder — NOT rendered artwork; it never enters evaluate/export).
pub(crate) fn node_bounds(
    doc: &Document,
    scene: usize,
    frame: u32,
    id: NodeId,
) -> Option<(f64, f64, f64, f64)> {
    let t = node_transform_in_scene(doc, scene, frame, id)?;
    match doc.nodes.get(&id)? {
        Node::Rect { width, height, .. } => {
            let w = width * t.scale_x;
            let h = height * t.scale_y;
            let (aw, ah) = rotated_aabb(t.rotation, w, h);
            let cx = t.x + w / 2.0;
            let cy = t.y + h / 2.0;
            Some((cx - aw / 2.0, cy - ah / 2.0, cx + aw / 2.0, cy + ah / 2.0))
        }
        Node::SymbolInstance {
            symbol_id,
            loop_mode,
            first_frame,
            ..
        } => {
            let sym = doc.symbol(*symbol_id)?;
            Some(instance_select_bounds(
                doc,
                sym,
                *loop_mode,
                *first_frame,
                frame,
                &t,
            ))
        }
    }
}

/// Deterministic selectable size (doc units) for an EMPTY symbol instance.
/// [OUR DESIGN DECISION] — the blueprint gives no marker size; 24px is a small,
/// clearly-clickable placeholder that never leaks into render/export.
pub const EMPTY_INSTANCE_MARKER: f64 = 24.0;

/// Flattened render bounds of a symbol instance at `frame` (doc space), or
/// `None` when the symbol has no drawable content at that frame.
fn instance_content_bounds(
    doc: &Document,
    sym: &Symbol,
    loop_mode: LoopMode,
    first_frame: u32,
    frame: u32,
    t: &Transform,
) -> Option<(f64, f64, f64, f64)> {
    let child = instance_child_frame(sym, loop_mode, first_frame, frame);
    let mut items = Vec::new();
    collect_items(
        doc,
        &sym.timeline,
        child,
        1,
        Some(t),
        true,
        None,
        &mut items,
    );
    let mut minx = f64::INFINITY;
    let mut miny = f64::INFINITY;
    let mut maxx = f64::NEG_INFINITY;
    let mut maxy = f64::NEG_INFINITY;
    for it in items {
        let (aw, ah) = rotated_aabb(it.rotation, it.w, it.h);
        let cx = it.x + it.w / 2.0;
        let cy = it.y + it.h / 2.0;
        minx = minx.min(cx - aw / 2.0);
        miny = miny.min(cy - ah / 2.0);
        maxx = maxx.max(cx + aw / 2.0);
        maxy = maxy.max(cy + ah / 2.0);
    }
    if minx.is_finite() {
        Some((minx, miny, maxx, maxy))
    } else {
        None
    }
}

/// Selection bounds for a symbol instance: real content bounds when present,
/// otherwise a deterministic minimal marker around the instance origin so empty
/// symbols stay selectable (Part 11 §11.0 — an instance is a placed reference;
/// it must be selectable even before it has art).
fn instance_select_bounds(
    doc: &Document,
    sym: &Symbol,
    loop_mode: LoopMode,
    first_frame: u32,
    frame: u32,
    t: &Transform,
) -> (f64, f64, f64, f64) {
    match instance_content_bounds(doc, sym, loop_mode, first_frame, frame, t) {
        Some(b) => b,
        None => {
            let m = EMPTY_INSTANCE_MARKER / 2.0;
            (t.x - m, t.y - m, t.x + m, t.y + m)
        }
    }
}
