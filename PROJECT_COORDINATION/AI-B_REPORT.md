# AI-B_REPORT — Session 1 (2026-08-22)

**Worker:** AI-B — Kineora Animation implementation worker
**Ownership:** SYS-08 (Commands) · SYS-09 (Control/Playback) · SYS-10 (Debug) ·
SYS-11 (Window) · SYS-12 (Help) · SYS-13 (Tools) · SYS-14 (Stage)
**HEAD at session start:** `e3690f7` (feat(sys02-h09-h14)) → **pulled to `f4feb42`** before any
write (AI-D session-2 attendance was on origin).

---

## 1. SYSs implemented
**None yet — intentionally.** The mandatory pre-coding reading pack could not be completed
because most of the mandated files do not exist in the repository or anywhere in its git
history (see §4). Per the forensic rule (**TRACE → SOURCE → ROOT CAUSE · STOP THAT PORTION ·
register blockers · NO GUESSING · NO SILENT DECISIONS · NEVER INVENT MISSING PRODUCT BEHAVIOR**),
AI-B stopped before writing any implementation code and registered blockers instead.

The human coordinator (user) confirmed the standing-by posture on 2026-08-22 IST:
*"git hub par attendance de leader ke order ka wait kar"* → mark attendance on GitHub, wait for
the leader (AI01). This session therefore contains **docs-only coordination commits** — exactly
the standing-by contract AI-D established.

## 2. Files changed (this session)
- `PROJECT_COORDINATION/AI-B_REPORT.md` — NEW: this report
- `PROJECT_COORDINATION/ATTENDANCE.md` — APPEND: AI-B check-in row
- `PROJECT_COORDINATION/BLOCKERS.md` — APPEND: BLK-B-001..005

No implementation, test, or existing product file was touched. No other worker's SYS was
modified. No force-push, no destructive reset.

## 3. Reading completed (what actually exists)
- `KINEORA_AI1_CONTINUITY_HANDOFF.md` — full SYS-01/SYS-02 history; **SYS registry §10** (the
  only place SYS-08..14 are named, all marked "not started"); P-1..P-10 decisions; the
  end-to-end connection contract (§5); specification-authority chain (§6); previous-mistake
  lessons (§7); architecture as it actually exists (§8).
- `animator/STATUS.md` + `animator/00_IMPLEMENTATION_DECISIONS.md` — current unit status;
  H00..H14 reconciliation; deferred-item register.
- `engineering/00_engineering_index.md`, `05_command_system.md` — command/undo model.
- `animate-blueprint/01_application_map.md` §1.2.7–1.2.11 (Commands / Control / Debug / Window /
  Help menus) and §1.3 (Tools panel).
- `phase2.5-ui/contracts/C-03_menus.md`, `C-08_timeline.md` (playback controls).
- Full current source inventory for SYS-08..14:
  `animator/ui/src/{commands.ts (1893 lines), menus.ts, shortcuts.ts, controlRegistry.ts,
  bus.ts, engine/actions.ts, engine/client.ts, App.tsx}` and components
  `{Toolbar, MenuBar, Stage, DebugPanel, StatusBar, TimelineStrip, ...}`.
- Repo/branch topology, full commit history, remote refs.

## 4. Source evidence for the stop decision
- `AI01_FORENSIC_LESSONS.md`: **absent** from tree and `git log --all --name-only` (never
  committed) — same finding as AI-D BLK-D-001.
- `PROJECT_COORDINATION/{MASTER_EXECUTION_PLAN,FOUNDATION_CONTRACT,CROSS_SYSTEM_CONTRACT,
  AI_ASSIGNMENTS,PROJECT_BOARD,DECISIONS,INTEGRATION_LOG,CHANGELOG}.md`: **none ever committed**
  (BLK-D-002). Only `ATTENDANCE.md`, `BLOCKERS.md`, `AI-D_REPORT.md` exist (AI-D created them).
- **SYS-08..14 specifications: none ever committed.** The names exist only in the handoff §10
  registry; the `uploads/SYS-0{1,2}_*.md` pattern referenced by the handoff is also absent from
  the clone (uploads/ is not tracked).
- Remote has a single branch `main`; no AI-A/AI-B/AI-C branches or commits exist yet.

