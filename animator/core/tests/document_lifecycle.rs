// SYS-02 document lifecycle — STM-DIRTY tracking + Settings fields +
// Session::from_document reload contract (selection/playhead/history reset).
use animator_core::{Document, Session, Settings, SettingsPatch};

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

// ————————————————————————————————————————————————————————————————
// H04 — DIRTY STATE + UNSAVED CHANGES (snapshot-based, H04 §6.0/§7).
// DIRTY ⇔ current state ≠ saved snapshot. "Has undo entries" is NOT the
// dirty definition — undo/redo are only EXAMPLES of snapshot-reaching
// mutations (INV-DIRTY-2 rewritten, H04 v2).
// ————————————————————————————————————————————————————————————————

#[test]
fn h04_a_fresh_mutation_returning_to_the_snapshot_is_clean_not_undo() {
    // T-dirty-mutation-snapshot (H04 §14 #26): fps 24 → 30 → 24 — a NON-undo
    // mutation that returns the state to the exact saved snapshot clears DIRTY
    // without any write.
    let mut s = Session::new(Settings::default());
    let path = std::env::temp_dir().join("h04-mutation-snapshot.json");
    s.save(&path).unwrap();
    assert!(!s.is_dirty());

    assert!(s.set_document_settings(SettingsPatch {
        fps: Some(30),
        ..Default::default()
    }));
    assert!(s.is_dirty(), "fps 24→30 leaves the snapshot");

    assert!(s.set_document_settings(SettingsPatch {
        fps: Some(24),
        ..Default::default()
    }));
    assert!(
        !s.is_dirty(),
        "fps 30→24 returns to the saved snapshot → CLEAN (no write)"
    );
    std::fs::remove_file(&path).ok();
}

#[test]
fn h04_view_operations_never_dirty() {
    // T-dirty-view-noclean (H04 §14 #24, INV-DIRTY-1): selection, playhead and
    // other VIEW/SESSION operations must NEVER set or clear DIRTY.
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty(), "a document mutation dirties");

    s.select_at(5.0, 5.0);
    s.set_playhead(7);
    s.set_active_layer(0);
    assert!(s.is_dirty(), "view ops do not clear DIRTY");

    // and on a clean document they do not set it either
    let mut s = Session::new(Settings::default());
    s.select_at(1.0, 1.0);
    s.set_playhead(3);
    s.set_active_layer(0);
    assert!(!s.is_dirty(), "view ops never set DIRTY on a clean doc");
}

#[test]
fn h04_failed_save_preserves_dirty_and_last_good() {
    // T-dirty-save-fail (H04 §14 #8, INV-ERR-3): a failed write keeps the
    // document DIRTY (SAVE_ERROR is a sub-state of DIRTY) and never clears
    // the undo history.
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty());
    let undo_before = s.history.undo_len();

    // a path the filesystem will reject (directory does not exist)
    let bad = std::env::temp_dir().join("h04-no-such-dir-xyz/save.json");
    assert!(s.save(&bad).is_err(), "the write fails");
    assert!(s.is_dirty(), "failed save preserves DIRTY (SAVE_ERROR)");
    assert_eq!(
        s.history.undo_len(),
        undo_before,
        "no undo entry from a failed save"
    );
}

#[test]
fn h04_save_success_clears_dirty_but_keeps_history() {
    // T-dirty-save-ok (H04 §14 #10, INV-UNDO-1): a SUCCESSFUL save advances
    // the snapshot to the current state → CLEAN; undo history is preserved.
    // The save FLOW is two steps by design: the write (H05/SYS-28) and the
    // snapshot advance (mark_clean) — only a successful write may advance it
    // (INV-DIRTY-2 path (a)). The UI's file.save command orchestrates both
    // (write → on success → markClean).
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty());
    let path = std::env::temp_dir().join("h04-save-ok.json");
    s.save(&path).unwrap();
    s.history.mark_clean(&s.doc); // write succeeded → snapshot advances
    assert!(!s.is_dirty(), "successful write → CLEAN");
    assert!(
        s.history.undo_len() >= 1,
        "history preserved (save does NOT clear undo)"
    );
    s.undo();
    assert!(
        s.is_dirty(),
        "undoing past the saved snapshot → DIRTY again"
    );
    std::fs::remove_file(&path).ok();
}

// ————————————————————————————————————————————————————————————————
// H05 — SAVE + SAVE AS + FILE IDENTITY (engine side).
// The UI save flow (file.ts) orchestrates: pick → validate → write (SYS-28)
// → modifiedAt stamp → snapshot advance (mark_clean) → CLEAN.
// ————————————————————————————————————————————————————————————————

#[test]
fn h05_modified_at_is_stamped_before_the_snapshot_advance() {
    // H05 §7.1 binding order: write SUCCEEDS → modifiedAt ← now (H05) →
    // saved snapshot advances → CLEAN. The stamp lands BEFORE mark_clean so
    // the snapshot includes it — a later content-equality dirty comparison
    // (T6) is unaffected by the metadata stamp.
    let mut s = Session::new(Settings::default());
    let path = std::env::temp_dir().join("h05-modified-at.json");
    s.save(&path).unwrap(); // 1: the write of the current (empty) state (SYS-28)
    s.doc.meta.modified_at = Some(1_755_800_000); // 3: H05 stamp (via kineora_set_modified_at)
    s.history.mark_clean(&s.doc); // 4+5: snapshot advance → CLEAN
    assert!(!s.is_dirty());
    assert_eq!(s.doc.meta.modified_at, Some(1_755_800_000));

    // an edit leaves the saved snapshot → DIRTY
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(s.is_dirty());
    // undo back to the exact saved state → CLEAN (the stamp is INSIDE the
    // snapshot, so the equality comparison is unaffected by the metadata)
    s.undo();
    assert!(!s.is_dirty(), "undo to snapshot → CLEAN despite the stamp");
    // redo away from the snapshot → DIRTY again
    s.redo();
    assert!(s.is_dirty());
    std::fs::remove_file(&path).ok();
}

#[test]
fn h05_failed_save_does_not_stamp_modified_at_or_advance_snapshot() {
    // H05 §7.2: on write failure the previous good state stands — modifiedAt
    // is NOT updated, the snapshot is NOT advanced, dirty stays DIRTY.
    let mut s = Session::new(Settings::default());
    s.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    let path = std::env::temp_dir().join("h05-fail-modified-at.json");
    s.save(&path).unwrap();
    s.doc.meta.modified_at = Some(1_755_800_000);
    s.history.mark_clean(&s.doc);
    assert!(!s.is_dirty());

    // a failed second write must leave modifiedAt + snapshot exactly as they
    // were — the UI flow simply never calls the stamp/mark_clean on failure.
    let bad = std::env::temp_dir().join("h05-fail-no-such-dir/x.json");
    assert!(s.save(&bad).is_err());
    assert_eq!(
        s.doc.meta.modified_at,
        Some(1_755_800_000),
        "stamp unchanged on failure"
    );
    assert!(!s.is_dirty(), "snapshot untouched → still CLEAN");
    std::fs::remove_file(&path).ok();
}
