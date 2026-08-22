# Pencil Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0 for line-art animation  
**Shortcut:** `Shift+Y` (Kineora keeps `Y` free for Paint Brush)  
**Primary existing references:** `animate-blueprint/02c_tools_painting.md` T2C.1 and the shared stroke-capture section

## 1. Purpose

Pencil is the freehand **vector stroke** tool for sketching and clean line art. It must feel immediate while producing editable, deterministic paths rather than a raster screenshot. It is different from Brush:

- Pencil creates a stroke with stroke color, width, cap, join, and optional variable width.
- Brush creates a filled painted region.

The first animation use case is: draw rough key poses on frame 1, insert another keyframe, draw the next pose, then scrub and clean the line art.

## 2. Adobe behavior to retain

[ADOBE] Adobe's Pencil has Straighten, Smooth, and Ink modes. Straighten recognizes approximate straight lines and common geometric forms; Smooth reduces wobble; Ink keeps more of the user's original path. The Pencil uses stroke color and stroke settings from the Properties/Tools controls.

[KINEORA] Keep these three modes but make their effects visible and predictable. Add a numeric smoothing slider rather than hiding smoothing inside a preset. The selected mode and value persist as tool preferences, not as per-stroke geometry metadata except for the final path result.

## 3. UI and options

- Left Tools rail: Drawing/Painting group.
- Active icon: pencil glyph with selected background.
- Tool Properties tab:
  - Mode: `Ink`, `Smooth`, `Straighten`.
  - Smoothing: 0–100.
  - Stroke color.
  - Stroke width.
  - Cap: round, butt, square.
  - Join: round, bevel, miter.
  - Pressure-to-width toggle.
  - Tilt-to-angle toggle when a stylus provides tilt.
  - Drawing mode: `Object` or `Merge` (Object is the safe default for MVP).
- Bottom status: mode, size, current layer, current frame.
- Cursor preview shows a small stroke sample at the current width; it must not paint before pointerdown.

## 4. Shared input pipeline

```text
raw pointer samples
  -> pointer capture
  -> screen -> document conversion
  -> resample by distance
  -> smooth according to mode and strength
  -> retain pressure, tilt, timestamp, velocity
  -> generate centerline + width profile
  -> generate stroke bounds for hit-testing
  -> editor-only preview
  -> commit on pointerup
```

Recommended initial resampling target is 0.5–2 document pixels, with a minimum point count of two. Do not use browser mousemove points directly: they vary by device and make the same gesture produce different geometry.

[KINEORA] Use a deterministic smoothing implementation shared by Pencil, Brush, and Paint Brush. The exact algorithm may be RDP plus a one-euro/moving-average filter, but it must be pure and unit-tested. Preserve the first and last points so a short stroke does not drift.

## 5. Stroke creation behavior

### Pointerdown

1. Confirm the active layer is visible/unlocked and the current frame is editable.
2. If the frame is a hold/non-keyframe, apply the explicit auto-key policy.
3. Capture pointer and initialize a stroke buffer with document-space point, pressure, tilt, and time.
4. Do not mutate the document.

### Pointermove

1. Append/resample samples.
2. Rebuild a preview path at most once per animation frame.
3. Show the exact style that will be committed.
4. In Straighten mode, show a subtle candidate guide only after enough samples exist; never snap the start point unexpectedly.

### Pointerup

1. If total movement is below the minimum stroke length, either create a dot stamp when the user clicked intentionally or cancel; this rule is a tool setting.
2. Simplify and validate the path.
3. Create one stroke node in the current keyframe.
4. Commit `DrawStroke` as one undoable command.
5. Select the new stroke and update Properties.

### Cancel

Escape, pointercancel, blur, or tool switch discards the buffer and preview. No empty stroke and no undo entry.

## 6. Mode behavior

| Mode | Result | Use |
|---|---|---|
| Ink | Minimal correction; preserves character | Roughs and expressive line art |
| Smooth | Removes jitter and reduces unnecessary points | Clean cartoon outlines; default |
| Straighten | Recognizes near-lines, arcs, circles, rectangles | Technical lines and cleanup |

The smoothing slider is 0 = least correction and 100 = strongest correction. The UI must preview the path; a slider change after the stroke is committed is not retroactive unless a later `Simplify Stroke` command is added.

## 7. Modifiers

