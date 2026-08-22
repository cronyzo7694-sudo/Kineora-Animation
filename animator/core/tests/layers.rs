//! Layers acceptance tests — the LAYERS PANEL unit (Phase 4, Part 20).
//! Verifies real layer lifecycle (create/delete/rename/reorder), visibility &
//! lock semantics (render/hit-test/select-all/export), selection pruning, and
//! undo/redo exactness.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn create_layer_appends_above_active_and_becomes_active() {
    let mut s = session();
    let idx = s.create_layer().expect("create layer");
    assert_eq!(idx, 1, "new layer sits above the active one");
    assert_eq!(s.doc.scene(0).unwrap().layers.len(), 2);
    assert_eq!(s.doc.scene(0).unwrap().layers[1].name, "Layer 2");
    assert_eq!(s.active_layer, 1, "new layer becomes active");
}

#[test]
fn create_layer_undo_redo_is_exact() {
    let mut s = session();
    s.create_layer();
    assert_eq!(s.doc.scene(0).unwrap().layers.len(), 2);

    s.undo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers.len(),
        1,
        "undo removes layer"
    );
    assert_eq!(s.active_layer, 0, "active layer re-clamped after undo");

    s.redo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers.len(),
        2,
        "redo restores layer"
    );
}

#[test]
fn delete_layer_removes_layer_and_orphaned_nodes_exactly() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 1
    s.create_layer(); // layer 2 (empty), active = 1
    assert!(s.doc.nodes.contains_key(&a));

    // deleting layer 1 orphans the node → removed too (Part 20.1)
    assert!(s.delete_layer(0));
    assert_eq!(s.doc.scene(0).unwrap().layers.len(), 1);
    assert!(!s.doc.nodes.contains_key(&a), "orphaned node removed");

    // undo restores BOTH the layer and its node, bit-exact
    s.undo();
    assert_eq!(s.doc.scene(0).unwrap().layers.len(), 2);
    assert!(s.doc.nodes.contains_key(&a));
    assert_eq!(s.evaluate(1)[0].fill, "#111111");
}

#[test]
fn delete_last_layer_is_blocked() {
    let mut s = session();
    let n = s.history.undo_len();
    assert!(!s.delete_layer(0), "last layer cannot be deleted");
    assert_eq!(s.doc.scene(0).unwrap().layers.len(), 1);
    assert_eq!(
        s.history.undo_len(),
        n,
        "blocked delete is no-op (no command)"
    );
}

#[test]
fn rename_layer_is_display_only_and_undoable() {
    let mut s = session();
    let id = s.doc.scene(0).unwrap().layers[0].id;
    assert!(s.rename_layer(0, "Background"));
    assert_eq!(s.doc.scene(0).unwrap().layers[0].name, "Background");
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0].id,
        id,
        "rename never breaks id"
    );

    s.undo();
    assert_eq!(s.doc.scene(0).unwrap().layers[0].name, "Layer 1");

    // empty name = no-op
    let n = s.history.undo_len();
    assert!(!s.rename_layer(0, "   "));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn hidden_layer_not_rendered_not_selectable_not_exported() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");

    assert!(s.set_layer_visible(0, false));
    assert!(s.evaluate(1).is_empty(), "hidden layer not rendered");
    assert!(!s.select_at(25.0, 25.0), "hidden layer not selectable");
    assert!(
        !s.export_svg(1).contains("#3f9bf5"),
        "hidden layer not exported"
    );

    s.undo();
    assert_eq!(s.evaluate(1).len(), 1, "undo restores visibility + render");
}

#[test]
fn locked_layer_renders_but_is_not_selectable_or_select_allable() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#3f9bf5");
    s.clear_selection();

    assert!(s.set_layer_locked(0, true));
    assert_eq!(
        s.evaluate(1).len(),
        1,
        "locked layer still renders (Part 20.2)"
    );
    assert!(!s.select_at(25.0, 25.0), "locked layer not selectable");
    s.select_all();
    assert!(s.selection.is_empty(), "Select All skips locked layers");
    assert!(
        s.export_svg(1).contains("#3f9bf5"),
        "locked layer still exported"
    );

    s.undo();
    s.select_all();
    assert_eq!(s.selection.len(), 1, "unlock restores selectability");
}

#[test]
fn reorder_layer_changes_render_order_and_undoes() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#aaaaaa"); // bottom layer
    s.create_layer(); // active = layer 2 (index 1)
    s.draw_rect(10.0, 10.0, 50.0, 50.0, "#bbbbbb"); // top layer

    // render order bottom → top: grey first, then darker
    assert_eq!(s.evaluate(1)[0].fill, "#aaaaaa");
    assert_eq!(s.evaluate(1)[1].fill, "#bbbbbb");

    // move layer 1 (bottom) to top
    assert!(s.move_layer(0, 1));
    assert_eq!(s.evaluate(1)[0].fill, "#bbbbbb");
    assert_eq!(s.evaluate(1)[1].fill, "#aaaaaa");

    s.undo();
    assert_eq!(s.evaluate(1)[0].fill, "#aaaaaa");
    assert_eq!(s.evaluate(1)[1].fill, "#bbbbbb");
}

