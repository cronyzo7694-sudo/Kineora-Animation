# F-09-05 — EASING ENGINE
```
SOURCE BLUEPRINT: Part 09 §9.4 · DEEP FEATURE: F-09-05 · STATUS: AUDITED
DEPENDS ON: F-08-02 · FEEDS: F-09-06 (presets), F-09-08 (graph editor)
```
## A. IDENTITY
1. Official name: Easing (Ease field / Ease slider / Custom Ease). 4. Purpose: remap interpolation time so motion accelerates/decelerates naturally. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `classic-tween-animation.html`: Ease slider (−100 ease-in … +100 ease-out); **Edit** button → Custom Ease dialog (value-over-time graph; first key 0%, last 100%; slope = rate of change). E2 [OFFICIAL] `adding-custom-eases.html`: motion tween Ease slider ("hot text" blue, draggable/typeable); **Motion Editor custom ease** = Bézier curve applied to any property; property graph shows **dashed curve** = actual values after ease. E3 [OFFICIAL] `shape-tweening.html`: ease presets list + custom ease for shape tweens. E4 [OFFICIAL] `classic-tween-animation.html`: **ease presets per property** (position/rotation/scale/color/filters); save custom eases (Save and Apply). E5 [SECONDARY/blueprint] standard Penner functions (Part 09.4.2).

## O. EASING MODEL
```
easedT = easeFunction(t)      # t∈[0,1] → eased t'∈[0,1]
value(t) = lerp(v0, v1, easedT)
```
### Function families (E5, blueprint)
linear · quadratic/cubic/quartic/quintic (In/Out/InOut) · sine · exp · circular · back (overshoot) · elastic (spring) · bounce · steps(n).
### Slider (−100..+100, classic/shape) (E1)
negative = ease-in (slow→fast); positive = ease-out (fast→slow); quadratic strength.
### Custom ease graph (E1/E2)
x = frames (0→100%), y = % change (0→100%); diagonal = linear; drag/add control points (Ctrl/Cmd+click, E1); Bézier.
### Presets (E3/E4)
named prebuilt curves; classic tween: per-property presets (position/rotation/scale/color/filters).

## E. STATES
| State | Behavior |
|---|---|
| Ease = 0 | linear |
| Ease slider set | quadratic in/out |
| Custom ease applied | overrides slider; graph shows dashed actual (E2) |
| Per-property preset | that property eased independently (E4) |

## L. LIMITATIONS
L.1 Single slider for classic (all properties) vs per-property presets (E4) — mixed model → ours: unified per-property easing everywhere. L.2 Custom ease Bezier can overshoot below 0/above 100 (back/elastic) — by design; ours clamps optionally. L.3 Slider only quadratic (no strength curve) → ours: strength + curve type selector.

## M. EDGE CASES
M.1 ease-in at value 0 (instant start) · M.2 ease-out 100 · M.3 custom curve with 5 control points · M.4 steps(4) discrete · M.5 bounce overshoot · M.6 easing on a broken tween (ignored).

## O/P/Q/R/S/Y
Data: `ease` value + `customEase[]` points + preset IDs (persisted, Part 33). Events: `timeline:changed`. Undo: one command per ease edit. Serialization: persisted. Mobile: ease presets dropdown + curve editor (touch drag points). Implementation: `EasingEngine` with Penner set + Bézier sampler + preset registry.

## TESTS
TS-01 linear default · TS-02 slider −100 ease-in (E1) · TS-03 +100 ease-out · TS-04 custom curve control points (E1) · TS-05 motion hot-text drag (E2) · TS-06 per-property preset (E4) · TS-07 back overshoot · TS-08 elastic · TS-09 bounce · TS-10 steps(4) · TS-11 save/apply custom (E4) · TS-12 undo · TS-13 reload · TS-14 broken tween ignores ease.
## AUDITS
No contradiction. Self-challenge: overlooked = per-property presets (E4) + hot-text vs graph (E2) + slider-quadratic-only — covered.
```
FEATURE COMPLETE: F-09-05 — Easing engine — AUDITED
```
