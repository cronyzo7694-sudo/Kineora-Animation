//! E-AI-2 + E-AI-5 (A3, D-0010) — compact semantic scene snapshot and the
//! trusted runtime capability manifest.
//!
//! Both functions are READ-ONLY by construction (they take `&Session` and
//! never mutate; "snapshot is read-only" — AI-REQ-003). Field names are kept
//! short on purpose: this JSON is LLM context, so every byte costs tokens
//! (06_SCENE_SNAPSHOT_RESEARCH). Aliasing/truncation for the prompt happens in
//! the UI-side `ai/snapshot.ts` service; this layer returns stable truth.
//!
//! NOTHING secret ever flows through here: the snapshot contains document
//! structure only — no keys, no file paths, no clipboard, no pixels
//! (AI-REQ-002), and only the ACTIVE scene (per-document scoping).

use crate::model::{Document, Frame, Layer, LayerKind, LoopMode, Node, ShapeKind, SymbolType};
use crate::session::Session;
use serde::Serialize;
use std::collections::BTreeMap;

// ---------------------------------------------------------------------------
// E-AI-2 — scene snapshot
// ---------------------------------------------------------------------------

fn is_false(b: &bool) -> bool {
    !*b
}

#[derive(Serialize)]
struct SnapSettings {
    w: f64,
    h: f64,
    fps: u32,
    bg: String,
    #[serde(rename = "bgA")]
    bg_a: f64,
}

#[derive(Serialize)]
struct SnapScene {
    i: usize,
    name: String,
    count: usize,
}

#[derive(Serialize)]
struct SnapCounts {
    layers: usize,
    nodes: usize,
    keyframes: usize,
    tweens: usize,
    symbols: usize,
}

fn is_zero(v: &usize) -> bool {
    *v == 0
}

#[derive(Serialize)]
struct SnapKf {
    f: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    label: Option<String>,
    /// Blank frames CLEAR held content — the model must see them explicitly.
    #[serde(skip_serializing_if = "is_false")]
    blank: bool,
    /// Content id count (keyframes only); omitted when empty.
    #[serde(skip_serializing_if = "is_zero")]
    n: usize,
}

#[derive(Serialize)]
struct SnapTween {
    s: u32,
    e: u32,
    ease: f64,
}

#[derive(Serialize)]
struct SnapLayer {
    i: usize,
    id: u64,
    name: String,
    kind: &'static str,
    vis: bool,
    lock: bool,
    #[serde(skip_serializing_if = "is_false")]
    outline: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    oc: Option<String>,
    /// Parent folder's LAYER ID (organizational only).
    #[serde(skip_serializing_if = "Option::is_none")]
    parent: Option<u64>,
    #[serde(skip_serializing_if = "is_false")]
    collapsed: bool,
    kf: Vec<SnapKf>,
    tw: Vec<SnapTween>,
}

#[derive(Serialize, Default)]
struct SnapNode {
    id: u64,
    kind: String,
    /// Keyframes whose content includes this node: [layer_index, frame] pairs.
    kf: Vec<(usize, u32)>,
    // Shape rows ----------------------------------------------------------
    #[serde(skip_serializing_if = "Option::is_none")]
    x: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    y: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sx: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sy: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    r: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    w: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    h: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    fill: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stroke: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sw: Option<f64>,
    // Symbol rows ---------------------------------------------------------
    #[serde(skip_serializing_if = "Option::is_none")]
    sym: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    lp: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ff: Option<u32>,
}

#[derive(Serialize)]
struct SnapSymbol {
    id: u64,
    name: String,
    #[serde(rename = "type")]
    symbol_type: &'static str,
    uses: u32,
    dur: u32,
}

#[derive(Serialize)]
struct SnapRoot {
    /// Snapshot format marker (bump on shape change; UI parser refuses others).
    v: u32,
    /// E-AI-4 revision at build time (staleness detection).
    rev: u64,
    settings: SnapSettings,
    scene: SnapScene,
    active_layer: usize,
    playhead: u32,
    duration: u32,
    selection: Vec<u64>,
    counts: SnapCounts,
    layers: Vec<SnapLayer>,
    nodes: Vec<SnapNode>,
    library: Vec<SnapSymbol>,
}

