# Brush Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0 for coloring and expressive fills  
**Shortcut:** `B`  
**Primary existing references:** `animate-blueprint/02c_tools_painting.md` T2C.2 and `animate-blueprint/23_color.md`

## 1. Purpose

Brush is the freehand **filled painting** tool. It is the tool a cartoon artist uses to block color, paint shadows, and make thick expressive marks. Its output is a fill region, not a centerline stroke.

The distinction is mandatory:

- Pencil = editable stroke style and centerline.
- Brush = filled painted region with a closed boundary.
- Paint Brush = art/pattern brush system, researched separately.

## 2. Adobe behavior to retain

[ADOBE] Adobe documents five useful Brush modes: Paint Normal, Paint Fills, Paint Behind, Paint Selection, and Paint Inside. The Brush supports brush size/shape, fill color, bitmap/gradient fill, Lock Fill, and tablet pressure/tilt.

[KINEORA] Keep the five modes because they map directly to animation coloring workflows. Make the current mode obvious in the Tool Properties tab and in the cursor tooltip. Default to `Paint Normal` for general painting, but offer `Paint Fills` as a one-click safe mode for coloring line art.

## 3. UI and options

- Left Tools rail: Painting group.
- Tool tab fields:
  - Brush mode: Normal / Fills / Behind / Selection / Inside.
  - Size: numeric field + slider; min 1 document px, max defined by document scale.
  - Shape: round, square, ellipse/angle where supported.
  - Hardness/edge softness: disabled for vector-only MVP; later raster brush option.
  - Fill: solid, linear gradient, radial gradient, bitmap pattern when supported.
  - Lock Fill toggle.
  - Pressure controls: size influence, opacity influence; default size influence on for stylus, off for mouse.
  - Tilt controls: angle influence where stylus supports tilt.
  - Smoothing 0–100.
- Cursor shows brush diameter in screen pixels, but the actual size is stored in document units. At high zoom the cursor circle must still track the correct document radius.

## 4. Common freehand capture

Brush reuses the Pencil capture pipeline:

```text
raw samples
  -> screen/document conversion
  -> resample and smooth
  -> pressure/tilt normalization
  -> calculate width at each sample
  -> place dabs along path
  -> union dabs into one filled region
  -> clip according to Brush mode
  -> preview
  -> commit one painted-fill node
```

For a first vector implementation, round-dab union can be represented as a generated closed path. The authored sample path and width profile should also be retained so a future renderer can rebuild it at different resolution.

Do not commit one node per pointermove. The entire pointer gesture is one painted object and one undo entry.

## 5. Brush modes

### Paint Normal

Paint over fills and strokes in the active layer according to normal z-order. In Object mode, the resulting paint is a new fill node above existing content.

### Paint Fills

Paint only filled regions; do not cover stroke-only line art. This is the preferred mode for coloring a clean line drawing. It requires a hit/clip query against existing stroke/fill boundaries.

### Paint Behind

Place the new fill behind existing content on the active layer while respecting layer order. It is useful for filling backgrounds behind line art and existing shapes. If there is no eligible target, the paint still creates a fill at the correct behind position.

### Paint Selection

Clip painting to the current selection's geometry. If there is no selection, show `Paint Selection needs a selected fill/object` and do not create content. The selection overlay is not part of the saved fill.

### Paint Inside

At pointerdown, capture the filled region containing the start point. Subsequent dabs are clipped to that region. If the start point is empty, show a preview warning and do not paint. The mode must not jump to a neighboring region when the pointer crosses a boundary.

## 6. Reference scope

For `Paint Fills`, `Paint Selection`, and `Paint Inside`, the source boundary scope is explicit in Tool Properties:

- `Active layer` is the MVP default and receives the committed fill.
- `All visible unlocked layers` is a P1 option: those layers are read-only references for region/mask detection, while the new fill still goes to the active layer.
- Hidden or locked layers are never used as references unless a future explicit override exists.
- Changing reference scope during a gesture has no effect until the next gesture.

This allows the common cartoon workflow of line art on one layer and color on another without making the default operation unpredictable.

## 7. Gesture contract

### Pointerdown

1. Validate layer/frame editability.
2. Capture current Brush settings as a gesture snapshot. Changing the panel during the stroke does not alter the in-progress stroke.
3. Resolve the mode mask:
   - Selection = current selected geometry;
   - Inside = region under start point;
   - others = no extra mask.
4. Create first dab preview; do not write the document.