## 5. Current-code baseline audit for SYS-08..14 (evidence, not guesses)
The "not started" registry label is **inaccurate for the menu/command/shell layer** — substantial
pre-forensic foundations already ship and build. The honest state:

| SYS | Already FUNCTIONAL in code | Registered DEFERRED / UNAVAILABLE |
|---|---|---|
| **08 Commands** | Command registry (`commands.ts`) is the single source of truth; menu wired; palette (`palette.open`); validation rejects duplicate ids / unbound FUNCTIONAL / shortcut conflicts | `commands.runSaved`, `copyMotion`, `exportMotion`, `importMotion`, `runScript` (macros/motion-XML/scripting = P2/W13) |
| **09 Control/Playback** | `timeline.play`, `control.stop`, `rewind`, `stepForward/Backward`, `firstFrame/lastFrame`, `nextKeyframe/prevKeyframe`, `gotoFrame`, `loop` — real engine playhead loop in `engine/actions.ts`; bus events `playback:started/stopped` | `control.mute` (no audio engine — SYS-26), `control.test` (Test Movie — SYS-27) |
| **10 Debug** | `panel.debug` Dev panel: registry/dead-button audit, engine status, shell+identity, engine event log, UI events, control list; `bus.onError` failure isolation | `debug.as3` UNAVAILABLE (ActionScript legacy — explicitly out of product); own-scripting-layer inspector is P2 |
| **11 Window** | All panel toggles (tools/timeline/layers/properties/library/debug); workspaces save/save-new/load/reset; persistence via `workspace.ts`; `resetWorkspace` | `window.workspacePresets`; panel dock/float/tab-stack (explicitly deferred by SYS-01 — dedicated docking unit) |
| **12 Help** | `help.shortcuts` (Shortcuts dialog) + `help.about` (About dialog) FUNCTIONAL | `help.docs`, `help.troubleshoot` (local-docs content) |
| **13 Tools** | `tool.select`, `tool.rect`, `tool.transform` FUNCTIONAL — tool state machine (`tool:changed`), cursor/gesture/options wiring, transform handles, marquee, multi-select | ~20 remaining tools (Subselection/Lasso/Pen/Line/Oval/PolyStar/Pencil/Brush/Eraser/Width/Eyedropper/Paint-Bucket/Ink-Bottle/Bone/Asset-Warp/Camera/Hand/Zoom/Text) — owned across SYS-20 drawing, SYS-19 symbols, SYS-25 camera; **huge cross-SYS scope** |
| **14 Stage** | Stage boundary + pasteboard + doc-background render; canvas renderer; viewport zoom/pan (Ctrl+=/-/1/0); screen↔doc coordinate math; select/move/rect/transform gestures; stage-clipped export | Rulers/grid/guides/snapping (`view.*` DEFERRED), pasteboard toggle + Hand tool + Zoom tool + stage rotate (all explicitly deferred in STATUS.md) |

**Conclusion:** SYS-08..14 are not greenfield. Implementing them "from the blueprint" without an
approved spec risks (a) re-inventing behavior that already exists, (b) silently absorbing scope
owned by SYS-03..07 / SYS-15..28, and (c) contradicting the SYS-01 explicit deferrals. This is
the basis for BLK-B-003.

## 6. Decisions taken
- **D-AIB-1:** Do not fabricate or assume the contents of the missing mandatory reading.
  (Authority: forensic rule — never invent behavior; same logic as AI-D D-AID-1.)
- **D-AIB-2:** Do not begin SYS-08..14 implementation without either (a) committed SYS-08..14
  specifications, or (b) explicit AI01/human authorization to proceed on Blueprint +
  Phase 2/2.5 + engineering authority alone.
- **D-AIB-3:** This session is docs-only (attendance + blockers + report). No product code, no
  tests, no edits to other workers' ownership. Matches the AI-D standing-by contract.
- **D-AIB-4:** Commit directly to `main` per the human coordinator's branch instruction
  (answer to branch-strategy question = atomic commits on main; pull before each commit; no
  force push).

## 7. Blockers
BLK-B-001 · BLK-B-002 · BLK-B-003 · BLK-B-004 · BLK-B-005 — see `PROJECT_COORDINATION/BLOCKERS.md`.

