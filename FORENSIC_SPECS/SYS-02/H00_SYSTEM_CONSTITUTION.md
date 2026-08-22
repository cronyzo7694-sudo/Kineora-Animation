# SYS-02 H00 — SYSTEM CONSTITUTION

## 0. Document Status

SPECIFICATION STATUS: **COMPLETE** (forensic foundation — constitutional rules complete)
IMPLEMENTATION STATUS: **NOT IMPLEMENTED** (no software exists; SPEC ≠ IMPLEMENTED)

Revision: **H00**

Parent: **SYS-02 File System**

Purpose: Constitutional foundation for all SYS-02 parts (H01–H14).

> Authority order (locked, inherited from SYS-01/SYS-02): Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved Kineora decisions > official Adobe > current code. Code = `CURRENT IMPLEMENTATION STATUS` evidence only, never authority.

---

## 1. Scope

H00 governs the **constitution** of SYS-02 — the terminology, source/evidence policy, document identity/lifecycle/dirty/active models, multi-document + document-bound-UI invariants, destructive-safety, command/event/undo/persistence/error/visual rules, browser-vs-native rules, dependency boundaries, failure taxonomy, QA philosophy, and the global invariants that every later part (H01–H14) MUST obey.

H00 **DOES NOT implement or detail-specify**:
- the New Document dialog's exact field-by-field behavior (→ H01),
- the multi-document tab mechanics (→ H02),
- the tab context-menu item list (→ H03),
- the dirty-guard dialog wiring (→ H04),
- Save/Save-As file-writing mechanics (→ H05),
- Open/Open-Recent mechanics (→ H06),
- Close/Close-All/Exit mechanics (→ H07),
- Import/Export/Publish engines (→ H08, owned by SYS-27),
- the final menu/shortcut inventory (→ H09),
- persistence/autosave/recovery internals (→ H10, owned by SYS-28),
- concrete pixel/color values (→ H11, referencing SYS-01 design tokens),
- the full UI→engine matrix (→ H12),
- test scripts (→ H13),
- final reconciliation (→ H14).

H00 establishes **rules and boundaries only**. No scope creep.

---

## 2. Complete SYS-02 Part Map

| Part | Purpose | Depends on | Owns | Does NOT own | Later parts depending on it |
|---|---|---|---|---|---|
| **H00** | Constitution (this doc) | — | terminology, invariants, models, boundaries | all detail | H01–H14 all |
| **H01** | New Document + Dialog + Templates | H00 identity/lifecycle/visual | New dialog fields, defaults, validation, Create/Cancel; template mechanism | engine internals | H09, H13 |
| **H02** | Multi-Document + Tabs + Active Document | H00 active/inactive model, doc-bound UI | tab strip, active-doc switching, per-doc binding | SYS-01 tab chrome | H03, H07, H12 |
| **H03** | Tab Interaction + Context Menu + Destructive Safety | H00 destructive-safety invariants, H02 | tab left/right-click semantics, context menu, destructive guards | SYS-01 menu chrome | H07, H13 |
| **H04** | Dirty State + Unsaved Changes | H00 dirty constitution, lifecycle | dirty tracking, dirty indicator, unsaved guard decision contract | SYS-28 write internals; guard dialog chrome/a11y (H07/H06 + SYS-01) | H05, H07 |
| **H05** | Save + Save As + File Identity | H00 identity, persistence boundary, H04 | Save/Save-As menu wiring, path/identity handoff | SYS-28 atomic write | H09, H10 |
| **H06** | Open + Open Recent | H00 lifecycle (multi-doc Open = add+activate, no guard) | Open/Open-Recent wiring, validate→load handoff | SYS-28 load internals | H09, H10 |
| **H07** | Close + Close All + Exit + No-Document State | H00 lifecycle, H04, H03 | Close/Close-All/Exit wiring + no-doc empty state | SYS-01 tab chrome | H09, H13 |
| **H08** | Import / Export / Publish Handoffs | H00 command/event constitution | File-menu handoff entries | **SYS-27 engines** | H09, H12 |
| **H09** | File Commands + Menus + Shortcuts | H00 command/shortcut constitution | canonical command registry, menu tree, shortcut table | (registry infra = SYS-01) | H12, H13 |
| **H10** | Persistence + Recovery Boundaries + Cross-System Integration | H00 persistence boundary | SYS-02↔SYS-28 handoff contract | **SYS-28 internals** | H12, H14 |
| **H11** | Visual / Accessibility / Error / Edge States | H00 visual/error constitution, SYS-01 tokens | concrete state visuals, error surfaces, edge cases | color token definitions (SYS-01) | H13 |
| **H12** | End-to-End UI → Engine → State → UI Connection Matrix | H00 event/command constitution, H01–H10 | the full connection matrix | — | H14 |
| **H13** | Production QA + Manual Acceptance | H00 QA philosophy, H00 failure taxonomy | manual acceptance matrix, test IDs | — | H14 |
| **H14** | Final Reconciliation + Coverage Proof | H00 evidence map + all prior parts | coverage proof, ambiguity closure | — | — |

---

## 3. Evidence Map

> Every source below was actually read/verified. No fabricated section numbers. Where exact evidence could not be located, it is marked `[UNRESOLVED — MUST VERIFY IN LATER PART]`.

