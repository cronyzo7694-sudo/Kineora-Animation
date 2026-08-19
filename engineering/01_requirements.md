# 01_REQUIREMENTS — REQ REGISTRY & TRACEABILITY BACKBONE

Every REQ traces to Phase-1 part / Phase-2 feature / Phase-2.5 contract. Coverage: all 405 features (F-01..F-36) and 38 contracts (C-01..C-38) map into the REQ sets below; the full row-level matrix is `16_traceability.md`.

## Format
`REQ-XXX-NNN` where XXX = module group. Each REQ: statement + SOURCE + acceptance pointer.

## REQ-SYS — System & architecture
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-SYS-001 | Single source of truth = document model; panels are projections; no module caches authoritative data | Part 36.0.1 |
| REQ-SYS-002 | All document mutations go through Commands (undoable); panels never write directly | Part 36.0.2 / Part 32 |
| REQ-SYS-003 | `evaluate(model, time)` is pure + deterministic (authoring = playback = export) | Part 36.0.3 |
| REQ-SYS-004 | Stable IDs (layer/symbol/scene/node); names display-only; rename never breaks refs | Part 36.0.4 |
| REQ-SYS-005 | Cross-platform: desktop (Win/macOS/Linux) + tablet + web, one codebase, two input adapters | W7 / F-31 |
| REQ-SYS-006 | Event bus carries context/selection/timeline/document/tool changes; panels subscribe, never read each other | Part 01 §1.16 |
| REQ-SYS-007 | Every long op cancellable with progress; never frozen UI | C-34 / Part 20 |
| REQ-SYS-008 | Command palette (Cmd+K) reaches every tool/command/panel | C-04 |
| REQ-SYS-009 | Nothing-is-a-black-box: import/lip-sync/export emit inspectable reports/confidence | Part 36.0.8 |

## REQ-DOC — Document & scene
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-DOC-001 | Document = ordered scenes + shared library + settings (w/h/units/fps/bg/platform) | Part 01 §1.7 / Part 33 |
| REQ-DOC-002 | fps defines frame grid (time = frame/fps); fps change keeps frames, recomputes durations | Part 01 §1.7 |
| REQ-DOC-003 | Scene = named timeline; playback in order; per-scene camera/audio; scene tabs (W12) | Part 25 / F-25 |

## REQ-LAY — Layers & masks
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-LAY-001 | 11 layer types with per-type storage + auto-creation + conversion warnings | Part 20.3 |
| REQ-LAY-002 | Eye/lock/outline with Alt=others, drag-through, Shift+eye=transparent, folder cascade | F-07-02 |
| REQ-LAY-003 | Layer parenting = local-space transform inheritance, safe re-parent (W2) | Part 20.5 |
| REQ-LAY-004 | Mask = fill-only window; strokes/styles ignored; no mask-in-button / mask-on-mask; clip + alpha modes | F-21-01/02/05 |
| REQ-LAY-005 | Mask tween: shape-tween (fill) / motion-tween (type/graphic/clip); animated masks per-frame re-eval | F-21-03 |

## REQ-SEL — Selection
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-SEL-001 | Hit testing top-first, front-first; edge radius 4px/24px; locked/hidden skipped | F-03-01 |
| REQ-SEL-002 | Dual-domain selection: stage targets (subPath for fill/stroke/pins) + timeline selection | F-03-02 |
| REQ-SEL-003 | Click/double-click matrix (fill/stroke/whole/drill), Simple-Buttons blocking, Shift-Select pref | F-03-03/04 |
| REQ-SEL-004 | Marquee: contact-sensitivity (atomic objects) vs always-region (raw shapes); Alt+marquee=subtract (ours) | F-03-05 |
| REQ-SEL-005 | Selection = view state (no undo); commands capture prevSelection; selection:lost on delete/scrub | F-03-17/18 |
| REQ-SEL-006 | Raw-shape sub-object split happens at command time (move/cut), not at selection time | F-03-10 |

## REQ-XFR — Transform
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-XFR-001 | Transform component {x,y,scaleX,scaleY,rotation,skewX,skewY,pivotX,pivotY} + cached matrix | Part 33 §33.16 |
| REQ-XFR-002 | Distort/Envelope shape-only; bake to geometry; shape-tweenable | F-04-07/08 |
| REQ-XFR-003 | Registration ≠ pivot ≠ center; pivot double-click re-centers; pivot static per span | F-04-09 |
| REQ-XFR-004 | One gesture = one TransformCommand (undo restores all changed fields) | Part 04 §4.5 |

