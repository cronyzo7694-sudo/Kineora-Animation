# KINEORA — MASTER EXECUTION PLAN

> **Role:** This is THE document every future AI (specification or implementation) must read before doing work.
> **Authority order:** Blueprint > Phase 2 > Phase 2.5 > Phase 3/Engineering > APPROVED decisions > approved forensic specs > Adobe (evidence) > code (evidence) > tests > inference.
> **Do NOT code from this file. This file coordinates the 28-system build.**

---

## A. Project Mission

Build **Kineora Animation** — an original, professional 2D animation editor (Adobe Animate-class), cross-platform (Windows/macOS/Linux/browser/tablet), from the Kineora Blueprint (36 parts) + Phase 2 (405 features) + Phase 2.5 (38 UI contracts) + Phase 3 (engineering: 18 files).

**Golden rules (Part 36, binding everywhere):** single source of truth (document model) · all mutations = Commands · pure deterministic `evaluate(model, time)` · stable IDs (rename-safe) · local-space rig math · sparse frame storage · dirty-region + layer caches · nothing-is-a-black-box · undo-consistent selection · crash-safe atomic autosave.

---

## B. Current Project State (verified this pass — not assumed)

| Asset | State |
|---|---|
| `ANIMATE_BLUEPRINT_MASTER.md` | 36 parts, authoritative |
| `animate-blueprint/` | 36 part files |
| `phase2-knowledge-base/` | 405 features (deep research) |
| `phase2.5-ui/` | C-01..C-38 contracts |
| `engineering/` | 18 files: decisions, risks, REQ, MOD, ENT, STM, CMD, persistence, build order |
| `MASTER_FEATURE_INVENTORY/` | 11 files incl. dependency graph + coverage |
| `FORENSIC_SPECS/` | **SYS-01** (LOCKED, v5) · **SYS-02** (H00–H14) · **SYS-03** (00 + H00–H07) · `AI01_FORENSIC_LESSONS.md` (FL-0001..0034) |
| `animator/` | **EVIDENCE ONLY** — core (model/session/command/eval/wasm/export/persist/easing/id), ui (App/controlRegistry/panels), desktop (Tauri). 67 src files. Single-Session, no multi-doc, no dirty tracking in UI, `nav.back` dead stub. |
| Git | branch `main`; **no remote configured** (push target pending) |

**SYS-01 status:** LOCKED (spec complete; impl partial — event bus/palette/tabs/responsive absent).
**SYS-02 status:** H00/H02/H03/H04/H05/H06/H08/H09/H10/H11/H12/H13/H14 READY; **H01 REVISION REQUIRED** (AMB-H01-002/003); **H07 REVISION REQUIRED** (AMB-H07-001).
**SYS-03 status:** H00/H01/H03/H04/H05/H06/H07 READY; **H02 REVISION REQUIRED** (AMB-S03-003 format list).

---

## C. Full SYS-01 → SYS-28 Map

> Numbering = registry order (from `00_SYSTEM_QUEUE.md`), NOT dependency order. Dependency graph in §D.

