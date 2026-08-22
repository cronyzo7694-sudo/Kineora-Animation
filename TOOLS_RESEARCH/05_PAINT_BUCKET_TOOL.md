# Paint Bucket Tool — Research and Implementation Contract

**Status:** Research complete — batch 1  
**Priority:** P0 for fast cartoon coloring  
**Shortcut:** `K`  
**Primary existing references:** `animate-blueprint/02d_tools_utility.md` T2D.2, `animate-blueprint/06_shape_system.md`, and `animate-blueprint/23_color.md`

## 1. Purpose

Paint Bucket fills an enclosed vector region without requiring the user to select the region first. It is essential for cartoon workflows: draw line art, choose a fill, click inside face/shirt/background regions, and continue.

It is not the same as Brush:

- Brush paints along a drag path.
- Bucket identifies a closed region and fills it.

## 2. Adobe behavior to retain

[ADOBE] Adobe's Paint Bucket fills empty or already-painted enclosed areas, supports solid/gradient/bitmap fills, and offers Gap Size options so near-closed outlines can still be filled. Lock Fill allows a gradient/bitmap fill to remain continuous across multiple filled areas. Some workflows allow dragging across contours and filling all regions.

[KINEORA] MVP starts with reliable vector flood-fill for closed paths and a clearly bounded gap-tolerance algorithm. Gap closing must never leak across the entire canvas without warning. The cursor should preview the target region before click.

## 3. UI and options

- Left Tools rail: Utility/Color group.
- Shortcut `K`.
- Tool Properties:
  - Fill style: current solid/gradient/bitmap style.
  - Gap tolerance: None / Small / Medium / Large, with numeric document-pixel meaning in an advanced popover.
  - Fill all regions: off by default.
  - Lock Fill: off by default for solid; available for gradient/bitmap.
  - Reference scope: Active layer by default; P1 option All visible unlocked layers (read-only references, output still on active layer).
- Cursor: bucket icon plus a small color chip.
- Hover preview: highlight the resolved region with a translucent overlay and show a tooltip if the region is open or blocked.

## 4. Region definition

A region is computed from vector geometry visible in the active edit context at the current frame:

1. Collect fill boundaries and stroke centerlines/widths from eligible objects.
2. Transform all geometry into document space.
3. Apply the chosen fill rule: non-zero winding for normal vector paths; even-odd only when the node declares it.
4. Build a planar arrangement or equivalent region graph.
5. Find the face containing the pointer.
6. Resolve the face boundary and its style target.

[ KINEORA ] The bucket must work on line art created by Pencil even when the line and fill are separate nodes. It should not require the artist to merge every line into one special shape. The default reference scope is the active layer; a P1 `All visible unlocked layers` scope may read other layers while committing the new fill to the active layer.

## 5. Gap tolerance

The UI labels must explain the behavior:

| Setting | Behavior |
|---|---|
| None | Only genuinely closed boundaries fill |
| Small | Bridges small gaps up to a conservative threshold |
| Medium | Bridges moderate gaps; preview warns about approximation |
| Large | Bridges larger gaps; requires confirmation if the result touches canvas boundary |

Implementation options include stroke expansion plus a controlled morphological close or planar graph endpoint connection. The chosen algorithm must be deterministic and bounded.

Safeguards:

- Never close a gap larger than the selected threshold.
- Never treat the stage boundary as an invisible wall unless the user explicitly enables `Fill to stage edge` later.
- If the region reaches the entire document or becomes ambiguous, show `Region is open or too large` and do not commit.
- Preview the actual region so the user can undo a wrong fill immediately.

## 6. Gesture contract

```text
pointermove
  -> hit-test region under pointer
  -> compute preview region (throttled)
  -> show highlight and selected fill chip
pointerdown
  -> capture the current region identity and current FillStyle
pointerup
  -> recompute/validate region from authoritative engine state
  -> if valid, commit one BucketFill command
  -> if invalid, no mutation + reason toast
```

