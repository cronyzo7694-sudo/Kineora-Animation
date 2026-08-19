# F-10-03 — ORIENTATION & ROTATE-ALONG-PATH · F-10-04 — PATH EDITING
```
SOURCE BLUEPRINT: Part 10 §10.3–10.4 · DEEP FEATURES: F-10-03, F-10-04 · STATUS: AUDITED
DEPENDS ON: F-10-01/02
```
## F-10-03 ORIENTATION
1. Official name: Orient to Path. 4. Purpose: rotate the tweened object to face the path tangent (cars/boats/birds). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `editing_the_motion_path…html`: "Orient to Path option… maintain a constant orientation relative to the path"; shown left (not oriented) vs right (oriented). E2 [OFFICIAL] Adobe Learn classic-tweens: select **Orient to Path**; fix the boat's start angle with Quick Transform so it aligns at key 1. E3 [OFFICIAL] `classic-tween-animation.html`: Orient to Path orients the **baseline** of the element to the path; **Snap** = registration point snaps to the path.
SEMANTICS
- Orient ON: `rotation_final = objectRotation + tangentAngle(path, t)` (forward axis = object's baseline).
- Snap ON: registration point pinned to the path (classic guide).
- Baseline = the object's reference axis (its local +X / drawn orientation).
LIMITATIONS: L.1 "drunken" boat if start key not pre-rotated (E2) → ours: auto-align start key to tangent. L.2 forward axis not configurable → ours: user-settable forward angle.
EDGE: M.1 90° turn in path (smooth bank vs snap) · M.2 rotating target + orient (additive) · M.3 closed loop orient.
TESTS: TS-01 orient aligns to tangent (E1) · TS-02 start-key pre-align (E2) · TS-03 snap to path (E3) · TS-04 additive rotation · TS-05 closed loop · TS-06 forward-axis config (ours).

## F-10-04 PATH EDITING
1. Official name: (motion-path editing). 4. Purpose: reshape/move/scale/rotate the path; add/delete vertices. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `editing_the_motion_path…html`: **Selection** drags a segment (don't click to select first); **Subselection** exposes Bezier handles at property-keyframe points (small diamonds); **Free Transform** scales/skews/rotates the path (click path, not target). E2 [OFFICIAL] same: **move entire path** (drag/marquee/arrows/Properties). E3 [OFFICIAL] same: moving the target at any frame adds a property keyframe there; other keys stay. E4 [OFFICIAL] same: **Always Show Motion Paths** (all layers' paths). E5 [OFFICIAL] same: CS5.5-only multi-path select (legacy).
SEMANTICS
| Op | Tool | Effect |
|---|---|---|
| Move vertex | Selection (drag diamond) | moves that position key |
| Reshape segment | Selection (drag curve) | re-fit Bézier → adjacent tangents |
| Pull handles | Subselection | tangent edit (Alt split) |
| Add vertex | move target at a frame (E3) | new position key |
| Delete vertex | select + Delete | key removed, path re-smooths |
| Move/scale/rotate path | Selection/Free Transform (E1/E2) | all keys transform |
LIMITATIONS: L.1 "don't click to select segment first" quirk (E1) → ours: hover-then-drag with clear affordance. L.2 CS5.5 multi-path select removed → ours: always multi-select paths.
EDGE: M.1 drag segment not vertex · M.2 transform path vs target (E1) · M.3 move path off-stage.
TESTS: TS-01 drag segment reshapes · TS-02 subselection handles · TS-03 free-transform path (E1) · TS-04 move whole path (E2) · TS-05 move target adds key (E3) · TS-06 always-show-paths (E4) · TS-07 delete vertex · TS-08 undo · TS-09 multi-path select (ours).
## AUDITS (both)
No contradiction. Self-challenge: overlooked = don't-click-segment quirk (E1) + move-target-adds-key (E3) + always-show-paths (E4) — covered.
```
FEATURE COMPLETE: F-10-03/04 — Orientation & path editing — AUDITED
```
