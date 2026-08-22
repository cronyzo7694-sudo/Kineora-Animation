# H06 — OPEN + OPEN RECENT

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION**

Revision: **H06-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

---

## 2. Scope

H06 owns ONLY: Open command, Open Recent, path selection, load handoff, validation/failure handoff, loading state, already-open path behavior (D-AMB-001), active-document activation after successful open. NO dirty guard on Open (multi-doc: the previously-active document is NOT removed — see §6).

H06 does NOT own: persistence loading internals → **SYS-28**; dirty calculation → **H04**; tab semantics → **H02**; close → **H07**.

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.1 | Open / Open Recent; Ctrl+O; "Replaces active doc (with save prompt)" — resolved as "the opened doc becomes the active doc; previous doc stays open (inactive)" per §1.1.3 multi-doc |
| Phase 3 eng 13 | load: validate → migrate → re-link → integrity (SYS-28) |
| H00 §6 T2–T4 | OPENING → ACTIVE(TITLED,CLEAN) / load-fail (CASE A/B — NOT a state) |
| H00 §5 | open loads the file's Document ID; new session |
| H02 D-AMB-001 | already-open path → activate existing, no reload |
| H02 §14 | event ordering: openSet:changed{added} → activeDoc:changed |
| H04 | dirty state is preserved (no guard on Open — multi-doc, no data loss) |
| SYS-01 §18 | open-set = SESSION |
| AI01_FORENSIC_LESSONS.md | FL-0011 (dup ID), FL-0017 (code authority) |

---

## 4. Dependency Map

H06 depends on: H00 §5/§6 (lifecycle + "Open in multi-document" note), H02 (activation + already-open rule), SYS-28 (load), SYS-01 §18. H06 does NOT depend on the H04 guard (Open is not a guard trigger).
H06 provides to: H02 (tab insert+activate), H04 (→CLEAN), H07 (later close).
H06 does NOT own: SYS-28 load internals.

---

## 5. Terminology

| Term | Definition |
|---|---|
| Open | load a project file into a new open document |
| Open Recent | load from the recent-paths list |
| Already-open path | a path already represented by an open document (D-AMB-001) |
| Loading state | OPENING (transient) |

---

## 6. Open Flow (canonical)

```
Open(path)
  1. if path == an already-open doc's path:
       → activate existing (D-AMB-001); activeDoc:changed{docId}; NO reload, NO new tab
  2. pick path (native picker); if opening from NO_DOCUMENT → OPENING (spinner);
     if opening alongside an active document → the active doc STAYS active; the new doc loads in the open-set
  3. SYS-28 load: validate → migrate → re-link → integrity
       fail ⇒ (CASE A) prior active doc stays active, untouched · (CASE B) stays NO_DOCUMENT; toast (invalid/missing/corrupt/version)
  4. success ⇒ new open doc ACTIVE(TITLED, CLEAN); session reset (History::new, selection empty, playhead 1); prior active doc → INACTIVE (dirty/History/selection/playhead preserved)
  5. events: openSet:changed{added} → activeDoc:changed{new}
  6. H02 inserts tab + activates
```

**Open Recent** = same flow with `path` from the recent list (stale path → toast, skip).

**"Replaces active doc" — semantic resolution (binding):** Blueprint §1.2.1 says Open "Replaces active doc (with save prompt)". This does NOT mean the previously-active document is removed/closed. Blueprint §1.1.3 (authoritative multi-doc) requires documents to accumulate in tabs ("multiple `.fla` documents can be open in tabs simultaneously… panels reflect the active document"). Therefore "replaces active doc" = **the opened document becomes the new ACTIVE document** (the active POINTER/status is replaced); the previously-active document remains open and becomes INACTIVE. This is exactly H02 ST2 (A→inactive, B added + active).

**"with save prompt" — single-document relic (binding):** in a single-document model, Open replaced the active doc and "save prompt" guarded the loss of its unsaved edits. In Kineora's multi-document model there is NO replacement and NO data loss (the dirty doc simply becomes INACTIVE, dirty preserved) — therefore **Open performs NO dirty guard**. (H00 §6.3 "Open in multi-document" note; D-AMB-001 already establishes Open = activate-and-preserve.) No document is removed by Open.

---

## 7. State Model + Transitions

**Lifecycle states (H00 DIM-A, authoritative):** NO_DOCUMENT / ACTIVE / OPENING / RECOVERED. **OPEN_FAILED is NOT a lifecycle state** — load failure is an error OUTCOME that returns to the prior lifecycle context. Opening alongside an active document is an OPEN-SET operation (does NOT change the lifecycle dimension).

