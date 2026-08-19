# F-08-02 — INTERPOLATION ENGINE
```
SOURCE BLUEPRINT: Part 08 §8.2 · DEEP FEATURE: F-08-02 · STATUS: AUDITED
DEPENDS ON: F-08-01 · FEEDS: Part 09 (easing), Parts 14/16/17
```
## A. IDENTITY
1. Official name: (interpolation). 4. Purpose: compute in-between values between keyframes — the mathematical core of tweening. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: "Animate interpolates the property values of the frames in between." E2 [OFFICIAL] `shape-tweening.html`: shape tween interpolates intermediate shapes; color tween; ease via Ease field. E3 [OFFICIAL] `using-property-keyframes.html`: roving keys → constant speed (arc-length reparameterization concept). E4 [OFFICIAL] `classic-tween-animation.html`: custom ease graph = value-over-time curve; first key 0%, last 100%. E5 [OUR DESIGN DECISION] color space (OKLab) + log-scale zoom (blueprint Part 08.2) — not Adobe-public.

## O. INTERPOLATION TABLE (per property type)
| Property | Interpolation | Notes |
|---|---|---|
| x, y, scale, alpha, tint, skew | numeric lerp | eased (Part 09.4) |
| rotation | angle lerp + orientation flags (CW/CCW/loops) | F-08-04 |
| colors | color-space lerp | ours: OKLab (E5) |
| shapes | per-anchor morph (correspondence) | F-08-06 |
| bones | per-joint angle/translation lerp | F-08-10 |
| camera | position/rotation lerp; zoom log-space (ours) | F-08-09 |
| symbol swap | **discrete** (no interp) | F-08-07 |

## O. FORMULA
`value(t) = lerp(v0, v1, ease(normalize(t)))`; `t` normalized over [frameBefore, frameAfter] (F-08-01 model). Roving (E3): keys positioned so speed is constant (arc-length).

## L. LIMITATIONS
L.1 Linear default (robotic) → ours: per-property ease defaults (P2). L.2 No native spring/physics interp → ours: spring ease type (Part 09.4). L.3 Shape morph correspondence failure (self-intersect) → shape hints (F-08-06).

## M. EDGE CASES
M.1 single key (no interp — holds) · M.2 NaN value in a key (skip/clamp, ours) · M.3 interpolation across a missing key (broken tween) · M.4 rotation 350°→10° (shortest path) · M.5 color alpha interp at extremes.

## P/Q/R
Events: none (pure function). Undo: n/a. Serialization: easing curves persisted (Part 09 model).

## V. PERFORMANCE
Interp is arithmetic (negligible); shape morph = O(anchors) per frame (cache correspondence); roving = precompute arc-length table (E3).

## Y. IMPLEMENTATION (OURS)
`Interpolator` = pure functions per type + `Easing` remap (Part 09.4); deterministic (same inputs → same frames, blueprint rule 3); OKLab color lerp; log-space zoom.

## TESTS
TS-01 numeric lerp · TS-02 eased lerp · TS-03 rotation shortest-path · TS-04 rotation +loops · TS-05 color OKLab no-gray-band · TS-06 shape morph (F-08-06) · TS-07 bone lerp · TS-08 camera log-zoom · TS-09 roving constant speed · TS-10 single-key holds · TS-11 NaN clamp · TS-12 broken tween (dashed, no interp) · TS-13 deterministic repeat.
## AUDITS
No contradiction. Self-challenge: overlooked = roving/arc-length (E3) + shortest-path rotation + broken-tween non-interp — covered.
```
FEATURE COMPLETE: F-08-02 — Interpolation engine — AUDITED
```
