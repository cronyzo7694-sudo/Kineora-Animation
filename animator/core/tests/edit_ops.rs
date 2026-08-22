//! SYS-03 object clipboard + SYS-06 transform / arrange / align.
//! Source: Blueprint 1.2.2 / 1.2.5 / Part 24. Native engine tests — not mocked.

use animator_core::{
    app_object_clipboard_len, clear_app_object_clipboard, AlignOp, AlignSpace, ArrangeOp, Frame,
    PasteMode, Session, Settings, DUPLICATE_OFFSET,
};

fn session() -> Session {
    clear_app_object_clipboard();
    Session::new(Settings::default())
}

#[test]
fn copy_is_session_state_not_a_command() {
    let mut s = session();
    s.draw_rect(10.0, 20.0, 40.0, 30.0, "#ff0000");
    let n = s.history.undo_len();
    assert!(s.copy_objects());
    assert_eq!(app_object_clipboard_len(), 1);
    assert_eq!(
        s.history.undo_len(),
        n,
        "copy must not create an undo entry"
    );
    assert!(!s.is_dirty() || s.history.undo_len() == n); // dirty only from the draw
}

#[test]
fn copy_empty_selection_is_noop() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    s.clear_selection();
    assert!(!s.copy_objects());
    assert_eq!(app_object_clipboard_len(), 0);
}

#[test]
fn paste_in_place_creates_independent_clone() {
    let mut s = session();
    let a = s.draw_rect(10.0, 20.0, 40.0, 30.0, "#ff0000");
    assert!(s.copy_objects());
    assert!(s.paste_objects(PasteMode::InPlace));
    assert_eq!(s.current_frame().len(), 2);
    assert_eq!(s.selection.len(), 1);
    assert_ne!(s.selection[0], a, "paste must allocate a new id");
    let items = s.current_frame();
    assert!(items
        .iter()
        .all(|it| (it.x - 10.0).abs() < 0.01 && (it.y - 20.0).abs() < 0.01));
}

#[test]
fn paste_in_center_moves_aabb_to_stage_center() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 100.0, 50.0, "#00ff00");
    assert!(s.copy_objects());
    assert!(s.paste_objects(PasteMode::Center));
    let pasted = s.selection[0];
    let t = s.selected_transform(pasted).unwrap();
    // original AABB center = (50, 25); stage center = (960, 540)
    assert!((t.x - (960.0 - 50.0)).abs() < 0.5, "x={}", t.x);
    assert!((t.y - (540.0 - 25.0)).abs() < 0.5, "y={}", t.y);
}

#[test]
fn paste_undo_redo_is_bit_exact() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 20.0, 20.0, "#abcdef");
    s.copy_objects();
    assert!(s.paste_objects(PasteMode::InPlace));
    assert_eq!(s.current_frame().len(), 2);
    assert!(s.undo());
    assert_eq!(s.current_frame().len(), 1);
    assert!(s.redo());
    assert_eq!(s.current_frame().len(), 2);
}

#[test]
fn cut_removes_from_current_frame_and_fills_clipboard() {
    let mut s = session();
    s.draw_rect(5.0, 5.0, 10.0, 10.0, "#111111");
    assert!(s.cut_objects());
    assert_eq!(s.current_frame().len(), 0);
    assert_eq!(app_object_clipboard_len(), 1);
    assert!(s.paste_objects(PasteMode::InPlace));
    assert_eq!(s.current_frame().len(), 1);
}

#[test]
fn delete_does_not_touch_other_keyframes() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 20.0, 20.0, "#ff0000");
    assert!(s.insert_keyframe(10));
    s.set_playhead(10);
    s.select_all();
    assert!(s.delete_selection());
    assert!(s.evaluate(10).is_empty());
    assert_eq!(s.evaluate(1).len(), 1, "frame 1 must keep the original");
}

