//! Frame-manipulation acceptance tests — UNIT B (Phase 4, Part 07 §7.4.1/4/9 +
//! F-07-12 E1). Verifies F5 insert-frame (shift right), Shift+F5 delete-frame
//! (shift left), keyframe drag-move, Alt-drag duplicate — with exact undo/redo,
//! no-op guards, locked-layer guards, and cross-layer move.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Draw a rect at frame 1, then F6 at `frame` (content copied) so the layer has
/// keyframes at 1 and `frame`.
fn two_keys(s: &mut Session, frame: u32) {
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // key @1
    assert!(s.insert_keyframe(frame)); // F6 copies content into key @frame
}

// ——— F5 Insert Frame ———

#[test]
fn f5_shifts_later_keyframes_right_and_extends_hold() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.insert_frame(5)); // F5 at a held frame between 1 and 10
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 11], "key @10 shifted right to 11");
    // hold rule: frame 10 still holds key@1 content (the hold got one longer)
    assert_eq!(s.evaluate(10).len(), 1);
}

#[test]
fn f5_at_a_keyframe_keeps_it_and_shifts_later_only() {
    let mut s = session();
    two_keys(&mut s, 10); // keys @1, @10
    s.insert_blank_keyframe(20); // blank @20
    assert!(s.insert_frame(10)); // F5 exactly on the keyframe @10
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(
        keys,
        vec![1, 10, 21],
        "keyframe at F stays; only later keys shift right"
    );
}

#[test]
fn f5_past_last_keyframe_is_a_noop() {
    let mut s = session();
    two_keys(&mut s, 10);
    let n = s.history.undo_len();
    assert!(
        !s.insert_frame(20),
        "nothing after the last keyframe to shift"
    );
    assert_eq!(s.history.undo_len(), n, "no command for a no-op F5");
}

#[test]
fn f5_on_empty_layer_is_a_noop() {
    let mut s = session();
    let n = s.history.undo_len();
    assert!(!s.insert_frame(5));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn f5_undo_redo_is_exact() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.insert_frame(3));
    assert!(s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&11));

    s.undo();
    assert!(!s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&11));
    assert!(s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&10));

    s.redo();
    assert!(s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&11));
}

#[test]
fn f5_blocked_on_locked_layer() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.insert_frame(5));
    assert_eq!(s.history.undo_len(), n);
}

// ——— Shift+F5 Delete Frame ———

#[test]
fn shift_f5_removes_keyframe_and_shifts_later_left() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.delete_frame(10)); // delete the keyframe @10
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1], "key @10 removed");
    assert_eq!(s.evaluate(10).len(), 1, "content collapses into key@1 hold");
}

#[test]
fn shift_f5_on_held_frame_shortens_the_hold() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.delete_frame(5)); // delete a held frame (no keyframe at 5)
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 9], "key @10 shifts left to 9 (hold shortens)");
}

#[test]
fn shift_f5_delete_only_keyframe_empties_layer_and_undo_restores() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // only key @1
    assert!(s.delete_frame(1));
    assert!(
        s.evaluate(1).is_empty(),
        "last keyframe deleted → layer empty"
    );

    s.undo();
    assert_eq!(s.evaluate(1).len(), 1, "undo restores the keyframe");
}

#[test]
fn shift_f5_past_last_keyframe_is_a_noop() {
    let mut s = session();
    two_keys(&mut s, 10);
    let n = s.history.undo_len();
    assert!(!s.delete_frame(20));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn shift_f5_undo_redo_is_exact() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.delete_frame(3)); // held frame → key @10 → 9
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&9));

    s.undo();
    assert!(s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .contains_key(&10));
    assert!(!s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&9));

    s.redo();
    assert!(s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&9));
}

#[test]
fn shift_f5_blocked_on_locked_layer() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.delete_frame(5));
    assert_eq!(s.history.undo_len(), n);
}

// ——— Keyframe drag-move ———

#[test]
fn move_keyframe_relocates_record_verbatim_without_shifting_others() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.insert_blank_keyframe(20); // three records: 1, 10, 20(blank)
    assert!(s.move_keyframe(0, 10, 25));
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(
        keys,
        vec![1, 20, 25],
        "key @10 moved to 25; others untouched"
    );
}

#[test]
fn move_keyframe_zero_delta_or_missing_source_is_a_noop() {
    let mut s = session();
    two_keys(&mut s, 10);
    let n = s.history.undo_len();
    assert!(!s.move_keyframe(0, 10, 10), "from == to");
    assert!(!s.move_keyframe(0, 99, 30), "no keyframe at from");
    assert!(!s.move_keyframe(0, 10, 0), "to < 1");
    assert_eq!(s.history.undo_len(), n, "no commands for no-ops");
}

#[test]
fn move_keyframe_collision_is_blocked() {
    let mut s = session();
    two_keys(&mut s, 10);
    let n = s.history.undo_len();
    assert!(!s.move_keyframe(0, 10, 1), "target 1 occupied");
    assert_eq!(s.history.undo_len(), n, "no command on collision");
    assert!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .contains_key(&10),
        "source intact"
    );
}

#[test]
fn move_keyframe_undo_redo_is_exact() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.move_keyframe(0, 10, 25));

    s.undo();
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 10], "undo restores the original frame");

    s.redo();
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 25]);
}

#[test]
fn move_keyframe_blocked_on_locked_layer() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.move_keyframe(0, 10, 25));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn move_keyframe_works_on_a_non_active_layer() {
    let mut s = session();
    two_keys(&mut s, 10); // layer 0 (keys 1, 10)
    s.create_layer(); // layer 1 active, empty
                      // move the keyframe on layer 0 even though layer 1 is active
    assert!(s.move_keyframe(0, 10, 25));
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(
        keys,
        vec![1, 25],
        "cross-layer move by explicit layer index"
    );
}

#[test]
fn moving_a_blank_keyframe_preserves_blankness() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.insert_blank_keyframe(20);
    assert!(s.move_keyframe(0, 20, 30));
    assert!(
        matches!(
            s.doc.scene(0).unwrap().layers[0].keyframes.get(&30),
            Some(animator_core::Frame::Blank)
        ),
        "blank record moved verbatim"
    );
    assert!(s.evaluate(30).is_empty());
}

// ——— Alt-drag duplicate ———

#[test]
fn duplicate_keyframe_copies_record_and_undo_removes() {
    let mut s = session();
    two_keys(&mut s, 10);
    assert!(s.duplicate_keyframe(0, 10, 15));
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 10, 15], "duplicate inserted; source intact");
    assert_eq!(s.evaluate(15).len(), 1, "duplicated content present");

    s.undo();
    let keys: Vec<u32> = s.doc.scene(0).unwrap().layers[0]
        .keyframes
        .keys()
        .copied()
        .collect();
    assert_eq!(keys, vec![1, 10], "undo removes the duplicate only");
}

#[test]
fn duplicate_keyframe_collision_and_missing_source_are_noops() {
    let mut s = session();
    two_keys(&mut s, 10);
    let n = s.history.undo_len();
    assert!(!s.duplicate_keyframe(0, 10, 1), "target occupied");
    assert!(!s.duplicate_keyframe(0, 99, 30), "no source");
    assert!(!s.duplicate_keyframe(0, 10, 0), "to < 1");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn duplicate_keyframe_blocked_on_locked_layer() {
    let mut s = session();
    two_keys(&mut s, 10);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.duplicate_keyframe(0, 10, 15));
    assert_eq!(s.history.undo_len(), n);
}
