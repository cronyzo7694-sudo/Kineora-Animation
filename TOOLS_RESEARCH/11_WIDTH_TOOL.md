# Width Tool — Research and Implementation Contract

**Status:** Research complete — batch 2  
**Priority:** P1 for professional line art  
**Shortcut:** `U`  
**Related files:** [Pencil](03_PENCIL_TOOL.md), [Paint Brush research](../animate-blueprint/02c_tools_painting.md), [Subselection](10_SUBSELECTION_TOOL.md), [Pen](07_PEN_TOOL.md)

## 1. Purpose

Width makes a stroke variable-width after it has been drawn. This is important for cartoon line quality: thick outer contours, tapered hair, expressive limbs, and calligraphic accents cannot be achieved with one constant stroke width.

Width edits the stroke's width profile, not its centerline geometry:

- Subselection moves the path.
- Width changes the left/right offset from the path.
- Selection/Transform moves/scales the entire stroke.

## 2. Adobe behavior and Kineora decision

[ADOBE] Adobe's Width tool exposes width points along a stroke. Dragging a width point changes the stroke thickness; the width can be symmetric or asymmetric. Width profiles can be saved/reused.

[KINEORA] Keep width points but make the hit behavior obvious. A width point is never created accidentally by clicking a path; the cursor must show the width handle before a click/drag. Profiles are reusable style assets, but applying a profile is an explicit command.

## 3. UI and options

- Tools rail: Cleanup/Stroke group.
- Shortcut: `U`.
- Tool Properties:
  - active stroke name/ID;
  - selected width point position along path;
  - left width and right width;
  - total width;
  - cap/join/miter settings;
  - Save Profile, Apply Profile, Reset Profile.
- On-stage:
  - width point marker perpendicular to the stroke;
  - left/right handles;
  - a temporary numeric label such as `t=0.42, L=8px, R=5px`;
  - selected point highlighted.

Minimum hit target is 10 CSS px desktop and 44 CSS px touch, independent of stroke width.

## 4. Width profile model

```text
WidthProfile {
  points: [
    {
      t: 0..1,          // normalized path distance, not array index
      left: number,     // document units
      right: number,
      mode: Symmetric | Asymmetric
    }
  ],
  interpolation: Linear | Smooth,
  start_cap: Butt | Round | Square,
  end_cap: Butt | Round | Square
}
```

- `t` is cumulative arc-length fraction so editing/subselection of the path can remap width points by nearest path distance.
- Default profile has points at 0 and 1 with equal width.
- Width values are non-negative and finite.
- A zero width point is allowed for a taper but the renderer must avoid numerical spikes.

## 5. Interaction

### Select a stroke

1. Activate Width.
2. Hover an editable stroke; show its centerline/width points.
3. Click the stroke to make it the active width target.
4. If several strokes overlap, use Alt/Option or click cycle only when the UI indicates the stack.
5. Locked/hidden/symbol-definition boundaries are respected.

### Add width point

- Double-click the stroke at a location where no width point exists, or choose `Add Width Point` from context menu.
- New point inherits interpolated width at `t`.
- Adding a point is one undo command.

### Edit width

```text
pointerdown on width handle
  -> capture stroke ID, width point ID, before profile
pointermove
  -> update left/right width in document units
  -> Alt/Option = edit one side independently
  -> Shift = constrain/symmetric depending on current mode
  -> render stroke outline preview
pointerup
  -> commit one SetWidthProfile command
```

- Drag both handles or the midpoint = symmetric width.
- Alt/Option drag one side = asymmetric width.
- Drag the width point along the stroke = change `t`, not thickness.
- Delete width point from context menu; endpoints cannot both be removed because a valid default width is needed.
- Reset Profile = one undoable command.

## 6. Stroke outline generation

The renderer computes a left and right offset from the centerline using local tangents. At corners, cap/join policy resolves joins:

- round joins for cartoon ink default;
- miter joins with a finite miter limit;
- bevel joins to avoid long spikes;
- round/butt/square caps at open endpoints.

Self-intersections are allowed for preview but should be repaired/flattened during export if the target format requires a simple fill outline. The authored centerline/profile remains the source of truth.

[KINEORA] Width editing must not bake the stroke into an opaque fill on every drag. Keep the centerline and profile editable; bake only on explicit `Convert Lines to Fills`.

## 7. Timeline behavior

- Width profile is part of the stroke node's authored style/geometry for the current keyframe.
- A width edit on a keyframe changes that frame.
- On a held frame, use the global auto-key/copy policy.
- A transform-only tween may interpolate width only if the tween specification explicitly includes width; otherwise the profile holds.
- Width topology between keyframes is not automatically shape-tweened in MVP.
- One width-drag gesture = one undo entry.

## 8. Relation to brush and paint brush

- Pencil/Line/Pen strokes can be edited by Width.
- Paint Brush art/pattern strokes may expose a width profile that changes the brush spine width, but brush-specific scaling/stretching still belongs to [Paint Brush research](../animate-blueprint/02c_tools_painting.md).
- Brush filled regions do not use Width; resize them with Transform or edit their boundary with Subselection after conversion.
- Eraser can split a stroke; each fragment inherits a remapped portion of the width profile.

## 9. Profiles

A reusable profile is an asset:

```text
WidthProfileAsset {
  id,
  name,
  points,
  interpolation,
  cap/join defaults
}
```

- Save Profile copies the current values; it does not link future changes.
- Apply Profile samples the profile onto the active stroke length and commits one command.
- Delete/rename profile is a Library/style command, not a stroke geometry command.
- Profiles are document-local in MVP; app-level library later.

## 10. Errors and safeguards

- Non-stroke target: `Width works on strokes, not filled regions.`
- Primitive not baked: `Bake primitive to edit its stroke width.`
- Locked/hidden layer: blocked.
- No active stroke: no-op with guidance.
- Width point outside path: clamp to 0..1.
- Negative/non-finite width: reject.
- Stroke fragment after erase: remap profile deterministically; if mapping fails, preserve a constant average width and warn in debug only.

## 11. Acceptance matrix

1. Activate Width over Pencil stroke; width points appear only on hover/selection.
2. Drag a point symmetrically; both sides update.
3. Alt-drag one side; asymmetric profile persists.
4. Move a width point along the path; thickness remains, location changes.
5. Add/delete width point with one undo each.
6. Reset Profile restores constant/default width.
7. Cap/join settings render consistently on Canvas and export.
8. Save/load preserves profile and point positions.
9. Erase-split stroke keeps sensible width on both fragments.
10. Width edit on frame 10 does not change frame 1.
11. Locked/hidden/tween guard works.
12. Transforming a variable-width stroke preserves its editable profile.
13. Export includes variable width but no width handles.
14. Pointercancel/Escape during a drag restores the original profile.
15. Apply/Save profile does not unexpectedly modify unrelated strokes.

## 12. Dependencies and code map

Dependencies: StrokeNode/Path, arc-length sampling, width tessellation, cap/join rendering, Subselection path editing, Eraser fragment remapping, Library/profile assets, keyframes, export.

Expected locations:

- `animator/ui/src/editor/widthTool.ts`
- `animator/core/src/model.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/command.rs`
- `animator/core/src/edit_ops.rs`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/export.rs`
- `animator/ui/src/components/PropertiesPanel.tsx`

## Adobe source references

- [Using Paint Brush in Animate](https://helpx.adobe.com/in/animate/desktop/using/working-with-paint-brush.html)
- Existing source: `animate-blueprint/02c_tools_painting.md` T2C.6
