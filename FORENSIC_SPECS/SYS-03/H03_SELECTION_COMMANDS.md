# SYS-03 H03 — SELECTION COMMANDS: SELECT ALL / DESELECT ALL / FIND & REPLACE

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (AMB-S03-005 RESOLVED)

IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H03** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H03 owns the **selection commands**: Select All, Deselect All, and Find & Replace. It owns their semantics, shortcuts, events, and dirty/undo classification.

H03 does NOT own: the selection ENGINE (hit-test/marquee/lasso — → SYS-14/SYS-13) · per-type selection behavior (→ SYS-14) · clipboard (→ H02) · undo engine (→ H01).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.2 | Select All (Ctrl+A) / Deselect All (Ctrl+Shift+A); Find & Replace (Ctrl+F) — "search/replace text, fonts, colors, symbols, sounds across the doc" |
| Blueprint Part 03 §3.3.5 | Select All = "everything on unlocked, visible layers of the current timeline"; Deselect = clear |
| Blueprint Part 03 §3.9 | `selection:changed{prevTargets,targets,kind,commonType,bounds}` once per gesture |
| Blueprint Part 23 (color) | Find & Replace → Colors: "replace all uses of color X with color Y across the document (fills and/or strokes). Our app: scoped (document / scene / selection) + preview." |
| Blueprint Part 11.6 | Swap Symbol (replace instance's symbol — grounds Find & Replace → Symbols) |
| Blueprint Part 22 / Part 17 | text/font properties; audio assets (ground Find & Replace → Text/Font/Sound) |
| Phase 3 eng 01 | REQ-SEL-005 (selection = view state, no undo) |
| Phase 3 eng 05 | async journal (CMD-LIP-SYNC "write N keys (journal)") — grounds Replace-All = one atomic command |
| SYS-01 §27.1 | `selection:changed` (locked) |

---

## 3. Terminology

| Term | Definition |
|---|---|
| Select All | select every object on unlocked+visible layers of the current timeline |
| Deselect All | clear the selection |
| Find & Replace | search/replace across the document (text/font/color/symbol/sound) |

---

## 4. Command / Control Contract

| Control | commandId | Trigger | Precondition | Action | Mutation | Undo | Dirty | Event | testId |
|---|---|---|---|---|---|---|---|---|---|
| edit.selectAll | `edit.selectAll()` | Ctrl+A / menu | doc open | select all (unlocked+visible, current timeline) | NO (view) | n/a | no | `selection:changed` | T-select-all |
| edit.deselectAll | `edit.deselectAll()` | Ctrl+Shift+A / menu | non-empty selection | clear selection | NO (view) | n/a | no | `selection:changed` | T-deselect |
| edit.findReplace | `edit.findReplace()` | Ctrl+F / menu | doc open | open Find & Replace; apply = mutations | YES (on apply) | YES (per apply) | → snapshot (on apply) | `document:changed` (on apply) | T-find-replace |

**CommandIds: 3.** Select All / Deselect All are VIEW commands (no undo — REQ-SEL-005); Find & Replace APPLY is a document mutation (undoable).

---

## 5. Semantics (binding)

### 5.1 Select All (Ctrl+A)
- Select every object on **unlocked + visible** layers of the **current timeline** (current scene or edit-in-place scope). NOT other scenes; NOT hidden/locked layers (Part 03 §3.3.5).
- Emits `selection:changed` ONCE. NO undo (view state).
- Empty result (nothing selectable) → selection unchanged + status "0 selected" (no error).

### 5.2 Deselect All (Ctrl+Shift+A)
- Clear selection. Emits `selection:changed` ONCE. NO undo.

### 5.3 Find & Replace (Ctrl+F) — RESOLVED (AMB-S03-005)

**Targets (Blueprint §1.2.2 explicit — exactly these five):** text · fonts · colors · symbols · sounds. NO other targets are invented.

**Per-target semantics (grounded in the existing object model):**

| Target | Replace mutates | Grounding |
|---|---|---|
| Text | occurrences of a text string inside text blocks | Part 22 (text string property) |
| Font | the font reference on text blocks (font X → font Y) | Part 22 (font property) |
| Color | color X → color Y on fills and/or strokes | Part 23 ("fills and/or strokes") |
| Symbol | instances of symbol A → symbol B (= Swap Symbol) | Part 11.6 |
| Sound | the sound asset reference A → B in audio | Part 17 |

**Scope:**
- Default = **document** ("across the doc", Part 01 §1.2.2).
- **Colors** additionally support **document / scene / selection** scoping + **preview** (Part 23 explicit). Other targets = document scope only (Blueprint silent → no invented scoping).

**Behavior:**
- **Find** = non-mutating (no undo, no dirty, no event).
- **Replace (single)** = one undoable command per applied replacement.
- **Replace-All** = **ONE atomic undoable command** (one History entry) via the async **journal** mechanism (eng 05: CMD-LIP-SYNC "write N keys (journal)" precedent) — the journal records every touched entity so Undo reverts the WHOLE batch in one step.
- **Cancel / no-op** → no command, no mutation (INV-UNDO-4).
- **No matches** → "0 matches" (not silent).
- Locked/hidden content → skipped (consistent with Select All rule, Part 03 §3.7).
- Emits `document:changed` ONCE per applied batch (or per single replace) + `selection:changed` if selection affected.

**Remaining non-blocking deferral:** the exact Find & Replace DIALOG field layout (per-target fields) is UI-spec detail → deferred to H11-style UI work; the SEMANTICS above are the binding command contract.

---

## 6. Event Propagation

| Op | Event(s) |
|---|---|
| Select All / Deselect All | `selection:changed` (ONCE per gesture) |
| Find & Replace (apply) | `document:changed` (+ `selection:changed` if selection affected) |
| Find (no-op) | none |

No fake events; `selection:changed` not per pointer-move (FL-0007, Part 03 §3.9).

---

## 7. Dirty / Undo / Persistence

| Op | Dirty | Undo | Persistence |
|---|---|---|---|
| Select All / Deselect All | no (view) | n/a | SESSION (selection) |
| Find (search) | no | n/a | none |
| Replace / Replace-All | → snapshot (mutation) | YES | DOCUMENT |

---

## 8. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| Select All with everything locked/hidden | "0 selected" | unchanged | unlock |
| Find & Replace no matches | "0 matches" | unchanged | retry |
| Find & Replace on locked layer | blocked (toast) | unchanged | unlock |

---

## 9. Accessibility

- Select All / Deselect All / Find & Replace: role=menuitem, shortcut announced.
- Selection count announced (aria-live) on `selection:changed`.
- Find & Replace dialog: focus trap, Esc=cancel, results announced.

---

## 10. Edge Cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | select all with locked layer | locked content excluded | T-select-locked |
| 2 | select all with hidden layer | hidden content excluded | T-select-hidden |
| 3 | select all in edit-in-place | only in-scope content | T-select-scope |
| 4 | deselect empty selection | no-op | T-deselect-empty |
| 5 | find no matches | "0 matches" | T-find-none |
| 6 | replace all | one atomic undoable command (journal) | T-replace-all |
| 7 | replace on locked layer | blocked | T-replace-locked |
| 8 | select all is not undoable | no history entry | T-select-no-undo |

---

## 11. Cross-Handoffs

| Producer → H03 | H03 response |
|---|---|
| SYS-14 (selection engine) | Select All/Deselect mutate MOD-SELECTION (shared) |
| H01 (undo) | Find & Replace apply = commands |
| SYS-02 H04 (dirty) | emit document:changed on apply |

---

## 12. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** scope ✓ (commands only, not engine) · REQ-SEL-005 ✓ (view state no undo) · events ✓ · AMB-S03-005 registered, not resolved ✓.

---

## 13. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) Select All creating undo entry | undo | RESOLVED — view state (REQ-SEL-005) |
| F2 | (risk) Select All ignoring locked/hidden | selection | RESOLVED — §5.1 (Part 03 §3.3.5) |

No manufactured findings.

---

## 14. Ambiguity Register (H03-owned)

| AMB | Question | Sources | Status |
|---|---|---|---|
| AMB-S03-005 | Find & Replace depth + Replace-All atomicity | Part 01 §1.2.2 (5 targets); Part 23 (color scoping+preview); Part 11.6/22/17 (mechanics); eng 05 (journal) | **RESOLVED** — 5 targets grounded in object model; document scope (colors: doc/scene/selection + preview); Replace-All = one atomic journal command. Remaining non-blocking: dialog field layout (deferred to H11-style UI) |

Zero H03-owned implementation-critical ambiguity.

---

## 15. Final Report

STATUS: **READY FOR IMPLEMENTATION** — AMB-S03-005 RESOLVED. Commands: 3 · Edge cases: 8 · Findings: 2 (resolved) · AMBs: 0 open.

---

*H03 done (REVISION REQUIRED). Next: H04 (Edit Menu + Shortcuts + Handoffs).*
