# PART 06 — SHAPE SYSTEM
### Primitives, drawing objects, raw (merge) shapes, shape editing, handles, conversion, break apart, boolean combine (union/intersect/cut/punch), erase, fill/stroke behavior — and the exact shape data representation for the new application.

---

## 6.0 The shape taxonomy (every kind of "shape" in the model)

A 2D animation editor has **four distinct kinds of shape-ish objects**. Confusing them causes most merge/edit bugs. Define them once, in the model:

| Kind | Model type | Atomic? | Editable how | Reuse? |
|---|---|---|---|---|
| **Raw shape (merge shape)** | `shape` | No — fill & stroke are separate sub-objects; overlapping shapes merge/cut | Directly on stage (Selection/Subselection/tools) | No |
| **Drawing object** | `drawingObject` | Yes | Directly on stage; double-click to edit in place | No |
| **Primitive (parametric)** | `rectPrimitive` / `ellipsePrimitive` / `polyStar` | Yes | Parametric (radius/angles/hole) until baked | No |
| **Group** | `group` | Yes | Double-click to edit in place | No |
| *(contrast)* **Symbol instance** | `symbolInstance` | Yes (instance) | Edit definition (updates all) | **Yes** (Part 11) |

The first four are "shapes" (Part 06). The symbol instance is Part 11 — but note the pipeline: **shape → convert to symbol** is the most common transition in the app.

---

## 6.1 Raw shapes & the merge model (the Animate signature behavior)

### 6.1.1 What a raw shape is
A raw shape = a collection of **fills** and **strokes** on one layer/frame, stored as geometry. It is **not** a single atomic object: its fill and strokes are selectable and movable **independently** (Part 03.4.1).

### 6.1.2 The merge rules (exactly)
When raw shapes on the **same layer, same frame** interact:

1. **Same-color fill overlap → MERGE.** Two overlapping blue fills become one blue fill (the union boundary).
2. **Different-color fill on top → CUT (cookie-cutter).** The top shape **punches a hole** in the one below where they overlap. Move the top away → the hole remains.
3. **Stroke crossing a fill → splits the fill** into separate regions at the stroke line.
4. **Same-color stroke overlap → merge** into a connected line network.
5. **Move a selected part → SPLIT.** Selecting a fill region (or part of one) and dragging it **cuts it out** of the shape and takes it along.
6. **Delete a part → hole.** Deleting a selected region removes it, leaving the rest.

### 6.1.3 Why it exists & when to use it
The merge model makes **cel-style painting fast**: draw overlapping outlines, drop fills, erase overdraw — the geometry "sculpts" itself. It's also why Animate pros do clean line art: draw with the **Brush (Paint Fills/Inside)** or use **object mode** to avoid accidental cuts.

### 6.1.4 Data representation of a merge interaction
A raw shape is stored as **one shape node** containing multiple fills/strokes; overlap is resolved **geometrically at edit time**, not by keeping separate nodes:

```
merge(a, b):  // same layer+frame, both raw shapes
  for each fill in b:
    for each fill in a with equal style:  union(region_a, region_b)
    else:                                 subtract(region_a, region_b)  // cut
  for each stroke: split at intersections with other strokes/fills
```

Implementation: the **Boolean geometry engine** (Part 32) computes unions/intersections/subtractions of paths (via polygon clipping). This is the most algorithmically heavy part of the vector engine — budget real engineering for it (it underpins merge mode, eraser, combine-objects, and paint modes).

---

## 6.2 Drawing objects (object-drawing mode)

- Toggle **Object Drawing** in tool Options → each drawn thing becomes a **drawing object** (atomic, own transform, no merge/cut).
- Overlaps **do not** interact — objects stack in the display list (front-to-back).
- Editing: double-click → **edit in place** (breadcrumb + dimming); or right-click → Break Apart to convert to a raw shape.
- Drawing objects can be **combined** via booleans (6.5).

### Why two modes? (design rule for our app)
- **Object mode** = safe default for new users and for heavy art (no accidental destruction).
- **Merge mode** = power mode for Animate-pros doing painted/inked work.
- Both produce shapes; the mode is a **node type + tool toggle**, not two different editors.

---

## 6.3 Primitive shapes (parametric)

- **Rectangle/Oval Primitives** and **PolyStar** store **parameters**, not baked paths (Part 02b T2B.6–8):

```jsonc
{ "type":"rectPrimitive", "x":0,"y":0,"w":200,"h":100,"cornerRadius":12, "fill":{...},"stroke":{...} }
{ "type":"ellipsePrimitive","cx":0,"cy":0,"rx":100,"ry":50,"startAngle":0,"endAngle":360,"innerRadius":0, ... }
{ "type":"polyStar","cx":0,"cy":0,"sides":5,"isStar":true,"starPointSize":0.5,"radius":100, ... }
```

