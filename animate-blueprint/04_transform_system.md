# PART 04 — TRANSFORM SYSTEM
### Move, Scale, Rotate, Skew, Free Transform, Distort, Envelope, pivots, numeric transforms, copy/reset/flip. For every operation: Input → calculation/concept → visible result → stored property → animation behavior → keyframe behavior.

---

## 4.0 The transform model (foundation)

Every placeable object carries a **Transform** component (Part 33). This single structure is what all tools, the Transform panel, tweens, and the renderer read/write:

```jsonc
"transform": {
  "x": 0, "y": 0,                 // position (stage coords of the object's origin)
  "scaleX": 1, "scaleY": 1,       // scale factors (1 = 100%)
  "rotation": 0,                  // degrees, clockwise (Y-down space), around pivot
  "skewX": 0, "skewY": 0,         // degrees of shear
  "pivotX": 0, "pivotY": 0        // pivot (transform point) in the object's LOCAL space
}
```

### 4.0.1 The transform matrix (concept)

The final placement of an object = a **2D affine transform** composed in a fixed order:

```
M = Translate(x, y) · Rotate(skewY) · Skew(skewX) · Scale(scaleX, scaleY) · Translate(-pivot)
```

(Conceptually; the app can use any equivalent decomposition. Animate's order is: scale → skew → rotate, around the transform point, then translate. The renderer applies `M` to the object's local geometry; `pivot` is where rotation/scale are centered.)

**Store the decomposed values, not the raw matrix** — because x, y, scale, rotation, skew, pivot are what users edit in panels and what tweens interpolate. The matrix is a cached derivative.

### 4.0.2 Transform spaces

| Space | Meaning |
|---|---|
| **Stage space** | Absolute coordinates of the scene (0,0 = stage top-left). |
| **Object/local space** | The object's own coordinates (symbols: centered on their registration point). |
| **Parent space** | A group/symbol's coordinate space for its children (nesting — Part 11). |
| **Screen space** | Stage space after view zoom/pan + camera (Part 16). |

Tools operate in **stage space** and write decomposed values in the object's **parent space**. The pivot is stored in **local space**.

---

## 4.1 MOVE

| Pipeline | Detail |
|---|---|
| **Input** | Drag selected object(s) with Selection tool (or arrow keys, or Transform panel X/Y, or Info panel). |
| **Calculation** | `delta = pointerNow - pointerStart` (snapped via SnapEngine). New position = `startPosition + delta`. |
| **Visible result** | Object translates; snap hint lines appear; Info panel live-updates X/Y. |
| **Stored property** | `transform.x`, `transform.y`. |
| **Animation behavior** | On a motion tween span, move creates/updates **position property keyframes** (x and y are independent keys — Part 09). On classic tween, a move on an in-between frame inserts a keyframe. |
| **Keyframe behavior** | Move on a keyframe = edits that keyframe. Move on a static/held frame = auto-converts to keyframe (Part 07 rule). |

Modifiers: `Shift` = constrain to axis/45°; `Alt`+drag = **duplicate-move** (drag a copy); arrow keys = 1 px nudge (Shift+arrow = 10 px).

---

## 4.2 SCALE

| Pipeline | Detail |
|---|---|
| **Input** | Drag a corner handle (both axes) or an edge handle (one axis); or Transform panel W/H (% or px); or numeric Scale & Rotate dialog. |
| **Calculation** | `scaleX = (pointer.x - pivot.x) / (startHandle.x - pivot.x)` (ratio of distances from pivot). Shift = constrain to proportional (scaleX = scaleY). Alt = scale about the opposite corner instead of the pivot. |
| **Visible result** | Object grows/shrinks around the pivot (or opposite corner). Info panel shows live W/H. |
| **Stored property** | `transform.scaleX`, `transform.scaleY` (and derived `width = baseW × scaleX`). |
| **Animation behavior** | On motion tweens, scaleX/scaleY are **separate property keyframes** (you can key X and Y at different frames). Classic tween: scale interpolates linearly between keyframes. |
| **Keyframe behavior** | Scale at playhead → property keyframe for scaleX/scaleY (motion) or classic keyframe. |