### Pointermove

1. Sample and resample points.
2. Calculate width from pressure if enabled.
3. Generate/union new dabs.
4. Apply clip mask and z-order preview.
5. Repaint editor preview at most once per frame.

### Pointerup

1. If below minimum gesture length, create a dot stamp only when the mode allows it.
2. Simplify the generated boundary without closing a visible gap.
3. Commit one `PaintBrush`/`DrawFill` command.
4. Select the new fill object.

### Cancel

Discard preview and captured mask. No engine write and no undo.

## 8. Color and fill rules

- Current Fill Color applies to new Brush strokes.
- Alpha is explicit; never encode alpha only in a hex string that loses transparency.
- Solid fill is P0.
- Linear/radial gradient and Lock Fill are P1 because they are high-value for cartoon shading and already exist in the blueprint.
- Bitmap fill is P2 and requires asset storage/import.
- Color picker preview is renderer-only until commit, consistent with the existing Properties panel color preview policy.
- `D` resets default fill/stroke; `X` swaps them when that shortcut is approved globally.

## 9. Model contract

```text
FillPaintNode {
  id: NodeId,
  source_path: [StrokeSample],
  boundary: Path,
  style: FillStyle,
  brush: {
    diameter,
    shape,
    smoothing,
    mode_at_creation,
    pressure_enabled,
    tilt_enabled,
    lock_fill_matrix: Option<Matrix>
  }
}
```

The `mode_at_creation` is useful for forensic/debug information but must not force later rendering to use the same clipping mask. The committed boundary is the result; editing the object later should not unexpectedly repaint neighboring content.

[KINEORA] For `Paint Fills`, `Paint Behind`, `Paint Selection`, and `Paint Inside`, commit a resolved boundary/clip result rather than a live dependency on selection state. This makes undo, save/load, and export deterministic.

[CODE] The current model has fill strings on `Rect` but no general fill-region or brush node. Add a shared `FillStyle` type instead of adding more string fields to every node variant.

## 10. Timeline behavior

- Brush painting writes to the current keyframe of the active layer.
- On held frame, auto-keyframe policy creates a keyframe and copies prior content before adding the new paint.
- Brush strokes are frame content and should not appear on earlier frames unless exposure rules hold them.
- Painting on a tween span is blocked or explicitly branches to a keyframe; no silent tween corruption.
- Each Brush gesture is one undo command even if it crosses many regions.

## 11. Common errors and safeguards

- Painting on locked/hidden layer: blocked before preview.
- Paint Selection with no selection: status error, no stroke.
- Paint Inside started in empty region: status error, no stroke.
- Brush Behind has no eligible lower stacking position: create at bottom of active layer and explain only if needed.
- Huge brush at extreme zoom: clamp to a safe range and show the value.
- Pressure values outside 0–1: clamp and log only in debug.
- Self-intersecting union boundary: repair or reject with `Paint could not create a valid region`.
- Brush mode changes during gesture: ignored until next gesture.

## 12. Acceptance tests

1. Draw a round brush line; one filled object appears and can be selected.
2. Change size before a new stroke; old stroke remains unchanged.
3. At 200% zoom, brush diameter in document space remains correct.
4. Paint Normal covers eligible content above it.
5. Paint Fills changes filled areas but leaves line strokes visible.
6. Paint Behind appears under existing active-layer content.
7. Paint Selection with selected shape clips exactly to selection.
8. Paint Inside started in a region cannot spill into neighboring region.
9. Pressure changes width only when enabled and supported.
10. Gradient Lock Fill keeps gradient continuity across a continuous gesture.
11. Escape/pointercancel/window blur cancels without content.
12. Undo removes the entire gesture in one step.
13. Save/load preserves the generated fill and style.
14. Export includes the paint but not the cursor, preview, or selection overlay.
15. Locked/tween-layer guards are enforced by the engine.

## 13. Dependencies and implementation files

Dependencies: shared freehand capture, vector path boolean/union, FillStyle, selection clip geometry, layer ordering, keyframe insertion, renderer tessellation, export.

Expected locations:

- `animator/ui/src/editor/freehandCapture.ts`
- `animator/ui/src/editor/brushTool.ts`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/core/src/eval.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/export.rs`
- `animator/core/src/wasm.rs`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Draw simple lines and shapes](https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html)
- [Strokes, fills, and gradients](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- Existing detailed source: `animate-blueprint/02c_tools_painting.md` T2C.2
