# F-06-01..12 — SHAPE SYSTEM (full part)
```
SOURCE BLUEPRINT: Part 06 — Shape System
DEEP FEATURES: F-06-01..12 · STATUS: AUDITED
DEPENDS ON: F-05 (drawing) · FEEDS: F-05-03 (merge model)
```
## A. IDENTITY
1. Official name: (shape system). 4. Purpose: the 4 shape kinds + merge model + booleans + break-apart + the exact shape data representation. 8. Status: current.

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Combine Objects (Union/Intersect/Punch/Crop) on drawing objects; Punch/Crop keep objects separate. | [OFFICIAL] `transforming-combining-graphic-objects.html` |
| E2 | Break Apart ≠ Ungroup; breaking apart animated symbols/groups in interpolated animation "not recommended and might have unpredictable results." | [OFFICIAL] `arranging-objects.html` |
| E3 | Merge model: partial-selection move splits shapes (F-03-10 E4); merge rules. | [OFFICIAL + COMMUNITY] |
| E4 | Art brushes default to object-drawing mode (heavy vector data). | [OFFICIAL] `working-with-paint-brush.html` |

## F-06-01 SHAPE TAXONOMY
raw shape (merge) / drawing object / primitive (rect/oval/polystar) / group — 4 kinds (Part 06.0 table). Contrast: symbol instance = Part 11.

## F-06-02 MERGE MODEL
same-color union · different-color cut (cookie-cutter) · stroke-crossing splits fill · move-selected-part splits (E3) · delete-part = hole. One shape node, multiple fills/strokes; overlap resolved geometrically at edit time.

## F-06-03 DRAWING OBJECTS
Atomic; object-drawing mode; edit-in-place (double-click); break-apart → raw shape. Boolean-combinable (E1).

## F-06-04 PRIMITIVES
Parametric params (w/h/cornerRadius; cx/cy/rx/ry/angles/hole; sides/starPointSize); editable until baked (break-apart / convert).

## F-06-05 SHAPE EDITING & HANDLES
levels: whole (Selection) → anchor (Subselection) → topology (Pen sub-tools) → width (Width tool) → style (Eyedropper/Bucket/Ink) → region (Lasso); handles: anchors/tangents/primitive-params/width/gradient.

## F-06-06 SMOOTH / STRAIGHTEN / OPTIMIZE
Smooth = simplify; Straighten = snap near-straight; Optimize = reduce anchors (angle threshold) — file-size win.

## F-06-07 COMBINE OBJECTS (BOOLEANS)
Union/Intersect/Punch/Crop (E1); top-most = active (style/punch shape); same Boolean engine as merge/eraser (Part 32.2).

## F-06-08 ERASE AS SUBTRACTION
Stamp boolean; modes mask (fills/lines/inside/selection); faucet = delete component; stroke split at boundary.

## F-06-09 FILL BEHAVIOR
Regions (anchor loops); styles; lock-fill (shared gradient); gap tolerance (morph close); fill rule.

## F-06-10 STROKE BEHAVIOR
Flat color (F-05 E1); splits at intersections; caps/joins; convert-to-fill.

## F-06-11 CONVERSION & BREAK-APART HIERARCHY
(Part 06.8 map) instance→content→shapes; group→children; text→chars→shapes; bitmap→fill; drawing-object→raw; primitive→baked. Break-apart = one level (E2).

## F-06-12 SHAPE DATA MODEL
(Part 33 §33.19) `shape` node: path(anchors+handles+closed) + fills(regions+styles) + strokes(path+style+widthProfile) + params | children.

## L. LIMITATIONS
L.1 merge model destructive-by-default → object mode default for new users + region-lock (F-03-01 L.1). L.2 break-apart one-way (Library keeps symbol) → warn. L.3 breaking tweened symbols unpredictable (E2) → block + convert-to-FBF first.

## M. EDGE CASES
M.1 partial marquee + move = split (E3) · M.2 delete region = hole · M.3 boolean on raw shapes (ours) · M.4 break-apart tweened symbol (blocked, ours) · M.5 donut (two loops, opposite winding).

## O/P/Q/R/S/Y
Data: shape node (Part 33). Events: `document:changed`. Undo: one command per boolean/erase/break/convert. Serialization: persisted. Mobile: boolean/merge via long-press menu. Implementation: BooleanGeometryEngine (union/intersect/subtract via polygon clipping); merge resolution at edit time; region-lock toggle.

## TESTS
TS-01 merge union same-color · TS-02 cut different-color · TS-03 split-on-move (E3) · TS-04 object atomic · TS-05 primitive params + bake · TS-06 union/intersect/punch/crop (E1) · TS-07 eraser subtraction + split · TS-08 break-apart hierarchy · TS-09 tweened-symbol break blocked (E2) · TS-10 donut fill · TS-11 undo boolean · TS-12 shape model round-trip.

## AUDITS
No contradiction. Self-challenge: overlooked = merge-resolved-at-edit-time + break-apart-one-level (E2) + boolean-engine-shared + region-lock — covered.

```
FEATURE COMPLETE: F-06-01..12 — Shape system — AUDITED
```
