# SYS-03 H05 — UI → ENGINE CONNECTION MATRIX

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION**
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H05** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H05 owns the **exhaustive end-to-end connection matrix** for every SYS-03 Edit control: CONTROL → EVENT → COMMAND → TARGET → STATE MUTATION → ENGINE → DOCUMENT EFFECT → DIRTY → UNDO → PERSISTENCE → UI REBIND → TEST. Completeness proof: no orphan control, no command without consumer, no event without producer+consumer.

H05 does NOT own the commands/engines; it CONNECTS what H01–H04 define.

---

## 2. Connection Matrix (one row per control — no orphans)

### 2.1 Undo/Redo

| controlId | event | commandId | target | state mutation | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| edit.undo | click/Ctrl+Z | `edit.undo()` | active doc | history pop+revert | MOD-COMMAND | revert last command | → snapshot (H04) | n/a | SESSION | `document:changed` + `selection:changed` | T-undo |
| edit.redo | click/Ctrl+Shift+Z | `edit.redo()` | active doc | history pop+apply | MOD-COMMAND | re-apply | → snapshot (H04) | n/a | SESSION | `document:changed` + `selection:changed` | T-redo |
| history.jump | click | `history.jump(step)` | active doc | undo/redo to step | MOD-COMMAND | doc at step | → snapshot | n/a | SESSION | `document:changed` | T-history-jump |
| history.panel | (read) | none — view | — | — | MOD-COMMAND (read) | none | n/a | n/a | n/a | reflects History | T-history-panel |

### 2.2 Clipboard

| controlId | event | commandId | target | state mutation | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| edit.cut | click/Ctrl+X | `edit.cut()` | selection | clipboard write + delete | MOD-COMMAND | remove selection | → snapshot | YES | DOCUMENT | `document:changed` + `selection:changed` | T-cut |
| edit.copy | click/Ctrl+C | `edit.copy()` | selection | clipboard write | (clipboard) | none | no | n/a | SESSION | none | T-copy |
| edit.pasteCenter | click/Ctrl+V | `edit.paste('center')` | doc | insert at center | MOD-COMMAND | add nodes (new IDs) | → snapshot | YES | DOCUMENT | `document:changed` + `selection:changed` | T-paste-center |
| edit.pastePlace | click/Ctrl+Shift+V | `edit.paste('place')` | doc | insert at source coords | MOD-COMMAND | add nodes | → snapshot | YES | DOCUMENT | same | T-paste-place |
| edit.pasteSpecial | click | `edit.paste('special')` | doc | format dialog → paste (format list = AMB-S03-003) | MOD-COMMAND | add nodes (fresh IDs) | → snapshot | YES | DOCUMENT | `document:changed` + `selection:changed` (cancel = none) | T-paste-special |
| edit.duplicate | click/Ctrl+D | `edit.duplicate()` | selection | copy+offset insert | MOD-COMMAND | add offset copy | → snapshot | YES | DOCUMENT | `document:changed` + `selection:changed` | T-duplicate |
| edit.delete | Delete key | `edit.delete()` | selection | remove selection | MOD-COMMAND | delete nodes | → snapshot | YES | DOCUMENT | `document:changed` + `selection:changed` | T-delete |

### 2.3 Selection commands

| controlId | event | commandId | target | state mutation | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| edit.selectAll | click/Ctrl+A | `edit.selectAll()` | selection | select all (unlocked+visible) | MOD-SELECTION | none | no | n/a | SESSION | `selection:changed` | T-select-all |
| edit.deselectAll | click/Ctrl+Shift+A | `edit.deselectAll()` | selection | clear selection | MOD-SELECTION | none | no | n/a | SESSION | `selection:changed` | T-deselect |
| edit.findReplace | click/Ctrl+F | `edit.findReplace()` | doc | search/replace | MOD-COMMAND (on apply) | mutation (on apply) | → snapshot (apply) | YES (apply) | DOCUMENT (apply) | `document:changed` (apply) | T-find-replace |

---

## 3. Event Audit (reconciled)

| Event | Payload | Producer | Consumers | Fires | MUST NOT fire |
|---|---|---|---|---|---|
| `selection:changed` | `{prevTargets, targets, kind, commonType, bounds}` | MOD-SELECTION | panels + SYS-03 (cut/copy/delete read selection) | selection mutated (Select All/Deselect/cut/paste/delete) | per pointer-move; copy (no selection change) |
| `document:changed` | `{type, targets}` | Command post-do | stage/timeline/properties/dirty indicator | document mutation (undo/redo/cut/paste/duplicate/delete/find-apply) | selection-only change; copy |

Single canonical schema (FL-0030); no refresh-hack (FL-0007); `selection:changed` once per gesture (Part 03 §3.9).

---

## 4. Orphan / Completeness Check

- Every control (§2) has commandId (or "read-only"/"none-view") + engine target + testId. No orphan.
- Every command (H01 3 + H02 5 + H03 3 = 11 commandIds) has ≥1 control. No command without consumer.
- Every event (§3) has producer + ≥1 consumer.
- Every engine op (MOD-COMMAND execute/undo/redo, MOD-SELECTION mutate) is reachable only via an owning command (INV-CMD-2).

---

## 5. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** no orphan ✓ (FL-0006) · canonical payload ✓ (FL-0030) · no refresh-hack ✓ (FL-0007) · commandIds verbatim ✓ (FL-0010) · dirty/undo columns consistent with H01/H02/H03 + SYS-02 H04 ✓ (FL-0014/0015) · counting ✓ (3 sub-matrices, 14 controls, 2 events).

---

## 6. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) copy emitting document:changed | event | RESOLVED — copy emits nothing |
| F2 | (risk) select-all emitting document:changed | event | RESOLVED — view state, selection:changed only |
| F3 | (risk) paste reusing IDs | identity | RESOLVED — fresh IDs (§2.2) |

No manufactured findings.

---

## 7. Final Report

STATUS: **READY FOR IMPLEMENTATION** · Controls: 14 · Commands connected: 11 · Events: 2 · Orphans: 0 · Findings: 3 (resolved).

---

*H05 done. Next: H06 (QA).*
