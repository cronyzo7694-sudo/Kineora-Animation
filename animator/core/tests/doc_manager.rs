// SYS-02 H01/H00 — document identity + lifecycle invariants (native).
// Proves: unique Document IDs, exactly-one-active, New→CLEAN, per-doc
// independence, replace_active keeps identity, close never mutates others.
use animator_core::{DocManager, Document, Settings};

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

// ——— H01 meta + seeding (createdAt ownership · AMB-H01-003 = UNTITLED seed) ———

#[test]
fn push_new_with_meta_stamps_created_at_and_starts_clean() {
    let mut m = dm();
    let id = m.push_new_with_meta(Settings::default(), "Untitled-1".into(), 1_755_800_000);
    let doc = m.active().expect("active");
    assert_eq!(doc.id, id);
    assert_eq!(
        doc.session.doc.meta.created_at, 1_755_800_000,
        "H01: New stamps createdAt"
    );
    assert!(
        !doc.session.is_dirty(),
        "still CLEAN — meta stamping is part of creation (T1)"
    );
}

#[test]
fn push_new_with_meta_zero_means_unknown_created_at() {
    let mut m = dm();
    m.push_new_with_meta(Settings::default(), "Untitled-1".into(), 0);
    assert_eq!(m.active().unwrap().session.doc.meta.created_at, 0);
}

#[test]
fn push_seed_assigns_its_own_untitled_title_never_the_template_name() {
    // AMB-H01-003 (provisional = UNTITLED): a seeded document is ACTIVE(
    // UNTITLED, CLEAN) with its own Untitled-N display title.
    let mut m = dm();
    m.push_new(Settings::default(), "Untitled-1".into());
    let seed = Document::new(Settings::default());
    let id = m.push_seed(seed);
    let doc = m.active().expect("active");
    assert_eq!(doc.id, id);
    assert_eq!(
        doc.title, "Untitled-2",
        "own Untitled-N title, not the template name"
    );
    assert!(!doc.session.is_dirty(), "seeded doc starts CLEAN");
    assert!(
        doc.session.selection.is_empty() && doc.session.playhead == 1,
        "fresh session"
    );
}

#[test]
fn push_seed_keeps_independent_document_identity() {
    let mut m = dm();
    let a = m.push_seed(Document::new(Settings::default()));
    let b = m.push_seed(Document::new(Settings::default()));
    assert_ne!(a, b, "each seed = its own document identity");
    let titles: Vec<_> = m.docs().iter().map(|d| d.title.clone()).collect();
    assert_eq!(
        titles,
        vec!["Untitled-1".to_string(), "Untitled-2".to_string()]
    );
}

// ————————————————————————————————————————————————————————————————
// H02 — open-set reorder, close targeting, identity (native engine level).
// These prove the ENGINE half of the H02 contract; the UI/event half is
// proven in animator/ui/src/h02.test.tsx.
// ————————————————————————————————————————————————————————————————

#[test]
fn h02_reorder_moves_a_document_and_preserves_the_open_set() {
    // T-tab-reorder (engine): [A,B,C] active A → move C to index 0 → [C,A,B];
    // the active document (A) is unchanged by a reorder.
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());
    let c = m.push_new(Settings::default(), "C".into());
    m.set_active(a); // A active (idx 0), C at the back
    assert!(m.reorder(c, 0));
    let order: Vec<u64> = m.docs().iter().map(|d| d.id).collect();
    assert_eq!(order, vec![c, a, 2]);
    assert_eq!(
        m.active_id(),
        a,
        "reorder never changes the active document"
    );
}

#[test]
fn h02_reorder_of_the_active_document_keeps_it_active() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    assert!(m.reorder(b, 0), "move the active doc (B) to the front");
    let order: Vec<u64> = m.docs().iter().map(|d| d.id).collect();
    assert_eq!(order, vec![b, a]);
    assert_eq!(m.active_id(), b, "the active index follows the moved doc");
}

#[test]
fn h02_reorder_across_the_active_document_keeps_the_active_document() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    let c = m.push_new(Settings::default(), "C".into());
    m.set_active(b); // B active (idx 1)
                     // move C (idx 2) across active B to index 0 → [C,A,B], B must stay active
    assert!(m.reorder(c, 0));
    let order: Vec<u64> = m.docs().iter().map(|d| d.id).collect();
    assert_eq!(order, vec![c, a, b]);
    assert_eq!(
        m.active_id(),
        b,
        "B stays active after another doc crosses it"
    );
    // and the reverse direction: move A (idx 1) to the end → [C,B,A]
    assert!(m.reorder(a, 2));
    let order: Vec<u64> = m.docs().iter().map(|d| d.id).collect();
    assert_eq!(order, vec![c, b, a]);
    assert_eq!(m.active_id(), b, "B stays active in both directions");
}