| SYS | Name | Responsibility | Major commands/events | Assigned AI | Spec | Impl |
|---|---|---|---|---|---|---|
| 01 | Application/Workspace | shell, panels, docking, tabs, status, toolbars, workspace, palette, event bus, control registry | `panel.*`, `workspace.*`, `palette.*`; events `panel:changed`, `workspace:changed`, `activeDoc:changed` (registry) | AI-A | **LOCKED (v5)** | partial |
| 02 | File | menu + document lifecycle (New/Open/Save/Close/Exit), identity, dirty, recent, templates | `file.*`, `tab.activate/close`; `openSet:changed`, `saving:changed`, `activeDoc:changed` | AI-A | H00–H14 (H01/H07 REVISION REQ) | single-Session gap |
| 03 | Edit | menu + clipboard + selection commands + undo/redo + History panel | `edit.undo/redo/cut/copy/paste/duplicate/delete/selectAll/deselectAll/findReplace`, `history.jump` | AI-A | 00+H00–H07 (H02 REVISION REQ) | History + frame_clipboard only |
| 04 | View | zoom/rulers/guides/grid/snapping/preview | `view.*`, `snap.*` | AI-A | QUEUED | — |
| 05 | Insert | Insert menu (frames, symbols, scenes) | `insert.*` | AI-A | QUEUED | — |
| 06 | Modify | Modify menu + scenes + align | `scene.*`, `align.*` | AI-A | QUEUED | — |
| 07 | Text | Text menu + full text system | `text.*` | AI-A | QUEUED | — |
| 08 | Commands | command palette + shortcut editor + macros | `palette.run`, `shortcuts.*` | AI-B | QUEUED | palette absent |
| 09 | Control/Playback | transport (play/pause/seek/loop) | `playback.*`; `playback:started/stopped`, `playhead:moved` | AI-B | QUEUED | partial |
| 10 | Debug | debug panel + logging | `debug.*` | AI-B | QUEUED | — |
| 11 | Window | panel show/hide menu | `panel.show/hide` (SYS-01 owns) | AI-B | QUEUED | — |
| 12 | Help | docs/about/shortcut viewer | — | AI-B | QUEUED | — |
| 13 | Tools | EVERY tool (27-field) | `tool.activate`; `tool:changed` | AI-B | QUEUED | 5 tools |
| 14 | Stage | canvas + hit-test + selection engine + overlays | `stage.*`; `selection:changed`, `context:changed` | AI-B | QUEUED | partial |
| 15 | Timeline | frames + playhead + keyframes | `timeline.*`; `timeline:changed`, `playhead:moved` | AI-C | QUEUED | partial |
| 16 | Layers | layers + masks | `layer.*`; `layer:changed` | AI-C | QUEUED | partial |
| 17 | Properties | context-bound property schemas | `prop.*` (writes via commands) | AI-C | QUEUED | partial |
| 18 | Library | asset DB + swap + external library | `library.*`; `library:changed` | AI-C | QUEUED | partial |
| 19 | Symbols/Instances | symbol nesting + instances + edit modes | `symbol.*`, `instance.*`; `editMode:entered/exited` | AI-C | QUEUED | partial |
| 20 | Drawing/Shapes | vector engine + merge/object model + booleans | `draw.*`, `shape.*` | AI-C | QUEUED | partial |
| 21 | Color | color model + gradients + swatches | `color.*` | AI-C | QUEUED | partial |
| 22 | Transform | move/scale/rotate/skew/free/distort/envelope | `transform.*` | AI-D | QUEUED | partial |
| 23 | Tweening | motion/classic/shape tween + easing + motion path + graph editor | `tween.*` | AI-D | QUEUED | partial |
| 24 | Onion/FBF | onion skin + frame-by-frame + cel reuse | `onion.*`, `fbf.*` | AI-D | QUEUED | — |
| 25 | Camera | camera + z-depth parallax | `camera.*` | AI-D | QUEUED | — |
| 26 | Audio | audio + lip-sync + viseme | `audio.*`, `lipsync.*` | AI-D | QUEUED | — |
| 27 | Import/Export/Publish | per-format import/export/publish pipelines | `file.import/export/publish` (handoff); `export:done` | AI-D | H08 handoff READY | export-image only |
| 28 | Persistence | save/autosave/recovery/migration/corruption | `persist.*`; `saving:changed` | AI-D | H10 handoff READY | atomic save/load native-only |

---

## D. Dependency Graph (module-level truth — NOT SYS-number order)

Source: `engineering/17_build_order.md` + `MASTER_FEATURE_INVENTORY/09`.

```
FOUNDATION:   MOD-BUS → MOD-STATE → MOD-VECTOR → MOD-COLOR → MOD-EASING → MOD-COMMAND
CORE STATE:   MOD-DOC (03 entities) → MOD-PERSIST / MOD-AUTOSAVE
DOMAIN:       MOD-SCENEGRAPH → MOD-HITTEST → MOD-SELECTION → MOD-XFR
              MOD-FRAME → MOD-TIMELINE → MOD-KEYFRAME → MOD-TWEEN → MOD-PATH
              MOD-LAYER → MOD-MASK → MOD-SYMBOL → MOD-INSTANCE → MOD-LIBRARY
              MOD-RIG → MOD-BONE → MOD-IK → MOD-POSE → MOD-WARP
              MOD-TEXT → MOD-CAMERA → MOD-SCENE
SERVICES:     MOD-RENDER/CACHE → MOD-AUDIO → MOD-LIPSYNC/VISEME → MOD-IMPORT → MOD-EXPORT → MOD-NOTIFY
UI:           MOD-OVERLAY → MOD-MODAL → MOD-PANEL → MOD-SHELL/WORKSPACE → MOD-KBD → palette
PLATFORM:     MOD-INPUT → MOD-TOUCH → MOD-A11Y → MOD-TEST (cross)
```

### Dependency classes

| Class | Meaning | Modules/Systems |
|---|---|---|
| **MUST PRECEDE** (foundation) | nothing above can build without it | MOD-BUS, MOD-STATE, MOD-COMMAND, MOD-VECTOR, MOD-COLOR, MOD-EASING, MOD-DOC |
| **CAN RUN IN PARALLEL** | independent given shared foundation | COLOR ∥ EASING ∥ VECTOR · AUDIO ∥ LIPSYNC (after DOC) · IMPORT ∥ EXPORT (after RENDER) · C-36/C-37 suites ∥ all UI |
| **OPTIONAL DEPENDENCY** | nice-to-have, not blocking | PLUGIN (P2), reselect-last-selection (P2), per-object hide (P2) |
| **INTEGRATION-ONLY DEPENDENCY** | build independently, integrate at gate | SYS-02 ↔ SYS-27/28 (File ↔ Import/Export/Persistence = handoff) · SYS-03 ↔ SYS-15 (frame clipboard handoff) · SYS-14 ↔ SYS-13 (stage ↔ tools) |

