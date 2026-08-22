# H00–H04 MASTER CONSISTENCY + FORENSIC RECONCILIATION

> AI-01 reconciliation pass. Scope: H00, H01, H02, H03, H04 + AI01_FORENSIC_LESSONS.md.
> Authority order: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code (evidence only).
> This report is the record of cross-H reconciliation. The five H-files are the authority; this report only documents cross-file facts.

---

## 1. Final Status Per File

| File | Status | Basis |
|---|---|---|
| H00 | **FORENSIC FOUNDATION — COMPLETE** (reconciled) | dirty invariants unified; citations corrected; counts corrected |
| H01 | **REVISION REQUIRED** (unchanged) | AMB-H01-002 (duplicate template name), AMB-H01-003 (seeded-doc identity) — pre-existing product decisions, correctly registered |
| H02 | **READY FOR IMPLEMENTATION** | all AMB-H02-* resolved; "next active" now explicitly cross-referenced to AMB-H07-001 |
| H03 | **READY FOR IMPLEMENTATION** | AMB-H03-001/002 non-blocking refinements |
| H04 | **READY FOR IMPLEMENTATION** | v2 (invariant fixed); no ambiguity |

**Block verdict:** H00/H02/H03/H04 are internally consistent AND cross-consistent. H01 is REVISION REQUIRED **only** because of two legitimately-registered product decisions (AMB-H01-002/003) — NOT because of any contradiction, drift, collision, or stale citation. No implementation-sensitive ambiguity is passed downstream silently.

---

## 2. Cross-H Ownership Matrix (ONE owner per concern)

| Concern | Owner | Source of truth | Notes |
|---|---|---|---|
| Document identity (Doc ID vs title vs path) | H00 §5 (constitution) | ENT-project `id` | INV-IDENT-1..3 |
| Document lifecycle | H00 §6 (constitution); H07 (close/exit) | DIM-A (NO_DOCUMENT/ACTIVE/OPENING/RECOVERED) | |
| openSet | H02 (SYS-02/MOD-DOC) | `openSet: OrderedMap<DocumentId, Session>` | SESSION, never persisted |
| activeDocumentId | H02 | `activeDocumentId: DocumentId \| null` | |
| tab semantics (activate/close/reorder) | H02 | `activateDocument()` / `tab.close()` | |
| tab chrome (strip render + input) | SYS-01 | (view of open-set) | |
| tab context-menu semantics | H03 | `{ctx-tab.close}` | single item |
| context-menu chrome (overlay/z/focus) | SYS-01 (phase2.5 C-07) | L4 overlay | |
| dirty flag + dirty semantic | H04 | STM-DIRTY (snapshot-based) | INV-DIRTY-1..4 |
| dirty-guard decision contract | H04 | Save/Discard/Cancel + dirty consequences | NOT the dialog |
| guard dialog chrome + a11y | H07 (opens) + SYS-01 (modal) | — | H04 does NOT own this |
| save | H05 | `file.save` / `file.saveAs` | H04 guard Save reuses `file.save()` |
| open | H06 | `file.open` | |
| close lifecycle | H07 | `file.close` / `file.closeAll` / `file.exit` | |
| persistence internals | SYS-28 | — | no H-part absorbs it |
| event emission | SYS-01 §27.1 (locked names) | — | |
| document-bound UI rebind | H00 §9 (rules) + each panel owner | — | INV-MD-8 |
| command registry | SYS-01 §28 | — | INV-CMD-1 |
| New/New-from-Template dialog | H01 | — | |
| template mechanism | H01 | — | store location = P-7 |

No concern has two owners. The only historical collision (H00 §2 "H04 owns unsaved guard dialog") was corrected to "H04 owns the guard **decision contract**; the dialog chrome/a11y = H07/H06 + SYS-01".

---

## 3. Cross-H Event Matrix (locked semantics)

