# H09 — FILE COMMANDS + MENUS + SHORTCUTS

## 1. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (scope-limited; see §16 cross-file blockers)
IMPLEMENTATION STATUS: **NOT IMPLEMENTED**

Revision: **H09-RELEASE** · Parent: **SYS-02 File System** · Constitution: **H00**

> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > H00 > prior H-files > Adobe (comparison) > code (evidence only).

---

## 2. Scope

H09 owns the **canonical SYS-02 command registry, the File-menu mapping, the keyboard-shortcut mapping, command ownership, target semantics, enable/disable conditions, and invocation equivalence** for every File-system command. It is the single source of truth for "one semantic action = one commandId = one owner".

H09 does NOT own: command PALETTE infrastructure (→ SYS-08/SYS-01) · tab STRIP chrome (→ SYS-01) · modal/menu chrome (→ SYS-01) · the engines behind each command (→ H01/H05/H06/H07/H08 + SYS-27/SYS-28) · edit-mode navigation commands (`edit.exitOneLevel`/`edit.exitRoot`, → SYS-19).

---

## 3. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Blueprint Part 01 §1.2.1 | File menu item list + per-item shortcuts + per-item action |
| SYS-02_file.md §7/§9/§15 | menu table (21 entries), shortcut table (13), command table (15 commandIds) |
| SYS-01 §9/§30 | shortcut precedence trees; command→control single-commandId mapping |
| H01–H08 | per-command semantics (already canonical; H09 re-registers, does NOT redefine) |
| H02/H07 | `tab.activate(docId)` / `tab.close(docId)` vs `file.close()` separation |
| engineering 05 (MOD-COMMAND) | Command interface; commands are the ONLY writer to MOD-DOC |
| AI01_FORENSIC_LESSONS.md | FL-0005/0010 (dead control), FL-0009 (ownership), FL-0016 (scope), FL-0020 (counting) |

---

## 4. H09–H14 Dependency Map (established before drafting)

| File | Inputs (consumes) | Outputs (provides to) |
|---|---|---|
| H09 | H01–H08 command semantics; SYS-01 §9/§30; Blueprint §1.2.1 | canonical registry → H12 (matrix), H13 (tests), H14 (coverage) |
| H10 | H05/H06 handoffs; H00 §14/§15; eng 13 | persistence/recovery boundary → H12, H14 |
| H11 | H00 §16/§17/§18; SYS-01 §28/§2/§21; C-35 | visual/a11y/error contracts → H13 (acceptance), H14 |
| H12 | H09 registry + H00–H11 | exhaustive control→engine matrix → H13, H14 |
| H13 | all T-* test IDs from H00–H12 | acceptance matrix → H14 |
| H14 | H00–H13 + sources | coverage proof + final gate |

Parallelism note: H09/H10/H11 are mutually independent (each reads H00–H08); H12 depends on H09–H11; H13 on H12; H14 on all.

---

## 5. Canonical Command Registry (authoritative — single source)

> "One semantic action = one commandId = one owner." Every File-system action resolves to exactly one of these. No alias is a separate command. No two commandIds share semantics. Names are identical everywhere (INV-CMD-4).

| # | commandId | Owner | Purpose | Target | Precondition |
|---|---|---|---|---|---|
| 1 | `file.new()` → `document.create(settings)` | H01/SYS-02 | create a new document | (new doc) | none |
| 2 | `file.newFromTemplate(templateId)` | H01/SYS-02 | seed a new doc from a template | (new doc) | template exists |
| 3 | `file.saveAsTemplate(name)` | H01/SYS-02 | persist current doc as a template | current doc | doc open |
| 4 | `file.open(path)` | H06/SYS-02 | load a project (also Open Recent — same ID) | (loaded doc) | path valid |
| 5 | `file.openExternalLibrary(path)` | SYS-18 (handoff) | open a `.fla` as an external library | library | valid lib |
| 6 | `file.save()` | H05/SYS-02 | serialize + write to current path | current doc | doc open |
| 7 | `file.saveAs()` | H05/SYS-02 | write to a NEW path | current doc | doc open |
| 8 | `file.close()` | H07/SYS-02 | close the ACTIVE document | active doc | doc open |
| 9 | `file.closeAll()` | H07/SYS-02 | close all open documents (per-doc guard) | all docs | ≥1 doc |
| 10 | `file.exit()` | H07/SYS-02 | quit the app (dirty guard) | app | — |
| 11 | `file.import(target)` | H08→SYS-27 | import to Stage / Library | doc | doc open |
| 12 | `file.export(format)` | H08→SYS-27 | render to a file (non-mutating) | doc | doc open |
| 13 | `file.publishSettings()` | H08→SYS-27 | open publish settings | doc | doc open |
| 14 | `file.publish()` | H08→SYS-27 | run publish pipeline | doc | doc open |
| 15 | `file.publishProfiles()` | H08→SYS-27 | manage publish profiles | doc | doc open |
| 16 | `tab.activate(docId)` → `activateDocument(docId)` | H02/SYS-02 | set the active document (VIEW) | doc | doc open |
| 17 | `tab.close(docId)` | H02/SYS-02 | close a TARGETED document (active or inactive) | doc | doc open |

