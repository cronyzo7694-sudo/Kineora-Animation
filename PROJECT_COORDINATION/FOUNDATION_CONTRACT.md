# KINEORA — FOUNDATION CONTRACT (P0/P1)

> **This resolves FND-001.** The shared foundation modules, published as ONE owner-contract BEFORE the 4-AI split, so no AI invents its own event bus / command interface / document model.
> **Authority:** Blueprint > Phase 2 > Phase 2.5 > Phase 3/engineering > approved decisions > approved forensic specs > code (EVIDENCE ONLY).
> **Rule:** where a source is silent, write **SOURCE DOES NOT ESTABLISH THIS** — never invent.

---

## 0. The Seven Foundation Modules

| Module | Purpose | Layer | Owner (phase) |
|---|---|---|---|
| MOD-BUS | pub/sub event bus (single cross-panel channel) | Foundation | P0 |
| MOD-STATE | state-machine registry (STM-*) | Foundation | P0 |
| MOD-COMMAND | Command interface + History + undo/redo | Foundation | P0 |
| MOD-VECTOR | vector geometry: paths, strokes, booleans, tessellation | Foundation | P0 |
| MOD-COLOR | color model: RGBA canonical, gradients, OKLab interpolation | Foundation | P0 |
| MOD-EASING | easing functions: Penner set, ease slider, custom Bézier | Foundation | P0 |
| MOD-DOC | authoritative document model (ENT-*) | Core State | P1 |

**Dependency direction (layered, no upward deps):** `BUS / STATE / VECTOR / COLOR / EASING / COMMAND → DOC`. DOC depends on the foundation types (IDs, colors, paths, easing refs) but is MUTATED only via COMMAND.

---

## 1. MOD-BUS — Event Bus

