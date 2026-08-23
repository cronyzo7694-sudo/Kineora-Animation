//! A3 / D-0010 acceptance tests — E-AI-2 scene snapshot, E-AI-3
//! selection-by-ids, E-AI-4 revision counter, E-AI-5 capability manifest.

use animator_core::{Session, Settings, ShapeKind, SymbolType};

fn session() -> Session {
    Session::new(Settings::default())
}

fn snap(s: &Session) -> serde_json::Value {
    serde_json::from_str(&s.scene_snapshot()).expect("snapshot parses as JSON")
}

#[test]
fn fresh_document_snapshot_has_empty_truthful_shape() {
    let s = session();
    let v = snap(&s);
    assert_eq!(v["v"], 1);
    assert_eq!(v["rev"], 0, "fresh document starts at revision 0");
    assert_eq!(v["settings"]["fps"], 24);
    assert_eq!(v["settings"]["w"], 1920.0);
    assert_eq!(v["scene"]["name"], "Scene 1");
    assert_eq!(v["playhead"], 1);
    assert_eq!(v["counts"]["layers"], 1);
    assert_eq!(v["counts"]["nodes"], 0);
    assert_eq!(v["counts"]["symbols"], 0);
    assert_eq!(v["layers"][0]["kind"], "normal");
    assert_eq!(v["layers"][0]["vis"], true);
    assert_eq!(v["selection"].as_array().unwrap().len(), 0);
    assert_eq!(v["nodes"].as_array().unwrap().len(), 0);
}

#[test]
fn drawn_shapes_appear_with_compact_geometry_and_membership() {
    let mut s = session();
    let id = s.draw_shape(ShapeKind::Oval, 930.0, 100.0, 60.0, 60.0, "#e11d48", None, 1.0);
    assert!(id.0 > 0);
    let v = snap(&s);
    let node = &v["nodes"][0];
    assert_eq!(node["id"], id.0);
    assert_eq!(node["kind"], "oval");
    assert_eq!(node["fill"], "#e11d48");
    assert!(node.get("stroke").is_none(), "null stroke omitted compactly");
    assert_eq!(node["kf"], serde_json::json!([[0, 1]]));
    // Selection ids flow through.
    assert_eq!(v["selection"], serde_json::json!([id.0]));
}

#[test]
fn revision_bumps_on_execute_undo_and_redo() {
    let mut s = session();
    assert_eq!(s.doc_revision(), 0);
    s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    assert_eq!(s.doc_revision(), 1, "execute bumps");
    s.undo();
    assert_eq!(s.doc_revision(), 2, "undo bumps (state changed)");
    s.redo();
    assert_eq!(s.doc_revision(), 3, "redo bumps");
    // A snapshot taken now must carry the CURRENT revision.
    assert_eq!(snap(&s)["rev"], 3);
}

#[test]
fn classic_tween_and_keyframes_appear_in_layer_rows() {
    let mut s = session();
    s.draw_shape(ShapeKind::Oval, 10.0, 10.0, 20.0, 20.0, "#ff0000", None, 1.0);
    assert!(s.insert_keyframe(15));
    assert!(s.set_classic_tween(0, 1, 15, 60.0));
    let v = snap(&s);
    let layer = &v["layers"][0];
    let kfs: Vec<u64> = layer["kf"]
        .as_array()
        .unwrap()
        .iter()
        .map(|k| k["f"].as_u64().unwrap())
        .collect();
    assert_eq!(kfs, vec![1, 15]);
    assert_eq!(layer["tw"][0]["s"], 1);
    assert_eq!(layer["tw"][0]["e"], 15);
    assert_eq!(layer["tw"][0]["ease"], 60.0);
    assert_eq!(v["counts"]["tweens"], 1);
}

#[test]
fn blank_keyframes_are_visible_as_blank() {
    let mut s = session();
    s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    assert!(s.insert_blank_keyframe(10));
    let v = snap(&s);
    let kf10 = v["layers"][0]["kf"]
        .as_array()
        .unwrap()
        .iter()
        .find(|k| k["f"] == 10)
        .unwrap()
        .clone();
    assert_eq!(kf10["blank"], true, "blank frames CLEAR content — must be visible");
}

