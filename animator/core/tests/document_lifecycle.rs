// SYS-02 document lifecycle — STM-DIRTY tracking + Settings fields +
// Session::from_document reload contract (selection/playhead/history reset).
use animator_core::{Document, Session, Settings};

#[test]
fn settings_default_platform_and_units() {
    let s = Settings::default();
    assert_eq!(s.units, "px");
    assert_eq!(s.platform, "HTML5 Canvas");
    assert_eq!(s.width, 1920.0);
    assert_eq!(s.height, 1080.0);
    assert_eq!(s.fps, 24);
    assert_eq!(s.background, "#ffffff");
}

#[test]
fn settings_backward_compatible_without_units_platform() {
    // Old project JSON (pre-SYS-02) has no units/platform → serde defaults.
    let doc: Document = serde_json::from_str(
        r##"{"settings":{"width":800.0,"height":600.0,"fps":30,"background":"#000000"},
            "scenes":[],"nodes":{},"next_id":1}"##,
    )
    .expect("legacy document deserializes");
    assert_eq!(doc.settings.units, "px");
    assert_eq!(doc.settings.platform, "HTML5 Canvas");
    assert_eq!(doc.settings.fps, 30);
}

#[test]
fn session_starts_clean_and_mutations_mark_dirty() {
    let mut s = Session::new(Settings::default());
    assert!(!s.is_dirty(), "new document is clean");
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty(), "a mutation marks the document dirty");
    s.mark_clean();
    assert!(!s.is_dirty(), "mark_clean clears dirty");
}

#[test]
fn undo_and_redo_are_mutations_mark_dirty() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    s.mark_clean();
    assert!(s.undo(), "undo succeeds");
    assert!(s.is_dirty(), "undo is a document mutation (STM-DIRTY)");
    s.mark_clean();
    assert!(s.redo(), "redo succeeds");
    assert!(s.is_dirty(), "redo is a document mutation (STM-DIRTY)");
}

#[test]
fn set_document_settings_marks_dirty_and_preserves_units_platform() {
    let mut s = Session::new(Settings::default());
    assert!(s.set_document_settings(animator_core::SettingsPatch {
        width: Some(1280.0),
        ..Default::default()
    }));
    assert!(s.is_dirty());
    assert_eq!(s.doc.settings.width, 1280.0);
    assert_eq!(
        s.doc.settings.units, "px",
        "units preserved on settings edit"
    );
    assert_eq!(s.doc.settings.platform, "HTML5 Canvas");
}

#[test]
fn save_does_not_clear_undo_history() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    let undo_len = s.history.undo_len();
    s.mark_clean(); // what Save does
    assert_eq!(s.history.undo_len(), undo_len, "save keeps the undo stack");
    assert!(s.undo(), "undo still available after save");
    assert!(s.is_dirty(), "undo after save re-dirties the document");
}

#[test]
fn undo_back_to_the_exact_saved_state_is_clean() {
    // H00 §7: dirty = "differs from last-saved snapshot" — NOT "has undo
    // entries". A brand-new document is CLEAN (baseline = empty). One draw →
    // DIRTY. Undo back to empty → CLEAN again (the document now equals the
    // saved baseline).
    let mut s = Session::new(Settings::default());
    assert!(!s.is_dirty(), "new doc starts clean");

    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty(), "mutation dirties the document");

    assert!(s.undo(), "undo succeeds");
    assert!(
        !s.is_dirty(),
        "undo returning to the exact saved state is CLEAN (H00 §7)"
    );
}

#[test]
fn redo_away_and_back_again_tracks_the_snapshot() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    s.mark_clean(); // saved baseline = {rect}

    assert!(s.undo(), "undo");
    assert!(s.is_dirty(), "doc (empty) != saved (rect) -> dirty");
    assert!(s.redo(), "redo");
    assert!(
        !s.is_dirty(),
        "redo returns to the saved state → CLEAN (H00 §7)"
    );
}

#[test]
fn partial_undo_keeps_dirty_until_content_matches_the_snapshot() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    s.draw_rect(20.0, 20.0, 5.0, 5.0, "#00ff00");
    s.mark_clean(); // saved baseline = {rect1, rect2}

    assert!(s.undo(), "undo rect2");
    assert!(s.is_dirty(), "doc (rect1 only) != saved -> dirty");
    assert!(s.undo(), "undo rect1");
    assert!(s.is_dirty(), "doc (empty) != saved (two rects) -> dirty");

    assert!(s.redo(), "redo rect1");
    assert!(s.is_dirty(), "doc (one rect) != saved -> dirty");
    assert!(s.redo(), "redo rect2");
    assert!(!s.is_dirty(), "content matches the saved baseline -> clean");
}

#[test]
fn save_then_edit_then_undo_to_saved_is_clean() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    s.mark_clean(); // Save: baseline = {rect}

    s.draw_rect(50.0, 50.0, 3.0, 3.0, "#0000ff"); // new edit → dirty
    assert!(s.is_dirty());

    assert!(s.undo(), "undo the new edit");
    assert!(!s.is_dirty(), "document equals the saved baseline → clean");
    assert!(s.undo(), "history is still intact (save did not clear it)");
    assert!(
        s.is_dirty(),
        "undoing below the saved baseline → dirty again"
    );
}

#[test]
fn from_document_resets_selection_playhead_and_history() {
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    s.set_playhead(5);
    let doc = s.doc.clone();

    let reloaded = Session::from_document(doc);
    assert_eq!(reloaded.playhead, 1, "playhead reset on load");
    assert!(reloaded.selection.is_empty(), "selection reset on load");
    assert_eq!(reloaded.history.undo_len(), 0, "history reset on load");
    assert!(!reloaded.is_dirty(), "loaded document is clean");
}
