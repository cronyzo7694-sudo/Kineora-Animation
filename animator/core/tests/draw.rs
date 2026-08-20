//! Rect drawing acceptance tests — the RECT TOOL unit (Phase 4).
//! Verifies real document mutation, animation semantics (auto-key at held
//! frame preserving content), undo/redo, and hit-testing the new object.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn draw_rect_creates_real_node_in_document_and_selects_it() {
    let mut s = session();
    let id = s.draw_rect(10.0, 20.0, 100.0, 50.0, "#3f9bf5");
    // real document mutation
    assert!(s.doc.nodes.contains_key(&id));
    // evaluated → renderer sees it
    let items = s.current_frame();
    assert_eq!(items.len(), 1);
    assert_eq!(
        (items[0].x, items[0].y, items[0].w, items[0].h),
        (10.0, 20.0, 100.0, 50.0)
    );
    // selected immediately
    assert_eq!(s.selection, vec![id]);
    // Select tool can hit it (top-left corner + center)
    assert!(s.select_at(10.0, 20.0));
    assert!(s.select_at(60.0, 45.0));
}

#[test]
fn draw_at_held_frame_auto_keys_preserving_existing_content() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // frame 1 rect A
    s.clear_selection();
    s.set_playhead(5); // held frame (not a keyframe)
    s.draw_rect(200.0, 0.0, 50.0, 50.0, "#00ff00"); // rect B at frame 5

    // auto-keyframe at frame 5 with BOTH rects (F6 copy-prev + add)
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));
    let f1 = s.evaluate(1);
    let f5 = s.evaluate(5);
    assert_eq!(f1.len(), 1); // frame 1 unchanged (only rect A)
    assert_eq!(f5.len(), 2); // frame 5 = A + B (existing content preserved)
}

#[test]
fn draw_undo_redo() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#3f9bf5");
    assert_eq!(s.current_frame().len(), 1);

    s.undo();
    assert!(s.current_frame().is_empty(), "undo removes the rectangle");

    s.redo();
    assert_eq!(s.current_frame().len(), 1, "redo restores the rectangle");
}

#[test]
fn two_rects_two_commands() {
    let mut s = session();
    let base = s.history.undo_len();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    s.draw_rect(50.0, 50.0, 10.0, 10.0, "#222222");
    assert_eq!(s.history.undo_len(), base + 2);
    s.undo();
    s.undo();
    assert!(s.current_frame().is_empty());
}
