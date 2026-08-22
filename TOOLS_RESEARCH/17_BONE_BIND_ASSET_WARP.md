# Bone, Bind, and Asset Warp Tools — Research and Implementation Contract

**Status:** Research complete — batch 3  
**Priority:** P2 advanced character animation; after basic vector animation is stable  
**Shortcuts:** Bone `M`; Bind and Asset Warp configurable/no default  
**Related files:** [Pen](07_PEN_TOOL.md), [Subselection](10_SUBSELECTION_TOOL.md), [Free Transform](02_FREE_TRANSFORM_TOOL.md), [Camera](16_TIME_SCRUBBER_CAMERA.md), [Bone blueprint](../animate-blueprint/14_bone_ik.md)

## 1. Scope

These are advanced tools. They must be fully specified now but should not delay the first release where users can draw, color, keyframe, tween, and export simple 2D animation.

- **Bone:** creates/poses a skeletal chain.
- **Bind:** edits which shape points a bone influences.
- **Asset Warp:** deforms a vector/bitmap asset with pins and a mesh.

They share the Timeline, Properties, command, undo, and export contracts with ordinary artwork.

## 2. Bone tool targets

### Symbol armature

Bones connect separate symbol instances such as upper arm, forearm, and hand. Each instance remains a rigid piece; the rig solves local transforms.

### IK shape

Bones are carved into one vector shape and deform its control points. This needs point bindings/weights and stronger geometry constraints. If the selected path is too complex, the tool must offer a deliberate conversion/duplicate workflow, never silently destroy the original.

## 3. Bone data model

```text
Armature {
  id: ArmatureId,
  bones: [Bone],
  bindings: [Binding],
  target_mode: SymbolInstances | IKShape,
  solver: Analytic2Bone | FABRIK | CCD
}

Bone {
  id: BoneId,
  parent_id: Option<BoneId>,
  length,
  local_rotation,
  local_translation,
  rotation_constraint: { enabled, min, max, locked },
  translation_constraint: { x, y },
  joint_speed,
  spring: Option<{ strength, damping }>
}

Pose {
  bone_states: [{ bone_id, local_rotation, local_translation }]
}
```

All stored bone transforms are local to their parent, with stable IDs. This prevents copy/paste, scaling, and reparenting from corrupting poses.

## 4. Create armature workflow

### Symbol chain

1. Prepare symbol instances on editable layers; set pivots using Free Transform.
2. Activate Bone.
3. Click the root instance.
4. Drag from root joint/pivot to the next instance.
5. Continue parent-to-child until the chain is complete.
6. Commit one `CreateArmature` command.
7. The unified Timeline creates/selects a Rig/Pose track.

### IK shape

1. Select one compatible vector shape.
2. Activate Bone and drag inside the shape to create root bone.
3. Drag from bone tail to create child bones.
4. Bind points using Bind if default weights are wrong.
5. Commit armature conversion as one command with an undoable original snapshot.

## 5. Pose workflow and solve

```text
pointerdown on bone/end effector
  -> capture armature + current pose
pointermove
  -> target = pointer in document/local space
  -> solve chain with selected solver
  -> apply constraints
  -> preview solved pose
pointerup
  -> commit one Pose command on current pose keyframe
```

Solver policy:

- Two-bone limbs use deterministic analytic solve.
- Longer chains use FABRIK by default.
- CCD is optional for rotation-sensitive rigs.
- Unreachable target: fully extend toward target.
- Bend direction: preserve current bend or use explicit bend-side toggle.
- Constraints are applied after each solve iteration and once at final output.

During playback, interpolate stored pose values; do not run live IK every frame.

## 6. Bone Properties

- parent/child navigation;
- length;
- local rotation;
- rotation min/max and lock;
- translation x/y enable;
- joint speed;
- spring strength/damping;
- solver and bend direction;
- bind preview/weight mode.

Visual constraint wedges appear around joints while Bone is active. A blocked solve shows the reason, such as `Target outside constrained range`.

## 7. Bind tool

### Purpose

Bind maps vector control points to bones for IK shape deformation.

### Interaction

- Click bone: its affected points highlight.
- Click point: its affecting bones highlight.
- Shift-click/drag: add points to a bone.
- Ctrl/Cmd/Option-click: remove points.
- Weight display: single influence as square, multiple influences as gradient/triangle; exact glyph can be original.
- Numeric weight editor is available in Properties for precise values.

### Model

```text
Binding {
  bone_id,
  point_id,
  weight: 0..1
}
```

