# H04 — DIRTY STATE + UNSAVED CHANGES

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION**

Revision: **H04-RELEASE (v2 — invariant contradiction fixed)** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority order: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code (evidence only).
> v2 corrects the `INV-DIRTY-2` ↔ `T6` contradiction by rewriting the invariant itself (not by adding a defensive note). See §19 F-01.

---

## 2. Scope

H04 owns ONLY: per-document dirty state (CLEAN/DIRTY/SAVING/SAVE_ERROR per STM-DIRTY), the authoritative dirty semantic (dirty = "differs from last-saved snapshot"), dirty transitions, the dirty indicator semantics, unsaved-change detection, the dirty-guard **contract** (Save/Discard/Cancel decision + dirty consequences), cancellation semantics, save-failure semantics, dirty-related events.

H04 does NOT own: actual file writing → **H05/SYS-28**; open loading → **H06**; close lifecycle → **H07**; the guard **dialog** chrome/a11y (H07 opens it; SYS-01 renders the modal); persistence internals → **SYS-28**.

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Phase 3 eng 04 STM-DIRTY | CLEAN → DIRTY → SAVING → CLEAN \| ERROR; `command.execute()` → DIRTY; write failure keeps DIRTY; close-with-DIRTY → confirm; "forbidden: DIRTY→CLEAN without a successful write" (see §3.1 reinterpretation) |
| H00 §7 (dirty constitution) | DOCUMENT-vs-VIEW distinction; "dirty = differs from last-saved snapshot"; the 15-question answer table (undo CAN reach CLEAN only by returning to the exact saved state) |
| H00 §6 (lifecycle) | orthogonal dimensions; dirty = per-document dimension |
| H00 §10 (destructive) | guard = Discard/Save/Cancel; Discard non-undoable |
| SYS-02 §13.2 | SAVING/SAVE_ERROR = transient sub-states of DIRTY (still unsaved) |
| SYS-02 §17 | dirty audit: edit/import dirty; view/workspace/export don't; save → CLEAN |
| SYS-01 §27.1 | `saving:changed` (payload `{state, time?}`) and `document:changed` (producer: Command post-do, "any doc mutation") |
| H02-RELEASE | per-doc dirty isolation; switch never transfers dirty |
| H07 §6 | guard = Save/Discard/Cancel **decision** (Save ⇒ H05 write, Discard ⇒ proceed, Cancel ⇒ abort) — not new commandIds |
| AI01_FORENSIC_LESSONS.md | FL-0014 (dirty leak), FL-0024 (contradictory machine), FL-0025 (invariant vs transition) |

### 3.1 Reinterpretation of the STM-DIRTY forbidden transition (binding)

STM-DIRTY states "forbidden: DIRTY→CLEAN without a successful write." The authoritative dirty semantic is **"DIRTY = the current document state differs from the last-saved snapshot"** (H00 §7 table; user-approved definition). Under that semantic, DIRTY legitimately clears whenever the state again equals the snapshot:

- **(A)** a successful write (Save/Save As) advances the snapshot to the current state → CLEAN;
- **(B)** a document mutation that moves the current state to exactly the snapshot → CLEAN. Undo/redo are **examples** of such mutations, NOT the only ones — a fresh edit that returns a value to its saved value (e.g. X: 10 → 20 → 10) also reaches CLEAN.

STM-DIRTY's forbidden transition is therefore read as a protection against **arbitrary** clearing: **no VIEW / SESSION / WORKSPACE / PREFERENCE action may ever clear DIRTY** (only a successful write or a snapshot-equaling document mutation may). This reading is the single source of truth for H04; it makes the invariant, the transition table, and the edge cases describe the SAME legal paths (FL-0025).

---

## 4. Dependency Map

H04 depends on: H00 §7/§6/§10, SYS-01 §27.1 (`saving:changed`, `document:changed`), H02 (per-doc isolation).
H04 provides to: H05 (save → CLEAN), H06 (loaded doc → CLEAN; NO guard), H07 (close/exit guard), H02 (dirty indicator binding).
H04 reacts to (does not own): SYS-13..26 edits (set DIRTY), H05 save result (→CLEAN), H06 open/new (→CLEAN).

---

## 5. Terminology

