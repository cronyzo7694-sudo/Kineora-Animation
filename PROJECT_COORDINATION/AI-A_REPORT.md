# AI-A REPORT — Session following LEADER_ORDERS (2026-08-22)

**Worker:** AI-A  
**Ownership:** SYS-01 … SYS-07 (forensic / spec)  
**Date (IST):** 2026-08-22  
**HEAD seen at check-in:** `bc12025` → fast-forwarded to `46d3b9e` (AI-C SYS-16 `layer:changed` + drag-through; `animator/` not touched by this session)  
**Repo:** `https://github.com/cronyzo7694-sudo/Kineora-Animation` (`main`)  
**Leader document:** `PROJECT_COORDINATION/LEADER_ORDERS.md` (issued at `c648fbf`)

---

## 0. Attendance + mandatory reading

| Step | Result |
|---|---|
| Fetch `origin/main` | `bc12025` = `origin/main` (clean) |
| ATTENDANCE check-in | Session 1 row added — PRESENT — FOLLOWING LEADER_ORDERS |
| FL-0001..0034 | Read (`FORENSIC_SPECS/AI01_FORENSIC_LESSONS.md`) |
| MASTER_EXECUTION_PLAN | Read |
| CROSS_SYSTEM_CONTRACT | Read |
| FOUNDATION_CONTRACT | Read |
| AI_ASSIGNMENTS | Read |
| DECISIONS / BLOCKERS / INTEGRATION_LOG / CHANGELOG / PROJECT_BOARD | Read |
| LEADER_ORDERS | Read — this is the assignment |
| Blueprint 01 / 29 / 30 / 32 / 33 | Read for owned SYS + SYS-04 |
| Phase-2 F-01-06 / F-01-17 | Read (`F-01-01_application_map/00_full.md`) |
| C-03 | Read |
| Engineering 03 / 05 / 11 / 13 | Consulted |

**This session MUST NOT modify `animator/`.** Audit is report-only. Implementation remains worker-territory per Leader / `AI_ASSIGNMENTS.md`.

---

## 1. Assignment (verbatim intent)

1. **FIRST deliverable:** SYS-01 / SYS-02 / SYS-03 spec-vs-implementation-vs-test reconciliation vs FINAL_GATE_REPORT §3 (8 user-observed save/identity failures). Gap table uses **PASS / FAIL / NOT-TESTED / SPEC-ONLY**. Cite file:line. Zero invented product decisions.
2. **SECOND deliverable:** forensic spec increment for **SYS-04 View** (Blueprint 01 §1.2.3 / §1.4.3 / §1.4.4, F-01-06 / F-01-17, C-03).
3. Do **not** claim SYS-03 COMPLETE.
4. Do **not** modify another worker’s SYS or `FOUNDATION_CONTRACT.md`.

---

## 2. Honest status of Leader’s “SYS-03 is ABSENT” sentence

`LEADER_ORDERS.md` was written against remote `dd2f37d` / `c648fbf`. After that, two AI-A commits landed on `main`:

| Hash | Subject |
|---|---|
| `d4b1861` | `feat(sys03-06): object clipboard, view overlays, transform/arrange/align` |
| `bc12025` | `fix(sys03): align clipboard with official H02 — app-level, edit.delete, paste targets` |

Those commits are **evidence**, not authority (FL-0017). They make “SYS-03 implementation is ABSENT” **stale**. This audit reports the **current** tree.

**SYS-03 is PARTIAL. It is not ABSENT. It is not COMPLETE. It is not MANUALLY ACCEPTED.**

A previous AI-A session also treated AI-A as an implementation worker and wrote `animator/` code. That contradicts `AI_ASSIGNMENTS.md` (AI-A writes `FORENSIC_SPECS/SYS-01..07`, not `animator/`). **This session follows Leader orders:** specs + audit only. Prior code is left in place and cited as evidence.

`FINAL_GATE_REPORT.md` §2–§3 is also stale (written when rustc was absent and code was labelled single-Session / `downloadBlob`-only). Re-traced below against `bc12025`.

---

## 3. Verdict vocabulary (this report)

| Verdict | Meaning |
|---|---|
| **PASS** | Spec, current impl, and an automated test agree. Does **not** mean native-desktop acceptance (FL-0019). |
| **FAIL** | Current impl contradicts the spec (or a locked event/command contract). |
| **NOT-TESTED** | Behavior is specified and/or implemented, but no automated test covers it, **or** the original user failure cannot be closed without native QA. |
| **SPEC-ONLY** | Spec exists; no implementation of that behavior. |

Global (all three SYS): **`wasm-pack` / `tauri` / native desktop were not run this session.** Manual acceptance = PENDING. Automated green ≠ COMPLETE (FL-0018/0019).

