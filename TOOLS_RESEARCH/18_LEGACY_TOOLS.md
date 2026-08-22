# Legacy and Deferred Tools — Research and Product Decision

**Status:** Research complete — batch 3  
**Priority:** Deferred; no implementation before the core 2D animation workflow  
**Related files:** [Brush](04_BRUSH_TOOL.md), [Paint Brush](14_PAINT_BRUSH_ART_PATTERN.md), [PolyStar/Primitives](09_POLYSTAR_PRIMITIVES.md), [Bone/Asset Warp](17_BONE_BIND_ASSET_WARP.md), [Tool index](00_INDEX.md)

## 1. Why this file exists

Adobe Animate contains historical tools and workflows that are useful to document but are not required for a focused modern 2D animation editor. Recording them prevents future confusion about whether a missing button is an oversight or an intentional product decision.

The rule is: **do not show a functional control for a deferred tool.** If a later release implements it, create a dedicated research update and acceptance matrix first.

## 2. Fluid Brush

### Historical behavior

A legacy Fluid Brush provided pressure-responsive ink flow with size, fluid/ink length, and smoothness controls.

### Kineora decision

Do not create a separate Fluid Brush tool in MVP. Fold the valuable parts into [Brush](04_BRUSH_TOOL.md) and [Pencil](03_PENCIL_TOOL.md):

- pressure-to-width;
- taper;
- smoothing;
- flow/opacity response;
- stabilizer.

A future `Ink Flow` option may be added to Brush only after a clear model/rendering contract exists.

### Acceptance for future work

- same gesture with different flow produces deterministic output;
- pressure/tilt works on supported stylus;
- mouse fallback is stable;
- no hidden mode changes;
- one undo per stroke.

## 3. Deco tool

### Historical capability

Deco-style tools generated procedural decorative content such as vines, grids, symmetry, trees, flames, or symbol patterns.

### Kineora decision

Do not implement as a tool rail button before the core editor is complete. Consider separate generators later:

- Symmetry Brush;
- Pattern Fill;
- Vine/foliage generator;
- Procedural particle/scatter generator.

Each generator should output a regular asset/group with a seed, so the result can be saved, copied, and exported deterministically.

## 4. Spray Brush

### Historical capability

Spray Brush scattered repeated symbol instances with random position, scale, rotation, and density.

### Kineora decision

Defer. If implemented, it becomes a `Scatter Tool` with:

```text
ScatterSettings {
  asset_id,
  count_or_density,
  radius,
  scale_range,
  rotation_range,
  spacing,
  seed,
  align_to_path
}
```

The seed is stored so reopening the project does not reshuffle the artwork. A scatter gesture creates one group/command, not hundreds of unrelated undo steps.

## 5. 3D tools

3D Rotation/Translation were historically available for certain Animate document types. Kineora's target is comfortable 2D animation first.

- Do not add 3D tool buttons in the 2D MVP.
- Camera/layer-depth parallax in [Camera](16_TIME_SCRUBBER_CAMERA.md) provides a useful 2.5D result without exposing full 3D authoring.
- A future 3D layer must have a separate research file and model migration plan.

## 6. Runtime/interactivity tools

ActionScript-era debugger/interactivity controls are outside the first offline animation editor. Dynamic/Input text is separately specified in [Text](15_TEXT_TOOL.md), but runtime code generation is later.

Do not expose ActionScript, SWF, or obsolete publish controls as if they are supported.

## 7. Product prioritization

### Ship before legacy tools

1. Select/Transform.
2. Pencil/Pen.
3. Brush/Bucket/Eraser.
4. Geometric primitives.
5. Subselection/Width.
6. Unified Layers+Timeline.
7. Properties.
8. Stage navigation.
9. Camera/export.

### Consider after MVP

- Paint Brush Art/Pattern.
- Text/dynamic text.
- Symbols/library improvements.
- Audio/lip-sync.
- Bone/Bind/Asset Warp.
- Generators/scatter.

## 8. UI policy

- Deferred tools do not appear in the default Tools rail.
- Help/roadmap may list them as `Planned`, never `Functional`.
- A disabled control is allowed only when context disables a fully implemented tool; a missing future feature should be represented as a roadmap entry or hidden.
- Tool shortcuts are not reserved until the feature is implemented.

## 9. Research gate for any future legacy tool

Before implementation:

- define exact input/output node model;
- define deterministic seed/serialization if procedural;
- define timeline/keyframe behavior;
- define undo size and performance limits;
- define Canvas/export parity;
- define mobile/touch fallback;
- add acceptance tests and update `19_TOOL_COMMAND_MATRIX.md`.