fn shape_kind_name(k: ShapeKind) -> &'static str {
    // Exhaustive ON PURPOSE: adding a ShapeKind variant breaks this match —
    // the compiler forces this manifest/snapshot to stay truthful (single
    // source of truth; AI-REQ-111).
    match k {
        ShapeKind::Rect => "rect",
        ShapeKind::Oval => "oval",
    }
}

fn symbol_type_name(t: &SymbolType) -> &'static str {
    match t {
        SymbolType::Graphic => "graphic",
        SymbolType::MovieClip => "movieclip",
        SymbolType::Button => "button",
    }
}

fn loop_mode_name(m: &LoopMode) -> &'static str {
    match m {
        LoopMode::Loop => "loop",
        LoopMode::PlayOnce => "once",
        LoopMode::SingleFrame => "single",
    }
}

fn layer_row(i: usize, l: &Layer) -> SnapLayer {
    let kf = l
        .keyframes
        .iter()
        .map(|(f, fr)| SnapKf {
            f: *f,
            label: fr.label().map(str::to_string),
            blank: matches!(fr, Frame::Blank),
            n: match fr {
                Frame::Keyframe { content, .. } => content.len(),
                Frame::Blank => 0,
            },
        })
        .collect();
    let tw = l
        .tweens
        .iter()
        .map(|(s, t)| SnapTween {
            s: *s,
            e: t.end,
            ease: t.ease,
        })
        .collect();
    SnapLayer {
        i,
        id: l.id.0,
        name: l.name.clone(),
        kind: match l.kind {
            LayerKind::Normal => "normal",
            LayerKind::Folder => "folder",
        },
        vis: l.visible,
        lock: l.locked,
        outline: l.outline,
        oc: if l.outline { Some(l.outline_color.clone()) } else { None },
        parent: l.parent_id.map(|p| p.0),
        collapsed: l.collapsed,
        kf,
        tw,
    }
}

/// Compact semantic snapshot of the ACTIVE scene (Tier 0+1 of
/// 06_SCENE_SNAPSHOT_RESEARCH). `""` only when the active scene is missing.
pub fn scene_snapshot(session: &Session) -> String {
    let doc = &session.doc;
    let Some(scene) = doc.scene(session.active_scene) else {
        return "{}".to_string();
    };

    // Node membership: which keyframes (layer index, frame) reference each id.
    let mut membership: BTreeMap<u64, Vec<(usize, u32)>> = BTreeMap::new();
    let mut keyframe_count = 0usize;
    let mut tween_count = 0usize;
    for (li, layer) in scene.layers.iter().enumerate() {
        tween_count += layer.tweens.len();
        for (f, fr) in &layer.keyframes {
            keyframe_count += 1;
            if let Frame::Keyframe { content, .. } = fr {
                for id in content {
                    membership.entry(id.0).or_default().push((li, *f));
                }
            }
        }
    }

    let mut nodes: Vec<SnapNode> = Vec::with_capacity(membership.len());
    for (id, kf) in &membership {
        let Some(node) = doc.nodes.get(&crate::id::NodeId(*id)) else {
            continue;
        };
        let mut row = SnapNode {
            id: *id,
            kind: String::new(),
            kf: kf.clone(),
            ..SnapNode::default()
        };
        match node {
            Node::Rect {
                transform,
                width,
                height,
                fill,
                stroke,
                stroke_width,
                shape,
                ..
            } => {
                row.kind = shape_kind_name(*shape).to_string();
                row.x = Some(transform.x);
                row.y = Some(transform.y);
                row.sx = Some(transform.scale_x);
                row.sy = Some(transform.scale_y);
                row.r = Some(transform.rotation);
                row.w = Some(*width);
                row.h = Some(*height);
                row.fill = Some(fill.clone());
                row.stroke = stroke.clone();
                row.sw = Some(*stroke_width);
            }
            Node::SymbolInstance {
                transform,
                symbol_id,
                loop_mode,
                first_frame,
                ..
            } => {
                row.kind = "symbol".to_string();
                row.x = Some(transform.x);
                row.y = Some(transform.y);
                row.sx = Some(transform.scale_x);
                row.sy = Some(transform.scale_y);
                row.r = Some(transform.rotation);
                row.sym = Some(symbol_id.0);
                row.lp = Some(loop_mode_name(loop_mode));
                row.ff = Some(*first_frame);
            }
        }
        nodes.push(row);
    }

    let root = SnapRoot {
        v: 1,
        rev: session.doc_revision(),
        settings: SnapSettings {
            w: doc.settings.width,
            h: doc.settings.height,
            fps: doc.settings.fps,
            bg: doc.settings.background.clone(),
            bg_a: doc.settings.background_alpha,
        },
        scene: SnapScene {
            i: session.active_scene,
            name: scene.name.clone(),
            count: doc.scenes.len(),
        },
        active_layer: session.active_layer,
        playhead: session.playhead,
        duration: doc.timeline_duration(session.active_scene),
        selection: session.selection.iter().map(|id| id.0).collect(),
        counts: SnapCounts {
            layers: scene.layers.len(),
            nodes: nodes.len(),
            keyframes: keyframe_count,
            tweens: tween_count,
            symbols: doc.library.len(),
        },
        layers: scene
            .layers
            .iter()
            .enumerate()
            .map(|(i, l)| layer_row(i, l))
            .collect(),
        nodes,
        library: doc
            .library
            .iter()
            .map(|s| SnapSymbol {
                id: s.id.0,
                name: s.name.clone(),
                symbol_type: symbol_type_name(&s.symbol_type),
                uses: doc.symbol_use_count(s.id),
                dur: s.duration(),
            })
            .collect(),
    };

    serde_json::to_string(&root).unwrap_or_else(|_| "{}".to_string())
}

