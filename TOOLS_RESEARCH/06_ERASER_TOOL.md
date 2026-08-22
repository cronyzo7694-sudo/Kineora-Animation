# Eraser Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0 for line-art cleanup  
**Shortcut:** `E`  
**Primary existing references:** `animate-blueprint/02c_tools_painting.md` T2C.5 and `animate-blueprint/06_shape_system.md`

## 1. Purpose

Eraser removes vector content by painting a subtraction path. It is required for a comfortable hand-drawn animation workflow: remove stray Pencil marks, cut holes in fills, and clean overlapping construction lines.

The tool must not be implemented as a white brush. White painting is artwork; Eraser must remove geometry or clear a raster mask so transparent exports remain transparent.

## 2. Adobe behavior to retain

[ADOBE] Adobe exposes Erase Normal, Erase Fills, Erase Lines, Erase Selected Fills, and Erase Inside modes, plus round/square eraser shapes and a Faucet action. Erasing a vector stroke can split it, while deleting a fill can remove a connected component.

[KINEORA] Keep the modes, but replace hidden double-click destructive behavior with an explicit `Clear Current Frame` command elsewhere. A double-click on the Eraser tool must never clear the stage.

## 3. UI and options

- Left Tools rail: Painting/Cleanup group.
- Tool Properties:
  - Mode: Normal / Fills / Lines / Selected Fills / Inside.
  - Shape: round, square; future custom brush shape.
  - Size: numeric + slider.
  - Hardness/feather: disabled in vector MVP; raster layers may add it later.
  - Faucet toggle/button: click a connected fill or stroke component to remove it.
- Cursor is an eraser outline with size and mode label.
- Hover preview shows the affected object/path in a warning color. The preview must distinguish “will remove line” from “will remove fill”.

## 4. Eraser geometry model

The eraser gesture is a path with a radius/shape at every sample. For vector content:

1. Capture and smooth eraser centerline.
2. Expand the path into an eraser region.
3. Intersect it with eligible fills/strokes.
4. Subtract from each target path.
5. Remove empty fragments.
6. Split open strokes where the eraser crosses them.
7. Preserve unaffected geometry and stable node IDs where practical.

For a stroke, subtracting a region may produce zero, one, or multiple strokes. The undo payload must retain the exact prior geometry and resulting fragments.

## 5. Eraser modes

### Erase Normal

Subtract from fills and strokes on the active layer/current frame. It does not affect symbols or locked content unless the user enters the symbol timeline and the target layer is editable.

### Erase Fills

Subtract only fill regions. Stroke geometry remains unchanged even if it crosses the erased area.

### Erase Lines

Subtract only stroke paths. This is the preferred cleanup mode for removing stray ink without damaging colored fills.

### Erase Selected Fills

Subtract only from currently selected fill objects. If nothing selected, show a clear status message and do nothing.

### Erase Inside

At pointerdown, capture the fill region under the start point. Eraser subtraction remains clipped to that region for the gesture. Starting outside a fill is an error; crossing into another region does not expand the mask.

## 6. Faucet behavior

Faucet is a click action, not a drag stroke:

- Click a fill component: delete that component.
- Click a connected stroke segment: delete that connected segment.
- `Erase Selected Fills` + Faucet acts only on selected eligible fills.
- One Faucet click = one undo command.
- The cursor and tooltip must say `Faucet: delete connected component`, so a user does not mistake it for normal erasing.

[KINEORA] No double-click “erase everything.” A destructive stage-wide action belongs to an explicit command with a confirmation and a target scope.

## 7. Gesture contract

```text
pointerdown
  -> validate layer/frame
  -> snapshot mode and eraser settings
  -> capture Inside/Selected mask if needed
  -> start editor-only subtraction preview
pointermove
  -> append samples
  -> generate eraser region
  -> show affected geometry preview
pointerup
  -> resolve targets from authoritative state
  -> subtract/repair geometry
  -> if no intersection: no command + optional "nothing erased"
  -> otherwise commit one Erase command
```

