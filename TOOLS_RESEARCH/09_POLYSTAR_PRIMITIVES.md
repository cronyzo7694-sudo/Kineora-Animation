# PolyStar and Editable Primitive Tools — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P1; high-value construction tools after basic rectangle/oval  
**Related files:** [Line/Rectangle/Oval](08_LINE_RECT_OVAL_TOOLS.md), [Pen](07_PEN_TOOL.md), [Subselection](10_SUBSELECTION_TOOL.md), [Selection](01_SELECT_TOOL.md), [Color/Style](12_EYEDROPPER_INK_BOTTLE.md)

## 1. Purpose

PolyStar and primitive tools let artists create clean, parameterized shapes without manually placing every anchor. The key product decision is **non-destructive editability**: a rounded rectangle, oval arc, or star must remain adjustable until the user explicitly bakes it to a path.

Supported primitives:

- Rectangle Primitive
- Oval Primitive
- Polygon
- Star

A normal Rectangle/Oval tool may also use the same primitive node internally. The difference is whether its parameters remain exposed in Properties and on-stage handles.

## 2. Adobe behavior and Kineora decision

[ADOBE] Animate provides Rectangle/Oval primitive variants with editable parameters and a PolyStar tool with Polygon/Star settings. Primitive settings can be changed through Properties and parameter handles; converting/breaking apart removes parametric editability.

[KINEORA] Keep the workflow but make the transition explicit:

- every newly created primitive starts parametric;
- `Bake to Path` is a named command, not an accidental side effect of selecting Subselection;
- Properties always identifies `Primitive` vs `Path`;
- parameter edits are separate undoable commands;
- a primitive remains a single atomic object in Object mode;
- Merge mode can bake and feed the result into the boolean engine at commit.

## 3. Primitive common model

```text
PrimitiveNode {
  id: NodeId,
  transform: Transform,
  geometry: Rect | Ellipse | PolyStar,
  fill: FillStyle,
  stroke: Option<StrokeStyle>,
  baked: false
}
```

The renderer converts parameters to a Path/RenderTree at evaluation time. The authored parameters remain the source of truth. Geometry coordinates are document-space; transform is separate.

### Bake operation

```text
BakeToPath {
  source_node_id,
  before_primitive,
  after_path,
  style,
  transform
}
```

Bake preserves visual appearance and selection bounds. After baking:

- Pen/Subselection/Width can edit the path;
- primitive handles disappear;
- Properties switches from primitive fields to path/common fields;
- undo restores the primitive exactly.

## 4. Rectangle Primitive

### Options

- Width, Height.
- Corner radius, clamped to `min(width,height)/2`.
- Fill/stroke.
- Object/Merge mode.
- Snap.

### Interaction

- Drag to create as [Rectangle](08_LINE_RECT_OVAL_TOOLS.md).
- A round handle near the corner adjusts radius.
- Dragging the normal bounding handles changes W/H; Shift preserves square ratio; Alt scales from center.
- Radius handle never moves the object.
- Numeric edits in Properties update live preview and commit on Enter/blur.

### Edge cases

- Radius 0 = square corner.
- Radius at the clamp = capsule-like maximum allowed by the rectangle.
- Negative values are rejected.
- Extremely small dimensions preserve a valid 1px minimum.
- Radius is stored in document units and remains stable through zoom.

## 5. Oval Primitive

### Parameters

```text
EllipseParams {
  center: Point,
  radius_x: number,
  radius_y: number,
  start_angle: degrees,
  end_angle: degrees,
  closure: Open | Chord | Pie,
  inner_radius: 0..1,
  direction: CW | CCW
}
```

### Interaction

- Drag bounding box to create ellipse.
- Shift constrains `radius_x == radius_y`.
- Alt/Option uses pointerdown as center.
- Arc endpoint handles edit start/end angles.
- Inner-radius handle edits ring thickness.
- `closure` controls whether an arc is open, chord-closed, or pie-closed.
- A full ellipse ignores closure and renders a closed contour.

### Edge cases

- Normalize angles while preserving intended sweep direction.
- If end equals start, do not create a zero-sweep invisible shape; show a no-op/warning.
- Inner radius is clamped below the outer radius.
- If an arc is open, Fill is disabled unless the user chooses a closure.

## 6. PolyStar

### Modes

| Mode | Parameters | Typical use |
|---|---|---|
| Polygon | sides, radius, rotation | shields, badges, props |
| Star | points/sides, outer radius, inner radius or point size, rotation | stars, bursts, icons |

### Tool options

