# KINEORA — CHANGELOG (coordination-level)

## 2026-08-23 — AI-T · AI Agent A3: engine AI seams (E-AI-2..5) + snapshot/capability services

- ENGINE (Rust — written here; cargo NOT RUN, user-PC verify pending):
  NEW `snapshot.rs` — `scene_snapshot()` (compact semantic JSON of the ACTIVE
  scene: settings/scene/playhead/duration/rev/selection/counts + per-layer
  keyframe/tween rows + per-node geometry & keyframe membership + library
  rows; false/absent fields omitted for token economy) · `capabilities()` —
  the trusted runtime manifest (shapes + nodeFamilies + features) where shape
  kinds are enumerated through an EXHAUSTIVE match so a new ShapeKind variant
  is a compile error here until the manifest is updated (single source of
  truth — AI-REQ-111).
  `History` gains a monotonic `rev` (E-AI-4) bumped on every execute/undo/redo
  · `Session::doc_revision/scene_snapshot/capabilities/set_selection` (E-AI-3:
  by-id selection, pruned to current-frame content, view state only) · wasm:
  `kineora_scene_snapshot/kineora_capabilities/kineora_doc_revision/
  kineora_set_selection`.
- UI (TS — gate green): `engine/wasmTypes.ts` + `engine/client.ts` optional
  facades w/ `hasAiEngineFacades()` probe (honest pre-A3 degrade) · NEW
  `ai/snapshot.ts` — parse (fail-closed, `E_SNAPSHOT`), deep-frozen view,
  deterministic n1/l1/s1 aliases + ref lookup + token-bounded prompt text ·
  NEW `ai/capabilities.ts` — CapabilityRegistry GENERATED from the engine
  manifest (no second hand-maintained list): feature gates flip states, new
  engine shapes auto-light-up (tested w/ a 'polystar' future fixture),
  stale-wasm probe degrades honestly, unsupported/deferred rows generated for
  honest "abhi available nahi" answers (AI-REQ-112), tier A/B per spec 04.
- TESTS: Rust `tests/ai_snapshot.rs` (11 acceptance tests — cargo NOT RUN) ·
  TS 20 new (snapshot aliases/freeze/prompt text, manifest parse, dynamic
  discovery, gates, tiers) · UI gate: tsc clean · vitest 967/967 (74 files)
  · vite build clean.

## 2026-08-23 — AI-T · AI Agent A2: BYOK foundations (keys, adapters, consent, usage)

- NEW `animator/ui/src/ai/` (10 files; engine untouched, App untouched — the
  settings component stays UNMOUNTED until A6 per the approved slice order):
  `redact.ts` (pattern + exact-value registry redaction; bare vs transport
  patterns) · `keys.ts` KeyVault — MEMORY-ONLY by default, per-key opt-in
  localStorage persistence behind PERSIST_WARNING, wipe/refcounted redaction
  registration · `providers.ts` — non-secret config store (runtime guard strips
  secret-shaped fields on write), consent gate (CONSENT_VERSION), endpoint/
  model validation · `adapters.ts` — plain-fetch adapters for OpenAI /
  Anthropic (forced tool-use = strict JSON; browser-direct header) / Gemini
  (key in x-goog-api-key HEADER, never URL) / OpenAI-compatible (endpoint
  required); bounded 429/5xx retries (≤2, Retry-After aware); abort-aware;
  normalized AiError kinds; LOUD structured-output degradation flag; usage
  extraction per provider · `usage.ts` — session + persisted DAILY token
  counters (future AI-REQ-070 ceiling input) · `AiProviderSettings.tsx` —
  consent dialog (outbound-data inventory) + config form + test-connection.
- Security invariants tested, not just documented: key never in provider
  config blob, never in URLs, redacted from error text even when a provider
  echoes it, vault.describe() carries no key material, consent version
  expiry, zero-network-call on config errors.
- UI truth gate green: tsc -b clean · vitest 947/947 (72 files; +60 new)
  · vite build clean.

## 2026-08-23 — AI-T · AI Agent A1: CompositeCommand (E-AI-1) — one request = one undo

- Handoff received: research APPROVED, D-0010 APPROVED. Slice A1 ONLY per §20–23.
- ENGINE (`animator/core`): NEW `CompositeCommand` in `command.rs` — ordered
  children apply forward / revert in REVERSE; whole group = ONE History entry
  labelled with the plan label (child labels stay internal). Atomicity model
  documented on the type: Commands are apply-infallible, so grouped execution is
  all-or-nothing at CONSTRUCTION time (build all children; any build failure ⇒
  drop the whole group, push nothing).
- NEW `Session::execute_grouped(label, children) -> bool` (session.rs, additive):
  routes the group through the same exec_then path as every single command —
  selection prev/post capture (INV-EDIT-2), redo-clear, dirty and 100-bound
  semantics unchanged. Empty groups refused (no entry, no doc change).
- `lib.rs` exports `CompositeCommand`. NO existing command/session behavior
  touched (additive only — verified in the diff).
- TESTS: NEW `animator/core/tests/composite.rs` — 10 tests: one-entry+label,
  one-step undo/redo bit-exact, in-order apply + reverse revert (order-proving
  recorder command), empty-refusal, selection prev/post intact, mixed real
  commands (draw+visibility+rename) revert bit-exact (no partial survivors),
  nested composites, HISTORY_BOUND counts a group as one, redo-invalidation,
  accessors.
- **cargo NOT RUN in this sandbox** (no rustc/crates.io — verified again today).
  User PC must run: `cd animator/core && cargo fmt && cargo clippy --all-targets
  -- -D warnings && cargo test`. Any compile/clippy issues = my follow-up.
- Handoff-locked spec additions recorded: AI-REQ-023 (frame reuse/minimal
  mutation), AI-REQ-111 (dynamic capability single source of truth),
  AI-REQ-112 (UI-visible ≠ AI-exposed honesty), AI-REQ-113 (no image gen) —
  see `TOOLS_RESEARCH/AI_AGENT/26` §M. Next slice: A2 (BYOK foundations) —
  waits for approval per handoff §23.

