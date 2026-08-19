# F-10-05 — PATH DUPLICATION & REVERSAL · F-10-06 — MOTION GUIDE (LEGACY)
```
SOURCE BLUEPRINT: Part 10 §10.5–10.6 · DEEP FEATURES: F-10-05, F-10-06 · STATUS: AUDITED
DEPENDS ON: F-10-01, F-09-03
```
## F-10-05 DUPLICATION & REVERSAL
1. Official name: (copy path / reverse path / reverse frames). 4. Purpose: reuse a path on another tween; reverse travel direction. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `editing_the_motion_path…html`: **Copy** the motion path → paste into another layer as a stroke or as another tween's path; **Reverse Path** (span context → Motion Path) flips start/end. E2 [OFFICIAL] `using-property-keyframes.html`: Reverse Path reverses tween direction. E3 [COMMUNITY] Reverse Frames = mirror animation (F-07-13 E1).
SEMANTICS
| Op | Effect |
|---|---|
| Copy path as stroke (E1) | path geometry → a stroke on another layer |
| Paste stroke as path (E1) | stroke → new motion path |
| Copy motion (F-09-06) | whole position curve → another object |
| Reverse Path (E1/E2) | swap start/end (travel backwards, timing same) |
| Reverse Frames (E3) | reverse keyframe order (time direction flips) |
| Reverse direction (ours, P2) | keep timing, mirror the route |
LIMITATIONS: L.1 Reverse Path ≠ Reverse Frames (direction vs time) — easily confused → ours: distinct names + tooltips.
EDGE: M.1 copy a closed path · M.2 paste stroke that is closed (rejected — "uninterrupted strokes only", E-adjacent) · M.3 reverse path keeps easing.
TESTS: TS-01 copy path as stroke (E1) · TS-02 paste stroke as path (E1) · TS-03 reverse path (E2) · TS-04 reverse frames (E3) · TS-05 reverse-direction (ours) · TS-06 closed stroke rejected · TS-07 undo.

## F-10-06 MOTION GUIDE (LEGACY CLASSIC-TWEEN PATH)
1. Official name: Classic Motion Guide (Add Classic Motion Guide). 4. Purpose: a guide layer holding a path the classic-tweened object follows (legacy path system). 8. Status: legacy (motion paths are modern).
EVIDENCE
E1 [OFFICIAL] `classic-tween-animation.html`: right-click the tween layer → **Add Classic Motion Guide**; draw a path; **Snap** = registration point snaps to path; **Orient to Path** = baseline follows. E2 [OFFICIAL] Adobe Learn classic-tweens: lock the object's center to the path on all keyframes; orient to path; rotate the boat at both keys. E3 [OFFICIAL] `classic-tween-animation.html`: linking a layer to a motion guide (drag below it / Layer Properties → Guide); objects on linked layers snap to the path.
SEMANTICS
- Guide layer (non-printing path) above the tweened layer; tweened layer indented/linked.
- Object's pivot snapped to path at K1/K2; in-between follows the path.
- Orient/Snap options in frame Properties.
LIMITATIONS: L.1 legacy (modern motion path preferred) → ours: support as compat, recommend motion paths. L.2 guide doesn't export.
EDGE: M.1 unlink layer · M.2 guide path with no snap (object goes straight) · M.3 multiple layers on one guide.
TESTS: TS-01 add motion guide (E1) · TS-02 snap follows path (E1) · TS-03 orient (E1) · TS-04 unlink · TS-05 guide not exported · TS-06 undo.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = reverse-path-vs-reverse-frames distinction + closed-stroke rejection + guide-not-exported — covered.
```
FEATURE COMPLETE: F-10-05/06 — Path duplication/reversal & motion guide — AUDITED
```
