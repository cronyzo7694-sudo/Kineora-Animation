# F-23-05 — ALPHA · F-23-06 — GRADIENTS · F-23-07 — BITMAP FILLS · F-23-08 — CUSTOM COLORS & REPLACEMENT
```
SOURCE BLUEPRINT: Part 23 §23.4–23.7 · DEEP FEATURES: F-23-05..08 · STATUS: AUDITED
DEPENDS ON: F-23-01
```
## F-23-05 ALPHA
1. Official name: (alpha/opacity). 4. Purpose: 0–100% on fills/strokes + instance color effect. 8. Status: current.
EVIDENCE: E1 [BLUEPRINT Part 23.4]: alpha on every color; instance-level alpha separate (F-11-09); same-style merge no double-darken (F-05).
SEMANTICS: fill/stroke alpha + instance alpha (color effect); merge model no double-darken.
LIMITATIONS: L.1 alpha hidden in Color Effect dropdown → ours: top-level slider (W6).
EDGE: M.1 alpha 0 still selectable · M.2 two 50% shapes overlap (no darken).
TESTS: TS-01 fill alpha · TS-02 instance alpha · TS-03 no double-darken · TS-04 alpha-0 selectable.

## F-23-06 GRADIENTS
1. Official name: linear/radial gradient. 4. Purpose: multi-stop gradients + focal point. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `strokes-fills-gradients.html`: gradient palette (linear/radial); **click gradient bar to add stops**; add to swatches; Gradient Transform tool edits. E2 [BLUEPRINT Part 23.5]: stops editor (drag/double-click/delete); focal point (radial); GPU rendering.
SEMANTICS
| Type | Stops | Transform |
|---|---|---|
| Linear | 2+ stops on axis | center/scale/rotation |
| Radial | 2+ stops center→out | center/scale/rotation/**focal** |
LIMITATIONS: L.1 gradient strokes unsupported (flat strokes only) → convert-to-fill for gradient strokes.
EDGE: M.1 focal off-center lighting · M.2 3-stop gradient.
TESTS: TS-01 linear stops · TS-02 radial focal · TS-03 stop add/drag/delete · TS-04 gradient transform (F-02-04) · TS-05 flat-stroke rule.

## F-23-07 BITMAP FILLS
1. Official name: (bitmap fill). 4. Purpose: bitmap as a fill (tile/stretch). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `imported-bitmaps.html`: break apart bitmap → bitmap fill; Eyedropper applies bitmap fill; Magic Wand on broken bitmap. E2 [BLUEPRINT Part 23.6]: tile/stretch + Lock Fill continuity.
SEMANTICS: bitmap asset as fill style; transform (tile/scale) via Gradient Transform; Lock Fill.
LIMITATIONS: L.1 bitmap fill = per-shape region → break-apart required.
EDGE: M.1 tile a texture · M.2 lock-fill across strokes.
TESTS: TS-01 break-apart → bitmap fill · TS-02 tile/scale · TS-03 lock fill · TS-04 eyedropper bitmap fill (E1).

## F-23-08 CUSTOM COLORS & REPLACEMENT
1. Official name: (custom colors / Find & Replace colors / Adjust Color). 4. Purpose: reuse custom colors; bulk-replace colors; instance color adjust. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 23.7]: custom color → swatches; Find & Replace → Colors (replace X with Y, document-scoped); Adjust Color filter (per-instance hue/brightness/contrast, F-11-09).
SEMANTICS
| Feature | Does |
|---|---|
| Custom color | pick/save to swatches |
| Find & Replace colors | bulk replace (scope: doc/scene/selection) + preview |
| Adjust color filter | per-instance recolor |
LIMITATIONS: L.1 Find&Replace colors in Animate is doc-wide only → ours: scoped + preview.
EDGE: M.1 replace fill-only vs stroke-only · M.2 adjust hue on instance.
TESTS: TS-01 custom → swatch · TS-02 replace scoped (ours) · TS-03 preview · TS-04 adjust-color filter · TS-05 undo.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = flat-stroke-rule + focal-point + Find&Replace-scoping — covered.
```
FEATURE COMPLETE: F-23-05..08 — Alpha, gradients, bitmap fills, replacement — AUDITED
```
