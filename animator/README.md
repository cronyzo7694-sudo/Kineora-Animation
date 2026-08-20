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
The UI talks to the core **only** through `ui/src/engine/client.ts`. The generated package (canonical `ui/public/wasm/`, built by `scripts/build-wasm.sh` via `npm run wasm`) is a **static public asset**, so Vite cannot `import()` it as a source module. The loader therefore uses a browser-native mechanism: **fetch the glue as text → evaluate via a Blob URL → fetch the `.wasm` explicitly and pass it to the wasm-bindgen default init** (never relying on `import.meta.url`). Works identically in Vite dev, Vite build, and Tauri. Facade API (`core/src/wasm.rs`): `kineora_new / draw_rect / select_at / select_all / clear_selection / move_selection / set_playhead / insert_keyframe / undo / redo / evaluate / export_svg / save / load / status / project_json / load_json`. All values cross as JSON. If the package isn't built, the UI reports an honest "not attached" state naming the exact URL + build command — never a fake control. Regressions: `wasmLoader.test.ts` (path contract + full loader flow with injected fakes) and `scripts/verify-wasm-path.sh` (canonical output dir via a fake wasm-pack).

## CI (GitHub Actions)
Every push/PR runs: `cargo fmt --check`, `cargo clippy`, `cargo test`, `cargo build --target wasm32-unknown-unknown` (verifies the wasm facade), `npm ci && npm test && npm run build`. Check the Actions tab.

## Canvas renderer (current unit)
- `ui/src/render/viewport.ts` — pure doc↔screen math (zoom/pan/fit/clamp), unit-tested.
- `ui/src/render/canvasRenderer.ts` — content pass (background + rects) + editor-only selection overlay; export stays in the Rust `exportSvg` (overlays never exported).
- `Stage.tsx` — real `<canvas>`: reads `evaluate()` + `statusJson()`, devicePixelRatio backing store, wheel-zoom around cursor, middle-drag pan, double-click fit, ResizeObserver redraw.

Manual test (after `npm run dev`): create doc → draw rect (engine) → rect visible on Stage → select it → blue dashed selection box + handles → **wheel-zoom (immediate) / middle-drag pan (immediate + smooth, no browser autoscroll) / double-click fit (immediate)** → Play → stage updates → Export SVG → no selection box in the SVG.

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

## Manual test checklist (vertical slice 1)
1. `cd core && cargo test` → 10 acceptance tests green.
2. `cargo run` → prints create/draw/move/keyframe/interp(≈216.67)/undo/redo/export/save-load steps; check `/tmp/out.svg` has exactly background + one content rect (no overlay).
3. `cd ui && npm run wasm && npm ci && npm run dev` → Dev Panel shows `engine: attached`; toolbar Undo/Redo/Save/Export/Keyframe bound to real engine calls.
4. Draw → select → move → undo → redo → save → reload → export — every action changes the Dev Panel event log.

## Status
See `STATUS.md`. Current unit: **WASM bridge** (this commit).
