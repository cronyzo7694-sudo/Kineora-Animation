# F-09-04 — SHAPE TWEEN
```
SOURCE BLUEPRINT: Part 09 §9.3 · DEEP FEATURE: F-09-04 · STATUS: AUDITED
DEPENDS ON: F-08-06 · FEEDS: F-09-05 (easing)
```
## A. IDENTITY
1. Official name: Shape tween. 4. Purpose: morph one raw shape into another across frames (with color/position/width-profile morphing). 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `shape-tweening.html`: draw at frame 1, blank keyframe at frame 30 + draw circle, select in-between → Insert > Shape Tween → "Animate interpolates the shapes." E2 [OFFICIAL] same: **tween motion** by moving the frame-30 shape; **tween color** by different colors; **add easing** via Ease field. E3 [OFFICIAL] same: **ease presets** list + custom ease for shape tweens; Custom Ease dialog (frames axis, %-change axis). E4 [OFFICIAL] same: **variable-width strokes shape-tween**; **width profiles** tween. E5 [OFFICIAL] same: **shape hints** (Modify > Shape > Add Shape Hint) for correspondence. E6 [OFFICIAL] `animation-basics.html`: light-green span + arrow; **dashed = broken** (missing endpoint).

## D. SEMANTICS
| Aspect | Rule |
|---|---|
| Endpoints | two whole-frame keys with **raw shapes** (E1) |
| Interp | anchor correspondence + subdivision → per-anchor lerp; fill/stroke color lerp (F-08-06) |
| Motion | move the end shape → morph + travel (E2) |
| Color | different colors → lerp (E2) |
| Hints | force anchor correspondence (E5) |
| Width profiles | tween (E4) |
| Ease | slider + presets + custom graph (E3) |

## E. STATES
| State | Behavior |
|---|---|
| Two raw-shape keys | morphs |
| Endpoint deleted | broken (dashed) (E6) |
| 3+ keys | multi-stage morph |
| Symbols/groups/text | NOT supported (Break Apart first) |

## L. LIMITATIONS
L.1 Symbols/groups/text blocked → Break Apart (twice for text). L.2 Correspondence chaos → shape hints (E5). L.3 Region-count mismatch → loop split/merge (Part 06 engine).

## M. EDGE CASES
M.1 square→circle · M.2 color+position+shape combined (E2) · M.3 width-profile morph (E4) · M.4 broken dashed (E6) · M.5 hint unmatched · M.6 text morph (after break-apart ×2).

## O/P/Q/R/S/Y
Data: `{type:'shapeTween', start, end, ease, customEase[], shapeHints[]}`. Events: `timeline:changed`. Undo: one command per create/hint/ease. Serialization: persisted. Mobile: long-press → Shape Tween; hints via menu. Implementation: ShapeMorpher (F-08-06) + easing (F-09-05).

## TESTS
TS-01 shape morph (E1) · TS-02 motion+shape (E2) · TS-03 color tween (E2) · TS-04 ease (E2) · TS-05 hint (E5) · TS-06 width-profile morph (E4) · TS-07 broken (E6) · TS-08 symbols blocked · TS-09 3-key multi-stage · TS-10 ease preset (E3) · TS-11 undo · TS-12 reload.
## AUDITS
No contradiction. Self-challenge: overlooked = blank-keyframe-draw workflow (E1) + hints (E5) + width-profile morph (E4) — covered.
```
FEATURE COMPLETE: F-09-04 — Shape tween — AUDITED
```
