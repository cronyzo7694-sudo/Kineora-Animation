# F-08-06 — SHAPE KEYFRAME (SHAPE TWEEN MORPH)
```
SOURCE BLUEPRINT: Part 08 §8.3.4 · DEEP FEATURE: F-08-06 · STATUS: AUDITED
DEPENDS ON: F-08-01/02 · FEEDS: Part 09.3
```
## A. IDENTITY
1. Official name: (shape keyframe / shape tween endpoint). 4. Purpose: hold a **raw shape** at a frame; two shape keyframes define a morph. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `shape-tweening.html`: draw shape at frame 1, change/draw at frame 30 (blank keyframe), select in-between → Insert > Shape Tween → "Animate interpolates the shapes in all frames between." E2 [OFFICIAL] same: tween color by differing colors; tween motion by differing position; add **ease** via Ease field. E3 [OFFICIAL] same: **shape hints** (Modify > Shape > Add Shape Hint) force correspondence; **variable-width strokes shape-tween**; width profiles tween. E4 [OFFICIAL] `animation-basics.html`: dashed line = broken shape tween (missing endpoint). E5 [OUR DESIGN DECISION] anchor-correspondence + subdivision algorithm (blueprint Part 09.3.2).

## O. MORPH MODEL
- Two whole-frame keys with raw shapes + a shapeTween flag (F-07-06).
- Interp: (1) anchor correspondence (index order; subdivide the fewer); (2) per-anchor lerp; (3) fill color lerp; (4) shape hints override correspondence (E3).
- Variable-width strokes: width profiles lerp (E3).

## E. STATES
| State | Behavior |
|---|---|
| Two shape keys | morph between them |
| One endpoint deleted | **broken** (dashed, E4) |
| 3+ keys | multi-stage morph |
| Symbols/groups/text present | must Break Apart first (Part 09.3.3) |

## L. LIMITATIONS
L.1 Correspondence failure (self-intersect/chaos) → shape hints (E3). L.2 No morph on symbols/groups/text (Break Apart needed). L.3 Fill region count mismatch → split/merge loops (ours: documented in Part 06 engine).

## M. EDGE CASES
M.1 square→circle (4→4+ anchors) · M.2 text→shape morph (after break apart ×2) · M.3 color+position+shape all tween (E2) · M.4 broken tween (dashed) · M.5 width-profile morph (E3) · M.6 hint on unmatched corner.

## O/P/Q/R/S/Y
Data: two whole-frame keys + span flag (F-07-06); hints stored per span. Events: `timeline:changed`. Undo: one command per key/hint/tween create. Serialization: persisted. Mobile: long-press frame → Shape Tween; hints via menu. Implementation: `ShapeMorpher` in Vector Engine (Part 32.2): correspondence, subdivision, per-anchor lerp, color lerp, hint override.

## TESTS
TS-01 square→circle morphs (E1) · TS-02 color tweens (E2) · TS-03 position+shape tween (E2) · TS-04 ease applies (E2) · TS-05 hint forces correspondence (E3) · TS-06 width-profile morph (E3) · TS-07 broken endpoint = dashed (E4) · TS-08 symbols blocked (prompt break-apart) · TS-09 3-key multi-stage · TS-10 undo · TS-11 mobile · TS-12 deterministic morph.
## AUDITS
No contradiction. Self-challenge: overlooked = blank-keyframe-then-draw workflow (E1) + hints (E3) + width-profile morph (E3) — covered.
```
FEATURE COMPLETE: F-08-06 — Shape keyframe — AUDITED
```
