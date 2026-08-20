# Kineora Animation — original 2D animation editor (offline-first, Linux-first)

Phase 4 implementation. Source of truth: `../animate-blueprint/` (Phase 1), `../phase2-knowledge-base/` (Phase 2), `../phase2.5-ui/` (Phase 2.5), `../engineering/` (Phase 3).

## Architecture
```
core/      Rust engine  → WASM (cdylib) + native CLI
ui/        React+TS shell → dynamic-loads the WASM core (engine/client.ts)
desktop/   Tauri v2 shell (Linux-first; needs webkit2gtk)
scripts/   dev.sh · test.sh · push.sh (user-PC helpers)
.github/   CI (rust: fmt+clippy+test+wasm ; node: test+build)
docs/      BUGS.md · TEST_REPORT.md templates
```

## Local development (Linux PC — authoritative runtime)
Prereqs: Rust (rustup), Node ≥18, **wasm-pack** (one-time), (desktop) `libwebkit2gtk-4.1-dev libgtk-3-dev`.

```bash
# one-time: install wasm-pack (either works)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
#   — or —   cargo install wasm-pack

# after every `git pull`, refresh deps before build/test
cd ui && npm ci

# engine tests (native)
cd ../core && cargo test

# build core → wasm, then UI
cd ../ui
npm run wasm           # scripts/build-wasm.sh → ui/public/wasm/kineora_core.js (ABSOLUTE path)
npm test               # UI tests (dead-button registry + shell + wasm loader/path regression)
npm run build          # tsc + vite (type-check gate)
npm run dev            # http://localhost:5173

# WASM path regression (no Rust needed — uses a fake wasm-pack)
../scripts/verify-wasm-path.sh

# everything at once (test)
../scripts/test.sh

# desktop (needs webkit deps)
cd ../desktop/src-tauri && cargo tauri dev

# commit + push (your own git identity)
../scripts/push.sh
```

## Engine ↔ UI contract (WASM bridge)
The UI talks to the core **only** through `ui/src/engine/client.ts`. The generated package (canonical `ui/public/wasm/`, built by `scripts/build-wasm.sh` via `npm run wasm`) is a **static public asset**, so Vite cannot `import()` it as a source module. The loader therefore uses a browser-native mechanism: **fetch the glue as text → evaluate via a Blob URL → fetch the `.wasm` explicitly and pass it to the wasm-bindgen default init** (never relying on `import.meta.url`). Works identically in Vite dev, Vite build, and Tauri. Facade API (`core/src/wasm.rs`): `kineora_new / draw_rect / select_at / select_toggle_at / select_in_rect / select_all / clear_selection / move_selection / transform_selection / patch_transforms / set_node_props / set_document_settings / set_playhead / insert_keyframe / set_active_layer / create_layer / delete_layer / rename_layer / set_layer_visible / set_layer_locked / move_layer / undo / redo / evaluate / export_svg / save / load / status / project_json / load_json`. All values cross as JSON. If the package isn't built, the UI reports an honest "not attached" state naming the exact URL + build command — never a fake control. Regressions: `wasmLoader.test.ts` (path contract + full loader flow with injected fakes) and `scripts/verify-wasm-path.sh` (canonical output dir via a fake wasm-pack).

## CI (GitHub Actions)
Every push/PR runs: `cargo fmt --check`, `cargo clippy`, `cargo test`, `cargo build --target wasm32-unknown-unknown` (verifies the wasm facade), `npm ci && npm test && npm run build`. Check the Actions tab.

## Canvas renderer (current unit)
- `ui/src/render/viewport.ts` — pure doc↔screen math (zoom/pan/fit/clamp), unit-tested.
- `ui/src/render/canvasRenderer.ts` — content pass (background + rects) + editor-only selection overlay; export stays in the Rust `exportSvg` (overlays never exported).
- `Stage.tsx` — real `<canvas>`: reads `evaluate()` + `statusJson()`, devicePixelRatio backing store, wheel-zoom around cursor, middle-drag pan, double-click fit, ResizeObserver redraw.