---

## 4. SYS-01 — Application / Workspace

**SPEC:** `FORENSIC_SPECS/SYS-01_application_workspace.md` v5 **LOCKED**.  
**SPEC §34 is a stale snapshot** (claims no tabs, no palette, `nav.back` dead stub). Code has moved. §34 is evidence-of-an-older-tree, not a reason to weaken the spec (FL-0017). SYS-01 is **not** regenerated this session (MASTER_EXECUTION_PLAN §H: LOCKED).

Known stale spec notes (already in INTEGRATION_LOG): SYS-01 §30 `File▸Close → tab.close(id)` should be `file.close()` (INT-0004).

### 4.1 Feature gap table

| # | Concern | SPEC | IMPL (evidence) | TEST | Verdict |
|---|---|---|---|---|---|
| 1 | 8-region shell | §1.1.1 / §25 A1 | `App.tsx` hosts menu, stage, timeline, tools, properties, library, status, edit-bar | `sys01.test.tsx` | **PASS** (partial chrome; see dock) |
| 2 | MOD-BUS + locked events | §27.0/§27.1 | `animator/ui/src/bus.ts` (incl. `openSet:changed`, `saving:changed{state,time?}`, `selection:changed`) | `bus.test.ts`, H02/H04/H05 suites | **PASS** (transport). Payload completeness of `selection:changed` still partial — see SYS-03 #12 |
| 3 | Panel show/hide | §15 `panel.show/hide(id)` | Commands are `panel.layers` / `panel.properties` / … calling `togglePanel` (`commands.ts:1625–1675`, `App.tsx:197`) — **not** the locked `panel.show(id)` / `panel.hide(id)` IDs | `sys01.test.tsx` reopen via Window menu | **FAIL** (commandId drift vs §15/§30) |
| 4 | Panel dock/float/tab/drag lifecycle | §6.1 / §29 | Right-dock resize exists (`panelLayout.ts`, `App.tsx:483`). Full dock-zones / float / prevent-dock / blur-cancel **not** found | `panelLayout.test.tsx`, `panelMath.test.ts` (resize math) | **SPEC-ONLY** for float/dock-zones; resize **PASS** |
| 5 | Workspace save / load / reset | §6.2 / §15 | `workspace.ts` `kineora.workspace`; `workspace.saveCurrent` / `saveNew` / `load`; `window.resetWorkspace` (`commands.ts:1678–1708`) | `workspace.test.ts` | **PASS** (named-preset UI still thin; `window.workspacePresets` DEFERRED `:1711`) |
| 6 | Document tabs + activation | §6.3 / H02 owns semantics | `DocumentTabs.tsx`; `tab.activate` / `tab.close`; `openSet:changed` then `activeDoc:changed` (`file.ts:305–338`) | `h02.test.tsx` | **PASS** (semantics = SYS-02; chrome = SYS-01) |
| 7 | Scene tabs (W12) | §6.3 `scn.tabs` | **No** `SceneTab` / `scn.tabs` in `animator/ui/src` | — | **SPEC-ONLY** |
| 8 | Status 12 cells | §6.4 / C-05 | All 12 testids present in `StatusBar.tsx:47–101`. `st.recording`, `st.export`, `st.mode` render honest `—`. `st.snap` hard-codes `"snap off"` (`:98–100`) — not bound to a snap engine | `h11.test.tsx` (st.saving live) | **PASS** for cells existing; **FAIL** for `st.snap` (fake static, not a projection of snap state) |
| 9 | Command palette Ctrl+K | §6.5 / D-3 | `palette.open` (`commands.ts:1773`); `CommandPalette` in `App.tsx:659` | `CommandPalette.test.tsx` | **PASS** |
| 10 | `nav.back` → `edit.exitOneLevel` | §6.6 / G4 (was dead stub in §34) | `edit.exitOneLevel` FUNCTIONAL, enabled iff `editDepth()>0` (`commands.ts:1722–1730`). Hidden at root (`App.tsx:87`) | `sys01.test.tsx:156` | **PASS** vs the locked fix contract. Symbol-edit depth itself is SYS-19 (often 0) |
| 11 | Properties shortcut F4 | §9 F4 → `panel.show/hide('properties')` | Impl shortcut is `Ctrl+F3` (`commands.ts:1638`) | — | **FAIL** (shortcut drift) |
| 12 | Responsive / mobile sheets | §25 H2 | Desktop-only layout | — | **SPEC-ONLY** |
| 13 | Toolbar overflow | §25 G3 | Not found as specified overflow menu | — | **SPEC-ONLY** |
| 14 | Theme tokens | §1.1.4 | CSS variables used (e.g. MenuBar tokens) | H11 visual tests | **PASS** (partial coverage) |

