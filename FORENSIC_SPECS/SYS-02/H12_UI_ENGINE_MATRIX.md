# H12 — UI → ENGINE CONNECTION MATRIX

## 1. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION**
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **H12-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > H00 > H09 registry > prior H-files > code (evidence only).

---

## 2. Scope

H12 owns the **exhaustive end-to-end connection matrix** for every SYS-02 File-system control: CONTROL → EVENT → COMMAND → TARGET → STATE MUTATION → ENGINE/API → DOCUMENT EFFECT → DIRTY → UNDO → PERSISTENCE → UI REBIND → TEST. It is the completeness proof that no control is orphaned and no command has no consumer.

H12 does NOT own: the commands themselves (→ H09 registry) · the engines (→ SYS-27/SYS-28) · chrome (→ SYS-01) · behavior semantics (→ H01–H08). H12 only CONNECTS what H01–H09 define.

---

## 3. Canonical Chain (one row per control — no orphans)

> CommandIds and events are verbatim from H09 §5 and the locked event registry (SYS-01 §27.1 + D-AMB-004). This matrix must stay byte-identical with those registries (FL-0030).

### 3.1 Lifecycle controls

| controlId | event (input) | commandId | target | state mutation | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.new | click/menu | `file.new()` → `document.create(settings)` | (new doc) | ACTIVE(UNTITLED,CLEAN); open-set +1 | MOD-DOC | new ENT-project + Session | CLEAN | LIFECYCLE (no) | none till save | `activeDoc:changed` → §9 rebind | T-file-new |
| file.newTemplate | click | `file.newFromTemplate(templateId)` | (new doc) | ACTIVE([AMB-H01-003],CLEAN); +1 | MOD-DOC | seeded doc | CLEAN | no | none | `activeDoc:changed` | T-file-new-template |
| file.open | click/Ctrl+O | `file.open(path)` | (loaded doc) | OPENING→ACTIVE(TITLED,CLEAN); +1 | SYS-28 load | loaded doc | CLEAN | no (history reset) | DOCUMENT (read) | `openSet:changed{added}`→`activeDoc:changed` | T-open |
| file.openRecent | click | `file.open(path)` (reuse) | (loaded doc) | same as open | SYS-28 | loaded doc | CLEAN | no | DOCUMENT (read) | same | T-open-recent |
| file.openExternalLibrary | click/Ctrl+Shift+O | `file.openExternalLibrary(path)` | library | ext lib ref | SYS-18 | ext lib (read-only) | none | no | none | `library:changed` (SYS-18) | T-file-open-ext-lib |
| file.close | click/Ctrl+W | `file.close()` | active doc | removed; next active / NO_DOC | SYS-02 (H07) | doc removed | (gone) | no | SESSION | `openSet:changed{removed}`→`activeDoc:changed{next\|null}` | T-close |
| file.closeAll | click | `file.closeAll()` | all docs | removed (sequential, P-5) | SYS-02 (H07) | all removed | (gone) | no | SESSION | `openSet:changed{removed}`×N → `activeDoc:changed{null}`×1 | T-close-all |
| file.exit | click/Ctrl+Q | `file.exit()` | app | quit | SYS-02 (H07) | app closes | — | no | — | — | T-exit |

### 3.2 Save controls

| controlId | event | commandId | target | state | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.save | click/Ctrl+S | `file.save()` | current doc | SAVING→CLEAN | SYS-28 write | snapshot advances | →CLEAN | no (history preserved) | DOCUMENT | `saving:changed{saved}` → tab/dirty/status | T-save |
| file.saveAs | click/Ctrl+Shift+S | `file.saveAs()` | current doc | SAVING→CLEAN; path→TITLED | SYS-28 write | snapshot advances | →CLEAN | no | DOCUMENT | `saving:changed{saved}` → tab/status | T-save-as |
| file.saveAsTemplate | click | `file.saveAsTemplate(name)` | current doc | template record | (P-7 store) | non-document write | none | no | [P-7] | — | T-file-save-template |

### 3.3 Handoff controls (SYS-27)

