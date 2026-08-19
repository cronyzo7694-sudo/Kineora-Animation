# F-04-01..14 — TRANSFORM SYSTEM (full part)
```
SOURCE BLUEPRINT: Part 04 — Transform System
DEEP FEATURES: F-04-01..14 · STATUS: AUDITED
DEPENDS ON: F-03 (selection) · FEEDS: F-08-03/04/05 (transform keyframes), Part 09 (tweening), F-02-03 (Free Transform tool)
```
## A. IDENTITY
1. Official name: Transform system (Free Transform tool + Modify > Transform + Transform panel). 4. Purpose: move/scale/rotate/skew/free/distort/envelope + pivots + numeric + copy/reset/flip. 8. Status: current.

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Free Transform moves/rotates/scales/skews; Distort/Envelope only for raw shapes. | [OFFICIAL] `transforming-combining-graphic-objects.html` |
| E2 | "The Free Transform tool cannot transform symbols, bitmaps, video objects, sounds, gradients, or text" — under **Distort** (only shape objects distorted). | [OFFICIAL] same |
| E3 | Drag pivot (white circle) to move transform point; **double-click pivot = re-center**. | [OFFICIAL] same |
| E4 | Shift = proportional scale / 45° rotate / axis skew; Alt = rotate around opposite corner. | [OFFICIAL] same |
| E5 | Track transform point in Info panel + Property inspector (reg/transform toggle). | [OFFICIAL] same + `symbol-instances.html` |
| E6 | Remove Transform / Scale & Rotate dialog / Flip H/V / Rotate 90° CW/CCW. | [OFFICIAL] Part 29 + blueprint Part 04.8–4.10 |
| E7 | Transform values are per-property keyframes in motion tweens (x/y/scale/rotation/skew independent). | [OFFICIAL] `creating_a_motion_tween_animation.html` (F-08-03 E2) |

## F-04-01 TRANSFORM MODEL & MATRIX
```jsonc
"transform": { "x":0,"y":0,"scaleX":1,"scaleY":1,"rotation":0,"skewX":0,"skewY":0,"pivotX":0,"pivotY":0 }
```
Matrix = `T(x,y)·Rot(skewY)·Skew(skewX)·Scale·T(-pivot)`; store decomposed values (editable + tweenable), matrix = cached derivative. Spaces: stage / object-local / parent / screen (Part 04.0).

## F-04-02 MOVE
Input: drag (Selection) / arrows / panels. Calc: delta snapped. Stored: x,y. Keyframe: x/y independent keys (E7). Modifiers: Shift=axis/45°; Alt+drag=duplicate-move; arrows=1px, Shift+arrows=10px.

## F-04-03 SCALE
Corner/edge handle; ratio from pivot; Shift proportional; Alt opposite-corner; negative=flip; squash&stretch=non-uniform. Keyframe: scaleX/Y independent (E7).

## F-04-04 ROTATE
Outside corner; angle from pivot; Shift 45°/15°; Alt opposite corner. Stored: rotation (degrees CW in Y-down). Keyframe: rotation key + orientation (CW/CCW/loops) (F-08-04).

## F-04-05 SKEW
Edge midpoint + modifier; shear from pointer ratio; stored skewX/Y; tweenable.

## F-04-06 FREE TRANSFORM COMBINED
One gesture = one TransformCommand (all changed fields); modes (Scale/Rotate&Skew/Distort/Envelope); handle-zone mapping (F-02-03).

## F-04-07 REGISTRATION vs PIVOT vs CENTER
Registration = symbol-local (0,0) (F-11-06); pivot (transform point) = movable rotation/scale center (E3); center = computed AABB center (align/re-center). Double-click pivot = re-center (E3).

## F-04-08 DISTORT
4 corners independently → quadrilateral remap; **baked into geometry**; shape-only (E2); shape-tweenable (not transform-tweenable).

## F-04-09 ENVELOPE
Mesh points + tangents → shape re-fit; baked; shape-only; superseded by Asset Warp (F-02-32).

## F-04-10 NUMERIC TRANSFORM
Transform panel (X/Y/W/H/rotate/skew + constrain) + Scale & Rotate dialog (Ctrl+Alt+S); commit on Enter/blur = one command; two-way binding (E5 toggle reg/transform).

## F-04-11 COPY / RESET (REMOVE) TRANSFORM
Copy/Paste transform (ours); Remove Transform = flatten (scale=1, rotation=0, skew=0, path re-baked) — Ctrl+Shift+Z legacy (Part 29).

## F-04-12 FLIP H/V
Mirror around center (scaleX/Y negated); walk-cycle duplicate-leg trick (F-13).

## F-04-13 TRANSFORM ↔ ANIMATION SUMMARY
Move→x/y keys · Scale→scaleX/Y keys · Rotate→rotation key · Skew→skew keys · Distort/Envelope→baked path (shape tween) · Pivot→static in span · Flip→scale keys · Remove→flatten.

## F-04-14 MOBILE TRANSFORM
Pinch scale, twist rotate, handles ≥44px, pivot loupe, numeric panel, constrain toggle (F-31-05).

## L. LIMITATIONS
L.1 Distort/Envelope silently ignored on non-shapes (E2) → ours: greyed + tooltip. L.2 pivot static per span → ours: warn on drift (F-13-05 E3). L.3 pivot-off-center = wrong rotation (common mistake).

## M. EDGE CASES
M.1 negative scale flip · M.2 scale 0 invisible · M.3 rotation 350→10 shortest path · M.4 mixed selection distort (shape-only applies) · M.5 pivot re-center double-click (E3) · M.6 off-stage transform · M.7 NaN values (clamp).

## O/P/Q/R/S/Y
Data: `transform` component (Part 33 §33.16). Events: `document:changed`. Undo: one TransformCommand per gesture (before/after). Serialization: transform persisted. Mobile: F-04-14. Implementation: TransformTool writes decomposed fields; renderer applies matrix; keyframe integration via setPropertyAt (F-08-03).

## W. WORKFLOWS
W.1 Rig pivot: select arm symbol → Q → drag pivot to shoulder → rotate arm. W.2 Squash: scaleY key on impact frame. W.3 Flip leg: flip duplicate for other leg.

## TESTS
TS-01 move/snap · TS-02 scale proportional (E4) · TS-03 rotate 45° snap · TS-04 skew axis · TS-05 pivot drag + re-center (E3) · TS-06 distort shape-only (E2) · TS-07 envelope shape-only · TS-08 numeric panel two-way · TS-09 remove-transform flatten · TS-10 flip H/V · TS-11 x/y independent keys (E7) · TS-12 undo one-gesture · TS-13 mobile pinch/twist · TS-14 NaN clamp.

## AUDITS
No contradiction. Self-challenge: overlooked = distort/envelope-bake-to-geometry + shape-only rule (E2) + pivot-recenter-dblclick (E3) + pivot-static-per-span — covered.

```
FEATURE COMPLETE: F-04-01..14 — Transform system — AUDITED
```
