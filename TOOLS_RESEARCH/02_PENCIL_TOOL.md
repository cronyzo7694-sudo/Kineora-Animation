# PENCIL TOOL — Deep Research (2D Freehand Vector Drawing)

> No Code, 2D Only

**Identity:** Pencil Tool, Shortcut Y, Category Drawing, Purpose Freehand vector line art with smoothing

## 1. PURPOSE

[INDUSTRY] Adobe Animate: "Use the Pencil tool to draw and edit freehand lines." [helpx draw]. Pencil is for quick, natural sketching, unlike Pen's precision.

[INDUSTRY] Adobe drawing modes: Straighten (converts to geometric shapes), Smooth (smooth curves), Ink (no modification) [helpx draw].

[INDUSTRY] Krita Freehand Brush: Smoothing options — No Smoothing, Basic Smoothing, Weighted Smoothing (Distance, Stroke Ending, Smooth Pressure, Scalable Distance), Stabilizer (Sample Count at Max/Min Speed, Delay, Finish Line, Stabilize sensors, Pixel) [docs.krita.org]

[KINEORA] Pencil exists for fast cartoon line art, rough animation, cleanup. It should feel like real pencil, with smoothing to fix shaky hands, but preserve corners when needed. It should be distinct from Brush (which paints fills) and Pen (precision).

Use Pencil: Quick sketches, outlines, rough keys, in-between lines.

Not Pencil: Textured painting (Brush), precise curves (Pen), geometric shapes (Rect/Oval).

Dependencies: Node::Path with many points, smoothing algorithm, stroke style, layer permissions, timeline auto-key.

## 2. UI

- **Toolbar:** Drawing group, icon: pencil diagonal. Active #2d5aa7. Hover tooltip "Pencil Tool (Y)"
- **Cursor:** Pencil icon, or crosshair if precise cursors on. While drawing, pencil with line.
- **Options:**
  - Pencil Mode: Straighten / Smooth / Ink (dropdown at bottom of Tools panel, stepped line icon)
  - Smoothing slider (0-100) when mode Smooth, disabled when Straighten/Ink [helpx strokes]
  - Object Drawing toggle
- **Properties:** Stroke color, width, style, Smoothing value
- **StatusBar:** "pencil" readout
- **Timeline:** No special UI, but drawing creates content at playhead

## 3. ACTIVATION

- Toolbar click or Y shortcut → setTool('pencil'), tool:changed, cursor pencil
- Switching from other tool discards its preview, preserves selection
- State: Pencil Mode and Smoothing are session view state, persisted
- Reset: In-progress stroke reset on tool switch, Esc, blur

## 4. POINTER LIFECYCLE

**Pointer Down:** Begins freehand path. Hit-test? Pencil does not select, it draws new stroke even over existing? In Adobe, Pencil draws new line, does not select existing. So down starts new stroke at doc position, captures pointer, starts gesture with startDoc.

**Pointer Move:** While dragging, adds points to temporary path, updates preview stroke (editor-only, shows raw input + smoothed preview). If mode Straighten, attempts to recognize lines/shapes as you draw? Actually Straighten applies after? Adobe: select mode then draw, smoothing/straightening applied as you draw. So move updates preview with smoothing applied live? Or raw then smooth on release? Kineora: show smoothed preview live, but keep raw for undo? Decision: live smoothed preview, one command on release.

Modifiers: Shift constrains to H/V (Adobe: Shift-drag constrains lines to vertical/horizontal)

**Pointer Up:** Validates stroke — if length below threshold? For Pencil, tiny dot maybe no object? In Adobe, Pencil click without drag = nothing? Actually Pencil click = small dot? But Kineora Rect has MIN_RECT_DIM 1px, no object if sub-min. For Pencil, if drag distance < 3px, treat as click = no object, no command. Else commit one DrawPath command with smoothed points, fill = none? Actually Pencil creates stroke only, no fill, using stroke color from colors area.

**Cancel:** pointercancel/blur/Esc → discard preview, no command

**Escape:** Discard in-progress stroke

**Tool Switch:** Discard preview

**Window Blur:** Discard preview

## 5. MODIFIER KEYS

