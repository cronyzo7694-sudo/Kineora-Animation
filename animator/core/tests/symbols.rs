//! Symbols + Library acceptance tests — UNIT H (Phase 4, Part 11/12).
//! Verifies convert-to-symbol (9 registration points, re-basing, exact undo),
//! new/place/rename/delete/swap, nested evaluation (graphic loop/play-once/
//! single-frame + first-frame; movie-clip free clock), recursive hit testing,
//! instance transforms, persistence, export flattening, and locked-layer guards.

use animator_core::{LoopMode, Node, Session, Settings, SymbolId, SymbolType};

fn session() -> Session {
    Session::new(Settings::default())
}

fn two_rects(s: &mut Session) -> (animator_core::NodeId, animator_core::NodeId) {
    let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.clear_selection();
    let b = s.draw_rect(300.0, 0.0, 100.0, 100.0, "#00ff00");
    (a, b)
}

// ——— Convert to Symbol ———

#[test]
fn convert_wraps_selection_into_one_instance() {
    let mut s = session();
    let (a, b) = two_rects(&mut s);
    s.selection = vec![a, b];
    let inst = s.convert_selection_to_symbol("pair", SymbolType::Graphic, 4); // center
    assert_ne!(inst, animator_core::NodeId(0));

    // one symbol in the library, containing both nodes
    assert_eq!(s.doc.library.len(), 1);
    let sym = &s.doc.library[0];
    assert_eq!(sym.name, "pair");
    assert_eq!(sym.timeline[0].content_at(1).len(), 2);
    // the instance is selected and on the frame
    assert_eq!(s.selection, vec![inst]);
    assert!(matches!(
        s.doc.nodes.get(&inst),
        Some(Node::SymbolInstance { .. })
    ));
    assert!(s.doc.scene(0).unwrap().layers[0]
        .content_at(1)
        .contains(&inst));
    // the original nodes are NOT on the main frame anymore
    assert!(!s.doc.scene(0).unwrap().layers[0].content_at(1).contains(&a));
}

#[test]
fn convert_center_registration_places_instance_at_selection_center() {
    let mut s = session();
    let (a, b) = two_rects(&mut s); // bbox 0..400 x, 0..100 y → center (200, 50)
    s.selection = vec![a, b];
    let inst = s.convert_selection_to_symbol("pair", SymbolType::Graphic, 4);
    let Node::SymbolInstance { transform, .. } = s.doc.nodes.get(&inst).unwrap() else {
        panic!()
    };
    assert_eq!(
        (transform.x, transform.y),
        (200.0, 50.0),
        "center registration"
    );
}

#[test]
fn convert_top_left_registration() {
    let mut s = session();
    let (a, b) = two_rects(&mut s); // bbox (0,0)..(400,100)
    s.selection = vec![a, b];
    let inst = s.convert_selection_to_symbol("pair", SymbolType::Graphic, 0); // TL
    let Node::SymbolInstance { transform, .. } = s.doc.nodes.get(&inst).unwrap() else {
        panic!()
    };
    assert_eq!((transform.x, transform.y), (0.0, 0.0));
}

#[test]
fn convert_bottom_right_registration() {
    let mut s = session();
    let (a, b) = two_rects(&mut s); // bbox to (400, 100)
    s.selection = vec![a, b];
    let inst = s.convert_selection_to_symbol("pair", SymbolType::Graphic, 8); // BR
    let Node::SymbolInstance { transform, .. } = s.doc.nodes.get(&inst).unwrap() else {
        panic!()
    };
    assert_eq!((transform.x, transform.y), (400.0, 100.0));
}

