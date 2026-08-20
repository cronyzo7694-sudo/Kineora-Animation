//! UNIT H usability-correction acceptance tests (Part 11/12).
//! Covers the forensic fixes: empty-symbol instances are placeable/selectable
//! (deterministic marker, never leaked into render/export), convert is blocked
//! on locked layers (no mutation, no undo entry), loop-mode/first-frame
//! undo + persistence, swap use-count correctness.

use std::collections::BTreeMap;

use animator_core::{Frame, LoopMode, Node, Session, Settings, SymbolId, SymbolType, Transform};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Build a 3-frame graphic symbol with a rect whose x = (frame-1)*100.
fn animated_symbol(s: &mut Session) -> SymbolId {
    let sid = s.new_symbol("anim", SymbolType::Graphic);
    let inner = s.doc.alloc_node_id();
    s.doc.nodes.insert(
        inner,
        Node::Rect {
            id: inner,
            transform: Transform {
                x: 0.0,
                y: 0.0,
                ..Transform::default()
            },
            width: 100.0,
            height: 100.0,
            fill: "#123456".into(),
            stroke: None,
            stroke_width: 0.0,
        },
    );
    let f1 = Frame::keyframe(vec![inner]);
    let mut f2 = Frame::keyframe(vec![inner]);
    let mut f3 = Frame::keyframe(vec![inner]);
    if let Frame::Keyframe { transforms, .. } = &mut f2 {
        transforms.insert(
            inner,
            Transform {
                x: 100.0,
                y: 0.0,
                ..Transform::default()
            },
        );
    }
    if let Frame::Keyframe { transforms, .. } = &mut f3 {
        transforms.insert(
            inner,
            Transform {
                x: 200.0,
                y: 0.0,
                ..Transform::default()
            },
        );
    }
    let sym = s.doc.library.iter_mut().find(|x| x.id == sid).unwrap();
    sym.timeline[0].keyframes = BTreeMap::from([(1, f1), (2, f2), (3, f3)]);
    sid
}

// ——— Empty symbol instance ———

#[test]
fn empty_symbol_instance_is_placeable() {
    let mut s = session();
    let sid = s.new_symbol("empty", SymbolType::Graphic);
    let inst = s.place_symbol(sid, 100.0, 100.0);
    assert_ne!(inst, animator_core::NodeId(0), "instance placed");
    assert_eq!(s.doc.symbol_use_count(sid), 1, "use count increments");
    // the symbol is genuinely empty — it must NOT render artwork
    assert!(s.evaluate(1).is_empty(), "empty symbol renders nothing");
}

#[test]
fn empty_symbol_instance_is_selectable_by_click() {
    let mut s = session();
    let sid = s.new_symbol("empty", SymbolType::Graphic);
    let inst = s.place_symbol(sid, 100.0, 100.0);
    s.clear_selection();
    // the deterministic marker around (100,100) makes it hit-testable
    assert!(s.select_at(100.0, 100.0), "click the empty instance");
    assert_eq!(
        s.selection,
        vec![inst],
        "selects the INSTANCE (not inner art)"
    );
}

#[test]
fn empty_symbol_instance_is_marquee_selectable() {
    let mut s = session();
    let sid = s.new_symbol("empty", SymbolType::Graphic);
    let inst = s.place_symbol(sid, 100.0, 100.0);
    s.clear_selection();
    s.select_in_rect(90.0, 90.0, 110.0, 110.0);
    assert_eq!(s.selection, vec![inst]);
}

#[test]
fn empty_symbol_marker_never_leaks_into_export() {
    let mut s = session();
    let sid = s.new_symbol("empty", SymbolType::Graphic);
    s.place_symbol(sid, 0.0, 0.0);
    // the marker is selection-only: the SVG must contain ONLY the stage bg/clip
    let svg = s.export_svg(1);
    let content_rects = svg.matches("<rect").count();
    // defs clip rect + stage background rect = 2; NO marker rect
    assert_eq!(content_rects, 2, "no marker leaked into export: {svg}");
}

#[test]
fn non_empty_symbol_bounds_match_its_content() {
    let mut s = session();
    let sid = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    // frame 1 content is a 100×100 rect at (0,0)
    let items = s.evaluate(1);
    assert_eq!(items.len(), 1);
    assert_eq!((items[0].w, items[0].h), (100.0, 100.0));
    let _ = inst;
}

// ——— Locked-layer convert guard ———