| Source | Relevant section | What it establishes | Strength | Affected H00 invariant |
|---|---|---|---|---|
| **Blueprint Part 01 §1.2.1** | File menu table | New/New-from-Template/Open/Open-Recent/Open-from-Libraries/Close/Close-All/Save/Save-As/Save-as-Template/Import/Export/Publish*/AIR/Print/Page-Setup/Exit + shortcuts | HIGH (primary) | identity, lifecycle, command, destructive |
| **Blueprint Part 01 §1.1.3** | Multi-document | multiple docs in tabs; per-doc Library/timeline; panels reflect **active** doc | HIGH | multi-doc, doc-bound UI |
| **Blueprint Part 01 §1.7** | Document settings | platform/W/H/fps/background/units; fps = frame grid | HIGH | identity (settings part of doc) |
| **Blueprint Part 33 §33.1** | Project schema | `{id, formatVersion, meta{title,author,createdAt,modifiedAt}, settings, scenes[], library[], brushes[], masterAudioTrack, preferences}` | HIGH | identity, persistence |
| **Blueprint Part 36 §36.0.10** | Crash-safety | `.autosave` + recovery + atomic write (SYS-28) | HIGH | persistence, error |
| **Blueprint W7 / W11** | wishlist | offline/local-first · autosave/recovery | HIGH | persistence, browser/native |
| **Phase 2 F-01-03** | Multi-document | tabs, active binding | HIGH | multi-doc |
| **Phase 2 F-01-04** | File menu | full File-menu feature set | HIGH | command |
| **Phase 2.5 C-02** | Shell | document tabs, dirty indicator, active-doc binding | HIGH | multi-doc, doc-bound UI, dirty |
| **Phase 2.5 C-03** | Menus | menu disabled-state rules | HIGH | command |
| **Phase 3 engineering 03** | ENT-project | settings default 1920×1080/px/24/#fff/1; w/h≥2; fps 1–120; lifecycle `created→edited→saved→archived` | HIGH | identity, lifecycle, dirty |
| **Phase 3 engineering 04** | STM-DIRTY | `CLEAN → DIRTY → SAVING → CLEAN \| ERROR`; close-with-DIRTY → confirm; forbidden: DIRTY→CLEAN without write | HIGH | dirty, lifecycle |
| **Phase 3 engineering 04** | STM-EDIT | symbol/group edit-depth (breadcrumb, Esc=1 level, Ctrl+Enter=root) | HIGH | (cross-ref, not SYS-02 core) |
| **Phase 3 engineering 13** | Persistence | atomic tmp→rename+checksum; autosave debounced; recovery; versioning; corruption | HIGH | persistence (SYS-28) |
| **Phase 3 REQ-DOC-001** | — | Document = ordered scenes + shared library + settings | HIGH | identity |
| **Phase 3 REQ-SYS-004** | — | stable IDs; names display-only; rename never breaks refs | HIGH | identity |
| **SYS-01 §27.1** | Event contract | locked events incl. `activeDoc:changed`, `saving:changed`, `document:changed`, `panel:changed` | HIGH | event/state propagation |
| **SYS-01 §17** | Undo model | 4 classes: DOCUMENT / WORKSPACE-VIEW / SESSION / PREFERENCE | HIGH | undo |
| **SYS-01 §18** | Persistence | 4 boundaries: DOCUMENT / PREFERENCES / SESSION / TEMPORARY | HIGH | persistence |
| **SYS-01 §28** | Control registry | FUNCTIONAL ⇒ commandId; disabled≠hidden≠unavailable | HIGH | command, visual |
| **SYS-01 §2/§21** | Design tokens | CSS-token theme (no hard-coded colors); concrete semantic-token enumeration deferred to H11 | HIGH | visual |
| **SYS-01 §21** | Ownership table | SYS-02 owns menu/lifecycle; SYS-27/SYS-28 = handoff | HIGH | dependency |
| **Existing SYS-02_file.md** | full | the prior consolidated spec (now superseded by H00–H14 but authoritative for resolved decisions P-1..P-10) | HIGH | all |
| **Current implementation** | `actions.ts`, `persist.rs`, `wasm.rs`, `ExportDialog.tsx`, `App.tsx`, `panelLayout.ts` | what exists vs spec (single Session, downloadBlob save, no dirty tracking) | EVIDENCE ONLY | — |
| **Official Adobe documents.html** | Save/Open/New | Save=overwrite; Save-As-compress (`[ADOBE — NOT IN BLUEPRINT]`); Save-As-Template (name/cat/desc ≤255); stage 1×1–2880 (`[ADOBE — NOT IN BLUEPRINT]` upper bound); autosave (CS5.5) | HIGH (verified) | identity, destructive |
| **Official Adobe publish-settings.html** | Publish | publish profiles document-level, `.APR` | HIGH (verified) | persistence (SYS-27) |
| **Manual QA failures (this prompt)** | — | New dialog unreadable; tab switching failed; right-click tab = accidental close; dependent tests untrusted; green≠product | HIGH (real observed) | visual, destructive, QA |

`[UNRESOLVED — MUST VERIFY IN LATER PART]` items:
- Exact native-desktop accelerator/menu wiring (Tauri) — verify in H10/H11.
- Exact recent-file persistence store API — verify in H06/H10.

---

## 4. Terminology (operational definitions)

| Term | Definition | Source |
|---|---|---|
| **Document** | An open Kineora project instance in memory: one ENT-project (id + settings + scenes + library + …) with an associated dirty flag, identity, and (optionally) a file path. | Part 33 §33.1 |
| **Document ID** | The stable unique identifier of a document. Blueprint §33: `id` (UUID); current code: `u64` monotonic (`[BLUEPRINT OVERRIDE — P-10 note]`). Stable across rename/Save-As. | Part 33 §33.1, REQ-SYS-004 |
| **Document title** | `meta.title` — display-only label. NOT identity. Two documents may share a title. | REQ-SYS-004, Part 33 §33.1 |
| **Untitled document** | A document with no persisted path yet (created via New, never saved). Identity = its Document ID; path = none. | SYS-02 §13 (DIM-1) |
| **Titled document** | A document with a persisted path (saved at least once, or opened from disk). | SYS-02 §13 (DIM-1) |
| **Active document** | The ONE document whose content the panels/tools currently reflect. At most one; none when no document is open. | Part 01 §1.1.3 |
| **Inactive document** | An open document that is not the active document. Retains full independent state. | Part 01 §1.1.3 |
| **Open document** | A document currently in memory (active or inactive). | derived |
| **Closed document** | A document removed from memory; its unsaved changes were either saved or discarded (guarded). | STM-DIRTY reload guard |
| **Dirty document** | A document with unsaved document-mutations since last save (STM-DIRTY = DIRTY). | engineering 04 |
| **Clean document** | A document with no unsaved document-mutations (STM-DIRTY = CLEAN). | engineering 04 |
| **Saving** | Transient write-in-flight state (STM-DIRTY = SAVING). | engineering 04 |
| **Save error** | Transient failed-write state (STM-DIRTY = ERROR); document remains DIRTY. | engineering 04 |
| **Recent document** | An entry in the Open-Recent list referencing a previously opened path. | Part 01 §1.2.1 |
| **Template** | A preset JSON document seed used by New-from-Template; created by Save-as-Template. | Part 01 §1.2.1 |
| **Project file** | The persisted form of a document: JSON + `assets/` folder (lossless master). | Part 28 §28.8 |
| **Document session** | The in-memory editor state bound to one document: Session (model + history + selection + playhead + active scene/layer). | `session.rs` |
| **Document state** | Persisted-document data (scenes/layers/frames/symbols/settings/…). | Part 33 |
| **Workspace state** | UI layout/preferences (panel positions, shortcuts, theme) — NEVER document data. | Part 01 §1.1.2, SYS-01 §18 |
| **Document-bound UI** | UI whose content is derived from a specific document and must re-read on active-document change (Stage, Timeline, Layers, Properties, Library, title, dirty indicator, selection, playhead, undo/redo). | Part 01 §1.1.3 |
| **Document-independent UI** | UI that does not depend on document content (menu chrome, toolbar shell, workspace switcher, status-bar chrome). | SYS-01 §1 |
| **Tab** | A strip entry representing one open document (or scene). Click = activate; drag = reorder. | Part 01 §1.1.3 |
| **Active tab** | The tab whose document is the active document. Exactly one when ≥1 document open. | derived |
| **Context menu** | A non-destructive right-click/long-press menu. Invoking it MUST NOT mutate/close/delete anything; only selecting an explicit item may. | H00 §10 |
| **File path** | The filesystem location of a titled document's project file. NOT identity. | H00 §5 |
| **File identity** | = Document ID (stable); path/title are not identity. | H00 §5 |
| **Document lifecycle** | NO_DOCUMENT ⇄ ACTIVE (× identity × dirty) with transient OPENING/RECOVERED. | H00 §6 |
| **No-document state** | Lifecycle state with zero open documents; File menu shows New/Open/Exit only. | SYS-02 §13 |

---

## 5. Document Identity Constitution