**SYS-01 honest roll-up:** SPEC LOCKED. IMPL **partial** (shell + bus + tabs + palette + workspace prefs + status cells). **Not COMPLETE.** Manual QA PENDING. Do not treat §34 as current impl truth.

---

## 5. SYS-02 — File

**SPEC:** `FORENSIC_SPECS/SYS-02/` H00–H14 + consolidated `SYS-02_file.md`.  
H01 **REVISION REQUIRED** (AMB-H01-002/003). H07 **REVISION REQUIRED** (AMB-H07-001). Others READY (spec).

Impl is **not** the single-Session / pathless-only tree described in FINAL_GATE_REPORT §3. `DocManager` exists (`animator/core/src/doc_manager.rs`, `lib.rs:9`). Dirty is snapshot-based (`command.rs:49–126`, `session.rs:2073–2082`). Save path identity is an in-memory `Map` (`file.ts:115–122`).

### 5.1 H-part gap table

| H | Spec status | IMPL | TEST | Verdict |
|---|---|---|---|---|
| H00 constitution | COMPLETE (spec) | Dirty/identity/lifecycle encoded in `command.rs` History + `file.ts` + `doc_manager.rs` | Cross-cutting H01–H07 suites | **PASS** as foundation-in-code; spec file still says IMPLEMENTATION STATUS NOT IMPLEMENTED (stale label) |
| H01 New + templates | REVISION REQUIRED | `NewDocumentDialog.tsx` + `file.new` / `file.newFromTemplate` / `file.saveAsTemplate` | `NewDocumentDialog.test.tsx`, `h01.test.tsx` | **PASS** for wired dialog; **SPEC-ONLY** for AMB-H01-002/003 (open — not invented) |
| H02 multi-doc tabs | READY | `DocManager` + `DocumentTabs.tsx` + `openSet:changed` | `h02.test.tsx` | **PASS** |
| H03 tab context / destructive | READY | Tab context Close → `tab.close(docId)` | `h03.test.tsx` | **PASS** |
| H04 dirty + guard | READY | `History.is_dirty` snapshot; tab ●; Close guard DIRTY-only | `h04.test.ts`, `h04-ui.test.tsx` | **PASS** (automated). Native **NOT-TESTED** |
| H05 Save / Save As / path | READY | Desktop: `pickSavePath` + `writeProject` + `docPaths`. Browser: pathless download (`file.ts:229–280`) | `h05.test.tsx`, `platform.test.ts` | **PASS** desktop contract in code; browser path identity **FAIL** vs H05 (honest F3 gap in `file.ts:257–259`) |
| H06 Open / Open Recent | READY | `file.open` reused; `kineora.recentFiles` localStorage (`file.ts:410–487`) | `h06.test.tsx`, `h09.test.tsx` | **PASS** automated. Store API = AMB-003 still OPEN (impl used localStorage — evidence, not a resolution) |
| H07 Close / Close All / Exit | REVISION REQUIRED | Sequential Close All (`file.ts:353+`, `App.tsx:94`) | `h07.test.tsx` | **PASS** for sequential guard; **SPEC-ONLY** for next-active rule (AMB-H07-001 — impl picked a successor; not authorized as the decision) |
| H08 import/export handoff | READY (handoff) | Handoff toasts / `file.import` / `file.export` — engines SYS-27 | `h12.test.tsx` | **PASS** as handoff (not engines) |
| H09 commands/menus/shortcuts | READY | `commands.ts` + `menus.ts` File group | `h09.test.tsx`, `menus.test.ts` | **PASS** |
| H10 persistence/recovery | READY (handoff) | Comments only for autosave/recovery (`file.ts:183–191`). `formatVersion` **absent** from `Document` (`model.rs:369–380`) | — | **SPEC-ONLY** (SYS-28). P-9 still a gap |
| H11 visual/a11y/error | READY | tokens + `st.saving` aria-live | `h11.test.tsx` | **PASS** automated |
| H12 matrix | READY | tests assert chains | `h12.test.tsx` | **PASS** as test matrix |
| H13/H14 QA + recon | spec only | — | native not run | **NOT-TESTED** (manual) |

### 5.2 The 8 user-observed failures (FINAL_GATE_REPORT §3) — re-trace