**Critical finding:** the foundation modules (MOD-DOC, MOD-COMMAND, MOD-BUS, MOD-VECTOR, MOD-COLOR, MOD-EASING, MOD-STATE) are **cross-cutting across ALL four AI groups**. They must be owned by ONE authority (the build-order P0/P1 phases) and published as the shared contract BEFORE the AI split begins — otherwise four AIs will each invent their own event bus / command interface / document model. See `CROSS_SYSTEM_CONTRACT.md` §C and `AI_ASSIGNMENTS.md`.

---

## E. Critical Integration Chains (evidence-backed)

| Chain | Systems | Contract source |
|---|---|---|
| File → Persistence | SYS-02 (H05/H06) → SYS-28 | `saving:changed{state,time?}`, `persist::save/load` handoff |
| File → Import/Export | SYS-02 (H08) → SYS-27 | `file.import/export/publish` → `export:done` |
| Edit → Selection | SYS-03 → SYS-14 | `selection:changed{prevTargets,targets,kind,commonType,bounds}` |
| Edit → Timeline (frame clipboard) | SYS-03 (handoff) → SYS-15 | frame clipboard = SYS-15 |
| Stage → Selection | SYS-14 (hit-test) → selection engine | Part 03; MOD-HITTEST → MOD-SELECTION |
| Timeline → Layers | SYS-15 → SYS-16 | `layer:changed`, frame ops |
| Properties → Transform | SYS-17 → SYS-22 | property writes via commands |
| Symbols → Library | SYS-19 → SYS-18 | symbol/instance model → asset DB |
| Tweening → Timeline | SYS-23 → SYS-15 | keyframes/spans |
| Audio → Timeline | SYS-26 → SYS-15 | `playhead:moved`, sync events |
| Camera → Stage render | SYS-25 → SYS-14 | depth sort, overlays |

---

## F. Risk Map (systems that can break many others)

| System | Why high-risk | Source |
|---|---|---|
| MOD-DOC (SYS-02/03/28 core) | single source of truth — every system reads/writes it | RSK-006, Part 36 rule 1 |
| MOD-COMMAND (SYS-03) | undo/dirty/event propagation — every mutation flows through it | RSK-011 |
| Timeline (SYS-15) | sparse frames + spans + hold rule — hardest data model | RSK-001 |
| Symbols/Nesting (SYS-19) | recursion, sync mapping, edit modes | RSK-002 |
| Rig/IK (SYS-13+19) | copy/paste/re-parent corruption | RSK-003 |
| Selection (SYS-14) | spine of the editor — tools/properties/transform all depend | Part 03 §3.0 |
| Export (SYS-27) | long encodes, cancel/resume | RSK-008 |
| Event bus (SYS-01) | every cross-panel channel; no polling | SYS-01 §27 |

---

## G. Integration Gates (when a SYS may integrate)

A SYS may enter INTEGRATION only when ALL hold:
1. SPEC STATUS = READY FOR IMPLEMENTATION (0 implementation-critical ambiguities) — per Leader gate (§24 of the directive).
2. Commands/events/states reconciled against `CROSS_SYSTEM_CONTRACT.md`.
3. All `MUST PRECEDE` dependencies are at least SPEC-COMPLETE.
4. No dead/orphan controls.
5. Lessons pre-flight passed (AI01_FORENSIC_LESSONS.md read first).
6. Automated tests green AND manual acceptance recorded (never "green = complete").

---

## H. What MUST NOT Start Yet

- **SYS-01**: LOCKED — do not regenerate; only a future controlled revision (it has known stale notes: §30 "File▸Close→tab.close(id)", §8 "Close Others included D-7").
- **SYS-02 H01/H07**: blocked on AMB-H01-002/003, AMB-H07-001 (product decisions).
- **SYS-03 H02**: blocked on AMB-S03-003 (format list — product decision).
- **Any new SYS spec**: not until the Leader names the next system (per `00_SYSTEM_QUEUE.md` process).
- **Any implementation code**: not in AI-01's scope; AI-02 blocked until a SYS package is explicitly handed off after human PASS.

---

*This file = the master map. Read `CROSS_SYSTEM_CONTRACT.md` before any cross-system work; read `AI_ASSIGNMENTS.md` before claiming ownership; read `BLOCKERS.md` before declaring anything READY.*