Notes:
- **Negative scale** = flip (scaleX = -1 mirrors horizontally). Animate allows it; our app too (document it).
- **Squash & stretch** = non-uniform scale over time — the classic animation technique; supported natively (scaleX ≠ scaleY).
- Scale is **multiplicative** around the pivot; chaining keyframes multiplies, which is why "Remove Transform" (4.9) exists to flatten.

---

## 4.3 ROTATE

| Pipeline | Detail |
|---|---|
| **Input** | Drag just outside a corner handle (rotation zone); or Transform panel rotation field; or Rotate 90° CW/CCW; or numeric dialog. |
| **Calculation** | `angle = atan2(pointer - pivot) - atan2(startHandle - pivot)`; `rotation = startRotation + degrees(angle)`. Shift = snap to 45° (or 15° per pref). Alt = rotate around the **opposite corner**. |
| **Visible result** | Object rotates around the **transform point (pivot)**. |
| **Stored property** | `transform.rotation` (degrees, clockwise in Y-down space). |
| **Animation behavior** | Motion tween: `rotation` is its own property keyframe (with orientation options — Part 09: CW/CCW, times-rotations). Classic tween: rotation interpolates linearly (shortest path by default; you can force full spins). |
| **Keyframe behavior** | Rotation at playhead → rotation property keyframe / classic keyframe. |

**Key concept — pivot decides everything:** rotation looks wrong 90% of the time because the pivot isn't on the joint. The workflow "drag pivot to joint → rotate" is the single most important transform habit (Parts 11/13/14 reinforce).

---

## 4.4 SKEW

