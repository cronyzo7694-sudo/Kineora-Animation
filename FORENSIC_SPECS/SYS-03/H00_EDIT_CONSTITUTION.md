# SYS-03 H00 — EDIT SYSTEM CONSTITUTION

## 0. Document Status

SPECIFICATION STATUS: **COMPLETE** (constitutional rules complete)
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H00** · Parent: **SYS-03 Edit** · Constitution source: **SYS-01 (locked)** + **SYS-02 H00 (undo contract §13)**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > SYS-01 > SYS-02 H00 > prior H-files > Adobe (comparison) > code (evidence only).

---

## 1. Scope

H00 governs the **constitution** of SYS-03 Edit: terminology, the ownership firewall (selection-engine vs selection-command), the undo/redo constitution (command pattern, history, coalescing, redo invalidation, prevSelection), the clipboard constitution, the locked-event contract, global invariants, and the rules every later H-file (H01–H07) MUST obey.

H00 does NOT detail: the exact undo/redo controls (→ H01), clipboard commands (→ H02), selection commands (→ H03), menu/shortcut mapping (→ H04), the connection matrix (→ H05), QA (→ H06), reconciliation (→ H07).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.2 | Edit menu items + shortcuts + "clipboard stores full object/frame JSON, not pixels" |
| Blueprint Part 03 §3.0/§3.9 | selection = first-class transient data; `selection:changed{prevTargets,targets,kind,commonType,bounds}` |
| Blueprint Part 36 §36.0 | rules 2 (all mutations = Commands), 9 (undo-consistent selection: prevSelection) |
| Blueprint Part 32 §32.18 | Undo/Redo engine: command stack, coalescing, history panel |
| Phase 3 eng 05 | MOD-COMMAND: Command{do,undo,canCoalesce,coalesce,prevSelection,affected}; History bounded 100 (RSK-011); redo invalidation; async journal |
| Phase 3 eng 01 | REQ-SYS-002 (commands-only), REQ-SEL-005 (selection = view state, no undo) |
| SYS-01 §27.1 | locked `selection:changed` (producer MOD-SELECTION), `document:changed` (producer Command post-do) |
| SYS-01 §13/§17 | undo 4-class; persistence 4-boundary |
| SYS-02 H00 §13 | INV-UNDO-1..4 (save≠clear, no merge, view=no undo, no-op=no entry) |
| Code evidence | `command.rs` (History.execute clears redo), `session.rs` (frame_clipboard session-only) |

---

## 3. Terminology

| Term | Definition | Source |
|---|---|---|
| Command | one undoable document mutation; the ONLY writer to the model | Part 36 §36.0.2 |
| History | the per-document bounded undo/redo stack | eng 05 |
| Undo | pop top command, run its inverse | eng 05 |
| Redo | re-apply a previously-undone command | eng 05 |
| Coalescing | merging consecutive same-gesture commands (typing, slider drag) into one entry | eng 05 |
| Redo invalidation | a new command clears the redo stack | eng 05 |
| prevSelection | selection snapshot captured before `do()`; restored on undo/redo | Part 36 §36.0.9 |
| Clipboard | transient (SESSION) store of full object/frame JSON (never pixels) | Part 01 §1.2.2 |
| Selection state | transient set of node references (IDs); never copies | Part 03 §3.0 |
| Selection engine | hit-test/marquee/lasso/per-type (SYS-14/SYS-13 — NOT SYS-03) | Part 03 |
| Selection command | Select All / Deselect All / Find & Replace (SYS-03) | Part 01 §1.2.2 |
| History panel | list of undoable steps; jump-to-step | Part 01 §1.1 |

---

## 4. Ownership Firewall (canonical — the binding boundary)

| Concern | ONE owner | SYS-03 role |
|---|---|---|
| undo/redo engine (MOD-COMMAND) | SYS-03 | owns |
| History panel | SYS-03 | owns |
| clipboard (object + frame JSON) | SYS-03 | owns |
| selection commands (Select All/Deselect/Find) | SYS-03 | owns |
| selection engine (hit-test/marquee/lasso) | SYS-14 (+SYS-13) | consumes `selection` |
| `selection:changed` event | MOD-SELECTION (locked SYS-01 §27.1) | emits (Select All) + consumes (Cut/Copy/Delete) |
| `document:changed` event | Command post-do (locked) | emits (Cut/Paste/Duplicate/Delete) |
| frame clipboard ops | SYS-15 | Edit-menu entry only |
| break-apart/group | SYS-19/SYS-20 | Edit-menu entry only |
| arrange | SYS-06 | context-menu entry only |
| prefs/shortcut editors | SYS-08/SYS-01 | Edit-menu entry only |

