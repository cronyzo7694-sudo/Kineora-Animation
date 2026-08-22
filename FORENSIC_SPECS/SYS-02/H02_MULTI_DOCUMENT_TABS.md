# H02 — MULTI-DOCUMENT + TABS + ACTIVE DOCUMENT (FINAL)

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION**

Revision: **H02-RELEASE**

Parent: **SYS-02 File System** · Constitution: **H00**

> Authority order: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code (evidence only).
> All prior ambiguities (AMB-H02-001/003/004) are RESOLVED by approved human decisions (§3). AMB-H02-002 (Ctrl+Tab) remains PROPOSED/EXCLUDED — not required.

---

## 2. Scope

H02 owns ONLY:
- multi-document model, open-document set, document↔tab association,
- active-document selection, active/inactive semantics, activation behavior,
- per-document session preservation, document-bound UI rebind,
- tab creation/removal consequences, active-tab semantics,
- tab ordering semantics (open-set order).

H02 does NOT own:
- right-click tab context menu → **H03**,
- dirty calculation/guard → **H04**,
- Save/Save As → **H05**,
- Open/Open Recent loading → **H06** (except the duplicate-open rule, §14 — which is H02's activation consequence of H06's target),
- Close/Close All/Exit guards → **H07**,
- final menu/shortcut registry → **H09**,
- persistence internals → **SYS-28**,
- tab visual chrome/tokens/strip rendering → **SYS-01**,
- unrelated editor systems.

---

## 3. Authority / Evidence Map + APPROVED DECISIONS

### 3.1 Evidence

| Source | Section | Establishes |
|---|---|---|
| Blueprint Part 01 §1.1.3 | Multi-document | multiple docs in tabs; per-doc Library/timeline; panels reflect **active** doc |
| Blueprint Part 01 §1.2.1 | Close/Close All | "Close active/all docs (prompt save)" |
| Phase 2 F-01-03 | Multi-document | tabs, active binding |
| Phase 2.5 C-02 | Shell | document tabs, active-doc binding, dirty ● |
| Phase 3 eng 03 | ENT-project | per-document entity |
| Phase 3 eng 04 | STM-DIRTY | per-document dirty |
| SYS-01 §27.1 | Event contract | `activeDoc:changed{docId}` locked; new events require product decision |
| SYS-01 §6.3 | Tab chrome | `app.tab.*` (chrome entry points) |
| SYS-01 §18 | Persistence | active doc / open-set = SESSION |
| H00 §6/§8/§9/§13 | — | orthogonal dimensions; INV-MD-*; rebind; undo |
| H01 | New | `file.new()` → auto-activate |
| AI01_FORENSIC_LESSONS.md | FL-0001..0024 | pre-flight prevention |
| Current code | `session.rs` | single Session only — multi-doc NOT implemented (gap) |

### 3.2 APPROVED DECISIONS (authoritative)

**D-AMB-001 — Duplicate-open policy (resolves AMB-H02-001):**
A saved project path may NOT be opened as a second instance while already open. Open/Open-Recent targeting an already-open path: (1) no second instance, (2) no second tab, (3) activate the existing doc, (4) emit normal `activeDoc:changed`, (5) preserve session/dirty/selection/playhead/History exactly, (6) **no disk reload**, (7) no duplicate Document ID in the open-set. Path is used only for duplicate-open detection.

**D-AMB-003 — Focus after activation (resolves AMB-H02-003):**
After mouse or keyboard activation, the activated tab receives focus; correct `aria-selected`; no jump to an unrelated panel; deterministic + testable.

**D-AMB-004 — `openSet:changed` event (resolves AMB-H02-004):**
Locked event: `openSet:changed{ change: 'added'|'removed'|'reordered', docId? }`. Semantics + ordering in §14.

---

## 4. Dependency Map

```
H02 depends on: H00 (INV-MD-*, §9), H01 (New handoff), SYS-01 (strip chrome + activeDoc:changed + tokens).
H02 provides to: H03 (menu targets), H04 (dirty binding), H07 (re-activation), H09 (registry), H12 (matrix).
Forward handoffs (H02 reacts, does not own): H04 dirty guard · H05 save · H06 open load · H07 close guard.
```

---