#[test]
fn delete_blocked_on_locked_layer() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 20.0, 20.0, "#ff0000");
    assert!(s.set_layer_locked(0, true));
    // lock prunes selection — re-select is also blocked, so delete has nothing
    s.select_all();
    assert!(s.selection.is_empty());
    assert!(!s.delete_selection());
    assert_eq!(s.evaluate(1).len(), 1);
}

#[test]
fn paste_blocked_on_locked_active_layer() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 20.0, 20.0, "#ff0000");
    assert!(s.copy_objects());
    assert!(s.set_layer_locked(0, true));
    assert!(!s.paste_objects(PasteMode::InPlace));
}

#[test]
fn duplicate_offsets_and_is_one_command() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 20.0, 20.0, "#ff0000");
    let n = s.history.undo_len();
    assert!(s.duplicate_objects());
    assert_eq!(s.history.undo_len(), n + 1, "duplicate = one paste command");
    assert_eq!(s.current_frame().len(), 2);
    let dup = s.selection[0];
    let t = s.selected_transform(dup).unwrap();
    assert!((t.x - DUPLICATE_OFFSET).abs() < 0.01);
    assert!((t.y - DUPLICATE_OFFSET).abs() < 0.01);
}

#[test]
fn rotate_90_is_one_undoable_command() {
    let mut s = session();
    s.draw_rect(0.0, 0.0, 40.0, 20.0, "#00ff00");
    assert!(s.rotate_selection(90.0));
    let t = s.selected_transform(s.selection[0]).unwrap();
    assert!((t.rotation - 90.0).abs() < 0.01);
    s.undo();
    let t = s.selected_transform(s.selection[0]).unwrap();
    assert!((t.rotation).abs() < 0.01);
}

#[test]
fn flip_h_keeps_visual_center() {
    let mut s = session();
    s.draw_rect(100.0, 50.0, 40.0, 20.0, "#00ff00");
    let before = s.selected_transform(s.selection[0]).unwrap();
    let cx = before.x + 40.0 * before.scale_x / 2.0;
    assert!(s.flip_selection(true));
    let after = s.selected_transform(s.selection[0]).unwrap();
    let cx2 = after.x + 40.0 * after.scale_x / 2.0;
    assert!((cx - cx2).abs() < 0.01, "center x {cx} vs {cx2}");
    assert!((after.scale_x + 1.0).abs() < 0.01);
}

#[test]
fn remove_transform_resets_scale_and_rotation_keeps_xy() {
    let mut s = session();
    s.draw_rect(30.0, 40.0, 20.0, 20.0, "#00ff00");
    assert!(s.rotate_selection(45.0));
    assert!(s.remove_transform());
    let t = s.selected_transform(s.selection[0]).unwrap();
    assert!((t.rotation).abs() < 0.01);
    assert!((t.scale_x - 1.0).abs() < 0.01);
    assert!((t.x - 30.0).abs() < 0.01);
    assert!((t.y - 40.0).abs() < 0.01);
}

#[test]
fn arrange_front_moves_selection_to_end_of_content() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    let _b = s.draw_rect(20.0, 0.0, 10.0, 10.0, "#222222");
    let _c = s.draw_rect(40.0, 0.0, 10.0, 10.0, "#333333");
    s.selection = vec![a];
    assert!(s.arrange_selection(ArrangeOp::Front));
    let content = match &s.doc.scenes[0].layers[0].keyframes[&1] {
        Frame::Keyframe { content, .. } => content.clone(),
        _ => panic!("expected keyframe"),
    };
    assert_eq!(content.last().copied(), Some(a));
}

#[test]
fn arrange_back_moves_selection_to_start() {
    let mut s = session();
    let _a = s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    let _b = s.draw_rect(20.0, 0.0, 10.0, 10.0, "#222222");
    let c = s.draw_rect(40.0, 0.0, 10.0, 10.0, "#333333");
    s.selection = vec![c];
    assert!(s.arrange_selection(ArrangeOp::Back));
    let content = match &s.doc.scenes[0].layers[0].keyframes[&1] {
        Frame::Keyframe { content, .. } => content.clone(),
        _ => panic!("expected keyframe"),
    };
    assert_eq!(content.first().copied(), Some(c));
}

