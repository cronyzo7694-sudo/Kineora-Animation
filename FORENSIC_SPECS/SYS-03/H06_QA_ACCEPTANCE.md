# SYS-03 H06 — QA + MANUAL ACCEPTANCE

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (criteria defined; 1 AMB-dependent case BLOCKED)

IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **SYS-03-H06** · Parent: **SYS-03 Edit** · Constitution: **SYS-03 H00**

---

## 1. Scope

H06 owns the **manual-acceptance matrix + QA criteria** for SYS-03 Edit: explicit Given/When/Then cases for undo/redo, clipboard, selection commands, and find & replace; negative/edge/boundary cases; multi-document cases; accessibility/keyboard acceptance; and the automated-vs-manual distinction.

H06 does NOT own test implementation (→ MOD-TEST) or engine acceptance (→ other SYS).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| SYS-02 H00 §19 | Manual QA philosophy (7 rules) |
| Phase 3 eng 15 | test layers + Given/When/Then + quality gates |
| SYS-01 §33 | atomic testId convention |
| FL-0018/0019 | SPEC≠IMPL≠TESTED≠ACCEPTED; automated≠manual |

---

## 3. Completeness Ladder (FL-0018/0019)

```
SPECIFIED → AUDITED → READY FOR IMPLEMENTATION → IMPLEMENTED → AUTOMATED TESTED → MANUALLY ACCEPTED → COMPLETE
```

---

## 4. Acceptance Matrix (Given/When/Then)

### 4.1 Undo/Redo

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-EDIT-UNDO-001 | doc with a move command | Undo | move reverted; selection restored to pre-command | T-undo, T-undo-selection |
| AC-EDIT-UNDO-002 | undo done | Redo | move re-applied | T-undo-redo |
| AC-EDIT-UNDO-003 | undo done | new command | redo stack cleared | T-undo-invalidate |
| AC-EDIT-UNDO-004 | dragged object (one gesture) | Undo | whole gesture = one undo | T-undo-coalesce |
| AC-EDIT-UNDO-005 | saved doc | Undo | still works (history preserved) | T-undo-after-save |
| AC-EDIT-UNDO-006 | reloaded doc | Undo | disabled (history reset) | T-undo-reload |
| AC-EDIT-UNDO-007 | doc A + doc B | Undo on A | only A's history affected | T-undo-per-doc |
| AC-EDIT-UNDO-008 | history panel open | click earlier step | doc + selection at that step | T-history-jump |

### 4.2 Clipboard

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-EDIT-CLIP-001 | selection | Copy → Paste | new nodes with FRESH IDs | T-clip-id |
| AC-EDIT-CLIP-002 | selection | Cut → Undo | content restored (one undo) | T-cut-undo |
| AC-EDIT-CLIP-003 | selection | Duplicate | offset copy, new selection | T-duplicate |
| AC-EDIT-CLIP-004 | selection + clipboard | Paste in Place | same coords as source | T-paste-place |
| AC-EDIT-CLIP-005 | empty clipboard | Paste | disabled | T-paste-empty |
| AC-EDIT-CLIP-006 | raw-shape sub-object | Cut | split + delete = one undo | T-subobj-cut |
| AC-EDIT-CLIP-007 | Copy (no mutation) | check history | no undo entry | T-copy-no-undo |
| AC-EDIT-CLIP-008 | reload | clipboard | cleared (SESSION) | T-clip-reload |

### 4.3 Selection commands + Find & Replace

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-EDIT-SEL-001 | locked layer + content | Select All | locked content excluded | T-select-locked |
| AC-EDIT-SEL-002 | hidden layer + content | Select All | hidden content excluded | T-select-hidden |
| AC-EDIT-SEL-003 | edit-in-place | Select All | only in-scope content | T-select-scope |
| AC-EDIT-SEL-004 | selection | Deselect All | cleared; no undo entry | T-deselect, T-select-no-undo |
| AC-EDIT-SEL-005 | no matches | Find | "0 matches" (not silent) | T-find-none |

### 4.4 Accessibility / keyboard (manual)

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-EDIT-A11Y-001 | empty stack | focus Undo | aria-disabled | (manual) |
| AC-EDIT-A11Y-002 | selection change | screen reader | "N objects selected" announced | (C-35) |
| AC-EDIT-A11Y-003 | destructive Cut/Delete | screen reader | announced as destructive | (manual) |

---

## 5. Automated vs Manual (FL-0019)

| Layer | Automated | Manual |
|---|---|---|
| undo/redo stack + coalescing + redo invalidation | YES | — |
| clipboard ID remapping + split-on-cut | YES | — |
| select-all locked/hidden exclusion | YES | — |
| keyboard-only pass, focus, aria | partial | **YES** |
| destructive-action announcement | partial | **YES** |

Rule: automated green ≠ product pass (SYS-02 H00 §19).

---

## 6. Blocked Cases (AMB-dependent — NOT silently passed)

| Case | Blocked by |
|---|---|
| Paste Special format-option dialog | AMB-S03-003 (format LIST only) |

*(AMB-S03-001 clipboard scope, AMB-S03-004 Delete, AMB-S03-005 Find & Replace are now RESOLVED and have unblocked acceptance cases below.)*

### 6.1 Newly-resolved acceptance cases (added this pass)

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-EDIT-CLIP-009 | copy in doc A | switch to doc B → Paste | content pastes into B (app-level clipboard) | T-clip-cross-doc |
| AC-EDIT-CLIP-010 | copy in doc A | close doc A → Paste in B | clipboard survives (app-level) | T-clip-close-source |
| AC-EDIT-CLIP-011 | selection | Delete key | removed, one undo, split-on-sub-object | T-delete |
| AC-EDIT-CLIP-012 | doc with color X | Find&Replace colors X→Y (scoped + preview) | all X→Y in scope, one undo (Replace-All journal) | T-replace-all |
| AC-EDIT-SEL-006 | doc with text "foo" | Replace-All "foo"→"bar" | one atomic undo | T-replace-all |

---

## 7. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.
**Checks:** automated≠manual ✓ (FL-0019) · no "test everything" ✓ · test IDs bound ✓ · AMB-dependent cases BLOCKED (not passed) ✓.

---

## 8. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) acceptance asserting unresolved paste-special | status | RESOLVED — BLOCKED (§6) |
| F2 | (risk) automated treated as acceptance | status | RESOLVED — §5 |

No manufactured findings.

---

## 9. Final Report

STATUS: **READY FOR IMPLEMENTATION** (criteria defined; 1 AMB-dependent case-group BLOCKED — Paste Special format list) · Acceptance cases: 26 · Categories: 4 · Blocked groups: 1 · Findings: 2 (resolved).

---

*H06 done. Next: H07 (Final Reconciliation).*