- While parametric: edited via **parameter handles** (dot on the shape) + Properties fields; Subselection shows no anchors.
- **Bake** (Break Apart / Convert to drawing object) → becomes a plain path (loses params, gains full path editing).

### Data representation rule
Store primitives as **nodes with a `params` object** and render by tessellation. Baking replaces the node with a `shape` node. This is cheap and preserves editability — a clear win over always-baking.

---

## 6.4 Shape editing & shape handles

### 6.4.1 Levels of editing
| Level | Tool | Edits |
|---|---|---|
| Whole shape | Selection | Move; edge/corner reshape (drag path edges) |
| Anchor/handle | Subselection | Anchor positions, Bézier handles, point type |
| Topology | Pen sub-tools | Add/delete anchors |
| Width | Width tool | Variable width profile |
| Style | Eyedropper/Bucket/Ink Bottle/Properties | Fill/stroke styles |
| Region | Lasso + move/delete/fill | Partial-shape cut/fill |

### 6.4.2 Shape handles (visual)
- **Anchors**: squares (filled = selected, hollow = unselected).
- **Tangent handles**: dots on short lines from a selected curve anchor.
- **Primitive parameter handles**: dots (corner radius / arc endpoints / inner-radius hole).
- **Width handles**: bars perpendicular to the stroke at width points.
- **Gradient/fill handles**: center/scale/rotate/focal (Gradient Transform).

### 6.4.3 Smooth / Straighten / Optimize
- **Smooth** — iterative path simplification (remove near-collinear anchors, soften curves).
- **Straighten** — recognize near-straight runs and snap them to lines; near-arc runs to arcs.
- **Optimize Curves** (`Ctrl+Shift+Alt+C`) — reduce anchor count by an angle-threshold tolerance; fewer anchors = smaller files (matters for export).
- All are geometry commands on the selected shape; undoable; run through the smoothing pipeline (Part 05 §5.1.7).

---

## 6.5 Combine objects — boolean operations

Animate's **Modify > Combine Objects** works on **drawing objects** (and raw shapes in newer versions):

