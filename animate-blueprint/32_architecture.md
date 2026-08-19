# PART 32 — ORIGINAL APP ARCHITECTURE
### The module architecture for the new application. For each module: responsibilities, inputs, outputs, data structures, dependencies, events, state, performance considerations.

---

## 32.0 The system in one diagram (data flow)

```
                        ┌──────────────────────────────┐
 Desktop Input Engine ─▶│                              │
 Mobile  Input Engine ─▶│      Tool/Gesture Layer       │──▶ Commands ─▶ Undo/Redo
                        │   (Parts 02–06 tool specs)    │
                        └──────────────┬───────────────┘
                                       │ mutate
                        ┌──────────────▼───────────────┐
                        │      DOCUMENT MODEL (Part 33) │◀── Project Serializer
                        │  scenes/layers/frames/symbols │      (save/load/autosave)
                        └──────┬────────────────────┬───┘
                               │ evaluate(time)     │ changed
                    ┌──────────▼─────┐   ┌──────────▼──────────┐
                    │  Scene Graph    │   │  Event Bus          │──▶ Panels (Properties,
                    │  (render tree)  │   │  (context/selection │      Timeline, Library…)
                    └──────────┬─────┘   │   /document:changed)│
                               │         └─────────────────────┘
             ┌─────────────────┼──────────────────┐
      ┌──────▼──────┐  ┌───────▼──────┐  ┌────────▼────────┐
      │Vector Engine│  │ Raster Engine │  │  Text Engine    │
      └──────┬──────┘  └───────┬──────┘  └────────┬────────┘
             └─────────────────┼──────────────────┘
                       ┌───────▼───────┐
                       │ Canvas Renderer│──▶ WebGL/Canvas2D/Skia
                       └───────────────┘

Side engines (plug into the model): Tween, Rig/IK, Symbol, Audio, LipSync, Camera, Export.
```

**Golden rules:**
1. **Single source of truth** = the Document Model (Part 33). Every module reads/writes only through it (via Commands).
2. **All mutations are Commands** (undoable). Panels never write directly.
3. **Evaluation is pure**: `evaluate(model, time) → renderTree` — same path for editing and export (WYSIWYG, Part 01 §1.16).
4. **Everything cross-platform**: no OS-specific code above the Renderer/Input/Audio boundaries.

---

## 32.1 Canvas Renderer

- **Responsibilities:** rasterize the render tree to screen (or offscreen for export); apply view transform + camera (Part 16); draw selection overlays; manage render caches; hit-test support.
- **Inputs:** render tree (from Scene Graph), view state (zoom/pan/rotate), selection overlay state.
- **Outputs:** pixels to the canvas; hit-test results.
- **Data structures:** `RenderNode` tree (mirrors the scene graph, one per drawable), per-layer `LayerCache` (offscreen bitmap), `DrawCommand` list (sortable, cacheable).
- **Dependencies:** Vector Engine (tessellate paths), Raster Engine (bitmap blits), Text Engine (glyph atlas), Camera Engine (matrix).
- **Events:** emits `frameRendered`, `hitTest(query)`.
- **State:** caches + dirty flags; `dirtyRegions[]` per layer.
- **Performance:** **dirty-region rendering** (only changed layers re-rasterize); layer caches (a static layer renders once); GPU transforms for camera/zoom (no re-rasterize on pan/zoom — just re-composite); WebGL for gradients/filters/mesh warp; fallback Canvas2D. Target: **60 fps playback** on integrated GPUs; **interactive** editing on low-end.

---

## 32.2 Vector Engine

- **Responsibilities:** path representation (cubic Béziers), stroke outline generation (width profiles, caps, joins), fill tessellation (winding rules), **boolean ops** (union/intersect/subtract — used by merge mode, eraser, combine — Part 06), path simplification (smooth/straighten/optimize), shape-tween anchor correspondence (Part 09.3).
- **Inputs:** path data (anchors+handles), styles, boolean requests.
- **Outputs:** tessellated triangles/outline polygons for the renderer; modified paths.
- **Data structures:** `Path` (anchors, handles, closed), `Region` (anchor-index loops), `StrokeOutline` (offset polygon), `Mesh` (triangulation).
- **Dependencies:** none (pure geometry); used by Renderer + shape tools.
- **State:** stateless (pure functions) + a tessellation cache keyed by path hash.
- **Performance:** polygon clipping (Greiner–Hormann / Vatti) for booleans; ear-clipping/Earcut for triangulation; RDP for simplification; cache tessellations. Booleans run on a **worker** for big shapes.

---

## 32.3 Raster Engine

- **Responsibilities:** bitmap assets (decode, cache, mipmap), bitmap fills (tile/stretch), **pixel editing** (Magic Wand flood-fill, eraser on broken-apart bitmaps, color replace), bitmap filters (blur/glow via convolution), bitmap pencil (raster drawing — *[WISH W10]*).
- **Inputs:** bitmap buffers + pixel ops.
- **Outputs:** edited buffers, region masks (for Lasso/Wand selection).
- **Data structures:** `BitmapBuffer` (RGBA), `RegionMask` (alpha channel), mipmap chain.
- **Dependencies:** Renderer (blits).
- **State:** decoded cache, edited buffers (dirty).
- **Performance:** ops on GPU where possible (filters); flood-fill via BFS on a downsampled grid first (fast reject), then precise.