| Action | Owner | State change | Event(s) — order | Notes |
|---|---|---|---|---|
| New | H01/H02 | open-set + active | `openSet:changed{added}` → `activeDoc:changed` | H01 now lists BOTH (was missing openSet) |
| New-from-Template | H01/H02 | open-set + active | `openSet:changed{added}` → `activeDoc:changed` | same |
| Open new | H06/H02 | open-set + active | `openSet:changed{added}` → `activeDoc:changed` | |
| Open already-open | H06/H02 | active only | `activeDoc:changed` | D-AMB-001 |
| Activate | H02 | active only | `activeDoc:changed` | |
| Close active (survivor) | H07/H02 | open-set + active | `openSet:changed{removed}` → `activeDoc:changed{next}` | next = AMB-H07-001 |
| Close inactive | H07/H02 | open-set only | `openSet:changed{removed}` | NO activeDoc |
| Close last | H07/H02 | open-set + active→null | `openSet:changed{removed}` → `activeDoc:changed{null}` | |
| Reorder | SYS-01/H02 | order only | `openSet:changed{reordered}` | NO activeDoc |
| Document mutation (dirty) | edit/import/undo/redo | document | `document:changed` | H04 consumes to flip ● |
| Save start / ok / fail | H05/SYS-28 | save state | `saving:changed{saving\|saved\|error}` | payload `{state, time?}` |

**Locked meanings (binding, no drift):**
- `activeDoc:changed` = ONLY "activeDocumentId changed" — never a refresh hack.
- `openSet:changed{change: added|removed|reordered, docId?}` = ordered open-set changed.
- `document:changed` = document mutation (SYS-01 §27.1 producer "Command post-do").
- `saving:changed` = save-state transition (SYS-01 §27.1).

---

## 4. Cross-H Command Matrix

| commandId | Owner | Trigger | State | Undo | Persist | Notes |
|---|---|---|---|---|---|---|
| `file.new()` → `document.create(settings)` | H01 | Ctrl+N / menu | new doc ACTIVE(UNTITLED,CLEAN) | LIFECYCLE (no) | none till save | emits openSet→activeDoc |
| `file.newFromTemplate(templateId)` | H01 | gallery Open | new seeded doc | no | none | same |
| `file.saveAsTemplate(name)` | H01 | menu | template record | no | [P-7] | non-document |
| `tab.activate(docId)` → `activateDocument(docId)` | H02 | tab click / Enter / Space | active pointer change | no | SESSION | VIEW |
| `tab.close(docId)` | H02/H03 | tab × / ctx Close | doc removed (H07 guard) | no | SESSION | shared, no drift |
| `file.save()` | H05 | Ctrl+S / **guard Save** | →CLEAN | no (history preserved) | DOCUMENT | H04 guard reuses it |
| (guard Discard / Cancel) | H04 (decision) | guard buttons | discard→proceed / abort | no / no | — | **NOT commands** |

**Command-drift findings:**
- H04 v2 removed the invented `guardSave()/guardDiscard()/guardCancel()` — the guard Save reuses `file.save()`; Discard/Cancel are decision branches inside the invoking lifecycle command.
- H03 §6.3 previously claimed `tab.close(docId)` was "the SAME commandId as File ▸ Close". Corrected: File ▸ Close is `file.close()` (H07), a SEPARATE command. `tab.close(docId)` is shared only with the tab × affordance (H02 §12).
- **Cross-file note (not a H00–H04 blocker):** the exact relationship between `file.close()` (File menu, active-only) and `tab.close(docId)` (tab ×, targeted) must be settled as ONE canonical rule when H07 is reconciled. Evidence: the SYS-02 canonical registry lists both; SYS-01 §30 maps "File▸Close → tab.close(id)"; H07 §9 lists both as separate controls. This ambiguity is owned by H07 (out of scope here).

---

## 5. Dirty-Semantics Reconciliation (mandatory)

**Authoritative semantic (now uniform across H00 + H04):**

> DIRTY ⇔ (current document state ≠ saved snapshot).
> CLEAN ⇔ (current document state == saved snapshot).
> Legal CLEAN paths: (1) successful Save/Save As advances the snapshot; (2) undo/redo returns the state to the snapshot.
> No VIEW/SESSION/WORKSPACE/PREFERENCE action may clear DIRTY.

**Occurrences corrected in H00 (were "DIRTY→CLEAN only via successful write"):**
1. H00 §7 INV-DIRTY-2 → rewritten (snapshot-based, two legal paths).
2. H00 §6.3 forbidden transition → rewritten (no arbitrary clearing).
3. H00 §22 INV-008 → rewritten (+ updated test method).

H00 §7's table ("Undo/Redo: YES if leaves ≠ snapshot; NO if returns to snapshot") and Q&A ("Does undo make it clean? … only if it returns to the exact saved state") were already correct and now agree with the invariants. H04 §3.1/§6.2/§7 already carried the corrected wording (v2). **H00 ↔ H04 now agree.**

---

## 6. Citation Drift Report

