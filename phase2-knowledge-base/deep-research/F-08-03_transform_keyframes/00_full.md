# F-08-03/04/05 — POSITION · ROTATION · SCALE KEYFRAMES
```
SOURCE BLUEPRINT: Part 08 §8.3.1–8.3.3 · DEEP FEATURES: F-08-03, F-08-04, F-08-05 · STATUS: AUDITED
DEPENDS ON: F-08-01/02 · FEEDS: Part 09/10
```
## A. IDENTITY
1. Official names: (position / rotation / scale property keyframes). 4. Purpose: key the spatial/angular/size state of a tween target at specific frames. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `creating_a_motion_tween_animation.html`: set a value in Properties/tools at a frame → that frame becomes a **property keyframe**; playhead placement sets the frame. E2 [OFFICIAL] `animation-basics.html`: position/alpha/color-tint are example properties; **x and y are independent per-property keys** (blueprint Part 09.1.4). E3 [OFFICIAL] `using-property-keyframes.html`: roving = spatial X/Y/Z only (rotation/scale not roving). E4 [OFFICIAL] `classic-tween-animation.html`: classic tween rotation interpolates; custom ease applies. E5 [OUR DESIGN DECISION] scale log-lerp (blueprint Part 08.3.3).

## O. PER-TYPE DETAIL
### Position keyframe (F-08-03)
- Stored: `{property:'x'|'y', value}` (+ roving flag, E3). Visual: object at spot; **motion-path vertex** (Part 10). Interp: lerp → motion path. Move key = re-time; delete = path simplifies; duplicate = pause (Part 08.3.1).

### Rotation keyframe (F-08-04)
- Stored: `{property:'rotation', value, orientation:auto|CW|CCW, rotations:n}`. Interp: shortest-path (auto) or forced direction + full turns. Visual: angle around pivot. Move/delete/duplicate = re-time/snap/pause.

### Scale keyframe (F-08-05)
- Stored: `{property:'scaleX'|'scaleY', value}` (independent axes). Interp: around pivot; ours log-lerp (E5). Visual: size change. Negative = flip.

## E. STATES
| Context | Behavior |
|---|---|
| Playhead on a non-key frame in span | setting a value **creates** the key there (E1) |
| Playhead on existing key | setting **updates** that key |
| Roving enabled (position) | frame-agnostic; round dot (E3) |
| Classic tween (not motion) | whole-frame keys; no per-property independence |

## L. LIMITATIONS
L.1 x/y always independent (can't key "position" as one) → ours: same + "key both" convenience button (P2). L.2 Roving only spatial (E3) → ours: extend to any 1-D property (P2). L.3 Scale log-lerp is our choice (Animate = linear) → document the difference.

## M. EDGE CASES
M.1 rotation 350°→10° shortest path · M.2 rotation +2 loops · M.3 scale 0 (invisible) · M.4 negative scale flip tween · M.5 roving on 2-key span = no-op · M.6 key x but not y → y holds.

## O/P/Q/R/S/Y
Data: per-property key arrays in span (F-08-01). Events: `timeline:changed`. Undo: one command per value set (coalesced during drag). Serialization: persisted. Mobile: select object → drag → key auto-created (E1); numeric Transform panel for exact values. Implementation: `setPropertyAt(span, property, value, frame)` — create/update key; motion-path derivation for position (Part 10).

## TESTS
TS-01 set value at frame → key created (E1) · TS-02 update existing key · TS-03 x/y independent (E2) · TS-04 rotation shortest-path · TS-05 rotation +loops · TS-06 scale independent axes · TS-07 roving position only (E3) · TS-08 move/delete/duplicate key semantics · TS-09 undo coalesced · TS-10 mobile drag auto-key · TS-11 classic tween whole-frame · TS-12 negative scale flip.
## AUDITS
No contradiction. Self-challenge: overlooked = set-at-playhead-creates-key (E1) + x/y independence (E2) + roving-spatial-only (E3) — covered.
```
FEATURE COMPLETE: F-08-03/04/05 — Position/Rotation/Scale keyframes — AUDITED
```
