// SYS-02 H01/H00 — document identity + lifecycle invariants (native).
// Proves: unique Document IDs, exactly-one-active, New→CLEAN, per-doc
// independence, replace_active keeps identity, close never mutates others.
use animator_core::{DocManager, Settings};

fn dm() -> DocManager {
    DocManager::new()
}

#[test]
fn new_documents_receive_unique_monotonic_ids() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "Untitled-1".into());
    let b = m.push_new(Settings::default(), "Untitled-2".into());
    let c = m.push_new(Settings::default(), "Untitled-3".into());
    assert_ne!(a, b);
    assert_ne!(b, c);
    assert_ne!(a, c);
    assert_eq!((a, b, c), (1, 2, 3));
}

#[test]
fn new_document_starts_clean_and_empty_history() {
    let mut m = dm();
    let id = m.push_new(Settings::default(), "Untitled-1".into());
    let doc = m.active().expect("active doc exists");
    assert_eq!(doc.id, id);
    assert!(!doc.session.is_dirty(), "New document starts CLEAN (T1)");
    assert_eq!(doc.session.history.undo_len(), 0, "New has no undo entry");
    assert_eq!(doc.session.playhead, 1);
    assert!(doc.session.selection.is_empty());
}

#[test]
fn exactly_one_active_document_and_it_is_the_newest() {
    let mut m = dm();
    m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());
    assert_eq!(m.len(), 2);
    assert_eq!(m.active_id(), 2, "the newest document is active");
}

#[test]
fn per_document_state_is_independent() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());

    // edit A while B is active → A keeps its own content/dirty/history
    m.set_active(a);
    let a_doc = m.active_mut().expect("A active");
    a_doc.session.draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(a_doc.session.is_dirty());

    // switch to B: B is clean, empty history — no transfer (INV-006/INV-004)
    m.set_active(2);
    let b_doc = m.active_mut().expect("B active");
    assert!(
        !b_doc.session.is_dirty(),
        "dirty is per-document, never transferred"
    );
    assert_eq!(
        b_doc.session.history.undo_len(),
        0,
        "undo histories are per-document"
    );

    // switch back: A's content + dirty + undo entry intact
    m.set_active(a);
    let a_doc = m.active_mut().expect("A active");
    assert!(a_doc.session.is_dirty());
    assert_eq!(a_doc.session.history.undo_len(), 1);
}

#[test]
fn switching_does_not_mutate_content() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 5.0, 5.0, "#000000");
    let a_nodes_before = m.active().unwrap().session.doc.nodes.len();

    m.set_active(b);
    m.set_active(a);
    assert_eq!(m.active().unwrap().session.doc.nodes.len(), a_nodes_before);
}

#[test]
fn close_one_document_never_mutates_another() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 5.0, 5.0, "#000000");

    assert!(m.close(b));
    assert_eq!(m.len(), 1);
    assert_eq!(m.active_id(), a);
    assert!(
        m.active().unwrap().session.is_dirty(),
        "A unchanged by closing B"
    );
    assert_eq!(m.active().unwrap().session.history.undo_len(), 1);
}

#[test]
fn closing_the_last_document_enters_no_document_state() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    assert!(m.close(a));
    assert!(m.is_empty());
    assert_eq!(m.active_id(), 0);
    assert!(m.active().is_none());
}

#[test]
fn replace_active_preserves_identity_and_resets_session() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 5.0, 5.0, "#000000");

    let mut seed = animator_core::Session::new(Settings::default());
    seed.draw_rect(0.0, 0.0, 9.0, 9.0, "#ffffff");
    let doc = seed.doc.clone();

    assert!(m.replace_active(doc, "Loaded".into()));
    let d = m.active().unwrap();
    assert_eq!(d.id, a, "identity (Document ID) preserved across replace");
    assert_eq!(d.title, "Loaded");
    assert_eq!(d.session.history.undo_len(), 0, "session reset on load");
    assert_eq!(d.session.playhead, 1);
    assert!(d.session.selection.is_empty());
    assert!(!d.session.is_dirty(), "loaded document starts CLEAN");
}

#[test]
fn untitled_titles_are_monotonic() {
    let mut m = dm();
    assert_eq!(m.next_untitled(), "Untitled-1");
    assert_eq!(m.next_untitled(), "Untitled-2");
    assert_eq!(m.next_untitled(), "Untitled-3");
}