- **Shift:** Constrain to horizontal/vertical while drawing (Adobe: Shift-drag constrains lines to vertical or horizontal) [helpx draw]
- **Alt:** No documented for Pencil? In some apps Alt = from-center? But for Pencil, Alt not used. Kineora: Alt could toggle Smooth vs Ink temporarily? But do not invent without evidence. So Alt = no effect for Pencil.
- **Ctrl/Cmd:** No
- **Shift+Alt:** No

## 6. CURSOR

- Default: Pencil diagonal
- Drawing: Pencil with small dot
- Hover over locked layer: not-allowed
- Precise: crosshair if preference

## 7. VISUAL FEEDBACK

- Preview: While dragging, shows stroke preview in stroke color, with smoothing applied, translucent? Or solid? Adobe shows line as you draw. Kineora: solid preview in stroke color, editor-only
- No handles/anchors while drawing, but after commit, path shows anchors when selected with Subselection
- No bounding box while drawing
- Error: locked layer → no preview, not-allowed cursor

## 8. DOCUMENT EFFECT

- Creates Content: Yes, Node::Path with stroke, no fill, at current frame on active layer
- Modifies: No (creates only)
- Deletes: No
- Geometry: Yes, freehand points
- Style: Stroke color/width from current style, no fill
- Animation: Auto-keyframe at held frame

## 9. PREVIEW VS COMMIT

Temporary: Raw points + smoothed preview, stored in Stage refs, rendered as overlay, never exported, cleared on cancel/commit

Committed: One DrawPath command with smoothed points, creates Node::Path, selection set to new id, document:changed emitted

Why separation: Prevents tiny dots, allows Esc cancel, one undo per stroke, clean export

## 10. UNDO/REDO

- One stroke = one undo
- Preview move = no undo
- Cancelled = no undo
- Failed (locked) = no undo
- Multiple strokes = multiple undo

## 11. LAYER BEHAVIOR

Same as Pen: active layer must be Normal, visible, unlocked, ancestors visible/unlocked. Blocked → toast, no command.

## 12. TIMELINE BEHAVIOR

- Current frame: stroke created at playhead
- Keyframe: if frame is content keyframe, add to content; if held, auto-key copy-prev then add
- Blank: if blank keyframe, does it create? Should convert blank to content with new stroke? Follows same auto-key logic
- Existing drawing: adds alongside
- Empty: creates keyframe
- Auto-key: F6 semantics

## 13. SNAPPING

- Does Pencil snap? In Adobe, drawing preferences have Connect Lines tolerance, Snap To Objects. For Pencil, when drawing, end point may snap to existing line if close (Connect Lines). So snapping could apply to start/end points.
- Grid/guides snapping: maybe for start point?
- Indicators: highlight when snapping
- Kineora: For MVP, Pencil does NOT snap (freehand), but future could add point snapping for closing gaps

## 14. INPUT DEVICES

- **Mouse:** Main, freehand with smoothing
- **Trackpad:** Same, but may be jittery, needs more smoothing
- **Stylus:** More natural, pressure? Pencil Tool in Adobe does NOT have pressure for size? Actually Brush has pressure, Pencil maybe not? In Krita, freehand brush has pressure for size/opacity. For Pencil, pressure could affect? Adobe Pencil: stroke weight from Properties, not pressure. So mouse vs tablet same, no pressure for Pencil.
- **Pressure Tablet:** No size variation for Pencil, unlike Brush. So ignore pressure.
- **Velocity:** Fast strokes may be less accurate, need smoothing; slow strokes more precise. Weighted smoothing Distance parameter accounts for this.

## 15. EDGE CASES

- Empty canvas: draw first stroke
- No selection: draws new, selection becomes new stroke
- Existing object: draws over, does not select existing
- Overlapping: draws new on top
- Locked/hidden/folder: blocked
- Empty frame: creates keyframe
- Extreme zoom: screen→doc ÷ zoom, so stroke size in doc independent of zoom
- Tiny: drag <3px → no object
- Huge: stroke beyond stage allowed, clipped on export
- Pointer leaving: commit if valid on release outside (like Rect)
- Esc: discard
- Tool switch: discard
- Blur: discard
- Invalid: locked → no command
- Cancelled: no undo

## 16. ENGINEERING IMPLICATION