| # | Failure | SPEC | IMPL now | TEST | Verdict |
|---|---|---|---|---|---|
| 1 | Save → dirty ● stays | H04 T3: `saving:changed{saved}` + snapshot CLEAN | `markClean()` then `saving:changed{state:'saved', time}` (`file.ts:291–292`); tab ● from `d.dirty` | `h04-ui.test.tsx` T-dirty-*; `h05.test.tsx` dirty→false | **PASS** automated. **NOT-TESTED** on native desktop (original report) |
| 2 | Same-name docs/tabs confusing | H00 §5 titles display-only; **AMB-H05-002** OPEN (disambiguation) | Multi-doc tabs show title only (`DocumentTabs.tsx`). No path tooltip / `(2)` disambiguation found | Multi-doc tests exist; **no** disambiguation test | **SPEC-ONLY** for disambiguation (AMB open — not invented). Duplicate titles **PASS** as allowed |
| 3 | Save As → later Save writes wrong file | H05 §6: Save As changes path; Save writes new path | Desktop: `setDocPath` then overwrite `knownPath` (`file.ts:251, 271–276`). Browser: no path | `h05.test.tsx` | Desktop contract **PASS** automated. Browser **FAIL** vs H05. Native path **NOT-TESTED** |
| 4 | After successful Save, Close still asks | H04/H07: CLEAN → close direct | Guard is DIRTY-only (`App.tsx:259–264`, `file.ts:7–9`); Save calls `markClean` | `h04-ui.test.tsx` T-guard-save; `h07.test.tsx` | **PASS** automated. Native **NOT-TESTED** |
| 5 | Save As identity not shown | H05 §7.1 tab re-reads title on `saving:changed{saved}` | `setDocTitle` from filename (`file.ts:255, 290`) — uses AMB-H05-001 *recommendation*, still OPEN | `h05.test.tsx` | **NOT-TESTED** as a product decision (AMB-H05-001). Impl exists as provisional |
| 6 | New-doc Create / Enter fails | H01 §5.2 Enter=Create, Esc=Cancel | `NewDocumentDialog.tsx:96–100, 218` Enter/submit; tests `NewDocumentDialog.test.tsx:103` | dialog + `h01.test.tsx` | **PASS** automated. Native **NOT-TESTED** |
| 7 | Open Recent hover stays highlighted | SYS-01 §28 hover + H06 | `MenuBar.tsx:297–303` `mouseEnter` sets hoverBg, `mouseLeave` clears | Open Recent functional tests; **no** hover-clear test | **NOT-TESTED** (impl looks correct; no test; no native QA) |
| 8 | Undo/Redo/Edit need real verification | SYS-03 H01 | History engine exists (`command.rs:46–136`, `session.rs:2062–2092`). Object clipboard exists (`edit_ops.rs`). History **panel** absent. `prevSelection` absent | `edit_ops.rs` tests; H04 copy-is-not-mutation; no History-panel tests | See SYS-03 table. As a user-failure row: **NOT-TESTED** native |

**None of the 8 may be declared user-accepted.** Several are no longer “impl-absent”.

### 5.3 Identity / persistence residuals (not invented)

| Gap | Spec | Code | Status |
|---|---|---|---|
| `formatVersion` | Part 33 §33.1 / P-9 | Still **not** on Rust `Document` (`model.rs`). After this audit’s first draft, AI-D `8656ac1` stamped `formatVersion` in the TS write seam (`persist.ts`) — SYS-28 evidence, not a SYS-02 close. Rust `persist.rs` still lacks the field | IMPL-GAP (SYS-28; PARTIAL after `8656ac1`) |
| ID type UUID | Part 33 / P-10 | `u64` (`id.rs` / `NodeId`) | IMPL-GAP (foundation F-1) |
| Duplicate-ID recovery | AMB-002 | Not implemented | OPEN |
| Recent-list store | AMB-003 | `localStorage` `kineora.recentFiles` | OPEN (impl is evidence) |
| Tauri accelerators | AMB-004 | Desktop README mentions wiring | OPEN |
| Next-active after close | AMB-H07-001 | Engine picks a successor (`file.ts:336–337`) | OPEN — do not promote impl to spec |

---

## 6. SYS-03 — Edit

**SPEC:** `FORENSIC_SPECS/SYS-03/` 00 + H00–H07. H02 **REVISION REQUIRED** (AMB-S03-003 only). Spec files still say IMPLEMENTATION STATUS: NOT IMPLEMENTED (written pre-`d4b1861`).

**Do not claim COMPLETE.**

### 6.1 Feature gap table

