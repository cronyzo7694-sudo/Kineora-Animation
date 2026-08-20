//! Frame range + clipboard/sequence-op acceptance tests — UNIT E (Phase 4,
//! Part 07 §7.4.6–10 + F-07-12/13). Verifies copy/cut/paste frames (relative
//! offsets, overwrite), remove frames (gap, no shift), reverse frames (record
//! order, ≥2 guard), with exact undo/redo, no-op guards, locked-layer guards.

use animator_core::{Session, Settings};

fn session() -> Session {
    Session::new(Settings::default())
}

/// Build a layer with three content keyframes at 1, 5, 10, each holding a
/// DISTINCT single rect (F7 blank then draw, so content does not accumulate).
fn three_keys(
    s: &mut Session,
) -> (
    animator_core::NodeId,
    animator_core::NodeId,
    animator_core::NodeId,
) {
    let a = s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111"); // key @1 content [a]
    s.set_playhead(5);
    s.insert_blank_keyframe(5); // blank @5 (breaks the hold)
    let b = s.draw_rect(100.0, 0.0, 10.0, 10.0, "#222222"); // draw @5 → content [b]
    s.set_playhead(10);
    s.insert_blank_keyframe(10); // blank @10
    let c = s.draw_rect(200.0, 0.0, 10.0, 10.0, "#333333"); // draw @10 → content [c]
    s.clear_selection();
    (a, b, c)
}

fn keys_at(s: &Session, layer: usize) -> Vec<u32> {
    s.doc.scene(0).unwrap().layers[layer]
        .keyframes
        .keys()
        .copied()
        .collect()
}

#[test]
fn copy_then_paste_preserves_relative_offsets() {
    let mut s = session();
    three_keys(&mut s);
    assert!(s.copy_frames(0, 1, 10)); // clipboard = keyframes @1,5,10
    assert_eq!(s.frame_clipboard.len(), 3);

    assert!(s.paste_frames(0, 20)); // paste at 20 → 20, 24, 29
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![1, 5, 10, 20, 24, 29],
        "relative spacing preserved"
    );
}

#[test]
fn paste_overwrites_collisions_and_undo_restores() {
    let mut s = session();
    three_keys(&mut s);
    assert!(s.copy_frames(0, 1, 5)); // clipboard @1,5
    assert!(s.paste_frames(0, 1)); // paste at 1 → overwrite @1 and @5 (same positions)

    s.undo(); // undo the paste
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(
        keys,
        vec![1, 5, 10],
        "undo restores the pre-paste keyframes"
    );
}

#[test]
fn paste_empty_clipboard_is_a_noop() {
    let mut s = session();
    three_keys(&mut s);
    let n = s.history.undo_len();
    assert!(!s.paste_frames(0, 20), "nothing in the clipboard");
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn copy_empty_range_is_a_noop() {
    let mut s = session();
    three_keys(&mut s);
    assert!(!s.copy_frames(0, 50, 60), "no keyframes in range");
    assert!(s.frame_clipboard.is_empty());
}

#[test]
fn cut_removes_keyframes_and_fills_clipboard() {
    let mut s = session();
    three_keys(&mut s);
    assert!(s.cut_frames(0, 5, 10)); // cut @5 and @10
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1], "cut removed the keyframes (gap remains)");
    assert_eq!(
        s.frame_clipboard.len(),
        2,
        "clipboard holds the cut records"
    );

    s.undo(); // undo the cut's remove command
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 5, 10], "undo restores the cut keyframes");
}

#[test]
fn remove_frames_leaves_a_gap_without_shifting() {
    let mut s = session();
    three_keys(&mut s);
    assert!(s.remove_frames(0, 5, 5)); // remove only @5
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 10], "@5 removed; @10 does NOT shift (gap)");

    s.undo();
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 5, 10]);
}

#[test]
fn reverse_frames_swaps_record_order_within_range() {
    let mut s = session();
    let (a, _b, c) = three_keys(&mut s); // keyframes @1(A), @5(B), @10(C)
    assert!(s.reverse_frames(0, 1, 10));
    // content order reversed: @1 holds C, @5 holds B, @10 holds A
    let f1 = s.doc.content_at(0, 0, 1);
    let f10 = s.doc.content_at(0, 0, 10);
    assert_eq!(f1, vec![c], "frame 1 now holds the frame-10 content");
    assert_eq!(f10, vec![a], "frame 10 now holds the frame-1 content");

    s.undo();
    assert_eq!(s.doc.content_at(0, 0, 1), vec![a]);
    assert_eq!(s.doc.content_at(0, 0, 10), vec![c]);
}

#[test]
fn reverse_single_keyframe_is_a_noop() {
    let mut s = session();
    three_keys(&mut s);
    let n = s.history.undo_len();
    assert!(
        !s.reverse_frames(0, 10, 10),
        "single keyframe in range → no-op"
    );
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn sequence_ops_blocked_on_locked_layer() {
    let mut s = session();
    three_keys(&mut s);
    s.set_layer_locked(0, true);
    let n = s.history.undo_len();
    assert!(!s.cut_frames(0, 1, 5));
    assert!(!s.remove_frames(0, 1, 5));
    assert!(!s.reverse_frames(0, 1, 10));
    assert!(!s.paste_frames(0, 20));
    assert_eq!(
        s.history.undo_len(),
        n,
        "all blocked ops create no commands"
    );
    // copy is read-only → still allowed on locked layers
    assert!(s.copy_frames(0, 1, 10));
    assert_eq!(s.frame_clipboard.len(), 3);
}

#[test]
fn cut_paste_reverse_undo_redo_chain_is_exact() {
    let mut s = session();
    three_keys(&mut s);
    // cut @5,@10 then paste at 20
    assert!(s.cut_frames(0, 5, 10));
    assert!(s.paste_frames(0, 20)); // clipboard @5,@10 → paste at 20 → 20, 25
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 20, 25]);

    s.undo(); // undo paste
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1]);

    s.undo(); // undo cut
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 5, 10]);

    s.redo(); // redo cut
    s.redo(); // redo paste
    let mut keys = keys_at(&s, 0);
    keys.sort_unstable();
    assert_eq!(keys, vec![1, 20, 25]);
}

#[test]
fn reverse_preserves_blank_keyframes_by_position() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111"); // @1 content
    s.insert_blank_keyframe(5); // blank @5
    s.insert_keyframe(10); // content @10 (copies @1)
                           // records: @1 content A, @5 blank, @10 content A'
    assert!(s.reverse_frames(0, 1, 10));
    // @1 ↔ @10 swap (both content), @5 blank stays
    assert!(!s.evaluate(1).is_empty(), "frame 1 content");
    assert!(s.evaluate(5).is_empty(), "frame 5 still blank");
    assert!(!s.evaluate(10).is_empty(), "frame 10 content");
}