#[test]
fn convert_on_locked_layer_is_blocked() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.set_layer_locked(0, true);
    // locking prunes selection via the Session; simulate a stale/foreign
    // selection that still references a locked-layer node — the ENGINE guard
    // must reject it regardless of how it got there.
    s.selection = vec![a];
    let n = s.history.undo_len();
    let id = s.convert_selection_to_symbol("r", SymbolType::Graphic, 4);
    assert_eq!(
        id,
        animator_core::NodeId(0),
        "convert blocked on locked layer"
    );
    assert!(s.doc.library.is_empty(), "no symbol created");
    assert_eq!(s.history.undo_len(), n, "no undo entry");
    // no partial mutation: the rect is still on the frame, unchanged
    assert!(s.doc.scene(0).unwrap().layers[0].content_at(1).contains(&a));
}

#[test]
fn convert_is_blocked_if_any_selected_node_is_on_a_locked_layer() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 0
    s.create_layer(); // layer 1 (active)
    let b = s.draw_rect(200.0, 0.0, 50.0, 50.0, "#222222"); // layer 1
    s.set_layer_locked(0, true); // lock layer 0 (prunes a from selection)
    s.selection = vec![a, b]; // stale cross-layer selection
    let id = s.convert_selection_to_symbol("r", SymbolType::Graphic, 4);
    assert_eq!(
        id,
        animator_core::NodeId(0),
        "blocked: one node is on a locked layer"
    );
    assert!(s.doc.library.is_empty());
}

#[test]
fn convert_on_unlocked_layer_still_works() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000");
    s.selection = vec![a];
    let id = s.convert_selection_to_symbol("r", SymbolType::Graphic, 4);
    assert_ne!(id, animator_core::NodeId(0));
    assert_eq!(s.doc.library.len(), 1);
}

// ——— Loop mode / first frame ———

#[test]
fn set_instance_loop_is_undoable_and_redoable() {
    let mut s = session();
    let sid = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);

    // default Loop: internal frame tracks parent
    assert!((s.evaluate(2)[0].x - 100.0).abs() < 1e-6);

    assert!(s.set_instance_loop(inst, LoopMode::SingleFrame, 2));
    assert!((s.evaluate(1)[0].x - 100.0).abs() < 1e-6, "single frame 2");

    s.undo();
    assert!(
        (s.evaluate(2)[0].x - 100.0).abs() < 1e-6,
        "undo restores loop"
    );
    assert!(
        (s.evaluate(1)[0].x).abs() < 1e-6,
        "frame 1 back to internal frame 1"
    );

    s.redo();
    assert!(
        (s.evaluate(1)[0].x - 100.0).abs() < 1e-6,
        "redo re-applies single frame"
    );
}

#[test]
fn instance_loop_mode_survives_save_load() {
    let path = std::env::temp_dir().join("animator_loop_persist.json");
    let mut s = session();
    let sid = animated_symbol(&mut s);
    let inst = s.place_symbol(sid, 0.0, 0.0);
    s.set_instance_loop(inst, LoopMode::PlayOnce, 2);
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert!(
        (loaded.evaluate(1)[0].x - 100.0).abs() < 1e-6,
        "play-once from frame 2 persists"
    );
    assert!(
        (loaded.evaluate(3)[0].x - 200.0).abs() < 1e-6,
        "play-once reaches last frame"
    );
    let _ = std::fs::remove_file(&path);
}

// ——— Swap use-count ———

#[test]
fn swap_updates_use_counts_and_preserves_transform() {
    let mut s = session();
    let sid_a = animated_symbol(&mut s);
    let sid_b = s.new_symbol("B", SymbolType::Graphic);
    let inst = s.place_symbol(sid_a, 500.0, 0.0);
    let t_before = s.doc.nodes.get(&inst).unwrap().transform().clone();
    assert_eq!(s.doc.symbol_use_count(sid_a), 1);

    assert!(s.swap_instance(inst, sid_b));
    assert_eq!(s.doc.symbol_use_count(sid_a), 0, "A use count drops");
    assert_eq!(s.doc.symbol_use_count(sid_b), 1, "B use count rises");
    assert_eq!(
        s.doc.nodes.get(&inst).unwrap().transform(),
        &t_before,
        "transform kept"
    );

    s.undo();
    assert_eq!(s.doc.symbol_use_count(sid_a), 1, "undo restores counts");
    assert_eq!(s.doc.symbol_use_count(sid_b), 0);
}
