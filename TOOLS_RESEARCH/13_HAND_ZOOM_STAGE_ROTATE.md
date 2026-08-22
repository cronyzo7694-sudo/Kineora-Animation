# Hand, Zoom, and Stage Rotate Tools — Research and Implementation Contract

**Status:** Research complete — batch 3  
**Priority:** P0 for usable canvas navigation; Stage Rotate P1  
**Related files:** [Selection](01_SELECT_TOOL.md), [Free Transform](02_FREE_TRANSFORM_TOOL.md), [Time Scrubber/Camera](16_TIME_SCRUBBER_CAMERA.md), [Stage blueprint](../animate-blueprint/01_application_map.md)

## 1. Purpose

These tools provide view-only navigation around the document Stage.

## 1.1 The three view operations

These tools change the author's view, not the artwork:

| Operation | Changes | Saved in document? | Exported? |
|---|---|---|---|
| Hand/Pan | viewport offset | no, only workspace preference | no |
| Zoom | viewport magnification | no, only workspace preference | no |
| Stage Rotate | viewport rotation | no, only workspace preference | no |
| Camera | composited scene framing | yes | yes |
| Object Transform | selected node geometry | yes | yes |

This distinction must be shown in tooltips because confusing view zoom with camera zoom or object scale creates destructive mistakes.

## 2. Shared viewport model

```text
ViewportState {
  zoom: number,        // 0.08..20.0 for MVP (8%..2000% reference range)
  pan_x: number,
  pan_y: number,
  rotation: number,    // degrees, authoring-only
  fit_mode: None | FitStage | FitContent | ShowFrame | ShowAll,
  clip_outside_stage: boolean
}
```

Screen conversion:

```text
screen = viewport_center
       + Rotate(view_rotation)
       * Scale(view_zoom)
       * (document_point - pan_origin)
```

The inverse transform is the only way tools obtain document coordinates. Hand/Zoom/Stage Rotate must not change `Document`, `Scene`, `Layer`, `Node`, keyframe, or camera values.

## 3. Hand Tool

### UI

- Tools rail: View group.
- Shortcut: `H`.
- Temporary shortcut: hold `Space` while another tool is active, unless a text field has focus.
- Cursor: open hand when idle; closed hand while dragging.
- No document Properties context; status says `View: Pan`.

### Desktop interaction

```text
pointerdown
  -> record screen point and viewport pan
  -> capture pointer
pointermove
  -> pan by screen delta / zoom; no document write
pointerup
  -> release capture
```

- Middle-button drag also pans globally.
- Space+left drag pans from any drawing tool.
- If a drawing gesture has already started, Space does not steal it; the user must cancel or finish that gesture first.
- Inertia is optional and disabled by default for deterministic editing.

### Touch interaction

- Two-finger drag pans the viewport.
- One-finger drag pans only when the Hand tool is active.
- Pinch is reserved for Zoom when no object transform is active.
- The gesture adapter must reject browser page scrolling while the canvas owns the gesture.

### Acceptance

1. Pan at 50%, 100%, 200% and document objects do not move.
2. Space temporarily pans from Pencil, Brush, Pen, and Selection.
3. Pointer leaving canvas continues the pan and releases cleanly.
4. Pan never creates dirty state or undo history.
5. Two-finger touch pan does not create a selection/move gesture.

## 4. Zoom Tool

### UI

- Tools rail: View group.
- Shortcut: `Z`.
- Status: `View: Zoom 100%`.
- Tool Properties: Zoom In, Zoom Out, marquee zoom, center-on-pointer.
- Global View controls may also offer zoom percentage, Fit Stage, Fit Content, and Show All.

### Desktop interaction

- Click = zoom in around pointer by a defined factor.
- Alt/Option-click = zoom out around pointer.
- Drag a rectangle = zoom to that area.
- Mouse wheel = zoom around cursor; Ctrl/Cmd+wheel can be reserved if browser conflicts.
- `Ctrl/Cmd+1` = 100%; `Ctrl/Cmd+0` = Fit Stage; exact shortcut must be registered once globally.

Zoom must preserve the document point beneath the cursor:

```text
before = screen_to_document(pointer)
change zoom
after = screen_to_document(pointer)
pan += document_to_screen(before) - document_to_screen(after)
```

### Touch interaction

- Pinch zooms around the pinch center.
- Double-tap may zoom to a known step; double-tap with two fingers fits stage.
- Zoom never changes object scale or camera zoom.

