//! Frame-sequence / exposure / label acceptance tests — UNIT G (Phase 4,
//! Part 07 §7.4.8–12 + §7.2 + §7.3 / F-15-05). Verifies sequence move (exposure
//! preserved, overwrite prompt semantics), span-edge resize (extend/shorten,
//! min exposure 1), duplicate range, convert-to-keyframes (playback-preserving)
//! and convert-to-blank, frame labels — with exact undo/redo, no-op guards, and
//! locked-layer guards.

use animator_core::{Frame, Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Keyframes @1 (rect A at 0,0) and @10 (rect A moved to 100,0) — the SAME node
/// so a tween is possible; content keyframes at 1 and 10.
fn pair(s: &mut Session) -> animator_core::NodeId {
    let id = s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // key @1
    s.insert_keyframe(10); // copies content
    s.move_selection(100.0, 0.0); // key @10 x=100
    id
}

fn keys_at(s: &Session, layer: usize) -> Vec<u32> {
    s.doc.scene(0).unwrap().layers[layer]
        .keyframes
        .keys()
        .copied()
        .collect()
}

// ——— MoveKeyframeSequence ———

#[test]
fn sequence_move_preserves_exposure() {
    let mut s = session();
    pair(&mut s); // keys @1, @10 (exposure 9)
    assert!(s.move_keyframe_sequence(0, 1, 5, false)); // move the @1 span to @5
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![5, 14], "exposure preserved: 5..13 (length 9)");
}

#[test]
fn sequence_move_undo_redo_is_exact() {
    let mut s = session();
    pair(&mut s);
    assert!(s.move_keyframe_sequence(0, 1, 5, false));
    s.undo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10], "undo restores original positions");
    s.redo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![5, 14]);
}

#[test]
fn sequence_move_collision_without_overwrite_is_a_noop() {
    let mut s = session();
    pair(&mut s); // @1, @10
    s.insert_blank_keyframe(14); // a keyframe already at 14 (target of a @1→@5 move)
    let n = s.history.undo_len();
    assert!(
        !s.move_keyframe_sequence(0, 1, 5, false),
        "target occupied → blocked"
    );
    assert_eq!(s.history.undo_len(), n, "no command");
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10, 14], "nothing moved");
}

#[test]
fn sequence_move_collision_with_overwrite_replaces() {
    let mut s = session();
    pair(&mut s); // @1, @10
    s.insert_blank_keyframe(14); // occupied target
    assert!(
        s.move_keyframe_sequence(0, 1, 5, true),
        "overwrite replaces targets"
    );
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![5, 14],
        "the blank at 14 was overwritten by the span end"
    );
    // content at 5 = the moved keyframe's content
    assert_eq!(s.evaluate(5).len(), 1);

    s.undo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10, 14], "undo restores the blank + originals");
}

#[test]
fn sequence_move_last_keyframe_is_a_single_move() {
    let mut s = session();
    pair(&mut s);
    // move the LAST keyframe (@10) — no span end, behaves like a single move
    assert!(s.move_keyframe_sequence(0, 10, 20, false));
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 20], "last keyframe moved alone");
}

#[test]
fn sequence_move_zero_delta_or_missing_source_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.move_keyframe_sequence(0, 1, 1, false), "zero delta");
    assert!(!s.move_keyframe_sequence(0, 99, 30, false), "no source");
    assert!(!s.move_keyframe_sequence(0, 1, 0, false), "to < 1");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn sequence_move_blocked_on_locked_layer() {
    let mut s = session();
    pair(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.move_keyframe_sequence(0, 1, 5, false));
    assert_eq!(s.history.undo_len(), n);
}

// ——— ResizeSpan ———

#[test]
fn span_resize_extends_exposure() {
    let mut s = session();
    pair(&mut s); // @1, @10 (exposure 9)
    assert!(s.resize_span(0, 1, 3)); // extend by 3 → @10 becomes @13
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 13], "exposure 9 → 12");
}

