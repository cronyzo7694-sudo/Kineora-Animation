# H08 — IMPORT / EXPORT / PUBLISH HANDOFFS

## 1. Document Status

STATUS: **READY FOR IMPLEMENTATION** (handoff contracts only; engines owned by SYS-27)

Revision: **H08-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

---

## 2. Scope

H08 owns ONLY the SYS-02 File-menu HANDOFF CONTRACTS for Import, Export, Publish. It does NOT own the engines (→ **SYS-27**).

H08 defines per handoff: command/menu entry, preconditions, enabled/disabled, handoff target, input, expected result event, dirty impact, undo class, persistence class, error, cancellation, UI feedback, test ID.

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.1 | Import (to Stage Ctrl+R / to Library Ctrl+I / Open External Library); Export (Ctrl+Shift+R); Publish Settings (Ctrl+Shift+F12) / Publish (Shift+Alt+F12) / Profiles |
| Part 27 / 28 | import/export/publish feature scope (engines = SYS-27) |
| Phase 3 eng 14 | import/export pipelines (SYS-27) |
| SYS-02 §17 | Import = DOCUMENT MUTATION (undoable); Export/Publish = NON-MUTATING |
| H00 §7 | import dirties; export/publish don't |
| H00 §14 | SYS-27 = handoff; SYS-28 = persistence |
| SYS-01 §27.1 | `export:done` event (locked) |
| SYS-02 §24 | P-7 (template store = deployment detail) |
| AI01_FORENSIC_LESSONS.md | FL-0016 (scope), FL-0017 (authority) |

---

## 4. Dependency Map

H08 depends on: H00 §7/§14, SYS-27 (engines), SYS-01 §27.1 (`export:done`).
H08 provides to: H09 (menu/shortcut registry), H12 (matrix).
H08 does NOT own: SYS-27 engines, SYS-28 persistence.

---

## 5. Terminology

| Term | Definition |
|---|---|
| Handoff | SYS-02 menu entry → command → SYS-27 engine → result event → UI |
| Import | bring external asset(s) into the document (mutating) |
| Export | render the document to a file (non-mutating) |
| Publish | run the configured pipeline (non-mutating) |

---

## 6. Handoff Contracts

### 6.1 Import

| Field | Value |
|---|---|
| menu entry | File ▸ Import ▸ Import to Stage / Import to Library |
| commandId | `file.import(target)` (target = 'stage' \| 'library') |
| precondition | doc open |
| handoff target | **SYS-27** MOD-IMPORT |
| input | target + (SYS-27 collects format/file) |
| result event | `library:changed` + `document:changed` (stage) |
| dirty impact | **YES** (document mutation) |
| undo | **YES** (one atomic command) |
| persistence | DOCUMENT |
| error | import report + retry (REQ-SYS-009) |
| cancellation | SYS-27 (STM-JOB cancel) |
| UI | import report; placed instance (stage) / asset added (library) |
| testId | T-import-stage / T-import-library |

### 6.2 Export

| Field | Value |
|---|---|
| menu entry | File ▸ Export ▸ (Image/Video/GIF/Movie/Sequence) |
| commandId | `file.export(format)` |
| precondition | doc open |
| handoff target | **SYS-27** MOD-EXPORT |
| input | format |
| result event | `export:done{format, path}` |
| dirty impact | **none** (non-mutating) |
| undo | no |
| persistence | output file (no state) |
| error | log + retry (STM-EXPORT FAILED) |
| cancellation | SYS-27 |
| UI | toast + open-folder |
| testId | T-export |

### 6.3 Publish

| Field | Value |
|---|---|
| menu entry | File ▸ Publish Settings / Publish / Publish Profiles |
| commandId | `file.publishSettings()` / `file.publish()` / `file.publishProfiles()` |
| precondition | doc open |
| handoff target | **SYS-27** MOD-EXPORT |
| input | settings/profile |
| result event | `export:done` (publish) |
| dirty impact | **none** |
| undo | no |
| persistence | profiles (SYS-27 owns boundary) |
| error | Output log (errors) |
| cancellation | SYS-27 |
| UI | Output log / dialog |
| testId | T-publish-* |

---

## 7. State Model

No SYS-02 state. H08 is pure handoff; the SYS-27 engine owns its own STM-EXPORT/STM-JOB state (eng 04). H08 observes the result via events.

---

## 8. Command / Control Contract

| Control | commandId | Trigger | Precondition | Enabled | Disabled reason | Handoff | Dirty | Undo | Persist | Error | testId |
|---|---|---|---|---|---|---|---|---|---|---|---|
| file.importStage | `file.import('stage')` | Ctrl+R | doc open | doc open | no document (disabled-by-context) | SYS-27 | YES | YES | DOCUMENT | report | T-import-stage |
| file.importLibrary | `file.import('library')` | Ctrl+I | doc open | doc open | no document (disabled-by-context) | SYS-27 | YES | YES | DOCUMENT | report | T-import-library |
| file.export | `file.export(format)` | Ctrl+Shift+R | doc open | doc open | no document (disabled-by-context) | SYS-27 | no | no | output | log | T-export |
| file.publishSettings | `file.publishSettings()` | Ctrl+Shift+F12 | doc open | doc open | no document (disabled-by-context) | SYS-27 | no | no | (SYS-27) | — | T-publish-settings |
| file.publish | `file.publish()` | Shift+Alt+F12 | doc open | doc open | no document (disabled-by-context) | SYS-27 | no | no | output | log | T-publish |
| file.publishProfiles | `file.publishProfiles()` | menu | doc open | doc open | no document (disabled-by-context) | SYS-27 | no | no | (SYS-27) | — | T-publish-profiles |

