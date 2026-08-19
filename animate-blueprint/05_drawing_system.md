# PART 05 — DRAWING SYSTEM
### The complete stroke/fill model and every drawing tool's behavior across 15 dimensions (stroke creation, fill creation, thickness, style, color, opacity, smoothing, curves, corners, caps, joins, editing, converting, breaking apart, grouping) — plus practical vector-geometry behavior.

---

## 5.0 The two primitive drawing artifacts: STROKE and FILL

Everything drawn is either a **stroke** (an open or closed **path** with width + style) or a **fill** (a **closed region** with a fill style). Animate's shapes are *both*: a closed path can carry a fill (inside) and a stroke (along the outline) simultaneously.

```jsonc
// shape node (Part 33)
{
  "type": "shape",
  "path": { "anchors": [...], "closed": true },
  "fills":  [ { "region": [anchorIndices...], "style": {...} } ],
  "strokes":[ { "path": {...}, "style": {...}, "widthProfile": [...] } ]
}
```

Key facts:
- A **path** = ordered anchors (each = position + 1 or 2 Bézier handles) + `closed` flag.
- A **fill** = a set of closed sub-paths (regions) + a **fill style** (solid / linear gradient / radial gradient / bitmap).
- A **stroke** = its own path + a **stroke style** (color, thickness, cap, join, dash, width profile).
- Fill and stroke are **independent** sub-objects (selectable/movable separately in merge mode — Part 03.4.1).

---

## 5.1 Stroke model (the 15 dimensions, defined once)

These apply to every tool that makes or edits strokes. Defined here; referenced per-tool below.

### 5.1.1 Stroke creation
A stroke is created when a tool emits a **path with a stroke style** (Pencil, Pen, Line, Rectangle, Oval, PolyStar, Paint Brush). An existing **fill-only** shape gets a stroke via the **Ink Bottle tool** (adds stroke to the outline) or by setting a stroke color and drawing.

### 5.1.2 Fill creation
A fill is created when a tool emits a **closed path with a fill style** (Rectangle, Oval, PolyStar, Pen-closed, Brush). An existing closed stroke gets a fill via the **Paint Bucket tool** (fills the enclosed region).

### 5.1.3 Stroke thickness (width)
- A stroke has a **base width** in px (1 = hairline-ish; 0.25–200 practical). Stored per stroke style.
- A **variable width profile** (Width tool, Part 02c T2C.6) overrides base width with per-point left/right widths: `widthProfile = [{t, wL, wR}]` (t = normalized distance along path).
- Rendering: offset the path centerline by `wL` (left) and `wR` (right) at each point → fill the resulting outline. **This is how the renderer must implement strokes: as outline polygons, not line primitives** (so variable width, caps, joins, and scaling all work uniformly).