## 5. Terminology

| Term | Definition | Source |
|---|---|---|
| Active document | the ONE loaded doc whose content panels reflect | Part 01 §1.1.3 |
| Inactive document | loaded-but-not-current; NOT a lifecycle state | H00 §6 |
| Open-set | the ordered set of open documents + sessions | SYS-01 §18 (SESSION) |
| Active pointer | `activeDocumentId` (SESSION) | §6 |
| Document tab | strip entry = exactly one doc | Part 01 §1.1.3 |
| Tab switch | changing the active pointer; VIEW/SESSION | H00 §12 |
| Duplicate-open | selecting Open on an already-open path | D-AMB-001 |

---

## 6. Multi-Document Model

### 6.1 Open-set structure (single source of truth)

```
openSet: OrderedMap<DocumentId, Session>   // authoritative open documents (ordered)
activeDocumentId: DocumentId | null        // active pointer
```

`[INFERENCE — STRUCTURAL IMPLEMENTATION ARTICULATION: not a literal Blueprint schema; the BEHAVIORAL invariants (INV-MD-*) are authoritative.]`

Each `Session` carries that document's independent selection, playhead, History, active scene/layer, dirty flag. `activeDocumentId = null` ⟺ NO_DOCUMENT.

### 6.2 Cardinality

| # docs | activeDocumentId | UI |
|---|---|---|
| 0 | null | no tabs |
| 1 | that doc | one tab active |
| N≥2 | exactly one | N tabs, one active |

### 6.3 Identity rules

- Document ID = identity; title display-only; path = location (dup-open detection only).
- Duplicate titles ALLOWED (REQ-SYS-004).
- Duplicate Document IDs in open-set NOT allowed (D-AMB-001).
- Same-path duplicate-open BLOCKED (D-AMB-001).

---

## 7. Active Document Constitution

| Question | Answer |
|---|---|
| "Active" means | the doc panels reflect; edits target it |
| Selection | tab activation or lifecycle auto-activate (New/Open) |
| Event on activation | `activeDoc:changed{docId}` |
| Rebind | §11 document-bound UI |
| Unchanged | global UI; all inactive docs |
| Previously active doc | → inactive; session preserved |
| Its selection/playhead/undo/dirty/title | preserved in ITS session; never transferred |

**Activation = VIEW/SESSION action** — mutates `activeDocumentId` only. No document mutation, no undo entry, no dirty (H00 §13/§7).

---

## 8. Open-Set Ownership

| Concern | Owner |
|---|---|
| openSet + activeDocumentId + lookup + session association + order + mutation authority | **SYS-02 / MOD-DOC** (single source of truth) |
| Tab strip render + input (click/drag/×) | **SYS-01** (chrome entry points) |

SYS-01's `app.tab.*` controls invoke SYS-02 semantics. SYS-01 maintains NO independent open-document model. One source of truth, one mutation owner, one activation path.

---

## 9. Tab Model

| Attribute | Value |
|---|---|
| tab ID | = Document ID (1:1) |
| title | `meta.title` or "Untitled" |
| dirty indicator | ● when that doc DIRTY |
| tooltip | full title |
| active/inactive | `aria-selected` + SYS-01 tokens |
| disabled state | none |

Duplicate titles allowed; empty title → "Untitled".

---

## 10. Tab Interaction Contract (approved only)

| Interaction | Behavior | Owner |
|---|---|---|
| Left-click | activate document | H02 semantics / SYS-01 input |
| Enter/Space | activate focused tab | H02/SYS-01 |
| Right-click | context menu (non-destructive) | **H03** |
| Drag reorder | reorder open-set order; active unchanged | SYS-01 input + SYS-02 order |
| Close × | invoke H07 close → H02 updates open-set/active | H07 guard / H02 re-activate |
| Double-click | NOT SPECIFIED — no behavior invented | — |
| Ctrl+Tab / Ctrl+Shift+Tab | NOT PART OF H02 (PROPOSED, unapproved) | H09 if ever |

---

## 11. Document-Bound UI Rebind Matrix

On `activeDoc:changed{docId}` — re-read from NEW active doc:

| UI | Owner | Old doc | New doc |
|---|---|---|---|
| Stage | SYS-14 | preserved | re-read + re-render |
| Timeline | SYS-15 | preserved | re-read |
| Layers | SYS-16 | preserved | re-read |
| Properties | SYS-17 | preserved | re-bind |
| Library | SYS-18 | preserved | re-read |
| title | SYS-02 | unchanged | show + ● |
| dirty indicator | SYS-02/H04 | unchanged | show |
| selection | SYS-03/14 | preserved | restore |
| playhead | SYS-15 | preserved | restore |
| undo/redo | SYS-03 | preserved | reflect depth |
| status info | SYS-01/06 | — | re-read |
| symbol/library | SYS-18/19 | preserved | re-read |

**On `openSet:changed` WITHOUT active change:** only open-set consumers (tab strip) update; document-bound content panels do NOT rebind. This distinction is binding.

**Rules:** (1) re-read from NEW doc, never stale ref; (2) global UI unaffected; (3) selection/playhead/undo from new doc's session; (4) no stale reference.

---

## 12. Commands / Controls

| Control ID | Label | Location | commandId / behavior | Trigger | Precondition | Enabled | Disabled reason | Action | State transition | Event | UI | Undo | Persist | Error | A11y | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| app.tab.activate | (tab) | strip | `tab.activate(docId)` → `activateDocument(docId)` (VIEW) | click / Enter / Space | doc open | always | — | set activeDocumentId | active changes; old→inactive | `activeDoc:changed{docId}` | §11 rebind | none | SESSION | none | role=tab, aria-selected | T-tab-activate |
| app.tab.close | (×) | tab | `tab.close(docId)` → H07 guard → H02 re-activation | click | doc open | always | — | remove doc (H07) | next active / NO_DOC | §14 (close rows) | §11 | none | SESSION | dirty→guard (H07) | label "Close <title>" | T-tab-close |
| app.tab.reorder | (drag) | strip | (none — chrome view) | drag | ≥2 tabs | always | — | reorder open-set order | active unchanged | `openSet:changed{reordered}` | strip re-render only | none | SESSION (order) | none | drag aria | T-tab-reorder |

No additional functional controls. Ctrl+Tab is NOT in the approved matrix (PROPOSED only).

---

## 13. State Model + Transitions

No flat INACTIVE state (H00 §6).

| # | Current | Trigger | Next | Event(s) — in order |
|---|---|---|---|---|
| ST1 | NO_DOC + New | H01 create | active=A (UNTITLED,CLEAN); A added | `openSet:changed{added,A}` → `activeDoc:changed{A}` |
| ST2 | active=A + Open new | H06 load | active=B; B added; A→inactive | `openSet:changed{added,B}` → `activeDoc:changed{B}` |
| ST2b | active=A + Open already-open A | duplicate-open | active stays A; **no new doc, no reload** | `activeDoc:changed{A}` only |
| ST3 | active=A + click B | activate | active=B; A→inactive | `activeDoc:changed{B}` |
| ST4 | active=A + close A (survivor) | H07 | remove A; next active (selection rule = AMB-H07-001, owned by H07 — NOT decided here) | `openSet:changed{removed,A}` → `activeDoc:changed{next}` |
| ST5 | active=A + close inactive B | H07 | B removed; active=A unchanged | `openSet:changed{removed,B}` (NO activeDoc) |
| ST6 | active=A + close last | H07 | open-set empty; active=null; NO_DOCUMENT | `openSet:changed{removed,A}` → `activeDoc:changed{null}` |
| ST7 | reorder | SYS-01 drag | order changes; active unchanged | `openSet:changed{reordered}` (NO activeDoc) |
| ST8 | rapid A→B→A | activate ×2 | active=A | `activeDoc:changed` ×2 |

---

## 14. Event / State Propagation Matrix (canonical, locked)

**Event semantics (binding):**
- `activeDoc:changed` = ONLY "the active pointer changed."
- `openSet:changed{change, docId?}` = "the ordered open-set changed" (change ∈ added | removed | reordered).
- **Never** use `activeDoc:changed` as a tab-strip/open-set/reorder refresh hack.
- When both change, emit BOTH, in order: **openSet:changed first, then activeDoc:changed** (open-set authoritative before dependent UI consumes the active notification).

