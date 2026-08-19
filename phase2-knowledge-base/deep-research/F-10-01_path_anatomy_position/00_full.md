# F-10-01 — PATH ANATOMY & DATA · F-10-02 — POSITION INTERPOLATION
```
SOURCE BLUEPRINT: Part 10 §10.1–10.2 · DEEP FEATURES: F-10-01, F-10-02 · STATUS: AUDITED
DEPENDS ON: F-09-01 · FEEDS: F-10-03..06
```
## F-10-01 PATH ANATOMY
1. Official name: motion path. 4. Purpose: the visible curve a tweened object follows; derived from the tween's position keyframes. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `editing_the_motion_path…html`: motion path appears when you position a tween instance; **dots/tween dots** = target position at frames; **property keyframes appear on the path as control points (small diamonds)**. E2 [OFFICIAL] same: reshape path with Selection (drag segment) / Subselection (Bezier handles at property keyframes). E3 [OFFICIAL] same: move entire path (drag / marquee / arrow keys / Properties x,y of path bounds). E4 [OFFICIAL] same: copy path as a stroke; **apply a custom stroke as a new motion path** (paste a stroke onto the span). E5 [OFFICIAL] same: Free Transform can scale/skew/rotate the path (not the target). E6 [OFFICIAL] same: **Delete key** deletes the path; **Reverse Path** (Motion Path context) flips start/end.
DATA MODEL (blueprint Part 10.1)
```jsonc
"path": { "anchors":[{x,y,h1x,h1y,h2x,h2y}...], "closed":false, "vertexFrames":[1,30,60] }
```
- Each anchor = one position keyframe (vertexFrames = its frame). Editing path writes back to x/y keys (two views, one truth).
SEMANTICS: path = Bézier through position keys; vertex = position key; handles = tangents; closed = loop.
TESTS: TS-01 path derived from x/y keys · TS-02 vertex = position key · TS-03 edit path → writes x/y keys · TS-04 copy path as stroke (E4) · TS-05 paste stroke as path (E4) · TS-06 delete path · TS-07 reverse path (E6).

## F-10-02 POSITION INTERPOLATION
1. Official name: (position along the path). 4. Purpose: how the object's position maps to path arc as time passes. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `editing_the_motion_path…html`: dots = position of target along path **on the timeline** (frame groups). E2 [OFFICIAL] `using-property-keyframes.html`: **roving** = constant speed (Animate repositions keys for consistent motion). E3 [BLUEPRINT Part 10.2] parameter interp (default, eased) vs arc-length reparameterization (constant speed).
SEMANTICS
- Default = **parameter interpolation**: `point = bezier(path, easedT)` — speed follows the position easing, not arc length (E3).
- Roving (E2) = Animate's constant-speed mechanism for spatial keys.
- Ours: parameter (default) + "constant speed" option (arc-length table).
LIMITATIONS: L.1 default param interp = unequal speed on unequal segments → ours: constant-speed toggle. L.2 roving spatial-only (F-08-03) → ours: constant-speed any path.
EDGE: M.1 long vs short segment same time · M.2 closed loop path · M.3 zero-length segment.
TESTS: TS-01 param interp default · TS-02 eased speed varies · TS-03 roving constant (E2) · TS-04 constant-speed toggle (ours) · TS-05 closed loop · TS-06 zero segment.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = vertex=key identity (E1) + path-as-two-views + roving-constant-speed (E2) — covered.
```
FEATURE COMPLETE: F-10-01/02 — Path anatomy & position interpolation — AUDITED
```
