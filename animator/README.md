# Animator — original 2D animation editor (offline-first, Linux-first)

Phase 4 implementation. Source of truth: `../animate-blueprint/` (Phase 1), `../phase2-knowledge-base/` (Phase 2), `../phase2.5-ui/` (Phase 2.5), `../engineering/` (Phase 3).

## Structure
```
core/      Rust engine (document model, evaluate, commands/undo, sparse timeline, SVG export)
ui/        React+TS shell (toolbar, stage, timeline strip, status bar, dev panel)
desktop/   Tauri v2 shell config (Linux-first; needs webkit2gtk to run)
```

## Pipeline
```bash
# engine (Rust) — runs anywhere with Rust
cd core && cargo test          # 10 acceptance tests
cargo run                      # headless vertical-slice demo → /tmp/out.svg + /tmp/out.json

# UI (Node ≥ 18)
cd ui && npm install && npm test   # 6 tests (dead-button/registry/shell)
npm run dev                    # dev server → http://localhost:5173

# desktop (user's Linux desktop; needs webkit2gtk)
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev
cd desktop/src-tauri && cargo tauri dev
```

## Vertical slice 1 — what works (tested)
Create document → draw rect → select → move → keyframe@N → linear position interpolation → undo/redo → save/load (atomic JSON) → SVG export (no overlay leakage) → event log.

## Status model
`NOT STARTED → DESIGNING → IMPLEMENTING → TESTING → BLOCKED → READY → COMPLETE → REGRESSION` — see `STATUS.md`.

## Immediate next units (documented, not skipped)
1. **WASM bridge** (wasm-bindgen): core → `ui/src/engine/client.ts` live wiring (IMP-DEC-002).
2. Canvas/WebGL renderer consuming `RectItem` list.
3. Pointer input → tool gestures → commands.

## Manual test checklist (vertical slice)
1. `cargo run` → prints create/draw/move/keyframe/interp/undo/redo/export/save-load steps.
2. Verify `[5]` interpolated x ≈ 216.67 (linear between frame 1 and 10).
3. Verify `/tmp/out.svg` has exactly background + one content rect (no selection overlay).
4. Verify `[9]` save→load round-trip prints nodes=1, scenes=1.
5. `npm test` → 0 dead buttons, engine state honest ("not attached"), undo click reports blocker.