## 2026-08-23 — AI-T · Kineora AI Agent — complete pre-engineering research package (docs only)

- NEW `TOOLS_RESEARCH/AI_AGENT/00..28` (29 files): full research + normative spec for a
  BYOK AI animation agent ("ek red ball banao jo bounce kare" → validated plan → ONE
  undoable transaction → structured verify → honest report). RESEARCH-ONLY: zero code
  (no Rust/TS/schema implementation — JSON-like snippets are protocol illustrations).
- Grounded in a fresh engine audit (`02_CURRENT_ENGINE_AUDIT.md`, file:line refs):
  command layer = reversible `Command`+`History`(bound 100, selection captured,
  NO composite/batch exists) · Node = Rect(shape rect|oval)+SymbolInstance ONLY (no
  path/text) · classic tween numeric ease only (Penner lib dormant) · no per-node
  opacity · read paths already exist (status/evaluate/project_json).
- Derived, not assumed: MVP action vocabulary ↔ `command.rs` 1:1 (`04`); capability
  manifest SUPPORTED/PARTIAL/UNSUPPORTED/DEFERRED (`07`); MVP scope with 7 scripted
  acceptance scenes (`24`); engineering slice order A1–A8 (`27`).
- Key engineering deps identified: E-AI-1 CompositeCommand (one request = one undo) +
  E-AI-2..5 (scene snapshot, select-by-ids, doc revision, capability manifest) — all
  additive. Cross-lane touches disclosed in `22` (panel mount vs AI-B `panelLayout`).
- Security/threat model in `12` (keys memory-default, prompt-injection, loop budgets);
  provider matrix in `17` (browser-direct CORS verified for OpenAI/Anthropic/Gemini).
- Gate verdict in `28`: ✅ READY FOR ENGINEERING (zero critical ambiguity; 10 provisional
  defaults listed for human override). FINAL AI AGENT CONTRACT included. Tracked as
  D-0010 (PENDING HUMAN). No `animator/` code changed; test suites untouched.

## 2026-08-23 — AI-T · Tools forensic research + Tools-panel layout correction (session rebuild)

- The previous AI-T session's work (Oval tool + tools forensic doc + panel correction)
  was LOST out-of-band: the arena sandbox re-cloned to the squashed PR-#3 merge with a
  clean tree. Rebuilt from scratch in this session; nothing pulled from anywhere else.
- NEW `PROJECT_COORDINATION/TOOLS_FORENSIC_RESEARCH_AI-T.md`: spec-verified 29-row tool
  matrix (Blueprint Part 02a–d, every T2A/T2B/T2C/T2D id), engine unlock ladder E1–E5,
  the LOCKED build order (rect group → §1.3.2 tool-interface refactor → PATH model →
  Pen→Line→Pencil→Brush → Subselection/Width → Lasso → Eraser → Text), and the 10-rule
  per-tool "done" checklist.
- Tools panel per Blueprint §1.3.1 + the locked UI rules: 36px icon-only rail (name +
  shortcut on hover/focus), Tools+View in a scroll region, Colors+Options PINNED bottom,
  Colors area = Fill/Stroke chips + swap + black&white + no-color (chip click opens the
  picker popover), stroke width moved OFF the rail into the W-button popover (numerics
  never loose on the rail).
- UI 887/887 green · tsc + vite build clean.

## 2026-08-23 — AI-T · Oval tool end-to-end (E1a, Blueprint T2B.5) + stroke-at-draw-time

- ENGINE (Rust — written here, NOT compiled in this sandbox; no cargo/crates.io):
  `ShapeKind {Rect, Oval}` on `Node::Rect` with `#[serde(default)]` (pre-E1 files load
  unchanged, serde test included) · `eval.rs` EXACT ellipse inside-test + exact
  ellipse∩box marquee (an AABB hit on an oval is a bug, not an approximation) ·
  `export.rs` emits a true `<ellipse>` (rotation around centre) ·
  `session.draw_shape(shape, x, y, w, h, fill, stroke, stroke_width)` with the same B-5
  folder/locked/hidden guards + log lines as `draw_rect` (kept as the legacy facade) ·
  `DrawRect` undo label follows the shape ("Draw oval") · `kineora_draw_shape` facade ·
  12 engine tests in `animator/core/tests/draw_oval.rs` (guards, undo, exact hit-test,
  export, legacy-JSON compat).
- UI: `drawShape` facade (+ honest pre-E1 degrade: rect falls back to `kineora_draw_rect`,
  oval reports 0 → Stage tells the user to rebuild, never a silent rectangle) · canvas
  renderer + export rasterizer + rubber-band preview share the inscribed-ellipse geometry
  (renderer = SVG export = rasterizer) · Rectangle + Oval both honor the Fill AND Stroke
  swatches at draw time (Part 02b preamble — BUG-TOOL-008 CLOSED) · Oval tool (O) with
  Shift = circle, Alt = from centre, Esc cancel, sub-threshold guard.
- D-0009 (register): Blueprint Part 29 binds O twice (Oval tool vs onion toggle) — Oval
  keeps O; `view.onion` moved to Ctrl+Alt+O, TimelineStrip tooltip updated (AI-B owns
  that command; flip if ruled otherwise). Outlines (Shift+O) and EMF (Alt+O) untouched.
- UI 887/887 (+19: oval stage suite, ellipse renderer/rasterizer, panel contract) ·
  tsc + vite build clean · cargo fmt/clippy/test = NOT RUN (no toolchain in sandbox —
  flagged for the human: `cd animator/core && cargo fmt && cargo clippy --all-targets
  -- -D warnings && cargo test`).