| Action | Owner | State change | Event(s) — order | Payload | Consumers | UI | Dirty | Undo | Persist |
|---|---|---|---|---|---|---|---|---|---|
| New | H01/H02 | open-set + active | `openSet:changed{added}` → `activeDoc:changed` | `{added, docId}` → `{docId}` | strip + §11 | new active doc | no | no | SESSION |
| Open new | H06/H02 | open-set + active | `openSet:changed{added}` → `activeDoc:changed` | same | strip + §11 | new active | no | no | SESSION |
| Open already-open | H06/H02 | (active only, no set change) | `activeDoc:changed` | `{docId}` | §11 | existing active, no reload | no | no | SESSION |
| Activate | H02 | active only | `activeDoc:changed` | `{docId}` | §11 | rebind | no | no | SESSION |
| Close active (survivor) | H07/H02 | open-set + active | `openSet:changed{removed}` → `activeDoc:changed` | `{removed,A}` → `{next}` | strip + §11 | next active | no | no | SESSION |
| Close inactive | H07/H02 | open-set only | `openSet:changed{removed}` | `{removed,B}` | strip only | tab removed; content panels unchanged | no | no | SESSION |
| Close last | H07/H02 | open-set + active→null | `openSet:changed{removed}` → `activeDoc:changed{null}` | `{removed,A}` → `{null}` | strip + §11 | NO_DOCUMENT | no | no | SESSION |
| Reorder | SYS-01/H02 | order only | `openSet:changed{reordered}` | `{reordered}` | strip only | strip reorder | no | no | SESSION |

---

## 15. Dirty / Undo / Session Integration

- Activation/reorder: NO dirty, NO document undo (VIEW/SESSION).
- Dirty: per-document; never transferred (INV-MD-7).
- History: per-document; never mixed (INV-MD-5).
- Selection/playhead: per-document; never transferred (INV-MD-3/6).
- Close removes that doc's History (lifecycle); H02 only re-activates.

**Session isolation (tests):** A(sel_A,play_A,hist_A,dirty_A) ↔ B(sel_B,play_B,hist_B,dirty_B). A→B→A restores A exactly; B intact. T-tab-switch-aba, T-tab-selection/playhead/undo/dirty-per-doc.

---

## 16. Identity Rules

| Concern | Rule | Source |
|---|---|---|
| ID vs title vs path vs tab ID | ID = identity; title display; path = location (dup-open detection); tab ID = doc ID | REQ-SYS-004, H00 §5 |
| Same title | allowed | REQ-SYS-004 |
| Same path twice | blocked → activate existing, no reload (D-AMB-001) | §3.2 |
| Duplicate doc ID | not permitted (D-AMB-001) | §3.2 |
| Tab↔doc | 1:1 | Part 01 §1.1.3 |

---

## 17. Persistence Boundary

| Item | Boundary | Persists on reload? |
|---|---|---|
| activeDocumentId | SESSION | no |
| open-set | SESSION | no |
| tab order | SESSION | no |
| per-doc selection/playhead/History | SESSION | no |
| per-doc dirty | TEMPORARY (STM-DIRTY) | no |
| document content | DOCUMENT (SYS-28) | via Save only |

H02 owns nothing persistent.

---

## 18. Error / Failure Behavior

| Failure | Feedback | State | Undo | Recover |
|---|---|---|---|---|
| Switch to corrupt/missing session | toast + stay | unchanged | none | re-open (H06) |
| `activeDoc:changed` duplicate | idempotent consumers | consistent | none | — |
| `openSet:changed` duplicate | idempotent consumers | consistent | none | — |
| `activeDoc:changed`/`openSet:changed` missing | integration bug (asserted) | — | — | H12 |
| Close cancelled (guard) | guard (H07) | unchanged | none | retry |
| Rapid switching | each rebind clean | consistent | none | — |

---

## 19. Accessibility (approved)

- `role="tab"` / `role="tablist"` / `aria-selected`.
- Enter/Space activate; Tab/Shift+Tab move focus.
- **Activated tab receives focus after activation** (D-AMB-003).
- Dirty state announced accessibly (aria-live on ●).
- Tab naming = title + dirty ("Untitled — unsaved").
- Active/inactive contrast via SYS-01 tokens (no hard-coded colors in H02).