Escape, pointercancel, blur, and tool switch discard the preview. A tiny click may be a single eraser stamp; zero movement with no intersection is a no-op.

## 8. Modifier matrix

| Modifier | Effect |
|---|---|
| Shift | Constrain eraser path direction where useful; optional straight erase segment |
| Alt/Option | Temporary Faucet or alternate mode only if shown in tooltip; do not make it destructive without visual cue |
| Space | Temporary Hand/pan |
| Ctrl/Cmd | Temporary Selection when no stroke is active |
| Escape | Cancel current erase |

## 9. Model and command contract

```text
Erase {
  scene,
  layer,
  frame,
  mode,
  eraser_path,
  targets: [
    {
      node_id,
      before_geometry,
      after_geometry_or_fragments
    }
  ]
}
```

The command is allowed to replace one original node with several fragment nodes, but undo must restore the original identity/geometry. For symbol instances, the default command is blocked rather than breaking the instance unexpectedly.

Raster support, if introduced later, uses a non-destructive alpha mask/erase layer, not destructive pixel writes during pointermove.

[CODE] The current Rust model has no general Path/Stroke/Fill geometry or boolean library. Eraser therefore depends on the vector model and edit-ops foundation; do not add a button that paints a white rectangle as a temporary substitute.

## 10. Timeline behavior

- Erase affects only the active frame's content.
- On a held frame, auto-keyframe/copy previous content according to the global policy.
- On a blank frame, it is a no-op unless there is content from a special reference layer.
- On tween spans, block by default because erasing changes topology; offer an explicit create-keyframe branch only after tween rules support it.
- One continuous erase gesture = one command, even if it affects many objects.
- Faucet click = one command.

## 11. Common errors

- Locked/hidden layer.
- No eligible geometry under the eraser.
- Erase Selected Fills with empty selection.
- Erase Inside started outside a fill.
- Attempt to erase a symbol/group without entering it.
- Boolean result is invalid/self-intersecting.
- Eraser region is too large and would delete an entire scene: allow it only as an explicit normal erase with preview; no hidden escalation.

Use messages such as:

- `Nothing to erase here.`
- `Erase Lines removed 3 stroke segments.`
- `This layer is locked.`
- `Enter the symbol timeline to edit its contents.`
- `Erase could not produce a valid vector result; content was unchanged.`

## 12. Acceptance tests

1. Erase a line crossing a fill in Erase Lines mode; fill remains intact.
2. Erase a fill in Erase Fills mode; stroke remains intact.
3. Erase Normal removes both eligible fill and stroke geometry.
4. Erasing across a stroke splits it into two selectable stroke nodes or fragments.
5. Erase Selected Fills changes only selected fill nodes.
6. Erase Inside cannot spill into a neighboring closed region.
7. Faucet removes one connected component in one undo step.
8. Double-clicking the tool does not clear the stage.
9. Locked/hidden/tween-layer mutation is blocked by UI and engine.
10. Escape/pointercancel/window blur leaves content unchanged.
11. Undo/redo restores exact geometry and IDs/fragments.
12. Zoom/pan does not change the document-space erase size/path.
13. Erase on frame 10 does not alter frame 1.
14. Export contains transparency where content was erased; no eraser cursor/preview appears.
15. Save/load preserves the post-erase geometry.

## 13. Dependencies and implementation files

Dependencies: shared freehand capture, vector boolean subtraction, fill/stroke region model, fragment identity policy, active frame/layer, command history, selection update, renderer preview, export.

Expected locations:

- `animator/ui/src/editor/eraserTool.ts`
- `animator/ui/src/editor/freehandCapture.ts`
- `animator/core/src/edit_ops.rs`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/eval.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/export.rs`
- `animator/core/src/wasm.rs` / `animator/ui/src/engine/client.ts`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Drawing in Animate](https://helpx.adobe.com/animate/using/drawing.html)
- Existing detailed source: `animate-blueprint/02c_tools_painting.md` T2C.5
