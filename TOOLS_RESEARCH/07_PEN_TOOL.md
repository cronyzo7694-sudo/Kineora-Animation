# Pen Tool — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P0 for clean vector line art and closed cartoon shapes  
**Shortcut:** `P`  
**Related files:** [Pencil](03_PENCIL_TOOL.md), [Line/Rectangle/Oval](08_LINE_RECT_OVAL_TOOLS.md), [Subselection](10_SUBSELECTION_TOOL.md), [Width](11_WIDTH_TOOL.md), [Eyedropper/Ink Bottle](12_EYEDROPPER_INK_BOTTLE.md), [Shape model](../animate-blueprint/06_shape_system.md)

## 1. Purpose and tool boundary

Pen is the precision path authoring tool. It creates editable Bézier paths by placing anchors and handles. It is not a freehand tool and it must not silently smooth a user's intentional anchor placement.

Pen is used for:

- clean character silhouettes;
- closed fills such as faces, shirts, props, and masks;
- precise straight/curved line art;
- custom motion paths later;
- editing path topology through Add Anchor, Delete Anchor, and Convert Anchor sub-modes.

The division of responsibility is:

| Need | Tool |
|---|---|
| Expressive freehand line | [Pencil](03_PENCIL_TOOL.md) |
| Filled freehand painting | [Brush](04_BRUSH_TOOL.md) |
| Precise anchors and Bézier curves | Pen |
| Two-point straight stroke | [Line](08_LINE_RECT_OVAL_TOOLS.md#3-line-tool) |
| Move whole object | [Select](01_SELECT_TOOL.md) |
| Move anchors/handles after creation | [Subselection](10_SUBSELECTION_TOOL.md) |
| Change stroke width along a path | [Width](11_WIDTH_TOOL.md) |

## 2. Adobe behavior to retain

[ADOBE] Adobe's Pen workflow uses click for corner anchors, click-drag for curve anchors, clicking the starting anchor to close a path, and double-clicking the last anchor to finish an open path. Existing path anchors expose Add, Delete, and Convert affordances. The tool uses current fill/stroke settings and can work in merge or object drawing mode.

[KINEORA] Retain the familiar behavior but make the state visible and safe:

- the in-progress path is always an editor preview until closed/ended;
- `Esc` cancels the whole in-progress path;
- `Backspace`/`Delete` removes the last uncommitted anchor, not committed artwork;
- the status bar says `Pen: click anchor · drag handle · click start to close · Enter to finish · Esc to cancel`;
- clicking an existing path never changes it accidentally unless the cursor explicitly shows an add/delete/convert affordance;
- a fill appears only when the path is closed.

## 3. UI location and options

- Left Tools rail: Drawing group, Pen flyout.
- Primary icon: original Kineora pen-nib glyph; do not copy Adobe artwork.
- Options/Tool Properties:
  - `Create mode`: Merge shape | Object drawing object.
  - `Snap anchors`: off/object/grid/guides according to the global SnapEngine.
  - `Show rubber-band preview`: on by default.
  - `Auto close near start`: off by default; if on, show a visible closing target.
  - `Fill` and `Stroke` style chips; these use the shared [Color/Style](12_EYEDROPPER_INK_BOTTLE.md) contract.
  - `Corner default`: Corner or Smooth. Default Corner; click-drag always creates Smooth.
- Contextual cursor states:
  - new anchor;
  - close path;
  - continue open path;
  - add anchor;
  - delete anchor;
  - convert anchor;
  - invalid/locked target.

## 4. Path data contract

A Pen path is a list of ordered anchors. Each anchor stores a position, point type, and optional incoming/outgoing handles:

```text
Path {
  anchors: [
    {
      id: AnchorId,
      point: { x, y },
      type: Corner | Smooth | Symmetric,
      in_handle: Option<{ x, y }>,
      out_handle: Option<{ x, y }>
    }
  ],
  closed: bool,
  winding: NonZero | EvenOdd
}
```

Handles are stored as vectors relative to the anchor, not absolute screen coordinates. This makes paths independent of viewport zoom/pan and keeps serialization deterministic.

A segment from anchor `i` to `i+1` is:

- straight if both relevant handles are absent;
- quadratic/cubic Bézier if handles exist;
- closed path adds a final segment from the last anchor to the first.

[KINEORA] Point type rules:

- `Corner`: incoming/outgoing handles are independent; no automatic mirroring.
- `Smooth`: handles remain collinear; dragging one may mirror the opposite handle length according to the selected handle behavior.
- `Symmetric`: handles are collinear and equal length; ideal for smooth arcs.

The exact point type is preserved after saving/loading and during undo.

## 5. Creating a path — exact event sequence

### Start

```text
pointerdown on empty editable area
  -> validate active layer/frame
  -> create editor-only path buffer
  -> add anchor 0 at snapped document point
  -> do not write document
```

### Straight segment

```text
pointermove
  -> render rubber-band segment from last anchor to cursor
pointerdown without drag
  -> add Corner anchor
  -> commit only to preview buffer
```

### Curved segment

```text
pointerdown at next point
  -> begin candidate anchor
pointermove while held
  -> outgoing handle follows pointer
  -> incoming handle is created according to Smooth/Symmetric policy
  -> render live Bézier segment and rubber-band next segment
pointerup
  -> commit candidate anchor to preview buffer
```

The handle gesture must not be interpreted as a canvas pan. Spacebar temporarily pans only before a Pen pointerdown or after the current pointer capture is released.

### Close path

- Move over the first anchor: show close cursor and highlighted target.
- Click first anchor: set `closed=true`, generate closing segment, validate fill/winding, commit one `DrawPath` command.
- If a fill is selected and the path is open, show a warning rather than inventing a closure.

### Finish an open path

- Double-click the last anchor, press Enter, or choose `Finish Path` from context menu.
- Commit one open `DrawPath` command with stroke only; fill is stored as none/disabled for an open path.
- Pressing Escape before finish cancels the whole buffer.

## 6. Existing-path sub-modes

### Add Anchor

- Hover a segment: preview insertion point.
- Click segment: split it at the nearest parameter `t`; create a new anchor with calculated handles that preserve the curve as closely as possible.
- Commit one `AddAnchor` command.

### Delete Anchor

- Hover anchor: show delete cursor.
- Click: remove it and join adjacent segments using a deterministic join rule.
- A closed path must retain at least three anchors for a valid filled shape; an open path must retain at least two anchors. If deletion would violate the minimum, reject with a message.
- Commit one `DeleteAnchor` command.

### Convert Anchor

- Corner → Smooth: calculate a tangent from neighboring points; preserve the anchor position and minimize visual discontinuity.
- Smooth/Symmetric → Corner: preserve current handle vectors but stop mirroring; the user can then edit each side independently.
- `Alt/Option` click is a fast convert gesture; an explicit sub-tool is available for touch/accessibility.
- Commit one `ConvertAnchor` command.

[ KINEORA ] These sub-modes are part of the Pen tool file because they are Pen's topology tools. Fine anchor/handle manipulation belongs to [Subselection](10_SUBSELECTION_TOOL.md).

## 7. Snapping and precision

Snapping is applied in document space before an anchor is added:

1. snap to nearby existing anchor points;
2. snap to object edges/centers;
3. snap to guides;
4. snap to grid;
5. snap angle/length when Shift is held.

The SnapEngine returns both the corrected point and a visual hint. It must never change the cursor position silently: display a small snap marker or guide.

`Shift` constrains a new segment/handle to 45-degree increments from the previous anchor. A numeric HUD may show length and angle but must not steal keyboard focus from the path.

## 8. Modifier matrix

| Modifier | New path | Existing path |
|---|---|---|
| None | Click corner; click-drag curve | Normal sub-mode behavior |
| Shift | 45° segment/handle snap | Axis-constrained anchor/handle move when handed to Subselection |
| Alt/Option | Split handle / convert point | Fast Convert Anchor |
| Ctrl/Cmd | Temporarily Selection when pointer is not down | Temporarily Selection |
| Space | Temporary Hand before/after a pointer gesture | Temporary Hand |
| Backspace/Delete | Remove last uncommitted anchor | Delete Anchor only when Delete sub-mode is explicit |
| Enter | Finish open path | Finish pending action |
| Escape | Cancel in-progress path | Cancel current edit |

## 9. Fill, stroke, and shape mode

- At `pointerdown`, snapshot the current FillStyle/StrokeStyle for the gesture. Changing the panel while the path is in progress affects the next gesture, not the active path; this keeps undo and preview deterministic.
- Closed paths may have fill, stroke, both, or one set to None. Both cannot be None unless the user is creating a guide path; guide behavior is a later layer type.
- Object mode creates one atomic path node. Overlap with other objects does not mutate them.
- Merge mode sends the new path through the shape boolean/merge engine on commit. It may split or merge existing raw geometry; that operation must still be one undo command.
- A Pen path created for a motion guide uses stroke-only and is stored in a guide/tween context, not as visible artwork.

See [Shape System](../animate-blueprint/06_shape_system.md) and [Color/Style](../animate-blueprint/23_color.md).

## 10. Timeline and keyframes

- Pen always targets the active scene, active layer, and playhead frame.
- Blank keyframe: create new content.
- Content keyframe: add the path to the keyframe.
- Held frame: follow the global auto-key policy; copy previous content before adding the new path so earlier frames are not changed.
- Tween span: block by default and explain `Create a keyframe to draw here`. Drawing must not corrupt a transform tween.
- A closed path is one content item and one undo entry even if it has many anchors.
- Adding/deleting/converting anchors on an existing path is one command per gesture/click.
- A path created on frame 10 does not appear on frame 1. Exposure/hold behavior is owned by the Timeline specification, not by Pen.

## 11. Selection, symbols, and edit contexts

- On commit, the new path is selected.
- `V` [Selection](01_SELECT_TOOL.md) moves the whole path.
- `A` [Subselection](10_SUBSELECTION_TOOL.md) edits anchors/handles.
- `U` [Width](11_WIDTH_TOOL.md) edits the stroke width profile.
- `I` [Eyedropper](12_EYEDROPPER_INK_BOTTLE.md) samples style.
- Double-clicking a symbol instance enters symbol edit context only when that feature is enabled; otherwise it is a normal selection.
- Pen cannot edit inside a group/symbol without entering that context. The breadcrumb/edit-depth state must be visible.

## 12. Errors and safeguards

- Locked/hidden layer: block before creating the preview.
- Tween layer: block with a suggested new normal layer.
- Too few anchors to finish a filled path: keep the preview and explain what is missing.
- Self-intersecting fill: allow only if the selected winding rule supports it; otherwise show a preview warning.
- Clicking near but not on start anchor: do not auto-close.
- Tool switch while path is active: show a small `Finish / Cancel` choice; switching should not silently discard a long path.
- Pointer leaves canvas: pointer capture keeps the path active.

## 13. Acceptance matrix

1. Click three corners and close: a valid triangular fill appears.
2. Click-drag two anchors: curve handles produce a smooth Bézier segment.
3. Close only when the first-anchor target is highlighted.
4. Enter finishes an open stroke; Escape removes the in-progress path.
5. Backspace removes only the last uncommitted anchor.
6. Add Anchor splits a segment without a visible jump.
7. Delete Anchor respects minimum-anchor guards and is undoable.
8. Convert Anchor switches corner/smooth behavior and persists after save/load.
9. Shift constrains segment/handle angle; snapping shows visual feedback.
10. Locked/hidden/tween layer rejects the operation without mutation.
11. Path created at frame 10 does not alter frame 1.
12. Object mode does not alter overlapping neighbors; merge mode invokes the boolean engine.
13. `V`, `A`, `U`, `I`, and `K` hand off correctly without losing the path.
14. Export includes the committed path/fill/stroke but not rubber-band/anchor overlays.
15. Undo/redo restores the entire path and exact anchor data.

## 14. Dependencies and code map

Dependencies: viewport conversion, SnapEngine, Path/Anchor model, FillStyle/StrokeStyle, keyframe insertion, layer lock/visibility, boolean engine for Merge mode, selection, undo/redo, save/load, renderer preview, SVG/raster export.

Expected files:

- `animator/ui/src/editor/penTool.ts`
- `animator/ui/src/editor/pathGeometry.ts`
- `animator/ui/src/editor/snap.ts`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/export.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/wasm.rs` and `animator/ui/src/engine/client.ts`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Drawing in Animate](https://helpx.adobe.com/animate/using/drawing.html)
- Existing source: `animate-blueprint/02b_tools_drawing.md` T2B.1
- Existing source: `animate-blueprint/06_shape_system.md`
