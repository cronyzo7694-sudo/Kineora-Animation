# Time Scrubber and Camera Tools — Research and Implementation Contract

**Status:** Research complete — batch 3  
**Priority:** Time Scrubber P2; Camera P1 after basic timeline/stage  
**Shortcuts:** Time Scrubber `Shift+Alt+H`; Camera `C`  
**Related files:** [View tools](13_HAND_ZOOM_STAGE_ROTATE.md), [Free Transform](02_FREE_TRANSFORM_TOOL.md), [Timeline blueprint](../animate-blueprint/07_timeline.md), [Camera blueprint](../animate-blueprint/16_camera.md), [Export blueprint](../animate-blueprint/28_export_publish.md)

## 1. Two separate concepts

- **Time Scrubber:** view/transport gesture that changes the playhead.
- **Camera:** an animatable document object that changes the rendered framing and export.

Time Scrubber never changes artwork or camera. Camera never changes the authoring viewport zoom/pan.

## 2. Time Scrubber

### UI and activation

- View tool flyout or timeline transport.
- Shortcut `Shift+Alt+H` if not captured by the operating system.
- Cursor: horizontal time arrow with current frame/time readout.
- Tool Properties:
  - sensitivity;
  - snap to whole frames on/off;
  - audio scrub on/off when Audio Engine exists.

### Desktop interaction

```text
pointerdown on stage
  -> capture starting frame and pointer x
pointermove horizontally
  -> delta screen px * sensitivity -> frame delta
  -> clamp to document duration/range
  -> call set_playhead (view/session state)
pointerup
  -> release capture
```

Vertical movement may adjust sensitivity only in a future option; default is horizontal only so accidental diagonal movement does not jump frames.

### Touch interaction

One-finger horizontal drag on the active Time Scrubber tool changes the playhead. Two-finger drag remains viewport pan. Long-press on the playhead opens frame actions, not Time Scrubber.

### Rules

- Playhead changes emit `playhead:moved` and do not create undo entries.
- Scrubbing evaluates the same frame state used for playback.
- It must not create dirty state.
- If frame selection is active in Timeline, scrubbing does not clear it unless the user chooses a `Clear frame selection` action.
- Snap is to integer frame indices, never fractional frames.

## 3. Camera purpose and boundaries

Camera is a per-scene animatable framing transform:

```text
CameraState {
  enabled,
  center_x,
  center_y,
  zoom,
  rotation,
  projection: Orthographic,
  tint: Option<RGBA>,
  filters: [...]
}
```

- View zoom/pan/rotation = authoring only.
- Camera center/zoom/rotation = document data, timeline-keyframed, exported.
- Object transform = one node only.

## 4. Camera UI

### Activation

- Camera icon in Tools rail.
- `Add Camera` in Timeline/Scene menu.
- Selecting Camera automatically creates or selects the scene's Camera track/layer.
- Camera border and safe-area overlay become visible; overlay is editor-only.

### Properties

- Enable/disable.
- X/Y center.
- Zoom percentage.
- Rotation degrees.
- Reset X/Y/zoom/rotation individually.
- Optional tint, brightness/contrast/saturation later.
- Attach selected layer to camera (HUD mode).
- Preset buttons: push in, pull out, pan left/right, shake; P1.

### Desktop controls

- Drag inside camera frame = pan camera.
- Shift-drag or vertical camera handle = zoom.
- Ctrl/Cmd-drag or rotation ring = rotate.
- Numeric fields are always available for precision.
- Pointer capture and Escape cancellation match Free Transform.

### Touch controls

- One-finger drag = camera pan when Camera tool active.
- Pinch = camera zoom.
- Two-finger twist = camera rotation.
- Long-press reset icon = reset all camera properties.

## 5. Camera layer/track and timeline

Use a dedicated Camera track in the unified Timeline so camera keys cannot be confused with normal artwork layers.

- Frame 1 camera state exists when Camera is enabled.
- F6/add keyframe on Camera track records the current camera state.
- Changing camera on a keyframe edits that camera state.
- Changing camera on a held frame applies auto-key/copy rules.
- Between camera keyframes, interpolate X/Y and shortest rotation path.
- Interpolate zoom in log space for natural push-ins.
- Easing is per camera span and uses the shared Tween/Easing engine.
- Deleting Camera disables the camera but must preserve the document stage.