No concern has two owners. Cross-system = handoff, never absorption (FL-0016).

---

## 5. Undo/Redo Constitution (binding)

### 5.1 Command contract (verbatim from eng 05)

```
Command { id, label, do(), undo(), canCoalesce(next), coalesce(next), prevSelection, affected[] }
```

### 5.2 History contract

- Bounded stack: **default 100, configurable** (RSK-011).
- **Undo** pops top, runs inverse, pushes to redo.
- **Redo** pops redo, re-applies, pushes to undo.
- **Redo invalidation**: any NEW command clears the redo stack.
- **Coalescing**: typing (per word/session), slider drags (per gesture), numeric fields (per commit) merge into one entry.
- **Async commands**: record a journal (before/after) so Undo is exact after completion; UI disables Undo for in-flight command.

### 5.3 Invariants (inherited from SYS-02 H00 §13 — binding)

- INV-UNDO-1: Save must NOT destroy undo history (Part 12).
- INV-UNDO-2: Document switching NEVER merges undo stacks (per-doc History).
- INV-UNDO-3: View/workspace/preference ops create NO undo entry.
- INV-UNDO-4: No-op actions (zero delta, cancelled dialogs) create NO undo entry.
- INV-UNDO-5 (SYS-03): **undo/redo restore prevSelection** (undo-consistent selection, Part 36 §36.0.9).
- INV-UNDO-6 (SYS-03): reload (Open) resets History (session-only); save preserves it.

### 5.4 Dirty interaction

- Undo/redo = DOCUMENT MUTATION → dirty per snapshot rule (SYS-02 H04): "undo returns to saved snapshot → CLEAN; otherwise DIRTY". SYS-03 undo/redo does NOT compute dirty itself — it emits `document:changed` and H04 consumes (handoff).
- Save does not clear History; History is SESSION (not persisted).

---

## 6. Clipboard Constitution (binding)

- Clipboard stores **full object/frame JSON** (serialized nodes + references), **never pixels** (Part 01 §1.2.2).
- Clipboard = **SESSION** boundary: not persisted, not undoable, not part of the document (code evidence: `frame_clipboard` session-only; consistent with Part 03 "transient").
- Cut = copy + delete (delete = one undoable command).
- Paste = insert clipboard content (one undoable command).
- Copy = clipboard write only (no document mutation, no undo, no dirty).

### 6.1 Clipboard sub-constitution

| Op | Document mutation? | Undoable? | Dirty? | Event |
|---|---|---|---|---|
| Copy | NO | n/a | no | none |
| Cut | YES (delete) | YES | → per snapshot | `document:changed` (+ `selection:changed` on clear) |
| Paste | YES (insert) | YES | → per snapshot | `document:changed` (+ `selection:changed` on new selection) |
| Duplicate | YES (copy+offset insert) | YES | → per snapshot | `document:changed` (+ `selection:changed`) |

---

## 7. Selection-Command Constitution

