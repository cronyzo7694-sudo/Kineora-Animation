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

    pub fn next_untitled(&mut self) -> String {
        self.untitled_counter += 1;
        format!("Untitled-{}", self.untitled_counter)
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
    /// (INV-007 / INV-MD-10); the neighbour becomes active, or the
    /// no-document state if it was the last.
    pub fn close(&mut self, id: u64) -> bool {
        let Some(idx) = self.docs.iter().position(|d| d.id == id) else {
            return false;
        };
        self.docs.remove(idx);
        if self.docs.is_empty() {
            self.active = 0;
        } else if idx < self.active {
            self.active -= 1;
        } else if self.active >= self.docs.len() {
            self.active = self.docs.len() - 1;
        }
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
}