| Term | Definition |
|---|---|
| Saved snapshot | the document state as last persisted (Save/Save As). For a never-saved document, the reference snapshot is the document's initial created/seed state (empty for New; preset for New-from-Template) — consistent with "new doc starts CLEAN" (H00 §7, H01). |
| Dirty | document state **differs from the saved snapshot** (STM-DIRTY = DIRTY). NOT "has undo entries". |
| Clean | document state **equals the saved snapshot** (or a never-mutated new doc). |
| Saving | write in flight (transient **sub-state of DIRTY** — still unsaved until the write succeeds) |
| Save error | write failed (transient **sub-state of DIRTY** — still unsaved, retryable) |
| Dirty guard | the Discard/Save/Cancel **decision** required before a destructive action on a DIRTY doc |
| Unsaved changes | = DIRTY state (a doc with edits since last save, incl. SAVING/SAVE_ERROR) |

---

## 6. Dirty Constitution (canonical — binding)

### 6.0 Canonical semantic (authoritative)

> **DIRTY ⇔ (current document state ≠ saved snapshot).**
> A document becomes CLEAN only when its state again **equals** the saved snapshot — via a successful write (snapshot advances) or via a document mutation that returns/reaches the snapshot (undo/redo are examples, NOT the only mutations). "Has undo entries" is NOT the dirty definition.

### 6.1 What dirties / what doesn't (absolute distinction)

| Operation | Class | Makes DIRTY? |
|---|---|---|
| Edit commands (SYS-13..26) | DOCUMENT MUTATION | **YES** (state leaves snapshot) |
| Import-to-Stage/Library | DOCUMENT MUTATION | **YES** (one atomic command) |
| Undo/Redo | DOCUMENT MUTATION | **YES if leaves ≠ snapshot; NO if returns to the exact snapshot** |
| Save/Save As (success) | FILE-SYSTEM | **NO → CLEAN** (snapshot advances to current state) |
| Failed save | FILE-SYSTEM | **stays DIRTY** (SAVE_ERROR) |
| New/Open | LIFECYCLE | **NO (start CLEAN)** |
| Close | LIFECYCLE | **NO (removes doc)** |
| Export/Publish | NON-MUTATING | **NO** |
| Selection/scrub/play/stop | VIEW | **NO** |
| Workspace/panel/theme/pref | WORKSPACE/PREFERENCE | **NO** |

### 6.2 Invariants

- INV-DIRTY-1: only DOCUMENT MUTATION sets DIRTY. `[STM-DIRTY]`
- INV-DIRTY-2 (rewritten): DIRTY clears to CLEAN **only when the current document state equals the saved snapshot** — via (a) a successful write (Save/Save As) that advances the snapshot to the current state, or (b) a document mutation that moves the state to the snapshot (undo/redo are examples, NOT the only mutations). Every operation that leaves the state ≠ snapshot preserves DIRTY; **no VIEW / SESSION / WORKSPACE / PREFERENCE action may clear DIRTY.** `[H00 §7 "differs from snapshot" + STM-DIRTY arbitrary-clearing protection]`
- INV-DIRTY-3: Save does NOT clear undo history. `[Part 12]`
- INV-DIRTY-4: dirty is per-document; switching never transfers it. `[STM-DIRTY]`

---

## 7. State Model + Transitions

Per-document dirty machine (STM-DIRTY). SAVING/SAVE_ERROR are transient sub-states of DIRTY.

```
CLEAN ──document mutation (state ≠ snapshot)──▶ DIRTY
DIRTY ──save start──▶ SAVING
SAVING ──write ok──▶ CLEAN        (snapshot advances; "Saved hh:mm")
SAVING ──write fail──▶ SAVE_ERROR (stays DIRTY)
SAVE_ERROR ──retry──▶ SAVING
DIRTY ──document mutation returns to exact snapshot──▶ CLEAN   (no write)
DIRTY ──discard (guard)──▶ (doc removed — not a dirty transition)
```

**Forbidden (rewritten — no longer contradicts T6):**
- DIRTY → CLEAN by any means OTHER than (a) a successful write or (b) a document mutation (any — undo/redo are examples) that returns to the exact snapshot.
- In particular, no VIEW (selection/scrub/play/stop), SESSION (tab switch), WORKSPACE (resize/collapse/hide), or PREFERENCE (theme/shortcut) action may clear DIRTY.
- SAVING → DIRTY without a write result (a write must resolve ok or fail).