| Question | Answer | Source | Status |
|---|---|---|---|
| What uniquely identifies a document? | **Document ID** (ENT-project `id`). | Part 33 §33.1, REQ-SYS-004 | RESOLVED |
| Is title the identity? | **No.** Title is display-only (`meta.title`); rename never breaks references. | REQ-SYS-004 | RESOLVED |
| Is path the identity? | **No.** Path is a location; Save As changes path without changing the document. | Part 01 §1.2.1 | RESOLVED |
| What happens to identity after Save As? | **Unchanged.** Only the path (and title if derived from filename) changes. | Part 01 §1.2.1 | RESOLVED |
| What happens after Open? | A loaded document adopts its persisted Document ID; a NEW in-memory session is created (history reset). | SYS-02 §16 | RESOLVED |
| Duplicate filenames | Save As to an existing path = overwrite (no confirm), per P-1 resolution. Two DIFFERENT documents can have the same display title. | Part 01 §1.2.1, SYS-02 §24 P-1 | RESOLVED |
| Identity on tab switch | **Unchanged** — switching tabs changes the ACTIVE document, never any document's identity. | Part 01 §1.1.3 | RESOLVED |
| Identity on close/reopen | Closed document's ID is not reused; reopening from disk loads that file's ID. | Part 33 §33.1 | RESOLVED |
| Can two documents have the same title? | **Yes** (title is display-only; no uniqueness constraint in Blueprint). | REQ-SYS-004 | RESOLVED |
| Can two documents have the same path? | **No.** A saved path already open is activated (never re-opened): no second instance, no second tab, no disk reload; session/dirty/selection/playhead/History preserved. | D-AMB-001 | RESOLVED |
| Identity conflict resolution | **Duplicate Document IDs in the open-set are FORBIDDEN** (D-AMB-001: no second instance, no reload). The collision-RECOVERY behavior for a load that would produce a duplicate ID is `[UNRESOLVED]` (source-silent). | D-AMB-001 (rule); — (recovery) | **AMB-002** (recovery behavior only) |

**Identity invariants (authoritative):**
- INV-IDENT-1: Identity = Document ID, never title, never path. `[REQ-SYS-004]`
- INV-IDENT-2: Save As preserves Document ID. `[Part 01 §1.2.1]`
- INV-IDENT-3: Tab switch never mutates any document's identity. `[Part 01 §1.1.3]`
- INV-IDENT-4: No duplicate Document ID in the open-set; a saved path already open is activated, never re-opened (no second instance, no reload). `[D-AMB-001]`

---

## 6. Document Lifecycle State Machine

### 6.1 Three orthogonal dimensions (NOT one flat enum)

**DIM-A — LIFECYCLE** (is a document loaded?)
- `NO_DOCUMENT`
- `ACTIVE` (a document is loaded; the normal editing state)
- `OPENING` (transient — load in flight)
- `RECOVERED` (transient — `.autosave` recovery prompt showing)

**DIM-B — IDENTITY** (has a path?)
- `UNTITLED`
- `TITLED`

**DIM-C — DIRTY** (authoritative machine = STM-DIRTY)
- `CLEAN`
- `DIRTY`
- `SAVING` (transient)
- `SAVE_ERROR` (transient, retryable)

**Explicitly NOT distinct states** (represented by the dimensions, not invented as separate flat states):
- `NEW`, `OPENED`, `CLOSING`, `CLOSED`, `ERROR` — the Blueprint (engineering 04) defines NO such lifecycle machine. `NEW` = the transition into ACTIVE(UNTITLED,CLEAN); `OPENED` = ACTIVE(TITLED,CLEAN); `CLOSING`/`CLOSED` = the transient transition ACTIVE→NO_DOCUMENT; `ERROR` = DIM-C SAVE_ERROR. **Per anti-guessing rule, these are not added as flat states.**
- `INACTIVE` — an ACTIVE-document dimension value: each open document is ACTIVE(loaded) but only ONE is the *active* document; the others are loaded-but-not-current. This is orthogonal to the three dimensions and governed by §8.

### 6.2 Valid combinations

| Lifecycle | Identity | Dirty | Valid? |
|---|---|---|---|
| NO_DOCUMENT | — | — | valid (identity/dirty N/A) |
| ACTIVE | UNTITLED | CLEAN / DIRTY / SAVING / SAVE_ERROR | valid (all 4) |
| ACTIVE | TITLED | CLEAN / DIRTY / SAVING / SAVE_ERROR | valid (all 4) |
| OPENING / RECOVERED | — | — | valid (transient, no identity/dirty) |

### 6.3 Transitions (each: current + trigger → next + side effects + UI + event + error)

| # | Current + trigger | → Next | Side effects | UI effect | Event | Error possibility |
|---|---|---|---|---|---|---|
| T1 | NO_DOCUMENT + New(settings) | ACTIVE(UNTITLED, CLEAN) | new ENT-project + Session created | New doc active; empty stage; title "Untitled" | `activeDoc:changed{docId}` | invalid settings → inline error, no doc created |
| T2 | NO_DOCUMENT + Open(path) | OPENING | load begins (SYS-28 handoff) | spinner | (saving:changed N/A) | — |
| T3 | OPENING + load ok | ACTIVE(TITLED, CLEAN) | Session::load (history reset, selection empty, playhead 1) | doc active; panels rebind | `activeDoc:changed{docId}` | — |
| T4 | OPENING + load fail | NO_DOCUMENT | nothing loaded | toast (invalid/missing/corrupt/version) | — | invalid/missing/corrupt/version-mismatch — **CASE B only** (open-from-empty) |
| T5 | ACTIVE(any, CLEAN) + edit/import | ACTIVE(…, DIRTY) | document mutation recorded | dirty ● appears | `document:changed` | — |
| T6 | ACTIVE(…, DIRTY) + Save | SAVING | SYS-28 write begins | "Saving…" | `saving:changed{saving}` | — |
| T7 | SAVING + write ok | ACTIVE(…, CLEAN) | write persisted | "Saved hh:mm"; dirty ● cleared | `saving:changed{saved}` | — |
| T8 | SAVING + write fail | SAVE_ERROR | last-good intact (atomic) | "Save error" | `saving:changed{error}` | disk/permission |
| T9 | SAVE_ERROR + retry | SAVING | retry write | "Saving…" | `saving:changed{saving}` | — |
| T10 | ACTIVE(…, CLEAN) + Close | NO_DOCUMENT | document removed (direct, no confirm) | tabs update | `activeDoc:changed` | — |
| T11 | ACTIVE(…, DIRTY) + Close/Exit | Close-Confirmation | (transient guard, see §10) | modal Discard/Save/Cancel | — | save-fail keeps DIRTY |
| T12 | NO_DOCUMENT + launch with newer `.autosave` | RECOVERED | recovery prompt (SYS-28) | recovery prompt | — | — |
| T13 | RECOVERED + accept | ACTIVE(TITLED, CLEAN) | recovered doc loaded | doc active | `activeDoc:changed` | — |
| T14 | RECOVERED + discard | NO_DOCUMENT | `.autosave` kept or cleared per SYS-28 | empty | — | — |

**Forbidden transitions (from engineering 04, extended):**
- DIRTY → CLEAN by any means OTHER than (a) a successful write, or (b) a document mutation (any — undo/redo are examples, NOT the only mutations) that returns the state to the exact saved snapshot. No VIEW/SESSION/WORKSPACE/PREFERENCE action may clear DIRTY (STM-DIRTY arbitrary-clearing protection).
- ACTIVE → NO_DOCUMENT while DIRTY, without passing the Close-Confirmation guard.
- OPENING → NO_DOCUMENT except via load-fail (T4, CASE B).
- RECOVERED → ACTIVE except via accept (T13).

**Open in multi-document (binding — resolves the "Replaces active doc (with save prompt)" tension):** Blueprint §1.2.1 says Open "Replaces active doc (with save prompt)"; Blueprint §1.1.3 requires multiple documents to accumulate in tabs (no replacement). Resolution: "replaces active" = the opened document BECOMES the active document (the active POINTER changes); the previously-active document is NOT removed — it becomes INACTIVE (dirty/History/selection/playhead preserved). "with save prompt" is a SINGLE-document-model relic: in multi-document, Open causes NO data loss, therefore Open performs NO dirty guard. Opening alongside an active document is an OPEN-SET operation (H02/H06 CASE A), NOT a lifecycle-dimension transition — the active document stays ACTIVE until the new document loads successfully.

