# IMPLEMENTATION STATUS (Phase 4)

| Unit | Module(s) | Status | Evidence |
|---|---|---|---|
| Tech baseline verification | — | COMPLETE | 00_IMPLEMENTATION_DECISIONS.md (IMP-DEC-001..007) |
| Rust core — document model + sparse timeline | MOD-DOC/MOD-FRAME | COMPLETE | cargo test: new_document_has_scene_layer_keyframe, keyframe_and_linear_interpolation |
| Rust core — selection + hit test | MOD-SELECTION/MOD-HITTEST | COMPLETE | select_at_hit_tests_top_first, locked_layer_skips_hit_test |
| Rust core — transform + move command | MOD-XFR | COMPLETE | move_then_undo_redo |
| Rust core — command/undo/redo | MOD-COMMAND | COMPLETE | move_then_undo_redo, undo_stack_unchanged_by_selection_and_playhead |
| Rust core — persistence (atomic JSON) | MOD-PERSIST | COMPLETE | save_load_round_trip |
| Rust core — SVG export (no overlays) | MOD-EXPORT | COMPLETE | export_svg_contains_content_not_overlays |
| Rust core — playback determinism | MOD-TIMELINE (eval) | COMPLETE | playback_deterministic |
| CLI demo (offline manual test) | — | COMPLETE | cargo run output (10 steps) |
| UI shell + control registry + dev panel | MOD-SHELL/UI | COMPLETE | npm test: 6/6 (zero dead buttons) |
| Tauri desktop config | MOD-SHELL | READY (config) / BLOCKED (run: sandbox lacks webkit2gtk) | desktop/src-tauri/ |
| **WASM bridge (core ↔ UI)** | MOD-INPUT/BRIDGE | NOT STARTED | next unit — IMP-DEC-002 |
| Canvas/WebGL renderer | MOD-RENDER | NOT STARTED | consumes RectItem |
| Pointer→tool gestures | MOD-INPUT | NOT STARTED | |
| Drawing/shapes/symbols/tweens/rig/IK/audio/lipsync | (later slices) | NOT STARTED | Phase-3 build order P3–P6 |

## Blockers
- **Tauri run** in this sandbox: webkit2gtk system libs not installed (IMP-DEC-007). Engine + UI fully build/test here; desktop shell builds on a Linux desktop with webkit deps.
- **UI↔core live wiring**: awaiting wasm-bindgen glue (documented next unit; UI currently reports "core not attached" honestly — no fake controls).
