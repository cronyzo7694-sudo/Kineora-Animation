# Line, Rectangle, and Oval Tools — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P0 for scene construction and simple cartoon assets  
**Related files:** [Pen](07_PEN_TOOL.md), [PolyStar and Primitives](09_POLYSTAR_PRIMITIVES.md), [Pencil](03_PENCIL_TOOL.md), [Selection](01_SELECT_TOOL.md), [Color/Style](12_EYEDROPPER_INK_BOTTLE.md)

## 1. Shared purpose

These tools create predictable geometric artwork faster than drawing the same shape with Pen. They share one drag contract but produce different node types:

- **Line:** two-anchor stroke-only path.
- **Rectangle:** closed rectangle with fill/stroke.
- **Oval:** ellipse or arc with fill/stroke.
- **Rectangle/Oval Primitive:** parameterized version that stays editable; detailed in [09](09_POLYSTAR_PRIMITIVES.md).

They must use the same active layer, current frame, color, stroke, snapping, undo, and export rules as Pen and Pencil.

## 2. Common UI and draw contract

- Tools rail: Drawing group; Rectangle and Oval may have a flyout for Primitive variants.
- Tool Properties shows tool-specific options and the current fill/stroke chips.
- New object is selected after commit.
- Drag preview is editor-only and updates once per animation frame.
- Document write happens only on pointerup after validation.
- `Escape`, pointercancel, blur, and tool switch cancel the preview.
- Pointer capture keeps a drag alive after leaving the canvas.
- A click with no meaningful dimension is a no-op by default. Intentional dot/stamp behavior belongs to Brush, not geometry tools.

Shared draw target:

```text
active scene + active layer + playhead frame
  -> keyframe content if editable
  -> auto-key/copy held content according to global policy
  -> reject locked/hidden/tween layer
  -> commit one DrawShape command
```

## 3. Line tool

### Purpose

Create a straight, editable stroke between two document-space points. It has no fill.

### UI

- Shortcut: `N`.
- Cursor: crosshair/line cursor.
- Options: stroke color, width, cap, join, dash; snap; `Constrain angle` indicator; `Object/Merge` mode.
- HUD during drag: length and angle in document units.

### Interaction

```text
pointerdown
  -> record start point after snapping
pointermove
  -> preview start -> current point
  -> Shift or constrain toggle snaps angle to 45° increments
pointerup
  -> reject if length < 1 document pixel
  -> create a two-anchor open Path with StrokeStyle
  -> select and commit one command
```

- `Shift` constrains to 0°, 45°, 90° etc.
- `Alt/Option` draws from the start point as the center only if the center-draw mode is explicitly shown; default behavior is corner-to-corner.
- `Space` temporarily pans before the gesture; no accidental pan after pointerdown.
- The line can later be edited with `A` [Subselection](10_SUBSELECTION_TOOL.md) and its width with `U` [Width](11_WIDTH_TOOL.md).

### Shape mode

- Object mode = independent line node.
- Merge mode = the line participates in raw-shape intersections/splitting on the active layer/frame.

### Timeline

A line is frame content. Drawing it at frame 10 follows the same keyframe/hold/tween guard as [Pen](07_PEN_TOOL.md). A line does not interpolate topology just because endpoints exist on two frames; motion/shape tween rules are separate.

## 4. Rectangle tool

### Purpose

Draw a closed rectangle quickly for bodies, props, panels, background blocks, mattes, and UI-like artwork.

### UI

- Shortcut: `R`.
- Cursor: rectangle crosshair.
- Options:
  - fill on/off;
  - stroke on/off;
  - corner radius, clamped to half of the smaller dimension;
  - Object/Merge mode;
  - snap.
- `Corner radius` is a live numeric field for the next gesture; the value is snapshotted at `pointerdown` and remains stable until release.
- If the Primitive variant is selected, the radius remains editable after creation; see [09](09_POLYSTAR_PRIMITIVES.md).

### Drag behavior

Default: pointerdown is one corner and pointerup is the opposite corner. Normalize negative width/height so reverse dragging always creates a positive rectangle.

| Modifier | Behavior |
|---|---|
| None | Corner to corner |
| Shift | Constrain width = height (square) |
| Alt/Option | Draw from center |
| Shift+Alt/Option | Centered square |
| Space | Temporary pan before/after gesture |
| Escape | Cancel |

The preview shows x/y/w/h and radius. It must not jump when dragging left/up.

### Commit

- A zero/sub-minimum rectangle is a no-op.
- Commit one `DrawRect`/`DrawPrimitive` command.
- On success, select the new object and show its fields in Properties.
- Fill/stroke values are snapshotted at `pointerdown`, then captured into the new node; future tool-color changes do not alter the created object.

