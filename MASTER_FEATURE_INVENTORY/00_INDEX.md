# KINEORA MASTER FEATURE INVENTORY — INDEX & READING GUIDE

> **Forensic extraction** of the complete Kineora Animation blueprint → one construction map.
> Source-of-truth chain read in full: **Phase 1 blueprint** (36 parts / `ANIMATE_BLUEPRINT_MASTER.md`, 7,734 lines) → **Phase 2 deep research** (405 features, 107 folders, 337 files) → **Phase 2.5 UI contracts** (38 contracts) → **Phase 3 engineering spec** (20 files) → **Phase 4 implementation** (`animator/` Rust + TS code).

---

## FILE MAP (read in order — forms ONE document, 23 sections)

| File | Sections | Contents |
|---|---|---|
| `00_INDEX.md` | — | this index + §1 + §2 |
| `01_DECOMP_A_tools_selection_transform.md` | §3 (part A) | Tools / Selection / Transform decomposition |
| `02_DECOMP_B_drawing_shape_timeline.md` | §3 (part B) | Drawing / Shape / Timeline / Keyframe decomposition |
| `03_DECOMP_C_tween_symbol_library.md` | §3 (part C) | Tween / Motion Path / Symbol / Library decomposition |
| `04_DECOMP_D_character_camera_audio.md` | §3 (part D) | Character / Bone-IK / FBF / Camera / Audio / Lip-sync / Facial decomposition |
| `05_DECOMP_E_structure_io_platform.md` | §3 (part E) | Layers / Masks / Text / Color / Align / Scenes / Properties / Import / Export / Shortcuts / Context-menus / Mobile / Architecture / Data / Buttons / Priorities / Final-notes decomposition |
| `06_MENUS_PANELS_TOOLS.md` | §4 §5 §6 §7 §8 §9 | Menu tree · Panel tree · Tool tree · Timeline tree · Symbol/Library tree · Property tree |
| `07_COMMANDS_SHORTCUTS_DIALOGS.md` | §10 §11 §12 | Command inventory · Shortcut inventory · Dialog inventory |
| `08_DATA_ENGINE_CONNECTION.md` | §13 §14 | Data/engine system inventory · UI→Engine connection map |
| `09_DEPENDENCY_ORDER_RELEASE.md` | §15 §16 §17 §18 | Dependency graph · Unlock graph · Master implementation order · Release/priority map |
| `10_CONFLICTS_GAPS_COVERAGE.md` | §19 §20 §21 §22 §23 | Conflicts · Dependency gaps · Ambiguous items · Duplicates merged · Coverage check |

---

## ID CONVENTIONS USED (from the blueprint, not invented)

| Prefix | Meaning | Source |
|---|---|---|
| `Part NN §N.N` | Phase-1 blueprint part + section | `animate-blueprint/` |
| `F-XX-YY` | Phase-2 feature ID (405 total) | `00_MASTER_FEATURE_QUEUE.md` |
| `C-XX` | Phase-2.5 UI contract (38 total) | `phase2.5-ui/contracts/` |
| `REQ-XXX-NNN` | Phase-3 requirement (68 total, 24 groups) | `engineering/01_requirements.md` |
| `MOD-XXX` | Module (54 total) | `engineering/02_module_architecture.md` |
| `CMD-XXX` | Command | `engineering/05_command_system.md` + `animator/core/src/command.rs` |
| `ENT-xxx` | Data entity (20+) | `engineering/03_document_model.md` |
| `STM-xxx` | State machine (8 total) | `engineering/04_state_machines.md` |
| `ENG-xxx` | Engineering decision (24 total) | `engineering/00_engineering_decisions.md` |
| `RSK-xxx` | Risk (15 total) | `engineering/00_engineering_risks.md` |
| `W1–W13` | Community wish baked into spec | `Part 00` |
| `D1–D10` | Discovered sub-feature (Phase 2) | `00_GLOBAL_DEEP_AUDIT.md` |
| `C1–C5` | Contradiction resolved (Phase 2) | `00_GLOBAL_DEEP_AUDIT.md` |
| `T2A.1…T2D.13` | Tool deep-spec IDs | `Part 02a–02d` |

## NOTATION
- `[REQUIRED]` / `[P0]`/`[P1]`/`[P2]`/`[P3]` = priority (Part 35).
- `[REQUIRED — RELEASE n]` = release slot.
- `[DEFERRED]` = explicitly deferred (not "not specified").
- `[AMBIGUOUS]` = blueprint mentions but doesn't fully specify.
- `[NOT SPECIFIED]` = absent from blueprint.
- `[OUR DESIGN DECISION]` = the project's own resolved design choice (not Adobe).
- `[LEGACY]` / `[REMOVED]` = historical Animate feature, not built in Kineora.
- `(ours)` = Kineora addition beyond Animate.

---

# KINEORA MASTER FEATURE INVENTORY

## 1. Executive Summary

Kineora Animation is an **original, Adobe-Animate-class, cross-platform 2D animation editor** (desktop Windows/macOS/Linux + browser + tablet), specified in **five phases of documentation** and partially implemented (`animator/` — Rust WASM core + React/TS shell).

The blueprint decomposes into:

- **~405 features** (F-01-01 … F-36-04), each audited, across **36 blueprint parts**.
- **38 UI contracts** (C-01 … C-38) specifying every control, state, interaction.
- **68 requirements** in 24 groups (REQ-*), **54 modules** (MOD-*), **20+ data entities** (ENT-*), **25+ commands** (CMD-*), **8 state machines** (STM-*), **24 engineering decisions** (ENG-*), **15 risks** (RSK-*).
- **10 discovered sub-features** (D1–D10), **5 resolved contradictions** (C1–C5), **13 community wishes** (W1–W13) baked in.
- **4 residual uncertainties** (documented, non-blocking).

**Current implementation state** (`animator/`, Phase 4 vertical slice — verified by running tests): document model, sparse timeline, command/undo, selection, transform, classic tween, layers, symbols/library (graphic/movie-clip/button + loop modes + swap + convert), WASM bridge, SVG export, Properties/Layers/Library/Timeline panels. **214 Rust tests + 277 UI tests green.**

**Not yet implemented** (explicitly deferred in `animator/STATUS.md`): motion tween, shape tween, drawing tools beyond rect, symbol edit-in-place/break-apart/duplicate, onion skin, camera, audio, lip-sync, bone/IK, asset warp, import/export beyond SVG, mobile, command palette.

This inventory is the **complete "WHAT must Kineora contain"** construction map — every feature decomposed to controls/options/states/interactions, with sources, dependencies, commands, shortcuts, and build order.

---

## 2. Complete Top-Level Feature Tree

```
KINEORA ANIMATION
├── Application Shell & Workspace          (F-01-01/02/03 · C-02)
├── Menus                                  (File/Edit/View/Insert/Modify/Text/Commands/Control/Debug/Window/Help · C-03)
├── Tools                                  (32 tools + smoothing pipeline · Part 02 · C-13/15/23/24/27)
│   ├── Selection & Transform tools        (Selection, Subselection, Free/Gradient Transform, 3D*, Lasso)
│   ├── Drawing tools                      (Pen, Text, Line, Rect, Oval, Primitives, PolyStar)
│   ├── Painting tools                     (Pencil, Brush, Paint Brush, Fluid*, Eraser, Width)
│   └── Utility/View/Rigging/Camera tools  (Eyedropper, Bucket, Ink, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp, Deco*, Spray*)
├── Stage & Canvas                         (F-01-16 · coordinates, pasteboard, compositing, render modes, grid/guides/rulers/snapping)
├── Selection System                       (F-03-01..19 · hit-testing, modes, overlays, lock/hide rules)
├── Transform System                       (F-04-01..14 · move/scale/rotate/skew/distort/envelope/pivot/numeric)
├── Drawing System                         (F-05-01..10 · stroke/fill model, merge vs object)
├── Shape System                           (F-06-01..12 · taxonomy, merge model, booleans, break-apart)
├── Timeline                               (F-07-01..16 · layers, frames, playhead, all frame ops)
├── Keyframe System                        (F-08-01..13 · two families, interpolation, auto-key)
├── Tweening                               (F-09-01..08 · motion/classic/shape + easing + graph editor)
├── Motion Path                            (F-10-01..06 · path, orientation, editing)
├── Symbols                                (F-11-01..14 · graphic/movie-clip/button, instances, nesting)
├── Library                                (F-12-01..13 · asset DB, folders, search, preview, reuse)
├── Character Animation                    (F-13-01..12 · cut-out pipeline, poses, clips)
├── Bone / IK                              (F-14-01..09 · armatures, solvers, constraints, pose layer)
├── Frame-by-Frame                         (F-15-01..06 · onion skin, cel/drawing reuse)
├── Camera                                 (F-16-01..07 · pan/zoom/rotate, depth/parallax, presets)
├── Audio                                  (F-17-01..09 · sync modes, waveform, trim, envelope)
├── Lip Sync                               (F-18-01..07 · visemes, auto-lip-sync, phoneme lane)
├── Facial Animation                       (F-19-01..07 · blink, gaze, mouth, expression, head)
├── Layers                                 (F-20-01..07 · 11 types, folders, parenting)
├── Masks                                  (F-21-01..06 · clip/alpha, animated, nested)
├── Text                                   (F-22-01..08 · static/dynamic/input, embed)
├── Color                                  (F-23-01..08 · picker, gradients, swatches, alpha)
├── Align / Distribute                     (F-24-01..06 · 6+6 ops, spacing, match-size)
├── Scenes                                 (F-25-01..06 · CRUD, tabs, per-scene timeline)
├── Properties Panel                       (F-26-01..12 · context-bound schemas)
├── Import                                 (F-27-01..08 · raster/vector/audio/video/sequences)
├── Export / Publish                       (F-28-01..11 · image/seq/GIF/video/HTML5/audio/project)
├── Shortcuts                              (F-29-01..12 · full map + rebindable editor)
├── Context Menus                          (F-30-01..10 · 10 scoped menus)
├── Mobile / Touch                         (F-31-01..10 · gesture bus, toolbar, loupe)
├── Architecture                           (F-32-01..21 · 21 engines/modules)
├── Data Model                             (F-33-01..19 · 19 JSON schemas)
├── UI Button Spec                         (F-34-01..07 · master button table + registry)
├── Priorities                             (F-35-01..04 · P0–P3 + build order)
├── Final Notes                            (F-36-01..04 · 10 rules, perf budget, glossary, checklist)
└── [WISH] Improvements                    (W1–W13 — baked across the above)
```

*`*` = legacy/removed (documented, not built).*

---
