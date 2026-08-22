# Eyedropper and Ink Bottle Tools — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P0 for consistent cartoon coloring and line styling  
**Shortcuts:** Eyedropper `I`; Ink Bottle `S`  
**Related files:** [Paint Bucket](05_PAINT_BUCKET_TOOL.md), [Brush](04_BRUSH_TOOL.md), [Pen](07_PEN_TOOL.md), [Line/Rectangle/Oval](08_LINE_RECT_OVAL_TOOLS.md), [Width](11_WIDTH_TOOL.md), [Color model](../animate-blueprint/23_color.md)

## 1. Purpose

These tools move style from one place to another:

- **Eyedropper:** sample fill/stroke style into a style clipboard or current authoring chips.
- **Ink Bottle:** apply the current stroke style to an existing outline.

They must not modify geometry accidentally. They are small tools with large workflow impact because a cartoon artist repeats colors and outline styles constantly.

## 2. Adobe behavior and Kineora decision

[ADOBE] Adobe's Eyedropper samples a fill or stroke, historically handing off to Paint Bucket or Ink Bottle so the style can be applied. The sampled style may include solid/gradient/bitmap fill data or stroke attributes.

[KINEORA] Sampling and applying are separate, predictable actions:

1. `I` samples and stores a style in the style clipboard/current chips.
2. The user explicitly applies it by clicking a target, using `Apply sampled style`, or selecting an object and pressing `Paste Style`.
3. Sampling never paints a whole layer on hover and never changes geometry.
4. `Alt/Option` apply-on-click may be offered as a visible shortcut, but the default click after sampling is always described in the tooltip.

## 3. Shared style model

```text
StyleClipboard {
  fill: Option<FillStyle>,
  stroke: Option<StrokeStyle>,
  source: FillOnly | StrokeOnly | Both,
  sampled_from: Option<NodeId>,
  preview_color: Option<RGBA>
}
```

`FillStyle`:

```text
None
Solid { rgba }
LinearGradient { stops, transform }
RadialGradient { stops, transform, focal }
Bitmap { asset_id, transform, repeat }
```

`StrokeStyle`:

```text
{ color_rgba, width, cap, join, miter_limit, dash, width_profile }
```

A style is copied by value. It is not linked to the source object, so later source edits do not silently update the target.

## 4. Eyedropper tool

### UI

- Tools rail: Color/Utility group.
- Shortcut `I`.
- Tool Properties:
  - Sample Fill;
  - Sample Stroke;
  - Sample Both;
  - Sample from active layer only / visible composite (MVP active layer only for deterministic editing);
  - Apply to current selection after sampling.
- Cursor includes a small fill/stroke chip preview when hovering eligible content.
- Status bar says what will be sampled: `Fill`, `Stroke`, or `Both`.

### Sampling event

```text
pointermove
  -> inspect eligible object under pointer
  -> show preview of fill/stroke style, not a document change
pointerdown
  -> resolve target from authoritative engine state
  -> copy selected style components to StyleClipboard
  -> update current Fill/Stroke chips
  -> show toast: "Fill sampled" / "Stroke sampled" / "Style sampled"
```

Sampling does not change the selected object and does not create an undo entry.

### Apply sampled style

Supported explicit paths:

- select one/many objects, click `Apply sampled style` in Tool Properties;
- after sampling, click a target object with `Apply on next click` enabled;
- keyboard command `Paste Style` applies to the current selection;
- context menu `Apply Fill`, `Apply Stroke`, or `Apply Both`.

Application creates one style command for all targets. It preserves geometry, transforms, node IDs, and unrelated style components.

### What can be sampled

- Fill of a closed vector region/object.
- Stroke of a path/object outline.
- Gradient stops and transform.
- Bitmap fill reference and transform, when asset is available.
- Variable-width profile is sampled with Stroke only when the user chooses `Full stroke style`.

A disabled/none fill is a valid sample and applies `No Fill` explicitly.

## 5. Ink Bottle tool

### Purpose and UI

- Shortcut `S`.
- Cursor: ink bottle plus stroke chip.
- Tool Properties:
  - current stroke style;
  - apply to one outline / all connected outlines;
  - add stroke when absent (on/off, default on for closed shape);
  - preserve width profile (on/off).

### Interaction

```text
pointermove
  -> highlight the outline/shape under pointer
pointerdown
  -> resolve outline target
  -> validate active frame/layer
pointerup
  -> apply current StrokeStyle to that outline
  -> commit one SetStrokeStyle command
  -> select/flash target outline
```