| controlId | event | commandId | target | state | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.importStage | click/Ctrl+R | `file.import('stage')` | doc | SYS-27 job | MOD-IMPORT | asset added + instance | →DIRTY | YES (atomic) | DOCUMENT | `library:changed`+`document:changed` | T-import-stage |
| file.importLibrary | click/Ctrl+I | `file.import('library')` | doc | SYS-27 job | MOD-IMPORT | asset added | →DIRTY | YES | DOCUMENT | `library:changed` | T-import-library |
| file.export | click/Ctrl+Shift+R | `file.export(format)` | doc | STM-EXPORT | MOD-EXPORT | non-mutating | none | no | output | `export:done` | T-export |
| file.publishSettings | click/Ctrl+Shift+F12 | `file.publishSettings()` | doc | dialog | SYS-27 | non-mutating | none | no | (SYS-27) | — | T-publish-settings |
| file.publish | click/Shift+Alt+F12 | `file.publish()` | doc | pipeline | SYS-27 | non-mutating | none | no | output | `export:done` | T-publish |
| file.publishProfiles | click | `file.publishProfiles()` | doc | dialog | SYS-27 | non-mutating | none | no | (SYS-27) | — | T-publish-profiles |

### 3.4 Tab controls (VIEW/SESSION — no document mutation)

| controlId | event | commandId | target | state | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| app.tab.activate | click/Enter/Space | `tab.activate(docId)` → `activateDocument(docId)` | active pointer | active changes | SYS-02 (H02) | none (VIEW) | none | none | SESSION | `activeDoc:changed{docId}` → §9 rebind | T-tab-activate |
| app.tab.close | click | `tab.close(docId)` | targeted doc | removed | SYS-02 (H07) | doc removed | (gone) | no | SESSION | `openSet:changed{removed}`→`activeDoc:changed` | T-tab-close |
| ctx-tab.close | menu item click/Enter | `tab.close(docId)` (same ID) | targeted doc | removed | SYS-02 (H07) | doc removed | (gone) | no | SESSION | same | T-ctx-tab-close |
| app.tab.reorder | drag | (none — chrome view) | open-set order | order changes | SYS-01/H02 | none (VIEW) | none | none | SESSION (order) | `openSet:changed{reordered}` | T-tab-reorder |

### 3.5 Indicator + guard controls (read-only / decisions)

| controlId | event | commandId | target | state | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (dirty indicator) | (reads `document:changed`) | none — read-only | active doc | reflects dirty | — | none | n/a | n/a | n/a | re-read on `document:changed` | T-dirty-indicator |
| dlg-guard.save | click | reuses `file.save()` (H05) | current doc | SAVING→CLEAN→proceed | SYS-28 | snapshot advances | →CLEAN | no | DOCUMENT | `saving:changed{saved}` | T-guard-save |
| dlg-guard.discard | click | decision "discard" | current doc | doc removed (by H07) | — | unsaved lost | (gone) | **no (permanent)** | — | H07 events | T-guard-discard |
| dlg-guard.cancel | click/Esc | decision "cancel" | — | unchanged | — | none | unchanged | no | — | none | T-guard-cancel |

### 3.6 Dialog controls (H01 — New/Template/Save-As-Template)

| controlId | event | commandId | target | state | engine | doc effect | dirty | undo | persist | rebind | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| dlg-new.create | click/Enter | `document.create(settings)` (via `file.new()`) | (new doc) | ACTIVE(UNTITLED,CLEAN) | MOD-DOC | new doc | CLEAN | no | none | `activeDoc:changed` | T-dlg-new-create |
| dlg-new.cancel | click/Esc | (none — close) | — | no change | — | none | n/a | no | — | none | T-dlg-new-cancel |
| tpl-new.open | click | `file.newFromTemplate(id)` | (new doc) | seeded doc | MOD-DOC | new doc | CLEAN | no | none | `activeDoc:changed` | T-tpl-new-open |
| tpl-new.cancel | click/Esc | (none — close) | — | no change | — | none | n/a | no | — | none | T-tpl-new-cancel |
| dlg-save-template.confirm | click/Enter | `file.saveAsTemplate(name)` | current doc | template record | (P-7) | non-doc write | none | no | [P-7] | — | T-dlg-save-template-confirm |
| dlg-save-template.cancel | click/Esc | (none — close) | — | no change | — | none | n/a | no | — | none | T-dlg-save-template-cancel |