(Open External Library = `file.openExternalLibrary` → SYS-18, already specified in H02/H01 context — NOT re-specified here.)

---

## 9. Event Propagation

| Handoff | Event | Payload | Consumers |
|---|---|---|---|
| Import | `library:changed` + `document:changed` | asset/doc | Library panel, stage |
| Export | `export:done` | `{format, path}` | status bar (st.export), Output log |
| Publish | `export:done` | — | Output log |

**Event ownership (binding — do NOT promote downstream events into SYS-02 constitutional events):**
- `library:changed` = **SYS-18** library subsystem event (asset CRUD), NOT a SYS-02 event.
- `document:changed` = **SYS-01 §27.1** document-mutation event (Command post-do), NOT a SYS-02 event.
- `export:done` = **SYS-27** export event (STM-EXPORT complete), NOT a SYS-02 event.

H08 is a handoff-only contract: it observes these downstream events as the RESULT of the handoff. It neither owns nor emits them; it never re-emits them as new SYS-02 constitutional events (FL-0007/0008).

---

## 10. Undo / Persistence

- Import: DOCUMENT MUTATION, undoable (one atomic command), DOCUMENT.
- Export/Publish: NON-MUTATING, no undo, output file.
- Publish profiles: SYS-27 owns boundary (not H08).

---

## 11. Error / Failure

| Failure | Feedback | State | Recover |
|---|---|---|---|
| import fail | import report + retry | unchanged | retry |
| export fail | log + retry (STM-EXPORT FAILED) | unchanged | retry |
| publish error | Output log | unchanged | fix settings |
| engine unavailable | honest "engine not attached" | unchanged | reload |
| cancel | safe partial cleanup (SYS-27) | unchanged | — |

---

## 12. Accessibility

Menu items: role=menuitem, shortcuts announced. Progress (import/export) announced via aria-live.

---

## 13. Edge-Case Matrix

| # | Case | Expected | Owner | testId |
|---|---|---|---|---|
| 1 | import with no doc | disabled-by-context | H08 | T-import-no-doc |
| 2 | import success | asset added, dirty | SYS-27/H08 | T-import-ok |
| 3 | import fail | report + retry | SYS-27 | T-import-fail |
| 4 | import cancel | safe partial | SYS-27 | T-import-cancel |
| 5 | export success | file written, no dirty | SYS-27 | T-export-ok |
| 6 | export fail | log + retry | SYS-27 | T-export-fail |
| 7 | export no dirty | document stays clean/dirty unchanged | H08 | T-export-no-dirty |
| 8 | publish success | output, no dirty | SYS-27 | T-publish-ok |
| 9 | publish error | Output log | SYS-27 | T-publish-error |
| 10 | engine unavailable | honest message | H08/SYS-27 | T-handoff-engine-unavailable |

---

## 14. Cross-Handoffs

| Producer → H08 | H08 response |
|---|---|
| SYS-27 import engine | result events (library/document:changed) |
| SYS-27 export engine | `export:done` |
| H04 dirty | import dirties; export/publish don't |

H08 never implements SYS-27 internals (FL-0016).

---

## 15. Dead-Control Audit

All 6 controls real handoffs. No dead control. No fake export/import.

---

## 16. Ownership Audit

| Concern | Owner |
|---|---|
| handoff contract | H08 |
| import/export/publish engines | **SYS-27** |
| persistence | SYS-28 |
| Open External Library | SYS-18 (via H02/H01) |

---

## 17. Forensic Pre-Flight

Lessons: FL-0001..0030. Checks: scope ✓ (handoff only) · ownership ✓ (no SYS-27 absorb; downstream events not promoted to SYS-02) · events ✓ (`export:done`/`library:changed`/`document:changed` classified by owner) · dirty ✓ (import dirty, export/publish not) · undo ✓ (import undoable, export/publish not) · edge ✓ · code-authority ✓ (export-image only = gap).

---

## 18. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) H08 implementing SYS-27 engines | scope | RESOLVED — handoff only |
| F2 | (risk) export/publish marking dirty | dirty | RESOLVED — non-mutating (H00 §7) |
| F3 | (risk) import not undoable | undo | RESOLVED — one atomic command (SYS-02 §17) |

---

## 19. Ambiguity Register

None — handoff contracts are fully established; SYS-27 owns the deep flow (documented in SYS-27, not H08). Zero implementation-critical ambiguity.

---

## 20. Test ID Matrix

T-import-no-doc · T-import-ok · T-import-fail · T-import-cancel · T-export-ok · T-export-fail · T-export-no-dirty · T-publish-ok · T-publish-error · T-handoff-engine-unavailable

---

## 21. Completion Checklist

- [x] handoff contracts (import/export/publish) complete
- [x] SYS-27 ownership respected (no internals absorbed)
- [x] dirty/undo/persistence classification correct
- [x] events correct (export:done, library/document:changed)
- [x] error/cancellation defined
- [x] no dead controls
- [x] 10 edge cases
- [x] lessons pre-flight passed

---

## 22. Final H08 Report

STATUS: **READY FOR IMPLEMENTATION** · Controls: 6 · Commands: 6 · States: 0 (SYS-27 owns) · Edge cases: 10 · Ambiguities: 0 · Findings: 3 (resolved).

---

*H08 done. Batch complete — final cross-H audit follows.*
