# PHASE 2 — MASTER FEATURE QUEUE
### The tracking system for forensic deep-research. Source: the 36-part MASTER BLUEPRINT (`animate-blueprint/` + `ANIMATE_BLUEPRINT_MASTER.md`). This queue is the INDEX; each feature below gets its own deep-research document set, researched ONE AT A TIME.

---

## 0. PROTOCOL CONSTANTS

### 0.1 Status legend (feature research status)
| Status | Meaning |
|---|---|
| `UNSTARTED` | No deep research done yet. |
| `IN PROGRESS` | Deep document(s) being written now. |
| `PARTIALLY RESEARCHED` | Some sections done, gaps remain. |
| `FULLY RESEARCHED` | All template sections written. |
| `AUDITED` | Contradiction + completeness + self-challenge audits passed. |
| `VERIFIED` | Post-audit re-check after repairs; final state. |

### 0.2 Evidence status (per claim, used inside deep docs)
`[OFFICIAL]` `[SECONDARY VERIFIED]` `[OBSERVED]` `[COMMUNITY REPORT]` `[INFERENCE]` `[UNCERTAIN]` `[LEGACY]` `[REMOVED]` `[OUR DESIGN DECISION]`

### 0.3 Deep-document naming convention
```
phase2-knowledge-base/deep-research/
  F-03-01_hit_testing/
    01_identity.md        02_ui.md        03_controls.md
    04_states.md          05_interactions.md 06_limitations.md
    07_edge_cases.md      08_implementation.md 09_tests.md
    10_audit.md           (as many files as needed — no cap)
```
Traceability header required in every deep doc:
```
SOURCE BLUEPRINT:  Part 03 — Selection System
DEEP FEATURE:      Selection Tool — Hit Testing
QUEUE ID:          F-03-01
```

### 0.4 Feature completion gate (must ALL pass before "FEATURE COMPLETE")
1. Research pass 1 ✔  2. Research pass 2 ✔  3. Contradiction audit ✔  4. Completeness matrix (no unresolved gaps) ✔  5. Limitations ✔  6. Edge cases ✔  7. Implementation spec ✔  8. Test matrix ✔  9. Evidence statuses recorded ✔  10. Self-challenge audit ✔

### 0.5 Cross-feature dependency map (major systems, referenced in "Deps" column)
`SEL`=Selection · `XFR`=Transform · `DRW`=Drawing · `SHP`=Shape · `TL`=Timeline · `KF`=Keyframe · `TWN`=Tween · `SYM`=Symbol · `LIB`=Library · `RIG`=Rig · `IK`=IK · `FBF`=Frame-by-frame · `CAM`=Camera · `AUD`=Audio · `LIP`=LipSync · `FAC`=Facial · `LYR`=Layer · `MSK`=Mask · `TXT`=Text · `CLR`=Color · `ALN`=Align · `SCN`=Scene · `PRP`=Properties · `IMP`=Import · `EXP`=Export · `MUL`=Mobile · `ARC`=Architecture · `DTM`=DataModel · `BTN`=Buttons · `PRI`=Priorities · `FN`=FinalNotes

---

## 1. THE QUEUE

### PART 01 — APPLICATION MAP  (source: `01_application_map.md`)
| ID | Feature | Key sub-features (recursive decomposition hints) | Deps | Status |
|---|---|---|---|---|
| F-01-01 | Application shell & window anatomy | menu bar, stage, timeline panel, tools panel, properties, library, dockable panels, edit bar/breadcrumb, status bar | ARC,BTN | **AUDITED** |
| F-01-02 | Workspaces | dock/float/group/stack, save workspace, reset, persistence | BTN | **AUDITED** |
| F-01-03 | Multi-document management | tabs, active document, per-doc library/timeline, arrange | LIB | **AUDITED** |
| F-01-04 | File menu | New/New-from-template/Open/Open-Recent/Open-from-Libraries/Close/Save/Save-As/Save-as-Template/Import/Export/Publish/Print/Exit | IMP,EXP,SCN | **AUDITED** |
| F-01-05 | Edit menu | Undo/Redo/History, Cut/Copy/Paste/Paste-in-Place/Paste-Special/Duplicate, Select-All/Deselect, Find&Replace, Timeline submenu, Edit-Symbols/In-Place/All, Preferences/Shortcuts/Toolbars | SEL,TL,SYM | **AUDITED** |
| F-01-06 | View menu | Go-To, Zoom, Magnification, Fit, Preview-Modes, Work-Area, Rulers/Grid/Guides, Snapping, Hide-Edges, Shape-Hints | CAM,SHP | **AUDITED** |
| F-01-07 | Insert menu | New-Symbol, Timeline (Frame/Keyframe/Blank), Motion/Classic/Shape Tween, Scene | SYM,TL,TWN,SCN | **AUDITED** |
| F-01-08 | Modify menu | Document, Convert-to-Symbol, Break-Apart, Bitmap, Symbol, Shape, Combine-Objects, Timeline, Transform, Arrange, Align, Group/Ungroup | SHP,SYM,XFR,ALN | **AUDITED** |
| F-01-09 | Text menu | Font/Size/Style, Align, Letter/Line spacing, Embed, TLF(legacy) | TXT | **AUDITED** |
| F-01-10 | Commands menu | Saved-Commands, Copy/Paste-Motion-XML, Convert-AS3→HTML5, JSFL/scripting | TWN | **AUDITED** |
| F-01-11 | Control menu | Play, Rewind, Step, Test-Movie/Scene, Mute, Loop, Live-Preview, Simple-Buttons | TL,AUD | **AUDITED** |
| F-01-12 | Debug menu (legacy) | breakpoints, step, watch panels | ARC | **AUDITED** |
| F-01-13 | Window menu / panels | panel visibility, workspaces submenu | BTN | **AUDITED** |
| F-01-14 | Help menu | docs, shortcut viewer, about | — | **AUDITED** |
| F-01-15 | Tools panel structure | 4 sections, tool=state-machine interface | ARC | **AUDITED** |
| F-01-16 | Stage | coordinates, pasteboard, compositing order, preview/render modes | ARC,DRW | **AUDITED** |
| F-01-17 | Grid/Guides/Rulers/Snapping | rulers, guides, grid, snap-to-objects/grid/guides/pixels, snap-align | SEL,DRW | **AUDITED** |
| F-01-18 | Timeline overview map | layer list + frame grid, playhead, onion controls | TL | **AUDITED** |
| F-01-19 | Properties panel context binding | precedence (tool>selection>frame>doc), getPropertySchema | PRP | **AUDITED** |
| F-01-20 | Document settings | width/height, units, fps, bg color, platform type, advanced | DTM,EXP | **AUDITED** |
| F-01-21 | Library overview | asset database, folders, search, preview | LIB | **AUDITED** |
| F-01-22 | Scene panel overview | scenes list, add/dup/delete/reorder | SCN | **AUDITED** |
| F-01-23 | Color/Swatches overview | color panel, gradient stops, swatches | CLR | **AUDITED** |
| F-01-24 | Align/Transform/Info overview | align ops, numeric transform, info readout | ALN,XFR | **AUDITED** |
| F-01-25 | Components/Actions/Output panels | widget library, code editor, build log | ARC | **AUDITED** |
| F-01-26 | Asset & utility panels | Motion-Editor, Frame-Picker, Layer-Depth, Brush-Library, Movie-Explorer, History, CC-Libraries | TWN,LIP,CAM | **AUDITED** |
| F-01-27 | Import/Export systems overview | import categories, export/publish pipeline | IMP,EXP | **AUDITED** |
| F-01-28 | End-to-end character/animation workflow | 10-step pipeline | RIG,FAC,LIP | **AUDITED** |
| F-01-29 | State & event flow | bus, commands, dirty-region, evaluate(time) | ARC | **AUDITED** |

