# Kineora Animation — Deep Code Review

**Repo:** `cronyzo7694-sudo/Kineora-Animation` · **Branch:** `main` · **37 commits** · **Reviewed:** 2026-08-21
**Review method:** full clone + line-by-line read of the Rust core (`core/src/*`), the WASM facade, and the UI shell/engine client; plus running both test suites to *verify* the claims instead of trusting the README.

---

## 1. What this is

An **original, Adobe-Animate-class 2D animation editor** (Flash/Animate workalike), built from scratch from a 36-part functional blueprint. The whole project is heavily documentation-driven: a Phase-1 blueprint (36 files), Phase-2 deep research (405 features, ~107 folders), Phase-2.5 UI contracts (38 contracts), and Phase-3 engineering spec (20 files). The *actual code* is the `animator/` folder — a "Phase 4" vertical-slice implementation.

The stated goal is **offline-first, Linux-first**, cross-platform (desktop via Tauri v2, browser via WASM).

---

## 2. Architecture (verified)

```
animator/
  core/      Rust engine → WASM (cdylib) + native CLI.  The single source of truth.
  ui/        React 18 + TypeScript + Vite.  Talks to core ONLY via engine/client.ts.
  desktop/   Tauri v2 shell (Linux-first, needs webkit2gtk).
  scripts/   dev.sh · test.sh · build-wasm.sh · push.sh · ensure/verify helpers.
docs/        BUGS.md · TEST_REPORT.md (currently only templates/logs).
```

The split is clean and disciplined:

- **Rust owns everything stateful** — document model, timeline, selection, transforms, keyframes, tweens, symbols/library, undo/redo. Zero React-side document state (the Layers panel is explicitly "a projection of the engine's real layer list, no duplicate React state").
- **WASM bridge is JSON-in/JSON-out** — every call crosses as a JSON string; `client.ts` is the *only* door (IMP-DEC-002).
- **UI is pure projection + gestures** — it polls `kineora_status()` and draws `<canvas>`; render previews (selection box, live color preview, rect preview) are editor-only and *never* leak into `evaluate()`/export.

---

## 3. The Rust core — what's actually there (read line-by-line)

### `model.rs` (393 lines) — data model
- `Settings` (1920×1080 @ 24fps, `#ffffff` default), `Transform` (x/y/scale_x/scale_y/rotation/skew/pivot — note **skew & pivot fields exist but are not tweened/composed** yet), `Node` enum = `Rect | SymbolInstance`, `Frame` enum = `Keyframe { content, transforms, label } | Blank`, `Layer` (sparse `BTreeMap<u32, Frame>` keyframes + classic-tween spans), `Scene`, `Document` (settings, scenes, `nodes` map, `library: Vec<Symbol>`, `next_id`).
- Sparse "hold rule" timeline: only keyframes are stored; `content_at(frame)` walks `range(..=frame)` to find the nearest keyframe/blank. Clean.
- `ensure_keyframe` implements F6 "copy previous content" semantics.
- IDs are stable (REQ-SYS-004); `next_id`/`alloc_*_id` are monotonic counters.

### `command.rs` (2077 lines) — undo/redo engine
This is the heart. **Every mutation is a `Command`** with `apply`/`revert` (REQ-SYS-002). `History` holds `undo`/`redo` `Vec<Box<dyn Command>>`; redo is invalidated on new command. Commands are **bit-exact** — most snapshot full `BTreeMap<u32, Frame>` before/after, so undo is exact even for auto-created keyframes.

Commands implemented (25+):
- `DrawRect`, `MoveSelection`, `TransformSelection`, `SetNodeProps`, `SetDocumentSettings`
- Keyframes: `InsertKeyframe` (F6), `InsertBlankKeyframe` (F7), `ClearKeyframe` (Shift+F6), `InsertFrames` (F5), `DeleteFrames` (Shift+F5), `MoveKeyframe`, `DuplicateKeyframe`, `MoveKeyframeSequence`, `ResizeSpan`, `DuplicateFrames`, `ConvertToKeyframes`, `ConvertToBlankKeyframes`, `SetFrameLabel`
- Frames: `RemoveFrames`, `PasteFrames`, `ReverseFrames`
- Tweens: `SetClassicTween`, `RemoveClassicTween`
- Layers: `CreateLayer`, `DeleteLayer`, `RenameLayer`, `SetLayerVisible`, `SetLayerLocked`, `ReorderLayer`
- Symbols: `ConvertToSymbol` (F8), `CreateSymbol`, `PlaceSymbol`, `RenameSymbol`, `DeleteSymbol`, `SwapInstance`, `SetInstanceLoop`

