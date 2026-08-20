//! Properties panel acceptance tests — the PROPERTIES PANEL unit (Phase 4,
//! Part 26). Verifies base-property edits (width/height/fill/stroke), transform
//! field edits at interpolated frames (no jump), document settings edits, and
//! exact undo/redo + one-command-per-commit semantics.

use animator_core::{NodeId, NodePropsPatch, Session, Settings, SettingsPatch, TransformPatch};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn set_node_props_edits_base_and_undo_redo_exact() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 100.0, 50.0, "#ff0000");

    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            width: Some(200.0),
            fill: Some("#00ff00".into()),
            stroke_enabled: Some(true),
            stroke: Some("#000000".into()),
            stroke_width: Some(2.0),
            ..Default::default()
        },
    )]);

    let it = &s.evaluate(1)[0];
    assert_eq!((it.w, it.h, it.fill.as_str()), (200.0, 50.0, "#00ff00"));
    assert_eq!(it.stroke.as_deref(), Some("#000000"));
    assert_eq!(it.stroke_width, 2.0);

    s.undo();
    let it = &s.evaluate(1)[0];
    assert_eq!((it.w, it.h, it.fill.as_str()), (100.0, 50.0, "#ff0000"));
    assert_eq!(it.stroke, None, "undo restores exact before-state");

    s.redo();
    let it = &s.evaluate(1)[0];
    assert_eq!(it.w, 200.0);
    assert_eq!(it.stroke.as_deref(), Some("#000000"));
}

#[test]
fn stroke_props_flow_into_evaluate_and_svg_export() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(true),
            stroke: Some("#0000ff".into()),
            stroke_width: Some(10.0),
            ..Default::default()
        },
    )]);

    let it = &s.evaluate(1)[0];
    assert_eq!(
        it.stroke.as_deref(),
        Some("#0000ff"),
        "stroke color in render tree"
    );
    assert_eq!(it.stroke_width, 10.0, "stroke width in render tree");
    assert_eq!(it.fill, "#ff0000", "fill untouched by stroke edit");

    let svg = s.export_svg(1);
    assert!(
        svg.contains(r##"stroke="#0000ff" stroke-width="10""##),
        "SVG carries stroke color + width: {svg}"
    );
}

#[test]
fn fill_change_flows_into_export_and_survives_save_load() {
    let path = std::env::temp_dir().join("animator_fill_test.json");
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            fill: Some("#123abc".into()),
            ..Default::default()
        },
    )]);
    assert_eq!(s.evaluate(1)[0].fill, "#123abc");
    assert!(s.export_svg(1).contains(r##"fill="#123abc""##));

    s.save(&path).unwrap();
    let loaded = Session::load(&path).unwrap();
    assert_eq!(
        loaded.evaluate(1)[0].fill,
        "#123abc",
        "fill survives save/load"
    );
    let _ = std::fs::remove_file(&path);
}

#[test]
fn stroke_enable_then_recolor_is_undoable_step_by_step() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    // 1) enable stroke with black
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(true),
            stroke: Some("#000000".into()),
            ..Default::default()
        },
    )]);
    assert_eq!(s.evaluate(1)[0].stroke.as_deref(), Some("#000000"));
    // 2) recolor to blue
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(true),
            stroke: Some("#0000ff".into()),
            ..Default::default()
        },
    )]);
    assert_eq!(s.evaluate(1)[0].stroke.as_deref(), Some("#0000ff"));

    s.undo();
    assert_eq!(
        s.evaluate(1)[0].stroke.as_deref(),
        Some("#000000"),
        "undo recolor"
    );
    s.undo();
    assert_eq!(s.evaluate(1)[0].stroke, None, "undo enable");
}

#[test]
fn stroke_disable_removes_stroke() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(true),
            stroke: Some("#123456".into()),
            stroke_width: Some(3.0),
            ..Default::default()
        },
    )]);
    assert_eq!(s.evaluate(1)[0].stroke.as_deref(), Some("#123456"));

    s.set_node_props(vec![(
        id,
        NodePropsPatch {
            stroke_enabled: Some(false),
            ..Default::default()
        },
    )]);
    assert_eq!(s.evaluate(1)[0].stroke, None, "stroke_enabled=false clears");
}

#[test]
fn patch_transform_at_interpolated_frame_does_not_jump() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // frame 1 @ (0,0)
    s.insert_keyframe(10);
    s.move_selection(100.0, 0.0); // frame 10 @ (100,0) → animated 0→100
    assert!(s.set_classic_tween(0, 1, 10, 0.0)); // explicit tween (Part 08 §8.0)

    s.set_playhead(5);
    let before = s.evaluate(5)[0].clone();
    assert!((before.x - 44.44).abs() < 0.5, "pre x={}", before.x);

    // edit X only (+10): y/scale/rotation must stay at interpolated values
    s.patch_node_transforms(vec![(
        id,
        TransformPatch {
            x: Some(before.x + 10.0),
            ..Default::default()
        },
    )]);
    let after = s.evaluate(5)[0].clone();
    assert!((after.x - 54.44).abs() < 0.5, "post x={}", after.x);
    assert!((after.y - before.y).abs() < 0.5, "y unchanged");
    assert_eq!(after.rotation, before.rotation, "rotation unchanged");
    assert_eq!(after.w, before.w, "scale unchanged");

    s.undo();
    let reverted = s.evaluate(5)[0].clone();
    assert!(
        (reverted.x - before.x).abs() < 1e-9,
        "undo restores interpolated"
    );
    assert!(!s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));

    s.redo();
    let redone = s.evaluate(5)[0].clone();
    assert!((redone.x - 54.44).abs() < 0.5);
}