- Built on Inc 0+1 (`1321f68`). Adobe Help timeline/layers screenshots + Blueprint 7.1.1/7.1.5. Playhead stays **red** (Blueprint 7.1.3).
- **Chrome look:** compact hover-title toolbar; type+name+pencil left; eye/lock/outline-color right; hidden = red ✕; locked = padlock; visible/unlocked empty clickable cells; content frames = light bar + black dots.
- **Onion P1 (view state only):** `onion.ts` / `onionPrefs.ts` (`kineora.onion` localStorage). Ghosts before current items; never export / never selectable. O / Shift+O. Defaults AMB-TL-014/015/016.
- **Header-click ALL:** `Session::set_all_layers_{visible,locked,outline}` + wasm (one `SetLayerFlags` undo). Needs `npm run wasm` on desktop — prebuilt wasm lacks exports until rebuild.
- **Also:** ruler seconds `(f-1)/fps`; Active-layer-only view filter; customize toolbar (session view state, Reset); Play ▶/⏸.
- Honest DEFERRED (not invented): EMF write (AMB-TL-020), camera LayerKind (Part 16 / SYS-25), transform parenting (W2 — `parent_id` is folders). Mute = existing `control.mute` SYS-26 handoff.
- rustfmt wrap on `selected_editable` + B-1 asserts. `workspace.ts` `timelineNameW` sanitize kept. LayersPanel kept (AMB-TL-010).
- Native/cargo/wasm **NOT RUN** in this sandbox (no rustc). Not COMPLETE.

## 2026-08-23 — Inc 0 folder guards + Inc 1 unified Timeline (product code)

- Pulled user research: `TOOLS_RESEARCH/` (`8f7df54`) + `RESEARCH_01_WORKSPACE_STAGE/` (`d12ec97`). Authority: Timeline pack coding order > workspace skeleton (folders already exist; no flatten). Tools 21: do not fake Pencil/Brush with rects.
- **Inc 0 (engine):** B-1 ancestor visibility in eval/hit/select-all/prune; B-2 folder frame-op guards (F5/F6/F7/clipboard/tween/span/place); B-3 folder lock cascade; B-4 deep folder duplicate (one undo); B-5 `editable_target_layer`; B-8 `copyFrames` no `document:changed`.
- **Inc 1 (UI):** one Timeline panel — chrome (eye/lock/outline/name) + splitter + grid, shared vertical scroll (U-1…U-13). U-G7 default hide left Layers; U-G8 min 168 / default 200; U-G9 nameW 160–360. Time readout `(playhead-1)/fps`. Folder grid = dim strip, no fake dots. LayersPanel kept (AMB-TL-010).
- Not coded: onion (Inc 2), EMF (AMB-TL-020), Path/Pencil/Brush (tools Phase 1), camera, new LayerKind, new bus events.
- Rust layers + full core green. UI **789** automated (was 779). Native/manual QA PENDING. Not COMPLETE.

## 2026-08-23 — Timeline+Layers pre-code audit (docs only)

- Added `12_AUDIT.md`. Fixed pack bugs D-1..D-4. Ship rules U-G7 (don’t show two layer lists), U-G8 (min height), U-G9 (nameW), B-8 (copyFrames event).
- Still research-only. No `animator/` edits.

## 2026-08-23 — Timeline+Layers research CONTINUE (onion / EMF / speed)

- Added `08_ONION_SKIN.md` (P1 overlay; never export; no Rust), `09_EDIT_MULTIPLE_FRAMES.md` (blocked AMB-TL-020), `10_EXPOSURE_AND_ADOBE_SPEED.md` (**AMB-TL-005 RESOLVED** via eng 07), `11_WISH_W1_CEL_AND_REMAINING.md`.
- Research-only. Pack is enough to start code: guards → unify → onion. EMF/W1/camera not in first wave.

## 2026-08-23 — Timeline+Layers unified forensic pack (docs only)

- New folder `PROJECT_COORDINATION/TIMELINE_LAYERS_RESEARCH/` (00_README … 07_CODING_PACKET).
- Research-only. No `animator/` edits. Adobe Help “How to use the timeline” (2026-06-09) translated item-by-item; Blueprint wins.
- Finding: LayersPanel (left) and TimelineStrip (bottom) are two views of one score — Blueprint 7.1.1 already requires one row. C-08/C-22 “UI COMPLETE” is paper.
- Open AMBs AMB-TL-001..012. Engine bugs B-1..B-5 still owned by SYS-15/16. Coding not started.
- Continue slice: onion / Edit Multiple Frames / Adobe speed tools (not specified → AMB).

## 2026-08-23 — SYS-13 Rectangle honesty (T2B.4 modifiers + Esc) + BUG-D-001

- **One increment:** Rectangle tool Shift = square, Alt = from-center, Esc = discard in-progress (no command). Fill/stroke still hardcoded `#3f9bf5` / none — SYS-21 CurrentStyle not invented.
- `gesture.ts` `buildRect()` — unconstrained path bit-identical to `normalizeRect`.
- `Stage.tsx` rebuilds on mouseup from last pointer + live modifiers; Esc capture cancels the gesture.
- **BUG-D-001:** `edit_ops.rs` folder-paste test asserted `selection.is_empty()` while the comment said “must not change selection”. Implementation already blocked paste correctly; assertion now compares against the pre-paste selection.
- SYS-13 still **PARTIAL** (3 tools). Not COMPLETE. Native QA PENDING.

## 2026-08-23 — Tools system forensic research (docs only)

- Research-only phase. **No product code.** Document: `PROJECT_COORDINATION/TOOLS_SYSTEM_FORENSIC_RESEARCH.md`.
- Reconstructed `origin/main` at `7ab803a`. Inventory: Blueprint 02a–02d vs `commands.ts` / `Stage.tsx` / `Session::draw_rect` / `Node::{Rect,SymbolInstance}`.
- Finding: only Selection, Rectangle, and Free-Transform *ids* exist; Q does not route Stage gestures; C-13 “FUNCTIONAL” is UI-contract paper, not engine truth.
- SYS-13 **not COMPLETE**. AMB-TOOL-001..006 registered in the research doc (not invented as product decisions).

> Records every meaningful coordination/spec/decision change. SYS-level detail lives in the SYS's own final-report; this is the project-level timeline.

---

## 2026-08-22 — AI-B: Edit ▸ Find and Replace (H03)

- `edit.findReplace` DEFERRED → FUNCTIONAL. Dialog + find/replace/replace-all for Color (one undo via setNodeProps) and Symbol (swapInstance). Text/font/sound honest 0 matches. UI 767/767.