| Old reference | Corrected reference | Affected files | Occurrences |
|---|---|---|---|
| SYS-01 §4 (event contract) | SYS-01 §27.1 | H00, H02 | 6 (H00 ×2, H02 ×4; H04 already corrected in v2) |
| SYS-01 §13 (undo model / SESSION class) | SYS-01 §17 | H00 | 8 |
| SYS-01 §32 (design tokens) | SYS-01 §2/§21 (CSS-token theme) | H00 | 4 |
| SYS-01 §11 (9-outcome / rollback / ALREADY-IN-STATE) | SYS-01 §28/§36 (error model) · §32 (ALREADY-IN-STATE) | H00 | 5 |
| SYS-01 §19 (integration contract) | SYS-01 §31 | H00 | 1 |
| SYS-01 §7 (overlay C-07) | phase2.5 C-07 | H03 | 2 |

Root cause: SYS-01 was renumbered to v5 (38 sections) after H00–H03 were drafted. Every downstream citation re-verified against the current SYS-01 v5 section map (§4=Additional Research, §11=Keyboard, §13=States, §17=Undo, §18=Persistence, §19=Export/Import, §27=Event Contract, §28=Control Registry, §31=Integration, §32=Internal Consistency Audit, §36=Master Template). → Lesson **FL-0026**.

---

## 7. Counting Audit (FL-0020)

| File | Item | Was | Corrected to | Verified against |
|---|---|---|---|---|
| H00 | total invariants | "33 (19+14)" | **60 (19 + 41)** | 19 global §22 (INV-001..019) + 41 named sub-invariants (INV-CMD 4, INV-DEP 2, INV-DIRTY 4, INV-DSTR 2, INV-ERR 3, INV-IDENT 3, INV-MD 10, INV-NATIVE 2, INV-PERS 3, INV-UNDO 4, INV-VIS 4) |
| H01 | controls | "14" | **17** | file.new + 6 fields + create + cancel + file.newTemplate + list/open/cancel + file.saveAsTemplate + name/confirm/cancel = 17 |
| H02 | lessons applied | "24" | **26** | FL-0001..0026 |
| H03 | states | "STATE TRANSITIONS: 4" | **STATES: 5** | CLOSED/OPEN/ACTION/CANCEL/DISMISS |
| H04 | (all) | — | unchanged | already mechanically reproducible |

All other counts (H01 commands 3, H02 controls 3/commands 2/transitions 8/edges 34/findings 7, H03 menu 1/commands 1/edges 25/findings 5, H04 controls 4/commands 0/states 4/transitions 7/matrix 16/edges 25/findings 5) verified against their tables — no drift.

---

## 8. Adversarial Findings (this pass)

| # | Finding | Class | Resolution |
|---|---|---|---|
| R-1 | H00 dirty invariant "DIRTY→CLEAN only via write" contradicted its own §7 table + H04 T6 | contradictory invariant (FL-0025) | FIXED — 3 places rewritten |
| R-2 | H00 §2 assigned H04 "unsaved guard dialog" (collides with H07/SYS-01) | ownership (FL-0009/0016) | FIXED — "guard decision contract"; dialog = H07/H06 + SYS-01 |
| R-3 | H01 New/New-from-Template listed only `activeDoc:changed` (missing `openSet:changed{added}`) | missing propagation (FL-0006/0008) | FIXED — both events, D-AMB-004 order |
| R-4 | H02 "next active" (ST4/edge 13) was a silent assumption | silent ambiguity (FL-0023) | FIXED — cross-referenced to AMB-H07-001 (owned by H07) |
| R-5 | H03 claimed `tab.close(docId)` == "File ▸ Close" | command drift | FIXED — File ▸ Close = `file.close()` (H07), separate |
| R-6 | 6 stale SYS-01 section citations (§4/§13/§32/§11/§19/§7) | citation drift (FL-0026) | FIXED — see §6 report |
| R-7 | Counting drift (H00 33, H01 14, H03 "4 transitions") | counting (FL-0020) | FIXED — see §7 report |
| R-8 | (carried from H04 v2) invented guard commandIds | command invention (FL-0010) | already FIXED in H04 v2 |
| R-9 | (carried) H07 §13 "initial focus = Cancel" is unsourced | unsourced a11y (FL-0012) | NOT H04's scope; flagged for H07 revision (still open — H07 is REVISION REQUIRED anyway) |

---

## 9. Remaining Ambiguity Register (after reconciliation)