| Operation | Result | Implemented as |
|---|---|---|
| **Union** | Merge overlapping objects into one (keeps the top object's style) | path union |
| **Intersect** | Keep only the overlap region | path intersection |
| **Punch** | Subtract the top from the bottom (like the cookie-cutter) | path subtraction |
| **Crop** | Keep only the region of the bottom that overlaps the top | inverse of punch (clip) |

```jsonc
// command
{ "op":"combine", "mode":"union|intersect|punch|crop", "targets":[...], "result": nodeId }
```

Rules:
- The **top-most** object is the "active" one (provides the style / the punch shape); the result replaces the operands (or keeps them if "keep originals" is set — our app adds this option).
- Works on raw shapes too in our app (Animate historically required drawing objects; we support both by operating on the shape geometry).
- This is the same Boolean engine as merge mode (6.1.4) — one engine, two entry points.

---

## 6.6 Erase (as shape subtraction)

The Eraser tool (Part 02c T2C.5) is **boolean subtraction** with a moving stamp:

```
eraseStroke(stamps, shape, mode):
  for stamp in stamps:
    shape.fills/strokes = subtract(shape, stamp)   # mode masks: fills-only / lines-only / inside / selection
  split strokes at erase boundaries (a crossed stroke → two strokes)
```

- **Faucet** = delete the connected component (fill) or stroke segment under the click (flood-find + delete).
- Undo = one `EraseCommand` per erase stroke.

---

## 6.7 Fill behavior & stroke behavior (the complete rules)

### 6.7.1 Fill behavior
- A fill lives **inside a closed path** (or a region of overlapping paths, per the fill rule).
- Fill styles: **solid**, **linear gradient**, **radial gradient**, **bitmap** (Part 23).
- **Gradient/bitmap fills carry a transform** (center, scale, rotation, focal) — edited by Gradient Transform, stored in the style (Part 02a T2A.4).
- **Lock Fill** (Brush/Bucket): consecutive strokes/fills share one gradient space (the gradient continues across them).
- **Gap tolerance** (Bucket): a fill can bridge small gaps in the outline (morphological close before fill).
- Fill of a **self-intersecting** path follows the fill rule (5.3.1).

### 6.7.2 Stroke behavior
- A stroke follows a path (open or closed) with base width + optional width profile.
- Caps/joins apply (5.1.10–11).
- **Strokes are flat-colored** in Animate (no gradient strokes); gradient strokes = convert to fill.
- Strokes **split** at intersections with other strokes/fills (merge model) and under the eraser.
- **Convert Lines to Fills** turns the stroke outline into a fill (5.1.13).

---

## 6.8 Shape conversion & break-apart hierarchy (complete map)

```
symbol instance ──Break Apart──▶ raw content (copy of symbol art on this frame)
group ────────────Break Apart──▶ its children (one level)
text block ───────Break Apart──▶ per-character text blocks ──Break Apart──▶ vector shapes
bitmap ───────────Break Apart──▶ bitmap-fill region (editable/lasso-able)
drawing object ───Break Apart──▶ raw shape (merge model)
primitive ────────Break Apart──▶ baked path (then raw shape)
raw shape ──(nothing below)──▶ already raw
```

**Conversion commands (Modify > Shape / Modify > Combine):**
- Convert Lines to Fills; Expand Fill (grow/shrink fill by N px); Soften Fill Edges (feathered edge → banded alpha); Trace Bitmap (raster→vector).
- Our app implements expand/soften as P2 (morphological ops).

---

## 6.9 THE SHAPE DATA MODEL (the exact representation for the new app)

This is the specification another AI can implement directly (full schemas in Part 33). A **shape node**:

```jsonc
{
  "id": "n123",
  "type": "shape",                     // 'shape' | 'drawingObject' | 'rectPrimitive' | 'ellipsePrimitive' | 'polyStar' | 'group'
  "transform": { "x":0,"y":0,"scaleX":1,"scaleY":1,"rotation":0,"skewX":0,"skewY":0,"pivotX":0,"pivotY":0 },
  "fillRule": "nonzero",               // 'nonzero' | 'evenodd'

  // one path + fills + strokes for raw shapes / drawing objects:
  "path": {
    "anchors": [ { "x":0,"y":0,"h1x":-10,"h1y":0,"h2x":10,"h2y":0,"smooth":true }, ... ],
    "closed": true
  },
  "fills": [
    { "region": [0,1,2,3],             // anchor index loop(s) defining the region
      "style": {
        "type": "solid|linearGradient|radialGradient|bitmap",
        "color": "#3fa9f5", "alpha": 1,
        "stops": [ { "offset":0, "color":"#ff0000", "alpha":1 }, ... ],   // gradients
        "transform": { "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
        "bitmapAssetId": null          // bitmap fill
      } }
  ],
  "strokes": [
    { "path": { ... }, "closed": false,
      "style": {
        "color":"#000000", "alpha":1, "width":2,
        "cap":"round|square|butt", "join":"round|miter|bevel", "miterLimit":4,
        "dash":[4,2] | null,
        "brushAssetId": null           // art/pattern brush
      },
      "widthProfile": [ { "t":0, "wL":2, "wR":2 }, ... ] }
  ],

  // parametric primitives:
  "params": { "w":200,"h":100,"cornerRadius":12 } | null,

  // group:
  "children": [ "n124", "n125" ] | null
}
```

### Design rules (why this shape)
1. **One node per shape** (fills+strokes co-located) — matches Animate's merge model and keeps the display list flat.
2. **Regions reference anchors by index** — a fill can span a subset of anchors (e.g. a "donut" uses two loops: outer + inner, opposite winding). Keep `region` as an array of **loops**, each an anchor-index cycle.
3. **Styles are separate from geometry** — style changes never re-tessellate geometry; geometry changes never re-parse styles.
4. **Primitives are nodes with `params`** — bake on demand.
5. **Group is a node with children** — groups are just containers with a transform.
6. **Everything is a node** — the renderer and hit-tester walk one uniform tree (Part 32 Scene Graph).

---

## 6.10 BUILD CHECKPOINT — MILESTONE M1 COMPLETE

With Parts 01–06, the editor is a **working static drawing tool**. Verify:

- [ ] Create a document; draw every primitive (pen/pencil/brush/line/rect/oval/polystar) as raw shapes AND drawing objects AND primitives.
- [ ] Merge model works: same-color union, different-color cut, split-on-move, erase-splits-strokes.
- [ ] Object mode: atomic, no interaction; edit-in-place drill.
- [ ] Booleans: union/intersect/punch/crop on shapes.
- [ ] Break-apart hierarchy for symbol/group/text/bitmap/primitive.
- [ ] Fill styles (solid/linear/radial/bitmap) with gradient transform; stroke styles (width/cap/join/dash/profile).
- [ ] Smooth/straighten/optimize; convert-lines-to-fills; ink bottle; paint bucket with gap tolerance.
- [ ] Shape data model matches §6.9; save/load round-trips exactly.
- [ ] Selection + transform (Parts 03–04) operate correctly on every shape kind.

*M2 begins: `07_timeline.md` — every timeline control, frame type, layer control, and timeline action in full detail.*
