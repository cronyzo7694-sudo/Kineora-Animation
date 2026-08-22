# IMPLEMENTATION STATUS (Phase 4)

## AI-A batch (2026-08-22) — SYS-03/04/05/06 (not COMPLETE)

Object clipboard (Copy/Cut/Paste Center/In Place/Duplicate), view overlays
(rulers/grid/hide-edges/work-area/outline), classic-tween menu wiring,
transform rotate-90/flip/remove, arrange, align. SYS-07 Text **blocked**
(no `Node::Text`). Provisional: AMB-SYS03-001/002, AMB-SYS04-001.
Details: `PROJECT_COORDINATION/AI-A_REPORT.md`. Manual desktop QA PENDING.

---

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md |
| Rust core — doc/frame/selection/xfr/command/persist/export/eval | MOD-DOC/FRAME/SELECTION/XFR/COMMAND/PERSIST/EXPORT | COMPLETE | 214 cargo tests |
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
| **Timeline + keyframes + frame ops** | MOD-TIMELINE/MOD-FRAME/MOD-KEYFRAME | UNIT C accepted (52383e3) | unbounded viewport, lock-state honesty |
| **Frame manipulation (F5/Shift+F5 + keyframe drag)** | MOD-FRAME/MOD-KEYFRAME | ACCEPTED (1a02769) | InsertFrames/DeleteFrames/MoveKeyframe/DuplicateKeyframe commands |
| **Timeline navigation + zoom + transport** | MOD-TIMELINE | ACCEPTED (24269fe) | ruler zoom 50–400% + adaptive numbering, `.`/`,` step, Alt+,/. hop, first/last/center, loop toggle |
| **Frame range selection + clipboard/sequence ops** | MOD-FRAME/MOD-KEYFRAME | ACCEPTED (e23c23f) | drag-range selection, copy/cut/paste/reverse/remove frames |
| **Classic tween + easing foundation** | MOD-TWEEN/MOD-EASING | ACCEPTED (cd6fc44) | explicit tween spans, hold-by-default, ease slider, span visuals |
| **Frame sequences, exposure & labels** | MOD-FRAME/MOD-KEYFRAME | ACCEPTED (d0c055b) | sequence move, span-edge resize, duplicate, convert, labels, end-of-span marker |
| **Symbols + Library foundation** | MOD-SYMBOL/MOD-INSTANCE/MOD-LIBRARY | **USABILITY-CORRECTED (this commit) — pending manual acceptance** | empty-instance selectability, locked-layer convert guard, loop/first-frame + swap UI, engine-state honesty |
| **Reusable panel/splitter system + vertical resize** | MOD-WORKSPACE/MOD-PANEL | **CORRECTED (this commit) — pending manual acceptance** | bounded overflow-safe right dock, sum-aware splitters, Properties flex+min320, visibility registry (incl. Timeline Ctrl+Alt+T + Dev), generic distribute/clampPanePref |
| CI (GitHub Actions) | MOD-TEST | READY (file) / BLOCKED (push: token needs `workflow` scope) | .github/workflows/ci.yml |
| Object-level lock/hide (Arrange) | MOD-SELECTION | NOT STARTED | later unit (layer-level only today) |
| Draggable pivot | MOD-XFR | NOT STARTED | pivot=center [ENGINEERING DECISION] |
| Tool-options schema (Properties) | MOD-SHELL | NOT STARTED | later unit (REQ-PRP-001 step 1) |
| Edit-in-place depth / nav.back | MOD-SYMBOL | NOT STARTED | later unit |
| Ruler units + backgroundAlpha (doc settings) | MOD-DOC | NOT STARTED | `units`/`backgroundAlpha` from Part 33 §33.1 deferred — schema stays {width,height,fps,background} |
| Pasteboard toggle (Ctrl+Shift+W) + spacebar-pan/Hand + Zoom tool | MOD-RENDER/MOD-INPUT | NOT STARTED | pasteboard now ALWAYS shown; toggle/tools later |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |
| **SYS-16 Layers — outline mode + duplicate + batch toggles + indicators** | MOD-LAYER/MOD-RENDER | **IMPLEMENTED — pending manual acceptance** | outline swatch/color + strokes-only stage view (export unaffected), duplicate layer (deep copy, Animate-style names), Alt+click eye/lock/outline = "all others" (one undo step, M.3 rescue), red-X hidden + pencil/slash active indicators, timeline hidden marker; layers.rs 27 tests + LayersPanel/TimelineStrip/canvasRenderer tests |
| **SYS-16 Layers — layer:changed event (INT-0010) + drag-through column toggle** | MOD-LAYER/MOD-BUS | **IMPLEMENTED (this commit) — pending manual acceptance** | canonical `layer:changed{layerId,op}` emitted by every layer-mutation facade (stable id, per-layer events for batches, never on view-state); LayersPanel row flash + drag-through eye/lock/outline (F-07-02 E1/E2), row-click suppression, Esc cancel, keyboard activation preserved; UI 641 tests |