**Distinct commandIds: 17.** `file.openRecent` is NOT a commandId (it reuses `file.open`). `file.airSettings`/`file.print`/`file.pageSetup` have NO commandId (HIDDEN controls, SYS-02 §6.1).

### 5.1 file.close() vs tab.close(docId) — intentionally distinct (re-verified, FL-0010)

| | `file.close()` | `tab.close(docId)` |
|---|---|---|
| Closes | the ACTIVE document | a TARGETED document (by stable Document ID) |
| Triggers | File ▸ Close / Ctrl+W | tab × affordance (D-7) / context-menu Close (H03) |
| Source | Blueprint §1.2.1 "Close = close active doc" | D-7 per-tab × + H03 |
| Relationship | = `Close(activeDocumentId)` | = `Close(docId)` |

Both run the SAME H07 §6 `Close(target)` flow (guard → remove → events). They MUST NOT be merged: closing an INACTIVE tab via `tab.close(docId)` must never close the ACTIVE document (QA failure #3 class). No drift.

---

## 6. File Menu Mapping (canonical)

> Menu chrome = SYS-01; menu CONTENT (SYS-02-owned items) = this table. Each menu entry maps to exactly one commandId (§5).

| Menu | Submenu | Item | Shortcut | commandId | Enabled | Classification |
|---|---|---|---|---|---|---|
| File | — | New… | Ctrl/Cmd+N | `file.new()` | always | REQUIRED |
| File | — | New from Template… | — | `file.newFromTemplate(templateId)` | always | REQUIRED |
| File | — | Open… | Ctrl/Cmd+O | `file.open(path)` | always | REQUIRED |
| File | Open Recent | (data-driven list) | — | `file.open(path)` (reuse) | ≥1 recent | REQUIRED |
| File | — | Open from Libraries… | Ctrl+Shift+O | `file.openExternalLibrary(path)` | always | HANDOFF (SYS-18) |
| File | — | Close | Ctrl/Cmd+W | `file.close()` | doc open | REQUIRED |
| File | — | Close All | — | `file.closeAll()` | ≥1 doc | REQUIRED |
| File | — | Save | Ctrl/Cmd+S | `file.save()` | doc open | REQUIRED |
| File | — | Save As… | Ctrl+Shift+S | `file.saveAs()` | doc open | REQUIRED |
| File | — | Save as Template… | — | `file.saveAsTemplate(name)` | doc open | REQUIRED |
| File | Import | Import to Stage… | Ctrl+R | `file.import('stage')` | doc open | HANDOFF (SYS-27) |
| File | Import | Import to Library… | Ctrl+I | `file.import('library')` | doc open | HANDOFF (SYS-27) |
| File | Import | Open External Library… | — | `file.openExternalLibrary(path)` | always | HANDOFF (SYS-18) |
| File | Export | Export Image/Video/GIF/Movie/Sequence | Ctrl+Shift+R | `file.export(format)` | doc open | HANDOFF (SYS-27) |
| File | — | Publish Settings… | Ctrl+Shift+F12 | `file.publishSettings()` | doc open | HANDOFF (SYS-27) |
| File | — | Publish | Shift+Alt+F12 | `file.publish()` | doc open | HANDOFF (SYS-27) |
| File | — | Publish Profiles | — | `file.publishProfiles()` | doc open | HANDOFF (SYS-27) |
| File | — | AIR Settings… | — | (none — HIDDEN) | — | HIDDEN |
| File | — | Print… | Ctrl+P | (none — HIDDEN) | — | HIDDEN |
| File | — | Page Setup… | — | (none — HIDDEN) | — | HIDDEN |
| File | — | Exit | Ctrl/Cmd+Q | `file.exit()` | always | REQUIRED |

**Menu entries: 21** (10 REQUIRED + 8 HANDOFF + 3 HIDDEN). "Open from Libraries" and "Open External Library" are 2 entries → 1 commandId (§5 #5). Separators = cosmetic `[INFERENCE]`, non-behavioral.

---

## 7. Keyboard Shortcut Registry (canonical)

| Shortcut | commandId | Precondition | Disabled | Text-input safety | Platform | Source | Final |
|---|---|---|---|---|---|---|---|
| Ctrl/Cmd+N | `file.new()` | none | never | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl/Cmd+O | `file.open()` | none | never | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+Shift+O | `file.openExternalLibrary()` | none | never | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl/Cmd+W | `file.close()` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl/Cmd+S | `file.save()` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+Shift+S | `file.saveAs()` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+R | `file.import('stage')` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+I | `file.import('library')` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+Shift+R | `file.export(format)` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+Shift+F12 | `file.publishSettings()` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Shift+Alt+F12 | `file.publish()` | doc open | disabled-by-context | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl/Cmd+Q | `file.exit()` | none | never | skip | Win/Mac | Part 01 §1.2.1 | REQUIRED |
| Ctrl+P | (none — Print HIDDEN) | — | — | — | — | Part 01 §1.2.1 | HIDDEN |

**Shortcut definitions: 13 · Required active: 12 · Hidden: 1.** No conflicts with SYS-01 (§9: Ctrl+K palette, Ctrl+L library, F4 properties, Ctrl+Alt+T timeline, Ctrl+J document settings, Ctrl+Enter) or SYS-04 (rulers = Ctrl+Shift+Alt+R, distinct from Ctrl+R). No shortcut is invented; all are Blueprint-sourced.

---

## 8. Command Ownership + Target Semantics

| commandId | Owner module | Target semantics | State mutation | Event(s) |
|---|---|---|---|---|
| `file.new()` | SYS-02 → MOD-DOC | (new doc) | new ENT-project + Session | `openSet:changed{added}` → `activeDoc:changed` |
| `file.newFromTemplate()` | SYS-02 → MOD-DOC | (new doc) | new seeded doc | `openSet:changed{added}` → `activeDoc:changed` |
| `file.saveAsTemplate()` | SYS-02 | current doc (non-doc write) | template record | — |
| `file.open()` | SYS-02 → SYS-28 | (loaded doc) | open-set + active | `openSet:changed{added}` → `activeDoc:changed` (already-open: `activeDoc:changed` only) |
| `file.openExternalLibrary()` | SYS-18 | library | ext lib ref | `library:changed` (SYS-18) |
| `file.save()` / `file.saveAs()` | SYS-02 → SYS-28 | current doc | SAVING→CLEAN | `saving:changed{saving|saved|error}` |
| `file.close()` | SYS-02 (H07) | ACTIVE doc | removed | `openSet:changed{removed}` → `activeDoc:changed{next|null}` |
| `file.closeAll()` | SYS-02 (H07) | all docs | removed (sequential) | `openSet:changed{removed}`×N → `activeDoc:changed{null}`×1 |
| `file.exit()` | SYS-02 (H07) | app | quit | — |
| `file.import()` | SYS-27 (handoff) | doc | mutation | `library:changed` + `document:changed` (SYS-27/18) |
| `file.export()` / `file.publish*()` | SYS-27 (handoff) | doc | non-mutating | `export:done` (SYS-27) |
| `tab.activate()` | SYS-02 (H02) | active pointer | VIEW | `activeDoc:changed{docId}` |
| `tab.close()` | SYS-02 (H02/H03) | targeted doc | removed | §6 of H07 |

---

## 9. Enable / Disable Conditions (canonical)

| Condition | Affected commands | State |
|---|---|---|
| NO_DOCUMENT | `file.save` `file.saveAs` `file.saveAsTemplate` `file.close` `file.import` `file.export` `file.publish*` `tab.activate` `tab.close` | **DISABLED-BY-CONTEXT** (reason: "no document") |
| NO_DOCUMENT | `file.new` `file.newFromTemplate` `file.open` `file.openExternalLibrary` `file.exit` | ENABLED |
| ≥1 doc | all doc-scoped commands | ENABLED |
| <1 recent entry | Open Recent submenu | DISABLED (reason: "no recent files") |
| Legacy | `file.airSettings` `file.print` `file.pageSetup` | HIDDEN (no dead control) |

`disabled ≠ hidden ≠ unavailable` (SYS-01 §28.3). No functional control is ever a silent no-op.

---

## 10. Invocation Equivalence (single commandId — INV-CMD-3)

| commandId | Menu | Shortcut | Tab UI | Context menu | Palette |
|---|---|---|---|---|---|
| `file.new()` | File ▸ New | Ctrl+N | — | — | "New document" |
| `file.open()` | File ▸ Open / Open Recent | Ctrl+O | — | — | "Open project" |
| `file.save()` | File ▸ Save | Ctrl+S | — | — | "Save" |
| `file.saveAs()` | File ▸ Save As | Ctrl+Shift+S | — | — | "Save As" |
| `file.close()` | File ▸ Close | Ctrl+W | — | — | "Close document" |
| `tab.close(docId)` | — | — | tab × | ctx Close | "Close tab" |

Every trigger path resolves to the SAME commandId; the command is implemented exactly once in its owning module. No duplicate paths.

---

## 11. Conflict Detection

- Shortcut uniqueness verified (§7 — no SYS-01/SYS-04 collisions).
- Command-ID uniqueness verified (§5 — 17 distinct; `file.openRecent` = reuse, `file.openExternalLibrary` shared across 2 menu entries).
- No command is reachable only via a dead path; every command has ≥1 visible trigger (§6/§7/§10).

---

## 12. Forensic Pre-Flight

**Lessons consulted:** FL-0001..0032 (all ACTIVE; FL-0032 most relevant — multi-doc relics).

**Checks passed:**
- [x] scope — registry only; engines/palette/chrome owned elsewhere — FL-0016
- [x] ownership — one owner per command — FL-0009
- [x] no dead control — every command has a visible trigger; HIDDEN items have no commandId — FL-0005/0010
- [x] no invented command/shortcut — all Blueprint-sourced — FL-0010
- [x] `file.close()` vs `tab.close(docId)` distinct, proven (§5.1) — FL-0010
- [x] counting — 17 commands, 21 menu entries, 13 shortcuts, all from tables — FL-0020
- [x] no code authority — no shortcut/command weakened to match `animator/` — FL-0017

---

## 13. Adversarial Audit Findings

| # | Finding | Type | Resolution |
|---|---|---|---|
| F1 | (risk) `file.openRecent` treated as a separate commandId | command drift | RESOLVED — reuses `file.open` (§5) |
| F2 | (risk) `file.close()` merged with `tab.close(docId)` | command drift | RESOLVED — distinct, proven (§5.1) |
| F3 | (risk) Print/Ctrl+P as a dead shortcut | dead control | RESOLVED — Print = HIDDEN (no commandId, no visible trigger) (§6/§7) |
| F4 | (risk) shortcut conflicts with SYS-01/SYS-04 | conflict | RESOLVED — none (§7) |

No manufactured findings.

---

## 14. Ambiguity Register

| AMB | Question | Owner | Critical? | H09 impact |
|---|---|---|---|---|
| AMB-H07-001 | next-active after closing the active doc | H07 | YES | `file.close()`/`tab.close(docId)`/`file.closeAll()` emit `activeDoc:changed{next}` — the `next` value is H07's unresolved rule; H09 references it, does NOT decide it |
| AMB-H01-002/003 | template name / seeded identity | H01 | YES | `file.saveAsTemplate`/`file.newFromTemplate` gate H01; H09 registers the commands but the ambiguities remain H01's |
| AMB-002/003/004 | collision recovery / recent store / Tauri | H10/H11 | YES | deferred to H10/H11 (H09 does NOT resolve) |
| AMB-H05-001 | title from filename | H05 | NO | recommendation only |

No H09-owned implementation-critical ambiguity. All cross-file ambiguities are owned by their H-files and correctly referenced (never resolved here).

---

## 15. Test ID Matrix

T-cmd-new · T-cmd-new-template · T-cmd-save-template · T-cmd-open · T-cmd-open-recent · T-cmd-open-ext-lib · T-cmd-save · T-cmd-save-as · T-cmd-close · T-cmd-close-all · T-cmd-exit · T-cmd-import · T-cmd-export · T-cmd-publish-settings · T-cmd-publish · T-cmd-publish-profiles · T-cmd-tab-activate · T-cmd-tab-close · T-cmd-single-id (one action = one commandId) · T-cmd-disabled-no-doc · T-cmd-hidden-print

---

## 16. Completion Checklist + Final Report

- [x] 17 canonical commandIds, one owner each
- [x] 21 menu entries mapped
- [x] 13 shortcuts (12 active + 1 hidden), no conflicts
- [x] `file.close()` vs `tab.close(docId)` distinct (proven)
- [x] enable/disable conditions + hidden states
- [x] invocation equivalence (single commandId)
- [x] no dead control, no invented command/shortcut
- [x] lessons pre-flight passed (FL-0001..0032)
- [x] cross-file ambiguities referenced, not resolved

STATUS: **READY FOR IMPLEMENTATION** · Commands: 17 · Menu entries: 21 · Shortcuts: 13 (12+1 hidden) · Ambiguities: 0 owned (4 cross-file referenced) · Findings: 4 (resolved).

> Cross-file blockers (do NOT block H09 itself, but block the relevant owners): AMB-H07-001 (H07), AMB-H01-002/003 (H01), AMB-002/003/004 (H10/H11).

---

*H09 done. Next: H10.*