A simple click fills one region. Drag-fill is optional P1: while dragging, sample each crossed region and create one command containing all unique region fills. Do not implement drag-fill by repeatedly committing commands.

Fill all regions, when enabled, fills all regions that match the starting target according to the approved color/region rule. It must show a count in the preview, for example `12 regions`.

## 7. Style and Lock Fill

- Solid Fill: copy current color/alpha into the target region.
- Linear/Radial Gradient: apply the current gradient definition.
- Lock Fill: store the gradient/bitmap coordinate matrix in document coordinates at the gesture start. All regions filled by that gesture use the same matrix.
- No Fill: disabled action with an explanation; bucket cannot create an invisible region.
- Existing fill: Bucket replaces the target fill style and preserves its boundary.

The selected region must remain a vector region. It must not be rasterized merely because a gradient was applied.

## 8. Model contract

For an object-based vector model, a fill operation can be represented as:

```text
BucketFill {
  scene,
  layer,
  frame,
  target: RegionTarget {
    source_node_ids,
    boundary_hash,
    region_index
  },
  before_style,
  after_style: FillStyle,
  lock_fill_matrix: Option<Matrix>,
  gap_tolerance
}
```

If the current vector model stores a shape with multiple fill regions, update only the selected region. If the region is created from separate Pencil strokes, create a new fill node behind/above the line art according to the active paint policy.

The command must store enough `before` data for exact undo and enough target identity to fail safely if the geometry changed between preview and release.

## 9. Timeline behavior

- Bucket fills the current frame only.
- On a blank keyframe, it creates a new fill.
- On a held frame, it auto-keys/copies prior content according to the global policy before changing the fill.
- On a tween span, it is blocked by default; a fill change at an intermediate frame cannot be represented by a transform-only tween.
- A bucket click never changes the playhead.
- One click/gesture = one undoable command, even when multiple regions are filled.

## 10. Common errors

- `No closed region under pointer.`
- `Gap is larger than the selected tolerance.`
- `Layer is locked or hidden.`
- `Cannot paint into a tween span.`
- `Fill operation is ambiguous or too large.`
- `Selected fill style is invalid.`

If a fill would cover the entire stage, require a second click/confirmation only for Large gap mode; otherwise reject with a helpful message. Never silently fill the whole document.

## 11. Acceptance tests

1. Draw a closed Pencil outline; hover inside shows region preview.
2. Click a closed region; correct FillStyle appears and one undo removes it.
3. Click an already-filled region; style changes but geometry stays intact.
4. Open a contour by a 1px gap; None rejects it, Small fills it if within threshold.
5. A gap larger than threshold is not bridged.
6. Fill adjacent regions separately; they remain independent.
7. Lock Fill applies a continuous gradient across a multi-region drag/sequence.
8. Fill all regions reports the number and fills only the intended set.
9. Zoom/pan does not change the selected region.
10. Hidden/locked content is not used as a target in the default active-layer context.
11. Fill at frame 10 does not modify frame 1.
12. Export includes the fill and excludes region preview/selection overlay.
13. Save/load preserves the fill and exact style.
14. Pointercancel/Escape before commit creates nothing.
15. The engine rejects stale/invalid region targets without partial mutation.

## 12. Dependencies and implementation files

Dependencies: vector path model, stroke expansion, planar region solver, FillStyle, current frame/layer, command history, renderer preview, export.

Expected locations:

- `animator/ui/src/editor/bucketTool.ts`
- `animator/core/src/edit_ops.rs` — region/fill operations
- `animator/core/src/model.rs` — FillStyle and region-capable nodes
- `animator/core/src/command.rs` — BucketFill command
- `animator/core/src/eval.rs` — resolved geometry
- `animator/ui/src/render/canvasRenderer.ts` — hover preview
- `animator/core/src/export.rs` — vector fill output
- `animator/core/src/wasm.rs` / `ui/src/engine/client.ts` — bridge

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Strokes, fills, and gradients with Animate](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- Existing detailed source: `animate-blueprint/02d_tools_utility.md` T2D.2