| Pipeline | Detail |
|---|---|
| **Input** | Drag an edge midpoint with the skew modifier (Shift+edge-drag in Free Transform's Rotate&Skew mode); or Transform panel skew fields. |
| **Calculation** | Shear by the ratio of pointer displacement to object size: `skewX = degrees(atan(dx / height))` (approx). |
| **Visible result** | The object shears — vertical edges tilt (skewX) or horizontal edges tilt (skewY); a rectangle becomes a parallelogram. |
| **Stored property** | `transform.skewX`, `transform.skewY` (degrees). |
| **Animation behavior** | Motion tween: skewX/skewY are independent property keyframes. Classic: linear interpolation. |
| **Keyframe behavior** | Same as scale/rotate. |

Note: Animate keeps **skew separate from rotation** — rotating a skewed object is different from skewing a rotated object. Preserve both values independently in the model.

---

## 4.5 FREE TRANSFORM (combined)

Free Transform (Q) = move + scale + rotate + skew in one tool, with **modes** (Scale / Rotate & Skew / Distort / Envelope). The per-handle zone mapping and modifier matrix are in T2A.3 (Part 02a). Here: the semantic rules.

- **One gesture = one TransformCommand** storing the before/after of *all* changed fields (undo restores the whole gesture).
- **Combining** transforms in one drag (e.g. rotate while scaling) is allowed; the tool decomposes the pointer delta into the appropriate fields.
- **Distort & Envelope are shape-only** (see 4.6) — on symbols/bitmaps/text they're disabled (Animate silently ignores; our app grays them out and shows a tooltip).

---

## 4.6 DISTORT & ENVELOPE (perspective-like deformation)

Animate has **no true perspective transform tool**; its approximations are **Distort** and **Envelope**, and both work **only on raw shapes**.

### 4.6.1 Distort

| Pipeline | Detail |
|---|---|
| **Input** | Free Transform → Distort mode; drag any of the 4 **corner handles** independently. |
| **Calculation** | Each corner moves freely → the shape is mapped into the new **quadrilateral** (bilinear/projective remap of the path vertices). |
| **Visible result** | A rectangle can become a non-parallel trapezoid — a cheap "perspective" fake (e.g., a card turning). |
| **Stored property** | The **path vertices** are re-mapped (the transform is **baked into geometry** — there is no persistent "distort" field). |
| **Animation behavior** | Because it bakes geometry, distort is **not tweenable as a transform** — it changes the shape, so it participates in **shape tweens** (Part 09) between differently-distorted keyframes. |
| **Keyframe behavior** | The distorted geometry is stored in the current keyframe's shape path. |

### 4.6.2 Envelope

| Pipeline | Detail |
|---|---|
| **Input** | Free Transform → Envelope mode; a **mesh** of points + tangent handles appears over the shape; drag any mesh point or tangent. |
| **Calculation** | The shape's vertices are re-fitted to the deformed mesh (catmull-rom / Bézier mesh interpolation). More control than Distort (interior points, curved edges). |
| **Visible result** | Smooth, organic warps (bulges, bends) — like a cheap puppet/mesh warp. |
| **Stored property** | Baked into path geometry. |
| **Animation behavior** | Shape-tween between envelope poses. |

**Modern note:** Animate's **Asset Warp tool** (T2D.11) supersedes Envelope for most deformation (it keeps a keyframable mesh + pins, and works on bitmaps). Our app ships **Asset Warp as the primary deformation tool** (P1) and Distort/Envelope as shape-baking operations (P2).

---

## 4.7 REGISTRATION POINT vs PIVOT (TRANSFORM POINT) vs TRANSFORM CENTER

Three distinct "centers" — the #1 source of confusion in symbol animation. Definitions and rules:

| Term | What it is | Where stored | What uses it |
|---|---|---|---|
| **Registration point** | The (0,0) of a **symbol's** local coordinate space. Set when the symbol is created (the 9-point grid in Convert-to-Symbol / New-Symbol dialog). | Symbol definition (Part 11/33). | The **instance's x/y** = where the registration point lands on stage. Moving artwork relative to the crosshair in symbol-edit moves the registration point. |
| **Transform point (pivot)** | The movable point around which an **instance's** rotation/scale happen. Draggable (white circle). Default = the instance's center. | `transform.pivotX/Y` (per instance). | Rotation/scale/skew. Distinct from registration point. |
| **Transform center** | The computed **center of the bounding box** (selection center). | Derived (not stored). | Align panel "center", Transform-panel "re-center", pivot reset, rotate-around-center defaults. |

**Why it matters:** you set the **registration point** once (so the part's origin is its joint, e.g. shoulder); you move the **pivot** per-instance to change *where it rotates* (e.g. temporarily rotate around the elbow). In rigs (Part 13/14) both are typically placed at the joint.

**Re-center pivot:** double-click the pivot → it snaps to the transform center. (T2A.3 field 10.)

---

## 4.8 NUMERIC TRANSFORM

Precision transform without dragging — via the **Transform panel** (and Info panel for position/size).

| Field | Meaning | Behavior |
|---|---|---|
| X / Y | Position (of registration point or pivot — toggle which) | Enter + Enter = apply |
| W / H | Width/height in % or px (constrain-proportions chain link) | Applies scale |
| Rotate | Degrees | Apply |
| Skew X / Skew Y | Degrees | Apply |
| 3D (legacy) | rotationX/Y/Z, z | Legacy only |

Also **Modify > Transform > Scale and Rotate…** (`Ctrl+Alt+S`) — a modal dialog for exact scale % + rotation.

Rules:
- Numeric entry **commits** on Enter/blur → one `TransformCommand`.
- Live-typing preview optional (P2); default is commit-on-enter (matches Animate).
- The panel **reflects the selection** in real time (subscribes to `selection:changed`).

---

## 4.9 COPY TRANSFORM / RESET (REMOVE) TRANSFORM

| Operation | Does | Stored result |
|---|---|---|
| **Copy transform** | (Animate: copy/paste motion properties; our app adds: "Copy Transform" + "Paste Transform" — copies the whole transform component between objects) | Paste writes x/y/scale/rotation/skew/pivot to targets. |
| **Reset / Remove Transform** (`Ctrl+Shift+Z` in Animate; Modify > Transform > Remove Transform) | Sets scale=1, rotation=0, skew=0 **without moving the object** (bakes current geometry into the path so the object looks unchanged, but its transform is identity). | Path re-baked; transform reset to identity. |

**Why "Remove Transform" exists:** after repeated scale/rotate keyframes, the transform accumulates (scale 1.3 × 1.2 × …). Flattening resets the matrix to identity and re-computes the path to look identical — important for predictable tweening and export. Our app implements it as a **flatten operation** (P1).

---

## 4.10 FLIP HORIZONTAL / VERTICAL

| Pipeline | Detail |
|---|---|
| **Input** | Modify > Transform > Flip Horizontal / Flip Vertical (or right-click → Transform). |
| **Calculation** | Mirror across the object's **center** (transform center) axis. Implemented as `scaleX = -scaleX` (horizontal) / `scaleY = -scaleY` (vertical) — but Animate flips around the center, not the pivot; our app mirrors around the center to match expectation, and offers "flip around pivot" as an option. |
| **Visible result** | Mirrored object (e.g., a walk-cycle leg that was drawn facing left now faces right). |
| **Stored property** | `transform.scaleX/Y` negated (or path mirrored if you choose to bake). |
| **Animation behavior** | As a scale property, it's tweenable (scaleX 1→-1 animates a flip). |
| **Keyframe behavior** | Same as scale. |

**Walk-cycle trick:** draw one leg, then flip a duplicate for the other leg — standard cut-out workflow (Part 13).

---

## 4.11 Transform + animation/keyframe summary table

| Operation | Stored property | Motion tween keyframes | Classic tween | Shape tween |
|---|---|---|---|---|
| Move | x, y | x-key, y-key (independent) | position key | position (move shape) |
| Scale | scaleX, scaleY | scaleX-key, scaleY-key | linear interp | — (scale via shape) |
| Rotate | rotation | rotation-key (CW/CCW/loops) | linear interp | — |
| Skew | skewX, skewY | skewX-key, skewY-key | linear interp | — |
| Pivot move | pivotX/Y | **not tweenable** (pivot is static per span in practice) | not tweened | — |
| Distort/Envelope | baked path | — (changes geometry) | — | yes (morph) |
| Flip | scaleX/Y negated | scale-key | linear | — |
| Remove transform | flattened path + identity | — | — | — |

**Rule for our app:** motion-tween property keyframes are **per-property and independent** (Part 09) — this is the modern Animate model and it is strictly better than classic tween's single-value keyframes. Implement per-property keys; classic tween is a compatibility mode.

---

## 4.12 Mobile translation

| Desktop | Mobile |
|---|---|
| Drag handle to scale | Pinch (two-finger) or corner handle drag |
| Drag outside corner to rotate | Two-finger twist, or long-press corner → rotate mode |
| Drag edge + Shift to skew | Skew handle in a dedicated "Transform mode" panel |
| Move pivot (white circle) | Drag pivot with finger-offset loupe |
| Numeric transform | Transform panel fields (keyboard/number pad) |
| Shift constraints | "Constrain" toggle / snap |
| Alt (from center/opposite) | Two-finger gesture or a modifier button |

---

## 4.13 BUILD CHECKPOINT M1 (transform slice)

- [ ] `Transform` component implemented with the exact fields (x,y,scaleX,scaleY,rotation,skewX,skewY,pivot) + cached matrix.
- [ ] Move/scale/rotate/skew via Free Transform with the handle-zone mapping + modifier matrix (Part 02a T2A.3).
- [ ] Pivot dragging + re-center (double-click) + registration-point concept implemented (Part 11 completes it).
- [ ] Distort (4-corner) + Envelope (mesh) on raw shapes, baking into path geometry; disabled on non-shapes with a tooltip.
- [ ] Numeric transform panel (X/Y/W/H/Rotate/Skew) two-way binding; Scale & Rotate dialog.
- [ ] Copy/Paste transform; Remove-transform flatten.
- [ ] Flip H/V around center.
- [ ] Undo = one TransformCommand per gesture.
- [ ] All on touch + desktop.

*Next: `05_drawing_system.md` — Pen/Pencil/Brush/Paint Brush/Line/Rectangle/Oval/Polygon/Paint Bucket/Ink/Eraser/Eyedropper: stroke creation, fill creation, thickness, style, color, opacity, smoothing, curves, corners, caps, joins, editing, converting, breaking apart, grouping — with practical vector-geometry behavior.*