| # | Concern | SPEC | IMPL | TEST | Verdict |
|---|---|---|---|---|---|
| 1 | Undo / Redo engine | H01 / eng 05 `Command{do,undo,…}` | `trait Command { label, apply, revert }` (`command.rs:40–44`). **No** `prevSelection`, `canCoalesce`, `affected[]`, bound-100 | Session undo/redo used across core tests | **FAIL** vs eng 05 / INV-EDIT-2 (prevSelection). Basic undo/redo **PASS** as a subset |
| 2 | Redo invalidation | H00 §5.2 | `execute` clears redo (`command.rs:74`) | core history tests (via commands) | **PASS** |
| 3 | Save does not clear History | INV-UNDO-1 | `mark_clean` does not touch stacks (`command.rs:121–126`) | H05 undoLen preserved in fakes; rust History | **PASS** |
| 4 | History panel + `history.jump` | H01 / Part 32.18 | **No** History panel / `history.jump` | — | **SPEC-ONLY** |
| 5 | `edit.cut` | H02 §5 | `edit.cut` FUNCTIONAL (`commands.ts:548`) + rust cut | `animator/core/tests/edit_ops.rs`; `sys03-06.test.tsx` | **PASS** automated |
| 6 | `edit.copy` (no mutation/event) | H02 §6.2 | Copy writes app clipboard; no `document:changed` | `h04.test.ts` copy-is-not-mutation | **PASS** |
| 7 | `edit.paste('center'\|'place')` | H02 one commandId, two targets | `edit.paste` + `ctrl+shift+v` → `place` (`commands.ts:576, 1906`) | edit_ops + sys03-06 | **PASS** |
| 8 | `edit.paste('special')` | H02 §6.3b; format list **AMB-S03-003 OPEN** | **Not implemented** (correct — no invented format list) | — | **SPEC-ONLY** (blocked on AMB) |
| 9 | `edit.duplicate` +10 px | H02 AMB-S03-002 RESOLVED | Duplicate +10 in engine | edit_ops | **PASS** |
| 10 | `edit.delete` Delete/Backspace | H02 AMB-S03-004 RESOLVED | `edit.delete` + `backspace` alias (`commands.ts:597, 1907`) | edit_ops | **PASS** |
| 11 | Clipboard APPLICATION-level SESSION | H02 §4.1 / INT-0006 | `thread_local! APP_OBJECT_CLIPBOARD` (`edit_ops.rs:26–48`); New/Open must not clear | edit_ops cross-session tests | **PASS** |
| 12 | Unified object+frame clipboard slot | H02 §4.1 singular clipboard | Object clipboard app-level; `frame_clipboard` still on `Session` (SYS-15) | — | **SPEC-ONLY** / handoff — **not absorbed** (correct vs FL-0016) |
| 13 | `selection:changed` full payload | SYS-01 §27.1 / H00 §8 | `bus.ts:46–53` requires `prevTargets`+`targets`; `kind`/`commonType`/`bounds` optional | H04 selection tests partial | **FAIL** vs locked full schema (partial impl). Owner of complete MOD-SELECTION = SYS-14 |
| 14 | Select All / Deselect All | H03; locked/hidden respected | `edit.selectAll` / `edit.deselectAll` FUNCTIONAL (`commands.ts:625–636`) | sys03 / client tests | **PASS** (engine prune exists `session.rs:2055–2059`) |
| 15 | Find & Replace (5 targets) | H03 AMB-S03-005 RESOLVED | `edit.findReplace` **DEFERRED** (`commands.ts:647–651`) | — | **SPEC-ONLY** |
| 16 | INV-EDIT-2 prevSelection on undo | H00 / Part 36 §36.0.9 | Not on `Command` trait | — | **SPEC-ONLY** / **FAIL** if claiming H01 done |
| 17 | Preferences / shortcut editor entries | H04 handoff SYS-08 | `edit.preferences` DEFERRED; `help.shortcuts` FUNCTIONAL | — | handoff **PASS** as DEFERRED/honest |
| 18 | Split-on-cut raw shape | H02 §7 | Node is `Rect \| SymbolInstance` only (`model.rs:131–148`) — no raw-shape subobject | — | **SPEC-ONLY** (model gap; SYS-20) |

**SYS-03 roll-up:** H00–H07 **specified**. Clipboard + delete + select-all **implemented and unit-tested**. Find & Replace, History panel, prevSelection, Paste Special, unified frame slot, raw-shape split **not implemented**. **NOT COMPLETE. NOT ABSENT.**

---

## 7. Cross-cutting honesty

| Claim | Allowed? |
|---|---|
| SYS-01 COMPLETE | **NO** |
| SYS-02 COMPLETE | **NO** (AMBs + native QA + H10/SYS-28) |
| SYS-03 COMPLETE | **NO** |
| SYS-03 ABSENT | **NO** (stale Leader sentence; code exists) |
| SYS-04 spec READY FOR IMPLEMENTATION | **NO** — H02-style: several AMBs remain (see SYS-04 package) |
| Native runtime accepted | **NO** (BLK-008 still OPEN) |

---

## 8. SECOND deliverable — SYS-04 View spec increment

Created (new, AI-A owned):