Manual test (after `npm run dev`): create doc → draw rect (engine) → rect visible on Stage → select it → blue dashed selection box + handles → **wheel-zoom (immediate) / middle-drag pan (immediate + smooth, no browser autoscroll) / double-click fit (immediate)** → Play → stage updates → Export SVG → no selection box in the SVG.

## Transform + selection (current unit)
- `ui/src/editor/transformMath.ts` — pure: rotated-rect geometry, selection bounds (rotated for single / AABB for multi), 8 scale handles + rotate handle, scale/rotate math around an anchor, handle picking. Fully unit-tested.
- Transform overlay: editor-only (never in SVG export). Single object = rotated box; multi = AABB union box. 8 scale handles (tl/t/tr/r/br/b/bl/l) + rotate handle above top-center.
- Gestures (Select tool): click = select · Shift+click = toggle · drag on empty = marquee (contact selection) · drag handle = scale (Shift = proportional, Alt = center-anchor) · drag rotate handle = rotate (Shift = 15° snap) · drag object = move. One completed gesture = ONE undoable command (`TransformSelection` — absolute before/after per-keyframe overrides, exact undo). Cancel/zero-delta = no command.
- Rotation renders in both the canvas and SVG export (around center, pivot=center [ENGINEERING DECISION]; draggable pivot = later unit).

Manual test (after `npm run wasm && npm run dev`):
| # | Action | Expect |
|---|---|---|
| A | Rect → draw 2 rects | both appear |
| B | Select → click one | rotated/AABB box + 8 handles + rotate handle |
| C | drag a corner handle | scales around the opposite corner (live preview) |
| D | Shift+drag corner | proportional scale |
| E | Alt+drag corner | scales around center |
| F | drag rotate handle | rotates around center; Shift snaps 15° |
| G | Undo / Redo | one undo per gesture, exact restore |
| H | Shift+click two rects | multi-select (union AABB) |
| I | drag empty stage | marquee selects touching objects |
| J | group-drag a handle | both objects scale together (one command) |
| K | zoom/pan then transform | correct doc-space result |
| L | Export SVG | rotation in SVG, NO box/handles |

## Rect tool (current unit)
- `ui/src/editor/gesture.ts` — `normalizeRect` (4 draw directions → top-left origin + positive w/h) + `MIN_RECT_DIM` (1 doc px; zero/sub-min drag = click → no object, [ENGINEERING DECISION]).
- Rect tool (left button): drag → translucent preview (editor-only) → mouseup → ONE `drawRect` command (real Rust node). Reverse-drag normalizes; sub-threshold click and pointer-cancel create nothing.
- Rust `DrawRect` already does `ensure_keyframe` (F6 copy-prev) — drawing at a held frame auto-keys and PRESERVES existing content (Phase-1 Part 02b field 16 semantics); undo removes the keyframe exactly.

Manual test (after `npm run wasm && npm run dev`):
| # | Action | Expect |
|---|---|---|
| A | Select Rect tool | tool readout shows "rect" |
| B | drag on stage | translucent preview follows cursor |
| C | release | a real blue rectangle appears |
| D | draw at 50% / 200% zoom | correct doc-size rect (no screen-px drift) |
| E | pan, then draw | correct position (doc coords) |
| F | drag bottom-right → top-left | rectangle normalizes (positive w/h) |
| G | switch to Select, click the rect | selection overlay appears |
| H | drag the rect | it moves (Select + Move path) |
| I | Undo | move reverts |
| J | Redo | move reapplies |
| K | Rect tool, click (no drag) or Esc/cancel | no rectangle created |
| L | draw a second rectangle | appears; two Undos remove both |
| M | Export SVG | both rects present, no selection/preview overlays |

