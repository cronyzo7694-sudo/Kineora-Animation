# §15–§18: DEPENDENCY GRAPH · UNLOCK GRAPH · MASTER IMPLEMENTATION ORDER · RELEASE/PRIORITY MAP

---

## 15. DEPENDENCY GRAPH  [17_build_order.md · 00_MASTER_FEATURE_QUEUE.md §0.5]

### 15.1 Layer graph (dependency direction ↓)
```
FOUNDATION:  MOD-BUS → MOD-STATE → MOD-VECTOR → MOD-COLOR → MOD-EASING → MOD-COMMAND
CORE STATE:  MOD-DOC (03 entities) → MOD-PERSIST/AUTOSAVE
DOMAIN:      MOD-SCENEGRAPH → MOD-HITTEST → MOD-SELECTION → MOD-XFR
             MOD-FRAME → MOD-TIMELINE → MOD-KEYFRAME → MOD-TWEEN → MOD-PATH
             MOD-LAYER → MOD-MASK → MOD-SYMBOL → MOD-INSTANCE → MOD-LIBRARY
             MOD-RIG → MOD-BONE → MOD-IK → MOD-POSE → MOD-WARP
             MOD-TEXT → MOD-CAMERA → MOD-SCENE
SERVICES:    MOD-RENDER/CACHE → MOD-AUDIO → MOD-LIPSYNC/VISEME → MOD-IMPORT → MOD-EXPORT → MOD-NOTIFY
UI:          MOD-OVERLAY → MOD-MODAL → MOD-PANEL → MOD-SHELL/WORKSPACE → MOD-KBD → palette
PLATFORM:    MOD-INPUT → MOD-TOUCH → MOD-A11Y → MOD-TEST (cross)
```

### 15.2 Key dependencies (per blueprint)
| Feature | REQUIRES (must exist first) | DEPENDS ON (systems used) |
|---|---|---|
| **Hit testing** | scene graph, spatial index | selection |
| **Selection** | hit-testing, layer lock/hide | tools, properties, overlay |
| **Transform** | selection, transform component | pivot/registration (symbols) |
| **Drawing** | vector engine, stroke/fill model, draw-target contract | shapes, tools |
| **Shape** | vector booleans, merge model | drawing, eraser, combine |
| **Timeline** | frame model (sparse), hold rule | keyframes, tweens, symbols |
| **Keyframes** | timeline storage | tweens, motion path |
| **Motion tween** | keyframes (per-property), symbol/instance | motion path, presets |
| **Classic tween** | whole-frame keyframes | motion guide |
| **Shape tween** | shape model, anchor correspondence | shape hints |
| **Motion path** | motion tween x/y keys | orientation, graph editor |
| **Symbols** | timeline (nesting), library | instances, nesting |
| **Library** | symbol model, asset import | swap, reuse |
| **Bone/IK** | symbol instances (rig), local-space math | pose layer |
| **Asset Warp** | mesh/pins (vector+raster) | (independent of bones — mutually exclusive) |
| **FBF/Onion** | frame model, renderer caches | cel/drawing reuse |
| **Camera** | scene render + layer z-depth | parallax, presets |
| **Audio** | timeline keyframes, fps math | lip-sync, export mux |
| **Lip-sync** | audio + mouth symbol + frame picker | phoneme lane |
| **Facial** | symbols/nesting + frame picker | lip-sync |
| **Text** | text engine, glyph atlas | embed, binding |
| **Color** | color model, gradients | swatches, find&replace |
| **Align** | selection bounds | — |
| **Scenes** | timeline + shared library | tabs |
| **Properties** | selection + all schemas | commands (writes) |
| **Import** | library + per-format parsers | report |
| **Export** | renderer + evaluator + camera | audio mux, profiles |
| **Shortcuts** | command registry | conflict manager |
| **Context menus** | commands + overlay manager | — |
| **Mobile** | gesture bus + tools | loupe, toolbar |
| **Data model** | all (source of truth) | serializer |
| **Autosave** | serializer + dirty tracking | recovery |

---

## 16. UNLOCK GRAPH (what becomes possible after each system)