| AMB-ID | Question | Owner | Critical? | Status |
|---|---|---|---|---|
| AMB-H01-002 | duplicate template name (overwrite/rename/block) | H01 | YES | **open** — product decision (H01 REVISION REQUIRED) |
| AMB-H01-003 | New-from-Template seeded-doc identity (UNTITLED vs auto-titled) | H01 | YES | **open** — product decision (H01 REVISION REQUIRED) |
| AMB-H07-001 | which doc becomes active after closing the active one (survivors) | H07 | YES | **open** — product decision (H07 REVISION REQUIRED); now cross-referenced in H02 |
| AMB-H03-001 | future tab-context-menu items | H03 | NO | non-blocking refinement |
| AMB-H03-002 | keyboard gesture to open context menu | H03 | NO | non-blocking refinement |
| AMB-001..004 (H00 §23) | same-path/open-collision, recent store, Tauri wiring | H02/H05/H06/H10 | YES | deferred to owning parts (unchanged) |
| (H07 §13) | guard "initial focus = Cancel" unsourced | H07 | NO (a11y refinement) | flagged for H07 revision |

---

## 10. AI-02 Implementation-Safety Verdict

Reading H00 → H01 → H02 → H03 → H04 + the lessons file, AI-02 can now implement **without guessing** on:
- dirty semantics (snapshot-based, uniform),
- event names/payloads/ordering (locked, uniform),
- command IDs (no invention; guard = decision contract; tab.close vs file.close separated),
- ownership (one owner per concern; guard dialog = H07/SYS-01),
- citations (point to the correct current SYS-01 sections).

AI-02 **must not** implement H01's template Save/New-from-Template until AMB-H01-002/003 are resolved, and must not implement H07's close-next-active until AMB-H07-001 is resolved — both are correctly registered as blocking product decisions (never silently chosen).

---

---

## 11. FREEZE-PASS ADDENDUM (final consistency pass)

This pass resolved the remaining H00 items and generalized the dirty semantic. Changes:

### 11.1 H00 AMB-001 → RESOLVED (D-AMB-001)
- §5 identity row "same path" → RESOLVED: a saved path already open is activated (no second instance, no second tab, no disk reload; session/dirty/selection/playhead/History preserved).
- §23 register row → RESOLVED with provenance (owned/implemented through H02/H06 interaction).

### 11.2 H00 AMB-002 → PARTIALLY RESOLVED
- New invariant **INV-IDENT-4**: no duplicate Document ID in the open-set (D-AMB-001).
- **Remaining unresolved (honest):** collision-RECOVERY behavior (what to do if a load would produce a duplicate ID) is source-silent — NOT invented.

### 11.3 `openSet:changed` registered in H00 §12
- Canonical SYS-02 event definitions (activeDoc:changed / openSet:changed / saving:changed / document:changed) with meaning, payload, owner, fires-when, MUST-NOT-fire-when.
- Locked event-ordering matrix (New / Open-new / Activate / Close-active / Close-inactive / Close-last / Reorder).
- Explicit: `openSet:changed` is a SYS-02 approved extension (D-AMB-004), NOT a replacement of SYS-01 §27.1.

### 11.4 Dirty semantic generalized (H00 + H04)
- Prior wording restricted CLEAN to "successful write OR undo/redo". Now: **"DIRTY clears when state == snapshot — via a successful write OR any document mutation reaching the snapshot (undo/redo are examples, NOT the only mutations)."**
- Fixed in H00 §7/§6.3/§22 and H04 §3.1/§6.0/§6.2/§7 (machine + forbidden + T6/T7) + new matrix row 17 + edge case 26 (X: 10→20→10).
- New lesson **FL-0027** (invariant must state the general condition; examples labeled as examples, never exhaustive).

### 11.5 Count updates (FL-0020)
- H00: 61 invariants (42 sub + 19 global); AMB-001 RESOLVED; UNRESOLVED 4→3; CRITICAL RISK (1) narrowed to AMB-002 recovery.
- H04: matrix 16→17, edge cases 25→26, test IDs 28→29.

### 11.6 Freeze verdict
No contradiction, no event drift, no identity drift, no dirty-semantic drift, no command drift, no ownership collision, no stale citation, no counting drift. H01 remains REVISION REQUIRED (AMB-H01-002/003 — product decisions, not invented). H00/H02/H03/H04 are READY (H00 = COMPLETE as foundation).

---

*Reconciliation + freeze complete. STOP — H05 not started; no code written; `animator/` untouched.*