#[test]
fn symbol_instances_and_library_rows_appear() {
    let mut s = session();
    let sym = s.new_symbol("Ball", SymbolType::Graphic);
    let inst = s.place_symbol(sym, 100.0, 100.0);
    assert!(inst.0 > 0);
    let v = snap(&s);
    assert_eq!(v["library"][0]["name"], "Ball");
    assert_eq!(v["library"][0]["type"], "graphic");
    let node = v["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|n| n["kind"] == "symbol")
        .expect("symbol instance row")
        .clone();
    assert_eq!(node["sym"], sym.0);
    assert_eq!(node["lp"], "loop");
}

#[test]
fn set_selection_selects_by_ids_and_prunes_unknown() {
    let mut s = session();
    let a = s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    let b = s.draw_shape(ShapeKind::Oval, 50.0, 50.0, 10.0, 10.0, "#ff0000", None, 1.0);
    // draw_shape auto-selects the newest; set_selection takes full control.
    let kept = s.set_selection(vec![a, b]);
    assert_eq!(kept, 2);
    assert_eq!(s.selection, vec![a, b]);
    // Unknown/garbage ids drop out.
    let kept = s.set_selection(vec![a, animator_core::NodeId(999_999)]);
    assert_eq!(kept, 1);
    assert_eq!(s.selection, vec![a]);
}

#[test]
fn set_selection_is_view_state_not_an_undo_entry_and_keeps_rev() {
    let mut s = session();
    let a = s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    let rev_before = s.doc_revision();
    s.set_selection(vec![a]);
    assert_eq!(s.doc_revision(), rev_before, "selection never bumps the revision");
    assert!(s.undo(), "the only undoable entry is the DRAW, not the selection");
    assert_eq!(s.doc.nodes.len(), 0, "the draw reverted — no phantom entries");
}

#[test]
fn set_selection_prunes_nodes_not_on_the_current_frame() {
    let mut s = session();
    let a = s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    assert!(s.insert_blank_keyframe(10));
    s.set_playhead(10);
    let kept = s.set_selection(vec![a]);
    assert_eq!(kept, 0, "frame 10 is blank — nothing is selectable there");
    s.set_playhead(1);
    assert_eq!(s.set_selection(vec![a]), 1);
}

#[test]
fn capability_manifest_matches_the_current_engine_exactly() {
    let v: serde_json::Value =
        serde_json::from_str(&animator_core::snapshot::capabilities()).expect("manifest parses");
    assert_eq!(v["manifestFormat"], "kineora-ai-manifest");
    assert_eq!(v["shapes"], serde_json::json!(["rect", "oval"]));
    assert_eq!(v["nodeFamilies"], serde_json::json!(["shape", "symbol"]));
    let f = &v["features"];
    // Present today:
    for k in ["classicTween", "perKeyTransform", "symbols", "folders", "strokeAtDraw", "selectionByIds", "compositeUndo"] {
        assert_eq!(f[k], true, "{k} must be supported on this build");
    }
    // Honestly absent today (audit Q14):
    for k in ["playbackAutomation", "nodeOpacity", "namedEasings", "paths", "text", "motionTween", "shapeTween", "masks", "camera", "audio"] {
        assert_eq!(f[k], false, "{k} must honestly report unsupported");
    }
}

#[test]
fn snapshot_is_active_scene_scoped_and_compact() {
    let mut s = session();
    s.draw_shape(ShapeKind::Rect, 0.0, 0.0, 10.0, 10.0, "#000000", None, 1.0);
    let text = s.scene_snapshot();
    // Compactness guard: short keys, no whitespace — a busy frame stays small.
    assert!(text.len() < 4000, "snapshot must stay token-friendly");
    assert!(!text.contains("\"outline\""), "false-flag fields are omitted compactly");
}