## 8. Tests / build / runtime verification
Not run this session — no implementation code was written or modified; doc-only commits do not
require a build gate. The existing suites were left untouched. (When implementation begins, the
full mandated matrix applies per feature: happy/cancel/error/empty/disabled/rapid-interaction/
keyboard/accessibility/state-transitions/command-event ownership/cross-SYS integration/persistence
— plus Rust + Vitest + `cargo fmt`/`clippy` + wasm + native desktop runtime verification.)

## 9. Cross-SYS dependencies (pre-identified for the coming work)
- **SYS-08 Commands** macro/motion/script features depend on the command registry (exists) +
  SYS-23 tweening (motion XML) + the future scripting layer (P2).
- **SYS-09 Control/Playback** mute depends on **SYS-26 Audio**; Test Movie depends on
  **SYS-27 Import/Export/Publish**; live preview / simple buttons depend on **SYS-19 Symbols**.
- **SYS-13 Tools** remaining tools are **shared ownership surface** with SYS-20 (Drawing/Shapes),
  SYS-19 (Symbols/rig), SYS-25 (Camera), SYS-22 (Transform) — a CROSS_SYSTEM_CONTRACT is required
  before drawing-tool implementation to avoid collisions with AI-C/AI-D.
- **SYS-14 Stage** rulers/grid/guides/snapping touch SYS-04 (View) and the input engine;
  pasteboard toggle / Hand / Zoom are deferred-unit items in STATUS.md.
- **SYS-10 Debug** own-scripting-layer inspector is gated on the P2 scripting layer (not yet
  specced).

## 10. Commit hashes
- `d5085d8` — `docs(coordination): AI-B session 1 — attendance + blockers BLK-B-001..005 + report`
  (3 files changed, 204 insertions; pushed to origin/main).
- HEAD at end of session: `d5085d8` (parent `f4feb42` = AI-D session 2 attendance).

## 11. Remaining risks
- Same as AI-D risk: if AI-A/B/C each invent conventions without the CROSS_SYSTEM_CONTRACT,
  parallel work will conflict — **highest-severity gap is the missing coordination pack**, not
  any individual SYS.
- SYS-13 Tools is the largest collision surface (drawing/symbols/camera/transform all intersect
  other workers). It must not start until ownership boundaries are approved.
- The registry's "not started" label for SYS-08..14 will mislead auditors; the true state is the
  baseline table in §5 (foundation layer FUNCTIONAL, deep features DEFERRED/blocked).

## 12. Standing-by contract
While waiting for AI01, AI-B commits **docs-only** coordination updates (attendance, blockers,
this report). No SYS implementation, no test changes, no modification of any other worker's
files. AI-B re-fetches origin before every push per parallel-git rules. Ready to start immediately
on unblock.

---

# SESSION 2 — 2026-08-22 (Leader orders: SYS-09 then SYS-12)

HEAD at start: `bc12025`. Read the full mandatory pack (FL-0001..0034, MASTER_EXECUTION_PLAN,
CROSS_SYSTEM_CONTRACT, FOUNDATION_CONTRACT, AI_ASSIGNMENTS, DECISIONS, BLOCKERS,
INTEGRATION_LOG, CHANGELOG, PROJECT_BOARD) + eng 04 STM-PLAYBACK + blueprint 01 §1.2.7–1.2.11.

## 1. SYSs implemented
- **SYS-09 Control/Playback hardening** (Leader first deliverable).
- **SYS-12 Help** local docs + troubleshooting (Leader second deliverable).
SYS-08/10/11/13/14 not touched this session (narrow scope per Leader; no silent expansion, FL-0001).

