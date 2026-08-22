# SYS-03 H02 — CLIPBOARD: CUT / COPY / PASTE / DUPLICATE / DELETE

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S03-003 Paste-Special format list unresolved — narrowed)

IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H02** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H02 owns the **object clipboard**: Cut, Copy, Paste (in Center / in Place / Special), Duplicate, and Delete (remove selection). It owns the clipboard data contract (full object JSON, never pixels) and the clipboard boundary (SESSION).

H02 does NOT own: frame clipboard (→ SYS-15) · hit-testing (→ SYS-14) · undo/redo engine (→ H01) · the selection engine (→ SYS-14).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.2 | Cut/Copy (Ctrl+X/C); Paste in Center/Place/Special (Ctrl+V / Ctrl+Shift+V / Ctrl+Shift+Alt+V); Duplicate (Ctrl+D); "clipboard stores full object/frame JSON, not pixels" |
| Blueprint Part 30 §30.1/§30.2 | stage/object context menus: Cut/Copy/Paste, Paste in Place, Select All/Deselect, Duplicate |
| Blueprint Part 03 §3.4.1 | split-on-move/cut/delete rule (raw-shape sub-object split at command time); "move/cut/delete command" ⇒ Delete is a required operation |
| Blueprint Part 30 | ContextMenuBuilder `(hitTarget, selection, tool, clipboard, doc-state)` — `clipboard` is separate from `doc-state` ⇒ clipboard is NOT per-document |
| Phase 3 eng 05 | CMD-MOVE, CMD-IMPORT (undoable commands); affected[] |
| Code evidence | `session.rs` `frame_clipboard` = session-only, not persisted, not undoable (single-Session code; object clipboard NOT implemented — gap) |

---

## 3. Terminology

| Term | Definition |
|---|---|
| Clipboard | SESSION store of serialized object JSON (never pixels) |
| Cut | copy selection to clipboard + delete selection (one undoable delete command) |
| Copy | write selection to clipboard (no mutation, no undo) |
| Paste in Center | insert clipboard content at stage center |
| Paste in Place | insert at the same coordinates as the source |
| Paste Special | insert with format options (AMB-S03-003) |
| Duplicate | copy + offset insert (one undoable command) |
| Delete | remove selection (one undoable command) |

---

## 4. Clipboard Data Contract

- Clipboard holds **serialized node JSON + stable ID remapping** (pasted content gets NEW IDs — REQ-SYS-004 stable IDs; never reuses source IDs).
- Clipboard = SESSION (INV-EDIT-4): not persisted, not undoable, not in the document.

### 4.1 Clipboard scope (RESOLVED — AMB-S03-001)

**The object clipboard is APPLICATION-level (shared across all open documents), SESSION boundary.**

| Question | Answer | Source |
|---|---|---|
| Per-document or shared? | **Shared** across all open documents | Part 30 `(… clipboard, doc-state)` — clipboard ≠ doc-state |
| Copy in doc A → switch → Paste in doc B? | **Works** (content pastes into B) | app-level scope |
| Cut in doc A → switch → Paste? | **Works** (A's delete already ran as A's command; clipboard content pastes into B) | app-level scope |
| Close source doc after Copy? | **Clipboard content survives** (not tied to the source doc) | app-level scope |
| App restart? | **Cleared** (SESSION) | INV-EDIT-4 |
| Object vs frame clipboard | one application-level clipboard holds object OR frame JSON; a frame Copy (SYS-15) replaces object clipboard content and vice-versa ("Clipboard stores full object/frame JSON" — singular) | Part 01 §1.2.2 |

