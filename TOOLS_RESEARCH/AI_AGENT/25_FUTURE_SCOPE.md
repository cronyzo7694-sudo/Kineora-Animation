# 25 — FUTURE SCOPE (researched, deliberately NOT in MVP)

Ordered by dependency readiness. Each item lists its blocker so "future" never means "forgotten".

| # | Capability | Blocker / trigger |
|---|---|---|
| F1 | Pen/Pencil/Brush/Line/Eraser/Width actions (freehand draw, stroke editing) | **PATH model** (tools lane phase 3) — then add actions+schemas+manifest rows only |
| F2 | PolyStar/rounded-rect/arc-donut creation params | tools lane rect-group increment (in flight) — manifest+schema edit |
| F3 | Text actions | Text tool (tools lane) |
| F4 | Per-node opacity → fade intents | E-AI-6 + Blueprint-parity DECISION |
| F5 | Named easing library (bounce/elastic…) | wire `easing.rs` Penner set into tween eval + extend ClassicTween (engine DECISION; spec §Part-09 alignment) |
| F6 | Vision: canvas-PNG verify, reference images, storyboard assist | 18; provider vision tiers; user opt-in UX |
| F7 | AUTO mode + trust levels + longer agent runs | MVP trust data + budgets telemetry; cancellation hardening |
| F8 | Project-file variables + template library ("bounce preset") | document schema DECISION (meta ownership fixed today) |
| F9 | Desktop app: OS keychain key storage | desktop shell decision |
| F10 | Public-hosting key proxy + server quotas | deployment decision; adapter already endpoint-flexible |
| F11 | Character animation helpers (pose-to-pose keying over symbols; walk-cycle macros) | symbols mature + F1; research needed on pose vocab |
| F12 | Multi-agent / specialist agents (layout-agent, timing-agent) | post-MVP architecture; orchestrator already single-owner so adding agents = lockings research |
| F13 | Autonomous longer-form generation ("30-second intro banao") | F7 + cost controls + storyboard vision |
| F14 | Library asset generation (text-to-image → import as bitmap asset) | import pipeline doesn't exist yet (engine supports no bitmap nodes) |
| F15 | Camera/scene-direction actions | camera feature (16_TIME_SCRUBBER_CAMERAS research) not in engine |
| F16 | Cross-scene/multi-doc actions | session fns + DECISION |
| — | 3D, rigging/bones, video output | **permanently excluded** (spec scope) |

## Re-lighting rule

When a blocker clears, the upgrade path is: manifest row → action schema (+engine mapping if net-new Command) → few-shot example → tests. The agent subsystem is designed so F1–F5 are *edits, not rewrites* (07).
