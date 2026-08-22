# KINEORA — CROSS-SYSTEM CONTRACT (GLOBAL)

> **The single most important coordination file.** Every cross-system claim must trace to evidence. Where no source establishes a fact, write **SOURCE DOES NOT ESTABLISH THIS** (never invent).
> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions > approved forensic specs > Adobe (evidence) > code (evidence).

---

## A. SYS Ownership (one owner per SYS — full map in MASTER_EXECUTION_PLAN §C)

Rules:
- One SYS owns each behavior; other SYS handoff to it (never re-implement).
- Cross-SYS = **handoff** (menu entry → owner's command → owner's engine), never absorption (FL-0016).

| Concern | Owner | Evidence |
|---|---|---|
| shell/panels/docking/status/toolbar/workspace | SYS-01 | Part 01 §1.1 |
| event bus + control registry + overlay/modal managers | SYS-01 (infrastructure) | SYS-01 §27/§28/§29 |
| document lifecycle (New/Open/Save/Close/Exit) + identity + dirty | SYS-02 | Part 01 §1.2.1 |
| undo/redo engine + History + clipboard + selection commands | SYS-03 | Part 01 §1.2.2, 32.18 |
| selection ENGINE (hit-test/marquee/lasso/per-type) | SYS-14 | Part 03 |
| timeline/frames/keyframes/playhead | SYS-15 | Part 07 |
| import/export/publish engines | SYS-27 | Part 27/28 |
| persistence/serialization/autosave/recovery | SYS-28 | Part 33/36, eng 13 |

---

## B. Command Ownership (one commandId = one owner = one semantic action)

- Canonical registries: SYS-02 H09 (§5), SYS-03 H02/H03.
- **No duplicate IDs · no aliases-as-separate-commands · no drift.** (`file.close()` vs `tab.close(docId)` are INTENTIONALLY distinct — see SYS-02 H07 §9.)
- Every FUNCTIONAL control resolves to ONE commandId (SYS-01 §30, INV-CMD-1/3/4).
- Commands are the ONLY writer to MOD-DOC (REQ-SYS-002). Panels never write directly.

---

## C. Foundation Modules (CRITICAL — cross-cutting, single-owner)

The following are **shared foundation**, not owned by any single SYS. They are established by build-phase **P0/P1** and published as the contract BEFORE the 4-AI split:

| Module | Purpose | Spec source | Owned by (phase) |
|---|---|---|---|
| MOD-BUS | pub/sub event bus | SYS-01 §27 | P0 |
| MOD-STATE | state-machine registry | eng 04 | P0 |
| MOD-COMMAND | Command interface + History + undo/redo | eng 05 | P0 |
| MOD-VECTOR | paths/strokes/booleans/tessellation | Part 05/06 | P0 |
| MOD-COLOR | color model/gradients | Part 23 | P0 |
| MOD-EASING | penner + bézier curves | Part 09.4 | P0 |
| MOD-DOC | authoritative document model (ENT-*) | eng 03 | P1 |

**Rule:** no AI may redefine these. If a SYS needs a change to a foundation module, it files a cross-system change request (`INTEGRATION_LOG.md`) and the Leader reconciles it against ALL dependents.

---

## D. Event Ownership (one event = one producer + one canonical payload + known consumers)

Locked events (SYS-01 §27.1, verbatim — payloads single-sourced, FL-0030):

| Event | Producer | Payload | MUST NOT fire on |
|---|---|---|---|
| `activeDoc:changed` | SYS-02 (H02) | `{docId}` | open-set-only change; save |
| `openSet:changed` | SYS-02 (H02), D-AMB-004 | `{change:'added'\|'removed'\|'reordered', docId?}` | activation-only change |
| `document:changed` | Command post-do | `{type, targets}` | save; view/session/workspace change |
| `saving:changed` | SYS-28 (SYS-02 trigger) | `{state:'saving'\|'saved'\|'error', time?}` | non-save change |
| `selection:changed` | MOD-SELECTION (SYS-14) | `{prevTargets, targets, kind, commonType, bounds}` | per pointer-move; copy |
| `library:changed` | SYS-18 | `{type, assetId}` | — (SYS-02 never emits) |
| `export:done` | SYS-27 | `{format, path}` | — (SYS-02 never emits) |
| `panel:changed` / `workspace:changed` | SYS-01 | per SYS-01 §27.1 | — |

Ordering: when open-set AND active both change → `openSet:changed` FIRST, then `activeDoc:changed` (D-AMB-004). Never reuse an event as a refresh hack (FL-0007).

---

## E. State Ownership

| State | Owner | Boundary |
|---|---|---|
| document lifecycle (NO_DOCUMENT/ACTIVE/OPENING/RECOVERED) | SYS-02 (H00 §6) | per-app |
| identity (UNTITLED/TITLED) | SYS-02 | per-doc |
| dirty (CLEAN/DIRTY/SAVING/SAVE_ERROR) | SYS-02 H04 | per-doc (snapshot-based) |
| active/inactive | SYS-02 H02 | orthogonal dimension |
| History (canUndo/canRedo) | SYS-03 H01 | per-doc, SESSION |
| clipboard (EMPTY/HAS_OBJECTS/HAS_FRAMES) | SYS-03 H02 | SESSION (app-level) |
| selection | SYS-14 (MOD-SELECTION) | per-doc SESSION, view state |
| playback (IDLE/PLAYING/PAUSED) | SYS-09 | view state |