```
FORENSIC_SPECS/SYS-04/
  00_SCOPE_AND_DECOMPOSITION.md
  H00_VIEW_CONSTITUTION.md
  H01_ZOOM_VIEWPORT.md
  H02_PREVIEW_WORKAREA.md
  H03_RULERS_GRID_GUIDES.md
  H04_SNAPPING.md
  H05_MENU_SHORTCUTS.md
  H06_UI_ENGINE_MATRIX.md
  H07_QA_ACCEPTANCE.md
  H08_RECONCILIATION.md
```

Authority used: Blueprint 01 §1.2.3 / §1.4.1 / §1.4.3 / §1.4.4 / §1.17, Part 29.9, Part 30.1, Part 32.1, Part 33 (negative: no guides field), F-01-06 / F-01-17, C-03, C-05 `st.snap`, SYS-01 §18 / §27.1 `snap:changed`, D-3 (Ctrl+K = palette, not Align).

**No product decision invented.** Open items are AMB-S04-001..006 (see H00 §12). Existing `viewPrefs.ts` / `commands.ts` view IDs are **evidence only** (FL-0017) — cited in H08, not used to close AMBs.

SYS-05 / SYS-06 / SYS-07 forensic increments were **not** started (Leader: SYS-04 first; `00_SYSTEM_QUEUE.md` process: one named system then STOP). Prior `animator/` Insert/Modify/Text wiring remains evidence, not a spec.

---

## 9. Blockers raised this session (to AI-01)

| ID | Kind | Question | Blocks |
|---|---|---|---|
| AMB-S04-001 | product | Default grid cell size | grid default only (toggle still implementable) |
| AMB-S04-002 | product | Zoom In / Zoom Out / wheel step | zoom step |
| AMB-S04-003 | product | Ruler-guide persistence store (SESSION vs PREFS). DOCUMENT forbidden (Part 33 has no field) | guide survive-reload |
| AMB-S04-004 | product | Snap distance / tolerance | SnapEngine numeric |
| AMB-S04-005 | product | Pasteboard color UI + default hex (text only says “gray”) | pasteboard color control |
| AMB-S04-006 | product | Default ON/OFF for rulers, grid, guides, work area | initial prefs only |
| BLK-AIA-001 | process | Prior AI-A session wrote `animator/` contrary to `AI_ASSIGNMENTS` | informational — Leader should confirm whether those commits stay as evidence or need INT review |
| BLK-B-005 | security | PAT was pasted in chat in an earlier turn | human must rotate |

Also still OPEN (not re-litigated): AMB-H01-002/003, AMB-H07-001, AMB-S03-003, AMB-002/003/004, AMB-H05-001/002, P-9, P-10, BLK-008 native runtime.

---

## 10. Files touched this session

- `PROJECT_COORDINATION/ATTENDANCE.md` (own row)
- `PROJECT_COORDINATION/AI-A_REPORT.md` (this report)
- `PROJECT_COORDINATION/BLOCKERS.md` (append-only PART 5 — AI-A spec AMBs)
- `FORENSIC_SPECS/SYS-04/**` (new)

**Not modified:** `animator/**`, `FOUNDATION_CONTRACT.md`, other workers’ SYS specs, SYS-01 LOCKED body, SYS-02/SYS-03 H-files (stale “NOT IMPLEMENTED” labels left for Leader-controlled revision — FL-0017: we do not silently rewrite another author’s status line).

---

## 11. Tests / push

Docs-only session. No `cargo` / `vitest` required for this increment.  
Commit + push to `main` after rebase-check. Never force-push.

---

# SESSION 2 — DEEP COMPLETION (SYS-01 C-3) — 2026-08-22

**Worker:** AI-A  
**Human order:** DEEP COMPLETION ORDER (implementation; quality > speed). Overrides older `LEADER_ORDERS.md` “AI-A must not modify `animator/`” for this session only.  
**HEAD seen at check-in:** `da36772` (AI-01 INTEGRATED_AUDIT). Origin later moved to AI-C `0be97e5` (SYS-16 folders) — rebase before push.  
**BLK-AIA-001 posture:** Leader INTEGRATED_AUDIT §9 — `d4b1861` / `bc12025` **STAY as evidence**. Not reverted.

## S2.0 What this increment is

INTEGRATED_AUDIT **C-3** (owner SYS-01, MEDIUM):

> SYS-01 commandId drift — `panel.layers` / `panel.properties` / … instead of locked `panel.show(id)` / `panel.hide(id)`; F4 shortcut bound to Ctrl+F3; `st.snap` is a fake static string, not a projection of snap state.

**Not started this increment (intentionally):** SYS-02/03/04–07 implementation, C-2 `prevSelection`, SYS-05 spec, C-1 `formatVersion`. No invented AMBs.