- **Select All** (Ctrl+A): select every object on **unlocked, visible** layers of the **current timeline** (Part 03 §3.3.5). Emits `selection:changed`. NO undo (view state — REQ-SEL-005).
- **Deselect All** (Ctrl+Shift+A): clear selection. Emits `selection:changed`. NO undo.
- **Find & Replace** (Ctrl+F): search/replace text, fonts, colors, symbols, sounds across the doc (Part 01 §1.2.2). Mutating → one undoable command per applied change (or one atomic batch — H03).
- Selection commands consume the selection STATE owned by MOD-SELECTION; they do NOT implement hit-testing (SYS-14's job).

---

## 8. Locked Events (canonical — SYS-01 §27.1, verbatim)

| Event | Producer | Payload | Consumers |
|---|---|---|---|
| `selection:changed` | MOD-SELECTION | `{prevTargets, targets, kind, commonType, bounds}` | Properties/Info/Transform/overlay/context-menu/SYS-03 |
| `document:changed` | Command (post-do) | `{type, targets}` | stage/timeline/properties/dirty indicator (H04) |

Rules (SYS-01 §27.0): failure → toast; duplicate → idempotent; stale → re-read model; emitted AFTER successful mutation, before dependent re-render. No refresh-hack reuse (FL-0007). `selection:changed` emits ONCE per gesture (Part 03 §3.9), not per pointer move.

---

## 9. State Models (canonical)

### 9.1 History state (per-document)

| State | Meaning |
|---|---|
| canUndo | undo stack non-empty |
| canRedo | redo stack non-empty |
| (in-flight) | an async command is running → Undo disabled until journal ready |

Transitions: execute → canUndo=true, canRedo=false (redo cleared). undo → canRedo=true (canUndo may drop to false at stack bottom). redo → canUndo=true. reload → both false.

### 9.2 Clipboard state (SESSION)

| State | Meaning |
|---|---|
| EMPTY | no clipboard content |
| HAS_OBJECTS | object JSON present (Paste enabled) |
| HAS_FRAMES | frame JSON present (frame Paste enabled — SYS-15) |

No SYS-03 dirty/persistence state — clipboard is SESSION.

---

## 10. Global Invariants (non-negotiable)

| ID | Rule | Source |
|---|---|---|
| INV-EDIT-1 | Every document mutation (Cut/Paste/Duplicate/Delete/Find-replace) is a Command (undoable); selection-only actions are NOT commands | REQ-SYS-002, REQ-SEL-005 |
| INV-EDIT-2 | Undo/redo restore prevSelection (undo-consistent selection) | Part 36 §36.0.9 |
| INV-EDIT-3 | History is per-document, bounded, session-only; save preserves; reload resets | eng 05, Part 12 |
| INV-EDIT-4 | Clipboard is SESSION (not persisted, not undoable, not in document) | Part 01 §1.2.2, code |
| INV-EDIT-5 | Copy/Deselect are NOT commands (no undo); Cut/Paste/Duplicate/Delete ARE | §6/§7 |
| INV-EDIT-6 | Select All respects locked/hidden layers | Part 03 §3.3.5 |
| INV-EDIT-7 | Clipboard stores JSON, never pixels | Part 01 §1.2.2 |
| INV-EDIT-8 | No command exists without a consumer; one commandId per semantic action | SYS-01 §28/§30 |

---

## 11. Error Constitution

| Failure | Feedback | State | Undo | Recover |
|---|---|---|---|---|
| Cut/Paste on empty selection | disabled-by-context (not an error) | unchanged | n/a | — |
| Paste with empty clipboard | disabled-by-context | unchanged | n/a | — |
| Undo with empty stack | disabled-by-context | unchanged | n/a | — |
| Async command in flight + Undo | Undo disabled until journal ready | unchanged | n/a | wait |
| Find & Replace no matches | "0 matches" (not silent) | unchanged | n/a | retry |

No silent failure (SYS-01 §28); no partial mutation (transaction journal).

---

## 12. Ambiguity Register (H00-level — detailed in owning H-files)

| AMB | Question | Owner | Critical? |
|---|---|---|---|
| AMB-S03-001 | clipboard cross-document scope | H02 | **RESOLVED** (application-level, Part 30) |
| AMB-S03-002 | Duplicate offset amount | H02 | **RESOLVED** (+10px design decision) |
| AMB-S03-003 | Paste Special format LIST | H02 | **YES (narrowed)** |
| AMB-S03-004 | Delete/Clear command | H02 | **RESOLVED** (`edit.delete()`, Part 03 §3.4.1) |
| AMB-S03-005 | Find & Replace depth | H03 | **RESOLVED** (5 targets grounded; Replace-All journal) |

None resolved here (FL-0023 — no quarantine-and-pass).

---

## 13. H00 Completion Checklist

- [x] Terminology (13 terms)
- [x] Ownership firewall (10 concerns, one owner each)
- [x] Undo/redo constitution (6 invariants)
- [x] Clipboard constitution (4 ops + boundary)
- [x] Selection-command constitution
- [x] Locked events verbatim
- [x] State models (History + Clipboard)
- [x] Global invariants (INV-EDIT-1..8)
- [x] Error constitution
- [x] Ambiguities registered (5, not resolved)

**SPECIFICATION STATUS: COMPLETE · IMPLEMENTATION STATUS: NOT IMPLEMENTED**

---

*SYS-03 H00 done. Next: H01 (Undo/Redo).*