---

## 7. Dirty-State Constitution

**Absolute distinction — DOCUMENT MUTATION vs VIEW/PREFERENCE MUTATION:**

| Operation | Class | Makes DIRTY? | Source |
|---|---|---|---|
| Edit commands (draw/move/tween/symbol/…) via SYS-13..26 | DOCUMENT MUTATION | **YES** | STM-DIRTY "command.execute() → DIRTY" |
| Import-to-Stage/Library | DOCUMENT MUTATION | **YES** (one atomic command) | SYS-02 §17 |
| Undo / Redo | DOCUMENT MUTATION (reverts/re-applies a mutation) | **YES if it leaves the doc ≠ last-saved state; NO if it returns to the exact saved state** — dirty = "differs from last-saved snapshot" | derived from STM-DIRTY + Part 12 (save does NOT clear undo) |
| Save / Save As (success) | FILE-SYSTEM | **NO** — sets CLEAN | STM-DIRTY |
| Failed save | FILE-SYSTEM | **stays DIRTY** (preserve) | STM-DIRTY "write failure → keep DIRTY" |
| Open / New / Close | LIFECYCLE | **NO** (New/Open start CLEAN; close removes the doc) | SYS-02 §17 |
| Export / Publish | NON-MUTATING | **NO** | SYS-02 §17 |
| Selection change | VIEW | **NO** | SYS-01 §17 (SESSION) |
| Playhead scrub / play / stop | VIEW | **NO** | SYS-01 §17 |
| Workspace resize / panel collapse / panel hide | WORKSPACE-VIEW | **NO** | Part 01 §1.1.2, SYS-01 §17 |
| Theme / shortcut / preference change | PREFERENCE | **NO** | SYS-01 §18 |

**Answering the explicit questions:**
- Does undo make it clean? Not unconditionally — only if the doc returns to the exact last-saved state. Dirty is defined as "differs from last-saved snapshot", not "has undo entries".
- Does redo? Same rule.
- Does save clear dirty? **Yes** (write success → CLEAN).
- Does Save As clear dirty? **Yes** (write success → CLEAN; also changes path → TITLED).
- Does switching documents affect dirty? **No** — each document's dirty flag is per-document (§8).
- Workspace resizing / panel collapse / selection / scrub / play-stop: **No** (view/pref).
- Does opening create dirty? **No** (loads CLEAN).
- Does creating a new document create dirty? **No** (New → UNTITLED, CLEAN; a never-saved empty doc is CLEAN until first mutation).
- Does failed save preserve dirty? **Yes** (STM-DIRTY ERROR keeps DIRTY).

**Dirty invariants:**
- INV-DIRTY-1: Only DOCUMENT MUTATION sets DIRTY. `[STM-DIRTY]`
- INV-DIRTY-2: DIRTY clears to CLEAN **only when the current document state equals the saved snapshot** — via (a) a successful write (Save/Save As) that advances the snapshot to the current state, or (b) a document mutation that moves the state to the snapshot (undo/redo are examples, NOT the only mutations). Every operation that leaves the state ≠ snapshot preserves DIRTY; **no VIEW / SESSION / WORKSPACE / PREFERENCE action may clear DIRTY.** `[H00 §7 "differs from snapshot" + STM-DIRTY arbitrary-clearing protection]`
- INV-DIRTY-3: Save does NOT clear document undo history. `[Part 12, SYS-02 §17]`
- INV-DIRTY-4: Dirty state is per-document; switching never transfers it. `[Part 01 §1.1.3]`

---

## 8. Multi-Document Global Invariants

> All supported by Part 01 §1.1.3 (multi-doc: per-doc Library/timeline, panels reflect active doc) + SYS-01 activeDoc:changed rebind + STM-DIRTY per-document.

- INV-MD-1: Each open document retains independent state (content, dirty, undo history, selection, playhead). `[Part 01 §1.1.3]` — P0.
- INV-MD-2: There is **exactly one active document** whenever ≥1 document is open. `[Part 01 §1.1.3]` — P0.
- INV-MD-3: Inactive documents remain fully intact; nothing about them is mutated while inactive. `[Part 01 §1.1.3]` — P0.
- INV-MD-4: Switching the active document never mutates any document's content. `[Part 01 §1.1.3]` — P0.
- INV-MD-5: Switching never merges or mixes undo histories (each doc keeps its own History). `[Part 12, SYS-01 §17]` — P0.
- INV-MD-6: Switching never transfers selection across documents (selection = session state, per-doc). `[SYS-01 §17 SESSION]` — P1.
- INV-MD-7: Switching never transfers dirty state (dirty is per-document). `[STM-DIRTY]` — P0.
- INV-MD-8: Switching must rebind ALL document-bound UI (§9) to the newly active document. `[Part 01 §1.1.3]` — P0 (this is the previous tab-switching failure).
- INV-MD-9: A document's title and dirty flag belong to that document and update only via that document's changes. `[REQ-SYS-004, STM-DIRTY]` — P1.
- INV-MD-10: Closing one document never mutates another. `[Part 01 §1.2.1]` — P0.

---

## 9. Document-Bound UI Constitution

| UI element | Classification | On active-document change |
|---|---|---|
| Stage | DOCUMENT-BOUND | re-read `evaluate()` for the new doc's active scene/frame; re-render |
| Timeline | DOCUMENT-BOUND | re-read new doc's layers/frames/playhead; re-render |
| Layers | DOCUMENT-BOUND | re-read new doc's layer list; re-render |
| Properties | DOCUMENT-BOUND | re-bind schema (selection cleared or restored per new doc) |
| Library | DOCUMENT-BOUND | re-read new doc's library (per-doc Library) |
| Document title | DOCUMENT-BOUND | show new active doc's title + dirty ● |
| Dirty indicator | DOCUMENT-BOUND | reflect new active doc's dirty state |
| Selection | DOCUMENT-BOUND (per-doc session) | restore new doc's selection or clear (per-doc session state) |
| Playhead | DOCUMENT-BOUND | restore new doc's playhead |
| Undo/redo | DOCUMENT-BOUND | reflect new doc's history depth; undo/redo act on new doc's history |
| Status info (frame/fps/scene) | MIXED | re-read new doc's frame/fps/scene; tool cell = GLOBAL |
| Symbol/library state | DOCUMENT-BOUND | re-read new doc's library |

**Rebind rules (prevents the tab-switching failure):**
1. On `activeDoc:changed{docId}` (emitted by the switch), every document-bound panel MUST re-read from the new active document — never from a cached copy of the previous document.
2. Global UI (menu chrome, toolbar shell, workspace switcher, status-bar chrome, theme) does NOT re-read document state.
3. Selection/playhead/undo restore from the new document's session state (per-doc), never from the old document's.
4. Stale-state prevention: a panel MUST NOT render using a document reference captured before the switch. The single source of truth is the active-document pointer; panels re-read it on `activeDoc:changed`.

---

## 10. Destructive-Interaction Constitution

**Absolute rule:**
- **INV-DSTR-1: RIGHT-CLICK ≠ DESTRUCTIVE ACTION.** Invoking a context menu must NEVER close/delete/discard/overwrite anything. Only an explicit item selection within the menu may trigger an action — and destructive items are themselves guarded (§10 table). `[previous QA failure #3]` — P0.
- **INV-DSTR-2: A tab's left-click = activate; right-click = context menu; these are distinct, non-overlapping handlers.** `[previous QA failure #3]` — P0.

