# F-07-04 — PLAYHEAD
```
SOURCE BLUEPRINT: Part 07 §7.1.3 · DEEP FEATURE: F-07-04 · STATUS: AUDITED
DEPENDS ON: F-07-01/03
```
## A. IDENTITY
1. Official name: Playhead (Adobe `time.html`). 4. Purpose: the "now" cursor — indicates the current frame, drives the stage, scrubs, and is the target of frame commands. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `time.html`: "Playhead indicates the current frame displayed on the Stage. As a document plays, the playhead moves from left to right." E2 [OFFICIAL] frames-keyframes: click a frame selects it (playhead follows). E3 [COMMUNITY] double-click playhead = select entire column (F-03-07 E4). E4 [OFFICIAL] Control menu: play (Enter), step (./,), rewind, go-to-end. E5 [INFERENCE] scrubbing with audio plays stream audio at scrub position (Part 17).

## C. CONTROLS
| Action | Behavior |
|---|---|
| Drag the playhead handle | scrub (stage + timeline update live) |
| Click a frame cell | jump to that frame (E2) |
| Double-click the playhead | select entire column (E3) |
| Enter | play/pause from playhead (E4) |
| . / , | step one frame forward/back (E4) |
| Home/End | first/last frame |
| Alt+, / Alt+. | jump prev/next keyframe (F-03-08 E4) |
| Drag on stage (Time Scrubber) | scrub anywhere (Part 02d) |

## E. STATES
| State | Playhead |
|---|---|
| Stopped | red line at current frame |
| Playing | advances per tick (fps) |
| Scrubbing | follows pointer; audio scrubs (E5) |
| Looping | wraps to start at end (if loop ON) |
| Past duration | clamps to last frame |

## L. LIMITATIONS
L.1 Scrubbing stream audio is CPU-heavy on long docs → ours: scrub-audio toggle (default ON for stream). L.2 No numeric "go to frame" → ours: Ctrl+G go-to-frame dialog.

## M. EDGE CASES
M.1 scrub past end (clamp) · M.2 scrub during playback (pause-then-scrub) · M.3 double-click column on empty layer · M.4 playhead on a blank keyframe (empty stage) · M.5 loop wrap boundary.

## O/P/Q/R/S/Y
Data: playhead frame index (view). Events: `playhead:moved` {frame, scrubbing} throttled during scrub. Undo: none. Serialization: not persisted (reopens at frame 1 — ours: optionally restore last frame, P2). Mobile: drag playhead / drag stage (Time Scrubber) / tap frame. Implementation: Playhead component + PlaybackController (Part 32.6).

## TESTS
TS-01 drag scrubs · TS-02 click frame jumps (E2) · TS-03 double-click = column (E3) · TS-04 Enter play/pause · TS-05 ./step · TS-06 Home/End · TS-07 Alt+,/. keyframe hop · TS-08 clamp past end · TS-09 scrub audio (E5) · TS-10 loop wrap · TS-11 go-to-frame dialog (ours) · TS-12 no undo · TS-13 mobile scrub.
## AUDITS
No contradiction. Self-challenge: overlooked = double-click-column (E3) + Alt-keyframe-hop + scrub-audio coupling — covered.
```
FEATURE COMPLETE: F-07-04 — Playhead — AUDITED
```
