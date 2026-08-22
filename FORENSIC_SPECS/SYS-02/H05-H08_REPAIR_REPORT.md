# H05–H08 FORENSIC REPAIR + CROSS-H CONSISTENCY REPORT

> AI-01 forensic pass. Scope: H05, H06, H07, H08 + AI01_FORENSIC_LESSONS.md.
> Pre-flight: lessons read BEFORE (FL-0001..0028) and AFTER (FL-0001..0030) editing.
> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > Adobe > code (evidence only).

---

## 1. Per-File Final Status

| File | Status | Basis |
|---|---|---|
| H05 | **READY FOR IMPLEMENTATION** | Save-As→open-path blocked (INV-IDENT-4); metadata propagation + save order defined; canonical `saving:changed{state,time?}`; AMB-H05-001 = non-blocking recommendation |
| H06 | **READY FOR IMPLEMENTATION** | failure semantics split CASE A/B; AMB-002 honestly deferred to H10 (not falsely closed) |
| H07 | **REVISION REQUIRED** | AMB-H07-001 (next-active) unresolved — no authoritative source, no approved decision. §1 and §23 now agree (both REVISION REQUIRED) |
| H08 | **READY FOR IMPLEMENTATION** | handoff-only; downstream event ownership classified (no SYS-02 event promotion) |

---

## 2. What Changed (exactly why)

### H05
- **F1 — Save As to an already-open path = BLOCKED** (was: blanket "overwrite"). Now: explicit error, source unchanged (dirty/History/session preserved), per INV-IDENT-4 / D-AMB-001 (one saved path = one open document). Added edge case 15 + `T-save-as-open-path-block`.
- **F2 — metadata propagation defined exactly**: on `saving:changed{saved}`, the H02 tab re-reads `meta.title` + dirty; `document:changed` NOT re-emitted (save ≠ mutation); no `activeDoc:changed` (active pointer unchanged). Document ID unchanged; path changes only on Save As; title unchanged (AMB-H05-001).
- **F3 — canonical save-success sequence (7 ordered steps) + failure sequence** added (§7.1/§7.2).
- **F4 — payload drift fixed**: `{time}` → canonical `saving:changed{state:'saving'|'saved'|'error', time?}` (SYS-01 §27.1).
- **F5 — AMB-H05-001**: §6 wording → "UNRESOLVED … RECOMMENDATION — NOT AUTHORITATIVE".
- Stale citation "SYS-01 §4" → "§27.1" (2 places).

### H06
- **F1 — open-failure semantics split** into CASE A (active doc exists → everything unchanged) vs CASE B (NO_DOCUMENT → stays NO_DOCUMENT); §11 note + §7 T5.
- **F2 — AMB-002 wording**: edge case 8 "impossible" → "FORBIDDEN by invariant; collision-RECOVERY = AMB-002, deferred to H10". §19/§22 no longer claim zero system-level identity questions.
- **F3 — Open vs already-open preserved exactly** (D-AMB-001 add/activate model; event order openSet→activeDoc). No change needed.
- "States: 2" → "3" (OPENING / ACTIVE(TITLED,CLEAN) / OPEN_FAILED).

### H07
- **Status contradiction fixed**: §1 was "READY FOR IMPLEMENTATION" while §23 was "REVISION REQUIRED" → §1 now REVISION REQUIRED.
- **F1 — AMB-H07-001** stays unresolved (no authority). §7 recommendation re-labeled "RECOMMENDATION — NOT AUTHORITATIVE … MUST NOT be implemented as a binding rule".
- **F2 — Close All event sequence defined**: remove all N atomically → `openSet:changed{removed,docId}` ×N → `activeDoc:changed{null}` exactly once; final state authoritative before any event.
- **F3 — guard accessibility**: "initial focus = Cancel (safe)" (unsourced) → `[NOT SPECIFIED]` + recommendation (defer to H11/SYS-01).
- **Command drift fixed**: `file.close()` trigger was "Ctrl+W / menu / tab × / ctx Close" → now "Ctrl+W / File menu"; `tab.close(docId)` clarified as a SEPARATE (H02-owned) command for tab ×/ctx.

### H08
- **F1 — event ownership classified**: `library:changed` = SYS-18, `document:changed` = SYS-01 §27.1, `export:done` = SYS-27 — all downstream; H08 observes, never owns/emits/re-promotes (FL-0007/0008).
- Stale citation "SYS-01 §4" → "§27.1" (2 places).

### Lessons
- **FL-0029** (Save As path collision with open-set identity) — P1.
- **FL-0030** (event payload drift) — P1.
- Footer → FL-0031+; index updated (Events: +FL-0030; Identity: +FL-0029).

---

## 3. Cross-H Ownership Matrix (H04–H08)

