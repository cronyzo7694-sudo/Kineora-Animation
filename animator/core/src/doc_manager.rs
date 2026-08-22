//! Multi-document manager (SYS-02 H00 §8 multi-doc invariants).
//!
//! Owns the open-set + the single active document. Each `ManagedDoc` wraps its
//! own `Session` (own document, undo history, selection, playhead, library),
//! so multi-document is real — never a title-only fake. Extracted from the
//! WASM facade so the identity/lifecycle invariants are natively testable.

use crate::{Document, Session, Settings};

/// One open document: a stable tab id, a display title, and its own Session
/// (own document, undo history, selection, playhead, library).
pub struct ManagedDoc {
    pub id: u64,
    pub title: String,
    pub session: Session,
}

/// The document manager. Document ID = the monotonic `next_id` (identity;
/// title/path are never identity). Exactly one active document whenever ≥1 is
/// open (INV-001).
pub struct DocManager {
    docs: Vec<ManagedDoc>,
    active: usize,
    next_id: u64,
    untitled_counter: u64,
}

impl Default for DocManager {
    fn default() -> Self {
        Self::new()
    }
}

/// SURVIVOR SELECTION POLICY — **PROVISIONAL (AMB-H07-001 is an open product
/// decision; the Blueprint is silent on "next tab")**. The current behavior
/// implements the H07 §7 RECOMMENDATION, which is explicitly NOT
/// authoritative: the nearest remaining tab in open-set order — the closed
/// document's right neighbour; when the closed document was the last, the
/// last remaining document. `active`/`closed` are pre-removal indices. Do
/// NOT treat this as a final product rule until AMB-H07-001 is resolved.
fn survivor_index(docs_len: usize, active: usize, closed: usize) -> usize {
    if docs_len == 0 {
        return 0;
    }
    if closed < active {
        active - 1
    } else {
        // closed == active → the right neighbour slides into the slot;
        // closed > active → pointer unchanged; clamp for the last doc.
        active.min(docs_len - 1)
    }
}

impl DocManager {
    pub const fn new() -> Self {
        Self {
            docs: Vec::new(),
            active: 0,
            next_id: 1,
            untitled_counter: 0,
        }
    }

    pub fn docs(&self) -> &[ManagedDoc] {
        &self.docs
    }

    pub fn len(&self) -> usize {
        self.docs.len()
    }

    pub fn is_empty(&self) -> bool {
        self.docs.is_empty()
    }

    pub fn active_mut(&mut self) -> Option<&mut ManagedDoc> {
        self.docs.get_mut(self.active)
    }

    pub fn active(&self) -> Option<&ManagedDoc> {
        self.docs.get(self.active)
    }

    /// The active document's id (0 = no document open).
    pub fn active_id(&self) -> u64 {
        self.docs.get(self.active).map(|d| d.id).unwrap_or(0)
    }

