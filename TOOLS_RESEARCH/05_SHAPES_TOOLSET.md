# SHAPES TOOLSET — Deep Research (2D Geometric Primitives)

> No Code, 2D Only. Research separately: Rectangle, Rounded Rect, Oval, Circle, Line, Polygon, Star, PolyStar

## 1. PURPOSE

[INDUSTRY] Adobe Animate: Rectangle Tool (R) draws rectangles/squares, Oval Tool (O) draws ovals/circles, Line Tool (N) draws straight lines, PolyStar Tool draws polygons/stars. Rectangle Primitive and Oval Primitive have hinges for editing. [Adobe Beginner Guide + helpx draw]

[INDUSTRY] Krita: Rectangle, Ellipse, Polygon, Freehand Path, Bezier, Polyline — with Fill (Not Filled/Foreground/Background/Pattern) and Outline (No Outline/Brush), Angle Constraints, Size lock [Krita painting tools PDF]

[INDUSTRY] Blender Grease Pencil: Box and Circle tools for simple quadrilaterals and circles [Blender GP]

[INDUSTRY] Toon Boom: Rectangle, Ellipse, Line, Polyline tools [Toon Boom drawing tools]

[KINEORA] Shapes exist for fast geometric construction — UI elements, backgrounds, props, that need exact dimensions, not freehand. They should be faster than Pen for boxes/circles, with live preview and modifiers for square/circle and center-out.

Use Shapes: UI boxes, buttons, character heads (oval), lines, stars, polygons.

Not Shapes: Organic freehand (Pencil/Brush), precise bezier (Pen).

Dependencies: Node kinds Rect/Oval/Line/PolyStar, corner_radius, fill/stroke, gesture normalize, layer/timeline.

## 2. UI — For Each Shape

### Rectangle
- **Toolbar:** R, icon: rectangle outline. Active #2d5aa7. Tooltip "Rectangle Tool (R)"
- **Cursor:** Crosshair
- **Options:** Object Drawing toggle, Corner Radius (for rounded rect), Fill/Stroke from colors area, Pencil Mode? No, shape tools have no pencil mode, but have corner radius
- **Properties:** X,Y,W,H, Fill, Stroke, Stroke Width, Corner Radius

### Rounded Rectangle
- Same as Rectangle but with corner radius live parameter
- Adobe Primitive Rectangle has hinges to edit corner radius [Adobe Guide]

### Oval / Circle
- **Toolbar:** O, icon: oval outline. Tooltip "Oval Tool (O)"
- **Cursor:** Crosshair
- **Options:** Object Drawing, Inner Radius? For Oval Primitive, can set inner radius for donut? Actually Oval Primitive has inner radius, close path, start/end angle [helpx draw]
- **Properties:** X,Y,W,H, Fill, Stroke

### Line
- **Toolbar:** N, icon: diagonal line. Tooltip "Line Tool (N)"
- **Cursor:** Crosshair
- **Options:** Object Drawing, Stroke only (no fill)
- **Properties:** X1,Y1,X2,Y2, Stroke, Width

### Polygon / Star / PolyStar
- **Toolbar:** PolyStar, icon: star/polygon. No default shortcut (maybe).
- **Cursor:** Crosshair
- **Options:** Number of sides, Star ratio (inner/outer), Size, etc.
- **Properties:** Sides, Ratio, Fill, Stroke

### General UI
- **Colors Area:** Fill and Stroke used for shapes (Line uses stroke only)
- **StatusBar:** "rect" + dimensions

## 3. ACTIVATION

- Toolbar click or shortcut (R for Rect, O for Oval, N for Line) → setTool('rect'/'oval'/'line'/etc.), tool:changed, cursor crosshair
- Switching discards previous preview
- State: Corner radius, sides, etc. persisted as session view state

## 4. POINTER LIFECYCLE — For Each Shape (Action Level)

### Rectangle Creation

**Pointer Down:** Begins rect gesture. Stores start screen X,Y and startDoc (screenToDoc). Captures pointer, dragging=false, preview null.