**Notable correctness details** (the good kind):
- Tween anchors are kept in sync with frame-shift ops via `shift_tweens`/`drop_tweens_at` — deleting/moving keyframes correctly breaks or relocates tween spans.
- `MoveSelection`/`TransformSelection` are **layer-aware**: they resolve each node's *own* layer (via `node_layer_index`), so cross-layer marquee/Select-All moves land on the right layer.
- "Before" transform for a move is the node's *interpolated* transform (not the nearest keyframe override), so dragging an animated object never jumps.
- `MoveKeyframeSequence`, `ResizeSpan`, `DuplicateFrames` all sort the shift order (descending for right-shifts, ascending for left-shifts) to avoid keyframe collisions.

### `session.rs` (1553 lines) — controller + guards
`Session` owns the `Document` + `History` + view state (selection, playhead, active scene/layer, event log, frame clipboard). Every public method does **guard-first validation** (locked/hidden layer, collision, empty selection, zero-delta) and returns `bool`/`NodeId(0)` on no-op — so a blocked action produces **no command and no undo entry**. This "no-op = no history pollution" discipline is consistent and tested.

Layer semantics: create above active, delete blocked on last layer, eye = not rendered/selectable/exported, lock = renders but not selectable/editable (skipped by Select All, still exported). Selection is pruned when a layer is hidden/locked or its nodes get orphaned.

### `eval.rs` (623 lines) — rendering + hit-testing
- `evaluate()` recursively flattens layers + nested symbol instances into a flat `Vec<RectItem>` (fill/stroke rects with rotation). Depth-capped at `MAX_DEPTH = 32` (RSK-002).
- `instance_child_frame` implements the Animate loop semantics: Graphic syncs to parent clock (Loop / PlayOnce / SingleFrame + first-frame); MovieClip runs a free clock (`(parent-1) % dur + 1`); Button = frame 1.
- `compose_transforms` is a *rigid* approximation (rotations add, scales multiply) — **documented limitation**: non-uniform scale + rotation skew is not exact (no shear in the model).
- Hit-testing recurses *into* instances (inverse-transformed point) but returns the **outermost** instance id; empty symbols fall back to a deterministic 24×24 selection marker (`EMPTY_INSTANCE_MARKER`) that never reaches render/export.

### `wasm.rs` (911 lines) — the bridge
`thread_local RefCell<Option<Session>>` singleton. ~50 `#[wasm_bindgen]` fns, all JSON-string args/returns. `kineora_status()` serializes a `StatusOut` (playhead, selection rects + details, layers with keyframe/tween markers, undo/redo lens, fps, doc size, duration, event log) — the UI's polling source. `kineora_save/load` (native path) + `kineora_project_json/load_json` (browser) both exist.

### `easing.rs`, `export.rs`, `persist.rs`, `id.rs`
Penner easing + classic ease (`ease_classic`), SVG export (content pass only, overlays excluded — REQ-EXP-002), serde-JSON persistence, newtype ID wrappers.

---

## 4. The UI (read: `App.tsx`, `client.ts`, key components)

- **`engine/client.ts`** — clever WASM loader: Vite `public/` can't be `import()`ed as a source module, so it **fetches the glue as text → evaluates via Blob URL → fetches `.wasm` explicitly** and passes it to the wasm-bindgen default init. Works identically in dev/build/Tauri. Honest "not attached" error naming the exact URL + build command (no fake features).
- **`App.tsx`** — shell: toolbar, layers panel, stage, right dock (Properties → Library → Debug), timeline, status bar. Panel resizing is C-06-compliant (6px edges, min-clamp never-zero, Esc cancels). Layout persists to `localStorage` (never the project file).
- Polls `statusJson()` every **120ms** — the "honest refresh mechanism" since the bridge is synchronous.
- Undo/redo/F8/Ctrl+F8/Ctrl+Alt+T are global key handlers that skip when a text input is focused.

---

## 5. Verified by running (not just reading)

| Suite | Result |
|---|---|
| Rust `cargo test` (native) | ✅ **214 passed, 0 failed** (README claims 203→214 — matches) |
| UI `npm test` (vitest + React Testing Library) | ✅ **277 passed, 15 files** (README claims 253→277 — matches) |

`cargo fmt/clippy` and `cargo build --target wasm32` I did **not** run (wasm32 target + clippy would need extra setup), but CI is claimed to gate them. The test discipline is genuinely strong: `tests/` has 16 integration test files covering document, draw, export, frames, frames_seq, layers, properties, sequences, slice, symbols, symbols_usability, timeline, transform, transform_selection, tween — with adversarial cases (undo bit-exactness, locked-layer blocking, cross-layer selection, tween breakage on delete).

