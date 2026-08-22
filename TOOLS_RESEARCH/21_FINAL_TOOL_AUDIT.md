# Final Tool Cross-Audit and Implementation Gate

**Status:** Cross-audited baseline — batch 4  
**Date:** 2026-08-23  
**Scope:** all tool research files `01`–`20`  
**Rule:** this file resolves conflicts; a coding agent must follow this file when two older notes differ.

## 1. Audit result

The tool research folder now contains a complete contract for every planned tool family:

- selection, transform, path construction, drawing, painting, color application;
- geometric primitives;
- vector cleanup;
- viewport navigation;
- text;
- camera and time scrubbing;
- advanced rigging/warp;
- legacy/deferred tools;
- command/event map;
- integrated acceptance matrix.

All relative Markdown links in `TOOLS_RESEARCH/` resolve. Files `01`–`18` are tool contracts; `19` is the shared mutation matrix; `20` is the cross-tool QA matrix. This file is the conflict-resolution and implementation gate.

No tool code is approved until the implementation follows the decisions below.

## 2. Source hierarchy

1. This audit resolves conflicts inside `TOOLS_RESEARCH/`.
2. The existing repository blueprint is the product research base: `animate-blueprint/`.
3. `MASTER_FEATURE_INVENTORY/` and `engineering/` provide traceability and architecture.
4. Adobe documentation is a behavior reference, not source code or branding to copy.
5. Existing code is evidence of what is implemented, not authority for missing features.