| System built | UNLOCKS |
|---|---|
| **Vector engine** (paths/booleans/tessellation) | merge model · eraser · combine objects · stroke outline rendering |
| **Selection** | all tools · properties panel · align · transform |
| **Transform** | pivot/registration · rigs · motion tweens |
| **Timeline + keyframes** | tweens · motion path · symbols · audio placement · lip-sync · FBF |
| **Motion tween** | property key diamonds · motion path · motion presets |
| **Symbols** | nesting · library · character rigs · lip-sync (frame picker) · reuse |
| **Library** | cross-doc reuse · swap · external library · import |
| **Rig/IK** | pose library · walk cycles · facial rigs |
| **FBF/Onion** | cel/drawing reuse [W1] · traditional animation |
| **Camera** | parallax · HUD layers · cinematic presets |
| **Audio** | lip-sync · video mux |
| **Lip-sync** | facial mouth system · expressions |
| **Text engine** | dynamic binding · per-char animation |
| **Color engine** | gradients · swatches · find&replace |
| **Import** | character part workflow (PSD per-layer) · sprite sheets |
| **Export engine** | publish profiles · HTML5/Web bundle |
| **Command palette + shortcuts** | discoverability backstop [W8] |
| **Gesture bus** | mobile/touch parity [W7] |
| **Autosave** | crash recovery [W11] |

---

## 17. MASTER IMPLEMENTATION ORDER  [17_build_order.md · Part 35 · animator/STATUS.md]

> Features appearing earlier in the blueprint are NOT necessarily earlier — order follows explicit dependencies.

### PHASE 0 — Foundation
**What:** MOD-BUS, MOD-STATE, MOD-VECTOR, MOD-COLOR, MOD-EASING, MOD-COMMAND.
**Prereqs:** none. **Unlocks:** everything. **Gate:** unit green + command invariants.
**Do NOT build yet:** any UI panel or domain feature.

### PHASE 1 — Document & persistence
**What:** MOD-DOC (all 19 schemas), MOD-PERSIST, MOD-AUTOSAVE.
**Prereqs:** Foundation. **Unlocks:** all domain. **Gate:** AC-PERSIST (round-trip, recovery, ID-safe rename).

### PHASE 2 — Static editor (drawing editor)
**What:** MOD-SCENEGRAPH, HITTEST, SELECTION, XFR, DRAWING, SHAPE, LAYER, MASK, TEXT, COLOR, RENDER, SHELL, PANEL, OVERLAY, MODAL, INPUT.
**Gate:** AC-SEL / AC-XFR / AC-SHP / AC-UI. **Result:** working drawing editor (M1).

### PHASE 3 — Animation
**What:** MOD-FRAME, TIMELINE, KEYFRAME, TWEEN, EASING, PATH, FBF, ONION.
**Gate:** AC-TIM / AC-KF / AC-TWN. **Result:** animation editor (M2).

### PHASE 4 — Reuse
**What:** MOD-SYMBOL, INSTANCE, LIBRARY, SCENE.
**Gate:** AC-SYM / AC-SCN. **Result:** Animate-class reuse (M3).

### PHASE 5 — Characters
**What:** MOD-RIG, BONE, IK, POSE, WARP, FACIAL.
**Gate:** AC-RIG (copy/paste no-corruption). **Result:** character studio (M4).

### PHASE 6 — Media
**What:** MOD-CAMERA, AUDIO, LIPSYNC, VISEME.
**Gate:** AC-CAM / AC-AUD / AC-LIP. **Result:** cinematic + speech.

### PHASE 7 — I/O
**What:** MOD-IMPORT, EXPORT, NOTIFY.
**Gate:** AC-IMP / AC-EXP (overlay-free export). **Result:** shipped output.

### PHASE 8 — Platform
**What:** MOD-TOUCH, KBD, A11Y, TEST(CI), PLUGIN(P2).
**Gate:** AC-MOB / AC-KBD / AC-UI. **Result:** cross-platform hardening.

### Blockers & parallelism
- **Blockers:** MOD-DOC blocks all domain; MOD-COMMAND blocks mutating UI; MOD-RENDER blocks panels.
- **Parallel:** COLOR ∥ EASING ∥ VECTOR; AUDIO ∥ LIPSYNC (after DOC); IMPORT ∥ EXPORT (after RENDER); C-36/37 suites ∥ all UI.
- **Critical path:** FOUNDATION → DOC → SCENEGRAPH/SELECTION → TIMELINE/TWEEN → SYMBOL/RIG → AUDIO/LIPSYNC → EXPORT.
- **High-risk (build early, test hard):** timeline (RSK-001), nesting (RSK-002), rig (RSK-003), lipsync (RSK-004).