## S2.1 Authority used

- FL-0001..0034 re-read (`AI01_FORENSIC_LESSONS.md`).
- SYS-01 v5 §7 / §9 / §15 / §27.1 / §30 (LOCKED).
- Phase 2.5 **C-09**: “F4 toggle (ours)”. Adobe Ctrl+F3 **loses**.
- C-06: Cmd+L Library · F4 toggle Properties.
- INV-CMD-4: one commandId, parameterized (same pattern as `edit.paste` / `file.import`).
- `snap:changed{mode}` already locked in SYS-01 §27.1 / `bus.ts`. SYS-04 SnapEngine = AMB-S04-004 **OPEN** — do not invent snap flags.

## S2.2 Implementation (evidence)

| Concern | Before | After |
|---|---|---|
| Window panel commandIds | `panel.layers` / `panel.properties` / `panel.library` / `panel.timeline` / `panel.tools` | **`panel.show(id)` / `panel.hide(id)`** only. `panel.debug` left to SYS-10 / AI-B. |
| F4 | bound to Ctrl+F3 on a per-panel command | alias `f4` → `panel.show` + input `properties`; dispatcher **toggles** |
| Ctrl+L / Ctrl+Alt+T / Ctrl+F2 | per-panel command shortcuts | aliases → `panel.show` + library/timeline/tools; Window menu + these keys **toggle** |
| Toolbar `panel.layers` etc. | were commandIds | **VIEW testids** projecting `runPanelToggle` (SYS-01 §30) |
| `st.snap` | hardcoded `"snap off"` | `"snap —"` until `snap:changed{mode}` arrives; then `snap ${mode}` |
| Panel × | `togglePanel(id)` | `panel.hide(id)` for layers/properties/library (spec §6.1 / §30). Debug × unchanged. |

Files: `commands.ts`, `shortcuts.ts`, `menus.ts`, `MenuBar.tsx`, `StatusBar.tsx`, `controlRegistry.ts`, `App.tsx` + tests listed in S2.4.

## S2.3 Honest leftovers (SYS-01 still PARTIAL)

| Gap | Status |
|---|---|
| Scene tabs (`scn.tabs`) | SPEC-ONLY |
| Dock / float / drag lifecycle | SPEC-ONLY (resize exists) |
| Responsive / mobile sheets | SPEC-ONLY |
| Toolbar overflow | SPEC-ONLY |
| Palette discoverability of “Layers” / “Toggle Properties” | weaker — palette lists `Show Panel` / `Hide Panel` (one commandId). Searching “Layers” no longer hits a dedicated command. Not a second commandId (INV-CMD-4). |
| Native / Tauri / Rust | **NOT TESTED — TOOLCHAIN/ENVIRONMENT BLOCKER** (no rustc/cargo/wasm-pack/tauri this session). BLK-008 still OPEN. |
| C-2 `prevSelection` | OPEN — SYS-03 / foundation. Not started. |
| C-1 `formatVersion` in Rust `Document` | SYS-28 + foundation. Not absorbed. |

**SYS-01 status language:** **AUTOMATED TESTED / PARTIAL**. **Not COMPLETE.** Manual QA PENDING (FL-0018/0019).

## S2.4 Tests run this increment