| Concern | Owner |
|---|---|
| dirty state + dirty semantic | H04 |
| dirty guard DECISION contract | H04 |
| guard dialog chrome + a11y | H07 (invoke) + SYS-01 (modal) |
| save semantics / path identity / modifiedAt | H05 |
| open semantics / load handoff | H06 |
| close/close-all/exit lifecycle + guard invocation | H07 |
| import/export/publish handoff | H08 |
| import/export/publish ENGINES | SYS-27 |
| read/write persistence internals | SYS-28 |
| open-set / active pointer / tab semantics | H02 |
| tab/context-menu chrome | SYS-01 |

One owner per concern. No collision.

---

## 4. Canonical Event Matrix

| Event | Meaning | Owner | Payload | Fires | MUST NOT fire |
|---|---|---|---|---|---|
| `activeDoc:changed` | activeDocumentId changed | SYS-02 (H02) | `{docId}` | activation, New/Open auto-activate, close (next/last → `{null}`) | open-set-only change (reorder/close-inactive); save |
| `openSet:changed` | ordered open-set changed | SYS-02 (H02), D-AMB-004 | `{change:'added'\|'removed'\|'reordered', docId?}` | New/Open (added), close (removed), reorder | activation-only change |
| `document:changed` | document mutation | Command post-do (SYS-01 §27.1) | `{type, targets}` | edit/import/undo/redo | save; view/session/workspace/pref |
| `saving:changed` | save-state change | SYS-28 (SYS-02 trigger) | `{state:'saving'\|'saved'\|'error', time?}` | save start/ok/fail | non-save state change |
| `library:changed` | library asset CRUD | SYS-18 | `{type, assetId}` | import-to-library, asset ops | (SYS-02 never emits) |
| `export:done` | export complete | SYS-27 | `{format, path}` | STM-EXPORT complete | (SYS-02 never emits) |

No invented event. No refresh-hack reuse.

---

## 5. Canonical Command Matrix (H05–H08)

| commandId | Owner | Trigger | Precondition | State | Event | Dirty | Undo | Persist | Failure |
|---|---|---|---|---|---|---|---|---|---|
| `file.save()` | H05 | Ctrl+S / menu / guard-Save | doc open | SAVING→CLEAN | saving:changed | →CLEAN | no (history preserved) | DOCUMENT | write fail → stay DIRTY |
| `file.saveAs()` | H05 | Ctrl+Shift+S / menu | doc open | SAVING→CLEAN, path→TITLED | saving:changed | →CLEAN | no | DOCUMENT | fail→toast; open-path→blocked |
| `file.open(path)` | H06 | Ctrl+O / menu / Open-Recent | — | OPENING→ACTIVE (add+activate) | openSet{added}→activeDoc | →CLEAN (loaded) | no (history reset) | SESSION | invalid/missing/corrupt/version→toast |
| `file.close()` | H07 | Ctrl+W / File menu | doc open | remove ACTIVE doc | openSet{removed}→activeDoc | doc gone | no | SESSION | dirty→guard |
| `file.closeAll()` | H07 | menu | ≥1 doc | remove all | openSet{removed}×N → activeDoc{null} | — | no | SESSION | dirty→guard (per-doc) |
| `file.exit()` | H07 | Ctrl+Q / menu | — | quit | (app closes) | — | no | — | dirty→guard |
| `file.import(target)` | H08→SYS-27 | Ctrl+R / Ctrl+I | doc open | SYS-27 job | library:changed + document:changed | YES | YES (atomic) | DOCUMENT | report |
| `file.export(format)` | H08→SYS-27 | Ctrl+Shift+R | doc open | SYS-27 STM-EXPORT | export:done | none | no | output | log |
| `file.publish()` / `file.publishSettings()` / `file.publishProfiles()` | H08→SYS-27 | shortcuts/menu | doc open | SYS-27 | export:done | none | no | (SYS-27) | log |
| `tab.close(docId)` | H02 | tab × / ctx Close | doc open | remove TARGET doc | openSet{removed}→activeDoc | doc gone | no | SESSION | dirty→guard |

`file.openRecent` reuses `file.open` (no separate commandId). No duplicate IDs, no aliases, no drift.

---

## 6. Path / Identity Matrix

| Operation | Document ID | path | title | modifiedAt | dirty | openSet |
|---|---|---|---|---|---|---|
| New | new | none (UNTITLED) | (SYS-06/17 later) | createdAt | CLEAN | +1 |
| New-from-template | new | none ([AMB-H01-003]) | (later) | createdAt | CLEAN | +1 |
| First Save (untitled) | unchanged | set (→TITLED) | [AMB-H05-001 rec] | updated | →CLEAN | same |
| Save | unchanged | unchanged | unchanged | updated | →CLEAN | same |
| Save As | unchanged | new (→TITLED) | unchanged | updated | →CLEAN | same (target must NOT be open) |
| Open (new path) | adopts file ID | file path | file title | loaded | CLEAN | +1 |
| Open (already-open) | unchanged | unchanged | unchanged | unchanged | unchanged | same (activate) |
| Close | removed | — | — | — | dies with doc | −1 |
| Reopen | adopts file ID | file path | file title | loaded | CLEAN | +1 |