---

## 32.4 Scene Graph

- **Responsibilities:** build the render tree from the document at a given time; maintain the display list (z-order); resolve nesting (Part 11.8); apply masks (Part 21) and camera (Part 16); provide hit-testing (Part 03.2).
- **Inputs:** document model + time.
- **Outputs:** `RenderNode` tree + hit-test results.
- **Data structures:** `SceneNode` (transform + children + content ref), spatial index (R-tree per layer).
- **Dependencies:** Document model; calls Vector/Raster/Text for content.
- **State:** rebuilt per frame (cheap — it's references, not pixels) + cached spatial index.
- **Performance:** spatial index for O(log n) hit-tests; skip hidden/locked layers early.

---

## 32.5 Layer System

- **Responsibilities:** layer list, types (Part 20), folders, parenting (local-space transforms), visibility/lock/outline, z-depth, mask grouping.
- **Inputs:** layer ops (create/delete/reorder/…) from the timeline UI.
- **Outputs:** updated `layers[]` in the model.
- **Data structures:** `Layer` (Part 20 data model).
- **Dependencies:** Document model.
- **Events:** `layer:changed`.
- **Performance:** layer list ops are O(layers) — trivial.

---

## 32.6 Timeline Engine

- **Responsibilities:** the clock — playhead, frame ruler, sparse frame storage + the **hold rule** (Part 07.3), frame ops (insert/delete/copy/paste/reverse/convert — Part 07.4), playback ticking (requestAnimationFrame), scrubbing.
- **Inputs:** frame ops, play/scrub commands.
- **Outputs:** `evaluate(time)` calls to the Scene Graph; timeline UI state.
- **Data structures:** `Timeline` (layers + sparse frames), `PlayheadState`.
- **Dependencies:** Document model, Audio Engine (scrub audio), Scene Graph.
- **Events:** `playhead:moved`, `timeline:changed`.
- **Performance:** sparse storage (no per-frame objects); playback tick = one evaluate + dirty render.

---

## 32.7 Keyframe Engine

- **Responsibilities:** keyframe records (both families — Part 08), interpolation for all property types (numbers, rotation flags, colors in OKLab, scale log-lerp), keyframe move/delete/duplicate semantics (Part 08.4).
- **Inputs:** keyframe ops.
- **Outputs:** interpolated values; keyframe records.
- **Data structures:** `Keyframe`, per-property key arrays.
- **Dependencies:** Tween Engine (spans), Document model.
- **State:** pure interpolators + cached segment lookups.
- **Performance:** O(log n) key lookup; interpolation is arithmetic — negligible.

---

## 32.8 Tween Engine

- **Responsibilities:** tween spans (motion/classic/shape — Part 09), per-property keyframes, **easing** (Penner functions + custom Bézier + presets — Part 09.4), motion-path derivation (Part 10), motion presets.
- **Inputs:** tween creation/edits.
- **Outputs:** tween spans + evaluated property values.
- **Data structures:** `TweenSpan`, `PropertyCurve`, `EaseFunction`.
- **Dependencies:** Keyframe Engine, Vector Engine (shape morph).
- **Performance:** precompute arc-length tables for constant-speed paths (Part 10.2).

---

## 32.9 Rig Engine

- **Responsibilities:** character rigs (Part 13) — part hierarchy, pivots, poses, pose library, rig layers; **stable local-space math + stable IDs** *[WISH W2]* so copy/paste/re-parent can't corrupt poses.
- **Inputs:** rig edits (nest, pivot, pose).
- **Outputs:** rig data (Part 13.10).
- **Data structures:** `Rig`, `Pose`, `Part`.
- **Dependencies:** Document model, Symbol Engine.

---

## 32.10 IK Engine

- **Responsibilities:** bone graph + solvers (2-bone analytic, CCD, FABRIK — Part 14.4), constraints (rotation/translation/spring/joint-speed), pose interpolation (Part 08.3.8), bind weighting (IK shapes).
- **Inputs:** bone ops, drag-target.
- **Outputs:** solved joint angles → poses.
- **Data structures:** `Armature`, `Bone`, `Constraint`.
- **Dependencies:** Rig Engine, Timeline (pose layers).
- **Performance:** FABRIK converges in a few iterations for ≤20 bones; solvers run only at author-time (playback interpolates — Part 14.4).

---

## 32.11 Symbol Engine

- **Responsibilities:** symbol definitions + instances (Part 11), nesting/playback rules (graphic sync vs movie-clip free — Part 11.8), swap/duplicate, break-apart, edit modes.
- **Inputs:** symbol ops.
- **Outputs:** symbol/instance records.
- **Data structures:** `Symbol`, `Instance` (Part 11.10).
- **Dependencies:** Library, Scene Graph (nesting evaluation).

---

## 32.12 Audio Engine

- **Responsibilities:** audio decode + waveform, sync modes (Event/Start/Stop/Stream — Part 17.3), loop, trim, volume envelope, scrubbing, export mux (sample-exact — Part 17.6).
- **Inputs:** audio assets + keyframe attachments.
- **Outputs:** decoded buffers, played audio, exported tracks.
- **Data structures:** `SoundAsset`, `SoundAttachment`.
- **Dependencies:** Timeline (keyframe timing), Export Engine.
- **Performance:** decode on worker; Stream sync drops *animation* frames (not audio) per Part 17.

---

## 32.13 Lip Sync Engine

- **Responsibilities:** VAD (silence detection), phoneme recognition + confidence, viseme mapping (12-viseme dictionary — Part 18.1), frame assignment, phoneme-lane editing, batch/multi-character.
- **Inputs:** audio layer + mouth symbol + viseme map.
- **Outputs:** mouth-layer keyframes (instance first-frame) + phoneme-lane data.
- **Data structures:** `LipSyncResult` (Part 18.7).
- **Dependencies:** Audio Engine, Symbol Engine (Frame Picker), Timeline.
- **Performance:** recognition runs once per sync (offline); editable after.

---

## 32.14 Camera Engine

- **Responsibilities:** camera object + camera layer keyframes (Part 16), matrix (pan/zoom/rotate/z-depth parallax), attach-to-camera, presets, log-space zoom interpolation.
- **Inputs:** camera ops.
- **Outputs:** camera matrices per layer.
- **Data structures:** `Camera`, `CameraKeyframe`.
- **Dependencies:** Layer System (z-depth), Renderer.

---

## 32.15 Text Engine

- **Responsibilities:** text nodes (static/dynamic/input — Part 22), glyph atlas + font metrics, wrapping, embedding, runtime binding, export glyph outlining.
- **Inputs:** text edits.
- **Outputs:** rendered glyphs; metrics.
- **Data structures:** `TextNode`, `FontAtlas`, `FontMetrics`.
- **Dependencies:** Renderer (glyph blit), Export Engine.
- **Performance:** glyph atlas (one texture per font/size); cache text layout.

---

## 32.16 Asset Library

- **Responsibilities:** asset database (Part 12) — symbols/bitmaps/sounds/brushes, folders, search, preview, use-counts, import.
- **Inputs:** asset ops.
- **Outputs:** `library[]` + asset files.
- **Data structures:** `Asset` (Part 12 data model).
- **Dependencies:** Import (Part 27), Serializer.
- **Events:** `library:changed`.

---

## 32.17 Project Serializer

- **Responsibilities:** save/load the project (JSON + `assets/` folder — Part 33), **autosave + crash recovery** *[WISH W11]*, version migration, partial save (worker, non-blocking).
- **Inputs:** document model.
- **Outputs:** project file(s).
- **Data structures:** `ProjectFile` (Part 33).
- **Performance:** incremental save (dirty assets only); compress large documents; save on worker to keep UI responsive.

---

## 32.18 Undo/Redo Engine

- **Responsibilities:** command stack (Part 36) — record Commands with before/after, selection restore, coalescing (typing, slider drags), history panel.
- **Inputs:** Commands from tools/panels.
- **Outputs:** undo/redo of model state.
- **Data structures:** `Command` {do, undo, label, prevSelection}.
- **Performance:** store **diffs/IDs**, not full-model snapshots (memory-safe on long sessions).

---

## 32.19 Export Engine

- **Responsibilities:** all exporters (Part 28) — image/sequence/GIF/video/HTML5/audio — sampling the timeline identically to playback.
- **Inputs:** export settings + document.
- **Outputs:** files.
- **Dependencies:** Renderer (offscreen), Audio Engine (mux), Camera Engine.
- **Performance:** frame-parallel rendering (worker pool) for sequences/video.

---

## 32.20 Desktop Input Engine & Mobile Input Engine

- **Responsibilities:** translate raw input → **gestures** (Part 31) → tool events; keyboard → shortcut map (Part 29); stylus pressure/tilt.
- **Inputs:** mouse/keyboard/stylus (desktop); touch/pen (mobile).
- **Outputs:** `Gesture` events.
- **Data structures:** `Gesture` {type, points, modifiers, pressure, tilt}.
- **Dependencies:** Tool layer.
- **Performance:** pointer events at device rate; no per-event allocation churn.

---

## 32.21 BUILD CHECKPOINT M6 (architecture slice)

- [ ] All 21 modules stubbed with their interfaces; the golden rules (single model, commands-only, pure evaluate) enforced by the code structure.
- [ ] Renderer hits 60 fps playback with layer caches + dirty regions.
- [ ] Vector booleans + stroke outlines + tessellation working (they back merge mode + eraser).
- [ ] Undo/redo, autosave/recovery, cross-platform input adapters functional.

*Next: `33_data_model.md` — the JSON schemas for Project, Scene, Layer, Character, Body Part, Bone, Symbol, Instance, Frame, Keyframe, Tween, Pose, Audio, Mouth Shape, Camera, Asset, Text, Effect.*
