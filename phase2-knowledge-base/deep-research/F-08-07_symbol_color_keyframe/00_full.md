# F-08-07 — SYMBOL KEYFRAME · F-08-08 — COLOR KEYFRAME
```
SOURCE BLUEPRINT: Part 08 §8.3.5, §8.3.6 · DEEP FEATURES: F-08-07, F-08-08 · STATUS: AUDITED
DEPENDS ON: F-08-01/02 · FEEDS: Parts 11, 18
```
## F-08-07 SYMBOL KEYFRAME
1. Official name: (symbol keyframe — a keyframe holding a symbol instance). 4. Purpose: place/change which symbol shows at a frame; swaps are **discrete**. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `time.html`: "A keyframe is a frame where a **new symbol instance** appears." E2 [OFFICIAL] Part 11.6: Swap Symbol at a keyframe → pose changes, position stays. E3 [OFFICIAL] Part 18: mouth poses = same graphic instance with different **first frame** per keyframe (viseme). E4 [OFFICIAL] `symbol-instances.html`: instance properties (loop/first-frame) are per-instance, keyframable via swap.
SEMANTICS
- Stored: whole-frame content = instance `{symbolId, transform, colorEffect, loop}` (F-03-12).
- Interp: **discrete** — swap snaps; the instance's transform still tweens around it.
- Move/delete/duplicate = whole-frame keyframe rules (F-08-12).
STATES: single instance key (holds) · swapped key (new symbol) · broken ref (warn, F-03-12).
LIMITATIONS: L.1 no cross-fade between swapped symbols (discrete) → ours: optional blend (Part 18.6.8). L.2 symbol swap ≠ symbol edit (instance vs definition, F-03-12).
EDGE: M.1 swap keeps transform (E2) · M.2 first-frame change (viseme) vs full swap · M.3 broken ref.
TESTS: TS-01 new symbol at key (E1) · TS-02 swap keeps position (E2) · TS-03 viseme first-frame per key (E3) · TS-04 transform tweens around swap · TS-05 broken ref warn · TS-06 undo swap.

## F-08-08 COLOR KEYFRAME
1. Official name: (color/alpha keyframe — instance color effect). 4. Purpose: key tint/brightness/alpha of a symbol instance over time. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: "properties could include position, **alpha (transparency), color tint**" — motion-tween properties. E2 [OFFICIAL] `creating_a_motion_tween_animation.html`: set alpha/tint at a frame → property keyframe. E3 [OFFICIAL] `symbol-instances.html`: instance color effect (brightness/tint/alpha/advanced).
SEMANTICS
- Stored: `{property:'alpha'|'tint'|'brightness', value}` per-property keys (E1).
- Interp: alpha lerp; tint color lerp (OKLab ours).
- Visual: fade / recolor; filters also tweenable (Part 11.5).
LIMITATIONS: L.1 alpha hidden in Color Effect dropdown (Animate) → ours: top-level opacity slider (W6). L.2 tint interpolation in RGB can band → ours OKLab.
EDGE: M.1 alpha 0 (invisible but selectable) · M.2 tint 100% solid · M.3 fade + move same span (independent keys).
TESTS: TS-01 alpha key (E1) · TS-02 tint key · TS-03 independent from position keys · TS-04 OKLab no banding · TS-05 alpha 0 still selectable · TS-06 undo.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = discrete-vs-tweened (symbol swap snaps, color tweens) + alpha-hidden-in-dropdown (W6) — covered.
```
FEATURE COMPLETE: F-08-07 — Symbol keyframe · F-08-08 — Color keyframe — AUDITED
```