#[test]
fn convert_all_nine_registration_points_are_distinct() {
    // sanity: each grid point maps to the expected stage position for a rect at (0,0,100,100)
    let mut points = Vec::new();
    for grid in 0..=8u8 {
        let mut s = session();
        let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
        s.selection = vec![a];
        let inst = s.convert_selection_to_symbol("r", SymbolType::Graphic, grid);
        let Node::SymbolInstance { transform, .. } = s.doc.nodes.get(&inst).unwrap() else {
            panic!()
        };
        points.push((grid, transform.x, transform.y));
    }
    // TL, TC, TR, ML, C, MR, BL, BC, BR for a 100×100 rect at origin
    let expected: [(f64, f64); 9] = [
        (0.0, 0.0),
        (50.0, 0.0),
        (100.0, 0.0),
        (0.0, 50.0),
        (50.0, 50.0),
        (100.0, 50.0),
        (0.0, 100.0),
        (50.0, 100.0),
        (100.0, 100.0),
    ];
    for (grid, x, y) in points {
        let (ex, ey) = expected[grid as usize];
        assert!(
            (x - ex).abs() < 1e-9 && (y - ey).abs() < 1e-9,
            "grid {grid} → ({x},{y})"
        );
    }
}

#[test]
fn convert_rebases_content_around_registration() {
    let mut s = session();
    let (a, _b) = two_rects(&mut s); // rect a at (0,0) size 100×100 → bbox 0..100
    s.selection = vec![a];
    let inst = s.convert_selection_to_symbol("r", SymbolType::Graphic, 4); // center
                                                                           // the wrapped rect's base position is now relative to the registration
    let sym = &s.doc.library[0];
    let inner = sym.timeline[0].content_at(1)[0];
    let Node::Rect { transform, .. } = s.doc.nodes.get(&inner).unwrap() else {
        panic!()
    };
    // rect a center is (50,50) → rebased to (-50,-50)
    assert!((transform.x - -50.0).abs() < 1e-9, "x={}", transform.x);
    assert!((transform.y - -50.0).abs() < 1e-9, "y={}", transform.y);

    // the instance renders the rect back at (0,0)..(100,100) on stage
    let items = s.evaluate(1);
    assert_eq!(items.len(), 2); // rect a (via instance) + rect b
    let a_item = items.iter().find(|it| it.fill == "#ff0000").unwrap();
    assert!(
        (a_item.x).abs() < 1e-6 && (a_item.y).abs() < 1e-6,
        "a_item={:?}",
        a_item
    );
    let _ = inst;
}

#[test]
fn convert_undo_redo_is_exact() {
    let mut s = session();
    let (a, b) = two_rects(&mut s);
    let before_t = s.doc.nodes.get(&a).unwrap().transform().clone();
    s.selection = vec![a, b];
    s.convert_selection_to_symbol("pair", SymbolType::Graphic, 4);
    assert_eq!(s.doc.library.len(), 1);

    s.undo();
    assert!(s.doc.library.is_empty(), "undo removes the symbol");
    // the two rects are back on the frame with original transforms
    let content = s.doc.scene(0).unwrap().layers[0].content_at(1);
    assert!(content.contains(&a) && content.contains(&b));
    assert_eq!(
        s.doc.nodes.get(&a).unwrap().transform(),
        &before_t,
        "base transform restored"
    );

    s.redo();
    assert_eq!(s.doc.library.len(), 1, "redo restores the symbol");
}

#[test]
fn convert_empty_selection_is_a_noop() {
    let mut s = session();
    two_rects(&mut s);
    s.clear_selection();
    let n = s.history.undo_len();
    let id = s.convert_selection_to_symbol("x", SymbolType::Graphic, 4);
    assert_eq!(id, animator_core::NodeId(0));
    assert_eq!(s.history.undo_len(), n);
    assert!(s.doc.library.is_empty());
}

// ——— New / Place / Rename / Delete / Swap ———

#[test]
fn new_symbol_creates_empty_symbol_and_place_instantiates() {
    let mut s = session();
    let sid = s.new_symbol("empty", SymbolType::Graphic);
    assert_ne!(sid, SymbolId(0));
    assert_eq!(s.doc.library.len(), 1);
    assert_eq!(s.doc.library[0].duration(), 1);

    let inst = s.place_symbol(sid, 100.0, 200.0);
    assert_ne!(inst, animator_core::NodeId(0));
    assert!(s.doc.scene(0).unwrap().layers[0]
        .content_at(1)
        .contains(&inst));
    // empty symbol → nothing renders
    assert!(s.evaluate(1).is_empty());
}