---

## 20. Edge-Case Matrix

| # | Case | Expected | Owner | Event(s) | UI | Error | testId |
|---|---|---|---|---|---|---|---|
| 1 | 0 docs | NO_DOCUMENT | H02 | — | empty | — | T-tab-no-doc |
| 2 | 1 doc | 1 tab active | H02 | — | — | — | T-tab-one |
| 3 | 2 docs | 2 tabs, one active | H02 | — | — | — | T-tab-two |
| 4 | N docs | N tabs, one active | H02 | — | — | — | T-tab-many |
| 5 | New @0 | 1 tab active | H01/H02 | openSet+activeDoc | new active | — | T-tab-new-empty |
| 6 | New @N | N+1, new active | H02 | openSet+activeDoc | — | — | T-tab-new-many |
| 7 | Open @clean | new active | H06/H02 | openSet+activeDoc | — | — | T-tab-open-clean |
| 8 | Open @dirty | NO guard (multi-doc): A→inactive (dirty preserved), new doc active | H06/H02 | openSet+activeDoc | — | — | T-tab-open-dirty |
| 9 | Open already-open path | activate existing, no reload | H06/H02 | activeDoc only | no new tab | — | T-tab-open-already-open |
| 10 | Activate B | B active | H02 | activeDoc | rebind | — | T-tab-activate |
| 11 | Activate already-active A | idempotent no-op | H02 | activeDoc only (or none) | — | — | T-tab-activate-self |
| 12 | A→B→A | A restored | H02 | activeDoc ×2 | — | — | T-tab-switch-aba |
| 13 | Close active (survivor) | next active (AMB-H07-001) | H07/H02 | openSet→activeDoc | next active | — | T-tab-close-active |
| 14 | Close inactive | active unchanged | H07/H02 | openSet only | tab removed | — | T-tab-close-inactive |
| 15 | Close last | NO_DOCUMENT | H07/H02 | openSet→activeDoc(null) | empty | — | T-tab-close-last |
| 16 | Duplicate title | both tabs, distinct | H02 | — | — | — | T-tab-dup-title |
| 17 | Duplicate doc ID | not permitted (D-AMB-001) | H02/H10 | — | — | — | T-tab-dup-id |
| 18 | Same path twice | activate existing (D-AMB-001) | H06/H02 | activeDoc | — | — | T-tab-open-already-open |
| 19 | Reorder | active unchanged | SYS-01/H02 | openSet{reordered} | strip only | — | T-tab-reorder |
| 20 | Rapid switch | clean final | H02 | activeDoc ×N | — | — | T-tab-rapid |
| 21 | Stale UI ref | no old-doc render | H02 | — | §11 rule 4 | — | T-tab-stale-ref |
| 22 | Missing activeDoc event | assert (integration bug) | H02/H12 | — | — | — | T-tab-event |
| 23 | Duplicate activeDoc event | idempotent | H02 | — | — | — | T-tab-event-dup |
| 24 | Missing openSet event | assert | H02/H12 | — | — | — | T-tab-openset-event |
| 25 | Duplicate openSet event | idempotent | H02 | — | — | — | T-tab-openset-dup |
| 26 | Corrupt session | toast + stay | H02 | — | — | toast | T-tab-switch-fail |
| 27 | Dirty isolation | per-doc ● | H02/H04 | — | — | — | T-tab-dirty-per-doc |
| 28 | Undo isolation | per-doc History | H02 | — | — | — | T-tab-undo-per-doc |
| 29 | Selection isolation | per-doc | H02 | — | — | — | T-tab-selection-per-doc |
| 30 | Playhead isolation | per-doc | H02 | — | — | — | T-tab-playhead-per-doc |
| 31 | Library isolation | re-read on switch | H02/SYS-18 | activeDoc | rebind | — | T-tab-library-rebind |
| 32 | Timeline isolation | re-read | H02/SYS-15 | activeDoc | rebind | — | T-tab-timeline-rebind |
| 33 | Properties rebind | re-bind | H02/SYS-17 | activeDoc | rebind | — | T-tab-properties-rebind |
| 34 | Focus after switch | activated tab focused (D-AMB-003) | H02/SYS-01 | — | focus on tab | — | T-tab-focus |