## Select + Move (current unit)
- `ui/src/editor/gesture.ts` — pure drag math: 3px threshold, screen→doc delta (÷zoom), pan-independent. Unit-tested.
- Select tool (left button): screen→doc via viewport, engine hit-test (`selectAt`), selection overlay updates immediately; drag preview is renderer-only (never a document write); pointerup commits exactly ONE `MoveSelection` command (undoable); pointercancel/blur discard with no command.
- Rust `MoveSelection` now captures the node's INTERPOLATED position as "before" (dragging an animated object lands exactly where the preview showed), and auto-keys a keyframe when editing a held frame (F6 semantics) — undo removes that keyframe exactly.

Manual test (after `npm run wasm && npm run dev`):
| # | Action | Expect |
|---|---|---|
| A | click a rect | it selects (blue dashed box + handles) |
| B | click empty stage | selection clears |
| C | drag selected rect | it follows the cursor (preview), settles on release |
| D | drag out of the canvas and release outside | still commits correctly |
| E | drag then pointer-cancel | no movement, no undo entry |
| F | Undo | rect returns to previous position |
| G | Redo | rect returns to moved position |
| H | zoom (wheel) then click | selection still hits the right spot |
| I | pan (middle-drag) then drag | move still correct (doc coords) |
| J | zoom to 200%+ then drag | move stays correct (no screen-px drift) |
| K | draw rect, keyframe@10, move it, scrub to 5, drag | moves from the interpolated position (no jump) |
| L | move, then Export SVG | no selection box / no preview in the SVG |

## Layers + Properties panels (current unit)
- **Layers panel** (`components/LayersPanel.tsx`) — a projection of the engine's real layer list (no duplicate React state): eye / lock / name / selection-marker per row; click a row = activate layer (view state, no undo); double-click = rename (undoable); + / 🗑 = create/delete (undoable, last layer blocked); ▲▼ buttons + HTML5 drag = reorder (undoable, bottom→top render order). Top row = frontmost layer.
- **Properties panel** (`components/PropertiesPanel.tsx`) — context-bound inspector (REQ-PRP-001 precedence, slice-1 subset): stage selection → object schema (single = X/Y/W/H/Rotation/Scale X%/Scale Y%/Fill/Stroke+width; multi = common X/Y/W/H + "mixed" badge); nothing selected → document schema (W/H/fps/background). Every commit = ONE engine command (Enter/blur commit, Esc cancel, invalid input reverts with inline error — never silent). No direct document writes — all edits go through Rust commands.
- **Rust** — new commands `SetNodeProps / SetDocumentSettings / CreateLayer / DeleteLayer / RenameLayer / SetLayerVisible / SetLayerLocked / ReorderLayer`; `MoveSelection`/`TransformSelection` are layer-aware (cross-layer selections move/transform correctly); `select_all` spans layers (skips hidden/locked); `draw_rect` rejects locked/hidden targets; selection pruned on hide/lock/delete. Property edits on an interpolated frame write the interpolated value + delta (no jump) with exact undo.
- Visibility semantics (Part 20.2): hidden = not rendered/selectable/exported; locked = rendered, not selectable/select-all-able, still exported. Object-level lock/hide, folders, layer types, outline mode = later units.

Manual test (after `npm run wasm && npm run dev`):
| # | Action | Expect |
|---|---|---|
| A | draw two rects | Layers shows active "Layer 1" |
| B | click a rect | row gets a blue ● dot; Properties shows Object: real X/Y/W/H |
| C | click a Layers row | row activates (draws go there) |
| D | edit X then Enter | object moves; one Undo entry |
| E | edit Y/W/H/Rotation/Scale | renderer updates; Undo/Redo exact |
| F | change Fill / enable Stroke | object restyles (base props, all frames) |
| G | add layer + draw on it | stacking correct (top = front) |
| H | eye-off a layer | objects vanish (canvas + SVG export) |
| I | lock a layer | visible but not selectable/select-all-able |
| J | reorder (▲▼ or drag) | render order flips; Undo restores |
| K | dbl-click rename | name changes; Undo restores |
| L | delete a layer | gone + nodes; Undo restores exactly |
| M | multi-select across layers → drag | both move, each on its own layer |
| N | edit property on an interpolated frame | no jump; playback correct |
| O | Save/reload, Export SVG | layers+props round-trip; no overlays in SVG |