**Destructive operations table (confirmation/dirty-guard rules per source — NO invented confirmations):**

| Operation | Explicit action | Confirmation | Dirty guard | Cancel | Undo | Accidental-click protection |
|---|---|---|---|---|---|---|
| Close | menu item / tab × | **only if DIRTY** (Discard/Save/Cancel) | yes (STM-DIRTY) | Cancel = unchanged | no (lifecycle) | right-click ≠ close |
| Close All | menu item | **only if any DIRTY** (per-doc) | yes | Cancel = unchanged | no | right-click ≠ close |
| Exit | menu item / Ctrl+Q | **only if DIRTY** | yes | Cancel = unchanged | no | — |
| Discard (in guard) | explicit button | n/a (IS the discard) | n/a | — | **no** (discard = permanent, non-undoable) | confirm-modal button, not a bare click |
| Overwrite (Save to existing path) | Save | **none** (Save = overwrite by definition, P-1) | n/a | — | no | Save is explicit |
| Open-activates-new-document (Open/Open-Recent) | Open/Open-Recent | **none** (NOT destructive — the active doc is not removed; it becomes inactive, dirty preserved) | **no** (multi-doc: no data loss) | n/a | no | — |

**Rule:** destructive actions are NEVER bound to right-click, hover, or a single ambiguous click. They are bound to explicit labeled actions, and (where DIRTY) to the guard dialog. Confirmation is required ONLY where Blueprint/STM-DIRTY specifies it — no extra confirmations invented.

---

## 11. Command Constitution

Every SYS-02 command MUST declare (per SYS-01 §28 registry contract + SYS-02 §15):

1. unique `commandId` (no drift — `file.save()` never becomes `file.saveProject()`),
2. trigger(s) (menu/shortcut/palette/context-menu — all resolve to the SAME commandId),
3. preconditions (e.g. "doc open"),
4. enabled/disabled state + disabled reason (DISABLED-BY-CONTEXT with tooltip),
5. action,
6. state transition (per §6),
7. success result (feedback + event),
8. failure result (surface + no unintended mutation),
9. dependent UI update (which panels re-render),
10. undo classification (§13),
11. persistence classification (§14),
12. event emission (where applicable).

**Invariants:**
- INV-CMD-1: No command exists only as a UI visual; every FUNCTIONAL control has a real commandId. `[SYS-01 §28, REQ-UI-001]` — P0.
- INV-CMD-2: No UI control may bypass the command architecture (direct state writes forbidden). `[REQ-SYS-002]` — P0.
- INV-CMD-3: Button/menu/shortcut/palette/context-menu for the same action share ONE commandId. `[SYS-01 §30]` — P1.
- INV-CMD-4: A command's name is identical everywhere it appears. — P1.

---

## 12. Event / State Propagation Constitution

**Canonical flow (layers apply only where relevant):**

```
USER ACTION
  ↓
UI CONTROL (control ID, §11)
  ↓
COMMAND (commandId, §11)          ← not every action is a command (view state)
  ↓
CLIENT (engine/client.ts)         ← engine-backed actions only
  ↓
ENGINE/SESSION/MODEL               ← document mutations only
  ↓
STATE CHANGE
  ↓
EVENT (locked names, SYS-01 §27.1)
  ↓
ACTIVE-DOCUMENT UPDATE             ← activeDoc:changed for lifecycle
  ↓
DEPENDENT UI REFRESH               ← panels re-read from active doc
```

**Layer applicability (exact):**
- **View-state actions** (tab switch, panel hide, selection, scrub): UI CONTROL → STATE CHANGE → EVENT → UI REFRESH. **No command, no client, no model.**
- **Document mutations** (edit commands): full chain through MODEL.
- **Lifecycle** (New/Open/Close): COMMAND → SESSION → STATE → `activeDoc:changed` → UI rebind.
- **Save/Open I/O**: COMMAND → SYS-28 handoff → `saving:changed` → UI.

**Stale-state prevention (specific):**
- **Tab switch:** emit `activeDoc:changed{docId}`; panels re-read the active doc (never a stale reference). The switch itself is a view-state action (no document mutation).
- **Save:** `saving:changed{saving}` → `saving:changed{saved}`; status cell updates; dirty ● clears only on `{saved}`.
- **Open:** dirty-guard first (if active DIRTY); then load; then `activeDoc:changed`; history reset.
- **Close:** dirty-guard; then `activeDoc:changed`; next active or NO_DOCUMENT.
- **New:** `activeDoc:changed`; empty doc active.
- **Dirty change:** `document:changed` → dirty indicator re-reads the active doc's dirty flag.
- **Active-document change:** all §9 document-bound UI re-reads.

**Canonical SYS-02 event definitions (locked):**

| Event | Meaning | Payload | Owner | Fires when | MUST NOT fire when |
|---|---|---|---|---|---|
| `activeDoc:changed` | activeDocumentId changed | `{docId}` | SYS-02 (H02) | activation, New/Open auto-activate, close (next / last → `{null}`) | an open-set-only change (reorder, close-inactive) |
| `openSet:changed` | ordered open-set changed | `{change: 'added'\|'removed'\|'reordered', docId?}` | SYS-02 (H02) | New/Open (added), close (removed), reorder (reordered) | an activation-only change |
| `saving:changed` | save-state changed | `{state, time?}` | SYS-28 (SYS-02 trigger) | save start / ok / fail | any non-save state change |
| `document:changed` | document mutation | `{type, targets}` | Command (post-do) — SYS-01 §27.1 | any document mutation (edit/import/undo/redo) | view/session/workspace/preference change |

`openSet:changed` is a **SYS-02 approved extension** authorized by D-AMB-004 — it does NOT replace SYS-01 §27.1's registry; it is the SYS-02 open-set contract used by H02.

**Event ordering matrix (locked, D-AMB-004):**

| Action | Event(s) — deterministic order |
|---|---|
| New | `openSet:changed{added}` → `activeDoc:changed` |
| Open new | `openSet:changed{added}` → `activeDoc:changed` |
| Activate | `activeDoc:changed` only |
| Close active (survivor) | `openSet:changed{removed}` → `activeDoc:changed` |
| Close inactive | `openSet:changed{removed}` → **NO** `activeDoc:changed` |
| Close last | `openSet:changed{removed}` → `activeDoc:changed{null}` |
| Reorder | `openSet:changed{reordered}` → **NO** `activeDoc:changed` |

**Never use `activeDoc:changed` as a refresh hack** (FL-0007). When both open-set and active change, emit `openSet:changed` FIRST, then `activeDoc:changed`.

---

## 13. Undo / Redo Constitution

| SYS-02 action | Document undo entry? | History effect | Class |
|---|---|---|---|
| New / Open / Close / Exit | **no** | Open resets history (Session::load = History::new); Close removes the doc's history | LIFECYCLE |
| Save / Save As | **no** | **preserves** existing history (save does NOT clear undo — Part 12) | FILE-SYSTEM |
| Import | **yes** | one atomic command on the doc's history | DOCUMENT MUTATION |
| Export / Publish | **no** | none | NON-MUTATING |
| Save-as-Template | **no** | none | NON-DOCUMENT (template write) |
| Tab switch | **no** | **never mixes/merges stacks** (each doc keeps its own History) | SESSION/VIEW |

**Invariants:**
- INV-UNDO-1: Save must NOT destroy document undo history. `[Part 12]` — P0 (data-loss class).
- INV-UNDO-2: Document switching NEVER merges undo stacks (per-doc History). `[Part 12, SYS-01 §17]` — P0.
- INV-UNDO-3: View/workspace/preference operations create NO document mutation and NO document undo entry. `[SYS-01 §17]` — P0.
- INV-UNDO-4: No-op actions (zero delta, cancelled dialogs) create NO undo entry. `[SYS-01 §32 ALREADY-IN-STATE idempotent case]` — P1.

