# F-07-03 — FRAME RULER (HEADER)
```
SOURCE BLUEPRINT: Part 07 §7.1.2 · DEEP FEATURE: F-07-03 · STATUS: AUDITED
DEPENDS ON: F-07-01
```
## A. IDENTITY
1. Official name: "Timeline header" (Adobe `time.html`). 4. Purpose: shows **frame numbers**, indicates the current frame, and supports click-to-jump. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `time.html`: "The Timeline header at the top of the Timeline indicates frame numbers." E2 [OFFICIAL] `time.html`: playhead indicates the current frame. E3 [OFFICIAL] frames-keyframes: click a frame = select it (and jump playhead). E4 [COMMUNITY] "click the frame numbers" avoids the stage-selection coupling (F-03-08 E5 quirk workaround). E5 [INFERENCE] header also hosts onion-skin range markers (Part 15).

## C. CONTROLS
| Element | Behavior |
|---|---|
| Frame numbers | displayed at intervals (1, 5, 10, 15…); spacing adapts to ruler zoom |
| Current-frame indicator | red outline/box on the current number |
| Click a number | jump playhead to that frame (E3) |
| Drag in header | scrub (playhead follows) |
| Onion markers | draggable brackets on the header (Part 15) |

## E. STATES
Current frame highlighted (E2); hover shows a tooltip frame number; scrubbing state = `playhead:moved` events throttled.

## L. LIMITATIONS
L.1 Number spacing not configurable in Animate → ours: adaptive + optional dense numbering. L.2 Clicking a number still selects frame content (E3 quirk) → ours: separate "jump only" vs "jump+select" (toggle).

## M. EDGE CASES
M.1 click past duration → clamps to last frame · M.2 ruler zoomed out → numbers sparse · M.3 scrub during playback → pause then scrub (ours).

## O/P/Q/R/S/Y
Data: playhead (view). Events: `playhead:moved`. Undo: none. Serialization: none (view). Mobile: tap number = jump; drag = scrub; pinch = ruler zoom. Implementation: `FrameRuler` component rendering adaptive tick marks + onion markers.

## TESTS
TS-01 numbers at intervals · TS-02 current-frame indicator (E2) · TS-03 click number jumps (E3) · TS-04 drag scrubs · TS-05 clamp past end · TS-06 ruler pinch-zoom (mobile) · TS-07 onion markers draggable · TS-08 jump-only toggle (ours) · TS-09 no undo for jumps · TS-10 playback pause on scrub (ours).
## AUDITS
No contradiction. Self-challenge: overlooked = click-jump-vs-select coupling (E4) + adaptive spacing — covered.
```
FEATURE COMPLETE: F-07-03 — Frame ruler — AUDITED
```