| Modifier | Effect |
|---|---|
| Shift | Temporarily favor straight/axis-constrained segments; exact behavior follows mode and is shown in tooltip |
| Alt/Option | Temporary Eyedropper/style sample, if style sampling is implemented |
| Space | Temporary Hand/pan; must suspend drawing without losing the stroke buffer |
| Ctrl/Cmd | Temporary Selection tool when pointer is not down |
| Escape | Cancel current stroke |

Stylus pressure and tilt are input data, not keyboard modifiers. Mouse input uses constant pressure = 1.

## 8. Model contract

The stroke must be a first-class vector node, not a screenshot:

```text
StrokeNode {
  id: NodeId,
  path: [
    { x, y, pressure, tilt_x, tilt_y, time }
  ],
  width_profile: [{ t, left, right }],
  style: {
    color,
    alpha,
    width,
    cap,
    join,
    miter_limit,
    dash
  },
  closed: false
}
```

The renderer can tessellate the centerline plus width profile to a filled outline. The authored path remains editable by Subselection and Width tools.

[CODE] The current `Node` enum has no stroke/path node. Implementing Pencil requires additions to `model.rs`, `eval.rs`, `export.rs`, `command.rs`, serialization migration, WASM JSON, Canvas renderer, selection bounds, and tests. Do not store Pencil output as a `Rect`.

## 9. Merge vs Object drawing mode

- `Object` mode: each stroke is an independent node. It can be selected, transformed, hidden, and deleted without changing neighboring geometry. This is the MVP default.
- `Merge` mode: strokes participate in a shared shape/boolean model. This is useful for classic Animate-like editing but requires robust path booleans and should follow after the standalone path model.

The selected mode must be visible at draw time. Switching modes affects future strokes only.

## 10. Timeline behavior

- One Pencil stroke targets the current active layer and frame.
- Drawing on a blank keyframe is allowed.
- Drawing on a held frame creates a keyframe according to the auto-key policy and preserves held content.
- Drawing into a tween span is blocked with a precise message, unless the user chooses `Create keyframe and break/branch tween` in a later explicit flow.
- A stroke created on frame 10 does not appear on frame 1 unless the timeline exposure/hold rules say it is held from frame 10 onward.
- A frame-by-frame workflow must not implicitly interpolate stroke topology. Shape tweening is a separate future feature.

## 11. Common errors

- Layer locked or hidden.
- Current layer is a tween layer.
- Stroke has fewer than two points and is not an intentional dot.
- Non-finite pressure/tilt values from a faulty device.
- Excessive point count causes slow rendering; simplify before commit and preserve visual tolerance.
- Drawing starts outside the stage on pasteboard: allowed when pasteboard is visible, but export clips to stage.
- Pointer leaves canvas: capture must preserve drawing.

## 12. Acceptance tests

1. Draw a short and long stroke at 50%, 100%, and 200% stage zoom; geometry scales correctly.
2. Ink mode preserves visible wobble; Smooth reduces it; Straighten recognizes a near-line.
3. Mouse creates constant-width stroke; stylus pressure changes width when enabled.
4. Toggle pressure off: same stylus gesture produces constant width.
5. Escape/pointercancel/window blur leaves no stroke.
6. One stroke = one undo; undo removes it and redo restores it.
7. Draw at frame 10 on a held layer: only the documented new keyframe behavior occurs.
8. Draw on locked/hidden/tween layer: blocked without document mutation.
9. Select new stroke and transform it; selection bounds cover its full width.
10. Export SVG/PNG; stroke appears and editor preview does not.
11. Save/load round trip preserves points, style, width profile, and frame placement.
12. Very dense input is simplified without a visible gap at the endpoints.

## 13. Dependencies and implementation files

Dependencies: path model, stroke tessellation, style model, viewport math, pointer sampling, active frame/layer, command history, selection, serialization, export.

Expected locations:

- `animator/ui/src/editor/freehandCapture.ts` — shared input/smoothing.
- `animator/ui/src/editor/pencilTool.ts` — mode and gesture policy.
- `animator/core/src/model.rs` — StrokeNode and style types.
- `animator/core/src/command.rs` — DrawStroke.
- `animator/core/src/eval.rs` — stroke render item.
- `animator/ui/src/render/canvasRenderer.ts` — stroke tessellation/render.
- `animator/core/src/export.rs` — SVG stroke output and raster path.
- `animator/ui/src/engine/client.ts` / `wasm.rs` — JSON bridge.

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Draw simple lines and shapes](https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html)
- [Strokes, fills, and gradients](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- Existing detailed source: `animate-blueprint/02c_tools_painting.md` T2C.1