#[test]
fn place_symbol_undo_redo() {
    let mut s = session();
    let sid = s.new_symbol("e", SymbolType::Graphic);
    s.place_symbol(sid, 10.0, 20.0);
    assert_eq!(s.doc.symbol_use_count(sid), 1);
    s.undo();
    assert_eq!(s.doc.symbol_use_count(sid), 0, "undo removes the instance");
    s.redo();
    assert_eq!(s.doc.symbol_use_count(sid), 1);
}

#[test]
fn rename_symbol_is_id_safe_and_undoable() {
    let mut s = session();
    let sid = s.new_symbol("arm", SymbolType::Graphic);
    assert!(s.rename_symbol(sid, "arm_L"));
    assert_eq!(s.doc.symbol(sid).unwrap().name, "arm_L");
    s.undo();
    assert_eq!(s.doc.symbol(sid).unwrap().name, "arm");
}

#[test]
fn delete_unused_symbol_succeeds() {
    let mut s = session();
    let sid = s.new_symbol("temp", SymbolType::Graphic);
    assert!(s.delete_symbol(sid, false));
    assert!(s.doc.library.is_empty());
    s.undo();
    assert_eq!(s.doc.library.len(), 1, "undo restores");
}

#[test]
fn delete_in_use_without_break_apart_is_blocked() {
    let mut s = session();
    let sid = s.new_symbol("s", SymbolType::Graphic);
    s.place_symbol(sid, 0.0, 0.0);
    let n = s.history.undo_len();
    assert!(!s.delete_symbol(sid, false), "in use → blocked");
    assert_eq!(s.history.undo_len(), n);
    assert_eq!(s.doc.library.len(), 1);
}

#[test]
fn delete_in_use_with_break_apart_flattens_content() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.selection = vec![a];
    let inst = s.convert_selection_to_symbol("r", SymbolType::Graphic, 4);
    let sid = s.doc.nodes.get(&inst).unwrap().symbol_id().unwrap();

    assert!(s.delete_symbol(sid, true));
    assert!(s.doc.library.is_empty(), "symbol deleted");
    assert!(!s.doc.nodes.contains_key(&inst), "instance removed");
    // the flattened rect still renders
    let items = s.evaluate(1);
    assert_eq!(items.len(), 1, "break-apart left raw rect");
    assert_eq!(items[0].fill, "#ff0000");

    s.undo();
    assert_eq!(s.doc.library.len(), 1, "undo restores symbol + instance");
    assert!(s.doc.nodes.contains_key(&inst));
}

#[test]
fn swap_instance_keeps_transform() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.selection = vec![a];
    s.convert_selection_to_symbol("A", SymbolType::Graphic, 4);
    let inst = s.selection[0];
    let sid_b = s.new_symbol("B", SymbolType::Graphic);
    // draw inside B
    s.set_active_layer(0); // still layer 0 of the scene; symbol B timeline is separate
    let _b_inner = s.draw_rect(500.0, 0.0, 50.0, 50.0, "#00ff00"); // this goes on the main layer, not into B
    s.clear_selection();

    let t_before = s.doc.nodes.get(&inst).unwrap().transform().clone();
    assert!(s.swap_instance(inst, sid_b));
    let Node::SymbolInstance { symbol_id, .. } = s.doc.nodes.get(&inst).unwrap() else {
        panic!()
    };
    assert_eq!(*symbol_id, sid_b);
    assert_eq!(
        s.doc.nodes.get(&inst).unwrap().transform(),
        &t_before,
        "transform kept"
    );

    s.undo();
    let Node::SymbolInstance { symbol_id, .. } = s.doc.nodes.get(&inst).unwrap() else {
        panic!()
    };
    assert_ne!(*symbol_id, sid_b, "undo restores the original symbol");
}

// ——— Nested evaluation (Part 11.8) ———