#[test]
fn span_resize_shortens_exposure() {
    let mut s = session();
    pair(&mut s);
    assert!(s.resize_span(0, 1, -3)); // shorten by 3 → @10 becomes @7
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 7], "exposure 9 → 6");
}

#[test]
fn span_resize_clamps_to_minimum_exposure_one() {
    let mut s = session();
    pair(&mut s); // @1, @10 (exposure 9)
                  // a wild negative delta is CLAMPED to the min exposure (1 frame), not applied verbatim
    assert!(s.resize_span(0, 1, -100));
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![1, 2],
        "exposure clamped to 1 (next keyframe at 2)"
    );

    // already at min → further shorten is a no-op
    let n = s.history.undo_len();
    assert!(!s.resize_span(0, 1, -5), "already at min exposure");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn span_resize_zero_delta_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.resize_span(0, 1, 0));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn span_resize_on_last_keyframe_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.resize_span(0, 10, 5), "last keyframe holds to infinity");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn span_resize_undo_redo_is_exact() {
    let mut s = session();
    pair(&mut s);
    assert!(s.resize_span(0, 1, 3));
    s.undo();
    assert!(keys_at(&s, 0).contains(&10));
    s.redo();
    assert!(keys_at(&s, 0).contains(&13));
}

#[test]
fn span_resize_shifts_tween_end_with_keyframes() {
    let mut s = session();
    pair(&mut s);
    s.set_classic_tween(0, 1, 10, 0.0);
    assert!(s.resize_span(0, 1, 2)); // end keyframe 10→12
    let tw = s.doc.scene(0).unwrap().layers[0]
        .tweens
        .get(&1)
        .unwrap()
        .clone();
    assert_eq!(tw.end, 12, "tween end follows the shifted keyframe");
}

#[test]
fn span_resize_blocked_on_locked_layer() {
    let mut s = session();
    pair(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.resize_span(0, 1, 3));
    assert_eq!(s.history.undo_len(), n);
}

// ——— DuplicateFrames ———

#[test]
fn duplicate_range_inserts_after_and_shifts_later() {
    let mut s = session();
    pair(&mut s); // @1, @10
    s.insert_blank_keyframe(20); // @20
    assert!(s.duplicate_frames(0, 1, 10)); // range 1..10 (len 10)
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![1, 10, 11, 20, 30],
        "duplicates at 11,20; @20 shifted to 30"
    );
}

#[test]
fn duplicate_range_undo_redo_is_exact() {
    let mut s = session();
    pair(&mut s);
    assert!(s.duplicate_frames(0, 1, 10));
    s.undo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10]);
    s.redo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10, 11, 20]);
}

#[test]
fn duplicate_empty_range_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.duplicate_frames(0, 50, 60), "no keyframes in range");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn duplicate_range_blocked_on_locked_layer() {
    let mut s = session();
    pair(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.duplicate_frames(0, 1, 10));
    assert_eq!(s.history.undo_len(), n);
}

// ——— Convert to Keyframes / Blank ———

#[test]
fn convert_held_frames_to_keyframes_preserves_playback() {
    let mut s = session();
    pair(&mut s); // @1 (x=0), @10 (x=100)
    let before = s.evaluate(5)[0].clone(); // held frame: x=0
    assert_eq!(before.x, 0.0);

    assert!(s.convert_to_keyframes(0, 2, 9)); // held frames 2..9 become keys
    for f in 2..=9 {
        assert!(
            s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&f),
            "frame {f} is now a keyframe"
        );
        assert_eq!(s.evaluate(f)[0].x, 0.0, "playback preserved at frame {f}");
    }
    s.undo();
    assert!(
        !s.doc.scene(0).unwrap().layers[0].keyframes.contains_key(&2),
        "undo removes baked keys"
    );
}