**Lifecycle transitions (open-from-empty — H00 §6.3 T2–T4):**

| # | Current | Trigger | Next | Event | UI |
|---|---|---|---|---|---|
| T1 | NO_DOCUMENT | Open new path | OPENING | — | spinner |
| T2 | OPENING | load ok | ACTIVE(TITLED,CLEAN); doc added + active | `openSet:changed{added}` → `activeDoc:changed{new}` | new tab active |
| T3 | OPENING | load fail | NO_DOCUMENT (**CASE B**) | — | toast |

**Open-set operations (open-alongside-active or already-open — lifecycle dimension unchanged):**

| # | Current | Trigger | Next | Event | UI |
|---|---|---|---|---|---|
| T4 | (any) | Open already-open path | active = existing; no open-set change; no reload | `activeDoc:changed{existing}` | existing tab activated |
| T5 | ACTIVE(any) | Open new path (alongside) | active doc STAYS active; new doc loads in open-set | — | spinner on new tab |
| T6 | new doc loading | load ok | new doc added + active; prior doc → INACTIVE (dirty/History/selection/playhead preserved) | `openSet:changed{added}` → `activeDoc:changed{new}` | new tab active |
| T7 | new doc loading | load fail | prior active doc stays active, untouched (**CASE A**) | — | toast |

No guard transition exists (Open is not a guard trigger).

---

## 8. Commands / Controls

| Control | commandId | Trigger | Precondition | Action | State | Event | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.open | `file.open(path)` | Ctrl+O / menu | — | §6 flow (already-open check → load) | OPENING→ACTIVE | openSet+activeDoc | →CLEAN (loaded) | no (history reset) | SESSION (open-set) | invalid/missing/corrupt/version → toast | T-open |
| file.openRecent | `file.open(path)` (reuse) | recent item click | entry exists | same flow | same | same | →CLEAN | no | SESSION | stale path → toast | T-open-recent |

(Single commandId `file.open` reused by Open and Open Recent — no drift.)

---

## 9. Event Propagation

| Case | Event(s) — order | Payload |
|---|---|---|
| Open new | `openSet:changed{added}` → `activeDoc:changed` | `{added,docId}` → `{docId}` |
| Open already-open | `activeDoc:changed` only | `{existingDocId}` |
| Load fail | none (unchanged) | — |
| Guard cancel | none | — |

No fake `activeDoc:changed` (FL-0007); already-open emits only the activation event.

---

## 10. Undo / Persistence

- Open = lifecycle → no document undo; **history reset** (Session::load = History::new).
- Loaded doc = CLEAN (no dirty from open).
- open-set + active pointer = SESSION.
- Content = DOCUMENT (via SYS-28 load handoff).

---

## 11. Error / Failure