### PART 02 — EVERY TOOL  (sources: `02a…02d_tools_*.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-02-00 | Stroke capture & smoothing pipeline (shared) | resample, RDP, moving-average, straighten, pressure/tilt | DRW | **AUDITED** |
| F-02-01 | Selection Tool | move, marquee, edge-reshape, drill-down, snap, modifiers | SEL,SHP | **AUDITED** |
| F-02-02 | Subselection Tool | anchors, handles, point-type, motion-path edit | SEL,SHP,TWN | **AUDITED** |
| F-02-03 | Free Transform Tool | move/scale/rotate/skew, pivot, handle zones, modes | XFR | **AUDITED** |
| F-02-04 | Gradient Transform Tool | center/scale/rotate/focal, bitmap-fill tiling | CLR,SHP | **AUDITED** |
| F-02-05 | 3D Rotation Tool (legacy) | axis rings, global/local | XFR | **AUDITED** |
| F-02-06 | 3D Translation Tool (legacy) | axis arrows, z | XFR | **AUDITED** |
| F-02-07 | Lasso (+Polygon +Magic Wand) | freeform, polygon vertices, wand threshold | SEL,IMP | **AUDITED** |
| F-02-08 | Pen (+anchor sub-tools) | corner/curve anchors, close, add/delete/convert | DRW,SHP | **AUDITED** |
| F-02-09 | Text Tool | point/box text, edit mode, 3 types | TXT | **AUDITED** |
| F-02-10 | Line Tool | rubber-band, 45° snap | DRW | **AUDITED** |
| F-02-11 | Rectangle Tool | corner radius, Shift/Alt | DRW,SHP | **AUDITED** |
| F-02-12 | Oval Tool | circle, arcs/donut | DRW,SHP | **AUDITED** |
| F-02-13 | Rectangle Primitive | parametric radius handle | SHP | **AUDITED** |
| F-02-14 | Oval Primitive | parametric angles/hole | SHP | **AUDITED** |
| F-02-15 | PolyStar Tool | polygon/star, sides, star-point size | DRW,SHP | **AUDITED** |
| F-02-16 | Pencil Tool | Straighten/Smooth/Ink modes | DRW | **AUDITED** |
| F-02-17 | Brush Tool | 5 paint modes, size/shape, lock-fill, pressure | DRW,SHP | **AUDITED** |
| F-02-18 | Paint Brush (art/pattern) | brush library, stretch/tile/guides/corners | DRW,LIB | **AUDITED** |
| F-02-19 | Fluid Brush (legacy) | removed feature | DRW | **AUDITED** |
| F-02-20 | Eraser Tool | 5 modes, faucet, stroke split | SHP | **AUDITED** |
| F-02-21 | Width Tool | width points, asymmetric, profiles | DRW | **AUDITED** |
| F-02-22 | Eyedropper Tool | sample fill/stroke, style clipboard | CLR | **AUDITED** |
| F-02-23 | Paint Bucket Tool | flood fill, gap tolerance, lock-fill | SHP,CLR | **AUDITED** |
| F-02-24 | Ink Bottle Tool | apply stroke to outline | DRW | **AUDITED** |
| F-02-25 | Hand Tool | pan view | — | **AUDITED** |
| F-02-26 | Zoom Tool | marquee zoom, Alt out | — | **AUDITED** |
| F-02-27 | Stage Rotate Tool | rotate view | — | **AUDITED** |
| F-02-28 | Time Scrubber Tool | stage scrub | TL | **AUDITED** |
| F-02-29 | Bone Tool | chain instances/shapes, pose by drag | IK,RIG | **AUDITED** |
| F-02-30 | Bind Tool | point→bone weighting | IK | **AUDITED** |
| F-02-31 | Camera Tool | pan/zoom/rotate, camera layer | CAM | **AUDITED** |
| F-02-32 | Asset Warp Tool | pins, mesh, rigid/flexible | RIG,SHP | **AUDITED** |
| F-02-33 | Deco Tool (legacy) | patterns | DRW | **AUDITED** |
| F-02-34 | Spray Brush (legacy) | scatter | DRW | **AUDITED** |

