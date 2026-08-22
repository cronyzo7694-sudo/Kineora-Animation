# Integrated Tool Acceptance Matrix

**Status:** Draft baseline — batch 3  
**Purpose:** prove that tools work together as an animation editor, not only as isolated buttons.  
**Related files:** [Tool index](00_INDEX.md), [Command matrix](19_TOOL_COMMAND_MATRIX.md), [Timeline blueprint](../animate-blueprint/07_timeline.md), [Shape system](../animate-blueprint/06_shape_system.md)

## 1. Definition of a successful basic animation workflow

A new user must be able to complete this sequence without leaving the editor or using unsupported fake controls:

```text
New document
  -> choose active layer/frame
  -> draw rough line art with Pencil or Pen
  -> color regions with Brush/Paint Bucket
  -> clean with Eraser/Width/Subselection
  -> create a second keyframe
  -> draw/change the next pose
  -> tween or hold according to timeline choice
  -> scrub/play
  -> inspect/edit with Properties
  -> export the rendered result
```

## 2. Cross-tool invariants

Every scenario verifies:

- screen/document coordinates are correct after zoom/pan/Stage Rotate;
- active layer and playhead frame are unambiguous;
- locked/hidden layers are protected;
- editor previews never enter saved data/export;
- one gesture produces one undo step;
- cancel produces no mutation;
- Canvas and export use the same evaluated geometry;
- save/load preserves authored content and styles;
- no unsupported control is presented as functional.

## 3. Scenario A — draw and edit clean line art

1. New document at 1920×1080, 24 fps.
2. Select a normal unlocked layer and frame 1.
3. Choose Pencil, Smooth mode, 3px black stroke.
4. Draw a head outline and body lines.
5. Choose Pen; add a precise closed mouth/eye shape.
6. Choose Selection; move the completed path.
7. Choose Subselection; move one anchor and pull one handle.
8. Choose Width; thicken the outer contour and taper the inner line.
9. Save, reload, and verify path/width data.
10. Export SVG/PNG; compare with editor content.

Expected: all operations are editable vector data, overlays are absent from export, and undo restores each gesture separately.

## 4. Scenario B — color a character

1. With line art visible, choose Brush → Paint Fills.
2. Set a skin fill and paint inside the face region.
3. Use Paint Bucket with Small gap tolerance to fill shirt and hair regions.
4. Use Eyedropper to sample the skin fill.
5. Apply sampled fill to a second region explicitly.
6. Use Ink Bottle to apply the common outline style to a fill-only prop.
7. Use Eraser → Erase Lines to remove a stray mark without damaging fills.

Expected: color operations preserve line art, sampled style does not mutate source geometry, and each committed operation is undoable.

## 5. Scenario C — keyframe animation

1. On frame 1, create a ball with Oval Primitive and a ground line.
2. At frame 10, insert a content keyframe while preserving frame-1 content.
3. On frame 10, use Selection/Free Transform to move the ball.
4. Add a classic tween only when both endpoints hold the same object.
5. Scrub frame 5; verify the ball interpolates only when a tween exists.
6. Use Pencil to draw a new line at frame 10; verify it does not appear at frame 1.
7. Undo/redo the move, tween, and drawing independently.

Expected: frame-by-frame holds remain holds, explicit tween spans interpolate, and newly drawn content follows the hold/keyframe rules.

## 6. Scenario D — view correctness

1. Zoom to 200% with the cursor over a character's eye.
2. Draw a Pencil point/curve; verify document coordinates.
3. Pan with Space/Hand; select and transform the eye.
4. Rotate Stage view; draw another stroke.
5. Reset view; compare geometry.
6. Activate Camera and change camera zoom.
7. Export current frame.

Expected: view operations do not alter document/camera data; camera does affect export; Stage Rotate does not.

## 7. Scenario E — primitive to path workflow

1. Create rounded Rectangle Primitive.
2. Adjust radius using on-stage parameter handle and Properties.
3. Transform it without baking.
4. Choose Subselection; choose Bake to Path.
5. Edit an anchor with Subselection.
6. Add an anchor with Pen.
7. Edit stroke with Width.
8. Undo repeatedly; primitive and path states restore exactly.