No flat enum of orthogonal dimensions (FL-0021). OPEN_FAILED is NOT a state (it's an error outcome — SYS-02 H06).

---

## F. Data / Persistence Ownership (4 boundaries — SYS-01 §18)

| Boundary | Contents | Owner |
|---|---|---|
| DOCUMENT | scenes/layers/frames/symbols/settings/audio/formatVersion + assets/ | SYS-28 |
| PREFERENCES | workspace, shortcuts, theme, recent-files, template-store | SYS-01 + SYS-02 (recent) |
| SESSION | activeDocumentId, open-set, selection, playhead, History, clipboard | owners |
| TEMPORARY | dirty flag, save state, panel temp resize | owners |

Workspace/preferences NEVER written into the project file (INV-PERS-3). Clipboard = SESSION, never persisted (INV-EDIT-4).

---

## G. UI Ownership (chrome vs semantics)

- **Chrome** (menu bar, tab strip, modal/overlay rendering, panel frame, status bar) = SYS-01.
- **Semantics** (what a menu item/tab/control DOES) = the owning SYS.
- SYS-01 renders; the owning SYS owns state + consequences (FL-0009).

---

## H. Cross-System APIs (handoffs — canonical)

| Handoff | Caller → Owner | Contract |
|---|---|---|
| Save/Open | SYS-02 → SYS-28 | `persist::save(doc,path)` / `persist::load(path)` → result event |
| Import/Export/Publish | SYS-02 → SYS-27 | `file.import/export/publish*` → `export:done` / `library:changed` |
| Frame clipboard | SYS-03 (entry) → SYS-15 | frame ops owned by SYS-15 |
| Break Apart / Group | SYS-03 (entry) → SYS-19/SYS-20 | context-menu entry only |
| Arrange | SYS-03 (entry) → SYS-06 | context-menu entry only |
| External library | SYS-02 → SYS-18 | `file.openExternalLibrary` |

---

## I. Forbidden Direct Mutations

- Panels/tools must NEVER write MOD-DOC directly (REQ-SYS-002).
- No panel reads another panel directly (REQ-SYS-006) — only via the bus.
- SYS-02 never implements SYS-28 atomic-write/autosave internals (INV-PERS-1).
- SYS-03 never implements hit-testing (SYS-14) or frame storage (SYS-15).

---

## J. Integration Rules

1. A SYS integrates only after its SPEC is READY + foundation modules are published.
2. Cross-SYS changes go through `INTEGRATION_LOG.md` (record → review → verify → approve).
3. No silent cross-system drift — the Leader verifies every contract change.

---

## K. ID Namespaces (from engineering 00)

`F-XX-YY` (Phase-2 features) · `C-XX` (UI contracts) · `REQ-XXX-NNN` (requirements) · `MOD-XXX` (modules) · `CMD-XXX` (commands) · `EVT-xxx` (events) · `ENT-xxx` (entities) · `STM-xxx` (state machines) · `ENG-xxx` (decisions) · `RSK-xxx` (risks) · `TS-xxx` (tests) · `AMB-XXXX` (ambiguities) · `D-XXX` (decisions) · `FL-XXXX` (forensic lessons) · `P-XX` (SYS-02 resolutions).

---

## L. Naming Conventions

- commandIds: `system.action` camelCase (e.g. `file.save`, `edit.paste`, `tab.close`). One ID everywhere (INV-CMD-4).
- controlIds: `system.element` (e.g. `file.save`, `edit.undo`, `dlg-new.width`).
- testIds: `T-<system>-<behavior>` (e.g. `T-save`, `T-clip-id`). Stable unless semantics change.

---

## M. Error Propagation Rules

- NO silent failure (INV-ERR-1). Every failure surfaces (toast/inline/status).
- Failed op = no partial mutation + no corrupt undo entry (INV-ERR-2).
- Save failure preserves DIRTY + last-good file (INV-ERR-3).

---

## N. Undo / Dirty Boundaries

- Undo: per-document History, SESSION, save preserves, reload resets (INV-UNDO-1/2).
- Dirty: snapshot-based, per-document, only DOCUMENT MUTATION sets it (INV-DIRTY-1..4).
- View/session/workspace/preference actions NEVER clear DIRTY or create undo entries (INV-UNDO-3).

---

## O. Document / Session / Workspace Boundaries

| Layer | Scope | Persist? |
|---|---|---|
| Document | ENT-project (content) | DOCUMENT (via SYS-28) |
| Session | selection/playhead/History/open-set/clipboard | SESSION |
| Workspace | panel layout/shortcuts/theme | PREFERENCES |

---

## P. Lifecycle Boundaries

- Document lifecycle = SYS-02 (H00 §6: NO_DOCUMENT/ACTIVE/OPENING/RECOVERED).
- Active-pointer vs open-set = SYS-02 (H02) — never conflated (FL-0008).
- Open = add+activate (multi-doc), NO guard (FL-0032); the previously-active doc becomes INACTIVE (dirty preserved).

---

## Q. "SOURCE DOES NOT ESTABLISH THIS" Register (known unknowns — do NOT invent)

| Question | Status |
|---|---|
| Paste Special format option list | AMB-S03-003 (open — product decision) |
| next-active after close (survivors) | AMB-H07-001 (open — product decision) |
| duplicate template name | AMB-H01-002 (open) |
| New-from-Template seeded identity | AMB-H01-003 (open) |
| recent-list store + API | AMB-003 (open, H10) |
| duplicate-ID collision recovery | AMB-002 (open, H10) |
| Tauri accelerator wiring | AMB-004 (open, H10/H11) |

*(Full register: `BLOCKERS.md` + `DECISIONS.md`.)*

---

*This contract is the binding surface between the four AI groups. Any change to it = a cross-system change (`INTEGRATION_LOG.md`) requiring Leader verification.*