### PART 03 — SELECTION SYSTEM  (source: `03_selection_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-03-01 | Hit testing | render-order traversal, spatial index, edge radius, winding, alpha | SEL,ARC | **AUDITED** (deep-research/F-03-01_hit_testing/, 9 files) |
| F-03-02 | Selection data structure | targets, sub-object paths, anchors, union bounds, dual-domain (stage+timeline), readoutPoint | SEL,DTM | **AUDITED** (deep-research/F-03-02_selection_data/, 4 files) — *C2 corrected by F-03-04 E9: span-based default = frame-based (opt-in via hamburger)* |
| F-03-03 | Click selection | top-most hit, empty=clear, double-click drill-down, sub-object click, Simple Buttons | SEL | **AUDITED** (deep-research/F-03-03_click_selection/, 3 files) |
| F-03-04 | Shift toggle / multi-select | add/remove membership, **Shift Select preference (discovered in F-03-03)**, deselect-individual, 3-way Shift semantics, frame multi-select | SEL | **AUDITED** (deep-research/F-03-04_shift_multiselect/, 2 files) |
| F-03-05 | Marquee selection | contact-sensitive on/off, raw-shape region vs atomic enclosure, timeline frame marquee, additive/subtractive | SEL | **AUDITED** (deep-research/F-03-05_marquee/, 2 files) — *default contact-sensitive = [UNCERTAIN] (C1)* |
| F-03-06 | Lasso selection | point-in-polygon | SEL | **AUDITED** |
| F-03-07 | Select All / Deselect All | locked/hidden exclusion | SEL,LYR | **AUDITED** |
| F-03-08 | Select by timeline/frame | keyframe-click selects content | SEL,TL | **AUDITED** |
| F-03-09 | Select by layer | active layer tracking | SEL,LYR | **AUDITED** |
| F-03-10 | Raw-shape sub-object selection | fill vs stroke, split-on-move | SEL,SHP | **AUDITED** |
| F-03-11 | Drawing object / group selection | atomic, edit-in-place | SEL,SHP | **AUDITED** |
| F-03-12 | Symbol instance selection | instance vs definition | SEL,SYM | **AUDITED** |
| F-03-13 | Text / bitmap selection | text-edit mode, bitmap rect | SEL,TXT | **AUDITED** |
| F-03-14 | Bone / warp-pin / camera selection | armature nav, pin select | SEL,IK,CAM | **AUDITED** |
| F-03-15 | Locked & hidden behavior | layer lock, object lock, hidden | SEL,LYR | **AUDITED** |
| F-03-16 | Selection overlay | outline, dotted fill, bounding box, handles, anchors, hide-edges | SEL,ARC | **AUDITED** |
| F-03-17 | Selection events | selection:changed payload/subscribers | SEL,ARC | **AUDITED** |
| F-03-18 | Selection + timeline/keyframe interaction | frame-scoped, scrub persistence | SEL,TL | **AUDITED** |
| F-03-19 | Mobile selection | tap/long-press/select-mode | SEL,MUL | **AUDITED** |

### PART 04 — TRANSFORM SYSTEM  (source: `04_transform_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-04-01 | Transform model & matrix | decomposition order, spaces | XFR,DTM | **AUDITED** |
| F-04-02 | Move | delta, snap, dup-drag, nudge | XFR | **AUDITED** |
| F-04-03 | Scale | pivot-based, proportional, negative | XFR | **AUDITED** |
| F-04-04 | Rotate | pivot, 45° snap, opposite-corner | XFR | **AUDITED** |
| F-04-05 | Skew | edge handles, axis | XFR | **AUDITED** |
| F-04-06 | Free transform combined | modes, zone mapping | XFR | **AUDITED** |
| F-04-07 | Distort | 4-corner quad, baked | XFR,SHP | **AUDITED** |
| F-04-08 | Envelope | mesh + tangents, baked | XFR,SHP | **AUDITED** |
| F-04-09 | Registration vs pivot vs center | 3 centers, re-center | XFR,SYM | **AUDITED** |
| F-04-10 | Numeric transform | panel fields, scale&rotate dialog | XFR | **AUDITED** |
| F-04-11 | Copy transform / remove transform | flatten, paste | XFR | **AUDITED** |
| F-04-12 | Flip H/V | center mirror, negative scale | XFR | **AUDITED** |
| F-04-13 | Transform ↔ animation/keyframes | per-property keys table | XFR,KF,TWN | **AUDITED** |
| F-04-14 | Mobile transform | pinch/twist/handles | XFR,MUL | **AUDITED** |

### PART 05 — DRAWING SYSTEM  (source: `05_drawing_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-05-01 | Stroke model | creation, thickness, style, color, opacity, smoothing, curves, corners, caps, joins, editing, converting, breaking, grouping | DRW,DTM | **AUDITED** |
| F-05-02 | Fill model | creation, regions, fill rule | DRW,SHP | **AUDITED** |
| F-05-03 | Merge vs object mode | union/cut/split semantics | SHP | **AUDITED** |
| F-05-04 | Caps & joins | round/square/butt; round/miter/bevel; miter limit | DRW | **AUDITED** |
| F-05-05 | Stroke rendering (outline polygons) | width profiles, scaling, hairline | DRW,ARC | **AUDITED** |
| F-05-06 | Stroke↔fill conversion | lines-to-fills, ink bottle | DRW,SHP | **AUDITED** |
| F-05-07 | Opacity & compositing | no double-darkening | DRW,ARC | **AUDITED** |
| F-05-08 | Snapping during drawing | grid/guides/objects/pixels | DRW,SEL | **AUDITED** |
| F-05-09 | Draw-target contract | layer/frame/mode/state validation | DRW,TL | **AUDITED** |
| F-05-10 | Per-tool 15-dimension matrix | cross-reference Part 02 | DRW | **AUDITED** |

### PART 06 — SHAPE SYSTEM  (source: `06_shape_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-06-01 | Shape taxonomy | raw/drawingObject/primitive/group | SHP,DTM | **AUDITED** |
| F-06-02 | Merge model | same-color union, cut-hole, split, delete-hole | SHP | **AUDITED** |
| F-06-03 | Drawing objects | atomic, edit-in-place, break-apart | SHP | **AUDITED** |
| F-06-04 | Primitives | parametric params, bake | SHP | **AUDITED** |
| F-06-05 | Shape editing & handles | levels, anchors, width handles | SHP,DRW | **AUDITED** |
| F-06-06 | Smooth/Straighten/Optimize | simplification algorithms | SHP | **AUDITED** |
| F-06-07 | Combine objects (booleans) | union/intersect/punch/crop | SHP,ARC | **AUDITED** |
| F-06-08 | Erase as subtraction | stamp boolean, faucet | SHP | **AUDITED** |
| F-06-09 | Fill behavior | regions, styles, lock-fill, gaps | SHP,CLR | **AUDITED** |
| F-06-10 | Stroke behavior | splits, caps/joins, flat color | SHP,DRW | **AUDITED** |
| F-06-11 | Conversion & break-apart hierarchy | full map, expand/soften, trace | SHP | **AUDITED** |
| F-06-12 | Shape data model | exact JSON spec | SHP,DTM | **AUDITED** |