---

## 21. Cross-System Handoffs

| Producer → H02 | Event/command | H02 response | H02 does NOT |
|---|---|---|---|
| H01 New | `activeDoc:changed` (+ openSet) | insert tab + activate | create the doc |
| H06 Open | `activeDoc:changed` (+ openSet) | insert tab + activate (or activate existing if already-open) | load the file |
| H07 Close | guard → lifecycle result | re-activate next / NO_DOC | run the guard |
| H05 Save | title/dirty update | reflect on tab | save |
| H04 dirty | per-doc dirty | update that tab's ● | compute dirty |

---

## 22. Dead-Control Audit

- **app.tab.activate** — visible → `tab.activate` → `activateDocument` → `activeDoc:changed` → rebind. ✅ T-tab-activate.
- **app.tab.close** — visible → `tab.close` → H07 guard → re-activation. ✅ T-tab-close.
- **app.tab.reorder** — visible → reorder open-set → `openSet:changed{reordered}` → strip refresh. ✅ T-tab-reorder.
- **Ctrl+Tab** — NOT visible/approved (PROPOSED). ✅ excluded.

No dead control. No commandless functional control. No fake control.

---

## 23. Ownership Audit

| Concern | ONE owner | Source of truth |
|---|---|---|
| open-set / active pointer / order / session assoc | SYS-02 (MOD-DOC) | `openSet` + `activeDocumentId` |
| activation semantics | SYS-02 (H02) | `activateDocument()` |
| tab strip render/input | SYS-01 | (view of open-set) |
| dirty guard | H04 | STM-DIRTY |
| close guard | H07 | — |
| save/load | H05/H06 | — |
| context menu | H03 | — |

One source of truth, one mutation owner, one activation path. No competing model.

---

## 24. Forensic Pre-Flight / Lessons Traceability

**Lessons consulted:** FL-0001..0026 (all ACTIVE).

**Checks passed:**
- [x] scope — only multi-doc/tabs/active (§2); FL-0016
- [x] ownership — SYS-02 = truth, SYS-01 = view (§8); FL-0009
- [x] events — `openSet:changed` locked + semantic separation; no fake `activeDoc:changed` (§14); FL-0007/0008
- [x] state — orthogonal dimensions, no flat INACTIVE (§6/§13); FL-0021/0024
- [x] invariant ↔ transition cross-check — ST1–ST8 consistent with INV-MD-* (no invariant/transition contradiction); FL-0025
- [x] controls — 3 approved, Ctrl+Tab excluded (§12/§22); FL-0005/0010
- [x] identity — duplicate-open blocked, duplicate-ID forbidden (§16); FL-0011
- [x] document binding — stale-ref prevention (§11); FL-0013
- [x] dirty/undo — per-doc isolation (§15); FL-0014/0015
- [x] persistence — all SESSION, no guessing (§17); FL-0004/0017
- [x] accessibility — focus after activation resolved (§19); FL-0012
- [x] edge cases — 34 cases (§20); FL-0018/0019
- [x] testing — test IDs; manual≠automated (§26); FL-0019
- [x] status honest — READY only because all critical AMBs resolved (§1); FL-0018/0023

