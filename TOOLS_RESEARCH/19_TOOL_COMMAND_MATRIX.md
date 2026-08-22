# Tool Command Matrix — Initial Cross-Tool Contract

**Status:** Draft baseline — update after the final tool research batches  
**Purpose:** keep all tools on one mutation/undo/event contract instead of creating one-off UI logic.

## 1. Shared command rules

Every document-changing tool operation goes through the Rust command system and emits `document:changed` after success. Preview state remains in the UI/render layer. View/playhead/style-clipboard operations are session state unless explicitly listed as document mutations.

## 2. Current and planned matrix

| Tool/action | Preview | Commit command | Document data | Undo |
|---|---|---|---|---|
| Select click/marquee | selection overlay | none | session selection | none |
| Select move | moved preview | `MoveSelection` | transforms/frame overrides | one gesture |
| Free Transform | overlay/preview | `TransformSelection` | transforms/pivot | one gesture |
| Pencil | stroke preview | `DrawStroke` | StrokeNode in frame | one stroke |
| Brush | fill preview | `DrawFill` | FillPaintNode in frame | one stroke |
| Paint Bucket | region highlight | `BucketFill` | FillStyle/region node | one click/drag |
| Eraser | subtraction preview | `Erase` | path/fill fragments | one gesture |
| Pen create | rubber-band path | `DrawPath` | PathNode in frame | one path |
| Pen Add/Delete/Convert | anchor preview | `AddAnchor` / `DeleteAnchor` / `ConvertAnchor` | Path anchors | one action |
| Line/Rect/Oval | shape preview | `DrawShape`/`CreatePrimitive` | path/primitive node | one shape |
| Primitive params | handle preview | `PatchPrimitiveParams` | primitive params | one gesture/edit |
| Subselection | path preview | `PathEdit` | anchors/handles | one gesture |
| Width | width handle preview | `SetWidthProfile` | width profile | one gesture |
| Eyedropper sample | style chip | none | session clipboard/chips | none |
| Apply style | target highlight | `SetFillStyle`/`SetStrokeStyle` | node style | one action |
| Ink Bottle | outline highlight | `SetStrokeStyle` | outline style | one action |
| Hand/Zoom/Stage Rotate | view preview | none | workspace viewport | none |
| Time Scrubber | frame preview | none | playhead | none |
| Camera | camera preview | `SetCamera` | camera track/keyframe | one gesture |
| Paint Brush | mapped brush preview | `DrawBrushStroke` | brush stroke node | one stroke |
| Text typing | text edit preview | `CreateText`/`EditText` | TextNode | coalesced session |
| Bone pose | solved rig preview | `SetPose` | pose keyframe | one gesture |
| Bind | weight preview | `SetBinding` | armature bindings | one action/drag |
| Asset Warp | mesh/pin preview | `SetWarpPose` | per-frame pins | one gesture |

## 3. Shared validation order

1. Active document exists.
2. Scene/timeline context exists.
3. Active layer/track exists.
4. Layer/track is visible and unlocked.
5. Current frame is writable or auto-key policy can create a writable keyframe.
6. Target NodeId/path/version still matches preview.
7. Geometry/style values are finite and within bounds.
8. Command applies atomically.
9. Engine emits document change; UI refreshes from engine status.

## 4. Shared events

- `selection:changed` — session selection.
- `playhead:moved` — session transport.
- `viewport:changed` — session view.
- `tool:changed` — session tool.
- `document:changed` — successful document mutation.
- `timeline:changed` — keyframe/layer/tween mutation.
- `layer:changed` — layer mutation.
- `engine:error` — rejected operation with user-facing message.

## 5. Finalization gate

This draft becomes final after files `07` through `18` have been reviewed together and after all remaining cross-links, commands, model fields, and acceptance cases are present. No implementation should invent a command that is absent from this matrix without updating the matrix first.
