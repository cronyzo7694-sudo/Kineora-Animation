# 00_IMPLEMENTATION_DECISIONS

## Tech baseline verification vs Phase-3
Phase-3 ENG-001 chose "single TS codebase (Canvas/WebGL) + PWA/Tauri wrappers". Phase-4 baseline mandates **Rust core + TypeScript/React UI + Tauri shell + WebGL/Canvas rendering**. This is a change → recorded here, not silent.

| ID | Decision | Rationale | Trade-off |
|---|---|---|---|
| IMP-DEC-001 | **Rust core** owns document model, evaluation, command/undo, tween/IK/audio/lipsync/export engines; **React+TS** owns UI (panels/overlays/responsive) per Phase-2.5 contracts | Phase-3 modules are pure/deterministic/offline → map 1:1 to a native crate; Rust gives memory-safety + speed + a single native lib reusable by Tauri desktop + future platforms | UI↔core bridge required (below) |
| IMP-DEC-002 | **Bridge = Rust→WASM (wasm-bindgen) for synchronous engine calls** (document model + evaluate + commands, called per frame) + **Tauri native commands for heavy async jobs** (audio decode, lipsync, export encoding) | 60fps playback needs synchronous `evaluate`; heavy jobs need real threads; both stay offline | two binding surfaces; WASM threads still limited (hence jobs→native) |
| IMP-DEC-003 | **IDs = typed u64 newtypes** (`NodeId/LayerId/SceneId`), opaque; monotonic counter in Document | stable, deterministic, rename-safe (REQ-SYS-004); no uuid dependency; newtype isolates future change to real UUIDs | — |
| IMP-DEC-004 | **Sparse timeline = `BTreeMap<u32, Frame>`** (frame# → keyframe/blank); held frames derived by range lookup | REQ-TIM-001 (sparse + hold rule) exactly; O(log n) | — |
| IMP-DEC-005 | **Slice-1 export = SVG** (pure, deterministic, zero deps); PNG/sequence/GIF/video in later slices via native encoder jobs | proves authoring=export + overlay-clean now; PNG needs encoder dep | deferred formats |
| IMP-DEC-006 | **Slice-1 interpolation = linear position lerp** across two keyframes holding the same node (classic-tween seed); per-keyframe transform overrides stored in `Frame::Keyframe.transforms` | smallest honest keyframe+tween seed; grows into MOD-TWEEN | — |
| IMP-DEC-007 | **Tauri shell config provided now; sandbox cannot run it** (needs webkit2gtk system libs) → desktop run is user-side; Linux-first confirmed (target x86_64-unknown-linux-gnu) | deliverable split: engine (cargo, testable here) + shell (config, user-run) | — |

## Status model (applied per unit)
`NOT STARTED → DESIGNING → IMPLEMENTING → TESTING → BLOCKED → READY → COMPLETE → REGRESSION` — COMPLETE only after acceptance tests pass.
