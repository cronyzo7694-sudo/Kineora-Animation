# Paint Brush — Art and Pattern Brushes Research Contract

**Status:** Research complete — batch 3  
**Priority:** P1; useful for polished cartoon ink and texture, not required before basic Pencil/Brush  
**Shortcut:** `Y`  
**Related files:** [Pencil](03_PENCIL_TOOL.md), [Brush](04_BRUSH_TOOL.md), [Width](11_WIDTH_TOOL.md), [Eyedropper/Ink Bottle](12_EYEDROPPER_INK_BOTTLE.md), [Library blueprint](../animate-blueprint/12_library.md)

## 1. Purpose

Paint Brush creates a path whose appearance comes from a reusable brush definition. It is distinct from:

- Pencil: constant/variable-width editable line stroke.
- Brush: filled dabs/paint region.
- Paint Brush: art or pattern mapped along a spine path.

Use cases include textured ink, hair strands, rope, leaves, decorative borders, calligraphy, and repeated motifs.

## 2. Adobe behavior to retain

[ADOBE] Adobe supports Art Brushes and Pattern Brushes. Art brushes stretch an artwork along a path, with options for proportional scaling, stretching to fit, stretching between guides, and overlap handling. Pattern brushes tile artwork along a path, with fit/spacing modes, flip controls, and corner-tile choices. Pressure and tilt can affect stroke width. Art brush strokes can be converted to fills.

[KINEORA] Brush definitions are assets with stable IDs and previews. A stroke references a brush asset by value/ID plus its own path and width profile. Editing the brush definition can either update linked strokes or create a new brush; MVP defaults to non-destructive snapshot-at-creation to avoid changing completed shots unexpectedly.

## 3. Brush definition model

```text
BrushAsset {
  id: BrushId,
  name: string,
  kind: Art | Pattern,
  artwork: VectorAsset | BitmapAsset,
  mapping: ArtMapping | PatternMapping,
  default_width: number,
  thumbnail: AssetPreview
}

ArtMapping {
  scale_proportionately: bool,
  stretch_to_fit_length: bool,
  stretch_between_guides: Option<{start,end}>,
  overlap_corners: bool
}

PatternMapping {
  fit: StretchToFit | AddSpaceToFit | ApproximatePath,
  spacing: number,
  flip_x: bool,
  flip_y: bool,
  corner_mode: Center | Flank | Slice | Overlap
}
```

## 4. UI and tool state

- Tools rail: Painting group, Paint Brush flyout with Brush.
- Shortcut `Y`.
- Tool Properties:
  - brush asset picker with thumbnails;
  - Art/Pattern filter;
  - Edit Brush button;
  - size/scale;
  - pressure and tilt controls;
  - smoothing;
  - Object/Merge mode (Object default);
  - Convert Lines to Fills action for selected completed strokes.
- A brush preview swatch follows the cursor; no content is written before pointerdown.
- Brush asset picker supports search, recent brushes, document brushes, and reset-to-default.

## 5. Draw gesture

Paint Brush reuses the common freehand capture contract:

```text
pointerdown
  -> validate layer/frame
  -> snapshot brush asset + settings
  -> start spine path
pointermove
  -> sample/resample/smooth
  -> calculate width from pressure/tilt
  -> preview artwork mapped along spine
pointerup
  -> validate minimum path
  -> commit one BrushStroke node
```

The active brush/settings snapshot is immutable for the gesture. Changing a brush in the panel affects the next stroke, not the current one.

## 6. Mapping behavior

### Art Brush

- `Stretch to fit`: scale artwork along the complete spine.
- `Scale proportionately`: preserve artwork proportions and adjust overall size.
- `Stretch between guides`: keep head/tail regions fixed and stretch only the middle.
- Corner overlap option prevents visible seams around sharp corners.

### Pattern Brush