---

## 14. Persistence Boundary

| Boundary | Owner | Contents | SYS-02 role |
|---|---|---|---|
| DOCUMENT STATE | **SYS-28** | scenes/layers/frames/symbols/settings/audio/formatVersion | trigger Save/Open; handoff; UI feedback |
| WORKSPACE STATE | **SYS-01** | panel layout, shortcuts, theme | (chrome only; never writes) |
| APPLICATION PREFERENCES | **SYS-01 + owners** | contact-sensitive, wand threshold, etc. | (none for SYS-02 except recent-files → see below) |
| RECENT FILES | **SYS-02** | recent-path list (prefs boundary) | owns the list; handoff to SYS-28 for load |
| TEMPLATES | **SYS-02** (mechanism) | preset JSON; location = deployment detail (P-7) | owns save/load mechanism |
| RECOVERY / AUTOSAVE | **SYS-28** | `.autosave` slot, recovery prompt | reference only (trigger + UI) |

**Invariants:**
- INV-PERS-1: SYS-02 never implements atomic-write/autosave/recovery/migration/corruption internals (SYS-28 owns). `[SYS-01 §21]` — P0.
- INV-PERS-2: SYS-02 defines the exact handoff (trigger → SYS-28 API → result event → UI). `[SYS-02 §16]` — P0.
- INV-PERS-3: Workspace/preferences are NEVER written into the project file. `[Part 01 §1.1.2]` — P0.

---

## 15. Browser vs Native Desktop Constitution

Kineora's authoritative product = **native desktop** (Tauri v2, ENG-001 hybrid runtime; W7 offline). Browser is a **development mode**. Browser limitations must NEVER become the product spec.

| Concern | Native desktop (authoritative) | Browser (dev only) | Spec rule |
|---|---|---|---|
| File picker (Open) | native OS picker | (current: none — `load_json` unwired) | spec = native picker; browser limitation is an IMPL gap, not a spec reduction |
| Save picker | native OS save dialog | current: `downloadBlob` | spec = native save dialog (path identity required); downloadBlob = dev-only |
| Window close / Exit | OS close → dirty guard | before-unload | dirty guard applies in BOTH; native = authoritative |
| Filesystem access | real paths, path identity | no real paths | path identity only meaningful natively |
| Keyboard shortcuts | desktop accelerators | browser key events | same shortcut map; native accelerator wiring = H10 |
| before-unload | (n/a natively) | browser-only safety net | NOT a spec feature; a dev-mode guard only |

**Invariants:**
- INV-NATIVE-1: Native desktop is the product; browser is a dev harness. `[ENG-001, W7]` — P0.
- INV-NATIVE-2: The spec never weakens a requirement because the browser dev mode cannot do it (e.g., native save path). — P0.

---

## 16. Error-Handling Constitution

Every failure → **USER FEEDBACK + NO UNINTENDED STATE MUTATION + NO CORRUPT UNDO ENTRY + RECOVERABLE STATE**.

| Failure | Feedback | State | Undo | Recover |
|---|---|---|---|---|
| Invalid input (dialog) | inline error + revert | unchanged | none | fix + retry |
| Cancelled picker | (silent close) | unchanged | none | reopen |
| Corrupt document (open) | toast + refuse + offer `.autosave`/backup (SYS-28) | unchanged (no load) | none | `.autosave` |
| Missing document (open/recent) | toast | unchanged | none | re-select |
| Stale recent item | toast + skip | unchanged | none | remove/ignore |
| Save failure (disk/permission/read-only) | "Save error" + retry | stays DIRTY; last-good intact (atomic) | none (no entry) | retry |
| Open failure | toast (invalid/missing/corrupt/version) | NO_DOCUMENT (nothing loaded) | none | retry |
| Engine unavailable | honest "engine not attached" | unchanged | none | reload |
| Invalid active document | toast + fallback | auto-correct to NO_DOCUMENT or last-valid | none | re-open |
| Conflicting identity | `[AMB-002]` | — | — | — |
| Unsupported operation | toast + reason | unchanged | none | — |

**Invariants:**
- INV-ERR-1: NO silent failure — every failure surfaces. `[SYS-01 §28/§36 9-outcome error model]` — P0.
- INV-ERR-2: A failed operation never leaves a partial mutation or a corrupt undo entry. `[SYS-01 §28 rollback/retry]` — P0.
- INV-ERR-3: Save failure preserves DIRTY + last-good file. `[STM-DIRTY + eng 13]` — P0 (data-loss class).

---

## 17. Visual / Accessibility Constitution

> Prevents the white-text-on-white-background failure. Reference SYS-01 design tokens (CSS-token theme, SYS-01 §2/§21) — do NOT hard-code colors.

Every dialog/control state MUST specify (via tokens):
- background (`surface`/`bg-elevated`), foreground (`text`/`text-muted`), border (`border`),
- placeholder, focus (`focus-ring`), hover, active, disabled, error (`danger`), success (`success`), selected (`primary`),
- keyboard focus indicator, contrast (WCAG AA via tokens).

**Invariants:**
- INV-VIS-1: Every dialog/control state has defined contrast (foreground ≠ background in EVERY state, incl. disabled/error). `[previous QA failure #1]` — P0 (VISUAL BUG class).
- INV-VIS-2: Colors come from SYS-01 design tokens; no hard-coded values. `[SYS-01 §2/§21]` — P1.
- INV-VIS-3: Reduced-motion respected (SYS-01 §2/§21 motion tokens). `[SYS-01 §2/§21]` — P2.
- INV-VIS-4: Every control has aria-label/role/focus/keyboard activation. `[SYS-01 C-35]` — P1.

---

## 18. Failure Classes

| Class | Meaning | Never downgrade |
|---|---|---|
| **P0** | data loss, app unusable, destructive accident | never "minor" |
| **P1** | major feature broken | — |
| **P2** | important but workaroundable | — |
| **SPEC GAP** | behavior missing from the specification | blocks implementation |
| **IMPLEMENTATION BUG** | code diverges from spec | spec wins |
| **INTEGRATION GAP** | two systems don't connect as spec'd | — |
| **VISUAL BUG** | readable/contrast/layout defect (white-on-white) | a REAL failure, not cosmetic |
| **DATA-LOSS RISK** | any path that can lose unsaved work | P0/P1 by definition |
| **SILENT FAILURE** | failure with no feedback | P0 by definition |
| **DEPENDENCY BLOCK** | blocked on another system not yet built | — |
| **AMBIGUITY** | spec permits two interpretations | blocks implementation until resolved |
| **UNVERIFIED** | claimed behavior with no source/test evidence | cannot be declared complete |

**Rule:** the implementation AI must NEVER classify a P0/DATA-LOSS-RISK/SILENT-FAILURE as "minor".

---

## 19. Manual QA Philosophy

1. **AUTOMATED TEST PASS ≠ PRODUCT PASS.** `[previous QA failure #4/#7]`
2. If a prerequisite test FAILS, dependent tests = **BLOCKED**, never PASS. `[previous QA failure #6]`
3. Manual desktop interaction is authoritative for interaction behavior (tabs, right-click, pickers). `[previous QA failure #2/#3]`
4. Visual defects are real failures, manually verified. `[previous QA failure #5]`
5. Accidental destructive behavior is a CRITICAL (P0) failure. `[previous QA failure #3]`
6. No "probably works" acceptance.
7. No implementation report may hide real manual failures. `[previous QA failure #10]`