#[test]
fn selection_is_pruned_when_layer_hidden_or_locked() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    assert_eq!(s.selection.len(), 1, "draw selects the object");

    s.set_layer_visible(0, false);
    assert!(s.selection.is_empty(), "hiding drops the selection");

    s.set_layer_visible(0, true);
    s.select_at(25.0, 25.0);
    assert_eq!(s.selection.len(), 1);

    s.set_layer_locked(0, true);
    assert!(s.selection.is_empty(), "locking drops the selection");
}

#[test]
fn active_layer_is_view_state_no_undo_entry() {
    let mut s = session();
    s.create_layer();
    let n = s.history.undo_len();
    assert!(s.set_active_layer(0));
    assert!(
        !s.set_active_layer(99),
        "out-of-range active layer rejected"
    );
    assert_eq!(s.history.undo_len(), n, "active layer is view state");
}

#[test]
fn draw_is_blocked_on_hidden_or_locked_layer() {
    let mut s = session();
    s.set_layer_locked(0, true);
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    assert_eq!(id, animator_core::NodeId(0), "locked layer rejects draw");
    assert!(s.current_frame().is_empty());

    s.set_layer_locked(0, false);
    s.set_layer_visible(0, false);
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    assert_eq!(id, animator_core::NodeId(0), "hidden layer rejects draw");
}

#[test]
fn select_all_spans_layers_skipping_hidden_and_locked() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111"); // layer 1
    s.create_layer();
    s.draw_rect(100.0, 0.0, 10.0, 10.0, "#222222"); // layer 2
    s.clear_selection();

    s.select_all();
    assert_eq!(s.selection.len(), 2, "Select All spans visible layers");

    s.set_layer_locked(1, true);
    s.select_all();
    assert_eq!(s.selection.len(), 1, "locked layer skipped by Select All");
}

// ——— SYS-16 Layers: outline mode + color (F-07-02 E3/E6, F-20-03) ———

#[test]
fn outline_toggle_is_undoable_and_view_only() {
    let mut s = session();
    let n = s.history.undo_len();
    assert!(s.set_layer_outline(0, true));
    assert!(s.doc.scene(0).unwrap().layers[0].outline);
    assert_eq!(s.history.undo_len(), n + 1, "one undoable command");

    s.undo();
    assert!(!s.doc.scene(0).unwrap().layers[0].outline);
    s.redo();
    assert!(s.doc.scene(0).unwrap().layers[0].outline);

    // unchanged target = no-op (no command)
    let n = s.history.undo_len();
    assert!(!s.set_layer_outline(0, true));
    assert_eq!(s.history.undo_len(), n, "no-op leaves history untouched");
}

#[test]
fn outline_color_is_undoable_and_validated() {
    let mut s = session();
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0].outline_color,
        "#ff0000",
        "F-20-01 default outline color"
    );
    assert!(s.set_layer_outline_color(0, "#00ff00"));
    assert_eq!(s.doc.scene(0).unwrap().layers[0].outline_color, "#00ff00");

    let n = s.history.undo_len();
    assert!(
        !s.set_layer_outline_color(0, "   "),
        "blank color is a no-op"
    );
    assert!(
        !s.set_layer_outline_color(0, "#00ff00"),
        "unchanged color is a no-op"
    );
    assert_eq!(s.history.undo_len(), n, "no command for no-ops");

    s.undo();
    assert_eq!(s.doc.scene(0).unwrap().layers[0].outline_color, "#ff0000");
}

#[test]
fn outline_flags_persist_through_save_load() {
    let path = std::env::temp_dir().join("animator_layer_outline_test.json");
    let mut s = session();
    s.set_layer_outline(0, true);
    s.set_layer_outline_color(0, "#00aaff");
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    let l = &loaded.doc.scene(0).unwrap().layers[0];
    assert!(l.outline, "outline mode persisted");
    assert_eq!(l.outline_color, "#00aaff", "outline color persisted");
    let _ = std::fs::remove_file(&path);
}

// ——— SYS-16 Layers: Alt+click "all others" batch toggles (F-07-02 E1/E2/E3 + M.3) ———

fn three_layer_session() -> Session {
    let mut s = session();
    s.create_layer();
    s.create_layer();
    s
}