- `Stretch to fit`: scale tiles to fill path length.
- `Add space to fit`: preserve tile scale and distribute extra space.
- `Approximate path`: preserve tile scale and allow a partial tile at the end.
- Spacing adds a document-space gap.
- Flip X/Y mirrors each tile.
- Corner mode chooses generated corner tile behavior.

## 7. Path, width, and edit behavior

A BrushStroke stores:

```text
BrushStrokeNode {
  id,
  brush_asset_id,
  spine_path: Path,
  width_profile: WidthProfile,
  mapping_snapshot,
  fill_or_stroke_color_override,
  transform
}
```

- [Subselection](10_SUBSELECTION_TOOL.md) edits the spine path.
- [Width](11_WIDTH_TOOL.md) edits spine width profile.
- [Selection](01_SELECT_TOOL.md)/[Free Transform](02_FREE_TRANSFORM_TOOL.md) transforms the whole stroke.
- Brush mapping is recalculated from the updated path.
- `Convert Lines to Fills` freezes mapped artwork into a normal filled path; it is one undoable command.

## 8. Merge/Object mode and performance

- Object mode prevents different brush strokes from accidentally merging and is the default.
- Merge mode passes the mapped outline to the boolean engine; use only when the user explicitly enables it.
- Tessellated brush geometry is cached by brush ID + path hash + width profile hash + mapping settings.
- Large pattern brushes render progressively in preview but commit only the final deterministic geometry.
- Avoid generating a separate DOM/render object for each tile; instance tile geometry when possible.

## 9. Timeline behavior

- Brush stroke is content on the current keyframe.
- Held frame drawing follows auto-key/copy rules.
- Tweening the transform of a BrushStroke is allowed.
- Tweening the spine/path or brush parameters requires a future shape/property tween; do not silently morph arbitrary brush topology.
- Changing a BrushAsset does not modify existing strokes in MVP unless `Update Linked Strokes` is explicitly chosen.

## 10. Errors and safeguards

- Missing brush asset: render a safe fallback line and mark `Missing brush` rather than crashing; export warns.
- Too many tiles/points: show complexity warning before commit and allow cancel.
- Locked/hidden/tween layer: blocked.
- Brush asset contains unsupported bitmap/filter: preserve asset metadata, show preview warning, export fallback.
- Convert Lines to Fills invalid result: preserve original stroke and report failure.

## 11. Acceptance matrix

1. Choose an Art Brush and draw a curved stroke; artwork follows the spine.
2. Stretch/scale/guide mapping changes are visible and deterministic.
3. Choose Pattern Brush; spacing, fit, flip, and corner modes work.
4. Pressure changes width when enabled; mouse remains constant width.
5. `Y` activates Paint Brush and does not conflict with Pencil `Shift+Y`.
6. Subselection changes spine shape and mapped artwork updates.
7. Width tool changes spine width without destroying brush asset reference.
8. Convert Lines to Fills preserves appearance and exposes normal path editing.
9. Object mode leaves neighboring objects unchanged; Merge mode invokes booleans.
10. Undo one stroke/convert/edit at a time.
11. Save/load preserves brush references, snapshots, path, mapping, and profile.
12. Frame 10 paint does not modify frame 1.
13. Export includes the mapped brush result and no cursor/preview.
14. Missing assets produce a clear warning and no silent blank export.
15. Large brush stroke remains interactive within the performance budget.

## 12. Dependencies and code map

Dependencies: freehand capture, Path/Stroke/WidthProfile, BrushAsset Library, tessellation/cache, style model, layer/frame rules, command history, selection/subselection/width, export.

Expected locations:

- `animator/ui/src/editor/paintBrushTool.ts`
- `animator/core/src/model.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/export.rs`
- `animator/ui/src/components/LibraryPanel.tsx`

## Adobe source references

- [Using Paint Brush in Animate](https://helpx.adobe.com/in/animate/desktop/using/working-with-paint-brush.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- Existing source: `animate-blueprint/02c_tools_painting.md` T2C.3