- Style: Polygon or Star.
- Number of sides/points: 3–32 for MVP.
- Outer radius.
- Inner radius or Star Point Size (0–1). Kineora displays both name and numeric value to avoid confusion.
- Rotation angle.
- Fill/stroke.
- Object/Merge mode.
- Snap.

### Draw gesture

- Pointerdown sets center.
- Pointermove sets outer radius and preview orientation.
- `Shift` snaps orientation to 15°/45° according to the global precision rule.
- Alt/Option draws from a specified center/drag convention only when shown in tooltip; default is center-to-radius because it maps naturally to a star.
- Pointerup commits a parametric PolyStar node.

### Parameter handle behavior

- Outer radius handle changes size while keeping center fixed.
- Rotation handle changes orientation.
- Inner radius/point-size handle changes spike depth.
- Numeric Properties edits are authoritative and update preview live.

## 7. Geometry generation

Polygon vertex `i`:

```text
angle_i = rotation + i * 360/sides
point_i = center + radius * (cos(angle_i), sin(angle_i))
```

Star alternates outer and inner radius. The path generator must use deterministic floating-point rules and a consistent starting vertex so save/load and undo do not reorder points.

[KINEORA] Do not store generated points as the primary data while the node is parametric. Store parameters; generate points for render/hit-test/export. When baked, freeze the generated path with the current winding/style.

## 8. Relationship with other tools

- `V` Selection moves/duplicates the whole primitive.
- `Q` Free Transform scales/rotates it without losing parameters.
- `A` Subselection is disabled or shows `Bake to Path` prompt while primitive remains parametric.
- `P` Pen can create a new custom path, not edit primitive topology directly.
- `U` Width edits the stroke only after the primitive is baked or when a primitive stroke exposes a compatible width profile.
- `I` Eyedropper samples fill/stroke style.
- `K` Paint Bucket can fill regions only after the primitive is rendered into the region graph; applying a new fill must preserve primitive parameters.

## 9. Timeline and tweening

- Parameter edits on a keyframe update that frame's primitive parameters.
- A held-frame edit follows auto-key rules.
- Classic transform tween may interpolate transform fields.
- A future primitive/property tween may interpolate radius, arc angles, sides (sides changes need a defined topology policy and are not P0).
- Do not interpolate a polygon from 5 sides to 8 sides without explicit shape-tween conversion.
- Primitive topology changes (`Polygon` ↔ `Star`, sides count) are discrete and should either be blocked across a tween or require bake/shape-tween workflow.

## 10. Context menu and commands

Right-click primitive:

- Edit Parameters.
- Bake to Path.
- Convert to Drawing Object (keeps geometry but may change merge semantics).
- Copy/Paste Style.
- Transform.
- Delete.

Commands:

- `CreatePrimitive`.
- `PatchPrimitiveParams`.
- `BakePrimitiveToPath`.
- `SetFillStyle` / `SetStrokeStyle`.
- `TransformSelection`.

Every command stores before/after state and one undo entry per gesture or committed field edit.

## 11. Acceptance matrix

1. Rectangle Primitive radius handle changes only radius.
2. Radius clamps at half the short side and survives zoom.
3. Oval Primitive creates ellipse, circle, arc, pie, and donut values correctly.
4. Arc angle handles do not change center/radii.
5. PolyStar Polygon creates 3–32 sides with deterministic orientation.
6. Star point-size/inner-radius changes spike depth without moving center.
7. Properties and on-stage handles show the same values.
8. Bake to Path preserves pixels/geometry and then exposes anchors in Subselection.
9. Undo/redo restores primitive or baked path exactly.
10. Transforming a primitive does not bake it.
11. Drawing at frame 10 follows keyframe/hold rules and does not modify frame 1.
12. Locked/hidden/tween-layer guards work at the engine boundary.
13. Fill/stroke changes preserve primitive parameters.
14. Export matches the on-stage primitive and excludes edit handles.
15. Save/load round trip preserves primitive type, parameters, styles, and transform.

## 12. Dependencies and code map

Dependencies: shared shape gesture, PrimitiveNode model, Path generator, Properties patching, transform system, FillStyle/StrokeStyle, selection bounds, keyframe/tween policies, export.

Expected locations:

- `animator/core/src/model.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/command.rs`
- `animator/core/src/export.rs`
- `animator/ui/src/editor/shapeTools.ts`
- `animator/ui/src/editor/primitiveHandles.ts`
- `animator/ui/src/components/PropertiesPanel.tsx`
- `animator/ui/src/render/canvasRenderer.ts`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- Existing source: `animate-blueprint/02b_tools_drawing.md` T2B.6–T2B.8
- Existing source: `animate-blueprint/06_shape_system.md` §6.3
