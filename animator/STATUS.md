# IMPLEMENTATION STATUS (Phase 4)

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md |
| Rust core — doc/frame/selection/xfr/command/persist/export/eval | MOD-DOC/FRAME/SELECTION/XFR/COMMAND/PERSIST/EXPORT | COMPLETE | 83 cargo tests |
| CLI demo (offline manual test) | — | COMPLETE | cargo run |
| UI shell + control registry + dev panel | MOD-SHELL/UI | COMPLETE | vitest |
| Tauri desktop config | MOD-SHELL | READY(config) / BLOCKED(run: sandbox webkit) | desktop/src-tauri/ |
| WASM bridge (core ↔ UI) | MOD-INPUT/BRIDGE | COMPLETE (user-PC verified) | core/src/wasm.rs + ui/src/engine/client.ts |
| Canvas renderer (RectItem + viewport) | MOD-RENDER | COMPLETE | render/viewport.ts + canvasRenderer.ts + Stage |
| Select + Move gestures | MOD-INPUT/MOD-SELECTION/MOD-XFR | COMPLETE | editor/gesture.ts + MoveSelection (layer-aware) |
| Rect tool (real object creation) | MOD-INPUT/MOD-DRAWING/MOD-DOC | COMPLETE | gesture.normalizeRect + DrawRect + draw.rs |
| Transform + selection expansion | MOD-INPUT/MOD-XFR/MOD-SELECTION | COMPLETE | transformMath.ts + TransformSelection (layer-aware) |
| **Layers panel (engine-backed)** | MOD-LAYER/MOD-SHELL | COMPLETE | components/LayersPanel.tsx + layers.rs (12 tests) |
| **Properties panel (context-bound)** | MOD-SHELL/MOD-XFR/MOD-DOC | COMPLETE | components/PropertiesPanel.tsx + properties.rs (11 tests) |
| **Document / Stage / Viewport foundation** | MOD-DOC/MOD-RENDER | COMPLETE | stage boundary + pasteboard, canonical 1920×1080 default, view commands, stage-clipped export, document.rs (9 tests) |
| **Document properties + fill/stroke + workspace panels** | MOD-DOC/MOD-XFR/MOD-WORKSPACE | COMPLETE | editable fill/stroke/bg colors, fps wiring, C-06 panel resize handles, properties.rs (14) + App/PropertiesPanel tests |
| **Color live preview** | MOD-SHELL/MOD-RENDER | COMPLETE | renderer-only live color/stroke preview during picker drag; one command on release; canvasRenderer + PropertiesPanel tests |
| **Export (image: SVG/PNG/JPEG/WebP + scale)** | MOD-EXPORT/MOD-SHELL | COMPLETE (user-PC accepted ✅) | ExportDialog (format+scale), Rust export_svg_scaled, content-only rasterizer, export.rs (13 tests) + renderer/dialog tests |
| **Timeline + keyframes + frame ops** | MOD-TIMELINE/MOD-FRAME/MOD-KEYFRAME | **COMPLETE (this commit)** | interactive frame grid + ruler + playhead scrub, F6/F7/Shift+F6 commands, timeline.rs (10 tests) + TimelineStrip tests |
| CI (GitHub Actions) | MOD-TEST | READY (file) / BLOCKED (push: token needs `workflow` scope) | .github/workflows/ci.yml |
| Object-level lock/hide (Arrange) | MOD-SELECTION | NOT STARTED | later unit (layer-level only today) |
| Draggable pivot | MOD-XFR | NOT STARTED | pivot=center [ENGINEERING DECISION] |
| Tool-options schema (Properties) | MOD-SHELL | NOT STARTED | later unit (REQ-PRP-001 step 1) |
| Edit-in-place depth / nav.back | MOD-SYMBOL | NOT STARTED | later unit |
| Ruler units + backgroundAlpha (doc settings) | MOD-DOC | NOT STARTED | `units`/`backgroundAlpha` from Part 33 §33.1 deferred — schema stays {width,height,fps,background} |
| Pasteboard toggle (Ctrl+Shift+W) + spacebar-pan/Hand + Zoom tool | MOD-RENDER/MOD-INPUT | NOT STARTED | pasteboard now ALWAYS shown; toggle/tools later |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |

## This commit — Document / Stage / Viewport foundation
- **Root cause** (proven, not guessed): the viewport math was already correct; the defects were (a) **no visible Stage boundary** — the renderer filled the whole canvas with the background color (an "infinite white canvas"), and (b) **wrong default document size** — 800×600 instead of the canonical **1920×1080** (Part 33 §33.1 / engineering 03), which made fit-zoom land at ~62% on narrow layouts and produced large-looking document coordinates for ordinary drags.
- **Fixes**: renderer draws gray pasteboard → stage rect (doc background) → stage border (authoring-only); `Settings::default()` → 1920×1080; WASM loader calls `kineora_new_default()` (no size drift); view commands Ctrl+=/Ctrl+-/Ctrl+1/Ctrl+0; SVG export clips to the stage (`clipPath`) so pasteboard art is not exported.
- **Verified invariants** (new tests): zoom/pan never mutate doc coordinates; screen↔doc round-trips at 25%–800%; 1 screen-px = 1/zoom doc units; export = document stage bounds, independent of viewport; settings survive Save→Load; resizing the stage does not move content.

## This commit — Timeline + keyframes + frame ops (Part 07 / Part 08 / engineering P3)
- **Engine**: new undoable commands `InsertBlankKeyframe` (F7 — breaks the hold → empty) and `ClearKeyframe` (Shift+F6 — reverts to hold, keeps length; deleting the last keyframe empties the layer per Part 08 §8.4.2). Derived `timeline_duration` (max keyframe frame, min 1, Part 07 §7.0). Status now carries per-layer keyframe markers (frame + blank flag) + `duration`. Frame ops blocked on locked layers (Part 20.2); allowed on hidden layers.
- **UI**: `TimelineStrip` is now a real timeline — frame ruler (1,5,10,… click-to-jump / drag-to-scrub), per-layer frame cells (solid keyframe dots, hollow blank-keyframe dots, gray held spans, white empty), draggable playhead, frontmost-first layer column (click name = activate layer), Key/Blank/Clear buttons, and keyboard F6 / F7 / Shift+F6 / Home / End. All reads from real engine status; playhead = engine view-state; frame ops = undoable commands.
- **Deferred (later units)**: F5/Shift+F5 (frame insert/delete with span shifting), frame copy/paste/move/reverse, keyframe selection & dragging, tweens (Part 09), onion skin (Part 15), audio waveform.

### Manual acceptance matrix — Timeline (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | draw a rect on Layer 1 | timeline row 1 shows a solid dot at frame 1 |
| B | scrub: drag the playhead / click a frame | stage updates to that frame |
| C | click frame number 10 in the ruler | playhead jumps to 10 |
| D | press F6 at frame 10 | solid dot appears at 10 (content copied) |
| E | move the rect at frame 10, play 1→10 | rect animates (interpolation) |
| F | press F7 at frame 15 | hollow dot at 15; stage goes empty from 15 |
| G | press Shift+F6 at frame 15 | hollow dot gone; hold reverts to frame-10 content |
| H | Undo / Redo | each frame op is one exact undo step |
| I | lock Layer 1, press F7 | blocked (no command); unlock → works |
| J | add Layer 2, draw | second row appears above; keyframes independent |
| K | click a layer name in the timeline | that layer becomes active |
| L | Home / End | playhead jumps to first / last frame |
| M | export at frame 5 vs 10 | SVG differs (interpolated position), timeline dots never in export |

## This commit — Export unit (Part 28.1 / F-28-02 / C-31 exp.image)
- **Implemented**: File ▸ Export opens a dialog — Format (SVG/PNG/JPEG/WebP) + Scale (1×/2×/4×), exporting the CURRENT frame from real engine state. SVG via Rust `export_svg_scaled` (stage dims × scale, viewBox = doc coords, clipPath, background, fill/stroke/width, rotation-around-center, layer order, hidden excluded / locked included, off-stage clipped). PNG/JPEG/WebP via a content-only rasterizer (`renderContent`/`rasterizeContent`) reusing the same `evaluate()` items → authoring = export (REQ-EXP-002-A). Overlays/pasteboard/selection/zoom/pan never leak (proven by tests). Export is non-mutating (no undo). Engine-not-attached = honest disabled dialog.
- **"Exported file looks very large"** — NOT a bug: the stage IS 1920×1080, so the file is 1920×1080 and a viewer shows it 1:1. Correct behavior; Scale 2×/4× = supersampling.
- **Deferred (IMP-DEC-005 / later units)**: PNG/JPEG sequence, animated GIF, video (MP4/WebM), HTML5 bundle, audio-only, publish profiles, progress+cancel, transparency ("no color"), JPEG quality UI, named-frame labels, skew rendering (no skew UI yet).

