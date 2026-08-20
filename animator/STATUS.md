# IMPLEMENTATION STATUS (Phase 4)

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md |
| Rust core — doc/frame/selection/xfr/command/persist/export/eval | MOD-DOC/FRAME/SELECTION/XFR/COMMAND/PERSIST/EXPORT | COMPLETE | 48 cargo tests |
| CLI demo (offline manual test) | — | COMPLETE | cargo run |
| UI shell + control registry + dev panel | MOD-SHELL/UI | COMPLETE | vitest |
| Tauri desktop config | MOD-SHELL | READY(config) / BLOCKED(run: sandbox webkit) | desktop/src-tauri/ |
| WASM bridge (core ↔ UI) | MOD-INPUT/BRIDGE | COMPLETE (user-PC verified) | core/src/wasm.rs + ui/src/engine/client.ts |
| Canvas renderer (RectItem + viewport) | MOD-RENDER | COMPLETE | render/viewport.ts + canvasRenderer.ts + Stage |
| Select + Move gestures | MOD-INPUT/MOD-SELECTION/MOD-XFR | COMPLETE | editor/gesture.ts + MoveSelection (layer-aware) |
| Rect tool (real object creation) | MOD-INPUT/MOD-DRAWING/MOD-DOC | COMPLETE | gesture.normalizeRect + DrawRect + draw.rs |
| Transform + selection expansion | MOD-INPUT/MOD-XFR/MOD-SELECTION | COMPLETE | transformMath.ts + TransformSelection (layer-aware) |
| **Layers panel (engine-backed)** | MOD-LAYER/MOD-SHELL | **COMPLETE (this commit)** | components/LayersPanel.tsx + layers.rs (12 tests) |
| **Properties panel (context-bound)** | MOD-SHELL/MOD-XFR/MOD-DOC | **COMPLETE (this commit)** | components/PropertiesPanel.tsx + properties.rs (11 tests) |
| CI (GitHub Actions) | MOD-TEST | READY (file) / BLOCKED (push: token needs `workflow` scope) | .github/workflows/ci.yml |
| Object-level lock/hide (Arrange) | MOD-SELECTION | NOT STARTED | later unit (layer-level only today) |
| Draggable pivot | MOD-XFR | NOT STARTED | pivot=center [ENGINEERING DECISION] |
| Tool-options schema (Properties) | MOD-SHELL | NOT STARTED | later unit (REQ-PRP-001 step 1) |
| Edit-in-place depth / nav.back | MOD-SYMBOL | NOT STARTED | later unit |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |

## This commit — Layers + Properties panels
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
1. Object-level lock/hide + draggable pivot (finish MOD-SELECTION/MOD-XFR gaps).
2. Tool-options schema for Properties (REQ-PRP-001 step 1) + keyboard shortcut wiring (Ctrl+A select-all, etc.).
3. Shape system (merge model), more tools, symbols… (Phase-3 P2+).