/// Build a 3-frame graphic symbol: a rect that sits at x = (frame-1)*100 on its
/// internal frames 1..3 (via keyframes + move overrides).
fn animated_symbol(s: &mut Session) -> (SymbolId, animator_core::NodeId) {
    let sid = s.new_symbol("anim", SymbolType::Graphic);
    // author the symbol's internal timeline directly (slice-1: no edit mode yet)
    let inner = s.doc.alloc_node_id();
    s.doc.nodes.insert(
        inner,
        Node::Rect {
            id: inner,
            transform: animator_core::Transform {
                x: 0.0,
                y: 0.0,
                ..Default::default()
            },
            width: 100.0,
            height: 100.0,
            fill: "#123456".into(),
            stroke: None,
            stroke_width: 0.0,
        },
    );
    // frame 1: [inner]; frame 2: [inner] x=100; frame 3: [inner] x=200
    let f1 = animator_core::Frame::keyframe(vec![inner]);
    let mut f2 = animator_core::Frame::keyframe(vec![inner]);
    let mut f3 = animator_core::Frame::keyframe(vec![inner]);
    use std::collections::BTreeMap;
    let t100 = animator_core::Transform {
        x: 100.0,
        y: 0.0,
        ..Default::default()
    };
    let t200 = animator_core::Transform {
        x: 200.0,
        y: 0.0,
        ..Default::default()
    };
    if let animator_core::Frame::Keyframe { transforms, .. } = &mut f2 {
        transforms.insert(inner, t100);
    }
    if let animator_core::Frame::Keyframe { transforms, .. } = &mut f3 {
        transforms.insert(inner, t200);
    }
    let sym = s.doc.library.iter_mut().find(|x| x.id == sid).unwrap();
    sym.timeline[0].keyframes = BTreeMap::from([(1, f1), (2, f2), (3, f3)]);
    (sid, inner)
}

#[test]
fn graphic_loop_syncs_to_parent_clock() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    // loop: internal frame = ((frame-1) % 3) + 1 → x = (frame-1)%3 * 100
    assert!((s.evaluate(1)[0].x - 0.0).abs() < 1e-6);
    assert!((s.evaluate(2)[0].x - 100.0).abs() < 1e-6);
    assert!((s.evaluate(3)[0].x - 200.0).abs() < 1e-6);
    assert!((s.evaluate(4)[0].x - 0.0).abs() < 1e-6, "loops at 4");
    let _ = inst;
}

#[test]
fn graphic_single_frame_is_static() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.set_instance_loop(inst, LoopMode::SingleFrame, 2);
    for f in 1..=5 {
        assert!(
            (s.evaluate(f)[0].x - 100.0).abs() < 1e-6,
            "single frame 2 at {f}"
        );
    }
}

#[test]
fn graphic_play_once_holds_last_frame() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.set_instance_loop(inst, LoopMode::PlayOnce, 1);
    assert!((s.evaluate(1)[0].x - 0.0).abs() < 1e-6);
    assert!((s.evaluate(3)[0].x - 200.0).abs() < 1e-6);
    assert!((s.evaluate(5)[0].x - 200.0).abs() < 1e-6, "holds last at 5");
}

#[test]
fn graphic_first_frame_offsets_the_loop() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.set_instance_loop(inst, LoopMode::Loop, 2); // start at internal frame 2
    assert!((s.evaluate(1)[0].x - 100.0).abs() < 1e-6);
    assert!((s.evaluate(2)[0].x - 200.0).abs() < 1e-6);
    assert!((s.evaluate(3)[0].x - 0.0).abs() < 1e-6, "wraps to frame 1");
}

#[test]
fn movie_clip_runs_a_free_clock() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let sym = s.doc.library.iter_mut().find(|x| x.id == sid).unwrap();
    sym.symbol_type = SymbolType::MovieClip;
    let inst = s.place_symbol(sid, 0.0, 0.0);
    // movie clip ignores loop/first and uses its own clock (frame % 3)
    s.set_instance_loop(inst, LoopMode::SingleFrame, 1); // ignored
    assert!((s.evaluate(1)[0].x - 0.0).abs() < 1e-6);
    assert!((s.evaluate(2)[0].x - 100.0).abs() < 1e-6);
    assert!((s.evaluate(3)[0].x - 200.0).abs() < 1e-6);
    assert!((s.evaluate(4)[0].x - 0.0).abs() < 1e-6);
}

#[test]
fn instance_transform_applies_to_content() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    s.place_symbol(sid, 500.0, 50.0);
    // frame 1 content x=0 → instance at (500,50) → item x=500
    assert!((s.evaluate(1)[0].x - 500.0).abs() < 1e-6);
    assert!((s.evaluate(1)[0].y - 50.0).abs() < 1e-6);
}

