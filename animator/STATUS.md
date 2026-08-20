# IMPLEMENTATION STATUS (Phase 4)

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md |
| Rust core — doc/frame/selection/xfr/command/persist/export/eval | MOD-DOC/FRAME/SELECTION/XFR/COMMAND/PERSIST/EXPORT | COMPLETE | 10 cargo tests (run on PC/CI) |
| CLI demo (offline manual test) | — | COMPLETE | cargo run |
| UI shell + control registry + dev panel | MOD-SHELL/UI | COMPLETE | 6 vitest tests |
| Tauri desktop config | MOD-SHELL | READY(config) / BLOCKED(run: sandbox webkit) | desktop/src-tauri/ |
| **WASM bridge (core ↔ UI)** | MOD-INPUT/BRIDGE | **READY (user-PC verified)** | core/src/wasm.rs + ui/src/engine/client.ts; Blob-URL loader + explicit wasm init |
| **Canvas renderer** | MOD-RENDER | **READY (viewport wiring done)** | viewport.ts + canvasRenderer.ts + Stage (zoom/pan/fit immediate redraw via vpVersion+rAF, autoscroll suppression, drag-end cleanup) |
| **Select + Move gestures** | MOD-INPUT/MOD-SELECTION/MOD-XFR | **IMPLEMENTING (this commit)** | ui/src/editor/gesture.ts + Stage select-tool pointer lifecycle + Rust MoveSelection interpolated-before fix + transform.rs tests |
| CI (GitHub Actions) | MOD-TEST | **READY (file) / BLOCKED (push: token needs `workflow` scope)** | .github/workflows/ci.yml |
| Canvas/WebGL renderer consuming RectItem | MOD-RENDER | NOT STARTED | next unit |
| Pointer→tool gestures → commands | MOD-INPUT | NOT STARTED | |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |

## Bug fixes (recent)
- **BUG-3: Vite public/ import error** — root cause: loader did `import('/wasm/kineora_core.js')`, but Vite forbids importing `public/` files as source modules. Fix: loader now fetches the glue as TEXT → evaluates via Blob URL (browser-native import) → fetches `.wasm` EXPLICITLY and passes it to the wasm-bindgen default init (never relies on `import.meta.url`). Single mechanism for dev + build + Tauri. Controls wired to real engine (undo/redo/keyframe/play/save/export). Verified: `npm test` 10/10, `npm run build` pass, Node runtime proof of text→eval→init→attached, public→dist copy confirmed.
- **BUG-2: WASM output directory wrong** — root cause: `wasm-pack --out-dir` is resolved RELATIVE TO THE CRATE DIR, so `--out-dir public/wasm` wrote `core/public/wasm` instead of `ui/public/wasm`. Fix: `scripts/build-wasm.sh` computes an ABSOLUTE canonical out-dir (`animator/ui/public/wasm`) from its own location (cwd-independent); `npm run wasm` delegates to it; stale `core/public` auto-removed; `scripts/verify-wasm-path.sh` regression proves the canonical dir with a fake wasm-pack. Verified: verify script PASS, `npm test` 9/9, `npm run build` pass.
- **BUG-1: WASM runtime attach failure** — root cause: loader path ≠ generated output name. Fix: canonical URL `/wasm/kineora_core.js` + regression test.

## Known gaps (out of scope for Select + Move; documented, not ignored)
- **Per-object lock / hide** (Arrange > Lock, per-object hide): only LAYER-level lock/hidden is honored by hit-test today. Object-level lock/hide belongs to a later unit (Phase 1 Part 03.7; per-object hide is [OUR DESIGN DECISION] P2).
- **Multi-select (Shift+click) / marquee**: not yet in the UI; the Rust `select_all` + single hit-test exist. Belongs to the next selection unit.

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