### 7.1 Transitions table

| # | Current | Trigger | Next | Event | UI |
|---|---|---|---|---|---|
| T1 | CLEAN | edit/import (mutation ≠ snapshot) | DIRTY | `document:changed` | dirty ● appears |
| T2 | DIRTY | Save/Save As start | SAVING | `saving:changed{saving}` | "Saving…" |
| T3 | SAVING | write ok | CLEAN | `saving:changed{saved}` | "Saved hh:mm"; ● cleared |
| T4 | SAVING | write fail | SAVE_ERROR | `saving:changed{error}` | "Save error" |
| T5 | SAVE_ERROR | retry | SAVING | `saving:changed{saving}` | "Saving…" |
| T6 | DIRTY | document mutation returns to exact saved snapshot | CLEAN | `document:changed` | ● cleared (no write) |
| T7 | CLEAN | document mutation leaves snapshot | DIRTY | `document:changed` | ● appears |

T6 (mutation→CLEAN) and T7 (mutation→DIRTY) are the symmetric consequences of the "dirty = differs from snapshot" semantic; T1 is the general mutation case (edit/import). Undo/redo are examples of the mutations in T6/T7, not the only ones. All three set dirty by the snapshot comparison — never by undo-stack depth.

### 7.2 Undo / Dirty Matrix (explicit)

> Dirty is decided by the **snapshot relation**, never by "has undo entries".

| # | Action | Document state | Snapshot relation | Dirty | Undo | Event |
|---|---|---|---|---|---|---|
| 1 | First edit | changed | ≠ snapshot | → DIRTY | push entry | `document:changed` |
| 2 | Second edit | changed | ≠ snapshot | stays DIRTY | push entry | `document:changed` |
| 3 | Undo once | reverts | ≠ snapshot (still) | stays DIRTY | pop | `document:changed` |
| 4 | Undo to saved snapshot | = snapshot | = snapshot | → CLEAN | pop | `document:changed` |
| 5 | Undo past saved snapshot | reverts further | ≠ snapshot (other side) | → DIRTY | pop | `document:changed` |
| 6 | Redo | re-applies | ≠ snapshot | → DIRTY | redo | `document:changed` |
| 7 | Redo to saved snapshot | = snapshot | = snapshot | → CLEAN | redo | `document:changed` |
| 8 | Save | persisted | snapshot advances | → CLEAN | history preserved (no clear) | `saving:changed{saved}` |
| 9 | Save As | persisted | snapshot advances | → CLEAN | history preserved | `saving:changed{saved}` |
| 10 | Failed save | unchanged | ≠ snapshot | stays DIRTY (SAVE_ERROR) | none | `saving:changed{error}` |
| 11 | Import | mutated | ≠ snapshot | → DIRTY | push (atomic) | `document:changed` |
| 12 | Export | unchanged | unchanged | unchanged | none | `export:done` (SYS-27) |
| 13 | Selection change | unchanged | unchanged | unchanged | none | `selection:changed` |
| 14 | Playhead change | unchanged | unchanged | unchanged | none | `playhead:moved` |
| 15 | Panel resize | unchanged | unchanged | unchanged | none | `panel:changed` |
| 16 | Tab switch | unchanged (this doc) | unchanged | unchanged (per-doc) | none (no merge) | `activeDoc:changed` (H02) |
| 17 | New mutation reaches snapshot (non-undo, e.g. X: 10→20→10) | = snapshot | = snapshot | → CLEAN | push entry | `document:changed` |

> Rows 3–7 show undo/redo as concrete examples; the SAME snapshot rule applies to **any** document mutation — a fresh edit that returns the state to the saved value (row 17) also reaches CLEAN. Dirty is decided by the snapshot relation, never by "has undo entries" or "which command did it".

---

## 8. Dirty Guard Contract

The dirty guard is the Discard/Save/Cancel **decision** required before a destructive action on a DIRTY document (H00 §10). H04 owns the guard **contract** (the three decisions + their dirty consequences); H07 opens the dialog; SYS-01 renders the modal chrome. The guard is a **decision point inside the invoking lifecycle command** (`file.close`/`file.closeAll`/`file.exit`) — it does NOT define new commandIds (see §9).