## 2026-08-22 — AI-A: File ▸ Save — browser File-System-Access overwrite (H05 P-1)

- Human FILE-MENU DEEP COMPLETION. One feature: Save (not a batch of File items).
- **H05 P-1:** after a first Save that remembers a session identity, subsequent Ctrl+S overwrites that identity with no picker. Desktop already did this; browser now does when the File System Access API is present (handle stored as a session token, same `docPaths` map). No FSA → honest prompt+download fallback (H05 F3, not invented).
- Cancel of a shown picker is silent (no second prompt). Untitled / Save As still pick-THEN-write so INV-IDENT-4 can block before bytes land.
- App re-reads on `saving:changed` so the dirty ● / title do not wait for the 120ms poll (H05 §7.1).
- No new event, no new commandId, no Save All, AMB-H05-001 still OPEN (provisional filename title).
- UI **760/760** · `tsc --noEmit` PASS · `vite build` PASS. Rust/WASM/Tauri/native **NOT TESTED**. SYS-02 File = AUTOMATED TESTED / PARTIAL. **Not COMPLETE.**

## 2026-08-22 — AI-B: forensic repair round 2 — complete SYS-14 selection:changed payload (`eac6e7b`)

- Second independent reviewer. Verified all 10 AI-A repair claims against corpus/code (F8 auto-key, selection consumers, locked-cut, F4=Properties, st.snap, command IDs) — all confirmed; updated `client.undoSelection.test.ts` to expect the now-full payload.
- **SYS-14 (C-4 closed at TS boundary):** `buildSelectionPayload()` computes `{prevTargets,targets,kind:'objects'|'none',commonType?,bounds?}` from core `selection`/`selection_details`/`selection_rects`; `emitSelectionChanged` emits the full payload (was prevTargets/targets only). `kind/commonType/bounds` fields already declared optional in the locked SYS-01 §27.1 schema — no event/payload contract change. Producer calls were added by AI-A (`5b2f09d`); SYS-14 supplies the payload they carry. No double emission (one emit/gesture); undo/redo/draw/cut/delete/paste/duplicate all emit once.
- Test seam `__attachEngineForTest` for producer tests; 14 new tests (pure payload + producers). Full UI **756/756**; tsc + vite build green. Rebased onto AI-A `5b2f09d` (no force, no dropped commits; both INT-AIA-004 and INT-B-001 preserved).
- Rust/WASM/native NOT TESTED — toolchain unavailable; no Rust touched.

## 2026-08-22 — AI-A: forensic repair — INV-EDIT-1 F8 auto-key + selection:changed consumers

- No new features. Audit of SYS-01..07 against locked contracts.
- **INV-EDIT-1:** `Session::convert_selection_to_symbol` no longer calls `ensure_keyframe` before History::execute. `ConvertToSymbol` auto-keys inside apply and removes that keyframe on revert.
- **H01 §9 / SYS-01 §27.1:** Stage `selectAt`/`selectToggleAt`/`selectInRect` emit `selection:changed` (never `document:changed`). App ticks on `selection:changed`. Draw/delete/paste/duplicate also emit selection:changed.
- **H04 / FL-0007:** cut emits `document:changed` only when selection actually changed (locked-only copy is not a mutation).
- Escalated (not fixed): SYS-16 folder lock does not cascade (visible/outline do; no test). Browser H05 path identity. History panel / canCoalesce / AMBs.

## 2026-08-22 — AI-A: SYS-03 C-2 — prevSelection restore + History bound 100

- INTEGRATED_AUDIT C-2 (HIGH). Session captures prev/post selection around `History::execute`; undo restores prev, redo restores post (INV-EDIT-2). Command trait stays `{label,apply,revert}` — no 30-impl duplication.
- History stack bounded at **100** (RSK-011 / eng 05). Oldest dropped first.
- `client.ts` undo/redo emit locked `selection:changed{prevTargets,targets}` (H01 §9). No new event.
- Not invented: canCoalesce / affected[] / History panel / Paste Special format list.
- Rebased onto `d491b4e` (INT-AID-004/005 + SYS-23). SYS-16 folder Session methods kept; `history.execute` 2-arg sites converted to `Session::exec` (signature only).
- Rust **331/331** (layers.rs 34/34 + undo_selection 11/11). UI **740/740** (+4 client undo/redo `selection:changed`). `tsc --noEmit` PASS. WASM/Tauri **NOT TESTED** (no wasm-pack rebuild). SYS-03 = AUTOMATED TESTED / PARTIAL.

## 2026-08-22 — AI-A: SYS-01 C-3 — panel.show/hide + F4 + honest st.snap

- Human DEEP COMPLETION ORDER (implementation). BLK-AIA-001 posture: `d4b1861`/`bc12025` stay as evidence.
- **CommandIds:** Window panels use locked `panel.show(id)` / `panel.hide(id)` (INV-CMD-4). Removed `panel.layers` / `panel.properties` / `panel.library` / `panel.timeline` / `panel.tools`. `panel.debug` untouched (SYS-10 / AI-B). Toolbar `panel.*` ids remain VIEW testids.
- **F4:** C-09 “F4 toggle (ours)” — alias `f4` → `panel.show('properties')`; dispatcher toggles. Adobe Ctrl+F3 loses. Ctrl+L / Ctrl+Alt+T / Ctrl+F2 likewise toggle via the same commandId. Rebase onto AI-B `7ebc3cc`: SYS-11 `window.hideAllPanels` kept (menu); **F4 not given to Hide All** (INT-AIA-002).
- **st.snap:** no longer a fake `"snap off"`. Honest `"snap —"`; projects existing `snap:changed{mode}` (SYS-04 SnapEngine still DEFERRED / AMB-S04-004 — no invented flags).
- Panel × on layers/properties/library now runs `panel.hide(id)`.
- Tests: F4, Ctrl+L, commandId absence, snap projection, Open Recent hover-clear. UI suite **718/718** after rebase onto AI-B/C/D (SYS-10/11 + folders + SYS-27), `tsc` PASS. Native/Tauri/Rust **NOT TESTED**. SYS-01 = AUTOMATED TESTED / PARTIAL — **not COMPLETE**.

