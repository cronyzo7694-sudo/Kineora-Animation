//! Timeline + keyframe ops acceptance tests — the TIMELINE unit (Phase 4,
//! Part 07 §7.4.3/7.4.5 + Part 08). Verifies blank-keyframe (F7) hold-break,
//! clear-keyframe (Shift+F6) hold-revert, exact undo/redo, derived duration,
//! and the locked-layer guard.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn blank_keyframe_breaks_the_hold() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // keyframe @1
    assert_eq!(s.evaluate(1).len(), 1);

    s.set_playhead(5);
    assert!(s.insert_blank_keyframe(5)); // F7 — empty keyframe @5

    // the hold is broken: frame 5+ shows nothing, frame 1 still has content
    assert!(s.evaluate(5).is_empty(), "blank keyframe empties the hold");
    assert_eq!(s.evaluate(1).len(), 1, "earlier keyframe unchanged");
    // marker: frame 5 is a blank keyframe
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5));
}

#[test]
fn blank_keyframe_undo_redo_is_exact() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.set_playhead(5);
    assert!(s.insert_blank_keyframe(5));
    assert!(s.evaluate(5).is_empty());

    s.undo();
    assert_eq!(s.evaluate(5).len(), 1, "undo restores the hold");
    assert!(
        !s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&5),
        "undo removes the blank keyframe entry"
    );

    s.redo();
    assert!(
        s.evaluate(5).is_empty(),
        "redo re-applies the blank keyframe"
    );
}

#[test]
fn blank_keyframe_over_existing_keyframe_replaces_it_and_undoes() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1
    s.insert_keyframe(5); // F6 copies content into a keyframe @5
    assert_eq!(s.evaluate(5).len(), 1);

    assert!(s.insert_blank_keyframe(5)); // F7 over the keyframe
    assert!(s.evaluate(5).is_empty());

    s.undo();
    assert_eq!(
        s.evaluate(5).len(),
        1,
        "undo restores the keyframe + content"
    );
}

#[test]
fn clear_keyframe_reverts_to_hold() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1
    s.insert_keyframe(10); // keyframe @10 (copies content)
    s.clear_selection();
    s.select_at(25.0, 25.0);
    s.move_selection(100.0, 0.0); // moved @10 → different content at 10

    assert!(s.clear_keyframe(10)); // Shift+F6
                                   // frame 10 reverts to the hold of frame 1 (position back to 0)
    assert_eq!(s.evaluate(10)[0].x, 0.0, "cleared keyframe reverts to hold");
    assert!(!s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&10));

    s.undo();
    assert_eq!(
        s.evaluate(10)[0].x,
        100.0,
        "undo restores the cleared keyframe"
    );
}

#[test]
fn clear_keyframe_on_non_keyframe_is_a_noop() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1 only
    let n = s.history.undo_len();
    s.set_playhead(7);
    assert!(!s.clear_keyframe(7), "no keyframe at 7 → false");
    assert_eq!(s.history.undo_len(), n, "no command created");
}

#[test]
fn clear_last_keyframe_empties_the_layer_and_undoes() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // only keyframe @1
    assert!(s.clear_keyframe(1));
    assert!(
        s.evaluate(1).is_empty(),
        "last keyframe cleared → layer empty"
    );

    s.undo();
    assert_eq!(s.evaluate(1).len(), 1);
}

#[test]
fn frame_ops_are_blocked_on_locked_layer() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(
        !s.insert_blank_keyframe(5),
        "blank keyframe blocked on locked"
    );
    assert!(!s.clear_keyframe(1), "clear keyframe blocked on locked");
    assert_eq!(s.history.undo_len(), n, "blocked ops create no commands");
}

#[test]
fn frame_ops_allowed_on_hidden_layer() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000");
    s.set_layer_visible(0, false);
    assert!(
        s.insert_blank_keyframe(5),
        "blank keyframe allowed on hidden"
    );
    s.undo();
    assert!(s.clear_keyframe(1), "clear keyframe allowed on hidden");
}

#[test]
fn timeline_duration_is_derived_max_keyframe_frame() {
    let s = session();
    assert_eq!(s.timeline_duration(), 1, "empty doc → duration 1");

    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1
    s.insert_keyframe(10); // @10
    s.insert_blank_keyframe(24); // @24 (blank still counts as extent)
    assert_eq!(s.timeline_duration(), 24, "duration = max keyframe frame");
}

#[test]
fn blank_then_clear_is_exactly_undoable() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1
    s.set_playhead(8);
    s.insert_blank_keyframe(8);
    s.clear_keyframe(8);
    // after blank + clear, frame 8 holds frame-1 content again
    assert_eq!(s.evaluate(8).len(), 1);
    // two commands on the stack
    s.undo(); // undo clear → blank again
    assert!(s.evaluate(8).is_empty());
    s.undo(); // undo blank → nothing at 8 (was no keyframe)
    assert_eq!(s.evaluate(8).len(), 1);
}