**Pointer Move:** If not dragging and past threshold (3px), dragging=true. Computes doc end position, builds rect via normalizeRect or buildRect with modifiers (Shift=square, Alt=from-center). Preview: translucent rect overlay (editor-only, fill with alpha, stroke dashed), never in document. Schedule redraw.

**Pointer Up:** If dragging and valid rect (isValidRect: w>=1 and h>=1 doc px), commit one DrawRect command with x,y,w,h,fill from current fill color. If not valid (tiny click), no object, no command. Clear preview, selection = new id.

**Cancel:** pointercancel/blur/Esc/tool switch → discard preview, no command

**Escape:** Discard preview

### Oval Creation — Same as Rect but with ellipse

Down: start, Move: preview oval (translucent), Up: commit DrawOval if valid (w>=1,h>=1)

Modifiers: Shift=circle (w==h), Alt=from-center

### Line Creation

Down: start, Move: preview line from startDoc to currentDoc (translucent line), Up: commit DrawLine if length >=1px? Or allow tiny? For Line, maybe allow tiny but with min length 1px. One command.

Modifiers: Shift constrains to 45° multiples (horizontal/vertical/diagonal)

### Polygon/Star

Down: start defines center? Or corner? For Polygon, drag defines radius and rotation. For Star, also inner radius.

In Adobe PolyStar, drag defines size, options define sides and ratio. So down = center, move = radius + rotation preview, up = commit.

Modifiers: Shift constrains rotation to 45°, Alt from-center? Actually center is already start, so Alt maybe not needed.

## 5. MODIFIER KEYS

[INDUSTRY] Adobe Rectangle/Oval:
- Shift: Constrain to square/circle [Adobe Guide]
- Alt/Option: Draw from center (from-center) [Adobe]
- Shift+Alt: Square/circle from center

[INDUSTRY] Adobe Line:
- Shift: Constrain angle to 45° multiples [Adobe Pen but also for Line]

[INDUSTRY] Krita Rectangle/Ellipse:
- Shift: Keep square/circle
- Ctrl: Lock center (from-center) [Krita painting tools PDF]

[KINEORA] Modifiers:

- **Shift:** Rectangle → square (w==h), Oval → circle, Line → 45° angle constrain, Polygon → constrain rotation to 45° multiples
- **Alt/Option:** Rectangle/Oval/Line → draw from center (startDoc is center, not corner). For Polygon, start is center already, so Alt maybe no effect or toggles inner radius?
- **Shift+Alt:** Square/circle from center, or line 45° from center
- **Esc:** Cancel

Do not invent other modifiers.

## 6. CURSOR

- Default: Crosshair for all shapes
- Drawing: Crosshair
- Invalid: not-allowed over locked layer
- Precise: crosshair already precise

## 7. VISUAL FEEDBACK

- **Preview:** Translucent shape preview while dragging — fill with alpha (e.g., fill color with 0.3 alpha) + stroke dashed or solid, editor-only, never exported. For Line, preview line with stroke color.
- **Handles:** No handles while drawing, but after commit selection shows transform handles
- **Dimensions:** Status bar shows W×H or radius while dragging? Could show live dimensions in status bar or near cursor.
- **Error:** Locked layer → no preview, not-allowed cursor, toast on release "draw blocked"

## 8. DOCUMENT EFFECT

- Creates: Yes, Node::Rect, Node::Oval, Node::Line, Node::PolyStar at current frame on active layer
- Modifies: No (creation only for MVP, live primitive editing later)
- Deletes: No
- Geometry: x,y,w,h or x1,y1,x2,y2 or sides/ratio
- Style: Fill from current fill (except Line uses stroke), Stroke from current stroke, Stroke Width from current
- Animation: Auto-key at held frame

## 9. PREVIEW VS COMMIT

Temporary: startDoc, currentDoc, preview rect/oval/line computed via buildRect with modifiers, stored in Stage refs (rectPreviewRef), rendered as translucent overlay, cleared on cancel/commit

