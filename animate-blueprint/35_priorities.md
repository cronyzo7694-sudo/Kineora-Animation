# PART 35 — IMPLEMENTATION PRIORITY
### P0 (absolutely required) / P1 (important) / P2 (advanced) / P3 (optional) — every feature classified, then the build order.

---

## 35.0 Priority definitions

| Tier | Meaning | Ship |
|---|---|---|
| **P0** | The app is useless without it — the MVP core. | Release 1 |
| **P1** | Expected of a professional tool — the "real product". | Release 1–2 |
| **P2** | Advanced/quality-of-life; makes it better than Animate. | Release 2–3 |
| **P3** | Optional/niche/legacy-compat. | Later / never |

---

## 35.1 Feature classification (the complete table)

### Foundations
| Feature | Tier | Note |
|---|---|---|
| Document model + JSON serializer + autosave/recovery | P0 | *[WISH W11]* |
| Undo/redo (command pattern) + selection restore | P0 | |
| Event bus + panel/dock manager + workspace persistence | P0 | |
| Cross-platform shell (Win/macOS/**Linux**/Web/tablet) | P0 | core promise |
| Plugin/script API | P2 | *[WISH W13]* |

### Drawing & shape (Parts 05–06)
| Feature | Tier |
|---|---|
| Path model (cubic Béziers) + fill/stroke sub-objects | P0 |
| Stroke model (width/cap/join/dash/width-profile) | P0 |
| Merge model (union/cut/split) + object mode | P0 |
| Boolean ops (union/intersect/punch/crop) | P0 (backs merge+eraser) |
| Pen/Line/Rect/Oval/PolyStar/Pencil/Brush/Eraser/Width | P0 |
| Fill styles: solid/linear/radial/bitmap + gradient transform | P0 |
| Primitives (parametric) | P1 |
| Paint Brush (art/pattern) + brush library | P1 |
| Variable-width strokes + width profiles | P1 |
| Trace Bitmap | P1 |
| Expand/soften fill edges | P2 |
| Ragged/stipple stroke presets | P3 |
| Generator brushes (Deco/Spray equivalents) | P3 |

### Selection & transform (Parts 03–04)
| Feature | Tier |
|---|---|
| Selection (click/shift/marquee/lasso/select-all) | P0 |
| Free Transform (move/scale/rotate/skew/pivot) | P0 |
| Subselection (anchors/handles) | P0 |
| Distort/Envelope (raw shapes) | P1 |
| Numeric transform panel | P1 |
| Copy/paste transform; remove-transform flatten | P1 |
| Magic Wand (broken-apart bitmaps) | P1 |
| Rotated-bounds align option | P2 |

### Timeline & animation (Parts 07–10)
| Feature | Tier |
|---|---|
| Timeline (layers/frames/playhead/hold rule) | P0 |
| All frame ops (F5/F6/F7/delete/clear/copy/paste/move/reverse/convert) | P0 |
| Keyframes (whole-frame + property) + interpolators | P0 |
| Motion tween + per-property keys + easing | P0 |
| Classic tween + ease/custom graph | P0 |
| Shape tween + shape hints | P0 |
| Motion path (edit + orient) | P0 |
| Easing system (Penner + slider + custom curve) | P0 |
| Motion presets | P1 |
| Graph editor (AE-style, multi-property) | P1 *[WISH W4]* |
| Motion guide layers (legacy) | P2 |
| Constant-speed path (arc-length) | P2 |
| Auto-keyframe scrub mode | P2 |

### Symbols & reuse (Parts 11–12)
| Feature | Tier |
|---|---|
| Symbols (graphic/movie clip/button) + instances | P0 |
| Convert-to-symbol (F8) + registration grid | P0 |
| Nesting + graphic-sync vs movie-clip-free playback | P0 |
| Swap/Duplicate symbol; Break Apart | P0 |
| Library (folders/search/preview/use-count) | P0 |
| Edit-in-place + breadcrumb | P0 |
| Instance color effect + filters | P1 |
| Frame Picker | P1 |
| External library | P1 |
| Font symbols | P3 |

### Layers, masks, text, color, align (Parts 20–24)
| Feature | Tier |
|---|---|
| Layers (types/folders/visibility/lock/outline) | P0 |
| Layer parenting (local-space) | P1 |
| Masks (clip + animated) | P0 |
| Alpha masks | P1 |
| Text (static/dynamic/input + styles + embed) | P0 |
| Color system (picker/gradients/swatches/alpha) | P0 |
| Find & Replace colors | P1 |
| Align/distribute (+ even-gap) | P0 |

