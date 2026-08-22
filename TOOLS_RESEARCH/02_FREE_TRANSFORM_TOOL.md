# Free Transform Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0  
**Shortcut:** `Q`  
**Primary existing references:** `animate-blueprint/02a_tools_selection_transform.md` T2A.3 and `animate-blueprint/04_transform_system.md`

## 1. Purpose

Free Transform is the direct manipulation tool for move, scale, rotate, skew, and pivot editing. Selection can move an object, but Free Transform exposes the geometry visibly so a cartoon artist can pose, resize, flip, and rotate artwork without opening Properties for every small adjustment.

[KINEORA] MVP starts with move, uniform/non-uniform scale, rotation, flip, and numeric precision. Skew, distort, envelope, and draggable pivot are specified but may be implemented after the basic animation loop is stable. They must not be shown as functional buttons before they work.

## 2. Adobe behavior to retain

[ADOBE] Animate's Free Transform uses a bounding box with corner/edge handles and a transformation point. Modifiers provide proportional scaling, center-based scaling, constrained rotation, and pivot changes. The exact legacy handle glyphs are not copied; the interaction model is retained.

[KINEORA] The overlay is editor-only. The engine stores transform values; it does not store the screen-space bounding box. For a rotated object, handles are oriented with the object. For multi-selection, the outer box is an axis-aligned union unless a future oriented group transform is introduced.

## 3. UI and overlay

- Left Tools rail: grouped with Selection.
- Shortcut `Q` activates it.
- On a single selection, draw:
  - eight scale handles: `tl`, `t`, `tr`, `r`, `br`, `b`, `bl`, `l`;
  - rotate handle above the top edge;
  - pivot marker at the transform pivot;
  - optional skew zones on edges after skew is implemented.
- On multi-selection, show one union box and a center pivot.
- Properties panel exposes exact values: X, Y, width, height, scale X/Y, rotation, skew X/Y, pivot X/Y.
- Status bar shows active transform mode and modifier hints.

Handle hit areas must remain at least 10 CSS px on desktop and 44 CSS px on touch. The visual handle can be smaller than its hit region.

## 4. Transform coordinate model

All calculations use document coordinates. The transform is conceptually:

```text
T = Translate(x, y)
  * Translate(pivot_x, pivot_y)
  * Rotate(rotation)
  * Skew(skew_x, skew_y)
  * Scale(scale_x, scale_y)
  * Translate(-pivot_x, -pivot_y)
```

The current Rust model already stores `x`, `y`, `scale_x`, `scale_y`, `rotation`, `skew_x`, `skew_y`, `pivot_x`, and `pivot_y`. The renderer and export must use the same order. Do not calculate a different result in Canvas and SVG.

[KINEORA] Rotation is clockwise in the screen's Y-down coordinate system, normalized for display to a readable range. The stored value may exceed 360° if preserving continuous tween rotation is later required; MVP may normalize after a committed gesture as long as tween behavior is specified.

## 5. Gesture contract

### Move via transform overlay

Move is available from the inside of the box. It shares Selection's command and modifier rules.

```text
pointerdown inside overlay
  -> record selected IDs and inverse transform state
pointermove
  -> preview translation in document space
pointerup
  -> commit one TransformSelection command
```

### Scale

- Corner drag scales on both axes.
- Edge drag scales one axis.
- Opposite handle/corner is the default fixed anchor.
- `Shift` preserves aspect ratio.
- `Alt/Option` scales around the center.
- `Shift+Alt/Option` preserves aspect ratio around the center.
- Prevent zero-sized objects; crossing through zero flips only when an explicit flip policy is enabled.
- Minimum object dimension is 1 document pixel for MVP.

For a rotated object, pointer movement is projected into the object's local axes before scale is computed. This prevents a rotated rectangle from behaving as if it were axis-aligned.

### Rotate

- Drag the rotate handle around the pivot.
- Start angle is measured from pivot to pointerdown.
- Delta is the shortest angular movement while dragging.
- `Shift` snaps to 15° increments. A snap preview should show the target angle before commit.
- `Alt/Option` does not change rotation anchor; it remains reserved for center mode on scale. The pivot marker is the explicit anchor control.

### Skew

[LATER] Edge drag in a visible skew zone modifies `skew_x` or `skew_y`. Skew must be separate from rotation, show an angle HUD, and have a reset action. Do not implement skew by silently baking it into width/height.

### Pivot

[LATER] Dragging the pivot marker updates `pivot_x/y` as a document transform property. For MVP the pivot is center and the marker can be shown read-only. The research decision is important because rotation and scale must already be written around a stable center.

## 6. Modifier matrix

