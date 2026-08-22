# H13 — QA + MANUAL ACCEPTANCE

## 1. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (acceptance criteria defined; execution = implementation phase)
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **H13-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > H00 > prior H-files > code (evidence only).

---

## 2. Scope

H13 owns the **manual-acceptance matrix and QA criteria for SYS-02 File system**: explicit Given/When/Then acceptance cases for every File workflow, negative/edge/boundary cases, multi-document cases, accessibility/keyboard acceptance, and the automated-vs-manual distinction.

H13 does NOT own: test IMPLEMENTATION (→ MOD-TEST) · non-File system acceptance (→ other SYS) · the acceptance criteria for engines (→ SYS-27/SYS-28 own their acceptance, referenced only).

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| H00 §19 | Manual QA philosophy (7 rules): automated pass ≠ product pass; prerequisite-fail ⇒ dependent BLOCKED; manual desktop interaction authoritative; visual defects = real failures; accidental destructive = P0 |
| Phase 3 eng 15 | test layers (unit/component/integration/state/interaction/responsive/a11y/serialization/async/visual/perf/mobile) + Given/When/Then format + quality gates |
| Phase 3 eng 13 | persistence acceptance (REQ-PERSIST-A/B/C) |
| SYS-01 §33 | atomic testId convention (happy/failure/empty/disabled/keyboard/mouse/touch/undo/redo/reload/persist/cross-panel/event/responsive) |
| H00–H12 | the T-* test IDs to be bound |
| AI01_FORENSIC_LESSONS.md | FL-0018/0019 (SPEC≠IMPL≠TESTED≠ACCEPTED; automated≠manual) |

---

## 4. Completeness Ladder (authoritative — FL-0018/0019)

```
SPECIFIED → AUDITED → READY FOR IMPLEMENTATION → IMPLEMENTED → AUTOMATED TESTED → MANUALLY ACCEPTED → COMPLETE
```

A File feature is COMPLETE only at the last rung. H13 defines the AUTOMATED TESTED and MANUALLY ACCEPTED criteria. No H-file may claim COMPLETE from specification alone.

---

## 5. Acceptance Matrix (Given/When/Then — SYS-02 File)

### 5.1 Lifecycle workflows

| AC-ID | Given | When | Then | Binds testId |
|---|---|---|---|---|
| AC-FILE-NEW-001 | no document open | File ▸ New (valid settings) → Create | a new UNTITLED CLEAN doc is active; open-set +1; `openSet:changed{added}` → `activeDoc:changed` | T-file-new |
| AC-FILE-NEW-002 | New dialog open | width=1 / height empty / fps empty | Create disabled (inline error); no doc created | T-dlg-new-invalid |
| AC-FILE-OPEN-001 | doc A active | Open path B | B added + active; A → INACTIVE (dirty/History/selection/playhead preserved); `openSet:changed{added}` → `activeDoc:changed` | T-open-valid |
| AC-FILE-OPEN-002 | doc A active (DIRTY) | Open path B | **NO guard**; A → INACTIVE (dirty preserved); B loads + activates | T-open-dirty |
| AC-FILE-OPEN-003 | doc A active | Open path A (already-open) | activate A, no reload, no new tab; `activeDoc:changed{A}` only | T-open-already-open |
| AC-FILE-OPEN-004 | no doc | Open missing/corrupt path | stays NO_DOCUMENT; toast | T-open-fail (CASE B) |
| AC-FILE-OPEN-005 | doc A active | Open missing/corrupt path | A stays active, untouched; toast | T-open-fail (CASE A) |

### 5.2 Save workflows

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-SAVE-001 | untitled doc | Save | path prompt → write → TITLED + CLEAN; "Saved hh:mm" | T-save-untitled |
| AC-FILE-SAVE-002 | titled dirty doc | Save | overwrite (no confirm) → CLEAN; `modifiedAt` updated; undo history preserved | T-save-titled, T-save-undo-preserved |
| AC-FILE-SAVE-003 | doc A, path B already open as doc B | A Save As → B | **BLOCKED** (explicit error); A unchanged (dirty/History/session preserved) | T-save-as-open-path-block |
| AC-FILE-SAVE-004 | titled dirty doc | Save (disk full/read-only) | stays DIRTY (SAVE_ERROR); last-good intact; "Save error" | T-save-fail |
| AC-FILE-SAVE-005 | clean doc | Save | idempotent write; "Saved hh:mm" (P-6) | T-save-clean |

### 5.3 Close / Close All / Exit workflows

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-CLOSE-001 | doc A active (clean), B open | Close A | A removed; next active (AMB-H07-001 rule); `openSet:changed{removed,A}` → `activeDoc:changed{next}` | T-close-active |
| AC-FILE-CLOSE-002 | doc A active (dirty) | Close A | guard (Save/Discard/Cancel) | T-dirty-close |
| AC-FILE-CLOSE-003 | guard open | Cancel | A unchanged; no state change | T-guard-cancel |
| AC-FILE-CLOSE-004 | guard open | Save (fails) | stays DIRTY; close blocked; "Save error" | T-guard-save-fail |
| AC-FILE-CLOSE-005 | last doc (clean) | Close | NO_DOCUMENT; `activeDoc:changed{null}` | T-close-last |
| AC-FILE-CLOSE-006 | A(dirty), B(clean), C(dirty) | Close All | sequential guards; Cancel on C stops C (B already closed); partial close legal; ONE `activeDoc:changed{null}` | T-close-all-mixed, T-close-cancel-mid |
| AC-FILE-EXIT-001 | dirty doc | Exit | guard → quit | T-exit |

