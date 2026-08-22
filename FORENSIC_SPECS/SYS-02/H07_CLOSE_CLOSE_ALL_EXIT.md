# H07 — CLOSE + CLOSE ALL + EXIT + NO-DOCUMENT STATE

## 1. Document Status

STATUS: **REVISION REQUIRED**

Revision: **H07-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

---

## 2. Scope

H07 owns ONLY: Close, Close All, Exit, no-document state, lifecycle removal, dirty guards during close/exit, selection of next active document, last-document removal, cancelled close, save/discard/cancel flow integration.

H07 does NOT own: dirty calculation → **H04**; Save implementation → **H05**; Open → **H06**; tab context-menu semantics → **H03**; tab model → **H02**; persistence internals → **SYS-28**.

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.1 | Close / Close All ("prompt save"); Exit ("prompt save") |
| H00 §6 T10–T14 | close transitions; last-doc → NO_DOCUMENT |
| H00 §10 | guard = Discard/Save/Cancel (DIRTY only); Discard non-undoable |
| H02 §14 | close events: openSet:changed{removed} → activeDoc:changed{next/null} |
| H02 §6.3 | cardinality; active pointer null ⟺ NO_DOCUMENT |
| H04 | dirty flag + guard contract |
| SYS-01 §18 | open-set = SESSION |
| AI01_FORENSIC_LESSONS.md | FL-0014/0015 (leak), FL-0024 (machine) |

---

## 4. Dependency Map

H07 depends on: H00 §6/§10, H02 (open-set + active pointer + next-selection), H04 (guard), H05 (guard Save), H03 (ctx Close handoff).
H07 provides to: H02 (re-activation result), H04 (dirty removed with doc).
H07 does NOT own: dirty calc (H04), save (H05), tab model (H02), ctx menu (H03).

---

## 5. Terminology

| Term | Definition |
|---|---|
| Close | remove the active document |
| Close All | remove all open documents |
| Exit | quit the app (dirty guard first) |
| No-document state | NO_DOCUMENT lifecycle; active pointer null |
| Next active | the document that becomes active after closing the active one |

---

## 6. Close Flow (canonical)

```
Close(targetDocId):
  1. if target DIRTY → dirty guard (H04): Save / Discard / Cancel
       Cancel ⇒ abort (unchanged); Save ⇒ H05 write → CLEAN → proceed; Discard ⇒ proceed (non-undoable)
  2. remove target from open-set
  3. events:
       if target was ACTIVE and survivors remain:
         openSet:changed{removed,target} → activeDoc:changed{next}
         (next = per §7 selection rule)
       if target was INACTIVE:
         openSet:changed{removed,target} (NO activeDoc)
       if target was ACTIVE and it was the LAST:
         openSet:changed{removed,target} → activeDoc:changed{null} → NO_DOCUMENT
```

**Close All** = iterate the open-set in order; for each doc: if DIRTY → Close guard (Save/Discard/Cancel — a Cancel stops the REMAINING docs; already-processed docs stay closed); if CLEAN → close directly. Per-doc removal emits `openSet:changed{removed, docId}`; after the last removal emit `activeDoc:changed{null}` ONCE. Sequential (P-5), NOT atomic.

**Exit** = if any DIRTY → guard (Discard/Save/Cancel) → quit; else quit.

---

## 7. Next-Active Selection Rule

After closing the active document with survivors, which document becomes active is UNRESOLVED (AMB-H07-001) — the Blueprint gives no "next tab" rule and no approved decision exists.

RECOMMENDATION — NOT AUTHORITATIVE: select the nearest remaining tab in the open-set order (e.g., the tab to the right, else the last). This is for reference only; it MUST NOT be implemented as a binding rule until AMB-H07-001 is resolved by a product decision (see §20).

---

## 8. State Model + Transitions

| # | Current | Trigger | Next | Event(s) |
|---|---|---|---|---|
| T1 | active=A (survivors) | Close A (clean) | active=next; A removed | `openSet:changed{removed,A}` → `activeDoc:changed{next}` |
| T2 | active=A | Close A (dirty) | guard → Save/Discard/Cancel | (guard) |
| T3 | active=A + Close inactive B | Close B | B removed; A stays active | `openSet:changed{removed,B}` only |
| T4 | active=A (last) | Close A | NO_DOCUMENT; active=null | `openSet:changed{removed,A}` → `activeDoc:changed{null}` |
| T5 | (any) | Close All | sequential per-doc guard → each removal; final NO_DOCUMENT | `openSet:changed{removed}` per doc → `activeDoc:changed{null}` once |
| T6 | (any) | Exit | quit (guard if DIRTY) | (app closes) |
| T7 | guard | Cancel | unchanged | none |