- Clicking the boundary applies stroke. Clicking only the fill shows `Click the outline` unless `Apply to whole shape` is enabled.
- On an open path, the entire stroke is the target.
- On a raw shape with separate connected stroke segments, the default target is the clicked segment; a Tool option can target all connected segments.
- Symbol instances require entering the symbol timeline; Ink Bottle must not mutate the symbol definition from the parent instance view.
- Locked/hidden layer blocks.

## 6. Relationship to Paint Bucket and Properties

| Task | Tool |
|---|---|
| Sample fill/stroke | Eyedropper |
| Apply fill to a region | [Paint Bucket](05_PAINT_BUCKET_TOOL.md) |
| Apply stroke to outline | Ink Bottle |
| Directly edit selected object's style | Properties / Color panel |
| Apply style to many selected objects | Paste Style command |

The same `SetFillStyle` and `SetStrokeStyle` commands are used by Properties, Eyedropper application, Ink Bottle, Bucket style replacement, and Brush/Pen creation. This prevents different UI paths from producing incompatible data.

## 7. Timeline behavior

### Eyedropper

Sampling is view/session state and is not timeline content. It does not change playhead or undo history. Applying a sampled style is a document mutation on the current frame and follows keyframe/hold/lock/tween rules.

### Ink Bottle

Applying a stroke style affects the current frame/keyframe. On held frames, auto-key/copy previous content according to the global policy. On tween spans, style changes are blocked unless the tween specification supports style property keys; no silent endpoint mutation.

## 8. Modifiers and touch behavior

| Modifier | Eyedropper | Ink Bottle |
|---|---|---|
| None | Sample according to mode | Apply current stroke |
| Shift | Add missing component to clipboard / sample both if approved | Apply to all connected outlines in target |
| Alt/Option | Sample from visible composite instead of active layer, if enabled | Temporary selection/pick mode |
| Space | Pan before gesture | Pan before gesture |
| Escape | Cancel pending apply | Cancel preview |

Touch:

- tap sample → style chip appears;
- tap target to apply;
- long-press chip → Fill/Stroke/Both menu;
- long-press target with Ink Bottle → connected/all outline scope.

## 9. Errors and safeguards

- No target under pointer: no mutation; tooltip explains expected target.
- Sampled style missing bitmap asset: copy metadata but mark asset unresolved; applying shows a clear missing-asset error.
- Apply to locked/hidden layer: blocked by engine.
- Apply to symbol instance from parent context: apply to instance appearance only if explicitly supported; default is enter symbol context.
- Sample Fill from open path: no fill result; show `This path has no fill`.
- Ink Bottle clicked on fill only: explain `Click the outline` rather than applying unpredictably.
- Applying `No Stroke` is allowed but visible in Properties.

## 10. Acceptance matrix

1. Sample a solid fill and apply it to another object; geometry is unchanged.
2. Sample a stroke and apply it to an outline; color/width/cap/join update together.
3. Sample Fill only; applying does not change target stroke.
4. Sample Stroke only; applying does not change target fill.
5. Sample Both and paste to a multi-selection; one undo restores all styles.
6. Sample gradient including stops/transform and apply without losing gradient data.
7. Sample No Fill/No Stroke and apply explicitly.
8. Eyedropper hover never mutates the document.
9. Ink Bottle highlights outline before applying.
10. Ink Bottle can add stroke to a fill-only closed shape when enabled.
11. Locked/hidden/tween guards work.
12. Sampling does not move playhead or create undo entries.
13. Applying at frame 10 does not alter frame 1.
14. Save/load preserves styles and style clipboard policy is documented as session-only.
15. Export includes applied styles but no cursor/chip/hover preview.

## 11. Dependencies and code map

Dependencies: FillStyle/StrokeStyle, Color picker/swatches, style clipboard, hit-testing, path region/outline targeting, active frame/layer, keyframe policy, commands, Properties binding, export.

Expected locations:

- `animator/ui/src/editor/eyedropperTool.ts`
- `animator/ui/src/editor/inkBottleTool.ts`
- `animator/ui/src/engine/styleClipboard.ts`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/ui/src/components/PropertiesPanel.tsx`
- `animator/ui/src/components/Toolbar.tsx`
- `animator/ui/src/render/canvasRenderer.ts`

## Adobe source references

- [Strokes, fills, and gradients](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- Existing source: `animate-blueprint/02d_tools_utility.md` T2D.1 and T2D.3
- Existing source: `animate-blueprint/23_color.md`