#[test]
fn align_single_object_uses_stage() {
    let mut s = session();
    s.draw_rect(100.0, 200.0, 40.0, 20.0, "#00ff00");
    assert!(s.align_selection(AlignOp::Left, AlignSpace::Selection));
    let t = s.selected_transform(s.selection[0]).unwrap();
    assert!(
        (t.x - 0.0).abs() < 0.01,
        "single-object align-left → stage x=0, got {}",
        t.x
    );
}

#[test]
fn align_two_objects_left_to_selection() {
    let mut s = session();
    let a = s.draw_rect(50.0, 0.0, 20.0, 20.0, "#111111");
    let b = s.draw_rect(150.0, 0.0, 20.0, 20.0, "#222222");
    s.selection = vec![a, b];
    assert!(s.align_selection(AlignOp::Left, AlignSpace::Selection));
    let ta = s.selected_transform(a).unwrap();
    let tb = s.selected_transform(b).unwrap();
    assert!((ta.x - 50.0).abs() < 0.01, "leftmost stays, x={}", ta.x);
    assert!((tb.x - 50.0).abs() < 0.01, "right moves to 50, x={}", tb.x);
}

#[test]
fn clipboard_is_application_level_across_sessions() {
    let mut a = session();
    a.draw_rect(10.0, 20.0, 40.0, 30.0, "#ff0000");
    assert!(a.copy_objects());
    let mut b = Session::new(Settings::default()); // must NOT clear app clipboard
    assert_eq!(app_object_clipboard_len(), 1);
    assert!(b.paste_objects(PasteMode::InPlace));
    assert_eq!(b.current_frame().len(), 1);
}

#[test]
fn from_document_does_not_clear_app_clipboard() {
    let mut a = session();
    a.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    assert!(a.copy_objects());
    let _b = Session::from_document(a.doc.clone());
    assert_eq!(app_object_clipboard_len(), 1);
}

#[test]
fn empty_ops_create_no_command() {
    let mut s = session();
    let n = s.history.undo_len();
    assert!(!s.copy_objects());
    assert!(!s.paste_objects(PasteMode::InPlace));
    assert!(!s.delete_selection());
    assert!(!s.rotate_selection(90.0));
    assert!(!s.flip_selection(true));
    assert!(!s.remove_transform());
    assert!(!s.arrange_selection(ArrangeOp::Front));
    assert!(!s.align_selection(AlignOp::Left, AlignSpace::Stage));
    assert_eq!(s.history.undo_len(), n);
}

#[test]
fn paste_and_duplicate_blocked_when_active_layer_is_a_folder() {
    // SYS-03 H02: folders are organizational and hold no frames. Paste must
    // not silently create orphan nodes (draw_rect already blocks folders;
    // paste/duplicate must match). No command, no dirty, no selection change.
    let mut s = session();
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#fff");
    assert!(s.copy_objects(), "copy the rect");

    let folder = s.create_folder().expect("folder");
    s.set_active_layer(folder);

    let undo_before = s.history.undo_len();
    let sel_before = s.selection.clone();
    assert!(
        !s.paste_objects(PasteMode::Center),
        "paste onto a folder layer must be blocked"
    );
    assert_eq!(
        s.history.undo_len(),
        undo_before,
        "blocked paste must not create an undo entry"
    );
    // BUG-D-001: the original assertion (`selection.is_empty()`) contradicted
    // its own comment ("must not change selection"). Draw+copy leaves the
    // source rect selected on Layer 1; activating a folder does not clear
    // that selection; a blocked paste must leave it untouched.
    assert_eq!(
        s.selection, sel_before,
        "blocked paste must not change selection"
    );

    // Duplicate goes through paste and must be blocked too.
    assert!(
        !s.duplicate_objects(),
        "duplicate with active folder must be blocked (paste path)"
    );
    assert_eq!(s.history.undo_len(), undo_before);
}