### Range and clamps

Reference behavior allows 8%–2000%. Kineora MVP uses 8%–2000% unless performance requires a lower cap. Clamp invalid/non-finite values and display the actual percentage.

## 5. Stage Rotate Tool

### Purpose

Rotate the work surface temporarily for comfortable brush/pencil strokes. The artwork remains in document coordinates; only viewport rendering and pointer conversion rotate.

### UI and interaction

- Shortcut: `Shift+H`.
- Icon: original rotating-frame glyph.
- Drag around a pivot to rotate the viewport.
- Shift+Space+drag temporarily activates rotation from any tool.
- Two-finger twist on touch rotates the viewport.
- A pivot crosshair appears; clicking moves the view pivot. The pivot is a viewport value, not a document pivot.
- `Reset View Rotation` returns to 0°; `Center Stage` also returns to the default view orientation.

### Guard rules

- Stage Rotate must not alter Selection/Free Transform pivot.
- Camera rotation is never changed by Stage Rotate.
- Stage Rotate is disabled while a modal text edit or active path gesture owns the pointer.
- Rulers/guides rotate visually with the viewport but retain document-space coordinates.

## 6. Stage and pasteboard behavior

The Stage is the document rectangle. Pasteboard is the authoring area outside it:

- Stage boundary is always visually clear.
- Pasteboard can show objects outside stage for entrances/exits.
- `Clip outside Stage` affects authoring preview only; export always clips to stage/camera output as defined by Export.
- Fit Stage centers the whole stage.
- Fit Content frames visible content but never changes document/camera data.
- Show All includes pasteboard content within a safe view margin.

## 7. Timeline interaction

Hand, Zoom, and Stage Rotate are view-only. They never move the playhead, create keyframes, change layer content, mark the document dirty, or add undo entries. A Time Scrubber is the separate tool that changes the playhead; Camera is the separate document-level transform described in [Time Scrubber/Camera](16_TIME_SCRUBBER_CAMERA.md).

## 8. Relationship to drawing and selection tools

- Pointer conversion is shared by Hand, Zoom, Stage Rotate, [Pencil](03_PENCIL_TOOL.md), [Brush](04_BRUSH_TOOL.md), [Pen](07_PEN_TOOL.md), and [Selection](01_SELECT_TOOL.md).
- Pan/zoom/rotate can occur without changing the active tool's style.
- A view gesture never commits a content command.
- View changes can be saved in workspace preferences per existing workspace system, not in the project file.

## 9. Errors and safeguards

- Canvas not mounted: no-op and status message, never crash.
- Browser wheel event: prevent page scroll only when pointer is inside the canvas.
- Pointer cancel/blur: release capture and retain the last valid view state.
- Zoom too far: clamp and show `Zoom limit reached`.
- Rotation NaN: reset to 0°.

## 10. Acceptance matrix

1. Fit Stage works with empty document and non-empty document.
2. Fit Content frames pasteboard content without changing export bounds.
3. Zoom around cursor keeps the same document point beneath it.
4. Marquee zoom frames exactly the selected area with a small margin.
5. Pan after zoom does not change document positions.
6. Stage Rotate changes only the view; draw a Pencil stroke and verify its document coordinates are correct.
7. Reset rotation returns to 0° without changing camera or object transforms.
8. Camera tool and Stage Rotate show different status labels and have different export behavior.
9. Space/middle-drag pan works from every non-modal tool.
10. Touch pinch/twist/pan does not scroll the browser and does not alter document state.
11. View changes do not create undo entries or dirty state.
12. Selection overlay, guides, and stage boundary remain correctly aligned after all view operations.

## 11. Dependencies and code map

Dependencies: viewport matrix, pointer capture, resize observer, canvas rendering, stage/pasteboard layout, input gesture adapter, workspace preferences.

Expected locations:

- `animator/ui/src/render/viewport.ts`
- `animator/ui/src/components/Stage.tsx`
- `animator/ui/src/editor/viewTools.ts`
- `animator/ui/src/editor/gesture.ts`
- `animator/ui/src/viewPrefs.ts`
- `animator/ui/src/workspace.ts`

## Adobe source references

- [Use the Stage and Tools panel](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- Existing source: `animate-blueprint/02d_tools_utility.md` T2D.4–T2D.6
- Existing source: `animate-blueprint/01_application_map.md` §1.4