#[test]
fn batch_toggle_visible_flips_other_layers_in_one_undo_step() {
    let mut s = three_layer_session();
    let n = s.history.undo_len();
    assert!(s.toggle_other_layers_visible(1));
    let sc = s.doc.scene(0).unwrap();
    assert!(sc.layers[1].visible, "excluded layer untouched");
    assert!(!sc.layers[0].visible, "other layer hidden");
    assert!(!sc.layers[2].visible, "other layer hidden");
    assert_eq!(s.history.undo_len(), n + 1, "ONE undo step for the batch");

    s.undo();
    assert!(s.doc.scene(0).unwrap().layers.iter().all(|l| l.visible));
    s.redo();
    let sc = s.doc.scene(0).unwrap();
    assert!(!sc.layers[0].visible && !sc.layers[2].visible);
}

#[test]
fn batch_toggle_visible_all_hidden_case_shows_all() {
    // F-07-02 M.3: Alt+click eye with ALL layers hidden → shows all.
    let mut s = three_layer_session();
    for i in 0..3 {
        s.set_layer_visible(i, false);
    }
    assert!(s.toggle_other_layers_visible(0));
    let sc = s.doc.scene(0).unwrap();
    assert!(
        sc.layers.iter().all(|l| l.visible),
        "toggle of hidden others shows all"
    );
}

#[test]
fn batch_toggle_locked_flips_other_layers() {
    let mut s = three_layer_session();
    assert!(s.toggle_other_layers_locked(0));
    let sc = s.doc.scene(0).unwrap();
    assert!(!sc.layers[0].locked, "excluded layer untouched");
    assert!(sc.layers[1].locked);
    assert!(sc.layers[2].locked);
    s.undo();
    assert!(s.doc.scene(0).unwrap().layers.iter().all(|l| !l.locked));
}

#[test]
fn batch_toggle_outline_flips_other_layers() {
    let mut s = three_layer_session();
    assert!(s.toggle_other_layers_outline(2));
    let sc = s.doc.scene(0).unwrap();
    assert!(!sc.layers[2].outline, "excluded layer untouched");
    assert!(sc.layers[0].outline);
    assert!(sc.layers[1].outline);
    s.undo();
    assert!(s.doc.scene(0).unwrap().layers.iter().all(|l| !l.outline));
}

#[test]
fn batch_toggle_needs_other_layers() {
    let mut s = session();
    let n = s.history.undo_len();
    assert!(
        !s.toggle_other_layers_visible(0),
        "single layer → nothing to toggle"
    );
    assert!(!s.toggle_other_layers_locked(0));
    assert!(!s.toggle_other_layers_outline(0));
    assert_eq!(s.history.undo_len(), n, "no command for empty batch");
}

// ——— SYS-16 Layers: duplicate layer (F-20-02 "deep copy frames+content") ———

#[test]
fn duplicate_layer_deep_copies_content_and_is_independent() {
    let mut s = session();
    let _a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111"); // layer 0, key @1
    s.insert_keyframe(10); // key @10 (copies content → same node)
    s.create_layer(); // layer 1 (active)
    let _b = s.draw_rect(100.0, 100.0, 20.0, 20.0, "#222222");

    let idx = s.duplicate_layer(0).expect("duplicate");
    assert_eq!(idx, 1, "copy inserted ABOVE the source");
    assert_eq!(s.active_layer, 1, "the copy becomes active");

    let sc = s.doc.scene(0).unwrap();
    assert_eq!(sc.layers.len(), 3);
    assert_eq!(sc.layers[1].name, "Layer 1 copy");
    assert_ne!(sc.layers[0].id, sc.layers[1].id, "fresh layer id");

    let src = &sc.layers[0];
    let copy = &sc.layers[1];
    let src_node = src.content_at(1)[0];
    let copy_node = copy.content_at(1)[0];
    assert_ne!(src_node, copy_node, "content is deep-copied (new node id)");
    assert!(copy.keyframes.contains_key(&1), "frame 1 copied");
    assert!(copy.keyframes.contains_key(&10), "frame 10 copied");
    assert_eq!(
        s.evaluate(1)[0].fill,
        "#111111",
        "copy renders the same visual content"
    );

    // Independence: moving the COPY's object must NOT move the source's.
    // (The move edits the keyframe at the CURRENT playhead = frame 10, so we
    // assert the copy at frame 10 — the source keyframe there stays at x=0.)
    s.set_active_layer(1);
    s.select_at(25.0, 25.0); // topmost hit at (25,25) = the copy's rect
    s.move_selection(100.0, 0.0);
    let items = s.evaluate(10);
    assert_eq!(items[0].x, 0.0, "source untouched at the moved frame");
    assert_eq!(items[1].id, copy_node.0, "the moved item is the copy");
    assert_eq!(items[1].x, 100.0, "copy moved");
}

