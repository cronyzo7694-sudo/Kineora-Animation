# AI-C REPORT — Kineora Animation Implementation Worker

- **Role:** AI-C (parallel implementation worker)
- **Ownership assigned:** SYS-15 · SYS-16 · SYS-17 · SYS-18 · SYS-19 · SYS-20 · SYS-21
- **Branch:** `main` · **Base commit:** `e3690f767f7b7a5d97577a021de19ac3eef19b53` (HEAD at start)
- **This turn's deliverable:** SYS-16 (Layers) — outline mode, duplicate layer, Alt+click batch toggles, state indicators + timeline hidden marker. Implementation committed as **`a562052`** (rebased onto `ca79555`; originally `d94466a`); this report + coordination updates are the follow-up commit (hash at push time — see `git log`).

---

## 0. MANDATORY-READING REGISTRATION + POST-CORPUS RECONCILIATION

### 0.1 Initial state (honest)
At session start (HEAD `e3690f7`) **none of the ten mandatory files existed in the repo** (verified via `git ls-files`). Registered as **BLK-AIC-001** → now **RESOLVED**: AI-01 committed the full corpus in `ca79555` (this report is the first `PROJECT_COORDINATION/` artifact from AI-C).

### 0.2 Post-corpus reconciliation (completed after `ca79555`)
After AI-01's push landed, this report's author **re-read the complete corpus in the assignment's order**:
1. `FORENSIC_SPECS/AI01_FORENSIC_LESSONS.md` (FL-0001..0034) — pre-flight completed; relevant lessons applied below.
2. `PROJECT_COORDINATION/MASTER_EXECUTION_PLAN.md`
3. `PROJECT_COORDINATION/FOUNDATION_CONTRACT.md`
4. `PROJECT_COORDINATION/CROSS_SYSTEM_CONTRACT.md`
5. `PROJECT_COORDINATION/AI_ASSIGNMENTS.md`
6. `PROJECT_COORDINATION/PROJECT_BOARD.md`
7. `PROJECT_COORDINATION/DECISIONS.md`
8. `PROJECT_COORDINATION/BLOCKERS.md`
9. `PROJECT_COORDINATION/INTEGRATION_LOG.md`
10. `PROJECT_COORDINATION/CHANGELOG.md`
Plus `FINAL_GATE_REPORT.md`, `HANDOFFS/README.md`, `FORENSIC_SPECS/00_SYSTEM_QUEUE.md`.

**Reconciliation verdict: NO implementation changes required.** The corpus confirms the SYS-16 increment's authorities (F-07-02/F-20 deep research = Phase-2 knowledge base; Blueprint Part 07/20) and introduces **no contradiction** with any implemented behavior. Audit points:
- **AI_ASSIGNMENTS.md** confirms AI-C = SYS-15..21; **animator/ code is implementation-worker territory** — this work is human-authorized (direct user order to implement + push; recorded in ATTENDANCE). A formal `HANDOFFS/SYS-15..21` package does not yet exist (BLK-AIC-002 — informational).
- **CROSS_SYSTEM_CONTRACT §B** ("Commands are the ONLY writer to MOD-DOC; panels never write directly") — satisfied: every panel action resolves to an engine **Command** (SetLayerOutline/SetLayerOutlineColor/SetLayerFlags/DuplicateLayer) via the client facade; no direct model mutation.
- **§D / FOUNDATION_CONTRACT MOD-BUS** — UI refresh rides the locked `document:changed{type:'layer'}` event (existing architecture). The `layer:changed` event listed in MASTER_EXECUTION_PLAN §C SYS-16 is **not implemented** → registered **BLK-AIC-003** (deferred; needs Leader INT before adding a locked event).
- **FL-0001 (scope)** — all added fields/controls are Layer-owned (F-07-02/F-20); the timeline ✕ is a view projection, filed as **INT-0009** (pending Leader).
- **FL-0019** — automated green ≠ acceptance: manual native-desktop QA remains **PENDING** (user-side).

### 0.3 Authority chain honored
**Blueprint → Phase-2 forensic specs (F-07-02/F-20-01..03) → engineering → approved decisions → Adobe evidence → inference.** Where the F-07-02 evidence was internally inconsistent, the resolution was registered as an explicit decision (§4), never silent. (Code is evidence only — FL-0017.)

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

- **BLK-AIC-001** — RESOLVED (corpus landed in `ca79555`; re-read + reconciled, §0.2).
- **BLK-AIC-002** — SYS-15..21 formal specs QUEUED + no `HANDOFFS/SYS-15..21` package; implementation runs on human order + Blueprint/Phase-2 authority (OPEN, informational; mirrors BLK-D-003/BLK-B-003).
- **BLK-AIC-003** — `layer:changed` locked event unimplemented (OPEN, deferred; refresh rides `document:changed`; needs Leader INT to add).
- **INT-0009** — timeline hidden-✕ = SYS-16 view projection (PENDING LEADER review).
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

- **AI-C implementation commit:** `a562052` (originally `d94466a`; clean-rebased onto AI-01's `ca79555`).
- **AI-C report/coordination commit:** this file + ATTENDANCE/BLOCKERS/INTEGRATION_LOG/CHANGELOG/PROJECT_BOARD updates (see `git log` at push time).
- Pushed to `origin/main`. No force-push, no destructive reset, no rewrite of other AIs' commits. A parallel AI-01 push (`ca79555`) was integrated via **rebase** (the prompt's "update before starting / never overwrite / never force-push" rule).

## 9. KNOWN RISKS

1. **Outline stroke width** is fixed at 1 doc unit (view detail; F-20-03 doesn't specify) — adjust after user QA if it looks off.
2. **Alt+click toggle semantics** are an inference (§4.1) — flag for user confirmation during manual QA.
3. **`collect_items` grew to 8 params** — a documented `#[allow(clippy::too_many_arguments)]`; refactor into an options struct if the recursion payload grows again.
4. **Batch toggles are one undo step**, but a *sequence* of separate Alt+clicks remains separate undo entries (expected).
5. WASM glue is regenerated at runtime from `npm run wasm`; the sandbox build validated facade names, but final runtime check is user-side (native desktop / browser dev).
6. Parallel-AI race: AI-01/AI-B/AI-D push concurrently to `main` (observed: AI-01's `ca79555` landed mid-turn → clean rebase). Always `git fetch && git rebase origin/main` before pushing (never force-push).

---

*Report complete. AI-C hands off to AI-01 for final integration + forensic audit.*