[CODE] The repository currently has a real Rect draw gesture and Rust `Rect` node. The first generalization should preserve this behavior while adding a shared `Path`/style model. Do not break the existing reverse-drag, zoom, pan, and min-size tests.

## 5. Oval tool

### Purpose

Draw circles, ellipses, arcs, pies, and donut/ring shapes for heads, eyes, wheels, highlights, and graphic props.

### UI

- Shortcut: `O`.
- Options:
  - circle constraint;
  - start angle and end angle;
  - closure: open arc, chord, pie;
  - inner radius for donut/ring;
  - fill/stroke and Object/Merge mode.
- For simple oval/circle, defaults are start 0°, end 360°, inner radius 0, closed.
- Arc/donut options remain in the Tool Properties panel so users do not need a hidden modal.

### Drag behavior

- Default = bounding-box drag.
- `Shift` = circle.
- `Alt/Option` = draw from center.
- `Shift+Alt/Option` = centered circle.
- Snap to existing centers, grid, guides, and object bounds when enabled.

### Commit and parameter meaning

The simple Oval may be stored as an `EllipsePrimitive` with parameters. An arc/pie/donut must preserve the parameter values so the Properties panel can edit them. If the user chooses `Bake to Path`, the renderer-generated geometry becomes a normal path and is then editable with Pen/Subselection.

## 6. Shared style behavior

The three tools read current style from the shared color/style state:

```text
CurrentStyle {
  fill: None | Solid | LinearGradient | RadialGradient | Bitmap,
  stroke: None | StrokeStyle,
  drawing_mode: Object | Merge
}
```

- `D`: reset fill/stroke defaults when approved by global shortcuts.
- `X`: swap fill and stroke.
- `No Fill` or `No Stroke` is explicit and visible.
- A fully invisible object is rejected unless it is a guide/path-only object.
- Alpha is stored independently from RGB.

See [Eyedropper/Ink Bottle](12_EYEDROPPER_INK_BOTTLE.md) for applying styles and [Paint Bucket](05_PAINT_BUCKET_TOOL.md) for region filling after drawing.

## 7. Layer and timeline rules

- Active layer is selected from the unified Timeline layer row.
- Locked/hidden layers reject the operation before preview.
- A held frame is not silently edited in place; the global auto-key/copy rule creates a new keyframe or offers an explicit choice.
- A tween layer rejects new geometry by default.
- A successful drag is exactly one undo entry.
- Selecting the resulting object updates the Object Properties context without moving the playhead.

## 8. Common failures

- Rectangle reverse drag produces negative dimensions.
- Shift square uses screen pixels instead of document-space ratio.
- Oval arc angles persist unexpectedly between unrelated drawings; show current values.
- Corner radius exceeds half the short side; clamp and show the clamped value.
- Tool color changes mutate existing objects unintentionally; only an explicit selection/style command changes existing content.
- Preview remains after pointercancel or tool switch.
- Object is drawn on an inactive or locked layer because the UI and engine disagree.

## 9. Acceptance matrix

1. Line drawn at 50%, 100%, and 200% zoom has the same document geometry.
2. Shift line snaps to 45° increments and displays a visual angle cue.
3. Rectangle works in all four drag directions and keeps positive dimensions.
4. Shift rectangle creates a square; Alt creates from center; both combine.
5. Rounded rectangle clamps radius safely.
6. Oval creates ellipse and Shift creates circle.
7. Centered circle/ellipse respects the pointerdown center.
8. Arc, pie, and donut parameters persist through save/load.
9. New objects use current style, while existing objects do not change from a tool-style change alone.
10. Locked/hidden/tween layers reject drawing without mutation.
11. Drawing at frame 10 affects only the intended frame/keyframe.
12. New shape is selected and Properties shows the correct context.
13. Undo/redo is one step per created shape.
14. Export includes shape geometry and style but excludes preview/cursor/handles.
15. Object mode leaves neighbors unchanged; Merge mode calls the boolean path engine.

## 10. Dependencies and code map

Dependencies: shared draw gesture, viewport conversion, SnapEngine, Path/Primitive model, FillStyle/StrokeStyle, keyframes, layer state, command history, renderer preview, export.

Expected files:

- `animator/ui/src/editor/shapeTools.ts`
- `animator/ui/src/editor/gesture.ts` — existing rectangle normalization/min-size logic
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/export.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/ui/src/components/PropertiesPanel.tsx`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- Existing source: `animate-blueprint/02b_tools_drawing.md` T2B.3–T2B.7
- Existing source: `animate-blueprint/06_shape_system.md`