#[test]
fn duplicate_layer_copies_tweens_and_labels() {
    let mut s = session();
    let _id = s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // key @1
    s.insert_keyframe(10); // key @10 (same node)
    s.move_selection(100.0, 0.0); // key @10 override x=100
    s.set_classic_tween(0, 1, 10, -50.0);
    s.set_frame_label(0, 1, Some("start"));

    assert!(s.duplicate_layer(0).is_some());
    let sc = s.doc.scene(0).unwrap();
    let copy = &sc.layers[1];
    assert_eq!(copy.tweens.len(), 1, "tween span copied");
    assert_eq!(copy.tweens.get(&1).unwrap().ease, -50.0, "ease copied");
    assert_eq!(
        copy.keyframes.get(&1).and_then(|f| f.label()),
        Some("start"),
        "frame label copied"
    );
}

#[test]
fn duplicate_layer_undo_redo_is_exact() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    let n = s.history.undo_len();
    assert!(s.duplicate_layer(0).is_some());
    assert_eq!(s.history.undo_len(), n + 1, "one command");
    let copy_node = s.doc.scene(0).unwrap().layers[1].content_at(1)[0];
    assert_ne!(copy_node, a, "copy node differs from source node");

    s.undo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers.len(),
        1,
        "undo removes the copy"
    );
    assert!(
        !s.doc.nodes.contains_key(&copy_node),
        "copied node removed on undo"
    );
    assert!(s.doc.nodes.contains_key(&a), "source node untouched");
    assert_eq!(s.active_layer, 0, "active layer re-clamped after undo");

    s.redo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers.len(),
        2,
        "redo restores the copy"
    );
    assert!(s.doc.nodes.contains_key(&copy_node));
    assert_eq!(s.evaluate(1)[0].fill, "#111111");
}

#[test]
fn duplicate_layer_name_uniquifies() {
    let mut s = session();
    s.rename_layer(0, "arm");
    assert!(s.duplicate_layer(0).is_some());
    assert!(s.duplicate_layer(1).is_some());
    let sc = s.doc.scene(0).unwrap();
    assert_eq!(sc.layers[1].name, "arm copy");
    assert_eq!(sc.layers[2].name, "arm copy 2");
}

#[test]
fn duplicate_layer_duplicates_visible_locked_outline_flags() {
    let mut s = session();
    s.set_layer_visible(0, false);
    s.set_layer_locked(0, true);
    s.set_layer_outline(0, true);
    s.set_layer_outline_color(0, "#123456");
    assert!(s.duplicate_layer(0).is_some());
    let copy = &s.doc.scene(0).unwrap().layers[1];
    assert!(!copy.visible, "visibility copied");
    assert!(copy.locked, "locked copied");
    assert!(copy.outline, "outline copied");
    assert_eq!(copy.outline_color, "#123456", "outline color copied");
}

// ——— SYS-16 Layers: outline-mode rendering (F-07-02 E3 / F-20-03) ———

#[test]
fn outline_layer_items_carry_outline_color_view_only() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#111111");
    assert!(
        s.evaluate(1)[0].outline_color.is_none(),
        "normal layers carry no outline marker"
    );

    s.set_layer_outline(0, true);
    s.set_layer_outline_color(0, "#00ff00");
    let it = &s.evaluate(1)[0];
    assert_eq!(
        it.outline_color.as_deref(),
        Some("#00ff00"),
        "outline color attached to items of an outline layer"
    );

    // VIEW-ONLY: export renders the full content — the outline color never
    // leaks (F-20-03 "outline exports fully").
    let svg = s.export_svg(1);
    assert!(svg.contains("#111111"), "export keeps the fill");
    assert!(!svg.contains("#00ff00"), "outline color never exported");
}

#[test]
fn outline_propagates_through_symbol_instances() {
    let mut s = session();
    let _ = s.draw_rect(0.0, 0.0, 30.0, 30.0, "#abcdef");
    s.select_at(15.0, 15.0);
    let inst = s.convert_selection_to_symbol("blob", animator_core::SymbolType::Graphic, 0);
    assert_ne!(inst, animator_core::NodeId(0), "convert succeeded");
    let sid = s.doc.nodes.get(&inst).unwrap().symbol_id().unwrap();

    // the flattened inner rect is NOT outlined while the scene layer is normal
    assert!(s.evaluate(1)[0].outline_color.is_none());
    assert_eq!(s.evaluate(1)[0].fill, "#abcdef");

    // outline the SCENE layer → everything placed on it (incl. nested symbol
    // content) renders as outlines with the layer's color
    s.set_layer_outline(0, true);
    s.set_layer_outline_color(0, "#123456");
    assert_eq!(
        s.evaluate(1)[0].outline_color.as_deref(),
        Some("#123456"),
        "outline marker propagates through the instance"
    );
    assert!(sid.0 > 0, "conversion produced a real symbol");
}