// ---------------------------------------------------------------------------
// E-AI-5 — trusted runtime capability manifest
// ---------------------------------------------------------------------------

/// Enumerate shape kinds THROUGH the exhaustive matcher so a new variant is a
/// compile error here until the manifest is updated (the single source of
/// truth trick — AI-REQ-111: no second hand-maintained AI capability list).
fn all_shape_kinds() -> Vec<&'static str> {
    [ShapeKind::Rect, ShapeKind::Oval]
        .iter()
        .map(|k| shape_kind_name(*k))
        .collect()
}

/// The engine's honest capability manifest. `features` flags flip ONLY when the
/// corresponding engine increment actually lands; anything absent-or-false is
/// treated as unavailable by the AI registry downstream (spec 07 manifest v0
/// mirrors 02_CURRENT_ENGINE_AUDIT exactly).
pub fn capabilities() -> String {
    let manifest = serde_json::json!({
        "v": 1,
        "engine": "kineora-core",
        "manifestFormat": "kineora-ai-manifest",
        // Shape kinds the shape pipeline can draw/hit-test/export today.
        "shapes": all_shape_kinds(),
        // Node families: "shape" = parametric rect/oval nodes; "symbol" =
        // placed symbol instances. (text/path/bitmap families do not exist.)
        "nodeFamilies": ["shape", "symbol"],
        "features": {
            "classicTween": true,      // Part 09.5 spans, numeric ease only
            "perKeyTransform": true,   // per-keyframe transform overrides
            "symbols": true,           // convert/create/place/swap/loop/delete
            "folders": true,           // F-20-05 layer folders w/ guards
            "instanceLoopModes": true, // graphic loop/play-once/single-frame
            "scenes": true,            // create scene (switch/delete pending)
            "frameLabels": true,       // Part 07 §7.2
            "arrangeAlign": true,      // arrange + align ops
            "strokeAtDraw": true,      // E1: stroke params on draw
            "selectionByIds": true,    // E-AI-3 (this build)
            "compositeUndo": true,     // E-AI-1 (this build)
            "nodeOpacity": false,      // no per-node alpha field (audit Q8)
            "namedEasings": false,     // Penner lib exists, NOT wired to tweens
            "paths": false,            // PATH model pending (tools lane E2)
            "text": false,             // no text node kind
            "motionTween": false,
            "shapeTween": false,
            "masks": false,
            "camera": false,
            "audio": false,
        },
    });
    serde_json::to_string(&manifest).unwrap_or_else(|_| "{}".to_string())
}

/// Kept for future per-document manifest extensions (e.g. platform-specific
/// capability trims) — today the manifest is engine-global.
pub fn capabilities_for(_doc: &Document) -> String {
    capabilities()
}
