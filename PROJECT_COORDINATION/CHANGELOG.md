# KINEORA — CHANGELOG (coordination-level)

> Records every meaningful coordination/spec/decision change. SYS-level detail lives in the SYS's own final-report; this is the project-level timeline.

---

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