This is the SAME "the clipboard" concept as the OS clipboard (Adobe comparison: Animate's clipboard is app-wide). The `frame_clipboard` on the single-Session code is an implementation detail of the single-document code, not authority (FL-0017).

---

## 5. Command / Control Contract

| Control | commandId | Trigger | Precondition | Action | Mutation | Undo | Dirty | Event | testId |
|---|---|---|---|---|---|---|---|---|---|
| edit.cut | `edit.cut()` | Ctrl+X / menu / ctx | non-empty selection | copy to clipboard + delete selection | YES (delete) | YES | → snapshot | `document:changed` + `selection:changed` | T-cut |
| edit.copy | `edit.copy()` | Ctrl+C / menu / ctx | non-empty selection | write selection to clipboard | NO | n/a | no | none | T-copy |
| edit.pasteCenter | `edit.paste('center')` | Ctrl+V / menu / ctx | clipboard HAS_OBJECTS | insert at stage center | YES | YES | → snapshot | `document:changed` + `selection:changed` | T-paste-center |
| edit.pastePlace | `edit.paste('place')` | Ctrl+Shift+V / menu / ctx | clipboard HAS_OBJECTS | insert at source coords | YES | YES | → snapshot | `document:changed` + `selection:changed` | T-paste-place |
| edit.pasteSpecial | `edit.paste('special')` | Ctrl+Shift+Alt+V / menu | clipboard HAS_OBJECTS | format dialog → paste (format list = AMB-S03-003) | YES | YES | → snapshot | `document:changed` + `selection:changed` (cancel = none) | T-paste-special |
| edit.duplicate | `edit.duplicate()` | Ctrl+D / menu / ctx | non-empty selection | copy + offset insert | YES | YES | → snapshot | `document:changed` + `selection:changed` | T-duplicate |
| edit.delete | `edit.delete()` | Delete/Backspace / menu / ctx | non-empty selection | remove selection | YES | YES | → snapshot | `document:changed` + `selection:changed` | T-delete |

**CommandIds: 5** (`edit.cut`, `edit.copy`, `edit.paste` [center/place/special = one commandId, 3 sub-targets], `edit.duplicate`, `edit.delete`). **Controls: 7** (cut, copy, pasteCenter, pastePlace, pasteSpecial, duplicate, delete). One semantic action = one commandId; `edit.paste` is ONE command with 3 targets, NOT 3 commands.

---

## 6. Semantics (binding)

### 6.1 Cut
- Copy selection to clipboard (JSON), then delete selection.
- Delete = one undoable command (revert restores the removed content).
- After cut, selection clears (`selection:changed`).

### 6.2 Copy
- Clipboard write only. No document mutation, no undo, no dirty, no event.

### 6.3 Paste (Center / Place)
- Insert clipboard content as NEW nodes with NEW stable IDs.
- **Center** = insert at stage center (current view center).
- **Place** = insert at the same coordinates as the source.
- Pasted content becomes the new selection (`selection:changed`).
- One undoable command per paste.

### 6.3b Paste Special (structure RESOLVED — AMB-S03-003 narrowed to the option list)
- `edit.paste('special')` opens a **format-options dialog** (SYS-01 modal chrome).
- On confirm: paste the clipboard content with the selected format — ONE undoable command, fresh IDs, new selection.
- On cancel / Esc / outside-click: **no command, no mutation, no dirty, no event** (INV-UNDO-4).
- The **format option list** is `[AMB-S03-003 — UNRESOLVED]` (Blueprint §1.2.2 "options (format)" gives no list anywhere in the corpus).

**Decision context (for the human):** Kineora's clipboard is JSON-only ("not pixels", Part 01 §1.2.2), so there is no EXTERNAL format to convert — the Adobe "Paste Special" (cross-app metafile/bitmap conversion) does not cleanly apply. The open question is therefore whether Kineora's Paste Special (a) converts between Kineora's OWN object representations, or (b) is an Adobe remnant to be EXCLUDED. RECOMMENDATION — NOT AUTHORITATIVE: convert between the two vector representations (Part 06) — **{Drawing object (atomic, default), Raw shape (merge model)}** — which is the only "format" distinction a JSON-only object clipboard can meaningfully offer.

### 6.4 Duplicate
- Copy + offset insert. Offset = **+10 px x / +10 px y** `[OUR DESIGN DECISION — resolved AMB-S03-002; consistent with SYS-01 D-5/D-9 design-decision precedent]`.
- One undoable command; duplicated content becomes the new selection.

### 6.5 Delete (RESOLVED — AMB-S03-004)
- **`edit.delete()`** is the SINGLE SYS-03 delete command: removes the current selection (one undoable command).
- **Required** by the object model (Part 03 §3.4.1 "move/cut/delete command"; the merge model requires delete to split/cut raw shapes).
- Trigger: **Delete / Backspace key** + Edit ▸ Delete menu item + object context menu.
- Menu label = **"Delete"** (NOT "Clear"): the Blueprint §1.2.2 does not list an object-level "Clear"; "Clear" appears ONLY in the frame context ("Clear Frames" → **SYS-15**, a handoff — removes frame CONTENT, keeps the keyframe). These are DIFFERENT operations and MUST NOT be conflated.
- Raw-shape sub-object selection: delete removes only the selected fill/stroke sub-part (split at command time — Part 03 §3.4.1).
- Note: the Blueprint §1.2.2 menu table omits an explicit Delete row; the operation is authoritative-by-implication from the object model. The Delete/Backspace key is the universal trigger `[INFERENCE — the Blueprint Part 29 does not list a Delete shortcut; the key is standard]`.

---

## 7. Split-on-Cut Rule (Part 03 §3.4.1 — binding)

A raw-shape fill/stroke sub-selection is NOT split in the model until the first move/cut/delete command. Cut/Delete of a sub-object performs the split AT COMMAND TIME, so undo granularity is preserved (one command = the whole split+delete).

---

## 8. Event Propagation

| Op | Event(s) |
|---|---|
| Cut / Paste / Duplicate / Delete | `document:changed{type,targets}` (mutation) → `selection:changed` (selection update) |
| Copy | none (no mutation) |

Order: `document:changed` after the mutation; `selection:changed` after the selection update. No fake events (FL-0007).

---

## 9. Dirty / Undo / Persistence

| Op | Dirty | Undo | Persistence |
|---|---|---|---|
| Copy | no | n/a | none |
| Cut | → snapshot (delete mutation) | YES | DOCUMENT (via command) |
| Paste | → snapshot | YES | DOCUMENT |
| Duplicate | → snapshot | YES | DOCUMENT |
| Delete | → snapshot | YES | DOCUMENT |
| Clipboard content | n/a | NOT undoable | SESSION (never persisted) |

---

## 10. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| Cut/Copy/Duplicate/Delete with empty selection | disabled-by-context | unchanged | n/a |
| Paste with empty clipboard | disabled-by-context | unchanged | n/a |
| Paste into locked layer | blocked (toast "layer locked") | unchanged | unlock + retry |
| Paste into tween span (drawing invalid) | blocked (validate-first) | unchanged | choose valid frame |

No silent failure; validate-first (no partial mutation).

---

## 11. Accessibility

- All clipboard commands: role=menuitem, shortcut announced, destructive (Cut/Delete) announced.
- Paste "success" announced (aria-live); "nothing to paste" = disabled (not an error announcement).

---

## 12. Edge Cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | copy then paste → new IDs (no source-ID reuse) | pasted nodes get fresh IDs | T-clip-id |
| 2 | cut then undo | removed content restored (one undo) | T-cut-undo |
| 3 | duplicate → offset copy | new copy at offset | T-duplicate |
| 4 | paste in place | same coords as source | T-paste-place |
| 5 | paste with empty clipboard | disabled | T-paste-empty |
| 6 | sub-object cut | split at command time (one undo) | T-subobj-cut |
| 7 | cross-document paste | clipboard shared app-level: copy in A → paste in B works | T-clip-cross-doc |
| 8 | copy is not undoable | no history entry | T-copy-no-undo |
| 9 | delete on locked layer | blocked | T-delete-locked |
| 10 | clipboard not persisted across reload | cleared on reload (SESSION) | T-clip-reload |

---

## 13. Cross-Handoffs

| Producer → H02 | H02 response |
|---|---|
| SYS-14 selection (MOD-SELECTION) | consume selection for cut/copy/delete |
| H01 undo engine | cut/paste/duplicate/delete = commands (push to History) |
| SYS-15 (frame clipboard) | separate slot (H02 does NOT own) |
| SYS-02 H04 (dirty) | emit document:changed; H04 computes dirty |

---

## 14. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** scope ✓ (object clipboard only) · ownership ✓ · INV-EDIT-4/5/7 ✓ · no dead control ✓ · split-on-cut ✓ · events ✓ · AMBs registered, not resolved (FL-0023/0028) ✓.

---

## 15. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) paste reusing source IDs (identity collision) | identity | RESOLVED — fresh IDs (REQ-SYS-004) |
| F2 | (risk) copy creating an undo entry | undo | RESOLVED — copy = no command |
| F3 | (risk) clipboard persisted | persistence | RESOLVED — SESSION |

No manufactured findings.

---

## 16. Ambiguity Register (H02-owned)

| AMB | Question | Sources | Status |
|---|---|---|---|
| AMB-S03-001 | clipboard cross-document scope | Part 30 ContextMenuBuilder (clipboard ≠ doc-state); Part 01 §1.2.2 ("the clipboard" singular) | **RESOLVED** — application-level, shared across open docs, SESSION |
| AMB-S03-002 | Duplicate offset amount | Blueprint "copy+offset" (no value) | **RESOLVED** — +10px x/y `[OUR DESIGN DECISION]` |
| AMB-S03-003 | Paste Special format option list | Blueprint "options (format)" (no list anywhere in corpus) | **OPEN (narrowed to the SMALLEST decision)** — structure resolved (§6.3b); the ONLY open question is the dialog's option list. Decision required: *"What are the format options in the Paste Special dialog?"* Recommendation (NOT authoritative): {Drawing object, Raw shape} (Part 06 vector representations) — or EXCLUDE Paste Special as an Adobe remnant |
| AMB-S03-004 | Delete/Clear command | Part 03 §3.4.1 "move/cut/delete" | **RESOLVED** — `edit.delete()` (Delete/Backspace), "Delete" label; "Clear Frames" = SYS-15 handoff |

**REVISION REQUIRED (narrowed):** only AMB-S03-003's format LIST remains implementation-critical (the Paste-Special dialog needs its option list). Registered, NOT guessed (FL-0023).

---

## 17. Final Report

STATUS: **REVISION REQUIRED** (narrowed) — 1 implementation-critical ambiguity (AMB-S03-003 Paste-Special format LIST). AMB-S03-001/002/004 RESOLVED. Commands: 5 · Controls: 7 · Edge cases: 10 · Findings: 3 (resolved) · AMBs: 1 open (narrowed) + 3 resolved.

---

*H02 done (REVISION REQUIRED). Next: H03 (Selection Commands).*
