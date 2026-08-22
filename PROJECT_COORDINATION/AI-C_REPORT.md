# AI-C REPORT — Kineora Animation Implementation Worker

- **Role:** AI-C (parallel implementation worker)
- **Ownership assigned:** SYS-15 · SYS-16 · SYS-17 · SYS-18 · SYS-19 · SYS-20 · SYS-21
- **Branch:** `main` · **Base commit:** `e3690f767f7b7a5d97577a021de19ac3eef19b53` (HEAD at start)
- **This turn's deliverable:** SYS-16 (Layers) — outline mode, duplicate layer, Alt+click batch toggles, state indicators + timeline hidden marker. Implementation committed as **`d94466a`**; this report is the follow-up commit.

---

## 0. MANDATORY-READING REGISTRATION (forensic honesty — DO NOT SKIP)

The assignment lists ten mandatory files: `AI01_FORENSIC_LESSONS.md`, `PROJECT_COORDINATION/MASTER_EXECUTION_PLAN.md`, `FOUNDATION_CONTRACT.md`, `CROSS_SYSTEM_CONTRACT.md`, `AI_ASSIGNMENTS.md`, `PROJECT_BOARD.md`, `DECISIONS.md`, `BLOCKERS.md`, `INTEGRATION_LOG.md`, `CHANGELOG.md`.

**None of these files exist in the repository** (verified against `git ls-files` at base `e3690f7`; the `PROJECT_COORDINATION/` directory does not exist). Per the forensic rule ("if source evidence does not define behavior — DO NOT GUESS; register a blocker/decision"), this is registered as:

> **BLOCKER AI-C-001 (documentation):** the coordination corpus referenced by the AI-C assignment is absent from the repo. This report is the first `PROJECT_COORDINATION/` artifact. Other AIs (AI-A/AI-B/AI-D) must create their own reports here; AI-01's final audit should reconcile against the actual docs instead of the assumed names.