#[test]
fn patch_transform_noop_creates_no_command() {
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    let n = s.history.undo_len();
    s.patch_node_transforms(vec![(
        id,
        TransformPatch {
            x: Some(0.0),
            ..Default::default()
        },
    )]);
    assert_eq!(s.history.undo_len(), n, "no-op patch is not a command");
}

#[test]
fn set_document_settings_undo_redo_exact() {
    let mut s = session();
    assert!(s.set_document_settings(SettingsPatch {
        width: Some(1280.0),
        height: Some(720.0),
        fps: Some(30),
        background: Some("#202020".into()),
    }));
    assert_eq!(s.doc.settings.width, 1280.0);
    assert_eq!(s.doc.settings.height, 720.0);
    assert_eq!(s.doc.settings.fps, 30);
    assert_eq!(s.doc.settings.background, "#202020");

    s.undo();
    assert_eq!(s.doc.settings.width, 1920.0);
    assert_eq!(s.doc.settings.fps, 24);
    assert_eq!(s.doc.settings.background, "#ffffff");

    s.redo();
    assert_eq!(s.doc.settings.width, 1280.0);
    assert_eq!(s.doc.settings.fps, 30);
}

#[test]
fn document_settings_are_validated() {
    let mut s = session();
    s.set_document_settings(SettingsPatch {
        width: Some(-5.0), // clamped ≥ 2
        fps: Some(1000),   // clamped ≤ 120
        ..Default::default()
    });
    assert_eq!(s.doc.settings.width, 2.0);
    assert_eq!(s.doc.settings.fps, 120);
}

#[test]
fn multi_node_patch_is_one_command() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    s.create_layer();
    let b = s.draw_rect(100.0, 0.0, 50.0, 50.0, "#222222");

    let n = s.history.undo_len();
    s.set_node_props(vec![
        (
            a,
            NodePropsPatch {
                width: Some(80.0),
                ..Default::default()
            },
        ),
        (
            b,
            NodePropsPatch {
                width: Some(90.0),
                ..Default::default()
            },
        ),
    ]);
    assert_eq!(
        s.history.undo_len(),
        n + 1,
        "one command for multi-node edit"
    );
    assert_eq!(s.evaluate(1)[0].w, 80.0);
    assert_eq!(s.evaluate(1)[1].w, 90.0);

    s.undo();
    assert_eq!(s.evaluate(1)[0].w, 50.0);
    assert_eq!(s.evaluate(1)[1].w, 50.0);
}

#[test]
fn transform_patch_targets_node_on_its_own_layer() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 1
    s.create_layer(); // active = layer 2
    let b = s.draw_rect(200.0, 0.0, 50.0, 50.0, "#222222"); // layer 2

    // marquee-select both across layers
    s.select_in_rect(-10.0, -10.0, 300.0, 300.0);
    assert_eq!(s.selection.len(), 2);

    // active layer is 2; patch must move BOTH nodes (each on its own layer)
    s.patch_node_transforms(vec![
        (
            a,
            TransformPatch {
                x: Some(5.0),
                ..Default::default()
            },
        ),
        (
            b,
            TransformPatch {
                x: Some(250.0),
                ..Default::default()
            },
        ),
    ]);
    let items = s.evaluate(1);
    assert_eq!(items[0].x, 5.0, "node A (layer 1) moved on its own layer");
    assert_eq!(items[1].x, 250.0, "node B (layer 2) moved on its own layer");

    // undo restores both exactly
    s.undo();
    let items = s.evaluate(1);
    assert_eq!(items[0].x, 0.0);
    assert_eq!(items[1].x, 200.0);
}

#[test]
fn selected_transform_is_scene_wide_not_active_layer_only() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 1
    s.create_layer(); // active = layer 2
    s.draw_rect(200.0, 0.0, 50.0, 50.0, "#222222"); // layer 2

    // active layer is 2, but node A lives on layer 1
    let t = s.selected_transform(a);
    assert!(t.is_some(), "transform found scene-wide");
    assert_eq!(t.unwrap().x, 0.0);
}

#[test]
fn move_selection_across_layers_moves_each_on_its_own_layer() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 1
    s.create_layer();
    s.draw_rect(200.0, 0.0, 50.0, 50.0, "#222222"); // layer 2

    s.select_in_rect(-10.0, -10.0, 300.0, 300.0);
    assert_eq!(s.selection.len(), 2);

    s.move_selection(10.0, 0.0);
    let items = s.evaluate(1);
    assert_eq!(items[0].x, 10.0, "layer-1 node moved");
    assert_eq!(items[1].x, 210.0, "layer-2 node moved");

    s.undo();
    let items = s.evaluate(1);
    assert_eq!(items[0].x, 0.0);
    assert_eq!(items[1].x, 200.0);
}

#[test]
fn node_id_newtype_identity_holds_for_patches() {
    // guards the public patch API contract (id newtype, not raw u64 leakage)
    let mut s = session();
    let id = s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert_eq!(id, NodeId(1), "node ids are monotonic from 1");
}