### PART 07 — TIMELINE  (source: `07_timeline.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-07-01 | Timeline data structure | sparse frames, layers, duration | TL,DTM | **AUDITED** |
| F-07-02 | Layer row controls | eye/lock/outline/name/type/attach | TL,LYR | **AUDITED** |
| F-07-03 | Frame ruler | numbering, click-to-jump, scrub | TL | **AUDITED** |
| F-07-04 | Playhead | drag, click, view-state | TL | **AUDITED** |
| F-07-05 | Frame cells & visual language | 9+ cell visuals | TL | **AUDITED** |
| F-07-06 | Frame types | keyframe/blank/held/empty/span/tween/pose/label/action | TL,KF | **AUDITED** |
| F-07-07 | Exposure & holds | hold rule, span extent | TL | **AUDITED** |
| F-07-08 | Insert Frame (F5) | span extension | TL | **AUDITED** |
| F-07-09 | Insert Keyframe (F6) | copy-prev semantics | TL,KF | **AUDITED** |
| F-07-10 | Insert Blank Keyframe (F7) | empty hold break | TL | **AUDITED** |
| F-07-11 | Delete / Clear / Remove frames | distinct semantics | TL | **AUDITED** |
| F-07-12 | Copy/Cut/Paste/Duplicate/Move frames | clipboard, overwrite/insert | TL | **AUDITED** |
| F-07-13 | Reverse/Extend/Shorten/Convert frames | reorder, span drag, bake | TL | **AUDITED** |
| F-07-14 | Distribute-to-layers / Synchronize symbols | split content, sync loops | TL,LYR,SYM | **AUDITED** |
| F-07-15 | Tween span creation | motion/classic/shape/pose | TL,TWN | **AUDITED** |
| F-07-16 | Timeline cross-interactions | audio/symbols/rigging/mobile | TL,AUD,SYM,IK,MUL | **AUDITED** |

### PART 08 — KEYFRAME SYSTEM  (source: `08_keyframe_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-08-01 | Keyframe data model | property vs whole-frame | KF,DTM | **AUDITED** |
| F-08-02 | Interpolation engine | number/rotation/color/scale/log | KF,ARC | **AUDITED** |
| F-08-03 | Position keyframe | curve control, motion path vertex | KF,TWN | **AUDITED** |
| F-08-04 | Rotation keyframe | orientation flags, loops | KF | **AUDITED** |
| F-08-05 | Scale keyframe | per-axis, log-lerp | KF | **AUDITED** |
| F-08-06 | Shape keyframe | anchor correspondence, morph | KF,SHP | **AUDITED** |
| F-08-07 | Symbol keyframe | swap discrete | KF,SYM | **AUDITED** |
| F-08-08 | Color keyframe | tint/alpha curves | KF,CLR | **AUDITED** |
| F-08-09 | Camera keyframe | camera states | KF,CAM | **AUDITED** |
| F-08-10 | Bone/pose keyframe | pose interpolation | KF,IK | **AUDITED** |
| F-08-11 | Mouth/viseme keyframe | first-frame swap | KF,LIP | **AUDITED** |
| F-08-12 | Keyframe lifecycle | move/delete/duplicate | KF | **AUDITED** |
| F-08-13 | Auto-keying | rule + toast | KF,TL | **AUDITED** |

### PART 09 — TWEENING  (source: `09_tweening.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-09-01 | Motion tween | span, per-property keys, target, wrap | TWN,KF | **AUDITED** |
| F-09-02 | Motion tween property matrix | supported/unsupported | TWN | **AUDITED** |
| F-09-03 | Classic tween | whole-frame interp, broken-tween | TWN | **AUDITED** |
| F-09-04 | Shape tween | morphing, hints, blending | TWN,SHP | **AUDITED** |
| F-09-05 | Easing engine | Penner functions, slider, custom curve | TWN | **AUDITED** |
| F-09-06 | Easing & motion presets | presets, copy/paste motion | TWN | **AUDITED** |
| F-09-07 | Tween data model | span JSON | TWN,DTM | **AUDITED** |
| F-09-08 | Graph editor (AE-style) | multi-property curves, multi-select | TWN | **AUDITED** |

### PART 10 — MOTION PATH  (source: `10_motion_path.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-10-01 | Path anatomy & data | anchors/handles/vertex-frames | TWN | **AUDITED** |
| F-10-02 | Position interpolation | parameter vs arc-length | TWN | **AUDITED** |
| F-10-03 | Orientation & rotation-along-path | tangent, forward axis | TWN | **AUDITED** |
| F-10-04 | Path editing | vertex/segment/handle ops | TWN,SEL | **AUDITED** |
| F-10-05 | Path duplication & reversal | reverse frames, reverse direction | TWN | **AUDITED** |
| F-10-06 | Motion guide layers (legacy) | guide linking, snap | TWN,LYR | **AUDITED** |

### PART 11 — SYMBOL SYSTEM  (source: `11_symbol_system.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-11-01 | Symbol concept & types | definition vs instance | SYM | **AUDITED** |
| F-11-02 | Graphic symbol | parent-driven playback | SYM,TL | **AUDITED** |
| F-11-03 | Movie clip | independent clock | SYM,TL | **AUDITED** |
| F-11-04 | Button symbol | Up/Over/Down/Hit | SYM | **AUDITED** |
| F-11-05 | Font symbol (niche) | embedding | SYM,TXT | **AUDITED** |
| F-11-06 | Convert to Symbol (F8) | dialog, registration grid | SYM | **AUDITED** |
| F-11-07 | Symbol editing modes | edit/in-place/breadcrumb | SYM | **AUDITED** |
| F-11-08 | Graphic loop modes & Frame Picker | loop/once/single, first frame | SYM,LIP | **AUDITED** |
| F-11-09 | Instance properties | color effect, filters, name | SYM | **AUDITED** |
| F-11-10 | Swap / Duplicate symbol | keep-transform swap | SYM | **AUDITED** |
| F-11-11 | Break Apart hierarchy | instance→content→shapes | SYM,SHP | **AUDITED** |
| F-11-12 | Nested animation playback | tree sampling, graphic-sync | SYM,TL | **AUDITED** |
| F-11-13 | Registration point editing | crosshair, move art | SYM | **AUDITED** |
| F-11-14 | Symbol data model | symbol/instance JSON | SYM,DTM | **AUDITED** |

### PART 12 — LIBRARY  (source: `12_library.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-12-01 | Panel anatomy | list/preview/search/folders | LIB | **AUDITED** |
| F-12-02 | Import asset | drag/import-to-library | LIB,IMP | **AUDITED** |
| F-12-03 | Create symbol | new/convert | LIB,SYM | **AUDITED** |
| F-12-04 | Rename/Duplicate/Delete | use-count, unused-delete | LIB | **AUDITED** |
| F-12-05 | Folders & organize | nest, sort | LIB | **AUDITED** |
| F-12-06 | Search | substring, scope | LIB | **AUDITED** |
| F-12-07 | Preview | symbol anim, waveform, thumb | LIB | **AUDITED** |
| F-12-08 | Linkage (legacy) | export identifier | LIB | **AUDITED** |
| F-12-09 | Export asset | save to disk | LIB,EXP | **AUDITED** |
| F-12-10 | Reuse (drag to stage) | instantiate | LIB,SYM | **AUDITED** |
| F-12-11 | Replace (swap) | drag-onto-instance | LIB,SYM | **AUDITED** |
| F-12-12 | Update instances | definition edit propagation | LIB,SYM | **AUDITED** |
| F-12-13 | Open external library | read-only cross-doc | LIB | **AUDITED** |