#[test]
fn convert_held_frames_preserves_transforms() {
    let mut s = session();
    pair(&mut s); // @1 x=0, @10 x=100
    s.convert_to_keyframes(0, 3, 5);
    // the baked keyframes must hold the SAME transform as the hold (x=0), not
    // the node's base transform — else the object would jump.
    assert_eq!(s.evaluate(4)[0].x, 0.0, "baked frame holds x=0");
}

#[test]
fn convert_to_blank_keyframes_empties_hold_and_undoes() {
    let mut s = session();
    pair(&mut s); // @1, @10
    assert!(s.convert_to_blank_keyframes(0, 2, 9));
    assert!(s.evaluate(5).is_empty(), "frames 2..9 blank");
    s.undo();
    assert_eq!(s.evaluate(5).len(), 1, "undo restores the hold");
}

#[test]
fn convert_no_content_hold_is_a_noop() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 50.0, 50.0, "#ff0000"); // @1
    s.insert_blank_keyframe(5); // blank @5 → no content hold at 6+
    let n = s.history.undo_len();
    assert!(
        !s.convert_to_keyframes(0, 6, 9),
        "no content hold after a blank"
    );
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn convert_already_keyframes_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    let n = s.history.undo_len();
    assert!(!s.convert_to_keyframes(0, 1, 1), "already a keyframe");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn convert_ops_blocked_on_locked_layer() {
    let mut s = session();
    pair(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.convert_to_keyframes(0, 2, 9));
    assert!(!s.convert_to_blank_keyframes(0, 2, 9));
    assert_eq!(s.history.undo_len(), n);
}

// ——— Frame labels ———

#[test]
fn label_set_clear_undo_redo() {
    let mut s = session();
    pair(&mut s);
    assert!(s.set_frame_label(0, 1, Some("walk_01")));
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        Some("walk_01")
    );

    s.undo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        None
    );
    s.redo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        Some("walk_01")
    );

    // clear via empty string
    assert!(s.set_frame_label(0, 1, Some("   ")));
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        None
    );
    s.undo();
    assert_eq!(
        s.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        Some("walk_01")
    );
}

#[test]
fn label_on_blank_or_missing_keyframe_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    s.insert_blank_keyframe(15);
    let n = s.history.undo_len();
    assert!(
        !s.set_frame_label(0, 15, Some("x")),
        "blank keyframe cannot be labeled"
    );
    assert!(!s.set_frame_label(0, 99, Some("x")), "no keyframe at 99");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn label_unchanged_is_a_noop() {
    let mut s = session();
    pair(&mut s);
    s.set_frame_label(0, 1, Some("a"));
    let n = s.history.undo_len();
    assert!(
        !s.set_frame_label(0, 1, Some("a")),
        "same label → no command"
    );
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn label_survives_save_load() {
    let path = std::env::temp_dir().join("animator_label_test.json");
    let mut s = session();
    pair(&mut s);
    s.set_frame_label(0, 1, Some("start"));
    s.save(&path).unwrap();

    let loaded = Session::load(&path).unwrap();
    assert_eq!(
        loaded.doc.scene(0).unwrap().layers[0]
            .keyframes
            .get(&1)
            .unwrap()
            .label(),
        Some("start"),
        "label persisted"
    );
    let _ = std::fs::remove_file(&path);
}

#[test]
fn label_never_affects_evaluate_or_export() {
    let mut s = session();
    pair(&mut s);
    s.set_frame_label(0, 1, Some("flagged"));
    // labels are metadata — they must not change evaluated content or appear
    // in the SVG
    assert_eq!(s.evaluate(1).len(), 1);
    let svg = s.export_svg(1);
    assert!(!svg.contains("flagged"), "labels never leak into export");
    // the keyframe record still has the label (model truth)
    assert!(matches!(
        s.doc.scene(0).unwrap().layers[0].keyframes.get(&1),
        Some(Frame::Keyframe { label: Some(_), .. })
    ));
}