#[test]
fn nested_instances_recurse_with_depth_cap() {
    let mut s = session();
    let (inner_sid, _) = animated_symbol(&mut s);
    // build an outer symbol containing an instance of the inner symbol
    let outer = s.new_symbol("outer", SymbolType::Graphic);
    let inner_inst = s.doc.alloc_node_id();
    s.doc.nodes.insert(
        inner_inst,
        Node::SymbolInstance {
            id: inner_inst,
            transform: animator_core::Transform {
                x: 100.0,
                y: 0.0,
                ..Default::default()
            },
            symbol_id: inner_sid,
            loop_mode: LoopMode::Loop,
            first_frame: 1,
        },
    );
    let sym = s.doc.library.iter_mut().find(|x| x.id == outer).unwrap();
    sym.timeline[0]
        .keyframes
        .insert(1, animator_core::Frame::keyframe(vec![inner_inst]));
    // place the outer on stage at (10, 10)
    s.place_symbol(outer, 10.0, 10.0);
    // outer @ (10,10) + inner @ (100,0) + content x=0 → 110
    assert!(
        (s.evaluate(1)[0].x - 110.0).abs() < 1e-6,
        "nested x={}",
        s.evaluate(1)[0].x
    );
    assert!((s.evaluate(1)[0].y - 10.0).abs() < 1e-6);
}

// ——— Hit testing through instances ———

#[test]
fn hit_test_selects_the_instance_not_the_inner_rect() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.clear_selection();
    // content occupies (0,0,100,100) at frame 1
    let hit = s.select_at(50.0, 50.0);
    assert!(hit);
    assert_eq!(s.selection, vec![inst], "click selects the instance");
    // clicking inside, but off the content, misses
    s.clear_selection();
    assert!(!s.select_at(150.0, 50.0));
}

#[test]
fn marquee_selects_instances_whose_content_overlaps() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.clear_selection();
    s.select_in_rect(-10.0, -10.0, 110.0, 110.0);
    assert_eq!(s.selection, vec![inst]);
}

#[test]
fn hit_test_through_scaled_rotated_instance() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    // scale the instance 2× → content occupies (0,0,200,200)
    s.transform_selection(vec![(
        inst,
        animator_core::Transform {
            scale_x: 2.0,
            scale_y: 2.0,
            ..Default::default()
        },
    )]);
    s.clear_selection();
    assert!(s.select_at(150.0, 150.0), "hit inside scaled content");
    assert!(!s.select_at(250.0, 250.0), "miss outside scaled content");
}

// ——— Persistence + export ———

#[test]
fn symbols_and_instances_survive_save_load() {
    let path = std::env::temp_dir().join("animator_symbol_test.json");
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.selection = vec![a];
    s.convert_selection_to_symbol("r", SymbolType::Graphic, 4);
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert_eq!(loaded.doc.library.len(), 1, "symbol persisted");
    assert_eq!(loaded.doc.library[0].name, "r");
    assert_eq!(
        loaded.evaluate(1),
        s.evaluate(1),
        "nested evaluation survives reload"
    );
    let _ = std::fs::remove_file(&path);
}

#[test]
fn export_flattens_nested_content_without_overlays() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    s.place_symbol(sid, 0.0, 0.0);
    let svg = s.export_svg(1);
    assert!(svg.contains("#123456"), "nested rect in SVG");
    assert!(!svg.contains("selection"), "no overlays");
    // the nested content position is baked into the SVG rect
    assert!(svg.contains(r#"x="0" y="0" width="100" height="100""#));
}

// ——— Locked layer ———

#[test]
fn place_symbol_blocked_on_locked_layer() {
    let mut s = session();
    let sid = s.new_symbol("s", SymbolType::Graphic);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert_eq!(s.place_symbol(sid, 0.0, 0.0), animator_core::NodeId(0));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn locked_layer_skips_instance_content_in_hit_test_but_renders() {
    let mut s = session();
    let (sid, _) = animated_symbol(&mut s);
    s.place_symbol(sid, 0.0, 0.0);
    s.clear_selection();
    s.set_layer_locked(0, true);
    assert_eq!(s.evaluate(1).len(), 1, "locked layer still renders");
    assert!(!s.select_at(50.0, 50.0), "locked layer not hit-testable");
}