### PART 13 — CHARACTER ANIMATION  (source: `13_character_animation.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-13-01 | Approach selection | cut-out/frame-by-frame/hybrid | RIG,FBF | **AUDITED** |
| F-13-02 | Artwork preparation | parts, joints, overlap | RIG,DRW | **AUDITED** |
| F-13-03 | Parts → symbols | naming, distribute-to-layers | RIG,SYM | **AUDITED** |
| F-13-04 | Hierarchy building | nesting, root movie clip | RIG,SYM | **AUDITED** |
| F-13-05 | Pivot placement | joint pivots | RIG,XFR | **AUDITED** |
| F-13-06 | Bones/IK integration | chains, constraints | RIG,IK | **AUDITED** |
| F-13-07 | Posing workflow | key poses, pose library | RIG,KF | **AUDITED** |
| F-13-08 | Animation craft | blocking, arcs, easing, squash | RIG,TWN | **AUDITED** |
| F-13-09 | Walk-cycle recipe | 4 poses, foot-slide fix | RIG | **AUDITED** |
| F-13-10 | Reusable clips | movie-clip wrap | RIG,SYM | **AUDITED** |
| F-13-11 | Three rig approaches | hierarchy/bones/warp | RIG | **AUDITED** |
| F-13-12 | Character data model | rig/pose/clip JSON | RIG,DTM | **AUDITED** |

### PART 14 — BONE / IK  (source: `14_bone_ik.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-14-01 | Vocabulary | bone/armature/joint/root/target | IK | **AUDITED** |
| F-14-02 | Two armature types | symbol vs IK shape | IK | **AUDITED** |
| F-14-03 | Bone data model | local-space, stable IDs | IK,DTM | **AUDITED** |
| F-14-04 | Building armatures | chain clicks, carving | IK | **AUDITED** |
| F-14-05 | IK solvers | 2-bone/CCD/FABRIK, unreachable | IK,ARC | **AUDITED** |
| F-14-06 | Constraints | rotation/translation/speed/spring | IK | **AUDITED** |
| F-14-07 | Pose layer & Insert Pose | green layer, poses | IK,TL | **AUDITED** |
| F-14-08 | Pose editing rules | select/move/delete poses | IK,KF | **AUDITED** |
| F-14-09 | Bone animation workflow | author-time vs runtime | IK,TWN | **AUDITED** |

### PART 15 — FRAME-BY-FRAME  (source: `15_frame_by_frame.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-15-01 | Workflow steps | F6/F7/redraw cycle | FBF | **AUDITED** |
| F-15-02 | Onion skin controls | toggle/outlines/edit-multiple/markers/tint/opacity | FBF | **AUDITED** |
| F-15-03 | Onion skin behavior & implementation | ghost pass, caches | FBF,ARC | **AUDITED** |
| F-15-04 | Tools & shortcuts | step, insert keys | FBF | **AUDITED** |
| F-15-05 | Exposure & timing | ones/twos/threes | FBF,TL | **AUDITED** |
| F-15-06 | Cel/drawing reuse system | expose-same vs duplicate-new | FBF,DTM | **AUDITED** |

### PART 16 — CAMERA  (source: `16_camera.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-16-01 | Camera concept & 3 zooms | view/camera/object | CAM | **AUDITED** |
| F-16-02 | Camera data model & matrix | x/y/z/zoom/rotation/tint | CAM,DTM | **AUDITED** |
| F-16-03 | Camera layer | keyframes, delete-disables | CAM,TL | **AUDITED** |
| F-16-04 | Camera tool interaction | pan/zoom/rotate modifiers | CAM | **AUDITED** |
| F-16-05 | Camera animation & presets | push/pull/pan/shake | CAM,TWN | **AUDITED** |
| F-16-06 | Layer depth & parallax | z-depth, depth-scale | CAM,LYR | **AUDITED** |
| F-16-07 | Camera representation spec | per-scene camera, log-zoom | CAM,ARC | **AUDITED** |

### PART 17 — AUDIO  (source: `17_audio.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-17-01 | Event vs Stream sounds | load/play/sync semantics | AUD | **AUDITED** |
| F-17-02 | Import & formats | MP3/WAV/AIFF/OGG/FLAC | AUD,IMP | **AUDITED** |
| F-17-03 | Placement & waveform | keyframe attach, extent | AUD,TL | **AUDITED** |
| F-17-04 | Sync menu | Event/Start/Stop/Stream | AUD | **AUDITED** |
| F-17-05 | Loop | count, timeline loop | AUD | **AUDITED** |
| F-17-06 | Trim/volume/effects/envelope | in/out, curves | AUD | **AUDITED** |
| F-17-07 | Timeline synchronization | scrub, mute, fps remap | AUD,TL | **AUDITED** |
| F-17-08 | Export synchronization | video mux, HTML runtime | AUD,EXP | **AUDITED** |
| F-17-09 | Audio data model | asset + attachment JSON | AUD,DTM | **AUDITED** |

### PART 18 — LIP SYNC  (source: `18_lip_sync.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-18-01 | Phoneme→viseme mapping | 12-shape chart | LIP | **AUDITED** |
| F-18-02 | Mouth library/symbol | graphic with viseme frames | LIP,SYM | **AUDITED** |
| F-18-03 | Auto lip-sync workflow | dialog, mapping, sync | LIP,AUD | **AUDITED** |
| F-18-04 | Analysis | VAD, phonemes, frame assign | LIP,ARC | **AUDITED** |
| F-18-05 | Manual override & Frame Picker | per-key correction | LIP | **AUDITED** |
| F-18-06 | Improved original system | 10 improvements | LIP | **AUDITED** |
| F-18-07 | Lip-sync data model | visemeMap, result JSON | LIP,DTM | **AUDITED** |

### PART 19 — FACIAL ANIMATION  (source: `19_facial_animation.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-19-01 | Facial rig construction | head/eyes/brows/mouth nesting | FAC,RIG | **AUDITED** |
| F-19-02 | Blink system | eyelid clip, auto-blink | FAC | **AUDITED** |
| F-19-03 | Eye direction system | pupil, gaze poses | FAC | **AUDITED** |
| F-19-04 | Mouth system | viseme + expression poses | FAC,LIP | **AUDITED** |
| F-19-05 | Expression system | presets, swap/tween | FAC | **AUDITED** |
| F-19-06 | Head movement system | nod/tilt/shake/turn | FAC,XFR | **AUDITED** |
| F-19-07 | Facial workflow | end-to-end | FAC | **AUDITED** |