| Trigger | Invoking command (owner) | Decisions | Dirty result |
|---|---|---|---|
| Close DIRTY doc | `file.close()` (H07) | Discard / Save / Cancel | per §8 paths |
| Close All (any DIRTY) | `file.closeAll()` (H07) | per-doc, sequential | per-doc |
| Exit (any DIRTY) | `file.exit()` (H07) | Discard / Save / Cancel | per §8 paths |

**Open is NOT a guard trigger** (multi-doc: Open adds + activates the new document; the previously-active document becomes INACTIVE with its dirty state preserved — no data loss, therefore no guard). This is H00 §6.3 "Open in multi-document" binding note. `file.open` is therefore NOT a guard-invoking command.

**Decision semantics:**
- **Save** → H05 `file.save()` write → success → CLEAN → invoking command proceeds. Fail → stay DIRTY, do NOT proceed.
- **Discard** → lose unsaved changes → invoking command proceeds. Non-undoable (permanent).
- **Cancel** → abort the destructive action; document unchanged; no state change.

A doc in SAVING or SAVE_ERROR is still DIRTY (unsaved) → the guard still applies (e.g., close while a save failed → guard; close mid-save is H07/H10 async-save lifecycle, not H04).

---

## 9. Commands / Controls

H04 owns **one** visible control (the dirty indicator) and the three guard **decisions**. H04 defines **no new commandId** — the guard's Save reuses `file.save()` (H05); Discard/Cancel are decisions returned to the invoking command (H07/H06), not commands.

| Control | commandId / behavior | Trigger | Precondition | Action | State | Event | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (dirty indicator) | none — read-only display (non-command) | — | doc open | reflect active doc's dirty | — | updates on `document:changed` | n/a | n/a | n/a | — | T-dirty-indicator |
| dlg-guard.save | **reuses `file.save()`** (H05), then proceeds | click | doc DIRTY | save then proceed | DIRTY→SAVING→CLEAN | `saving:changed` | →CLEAN | no | DOCUMENT | save fail → stay DIRTY | T-guard-save |
| dlg-guard.discard | **guard decision "discard"** → invoking command proceeds, discarding changes | click | doc DIRTY | discard + proceed | doc removed/advanced (H07/H06) | (invoking-flow events) | (doc gone / reset) | **no (permanent)** | — | — | T-guard-discard |
| dlg-guard.cancel | **guard decision "cancel"** → abort invoking command | click/Esc | doc DIRTY | abort; unchanged | unchanged | none | unchanged | no | — | — | T-guard-cancel |

H04 does NOT own the guard DIALOG mechanics (H07 opens it; SYS-01 renders the modal) nor its a11y (H07 §13). H04 owns the dirty state behind it and the decision contract.

---

## 10. Event Propagation

| Change | Event | Payload | Consumers |
|---|---|---|---|
| dirty → DIRTY (mutation ≠ snapshot) | `document:changed` | `{type, targets}` | dirty indicator, title bar |
| dirty → CLEAN (mutation = snapshot, T6) | `document:changed` | `{type, targets}` | dirty indicator (● cleared) |
| save start | `saving:changed{saving}` | `{state, time?}` | status bar (st.saving) |
| save ok | `saving:changed{saved}` | `{state, time?}` | status bar, dirty indicator |
| save fail | `saving:changed{error}` | `{state, time?}` | status bar ("Save error") |

`document:changed` for dirty is the SAME event edits already emit (SYS-01 §27.1: producer "Command (post-do)", trigger "any doc mutation", state effect "DIRTY"). H04 consumes it to flip the indicator — including on T6 (undo/redo-to-snapshot clears the ●). `saving:changed` (locked, SYS-01 §27.1) covers the save-state transitions. No fake events; no event reused as a refresh hack (FL-0007).

---

## 11. Undo / Persistence

- Dirty indicator changes: no undo (view).
- Guard Discard: non-undoable (permanent).
- Guard Save: no document undo (FILE-SYSTEM, H00 §13); save does NOT clear history.
- Dirty state = TEMPORARY (STM-DIRTY), never persisted; document content = DOCUMENT (SYS-28).

---