Committed: One command DrawRect/DrawOval/DrawLine/DrawPolyStar, creates node, selection = new id, document:changed

Why separation: Allows Esc cancel, one undo per shape, clean export (preview never exported), live feedback without doc writes

## 10. UNDO/REDO

- One shape drag = one undo entry
- Tiny click <1px or < threshold → no command, no undo
- Cancelled/failed → no undo
- Multiple shapes → multiple undo

## 11. LAYER BEHAVIOR

- Active layer must be Normal, visible, unlocked, ancestors visible/unlocked
- Locked/hidden/folder → blocked, toast, no command, log blocked
- Empty layer allowed, auto-key

## 12. TIMELINE BEHAVIOR

- Current frame: shape at playhead
- Keyframe: add to existing or auto-key copy-prev
- Blank: auto-key
- Existing: adds alongside
- Auto-key: F6 semantics, undo exact

## 13. SNAPPING

[INDUSTRY] Adobe: Snap to Point, Snap to Objects, grid, guides for shapes. Rectangle may snap to existing anchors.

[KINEORA] Snapping:

- **Grid:** If grid snap on, rect corners snap to grid
- **Point:** Snap to existing anchors/points
- **Object:** Snap to other objects' bounds? Maybe later
- **Angle:** Shift 45° is angle snap
- **Indicators:** Highlight snap target, magnet cursor, status text

For MVP, basic grid snapping for rect/oval/line.

## 14. INPUT DEVICES

- Mouse: Primary, drag to create
- Trackpad: Same
- Stylus: Same, more precise, no pressure for shapes (size from drag, not pressure)
- Pressure: Not used for shapes (unlike Brush)

## 15. EDGE CASES

- Empty canvas: first shape
- No selection: creates new, selection = new
- Existing: adds
- Overlapping: new on top
- Locked/hidden/folder: blocked
- Empty frame: creates keyframe
- Extreme zoom: screen→doc ÷ zoom, so same screen drag = different doc size depending on zoom — correct, doc size = screen ÷ zoom, so at 50% zoom same drag = double doc size (like Rect manual test D)
- Tiny: w<1 or h<1 or length<1 → no object, no command (MIN_RECT_DIM =1)
- Huge: beyond stage allowed, clipped on export
- Pointer leaving: commit if valid on release outside (like Rect does)
- Esc: discard
- Tool switch: discard
- Blur: discard
- Invalid: locked etc → no command
- Cancelled: no undo

## 16. ENGINEERING IMPLICATION

- Interaction state: RectGesture { startX,startY,dragging,lastDocX,lastDocY }, similar for Oval/Line/PolyStar
- Preview: DocRect {x,y,w,h} computed via normalizeRect (4 directions → top-left + positive) and buildRect (with square/fromCenter)
- Document: DrawRect/DrawOval/etc commands
- Hit-testing: none for creation
- Coordinate: screenToDoc, docToScreen, viewport zoom/pan
- Layer permission: editable_target_layer
- Timeline: playhead, active_layer, auto-key
- Undo: one per shape
- Rendering: canvasRenderer render previewRect as translucent
- Pointer capture: capture on down, release on up/cancel
- Cancellation: pointercancel, blur, Esc, tool switch

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Animate Rect/Oval/Line | Illustrator Rect/Oval/Line | Krita Shapes | Toon Boom | Blender GP Box/Circle | Kineora |
|----------|------------------------|----------------------------|--------------|-----------|-----------------------|---------|
| Drag creates shape | Yes | Yes | Yes (click drag defines box) | Yes | Yes (Box/Circle) | KEEP |
| Shift = square/circle | Yes [Adobe Guide] | Yes | Yes (Shift square) [Krita] | Yes | — | KEEP |
| Alt = from-center | Yes [Adobe] | Yes | Yes (Ctrl center) [Krita] | — | — | KEEP |
| Esc cancels | Yes (T2B.4) | Yes | — | — | — | KEEP |
| Object vs Merge mode | Yes [helpx draw] | — | — | — | — | KEEP |
| Live primitive with hinges (Primitive Rect/Oval) | Yes — Primitive has hinges [Adobe Guide] | Yes (live shape) | — | — | — | DEFER — MVP ordinary path, live primitive later |
| Corner radius for rounded rect | Yes (Primitive) | Yes | — | — | — | KEEP — corner_radius field, serde default |
| Inner radius for Oval Primitive (donut) | Yes [helpx draw oval] | — | — | — | — | DEFER |
| Line constrained 45° with Shift | Yes (Shift constrains) | Yes | Yes (Angle Constraints) [Krita] | — | — | KEEP |
| Fill/Stroke from current colors | Yes [helpx strokes] | Yes | Yes (Foreground/Background) [Krita] | — | — | KEEP |
| Min size 1px prevents accidental dots | Kineora decision (Rect) | — | — | — | — | KEEP — MIN_RECT_DIM 1px |

