# F-05-01..10 — DRAWING SYSTEM (full part)
```
SOURCE BLUEPRINT: Part 05 — Drawing System
DEEP FEATURES: F-05-01..10 · STATUS: AUDITED
DEPENDS ON: F-02 (tools), F-06 (shapes) · FEEDS: F-06
```
## A. IDENTITY
1. Official name: (stroke/fill drawing system). 4. Purpose: the stroke/fill model + the 15 dimensions every drawing tool honors. 8. Status: current.

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Strokes flat-colored only (no gradient strokes); Ink Bottle applies "only solid colors, not gradients or bitmaps, to lines or shape outlines." | [OFFICIAL] `strokes-fills-gradients.html` |
| E2 | Stroke style (solid/dash/custom); custom style dialog (type/zoom/thickness/sharp corners); "selecting a stroke style other than Solid can increase file size." | [OFFICIAL] same |
| E3 | Merge vs object drawing modes; art brushes default to object mode. | [OFFICIAL] `working-with-paint-brush.html` |
| E4 | Convert Lines to Fills = stroke outline → fill; loses path editing. | [OFFICIAL] same |
| E5 | Brush modes (Paint Normal/Fills/Behind/Selection/Inside); size/shape; Lock Fill; pressure/tilt. | [OFFICIAL] `draw-simple-lines-shapes.html` + `working-with-paint-brush.html` |
| E6 | Live color preview (hover swatch) + hex entry + B&W reset. | [OFFICIAL] `strokes-fills-gradients.html` |
| E7 | Smoothing pipeline (resample→RDP→moving-average) + 3 pencil modes = smoothing presets. | [OUR DESIGN DECISION] + [OFFICIAL] pencil modes |

## F-05-01 STROKE MODEL (15 dimensions)
creation (path+style) · fill creation (closed path+fill) · thickness (base width + widthProfile wL/wR) · style (solid/dash/brush; flat-color only E1) · color (stroke chip) · opacity (alpha; top-level slider W6) · smoothing (pipeline E7) · curves (cubic canonical) · corners (corner anchors / radius) · caps (round/square/butt) · joins (round/miter/bevel + miter-limit) · editing (selection/subselection/width/ink-bottle/eraser) · converting (lines-to-fills E4) · breaking apart · grouping.

## F-05-02 FILL MODEL
Closed region + fill style (solid/linear/radial/bitmap); fill rule (nonzero default, even-odd option).

## F-05-03 MERGE vs OBJECT MODE
Merge: same-color union, different-color cut, split-on-move (F-03-10 E4). Object: atomic. Both = node type + tool toggle (E3).

## F-05-04 CAPS & JOINS
Round/square/butt; round/miter(limit)/bevel; stored per stroke style.

## F-05-05 STROKE RENDERING (OUTLINE POLYGONS)
Render strokes as offset outline polygons (width profile L/R) — enables variable width, caps, joins, scaling; hairline + non-scaling option (P2).

## F-05-06 STROKE↔FILL CONVERSION
Lines-to-fills (E4); ink bottle (fill→stroke, solid only E1).

## F-05-07 OPACITY & COMPOSITING
Alpha on fills/strokes; merge same-style = no double-darken.

## F-05-08 SNAPPING DURING DRAWING
Grid/guides/objects/pixels (F-01-17).

## F-05-09 DRAW-TARGET CONTRACT
At pointer-down: active layer (locked/hidden/tween → blocked with reason), active frame (key/blank/held → auto-key rule), mode (merge/object), fill+stroke styles, snap flags. One DrawCommand per completed shape.

## F-05-10 PER-TOOL 15-DIMENSION MATRIX
(Part 05.2 table — Pen/Pencil/Brush/PaintBrush/Line/Rect/Oval/Poly/Bucket/InkBottle/Eraser/Eyedropper mapped to the 15 dimensions.)

## L. LIMITATIONS
L.1 flat strokes only (E1) → gradient strokes via convert-to-fill. L.2 non-solid strokes larger files (E2). L.3 merge model surprises → region-lock toggle (F-03-01 L.1).

## M. EDGE CASES
M.1 stroke-only shape (interior miss, F-03-01 M.24) · M.2 fill-only shape · M.3 self-intersecting fill (winding) · M.4 50%-alpha overlap (no darken) · M.5 pressure absent (mouse → constant width).

## O/P/Q/R/S/Y
Data: shape node (fills/strokes/path) + stroke style + widthProfile (Part 33 §33.19). Events: `document:changed` (on DrawCommand). Undo: one command per stroke/shape. Serialization: persisted. Mobile: finger smoothing + stylus pressure/tilt (F-31-04). Implementation: stroke = outline polygon tessellation in VectorEngine (Part 32.2); draw-target validation before pointer-down.

## TESTS
TS-01 stroke created with style · TS-02 variable width profile · TS-03 caps/joins render · TS-04 flat-stroke rule (gradient stroke → convert) · TS-05 merge union/cut/split · TS-06 object atomic · TS-07 lines-to-fills (E4) · TS-08 ink bottle solid-only · TS-09 no double-darken · TS-10 snap during draw · TS-11 draw on locked layer blocked · TS-12 draw on tween layer blocked · TS-13 undo one-command · TS-14 pressure/tilt.

## AUDITS
No contradiction. Self-challenge: overlooked = flat-stroke-only (E1) + outline-polygon rendering + merge/object dual model + draw-target contract — covered.

```
FEATURE COMPLETE: F-05-01..10 — Drawing system — AUDITED
```