### 5.4 Multi-document + tab workflows

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-TAB-001 | A,B open | activate B | B active; A→INACTIVE; panels rebind to B (no stale ref) | T-tab-activate, T-tab-stale-ref |
| AC-FILE-TAB-002 | A(dirty), B(clean) | switch A↔B↔A | A dirty preserved; B clean; no transfer | T-tab-dirty-per-doc |
| AC-FILE-TAB-003 | A,B open | close inactive B (tab ×) | B removed; A stays active; `openSet:changed{removed,B}` only (no fake activeDoc) | T-tab-close-inactive |
| AC-FILE-TAB-004 | A,B open | reorder tabs | order changes; active unchanged; `openSet:changed{reordered}` only | T-tab-reorder |
| AC-FILE-TAB-005 | A,B open | right-click B | context menu opens; B NOT closed; B NOT activated | T-ctx-open-inactive |

### 5.5 Handoff workflows (SYS-27)

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-IMP-001 | doc open | Import to Library (asset) | asset added; doc → DIRTY; undoable (one command) | T-import-library |
| AC-FILE-EXP-001 | doc DIRTY | Export image | file written; doc stays DIRTY (non-mutating) | T-export-no-dirty |
| AC-FILE-PUB-001 | doc open | Publish | output written; no dirty; `export:done` | T-publish-ok |

### 5.6 Recovery + persistence (SYS-28)

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-REC-001 | `.autosave` newer than project | launch | recovery prompt; Accept → recovered doc CLEAN + active | T-file-recover |
| AC-FILE-REC-002 | kill mid-edit (DIRTY) | relaunch | recovery offered; recovered = last autosave state | REQ-PERSIST-A |
| AC-FILE-REC-003 | save then reload | reload | evaluate(time) identical (deterministic round-trip) | REQ-PERSIST-B |

### 5.7 Accessibility / keyboard acceptance (manual)

| AC-ID | Given | When | Then | Binds |
|---|---|---|---|---|
| AC-FILE-A11Y-001 | tabs visible | keyboard navigate + Enter | activate; activated tab focused (D-AMB-003) | T-a11y-tab-focus |
| AC-FILE-A11Y-002 | guard dialog open | Esc | Cancel (no mutation) | T-a11y-guard-trap |
| AC-FILE-A11Y-003 | dirty indicator DIRTY | screen reader | "unsaved changes" announced (aria-live) | T-a11y-dirty-live |
| AC-FILE-A11Y-004 | save completes | screen reader | "Saved hh:mm" announced | T-a11y-save-announce |
| AC-FILE-A11Y-005 | destructive menu (Close/Exit/Discard) | screen reader | announced as destructive | T-a11y-destructive-announce |

---

## 6. Negative / Boundary / Rapid-Interaction Matrix

| Category | Cases |
|---|---|
| Boundary | width=2 (min, valid); width=1 (invalid); fps=1/120 (valid); fps=0/121 (clamp) |
| Rapid | A→B→A switch ×N; rapid Open already-open; rapid reorder; double-submit Save (primary disabled while SAVING) |
| Multi-doc stress | 2 docs dirty → Close All with cancel; save A while B open; close B while A dirty |
| Error recovery | save fail → retry → success; open fail → re-select → success; guard save fail → cancel → close retry |
| No-document | Save/Close/Export disabled; New/Open/Exit enabled; empty state correct |

---

## 7. Automated vs Manual (binding — FL-0019)

| Layer | Automated? | Manual? |
|---|---|---|
| unit / component / integration / state-transition / serialization | YES | — |
| interaction (C-37) / responsive (C-36) / a11y (C-35) / visual | partial | **YES — manual desktop pass required** |
| accidental destructive (right-click close) | partial | **YES — P0, manual** |
| native file picker / save dialog / Tauri accelerator | — | **YES — native desktop manual** |

**Rule (H00 §19):** automated green ≠ product pass; prerequisite-fail ⇒ dependent BLOCKED; manual desktop interaction is authoritative for tabs/right-click/pickers; visual defects are real failures.

---

## 8. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.

**Checks passed:**
- [x] automated ≠ manual maintained (ladder + §7) — FL-0018/0019
- [x] no "test everything" — every AC is explicit Given/When/Then — FL-0005
- [x] test IDs bound to real requirements (§5) — FL-0006
- [x] multi-doc + guard + Close All partial cancel covered (§5.3/§5.4) — FL-0024
- [x] no invented acceptance beyond source — FL-0010

---

## 9. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) acceptance claiming Open-guard behavior (removed in H00–H08) | stale behavior | RESOLVED — AC-FILE-OPEN-002 asserts NO guard |
| F2 | (risk) automated tests treated as acceptance | status inflation | RESOLVED — §4 ladder + §7 |
| F3 | (risk) Close All "atomic" assumption in acceptance | state | RESOLVED — AC-FILE-CLOSE-006 asserts sequential + partial cancel |

No manufactured findings.

---

## 10. Ambiguity Register

| AMB | Impact on H13 acceptance | Owner |
|---|---|---|
| AMB-H07-001 | AC-FILE-CLOSE-001 "next active" is blocked until resolved (acceptance case remains BLOCKED) | H07 |
| AMB-H01-002/003 | AC for template flows partially blocked | H01 |

H13 records these as BLOCKED acceptance cases, not resolved ones.

---

## 11. Final Report

STATUS: **READY FOR IMPLEMENTATION** (criteria defined; the AMB-dependent acceptance cases — AMB-H07-001 [close-active], AMB-H01-002/003 [template flows] — are explicitly BLOCKED, not silently passed) · Acceptance cases: 32 · Categories: 7 · Blocked case-groups: 2 (AMB-H07-001; AMB-H01-002/003) · Findings: 3 (resolved).

---

*H13 done. Next: H14.*