### Character & rigging (Parts 13–15, 19)
| Feature | Tier |
|---|---|
| Cut-out pipeline (parts→symbols→hierarchy→pivots) | P0 |
| Bone/IK (2-bone + FABRIK/CCD + constraints) | P1 |
| Asset Warp (pins/mesh, vector+raster) | P1 |
| Frame-by-frame + onion skin (all controls) | P0 |
| Cel/drawing-reuse system | P1 *[WISH W1]* |
| Pose library | P1 |
| Facial systems (blink/gaze/mouth/expression/head) | P1 |
| Auto-blink (random, avoids speech) | P2 |
| Full 360° head turns | P3 |

### Camera, audio, lip-sync (Parts 16–18)
| Feature | Tier |
|---|---|
| Camera (pan/zoom/rotate/keyframes/depth/parallax) | P1 |
| Camera presets | P2 |
| Audio (import/sync modes/loop/trim/envelope) | P1 |
| Lip-sync (auto + manual + Frame Picker) | P1 |
| Phoneme lane + confidence + re-map | P2 |
| Multi-language phoneme models | P3 |

### Import/export (Parts 27–28)
| Feature | Tier |
|---|---|
| Import: PNG/JPEG/SVG/MP3/WAV/PSD-per-layer | P0 |
| Export: PNG/JPEG/SVG image | P0 |
| PNG sequence + GIF + MP4 video | P0 |
| HTML5/Web bundle | P1 |
| Sprite sheets + image sequences (import/export) | P1 |
| WebM/OGG/FLAC/WebP | P2 |
| glTF/WebGL export | P3 |

### UX / cross-platform (Parts 29–31)
| Feature | Tier |
|---|---|
| Keyboard shortcuts (Flash defaults) + rebindable editor | P0 |
| Context menus (all) | P0 |
| Touch/mobile adapter + loupe + toolbar | P1 |
| Hover-preview + hint bar (touch) | P1 |
| Accessibility (contrast themes, tooltips) | P2 |
| AI in-betweening assistant | P2 *[WISH W9]* |
| Cloud sync / collaboration | P3 |

---

## 35.2 Build order (the roadmap)

### Release 0 (proof of core) — Parts 01–06
1. Shell + event bus + undo + serializer + cross-platform window.
2. Vector engine: paths, strokes, fills, booleans, merge/object modes.
3. Tools: selection/subselection/free-transform/pen/shapes/pencil/brush/eraser.
4. Selection + transform systems complete. → **A working drawing editor.**

### Release 1 (it animates) — Parts 07–12
5. Timeline + keyframes + frame ops.
6. Tweens (motion/classic/shape) + easing + motion path.
7. Symbols/instances/nesting + Library.
8. Layers/masks/text/color/align. → **A working animation editor (Animate-class).**

### Release 2 (it's for characters) — Parts 13–19
9. Cut-out rig pipeline + bone/IK + asset warp + pose library.
10. Frame-by-frame + onion skin + cel/drawing reuse.
11. Camera + audio + lip-sync + facial systems. → **A character-animation studio.**

### Release 3 (it ships everywhere) — Parts 27–31
12. Full import + export/publish (GIF/MP4/HTML5).
13. Touch/mobile adapter + shortcuts + context menus.
14. Polish: graph editor, presets, autosave, templates. → **A shipped product.**

### Release 4 (it's better than Animate) — the [WISH] list
15. Cel/drawing reuse (W1), robust IK (W2), warp-without-flicker (W3), AE-graph-editor (W4), free brush size + smoothing (W5), opacity slider/auto-select/eyedropper fix (W6), offline cross-platform (W7), Flash shortcuts (W8), AI in-betweening (W9), bitmap pencil (W10), autosave+recovery (W11), scene tabs (W12), extensibility (W13).

---

## 35.3 BUILD CHECKPOINT M6 (priority slice)

- [ ] Every P0 feature is implemented and tested before any P1 begins (P0 = the release blocker).
- [ ] The build order is tracked as a roadmap; each release = a milestone (M1–M6 from the earlier parts).
- [ ] The [WISH] improvements are scheduled in Release 4, not dropped.

*Next: `36_final_notes.md` — cross-cutting rules (undo granularity, performance, crash-safety), the glossary, and the final "is it complete?" checklist.*