## REQ-DRW / REQ-SHP — Drawing & shape
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-DRW-001 | Stroke = outline polygon; width profiles {t,wL,wR}; caps round/square/butt; joins round/miter(limit)/bevel | Part 05.1 |
| REQ-DRW-002 | Strokes flat-color only (gradient stroke via convert-to-fill) | F-05 E1 |
| REQ-DRW-003 | Draw-target contract: validate layer lock/hidden/tween + frame key/blank/held + mode before pointer-down | F-05-09 |
| REQ-SHP-001 | Merge model: union(same-color)/cut(diff-color)/split-on-move; object mode atomic; dual node types | F-06-02/03 |
| REQ-SHP-002 | Boolean combine (union/intersect/punch/crop) on drawing objects; shared Boolean engine | F-06-07 |
| REQ-SHP-003 | Break-apart hierarchy (instance→content→shapes; text→chars→shapes; bitmap→fill); block tweened-symbol | F-06-11 |

## REQ-TIM / REQ-KF — Timeline & keyframes
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-TIM-001 | Sparse frame storage + hold rule; only keyframes/spans stored; duration derived | F-07-01 |
| REQ-TIM-002 | Frame visual language: dot/hollow-dot/diamond/gray/white/hollow-rect/blue/light-green/green/dashed/flag/a | F-07-05 |
| REQ-TIM-003 | Frame ops: F5/F6/F7, Delete/Clear/Remove (3 distinct), copy/paste/move, reverse, convert, distribute | F-07-08..14 |
| REQ-TIM-004 | Playhead: scrub/step/Home-End/Alt-keyframe-hop/double-click=column | F-07-04 |
| REQ-KF-001 | Two keyframe families: property (per-property, in span) vs whole-frame; diamond vs dot | F-08-01 |
| REQ-KF-002 | Interpolation: numeric lerp, rotation flags(CW/CCW/loops), OKLab color, log-zoom, log-scale | F-08-02 |
| REQ-KF-003 | Set-value-at-playhead creates/updates key; auto-key toast; legacy auto-keyframe OFF default | F-08-13 |

## REQ-TWN — Tweening
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-TWN-001 | Motion tween: one target/span, per-property keys, tween layer (no drawing), target-removed hollow dot, split-motion | F-09-01 |
| REQ-TWN-002 | Classic tween: whole-frame interp, rotate None/Auto/CW/CCW+loops, broken=dashed, auto-wrap tween1 | F-09-03 |
| REQ-TWN-003 | Shape tween: anchor correspondence + subdivision + hints + width-profile morph; broken=dashed | F-09-04 |
| REQ-TWN-004 | Easing: Penner set + slider(-100..+100) + custom Bézier + per-property presets + motion presets | F-09-05/06 |
| REQ-TWN-005 | Motion path: derived from x/y keys (two views one truth); edit/reshape/reverse/copy-as-stroke/paste-stroke; orient-to-path | F-10-01..06 |
| REQ-TWN-006 | Graph editor: multi-property curves, dashed=ease-applied, roving round dots, multi-select (W4) | F-09-08 |

## REQ-SYM / REQ-LIB — Symbols & library
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-SYM-001 | Graphic (parent-driven loop/once/single+first-frame) vs MovieClip (independent clock) vs Button (4 states) | F-11-01..04 |
| REQ-SYM-002 | Convert-to-symbol (name/type/9-grid registration); edit modes (edit/in-place/new-window) + breadcrumb + Esc exit | F-11-06/07 |
| REQ-SYM-003 | Swap (preserve properties) / duplicate / break-apart; instance color-effect/filters/loop/name | F-11-09/10/11 |
| REQ-SYM-004 | Nested playback: graphic-sync vs clip-free recursive sampling; live nested-preview toggle | F-11-12 |
| REQ-LIB-001 | Library: import/create/rename(rename-safe)/duplicate/delete(use-count+prompt)/folders/search/preview | F-12-01..07 |
| REQ-LIB-002 | Drag-to-stage instantiate; drag-onto-instance swap; external library; export asset | F-12-10..13 |