- Interaction state: PencilGesture { startDoc, points: Vec<Pt>, isDragging }
- Preview: temporary path with smoothed points, rendered as overlay
- Document: DrawPath command
- Hit-testing: none for Pencil (does not select)
- Coordinate: screenToDoc via viewport
- Layer permission: editable_target_layer check
- Timeline: playhead, active_layer, auto-key
- Undo: one per stroke
- Rendering: canvasRenderer draws preview stroke
- Pointer capture: capture on down, release on up/cancel/blur/Esc
- Cancellation: handlers for pointercancel, blur, Esc

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Animate Pencil | Illustrator Pencil | Krita Freehand | Toon Boom Pencil | Kineora |
|----------|----------------|--------------------|----------------|------------------|---------|
| Freehand drawing | Yes | Yes | Yes (brush) | Yes | KEEP |
| Straighten mode (geometric recognition) | Yes [helpx draw] | — | — | — | KEEP |
| Smooth mode (smooth curves) | Yes [helpx draw] | Yes (fidelity) | Weighted Smoothing | Smoothing | KEEP |
| Ink mode (no modification) | Yes [helpx draw] | — | No Smoothing | — | KEEP |
| Smoothing slider 0-100 | Yes (Property inspector) [helpx strokes] | Yes | Distance, Stabilizer | Smoothing | KEEP — 0-100 |
| Shift constrains H/V | Yes [helpx draw] | Yes | — | Shift constrains | KEEP |
| Pressure for size | No (Brush does) | No | Yes (size sensor) | Yes (min/max) | REJECT for Pencil — Brush handles pressure |
| Stabilizer (delay) | — | — | Stabilizer with delay | Pen Stabilizer | MODIFY — use weighted smoothing + stabilizer as option in future |
| Object vs Merge mode | Yes [helpx draw] | — | — | — | KEEP |

## 18. KINEORA DECISION

- KEEP: Freehand vector drawing, 3 modes (Straighten/Smooth/Ink), Smoothing slider 0-100, Shift H/V constraint, Object Drawing toggle, one undo per stroke, layer checks, auto-key at held frame, stroke from current colors, no fill.

- MODIFY: Smoothing implementation — use Krita-inspired weighted smoothing (Distance = events before first dab, Stroke Ending = attempt to reach last cursor, Smooth Pressure, Scalable Distance) plus Stabilizer (Sample Count Max/Min, Delay for sharp corners, Finish Line, Pixel). But expose as simple 0-100 slider for MVP, with advanced options later. Reason: better quality than Adobe's simple slider, but simple UI for now.

- REJECT: Pressure sensitivity for Pencil — keep for Brush only. Reason: Pencil is for line art with uniform weight, Brush for expressive pressure.

- DEFER: Shape recognition (Recognize Lines/Shapes) — needs Modify > Shape > Straighten later. For now Straighten mode does basic line straightening, but full shape recognition deferred.

## 19. ACCEPTANCE CRITERIA

- Activates via Y and toolbar, active state obvious
- Cursor pencil, not-allowed over locked
- Pointer down begins stroke, no document change
- Pointer move updates preview stroke (smoothed) only
- Pointer up with drag >=3px commits one DrawPath stroke, no fill, stroke from current colors
- Click without drag or tiny drag <3px → no object, no command
- Shift-drag constrains to H/V
- Straighten mode converts rough lines to straight and shapes to geometric (basic)
- Smooth mode smooths curves, Ink mode raw
- Smoothing slider affects smoothness, disabled in Straighten/Ink? Actually in Adobe Smoothing disabled in Straighten/Ink per helpx strokes — but Kineora should keep enabled in Smooth only
- Esc / cancel / blur / tool switch discards preview, no command
- Locked/hidden/folder blocks → toast, no command
- Drawing at held frame auto-keys, undo exact
- Preview never exported, only committed stroke exported as SVG path
- Undo removes stroke, redo restores
- Zoom/pan independent — doc coords correct at 25%-800%
- Overlapping strokes create separate objects, frontmost last drawn

Sources: Adobe Draw Pencil [helpx draw], Drawing Preferences [helpx drawing-preferences], Strokes [helpx strokes], Krita Freehand [docs.krita.org], Toon Boom Pencil