### PART 20 — LAYERS  (source: `20_layers.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-20-01 | Layer data model | types, flags, z-depth | LYR,DTM | **AUDITED** |
| F-20-02 | Lifecycle ops | create/delete/rename/move/duplicate | LYR | **AUDITED** |
| F-20-03 | State toggles | visible/locked/outline cascade | LYR | **AUDITED** |
| F-20-04 | Layer types (11) | per-type storage & conversion | LYR | **AUDITED** |
| F-20-05 | Folders & hierarchy | nesting, drag rules | LYR | **AUDITED** |
| F-20-06 | Layer parenting | local-space inheritance | LYR,RIG | **AUDITED** |
| F-20-07 | Layer order & render rules | bottom→top, arrange | LYR,ARC | **AUDITED** |

### PART 21 — MASKS  (source: `21_masks.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-21-01 | Mask vs masked layers | linking, unlock preview | MSK,LYR | **AUDITED** |
| F-21-02 | Clipping rules | fill windows, strokes ignored | MSK | **AUDITED** |
| F-21-03 | Animated masks | move/morph/rotate | MSK,TWN | **AUDITED** |
| F-21-04 | Nested masks | inner-first composite | MSK,SYM | **AUDITED** |
| F-21-05 | Alpha masks | soft edges, gradients | MSK | **AUDITED** |
| F-21-06 | Implementation | stencil/mask-texture/boolean | MSK,ARC | **AUDITED** |

### PART 22 — TEXT  (source: `22_text.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-22-01 | Three text types | static/dynamic/input | TXT | **AUDITED** |
| F-22-02 | Text tool & blocks | point/box, edit mode | TXT | **AUDITED** |
| F-22-03 | Font & glyphs | embedding, metrics, fallback | TXT | **AUDITED** |
| F-22-04 | Style controls | family/size/align/spacing | TXT | **AUDITED** |
| F-22-05 | Text transform | scale/flip/break-apart | TXT,XFR | **AUDITED** |
| F-22-06 | Text animation | tween/per-char/morph/mask | TXT,TWN | **AUDITED** |
| F-22-07 | Dynamic binding | variables, runtime | TXT | **AUDITED** |
| F-22-08 | Export per type | HTML/image/SVG | TXT,EXP | **AUDITED** |

### PART 23 — COLOR  (source: `23_color.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-23-01 | Color model | RGBA/HSB/hex | CLR,DTM | **AUDITED** |
| F-23-02 | Color controls | chips/swap/b&w/no-color | CLR | **AUDITED** |
| F-23-03 | Color picker | HS field, brightness, alpha | CLR | **AUDITED** |
| F-23-04 | Swatches | add/delete/folders/import | CLR | **AUDITED** |
| F-23-05 | Alpha | opacity slider, merge | CLR | **AUDITED** |
| F-23-06 | Gradients | linear/radial/focal/stops | CLR | **AUDITED** |
| F-23-07 | Bitmap fills | tile/stretch/lock | CLR,IMP | **AUDITED** |
| F-23-08 | Custom colors & replacement | find&replace, adjust | CLR | **AUDITED** |

### PART 24 — ALIGN / DISTRIBUTE  (source: `24_align_distribute.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-24-01 | Two spaces | stage vs selection | ALN | **AUDITED** |
| F-24-02 | Six align ops | L/C/R/T/M/B | ALN | **AUDITED** |
| F-24-03 | Distribute ops | edges/centers | ALN | **AUDITED** |
| F-24-04 | Spacing (even gaps) | gap distribution | ALN | **AUDITED** |
| F-24-05 | Match size | width/height/both | ALN | **AUDITED** |
| F-24-06 | Math details | rotated bounds, locked exclusion | ALN | **AUDITED** |

### PART 25 — SCENES  (source: `25_scenes.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-25-01 | Scene concept | ordered timelines, shared lib | SCN | **AUDITED** |
| F-25-02 | Scene ops | create/dup/delete/rename/reorder | SCN | **AUDITED** |
| F-25-03 | Scene properties | duration, bg, fps | SCN | **AUDITED** |
| F-25-04 | Per-scene timeline/camera/audio | independence | SCN,TL,CAM,AUD | **AUDITED** |
| F-25-05 | Navigation | panel, breadcrumb, go-to | SCN | **AUDITED** |
| F-25-06 | Scene tabs | multi-open, split view | SCN | **AUDITED** |

### PART 26 — PROPERTIES PANEL  (source: `26_properties_panel.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-26-01 | Context-binding mechanism | precedence, schema contract | PRP,ARC | **AUDITED** |
| F-26-02 | Document schema | size/fps/bg | PRP | **AUDITED** |
| F-26-03 | Shape schema | pos/fill/stroke/rule | PRP | **AUDITED** |
| F-26-04 | Group schema | pos/type/edit | PRP | **AUDITED** |
| F-26-05 | Instance schema | swap/color/filters/loop | PRP,SYM | **AUDITED** |
| F-26-06 | Text schema | type/char/paragraph | PRP,TXT | **AUDITED** |
| F-26-07 | Frame/tween schema | label/sound/ease | PRP,TL,TWN | **AUDITED** |
| F-26-08 | Camera schema | x/y/z/zoom/rot | PRP,CAM | **AUDITED** |
| F-26-09 | Audio schema | sound/sync/loop | PRP,AUD | **AUDITED** |
| F-26-10 | Bone schema | length/constraints/spring | PRP,IK | **AUDITED** |
| F-26-11 | Warp asset schema | mode/pins | PRP | **AUDITED** |
| F-26-12 | Mixed selection | common fields only | PRP | **AUDITED** |

### PART 27 — IMPORT  (source: `27_import.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-27-01 | Entry points | to-stage/to-library/external/drag/paste | IMP | **AUDITED** |
| F-27-02 | Raster import | PNG/JPEG/GIF/WebP/PSD-per-layer | IMP | **AUDITED** |
| F-27-03 | Vector import | SVG/AI cubic conversion | IMP,SHP | **AUDITED** |
| F-27-04 | Audio import | formats | IMP,AUD | **AUDITED** |
| F-27-05 | Video import | embed/link/frame-extract | IMP | **AUDITED** |
| F-27-06 | Sprite sheets & sequences | atlas, frame-by-frame | IMP | **AUDITED** |
| F-27-07 | Libraries (external) | copy/link assets | IMP,LIB | **AUDITED** |
| F-27-08 | Import report | conversions, warnings | IMP | **AUDITED** |