## 12. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| Save fails (disk/permission/read-only) | "Save error" (status) + toast | stays DIRTY (SAVE_ERROR) | retry |
| Guard save fails | guard stays open with "Save error" | DIRTY preserved | retry/cancel |
| Discard | (silent proceed — explicit user choice) | doc removed | none (permanent) |

No silent failure; failed save never silently clears dirty (INV-DIRTY-2 path (a) requires a successful write).

---

## 13. Accessibility

H04 owns ONLY the dirty-indicator a11y (its own UI). The guard dialog's a11y is H07 §13 + SYS-01 C-07 — NOT H04 (FL-0016).

| Element | Behavior | Source | testId |
|---|---|---|---|
| Dirty indicator | `aria-label="unsaved changes"`; `aria-live="polite"` on change; contrast via SYS-01 tokens (danger) | C-35 (aria-live for state changes) | T-dirty-indicator-aria |
| Dirty ● in tab | announced as part of tab name ("Title — unsaved") | H02 §19 | T-dirty-tab-aria |
| Guard dialog | focus trap, Esc = Cancel, Enter = primary | C-07 / STM-MODAL (owned by H07 §13) | (H07 test IDs) |

---

## 14. Edge-Case Matrix

| # | Case | Expected | Owner | Event | Dirty result | Undo result | testId |
|---|---|---|---|---|---|---|---|
| 1 | new clean document | starts CLEAN (no ●) | H01/H04 | (none) | CLEAN | — | T-dirty-new-clean |
| 2 | first edit | CLEAN→DIRTY, ● appears | H04 | document:changed | DIRTY | push | T-dirty-first |
| 3 | multiple edits | stays DIRTY (no extra transition) | H04 | document:changed | DIRTY | push ×N | T-dirty-multi |
| 4 | undo back to saved snapshot | DIRTY→CLEAN (snapshot match, no write) | H04 | document:changed | CLEAN | pop | T-dirty-undo-saved |
| 5 | undo past saved snapshot | stays DIRTY (other side of snapshot) | H04 | document:changed | DIRTY | pop | T-dirty-undo-past |
| 6 | redo to saved snapshot | DIRTY→CLEAN (snapshot match) | H04 | document:changed | CLEAN | redo | T-dirty-redo-saved |
| 7 | redo to dirty state | CLEAN→DIRTY | H04 | document:changed | DIRTY | redo | T-dirty-redo |
| 8 | failed save | DIRTY preserved (SAVE_ERROR) | H04/H05 | saving:changed{error} | DIRTY | none | T-dirty-save-fail |
| 9 | retry save | SAVE_ERROR→SAVING | H04/H05 | saving:changed{saving} | DIRTY (in-flight) | none | T-dirty-save-retry |
| 10 | save success | DIRTY→CLEAN | H04/H05 | saving:changed{saved} | CLEAN | preserved | T-dirty-save-ok |
| 11 | Save As success | DIRTY→CLEAN (→TITLED) | H04/H05 | saving:changed{saved} | CLEAN | preserved | T-dirty-saveas-ok |
| 12 | import | →DIRTY (undoable atomic command) | H04/H08 | document:changed | DIRTY | push | T-dirty-import |
| 13 | export while dirty | stays DIRTY (non-mutating) | H04 | export:done | DIRTY | none | T-dirty-export |
| 14 | publish while dirty | stays DIRTY (non-mutating) | H04 | export:done | DIRTY | none | T-dirty-publish |
| 15 | tab switch while dirty | each doc's ● independent; no transfer | H02/H04 | activeDoc:changed | unchanged (per-doc) | no merge | T-dirty-switch |
| 16 | close dirty | guard shown | H07/H04 | — | (guard) | — | T-dirty-close |
| 17 | open while dirty | NO guard (multi-doc): dirty doc → INACTIVE (dirty preserved); new doc active | H06/H02 | activeDoc:changed | DIRTY preserved (per-doc) | none | T-dirty-open |
| 18 | exit while dirty | guard shown | H07/H04 | — | (guard) | — | T-dirty-exit |
| 19 | close all mixed dirty | guard per dirty doc, sequential (P-5) | H07/H04 | — | per-doc | — | T-dirty-close-all |
| 20 | cancel guard | unchanged | H04 | none | unchanged | none | T-guard-cancel |
| 21 | save-from-guard | →CLEAN + proceed | H05/H04 | saving:changed{saved} | CLEAN | no | T-guard-save |
| 22 | discard-from-guard | doc removed, non-undoable | H07/H04 | (H07 events) | (doc gone) | **no (permanent)** | T-guard-discard |
| 23 | guard save fails | stays DIRTY, close/exit does NOT proceed | H05/H07/H04 | saving:changed{error} | DIRTY | no | T-guard-save-fail |
| 24 | workspace/view change while dirty | stays DIRTY (view doesn't clean) | H04 | none (view event) | DIRTY | none | T-dirty-view-noclean |
| 25 | no-document state | dirty flag N/A (no doc) | H04/H07 | activeDoc:changed{null} | N/A | — | T-dirty-no-doc |
| 26 | new mutation returns state to saved snapshot (non-undo) | DIRTY→CLEAN (snapshot match, no write) | H04 | document:changed | CLEAN | push | T-dirty-mutation-snapshot |

---

## 15. Cross-Handoffs

| Producer → H04 | H04 response |
|---|---|
| SYS-13..26 edit | set DIRTY |
| H05 save success | set CLEAN |
| H05 save failure | set SAVE_ERROR (stay DIRTY) |
| H06 open/new | set CLEAN (loaded/new doc) |
| H07 close/exit guard | provide dirty flag; Discard/Save/Cancel decision paths |

H04 provides the dirty flag + guard decision contract; it never implements save/load/close.

---

## 16. Dead-Control Audit

The dirty indicator is read-only (explicit non-command). The three guard buttons each have a real path via the guard decision contract (Save → `file.save()`; Discard/Cancel → invoking command branch). No visible dead control; no commandless functional control.

---

## 17. Ownership Audit

| Concern | Owner |
|---|---|
| dirty flag + dirty semantic | H04 (per-document, STM-DIRTY) |
| guard decision contract | H04 |
| guard dialog chrome + a11y | H07 (opens) + SYS-01 (modal) |
| save write | H05/SYS-28 |
| close/open lifecycle | H07/H06 |
| dirty indicator UI binding | SYS-02/H02 (binds to active doc) |

No collision. No invented commandId.

---

## 18. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0025 (all ACTIVE; FL-0025 added this pass).

**Checks passed:**
- [x] scope — only dirty + guard contract; guard dialog a11y removed (H07/SYS-01) — FL-0016
- [x] ownership — one owner per concern, no invented commandId — FL-0009/0010
- [x] events — `document:changed` + `saving:changed{saving|saved|error}` only; no fake; no refresh hack — FL-0007/0008
- [x] state — STM-DIRTY preserved, orthogonal (per-doc); no flatten — FL-0021/0024
- [x] **invariant ↔ transition cross-check — INV-DIRTY-2 rewritten; every transition (T1–T7) verified against the invariant wording — FL-0025**
- [x] dirty — no leak; "differs from snapshot" ≠ "has undo entries" — FL-0014
- [x] undo — save ≠ clear; discard non-undoable — FL-0015
- [x] persistence — TEMPORARY vs DOCUMENT — FL-0004/0017
- [x] accessibility — indicator a11y sourced; guard-dialog a11y handed to H07 (no implicit focus claim) — FL-0012
- [x] edge cases — 26 cases — FL-0018/0019
- [x] counting — all counts derived from tables (§23) — FL-0020
- [x] status honest — READY only because zero implementation-critical ambiguity — FL-0018/0023

---

## 19. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F-01 | `INV-DIRTY-2` ("DIRTY→CLEAN only via successful write") contradicted `T6` (undo-to-snapshot → CLEAN); the prior "note" only explained the tension away without fixing the invariant | state / contradictory invariant (FL-0025) | **FIXED** — `INV-DIRTY-2` rewritten (§6.2) + forbidden transitions rewritten (§7) to express the snapshot-based CLEAN rule (write OR any mutation reaching the snapshot — FL-0027); T6's defensive note deleted; T7 symmetric case added |
| F-02 | §9 invented commandIds `guardSave()/guardDiscard()/guardCancel()` not in the canonical registry, contradicting H07 §6's decision model | command invention (FL-0010) | **FIXED** — guard = decision contract; Save reuses `file.save()`; Discard/Cancel = decisions returned to the invoking command |
| F-03 | §13 asserted an unsourced "initial focus = Cancel (safe default)" and duplicated H07's guard-dialog a11y | cross-H scope leak + unsourced a11y (FL-0016/0012) | **FIXED** — guard-dialog a11y removed from H04 (owned by H07 §13 + SYS-01 C-07). **Cross-file note:** H07 §13's own "initial focus = Cancel (safe)" is likewise unsourced (no Blueprint/eng/C-07/C-35 source); flagged for H07's revision — not an H04 blocker |
| F-04 | (cross-file) H00 §7 `INV-DIRTY-2`, §6.3 forbidden transition, and §22 `INV-008` carried the SAME "DIRTY→CLEAN only via write" wording | cross-file consistency (FL-0025) | **RESOLVED (H00↔H04 reconciliation)** — H00 §7/§6.3/§22 now corrected to the same snapshot-based wording. H00 ↔ H04 agree |
| F-05 | (minor) event contract cited as "SYS-01 §4" but lives at §27.1 in SYS-01 v5 | citation drift (FL-0026) | **RESOLVED (H00↔H04 reconciliation)** — H00/H02 citations corrected (§4→§27.1); full Citation Drift Report in the reconciliation |

No manufactured findings. No implementation-critical ambiguity.

---

## 20. Ambiguity Register

None. The dirty semantics are fully established by the authoritative "differs from snapshot" definition (H00 §7 + user-approved) + STM-DIRTY (arbitrary-clearing protection). Zero implementation-critical ambiguity in H04.

*(The guard-dialog "initial focus" detail is an H07 concern, not H04 — flagged in §19 F-03 for H07's revision.)*

---

## 21. Test ID Matrix

T-dirty-indicator · T-dirty-indicator-aria · T-dirty-tab-aria · T-dirty-new-clean · T-dirty-first · T-dirty-multi · T-dirty-undo-saved · T-dirty-undo-past · T-dirty-redo-saved · T-dirty-redo · T-dirty-mutation-snapshot · T-dirty-save-fail · T-dirty-save-retry · T-dirty-save-ok · T-dirty-saveas-ok · T-dirty-import · T-dirty-export · T-dirty-publish · T-dirty-switch · T-dirty-close · T-dirty-open · T-dirty-exit · T-dirty-close-all · T-guard-cancel · T-guard-save · T-guard-discard · T-guard-save-fail · T-dirty-view-noclean · T-dirty-no-doc

---

## 22. Completion Checklist

- [x] H00 dirty constitution preserved (INV-DIRTY-1..4, §7 distinction)
- [x] **INV-DIRTY-2 rewritten (contradiction removed — no longer "save-only")**
- [x] DOCUMENT vs VIEW/PREFERENCE distinction absolute
- [x] STM-DIRTY transitions + rewritten forbidden transitions (no contradiction with T6)
- [x] undo/redo snapshot semantics explicit (§7.2 matrix — dirty ≠ "has undo entries")
- [x] guard contract (Save/Discard/Cancel decisions) defined, not owned; no invented commandIds
- [x] no dirty/undo leakage
- [x] events correct (document:changed + saving:changed, no fake)
- [x] no dead controls
- [x] 26 edge cases
- [x] lessons pre-flight passed (FL-0001..0025)
- [x] zero implementation-critical ambiguity

---

## 23. Final H04 Report

STATUS: **READY FOR IMPLEMENTATION**

- Controls: 4 (1 dirty indicator + 3 guard-contract buttons)
- Commands owned: 0 (guard Save reuses `file.save()` from H05; Discard/Cancel = decisions)
- States: 4 (CLEAN/DIRTY/SAVING/SAVE_ERROR; SAVING/SAVE_ERROR ⊂ DIRTY)
- Transitions: 7 (T1–T7)
- Undo/dirty matrix rows: 17
- Edge cases: 26
- Ambiguities: 0
- Findings: 5 (F-01/F-02/F-03 fixed in H04 v2; F-04/F-05 resolved in H00↔H04 reconciliation)

**Counting audit (FL-0020 — mechanically reproducible):** Controls (4) = §9 rows. Transitions (7) = §7.1 rows. Undo/dirty matrix (17) = §7.2 rows. Edge cases (26) = §14 rows. Test IDs (29) = §21. No stale aggregate.

---

*H04 done (v2 — contradiction fixed). Next: H05 (not started here).*