Expected: parameters remain editable until explicit bake, visual appearance is preserved, and the resulting path is compatible with normal tools.

## 8. Scenario F — symbol/rig readiness

1. Create a closed path and convert to a symbol.
2. Select instance with Selection; transform instance only.
3. Enter symbol edit context; use Pen/Subselection inside.
4. Leave symbol context; all instances reflect definition change.
5. Later, create a Bone rig from instances.
6. Pose at frame 1 and frame 20; scrub/play.

Expected: normal tools respect symbol boundaries, the instance is not accidentally edited from the parent timeline, and rig overlays stay editor-only.

## 9. Scenario G — camera/export

1. Activate Camera; camera track appears in unified Timeline.
2. Set a wide frame-1 camera key.
3. Add a frame-30 camera key with pan/zoom.
4. Apply easing.
5. Scrub and play; camera motion is visible.
6. Attach a HUD layer to camera.
7. Export current frame and animation range.

Expected: world layers move with camera, attached HUD stays screen-fixed, export matches stage preview, and camera border/handles never export.

## 10. Scenario H — protection and cancellation

For each content tool (Pencil, Brush, Bucket, Pen, Rectangle/Oval, Eraser, Width, Subselection, Transform):

1. Lock the active layer.
2. Attempt a gesture.
3. Confirm no preview can commit and engine state is unchanged.
4. Hide the layer and repeat.
5. Start a valid gesture, press Escape.
6. Start another valid gesture, trigger pointercancel/blur.
7. Switch tools during preview.

Expected: no partial geometry, no dirty state, no undo entry, and a useful error/status message.

## 11. Scenario I — style consistency

1. Set fill alpha and stroke alpha independently.
2. Draw Rectangle, Oval, Pen path, Pencil stroke, and Brush fill.
3. Sample each style with Eyedropper Fill/Stroke/Both.
4. Apply to selected objects.
5. Change source object later.
6. Save/load/export.

Expected: style clipboard is by-value, unrelated style components are unchanged, alpha remains intact, and Canvas/export agree.

## 12. Scenario J — touch parity

On a tablet/touch adapter:

1. One-finger Pencil/Brush draw.
2. Two-finger Hand pan.
3. Pinch Zoom.
4. Twist Stage Rotate.
5. Tap/drag Selection and transform handles.
6. Tap Pen anchors and use loupe.
7. Long-press tool/frame for context actions.
8. Use persistent Undo/Redo and modifier buttons.

Expected: touch gestures do not scroll the page, two-finger gestures never move artwork, and every desktop-critical action has a visible touch equivalent.

## 13. Required automated test layers

### Pure unit tests

- screen/document conversion;
- resampling/smoothing;
- Bézier evaluation and path splitting;
- rectangle/ellipse/polygon generation;
- width profile interpolation;
- region detection/gap tolerance;
- boolean subtraction/union;
- transform/Camera matrices;
- keyframe/hold/tween rules.

### Engine tests

- command validation and atomicity;
- locked/hidden/tween guards;
- save/load migrations;
- undo/redo exactness;
- export parity and overlay exclusion.

### UI tests

- tool activation and keyboard focus;
- options panel values;
- pointer capture/cancel;
- preview vs commit;
- status/toast/error messages;
- integrated Stage + Timeline + Properties update.

### Manual tests

- stylus pressure/tilt;
- high-DPI/canvas resize;
- touch gestures;
- large path/brush performance;
- native file/export dialogs;
- final visual comparison across Canvas/SVG/PNG/video.

## 14. Release gate

The tools slice is not “complete” until:

- P0 drawing/color tools pass Scenarios A–E;
- view tools pass Scenario D;
- protected/cancel flows pass Scenario H;
- export passes Scenarios A, C, D, G, and I;
- no dead functional buttons exist;
- all unresolved advanced features are labeled `Planned` or hidden;
- the final implementation matrix has concrete source files and tests.
