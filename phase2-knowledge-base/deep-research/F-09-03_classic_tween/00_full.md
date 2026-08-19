# F-09-03 — CLASSIC TWEEN
```
SOURCE BLUEPRINT: Part 09 §9.2 · DEEP FEATURE: F-09-03 · STATUS: AUDITED
DEPENDS ON: F-07-06, F-08-01 · FEEDS: F-09-05/06, F-10-06 (motion guide)
```
## A. IDENTITY
1. Official name: Classic tween. 4. Purpose: interpolate one object between two whole-frame keyframes (legacy model, kept for compat). 8. Status: current (legacy, still shipped).

## EVIDENCE
E1 [OFFICIAL] `classic-tween-animation.html`: tweens **position, size, rotation, skew** of instances, groups, and type; also **color** (fade/gradual). E2 [OFFICIAL] same: **only one item per layer**; non-symbol graphic **auto-converts to symbol named "tween1"**. E3 [OFFICIAL] same: **Rotate menu**: None (default) / Auto (least motion) / CW / CCW + **enter number of rotations**; rotation is **in addition to** any rotation applied to the ending frame. E4 [OFFICIAL] same: **Orient to Path**, **Snap**, **Sync** options. E5 [OFFICIAL] same: Ease field (−/+ slider) + **Edit** button → custom ease graph; Ctrl/Cmd+click to add control point. E6 [OFFICIAL] `animation-basics.html`: blue span + arrow; **dashed line = broken/incomplete** (missing final keyframe). E7 [OFFICIAL] `classic-tween-animation.html`: **ease presets per property** (position/rotation/scale/color/filters) + save custom eases (Save and Apply; reusable within same doc type).

## D. SEMANTICS
| Aspect | Rule |
|---|---|
| Endpoints | two whole-frame keys, same object (E1/E2) |
| Interp | whole-state lerp (no per-property keys) |
| Rotation | None/Auto/CW/CCW + loops (E3) |
| Path | motion guide layer (F-10-06) + Orient/Snap (E4) |
| Ease | single slider + custom graph (E5) + property-wise presets (E7) |
| Broken | dashed line (E6) |

## E. STATES
| State | Behavior |
|---|---|
| Two keys + same object | interpolates |
| Missing endpoint / different object | broken (dashed) (E6) |
| Graphic object tweened | auto-wrapped "tween1" (E2) |
| Orient to Path ON | baseline follows path (E4) |

## L. LIMITATIONS
L.1 One item per layer (E2). L.2 No per-property keys (whole-frame only) — that's what motion tween is for. L.3 Broken tween (dashed) when endpoints differ → ours: clear "why broken" tooltip. L.4 Rotation "in addition to" end-frame rotation confuses (E3) → ours: show total rotation readout.

## M. EDGE CASES
M.1 tween a group (auto-wrap) · M.2 rotate CW + 2 loops (E3) · M.3 ease −100 (ease-in) vs +100 (ease-out) · M.4 custom ease control points (E5) · M.5 broken = dashed (E6) · M.6 sync graphic instance (Sync option).

## O/P/Q/R/S/Y
Data: `{type:'classicTween', start, end, ease, customEase[], rotate:{mode,count}, orient, snap, sync}` between two keys. Events: `timeline:changed`. Undo: one command per create/edit. Serialization: persisted. Mobile: long-press frame → Classic Tween; ease slider in Properties. Implementation: `ClassicTween` = thin layer over whole-frame keys + interpolator (Part 32.8).

## TESTS
TS-01 two-key interp · TS-02 auto-wrap tween1 (E2) · TS-03 rotate Auto/CW/CCW+loops (E3) · TS-04 orient to path (E4) · TS-05 ease slider · TS-06 custom ease points (E5) · TS-07 property-wise ease presets (E7) · TS-08 broken dashed (E6) · TS-09 color fade (E1) · TS-10 sync option · TS-11 undo · TS-12 reload.
## AUDITS
No contradiction. Self-challenge: overlooked = rotate-in-addition-to (E3) + auto-wrap naming (E2) + property-wise ease presets (E7) + broken-dashed (E6) — covered.
```
FEATURE COMPLETE: F-09-03 — Classic tween — AUDITED
```