    /// Append a freshly-created document and make it active. Returns its id.
    /// The new document starts CLEAN (Session::new → empty history, dirty =
    /// false) — lifecycle T1: NO_DOCUMENT + New → ACTIVE(UNTITLED, CLEAN).
    pub fn push_new(&mut self, settings: Settings, title: String) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        self.docs.push(ManagedDoc {
            id,
            title,
            session: Session::new(settings),
        });
        self.active = self.docs.len() - 1;
        id
    }

    /// push_new + a stamped creation timestamp (H01 meta ownership: the New
    /// command sets `meta.created_at`; wasm has no wall clock, so the caller
    /// supplies epoch-seconds — 0 = unknown). Still starts CLEAN (T1).
    pub fn push_new_with_meta(
        &mut self,
        settings: Settings,
        title: String,
        created_at: u64,
    ) -> u64 {
        let mut doc = Document::new(settings);
        doc.meta.created_at = created_at;
        self.push_session(Session::from_document(doc), title)
    }

    /// New-from-Template seeding (H01; AMB-H01-003 provisional = UNTITLED):
    /// a seeded document gets its OWN `Untitled-N` display title — never the
    /// template's name — and starts CLEAN (Session::from_document).
    pub fn push_seed(&mut self, doc: Document) -> u64 {
        let title = self.next_untitled();
        self.push_opened(doc, title)
    }

    pub fn next_untitled(&mut self) -> String {
        // Collision-aware: an existing document may already DISPLAY an
        // Untitled-N name (push_new with an explicit title), so skip used
        // numbers — every Untitled-N in the open-set stays distinct.
        let mut n = self.untitled_counter;
        loop {
            n += 1;
            let candidate = format!("Untitled-{}", n);
            if !self.docs.iter().any(|d| d.title == candidate) {
                self.untitled_counter = n;
                return candidate;
            }
        }
    }

    /// Append an already-loaded document (Open-as-new-tab / New-from-template
    /// seeding) and make it active. Returns its new id (0 on parse-level
    /// failure is the caller's concern; this always succeeds).
    pub fn push_opened(&mut self, doc: Document, title: String) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        self.docs.push(ManagedDoc {
            id,
            title,
            session: Session::from_document(doc),
        });
        self.active = self.docs.len() - 1;
        id
    }

    /// Append an already-constructed Session (Open-from-path with no active
    /// document) and make it active.
    pub fn push_session(&mut self, session: Session, title: String) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        self.docs.push(ManagedDoc { id, title, session });
        self.active = self.docs.len() - 1;
        id
    }

    /// Set a document's display title (title is display-only, never identity).
    pub fn set_title(&mut self, id: u64, title: String) -> bool {
        let Some(doc) = self.docs.iter_mut().find(|x| x.id == id) else {
            return false;
        };
        doc.title = title;
        true
    }

    /// Replace the active document's content in place (Open semantics — SYS-02
    /// §13.3 "replaces active doc"), keeping the same tab id + slot. Identity
    /// is preserved; only content/title change.
    pub fn replace_active(&mut self, doc: Document, title: String) -> bool {
        let Some(slot) = self.docs.get_mut(self.active) else {
            return false;
        };
        slot.session = Session::from_document(doc);
        slot.title = title;
        true
    }

    /// Close a document by id. Closing never mutates another document
    /// (INV-007 / INV-MD-10); the survivor is chosen by the (provisional)
    /// survivor policy above, or the no-document state if it was the last.
    pub fn close(&mut self, id: u64) -> bool {
        let Some(idx) = self.docs.iter().position(|d| d.id == id) else {
            return false;
        };
        self.docs.remove(idx);
        self.active = survivor_index(self.docs.len(), self.active, idx);
        true
    }

    /// Switch the active document (view state — never mutates content, INV-003).
    pub fn set_active(&mut self, id: u64) -> bool {
        let Some(idx) = self.docs.iter().position(|d| d.id == id) else {
            return false;
        };
        self.active = idx;
        true
    }

    /// Reorder the open-set (H02 `app.tab.reorder` — view/SESSION state).
    ///
    /// Moves the document with stable id `id` to position `to_index` (clamped
    /// to the valid range). The ACTIVE DOCUMENT is never changed by a reorder:
    /// when the active document itself moves, the active index follows it;
    /// when another document crosses the active one, the index is adjusted so
    /// the SAME document remains active. No content mutation, no History
    /// entry, no dirty change — open-set order is SESSION state (H02 §17),
    /// never a document mutation.
    pub fn reorder(&mut self, id: u64, to_index: usize) -> bool {
        let len = self.docs.len();
        if len == 0 {
            return false;
        }
        let from = match self.docs.iter().position(|d| d.id == id) {
            Some(i) => i,
            None => return false,
        };
        let to = to_index.min(len - 1);
        if from == to {
            return true;
        }
        let was_active = self.active == from;
        let doc = self.docs.remove(from);
        let mut act = self.active;
        if was_active {
            act = to;
        } else {
            if from < act {
                act -= 1;
            }
            if to <= act {
                act += 1;
            }
        }
        self.docs.insert(to, doc);
        self.active = act;
        true
    }
}
