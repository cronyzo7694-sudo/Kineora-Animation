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