- Focused C-3 files: **99/99** PASS. Full UI suite: **51 files, 698/698** PASS (was 697 + Ctrl+L toggle).
- New / updated assertions: F4 toggles Properties; Ctrl+L toggles Library; no `panel.layers` command; `st.snap` default `"snap —"` and projects `snap:changed{mode:'grid'}`; Open Recent hover-clear (FINAL_GATE §3 #7); Window menu testids `menu-item-panel.show-*`.
- `tsc --noEmit` **PASS**.
- **Native desktop / cargo / wasm-pack / tauri:** **NOT TESTED — TOOLCHAIN/ENVIRONMENT BLOCKER**.

## S2.5 Cross-SYS

No new event. `st.snap` **consumes** existing `snap:changed{mode}` (SYS-01 §27.1). SYS-04 remains the producer when SnapEngine exists. `panel.debug` not absorbed.

**INT-AIA-002:** while rebasing onto AI-B `7ebc3cc`, F4 was claimed by SYS-11 `window.hideAllPanels`. Authority: C-09/C-06/SYS-01 §9 lock F4 to Properties; Blueprint is silent. Hide All command + menu **kept**; F4 **not** moved. No invented replacement shortcut.

## S2.6 Coordination files this increment

- `ATTENDANCE.md` — session 2 row (already present).
- `AI-A_REPORT.md` — this section (audit tables above preserved).
- `CHANGELOG.md` — C-3 entry.
- `PROJECT_BOARD.md` — SYS-01 IMPL note only.

**Not modified:** `FOUNDATION_CONTRACT.md`, SYS-08..28 product code, other workers’ report bodies, SYS-01 LOCKED spec body.

---

# SESSION 3 — DEEP COMPLETION (SYS-03 C-2 prevSelection) — 2026-08-22

**HEAD at check-in:** `dbf520e` (C-3 on origin/main).  
**Priority chosen:** INTEGRATED_AUDIT C-2 (HIGH foundation) after C-1 landed by AI-D. SYS-01 leftovers (dock/float/scene/responsive) remain SPEC-ONLY — not started this increment.

## S3.1 Research / audit

- eng 05 + SYS-03 H00/H01 INV-EDIT-2: `prevSelection` captured before do; undo/redo restore it.
- Existing `command.rs` comment already said Session captures/restores selection — **but Session only pruned deleted ids**. Comment ≠ impl (FL-0017).
- Putting `prevSelection` on every Command struct would duplicate 30+ impls. Smallest correct change: **HistoryEntry `{cmd, prev_selection, post_selection}`** owned by Session `exec` / `exec_then`.
- `affected[]` unused (dirty is snapshot H04). `canCoalesce` not invented (F5 coalesce specified but not this increment). History panel still SPEC-ONLY.
- Bound **100** = RSK-011 / eng 05 (not invented).

## S3.2 Implementation

| File | Change |
|---|---|
| `animator/core/src/command.rs` | `HistoryEntry`; `execute(doc, cmd, prev)`; `seal_last_post_selection`; undo/redo return `Option<Vec<NodeId>>`; `HISTORY_BOUND=100` |
| `animator/core/src/session.rs` | `exec` / `exec_then`; all 50 command sites; undo/redo restore snapshots |
| `animator/core/src/lib.rs` | export `HISTORY_BOUND` |
| `animator/core/tests/undo_selection.rs` | 8 tests (T-undo-selection / redo / view-only / delete / bound) |
| `animator/ui/src/engine/client.ts` | undo/redo emit existing `selection:changed{prevTargets,targets}` (H01 §9) |

## S3.3 Tests (updated session 4 after rebase onto `d491b4e`)

- Rust **331/331** including layers.rs **34/34** (INT-AID-004 resolved by AI-C) and undo_selection **11/11**.
- UI **740/740** (+4 `client.undoSelection.test.ts`). `tsc --noEmit` PASS.
- WASM / Tauri / native desktop: **NOT TESTED** (no wasm-pack rebuild; BLK-008). Stale wasm artifact will not expose the new restore until `npm run wasm`.

## S3.4 Status

SYS-03 = **AUTOMATED TESTED / PARTIAL**. INV-EDIT-2 prevSelection **implemented at Session/History**. Not COMPLETE (no History panel, no canCoalesce, no affected[], Paste Special AMB, Find & Replace).

---

# SESSION 5 — FORENSIC QA / REPAIR (no new features) — 2026-08-22

**HEAD at check-in:** `fe7566f` = origin/main (C-2). Working tree clean. Other AIs had not moved main.

## S5.1 Bugs found and fixed

| ID | Problem | Authority | Fix |
|---|---|---|---|
| BUG-AIA-F01 | `convert_selection_to_symbol` called `ensure_keyframe` on the document BEFORE History::execute — undo left an orphan keyframe on a hold | INV-EDIT-1 / REQ-SYS-002 | Auto-key moved into `ConvertToSymbol.apply`; revert removes created keyframe |
| BUG-AIA-F02 | Stage `selectAt`/`selectToggleAt`/`selectInRect` never emitted `selection:changed`; App did not tick on that event | SYS-01 §27.1 / H01 §9 / REQ-SEL-005 | Emit from client; App `setTick` on `selection:changed` |
| BUG-AIA-F03 | `cutObjects` emitted `document:changed` even when rust only copied (locked-only) | H04 / FL-0007 | Emit only when selection actually changed |

## S5.2 Escalated (not fixed)

- SYS-16 folder **lock** does not cascade (hide/outline do). No test. Owner AI-C / F-20-05.
- Browser Save path identity FAIL vs H05 (honest gap; AMB).
- History panel / `canCoalesce` / `affected[]` / Paste Special / Find & Replace / dock-float / scene tabs / SnapEngine AMBs.

## S5.3 Tests (this session, executed)

- Rust: **332/332** (was 331 + convert-on-hold).
- UI: **741/741** (55 files). `tsc --noEmit` PASS. `vite build` PASS.
- WASM / wasm-pack / Tauri / native: **NOT TESTED — TOOLCHAIN/ENVIRONMENT**.

No SYS COMPLETE.
