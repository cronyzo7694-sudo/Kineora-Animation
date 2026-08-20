//! Transform/move acceptance tests — the SELECT + MOVE unit (Phase 4).
//! Covers interpolated-position moves, keyframe auto-creation on edit,
//! exact undo/redo, and undo-history hygiene.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn move_on_interpolated_frame_uses_interpolated_before() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 100.0, "#ff0000"); // frame 1 @ (0,0)
    s.insert_keyframe(10); // copies content, still (0,0)
    s.move_selection(100.0, 0.0); // frame 10 @ (100,0) → animated 0→100
    assert!(s.set_classic_tween(0, 1, 10, 0.0)); // explicit tween (Part 08 §8.0)

    // interpolated at frame 5 = 0 + (100-0)*4/9 ≈ 44.44
    let before = s.evaluate(5)[0].clone();
    assert!((before.x - 44.44).abs() < 0.5, "pre x={}", before.x);

    s.set_playhead(5);
    s.select_at(before.x + 50.0, before.y + 50.0); // click the rect at its interpolated spot
    assert!(!s.selection.is_empty());

    s.move_selection(10.0, 0.0);
    let after = s.evaluate(5)[0].clone();
    // must land at interpolated-before + 10 (NOT base + 10 = 10)
    assert!((after.x - 54.44).abs() < 0.5, "post x={}", after.x);
    assert!((after.y - before.y).abs() < 0.5);
}

#[test]
fn move_on_non_keyframe_creates_keyframe_and_undo_removes_it() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#00ff00"); // frame 1
                                                  // playhead on frame 5 (held, not a keyframe)
    s.set_playhead(5);
    s.select_at(25.0, 25.0);
    s.move_selection(7.0, 3.0);

    // a keyframe must now exist at frame 5 (auto-key on edit)
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));
    assert_eq!(s.evaluate(5)[0].x, 7.0);

    s.undo();
    // keyframe removed → frame 5 holds frame-1 content again
    assert!(!s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));
    assert_eq!(s.evaluate(5)[0].x, 0.0);

    s.redo();
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));
    assert_eq!(s.evaluate(5)[0].x, 7.0);
}

#[test]
fn zero_delta_move_creates_no_command() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#0000ff");
    let n = s.history.undo_len();
    s.move_selection(0.0, 0.0);
    assert_eq!(
        s.history.undo_len(),
        n,
        "zero-distance move must not pollute history"
    );
}

#[test]
fn two_separate_drags_produce_two_commands() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#0000ff");
    let base = s.history.undo_len();
    s.move_selection(10.0, 0.0);
    s.move_selection(0.0, 10.0);
    assert_eq!(s.history.undo_len(), base + 2);
    // undo both, in reverse order
    s.undo();
    s.undo();
    assert_eq!(s.evaluate(1)[0].x, 0.0);
    assert_eq!(s.evaluate(1)[0].y, 0.0);
}

#[test]
fn selection_does_not_pollute_undo_history() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#0000ff");
    let n = s.history.undo_len();
    s.select_at(25.0, 25.0);
    s.clear_selection();
    s.select_all();
    assert_eq!(
        s.history.undo_len(),
        n,
        "selection is view state — never an undo entry"
    );
}

#[test]
fn click_empty_clears_selection_without_undo_entry() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#0000ff");
    assert_eq!(s.selection.len(), 1);
    let n = s.history.undo_len();
    let hit = s.select_at(500.0, 500.0); // empty stage
    assert!(!hit);
    assert!(s.selection.is_empty());
    assert_eq!(s.history.undo_len(), n);
}