### Manual acceptance matrix — Export (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | draw a rect, Export | dialog opens with frame number, format, scale |
| B | Export SVG @1× | kineora.svg downloads; opens at exactly 1920×1080 (doc size) |
| C | Export SVG @2× | width/height 3840×2160, content unchanged in doc coords |
| D | Export PNG @1× | 1920×1080 raster; matches the SVG visually |
| E | Export PNG @2× | 3840×2160 raster (supersampled) |
| F | Export JPEG / WebP | correct mime + opens as image |
| G | zoom/pan heavily, then export | output identical (viewport never affects export) |
| H | draw off-stage on pasteboard, export | off-stage art clipped out |
| I | select objects, export | no selection box/handles in output |
| J | hide a layer, export | hidden layer's art absent; locked layer's art present |
| K | rotate/scale/stroke an object, export | rotation/scale/stroke present (SVG + PNG match) |
| L | set a background color, export | stage background color in output |
| M | engine not attached (don't build wasm), Export | honest "engine not attached" + disabled button |
| N | Cancel | dialog closes, nothing downloads |

## This commit — Color live preview (Part 26.12 "color controls live" + C-09 "live preview; commit on release")
- **Root cause** (proven): `ColorField` committed ONLY on blur. React's `<input type="color">` onChange fires on `input` during a picker drag, so no engine mutation (and no canvas repaint) happened until the picker closed / focus left — hence "Stage updates only after clicking elsewhere".
- **Fix**: live renderer-only preview. During picker drag / typing, `onInput` pushes a `ColorPreview` (background override or per-object fill/stroke/stroke-width override) straight into the canvas renderer — **no engine write**, so no undo fragmentation. ONE command commits on release (picker close / blur / Enter); Esc cancels back to the engine value. Commits are idempotent (`lastCommitted` dedupe) so close-then-blur = exactly one command.
- **Architecture**: the preview lives in `RenderState.colorPreview` (renderer-only, exactly like `previewDelta`/`previewRect`/transform preview) — it can never leak into SVG export or project save (REQ-EXP-002). Export/save/undo semantics are unchanged (final value = committed engine state).
- **Verified**: live preview does not write the engine (PropertiesPanel tests); renderer draws background/item overrides and reverts to engine values without a preview (canvasRenderer tests); fill/background/stroke-width preview+commit+Esc-cancel each produce exactly one command.

## This commit — Document properties + fill/stroke + workspace panels
- **Root causes** (proven, not guessed):
  1. **Fill / Stroke / Background color fields were read-only in React** — a controlled `<input type="color" value={…}>` with only `onBlur` (no `onChange`) renders read-only, so picking a color did nothing. Fix: a `ColorField` with local draft + `onChange` (editable) that commits ONE command on blur/Enter and cancels on Esc (consistent with the numeric-field rule).
  2. **FPS was already engine-connected** (`setDocumentSettings → kineora_set_document_settings → Session::set_document_settings`, undoable, clamped 1–120, used by playback's `1000/fps` interval) — now proven by UI + Rust tests and surfaced with a "document settings updated" toast.
  3. **Panel resizing was absent** — implemented per **C-06** (`pnl.resize`: 6px edges, live preview, min-clamp never-zero, Esc cancels back to origin). Workspace panel widths persist to app prefs (`localStorage`, Part 01 §1.1.2 / engineering 13) — never into the project file.
- **Aspect ratio presets / link / scale-content**: [NOT SPECIFIED IN BLUEPRINT] — Part 26.1 lists only Width/Height/Ruler-units/fps/Background. Independent W/H editing (already present) is the blueprint behavior; no 16:9/4:3 presets or Link toggle added. Adobe's "Link + Scale Content" noted as [ADOBE REFERENCE] but NOT adopted.
- **Verified**: fill/stroke color + stroke width flow engine → evaluate → canvas → SVG → save/load (Rust `stroke_props_flow_into_evaluate_and_svg_export`, `fill_change_flows_into_export_and_survives_save_load`); resizing never touches zoom/document state (UI tests).

### Manual acceptance matrix — Color live preview (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | draw a rect, select it | Properties shows Object |
| B | open the Fill picker and drag | the rect recolors LIVE on stage while dragging |
| C | confirm/close the picker | color stays; ONE undo entry (Ctrl+Z reverts exactly) |
| D | open Background picker (deselect) and drag | the stage fill changes LIVE |
| E | enable Stroke, drag the stroke color picker | outline recolors LIVE |
| F | type a Stroke width | outline width updates LIVE while typing |
| G | Esc in a field | preview reverts to engine value, no commit, no undo entry |
| H | Export SVG | final committed colors/stroke only (no preview artifact) |
| I | Save → Reload | final values round-trip |
| J | Undo/Redo after several color edits | one step per picker interaction (no hundreds of entries) |

### Manual acceptance matrix — Document properties + fill/stroke + panels (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | draw a rect, select it | Properties shows Object context |
| B | change Fill color | canvas object recolors + toast `fill → #…` |
| C | check Properties | fill swatch reflects the new color |
| D | enable Stroke, pick a color | outline appears in that color |
| E | set Stroke width (e.g. 10) | outline thickens (scales with zoom) |
| F | disable Stroke | outline disappears |
| G | Undo/Redo | each color/width change = one undo step, exact |
| H | Export SVG | SVG contains the fill + stroke + stroke-width |
| I | deselect → Document: change fps | StatusBar fps updates; Play uses new speed |
| J | change Background color | stage fill + SVG background change |
| K | change W then H | stage rect resizes; content stays put |
| L | Save → Reload | W/H/fps/background/fill/stroke all restored |
| M | drag the Layers panel edge (6px) | panel resizes live; stage flexes; no overlap |
| N | drag the Properties panel edge | resizes; never narrower than 180px |
| O | drag far → release | min-clamped (never 0) |
| P | Esc mid-resize | panel returns to its pre-drag width |
| Q | resize then draw | zoom + document coordinates unchanged |

## Foundation unit — manual acceptance matrix (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | open the editor | white 16:9 stage on gray pasteboard, clearly bounded |
| B | stage readout | `stage: 1920×1080` |
| C | draw at fit zoom | doc size = screen ÷ zoom (no mystery scale) |
| D | Ctrl+= → 200%, draw | correct doc size |
| E | Ctrl+- → 25%, draw | correct doc size |
| F | pan, draw | correct doc position |
| G | draw on the gray pasteboard | allowed (staging), not exported |
| H | Properties: change W/H | stage rect resizes |
| I | change background | stage fill changes |
| J | change fps | timeline speed changes |
| K | Save → Reload | W/H/bg/fps restored |
| L | Export SVG | doc stage bounds, clips off-stage, no overlay, zoom/pan-independent |

## This commit (previous) — Layers + Properties panels
- **Rust**: new commands `SetNodeProps`, `SetDocumentSettings`, `CreateLayer`, `DeleteLayer`, `RenameLayer`, `SetLayerVisible`, `SetLayerLocked`, `ReorderLayer` (all undoable, bit-exact). `MoveSelection`/`TransformSelection` are now **layer-aware** (each node's override is written to its OWN layer — cross-layer marquee/Select-All selections move/transform correctly). `select_all` spans layers and skips hidden/locked; `draw_rect` rejects hidden/locked targets (REQ-DRW-003); selection is pruned when a layer is hidden/locked or its nodes are orphaned by a delete. Active layer is view state (no undo).
- **WASM**: `kineora_set_active_layer / create_layer / delete_layer / rename_layer / set_layer_visible / set_layer_locked / move_layer / patch_transforms / set_node_props / set_document_settings`; `kineora_status` now returns `layers[]` (+per-layer selection marker) + `active_layer` + fill/stroke/stroke_width in selection details.
- **UI**: `LayersPanel` (eye/lock/name/selection-dot, click=activate, dbl-click=rename, +/trash, ▲▼ reorder + HTML5 drag reorder) and `PropertiesPanel` (context precedence: selection → document; single = X/Y/W/H/rotation/scale/fill/stroke, multi = common X/Y/W/H + "mixed" badge, none = doc W/H/fps/background). Numeric fields commit on Enter/blur (one command), Esc cancels, invalid input reverts with inline error. `panel.layers` / `panel.properties` toolbar toggles are now real.

## Layer semantics implemented (Part 20)
- Create (above active, becomes active, "Layer N"), delete (last layer blocked [OUR DESIGN DECISION]), rename (display-only, id-stable), reorder (bottom→top render order), eye (hidden = not rendered/selectable/exported), lock (renders, not selectable/editable, skipped by Select All, still exported). Render order = `layers[]` index (bottom → top); layers panel lists frontmost first.
- **Not yet**: folders/hierarchy, layer types beyond `normal`, outline mode, layer parenting, duplicate/copy-paste layer. (Documented later units.)

## Manual acceptance matrix — Layers + Properties (test on your PC)
| # | Action | Expect |
|---|---|---|
| A | draw two rects on Layer 1 | both appear |
| B | Layers panel | shows "Layer 1" (active highlight) |
| C | click a rect on stage | Layers row shows a blue ● selection dot; Properties shows Object: real X/Y/W/H |
| D | click the Layers row | row becomes active; draws go to that layer |
| E | change X in Properties → Enter | object moves (canvas updates); one Undo entry |
| F | change Y, W, H, Rotation, Scale % | each updates renderer; Undo/Redo exact |
| G | change Fill / enable Stroke + width | object restyles (base props, all frames) |
| H | add layer (+), draw on it | new layer active; stacking correct |
| I | eye-off a layer | its objects vanish (canvas + SVG export) |
| J | lock a layer | still visible, but not selectable/select-all-able |
| K | reorder layers (▲▼ or drag) | render order flips; Undo restores |
| L | dbl-click rename | name changes; Undo restores |
| M | delete a layer | gone + its nodes; Undo restores exactly |
| N | multi-select across layers → drag | both move (each on its own layer) |
| O | edit property on an interpolated frame | no jump (interpolated before + delta) |
| P | Play | playback remains correct after edits |
| Q | Save / reload | layers + properties round-trip |
| R | Export SVG | no selection box/handles/panels in SVG |

## Bug fixes (recent)
- **BUG-3: Vite public/ import error** — loader fetches glue as TEXT → Blob URL import → explicit `.wasm` init (single mechanism for dev/build/Tauri).
- **BUG-2: WASM output directory wrong** — `scripts/build-wasm.sh` computes ABSOLUTE canonical out-dir (cwd-independent).
- **BUG-1: WASM runtime attach failure** — canonical URL `/wasm/kineora_core.js` + regression test.

## Blockers
- **CI workflow push**: the PAT lacks `workflow` scope → `.github/workflows/ci.yml` is ready in the workspace but cannot be pushed by this token. Fix: (a) send a new PAT with `repo` + `workflow` scope, or (b) on your PC copy `.github/workflows/ci.yml` into the repo and `git push`.
- **Tauri run in AI sandbox**: webkit2gtk system libs absent (IMP-DEC-007). Engine+UI build/test in CI; desktop runs on the user's Linux PC.

## Next units (order)
1. Tweening (Part 09): motion tween spans + per-property keys + easing — completes the "it animates" release (blueprint Release 1 step 6).
2. Frame ops completion: F5 insert-frame / Shift+F5 delete-frame (span shifting), frame copy/paste/move/reverse.
3. Object-level lock/hide + draggable pivot (finish MOD-SELECTION/MOD-XFR gaps).
4. Tool-options schema for Properties (REQ-PRP-001 step 1) + keyboard shortcut wiring (Ctrl+A select-all, etc.).
5. Drawing tools (oval/line) + shape merge model (Part 05/06), symbols/library (Part 11/12).
6. Export extensions (sequence / animated GIF / video — native encoder jobs, IMP-DEC-005) + progress/cancel + publish profiles.