## REQ-RIG / REQ-IK — Rigging
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-RIG-001 | Cut-out pipeline: parts→symbols→hierarchy→pivots→bones→poses→clips; distribute-to-layers | F-13-01..12 |
| REQ-IK-001 | Bone model local-space + stable IDs; symbol armature + IK shape (edit limits) | F-14-02/03 |
| REQ-IK-002 | Solvers 2-bone/FABRIK/CCD; unreachable straighten; constraints (rot min/max/lock, trans, speed, spring) | F-14-05/06 |
| REQ-IK-003 | Pose layer + Insert Pose; author-time solve, playback interpolates angles | F-14-07/08 |
| REQ-WARP-001 | Asset warp: pins + mesh, rigid/flexible, keyframed pins (data, no flicker W3), vector+raster | F-02-32 |

## REQ-FBF / REQ-CAM — Frame-by-frame & camera
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-FBF-001 | Onion skin: toggle/outlines/edit-multiple/markers/tint/opacity/decrease-by/exclude/ctrl-both-markers | F-15-02 |
| REQ-FBF-002 | Cel/drawing reuse: expose-same vs duplicate-new; shared badge; drawing editor (W1) | F-15-06 |
| REQ-CAM-001 | Camera {x,y,z,zoom,rotation,tint} + camera track keyframes; log-zoom; attach-to-camera; z-depth parallax | F-16-01..07 |

## REQ-AUD / REQ-LIP — Audio & lip sync
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-AUD-001 | Sync Event/Start/Stop/Stream; waveform; scrub-audio; loop/trim/volume/envelope; fps remap | F-17-01..07 |
| REQ-AUD-002 | Export mux sample-exact; GIF/sequence silent warn; HTML sync metadata | F-17-08 |
| REQ-LIP-001 | Auto lip-sync: 12 visemes, Stream-required, map→sync→keyframes; one undoable pass | F-18-03 |
| REQ-LIP-002 | Phoneme lane + confidence + drag re-time + lead/lag + dictionary + batch + blend; manual frame-picker override | F-18-05/06 |

## REQ-TXT / REQ-CLR / REQ-ALN / REQ-SCN / REQ-PRP
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-TXT-001 | Static/Dynamic/Input; point/box; embed; AA modes (animation ignores kerning); size in points; per-type export | F-22-01..08 |
| REQ-CLR-001 | Fill/stroke chips + picker (HS/RGB/hex/alpha) + swatches + gradients (stops/focal) + bitmap fill + find&replace | F-23-01..08 |
| REQ-ALN-001 | Align 6 + distribute 6 + match-size + even-gap (ours); stage vs selection space | F-24-01..06 |
| REQ-SCN-001 | Scene CRUD + reorder + navigation + tabs + shared library use-count | F-25-01..06 |
| REQ-PRP-001 | Properties context precedence tool>selection>frame>doc; per-type schemas; mixed=common only | F-26-01..12 |

## REQ-I/O — Import/export
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-IMP-001 | Import to stage/library/external/drag/paste; PNG/JPEG/GIF/WebP/PSD(per-layer)/SVG/AI/audio/video/sequence/atlas | F-27-01..08 |
| REQ-EXP-001 | Image/sequence/GIF/video/HTML5/audio/project; per-format matrix (scale/fps/quality/loop/range/transparency/audio) | F-28-01..11 |
| REQ-EXP-002 | Export = same evaluate as playback; camera applied in all exporters; authoring overlays never exported | Part 28 / Part 36 |

## REQ-PLAT — Platform/input/UI
| REQ | Requirement | SOURCE |
|---|---|---|
| REQ-PLAT-001 | Gesture bus: two adapters (desktop mouse/kbd/stylus; touch/pen); tools consume normalized gestures | F-31-01 |
| REQ-PLAT-002 | Persistent mobile toolbar (undo/redo/select-mode/constrain/alt/onion/play/keyframe/delete) + loupe + 44px targets | F-31-09 |
| REQ-UI-001 | Zero-dead-button: 3-state registry + per-button (twice/during-op/no-context) | C-§2 |
| REQ-UI-002 | Central overlay/modal managers: viewport collision, focus trap, Esc, outside-click, L0–L7 z | C-07 |
| REQ-UI-003 | No-overlap + state-matrix + interaction test suites at 7 viewport sizes | C-36/37 |
| REQ-PERF-001 | 60fps playback (dirty-region + layer caches); hit-test <1ms@10k; [ENGINEERING TARGET] | Part 36.1 |