---

## 20. Cross-System Dependency Constitution

Source = SYS-01 §31 integration contract + §21 ownership table (approved registry).

| System | SYS-02 consumes | SYS-02 provides | MUST NOT modify | Boundary |
|---|---|---|---|---|
| SYS-01 Workspace | menu chrome, tabs, `st.saving` cell, `activeDoc:changed` event | menu items, lifecycle commands | workspace layout, panel state | event + chrome |
| SYS-03 Edit | undo/redo interplay | (none directly) | clipboard, selection commands | undo contract §13 |
| SYS-06/SYS-17 | — | — | Document Properties (Ctrl+J) | NOT File-owned |
| SYS-08 Commands | palette registry | File commands register | palette infrastructure | commandId registration |
| SYS-18 Library | external-library open | (handoff) | library engine | `file.openExternalLibrary` → SYS-18 |
| SYS-27 Import/Export/Publish | (menu entries) | handoff commands | import/export/publish engines | §14 boundary |
| SYS-28 Persistence | atomic write/load/autosave/recovery | save/open triggers + UI feedback | serializer internals | §14 boundary |

**Invariants:**
- INV-DEP-1: SYS-02 never silently absorbs another system's work (handoff, not ownership). `[SYS-01 §21]` — P0.
- INV-DEP-2: Every dependency has an explicit input→handoff→event→consumer→failure contract (no name-only dependency). — P0.

---

## 21. Known Previous Failure Lessons

Permanent QA constraints (from the real manual QA failures + prior SYS-02 rounds):

1. Functional existence is not usability. (New dialog was present but unreadable.)
2. A visible tab is not a working document-switching system. (Tabs existed; switching failed.)
3. Right-click must never accidentally perform destructive actions. (Right-click closed the doc instead of showing a menu.)
4. Automated tests do not prove real desktop interaction. (Tests green; desktop broken.)
5. Visual contrast must be manually verified. (White-on-white.)
6. Dependent tests cannot be accepted when prerequisites fail. (Tab-switch tests untrusted.)
7. Green build ≠ complete product.
8. Document-bound UI must rebind correctly on switch.
9. Data-loss risks are P0/P1-level concerns.
10. No implementation report may hide real manual failures.

Each lesson maps to a §22 invariant (INV-VIS-1, INV-DSTR-1/2, INV-MD-8, QA rules §19).

---

## 22. Global Invariants — NON-NEGOTIABLE

| ID | Rule | Source | Why | Test method | Severity |
|---|---|---|---|---|---|
| INV-001 | Exactly one active document whenever ≥1 document open. | Part 01 §1.1.3 | panels bind to a single active doc | open 2 docs, assert exactly one active; switch and re-assert | P0 |
| INV-002 | Opening a tab context menu does not close the document. | QA failure #3 | accidental data-loss | right-click tab → menu appears, doc still open, no guard triggered | P0 (DATA-LOSS) |
| INV-003 | Document switching does not mutate document content. | Part 01 §1.1.3 | switching must be read-only w.r.t. content | edit doc A, switch to B, switch back → A unchanged | P0 |
| INV-004 | Switching never merges undo stacks (per-doc History). | Part 12 | undo must target the right doc | edit A, switch to B, undo → B's last action, not A's | P0 |
| INV-005 | Switching rebinds all document-bound UI (§9). | Part 01 §1.1.3 | stale-panel failure | switch → Stage/Timeline/Layers/Properties/Library all show new doc | P0 |
| INV-006 | Dirty state is per-document and never transferred on switch. | STM-DIRTY | wrong-doc dirty indicator | dirty A, switch to clean B → B shows clean | P0 |
| INV-007 | Closing one document never mutates another. | Part 01 §1.2.1 | isolation | close A → B's content/undo/dirty intact | P0 |
| INV-008 | DIRTY clears to CLEAN only when state == saved snapshot (via a successful write OR a document mutation that returns to the snapshot — undo/redo are examples); no VIEW/SESSION/WORKSPACE/PREFERENCE action clears DIRTY. | STM-DIRTY + H00 §7 "differs from snapshot" | false "saved" state | fail a write → doc stays DIRTY; a view/workspace action can never clear DIRTY | P0 |
| INV-009 | Save does not clear document undo history. | Part 12 | data integrity | make edits, save, undo → edits still undoable | P0 (DATA-LOSS) |
| INV-010 | No silent failure; every failure surfaces. | SYS-01 §28/§36 | silent data loss | force each §16 failure → assert feedback | P0 (SILENT FAILURE) |
| INV-011 | Identity = Document ID; Save As preserves it. | REQ-SYS-004, Part 01 §1.2.1 | rename-safety | Save As → ID unchanged, path changed | P1 |
| INV-012 | Workspace/prefs never written into the project file. | Part 01 §1.1.2 | boundary leak | resize panel, save, reload → layout not in project JSON | P0 |
| INV-013 | Right-click ≠ destructive; destructive actions are explicit + guarded. | QA failure #3 | accidental close | every right-click target → menu only | P0 (DATA-LOSS) |
| INV-014 | Every FUNCTIONAL control has a real commandId (no dead button). | SYS-01 §28 | dead UI | registry lint: FUNCTIONAL ⇒ commandId | P0 |
| INV-015 | Button/menu/shortcut/palette/context-menu share ONE commandId. | SYS-01 §30 | duplicate paths | grep all trigger paths → same commandId | P1 |
| INV-016 | Failed operation leaves no partial mutation / corrupt undo entry. | SYS-01 §28 | corruption | fail each op → model unchanged, history clean | P0 |
| INV-017 | Every dialog/control state has defined contrast (never white-on-white). | QA failure #1 | unreadable UI | manual + automated token check per state | P0 (VISUAL) |
| INV-018 | Native desktop is authoritative; browser limits are not spec reductions. | ENG-001, W7 | product drift | assert spec features (native save path) exist regardless of dev mode | P0 |
| INV-019 | Automated test pass ≠ product pass; prerequisite-fail ⇒ dependent BLOCKED. | QA failure #4/#6 | false confidence | QA gate: manual desktop pass required | P0 |

---

## 23. Ambiguity Register

| AMB-ID | Question | Conflicting sources | Current evidence | Why it matters | Owner part | Resolution required before implementation? |
|---|---|---|---|---|---|---|
| AMB-001 | Two documents open with the SAME file path (open same file twice) | Blueprint silent; OS forbids concurrent write | — | save/overwrite correctness, identity | H02/H06 | **RESOLVED (D-AMB-001):** a saved path already open is activated (no second instance, no second tab, no disk reload, session preserved, no duplicate Document ID) |
| AMB-002 | Loaded document ID collides with an already-open document's ID | Blueprint §33 (UUID, no collision) vs code (u64) | P-10 note | identity uniqueness across open docs | H02/H10 | **PARTIALLY RESOLVED (D-AMB-001):** no duplicate Document ID permitted in the open-set (invariant INV-IDENT-4). **REMAINING UNRESOLVED:** collision-RECOVERY behavior (what to do if a load would produce a duplicate ID) is source-silent |
| AMB-003 | Recent-file list persistence store + API | Blueprint "Open Recent" only | none | H10 persistence integration (the recent-list STORE); H06's Open-Recent command wiring is fully specified via a handoff to H10 for the list | H10 | YES — before Open Recent ships (H10); NOT an H06 blocker |
| AMB-004 | Native desktop menu/accelerator wiring (Tauri) | Blueprint silent on exact Tauri wiring | ENG-001 hybrid | desktop shortcuts | H10/H11 | YES — before desktop shortcuts |
| AMB-005 | Exact "Essentials" pixel layout vs named workspaces | SYS-01 D-5 (resolved defaults) | — | workspace restore | (SYS-01, not SYS-02) | N/A — resolved in SYS-01 |