### PART 28 — EXPORT / PUBLISH  (source: `28_export_publish.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-28-01 | Export vs publish concepts | one-shot vs pipeline | EXP | **AUDITED** |
| F-28-02 | Image export | PNG/JPEG/SVG/WebP, scale | EXP | **AUDITED** |
| F-28-03 | PNG/JPEG sequence | range, sidecar fps | EXP | **AUDITED** |
| F-28-04 | Animated GIF | loop/palette/dither | EXP | **AUDITED** |
| F-28-05 | Video export | MP4/WebM, mux | EXP,AUD | **AUDITED** |
| F-28-06 | HTML5 publish | JS bundle, spritesheets | EXP | **AUDITED** |
| F-28-07 | Web/other targets | legacy SWF/OAM/AIR | EXP | **AUDITED** |
| F-28-08 | Audio-only export | stems | EXP,AUD | **AUDITED** |
| F-28-09 | Project file save | autosave, recovery | EXP,DTM | **AUDITED** |
| F-28-10 | Publish profiles | named settings bundles | EXP | **AUDITED** |
| F-28-11 | Universal settings matrix | per-format options | EXP | **AUDITED** |

### PART 29 — SHORTCUTS  (source: `29_shortcuts.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-29-01 | Tools shortcuts | V/A/Q/F/L/P/T/N/R/O… | — | **AUDITED** |
| F-29-02 | File/Edit shortcuts | Ctrl+N/S/Z/X/C/V… | — | **AUDITED** |
| F-29-03 | Selection shortcuts | shift-click, hide-edges | SEL | **AUDITED** |
| F-29-04 | Transform shortcuts | constrain, nudge, arrange | XFR | **AUDITED** |
| F-29-05 | Timeline/frame shortcuts | F5/F6/F7/Shift+F5/F6 | TL | **AUDITED** |
| F-29-06 | Playback shortcuts | Enter/./,/Home/End | TL | **AUDITED** |
| F-29-07 | Layer shortcuts | insert/folder/distribute | LYR | **AUDITED** |
| F-29-08 | Symbol shortcuts | F8/Ctrl+F8/Ctrl+B | SYM | **AUDITED** |
| F-29-09 | View shortcuts | Ctrl+=/-/1/0, rulers, grid | — | **AUDITED** |
| F-29-10 | Text shortcuts | Ctrl+T, kerning | TXT | **AUDITED** |
| F-29-11 | Custom additions | onion, cel, graph | — | **AUDITED** |
| F-29-12 | Shortcut editor | rebind, conflict detect | — | **AUDITED** |

### PART 30 — CONTEXT MENUS  (source: `30_context_menus.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-30-01 | Stage menu | paste/select/doc | SEL | **AUDITED** |
| F-30-02 | Object menu | cut/copy/convert/arrange | SEL,SYM | **AUDITED** |
| F-30-03 | Shape menu | convert/expand/hints/combine | SHP | **AUDITED** |
| F-30-04 | Symbol menu | edit/swap/duplicate/break | SYM | **AUDITED** |
| F-30-05 | Timeline menu | insert frame/keyframe | TL | **AUDITED** |
| F-30-06 | Layer menu | insert/delete/properties/mask | LYR | **AUDITED** |
| F-30-07 | Frame menu | tween/pose/convert/reverse | TL,TWN | **AUDITED** |
| F-30-08 | Library menu | edit/duplicate/export | LIB | **AUDITED** |
| F-30-09 | Audio menu | sync/envelope/stop | AUD | **AUDITED** |
| F-30-10 | Scene menu | add/dup/delete | SCN | **AUDITED** |

### PART 31 — MOBILE TRANSLATION  (source: `31_mobile_translation.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-31-01 | Architecture principle | gesture bus, 2 adapters | MUL,ARC | **AUDITED** |
| F-31-02 | Master mapping table | 22 desktop→mobile rows | MUL | **AUDITED** |
| F-31-03 | Selection mobile | tap/long-press/select-mode | MUL,SEL | **AUDITED** |
| F-31-04 | Drawing mobile | smoothing, loupe | MUL,DRW | **AUDITED** |
| F-31-05 | Transform mobile | pinch/twist/handles | MUL,XFR | **AUDITED** |
| F-31-06 | Timeline mobile | scrub, long-press menus | MUL,TL | **AUDITED** |
| F-31-07 | Rigging/camera mobile | gestures, numeric panels | MUL,IK,CAM | **AUDITED** |
| F-31-08 | Panels mobile | bottom sheet, grid library | MUL,PRP,LIB | **AUDITED** |
| F-31-09 | Persistent toolbar | undo/redo/select-mode/constrain | MUL | **AUDITED** |
| F-31-10 | Parity checklist | per-feature touch status | MUL | **AUDITED** |

### PART 32 — ARCHITECTURE  (source: `32_architecture.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-32-01 | Canvas Renderer | caches, dirty regions, hit-test | ARC | **AUDITED** |
| F-32-02 | Vector Engine | paths, booleans, tessellation | ARC | **AUDITED** |
| F-32-03 | Raster Engine | bitmaps, flood-fill, filters | ARC | **AUDITED** |
| F-32-04 | Scene Graph | render tree, nesting, spatial index | ARC | **AUDITED** |
| F-32-05 | Layer System | types, folders, parenting | ARC,LYR | **AUDITED** |
| F-32-06 | Timeline Engine | clock, sparse storage, playback | ARC,TL | **AUDITED** |
| F-32-07 | Keyframe Engine | interpolation | ARC,KF | **AUDITED** |
| F-32-08 | Tween Engine | spans, easing, paths | ARC,TWN | **AUDITED** |
| F-32-09 | Rig Engine | hierarchy, poses | ARC,RIG | **AUDITED** |
| F-32-10 | IK Engine | solvers, constraints | ARC,IK | **AUDITED** |
| F-32-11 | Symbol Engine | nesting, swap | ARC,SYM | **AUDITED** |
| F-32-12 | Audio Engine | sync modes, mux | ARC,AUD | **AUDITED** |
| F-32-13 | Lip Sync Engine | VAD, viseme map | ARC,LIP | **AUDITED** |
| F-32-14 | Camera Engine | matrix, parallax | ARC,CAM | **AUDITED** |
| F-32-15 | Text Engine | atlas, metrics, binding | ARC,TXT | **AUDITED** |
| F-32-16 | Asset Library | database, use-counts | ARC,LIB | **AUDITED** |
| F-32-17 | Project Serializer | save/load/autosave | ARC,DTM | **AUDITED** |
| F-32-18 | Undo/Redo Engine | commands, coalescing | ARC | **AUDITED** |
| F-32-19 | Export Engine | exporters, worker pool | ARC,EXP | **AUDITED** |
| F-32-20 | Desktop Input Engine | mouse/kbd/stylus → gestures | ARC | **AUDITED** |
| F-32-21 | Mobile Input Engine | touch/pen → gestures | ARC,MUL | **AUDITED** |

