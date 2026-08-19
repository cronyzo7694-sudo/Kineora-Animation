# F-09-02 — MOTION TWEEN PROPERTY MATRIX (supported / unsupported)
```
SOURCE BLUEPRINT: Part 09 §9.1.4–9.1.5 · DEEP FEATURE: F-09-02 · STATUS: AUDITED
DEPENDS ON: F-09-01 · FEEDS: F-09-08 (graph editor)
```
## A. IDENTITY
1. Official name: (motion-tween property support). 4. Purpose: enumerate exactly which properties a motion tween can animate and which it cannot. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: properties include **position and alpha (transparency), color tint**. E2 [OFFICIAL] `creating_a_motion_tween_animation.html`: position, alpha, rotation, skew are settable → property keyframes. E3 [OFFICIAL] `adding-custom-eases.html`: eases for **position, rotation, scale, color, filters** (per-property). E4 [OFFICIAL] `using-property-keyframes.html`: **roving = spatial X/Y/Z only**; 3D tween via 3D tools (legacy). E5 [OFFICIAL] `symbol-instances.html`: filters (drop shadow/blur/glow) are instance properties. E6 [OFFICIAL] Part 11.4: loop/first-frame (graphic) is an instance property — but swap is discrete.

## F. SUPPORT MATRIX
| Property | Tweenable? | Keyframe granularity | Notes |
|---|---|---|---|
| x, y | YES | independent | motion path (E1) |
| scaleX, scaleY | YES | independent | around pivot |
| rotation | YES | single + orientation flags | F-08-04 |
| skewX, skewY | YES | independent | (E2) |
| alpha | YES | single | (E1) |
| tint / brightness | YES | single | color effect (E1) |
| filters (shadow/blur/glow…) | YES | per-filter per-param | (E3/E5) |
| 3D rotationX/Y/Z, z | YES (legacy AS3) | per-property | (E4) |
| position (roving) | YES | spatial only | (E4) |
| **Symbol swap** | NO (discrete) | — | swaps snap (F-08-07) |
| **Raw-shape geometry** | NO | — | use shape tween |
| **Pivot** | NO (static in span) | — | Part 04 |
| **Loop/first-frame (graphic)** | NO (discrete swap) | — | via Frame Picker (Part 18) |
| **Frame label/action** | NO | — | not tweened |
| **Bones** | NO | — | pose layers (Part 14) |

## L. LIMITATIONS
L.1 No shape morphing in motion tween → shape tween. L.2 Swap discrete → ours: optional blend (Part 18.6.8). L.3 Pivot static → ours: pivot keyframing (P2, with care).

## M. EDGE CASES
M.1 key alpha but not position → position holds · M.2 filter tween = per-param keys · M.3 3D tween on non-AS3 doc (unsupported) · M.4 tint interpolation color-space.

## O/P/Q/R/S/Y
Data: per-property key arrays (F-08-01); filter keys = nested param paths (`filter[0].blurX`). Events: `timeline:changed`. Undo: one command per value set. Serialization: persisted. Mobile: property edits via Properties sheet. Implementation: `PropertyRegistry` mapping property path → interpolator (F-08-02).

## TESTS
TS-01 x/y independent keys · TS-02 alpha key (E1) · TS-03 tint key · TS-04 filter param key · TS-05 rotation orientation · TS-06 swap = discrete (no interp) · TS-07 shape geometry not tweenable (blocked + hint) · TS-08 pivot static · TS-09 roving spatial only · TS-10 3D legacy · TS-11 undo · TS-12 reload.
## AUDITS
No contradiction. Self-challenge: overlooked = swap-discrete + pivot-static + filter-per-param keys — covered.
```
FEATURE COMPLETE: F-09-02 — Motion tween property matrix — AUDITED
```