**Rule:** AMB-001 is RESOLVED (D-AMB-001). AMB-002 is PARTIALLY RESOLVED (no-duplicate-ID invariant established; recovery behavior remains open). AMB-003 is owned by H10 (recent-list store), NOT H06 (H06's Open-Recent wiring is a non-blocking handoff). AMB-004 must be resolved in its owning part (H10/H11) before that part is marked complete. None may be silently resolved here.

---

## 24. H00 → Later-Part Dependency Map

| Part | Relies on H00 |
|---|---|
| H01 | identity (Doc ID vs title vs path), lifecycle T1 (New→UNTITLED,CLEAN), visual constitution (§17), error constitution (§16) |
| H02 | active/inactive model (§6/§8), document-bound UI (§9), event `activeDoc:changed`, multi-doc invariants INV-001..INV-010 |
| H03 | destructive-safety (§10 INV-002/INV-013), command constitution (§11), right-click≠destructive |
| H04 | dirty constitution (§7), lifecycle T5–T9, STM-DIRTY transitions |
| H05 | identity constitution (§5), persistence boundary (§14), undo INV-009, lifecycle T6–T9 |
| H06 | lifecycle T2–T4/T11, dirty guard (§10), error constitution (§16) |
| H07 | lifecycle T10–T14, destructive-safety (§10), no-document state (§4/§6) |
| H08 | command/event constitution (§11/§12), dependency firewall (§20), persistence boundary (§14) |
| H09 | command constitution (§11), shortcut/control consistency INV-014/INV-015 |
| H10 | persistence boundary (§14), browser/native (§15), cross-system (§20), AMB-003/AMB-004 |
| H11 | visual/accessibility (§17), error constitution (§16), failure taxonomy (§18) |
| H12 | event/state propagation (§12), command constitution (§11), all models §5–§9 |
| H13 | QA philosophy (§19), failure taxonomy (§18), global invariants (§22) |
| H14 | evidence map (§3), ambiguity register (§23), all invariants (§22) |

---

## 25. H00 Completion Checklist

- [x] Blueprint relevant sections completely reviewed (Part 01 §1.2.1/§1.1.3/§1.7, Part 33 §33.1, Part 36 §36.0.10)
- [x] Phase 2 relevant evidence reviewed (F-01-03/04/20, F-33-01, F-36-01)
- [x] Phase 2.5 relevant contracts reviewed (C-02, C-03, C-30, C-31)
- [x] Phase 3 relevant REQ/MOD/CMD/STM reviewed (eng 03/04/13/14, REQ-DOC-001, REQ-SYS-004, STM-DIRTY, STM-EDIT)
- [x] Existing SYS-02 reviewed (SYS-02_file.md — resolved decisions P-1..P-10 adopted)
- [x] SYS-01 dependency reviewed (events §4, undo §13, persistence §18, registry §28, tokens §32, ownership §21)
- [x] Official Adobe evidence checked (documents.html, publish-settings.html)
- [x] Terminology resolved (§4)
- [x] Identity model resolved (§5; AMB-001 RESOLVED via D-AMB-001, AMB-002 partial)
- [x] Lifecycle state machine defined (§6, 3 dimensions + 14 transitions)
- [x] Dirty rules defined (§7, 15 explicit questions answered)
- [x] Multi-document invariants defined (§8, INV-MD-1..10)
- [x] Document-bound UI rules defined (§9, 13 elements classified)
- [x] Destructive safety rules defined (§10, INV-DSTR-1/2)
- [x] Command rules defined (§11, 12 fields + INV-CMD-1..4)
- [x] Event/state propagation defined (§12, layer applicability + stale prevention)
- [x] Undo/redo rules defined (§13, 8 actions + INV-UNDO-1..4)
- [x] Persistence boundary defined (§14, 6 boundaries + INV-PERS-1..3)
- [x] Browser/native boundary defined (§15, INV-NATIVE-1/2)
- [x] Error rules defined (§16, 11 failures + INV-ERR-1..3)
- [x] Visual/accessibility rules defined (§17, INV-VIS-1..4)
- [x] Failure taxonomy defined (§18, 12 classes)
- [x] QA philosophy defined (§19, 7 rules)
- [x] Cross-system boundaries defined (§20, 7 systems + INV-DEP-1/2)
- [x] Previous failures incorporated (§21, 10 lessons → invariants)
- [x] Global invariants testable (§22, 19 invariants with ID/rule/source/why/test/severity)
- [x] Ambiguities explicitly registered (§23, AMB-001..005)
- [x] Later-part dependencies defined (§24, H01–H14 map)

---

## FINAL H00 REPORT

**SOURCE COVERAGE**
- Blueprint: Part 01 §1.2.1/§1.1.3/§1.7, Part 33 §33.1, Part 36 §36.0.10 — reviewed.
- Phase 2: F-01-03/04/20, F-33-01, F-36-01 — reviewed.
- Phase 2.5: C-02, C-03, C-30, C-31 — reviewed.
- Phase 3: engineering 03/04/13/14; REQ-DOC-001, REQ-SYS-004; STM-DIRTY, STM-EDIT — reviewed.
- SYS-01: §27.1 events, §17 undo, §18 persistence, §28 registry, §30 command-mapping, §2/§21 design tokens, §21 ownership — reviewed.
- Existing SYS-02: SYS-02_file.md (decisions P-1..P-10) — reviewed and adopted.
- Adobe: helpx.adobe.com documents.html, publish-settings.html — verified.
- Manual QA: the 8 real failures from this prompt — incorporated as §21 lessons.

**INVARIANTS CREATED:** 19 global (§22, INV-001..019) + 42 sub-invariants across §5 (INV-IDENT 4) / §7 (INV-DIRTY 4) / §10 (INV-DSTR 2) / §11 (INV-CMD 4) / §13 (INV-UNDO 4) / §14 (INV-PERS 3) / §15 (INV-NATIVE 2) / §16 (INV-ERR 3) / §17 (INV-VIS 4) / §20 (INV-DEP 2) = **61 total testable invariants.**

**AMBIGUITIES:** 5 registered (§23 AMB-001..005). AMB-001 **RESOLVED** (D-AMB-001); AMB-002 **partially resolved** (no-duplicate-ID invariant established; recovery behavior still open).

**UNRESOLVED:** 3 (AMB-002 [collision-recovery behavior only], AMB-003, AMB-004 — owned by later parts with "resolution required before implementation").

**CRITICAL RISKS:** 5 — (1) multi-doc open-ID collision recovery (AMB-002), (2) accidental right-click destructive (mitigated by INV-002/INV-013), (3) stale document-bound UI on switch (mitigated by INV-005/§9), (4) silent save/undo data loss (mitigated by INV-008/009/010), (5) white-on-white visual defect (mitigated by INV-017/§17).

**SPECIFICATION STATUS: COMPLETE · IMPLEMENTATION STATUS: NOT IMPLEMENTED**

*(The 3 unresolved ambiguities are all owned by later parts (H02/H06/H10) and do NOT block H00 — H00's constitutional rules are complete; the ambiguities are correctly deferred with explicit "resolution required before implementation" gates, not silently resolved. Per §23, none may be silently chosen.)*

---

*STOP — H01 not started; SYS-03 not started; no code written. Awaiting manual review of H00.*