---

## 4. Event Audit (reconciled across H00–H12)

| Event | Payload | Producer | Consumers | Emission condition | MUST NOT fire |
|---|---|---|---|---|---|
| `activeDoc:changed` | `{docId}` | SYS-02 (H02) | all §9 doc-bound UI | activeDocumentId changed | open-set-only change; save |
| `openSet:changed` | `{change, docId?}` | SYS-02 (H02) | tab strip | ordered open-set changed | activation-only change |
| `document:changed` | `{type, targets}` | Command post-do | stage/timeline/properties/dirty indicator | document mutation | save; view change |
| `saving:changed` | `{state, time?}` | SYS-28 (SYS-02 trigger) | st.saving, dirty ●, tab | save start/ok/fail | non-save change |
| `library:changed` | `{type, assetId}` | SYS-18 | library panel | library CRUD | (SYS-02 never emits) |
| `export:done` | `{format, path}` | SYS-27 | st.export, output | export complete | (SYS-02 never emits) |

Single canonical schema per event — no shorthand payload drift (FL-0030). No refresh-hack reuse (FL-0007). Ordering: `openSet:changed` before `activeDoc:changed` (D-AMB-004).

---

## 5. Orphan / Completeness Check

- Every control (§3) has: commandId (or explicit "read-only"/"decision"/"none-view") + engine target + testId. No orphan.
- Every command (H09 §5, 17 commandIds) has ≥1 control (§3). No command without a consumer.
- Every event (§4) has a producer + ≥1 consumer. No orphan event.
- Every engine operation is reachable only via an owning command. No engine op bypasses the command layer (INV-CMD-2).

---

## 6. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032.

**Checks passed:**
- [x] no orphan control / command / event (§5) — FL-0006
- [x] single canonical event payload (§4) — FL-0030
- [x] no refresh-hack event (§4) — FL-0007
- [x] commandIds verbatim from H09 — no drift — FL-0010
- [x] dirty/undo/persist columns consistent with H04/H05/H06/H07/H08 — FL-0014/0015
- [x] no engine internals absorbed — FL-0016
- [x] counting — 6 sub-matrices, 30 control rows, 6 events — reproducible — FL-0020

---

## 7. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) a control with no commandId (dead button) | dead control | RESOLVED — every control has commandId / read-only / decision / view annotation (§3) |
| F2 | (risk) event payload drift vs H09/H04 | event drift | RESOLVED — verbatim (§4) |
| F3 | (risk) `file.close()` vs `tab.close(docId)` collapsed | command drift | RESOLVED — distinct rows (§3.1/§3.4) |
| F4 | (risk) engine op bypassing command layer | INV-CMD-2 | RESOLVED — all engine ops via owning command (§5) |

No manufactured findings.

---

## 8. Ambiguity Register

| AMB | Cross-reference in this matrix | Owner | Critical? |
|---|---|---|---|
| AMB-H07-001 | `file.close()`/`tab.close()`/`file.closeAll()` → `activeDoc:changed{next}` — `next` unresolved | H07 | YES |
| AMB-H01-003 | `file.newTemplate` target `ACTIVE([AMB-H01-003],CLEAN)` | H01 | YES |
| AMB-H01-002 | `file.saveAsTemplate` duplicate name | H01 | YES |

H12 references these; it does NOT decide them.

---

## 9. Final Report

STATUS: **READY FOR IMPLEMENTATION** · Controls: 30 (across 6 sub-matrices) · Commands connected: 17 · Events: 6 (canonical) · Orphans: 0 · Ambiguities: 0 owned (3 referenced) · Findings: 4 (resolved).

> The matrix itself is complete and internally consistent. The three referenced ambiguities (AMB-H07-001, AMB-H01-002/003) are owned by H07/H01 and remain their blockers — they surface here only as the `next`/`[AMB-H01-003]`/duplicate-name placeholders that those owners must resolve.

---

*H12 done. Next: H13.*