## This commit — SYS-16 Layers: layer:changed event + drag-through column toggle (AI-C, Leader order INT-0010)
- **Canonical `layer:changed{layerId, op}` (SYS-01 §27.1 / INT-0010 approved)**: the event is now emitted by EVERY layer-mutation facade in `engine/client.ts` (in addition to `document:changed{type:'layer'}`) — `added/removed/renamed/visible/locked/outline/outlineColor/reordered/duplicated`. Payload carries the layer's STABLE id (resolved from live status, never the index); batch "all others" ops emit ONE event per affected layer (before/after flag diff); view-state `setActiveLayer` NEVER emits (no document mutation). Consumers: App re-renders immediately; LayersPanel flashes the affected row (`layer:changed` → 900ms highlight) so the user sees exactly which layer changed.
- **Drag-through column multi-toggle (F-07-02 E1/E2 "drag through the column = multiple")**: pointer-down on eye/lock/outline then dragging vertically flips the same flag on every row entered (once per row per gesture, flipping from each row's gesture-start value). The row-click that follows a drag is suppressed (active layer never changes mid-drag); Esc cancels; HTML5 row-reorder is blocked when the drag starts on a column button; keyboard activation (Enter/Space, click `detail === 0`) still toggles — accessibility preserved. Alt+pointer-down still = batch "all others" (one undo step).
- **Citation fix (FL-0026, Leader-flagged)**: all `F-20-02/F-20-03` evidence citations across my code/tests/docs corrected to the canonical **F-20-01** (layer model/lifecycle/state matrix — the F-20-01 deep-research file) / F-20-04 (layer types) IDs.
- **Tests**: UI 606 → **641** (+7 LayersPanel drag-through/flash/alt-pointer, +7 client.layerEvents wire-faithful emission suite, +2 bus). `npm run build` ✓, Rust 21 suites / clippy 0 / fmt ✓ (unchanged engine this turn), wasm-path regression ✓.

## This commit — SYS-16 Layers: outline mode, duplicate, batch toggles, state indicators (AI-C)
- **Outline mode (F-07-02 E3 / F-20-01)**: `Layer.outline` + `Layer.outline_color` (serde-default, backward compatible; F-20-01 default `#ff0000`). New undoable commands `SetLayerOutline` / `SetLayerOutlineColor` + wasm facades. Layers panel shows an **outline swatch column** (double-click = inline color picker, E6). The STAGE renders outline-mode layers **strokes-only in the layer outline color** (F-20-01 view aid): `RectItem.outline_color` is threaded through `collect_items` and **propagates through symbol instances**; the export rasterizer + SVG export ignore it entirely, so outline layers export FULLY (F-20-01).
- **Duplicate layer (Part 20.1 / F-20-01 "deep copy frames+content")**: `DuplicateLayer` command + `duplicate_layer()` — fresh LayerId, every content node cloned under a NEW NodeId (`Node::with_id`), so the copy is fully independent; tweens + labels + flags copied; Animate-style naming (`arm` → `arm copy` → `arm copy 2`…); copy inserted above source and becomes active; one undo step; undo/redo exact. Header ⧉ button.
- **Alt+click "all others" batches (F-07-02 E1/E2/E3)**: Alt+click eye/lock/outline flips that flag on every OTHER layer as **ONE undo step** (`SetLayerFlags` batch command). M.3 rescue: when every layer is hidden, Alt+click the eye shows ALL.
- **State indicators (F-07-02 E4/E7)**: red ✕ on hidden layers (Layers panel + Timeline row), pencil ✎ on the active row, pencil-with-slash ⊘ when the active layer is locked/hidden.
- **Tests**: layers.rs 12→**27** (outline toggle/color/persist, view-only export proof, symbol propagation, batch flips + M.3, duplicate deep-copy independence, undo/redo, name uniquify, flag copy); UI +13 (LayersPanel outline/Alt+click/indicators/duplicate, Timeline hidden marker, canvasRenderer stroke-only + export-rasterizer-ignores-outline). Rust 20 suites green, clippy 0, fmt clean, wasm-pack build ✓; UI 606 tests, `npm run build` ✓.
- **Registered decisions**: Alt+click = TOGGLE others (evidence table + M.3) [INFERENCE]; M.3 rescue only fires when literally every layer is hidden [OUR DESIGN DECISION]; duplicate naming stem-strip (copy of copy keeps counting) [OUR DESIGN DECISION]; layer ops remain panel-owned (no command-registry entries), consistent with existing create/delete/rename/visibility/lock.

## This commit — Document / Stage / Viewport foundation
- **Root cause** (proven, not guessed): the viewport math was already correct; the defects were (a) **no visible Stage boundary** — the renderer filled the whole canvas with the background color (an "infinite white canvas"), and (b) **wrong default document size** — 800×600 instead of the canonical **1920×1080** (Part 33 §33.1 / engineering 03), which made fit-zoom land at ~62% on narrow layouts and produced large-looking document coordinates for ordinary drags.
- **Fixes**: renderer draws gray pasteboard → stage rect (doc background) → stage border (authoring-only); `Settings::default()` → 1920×1080; WASM loader calls `kineora_new_default()` (no size drift); view commands Ctrl+=/Ctrl+-/Ctrl+1/Ctrl+0; SVG export clips to the stage (`clipPath`) so pasteboard art is not exported.
- **Verified invariants** (new tests): zoom/pan never mutate doc coordinates; screen↔doc round-trips at 25%–800%; 1 screen-px = 1/zoom doc units; export = document stage bounds, independent of viewport; settings survive Save→Load; resizing the stage does not move content.

## This commit — UNIT H usability correction (Symbols + Library forensic fixes)
- **Empty-symbol instances are now visible/selectable.** `node_bounds`/`hit_test`/`hits_in_rect` fall back to a deterministic **24×24 doc-unit marker** at the instance origin when the symbol has no drawable content (Part 11 §11.0 — an instance is a placed reference and must stay selectable). The marker is selection-only: it NEVER enters `evaluate`/export (proven by test). `SelDetail` now reports the instance's real rendered bounds (or the marker) + `empty` flag, `symbol_id`, `loop_mode`, `first_frame`.
- **Locked-layer convert guard** [BLUEPRINT REQUIRED — Part 20.2 / F-03-15]: `convert_selection_to_symbol` now rejects the conversion when ANY selected node lives on a locked layer — no symbol, no partial mutation, no undo entry.
- **Instance playback controls** [Part 11 §11.4]: Properties now shows **Loop / Play Once / Single Frame** + **First frame** for a selected instance (wired to `kineora_set_instance_loop`, undoable, persisted). Movie-clip free clock and button frame-1 behavior unchanged (engine).
- **Swap affordance** [Part 11 §11.6]: Properties shows a **Swap to** dropdown listing Library symbols — swap keeps the instance transform, is undoable, and updates use-counts (drag-onto-instance swap still works).
- **Engine-state honesty**: `LibraryPanel` now distinguishes **engine unattached** / **engine build out of date** (`hasSymbolFacade()`) / **genuinely empty** — a stale WASM build can no longer masquerade as "No symbols yet". New Symbol reports a clear toast + highlights the created row.
- **WASM verified**: ran `npm run wasm`; the generated `kineora_core.js` exports all symbol facades (`kineora_library`, `kineora_convert_to_symbol`, `kineora_place_symbol`, `kineora_swap_instance`, `kineora_set_instance_loop`, …).
- **Deferred (unchanged)**: symbol edit-in-place/breadcrumb, standalone Break Apart, Duplicate Symbol, color-effect/filters, Frame Picker, button-state interactivity, Library folders/search/sort, Motion Tween.

## This commit — PANEL CORRECTION: bounded right dock + visibility registry (per manual FAIL 7/8/9)
- **Root cause (fixed)**: the right dock column had no bounded height and no overflow policy, and used `flex:1`+`minHeight:320` for Properties with absolute (not sum-aware) splitter clamps. When Properties+Library+Dev's minimum heights exceeded the region, the flex container overflowed → the Dev panel rendered below/outside the viewport ("disappeared behind Timeline").
- **Fix — bounded dock**: the right column is now an explicit **overflow:auto region** (`right-dock`, measured height via ResizeObserver). Panel heights come from the generic `distribute()` engine: **Properties is the flex pane** (fills the remainder, clamped to its 320 minimum), **Library/Debug keep preferred sizes**. If the stack's total exceeds the region, the region scrolls — no panel can ever render off-screen or behind the Timeline (C-36).
- **Fix — sum-aware splitters**: a vertical splitter resizes the pane BELOW it via `clampPanePref()`, whose upper bound = `region − (other panes' minimums)`. Dragging one splitter can never squeeze a sibling below its min or to zero (C-06 "min-clamp, never 0").
- **Visibility registry (C-02 §D)**: one `panels` map now covers Layers / Properties / Library / **Timeline** / **Dev** (default all visible). Timeline hide/show uses **Ctrl+Alt+T** (Part 29.9) and a toolbar toggle; its height is preserved across hide/show. Dev/Library/Properties toggles reflow the remaining dock. No per-panel one-off logic.
- **Properties constraints**: width min **240** (C-09), height min **320** (C-09) — both enforced by the pane spec, never by overflow.
- **Unchanged**: frame zoom independence, playhead/cell mapping, all Timeline ops, splitter Esc/pointercancel/lostpointercapture/blur cancel, workspace persistence (app prefs), Reset Workspace, zero engine changes (Rust 203).

## This commit — PANEL UNIT: reusable splitter + vertical panel resize (C-06/C-08/C-09, engineering 11)
- **One reusable splitter** (`ResizeHandle`): `orientation` horizontal/vertical, 6px hit area, live drag, min/max clamp by the caller, **Esc / pointercancel / lostpointercapture / blur** all cancel back to the drag origin (C-34), `preventDefault`+`stopPropagation` (no Stage/panel bleed). Every panel now shares it — no one-off resize code.
- **One panel-spec table** (`panelLayout.ts`) driving the whole workspace layout:
  - Layers width **140–480** [BLUEPRINT REQUIRED]
  - Properties width **240–520** [BLUEPRINT REQUIRED — C-09 "min 240×320"] + min-height **320** (the Properties panel flexes above it)
  - Timeline height **96px .. 60% viewport** [BLUEPRINT REQUIRED — C-08 §A]
  - Library height **96–480** · Debug height **120–480** [OUR DESIGN DECISION — blueprint gives no exact number; C-36 "never zero" floor]
- **Vertical splitters**: above the Timeline (drag up/down to grow/shrink, clamped to [96, 60% vh]); between Properties ⇄ Library and Library ⇄ Debug in the right column.
- **Timeline**: accepts a `height` prop; layer rows now scroll vertically (`overflowY: auto`) when the panel is shorter than the layer stack — **no invisible clipping**. Frame zoom (`cellW × ZOOM_LEVELS`), playhead/cell mapping, and document state are untouched by resizing (view-only).
- **Workspace persistence**: sizes persist to `localStorage` (`kineora.workspace.panelLayout`, app prefs — never the document); restored on remount; **Reset Workspace** (⟲ button in the header) restores blueprint defaults (C-06 §D).
- **Properties min-width fix**: 180 → **240** (C-09).
- **Deferred (classified)**: docking / floating / tabs / ghost preview, collapse chevrons (header-only), layer-name/frame divider + per-layer row height, mobile breakpoint system + C-36 suite, command palette.

### Manual acceptance matrix — PANEL CORRECTION (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | shrink the window height with all 3 right panels visible | Dev Panel stays reachable (region scrolls; never off-screen) |
| 2 | drag the Properties⇄Library splitter UP/DOWN | Library grows/shrinks; Properties resizes inversely |
| 3 | drag Library to its max | Properties never goes below 320px height |
| 4 | try to make Properties narrower than 240px | clamps at 240 |
| 5 | drag the Library⇄Debug splitter | Debug height changes, never 0 |
| 6 | drag splitters to extremes | no panel reaches 0, none pushed off-screen |
| 7 | Ctrl+Alt+T (or Timeline toolbar button) | Timeline hides; Stage gains the space |
| 8 | Ctrl+Alt+T again | Timeline returns at its previous height |
| 9 | toggle Dev off/on | Dev hides/reappears; others reflow, no overlap |
| 10 | toggle Properties/Library off/on | remaining panels reflow correctly |
| 11 | Esc mid-drag on any splitter | returns to the pre-drag size |
| 12 | resize/hide/show, then Ctrl+Z | no undo entries (view state) |
| 13 | resize/hide/show then scrub + zoom 50–400% | frame mapping exact, zoom unchanged |
| 14 | F6/F7/Shift+F6 + keyframe drag after layout changes | unaffected |
| 15 | reload the app | sizes + visibility restored |
| 16 | ⟲ Reset Workspace | all sizes/visibility to defaults |
| 17 | Save / Export after layout churn | document + export unchanged |

### Manual acceptance matrix — PANEL UNIT (previous, superseded — keep 1–6/10–14)
| 15 | click ⟲ Reset Workspace | all sizes return to defaults |

## This commit — UNIT H: Symbols + Library foundation (Part 11/12, engineering P4)
- **Data model**: `SymbolId` newtype; `Symbol { id, name, symbol_type: graphic|movieClip|button, registration, timeline: Vec<Layer> }`; `Document.library` (`#[serde(default)]` backward-compat); `Node::SymbolInstance { symbol_id, transform, loop_mode, first_frame }`. Node accessors handle both variants.
- **Convert to Symbol (F8)** — dialog (name, type, 9-point registration grid): wraps the selection, re-bases the wrapped nodes so the registration point is the symbol's local (0,0), replaces them with ONE instance whose x/y = the registration point's stage position. All 9 grid points verified. Exact undo (base transforms + frame content restored).
- **New Symbol (Ctrl+F8)** + **place** (drag library → stage) + **rename** (ID-safe) + **delete** (in-use prompts; break-apart flattens instances into raw rects via a full-document snapshot) + **swap** (drag onto a selected instance keeps its transform) + **set_instance_loop** (graphic Loop / Play Once / Single Frame + first_frame).
- **Nested evaluation (Part 11.8)**: `evaluate` now recurses into symbol instances — graphic syncs to the parent clock (loop = `(first-1+(f-1))%dur+1`, play-once = clamp, single-frame = static), movie clip runs a free clock (`(f-1)%dur+1`), button = frame 1. Instance transforms compose (rigid: rotations add, scales multiply — non-uniform-scale+rotation skew is a documented approximation). Depth cap 32 (engineering RSK-002). `hit_test`/`hits_in_rect` recurse with inverse-transformed probes and select the OUTERMOST instance.
- **Library panel** (Part 12): asset list (icon/name/type/use-count), create, double-click rename, delete-with-prompt, drag-out-to-place, drag-onto-instance-to-swap. **Properties** shows the symbol name/type for a selected instance.
- **Persistence + export**: symbols + instances round-trip serde; SVG export flattens nested content (no overlays); locked layers block placement and hit-testing but still render.
- **Bug fixed during this unit**: the Stage drop handler called `swapInstance` inside `notify?.(…)`, which short-circuits its argument when the toast is absent — swap silently never ran. Hoisted the engine call out.
- **Deferred (as scoped)**: symbol edit modes / edit-in-place / breadcrumb, Break-Apart as a standalone feature (only the delete-flow flatten is included), duplicate-symbol, instance color-effect + filters, Frame Picker, button-state interactivity, library folders/search/sort, registration-point editing after creation, Motion Tween.

### Manual acceptance matrix — UNIT H (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | draw two rects, select both → **F8** → name "arm", Graphic, center | they become ONE instance; Library shows "arm" (graphic ×1) |
| 2 | select/move/rotate the instance | transforms as one object (existing transform system) |
| 3 | Ctrl+Z / Ctrl+Shift+Z | restores the two rects exactly |
| 4 | Properties shows "Symbol: arm (graphic)" | no fill/stroke/W-H section |
| 5 | **Ctrl+F8** → empty symbol → drag it from the Library onto the stage | an (empty) instance is placed at the drop point |
| 6 | make a 2-frame symbol (F6 @2 + move), place it, scrub 1↔2 | graphic Loop syncs to the main timeline |
| 7 | rename the symbol (double-click in Library) | instances update (ID-safe); Ctrl+Z reverts |
| 8 | delete an unused symbol | gone; Ctrl+Z restores |
| 9 | delete an in-use symbol → prompt | Cancel = nothing; OK = instances break apart into raw content |
| 10 | drag a Library symbol onto a SELECTED instance | swaps (transform kept) |
| 11 | Save → Reload | symbols + instances intact; nested animation survives |
| 12 | Export SVG | nested content flattened, no library UI/selection |
| 13 | lock the layer → drag-drop place / click the instance | blocked / not selectable (still renders) |
| 14 | marquee + click on an instance | selects the INSTANCE, not its inner rect |

## This commit — UNIT G: frame sequences, exposure & labels (Part 07 §7.4.8–12 + §7.2 + §7.3)
- **Sequence move** (Part 07 §7.4.9 / F-07-12 E2): dragging a keyframe dot now moves the keyframe **together with its held span** (the next keyframe shifts by the same delta → exposure preserved). Collision → **overwrite prompt** (`window.confirm`); OK = overwrite, Cancel = nothing (one undoable command either way; blocked moves create no command). Alt-drag still duplicates a single keyframe.
- **Span-edge resize** (Part 07 §7.4.11 / F-15-05 exposure editing): a hollow-rect **end-of-span marker** (F-07-05 E2/E4) on the last held cell doubles as a drag handle — drag to extend/shorten the hold; the exposure is clamped to a **minimum of 1 frame**; zero-delta = no command; Esc cancels; the classic-tween end keyframe shifts with the span.
- **Duplicate frames** (Part 07 §7.4.8): duplicates the selected range immediately after, shifting later frames; undo/redo exact.
- **Convert to Keyframes / Blank Keyframes** (Part 07 §7.4.12): bake held frames into content keyframes **copying the hold's content AND transforms** (playback visually unchanged), or into blank keyframes; undo/redo exact.
- **Frame labels** (Part 07 §7.2 / Part 33.8 `label`): `Frame::Keyframe.label` (serde-default backward-compat), set/clear via the timeline label input (single selected content keyframe), **red flag** on the dot, persisted, undoable, and never affects evaluate/export.
- **Engine enforcement**: all mutations are undoable Rust commands with locked-layer guards; no-op/collision/min-exposure cases create no command. Status exposes per-marker `label`.
- **Deferred**: insert-shift (vs overwrite) on sequence-move collision (overwrite implemented per the prompt); Distribute-to-Layers; frame actions; span-based selection mode.

### Manual acceptance matrix — UNIT G (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | draw @1, F6 @10, move @10 → drag the **dot @1** to frame 5 | both keyframes move (→@5 and @14), exposure 9 kept |
| 2 | Ctrl+Z / Ctrl+Shift+Z | exact revert / re-apply |
| 3 | drag a span onto an occupied frame | overwrite prompt appears; OK overwrites, Cancel = nothing |
| 4 | drag the **hollow-rect edge** of the span right by 3 | hold extends; later keyframes shift right |
| 5 | drag the edge left by 3 | hold shortens; can't go below 1 frame |
| 6 | Undo/redo each resize | exact |
| 7 | select a 3-frame span → **⧉ Dup** | a copy appears right after; later frames shift; Undo removes it |
| 8 | select held frames → **▣ Keys** | every frame becomes a keyframe; playback identical |
| 9 | select frames → **□ Blanks** | hollow dots; content gone; Undo restores |
| 10 | select a single content keyframe → type a **label** + Enter | red flag appears; Undo clears; Save→Reload keeps it |
| 11 | Alt-drag a dot | still duplicates a single keyframe (unchanged) |
| 12 | lock the layer → sequence/edge/dup/convert/label | all blocked (buttons disabled + engine guard) |
| 13 | Export | correct content; **no flags/hollow-rects/selection in SVG** |
| 14 | classic tween 1..10 + span-edge drag | tween end follows the shifted keyframe |
| 15 | sequence/edge drag at 50%/200%/400% zoom | lands on the correct frame |
| 16 | release an edge drag without moving / Esc mid-drag | no command, no change |

## This commit — Ease audit (UNIT F follow-up, per manual "ease looks identical" report)
- **Audit verdict: the easing MATH was CORRECT.** Part 09.4.3 (range −100..+100; negative = ease-IN slow-start; positive = ease-OUT fast-start; 0 = linear; quadratic by default) is implemented exactly: at the normalized midpoint the three curves are **0.25 / 0.50 / 0.75** — for a 200px tween the mid-span positions are **50 / 100 / 150 px**. The user's "almost identical" came from two things: (1) the **start and end frames are IDENTICAL by design** (every curve is exact at its endpoints — the difference lives only in the intermediate frames), and (2) the ease slider committed only on a single fragile `mouseup`/`keyup` release event — if that event was missed, the ease never reached the engine, so all three literally stayed linear.
- **Fix (UI robustness)**: the ease slider now commits on **pointerup + mouseup + keyup + blur**, idempotently (one undoable command per gesture, proven by test), and the readout keeps the committed value instead of snapping back. Selecting a different tween clears any pending draft. The engine was NOT changed.
- **Regression tests added**: exact numeric proofs that −100/0/+100 differ at the midpoint and preserve endpoints; undo/redo restores the exact eased value (and un-creating the tween reverts to hold); ease survives save/load exactly; export uses the eased position; slider sign/range/quadratic-extreme checks; one-gesture-one-command and no-op-release UI tests.
- **Manual note**: to SEE the difference, scrub to the **middle** of the span — the ends are always identical by design. Use a long span + large movement (e.g. move 200px over 20 frames → mid positions 50/100/150).

## This commit — UNIT F: classic tween + easing foundation (Part 09.2 + Part 08 §8.0 + Part 09.4)
- **Model correction (blueprint-mandated)**: interpolation is now EXPLICIT. Per Part 08 §8.0 (whole-frame keyframes hold for frame-by-frame; tweening interpolates) + Part 07 §7.3 (hold rule), the engine no longer auto-interpolates between keyframes holding the same node — frame-by-frame now HOLDS, and only a **classic tween span** interpolates. This replaced the slice-1 "linear seed" (IMP-DEC-006) with the real tween model.
- **Engine**: `Layer.tweens` (sparse `start → {end, ease}` spans, `#[serde(default)]` for backward-compat). `node_states_at` rewritten: hold-by-default + classic-tween interpolation (x/y/scale lerp; rotation shortest-path). New `easing` module (`ease_classic` −100..+100 slider → quadratic in/out; `ease_penner` linear/quad/cubic/sine seed). Commands `SetClassicTween`/`RemoveClassicTween` (undoable). Session guards: two content keyframes holding the SAME object (Part 09.2.1); locked-layer blocked. Frame ops now keep tweens consistent (F5/Shift+F5 shift span frames with keyframes; delete/clear/F7/remove/move drop broken spans) with bit-exact undo. Status exposes per-layer `tweens`.
- **UI**: tween span visual (blue cells + ▶ end arrow, F-07-05 E3), **~ Tween** (create between the two selected keyframes) and **✕ Tween** (remove) buttons, and an **ease slider** (−100..+100) that commits ONE command on release (Part 09.4.3). Engine-validated (toast when the keyframes aren't the same object).
- **Breaking change documented**: three existing tests that asserted the old implicit interpolation now create a tween first (`slice.rs`, `transform.rs`, `properties.rs`) — this reflects the blueprint, not a test weakening.
- **Deferred**: motion tween (per-property spans — needs symbols, Part 11), shape tween (needs shapes, Part 06), custom ease graph, motion path, broken-tween dashed visual (we drop the span on endpoint removal).

### Manual acceptance matrix — UNIT F (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | draw a rect @1, F6 @10, move it @10 | frame 5 now HOLDS frame-1 (no auto-tween — dot-to-dot frame-by-frame) |
| 2 | select frames 1..10, click **~ Tween** | blue span + ▶ arrow between 1 and 10 |
| 3 | scrub to frame 5 | rect is halfway (interpolated) |
| 4 | Play | rect animates 0→100 over 1..10 |
| 5 | ease slider → +100 | rect leads early (ease-out); −100 lags (ease-in) |
| 6 | ease slider drag then release | ONE undo entry for the whole gesture |
| 7 | **✕ Tween** | span gone; frame 5 holds frame-1 again |
| 8 | Undo / Redo tween create/remove | exact |
| 9 | F5 at frame 5 (with tween 1..10) | span shifts to 1..11 (midpoint stays proportional) |
| 10 | Shift+F5 delete the END keyframe | tween drops (reverts to hold); Undo restores it |
| 11 | ~ Tween with two keyframes holding DIFFERENT objects | blocked + toast "must hold the same object" |
| 12 | lock the layer → ~ Tween / ✕ Tween / ease | all blocked (buttons disabled) |
| 13 | rotate 0°→350° with a tween | spins the SHORT way (−10°), not 350° |
| 14 | scale 1→2 with a tween | grows smoothly |
| 15 | Save → Reload | tween + ease survive |
| 16 | Export SVG at frame 5 | interpolated position; no tween arrows/selection in SVG |

## This commit — UNIT E: frame range selection + clipboard/sequence ops (Part 07 §7.4.6–10 + F-07-12/13)
- **Frame range selection** (engineering 07 "drag=range", F-03-08): click a cell = select that frame; **drag across cells = select a contiguous range** (single-layer, like Animate's per-row frame selection); Shift/Ctrl/Cmd+click = toggle. Selection is view state (no undo, no playhead move).
- **Copy / Cut / Paste frames** (F-07-12): the engine keeps a **frame clipboard** (Session state — NOT persisted, NOT undoable, like the OS clipboard). Copy = snapshot the keyframes in the range (read-only → allowed on locked layers); Cut = copy + remove (one command); Paste = insert at the playhead on the active layer, preserving relative offsets, collisions OVERWRITE (one command). The overwrite-vs-insert dialog is a later unit.
- **Remove frames** (Part 07 §7.4.6): delete the keyframes in the range **leaving a gap** (later keyframes stay put — distinct from Shift+F5's shift-left). One command.
- **Reverse frames** (Part 07 §7.4.10 / F-07-13 E1): reverse the keyframe record order in the range (content plays backwards); <2 keyframes = no-op. One command.
- **Guards**: every mutating op is blocked on a locked layer (engine-level, not just UI); copy stays allowed (read-only). Empty clipboard / empty range / single-keyframe reverse = no-op (no command). Undo/redo bit-exact via full-keyframe-map snapshots.
- **Deferred**: overwrite-vs-insert paste dialog, duplicate-frames, sequence/span drag-move, span-edge extend/shorten, convert-to-keyframes, distribute-to-layers, frame labels/actions.

### Manual acceptance matrix — UNIT E (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | click a frame cell | selects that single frame (no playhead move) |
| 2 | drag across several cells | selects the contiguous range (blue highlight) |
| 3 | Shift+click another cell | toggles it in/out of the selection |
| 4 | select 3 frames → **Copy** | no visible change (clipboard filled); toast "copy frames: done" |
| 5 | move playhead elsewhere → **Paste** | keyframes appear at the playhead, relative spacing kept |
| 6 | paste over existing keyframes | overwrites them; one Undo restores exactly |
| 7 | select a range → **Cut** | keyframes removed (gap remains); **Paste** puts them elsewhere |
| 8 | select a middle keyframe → **Remove** | that keyframe removed; later keyframes stay put (gap) |
| 9 | select a range with ≥2 keyframes → **Reverse** | content plays backwards (first↔last swap) |
| 10 | Reverse a single keyframe | no-op toast; no undo entry |
| 11 | Ctrl+Z / Ctrl+Shift+Z after each op | exact undo/redo, one step per op |
| 12 | lock the layer → Cut/Paste/Remove/Reverse | disabled + blocked; **Copy still works** |
| 13 | Copy on an empty area (no keyframes) | "copy frames: nothing to do"; Paste disabled (empty clipboard) |
| 14 | selection never moves the playhead / enters undo | — |
| 15 | Export after paste/reverse | correct per-frame content; no selection/timeline UI leaks |

## This commit — UNIT D: timeline navigation + zoom + transport (F-07-03/04, Part 07 §7.1.5, C-08)
- **Timeline zoom (ruler zoom)** — blueprint-required (F-07-03 "spacing adapts to ruler zoom", "ruler zoomed out → numbers sparse", engineering 07 "ruler-zoom not persisted" = view state). Implemented as discrete cell-width levels **50% / 100% / 200% / 400%** with adaptive ruler numbering (every 10 → 5 → 2 → 1 as you zoom in). Zoom is VIEW state: playhead/cells/dots/handle/indicator all remap exactly; the playhead frame never changes; selection and keyframe-drag target frames correctly at every zoom. Step size **[OUR DESIGN DECISION]** (blueprint gives no step; geometric ×2 matches Adobe's discrete frame-size presets **[ADOBE REFERENCE]**).
- **Transport** (F-07-04 controls + Part 15 §15.1 step 6): **`.`/`,`** step one frame; **Alt+`,` / Alt+`.`** keyframe-hop on the active layer; **first/last/center** buttons (C-08 `tl.first/last/center`). Home/End unchanged.
- **Loop toggle** (Part 07 §7.1.5 / C-08 `tl.loop`) — view state (no undo, not persisted): Play now honors it — loop ON wraps 1..duration; loop OFF stops at the last frame. Default **ON** **[OUR DESIGN DECISION]** (blueprint specifies the toggle but not its initial state).
- **No engine changes** — this unit is pure view state (playhead moves are engine view-state via `kineora_set_playhead`; zoom/loop/selection are UI-only). Document mutations are untouched.

### Manual acceptance matrix — UNIT D (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | click the timeline **− / +** zoom buttons | readout 100% → 200% → 400% → … → 50% (clamped) |
| 2 | zoom to 50% | more frames visible, smaller cells; ruler shows 1,10,20… |
| 3 | zoom to 200%/400% | bigger cells; ruler denser (every 2, then 1) |
| 4 | zoom in/out then scrub & click | playhead/cells still land on the right frame |
| 5 | zoom in then drag a keyframe dot | moves to the correct target frame |
| 6 | zoom does NOT move the playhead or create undo entries | — |
| 7 | press `.` / `,` | playhead steps ±1 (`,` clamps at 1) |
| 8 | press Alt+`.` / Alt+`,` | jumps to next/prev keyframe on the active layer |
| 9 | click ⏮ / ⏭ | jumps to first / last frame |
| 10 | click ◎ | the playhead scrolls into view (no document change) |
| 11 | click ⟳ Loop (off) then Play | playback stops at the last frame ("finished (loop off)") |
| 12 | Loop back on → Play | wraps 1..last continuously |
| 13 | Ctrl+Z during/after zoom/loop/step | NO undo entries (all view state) |
| 14 | export after zooming/looping | export unchanged by timeline zoom/loop |

## This commit — UNIT B: frame manipulation (Part 07 §7.4.1/4/9 + F-07-12 E1)
- **Engine**: four new undoable commands — `InsertFrames` (F5: shift later keyframes right → hold extends), `DeleteFrames` (Shift+F5: remove keyframe-at-frame + shift later left → timeline shortens), `MoveKeyframe` (drag: relocate a record verbatim; collision blocked), `DuplicateKeyframe` (Alt-drag: deep-copy at drop). All bit-exact via full-keyframe-map snapshots. Session guards make every no-op (nothing-to-shift, missing source, occupied target, `to<1`, zero delta, locked layer) create NO command. `move/duplicate_keyframe` take an explicit layer index so any visible row's keyframe can be dragged.
- **UI**: F5 / Shift+F5 keyboard + "＋ Frame" / "− Frame" buttons (honest toasts for no-op/locked). Keyframe dots are **draggable**: drag = move (one command on release), Alt-drag = duplicate, plain click (< 3px) = select the cell, Esc cancels, zero-delta = no command (Part 07 §7.4.9 / F-07-12 E1/E2). Locked rows don't arm the drag (engine also blocks).
- **Semantics** (F-07-07 hold rule): F5 extends the hold covering the playhead (last keyframe holds to infinity → F5 at/after it is a no-op); Shift+F5 shortens/deletes; moving a keyframe does NOT shift neighbors (unlike F5/Shift+F5).
- **Deferred**: Remove Frames (gap), copy/cut/paste/reverse frames, convert-to-keyframes, span-edge drag, sequence-move (dragging a keyframe + its hold), multi-layer F5, overwrite-prompt on collision (currently blocked with a toast).

### Manual acceptance matrix — UNIT B (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | draw @1, F6 @10, playhead @5, press F5 | keyframe shifts 10→11; hold lasts one frame longer |
| 2 | Undo / Redo | exact (keyframe back at 10, then at 11) |
| 3 | playhead @5, Shift+F5 | keyframe shifts 11→10 (hold shortens) |
| 4 | playhead @10, Shift+F5 | keyframe @10 deleted; later keys shift left |
| 5 | Shift+F5 on the only keyframe | layer empties; Undo restores |
| 6 | F5 past the last keyframe | no-op + "nothing after the playhead" toast (no undo entry) |
| 7 | drag a keyframe dot to another empty cell | dot moves there; ONE undo entry |
| 8 | Alt-drag a keyframe dot | duplicate appears at drop; source stays |
| 9 | drag a dot onto an occupied frame | blocked + "target occupied" toast; no undo entry |
| 10 | drag a dot then Esc | nothing moves |
| 11 | drag a dot then release on its own frame | no command |
| 12 | lock the layer, drag a dot / F5 / Shift+F5 | all blocked (button + toast); no undo entry |
| 13 | drag a dot on a NON-active layer row | that layer's keyframe moves |
| 14 | Export at frame before/after a move | correct per-frame content; no timeline UI leaks |

## This commit — Timeline duration/viewport + locked-layer honesty (per manual FAIL report #2)
- **"Stops at 60" — root cause (proven)**: `MIN_CELLS = 60` was my hardcoded *minimum viewport* and was ALSO used as the navigation clamp in `frameFromClientX` — so it accidentally became an upper bound. It is NOT derived duration, NOT playback duration, NOT a blueprint maximum. **Fix**: the timeline is now a horizontally scrollable, auto-extending strip — navigation (ruler click/drag, playhead handle) can reach ANY frame ≥ 1 and extends the viewport on demand (scroll-aware via `scrollLeft`), so users can author frames beyond the current derived duration. The 60 is now only the *initial window* (a view convenience, not a limit). Playback still loops within `[1, duration]` (derived, Part 07 §7.0 / REQ-TIM-004).
- **Locked-layer undo/redo — verdict (blueprint-verified, NOT a bug)**: Part 20.2 "locked = not editable" blocks NEW commands + selection. But **undo/redo remain GLOBAL** (engineering 05: history reverses already-created commands; F-03-15 TS-12: the lock toggle itself is an undoable command). Fix implemented: frame-op buttons are now **disabled + a "🔒 layer locked" hint** when the active layer is locked (honest state), so the blocked state is visible rather than a toast-after-click. Added Rust tests proving: new frame ops blocked on locked (no command); undo/redo still reverse draw/move/lock globally; lock toggle undoable.
- **[NOT IN BLUEPRINT]** fixed/custom document duration, playback start/end range, start/end markers — duration is DERIVED (Part 07 §7.0 "computed", Part 33.2, eng 03). Not implemented. Loop-toggle BUTTON (Part 07 §7.1.5) deferred.
- **[OUR DESIGN DECISION, grounded in §7.0 + F-07-08 "last frame → extends doc"]**: navigation is unbounded (auto-extending viewport) while playback clamps to duration — the KB "click past duration clamps" (F-07-03 M.1) describes a fixed-span document; our derived-duration model has no fixed span, so the equivalent clamp is playback-only.

### Manual acceptance matrix — UNIT C (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | scrub the ruler far right (well past 60) | the timeline grows; you can reach frame 100+ and F6 there |
| 2 | draw a rect, then F6 at frame 120 | keyframe dot at 120; duration extends; Play loops 1..120 |
| 3 | End | playhead jumps to the last keyframe frame (no 60 cap) |
| 4 | click a cell | selects (no playhead move) — unchanged from UNIT A |
| 5 | ruler click / handle drag | jump / scrub — unchanged |
| 6 | lock the active layer | Key/Blank/Clear buttons go disabled + "🔒 layer locked" hint |
| 7 | unlock → buttons re-enable | — |
| 8 | lock, then Ctrl+Z | undoes the LOCK (lock is a command, F-03-15 TS-12) — by design |
| 9 | draw → move → lock; then Ctrl+Z ×3 | reverses lock, move, draw (global history — by design, NOT blocked) |
| 10 | lock, press F6 (keyboard) | blocked with "locked layer" toast, no undo entry |
| 11 | Play | loops within 1..duration, never past the animation |

## This commit — Timeline interaction correctness (UNIT A rework, per manual FAIL report)
Root causes (proven from code + knowledge base):
1. **Ctrl+Z / Ctrl+Shift+Z had NO keyboard binding** (only toolbar tooltips) → undo/redo appeared broken. Fix: global shortcuts (Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo), skipped while typing in inputs (Part 29.2).
2. **Every grid mousedown scrubbed the playhead** → selecting a cell was impossible. Fix: hit-area separation — ruler click=jump / ruler drag=scrub / playhead-handle drag=scrub / **cell click = select only (playhead does NOT move)** (blueprint §7.1.4 "click selects the frame(s)"; the KB flags the click-jump-vs-select coupling as a quirk, F-07-03 L.2).
3. **No frame/keyframe selection** → added: click = select single frame; Shift/Ctrl/Cmd+click = toggle (engineering 07 "frame-based default"; contiguous drag-range selection deferred to UNIT B).
4. **F6 felt broken** → F6 on an existing CONTENT keyframe is now a no-op with an honest toast (F-07-08 M.1/TS-06); F6 on a BLANK keyframe now copies the pre-blank content (F-07-08 M.2, "F7 then F6 → pre-blank key"); F6 toast says "keyframe copied @ N" (F-07-08 L.2 wording).
5. **Locked-layer frame ops were inconsistent** (F6 allowed, F7/Shift+F6 blocked) → now ALL THREE frame ops are blocked on locked layers with a clear toast (blueprint Part 20.2 "locked = not editable" + KB F-03-15 "Editable: no"). Lock protects content; frame ops are layer edits.
6. **Playhead flew past the animation range** → Play now loops 1..derived duration (Part 07 §7.0, engineering REQ-TIM-004 "seek clamps to [1,duration]") instead of a hardcoded 240.

Deferred (documented, not in this unit): F5/Shift+F5 frame insert/delete, keyframe drag/move/resize (Part 07 §7.4.9/7.4.11 → UNIT B), frame span/range selection, loop-toggle button (Part 07 §7.1.5), onion skin (Part 15), tweening (Part 09 — NOT touched).

### Manual acceptance matrix — UNIT A (test on your PC)
| # | Action | Expect |
|---|---|---|
| 1 | draw a rect | solid dot at frame 1 |
| 2 | click a frame CELL (not ruler) | that cell highlights blue; playhead does NOT move |
| 3 | click a keyframe cell | keyframe selects (no playhead move) |
| 4 | Shift+click another cell | both cells selected; Shift+click again removes |
| 5 | click the RULER at frame 7 | playhead jumps to 7 (red indicator on the number) |
| 6 | drag on the RULER | playhead scrubs continuously |
| 7 | drag the playhead HANDLE | playhead scrubs |
| 8 | click frame 10 (ruler) then F6 | solid dot appears at 10; toast "keyframe copied @ 10" |
| 9 | press F6 again at frame 10 | NO new dot; toast "frame 10 is already a keyframe"; no extra undo entry |
| 10 | F7 at frame 15 | hollow dot; stage empty from 15 |
| 11 | F6 again at frame 15 (the blank) | dot becomes solid; content restored from BEFORE the blank |
| 12 | Shift+F6 at frame 15 | hollow/solid dot gone; hold reverts |
| 13 | Ctrl+Z / Ctrl+Shift+Z | each frame op undoes/redoes exactly, one step each |
| 14 | lock the layer, press F6/F7/Shift+F6 | all three blocked with "locked layer — unlock to edit frames" toast; no undo entry |
| 15 | Play | loops 1..last keyframe, never past the animation range |
| 16 | Home / End | jump to frame 1 / last keyframe frame |
| 17 | export at frame 5 vs 10 | correct per-frame content; no timeline UI/selection leaks |

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
1. **Motion tween** (Part 09.1) — span + per-property keys + full Penner easing + motion presets; the symbol model now exists so this is unblocked (Release 1 step 6 completion).
2. Symbol edit modes (edit-in-place / breadcrumb / back) + Break-Apart + Duplicate-Symbol (Part 11.3/11.6/11.7).
3. Drawing tools (oval/line) + shape merge model (Part 05/06) — prerequisite for shape tween (Part 09.3).
4. Object-level lock/hide + draggable pivot + tool-options schema + shortcut wiring.
5. Onion skin (Part 15) · camera/audio (Part 16/17) — Release 2.
6. Export extensions (sequence / animated GIF / video — native encoder jobs, IMP-DEC-005) + progress/cancel + publish profiles.

## UI Foundation + Menu/Command Architecture (unit after UNIT H)
- **Command registry** (`src/commands.ts`) — single source of truth: every visible action (menu/toolbar/shortcut/palette) resolves one id → one run. ~130 commands, each classified FUNCTIONAL / DEFERRED / UNAVAILABLE with a blueprint+Adobe source and a human reason (zero silent grey boxes).
- **Shortcut registry** (`src/shortcuts.ts`) — one normalizer + one lookup + conflict validation; a scoped `useShortcutScope` hook means App/Stage/TimelineStrip listen for DISJOINT scopes (no double-fire); disabled commands report WHY instead of failing silently. Ctrl+Y aliases Redo.
- **Menu bar** (`menus.ts` + `components/MenuBar.tsx`) — the 11 professional menus (File/Edit/View/Insert/Modify/Text/Commands/Control/Debug/Window/Help) with flyout submenus, separators, checkmarks, disabled+reason tooltips, Esc/outside-click close.
- **Command palette** (`components/CommandPalette.tsx`) — Ctrl+K fuzzy search over the whole registry (C-04).
- **Dialogs** — Document Settings (Ctrl+J, `DocumentSettingsDialog`), Keyboard Shortcuts viewer (Ctrl+Shift+Alt+K), About (`AboutDialog`).
- **Wiring** — Window menu drives the existing panel-visibility registry (incl. new Tools toggle); Control menu drives the existing playback state via a timeline view controller; View zoom drives the stage view controller; File New/Open/Save/Export are real engine round-trips; Edit Select All/Deselect use `kineora_select_all`/`kineora_clear_selection` (already in the core).
- **Header** — brand + version (v0.2), no more "vertical slice"; Reset Workspace kept (Window ▸ Reset Workspace + header button).
- **Dead button removed** — `nav.back` ("back: next unit") removed; it was a placeholder.
- **Engine unchanged** — no Rust files touched; facade exports verified (incl. select_all / clear_selection / new_default / set_document_settings).
- Tests: UI 322/322 · Rust 214/214 · fmt ✓ · clippy 0 · wasm ✓.

## SYS-01 Application/Workspace (forensic spec v5) — implemented (partial → see gaps)
- **MOD-BUS** (`bus.ts` + `useBus.ts`): typed event bus (tool/panel/workspace/playback/saving/…) with failure isolation (§27.0); wired for tool:changed, panel:changed, workspace:changed, playback:started/stopped, saving:changed. Engine-state events re-read the model per §27.0 "stale" rule.
- **Panel chrome** (`PanelHeader.tsx`): close × (hide) + collapse/expand chevron on Layers/Properties/Library/Dev; visibility + collapse + layout persisted to `kineora.workspace` (single prefs boundary, `workspace.ts`); reopen via Window menu + palette; corrupt prefs → auto-reset + toast.
- **Workspace save/switch/reset**: named workspaces (Save Current / New Workspace… / Reset / named list) via Window ▸ Workspaces (dynamic list) + header workspace switcher; `workspace.save/load/reset` command ids (§30 single-commandId mapping); duplicate name → overwrite (recreate covers M-1); Reset = PREFS (clear).
- **Status bar 12 cells** (C-05): tool/selection/layer/frame(clickable→Go-to-frame dialog)/scene/symbol/rec/play/save/export/mode/snap, honest "—"/off for cells whose owning systems are future.
- **Edit bar / breadcrumb** (`EditBar.tsx`): scene breadcrumb at root; nav.back → edit.exitOneLevel / nav.root → edit.exitRoot commands (CONTEXTUAL, hidden at depth 0) — nav.back dead-stub fixed the spec way (§6.6), not deleted.
- **Toolbar overflow**: "⋮ More tools" (measured; pure `computeVisibleCount` unit-tested).
- **Theme tokens**: CSS variables defined (`:root`); dark theme applied.
- **Go-to-frame dialog** (st.activeFrame click; real kineora_set_playhead).
- **Engine unchanged** (0 core files). UI tests 355/355.
- Remaining SYS-01 gaps (honest): panel dock/float/tab-stack (dedicated docking-engine unit) · multi-document tabs (needs SYS-28 multi-doc persistence) · scene tabs (SYS-06) · light theme (needs token adoption across systems) · mobile bottom-sheets (breakpoints partial).

## SYS-02 File (forensic spec, QA PASS) — implemented
- **Engine (multi-document + STM-DIRTY):** DocManager in wasm.rs (per-doc Session = per-doc undo/selection/playhead/library); facades kineora_new_full/open_json/load_json(2-arg)/doc_count/doc_list/active_doc_id/set_active_doc/close_doc/set_doc_title/mark_clean; status carries doc_id/doc_title/dirty/doc_count/docs/units/platform. History tracks `dirty` (execute/undo/redo set; save/load/new clear) — single chokepoint, no per-command bookkeeping. Settings gained `units`+`platform` (serde-default, backward compatible).
- **UI:** New dialog (platform/W/H/fps/bg/units + validation W/H≥2, fps 1–120, Enter/Esc) · New-from-Template gallery + Save-as-Template (preset-JSON, localStorage store = P-7) · Open (picker → validate → replace-active + recent) · Open Recent (unbounded most-recent-first, snapshot-backed, stale→toast) · Close/Close All (canonical DIRTY-only guard: Save/Discard/Cancel) · Save (untitled→prompt; overwrite P-1; no undo clear) · Save As (showSaveFilePicker→prompt+download) · Exit (dirty guard → honest exit screen; OS kill = Tauri gap) · document tabs (activate/×/dirty ●/context-Close only) · header title + dirty dot · no-doc empty state. Handoffs (import/export-video-gif-movie-sequence/publish*/openExternalLibrary) reach the SYS-27/SYS-18 boundary and report the integration gap honestly; export-image opens the working dialog. AIR/Print/Page-Setup = HIDDEN (no dead UI).
- Tests: Rust 221 (7 new lifecycle/dirty/from_document/settings-compat) · UI 394 (SYS-02 suites). fmt ✓ clippy 0 ✓ wasm32 ✓ facade exports verified.
- Remaining SYS-02 dependency gaps (owned elsewhere): SYS-28 atomic write/autosave/recovery/formatVersion · SYS-27 import/export/publish engines · SYS-18 external library · Tauri native file dialogs + OS termination.

## Native Desktop Runtime / Cross-Platform Shell (Tauri v2) — implemented
- **Technology: Tauri v2** (already scaffolded → finished). Rust shell hosts the SAME React+WASM app; webview has no browser chrome → Ctrl+N/O/S/W/Q/F5… reach the existing command registry (no second shortcut system). Browser dev mode retained (same app code).
- **Rust shell** (`animator/desktop/src-tauri`): `main.rs` (OS close → prevent_close → emit close-requested → JS SYS-02 guard → approve_close → real close; startup errors eprintln+exit(1)) · `commands.rs` (native open/save-as/write-atomic/read/file_exists + shell_status + identity) · `window_state.rs` (size/pos/maximized → app config dir, workspace prefs not document) · `auth.rs` (`IdentityProvider` trait + DEVELOPMENT-ONLY local identity; real auth replaces this module later) · `capabilities/default.json` + `withGlobalTauri`.
- **PlatformAdapter** (`ui/src/platform.ts`): the editor's ONLY desktop boundary — openProject/saveProjectAs/writeProject/readProject/shellStatus/identity/approveClose/onCloseRequested/exit; browser impl keeps download/prompt fallbacks. `file.ts` (SYS-02) routes open/save/save-as through it: desktop titled Save overwrites the known path (P-1), untitled → native Save As; paths are session state.
- **Close lifecycle**: desktop OS close → SYS-02 guard (Save/Discard/Cancel) over ALL dirty docs; browser mode gets a `beforeunload` guard. File ▸ Exit = same guard → desktop closes the window, browser shows the exit screen.
- **Window/identity/loading/errors**: window state persisted (app prefs); native app icon set generated (`icons/`, original glyph, `npm run icon`); honest loading via the app's own engine-status states (no fake progress); shell diagnostics + DEV identity surfaced in the Dev panel (desktop only).
- **Modes/commands**: `bash scripts/dev-desktop.sh` (wasm + npm ci + `tauri dev` — no installer per iteration) · `bash scripts/build-desktop.sh` (`tauri build` → deb/rpm/AppImage). Browser mode unchanged (`npm run dev`).
- **Validation in-sandbox**: installed webkit2gtk-4.1 → `cargo check` ✓, `cargo fmt` ✓, `cargo clippy` 0 ✓, and a FULL `tauri build --no-bundle` release build linked successfully (WASM → UI → shell → ELF binary). Rust 221 tests ✓ · UI 405 tests ✓ · `npm run build` ✓.
- **Not verifiable here** (needs a display): actually running the window (`tauri dev`) — the user's Linux Mint PC is authoritative for manual desktop testing.
- Cross-platform: same shell for Win/macOS; Android/tablet = future Tauri mobile host (icon set ready). macOS native menu + accelerators = documented future step.

## SYS-02 H01 — New Document + Dialog + Templates (per H00 constitution)
- **H00 constitutional fixes:** (1) P0 right-click≠close — `DocumentTabs` contextmenu was invoking `file.close`; now right-click only suppresses the native menu (INV-DSTR-1/2, INV-013); the H03 menu comes later. (2) INV-CMD-2 — the New/Template dialogs were calling engine mutators directly; now Create/select/save re-invoke the canonical `file.new` / `file.newFromTemplate` / `file.saveAsTemplate` commands (single commandId, input-branched). (3) INV-VIS-2 — H01 dialogs refactored onto SYS-01 design tokens (`var(--kineora-*)`), `colorScheme:dark`, plus a global `:focus-visible` ring (INV-VIS-4); no hard-coded dialog colors.
- **Engine:** `DocManager` extracted from the wasm facade into `core/src/doc_manager.rs` (natively testable): unique monotonic Document IDs, exactly-one-active, New→CLEAN empty-history, per-doc state independence, close-never-mutates-others, replace_active preserves identity + resets session, untitled counter. 9 new tests (core 230 total).
- **Event:** App subscribes `activeDoc:changed` → immediate document-bound rebind (H00 §12), on top of the 120ms poll.
- **UI:** New dialog (defaults 1920×1080/px/24/#fff/HTML5 Canvas; W/H≥2 no max, fps 1–120, Enter/Esc/Tab, Create disabled on invalid, cancel/esc create nothing) · Template gallery + Save-as-Template (preset-JSON; seed = fresh engine parse → independent document, never the source instance).
- Tests: core 230/230 · UI 419/419 · fmt ✓ clippy 0 ✓ wasm32 ✓ · full `tauri build --no-bundle` ✓ (desktop shell links the refactor).

## SYS-02 H00 — constitutional compliance audit + fixes
- **H00 §7 dirty semantics (P0 fixed):** `History` now stores the last-saved SNAPSHOT and computes `is_dirty = (content != snapshot)` — undo/redo back to the exact saved state is CLEAN (was: a plain bool set on every undo/redo). `next_id` allocator deliberately excluded from the comparison (IDs are never reused). +4 native tests (core 230→234).
- **H00 §12 tab switch (INV-MD-8 fixed):** `DocumentTabs` now switches via canonical `switchActiveDocument()` in file.ts — engine switch + `activeDoc:changed` emission → immediate document-bound UI rebind (was: direct `setActiveDoc` with no event). +1 UI test (UI 419→420).
- **H00 §17 INV-VIS-2:** CloseConfirmationDialog (destructive guard) converted to design tokens; `:focus-visible` ring global (INV-VIS-4).
- Verified PASS (no change needed): INV-008 (markClean only after successful write) · INV-009 (save keeps undo history) · INV-011 (session-level Document ID; Save As keeps it) · INV-012 (workspace never in project JSON) · INV-013 (right-click = no-op) · INV-014/015 (registry lint + single commandId) · INV-016 (failed ops leave no partial state) · INV-010 (every failure surfaces) · engine multi-doc invariants (doc_manager.rs).
- Classified remaining: AMB-001/AMB-002 (persisted-ID adoption + same-path) = DEPENDENCY → H02/H05/H10; full token adoption of content panels = H11; no-doc File-menu exact presentation = H07; tab drag/context-menu = H02/H03.
- Gates: core 234/234 · UI 420/420 · fmt ✓ clippy 0 ✓ wasm32 ✓ · full `tauri build --no-bundle` ✓.

## SYS-02 H01 MANUAL FAIL #1 — tabs don't switch (WASM u64/BigInt bridge) — FIXED
- **Symptom (user-reported, native desktop):** clicking another document's tab did nothing — switching impossible. (Tab × close and symbol-id ops were the same latent class.)
- **Root cause:** wasm-bindgen crosses every Rust `u64` as a JS `bigint`. The UI passed plain numbers to u64 params (`kineora_set_active_doc(id)` etc.) → TypeError thrown AT THE WIRE, swallowed by the React click handler — and u64 returns (`kineora_active_doc_id`, `kineora_new_full`, …) arrived as bigint, silently breaking `===` against JSON-parsed plain-number ids. Mocked UI tests could not see it (continuity lesson #9).
- **Fix (UI-side only, zero engine change):** `client.ts` now converts EXACTLY at the boundary — `asU64()` (number → bigint) for every u64 param, `asNum()` (bigint → number) for every u64 return; the rest of the UI keeps plain numbers (ids ≤ 2^53). 14 wrappers patched (doc switch/close/title/new/open, symbol place/rename/delete/swap/loop, convert/new-symbol, drawRect, activeDocId). `wasmTypes.ts` `KineoraWasm` re-typed at the honest wire level (bigint) for all u64 members so tsc guards it statically.
- **Regression guard:** new `engine/client.u64.test.ts` (4 tests) attaches a WIRE-FAITHFUL fake module (non-bigint u64 param ⇒ TypeError; u64 returns as bigint) — a repeat of this bug now fails the suite instead of reaching the user's desktop.
- **Gates:** NOT run in the AI sandbox (user constraint: no local runs — node_modules absent). Run `bash scripts/test.sh` on the dev PC, then `bash scripts/dev-desktop.sh` and re-test tab switch/close in the H01 matrix. Core Rust untouched (no native test impact expected; client facade signatures unchanged → existing UI mocks/types unaffected).

## SYS-02 H01 v2 — spec alignment (formal H01 spec landed; implementation upgraded)
Formal spec `H01_NEW_DOCUMENT_TEMPLATES.md` (v2) audited against the build; gaps fixed:
- **Initial focus** now = platform field (was width) · **Enter = Create** via single-path form submit (implicit-submission-safe, no double-create) · **focus trap** on all three H01 dialogs (`useFocusTrap`) · numeric fields **announce range** (min-2 / 1–120 / 0–1 hints + aria-invalid + role=alert) · outside-click = Cancel (was already; now test-locked).
- **fps rule (v2 reconciled):** empty = invalid (Create disabled) · typed out-of-range **clamps on commit** (999→120, 0→1) — enforced in the dialog AND in `createDocument` (command layer, palette-safe).
- **backgroundAlpha (Part 33 §33.1):** engine `Settings.background_alpha` (serde `backgroundAlpha`, default 1) + New-dialog field + command-layer clamp + **stage preview applies it** (globalAlpha) + **SVG export emits fill-opacity** (only when α<1 — opaque stage stays byte-identical). `background` key renamed to `backgroundColor` with `alias=background` (legacy files/templates keep parsing).
- **meta (Part 33 §33.1 ownership):** engine `Document.meta{title,author,createdAt,modifiedAt}` (serde-default for legacy) — New / New-from-Template stamp `createdAt` (epoch-seconds from UI; wasm has no clock) via `push_new_with_meta` / seed meta-rewrite; `modifiedAt` = H05, `title`/`author` = SYS-06/SYS-17 (cleared on seed). Meta now part of the dirty content-compare.
- **Template gallery rebuilt (§5.3):** selection-only rows with `platform · W×H · fps` preview → `tpl-new.open` disabled-until-selected WITH visible reason → `tpl-new.cancel`; Esc/outside-click close; IDs moved to `tpl-new.*`.
- **Save-as-Template (§5.4):** duplicate name = inline warning + explicit **Replace** button (AMB-H01-002 PROVISIONAL = guarded overwrite). IDs moved to `dlg-save-template.*`.
- **AMB-H01-003 (PROVISIONAL = UNTITLED):** template seeds get engine-assigned `Untitled-N` via `push_seed` (empty title = seed path in `kineora_open_json`). ⚠ BOTH PROVISIONAL decisions await the user's call — flagged, never silent.
- Native tests +6 (document: α default/clamp/legacy·rename serde/meta roundtrip/export fill-opacity · doc_manager: meta stamp/untitled seeds/CLEAN). UI tests: NewDocumentDialog rewritten (+initial-focus/+clamp/+alpha/+range-hints), h01 seed/payload assertions updated, NEW TemplateGalleryDialog + SaveTemplateDialog suites (12 tests).
- **Gates: NOT run in sandbox (user constraint).** Dev PC: `bash scripts/test.sh` then the H01 manual matrix.

## SYS-02 H02 — Multi-Document + Tabs + Active Document (H02-RELEASE spec)
- **P0 fix (audit failure #8):** the per-tab × now targets the CLICKED document's stable id (`tab.close(docId)`), never the active-by-inference. App's `confirmClose` accepts a doc-id scope, so a DIRTY INACTIVE document also gets the canonical Save/Discard/Cancel guard (proven by an App-level test: A clean active + B dirty inactive → × on B opens the dialog; previously the guard keyed off the active doc).
- **`openSet:changed` (D-AMB-004, approved):** locked event `{ change: 'added'|'removed'|'reordered', docId? }` added to the bus contract. Semantic separation enforced: `activeDoc:changed` = active pointer ONLY; `openSet:changed` = open-set ONLY. When both change, `openSet:changed` is emitted FIRST, then `activeDoc:changed` (H02 §14). Close-inactive and reorder emit `openSet:changed` alone (ST5/ST7); close-active emits both (ST4); close-last emits `openSet:changed{removed}` → `activeDoc:changed{0}` (ST6); New/Open/New-from-Template emit added → active (ST1/ST2).
- **Open = ADD (ST2):** `file.open` / `openRecent` now load via `kineora_open_json` (new tab) — the previously-open document is never replaced. `kineora_load_json`/`replace_active` remain in the core for future H06/H05 use.
- **Duplicate-open (D-AMB-001, approved):** the SYS-02 session path map (`docPaths`) is consulted on Open: an already-open saved path → activate the existing document (ST2b: `activeDoc:changed` only), NO second document, NO second tab, NO disk reload; session/dirty/selection/playhead/History preserved. Browser (pathless) is honestly out of scope of the path rule.
- **Reorder (app.tab.reorder):** engine `DocManager::reorder(id, to_index)` + `kineora_reorder` facade — moves the doc within the open-set, the ACTIVE DOCUMENT is never changed (index mechanics natively tested both directions). UI: HTML5 drag on tabs → `reorderDocument()` (view/session — no command by design, H02 §12) → `openSet:changed{reordered}` only; no dirty, no undo.
- **Commands:** canonical `tab.activate(docId)` + `tab.close(docId)` added to the registry (INV-CMD; exactly two `tab.*` ids, no aliases). The strip's click / Enter / Space / × all resolve to them.
- **Accessibility (H02 §19, D-AMB-003):** `role="tablist"` container, `role="tab"` + `aria-selected` + `tabIndex=0` per tab, Enter/Space activate, **the activated tab receives focus after activation**, dirty ● inside an always-present `aria-live="polite"` region, tab naming = title + " — unsaved" via aria-label, colors on SYS-01 design tokens (no hard-coded hex in the strip).
- **Switch failure (edge 26):** activating an unavailable document → honest toast ("switch failed: document N is not available"), stays on the current document, no event, no corruption.
- **Strip = pure view (H02 §8):** `DocumentTabs` reads `docList()` + `activeDocId()` from the engine (single source of truth) and self-updates on BOTH events — `openSet:changed` re-renders the STRIP ONLY (document-bound panels do not rebind on it); `activeDoc:changed` rebinds panels via the existing App tick.
- **Pre-existing breakage found by actually running the gates (97efc32/1f9224c shipped without sandbox gates) — fixed:** 3 unterminated raw strings in tests/document.rs (`"#` in color hex terminated `r#"…`), 2 `SettingsPatch` initializers missing `background_alpha`, `next_untitled()` collision-aware (a doc titled "Untitled-1" no longer causes a seed to take the same title — pre-existing push_seed test now passes), tsc: `newDefaultDocument()` missing the `created_at` wire arg + one cast in client.u64.test.ts, file.test.ts updated to the H01-v2/H02 contracts.
- **Tests:** Rust +25 native (h02_* in doc_manager.rs: reorder order/active-follows/active-kept-both-directions/unknown-id/view-state-no-dirty-no-undo, close-active-successor, close-inactive-keeps-active, dup-id, per-doc playhead/selection/undo isolation; plus the pre-existing fixes). UI: NEW `h02.test.tsx` (32 tests, stateful wire-faithful fake engine — the full T-tab-* matrix incl. the mandatory P0 scenario "A active, B inactive → click B's × → B closes, A remains active", ST1–ST8 event-ordering assertions, duplicate-open, reorder, focus, dup-title, switch-fail, idempotency). file.test.ts / h01.test.tsx / sys02.test.tsx updated for the new contract.
- **Gates RUN in sandbox (first full gate run since H01-v2):** `cargo fmt` ✓ · `cargo clippy --all-targets` 0 ✓ · `cargo test` **255/255** ✓ · `tsc --noEmit` ✓ · `vitest run` **475/475 (35 files)** ✓ · `npm run build` (tsc+vite) ✓ · `cargo build --target wasm32-unknown-unknown --release` ✓. NOT run here: `wasm-pack` glue build (binary unavailable in this sandbox) + full `tauri build` (no webkit2gtk) — dev PC: `bash scripts/test.sh` then the matrix below.
- **Manual acceptance: PENDING** (user's Linux desktop — matrix below).

### Manual acceptance matrix — H02 (test on your Linux desktop, report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | create A | tab A active |
| 2 | create B | tab B active, A still open |
| 3 | activate A / B / A | panels rebind instantly each switch |
| 4 | modify A (draw a rect) | A's tab shows ● |
| 5 | switch to B | A's ● stays on A; B clean |
| 6 | verify A dirty preserved | switch back to A — rect + ● intact |
| 7 | click B's × while A active | B closes (dirty guard if B dirty) |
| 8 | verify A remains active | A untouched, still active |
| 9 | reorder tabs (drag) | strip reorders; active doc unchanged |
| 10 | verify active unchanged | panels still show the same doc |
| 11 | open a new file while another doc is open | old doc remains as a tab (Open ADDS) |
| 12 | verify old doc intact | old doc's content/dirty preserved |
| 13 | open the SAME file again | no duplicate tab |
| 14 | verify no duplicate | exactly one tab for that file; it gets activated |
| 15 | activate a tab via keyboard (Tab to focus, Enter) | doc activates |
| 16 | verify focus | focus lands on the activated tab |
| 17 | close the last tab | honest no-document state (empty stage + New/Open) |
| 18 | check for stale state | no stale Stage/Timeline/Layers/Properties/Library content from another doc anywhere |

## SYS-02 H03 — Tab Interaction + Context Menu + Destructive Safety (H03-RELEASE spec)
- **Tab context menu (L4 overlay):** right-click a document tab → menu with **EXACTLY ONE item: "Close"** (`ctx-tab.close`) — Close Others is Adobe-only and EXCLUDED (H03 §6.2 / F-01), no invented items. Menu = `role="menu"`, item = `role="menuitem"` + `aria-label="Close <title>"`, takes focus on open, focus returns to the target tab on dismiss (SYS-01 C-07, H03 §16).
- **Non-destructive open (INV-DSTR-1/2):** opening the menu never closes/mutates/ACTIVATES anything and emits NO events. Right-click is a distinct handler from left-click activation. The target is the right-clicked document's **stable ID captured at right-click time** — never the active pointer, never a DOM index, never a stale closure.
- **Close item → `tab.close(targetDocId)`** — the SAME canonical commandId as the tab × (H02 §12, no drift) → H04/H07 guard flow → H02 open-set/active update. Dirty target → guard; Cancel leaves everything unchanged.
- **Lifecycle:** Esc / outside-click → CANCEL (no mutation); target doc removed while open → DISMISS (safe invalidation); a doc added/removed (lifecycle transition) while open → DISMISS; a REORDER while open keeps the menu valid (target by ID). Rapid right-clicks re-target a single menu (no stacking, no double-mutation).
- **Tests:** NEW `h03.test.tsx` (24 tests — the full T-ctx-* matrix incl. the critical scenario "A active, B inactive → right-click B → Close → B closes, A remains active, B was never activated", dismiss-on-removed, dismiss-on-busy, stale-target, seq closes, focus return).
- **Manual acceptance: PENDING** (user's Linux desktop — matrix below).

## SYS-02 H04 — Dirty State + Unsaved Changes (H04-RELEASE v2 spec)
- **Authoritative semantic already in the engine (5e9a219, verified against H04 §6.0):** `DIRTY ⇔ current document state ≠ saved snapshot` (History stores the saved snapshot; `is_dirty` compares). "Has undo entries" is NOT the definition — undo/redo are only EXAMPLES of snapshot-reaching mutations (INV-DIRTY-2 v2). New native H04 tests: a FRESH (non-undo) mutation returning to the snapshot → CLEAN without a write; view ops (selection/playhead/active-layer) never dirty; failed save preserves DIRTY + history; successful save flow (write + snapshot advance) → CLEAN with history preserved.
- **`document:changed` now emitted (was the known forward gap):** H04 §10 / SYS-01 §27.1 — the engine client emits it post-do for every DOCUMENT mutation (draw/transform/move/patch/node-props/settings/frames/tweens/labels/symbols/layers + undo/redo) — 41 wrappers wired. VIEW/SESSION ops (selection, playhead, active layer) and FILE-SYSTEM ops (export, save) never emit it; no engine ⇒ no event. Proven against the REAL client (wire-faithful fake module) in `h04.test.ts`.
- **Consumers:** App re-reads document-bound UI immediately on `document:changed` (no 120ms poll lag); the tab strip re-reads its dirty ● on the same event.
- **`saving:changed` full transitions (H04 T2–T5):** save start → `{saving}`; success → `{saved}` + snapshot advance (CLEAN); write failure → `{error}` (stays DIRTY = SAVE_ERROR, last-good intact, `markClean` never reached); cancelled picker → `{idle}`; retry → `{saving}` → resolve.
- **Dirty GUARD decision contract (H04 §8/§9 — decisions, NOT new commandIds):** Save reuses `file.save()` (H05); save-fail in the guard keeps DIRTY and BLOCKS the close (dialog stays open for retry/cancel); Discard = permanent (non-undoable) proceed; Cancel = abort, unchanged. The guard targets the DOCUMENT that triggered it (doc-id scope) — proven by the App-level test where a dirty INACTIVE doc triggers the dialog while the clean active doc does not.
- **Dirty indicator a11y (H04 §13):** ● = `aria-label="unsaved changes"` inside an always-present `aria-live="polite"` region; tab naming includes "— unsaved".
- **Tests:** NEW `h04.test.ts` (10 — emission contract vs the real client) + `h04-ui.test.tsx` (13 — indicator event-driven/aria/per-doc/no-doc, saving transitions, guard contract save/save-fail/discard/cancel, close-all mixed, exit) + 4 native Rust tests.
- **Provisional decisions encountered:** AMB-H01-002/003 untouched (not H03/H04 scope).
- **Manual acceptance: PENDING** (user's Linux desktop — matrix below).

### Manual acceptance matrix — H03 (test on your Linux desktop, report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | right-click the ACTIVE tab | menu opens (one "Close" item); doc NOT activated, nothing closed, no toast |
| 2 | right-click an INACTIVE tab | menu opens targeting THAT tab; active doc unchanged |
| 3 | menu open → Esc | menu closes; nothing changed |
| 4 | menu open → click outside | menu closes; nothing changed |
| 5 | right-click inactive B → Close (B clean) | B closes; A stays active |
| 6 | right-click inactive B → Close (B dirty) | Save/Discard/Cancel dialog for B |
| 7 | … → Cancel | B still open, still dirty, A untouched |
| 8 | … → Save (succeeds) | B saved (CLEAN) + closed; A remains active |
| 9 | … → Save (fails, e.g. read-only path) | "Save error", B still dirty, close BLOCKED, dialog stays |
| 10 | close B (× or menu) while the menu for B is open elsewhere | menu dismisses itself (no crash) |
| 11 | reorder tabs while the menu is open | menu stays; Close still closes the right doc |
| 12 | keyboard: focus a tab, Tab into menu, Enter | Close runs on the focused tab |

### Manual acceptance matrix — H04 (test on your Linux desktop, report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | create doc, draw a rect | ● appears on the tab immediately (no delay/poll) |
| 2 | switch to another doc and back | each doc's ● independent; no transfer |
| 3 | undo until the doc matches its saved state | ● clears WITHOUT saving (snapshot match) |
| 4 | redo away from the saved state | ● returns |
| 5 | edit a value back to its saved value (no undo) | ● clears (mutation reached snapshot) |
| 6 | Save (success) | "Saved hh:mm" status; ● clears; undo still works |
| 7 | make a change, save to a read-only/bad path | "Save error"; ● STAYS; retry works |
| 8 | change selection / scrub playhead / resize a panel on a dirty doc | ● stays (view/workspace never clears dirty) |
| 9 | dirty doc → Close → dialog → Save fails → retry → succeeds | close proceeds only after success |
| 10 | no-document state | no ● anywhere; New starts CLEAN |

## SYS-02 H05 — Save + Save As + File Identity (H05-RELEASE spec)
- **Desktop save flow restructured (H05 §8/edge 15):** new Tauri command `pick_save_path` (dialog only, NO write) → the editor VALIDATES the path before any write → `write_project_file` (atomic). The old pick+write-in-one command is kept but no longer used by the save flow.
- **Save As to an already-open path = BLOCKED (INV-IDENT-4 / D-AMB-001, edge 15):** if the picked path is owned by ANOTHER open document → explicit "Save blocked" error BEFORE any write; source doc stays DIRTY with History/session untouched; no snapshot advance; no path taken. Browser dev mode is pathless → the rule applies natively (honest gap, F3).
- **`modifiedAt` ownership (H05, FL-0004):** new engine facade `kineora_set_modified_at(epoch)` (wasm has no wall clock). The save flow stamps it in the BINDING §7.1 order: write ok → modifiedAt ← now → `setDocTitle` → `markClean` (snapshot advance, now includes the stamp) → CLEAN → `saving:changed{saved}`. On failure: stamp NOT written, snapshot NOT advanced, dirty preserved.
- **P-1 / P-6:** titled + known path → overwrite in place, no picker, no confirm; Save on a CLEAN doc is an idempotent write (still writes + "Saved hh:mm").
- **Identity:** Document ID survives Save As (only path + tab title change). **AMB-H05-001 PROVISIONAL** (= spec's recommendation): tab title derives from the filename on first save — flagged, never silently finalized.
- **Events:** `saving:changed` canonical `{saving|saved|error}` (plus the pre-existing `{idle}` for cancelled pickers — documented, not a new schema); NO fake `activeDoc:changed` / `document:changed` on save. The tab strip re-reads title/dirty on `saving:changed` (DocumentTabs now subscribes).
- **Tests:** NEW `h05.test.tsx` (13 — T-save-untitled/titled/as/as-overwrite/**as-open-path-block**/fail/clean/dialog/same + §7.1 order proof via a call-order record + undo-preserved + event-hygiene + title-derivation-PROVISIONAL) + 2 native Rust tests (stamp-before-snapshot → undo-to-snapshot still CLEAN; failed write leaves stamp+snapshot untouched).

## SYS-02 H06 — Open + Open Recent (H06-RELEASE spec)
- **Single canonical commandId (H06 §8, no drift):** `file.openRecent` command REMOVED — Open Recent reuses `file.open` with the recent entry as input. The File ▸ Open Recent submenu rows now run `file.open(entry)`.
- **H06 §6 flow for known entries:** step 1 = already-open check FIRST (before the guard): entry.path already owned by an open doc → activate it, NO guard, NO load, `activeDoc:changed` only (D-AMB-001). step 2 = dirty guard on the active doc (H04 handoff, via `confirmClose`). step 4 = load: stored snapshot first, else `read_project_file` on desktop. stale/missing → toast + skip (H06 §11).
- **Interactive Open unchanged in semantics** (guard → picker → already-open check → ADD): Open still ADDS a document (H02 ST2), never replaces; failed load (CASE A) leaves the active doc's dirty/History/selection/playhead EXACTLY intact; recent entries now carry `path?` (desktop) for the already-open check + native re-open.
- **Session reset + duplicate-ID impossibility:** engine invariants — `Session::from_document` = History::new/selection empty/playhead 1 (from_document_resets_selection_playhead_history) and fresh monotonic ids per load (h02_document_ids_are_never_duplicated_in_the_open_set). **AMB-002 collision-RECOVERY stays deferred to H10 — NOT falsely closed.**
- **Tests:** NEW `h06.test.tsx` (11 — T-open-valid/tab/event, cancel, corrupt CASE A, dirty-guard (cancel+proceed), already-open no-reload, recent valid-snapshot / valid-path / stale / removed / **already-open-skips-guard**, single-commandId registry check, distinct-ids smoke) + file.test.ts updated to the `openFromRecent(entry)` contract.
- **Manual acceptance: PENDING** for both H05/H06 (matrices below).

### Manual acceptance matrix — H05 (report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | new doc → Save (Ctrl+S) | native save dialog → write → tab title = filename, ● clears, "Saved hh:mm" |
| 2 | edit again → Save | NO dialog (overwrite its own path), ● clears |
| 3 | Save As (Ctrl+Shift+S) | picker → new path; tab title updates; doc identity same |
| 4 | open file A; with another doc, Save As onto A's path | **"Save blocked"** error, nothing written, your doc still dirty, A untouched |
| 5 | Save As to a NEW existing file on disk | overwrites it, no confirm |
| 6 | Save to a read-only path | "Save error", ● stays, retry works |
| 7 | Save → Cancel in the dialog | nothing written, doc unchanged |
| 8 | clean doc → Save | still writes + "Saved hh:mm" (idempotent) |
| 9 | Save, then Undo | undo still works (history preserved) |

### Manual acceptance matrix — H06 (report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | Open a valid file while another doc is open | new tab added + active; old doc untouched |
| 2 | Open → Cancel in the picker | nothing changed |
| 3 | Open a corrupt/non-JSON file | "open failed" toast; active doc (dirty etc.) EXACTLY intact |
| 4 | active doc dirty → Open | Save/Discard/Cancel guard FIRST; Cancel = nothing |
| 5 | Open a file that is ALREADY open (pick the same path again) | activates the existing tab, no second tab, no reload, its edits intact |
| 6 | File ▸ Open Recent → an entry for an already-open file | activates it WITHOUT the dirty guard, no reload |
| 7 | File ▸ Open Recent → entry whose file was deleted | "no longer available" toast, nothing opens |
| 8 | Open Recent with the active doc dirty (not already-open) | guard applies; Cancel = nothing |

## SYS-02 H07 — Close + Close All + Exit (H07-RELEASE spec, post final-reconciliation)
- **Close All is now SEQUENTIAL (P-5), not atomic, not a summary dialog** (final reconciliation F-3 / residual bug #1): the open-set is processed IN ORDER — clean docs close directly; each DIRTY doc gets its OWN per-doc guard (new App state `seqGuard` + `ctx.confirmCloseDoc(docId) → Promise<'save-ok'|'discard'|'cancel'>`); 'save-ok' (H05 write succeeded) / 'discard' → close + continue; **'cancel' STOPS the sequence — remaining docs stay open (partial close is LEGAL)**. Save failure keeps the doc open + DIRTY with the dialog open (retry/cancel).
- **`activeDoc:changed{null}` EXACTLY ONCE, only when the open-set actually becomes empty** — never on a partial Close All, never because Close All was initiated (the engine's survivor pointer drives it).
- **Survivor selection ISOLATED as a named PROVISIONAL policy** (Rust `survivor_index` in doc_manager.rs): AMB-H07-001 is an OPEN product decision (Blueprint silent); current behavior = the H07 §7 RECOMMENDATION (right neighbour, else last remaining) — explicitly NOT authoritative, natively tested as provisional.
- **`file.close()` vs `tab.close(docId)` remain two intentional commands** (H07 §9 / R-5): both run the same Close(targetDocId) flow with different targets; file.close = ACTIVE doc, tab.close = TARGETED doc (must never close the active doc).
- **Exit**: guard if ANY dirty (Save/Discard/Cancel) → quit; clean → quit directly (unchanged).
- **Tests:** NEW `h07.test.tsx` (16 — T-close, T-close-inactive, T-close-last, T-close-stale, T-close-no-mutate, T-close-dup-event, T-close-all-mixed, **T-close-cancel-mid (mandatory)**, **T-close-all-savefail (mandatory)**, T-close-all-clean, App-level dirty-close guard/cancel, **App-level sequential Close All (clean closes first w/o dialog; save-fail keeps dialog+doc open; cancel stops)**, T-exit-mixed, T-exit-clean) + native `h07_survivor_selection_policy_provisional_amb_h07_001`.

## FINAL RECONCILIATION COMPLIANCE (F-1..F-5, FL-0032) — code changes
- **F-4 / FL-0032 — guard-on-Open REMOVED** (it was a single-doc relic in my H06 implementation): `file.open` (interactive AND recent) no longer calls the dirty guard — multi-doc Open ADDS + activates; a dirty active doc is preserved as INACTIVE (no data loss → no guard). Guard-trigger set is now EXACTLY Close / Close All / Exit. h02/h06 Open-dirty tests rewritten to the no-guard semantics (A stays dirty + open, B added + activated, events canonical).
- **F-3 / residual bug #1 — Close All sequential**: see H07 section above (mandatory partial-Cancel + save-fail tests pass).
- **Residual bug #2 — canonical openSet payload AUDITED**: all 6 emitters (file.ts) use the canonical `{change: 'added'|'removed'|'reordered', docId?}` schema; the single consumer (DocumentTabs) reads it via the typed bus; no alternate schema exists (FL-0030).
- **F-1 (OPEN_FAILED was a state, now an error outcome)**: no code change needed — the implementation already treats a failed load as an error outcome (toast + unchanged), never a lifecycle state.
- **F-2 (AMB-003 re-owned to H10)**: the localStorage recent store remains the provisional mechanism (P-7-class deployment detail); NOT falsely closed — AMB-003 stays open under H10.

## SYS-02 H08 — Import / Export / Publish Handoffs (H08-RELEASE spec)
- **Verified already implemented** (honest handoffs, no SYS-27 internals absorbed): all 6 controls present in the registry — file.importStage (Ctrl+R) / file.importLibrary (Ctrl+I) → SYS-27 MOD-IMPORT handoff; file.export (Ctrl+Shift+R) → SYS-27 MOD-EXPORT (image export = working in-app dialog from the earlier export unit; video/GIF/movie/sequence = SYS-27 handoff); file.publishSettings / file.publish / file.publishProfiles → SYS-27. Each reports "integration gap — owned by SYS-27" (no fake success, no dead control).
- **Event ownership per H08 §9 (downstream, never promoted to SYS-02):** `export:done` = SYS-27 (bus type extended with optional `path` to match the canonical `{format, path}` payload); `library:changed` = SYS-18; `document:changed` = SYS-01 §27.1. H08 observes; it neither owns nor re-emits them.
- **Dirty/undo classification holds:** import = DOCUMENT MUTATION (dirties, undoable — when SYS-27 lands); export/publish = NON-MUTATING (no dirty, no undo).
- **Note (reported, not silently changed):** H08 §8's canonical `file.import(target)` is represented in our registry as the two parameterized entries file.importStage/file.importLibrary (one owner — the SYS-27 handoff; distinct shortcuts Ctrl+R/Ctrl+I require distinct registry entries in the current one-shortcut-per-command model). Semantics identical; no duplicate command invented.

## H00–H08 IMPLEMENTATION STATUS (this batch)
| Spec | Implemented | Notes |
|---|---|---|
| H00 constitution | ✅ (earlier batches) | snapshot dirty, INV-MD, events, identity |
| H01 New/Templates | ✅ (H01-v2) | **AMB-H01-002/003 still PROVISIONAL — product decisions pending** |
| H02 Multi-doc/Tabs | ✅ | openSet events, per-tab close, dup-open, reorder, a11y |
| H03 Context menu | ✅ | single "Close" item, non-destructive open, focus return |
| H04 Dirty/Unsaved | ✅ | document:changed, saving transitions, guard contract |
| H05 Save/Save As | ✅ | pick→validate→write, open-path BLOCK, modifiedAt |
| H06 Open/Open Recent | ✅ | **guard REMOVED per F-4**, ADD semantics, no-drift command |
| H07 Close/CloseAll/Exit | ✅ | sequential per-doc guard, partial cancel, survivor policy ISOLATED (AMB-H07-001) |
| H08 Import/Export/Publish | ✅ (handoffs) | verified; SYS-27 engines out of scope |

**Unresolved product decisions (NOT invented, isolated + reported):** AMB-H01-002 (duplicate template name — current: guarded Replace, PROVISIONAL) · AMB-H01-003 (seeded-doc identity — current: Untitled-N, PROVISIONAL) · AMB-H07-001 (survivor after close-active — current: right-neighbour/last, PROVISIONAL via `survivor_index`) · AMB-002/003/004 deferred to H10/H11.

## SYS-02 H09 — File Commands + Menus + Shortcuts (H09-RELEASE spec)
- **Canonical registry enforced (17 commandIds, H09 §5):** `file.importStage`/`file.importLibrary` merged into ONE `file.import(target)` command (input 'stage'|'library'); `file.exportVideo/Gif/Movie/Sequence` merged into ONE `file.export(format)` command (input image|video|gif|movie|sequence). `file.openRecent` remains a REUSE of `file.open` (entry as input) — not a commandId. `file.close()` (active doc) vs `tab.close(docId)` (targeted doc) remain two intentional distinct commands (H09 §5.1).
- **Shortcut aliases now carry input** (H09 §7/§10): Ctrl+R → file.import('stage'), Ctrl+I → file.import('library'), Ctrl+Shift+R → file.export('image') — the menu entries and the shortcut bindings resolve to the SAME commandId + input (invocation equivalence, INV-CMD-3). The menu items display their shortcut via `shortcutDisplayFor`.
- **H09 §9 enable/disable:** NO_DOCUMENT → doc-scoped commands DISABLED-BY-CONTEXT ("no document open"); New/Open/OpenExternalLibrary/Exit always enabled; legacy AIR/Print/Page-Setup remain HIDDEN (no commandId, no trigger).
- **Tests:** NEW `h09.test.tsx` (7 — T-cmd-single-id 17-ID registry + removed-ID check, file.close vs tab.close targeting, T-cmd-import/export parameterized menu+shortcut equivalence, T-cmd-disabled-no-doc, T-cmd-hidden-print, T-cmd-open-recent reuse).

## SYS-02 H10 — Persistence + Recovery boundary (H10-RELEASE spec)
- **Boundary made explicit in code** (H10 §5 handoff markers at the `saveDocument`/`openDocument` seams in file.ts): SYS-02 triggers + handles results + UI feedback; serializer/atomic-write/checksum/migration/autosave/recovery = **SYS-28 internals — NOT implemented here (INV-PERS-1)**.
- **UNRESOLVED — IMPLEMENTATION BLOCKED (registered, NOT invented):** Document-ID persistence in the project JSON + collision-recovery behavior (AMB-002 — source-silent recovery semantics; the no-duplicate invariant INV-IDENT-4 stands); `formatVersion` + `migrate(from,to)` (P-9 gap, SYS-28); autosave (2s+30s debounce, .autosave slot) + recovery prompt UI (H00 T12–T14) — blocked until SYS-28 ships; recent-file store API (AMB-003 — the current localStorage store remains PROVISIONAL, H10-owned decision pending).

## SYS-02 H11 — Visual / Accessibility / Error (H11-RELEASE spec)
- **INV-VIS-2 tokens:** File surfaces tokenized — CloseConfirmationDialog (Discard via `--kineora-danger`, Save via `--kineora-accent-text`), no-document state buttons (`--kineora-btn-*`/`--kineora-disabled-text`/`--kineora-panel-2`), MenuBar menu-item colors (`--kineora-dropdown`/`--kineora-btn-primary-bg`/`--kineora-text`/`--kineora-disabled-text`/`--kineora-border-2`).
- **One dirty-● design (H11 §4/§8):** tab ● + header dot now on `--kineora-danger` (was mixed warning yellow) — one design across tab + title.
- **st.saving states (H11 §4):** idle/saving/saved/**error** — `save error` now displayed on the danger token (previously the error state fell back to idle); cell is `aria-live="polite"` (T-a11y-save-announce).
- **Guard submitting state (H11 §4 / H13 §6):** the guard dialog is busy while a Save is in flight — all buttons disabled, "Saving…" label, **no double-submit** (T double-submit test: exactly one write attempt).
- **Tests:** NEW `h11.test.tsx` (13 — T-vis-tab-dirty/-guard-danger/-no-doc-empty/-menu-states, T-a11y-tab-role/-tab-focus/-ctx-menu/-dirty-live/-guard-trap/-save-announce, T-err-save-fail/-open-fail(CASE A), T-edge-empty-recent, double-submit).

## SYS-02 H12 — UI→Engine Connection Matrix (H12-RELEASE spec)
- Wiring matrix verified against code (H12 §3/§5): every control → command → target → state → event chain exists; handoff controls (import/export/publish) make NO engine call and never dirty (SYS-27 owns mutation); tab controls are VIEW/SESSION (no doc mutation); the dirty indicator re-reads on `document:changed` (event-driven, no poll).
- **Tests:** NEW `h12.test.tsx` (8 — T-import-stage/library, T-export(+no-dirty), T-publish-*, T-tab-activate/-close(adversarial inactive), T-dirty-indicator event-driven, rapid Open already-open, rapid switching pointer integrity, stale-reference re-read).

## SYS-02 H13 — QA / Manual Acceptance (H13-RELEASE spec)
- Automated layer: all bound T-* test IDs are automated (see H09–H12 test sections above; 593 UI + 262 Rust tests).
- **Manual layer (user's desktop — the authoritative layer per H00 §19/H13 §7):** matrix below.

### Manual acceptance matrix — H09–H12 (report `1-P 2-F …`)
| # | Action | Expect |
|---|---|---|
| 1 | File ▸ Import ▸ Import to Stage (Ctrl+R) / to Library (Ctrl+I) | honest "integration gap — owned by SYS-27" toast; doc NOT dirtied |
| 2 | File ▸ Export ▸ Image (Ctrl+Shift+R) | the working export dialog opens (image = working unit) |
| 3 | File ▸ Export ▸ Video/GIF/Movie/Sequence | honest SYS-27 handoff toast; doc NOT dirtied |
| 4 | File ▸ Publish Settings (Ctrl+Shift+F12) / Publish (Shift+Alt+F12) | honest SYS-27 handoff toasts |
| 5 | Save a dirty doc | status cell shows "Saving…" then "saved hh:mm" (announced) |
| 6 | Save to a failing path (read-only) | status cell shows "save error" (red); ● stays |
| 7 | dirty doc → Close → guard → click Save TWICE fast | exactly ONE save attempt; Save button shows "Saving…" disabled |
| 8 | guard Esc | Cancel — nothing changed |
| 9 | Open Recent with an empty list | "No recent files" |
| 10 | Open the SAME file twice in quick succession | one tab, no reload, edits intact |
| 11 | Keyboard: Tab to a tab, Enter | activates; focus lands on the activated tab |
| 12 | right-click a tab → Esc | menu closes; focus returns to the tab; nothing closed |

## H14 — FINAL RECONCILIATION (re-run against ACTUAL CODE, not the H14 file's claims)
Fresh audit of the implemented code (evidence via grep/test runs, this commit):
1. **Command drift: 0** — exactly the 17 canonical H09 §5 commandIds exist (`grep "id: 'file\./tab.'" commands.ts` = 17); removed IDs (file.openRecent/importStage/importLibrary/exportVideo/Gif/Movie/Sequence) verified absent (h09 T-cmd-single-id test); file.close vs tab.close distinct (tested).
2. **Event drift: 0** — emitters: activeDoc:changed (6), openSet:changed (6), document:changed (1), saving:changed (5), tool/panel/workspace/playback (SYS-01 chrome); NO library:changed / export:done emitters in SYS-02 (H12 §4: SYS-02 never emits SYS-18/SYS-27 events) ✓.
3. **Payload drift: 0** — openSet:changed single canonical `{change, docId?}` schema (all 6 emitters); saving:changed single `{state, time?}` (FL-0030); activeDoc:changed `{docId}`.
4. **State contradictions: 0** — STM-DIRTY snapshot-based (engine tests); lifecycle DIM-A/B/C (no OPEN_FAILED state — open failure is an error outcome, tested T-err-open-fail CASE A).
5. **Ownership collisions: 0** — guard decision contract = H04 (App confirmClose/confirmCloseDoc), dialog chrome = H07+SYS-01 (CloseConfirmationDialog), save = H05 (saveDocument), persistence internals = NOT in SYS-02 (INV-PERS-1 — H10 boundary markers).
6. **Scope leaks: 0** — import/export/publish = handoff toasts only (no SYS-27 internals); autosave/recovery/formatVersion = NOT invented (registered BLOCKED, H10).
7. **Dead controls: 0** — registry lint (FUNCTIONAL ⇒ commandId) + all menu items wired (h09/h11 tests); legacy items HIDDEN.
8. **Orphan commands: 0** — all 17 have ≥1 visible trigger (menu/shortcut/tab UI — audit §H09 above).
9. **Orphan events: 0** — every emitted event has consumers (openSet→tabs, activeDoc→App rebind, document:changed→App+tabs, saving→StatusBar, SYS-01 chrome events→panels).
10. **Stale UI bindings: 0** — panels re-read on activeDoc:changed/document:changed (event-driven); T-stale-ref + T-dirty-indicator tests.
11. **Dirty-state leaks: 0** — per-doc dirty (native + UI tests); export/publish never dirty (h12); view ops never dirty (native).
12. **Undo leaks: 0** — save never clears history (native test); guard discard = non-undoable (by design).
13. **Persistence leaks: 0** — workspace/prefs never written into project JSON (INV-PERS-3); recent/templates = prefs store (PROVISIONAL, AMB-003 registered).
14. **Accessibility gaps: 0** (in scope) — tabs/menu/guard/dirty/save-status covered (h11 tests); guard initial focus = `[NOT SPECIFIED]` (not invented).
15. **Shortcut conflicts: 0** — validateCommands lint clean (h09 test); Ctrl+R/Ctrl+I/Ctrl+Shift+R aliases unique; no SYS-01/SYS-04 collisions.
16. **Error paths: 0 silent** — save-fail (status+toast), open-fail (toast), open-path-block (explicit error), engine-unavailable (honest "engine not attached"), guard-save-fail (dialog stays).
17. **Edge cases** — 593 UI + 262 Rust tests green (this commit).
18. **Unresolved ambiguities** — ALL registered, NONE invented: AMB-H01-002/003 (H01, PROVISIONAL behavior flagged in code+STATUS), AMB-H07-001 (H07, PROVISIONAL `survivor_index` policy named+flagged in code), AMB-002/003/004 (H10/H11, BLOCKED-registered), AMB-H05-001 (recommendation only), guard initial focus `[NOT SPECIFIED]`.
19. **Lesson violations: 0** — FL-0007/0008 (no fake events), FL-0010 (no invented commands), FL-0016 (no scope absorption), FL-0017 (code evidence only), FL-0023 (no silent ambiguity resolution), FL-0025 (invariants↔transitions consistent), FL-0030 (payload drift 0), FL-0032 (guard-on-Open removed in the H00–H08 pass, still absent).
   *New lesson candidate (test-validity class, from this pass's debug): a `vi.mock` of a module imported by a DEPENDENCY module can appear applied to the test's own import while the dependency still calls the real module — assert the mock's call count EARLY (before behavior assertions) so a mock-miss fails the test immediately instead of masquerading as wrong behavior. Proposed FL-0033.*
