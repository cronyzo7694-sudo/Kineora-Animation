# 00_ENGINEERING_INDEX — PHASE 3 ENGINEERING MASTER SPECIFICATION

Build target: an **original** professional 2D animation editor (Adobe Animate-class, cross-platform: Windows/macOS/Linux/browser/tablet).

Source-of-truth chain: **Phase-1 blueprint (36 parts) → Phase-2 deep research (405 features) → Phase-2.5 UI contracts (38)**. Phase 3 converts them into an implementation contract. No redesign, no simplification.

## Files
| File | Contents | Status |
|---|---|---|
| 00_engineering_index.md | this index | DONE |
| 00_engineering_decisions.md | decision log (ENG-xxx) | — |
| 00_engineering_risks.md | risk register (RSK-xxx) | — |
| 01_requirements.md | REQ registry + traceability backbone | — |
| 02_module_architecture.md | module tree + per-module spec | — |
| 03_document_model.md | authoritative data entities | — |
| 04_state_machines.md | state machines (playback/export/modal/tool/edit/command) | — |
| 05_command_system.md | command registry + undo/redo model | — |
| 06_rendering.md | rendering pipeline + overlays | — |
| 07_timeline_keyframe_engine.md | timeline + keyframe + frame engine | — |
| 08_tween_easing_engine.md | motion/classic/shape + easing + motion path | — |
| 09_symbol_rig_ik_engine.md | symbol + rig + IK solver + warp | — |
| 10_audio_lipsync_engine.md | audio + lip sync | — |
| 11_ui_engineering.md | panel/dock/overlay/modal/responsive/shortcut/palette | — |
| 12_input_engine.md | mouse/pointer/touch/keyboard | — |
| 13_persistence.md | save/autosave/recovery/versioning | — |
| 14_import_export.md | import + export pipelines | — |
| 15_testing_acceptance.md | test layers + acceptance criteria (Given/When/Then) | — |
| 16_traceability.md | REQ → feature → contract → module → test matrix | — |
| 17_build_order.md | dependency graph + vertical slice + build phases | — |
| 18_global_audit.md | final cross-phase audit | — |
| 00_PHASE_3_COMPLETE.md | completion report (written last) | — |

## Global conventions (preserved from source material)
- **IDs**: `F-XX-YY` (Phase-2 features) · `C-XX` (UI contracts) · `REQ-XXX-NNN` (requirements) · `MOD-XXX` (modules) · `CMD-XXX` (commands) · `EVT-xxx` (events) · `ENT-xxx` (entities) · `STM-xxx` (state machines) · `ENG-xxx` (decisions) · `RSK-xxx` (risks) · `TS-xxx` (tests).
- **Golden rules** (Phase-1 Part 36): single source of truth (document model) · all mutations = Commands · pure deterministic `evaluate(model, time)` · stable IDs (rename-safe) · local-space rig math + stable bone IDs · sparse frame storage · dirty-region + layer caches · nothing-is-a-black-box · undo-consistent selection · crash-safety (atomic autosave).
- **Notation**: `[ENGINEERING DECISION]` for new decisions; `[ENGINEERING TARGET]` for invented perf numbers; `[ASSUMPTION]` for unverified gaps.