---

## 7. Dirty / Save / Open / Close Flow Audit (vs H04)

| Flow | Result | Consistent with H04? |
|---|---|---|
| DIRTY → Save → success → CLEAN → Close | Save advances snapshot → CLEAN; close direct | ✓ |
| DIRTY → Save fail → stays DIRTY → Close blocked | write fail keeps DIRTY; guard on close | ✓ |
| DIRTY → Open new → guard → Cancel → unchanged | guard (H04 decision) → cancel = abort, doc unchanged | ✓ |
| DIRTY → Open new → guard Save → Load → new doc active | save → CLEAN → load → new active | ✓ |
| DIRTY → Close → Discard → removed | discard = non-undoable → doc removed | ✓ |
| Clean → Open new → new doc added + active | no guard (clean) → add+activate | ✓ |

No flow contradicts H04 (snapshot-based dirty; no view/session/workspace/pref clears DIRTY).

---

## 8. Citation Drift Report (H05–H08)

| Old | New | File | Occurrences |
|---|---|---|---|
| SYS-01 §4 (saving:changed) | SYS-01 §27.1 | H05 | 2 |
| SYS-01 §4 (export:done) | SYS-01 §27.1 | H08 | 2 |

(H06/H07 had no stale citations — verified.)

---

## 9. Counting Audit (FL-0020)

| File | Item | Fixed |
|---|---|---|
| H05 | Edge cases 14 → **15** | added T-save-as-open-path-block |
| H06 | States 2 → **3** | OPENING/ACTIVE/OPEN_FAILED |
| H07 | (status §1) READY → **REVISION REQUIRED** | matches §23 |
| H08 | — no change | — |

All other counts (H05 controls 3/commands 2/states 4/transitions 4; H06 controls 2/commands 1/transitions 6/edges 14; H07 controls 3/commands 3/transitions 7/edges 12; H08 controls 6/commands 6/edges 10) verified against tables.

---

## 10. Adversarial Findings (F1–F20 scan)

| # | Finding | Evidence | Status |
|---|---|---|---|
| F8 | Save As → open-path collision (would create two open docs, one path) | H05 §6 | FIXED — BLOCKED (INV-IDENT-4) |
| F5/F4 | `saving:changed` payload drift `{time}` vs `{state,time?}` | H05 §9 vs SYS-01 §27.1 | FIXED — canonical schema |
| F13 | "title may be derived" (unresolved → asserted loosely) | H05 §6 | FIXED — RECOMMENDATION, not authoritative |
| F15 | "SYS-01 §4" stale citations | H05/H08 | FIXED — §27.1 |
| F17 | H07 §1 "READY" vs §23 "REVISION REQUIRED" | H07 | FIXED — §1 now REVISION REQUIRED |
| F17 | H06 "zero ambiguity" while AMB-002 open | H06 §19 | FIXED — deferred to H10, not falsely closed |
| F4 | H07 `file.close()` trigger included "tab × / ctx Close" (command drift vs tab.close) | H07 §9 | FIXED — separated |
| F14 | H07 "initial focus = Cancel (safe)" unsourced | H07 §13 | FIXED — [NOT SPECIFIED] + recommendation |
| F2 | H08 downstream events (library/document:changed, export:done) unclassified | H08 §9 | FIXED — ownership classified, no promotion |
| F16 | counting drift (H05 edges, H06 states) | H05/H06 | FIXED |

No manufactured findings. No F1 (scope), F3/F4 (command collision/duplicate), F6/F7 (wrong/missing event), F9 (dup open path — already D-AMB-001), F10/F11 (dirty/undo leak), F12 (stale UI), F18 (code authority), F19 (test≠acceptance), F20 (H00-H04 contradiction) found.

---

## 11. Final Ambiguity Register (H05–H08)

| AMB | Question | Critical? | Status |
|---|---|---|---|
| AMB-H05-001 | title derived from filename on first save? | NO (display-only) | RECOMMENDATION — NOT AUTHORITATIVE |
| AMB-H07-001 | which doc becomes active after closing the active one (survivors)? | **YES** | **OPEN** — needs product decision; H07 REVISION REQUIRED |
| AMB-002 (inherited) | collision-recovery if a load would produce a duplicate Document ID | YES (H10) | deferred to H10 (not H06's) |
| AMB-H01-002/003 (inherited) | template name / seeded-doc identity | YES (H01) | open (H01's) |

---

*Repair + cross-H consistency pass complete. STOP — H09 not started; no code written; `animator/` untouched.*
