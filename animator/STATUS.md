# IMPLEMENTATION STATUS (Phase 4)

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md |
| Rust core — doc/frame/selection/xfr/command/persist/export/eval | MOD-DOC/FRAME/SELECTION/XFR/COMMAND/PERSIST/EXPORT | COMPLETE | 10 cargo tests (run on PC/CI) |
| CLI demo (offline manual test) | — | COMPLETE | cargo run |
| UI shell + control registry + dev panel | MOD-SHELL/UI | COMPLETE | 6 vitest tests |
| Tauri desktop config | MOD-SHELL | READY(config) / BLOCKED(run: sandbox webkit) | desktop/src-tauri/ |
| **WASM bridge (core ↔ UI)** | MOD-INPUT/BRIDGE | **IMPLEMENTING (this commit)** | core/src/wasm.rs + ui/src/engine/client.ts |
| CI (GitHub Actions) | MOD-TEST | **READY (file) / BLOCKED (push: token needs `workflow` scope)** | .github/workflows/ci.yml |
| Canvas/WebGL renderer consuming RectItem | MOD-RENDER | NOT STARTED | next unit |
| Pointer→tool gestures → commands | MOD-INPUT | NOT STARTED | |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |

## Blockers
- **CI workflow push**: the PAT lacks `workflow` scope → `.github/workflows/ci.yml` is ready in the workspace but cannot be pushed by this token. Fix: (a) send a new PAT with `repo` + `workflow` scope, or (b) on your PC copy `.github/workflows/ci.yml` into the repo and `git push` (your git credentials allow workflow files).
- **Tauri run in AI sandbox**: webkit2gtk system libs absent (IMP-DEC-007). Engine+UI build/test in CI; desktop runs on the user's Linux PC.
- **wasm-pack bundling**: needs `wasm-pack` installed (user PC or CI later). `cargo build --target wasm32-unknown-unknown` in CI verifies the facade compiles without it.

## Next units (order)
1. ~~WASM bridge~~ → verify via CI + user `npm run wasm`.
2. Canvas renderer (draw `RectItem[]`, selection box overlay, viewport zoom/pan).
3. Pointer input → tools → commands (draw rect with mouse, select, move).
4. Layers panel UI + Properties panel UI (context binding).
5. Shape system (merge model), more tools, symbols… (Phase-3 P2+).