### 5.1.4 Stroke style
- **Solid** (uniform color+width) — default.
- **Dashed/dotted** — pattern of dash/gap along the path (dash array). Custom dash patterns supported.
- **Art Brush / Pattern Brush** (Paint Brush, Part 02c T2C.3) — artwork stretched/tiled along the path.
- **Ragged/stipple/hatched** (Animate's preset stroke styles) — our app ships solid/dash/brush as core; ragged/stipple as P3 presets.

### 5.1.5 Color
- Stroke color = flat color or gradient? **Animate: strokes are flat-colored only** (no gradient strokes natively); gradient strokes are approximated by converting to fills. Our app: keep strokes flat (P0) + optional gradient strokes via "convert to fill" (P2) to match Animate and stay simple.
- Color is set from the **Color controls** (stroke chip) before drawing, or via Properties after selecting a stroke.

### 5.1.6 Opacity (alpha)
- Every color (fill or stroke) carries an **alpha** (0–100%). Animate nests it inside color; *[WISH W6]* our app exposes alpha as a **top-level slider** next to the color chip.
- Instance-level alpha (symbol color effect) is separate from fill/stroke alpha (Part 11).

### 5.1.7 Smoothing
- Freehand tools (Pencil/Brush/Paint Brush) run the shared **smoothing pipeline** (Part 02c §"Stroke capture & smoothing"): resample → RDP + moving-average → optional straighten. Smoothing strength = per-tool slider.
- Pencil's three modes map to strength: Ink = ~0, Smooth = mid, Straighten = mid + straight-line recognition.
- Geometric tools (Pen/Line/Rect/Oval/PolyStar) need **no smoothing** (they're exact).

### 5.1.8 Curves
- Paths store **quadratic or cubic Bézier** segments. Our engine: cubic (two handles per anchor) as the canonical form; importers convert quadratics.
- Curve anchors: **smooth** (mirrored handles) vs **corner** (independent handles) — set by Pen drag vs click, or converted with the Convert-anchor sub-tool.

### 5.1.9 Corners
- A **corner** = a corner anchor (two independent tangents) or a mitre join between straight segments. Radiused corners come from Rectangle/Oval primitives (corner-radius param) or by converting a corner anchor to a smooth curve.

### 5.1.10 Caps (stroke ends)
- **Round** (default, semicircle), **Square** (extends half-width past the end), **None/Butt** (ends exactly at the path end).
- Visible only on open strokes. Stored per stroke style.

### 5.1.11 Joins (stroke corners)
- **Round** (arc at corners), **Miter** (sharp corner, with miter-limit), **Bevel** (flat cut corner).
- Stored per stroke style. Miter limit = max ratio before falling back to bevel (prevents long spikes at acute angles).

### 5.1.12 Editing
- Strokes/paths edit with: Selection (edge/corner reshape), Subselection (anchors/handles), Pen sub-tools (add/delete/convert), Width (variable width), Ink Bottle (restyle), Eraser (subtract).

### 5.1.13 Converting
- **Convert Lines to Fills** (Modify > Shape): turns a stroke into a **fill outline** (the stroke's outline polygon becomes a fill). After this it behaves as a fill (can get gradient fills, be deformed, etc.) and **loses path-editing**.
- **Convert Fill to Outline / Stroke**: our app adds the inverse (P2).
- **Trace Bitmap**: vectorizes a bitmap into shapes (Part 27).

### 5.1.14 Breaking apart
- **Break Apart (Ctrl+B)** hierarchy: **Symbol instance / group → raw content** (one level); **text → characters → shapes** (two levels); **bitmap → pixel-fill bitmap** (editable region). Break-apart is the universal "flatten one level" command (Part 06 details the levels).

### 5.1.15 Grouping
- **Group (Ctrl+G)** wraps selected objects in a **Group** node (atomic selection + shared transform). **Ungroup (Ctrl+Shift+G)** dissolves. Groups are the lightweight alternative to symbols (no library entry, no reuse).

---

## 5.2 Per-tool drawing behavior (the 15 dimensions mapped)

Legend: ● = creates/uses this; ◐ = partial/indirect; — = not applicable.

| Dimension | Pen | Pencil | Brush | Paint Brush | Line | Rect/Oval/Poly | Paint Bucket | Ink Bottle | Eraser | Eyedropper |
|---|---|---|---|---|---|---|---|---|---|---|
| Stroke creation | ● | ● | — | ● | ● | ● | — | ● (adds to fill) | — | — |
| Fill creation | ● (closed) | — | ● | — | — | ● | ● (fills region) | — | — | — |
| Thickness | style | style | size (fill) | style+profile | style | style | — | style | size | — |
| Style | solid | solid/dash | fill | art/pattern | solid | solid | fill | solid | — | copies |
| Color | stroke | stroke | fill | brush | stroke | both | fill | stroke | — | samples |
| Opacity | alpha | alpha | alpha | alpha | alpha | alpha | alpha | alpha | — | alpha |
| Smoothing | exact | ● | ● | ● | exact | exact | — | — | — | — |
| Curves | ● (manual) | ◐ (auto) | ◐ (auto) | ◐ (auto) | — | ◐ (arcs) | — | — | — | — |
| Corners | ● | ◐ | ◐ | ◐ | — | ● (radius) | — | — | — | — |
| Caps | style | style | round | style | style | — | — | style | — | — |
| Joins | style | style | — | style | — | style | — | style | — | — |
| Editing | path | path | fill outline | stroke path | path | parametric/path | region | style | boolean | style |
| Converting | to fill | to fill | to outline | to fill | to fill | bake | — | — | — | — |
| Breaking apart | n/a | n/a | n/a | n/a | n/a | bake → path | n/a | n/a | n/a | n/a |
| Grouping | — | — | — | — | — | — | — | — | — | — |

---

## 5.3 Practical vector-geometry behavior (what the engine must get right)

### 5.3.1 Fill rules (winding vs even-odd)
- A closed path's interior is decided by a **fill rule**. Self-intersecting paths (a star drawn with one crossing stroke) fill differently under **non-zero winding** vs **even-odd**. Animate uses non-zero by default. Our app: make it a per-shape property (default non-zero), rendered consistently by canvas `fill('nonzero'|'evenodd')`.

### 5.3.2 Merge model vs object model (CRITICAL)
This is the single most distinctive Flash/Animate behavior — and the most confusing. Two drawing modes (Part 06 full detail):

- **Merged drawing (raw shapes):** when two same-color raw shapes **overlap on the same layer**, they **merge** into one shape. A different-color shape on top **cuts a hole** in the one below (the "cookie-cutter" behavior). Selecting and moving a part **splits** it off. Erasing splits strokes. This is powerful but surprising.
- **Object drawing:** every drawn object is **atomic** — overlaps don't merge/cut; each is independently movable. (Default for Paint Brush because brush strokes are heavy.)

**Our app must implement BOTH modes**, with the mode as a toggle in the tool Options + a per-shape type in the model (`shape` vs `drawingObject`). New users get object mode by default (safer); Animate pros get merge mode (they expect it). *[WISH]* This dual model is what "clone Animate exactly" means — do not skip merge mode.

### 5.3.3 Stroke rendering & scaling
- Strokes render as **outline polygons** (5.1.3) so they scale correctly (thickness scales with the object unless "non-scaling stroke" is set — our app adds a per-stroke `nonScaling` flag, P2).
- **Hairline** (1px) strokes at small export sizes can shimmer; anti-aliasing settings matter (Part 28).

### 5.3.4 Stroke-to-fill and fill-to-stroke symmetry
- Stroke → Fill (convert lines to fills): outline polygon becomes fill; path editing lost.
- Fill → Stroke (ink bottle): fill's outline gets a stroke; fill stays.
- Both are lossy in one direction (geometry type changes) — document this in tooltips.

### 5.3.5 Opacity & compositing
- Fill/stroke alpha composites with **normal blending** within the shape; overlapping same-color shapes with alpha < 100% **do not** double-darken in Animate's merge model (the merged fill is one region). Our renderer must merge same-style fills before rasterizing to avoid the classic "two 50% shapes = darker overlap" bug.

### 5.3.6 Snapping during drawing
- All geometric + freehand tools snap to grid/guides/objects/pixels via the SnapEngine (Part 01 §1.4.4). Pen anchors snap; Line endpoints snap; Rect/Oval corners snap. Snap feedback = dashed line + snapped cursor.

### 5.3.7 Pressure/tilt → width/opacity
- Stylus pressure maps to **width** (Pencil/Paint Brush/Brush) or **opacity** (Brush option). Tilt maps to **angle** of a flat brush dab. Stored as per-point width in the width profile. Finger input (no pressure) = constant width + heavier smoothing.

---

## 5.4 Drawing-mode toggle & the draw-target contract (recap)

Every drawing tool must honor, at pointer-down time:

1. **Active layer**: locked? hidden? tween layer? (drawing blocked with reason — Part 02b T2B.1 field 16).
2. **Active frame**: keyframe / blank keyframe / held / empty → draw into it, auto-keying where the rule requires.
3. **Drawing mode**: merged vs object.
4. **Current fill + stroke style** (from Color controls) + tool options (size, shape, smoothing, assist mode).
5. **Snapping** flags.

One **DrawCommand** per completed shape/stroke (undo granularity).

---

## 5.5 BUILD CHECKPOINT M1 (drawing slice)

- [ ] Path model (anchors + handles + closed) with fill & stroke sub-objects; fill rules (nonzero/even-odd).
- [ ] Stroke model: base width + width profile + cap (round/square/butt) + join (round/miter/bevel + miter-limit) + dash + art/pattern brush styles.
- [ ] Stroke rendering as outline polygons (correct scaling).
- [ ] Merge mode (same-color merge, cut-hole, split-on-move) AND object mode, with a per-tool toggle.
- [ ] Fill/stroke opacity; no double-darkening on same-style overlap.
- [ ] Convert lines→fills; ink-bottle (fill→stroke); break-apart hierarchy; group/ungroup.
- [ ] All 12 tools of this part functional on desktop + touch with the 15-dimension behavior above.

*Next: `06_shape_system.md` — primitives, drawing objects, raw shapes, merge, shape editing, handles, conversion, break apart, combine/union/cut/intersect/erase, fill/stroke behavior, and the exact shape data representation for the new app.*