**New recurring lessons discovered:** none (AMB-H02-004's `openSet:changed` event is now an APPROVED decision, not a gap; FL-0007/0008 already cover the event-semantics rule).

---

## 25. Adversarial Audit Findings

| # | Finding | Type | Evidence | Status |
|---|---|---|---|---|
| F1 | (prior) fake `activeDoc:changed` for reorder | event misuse | SYS-01 §27.1 | RESOLVED — `openSet:changed{reordered}` |
| F2 | (prior) fake `activeDoc:changed` for close-inactive | event misuse | SYS-01 §27.1 | RESOLVED — `openSet:changed{removed}` |
| F3 | (prior) open-set ownership ambiguous | ownership | SYS-01 §6.3 vs H00 §20 | RESOLVED — §8 |
| F4 | (prior) Ctrl+Tab in approved matrix | unapproved shortcut | Blueprint §1.2.1 | RESOLVED — PROPOSED only |
| F5 | (prior) duplicate-open / same-file-twice | identity | Blueprint §33 | RESOLVED — D-AMB-001 |
| F6 | (prior) focus-after-switch implicit | a11y | Blueprint silent | RESOLVED — D-AMB-003 |
| F7 | tab double-click | interaction gap | Blueprint silent | RESOLVED — NOT SPECIFIED (no invention) |

No new findings this pass. No manufactured findings.

---

## 26. Ambiguity Register

| AMB-ID | Status | Resolution |
|---|---|---|
| AMB-H02-001 (duplicate ID / same file) | **RESOLVED** | D-AMB-001 |
| AMB-H02-002 (Ctrl+Tab) | EXCLUDED (PROPOSED) | not part of H02; H09 may later approve |
| AMB-H02-003 (focus after switch) | **RESOLVED** | D-AMB-003 |
| AMB-H02-004 (open-set event) | **RESOLVED** | D-AMB-004 (`openSet:changed`) |

**Zero implementation-critical ambiguities remain.**

---

## 27. Test ID Matrix

T-tab-no-doc · T-tab-one · T-tab-two · T-tab-many · T-tab-new-empty · T-tab-new-many · T-tab-open-clean · T-tab-open-dirty · **T-tab-open-already-open** · T-tab-activate · T-tab-activate-self · T-tab-switch-aba · T-tab-close · T-tab-close-active · **T-tab-close-inactive** · T-tab-close-last · T-tab-dup-title · T-tab-dup-id · T-tab-reorder · T-tab-rapid · T-tab-stale-ref · T-tab-event · T-tab-event-dup · T-tab-openset-event · T-tab-openset-dup · T-tab-switch-fail · T-tab-dirty-per-doc · T-tab-undo-per-doc · T-tab-selection-per-doc · T-tab-playhead-per-doc · T-tab-library-rebind · T-tab-timeline-rebind · T-tab-properties-rebind · **T-tab-focus**

---

## 28. Completion Checklist

- [x] H00 INV-MD-1..10 satisfied
- [x] H01 handoff consistent (New → openSet+activeDoc)
- [x] openSet owner fixed (SYS-02/MOD-DOC)
- [x] activeDocument owner fixed
- [x] duplicate-open policy fixed (D-AMB-001)
- [x] focus policy fixed (D-AMB-003)
- [x] openSet event fixed (D-AMB-004, locked `openSet:changed`)
- [x] activeDoc event semantics fixed (active-pointer only)
- [x] inactive-close propagation fixed (openSet only)
- [x] reorder propagation fixed (openSet only)
- [x] no fake events
- [x] no dead controls
- [x] no unresolved functional controls
- [x] document-bound UI fully defined (§11)
- [x] session isolation defined (§15)
- [x] dirty/undo isolation defined (§15)
- [x] persistence boundaries defined (§17)
- [x] accessibility defined (§19)
- [x] critical edge cases defined (34)
- [x] test IDs defined (§27)
- [x] lesson pre-flight passed (§24)
- [x] final adversarial audit passed (§25)

---

## 29. Final H02 Report

**SOURCE COVERAGE:** Blueprint §1.1.3/§1.2.1 · Phase 2 F-01-03 · Phase 2.5 C-02 · Phase 3 eng 03/04 · SYS-01 §27.1/§6.3/§18 · H00 §6/§8/§9/§13 · H01 · AI01_FORENSIC_LESSONS.md · 3 approved decisions.

**CONTROLS:** 3 approved (activate, close, reorder) + Ctrl+Tab PROPOSED/excluded.

**COMMANDS:** 2 (`tab.activate`→`activateDocument`, `tab.close`); reorder = chrome view.

**STATE TRANSITIONS:** 8 (ST1–ST8, incl. duplicate-open ST2b).

**EVENT MATRIX:** 8 rows — event semantics + ordering locked.

**EDGE CASES:** 34.

**AMBIGUITIES:** 0 remaining (4 resolved: 3 by approved decision, 1 excluded).

**ADVERSARIAL FINDINGS:** 7 (all RESOLVED this pass).

**LESSONS APPLIED:** 26.

**CRITICAL RISKS:** 0.

**STATUS:** **READY FOR IMPLEMENTATION**

---

*STOP — H03 not started; no code written. H02 is safe to hand to AI-02.*