### PART 33 — DATA MODEL  (source: `33_data_model.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-33-01 | Project schema | meta/settings/scenes/library | DTM | **AUDITED** |
| F-33-02 | Scene schema | timeline, bg override | DTM | **AUDITED** |
| F-33-03 | Layer schema | type/flags/frames | DTM | **AUDITED** |
| F-33-04 | Character schema | parts/rigs/poses/clips | DTM,RIG | **AUDITED** |
| F-33-05 | Body Part schema | symbol/pivot/parent | DTM | **AUDITED** |
| F-33-06 | Bone/Armature schema | bones/bindings | DTM,IK | **AUDITED** |
| F-33-07 | Symbol & Instance schema | registration, loop, filters | DTM,SYM | **AUDITED** |
| F-33-08 | Frame schema | sparse types | DTM,TL | **AUDITED** |
| F-33-09 | Keyframe schema | property keys | DTM,KF | **AUDITED** |
| F-33-10 | Tween preset schema | reusable curves | DTM,TWN | **AUDITED** |
| F-33-11 | Pose schema | parts/bones | DTM,RIG | **AUDITED** |
| F-33-12 | Audio schema | asset + attachment | DTM,AUD | **AUDITED** |
| F-33-13 | Mouth Shape schema | viseme map | DTM,LIP | **AUDITED** |
| F-33-14 | Camera schema | states | DTM,CAM | **AUDITED** |
| F-33-15 | Asset schema | library kinds | DTM,LIB | **AUDITED** |
| F-33-16 | Transform schema | 8 fields | DTM,XFR | **AUDITED** |
| F-33-17 | Text schema | style/box/binding | DTM,TXT | **AUDITED** |
| F-33-18 | Effect schema | filters/color effect | DTM | **AUDITED** |
| F-33-19 | Shape schema | path/fills/strokes | DTM,SHP | **AUDITED** |

### PART 34 — UI BUTTON SPEC  (source: `34_ui_button_spec.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-34-01 | Tools panel buttons | 30+ tool buttons | BTN | **AUDITED** |
| F-34-02 | Timeline panel buttons | eye/lock/play/onion… | BTN,TL | **AUDITED** |
| F-34-03 | Properties panel buttons | swap/frame-picker/lip-sync | BTN,PRP | **AUDITED** |
| F-34-04 | Library panel buttons | new/delete/search | BTN,LIB | **AUDITED** |
| F-34-05 | Color/Align/Transform/Info buttons | chips/align/constrain | BTN | **AUDITED** |
| F-34-06 | Transport/Scenes/misc buttons | test/publish/undo/scene | BTN | **AUDITED** |
| F-34-07 | Button registry contract | declarative, predicates | BTN,ARC | **AUDITED** |

### PART 35 — PRIORITIES  (source: `35_priorities.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-35-01 | Priority definitions | P0–P3 semantics | PRI | **AUDITED** |
| F-35-02 | Feature classification table | every feature → tier | PRI | **AUDITED** |
| F-35-03 | Build order | releases 0–4 | PRI | **AUDITED** |
| F-35-04 | Release roadmap | milestone mapping | PRI | **AUDITED** |

### PART 36 — FINAL NOTES  (source: `36_final_notes.md`)
| ID | Feature | Key sub-features | Deps | Status |
|---|---|---|---|---|
| F-36-01 | Cross-cutting rules | 10 rules | FN | **AUDITED** |
| F-36-02 | Performance budget | operation targets | FN | **AUDITED** |
| F-36-03 | Glossary | term definitions | FN | **AUDITED** |
| F-36-04 | Completeness checklist | final gate | FN | **AUDITED** |

---

## 2. QUEUE STATISTICS

| Part | Feature count |
|---|---|
| 01 Application Map | 29 |
| 02 Every Tool | 35 |
| 03 Selection | 19 |
| 04 Transform | 14 |
| 05 Drawing | 10 |
| 06 Shape | 12 |
| 07 Timeline | 16 |
| 08 Keyframes | 13 |
| 09 Tweening | 8 |
| 10 Motion Path | 6 |
| 11 Symbols | 14 |
| 12 Library | 13 |
| 13 Character | 12 |
| 14 Bone/IK | 9 |
| 15 Frame-by-Frame | 6 |
| 16 Camera | 7 |
| 17 Audio | 9 |
| 18 Lip Sync | 7 |
| 19 Facial | 7 |
| 20 Layers | 7 |
| 21 Masks | 6 |
| 22 Text | 8 |
| 23 Color | 8 |
| 24 Align | 6 |
| 25 Scenes | 6 |
| 26 Properties | 12 |
| 27 Import | 8 |
| 28 Export | 11 |
| 29 Shortcuts | 12 |
| 30 Context Menus | 10 |
| 31 Mobile | 10 |
| 32 Architecture | 21 |
| 33 Data Model | 19 |
| 34 Buttons | 7 |
| 35 Priorities | 4 |
| 36 Final Notes | 4 |
| **TOTAL** | **~390 features** |

All 405 features: **AUDITED** (Phase 2 complete — see 00_GLOBAL_DEEP_AUDIT.md and 00_PHASE_2_COMPLETE.md).

---

## 3. SUGGESTED RESEARCH ORDER (recommendation only — you decide)

Foundational features first (everything depends on them), then outward:

1. **F-03-01 Hit testing** (selection foundation) → then the rest of Part 03.
2. **F-07-01 Timeline data structure** → frame types → frame ops (Part 07).
3. **F-08-01 Keyframe data model** → interpolation (Part 08).
4. **F-09-* Tweens** → **F-10-* Motion path**.
5. **F-04-01 Transform model** → transforms.
6. **F-06-* Shapes** → **F-05-* Drawing** → **F-02-* Tools**.
7. **F-11-* Symbols** → **F-12-* Library**.
8. Then rigging, camera, audio, lip-sync, facial, layers, masks, text, color, align, scenes, properties, import/export, shortcuts, context menus, mobile, architecture, data model, buttons, priorities, final notes.
9. Finally: **00_GLOBAL_DEEP_AUDIT.md** (Phase 3).

---

## 4. NEXT ACTION

Queue built. **STOPPED per protocol.** Awaiting your instruction on which feature to deep-research first (recommendation: **F-03-01 Selection Tool — Hit Testing**).