Adobe references used across the tool files:

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Basic tools in Animate](https://helpx.adobe.com/in/animate/desktop/using/basic-tools.html)
- [Drawing in Animate](https://helpx.adobe.com/animate/using/drawing.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- [Strokes, fills, and gradients](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- [Paint Brush in Animate](https://helpx.adobe.com/in/animate/desktop/using/working-with-paint-brush.html)
- [Timeline in Animate](https://helpx.adobe.com/animate/using/timeline.html)
- [Authoring panels and Properties inspector](https://helpx.adobe.com/animate/using/authoring-panels.html)
- [Layers](https://helpx.adobe.com/animate/using/timeline-layers.html)
- [Camera](https://helpx.adobe.com/animate/using/working-with-camera-in-animate.html)
- [Bone tool](https://helpx.adobe.com/animate/using/bone-tool-animation.html)

## 3. Final tool priority

### P0 — basic 2D animation must work

- Selection / Move / Marquee
- Free Transform: move, scale, rotate
- Pencil
- Pen basic create/close/finish
- Brush basic filled paint
- Paint Bucket basic vector region fill
- Eraser normal/fills/lines
- Line, Rectangle, Oval
- Hand and Zoom
- Fill/stroke/color basics
- Current frame/layer target and undo/redo

### P1 — professional usability

- Pen topology sub-modes
- Subselection
- Width
- Rectangle/Oval/PolyStar primitives
- Eyedropper and Ink Bottle
- Stage Rotate
- Paint Brush Art/Pattern
- Static Text
- Camera
- Onion/selection/snap refinements

### P2 — advanced authoring

- Time Scrubber
- Dynamic/Input Text
- Camera presets and layer depth
- Bone, Bind, Asset Warp
- Advanced gradients/bitmap fills
- motion-path/shape-tween editing

### Deferred / no separate MVP button

- Fluid Brush as a separate tool
- Deco generator
- Spray Brush/scatter
- Legacy 3D tools
- SWF/ActionScript-specific controls

A feature may move up only after its model, command, renderer, exporter, and acceptance tests are ready.

## 4. Shortcut conflict resolution

The existing shortcut research contains two conflicts: `O` was listed both for Oval and Onion Skin, and `D` was mentioned for both color reset and expose-drawing. The following table is authoritative.

| Tool/action | Final default |
|---|---|
| Selection | `V` |
| Subselection | `A` |
| Free Transform | `Q` |
| Gradient Transform | `F` when implemented |
| Lasso | `L` when implemented |
| Pen | `P` |
| Text | `T` |
| Line | `N` |
| Rectangle/Oval/Primitive flyout | `R` / `O` |
| Pencil | `Shift+Y` |
| Paint Brush | `Y` |
| Brush | `B` |
| Eraser | `E` |
| Width | `U` |
| Eyedropper | `I` |
| Paint Bucket | `K` |
| Ink Bottle | `S` |
| Bone | `M` |
| Camera | `C` |
| Hand | `H` |
| Zoom | `Z` |
| Stage Rotate | `Shift+H` |
| Time Scrubber | `Shift+Alt+H` |
| Temporary Hand | hold `Space` |
| Temporary Selection | hold `Ctrl/Cmd` where safe |
| Onion Skin toggle | `Shift+O` |
| Onion Skin outlines | `Ctrl+Shift+O` |
| Expose same drawing | `D` |
| Reset fill/stroke colors | visible Color-panel button; no global default key |
| Graph Editor | `Ctrl+Alt+G` when implemented |
| Ungroup | retain `Ctrl+Shift+G` |
| Remove Transform | menu/button; no default shortcut |

Rules:

- `O` is always Oval; it can never also be Onion Skin.
- `D` is Expose Same Drawing. Color reset remains a visible action and may be rebound by the user.
- Text fields, numeric fields, dialogs, and palette inputs consume text keys before the global tool dispatcher.
- Shortcuts are data-driven, conflict-checked, and rebindable. A shortcut can be temporarily shadowed only when focus is inside a text/edit control.
- The UI must show the active tool and its shortcut in the tooltip; no undocumented shortcuts.

## 5. Final shared input contract

Every content tool follows:

```text
activate
  -> show active state, cursor, Tool Properties, tooltip
pointerdown
  -> screen -> document conversion
  -> validate document/scene/layer/frame context
  -> capture pointer and snapshot settings
pointermove
  -> update editor-only preview at most once per render frame
pointerup
  -> revalidate against authoritative engine state
  -> commit one atomic command
  -> emit document:changed / timeline:changed as applicable
pointercancel / Escape / blur / tool switch
  -> release pointer capture
  -> discard preview
  -> emit no document command
```

View/transport tools use the same capture lifecycle but commit only view/session state. Eyedropper sampling is session state; style application is a document command.

## 6. Final coordinate and view rules

There are four coordinate spaces:

1. **Screen:** CSS/client pointer coordinates.
2. **Viewport/document:** stage-space coordinates after inverse view zoom/pan/rotation.
3. **Camera/world:** document content transformed by animatable Camera state.
4. **Export:** output pixel/vector coordinates after camera and stage clipping.

Rules:

- Drawing, selection, transforms, bucket regions, eraser geometry, and anchors use document coordinates.
- Hand, Zoom, and Stage Rotate modify only `ViewportState`.
- Camera modifies evaluated scene output and is exported.
- Object Transform modifies node data and is exported.
- Rulers/guides/grid are document-space overlays rendered through the viewport matrix.
- Selection, handles, cursor previews, onion skin, snap hints, bone lines, pins, and safe-area borders never enter export.

## 7. Final layer/frame target rules

Every content command resolves:

```text
active document
  -> active scene
  -> active normal/content layer
  -> playhead frame
  -> editable content/keyframe
```

Validation order:

1. document exists;
2. scene exists;
3. target layer/track exists;
4. target is visible and unlocked;
5. target is compatible with the tool;
6. current frame is writable;
7. target node/path/version still matches preview;
8. all numeric/geometry values are finite and bounded;
9. apply atomically.

### Auto-key policy

For MVP, **Auto-Key is ON by default for content edits on a held frame** because an animator expects editing the visible frame to preserve earlier content. The engine:

1. creates a keyframe at the playhead;
2. copies content from the nearest previous content keyframe;
3. applies the edit;
4. records keyframe creation plus edit in the same undo command;
5. shows a non-blocking toast: `Keyframe created at frame N`.

A user preference can disable Auto-Key later. When disabled, the tool shows `Create keyframe to edit this frame` and provides an explicit action. This preference does not change F6 semantics.

### Paint reference scope

Bucket and Brush expose a visible reference-scope option. `Active layer` is the deterministic MVP default. `All visible unlocked layers` is a P1 option for line-art-on-one-layer/color-on-another workflows; referenced layers are read-only and the resulting fill is committed to the active layer. Hidden/locked layers are excluded.

### Tween-layer rule

New geometry and topology changes on a tween span are blocked by default. The UI may offer an explicit `Create keyframe and break/branch tween` action only after that operation has a complete command/test contract. No tool silently corrupts a tween.

## 8. Final object and style model

The current code has only `Rect` and `SymbolInstance`. The tool implementation must introduce a shared model rather than one custom field per tool:

```text
Node =
  Path { path, fill, stroke, transform }
  Stroke { path, stroke_style, width_profile, transform }
  FillPaint { source_path, boundary, fill_style, transform }
  RectPrimitive { params, fill, stroke, transform }
  EllipsePrimitive { params, fill, stroke, transform }
  PolyStarPrimitive { params, fill, stroke, transform }
  BrushStroke { brush_id, spine, mapping, width_profile, transform }
  Text { text, layout, style, transform }
  Bitmap { asset_id, transform }
  SymbolInstance { symbol_id, loop, transform }
  WarpAsset { source, mesh, pins, transform }
```

Shared style types:

```text
FillStyle = None | Solid(RGBA) | LinearGradient | RadialGradient | BitmapFill
StrokeStyle = { color, width, cap, join, miter_limit, dash, width_profile }
```

Style rules:

- Each content gesture snapshots the current style at `pointerdown`; the snapshot is used for preview and commit. Future style changes affect the next gesture only.
- Editing the current style does not mutate existing artwork unless an explicit selection/style command is invoked.
- Alpha is independent from RGB.
- Eyedropper, Properties, Ink Bottle, Bucket, Brush, Pencil, Pen, and primitives use the same style commands.
- `Object` drawing mode is the safe default; `Merge` mode is explicit and uses the boolean engine.

## 9. Final command/event contract

### Commands

```text
MoveSelection
TransformSelection
DrawStroke
DrawFill
DrawPath
DrawShape
CreatePrimitive
PatchPrimitiveParams
BakePrimitiveToPath
PathEdit
AddAnchor
DeleteAnchor
ConvertAnchor
SetWidthProfile
BucketFill
Erase
SetFillStyle
SetStrokeStyle
DrawBrushStroke
CreateText
EditText
SetCamera
SetPose
SetBinding
SetWarpPose
```

Commands must be atomic, validated in the engine, and store enough before/after data for exact undo/redo. Selection/marquee, viewport, playhead, tool activation, and Eyedropper sampling are not document commands.

### Events

```text
tool:changed
selection:changed
viewport:changed
playhead:moved
document:changed
timeline:changed
layer:changed
engine:error
```

Every panel refreshes from authoritative engine status after a document event. UI local state is permitted only for an in-progress preview or field draft.

## 10. Final dependency graph

```text
Foundation
  ├─ document/scene/layer/frame context
  ├─ viewport matrix + pointer capture
  ├─ tool registry + shortcut scope
  ├─ FillStyle/StrokeStyle
  ├─ command/undo/event bridge
  └─ renderer preview channel

Path foundation
  ├─ Path/Anchor/Bézier
  ├─ stroke outline + caps/joins
  ├─ fill tessellation/winding
  ├─ bounds/hit-test
  └─ SVG/raster export parity

Selection/Transform
  ├─ path/primitive/node bounds
  ├─ layer/frame guards
  └─ Properties numeric patches

Drawing
  ├─ Pen + Pencil
  ├─ Subselection
  ├─ Width
  └─ Line/Rect/Oval/PolyStar primitives

Painting
  ├─ Brush dabs/fill boundary
  ├─ region solver + gap tolerance
  ├─ Eraser boolean subtraction
  └─ Eyedropper/Ink Bottle style commands

Advanced
  ├─ Paint Brush asset mapping
  ├─ Text Engine
  ├─ Camera track/matrix
  └─ Bone/Bind/Warp engines
```

No downstream tool may bypass a missing upstream dependency by faking its output with a rectangle or screenshot.

## 11. Final implementation order after the research gate

### Phase 0 — contracts and migration

- Freeze tool IDs, shortcuts, events, commands, and shared style types.
- Add model migration/version tests.
- Preserve current Rect/Symbol behavior.
- Add a generic tool dispatcher and preview channel.

### Phase 1 — vector foundation

- Add Path/Anchor, StrokeStyle, FillStyle, Stroke/Path nodes.
- Add deterministic Bézier evaluation, stroke tessellation, bounds, hit-test, SVG export.
- Add atomic path/selection commands and save/load tests.

### Phase 2 — first drawing loop

- Implement Pencil and Pen basic.
- Implement Selection/Transform for generic nodes.
- Implement Subselection and Width.
- Complete `new document → draw → select → edit → undo → save/load → export`.

### Phase 3 — coloring loop

- Implement Brush normal/Fills/Behind.
- Implement Paint Bucket closed-region fill and Small gap tolerance.
- Implement Eraser Lines/Fills/Normal.
- Implement Eyedropper and Ink Bottle.
- Add boolean/path-region tests.

### Phase 4 — geometric tools

- Generalize existing Rect tool.
- Add Line/Oval.
- Add primitives and Bake to Path.
- Add PolyStar.
- Add Properties/tool options and style controls.

### Phase 5 — canvas and timeline integration

- Merge the Layers panel's row controls into the Timeline's left region.
- Ensure active layer, frame, tool, selection, and Properties share one context.
- Add Hand/Zoom/Stage Rotate, snapping, grid/guides, onion controls.
- Run integrated acceptance scenarios from `20_TOOL_ACCEPTANCE_MATRIX.md`.

### Phase 6 — P1 polish

- Paint Brush Art/Pattern.
- Static Text.
- Camera track and export matrix.
- Camera preview/export parity.

### Phase 7 — advanced tools

- Time Scrubber.
- Dynamic/Input Text.
- Bone/Bind/Asset Warp.
- Layer depth, presets, advanced gradients/bitmaps, motion paths.

### Phase 8 — deferred tools

Only after user validation: generators, scatter, fluid-flow settings, legacy 3D.

## 12. Current repository gap register

| Area | Current code evidence | Required before implementation |
|---|---|---|
| Selection/Move/Transform | existing `gesture.ts`, `transformMath.ts`, `TransformSelection` | generalize from Rect/Symbol to Path/Stroke/Primitive |
| Rectangle | existing `Rect` node and draw gesture | preserve tests while migrating to shared shape/style model |
| Path model | absent from `Node` enum | Path/Anchor serialization, bounds, hit-test, eval |
| Stroke model | absent except Rect stroke fields | StrokeStyle, width profile, tessellation |
| Fill model | Rect uses strings | FillStyle, region/boundary ownership |
| Boolean/regions | not available for general paths | union/subtract/flood-region engine |
| Pencil/Brush/Bucket/Eraser | no tool/model/bridge | commands, nodes, preview, tests, export |
| Tool dispatch | current app has a small tool state/registry | generic `ToolController` with capture/cancel |
| Properties | current Rect/Symbol subset | Tool/Object/Frame/Document schemas for new nodes |
| Timeline/Layers | both exist but are separate UI components | one unified source of truth and combined row/grid |
| Camera | specification only | camera model/track, matrix, export integration |
| Rust tests | toolchain unavailable in current sandbox | run on a Rust-enabled development environment before code gate |

## 13. “No thinking during coding” checklist

Before starting each tool implementation, the coding agent must be able to answer from the files:

- Which tool ID and shortcut?
- Where is the button and Tool Properties UI?
- What does pointerdown/move/up do?
- What happens on cancel/Escape/blur?
- What are Shift/Alt/Ctrl/Space effects?
- Which scene/layer/frame receives the operation?
- What happens on a held frame or tween?
- Which node/model fields are written?
- Which command and event are used?
- What is one undo step?
- What exact errors appear?
- What does Selection/Subselection/Properties/Timeline see afterward?
- What must Canvas, SVG, PNG, and future video export render?
- Which unit, engine, UI, and manual tests prove it?

If one answer is absent, update the research contract before writing code.

## 14. Final gate

The tool research phase is complete when:

- `00_INDEX.md` links all tool files;
- each tool family has a dedicated contract;
- conflicts are resolved in this file;
- all internal links resolve;
- commands/events/model fields are shared;
- P0/P1/P2/deferred scope is explicit;
- the integrated acceptance matrix exists;
- no unsupported feature is shown as functional;
- the implementation order is approved.

**Coding status after this audit: NOT STARTED.** The next action is approval/continuation from the project owner, followed by implementation only in the order above.