- **Purpose:** the single pub/sub channel; panels/tools subscribe, never read each other directly (REQ-SYS-006).
- **Ownership:** P0 foundation (SYS-01 §27 = the transport contract; each event's SEMANTICS are owned by its producer).
- **Scope:** publish/subscribe/once; event delivery; global event defaults.
- **Non-scope:** event semantics; who emits what (owned by each producer per SYS-01 §27.1).
- **Authoritative source:** SYS-01 §27 (Cross-System Event Contract, v5 LOCKED) · REQ-SYS-006.
- **API/interface:** `subscribe(event, handler) → unsubscribe` · `publish(event, payload)` · `once(event, handler)`. (SOURCE DOES NOT ESTABLISH a literal function signature — this is the semantic contract; the exact binding is implementation.)
- **Inputs/outputs:** `publish` in; `handler(payload)` out.
- **Global event defaults (SYS-01 §27.0, binding):**
  - **failure:** emitter failure → toast; consumers degrade (last-known render), never crash.
  - **duplicate:** idempotent (re-render); no side-effect.
  - **stale:** consumers re-read the model (single source of truth); payload advisory only.
  - **ordering:** emitted during/after the mutation frame, before dependent re-render.
  - **sync:** all synchronous (long-op progress = separate channel, not a bus event).
- **Events (canonical, single-sourced SYS-01 §27.1):** see `CROSS_SYSTEM_CONTRACT.md` §D. The bus does NOT own event names; it owns delivery semantics.
- **Canonical payloads:** each event has ONE schema (FL-0030). No shorthand drift.
- **Mutation rules:** the bus never mutates document state; it only propagates.
- **Undo/dirty:** n/a (bus is stateless transport).
- **Persistence:** n/a.
- **Concurrency/ordering:** synchronous dispatch; deterministic order = publish order within a frame.
- **Dependents:** every SYS (all panels/tools subscribe).
- **Forbidden direct usage:** no panel reads another panel directly (REQ-SYS-006); no polling the model (events, not timers).
- **Integration contract:** producers emit AFTER successful mutation (REQ-SYS-002); consumers re-read the model, never trust a stale payload (FL-0013).
- **Test contract:** TS-BUS-001 event delivered to all subscribers · TS-BUS-002 duplicate idempotent · TS-BUS-003 no crash on handler throw.
- **Manual acceptance:** panels update without direct coupling (visual check).

---

## 2. MOD-STATE — State-Machine Registry

- **Purpose:** owns `StateMachine` instances; UI reads machine state, never drives it directly.
- **Ownership:** P0 foundation (eng 04).
- **Scope:** machine registry; states/triggers/guards/side-effects; forbidden-transition enforcement.
- **Non-scope:** the specific machines (owned by their SYS: STM-PLAYBACK→SYS-09, STM-EXPORT→SYS-27, STM-MODAL→SYS-01, STM-TOOL→SYS-13, STM-EDIT→SYS-19, STM-DIRTY→SYS-02, STM-FIELD→SYS-17, STM-JOB→SYS-27).
- **Authoritative source:** engineering 04 (state machines) · MOD-STATE (engineering 02).
- **API/interface:** `register(machine)` · `transition(machineId, trigger)` · `getState(machineId)`.
- **Inputs/outputs:** trigger in; new-state + side-effects out.
- **Entities/types:** `StateMachine { states, triggers, guards, sideEffects, forbidden[] }`.
- **State:** the registry itself is stateless; it holds machine definitions + current-state pointers.
- **Forbidden transitions** (enforced, eng 04): PLAYING→IDLE without stop/pause · SUBMITTING→OPEN (double-submit) · DRAGGING→INACTIVE (must COMMIT/CANCEL) · DIRTY→CLEAN without a write (arbitrary-clearing protection — see FL-0025).
- **Events:** machines EMIT their events (e.g. `playback:started`, `saving:changed`) — the registry does not own event names.
- **Concurrency:** one machine transition at a time per machine; no reentrancy.
- **Dependents:** SYS-02 (STM-DIRTY), SYS-09 (STM-PLAYBACK), SYS-27 (STM-EXPORT/STM-JOB), SYS-01 (STM-MODAL), SYS-13 (STM-TOOL), SYS-19 (STM-EDIT), SYS-17 (STM-FIELD).
- **Forbidden direct usage:** UI drives state directly (must go through triggers).
- **Test contract:** TS-STATE-001 forbidden transitions rejected · TS-STATE-002 side-effects fire exactly once.
- **Manual acceptance:** mode chips / status cells reflect machine state, never stale.

---

## 3. MOD-COMMAND — Command Interface + History + Undo/Redo

- **Purpose:** the ONLY writer to MOD-DOC; every mutation = one undoable Command (REQ-SYS-002, Part 36 rule 2).
- **Ownership:** P0 foundation; the Command ENGINE is SYS-03's constitutional scope (SYS-03 H00/H01), but MOD-COMMAND itself is the shared foundation type.
- **Scope:** Command interface; History stack; coalescing; redo invalidation; prevSelection; async journal.
- **Non-scope:** individual commands (owned by tools/systems — e.g. CMD-MOVE, CMD-DRAW); the History PANEL UI (SYS-03).
- **Authoritative source:** engineering 05 (command system) · Part 36 §36.0.2/§36.0.9 · SYS-03 H00/H01.
- **API/interface (verbatim eng 05):**
  ```
  Command { id, label, do(), undo(), canCoalesce(next), coalesce(next), prevSelection, affected[] }
  History { execute(cmd), undo(), redo() }   // bounded (default 100, RSK-011)
  ```
- **Inputs/outputs:** `execute(cmd)` in; model mutation + `document:changed{type,targets}` out.
- **Entities/types:** `Command`, `History`, `SelectionSnapshot`.
- **IDs:** `CMD-xxx` (command IDs, per-command, owned by the producing SYS).
- **Mutation rules (binding):** `do()` validates preconditions → throws typed error → MOD-NOTIFY (no partial mutation) · events AFTER successful mutation · selection-only actions produce NO command (REQ-SEL-005).
- **Undo/redo behavior:** undo pops top + inverse + restores prevSelection; redo re-applies; **new command clears redo**; coalescing (typing/slider/numeric) merges one entry; async commands journal before/after for exact undo (UI disables undo in-flight).
- **Dirty interaction:** dirty marking from `affected[]` (handoff to STM-DIRTY/SYS-02 H04). MOD-COMMAND emits `document:changed`; it does NOT compute the dirty flag.
- **Persistence boundary:** History = SESSION (save preserves, reload resets); commands NOT persisted.
- **Concurrency/ordering:** one command at a time on the main thread; async commands in worker with journal.
- **Dependents:** SYS-01..28 (every mutating system pushes commands).
- **Forbidden direct usage:** any panel/tool writing MOD-DOC directly (REQ-SYS-002) — MUST go through a Command.
- **Integration contract:** SYS-03 H01 (undo/redo + History panel) is the UI owner; MOD-COMMAND is the engine.
- **Test contract:** TS-CMD-001 do() throws → no mutation · TS-CMD-002 redo invalidation · TS-CMD-003 coalescing · TS-CMD-004 prevSelection restore · TS-CMD-005 async journal exact undo.
- **Manual acceptance:** undo/redo restores selection + content; no orphan entries (SYS-03 H06).

---

## 4. MOD-VECTOR — Vector Geometry

- **Purpose:** paths, strokes, booleans, tessellation — the geometry engine under shapes/drawing/rendering.
- **Ownership:** P0 foundation (engineering 02).
- **Scope:** cubic-Bézier path model; stroke→outline-polygon; boolean ops; tessellation; winding rules.
- **Non-scope:** the SHAPE model semantics (merge/object mode → SYS-20) · the rendering pipeline (MOD-RENDER/SYS-14) · the draw-tools gestures (SYS-13).
- **Authoritative source:** Blueprint Part 05 (stroke/fill model) · Part 06 (shape system) · ENG-003/004/005.
- **API/interface:** `path ops` (split/merge/offset) · `boolean(a, b, op)` · `tessellate(path, style)` · `pointInPath(p)` · `outlinePolygon(stroke, widthProfile)`.
- **Inputs/outputs:** path/shape in; geometry/outline/tessellation out.
- **Entities/types:** `Path { anchors[{x,y,h1x,h1y,h2x,h2y,smooth}], closed }` · `Stroke { path, closed, style, widthProfile[{t,wL,wR}] }` (matches ENT-node shape — Part 33 §33.19).
- **Canonical decisions (binding):**
  - **cubic Bézier canonical** — importers convert quadratics (ENG-003).
  - **strokes = outline polygons, NOT line primitives** (ENG-004 + Part 05: offset centerline by wL/wR, fill the outline).
  - **boolean engine = Vatti-style polygon clipping in a worker** (ENG-005).
  - **winding rule:** non-zero vs even-odd (Part 05.3.1).
  - caps (round/square/butt) · joins (round/miter[limit]/bevel) · width profiles.
- **Mutation rules:** MOD-VECTOR is PURE geometry (no document mutation); mutations flow through Commands in SYS-20.
- **Persistence:** path data persists via ENT-node (DOC boundary); MOD-VECTOR holds no state.
- **Error/failure:** boolean on invalid geometry → no-op + undo (RSK-010 fallback).
- **Dependents:** SYS-14 (hit-test edge radius 4px/24px) · SYS-20 (drawing/shapes) · SYS-22 (transform) · MOD-RENDER (tessellation).
- **Forbidden direct usage:** renderer drawing raw path primitives instead of outline polygons (violates ENG-004).
- **Test contract:** TS-VEC-001 winding rule · TS-VEC-002 boolean union/cut · TS-VEC-003 width-profile outline · TS-VEC-004 cubic canonical (quad→cubic conversion).
- **Manual acceptance:** variable-width strokes render uniformly at scale.

---

## 5. MOD-COLOR — Color Model

- **Purpose:** canonical color representation, gradients, swatches, interpolation space.
- **Ownership:** P0 foundation (engineering 02).
- **Scope:** RGBA canonical; RGB/HSB/hex views; alpha; gradient stops; OKLab interpolation; swatch CRUD.
- **Non-scope:** the Color PANEL UI (SYS-21) · instance color-effect (SYS-19, Part 11.5) · Find&Replace colors (SYS-03 H03, handoff to SYS-21).
- **Authoritative source:** Blueprint Part 23 (color system) · ENG-009 (OKLab).
- **API/interface:** `parse(input) → RGBA` · `toRGB/toHSB/toHex` · `lerp(c0,c1,t, space)` · `gradientAt(stops, t)`.
- **Entities/types:** `Color { r,g,b,a }` (RGBA canonical) · `GradientStop { offset, color }` · `Gradient { type: linear|radial, stops[] }`.
- **Two color spaces (binding — do NOT conflate, FL-0031):**
  - **RGBA** = canonical STORAGE/display (Part 23: "store one canonical color internally (RGBA); RGB/HSB/hex are views").
  - **OKLab** = the INTERPOLATION space for tweens (ENG-009: "perceptual evenness"). `lerp(..., space: okLab)` is the tween path; RGBA is the stored value.
- **Mutation rules:** pure functions; swatch CRUD goes through Commands (SYS-21).
- **Persistence:** swatches = document-level or app-level (app-level default, Part 23.3) → DOCUMENT or PREFERENCES boundary (owned by SYS-21).
- **Error/failure:** invalid hex/out-of-range → inline error (SYS-21 dialog), never silent.
- **Dependents:** SYS-20 (fill/stroke styles) · SYS-21 (panel) · SYS-23 (color tween via OKLab) · SYS-19 (color effect).
- **Forbidden direct usage:** storing HSB/hex as the canonical value (must round-trip through RGBA).
- **Test contract:** TS-COL-001 RGB/HSB/hex round-trip exact · TS-COL-002 OKLab lerp determinism · TS-COL-003 gradient stops.
- **Manual acceptance:** picker views stay in sync (no drift between RGB/HSB/hex).

---

## 6. MOD-EASING — Easing Engine

- **Purpose:** remap interpolation parameter `t` for all tweens + graph editor.
- **Ownership:** P0 foundation (engineering 02).
- **Scope:** `easeFunction(t)`; Penner set; ease slider (−100..+100); custom Bézier; presets.
- **Non-scope:** tween span semantics (SYS-23) · the graph-editor UI (SYS-23) · motion presets LIBRARY (SYS-23).
- **Authoritative source:** Blueprint Part 09.4 (complete easing system) · code `easing.rs` (evidence).
- **API/interface:** `easeFunction(family, mode, t)` · `easeClassic(slider, t)` · `easeCustomBezier(pts, t)`.
- **Inputs/outputs:** `t ∈ [0,1]` in; `t' ∈ [0,1]` out (then `value = lerp(v0, v1, t')`).
- **Entities/types:** `EaseFn` (family) · `EaseMode` (In/Out/InOut) · `ease` slider value (−100..+100).
- **Built-in families (Part 09.4.2, binding):** Linear · Quadratic/Cubic/Quartic/Quintic · Sine · Exponential · Circular · Back · Elastic · Bounce · Steps (each In/Out/InOut). (Standard Robert Penner curves — public domain.)
- **Ease slider (Part 09.4.3, binding):** 0=linear; negative=ease-in; positive=ease-out; quadratic strength 1..2.
- **Custom ease (Part 09.4.4):** value-over-time Bézier curve. **SOURCE DOES NOT ESTABLISH THIS precisely:** the exact control-point count/format of the custom-Bézier evaluator (single cubic vs multi-segment) is not specified → NON-BLOCKING note for SYS-23 (the evaluator interface is fixed; the editing detail is SYS-23's).
- **Mutation rules:** pure deterministic functions (no state, no mutation).
- **Persistence:** easing values persist via ENT-frame `classicTween.ease/customEase[]` and ENT-keyframe `ease` (DOC boundary).
- **Dependents:** SYS-23 (all tweens + graph editor) · SYS-19 (symbol loop? no — loop is frames).
- **Forbidden direct usage:** tweens sampling easing outside `easeFunction` (must route through MOD-EASING).
- **Test contract:** TS-EAS-001 each Penner curve monotonic t→t' · TS-EAS-002 slider −100/0/+100 endpoints · TS-EAS-003 determinism.
- **Manual acceptance:** ease-in/out visually correct across tween types.

---

## 7. MOD-DOC — Document Model (authoritative data)

- **Purpose:** the SINGLE source of truth (Part 36 rule 1); panels/tools/exporters are projections.
- **Ownership:** P1 core state (engineering 03).
- **Scope:** all ENT-* entities; validation; identity rules; derived-field rules; serialization handoff.
- **Non-scope:** persistence MECHANICS (→ SYS-28) · rendering (→ MOD-RENDER) · commands (→ MOD-COMMAND).
- **Authoritative source:** engineering 03 (document model) · Part 33 (project schema).
- **API/interface:** entity CRUD via Commands ONLY; `evaluate(model, time, opts) → RenderTree` (pure, deterministic — REQ-SYS-003); `migrate(from,to)`.
- **Entities (full list in eng 03):** ENT-project/document · ENT-scene · ENT-timeline · ENT-layer · ENT-frame (discriminated: keyframe/blankKeyframe/tween/classicTween/shapeTween/pose) · ENT-keyframe · ENT-node (discriminated: shape/drawingObject/primitives/group/symbolInstance/text/bitmap/warpAsset/brushStroke) · ENT-transform · ENT-symbol · ENT-asset · ENT-bone/armature · ENT-pose/rig/clip/character · ENT-audio · ENT-mouth/lipsync · ENT-camera · ENT-effect · (ENT-selection/workspace/command/historyEntry = non-persisted).
- **IDs (binding):** every entity = **UUID** `id` (stable, rename-safe, REQ-SYS-004). `name` display-only.
  - **CROSS-MODULE ID DRIFT (P-10, tracked):** SPEC = UUID; CODE = `u64` (`NodeId/LayerId/SceneId/SymbolId` in `id.rs`). This is an implementation gap, NOT a spec change (FL-0017). REQUIRED: migrate code to UUID OR get an approved override. The ID TYPE flows into MOD-COMMAND `affected[]`, MOD-BUS payloads, and MOD-VECTOR references — so it MUST be locked before the AI split.
- **Identity rules:** parent/child by ID; delete cascades or re-parents per entity; `formatVersion: 1` + `migrate(from,to)` pure.
- **Validation & lifecycle:** load-time validate → migrate → re-link → integrity (orphan refs → warn/placeholder); runtime writes validate preconditions (via Commands).
- **Derived fields:** duration, bounds, matrix, path — NEVER stored; recomputed + cached with invalidation.
- **Mutation rules:** ONLY via MOD-COMMAND (REQ-SYS-002); no panel writes directly.
- **Persistence boundary:** DOCUMENT (JSON + assets/, atomic write) — handoff to SYS-28.
- **Error/failure:** integrity failure → warn/skip (eng 03) · orphan → placeholder + warn.
- **Dependents:** EVERY system (single source of truth).
- **Forbidden direct usage:** any module caching authoritative data (REQ-SYS-001); any direct write bypassing Commands.
- **Integration contract:** SYS-02 owns document lifecycle (H00 §6); SYS-28 owns serialization; SYS-03 owns the command engine that mutates MOD-DOC.
- **Test contract:** TS-DOC-001 schema round-trip · TS-DOC-002 rename-safe (ID refs intact) · TS-DOC-003 evaluate determinism · TS-DOC-004 migrate(from,to) pure.
- **Manual acceptance:** save→reload→evaluate identical (REQ-PERSIST-B).

---

## 8. Cross-Module Adversarial Audit (PASS/FAIL per axis)

### 8.1 BUS ↔ STATE
- STATE emits machine events over BUS; BUS owns delivery only. No ownership collision. ✓

### 8.2 BUS ↔ COMMAND
- COMMAND emits `document:changed` over BUS AFTER mutation. BUS never mutates. ✓

### 8.3 COMMAND ↔ DOC
- COMMAND is the ONLY writer to DOC. DOC is pure data. No circular dep (DOC does NOT depend on COMMAND — REQ-SYS-002 is a rule, not a code edge). ✓

### 8.4 COMMAND ↔ STATE
- COMMAND pushes dirty marks → STM-DIRTY (SYS-02). STATE registry doesn't own commands. ✓

### 8.5 DOC ↔ PERSISTENCE (SYS-28)
- DOC = data; SYS-28 = serialization. Handoff (no absorption). ✓

### 8.6 VECTOR ↔ DOC
- VECTOR provides geometry algorithms; DOC stores ENT-node paths. VECTOR holds no state. ✓

### 8.7 COLOR ↔ VECTOR
- COLOR = styles (RGBA/gradient); VECTOR = geometry. Stroke style carries a Color. ✓

### 8.8 EASING ↔ COMMAND/DOC
- EASING = pure math; DOC stores ease values (ENT-frame/keyframe). No coupling beyond data. ✓

### 8.9 Foundation ↔ SYS-01..28
- Every SYS depends on the foundation; no SYS owns a foundation module. The one cross-cutting risk = ID-type drift (§7) + custom-ease-format note (§6). ✓ (both tracked, neither is a NEW spec blocker)

### 8.10 Findings summary
| # | Finding | Type | Resolution |
|---|---|---|---|
| F-1 | ID type drift (UUID spec vs u64 code) | ID-type drift | tracked P-10; MUST be locked before AI split (not a new spec ambiguity — spec already = UUID) |
| F-2 | custom ease curve format unspecified | SOURCE DOES NOT ESTABLISH THIS | non-blocking note for SYS-23 (evaluator interface fixed; editing detail deferred) |
| F-3 | RGBA vs OKLab could be misread as a conflict | terminology (FL-0031) | documented: RGBA=storage, OKLab=interpolation (distinct concerns) |

No duplicate ownership, no duplicate command/event IDs, no payload drift, no state drift, no mutation bypass (COMMAND-only), no circular dependency, no persistence leak.

---

## 9. Final Foundation Gate

| Gate | Result |
|---|---|
| ownership conflicts | 0 |
| command conflicts | 0 |
| event conflicts | 0 |
| payload conflicts | 0 |
| state conflicts | 0 |
| ID conflicts | 1 tracked (P-10 UUID-vs-u64 — SPEC settled, code migration pending) |
| mutation bypasses | 0 |
| persistence-boundary conflicts | 0 |
| circular dependency | 0 |
| hidden implementation-critical ambiguity | 0 |
| lessons applied | FL-0017 (code≠authority), FL-0030 (payload), FL-0031 (terminology), FL-0025 (state), FL-0016 (scope) |

**FOUNDATION READY = YES** — the foundation contract is internally coherent and implementation-safe. The two residual items (F-1 ID-type code migration, F-2 custom-ease format) are NON-BLOCKING for the SPEC (spec already authoritative: UUID; easing evaluator interface fixed). They are recorded, not hidden.

> This contract resolves FND-001. The four AI groups MUST read this before touching any SYS; no AI may redefine a foundation module (see `AI_ASSIGNMENTS.md`).

---

*Foundation contract complete. See `FOUNDATION_FINAL_FORENSIC_REPORT.md` for the full audit matrices.*