**Two lifecycle contexts (must NOT be conflated):**
- **CASE A — an active document exists:** a failed Open leaves the current active document, its session, and the open-set EXACTLY unchanged (the failed load is discarded; nothing is replaced or removed; the active doc's dirty/History/selection/playhead are preserved).
- **CASE B — NO_DOCUMENT:** a failed Open leaves the lifecycle in NO_DOCUMENT (nothing loaded; active pointer stays null).

| Failure | Feedback | State | Recover |
|---|---|---|---|
| missing file | toast | unchanged (CASE A / CASE B) | re-select |
| corrupt file | toast + refuse + offer `.autosave` (SYS-28) | unchanged (CASE A / CASE B) | `.autosave` |
| unsupported version | toast (migrate / refuse) | unchanged (CASE A / CASE B) | SYS-28 migrate |
| cancel picker | (silent) | unchanged (CASE A / CASE B) | reopen |
| stale recent item | toast + skip | unchanged (CASE A / CASE B) | — |

---

## 12. Accessibility

Native picker = OS a11y. Open/Open-Recent menu items: role=menuitem, shortcut announced. Loading state announced ("opening…").

---

## 13. Edge-Case Matrix

| # | Case | Expected | Owner | testId |
|---|---|---|---|---|
| 1 | valid open | new doc active, tab added | H06/H02 | T-open-valid |
| 2 | missing file | toast, unchanged | H06 | T-open-missing |
| 3 | corrupt file | toast + refuse + offer .autosave | H06/SYS-28 | T-open-corrupt |
| 4 | unsupported version | migrate / refuse | H06/SYS-28 | T-open-version |
| 5 | active DIRTY | NO guard (multi-doc); active doc becomes INACTIVE (dirty preserved); new doc loads+activates | H06/H02 | T-open-dirty |
| 6 | cancel picker | unchanged | H06 | T-open-cancel |
| 7 | already-open path | activate existing, no reload | H06/H02 | T-open-already-open |
| 8 | duplicate ID | FORBIDDEN by invariant (INV-IDENT-4 / D-AMB-001); collision-RECOVERY behavior (if a load would produce a duplicate) = AMB-002, deferred to H10 | H02/H10 | T-open-dup-id |
| 9 | failed load | toast, unchanged | H06 | T-open-fail |
| 10 | stale recent item | toast + skip | H06 | T-open-recent-stale |
| 11 | recent file removed | toast + skip | H06 | T-open-recent-removed |
| 12 | event ordering | openSet → activeDoc (deterministic) | H06/H02 | T-open-event |
| 13 | tab insertion | new tab added + activated | H02 | T-open-tab |
| 14 | session reset | History::new, selection empty, playhead 1 | H06 | T-open-session-reset |

---

## 14. Cross-Handoffs

| Producer → H06 | H06 response |
|---|---|
| H04 dirty state | preserved (doc → INACTIVE, no guard) |
| H02 D-AMB-001 | already-open → activate existing |
| SYS-28 load | success/fail → events |
| H02 tab | insert + activate after success |

H06 never implements load internals (SYS-28) or tab model (H02).

---

## 15. Dead-Control Audit

file.open / file.openRecent → real paths (§6). No dead control. No invented "Open from Libraries" (that's H02's `file.openExternalLibrary` → SYS-18 handoff, already specified in H02/H01 context).

---

## 16. Ownership Audit

| Concern | Owner |
|---|---|
| open command/wiring | H06 |
| load internals | SYS-28 |
| already-open rule | H02 (D-AMB-001) / H06 applies |
| dirty state (preserved, no guard) | H04 |
| tab insertion | H02 |

---

## 17. Forensic Pre-Flight

Lessons: FL-0001..0032. Checks: scope ✓ · ownership ✓ (no SYS-28 absorb) · events ✓ (openSet→activeDoc ordering; already-open = activeDoc only) · identity ✓ (dup-open blocked FL-0011; AMB-002 recovery deferred, not falsely closed) · dirty ✓ (NO guard on Open — multi-doc no data loss; no leak) · undo ✓ (history reset) · persistence ✓ · edge ✓ · code-authority ✓ (single-Session = gap, not spec).

---

## 18. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) already-open path creating a dup instance | identity | RESOLVED — D-AMB-001 (activate existing) |
| F2 | (prior) "open overwriting DIRTY active" assumed a guard | data-loss assumption | RESOLVED — multi-doc: Open does NOT overwrite/remove the active doc (it becomes INACTIVE, dirty preserved); NO guard needed (H00 §6.3) |
| F3 | (risk) fake event for already-open | event | RESOLVED — activeDoc only |

---

## 19. Ambiguity Register

No H06-owned implementation-critical ambiguity (already-open = D-AMB-001, no-guard = H00 §6.3, load, session-reset all authoritative). AMB-002 (collision-recovery behavior if a load would produce a duplicate Document ID) remains deferred to its owning boundary (H10) — NOT falsely closed here. AMB-003 (recent-list store) is owned by H10, NOT H06.

---

## 20. Test ID Matrix

T-open-valid · T-open-missing · T-open-corrupt · T-open-version · T-open-dirty · T-open-cancel · T-open-already-open · T-open-dup-id · T-open-fail · T-open-recent-stale · T-open-recent-removed · T-open-event · T-open-tab · T-open-session-reset

---

## 21. Completion Checklist

- [x] H00 lifecycle T2–T4 (OPENING → ACTIVE/FAIL)
- [x] D-AMB-001 already-open rule
- [x] NO dirty guard on Open (multi-doc: active doc → INACTIVE, dirty preserved)
- [x] session reset (History::new, selection empty, playhead 1)
- [x] event ordering (openSet → activeDoc)
- [x] SYS-28 load handoff, no internals
- [x] no dead controls
- [x] 14 edge cases
- [x] lessons pre-flight passed

---

## 22. Final H06 Report

STATUS: **READY FOR IMPLEMENTATION** · Controls: 2 (file.open, file.openRecent reuse) · Commands: 1 (`file.open`) · Lifecycle states: 3 (NO_DOCUMENT, OPENING, ACTIVE/TITLED/CLEAN — OPEN_FAILED is NOT a state) · Transitions: 7 · Edge cases: 14 · Ambiguities: 0 H06-owned (AMB-002/AMB-003 deferred to H10) · Findings: 3 (resolved).

---

*H06 done. Next: H07.*