Weights for a point normalize to 1. Removing the final binding falls back to nearest-bone only after an explicit warning.

## 8. Asset Warp

### Purpose

Warp vector or bitmap content with pins/mesh. It is useful for flags, cloth, hair, breathing, and simple puppet motion without a cut-out rig.

### Workflow

1. Select a compatible vector/bitmap asset.
2. Activate Asset Warp.
3. Click to add pins; the mesh preview appears.
4. Drag pins to deform; pointermove shows a renderer-only preview.
5. Toggle Rigid/Flexible mode in Tool Properties.
6. Insert a keyframe for the warped state at another frame and move pins.
7. Tween pin positions where topology remains constant.

### Model

```text
WarpAsset {
  id,
  source_node_id,
  mode: Rigid | Flexible,
  mesh: { vertices, triangles },
  pins: [{ id, vertex_ids, x, y, stiffness }],
  per_frame_states: { frame -> pin_positions }
}
```

The mesh topology is stable across a tween. Adding/removing pins is a topology command and may break an existing span; require explicit confirmation.

### Deformation policy

- Rigid mode uses local rigid/as-rigid-as-possible influence.
- Flexible mode allows smooth interpolation over nearby mesh vertices.
- Vector base path remains recoverable.
- Bitmap uses texture coordinates and mipmaps; export uses the same mesh solve.
- Reset Warp returns the current frame pins to the base pose.

## 9. Timeline rules

- Bone armature creates a Pose/Rig track; pose keyframes are diamonds.
- Asset Warp uses a Warp track or object property keys.
- Bone/warp edits at held frames auto-key/copy only after the global policy is applied.
- Keyframe spans interpolate poses/pins, not arbitrary path topology.
- Locked/hidden tracks block edits.
- One completed pose/warp drag = one command.

## 10. Relationship to other tools

- Free Transform sets pivots before rigging.
- Selection selects whole symbols/rigs; Bone selects bones/end effectors.
- Subselection edits base paths; it must warn when a rigged shape has multiple poses.
- Width edits a stroke before it is bound; binding does not replace stroke width data.
- Camera exports the solved/posed result.
- Export never includes bone lines, pins, weights, constraint wedges, or mesh guides.

## 11. Errors and safeguards

- Multiple armatures on one pose layer: reject or create a new track.
- Node already belongs to another armature: ask to detach/duplicate.
- Symbol instance not editable: enter symbol context or create a copy.
- Too-complex shape: show conversion preview; preserve original on cancel.
- Pin topology change within tween: confirm and explain broken span.
- Locked/hidden layer/track: block before preview.
- Solver fails/non-finite: keep previous pose and show `Pose could not be solved`.

## 12. Acceptance matrix

1. Create a shoulder→elbow→wrist symbol armature.
2. Drag hand target; elbow/shoulder solve and respect constraints.
3. Unreachable target straightens without exploding lengths.
4. Insert poses at frames 1 and 20; playback interpolates stored poses.
5. Copy/paste a rig; stable IDs and poses remain correct.
6. Reparent a bone with explicit confirmation; local transforms remain stable.
7. Bind an IK shape; selected points follow the intended bone.
8. Remove/add a binding and weights remain normalized.
9. Asset Warp pins deform vector and bitmap assets.
10. Warp pin keyframes interpolate and export consistently.
11. Topology changes require an explicit confirmation.
12. Locked/hidden track blocks operations.
13. Undo restores armature, pose, bind map, or warp pins exactly.
14. Save/load preserves rig/warp state.
15. Export has no authoring rig overlays.

## 13. Dependencies and code map

Dependencies: symbol/library system, Path/mesh model, local transform math, solver, constraints, keyframe/tween, selection, Properties, renderer overlay, export.

Expected locations:

- `animator/ui/src/editor/boneTool.ts`
- `animator/ui/src/editor/bindTool.ts`
- `animator/ui/src/editor/assetWarpTool.ts`
- `animator/core/src/rig.rs`
- `animator/core/src/ik.rs`
- `animator/core/src/warp.rs`
- `animator/core/src/model.rs`
- `animator/core/src/command.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/export.rs`

## Adobe source references

- [Bone tool animation in Animate](https://helpx.adobe.com/animate/using/bone-tool-animation.html)
- [Character rigging in Animate](https://helpx.adobe.com/animate/using/character-rigging-in-animate.html)
- Existing source: `animate-blueprint/02d_tools_utility.md` T2D.8–T2D.11
- Existing source: `animate-blueprint/14_bone_ik.md`