## 18. KINEORA DECISION

- KEEP: Drag to create rectangle/oval/line with crosshair cursor, Shift square/circle and 45° line constrain, Alt from-center, Esc cancel, Object Drawing toggle, fill/stroke from current colors, min size 1px no object, one undo per shape, layer checks (visible/unlocked/not folder + ancestors), auto-key at held frame, preview translucent editor-only, export uses doc stage clipped.

- MODIFY:
  - For Rounded Rectangle, keep corner_radius as field on Rect node with serde default 0, so old files load. UI: corner radius in Properties or Options. Reason: rounded rect is common, needs param.
  - For Oval, keep as separate node Oval, not just Rect with ellipse? Or use Rect with is_oval flag? Decision: separate Oval node for cleaner hit-test and export, but can share rect logic. Reason: hit-test for oval is ellipse, not rect.

- REJECT: Primitive hinges for MVP — ordinary path after creation, not live editable primitive. Reason: live primitive requires extra model for live params and conversion, too complex for MVP. Keep as future WISH.

- DEFER:
  - Polygon/Star/PolyStar live params (sides, ratio, inner radius) — needs PolyStar node, later
  - Oval Primitive inner radius, close path, start/end angle
  - Line as separate node vs Path with 2 points — for MVP, Line can be Path with 2 anchors, but define as separate for clarity later
  - Live shape editing via hinges

## 19. ACCEPTANCE CRITERIA

- Activates via R/O/N and toolbar, active state obvious, cursor crosshair
- Pointer down begins gesture, no doc change, captures pointer
- Pointer move past 3px threshold shows translucent preview (fill alpha 0.3 + stroke) updating live with modifiers
- Shift while dragging: rect square, oval circle, line 45°
- Alt while dragging: from-center (start is center)
- Shift+Alt: square/circle from center
- Pointer up with valid size (w>=1,h>=1 or length>=1) commits one Draw command, selection = new id, document:changed
- Click without drag or tiny <1px → no object, no command
- Esc / pointercancel / blur / tool switch discards preview, no command
- Locked/hidden/folder active layer or ancestor hidden/locked blocks → toast, no command
- Drawing at held frame auto-keys copy-prev, undo exact
- Preview never exported, committed shape exported in SVG with fill/stroke/rotation, clipped to stage
- Undo removes shape, redo restores
- Zoom/pan independent — doc size = screen ÷ zoom, position correct after pan
- Drag bottom-right→top-left normalizes to positive w/h (top-left origin)
- Overlapping shapes: new on top, both selectable, both exported
- Properties shows X,Y,W,H, Fill, Stroke, Corner Radius for rect when selected

Sources: Adobe Rectangle/Oval/Line [Adobe Guide], Adobe Draw Shapes [helpx draw], Krita Shapes [Krita painting tools PDF], Toon Boom Rectangle/Ellipse [Toon Boom], Blender GP Box/Circle [Blender GP]
