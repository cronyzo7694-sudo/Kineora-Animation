//! SYS-03 C-2 / INV-EDIT-2 — undo/redo restore prevSelection.
//! Session captures selection around execute (Command trait stays mutation-only).
//! History bound = 100 (RSK-011 / eng 05).

use animator_core::{History, Session, Settings, HISTORY_BOUND};

fn session() -> Session {
    Session::new(Settings::default())
}

#[test]
fn undo_restores_selection_from_before_the_command() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 20.0, 20.0, "#111111");
    assert_eq!(s.selection, vec![a]);
    let b = s.draw_rect(40.0, 0.0, 20.0, 20.0, "#222222");
    assert_eq!(s.selection, vec![b], "draw selects the new object");

    assert!(s.undo());
    assert_eq!(
        s.selection,
        vec![a],
        "undo draw B restores the pre-command selection [A]"
    );
    assert_eq!(s.current_frame().len(), 1);
}

#[test]
fn redo_restores_post_command_selection() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 20.0, 20.0, "#111111");
    let b = s.draw_rect(40.0, 0.0, 20.0, 20.0, "#222222");
    assert!(s.undo());
    assert_eq!(s.selection, vec![a]);
    assert!(s.redo());
    assert_eq!(
        s.selection,
        vec![b],
        "redo draw B restores the post-command selection [B]"
    );
    assert_eq!(s.current_frame().len(), 2);
}

#[test]
fn undo_of_first_draw_restores_empty_selection() {
    let mut s = session();
    assert!(s.selection.is_empty());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert_eq!(s.selection.len(), 1);
    assert!(s.undo());
    assert!(
        s.selection.is_empty(),
        "undo first draw → prevSelection was empty"
    );
}

#[test]
fn view_only_selection_change_does_not_steal_post_snapshot() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 20.0, 20.0, "#111111");
    let b = s.draw_rect(80.0, 0.0, 20.0, 20.0, "#222222");
    s.clear_selection(); // VIEW — no command
    assert!(s.selection.is_empty());
    assert!(s.undo());
    assert_eq!(
        s.selection,
        vec![a],
        "undo ignores the later view-only clear; restores pre-draw-B"
    );
    assert!(s.redo());
    assert_eq!(
        s.selection,
        vec![b],
        "redo still restores post-draw-B, not the cleared selection"
    );
}

#[test]
fn delete_undo_restores_the_deleted_selection() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 20.0, 20.0, "#111111");
    assert!(s.delete_selection());
    assert!(s.selection.is_empty());
    assert!(s.undo());
    assert_eq!(s.selection, vec![a], "undo delete restores prevSelection");
    assert_eq!(s.current_frame().len(), 1);
}

#[test]
fn empty_undo_is_noop() {
    let mut s = session();
    assert!(!s.undo());
    assert!(!s.redo());
    assert!(s.selection.is_empty());
}

#[test]
fn history_bound_drops_oldest() {
    let mut s = session();
    let mut ids = Vec::new();
    for i in 0..(HISTORY_BOUND + 5) {
        ids.push(s.draw_rect(i as f64, 0.0, 4.0, 4.0, "#000000"));
    }
    assert_eq!(
        s.history.undo_len(),
        HISTORY_BOUND,
        "RSK-011 default bound 100"
    );
    // Oldest 5 commands are gone: undoing the full remaining stack lands
    // after draw #4, and one more undo is a no-op.
    let mut undos = 0;
    while s.undo() {
        undos += 1;
    }
    assert_eq!(undos, HISTORY_BOUND);
    assert_eq!(s.current_frame().len(), 5, "first 5 draws survive; 6th+ undone");
    assert_eq!(s.selection, vec![ids[4]], "oldest remaining cmd restores its prev");
    assert!(!s.undo(), "cannot walk past the dropped entries");
}

#[test]
fn history_bound_constant_is_100() {
    assert_eq!(HISTORY_BOUND, 100);
    // smoke: History type is public
    let _ = std::mem::size_of::<History>();
}

#[test]
fn hide_layer_prunes_then_undo_restores_prev_selection() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 20.0, 20.0, "#111111");
    assert_eq!(s.selection, vec![a]);
    assert!(s.set_layer_visible(0, false));
    assert!(
        s.selection.is_empty(),
        "hide drops objects on that layer from selection"
    );
    assert!(s.undo());
    assert_eq!(
        s.selection,
        vec![a],
        "undo hide restores the pre-hide selection"
    );
    assert!(s.redo());
    assert!(
        s.selection.is_empty(),
        "redo hide restores the post-prune (empty) selection"
    );
}

#[test]
fn undo_then_new_command_clears_redo_and_keeps_new_prev() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 10.0, 10.0, "#111111");
    let _b = s.draw_rect(20.0, 0.0, 10.0, 10.0, "#222222");
    assert!(s.undo());
    assert_eq!(s.selection, vec![a]);
    assert!(s.history.redo_len() > 0);
    let c = s.draw_rect(40.0, 0.0, 10.0, 10.0, "#333333");
    assert_eq!(s.history.redo_len(), 0, "T4 redo invalidation");
    assert_eq!(s.selection, vec![c]);
    assert!(s.undo());
    assert_eq!(
        s.selection,
        vec![a],
        "undo of C restores selection as of after undoing B"
    );
    assert!(s.redo());
    assert_eq!(s.selection, vec![c], "redo of C restores post-draw-C");
}

#[test]
fn paste_undo_redo_restores_clipboard_selection() {
    let mut s = session();
    let a = s.draw_rect(0.0, 0.0, 12.0, 12.0, "#111111");
    assert!(s.copy_objects());
    assert!(s.paste_objects(animator_core::PasteMode::InPlace));
    let pasted = s.selection.clone();
    assert_eq!(pasted.len(), 1);
    assert_ne!(pasted[0], a, "paste selects the new clone");
    assert!(s.undo());
    assert_eq!(s.selection, vec![a], "undo paste → pre-paste selection");
    assert!(s.redo());
    assert_eq!(s.selection, pasted, "redo paste → post-paste selection");
}
