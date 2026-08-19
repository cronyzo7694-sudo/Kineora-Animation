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
npm test               # 9 UI tests (dead-button registry + shell + wasm-path regression)
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
The UI talks to the core **only** through `ui/src/engine/client.ts`, which dynamically imports the generated package at the **canonical URL `/wasm/kineora_core.js`**. That package is built by `scripts/build-wasm.sh` (invoked via `npm run wasm`) into the **absolute canonical directory `animator/ui/public/wasm/`** — the script computes paths from its own location, so it is cwd-independent. `public/` is served at the site root by Vite in dev and copied to `dist/` in production. Facade API (`core/src/wasm.rs`): `kineora_new / draw_rect / select_at / select_all / clear_selection / move_selection / set_playhead / insert_keyframe / undo / redo / evaluate / export_svg / save / load / status`. All values cross as JSON. If the bundle isn't built, the UI reports an honest "not attached" state naming the exact path tried — never a fake control. Two regressions guard the contract: `wasmLoader.test.ts` (npm script ↔ loader URL) and `scripts/verify-wasm-path.sh` (proves the generator writes to the canonical dir, using a fake wasm-pack).

## CI (GitHub Actions)
Every push/PR runs: `cargo fmt --check`, `cargo clippy`, `cargo test`, `cargo build --target wasm32-unknown-unknown` (verifies the wasm facade), `npm ci && npm test && npm run build`. Check the Actions tab.

## Manual test checklist (vertical slice 1)
1. `cd core && cargo test` → 10 acceptance tests green.
2. `cargo run` → prints create/draw/move/keyframe/interp(≈216.67)/undo/redo/export/save-load steps; check `/tmp/out.svg` has exactly background + one content rect (no overlay).
3. `cd ui && npm run wasm && npm ci && npm run dev` → Dev Panel shows `engine: attached`; toolbar Undo/Redo/Save/Export/Keyframe bound to real engine calls.
4. Draw → select → move → undo → redo → save → reload → export — every action changes the Dev Panel event log.

## Status
See `STATUS.md`. Current unit: **WASM bridge** (this commit).