---

## 6. Strengths (what's impressive)

1. **Extraordinary process discipline.** Five phases of docs with cross-referencing IDs (REQ-*, CMD-*, IMP-DEC-*, RSK-*, C-*, F-0x-*, Part NN §N.N) that map spec → code → tests. The commit messages themselves are mini-reports.
2. **Honest-failure philosophy.** No fake UI state: if WASM isn't built, the UI says so with the exact URL + command; the Library panel distinguishes "engine unattached" vs "build out of date" vs "genuinely empty".
3. **Command/undo correctness is a first-class concern**, not an afterthought — every command snapshots exact before-state; "no-op → no undo entry" is enforced at the Session layer.
4. **Renderer/editor separation is airtight** — overlays, selection boxes, live previews are structurally incapable of leaking into SVG export or save (REQ-EXP-002), and this is tested.
5. **Clean Rust** — no unsafe, no panics in the hot paths, `expect("layer exists")` used sparingly after existence checks, idiomatic `BTreeMap` for ordered sparse timelines.

---

## 7. Findings, gaps & risks (honest notes)

**Minor issues found while reading:**
1. **Dead-ish output `selection_rects`** in `kineora_status()`: it calls `evaluate(playhead)` and filters by selected ids on *every* 120ms poll, but the live UI (`Stage.tsx`, `canvasRenderer.ts`) builds the overlay from **`selection_details`**, not `selection_rects` (grep confirms `selection_rects` is referenced only in test fixtures + the type). Wasteful per-poll `evaluate()` + JSON, and a subtle correctness trap: flattened `RectItem`s carry *inner* node ids, so an instance id would never match here anyway. Recommend removing or repurposing.
2. **120ms full-status poll re-serializes everything** (all layers, all keyframe markers, event log, selection details) and JSON-parses it 8×/sec. Fine at slice scale, but a scalability ceiling for large timelines — a dirty-flag / event bus (which Phase-3 even specs) would be the natural next step.
3. **`registration` field on `Symbol` is effectively vestigial** — `convert_selection_to_symbol` computes it (`reg_x - minx`), but the actual re-basing in `ConvertToSymbol::apply` uses the instance's `transform.x/y` instead. It's documented "informational", so not a bug — just duplicated/underused state that could drift.
4. **`DeleteSymbol` undo = full `Document` clone** (`prev_doc`). Correct and exact, and honestly commented ("rare, exact") — but memory-heavy; a targeted revert would be cleaner.
5. **`apply_node_props` allows w/h = 0** (`.max(0.0)`); a 0×0 rect is invisible *and* unhittable, which can strand a node that's then only reachable via undo. Minor UX edge case.
6. **Skew/pivot fields exist in `Transform` but are inert** — not tweened (`lerp_transform` copies them from `a`), not composed meaningfully (`compose_transforms` sets them from `child`). They're carried for future use, so not wrong, just latent.

**Broader gaps (all explicitly documented in STATUS.md as "not yet"):**
- Motion tween (Part 09.1), shape tween, drawing tools beyond rect (oval/line), shape-merge model.
- Symbol **edit-in-place / breadcrumb**, Break Apart, Duplicate Symbol, folders/search, frame picker, button states.
- Onion skin, camera, audio, lip-sync, bone/IK, character rigging (Release 2+).
- Object-level lock/hide, draggable pivot, tool-options schema.
- Export beyond SVG (sequence/GIF/video encoders).

**Operational blockers (self-reported):**
- CI workflow can't be pushed (PAT lacks `workflow` scope).
- Tauri desktop can't run in the AI sandbox (webkit2gtk absent) — desktop runs on the user's Linux PC.

**Process nit:** `docs/BUGS.md` and `docs/TEST_REPORT.md` are only templates (no entries logged yet); the README embeds huge manual acceptance matrices that arguably belong in `TEST_REPORT.md` to keep the README navigable.

---

## 8. Bottom line

This is a **well-engineered, unusually disciplined vertical slice** of an ambitious project. The *foundation* (document model, sparse timeline, command/undo, selection, transform, classic tween, layers, symbols/library, WASM bridge, SVG export) is real, verified (214 + 277 tests green), and consistently honest about what it does and doesn't do yet. The main engineering risks going forward are (a) the per-poll status serialization as scenes grow, (b) the rigid transform composition when non-uniform scale + rotation interact, and (c) keeping the five-phases-of-docs and the code from drifting apart as features accelerate.

**Immediate next units (per the project's own roadmap):** motion tween → symbol edit modes/Break-Apart → drawing tools + shape-merge → object lock/hide + draggable pivot → onion skin/camera/audio.
