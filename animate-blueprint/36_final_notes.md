# PART 36 — FINAL NOTES
### Cross-cutting engineering rules, the glossary, and the "is it complete?" checklist. Read this last — it binds all 35 parts together.

---

## 36.0 The 10 cross-cutting rules (must hold everywhere)

1. **Single source of truth.** The Document Model (Part 33) is the only state. Panels, tools, and exporters are projections. No module caches authoritative data.
2. **All mutations are Commands.** Every model change goes through the Undo/Redo engine (Part 32.18); every tool gesture = exactly one undoable command (undo granularity is specified per tool in Part 02).
3. **Evaluation is pure & deterministic.** `evaluate(model, time) → renderTree` — the same function serves authoring, playback, and export (WYSIWYG). Same inputs → same frames, always.
4. **IDs are stable; names are display-only.** Renaming a layer/symbol/scene never breaks references. Foreign keys are IDs (Part 33 convention).
5. **Local-space transforms + stable IDs for rigs.** *[WISH W2]* — bones and instances store local transforms; copy/paste, scaling children, and re-parenting are safe by construction (Parts 14.2, 20.5).
6. **Sparse frame storage.** Only keyframes/spans are stored; static/empty frames are derived by the hold rule (Part 07.3). Never materialize per-frame objects.
7. **Dirty-region rendering + layer caches.** Only changed layers re-rasterize; camera/zoom re-composite cached layers (Part 32.1). 60 fps playback; interactive editing on low-end hardware.
8. **Nothing is a black box.** Imports (Part 27.7), auto lip-sync (Part 18.6), and exports (Part 28) all emit **reports/confidence** the user can inspect and edit. The app is a tool, not a magic box.
9. **Undo-consistent selection.** Commands store `prevSelection` and restore it on undo/redo (Part 36.0.2 / Part 03.9).
10. **Crash-safety.** Autosave to a `.autosave` slot at a configurable interval + recovery prompt on launch *[WISH W11]*; the serializer writes atomically (write-temp → rename).

---

## 36.1 Performance budget (targets)

| Operation | Budget |
|---|---|
| Playback (60fps doc, cached layers) | 16 ms/frame incl. render |
| Hit-test (10k objects) | < 1 ms (spatial index) |
| Path tessellation (1k anchors) | < 5 ms (cached) |
| Boolean union of two complex shapes | < 50 ms (worker) |
| Undo/redo | instant (diff/ID-based) |
| Auto lip-sync (60s audio) | < 5 s (offline, worker) |
| Save (large project) | non-blocking (worker, incremental) |
| PNG sequence / video export | frame-parallel (worker pool) |

---

## 36.2 Glossary (the terms as used across all parts)

| Term | Definition | Part |
|---|---|---|
| **Armature** | A connected tree of bones (one root). | 14 |
| **Blank keyframe** | An explicit empty keyframe (breaks the hold). | 07 |
| **Break Apart** | Flatten one level (symbol→content→shapes). | 06.8 |
| **Cel** | A reusable drawing asset + its exposure on frames. | 15.5 |
| **Classic tween** | Whole-frame interpolation between two keyframes (legacy). | 09.2 |
| **Color effect** | Per-instance brightness/tint/alpha/advanced. | 11.5 |
| **Drawing object** | An atomic drawn object (object-drawing mode). | 06.2 |
| **Easing** | Remapping interpolation time (accel/decel). | 09.4 |
| **Envelope** | Mesh deformation of a raw shape. | 04.6.2 |
| **Exposure** | How many frames a drawing/keyframe holds. | 07.3 / 15.4 |
| **Fill rule** | Nonzero vs even-odd interior determination. | 05.3.1 |
| **Frame span** | [keyframe, nextKeyframe−1] held run. | 07.3 |
| **Graphic symbol** | Timeline driven by the parent timeline. | 11.1.1 |
| **IK** | Inverse kinematics (drag end → solve joints). | 14 |
| **Instance** | A placed reference to a symbol. | 11.0 |
| **Keyframe** | An authored snapshot (whole-frame or per-property). | 08 |
| **Lip sync** | Mapping speech audio → mouth-pose keyframes. | 18 |
| **Mask** | A shape that clips another layer's content. | 21 |
| **Merge model** | Overlapping raw shapes union/cut/split. | 06.1 |
| **Motion path** | The curve a tweened object follows. | 10 |
| **Movie clip** | Symbol with an independent clock. | 11.1.2 |
| **Onion skin** | Ghosting neighboring frames while drawing. | 15.2 |
| **Pivot (transform point)** | The point rotation/scale center on. | 04.7 |
| **Pose** | A stored armature/rig configuration. | 14.6 |
| **Registration point** | A symbol's (0,0) origin. | 11.2 |
| **Shape hint** | A forced anchor correspondence in a shape tween. | 09.3.2 |
| **Stream sound** | Timeline-synchronized audio. | 17.0 |
| **Swap** | Replace an instance's symbol, keeping transform. | 11.6 |
| **Tween span** | The unit of a motion tween (one target). | 09.1 |
| **Viseme** | A visual mouth shape for a phoneme group. | 18.1 |
| **z-depth** | A layer's distance from the camera (parallax). | 16.5 |

---

## 36.3 The "is it complete?" checklist (final gate)

**Data:** □ All 19 schemas (Part 33) valid + round-trip. □ IDs stable, names display-only. □ Autosave/recovery.

**Editor core:** □ All 30+ tools (Part 02) with the 27-field behavior. □ Selection/transform/drawing/shape systems (Parts 03–06). □ Merge + object modes both work.

**Animation:** □ Timeline + keyframes + all frame ops (07–08). □ Motion/classic/shape tweens + easing + graph editor (09). □ Motion paths (10).

**Reuse:** □ Symbols/instances/nesting (11). □ Library (12). □ Swap/break-apart/frame-picker.

**Characters:** □ Cut-out pipeline + bone/IK + asset warp (13–14). □ Frame-by-frame + onion skin + cel system (15). □ Camera + audio + lip-sync + facial (16–19).

**Structure:** □ Layers/masks/text/color/align/scenes (20–25). □ Properties panel (26).

**I/O:** □ Import (27) + export/publish (28). □ Shortcuts (29) + context menus (30).

**Cross-platform:** □ Desktop (Win/macOS/**Linux**) + touch (31). □ Architecture (32) + buttons (34) + priorities (35).

**The [WISH] improvements (Release 4):** □ W1 cel reuse · W2 robust IK · W3 warp-no-flicker · W4 AE graph editor · W5 free brush size · W6 opacity slider/auto-select/eyedropper fix · W7 offline cross-platform · W8 Flash shortcuts · W9 AI in-betweening · W10 bitmap pencil · W11 autosave/recovery · W12 scene tabs · W13 extensibility.

---

## 36.4 Final note

This blueprint is a **functional specification**, researched from Adobe Animate's documented capabilities and the animator community's requests, then re-designed as an **original** application: original UI, original icons, original names, original file format — no Adobe artwork, branding, or pixel-identical interface reproduced anywhere. An AI coding agent reading Parts 01–36 in order, passing each **BUILD CHECKPOINT**, will have built a professional, cross-platform 2D animation editor that matches Animate's workflow and exceeds it in the places animators asked for.

**— End of the 36-part blueprint. —**