Actual authoritative sources read this turn (repo truth):
1. `KINEORA_AI1_CONTINUITY_HANDOFF.md` (Sections 1–26; §9 warns "never trust this doc over the live repo" — the repo has since advanced SYS-02 through H14, so the handoff's SYS-02 status is stale by design).
2. `ANIMATE_BLUEPRINT_MASTER.md` (460 KB blueprint; Part 07/11/12/20/33 referenced).
3. `phase2-knowledge-base/deep-research/F-07-02_layer_row_controls`, `F-20-01_layer_model_lifecycle` (the authoritative forensic specs for this unit).
4. `phase2.5-ui/01_UI_CONTRACT_QUEUE.md` + `contracts/C-22_layers_masks.md` (status marked UI COMPLETE for the contract-doc; actual panel implementation is what this unit extends).
5. `engineering/00_engineering_decisions.md`, `animator/00_IMPLEMENTATION_DECISIONS.md`, `animator/STATUS.md`, `docs/TEST_REPORT.md`, `docs/BUGS.md`.

Authority chain honored: **Blueprint → forensic spec (F-xx) → design decisions → Adobe evidence → inference**. Where the F-07-02 evidence was internally inconsistent, the resolution was registered as an explicit decision (see §4), never silent.

---

## 1. SYSTEM IMPLEMENTED THIS TURN

**SYS-16 (Layers)** — forensic increments backed by **F-07-02** (layer row controls: eye/lock/outline columns, Alt+click "all others", red-X hidden indicator E4, pencil/slash E7, Layer-Properties outline color E6) and **F-20-01/02/03** (layer model fields, duplicate = deep copy, state-toggle matrix).

1. **Outline mode** — `Layer.outline` + `Layer.outline_color` (serde defaults → old files load unchanged). New undoable commands `SetLayerOutline`, `SetLayerOutlineColor` + WASM facades `kineora_set_layer_outline`, `kineora_set_layer_outline_color`. Layers panel: **outline swatch column** (double-click = inline color picker — E6 "Layer Properties → outline color", one command per editing session, Esc cancels).
2. **Outline rendering (view aid, F-20-03)** — the STAGE draws outline-mode layers **strokes-only in the layer outline color**: `RectItem.outline_color` threaded through `collect_items` and **propagated through symbol instances** (an outline scene layer outlines its nested content too). The SVG export and the export rasterizer **ignore the flag** → outline layers export FULLY per F-20-03.
3. **Duplicate layer (F-20-02 "deep copy frames+content")** — `DuplicateLayer` command + `Session::duplicate_layer()`: fresh LayerId, every content node cloned under a new NodeId (`Node::with_id`), keyframes/tweens/labels/flags copied, copy inserted **above** the source and becomes active, one undo step, undo/redo exact. Animate-style naming: `arm` → `arm copy` → `arm copy 2`. Header `⧉` button in the Layers panel.
4. **Alt+click "all others" batches (F-07-02 E1/E2/E3)** — Alt+click eye/lock/outline flips that flag on every OTHER layer as **ONE undo step** (new `SetLayerFlags` batch command storing explicit before/after vectors). **M.3 rescue:** when every layer is hidden, Alt+click the eye shows ALL layers.
5. **State indicators (F-07-02 E4/E7)** — red ✕ on hidden layers (Layers panel + Timeline strip row), pencil ✎ on the active row, pencil-with-slash ⊘ when the active layer is locked/hidden.
6. **Timeline (SYS-15) touch** — hidden-layer red ✕ marker in the timeline layer-name column (F-07-02 E4). No other SYS-15 changes this turn.

---

## 2. FILES CHANGED

**Rust engine (`animator/core`):**
- `src/model.rs` — `Layer.outline` / `Layer.outline_color` (+`default_outline_color`), `Node::with_id`, 1 literal updated.
- `src/command.rs` — new commands: `SetLayerOutline`, `SetLayerOutlineColor`, `SetLayerFlags` (+`LayerFlagKind`), `DuplicateLayer`; `collect_items` call updated.
- `src/session.rs` — `set_layer_outline`, `set_layer_outline_color`, `batch_flag_toggle` (+ `toggle_other_layers_visible/locked/outline`), `duplicate_layer`, `next_copy_name` + `strip_copy_suffix`; 3 literals updated.
- `src/eval.rs` — `RectItem.outline_color`; `collect_items(…, outline)` threading incl. symbol recursion; `compose_rect_item` preserves it; hit-test paths set `None`.
- `src/wasm.rs` — `LayerOut.outline/outline_color`; facades `kineora_set_layer_outline(_color)`, `kineora_toggle_other_layers_visible/locked/outline`, `kineora_duplicate_layer`.
- `tests/layers.rs` — 12 → **27 tests**.

**UI (`animator/ui`):**
- `src/engine/wasmTypes.ts` — `LayerJson.outline/outline_color`, `RectItemJson.outline_color`, `KineoraWasm` facade signatures.
- `src/engine/client.ts` — wrappers `setLayerOutline(_Color)`, `toggleOtherLayersVisible/Locked/Outline`, `duplicateLayer`.
- `src/components/LayersPanel.tsx` — outline column + color editor, Alt+click batches, red ✕, ✎/⊘ indicators, duplicate button.
- `src/components/TimelineStrip.tsx` — hidden-layer ✕ marker.
- `src/render/canvasRenderer.ts` — stroke-only outline rendering in the editor `render()`; `renderContent` untouched.
- `src/components/LayersPanel.test.tsx`, `src/components/TimelineStrip.test.tsx`, `src/render/canvasRenderer.test.ts` — +13 tests.

**Docs:** `animator/STATUS.md` (unit row + "This commit" section) · `PROJECT_COORDINATION/AI-C_REPORT.md` (this file).

---

## 3. SOURCE EVIDENCE

| Feature | Authority | Key evidence |
|---|---|---|
| Outline column + Alt+click outline | F-07-02 E3, F-20-03 | "Outline column = toggle outline mode (colored square = layer outline color); Alt+click = all others as outlines" |
| Outline color via dbl-click | F-07-02 E6 | "double-click the layer icon → Layer Properties (outline color)" |
| Outline render/export matrix | F-20-03 | "Outline: Rendered=outlines, Selectable=yes, Editable=yes, Exported=fully" |
| Duplicate layer | Part 20.1 / F-20-02 | "Duplicate = deep copy (frames+content)"; lifecycle ops table |
| Alt+click eye/lock | F-07-02 E1/E2, M.3 | "Alt/Option+click = hide all others"; "Alt+click eye with all hidden → shows all" |
| Red X hidden / pencil+slash | F-07-02 E4 / E7 | "red X next to layer name = hidden indicator"; "pencil + slash = active layer is locked/hidden" |
| Layer model fields | F-20-01 | `{visible, locked, outline, outlineColor, …}`; default outlineColor `#ff0000` |

---

## 4. DECISIONS USED (all registered, none silent)

1. **Alt+click = TOGGLE (flip) all others** for eye/lock/outline [INFERENCE from the F-07-02 evidence table "toggle all OTHERS" + M.3; the E1/E2 prose "hide/lock all others" describes the common case].
2. **M.3 rescue scope** — the "all hidden → shows all" behavior fires only when *literally every layer* is hidden; the clicked layer joins the batch in that case [OUR DESIGN DECISION, registered in `session.rs` doc comment].
3. **Duplicate naming** — stem-strip `" copy"`/`" copy N"` so duplicating a copy keeps counting (`arm copy 2`), Animate-style [OUR DESIGN DECISION; Adobe reference].
4. **Layer lifecycle/state ops stay panel-owned** (no command-registry entries), consistent with the pre-existing create/delete/rename/visibility/lock pattern [matches existing architecture; registry lint untouched].
5. **Outline color picker = inline `<input type=color>`** as the minimal faithful Layer-Properties outlet for this unit; a full Layer Properties dialog is out of scope (deferred) [INFERENCE].
6. **`kineora_duplicate_layer` returns the new index; 0 = blocked** (a successful duplicate always lands at index ≥ 1) [OUR DESIGN DECISION].

## 5. UNRESOLVED BLOCKERS / DEFERRED (honest)

- **BLOCKER AI-C-001** — coordination docs absent (see §0). Needs AI-01/user reconciliation.
- **Deferred (not in this unit, spec-registered):** full Layer Properties dialog (F-07-02 E6 beyond color) · layer folders + cascade (E8/E9) · drag-through-column multi-toggle (E1/E2 "drag through") · Shift+eye transparent mode (E5) + numeric layer opacity (L.2) · outline-mode on *symbol-timeline* layers is modeled but not UI-exposed · delete-with-dependents prompt (F-20-02; no masks/guides exist yet) · object-level lock/hide · SYS-15..21 remainder (Timeline/Properties/Library/Symbols/Drawing/Color forensic increments) — untouched this turn, per the depth-over-breadth rule.
- **Manual acceptance:** NOT run by the user (native desktop QA is user-side; Linux Mint webkit2gtk status remains UNVERIFIED per handoff §15 — unchanged by this work).

## 6. TESTS / BUILDS / RUNTIME (all run in-sandbox, all green)

| Gate | Command | Result |
|---|---|---|
| Rust unit/integration | `cargo test` | 20 suites ok (0 failed); layers.rs 27/27 |
| Rust lint | `cargo fmt --check` | clean |
| Rust clippy | `cargo clippy --all-targets` | 0 warnings |
| WASM facade | `cargo build --target wasm32-unknown-unknown` | ok |
| WASM package | `wasm-pack build` (`npm run wasm`) | ok — new facades exported (`kineora_duplicate_layer`, `kineora_set_layer_outline(_color)`, `kineora_toggle_other_layers_*`) |
| WASM path regression | `scripts/verify-wasm-path.sh` | PASS |
| UI tests | `npm test` | **606 passed** (was 593 → +13) |
| UI typecheck+build | `npm run build` (tsc + vite) | ok |

Baseline at base commit was verified green before changes (Rust ✓, UI 593/593), so the +13 are additive.

## 7. INTEGRATION DEPENDENCIES (cross-system)

- **SYS-15 (Timeline):** timeline hidden ✕ marker only; frame ops untouched.
- **SYS-17 (Properties):** unaffected (outline editing lives in the Layers panel per F-07-02, which targets the layer list).
- **SYS-19 (Symbols):** outline propagation reuses symbol evaluation; no symbol-model change.
- **SYS-28 (Persistence):** new `Layer` fields are serde-defaulted → old files load; new files round-trip (tested).
- **SYS-27 (Export):** SVG + raster export output byte-identical for outline layers (proven by tests: outline color never leaks).
- No `.gitignore`/generated-file changes (wasm artifacts remain untracked by design).

## 8. COMMIT HASHES

- **AI-C implementation commit:** `d94466a` (parent `e3690f7`).
- **AI-C report commit:** this file (see `git log` for its hash).
- Pushed to `origin/main`. No force-push, no destructive reset, no rewrite of other AIs' commits.

## 9. KNOWN RISKS

1. **Outline stroke width** is fixed at 1 doc unit (view detail; F-20-03 doesn't specify) — adjust after user QA if it looks off.
2. **Alt+click toggle semantics** are an inference (§4.1) — flag for user confirmation during manual QA.
3. **`collect_items` grew to 8 params** — a documented `#[allow(clippy::too_many_arguments)]`; refactor into an options struct if the recursion payload grows again.
4. **Batch toggles are one undo step**, but a *sequence* of separate Alt+clicks remains separate undo entries (expected).
5. WASM glue is regenerated at runtime from `npm run wasm`; the sandbox build validated facade names, but final runtime check is user-side (native desktop / browser dev).
6. Parallel-AI race: only `main` exists; if AI-A/AI-B/AI-D push concurrently, `git pull --rebase` before the next AI-C turn (this push succeeded without conflict at time of writing).

---

*Report complete. AI-C hands off to AI-01 for final integration + forensic audit.*