## Document / Stage / Viewport (current unit)
- **Canonical stage model** (Part 01 §1.4.1, Part 33 §33.1, engineering 03): origin (0,0) = stage top-left, +X right, +Y down; the stage is the published frame; the **pasteboard** (work area) surrounds it — art there is authored but never exported. New-document defaults are **1920×1080 px @ 24 fps, #ffffff** (single source of truth: Rust `Settings::default()`; the WASM loader calls `kineora_new_default()` so it can't drift).
- **Renderer** (`canvasRenderer.ts`): the editor canvas now draws a real stage — gray pasteboard → stage rect filled with the document background → a stage border (authoring-only, never exported). Objects may extend onto the pasteboard (staging area) and stay selectable.
- **Viewport is strictly view-only**: `screen → viewport → document` for every gesture; zoom/pan never touch document coordinates. Regression tests prove screen↔doc round-trips at 25%–800% zoom and that pan/zoom leave doc coords untouched.
- **View commands** (Part 01 §1.2.3 / Part 29 §29.9): `Ctrl/Cmd + =` zoom ×2 · `Ctrl/Cmd + -` zoom ÷2 · `Ctrl/Cmd + 1` = 100% · `Ctrl/Cmd + 0` = Fit in Window (plus existing wheel-zoom, middle-pan, double-click fit). The stage readout shows `stage: W×H`.
- **Export** (`export.rs`): SVG is exactly the document stage (`width/height/viewBox` from settings) and now **clips** content to the stage via `clipPath` — pasteboard/off-stage art is not rendered at export. Export never sees the viewport.
- Document settings (W/H/fps/background) are real document state: editable in Properties, undoable, and verified to survive Save → Load.

Manual test (after `npm run wasm && npm run dev`):
| # | Action | Expect |
|---|---|---|
| A | open the editor | immediately see a white 16:9 stage on gray pasteboard (not infinite white) |
| B | check the stage readout | shows `stage: 1920×1080` |
| C | draw a rect at fit zoom | appears at the drag spot, doc size = screen ÷ zoom |
| D | Ctrl+= (×2) and draw again | same drag ⇒ half the doc size (correct zoom math) |
| E | Ctrl+- to 25% and draw again | correct doc size (screen ÷ 0.25) |
| F | pan (middle-drag), draw again | position correct in doc coords |
| G | drag a rect onto the gray pasteboard | it stays there (staging area), still selectable |
| H | Properties → change W/H | stage rect resizes on canvas |
| I | Properties → change background | stage fill changes |
| J | Properties → change fps | timeline speed changes |
| K | Save → Reload | stage size/background/fps restored |
| L | Export SVG | uses document stage, clips off-stage art, no overlay, unchanged by zoom/pan |

## Manual test checklist (vertical slice 1)
1. `cd core && cargo test` → 57 acceptance tests green.
2. `cargo run` → prints create/draw/move/keyframe/interp(≈216.67)/undo/redo/export/save-load steps; check `/tmp/out.svg` has exactly background + one content rect (no overlay).
3. `cd ui && npm run wasm && npm ci && npm run dev` → Dev Panel shows `engine: attached`; toolbar Undo/Redo/Save/Export/Keyframe bound to real engine calls.
4. Draw → select → move → undo → redo → save → reload → export — every action changes the Dev Panel event log.

## Status
See `STATUS.md`. Current unit: **Document / Stage / Viewport foundation** (this commit).
