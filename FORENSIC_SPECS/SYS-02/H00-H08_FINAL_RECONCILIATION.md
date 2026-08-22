# FINAL CROSS-FILE ADVERSARIAL RECONCILIATION — H00–H08

> AI-01 final pass. Objective: H00–H08 as ONE coherent specification system — an AI implementation agent must not be able to derive two different behaviors from two different files.
> Reading order followed: AI01_FORENSIC_LESSONS.md → H00 → H01–H04 → H05–H08 → SYS-01/SYS-02 → Blueprint/Phase 2/2.5/3.
> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe (comparison) > code (evidence).

---

## 1. Files Audited

H00, H01, H02, H03, H04, H05, H06, H07, H08 — read completely and cross-checked as one system.

## 2. Sources Consulted

Blueprint `01_application_map.md` §1.1.3 (multi-doc) + §1.2.1 (File menu: "Open Replaces active doc (with save prompt)", "Close = close active doc") · Phase 3 eng 03/04 (STM-DIRTY) · SYS-01 §15/§17/§18/§27.1/§28/§30/§31 · SYS-02_file.md (consolidated, P-1..P-10) · approved D-AMB-001/003/004 · H00–H08.

## 3. External Research

None required — all resolutions derived from Kineora's own authority (Blueprint §1.1.3 vs §1.2.1 internal consistency; D-AMB-001; H02).

---

## 4. Bugs Found & Fixed (all edited in-file, not merely reported)

| ID | Severity | Bug | Root cause | Fix |
|---|---|---|---|---|
| F-1 | P1 | **B1 — OPEN_FAILED invented as a state.** H06 used "OPEN_FAILED" (a state) + CASE A/B, while H00 DIM-A has only NO_DOCUMENT/ACTIVE/OPENING/RECOVERED | H06 elaborated a transient error outcome into a lifecycle state | OPEN_FAILED is now an ERROR OUTCOME, not a state. H06 §7 rewritten: lifecycle transitions (T1–T3, open-from-empty) + open-set operations (T4–T7, open-alongside-active). H06 §3/§22 fixed |
| F-2 | P1 | **B2 — AMB-003 ownership/status contradiction.** H00 §23 "Recent store … H06/H10 … YES before H06" vs H06 "READY, 0 ambiguities" | H00 over-strong gate on H06 | AMB-003 re-owned to **H10** ("before Open Recent ships (H10); NOT an H06 blocker"). H06 §19 notes AMB-003 is H10's |
| F-3 | P1 | **B3 — Close All "atomic" vs "sequential".** H07 §10 said "remove all N atomically" while §6/§12/P-5 said sequential-per-doc with partial close | I introduced "atomic" in a prior pass, contradicting P-5 | H07 §6/§8/§10/§12 aligned to **sequential (P-5)**: per-doc guard, Cancel stops remaining docs (partial close legal), `openSet:changed{removed}` per doc, ONE `activeDoc:changed{null}` at end |
| F-4 | P1 | **NEW — "guard on Open" single-doc relic.** Dirty guard (Save/Discard/Cancel) attached to Open/Open-Recent across H00 (§6.3 T11, §10), H04 (§8, §14, §4), H06 (12 places), H02 (edge 8) | Blueprint §1.2.1 "Replaces active doc (with save prompt)" = single-doc model artifact, carried into multi-doc unexamined | Resolved: multi-doc Open = add+activate, NO data loss (dirty doc → INACTIVE, preserved), therefore **NO guard**. H00 §6.3 "Open in multi-document" binding note added; guard-trigger set now = Close/Close All/Exit only |
| F-5 | P2 | H04 §4 "H06 (open guard)" + H04 §14 edge 17 "open while dirty → guard shown" | stale guard-on-open residuals | fixed to "NO guard" |

---

## 5. NEW LESSON (FL-0032)

**Single-document relic leaked into multi-document spec (guard on Open).** Category: Scope/Data-safety. P1.
- Permanent rule: *A safety guard exists ONLY to prevent data loss. If an operation causes no data loss in the current model, it must NOT carry a guard inherited from a different (single-doc) model. When the model changes (single→multi), re-derive every guard from the current model's data-loss properties.*
- Pre-flight check: *For every guard/confirmation, ask "what data loss does this prevent in the CURRENT model?" If "none", it's a relic — remove it or register why it stays.*

(FL-0031 "ambiguous source term" recorded in the prior pass; both ACTIVE.)

---

## 6. Remaining Ambiguities (NOT invented, NOT silently resolved)

| AMB | Question | Owner | Critical? |
|---|---|---|---|
| AMB-H01-002 | duplicate template name (overwrite/rename/block) | H01 | YES (H01 REVISION REQUIRED) |
| AMB-H01-003 | New-from-Template seeded-doc identity (UNTITLED vs auto-titled) | H01 | YES (H01 REVISION REQUIRED) |
| AMB-H07-001 | which doc becomes active after closing the active one (survivors) | H07 | YES (H07 REVISION REQUIRED) |
| AMB-002 | collision-recovery if a load produces a duplicate Document ID | H10 | YES (deferred to H10) |
| AMB-003 | recent-file list persistence store + API | H10 | YES (deferred to H10; H06 non-blocking) |
| AMB-004 | native desktop menu/accelerator (Tauri) wiring | H10/H11 | YES |
| AMB-H05-001 | title derived from filename on first save | H05 | NO (recommendation only) |
| AMB-H03-001/002 | future ctx-menu items / keyboard ctx-menu open | H03 | NO (refinements) |

---