| Modifier | Scale | Rotate | Move |
|---|---|---|---|
| None | Opposite handle is fixed | Free rotation | Free movement |
| Shift | Proportional scale | 15° snap | Optional axis constraint |
| Alt/Option | Center anchor | Reserved | Duplicate only when dragging inside object |
| Shift+Alt | Proportional + center | 15° snap | — |
| Ctrl/Cmd | Temporary Selection | Temporary Selection | — |
| Space | Pan view | Pan view | Pan view |
| Escape | Cancel | Cancel | Cancel |

## 7. Numeric Properties behavior

Numeric editing is not a separate transform algorithm; it produces the same engine command as the overlay.

Fields:

- X, Y: document position.
- W, H: base geometry dimensions, not screen size.
- Scale X, Scale Y: percentages with a chain toggle for proportional changes.
- Rotation: degrees.
- Skew X/Y: disabled until implemented.
- Pivot X/Y: disabled/read-only until pivot editing is implemented.

Commit rules:

- Enter or blur validates and commits one command.
- Escape restores the field's previous value.
- Invalid/non-finite/negative values show an inline error and do not write the engine.
- Multi-selection shows a mixed indicator when values differ.
- Changing W/H with `Constrain proportions` on updates the paired dimension from the captured ratio.
- A numeric edit at a held frame follows the same auto-keyframe policy as a drag.

## 8. Timeline behavior

- The selected object and its owning layer row remain highlighted.
- A transform gesture on a keyframe updates that frame's transform override.
- A transform gesture on a held frame creates an explicit keyframe/override according to the global policy.
- A transform gesture on a classic tween intermediate frame creates an intermediate keyframe or adjusts the tween according to the tween contract; it cannot mutate only the preview and then revert during playback.
- Multi-layer selection commits one command containing all target before/after states.
- Undo restores every target exactly, including absence/presence of a newly created keyframe.

## 9. Model and command contract

The command payload should be absolute, not only a delta, to make undo deterministic:

```text
TransformSelection {
  scene: SceneId,
  frame: u32,
  targets: [
    { node_id, layer_id, before_transform, after_transform }
  ],
  created_keyframes: [...]
}
```

The renderer preview may use a temporary transform map keyed by NodeId. On commit, the Rust engine validates ownership, layer locks, node existence, and frame rules.

[CODE] Existing `TransformSelection`, `patch_transforms`, `transformMath.ts`, and Stage overlay already cover a rectangle/symbol slice. Future path/brush/text nodes must implement `base_bounds` and transform access so the same transform tool works across node types.

## 10. Common failure cases

- Selection box is screen-axis aligned after object rotation.
- Width/height changes move the object unexpectedly because the pivot was not preserved.
- Scaling at 200% zoom uses screen pixels rather than document pixels.
- Rotating an object changes its top-left position instead of rotating around center.
- Alt scale creates a second object accidentally.
- Escape commits a preview because pointer capture cleanup is incomplete.
- Group transform edits children one by one and creates multiple undo entries.
- Locked layer changes in UI but engine rejects only after a visual flash.

Every case needs a test, not only a manual note.

## 11. Acceptance matrix

1. Select one rectangle; drag each of eight handles; opposite corner remains fixed.
2. Shift-drag a corner; aspect ratio stays constant.
3. Alt-drag a corner; center remains fixed.
4. Rotate 45°; overlay and Canvas agree.
5. Shift-rotate; angle snaps to 15° increments.
6. Transform after zoom/pan; result is document-space correct.
7. Transform two objects on different layers; both change together in one command.
8. Undo/redo a multi-object transform; exact states restore.
9. Cancel with Escape; no document change and no undo entry.
10. Numeric X/Y/W/H/rotation edits commit on Enter and blur, cancel on Escape.
11. Mixed multi-selection displays mixed fields and does not overwrite untouched values.
12. Export after rotation; SVG/image matches Canvas content and excludes overlay.
13. Locked or hidden layer blocks transform at both UI and engine boundary.
14. Transform a symbol instance changes only the instance, not the library definition.

## 12. Dependencies and implementation files

Dependencies: Selection state, viewport math, bounds calculation, transform matrix, layer/frame ownership, command history, Properties panel, renderer overlay.

Expected locations:

- `animator/ui/src/editor/transformMath.ts` — pure geometry and handle math.
- `animator/ui/src/components/Stage.tsx` — pointer gesture lifecycle.
- `animator/ui/src/render/canvasRenderer.ts` — transformed content and overlay.
- `animator/core/src/model.rs` — shared Transform and node bounds contract.
- `animator/core/src/command.rs` — TransformSelection invariants.
- `animator/core/src/eval.rs` — transform composition and tween interpolation.
- `animator/core/src/export.rs` — same transform result in export.
- `animator/ui/src/components/PropertiesPanel.tsx` — numeric commit behavior.

Do not add skew/distort/envelope buttons until their model and tests are ready.