## 2026-08-22 — AI-B session 3: SYS-10 Debug Output console + SYS-11 Window F4 Hide/Show All (`7ebc3cc`)

- Audit-first: SYS-10 already had the Dev panel; SYS-11 already had panel toggles + workspaces. No rebuild; extended only identified gaps (deep-completion order).
- **SYS-10:** new `outputLog.ts` bounded ring buffer (500 entries; levels info/warn/error/debug; fault-isolated subscribers); App routes `bus.setErrorHandler` and every `notify()` toast into the Output console; DebugPanel renders `<ul role="log" aria-live="polite">` with timestamp/source/level coloring and count summary; new Debug-menu commands `debug.clearOutput` and `debug.copyOutput` (navigator.clipboard with execCommand fallback); `debug.as3` stays UNAVAILABLE (historical only). `debugViewController` keeps the menu decoupled from panel internals (FL-0009).
- **SYS-11:** new `window.hideAllPanels` command bound to **F4** (Adobe muscle-memory); hides every panel and restores the exact prior visibility snapshot on the next F4 (or defaults on first use); per-panel `panel:changed` emissions keep workspace persistence/subscribers consistent; F4 is suppressed inside input/textarea/contentEditable.
- No new bus events (Output console uses its own internal pub/sub by design — SYS-01's locked event set must not expand per FL-0001). No other SYS's command/event/payload changed.
- Tests: 22 new (outputLog 6, sys10-sys11 16) plus menu coverage. **712/712 UI green** after rebase onto AI-C SYS-16 folders (`0be97e5`); `tsc -b` and `vite build` green; no conflicts. Manual native-desktop QA PENDING.

## 2026-08-22 — AI-C turn 4: repair INT-AID-004 / BLK-D-007 (folder Session methods)

- Highest-priority SYS-16 gap after fetch: `9128ad9` UI/wasm/tests called `create_folder` / `set_layer_parent` / `set_folder_collapsed` but the Session methods were missing (AI-D escalated, did not invent semantics).
- Landed the three methods + folder lock cascade. Fixed broken serde test (raw-string `#ffffff` + naive JSON strip).
- Verified: cargo test 313/313 · layers.rs 34/34 · UI 736/736. rustfmt/clippy/wasm-pack **NOT TESTED** (components not installed). Manual desktop QA PENDING.

## 2026-08-22 — AI-C turn 3: SYS-16 folders (F-20-05)

- Reconstruct from `origin/main` (`da36772`). Previous AI-C: SYS-16 outline/dup/batch + INT-0010 + drag-through. Leader next deliverable = folder cascade E8/E9 OR SYS-15 increment — chose **folders (depth over breadth)**.
- Model: `LayerKind::{Normal,Folder}`, `parent_id`, `collapsed` (serde defaults → old files load). Commands: Create folder, SetLayerParent, SetFolderCollapsed, DeleteLayerGroup. Folder hide/lock/outline cascade = one `SetLayerFlags` undo. Draw blocked on folders. Cycle nest blocked. Timeline hides collapsed descendants (INT-0014).
- UI tests (LayersPanel + timeline + bus + layer events): **115/115** focused green. **Rust/wasm NOT TESTED** — no rustc/cargo in this sandbox (same class as BLK-D-005). Manual desktop QA PENDING.

## 2026-08-22 — AI-B: SYS-09 Control/Playback hardening + SYS-12 Help (Leader orders, `9064b70`)

- Read FL-0001..0034 + full corpus; executed the AI-B section of `LEADER_ORDERS.md` (SYS-09 then SYS-12).
- **SYS-09:** STM-PLAYBACK machine (IDLE/PLAYING/PAUSED) with forbidden-transition no-ops; Enter toggles play/pause (`playback:paused` new event, INT-0011); `seekPlayhead()` emits `playhead:moved{frame}` on user seeks only (INT-0012); `control.mute`→FUNCTIONAL SYS-26 handoff toast; `control.test`→FUNCTIONAL SYS-27 handoff toast; Ctrl+Enter context-scoped via D-6 (in-symbol = `edit.exitRoot`, root = Test Movie, INT-0013); Stop disabled while idle; StatusBar shows ▶/⏸/⏹.
- **SYS-12:** offline HelpDialog (Documentation + Troubleshooting); `help.docs`/`help.troubleshoot` DEFERRED→FUNCTIONAL; Esc/outside-click/Close dismiss.
- Tests +16 (693 total UI green); tsc + vite build green; rebased onto `b247b21` (AI-A/C/D) with no conflicts; bus `playback:paused` auto-merged with AI-C's `layer:changed`. Manual native-desktop QA PENDING.

## 2026-08-22 — AI-C turn 2: layer:changed event (INT-0010) + drag-through column toggle (Leader order executed)

- **Read `LEADER_ORDERS.md`** (AI-01 `c648fbf`) and executed the AI-C section exactly: FL-0026 citation fix (F-20-02/03 → canonical F-20-01/F-20-04 across AI-C's code/tests/docs) · INT-0010 `layer:changed{layerId,op}` emission (bus + all layer-mutation facades; per-layer events for batch ops; `setActiveLayer` never emits) with consumers (App immediate re-read, LayersPanel 900ms row flash) · SYS-16 deferred increment = drag-through column multi-toggle (F-07-02 E1/E2: pointer-down + pointerenter, once per row per gesture, row-click suppression, Esc cancel, keyboard preserved, no row-reorder hijack).
- **Status:** BLK-AIC-003 RESOLVED (implementation); INT-0009 verified by Leader; UI 606→641 tests; `npm run build` ✓; Rust 21 suites/clippy 0/fmt ✓. Manual native-desktop QA still PENDING (user-side).

## 2026-08-22 — AI-C session: SYS-16 Layers increment implemented + pushed (human-authorized)

- **AI-C present** — human coordinator's direct order ("push after writing further code") authorized implementation before the coordination corpus landed; the corpus was absent at session start (`e3690f7`), so AI-C worked on Blueprint + Phase-2 deep-research authority (F-07-02, F-20-01..03) + engineering. Registered BLK-AIC-001 (resolved by the `ca79555` corpus commit) + BLK-AIC-002/003 (open, informational/deferred).
- **SYS-16 implemented** (`a562052`): outline mode (`Layer.outline/outline_color`, `SetLayerOutline(_Color)` commands, swatch column + inline color picker, strokes-only stage rendering via `RectItem.outline_color` propagated through symbol instances, export stays full per F-20-03) · duplicate layer (`DuplicateLayer` command, deep copy frames+content with fresh node ids, Animate-style names) · Alt+click eye/lock/outline = toggle all others as ONE undo step (`SetLayerFlags`, M.3 all-hidden rescue) · red-X hidden + pencil/pencil-with-slash indicators (panel + timeline row).
- **Quality gates:** Rust 20 suites (layers.rs 12→27), clippy 0, fmt clean, wasm-pack build ✓, UI 606 tests (+13), `npm run build` ✓, `verify-wasm-path.sh` ✓. Manual acceptance still PENDING (user-side native desktop).
- **Coordination:** rebased onto `ca79555` (no conflicts, no force-push); INT-0009 filed (timeline marker projection, pending Leader); BLOCKERS AI-C section added; ATTENDANCE + PROJECT_BOARD updated. Full forensic report: `PROJECT_COORDINATION/AI-C_REPORT.md`.

## 2026-08-22 — Leader orders issued + AI-C integration verified (AI-01)

- Fetched remote `dd2f37d` (AI-C SYS-16 Layers increment + post-corpus reconciliation; 606 UI tests green, cargo 20 suites, wasm-pack ok).
- Verified INT-0009 (timeline ✕ = view projection, FL-0009 compliant); added INT-0010 (authorize `layer:changed{layerId,op}` — already canonical SYS-01 §27.1, resolves BLK-AIC-003).
- Forensic note: AI-C cited "F-20-02/03" (nonexistent) — real evidence = F-20-01 + F-20-04 (FL-0026 citation drift; non-blocking).
- Created `LEADER_ORDERS.md` with explicit per-worker orders (AI-A audit-first, AI-B SYS-09/12, AI-C SYS-16-remainder/SYS-15, AI-D SYS-28).
- Overriding unlock: Blueprint+Phase-2/2.5/3+engineering authority outranks the QUEUED specs → workers authorized to implement on that authority (with STOP+register for ambiguities).

## 2026-08-22 — MASTER BASELINE RECONCILIATION (AI-01 Leader)

- **Fast-forwarded local `f59f1a5` → remote `b4c4ae2`** (22 worker commits preserved: SYS-01/SYS-02 implementation + tests, AI-D + AI-B reports, ATTENDANCE, worker BLOCKERS).
- **Committed the canonical reading pack** that workers (AI-B, AI-D) were blocked on: `AI01_FORENSIC_LESSONS.md` (FL-0001..0034), full `PROJECT_COORDINATION/`, `FORENSIC_SPECS/` (SYS-01/02/03), `MASTER_FEATURE_INVENTORY/`.
- **Semantically merged `BLOCKERS.md`**: worker entries (BLK-D-001..004, BLK-B-001..005) preserved verbatim + Leader entries (BLK-001..010, FND-001). Resolved BLK-D-001/002 + BLK-B-001/002 (the missing pack now exists).
- **Preserved** worker AI-B_REPORT.md + AI-D_REPORT.md + ATTENDANCE.md (real, not scaffolds). Removed only my own stale AI-A/AI-C report placeholders.
- No force-push, no history rewrite, no worker commit destroyed. Mode-only `scripts/` drift discarded (content unchanged).

## 2026-08-22 — Final pre-split gate: 4-AI SPLIT = BLOCKED (AI-01)

- Verified canonical lessons file: EXISTS, intact (FL-0001..0034, append-only), NOT manufactured. Real gap = untracked in git.
- Verified source hierarchy locked · foundation coherent · 0 drift.
- Native runtime = PENDING (no rustc/cargo; cannot build/run core).
- SYS-03 = NOT IMPLEMENTED (honest).
- Traced 8 user-observed save/identity failures: SPEC-defined, IMPL-absent, NOT TESTED.
- Identity matrix (14 ops) reconciled — ID never drifts, path≠identity, title≠identity.
- Registered AMB-H05-002 (duplicate-title disambiguation) + BLK-008 (native runtime) + BLK-009 (uncommitted corpus) + BLK-010 (dup title).
- Verdict: 4-AI SPLIT = BLOCKED (5 blockers).

## 2026-08-22 — Foundation contract published (AI-01, resolves FND-001)

- Created `FOUNDATION_CONTRACT.md` (7 modules: BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) + `FOUNDATION_FINAL_FORENSIC_REPORT.md`.
- Adversarial cross-module audit: 0 ownership/command/event/payload/state conflicts; 0 mutation bypasses; 0 circular deps.
- Two non-blocking residuals recorded (not hidden): F-1 ID-type code migration (u64→UUID, P-10); F-2 custom-ease Bézier format (deferred SYS-23).
- RGBA-vs-OKLab clarified (storage vs interpolation — FL-0031 instance).
- FND-001 → RESOLVED. Foundation gate = PASS.

## 2026-08-22 — Master coordination infrastructure created (AI-01)

- Created `PROJECT_COORDINATION/` (8 files + HANDOFFS/).
- Verified current state: SYS-01 LOCKED; SYS-02 H00–H14 (H01/H07 REVISION REQUIRED); SYS-03 00+H00–H07 (H02 REVISION REQUIRED); SYS-04..28 QUEUED.
- Registered 5 open product decisions (D-0001..0007) + 7 blockers (BLK-001..007) + 1 foundation blocker (FND-001).
- Recorded 7 cross-system integration items (INT-0001..0007) + 2 stale cross-file notes (SYS-01 §30, SYS-02_file.md §8) + 1 stale-fix already applied.
- Confirmed AI allocation (A: SYS-01..07, B: SYS-08..14, C: SYS-15..21, D: SYS-22..28) with the dependency-verification caveat.
- Git: branch `main`, no remote configured (push target = https://github.com/cronyzo7694-sudo/Kineora-Animation, deferred until code exists).

### Earlier (this session, before coordination infra)

- SYS-02 H00–H14 full reconciliation + adversarial audits (H00-H04, H05-H08, H00-H08 final).
- SYS-03 00 + H00–H07 authored; AMB-S03-001/002/004/005 resolved; AMB-S03-003 narrowed to the format list.
- AI01_FORENSIC_LESSONS.md grown to FL-0001..0034 (34 lessons).

---

## Status vocabulary (authoritative)

`SPECIFIED → AUDITED → READY FOR IMPLEMENTATION → IMPLEMENTED → AUTOMATED TESTED → MANUALLY ACCEPTED → COMPLETE`
Plus: PLANNED / DISCOVERY / SPECIFICATION / AUDIT / REVISION REQUIRED / TESTING / INTEGRATION / BLOCKED.

"COMPLETE" = SPEC + IMPL + AUTOMATED + BUILD + RUNTIME + MANUAL + INTEGRATION all pass. Never from documentation alone (FL-0018).

---

*Append-only. Each entry: date + what + why + affected systems + status.*

## 2026-08-22 — Leader state-establishment (supervision standby)

- Verified repository state: only `main` branch exists (no ai-a/b/c/d branches); only 1 commit `f59f1a5`; no worker activity yet.
- Created worker report scaffolds `AI-A/B/C/D_REPORT.md` (all = NOT STARTED, gate BLOCKED).
- Confirmed coordination layer complete: 11 shared files + 4 report channels + HANDOFFS/.
- Leadership posture: supervision STANDBY — 4-AI SPLIT remains BLOCKED (5 blockers: native runtime PENDING, SYS-03 not implemented, 5 product decisions, corpus unversioned, 8 failures untested). No worker is active in this environment; when workers DO run, their first read = lessons + MASTER_EXECUTION_PLAN + CROSS_SYSTEM_CONTRACT + FOUNDATION_CONTRACT.

## 2026-08-22 — AI-D · SYS-28 Persistence increment 1 (`8656ac1`)
- MOD-PERSIST TS boundary: formatVersion=1 stamped on write (P-9 closed at boundary), pure
  `migrate(from,to)` (v0→v1), newer-version REFUSED, corrupt REFUSED, FNV-1a checksum.
- MOD-AUTOSAVE: 2s-debounce/30s-cap → `.autosave` slot (native = `<path>.autosave` via the shell
  atomic seam; browser = dev harness); INV-AS-1 manual-save-supersedes; never emits
  `saving:changed`, never touches DIRTY.
- Launch recovery prompt (H00 T12–T14): Accept → CLEAN + `openSet:changed` then
  `activeDoc:changed`; Discard → slot cleared, no events; corrupt slot → skip + toast.
- SYS-02 wiring only at pre-marked H10 §5.1/§5.2 seams (INT-AID-001). AMB-002/003 untouched.
- NEW registers: AMB-D-001 (pathless desktop autosave), BLK-D-005 (Rust toolchain absent —
  core parity queued). Tests +36; suite 677/677; tsc clean. Manual desktop QA pending.

## 2026-08-22 — Integrated forensic audit round 1 (AI-01 Leader)

- Audited `c648fbf..b4dc9b7` (8 worker commits). Read all 4 worker reports + spot-checked
  edit_ops.rs / persist.ts / autosave.ts against claims.
- Verdicts: SYS-09/12/16 = PASS (automated); SYS-01/02/03/28 = PARTIAL; SYS-04 = SPEC-ONLY.
  No SYS COMPLETE. Native runtime PENDING for all.
- INTEGRATED FOUNDATION GATE = PARTIAL (2 foundation gaps: MOD-DOC formatVersion at TS-only,
  MOD-COMMAND prevSelection absent; 2 command drifts in SYS-01; ~16 open product decisions;
  native unverified).
- Created INTEGRATED_AUDIT.md (per-SYS + cross-SYS + defects + missing tests + decisions + next assignments).
- Next assignments issued: AI-A SYS-05, AI-B SYS-10/11, AI-C SYS-15, AI-D SYS-27 (TS only).
  Sequencing rec: resolve 6 blockers + land C-1/C-2 foundation parity before next full round.

## 2026-08-22 — AI-D · SYS-28 C-1 Rust parity (`a9324ea`) + SYS-27 slice 1 (`689febe`)
- C-1 CLOSED at code level: `formatVersion` now in MOD-DOC (serde default 0; writer = SYS-28 on
  write) + Rust MOD-PERSIST fsync/checksum-sidecar/pure-migrate/refusals. cargo 306/306 (native),
  wasm32 check clean — first Rust toolchain run of the project (BLK-D-005 actionable half resolved).
- SYS-27: REAL engines for SVG sequence export (range + fps sidecar) and HTML5 publish
  (self-contained player, fps/loop). `export:done{format,path}` emitted for the first time
  (contract §D producer). Video/GIF/movie + publish settings/profiles remain honest handoffs.
  Import = BLOCKED on MOD-DOC asset entities (BLK-D-006). UI suite 711/711; tsc clean.

## 2026-08-22 — AI-D · build restoration (INT-AID-005) + SYS-23 MOD-EASING completion
- Rust+WASM build FULLY restored: 3 lost SYS-16 facades reconstructed verbatim from AI-C's own
  artifacts (Rule-17 repair, review requested) · arrange bridge de-mangled · wasm.rs EOF fragment
  removed · invalid legacy-JSON test fixture rebuilt. BLK-D-007 CLOSED. First clean wasm32 check
  since 9128ad9. cargo 313→320/320, UI 736/736.
- SYS-23: MOD-EASING complete per eng 08 REQ-TWN-004 (quart/quint/expo/circ/back/elastic/bounce +
  steps(n), canonical Penner constants, 7 property tests). Motion-tween-ready easing surface.

## 2026-08-22 — AI-B: Edit-menu forensic — block paste/duplicate on folder layer (`40999d7`)

- Audited every Edit command end-to-end (Undo/Redo, Cut/Copy, Paste center/place/special, Duplicate, Delete, Select All/Deselect, Find) against Blueprint §1.2.2 + SYS-03 H00/H02. Undo/redo selection restore (C-2), locked-only cut (no fake mutation), single-event-per-gesture, clipboard SESSION boundary all verified.
- **Bug (data loss):** `paste_objects`/`duplicate_objects` blocked hidden/locked active layers but NOT folders. `draw_rect` already refused folders; a paste onto a folder inserted nodes into the node table while `ensure_keyframe` on a folder left them unreachable by the renderer (orphans) and still pushed an undo entry. Fixed: folder active layer now returns false pre-mutation (`paste:blocked(active layer is a folder)`), no command, no selection change; duplicate inherits. Added Rust regression test.
- Paste Special remains intentionally deferred (AMB-S03-003); Find & Replace deferred (no text model). No feature creep.
- UI 756/756 green; tsc + vite build green. Rust/cargo NOT RUN — toolchain unavailable (honest; flagged for CI).
## 2026-08-22 — AI-D · Insert ▸ Scene (Insert-menu round, INT-AID-006)
- Blueprint §1.2.4 + Part 25.1 exactly: append "Scene N" with a default timeline, becomes active
  (re-bind: selection cleared, playhead 1). One undo step, stable SceneId identity, dirty via
  snapshot, `document:changed{type:'scene'}`. Insert-menu inventory audited: New Symbol/F5/F6/F7/
  Classic Tween FUNCTIONAL (verified), Motion/Shape Tween honestly DEFERRED (model units missing),
  Scene now FUNCTIONAL. Rust 338/338 · UI 764/764 · tsc/build clean · wasm32 clean.

## 2026-08-23 — AI-A · Export forensic research (docs only)
- Added `PROJECT_COORDINATION/EXPORT_FORENSIC_RESEARCH.md` — implementation-grade contract for
  SYS-27 coding agents (26 sections). RESEARCH-ONLY: no `animator/` changes, no invented AMBs
  as decisions, engines remain AI-D/SYS-27, H08 stays handoff-only.
- Records existing slice (stills + SVG-seq + HTML5 player + `export:done`) as PARTIAL+; GIF/video
  stay honest toasts; AMB-EXP-001..013 open; next File-menu feature after Save remains Open.
- SYS-27 **not** marked COMPLETE.

## 2026-08-23 — AI-AGENT · slice A4 — 12-stage action validator + reference resolution + adversarial fuzz
- `animator/ui/src/ai/validate.ts` (NEW, ~1120 lines) — the fail-closed pipeline from spec 05/15:
  1 parse → 2 envelope shape → 3 action vocabulary (registry-derived, fail closed) → 4 closed
  param schema (own-property only — `in` was leaking `toString`/`constructor`/`__proto__`; fixed)
  → 5 strict values (no coercion, no expression strings; safe-integer frames; #rrggbb colors
  normalized; control/format chars rejected, ordinary Unicode incl. Hindi welcome) → 6 $variable
  substitution (scalars only — variables can NEVER fabricate targets; substituted values re-pass
  stage 5) → 7 deterministic reference resolution ({ref}/{lastCreated} plan-local symbolic,
  {selected:true}, {ordinal}, aliases n1/l10/s2, bare numeric strings, LAYER-INDEX numerics,
  unique-name lookup w/ ambiguity → candidates, node names honestly refused — engine gap) →
  8 live document state (keyframe/tween/frames predicates, setParent folder+cycle) →
  9 guards (folder/hidden/locked incl. ANCESTOR-effective flags; ASK mode E_TIER) →
  10 capability honesty (E_CAPABILITY; unsupported vs deferred wording per AI-REQ-112) →
  11 budgets (64 actions, 256 estimated mutations, 1000 selection cap; mass-destructive FLAG
  >20 nodes or >50% of scene) → 12 dry-run compile (symbolic-ref closure + humanText rows).
  Stable error taxonomy E_PARSE/E_SCHEMA/E_RANGE/E_REF/E_STATE/E_GUARD/E_TIER/E_CAPABILITY/
  E_BUDGET/E_COMPILE/E_UNKNOWN; anything unknown degrades to E_UNKNOWN, never a crash.
- Caught+fixed during A4 test design: plan-local {ref} layer params were probed against the LIVE
  snapshot (bouncing-ball-class plans false-failed stage 8) → live probes now skip non-numeric
  layer params (A5 runner revalidates at apply); collectConcreteNodeIds picked up scalar numbers
  (copies/x/y) as "node ids" → now schema-aware (node-ref params only); raw control chars in a
  regex literal made the file binary-ish → escaped form; TS 5.9 never-narrowing gotcha —
  never-returning bail-outs must be function DECLARATIONS, arrow consts silently break CFA.
- `validate.test.ts` (77 tests) — every stage behaviorally, incl. the spec's bouncing-ball golden
  plan, adversarial set (hostile Unicode, __proto__ envelopes, invented/stale ids, expression
  attempts), purity proofs (deep-frozen snapshot untouched; params JSON-round-trip strict;
  concrete targets ⊆ snapshot entities) and dynamic-discovery proofs (manifest feature flip /
  new shape kind re-gate with ZERO validator edits — AI-REQ-111).
- `validate.fuzz.test.ts` (4 tests, seeded mulberry32) — 600 hostile inputs: never throws, every
  failure in the E_* taxonomy with real stage + UI-safe message, ok-plans only use supported
  actions and real/symbolic targets, snapshot byte-identical afterwards; run-to-run determinism;
  curated-valid stream keeps ok:true coverage honest (600 inputs, seed 0xa4: 547 fail-closed, 53 ok).
- Addendum (formal A4 approval pass): explicit regression tests for AI-REQ-023 (vocabulary
  carries duplicate/reuse families; partial edits validate as partial params — unchanged channels
  stay absent; keyframe.duplicate carries coordinates only, no recreation payload) and budget
  immutability (AI_BUDGETS frozen; bogus caller overrides ignored; maxInFlightRequests=1).
- Gate: tsc -b clean · UI vitest 1052/1052 (76 files, +85) · vite build clean. UI-side ONLY —
  no Rust touched (cargo n/a). No engine/doc mutation path exists in this module by construction.
