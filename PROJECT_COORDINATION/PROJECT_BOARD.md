# KINEORA — PROJECT BOARD

> Live status board. One row per SYS. States: PLANNED → DISCOVERY → SPECIFICATION → AUDIT → REVISION REQUIRED → READY FOR IMPLEMENTATION → IMPLEMENTATION → TESTING → MANUAL ACCEPTANCE → INTEGRATION → COMPLETE · BLOCKED.
> "COMPLETE" requires SPEC + IMPL + AUTOMATED + BUILD + RUNTIME + MANUAL + INTEGRATION all pass. Never used casually.

**Legend:** SPEC = specification · IMPL = implementation · AUDIT = adversarial/forensic audit.

| SYS | Name | Owner | SPEC | IMPL | AUDIT | BLOCKERS | Dependencies | Last verified | Next action |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Application/Workspace | AI-A | **LOCKED (v5)** | **partial (C-3 landed: panel.show/hide + F4 + st.snap projection)** | PASSED | (known stale notes: §30 File▸Close mapping, §8 Close-Others; scene tabs / dock-float / responsive still SPEC-ONLY) | — | 2026-08-22 | remaining SYS-01 leftovers, then C-2 if authorized. **Not COMPLETE.** Native QA PENDING |
| 02 | File | AI-A | H00–H14 | gap (single-Session) | PASSED (H00–H14 reconciled) | **AMB-H01-002/003 (H01), AMB-H07-001 (H07)** | SYS-01, 28, 27, 18, 03, 08 | 2026-08-22 | resolve 3 product decisions |
| 03 | Edit | AI-A | 00+H00–H07 | partial (History, frame_clipboard) | PASSED (H00–H07) | **AMB-S03-003 (H02 format list)** | SYS-01, 02, 14, 15, 19, 20 | 2026-08-22 | resolve 1 product decision |
| 04 | View | AI-A | QUEUED | — | — | — | SYS-01, 14 | 2026-08-22 | await naming |
| 05 | Insert | AI-A | QUEUED | — | — | — | SYS-15, 19 | 2026-08-22 | await naming |
| 06 | Modify | AI-A | QUEUED | — | — | — | SYS-20, 22, 15 | 2026-08-22 | await naming |
| 07 | Text | AI-A | QUEUED | — | — | — | SYS-14, 20, 21 | 2026-08-22 | await naming |
| 08 | Commands | AI-B | QUEUED | palette absent | — | — | SYS-01 | 2026-08-22 | await naming |
| 09 | Control/Playback | AI-B | QUEUED | **partial (STM-PLAYBACK + handoffs `9064b70`)** | — | — | SYS-15, 26, 27 | 2026-08-22 | STM-PLAYBACK IDLE/PLAYING/PAUSED; mute→SYS-26 + test→SYS-27 handoff toasts; playhead:moved; Ctrl+Enter D-6; manual desktop QA PENDING |
| 10 | Debug | AI-B | QUEUED | **partial (Dev panel + Output console `7ebc3cc`)** | — | — | SYS-01 | 2026-08-22 | Output console (info/warn/error/debug, copy/clear); bus errors + notify mirrored; debug.as3 UNAVAILABLE (historical); P2 scripting inspector deferred |
| 11 | Window | AI-B | QUEUED | **partial (panel toggles + workspaces + Hide/Show All `7ebc3cc`)** | — | — | SYS-01 | 2026-08-22 | F4 Hide/Show All Panels (restore snapshot); panel dock/float/presets deferred (SYS-01 unit) |
| 12 | Help | AI-B | QUEUED | **partial (local docs + troubleshooting `9064b70`)** | — | — | SYS-01 | 2026-08-22 | offline HelpDialog (docs/troubleshoot); about/shortcuts already FUNCTIONAL; manual QA PENDING |
| 13 | Tools | AI-B | QUEUED | 5 tools | — | — | SYS-14, 03 | 2026-08-22 | await naming |
| 14 | Stage | AI-B | QUEUED | partial | — | — | SYS-01, MOD-VECTOR | 2026-08-22 | await naming |
| 15 | Timeline | AI-C | QUEUED | partial (hidden ✕ `a562052` · collapsed-folder row hide turn 3) | — | **RSK-001 (high)** | SYS-14, 16 | 2026-08-22 | frame ops already deep; folder hide is view projection |
| 16 | Layers | AI-C | QUEUED | **extended: outline/dup/batch/drag-through + F-20-05 folders (create/nest/cascade/collapse/delete-group)** | — | BLK-AIC-002; AIC-003 RESOLVED | SYS-15 | 2026-08-22 | remaining: Layer Properties dialog, mask/guide types, copy-paste layer, parenting F-20-06; manual QA PENDING |
| 17 | Properties | AI-C | QUEUED | partial | — | — | SYS-14, 03 | 2026-08-22 | await naming |
| 18 | Library | AI-C | QUEUED | partial | — | — | SYS-19, 27 | 2026-08-22 | await naming |
| 19 | Symbols/Instances | AI-C | QUEUED | partial | — | **RSK-002 (high)** | SYS-15, 18 | 2026-08-22 | await naming |
| 20 | Drawing/Shapes | AI-C | QUEUED | partial | — | — | SYS-14, 03 | 2026-08-22 | await naming |
| 21 | Color | AI-C | QUEUED | partial | — | — | SYS-20 | 2026-08-22 | await naming |
| 22 | Transform | AI-D | QUEUED | partial | — | — | SYS-14, 03 | 2026-08-22 | await naming |
| 23 | Tweening | AI-D | QUEUED | partial | — | — | SYS-15, 19 | 2026-08-22 | await naming |
| 24 | Onion/FBF | AI-D | QUEUED | — | — | — | SYS-15 | 2026-08-22 | await naming |
| 25 | Camera | AI-D | QUEUED | — | — | — | SYS-15, 16 | 2026-08-22 | await naming |
| 26 | Audio | AI-D | QUEUED | — | — | **RSK-004/005 (lipsync/desync)** | SYS-15, 19 | 2026-08-22 | await naming |
| 27 | Import/Export/Publish | AI-D | H08 handoff READY | export-image only | PASSED (handoff) | — | SYS-14, 18, 25, 26 | 2026-08-22 | await naming |
| 28 | Persistence | AI-D | H10 handoff READY | atomic save/load native-only | PASSED (handoff) | AMB-002/003/004 (H10) | SYS-02 | 2026-08-22 | await naming |