### Current implementation status (animator/, Phase 4 slice)
✅ Done: document model · sparse timeline · command/undo · selection · transform (move/scale/rotate) · classic tween · layers · symbols/library (graphic/movie-clip/button + loop modes + swap + convert + empty-instance marker) · WASM bridge · SVG export · Properties/Layers/Library/Timeline panels.
⏭ Next (per STATUS.md order): 1. motion tween → 2. symbol edit modes + break-apart + duplicate → 3. drawing tools (oval/line) + shape merge → 4. object lock/hide + draggable pivot + tool options + shortcuts → 5. onion skin + camera/audio → 6. export extensions (sequence/GIF/video) + progress/cancel + publish profiles.

---

## 18. RELEASE / PRIORITY MAP  [Part 35 · F-35-01..04]

### 18.1 Priority definitions
| Tier | Meaning | Ship |
|---|---|---|
| **P0** | MVP core — app useless without | Release 1 |
| **P1** | "Real product" | Release 1–2 |
| **P2** | Advanced/QoL (better than Animate) | Release 2–3 |
| **P3** | Optional/niche/legacy | Later/never |

### 18.2 Classification (complete)
**Foundations:** doc model+serializer+autosave (P0) · undo/redo+selection restore (P0) · event bus+panel manager+workspace (P0) · cross-platform shell (P0) · plugin API (P2).

**Drawing & shape:** path model+fill/stroke (P0) · stroke model (P0) · merge+object mode (P0) · booleans (P0) · Pen/Line/Rect/Oval/PolyStar/Pencil/Brush/Eraser/Width (P0) · fill styles+gradient transform (P0) · primitives (P1) · Paint Brush+library (P1) · variable width+profiles (P1) · Trace Bitmap (P1) · expand/soften (P2) · ragged/stipple (P3) · generator brushes (P3).

**Selection & transform:** selection (P0) · free transform (P0) · subselection (P0) · distort/envelope (P1) · numeric panel (P1) · copy/remove transform (P1) · magic wand (P1) · rotated-bounds align (P2).

**Timeline & animation:** timeline (P0) · all frame ops (P0) · keyframes+interpolators (P0) · motion tween (P0) · classic tween (P0) · shape tween (P0) · motion path (P0) · easing (P0) · motion presets (P1) · graph editor (P1, W4) · motion guide (P2) · constant-speed path (P2) · auto-keyframe scrub (P2).

**Symbols & reuse:** symbols+instances (P0) · convert-to-symbol+grid (P0) · nesting+sync (P0) · swap/duplicate/break (P0) · library (P0) · edit-in-place+breadcrumb (P0) · color effect+filters (P1) · frame picker (P1) · external library (P1) · font symbols (P3).

**Layers/masks/text/color/align:** layers (P0) · layer parenting (P1) · masks (P0) · alpha masks (P1) · text (P0) · color system (P0) · find&replace (P1) · align/distribute (P0).

**Character & rigging:** cut-out pipeline (P0) · bone/IK (P1) · asset warp (P1) · FBF+onion (P0) · cel reuse (P1, W1) · pose library (P1) · facial systems (P1) · auto-blink (P2) · 360° head turns (P3).

**Camera/audio/lip-sync:** camera (P1) · camera presets (P2) · audio (P1) · lip-sync (P1) · phoneme lane+confidence (P2) · multi-language (P3).

**Import/export:** import PNG/JPEG/SVG/MP3/WAV/PSD (P0) · export image (P0) · sequence+GIF+video (P0) · HTML5 (P1) · sprite sheets (P1) · WebM/OGG/FLAC/WebP (P2) · glTF (P3).

**UX/platform:** shortcuts+editor (P0) · context menus (P0) · touch adapter+loupe+toolbar (P1) · hover-preview (P1) · accessibility (P2) · AI in-betweening (P2, W9) · cloud sync (P3).

### 18.3 Release roadmap
| Release | Scope | Result |
|---|---|---|
| **Release 0** | Parts 01–06 | working drawing editor |
| **Release 1** | Parts 07–12 | working animation editor |
| **Release 2** | Parts 13–19 | character-animation studio |
| **Release 3** | Parts 27–31 | shipped product |
| **Release 4** | W1–W13 | better than Animate |
