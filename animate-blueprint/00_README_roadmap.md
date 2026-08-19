# ANIMATE-BLUEPRINT — Master Index & Build Roadmap
### 36-file functional blueprint to build an original, professional 2D animation editor (Adobe Animate-class, but better in key areas). Every file is written to be consumed independently by an AI coding agent.

---

## How to use this folder

- Files are numbered `01`–`36`. Read them **in order** — each part assumes the previous parts' concepts.
- Each part ends with a **BUILD CHECKPOINT** — a list of things that must work before moving on. When all 36 checkpoints pass, you have a working editor.
- Language: **English** (technical). UI terminology in the final app should be your own — this document describes *functionality*, not Adobe's branding.
- Research base: official Adobe Animate documentation (helpx.adobe.com), current 2023–2026 docs, plus community/Reddit feature requests. Version differences (Animate CC vs current Animate; Flash legacy) are noted inline.

## The 6 build milestones

| Milestone | Files | What the app can do |
|---|---|---|
| **M1 — Static editor** | 01–06 | Open a document, draw vectors/shapes, select, transform, save. A drawing editor. |
| **M2 — Motion editor** | 07–10, 20–21, 23–24 | Timeline, keyframes, motion/classic/shape tweens, motion paths, layers, masks, color, align. Animation works. |
| **M3 — Reusable content** | 11–12, 22, 27–28 | Symbols, instances, library, text, import, export/publish. Assets + output. |
| **M4 — Character tools** | 13–19 | Rigging, bones/IK, asset warp, frame-by-frame + onion skin, camera, audio, lip-sync, facial animation. |
| **M5 — Power & polish** | 25–26, 29–31 | Scenes, properties panel, shortcuts, context menus, mobile/touch translation. |
| **M6 — Engineering spec** | 32–36 | Module architecture, data model (JSON), UI button spec, priorities, final notes. |

## File index

| # | File | Content |
|---|---|---|
| 00 | `00_README_roadmap.md` | This file — index, milestones, wishlist. |
| 01 | `01_application_map.md` | Complete application architecture & map. |
| 02 | `02_tools.md` | Every tool, 27-field spec. |
| 03 | `03_selection_system.md` | Selection, subselection, marquee, locking. |
| 04 | `04_transform_system.md` | Move/scale/rotate/skew/free/distort + numeric. |
| 05 | `05_drawing_system.md` | Pen/pencil/brush/line/shape tools + stroke/fill. |
| 06 | `06_shape_system.md` | Primitive/raw/merge/booleans + data model. |
| 07 | `07_timeline.md` | Every timeline control & action. |
| 08 | `08_keyframe_system.md` | Keyframe types, storage, interpolation. |
| 09 | `09_tweening.md` | Motion/classic/shape tween + easing. |
| 10 | `10_motion_path.md` | Paths, béziers, orientation, guides. |
| 11 | `11_symbol_system.md` | Symbols, instances, nesting, edit modes. |
| 12 | `12_library.md` | Asset database & reuse. |
| 13 | `13_character_animation.md` | Character pipeline end-to-end. |
| 14 | `14_bone_ik.md` | Bones, armatures, IK, constraints. |
| 15 | `15_frame_by_frame.md` | Traditional animation + onion skin. |
| 16 | `16_camera.md` | Camera layer, zoom/rotate/pan, depth. |
| 17 | `17_audio.md` | Import, sync modes, loops, export. |
| 18 | `18_lip_sync.md` | Visemes, auto lip-sync, frame picker. |
| 19 | `19_facial_animation.md` | Eyes/brows/mouth/head systems. |
| 20 | `20_layers.md` | Layer ops, folders, parenting, depth. |
| 21 | `21_masks.md` | Mask/masked, animated masks, alpha. |
| 22 | `22_text.md` | Text tool, static/dynamic/input, fonts. |
| 23 | `23_color.md` | Fill/stroke, gradients, swatches. |
| 24 | `24_align_distribute.md` | Align/distribute/spacing. |
| 25 | `25_scenes.md` | Scenes, ordering, navigation. |
| 26 | `26_properties_panel.md` | Contextual inspector for every type. |
| 27 | `27_import.md` | Import categories & asset handling. |
| 28 | `28_export_publish.md` | Export/publish options. |
| 29 | `29_shortcuts.md` | Complete keyboard reference. |
| 30 | `30_context_menus.md` | Right-click menus everywhere. |
| 31 | `31_mobile_translation.md` | Desktop ↔ touch mapping. |
| 32 | `32_architecture.md` | Original module architecture. |
| 33 | `33_data_model.md` | JSON schemas. |
| 34 | `34_ui_button_spec.md` | Master button table. |
| 35 | `35_priorities.md` | P0–P3 + build order. |
| 36 | `36_final_notes.md` | Cross-cutting rules, glossary, checks. |

## Community wishlist (what our app does BETTER than Adobe Animate)

Sourced from r/adobeanimate, r/animation, r/ToonBoomHarmony, and related threads (2020–2026). These are *requirements baked into every part*, tagged `[WISH]` where they apply.

| # | Wish | Source signal | Our solution (where) |
|---|---|---|---|
| W1 | **Cel/drawing-reuse workflow** — duplicate a frame and edit it; want the option to make drawings reusable assets, not always independent copies | r/animation: "no cel based workflow… duplicate a frame and make changes, only that frame changes" | "Drawing" asset type + exposure (Parts 08, 15, 33) |
| W2 | **Bone/IK that doesn't break** on copy/paste, scaling children, or re-parenting | r/adobeanimate rant (j76i2n) | Rig engine with local-space math + stable IDs (Parts 14, 32) |
| W3 | **Asset Warp without flicker/disappear** when tweened or duplicated | r/adobeanimate rant | Warp mesh keyed as data, no symbol-link bugs (Part 02, 33) |
| W4 | **AE-style graph editor**: clear keyframes, multi-select, edit many at once, visible motion path, per-property curves | r/animation Harmony-vs-AE thread | Motion Editor module (Parts 09, 32) |
| W5 | **Free brush size** (slider), better stroke smoothing, no angular stroke artifacts | r/animation (2016) | Brush engine with slider + smoothing pipeline (Part 05) |
| W6 | **Simple opacity slider**; **toggle auto-select**; **eyedropper that doesn't paint on hover** | r/adobeanimate "WHY IS IT SO HARD" | UX defaults (Parts 02, 22, 26, 34) |
| W7 | **Standalone + offline**, cross-platform (Win/Mac/Linux/Chromebook), no subscription | multiple threads | Desktop + web builds (Parts 31, 32, 35) |
| W8 | **Keep Flash-style shortcuts & symbol workflow**, enhance it | "same shortcuts and workflow… enhancing symbol workflow" | Part 29 shortcuts + Part 11 symbols |
| W9 | **AI in-betweening** to generate tween frames | "AI machine generation to expand upon the in-between capabilities" | Optional interpolation assistant (Parts 09, 35) |
| W10 | **Bitmap/raster pencil** for traditional feel | "Adding bitmap pencil would take this to the next level" | Raster engine + bitmap pencil (Parts 05, 32) |
| W11 | **Autosave + crash recovery / versioning** | Harmony crash rants | Project serializer + autosave (Parts 32, 33, 36) |
| W12 | **Multiple scenes open** at once | "wish I could have multiple scenes open like in Animate" | Scene panel + tabbed scenes (Part 25) |
| W13 | **Extensibility / open ecosystem** | "open ecosystem / extensibility" | Plugin/script API (Parts 14/32 notes) |

---

*Continue to `01_application_map.md`.*
