# F-07-16 — TIMELINE CROSS-INTERACTIONS (audio / symbols / rigging / mobile)
```
SOURCE BLUEPRINT: Part 07 §7.6 · DEEP FEATURE: F-07-16 · STATUS: AUDITED
DEPENDS ON: F-07-01 · FEEDS: Parts 11/14/17/31
```
## A. IDENTITY
1. Official name: (timeline ↔ other systems). 4. Purpose: define how the timeline couples to audio, symbols, rigging, and mobile — the integration contract. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Part 17: audio attaches to a **keyframe**; waveform drawn across frames; Stream sync = frame-synced (drops animation frames). E2 [OFFICIAL] Part 11: graphic instances map their internal frame to the main timeline (loop/once/single); movie clips run free. E3 [OFFICIAL] Part 14: pose layer (green) stores armature poses; bones tween between poses. E4 [OFFICIAL] Part 16: camera layer holds camera keyframes. E5 [OUR DESIGN DECISION] mobile: long-press menus + scrub + ruler pinch (Part 31).

## H/I/J CROSS-INTERACTION MATRIX
| With | Trigger | What changes | What doesn't | User sees |
|---|---|---|---|---|
| Audio | keyframe carries sound | waveform extent; scrub plays stream audio | other layers | waveform + audio on scrub |
| Symbols (graphic) | playhead moves | graphic instance shows mapped internal frame | movie clips | nested anim synced to playhead |
| Symbols (movie clip) | playhead moves | (independent clock) | main timeline | clip loops on its own |
| Rigging | Insert Pose | pose key; bones interpolate | constraints (rig-level) | green span + diamonds |
| Camera | camera keyframes | camera view per frame | layer content | pan/zoom per playhead |
| Mobile | scrub/long-press | playhead / frame menu | doc | touch timeline |

## L. LIMITATIONS
L.1 Graphic-sync vs movie-clip-free confuses ("nested anim not visible on main timeline") → ours: live "play nested clips" preview toggle (Part 11). L.2 Stream audio drops animation frames on slow machines (by design) → ours: warn + quality option. L.3 Pose interpolation = angle lerp (no re-solve) — correct but limited → ours: same + optional on-demand re-solve preview.

## M. EDGE CASES
M.1 scrub audio over a loop boundary · M.2 graphic instance whose symbol is shorter than the span · M.3 movie clip inside a pose layer · M.4 camera layer + attached HUD layers · M.5 audio keyframe deleted mid-waveform.

## O/P/Q/R/S/Y
Data: cross-refs by ID (sound assetId, symbolId, boneId, camera state). Events: `timeline:changed` + subsystem events. Undo: subsystem edits = commands. Serialization: all persisted. Mobile: Part 31 mappings. Implementation: `evaluate(time)` dispatches to Audio/Symbol/Rig/Camera engines (Part 32).

## TESTS
TS-01 audio waveform across frames · TS-02 stream scrub sync · TS-03 graphic frame mapping per playhead · TS-04 movie clip independence · TS-05 pose interpolation between poses · TS-06 camera keyframe view · TS-07 nested-preview toggle (ours) · TS-08 scrub over loop · TS-09 HUD attached layers · TS-10 undo subsystem edit.
## AUDITS
No contradiction. Self-challenge: overlooked = graphic-sync-vs-clip-free + stream-frame-drops + pose-angle-lerp — covered.
```
FEATURE COMPLETE: F-07-16 — Timeline cross-interactions — AUDITED
```