---

## 9. Commands / Controls

| Control | commandId | Trigger | Precondition | Action | State | Event | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.close | `file.close()` | Ctrl+W / File menu | doc open | close the ACTIVE document (§6 flow) | removed | §6 events | (doc gone) | no (lifecycle) | SESSION | dirty→guard; cancel→unchanged | T-close |
| file.closeAll | `file.closeAll()` | menu | ≥1 doc | per-doc guard → remove all | NO_DOCUMENT | openSet+activeDoc(null) | — | no | SESSION | dirty→guard | T-close-all |
| file.exit | `file.exit()` | Ctrl+Q / menu | — | guard if DIRTY → quit | app closes | — | — | no | — | dirty→guard | T-exit |

**Command separation (binding — `file.close()` vs `tab.close(docId)` are two intentional commands):**

| commandId | Closes | Trigger | Source |
|---|---|---|---|
| `file.close()` | the ACTIVE document only | File ▸ Close / Ctrl+W | Blueprint §1.2.1 "Close = close active doc (prompt save)" |
| `tab.close(docId)` | the TARGETED document (active OR inactive), identified by stable Document ID | tab × affordance (D-7) / context-menu Close (H03) | D-7 (per-tab × close) + H03 |

Both run the SAME §6 `Close(targetDocId)` flow — the only difference is target selection (`file.close()` = `Close(activeDocumentId)`; `tab.close(docId)` = `Close(docId)`). They MUST NOT be merged into one command, because closing an INACTIVE tab via `tab.close(docId)` must never close the ACTIVE document (QA failure #3 class — accidental destructive). No drift.

**Cross-file revision notes (not H07's defect; recorded for the owning files):**
- SYS-02_file.md §8 lists the document-tab context menu "Close" as `commandId file.close()` — a STALE misattribution; H03 (authoritative) correctly uses `tab.close(docId)`. To be corrected in a future SYS-02_file.md revision.
- SYS-01 §30 maps "File▸Close → tab.close(id)" — a STALE misattribution; File ▸ Close is `file.close()`. SYS-01 is LOCKED; recorded for a future SYS-01 revision.

---

## 10. Event Propagation

| Case | Event(s) — order |
|---|---|
| Close active (survivor) | `openSet:changed{removed, A}` → `activeDoc:changed{next}` |
| Close inactive | `openSet:changed{removed, B}` only |
| Close last | `openSet:changed{removed, A}` → `activeDoc:changed{null}` |
| Close All (N docs) | sequential (P-5): each removal emits `openSet:changed{removed, docId}`; after the LAST removal, `activeDoc:changed{null}` EXACTLY ONCE |
| Cancel guard (any doc) | none (that doc — and all REMAINING docs — stay open; already-closed docs stay closed) |

**Close All rule (binding — P-5 sequential, NOT atomic):** Close All processes documents in open-set order, applying the per-document Close guard to each DIRTY document sequentially. A Cancel on any guard stops the REMAINING documents (they stay open); documents already processed stay closed (partial close is a legal outcome). Clean documents close directly (no guard). Exactly ONE `activeDoc:changed{null}` is emitted, after the last removal (never N fake active events — FL-0007). No fake events.

---

## 11. Undo / Persistence

- Close/Close All/Exit = lifecycle → no document undo; the closed doc's History is removed.
- Discard = non-undoable (permanent).
- open-set/active = SESSION.

---

## 12. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| guard Save fails | stay DIRTY, close blocked, "Save error" | unchanged | retry/cancel |
| guard Cancel | unchanged | unchanged | — |
| cancel mid-Close-All | remaining docs stay open; already-closed docs stay closed (partial close) | partial-unchanged | — |

---

## 13. Accessibility

Guard dialog: focus trap + Esc = Cancel (sourced: phase2.5 C-07 / STM-MODAL). Initial focus = `[NOT SPECIFIED]` (defer to H11 / SYS-01 modal contract); RECOMMENDATION — NOT AUTHORITATIVE: Cancel (non-destructive safe default). Close/Close-All/Exit menu items: role=menuitem, destructive items announced.

---

## 14. Edge-Case Matrix

| # | Case | Expected | Owner | testId |
|---|---|---|---|---|
| 1 | close active A (B/C open) | B or C becomes active (AMB-H07-001) | H07/H02 | T-close-active |
| 2 | close inactive B | A stays active | H07 | T-close-inactive |
| 3 | close last | NO_DOCUMENT | H07 | T-close-last |
| 4 | Close All mixed dirty/clean | guard per dirty; clean close direct | H07/H04 | T-close-all-mixed |
| 5 | Exit mixed dirty | guard then quit | H07 | T-exit-mixed |
| 6 | cancel mid-multi-close | remaining stay open | H07 | T-close-cancel-mid |
| 7 | save fail during Close All | that doc stays, close blocked | H07/H05 | T-close-all-savefail |
| 8 | duplicate lifecycle events | idempotent consumers | H07/H02 | T-close-dup-event |
| 9 | stale tab reference | target by Doc ID (H03/H02) | H02 | T-close-stale |
| 10 | right-click safety | ctx menu, not close (H03) | H03 | T-close-ctx-safety |
| 11 | session/history removal | closed doc's History gone | H07 | T-close-history-removed |
| 12 | no accidental mutation | close never dirties/mutates other docs | H07 | T-close-no-mutate |

---

## 15. Cross-Handoffs

| Producer → H07 | H07 response |
|---|---|
| H03 ctx Close | `tab.close(docId)` |
| H02 tab × | `tab.close(docId)` |
| H04 dirty flag | guard if DIRTY |
| H05 save | guard "Save" → proceed |
| H02 open-set | next-active selection + re-activation |

H07 never implements dirty calc/save/tab model.

---

## 16. Dead-Control Audit

file.close / file.closeAll / file.exit — all real paths. Guard buttons (from H04) real. No dead control.

---

## 17. Ownership Audit

| Concern | Owner |
|---|---|
| close lifecycle + guard invocation | H07 |
| dirty flag | H04 |
| save | H05 |
| next-active + re-activation | H02 |
| ctx menu item | H03 |
| persistence | SYS-28 |

---

## 18. Forensic Pre-Flight

Lessons: FL-0001..0030. Checks: scope ✓ · ownership ✓ · events ✓ (openSet→activeDoc, no fake; Close All = N removed + ONE null) · state ✓ (H00 T10-T14) · dirty/undo ✓ (no leak, Discard non-undoable) · edge ✓ · status honest (AMB-H07-001 registered; §1 = REVISION REQUIRED, matches §23).

---

## 19. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) Close All inventing a single summary dialog | confirmation | RESOLVED — per-doc guard (P-5), no summary dialog invented |
| F2 | (risk) "next tab" selection not in Blueprint | scope | REGISTERED AMB-H07-001 (recommendation only, not authoritative) |
| F3 | (risk) close emitting fake activeDoc for inactive | event | RESOLVED — openSet only |

---

## 20. Ambiguity Register

| AMB-ID | Question | Sources | Critical? | Recommendation (NOT authoritative) |
|---|---|---|---|---|
| AMB-H07-001 | Which document becomes active after closing the active one (with survivors)? | Blueprint silent (no "next tab" rule) | YES (affects close-active) | nearest tab in open-set order (e.g., the tab to the right, else the last) |

**One implementation-critical ambiguity remains** → per the batch rule, H07 is REVISION REQUIRED (see §22). AMB-H07-001 must be resolved by a product decision before H07 is READY.

---

## 21. Test ID Matrix

T-close · T-close-all · T-exit · T-close-active · T-close-inactive · T-close-last · T-close-all-mixed · T-exit-mixed · T-close-cancel-mid · T-close-all-savefail · T-close-dup-event · T-close-stale · T-close-ctx-safety · T-close-history-removed · T-close-no-mutate

---

## 22. Completion Checklist

- [x] H00 lifecycle T10–T14
- [x] per-doc guard (Save/Discard/Cancel), no summary dialog
- [x] event ordering (openSet → activeDoc)
- [x] last-doc → NO_DOCUMENT
- [x] no fake events, no dead controls, no mutation
- [x] 12 edge cases
- [x] lessons pre-flight passed
- [ ] next-active selection rule → **AMB-H07-001 (open)**

---

## 23. Final H07 Report

STATUS: **REVISION REQUIRED** — AMB-H07-001 (next-active selection after closing the active doc) is implementation-critical and not resolved by any approved decision. Controls: 3 · Commands: 3 · Transitions: 7 · Edge cases: 12 · Ambiguities: 1 (critical) · Findings: 3 (F1/F3 resolved, F2 registered).

---

*H07 done (REVISION REQUIRED — AMB-H07-001). Next: H08.*