## 2. Exact changes
- `animator/ui/src/engine/actions.ts`: rewrote transport as the STM-PLAYBACK machine
  (IDLE/PLAYING/PAUSED). `togglePlay` = IDLE/PAUSED→PLAYING, PLAYING→PAUSED (emits
  `playback:paused`, stops tick). New `pausePlayback()`, `playbackState()`, `isPaused()`,
  `seekPlayhead(frame)`. `stopPlayback` idempotent; tick uses raw `setPlayheadEngine` (no
  per-frame event flood, INT-0012). `startTick` clears any prior interval (no stack).
  Stop halts at the current frame; Rewind is a separate command (Blueprint separates them —
  authority over eng-04's combined "stop→first" note; recorded, not a silent decision).
- `animator/ui/src/bus.ts`: added `playback:paused` (empty payload) per INT-0011.
- `animator/ui/src/commands.ts`:
  - control seek commands (rewind/first/last/stepFwd/stepBack/nextKeyframe/prevKeyframe) route
    through `seekPlayhead` so every user seek emits `playhead:moved{frame}`.
  - `control.mute` DEFERRED→FUNCTIONAL (SYS-26 audio handoff toast, never fakes mute).
  - `control.test` DEFERRED→FUNCTIONAL (SYS-27 publish/preview handoff toast).
  - `control.stop` disabled while IDLE ("playback is stopped"), enabled while playing/paused.
  - `help.docs` / `help.troubleshoot` DEFERRED→FUNCTIONAL → `openHelp(section)`.
  - CommandContext gained `openHelp(section)`; makeCommandContext default no-op added.
- `animator/ui/src/shortcuts.ts`: Ctrl+Enter context-scoping (D-6/INT-0013): inside a symbol
  edit (`editDepth()>0`) it runs `edit.exitRoot`; at document root it runs `control.test`.
  Hardened the target null-check (getAttribute guard for synthetic targets).
- `animator/ui/src/components/StatusBar.tsx`: playback cell re-renders on started/stopped/paused
  and shows ▶ playing / ⏸ paused / ⏹ stopped (was binary playing/stopped).
- `animator/ui/src/components/HelpDialog.tsx` (NEW): offline Documentation + Troubleshooting
  (Esc / outside-click / Close dismiss; future systems honestly labelled).
- `animator/ui/src/App.tsx`: wires `openHelp`, renders `<HelpDialog>`, adds `control.test` to
  the global shortcut scope so Ctrl+Enter fires at root.
- Tests: `sys09-sys12.test.tsx` (16 new). Updated `TimelineStrip.test.tsx`/`MenuBar.test.tsx`
  mocks/assertions to the new seekPlayhead boundary.

## 3. Source evidence
- STM-PLAYBACK states/transitions/forbidden: `engineering/04_state_machines.md`.
- Control menu (Play/Stop/Rewind/Step/Mute/Loop/Test Movie; Enter, Ctrl+Alt+R, ., ,):
  Blueprint `01_application_map.md` §1.2.8; shortcuts Part 29 §29.6.
- Mute Sounds belongs to audio (SYS-26); Test Movie belongs to publish/preview (SYS-27):
  CROSS_SYSTEM_CONTRACT §A/H; H08 handoff pattern (`file.ts` import/export/publish toasts).
- Help = "local docs + shortcut reference + version/about": Blueprint §1.2.11 (offline-first W7).
- D-6 (Ctrl+Enter context-scoped): DECISIONS.md; EditBar tooltip; STM-EDIT (eng 04).
- `playhead:moved` / `playback:*` declared in bus.ts + MASTER_EXECUTION_PLAN §C (SYS-09).

## 4. Decisions (recorded, not silent)
- **D-AIB-4:** Stop = halt at current frame; Rewind is separate (Blueprint authority > eng-04
  combined note). Both remain on the Control menu as distinct items.
- **D-AIB-5:** `playback:paused` added as a bus event (empty payload) rather than overloading
  `playback:stopped` (FL-0007: an event must carry the exact semantic that changed).
- **D-AIB-6:** Only user-initiated seeks emit `playhead:moved`; playback ticks do not
  (advisory event; per-frame flood would be wrong; consumers re-read the engine per §27.0).
- Ctrl+Alt+M (Mute) retained as a pre-existing [ADOBE REFERENCE] binding; it is not a
  Blueprint-required shortcut but removing it would be a behavior change — left intact.

## 5. Blockers
None new for SYS-09/12. The SYS-09 Test/Mute items are handoffs (SYS-26/27) by design.
SYS-13 Tools remains the largest cross-SYS surface and awaits ownership boundaries (not started).

## 6. Tests
- 16 new tests in `sys09-sys12.test.tsx`: STM happy/pause/resume/stop/idempotency/forbidden
  transition/loop-wrap/loop-off-stop; seekPlayhead clamp + event; mute/test handoff toasts;
  stop enablement; all seek commands route through seekPlayhead; Ctrl+Enter depth-0 vs depth-2;
  Help dialog docs/troubleshoot/Esc/outside-click.
- Full UI suite after rebase onto other workers: **693 passed / 693** (51 files).
- `npx tsc -b` clean; `vite build` clean (358 kB bundle).

## 7. Builds
- TypeScript: pass. Vite production build: pass. (Rust/WASM/native desktop not rebuilt this
  session — no core/ changes; AI-D's SYS-28 core changes present and compile in their commit.)

## 8. Runtime verification
Automated only this session (jsdom + Vitest). **Manual native-desktop QA is PENDING**
(FL-0019: automated green ≠ product acceptance). User must verify on Linux Mint:
Enter play/pause, Stop disabled-while-idle, Ctrl+Enter (root = Test toast; in symbol = exit),
Mute toast, Help ▸ Documentation/Troubleshooting.

## 9. Integration risks / INTs registered
- INT-0011 `playback:paused`, INT-0012 `playhead:moved{frame}`, INT-0013 Ctrl+Enter context —
  all three rows added to INTEGRATION_LOG before code; status PROPOSED (landed with SYS-09),
  awaiting Leader verification.
- Rebased onto origin `b247b21` (AI-A SYS-04 spec, AI-C `layer:changed`, AI-D SYS-28
  persistence). `bus.ts` auto-merged with AI-C's `layer:changed`; no semantic conflict.
  `App.tsx`/`commands.ts` auto-merged with AI-D's autosave wiring. Re-ran full suite: green.
- No other worker's SYS implementation was modified.

## 10. Commit hashes
- `9064b70` — `feat(sys09-12): STM-PLAYBACK hardening + mute/test handoff toasts + Ctrl+Enter
  context + local Help docs` (pushed to origin/main; rebased onto `b247b21`, no force-push).

## 11. Next
Stand by for Leader review of INT-0011/0012/0013 and the SYS-09/12 increment. On approval,
next independently-unblocked candidates in range: SYS-11 Window panel-presets/panel-handoffs or
SYS-10 Dev-panel hardening (low collision); SYS-13 Tools requires the cross-worker ownership
contract (drawing ↔ SYS-20, camera ↔ SYS-25, rig ↔ SYS-19) and is NOT started.

---

# SESSION 3 — 2026-08-22 (Deep completion order: SYS-10 Debug + SYS-11 Window)

HEAD at start: `da36772` (AI-01 Round-1 integrated audit). AI-01 verdict: SYS-09/12 PASS at automated level; next = SYS-10 + SYS-11 (panel dock/float explicitly excluded as a SYS-01 deferred unit).

## Audit (before code — no duplicate)
- **SYS-10 Debug**: `panel.debug` (Developer panel) already FUNCTIONAL; `debug.as3` UNAVAILABLE (Blueprint historical-only). Gaps: no Output console / log levels / copy-clear / ARIA log landmark; bus error handler only toasted, did not persist.
- **SYS-11 Window**: all six panel toggles + workspaces + reset already FUNCTIONAL. Gap: F4 "Hide/Show All Panels" (Adobe muscle-memory) absent; no way to toggle all panels at once.

No existing implementations were replaced. The view-controller pattern already in place for Stage/Timeline was extended with a `debugViewController` for menu→panel actions (FL-0009).

## Changes

### SYS-10 Debug
- New `animator/ui/src/outputLog.ts`:
  - Bounded ring buffer (500 entries), monotonic ids, ms timestamps.
  - Levels `info|warn|error|debug`; synchronous pub/sub with per-subscriber fault isolation (matches MOD-BUS §failure).
  - `clear()` resets buffer + id counter; `all()` returns a snapshot; `subscribe()` immediately replays.
  - SESSION-only (no persistence, no undo, no document mutation — boundary documented in the file).
  - Convenience helpers `outputInfo/Warn/Error/Debug`.
- `components/DebugPanel.tsx`:
  - Subscribes to the Output log; renders a `<ul role="log" aria-live="polite">` with timestamp, source tag and level-colored message.
  - Header shows count + error/warn summary; empty-state copy.
  - Registers `debugViewController.current = { clearOutput, outputText }` so Debug-menu commands can act without importing React.
- `App.tsx`:
  - `bus.setErrorHandler` now writes to `outputError('bus', ...)` before toasting.
  - `notify()` mirrors every toast into the Output console with a level derived from simple substring heuristics (fail/error/not-attached → error; gap/future/not-implemented → warn; else info).
- `commands.ts`:
  - New `debug.clearOutput` (FUNCTIONAL) and `debug.copyOutput` (FUNCTIONAL) with honest clipboard failure reporting and a `textarea+execCommand` fallback for non-secure contexts.
  - New `DebugViewController` interface + `debugViewController` singleton.
- `menus.ts`: Debug menu now contains Developer Panel · Clear Output · Copy Output · (sep) · ActionScript Debugger (legacy, UNAVAILABLE).

### SYS-11 Window
- `commands.ts`: new `window.hideAllPanels` command (FUNCTIONAL, shortcut F4). Checked when any panel is visible. `run()` calls `ctx.setAllPanelsVisible(!anyVisible)`.
- `CommandContext` gains `setAllPanelsVisible(visible: boolean)` with a default no-op in `makeCommandContext`.
- `App.tsx`:
  - Implements `setAllPanelsVisible` using a `hiddenAllSnapshot` ref: hide snapshots current visibility and emits one `panel:changed` per known panel; show restores the snapshot or falls back to `DEFAULT_VISIBILITY`.
  - Adds `window.hideAllPanels` to the global shortcut scope; the existing dispatcher suppresses F4 in inputs/textareas/contentEditable (typing-safe).
- `menus.ts`: "Hide All Panels" added between the per-panel list and Workspaces submenu.

## Commands / events / state contracts
- New commands (no collisions — verified by `validateCommands` lint): `debug.clearOutput`, `debug.copyOutput`, `window.hideAllPanels`.
- No new bus events. Output console uses an internal pub/sub, deliberately NOT on the global bus (it is a Dev-only surface; adding its events to SYS-01's locked event set would be scope expansion, FL-0001).
- `panel:changed` payload unchanged (`{id,change:'visibility',visible?}`) — one emission per affected panel, matching the existing contract.

## Cross-SYS dependencies
- SYS-10 consumes SYS-01 (bus errors, panel chrome), SYS-09/12 (toasts already produced there). Owns only its own Output log.
- SYS-11 consumes SYS-01 panel visibility + workspace persistence (the existing snapshot save effect persists the all-hidden/restored layout). No SYS-01 contract changed.
- No INT required: neither change touches another SYS's command/event/payload. The DebugPanel already renders SYS-18/Library etc., but only via existing props.

## Tests
- New `outputLog.test.ts` (6): append ids/timestamps, subscribe replay, clear resets buffer+counter, 500-cap ring eviction, throwing subscriber isolation, level helpers.
- New `sys10-sys11.test.tsx` (16): Output render from pre-mount entries, count summary, empty-state, Clear, Copy-empty + Copy-with-clipboard + fallback, debug.as3 UNAVAILABLE, registry audit readout; F4 checked state + dispatcher invokes command once + input suppression.
- `menus.test.ts`: required-commands list now includes `window.hideAllPanels`, `debug.clearOutput`, `debug.copyOutput`.
- Full UI suite after rebase onto AI-C's SYS-16 folders (`0be97e5`): **712 passed / 712** (53 files). `tsc -b` clean, `vite build` clean (362.95 kB bundle).

## Manual QA status
PENDING (FL-0019) — jsdom-level automated only. User to verify on Linux Mint: Dev panel Output fills with bus/notify messages; Debug ▸ Clear/Copy; F4 hides all panels, F4 again restores the same layout; typing in a field does not trigger F4.

## Build / runtime
TypeScript + Vite pass. No Rust/WASM/Tauri code touched this session; native runtime NOT exercised (BLK-D-005-style environment gap — recorded, not faked).

## Remaining blockers / decisions
None new. `window.workspacePresets` stays DEFERRED (Blueprint silent on preset catalog; a saved-workspace list already exists via Window ▸ Workspaces). Panel dock/float/tab-stack remains a SYS-01 deferred unit (AI-01 explicitly forbade absorbing it).

## Commit
- `7ebc3cc` `feat(sys10-11): Output console (SYS-10) + Hide/Show All Panels F4 (SYS-11)` — rebased onto `0be97e5`, no conflicts, fast-forward push.

## Status update
- SYS-10 Debug: **PARTIAL** — Dev panel + Output console are FUNCTIONAL and tested; the P2 "inspector/debugger for the scripting layer" remains correctly UNAVAILABLE (no scripting layer exists yet).
- SYS-11 Window: **PARTIAL** — every Blueprint-required panel toggle + workspace + Hide/Show All (F4) FUNCTIONAL; panel dock/float/presets deferred per SYS-01.