---

## Cross-cutting foundation (not a single SYS — see CROSS_SYSTEM_CONTRACT §C)

| Module | Owner (build phase) | Status |
|---|---|---|
| MOD-BUS, MOD-STATE, MOD-COMMAND, MOD-VECTOR, MOD-COLOR, MOD-EASING, MOD-DOC | **P0/P1 (shared foundation — Leader-owned contract)** | **CONTRACT PUBLISHED** (`FOUNDATION_CONTRACT.md`, gate = PASS; FND-001 resolved) |

---

## Open product decisions (gating READY)

| Decision | Blocks | Status |
|---|---|---|
| AMB-H01-002 (duplicate template name) | SYS-02 H01 | PENDING HUMAN |
| AMB-H01-003 (seeded-doc identity) | SYS-02 H01 | PENDING HUMAN |
| AMB-H07-001 (next-active after close) | SYS-02 H07 | PENDING HUMAN |
| AMB-S03-003 (Paste Special format list) | SYS-03 H02 | PENDING HUMAN |
| AMB-002/003/004 (identity-recovery / recent store / Tauri wiring) | SYS-02 H10 | PENDING (deferred to H10 integration) |

*(Full detail in `BLOCKERS.md` and `DECISIONS.md`.)*

---

*This board is a snapshot. Every SYS status change MUST be mirrored here + in `CHANGELOG.md` + the SYS's own final-report section. No stale aggregates (FL-0020).*