## 6. Camera matrix and layer depth

For orthographic MVP:

```text
screen = viewport_to_screen(
  Rotate(camera.rotation)
  * Scale(camera.zoom)
  * Translate(-camera.center_x, -camera.center_y)
  * stage_point
)
```

Camera is applied after scene evaluation and before export. The exact matrix order is shared by Canvas, SVG, raster, video, and web output.

P1 layer depth:

```text
Layer.z_depth -> depth_scale(layer, camera)
```

Far/near layers receive different parallax factors. Default depth = 0 gives no parallax. Attach-to-camera/HUD layers use camera-space coordinates so they stay fixed on screen.

## 7. Camera presets

Presets are commands that insert/change a small group of camera keyframes:

- Push In: zoom 100→200% with ease-out.
- Pull Out: 200→100% with ease-in-out.
- Pan: center x/y shift over selected duration.
- Shake: deterministic seeded offsets over a chosen frame range.
- Follow: future target binding, not MVP.

Preset creation must respect selected frame range and never overwrite existing camera keys without confirmation.

## 8. Export behavior

- If camera disabled: export the stage as usual.
- If camera enabled: export the camera-framed result at requested output dimensions.
- Camera border, guides, safe areas, selection, onion skin, and tool overlays never export.
- Camera animation range follows the export range.
- Attached HUD layer remains screen-fixed; world layers move with camera.
- SVG export applies the camera matrix or emits an equivalent transform while preserving viewBox semantics.

## 9. Errors and safeguards

- No active scene: camera action disabled.
- Camera disabled: Camera Properties says how to enable it.
- Invalid zoom ≤0 or non-finite: reject and retain old value.
- Camera layer locked: camera edits blocked.
- Deleting camera with keys: confirm; undo restores track.
- Preset over existing keys: preview affected range and ask before overwrite.
- View rotation/zoom accidentally active: status clearly says `Viewport`, never `Camera`.

## 10. Acceptance matrix

1. Time Scrubber changes playhead without dirty/undo/document changes.
2. Scrub after zoom/pan still maps horizontal movement consistently.
3. Camera tool visibly differs from viewport tools.
4. Camera pan/zoom/rotation updates stage preview and Properties.
5. Camera keyframes hold and interpolate with easing.
6. Camera zoom uses log-space interpolation test (midpoint is perceptually smooth).
7. Camera reset restores one property without changing other properties.
8. Camera export matches editor at current frame.
9. Camera animation export follows selected range.
10. Stage Rotate does not affect camera export.
11. HUD/attached layer stays fixed while world pans/zooms.
12. Layer depth produces parallax only when enabled.
13. Locked camera track rejects edits.
14. Escape/pointercancel/blur cancels camera preview.
15. Save/load preserves camera state, track, easing, depth, and attachment.

## 11. Dependencies and code map

Dependencies: timeline/playhead, camera model, matrix math, unified layer/track UI, tween/easing, viewport distinction, layer depth, renderer/export.

Expected locations:

- `animator/ui/src/editor/timeScrubberTool.ts`
- `animator/ui/src/editor/cameraTool.ts`
- `animator/core/src/model.rs`
- `animator/core/src/eval.rs`
- `animator/core/src/command.rs`
- `animator/ui/src/components/TimelineStrip.tsx`
- `animator/ui/src/components/PropertiesPanel.tsx`
- `animator/ui/src/render/viewport.ts`
- `animator/ui/src/render/canvasRenderer.ts`
- `animator/core/src/export.rs`

## Adobe source references

- [Using the camera in Animate](https://helpx.adobe.com/animate/using/working-with-camera-in-animate.html)
- [Camera in Animate](https://helpx.adobe.com/animate/desktop/using/working-with-camera-in-animate.html)
- Existing source: `animate-blueprint/02d_tools_utility.md` T2D.7 and T2D.10
- Existing source: `animate-blueprint/16_camera.md`
