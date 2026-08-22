# SYS-03 H01 — UNDO / REDO ENGINE + HISTORY PANEL

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION**
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H01** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H01 owns the **Undo/Redo command engine** (MOD-COMMAND: History stack, coalescing, redo invalidation, prevSelection restore, async journal) and the **History panel**. It is the single source of truth for "every tool gesture = one undoable command".

H01 does NOT own: the commands themselves (defined by each tool/system) · clipboard (→ H02) · selection commands (→ H03) · dirty computation (→ SYS-02 H04) · hit-testing (→ SYS-14).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Phase 3 eng 05 | Command interface; History bounded 100 (RSK-011); coalescing; redo invalidation; async journal; prevSelection |
| Blueprint Part 32 §32.18 | undo/redo engine responsibilities |
| Blueprint Part 36 §36.0.2/§36.0.9 | all mutations = Commands; undo-consistent selection |
| Blueprint Part 01 §1.2.2 | Undo Ctrl+Z; Redo Ctrl+Shift+Z (or Ctrl+Y) |
| Blueprint Part 01 §1.1 (History panel) | "list of undoable steps; jump to a step" |
| Phase 3 eng 05 (undo model) | save doesn't clear; reload resets |
| SYS-02 H00 §13 | INV-UNDO-1..4 |
| Code evidence | `command.rs` (History.execute clears redo), `session.rs` (history: History, per-session) |

---

## 3. Terminology

| Term | Definition |
|---|---|
| History | per-document bounded undo/redo stack |
| Coalescing | merging consecutive same-gesture commands into one entry |
| Redo invalidation | new command clears redo stack |
| prevSelection | selection snapshot captured before do(), restored on undo/redo |
| Journal | before/after entity record for async commands (exact undo) |
| History panel | UI list of undoable steps + jump-to-step |

---

## 4. Command Contract (canonical — verbatim from eng 05)

```
Command {
  id: CMD-xxx;
  label: string;              // toast/history label
  do(): void;                 // validated mutation
  undo(): void;               // inverse
  canCoalesce(next): boolean; // merge rule
  coalesce(next): void;
  prevSelection: SelectionSnapshot;
  affected: string[];         // entity IDs (dirty marking)
}
```

**Invariants (eng 05):**
1. `do()` validates preconditions → throws typed error → MOD-NOTIFY (no partial mutation).
2. `prevSelection` captured before `do()`; restored on undo/redo (REQ-SEL-005).
3. Dirty marking from `affected` (STM-DIRTY — handoff to SYS-02 H04).
4. Events emitted AFTER successful mutation: `document:changed{type,targets}`.
5. Selection-only actions produce NO command (REQ-SEL-005).

---

## 5. History State Machine

| # | Current | Trigger | Next | Effect | UI |
|---|---|---|---|---|---|
| T1 | (idle) | execute(cmd) | canUndo, !canRedo | undo.push; redo.clear | Undo enabled, Redo disabled |
| T2 | canUndo | undo() | canRedo (canUndo may drop) | pop+revert; redo.push; prevSelection restore | history step moves |
| T3 | canRedo | redo() | canUndo | pop+apply; undo.push | history step moves |
| T4 | canRedo | execute(new cmd) | !canRedo | redo.clear (invalidation) | Redo disabled |
| T5 | (any) | reload (Open) | !canUndo, !canRedo | History::new | Undo+Redo disabled |

**Forbidden:** redo without prior undo (empty redo) · undo on empty stack (no-op, not an error) · coalescing across different commands (only same-gesture).

---

## 6. Coalescing Rules (canonical)

| Gesture | Coalesce? | Rule |
|---|---|---|
| typing (text) | yes | per word/session |
| slider drag | yes | per gesture |
| numeric field | yes | per commit |
| move/transform drag | yes | same gesture (one TransformCommand) |
| discrete ops (paste/delete/insert-key) | no | one entry each |

---

## 7. Commands / Controls

| Control | commandId | Trigger | Precondition | Action | State | Event | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| edit.undo | `edit.undo()` | Ctrl+Z / menu / toolbar | canUndo | pop + revert + restore prevSelection | history moves | `document:changed` | → per snapshot (H04) | n/a (IS undo) | SESSION | empty stack → disabled | T-undo |
| edit.redo | `edit.redo()` | Ctrl+Shift+Z / Ctrl+Y / menu | canRedo | pop + apply + restore prevSelection | history moves | `document:changed` | → per snapshot (H04) | n/a | SESSION | empty redo → disabled | T-redo |
| history.panel | (read-only list) | — | history non-empty | show steps; click = jump-to-step | — | — | n/a | n/a | n/a | — | T-history-panel |
| history.jump | `history.jump(step)` | click history entry | step exists | undo/redo to that step | history at step | `document:changed` | → per snapshot | n/a | SESSION | invalid step → no-op | T-history-jump |