#[test]
fn h02_reorder_of_an_unknown_id_fails_honestly() {
    let mut m = dm();
    m.push_new(Settings::default(), "A".into());
    assert!(!m.reorder(99, 0), "unknown id → false, open-set untouched");
    assert_eq!(m.len(), 1, "open-set size unchanged");
    assert_eq!(
        m.docs().first().map(|d| d.id),
        Some(1),
        "open-set content unchanged"
    );
}

#[test]
fn h02_reorder_is_view_state_no_content_no_history_no_dirty() {
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 10.0, 10.0, "#ff0000");
    assert!(m.active().unwrap().session.is_dirty());
    assert_eq!(m.active().unwrap().session.history.undo_len(), 1);

    m.reorder(2, 0);
    assert!(
        m.active().unwrap().session.is_dirty(),
        "dirty is untouched by reorder"
    );
    assert_eq!(
        m.active().unwrap().session.history.undo_len(),
        1,
        "no undo entry from reorder"
    );
    assert_eq!(m.len(), 2);
}

#[test]
fn h02_closing_the_active_document_activates_its_successor() {
    // T-tab-close-active (engine): [A,B] active A → close A → B active.
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    assert!(m.close(a));
    assert_eq!(m.active_id(), b, "the successor becomes active");
    assert_eq!(m.len(), 1);
    // [A,B,C] active B → close B → C (successor) active
    let mut m = dm();
    m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    let c = m.push_new(Settings::default(), "C".into());
    m.set_active(b);
    assert!(m.close(b));
    assert_eq!(
        m.active_id(),
        c,
        "successor (right neighbour) becomes active"
    );
}

#[test]
fn h02_closing_an_inactive_document_keeps_the_active_document() {
    // T-tab-close-inactive (engine): [A,B] active A → close B → A still active.
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    let b = m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    assert!(m.close(b));
    assert_eq!(
        m.active_id(),
        a,
        "closing an inactive doc never moves the active pointer"
    );
    assert_eq!(m.len(), 1);
}

#[test]
fn h02_document_ids_are_never_duplicated_in_the_open_set() {
    // T-tab-dup-id: every push assigns a fresh monotonic id; the open-set can
    // never contain the same document id twice.
    let mut m = dm();
    for _ in 0..5 {
        m.push_new(Settings::default(), "T".into());
    }
    m.push_opened(Document::new(Settings::default()), "loaded".into());
    m.push_seed(Document::new(Settings::default()));
    let ids: Vec<u64> = m.docs().iter().map(|d| d.id).collect();
    let unique: Vec<u64> = {
        let mut v = ids.clone();
        v.sort();
        v.dedup();
        v
    };
    assert_eq!(
        ids.len(),
        unique.len(),
        "no duplicate Document IDs in the open-set"
    );
}

#[test]
fn h02_per_document_playhead_and_selection_are_isolated_across_tabs() {
    // T-tab-playhead-per-doc / T-tab-selection-per-doc: each document keeps
    // its own playhead + selection; A→B→A restores A exactly.
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    m.active_mut().unwrap().session.set_playhead(12);
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 5.0, 5.0, "#00ff00");
    m.active_mut().unwrap().session.select_at(2.0, 2.0);
    let sel_a = m.active().unwrap().session.selection.clone();
    assert!(!sel_a.is_empty(), "A has a selection");

    m.set_active(2);
    assert_eq!(
        m.active().unwrap().session.playhead,
        1,
        "B keeps its own playhead"
    );
    assert!(
        m.active().unwrap().session.selection.is_empty(),
        "B has its own (empty) selection"
    );

    m.set_active(a);
    assert_eq!(
        m.active().unwrap().session.playhead,
        12,
        "A's playhead restored"
    );
    assert_eq!(
        m.active().unwrap().session.selection,
        sel_a,
        "A's selection restored"
    );
}

#[test]
fn h02_per_document_undo_history_is_isolated_across_tabs() {
    // T-tab-undo-per-doc: undo depth is per-document and never mixed.
    let mut m = dm();
    let a = m.push_new(Settings::default(), "A".into());
    m.push_new(Settings::default(), "B".into());
    m.set_active(a);
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(0.0, 0.0, 5.0, 5.0, "#0000ff");
    m.active_mut()
        .unwrap()
        .session
        .draw_rect(10.0, 10.0, 5.0, 5.0, "#0000ff");
    assert_eq!(m.active().unwrap().session.history.undo_len(), 2);

    m.set_active(2);
    assert_eq!(
        m.active().unwrap().session.history.undo_len(),
        0,
        "B has an empty history"
    );
    m.set_active(a);
    assert_eq!(
        m.active().unwrap().session.history.undo_len(),
        2,
        "A's history intact"
    );
}
