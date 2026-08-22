# Subselection Tool — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P1; required for professional vector cleanup  
**Shortcut:** `A`  
**Related files:** [Pen](07_PEN_TOOL.md), [Selection](01_SELECT_TOOL.md), [Width](11_WIDTH_TOOL.md), [Shape model](../animate-blueprint/06_shape_system.md)

## 1. Purpose

Subselection edits a vector path at anchor/handle level. It is the precision cleanup companion to Pen:

- Selection moves the whole object.
- Subselection moves anchors and Bézier handles.
- Pen changes topology by adding/deleting/converting anchors.
- Width changes variable stroke thickness.

It must not expose meaningless anchors for a parametric primitive. A primitive remains parameter-editable until [Bake to Path](09_POLYSTAR_PRIMITIVES.md#3-primitive-common-model).

## 2. Adobe behavior to retain

[ADOBE] Adobe's Subselection reveals path anchors, allows selecting one or multiple anchors, moving them, dragging Bézier handles, and converting corner/smooth behavior. Motion paths and some rigging paths can have related editing workflows.

[KINEORA] The first release focuses on static vector paths. Motion-path editing is a later extension using the same anchor UI, and it must be clearly distinguished by a motion-path color/label so users do not accidentally edit animation geometry.

## 3. UI and visible state

- Tools rail: Selection/Transform flyout.
- Shortcut `A`.
- Cursor states: path target, anchor, handle, add/delete/convert handoff.
- On selecting a path:
  - anchors are small squares;
  - selected anchor is filled/highlighted;
  - tangent handles are visible for selected smooth points;
  - path direction/start marker can be shown in a subtle color;
  - other objects remain visible but are not editable.
- Tool Properties:
  - snap anchors/handles;
  - show handles for selected anchors / all anchors;
  - point type buttons: Corner, Smooth, Symmetric;
  - `Bake primitive` action when a primitive is targeted.

## 4. Selection behavior

- Click a path: enter anchor-edit view; do not change the whole-object selection unless the object was not already active.
- Click anchor: select one anchor, replace previous anchor selection.
- Shift-click anchor: add/remove anchor from anchor selection.
- Drag empty space in the path-edit context: anchor marquee.
- Click empty stage: exit path-edit or clear anchor selection according to the current edit depth.
- `Ctrl/Cmd+A` while active selects all anchors of the current path, not all scene nodes.
- Hidden/locked layer content cannot be entered.

[KINEORA] Selecting a path and selecting its anchors are different session states. The Properties context says `Path` or `Anchors (n)` so the user knows what is being edited.

## 5. Anchor and handle interactions

### Move anchor

```text
pointerdown on anchor
  -> capture anchor ID and original path
pointermove
  -> move anchor in document coordinates
  -> attached handles follow by the same delta unless the user breaks them
pointerup
  -> commit one PathEdit command
```

`Shift` snaps movement to horizontal/vertical axes or SnapEngine targets. The fill and stroke preview update live.

### Move handle

- Handle line extends from anchor to tangent control point.
- Drag control point changes handle vector.
- Smooth points maintain collinearity; Symmetric points maintain equal opposite length; Corner points are independent.
- Alt/Option while dragging a smooth handle breaks the opposite handle into independent control, converting the point to Corner/independent mode.
- Shift snaps the handle direction to 45° increments.
- Handle length can never produce NaN/infinite values; clamp to a safe document range.

### Select multiple anchors

- Shift-click toggles.
- Marquee selects anchors whose points are inside the marquee. A preference may later select handles too.
- Moving multiple anchors applies the same document delta.
- Transform overlay for anchors may be added later; initial MVP supports translation only.

## 6. Topology handoff

Subselection does not own add/delete/convert toolbar operations; Pen sub-modes own them. When the cursor enters a segment/anchor with the Pen active, the user can add/delete/convert. This avoids two tools both claiming the same click.

- `P` + segment = Add Anchor preview.
- `P` + anchor = Delete/Convert preview based on selected sub-mode/modifier.
- `A` + anchor = move/edit existing anchor.

A path cannot be left in a partially invalid topology. If an operation would create fewer than two open or three closed anchors, reject it.

## 7. Primitive behavior

- Selecting a Rectangle/Oval/PolyStar primitive displays parameter handles, not raw anchors.
- Choosing Subselection shows a non-destructive prompt: `Bake to Path to edit anchors?` with `Bake`, `Cancel`, and `Remember choice` only if approved.
- Bake is undoable and preserves style/transform.
- After bake, the node is a normal path and all anchor rules apply.

## 8. Path geometry behavior

For a cubic segment, the renderer uses the anchor point, outgoing control, next anchor point, and incoming control. When an anchor moves:

- neighboring segment endpoints move;
- controls are translated only when the point-type policy says they are attached;
- no automatic global smoothing occurs.

[KINEORA] Never run destructive RDP simplification during an anchor drag. Simplify is a separate explicit command because it changes topology and may surprise an animator.

## 9. Timeline behavior

- Static path edits affect the current frame/keyframe only.
- Editing a held frame auto-keys/copies according to the global policy.
- Editing a path inside a tween span is blocked for topology changes. A transform-only property key may be created only by the transform tool, not by Subselection.
- Path edits on one frame do not rewrite other frame content.
- On a shape-tween future path, Subselection must use the shape-tween contract and warn if anchor correspondence is not available.
- One anchor/handle drag = one undo command; add/delete/convert = one command each.

## 10. Model and command contract

```text
PathEdit {
  scene,
  layer,
  frame,
  node_id,
  before_path,
  after_path,
  changed_anchor_ids
}
```

Selection of anchors is session state and not persisted. The path itself is persisted in the content node. The command validates that the node still exists in the target frame and that its path version/hash matches the preview snapshot; if not, it rejects without partial writes.

## 11. Common errors

- Attempting to edit a primitive without baking.
- Clicking a stroke but selecting a different overlapping path.
- Dragging a handle at very low zoom and creating a huge document-space tangent.
- Deleting the only anchors of a shape.
- Moving a path on a locked/hidden layer.
- Editing a motion path while intending to edit artwork.
- Switching tools during pointer capture and leaving anchors in preview-only state.

Messages:

- `Primitive parameters are editable; bake it to edit anchors.`
- `Path needs at least three anchors to remain a closed fill.`
- `Path edit blocked: layer is locked.`
- `This motion path is preview-only in the current release.`

## 12. Acceptance matrix

1. Click path with `A`: anchors appear; object geometry is unchanged.
2. Drag one anchor: adjacent segments update smoothly and one undo restores path.
3. Shift-drag anchor: axis/snap behavior is visible.
4. Drag smooth handle: tangent updates without moving anchor.
5. Alt-drag handle: handles split and point type becomes independent.
6. Shift-click and marquee select multiple anchors; move them together.
7. Pen Add/Delete/Convert operations hand off and preserve path shape as much as possible.
8. Primitive selection offers Bake rather than showing fake anchors.
9. Closed-path minimum-anchor guard works.
10. Locked/hidden/tween guard works.
11. Edit at frame 10 does not change frame 1.
12. Save/load preserves anchor IDs, point types, handles, and closed/winding values.
13. Export has edited path geometry but no anchors/handles/selection overlay.
14. Pointercancel/Escape during drag restores the preview and creates no command.
15. Selecting another tool releases pointer capture cleanly.

## 13. Dependencies and code map

Dependencies: Path/Anchor model, cubic geometry, selection session, viewport/SnapEngine, primitive bake, keyframe rules, command history, renderer overlay, export.

Expected locations:

- `animator/ui/src/editor/subselectionTool.ts`
- `animator/ui/src/editor/pathGeometry.ts`
- `animator/ui/src/editor/transformMath.ts`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/core/src/eval.rs`
- `animator/ui/src/render/canvasRenderer.ts`

## Adobe source references

- [Basic tools in Animate](https://helpx.adobe.com/in/animate/desktop/using/basic-tools.html)
- [Drawing in Animate](https://helpx.adobe.com/animate/using/drawing.html)
- Existing source: `animate-blueprint/02a_tools_selection_transform.md` T2A.2
- Existing source: `animate-blueprint/06_shape_system.md` §6.4