**CommandIds: `edit.undo`, `edit.redo`, `history.jump`.** `edit.undo`/`edit.redo` are distinct commands (undo ≠ redo semantics). No drift.

---

## 8. Undo / Redo Toolbar + History Panel (UI)

- Undo/Redo toolbar buttons: enabled iff canUndo/canRedo (DISABLED-BY-CONTEXT otherwise — SYS-01 §28).
- History panel: list of command labels (most recent last); click a step jumps (undo/redo repeatedly to that point).
- Jump-to-step = NOT a single atomic command; it is a sequence of undo/redo (documented; each step emits `document:changed`).

---

## 9. Event Propagation

| Change | Event | Payload | Consumers |
|---|---|---|---|
| undo/redo/jump applied | `document:changed` | `{type, targets}` | stage/timeline/properties/dirty indicator |
| selection restored (undo) | `selection:changed` | `{prevTargets, targets, kind, …}` | panels (via prevSelection restore) |

`document:changed` is the SAME event edits emit (SYS-01 §27.1); undo/redo are document mutations. No fake events. No refresh hack (FL-0007).

---

## 10. Dirty Interaction (handoff — H01 does NOT compute dirty)

- Undo/redo = DOCUMENT MUTATION → SYS-02 H04 computes dirty by snapshot: "undo returns to saved snapshot → CLEAN; else DIRTY".
- H01 emits `document:changed`; H04 consumes (per SYS-02 H04 §15). H01 owns the mutation, not the dirty flag.

---

## 11. Undo / Persistence

- History = SESSION (not persisted).
- Save preserves History (INV-UNDO-1); reload resets (History::new).
- Undo/redo create NO new document undo entry (they ARE the undo mechanism).

---

## 12. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| undo on empty stack | disabled (not an error) | unchanged | n/a |
| redo on empty stack | disabled | unchanged | n/a |
| async command in flight | Undo disabled until journal ready | unchanged | wait |
| do() throws (validation) | toast (typed error) | no mutation committed | fix + retry |
| partial mutation (async) | journal rollback | model consistent | retry |

---

## 13. Accessibility

- Undo/Redo buttons: aria-label "Undo"/"Redo", aria-disabled when stack empty, shortcut announced.
- History panel: role=listbox; entries role=option; jump announced (aria-live).
- "Undid {label}" / "Redid {label}" announced via toast aria-live.

---

## 14. Edge Cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | empty stack + undo | disabled, no-op | T-undo-empty |
| 2 | undo then redo | state restored exactly | T-undo-redo |
| 3 | undo then new command | redo cleared (invalidation) | T-undo-invalidate |
| 4 | coalesced gesture | one undo entry for whole gesture | T-undo-coalesce |
| 5 | prevSelection restore | selection back to pre-command state | T-undo-selection |
| 6 | undo to saved snapshot | doc → CLEAN (H04) | T-undo-saved |
| 7 | save then undo | undo still works (history preserved) | T-undo-after-save |
| 8 | reload then undo | disabled (history reset) | T-undo-reload |
| 9 | async command + undo | disabled until journal ready | T-undo-async |
| 10 | multi-doc undo | undo affects active doc's history only | T-undo-per-doc |
| 11 | history jump to earlier step | doc + selection at that step | T-history-jump |
| 12 | jump to same step | no-op | T-history-jump-same |

---

## 15. Cross-Handoffs

| Producer → H01 | H01 response |
|---|---|
| tools/systems (commands) | push to History on execute |
| SYS-02 H04 (dirty) | H01 emits document:changed; H04 computes dirty |
| SYS-02 H06 (Open) | reload → History::new |
| SYS-02 H05 (Save) | save preserves History (no-op on H01) |

H01 never computes dirty, never implements hit-test, never owns clipboard.

---

## 16. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** scope ✓ (engine only) · ownership ✓ (MOD-COMMAND = SYS-03) · no dead control (undo/redo/history all real) · INV-UNDO-1..4 + INV-EDIT-1/2/3/5 ✓ · events ✓ (document:changed + selection:changed, no fake) · dirty = handoff ✓ · counting ✓.

---

## 17. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) undo emitting a fake event | event | RESOLVED — document:changed (real mutation) |
| F2 | (risk) undo clearing dirty incorrectly | dirty | RESOLVED — dirty = H04 handoff (snapshot) |
| F3 | (risk) history jump as atomic command | command | RESOLVED — documented as undo/redo sequence |

No manufactured findings.

---

## 18. Ambiguity Register

None H01-owned. (Clipboard/duplicate/paste-special/delete/find = H02/H03, not H01.)

---

## 19. Final Report

STATUS: **READY FOR IMPLEMENTATION** · Commands: 3 (`edit.undo`, `edit.redo`, `history.jump`) · States: 2 (canUndo, canRedo) · Transitions: 5 · Edge cases: 12 · Ambiguities: 0 · Findings: 3 (resolved).

---

*H01 done. Next: H02 (Clipboard).*