## 7. Cross-File Command Registry (verified — no duplicates, no drift)

`file.new()` / `file.newFromTemplate(templateId)` / `file.saveAsTemplate(name)` (H01) · `tab.activate(docId)` / `tab.close(docId)` (H02) · `file.save()` / `file.saveAs()` (H05) · `file.open(path)` (+ `file.openRecent` reuses) (H06) · `file.close()` / `file.closeAll()` / `file.exit()` (H07) · `file.import(target)` / `file.export(format)` / `file.publish*()` (H08).

**`file.close()` vs `tab.close(docId)` — intentional, distinct (proven):** `file.close()` = File ▸ Close / Ctrl+W, closes the ACTIVE document (Blueprint §1.2.1 "close active doc"). `tab.close(docId)` = tab × / ctx Close, closes the TARGETED document (D-7 + H03). Both run the same Close flow with different target. MUST NOT merge (inactive-tab close must never close the active doc — QA failure #3 class).

## 8. Cross-File Event Registry (verified — no drift, no refresh hacks)

`activeDoc:changed{docId}` (active pointer) · `openSet:changed{change, docId?}` (D-AMB-004) · `document:changed{type,targets}` (SYS-01 §27.1) · `saving:changed{state,time?}` (canonical, FL-0030) · `library:changed` (SYS-18) · `export:done` (SYS-27). H08 classifies the last two as downstream subsystem events, never promoted to SYS-02 constitutional events.

## 9. Cross-File State Transition Summary (ONE interpretation per operation)

| Operation | Guard | Next state | Open-set | Active pointer | Event(s) | Dirty |
|---|---|---|---|---|---|---|
| New | none | ACTIVE(UNTITLED,CLEAN) | +1 | → new | openSet{added}→activeDoc | CLEAN |
| New-from-Template | none | ACTIVE([AMB-H01-003],CLEAN) | +1 | → new | openSet{added}→activeDoc | CLEAN |
| Open (already-open) | none | (unchanged) | same | → existing | activeDoc | unchanged |
| Open (new, from empty) | none | OPENING→ACTIVE(TITLED,CLEAN) | +1 | → new | openSet{added}→activeDoc | CLEAN |
| Open (new, alongside active) | **none** | ACTIVE stays | +1 | → new (prior→inactive) | openSet{added}→activeDoc | prior preserved |
| Open (load fail, CASE A/B) | — | prior context | unchanged | unchanged | — | unchanged |
| Save / Save As | — | SAVING→CLEAN | same | unchanged | saving:changed | →CLEAN |
| Close active | if DIRTY | next active (AMB-H07-001) | −1 | → next | openSet{removed}→activeDoc | (gone) |
| Close inactive | if DIRTY | active unchanged | −1 | unchanged | openSet{removed} only | (gone) |
| Close last | if DIRTY | NO_DOCUMENT | −1 | → null | openSet{removed}→activeDoc{null} | (gone) |
| Close All | per-doc (sequential) | NO_DOCUMENT | → empty | → null | openSet{removed}×N → activeDoc{null}×1 | (gone) |
| Exit | if any DIRTY | quit | — | — | — | — |
| Import | — | (mutation) | same | unchanged | library+document:changed | →DIRTY |
| Export / Publish | — | (non-mutating) | same | unchanged | export:done | unchanged |

---

## 10. Final Status (honest, per ownership)

| File | Status |
|---|---|
| H00 | **SPECIFICATION: COMPLETE · IMPLEMENTATION: NOT IMPLEMENTED** |
| H01 | **REVISION REQUIRED** (AMB-H01-002/003 — genuine product decisions, correctly registered) |
| H02 | **READY FOR IMPLEMENTATION** |
| H03 | **READY FOR IMPLEMENTATION** |
| H04 | **READY FOR IMPLEMENTATION** |
| H05 | **READY FOR IMPLEMENTATION** |
| H06 | **READY FOR IMPLEMENTATION** |
| H07 | **REVISION REQUIRED** (AMB-H07-001 — no authoritative "next tab" rule exists) |
| H08 | **READY FOR IMPLEMENTATION** |

## 11. Implementation Blockers (for AI-02)

1. **AMB-H01-002 / AMB-H01-003** — block H01 (Save-as-Template duplicate-name; New-from-Template seeded identity). Product decision required.
2. **AMB-H07-001** — blocks H07 (next-active after close). Product decision required; recommendation ("nearest tab in open-set order") is NON-authoritative.
3. **AMB-002 / AMB-003 / AMB-004** — deferred to H10/H11 (collision recovery, recent store, Tauri wiring). Not H05–H08 blockers.

## 12. Files/Sections Modified (this pass)

- **H00**: §2 part-map (H06 dep), §6.3 T4/T11 + forbidden + "Open in multi-document" binding note, §10 destructive table (Open row → no guard), §23 AMB-003 re-owned to H10.
- **H04**: §4 (provides-to), §8 (guard contract — Open removed as trigger), §14 edge 17.
- **H06**: §2/§3/§4/§6/§7/§8/§11/§13/§14/§16/§17/§18/§19/§21/§22 — guard-on-open removed, OPEN_FAILED removed as state, transitions rewritten (7), states counted as 3 lifecycle states.
- **H07**: §6/§8/§10/§12 — Close All made sequential (P-5), not atomic.
- **H02**: §20 edge 8 — Open @dirty no longer guards.
- **AI01_FORENSIC_LESSONS.md**: FL-0032 added (single-doc relic).

---

*Reconciliation complete. STOP — H09 not started; no code written; `animator/` untouched.*
