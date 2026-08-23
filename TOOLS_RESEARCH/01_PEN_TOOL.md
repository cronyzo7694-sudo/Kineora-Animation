# PEN TOOL — Deep Research (2D Vector Path Creation)

> **No Code — Only Research. 2D Only.**

**Tool Identity:**
- Name: Pen Tool
- Shortcut: P (Adobe Animate, Illustrator, Toon Boom)
- Category: Drawing / Precision Path
- Purpose: Create precise Bézier paths using anchor points and handles
- Typical Users: Illustrators, character designers, logo designers, animators needing clean vector shapes

---

## 1. PURPOSE

[INDUSTRY] Adobe Animate docs: "To draw precise paths as straight lines or smooth, flowing curves, use the Pen tool. When you draw with the Pen tool, click to create points on straight line segments and drag to create points on curved line segments." [helpx.adobe.com/animate/using/drawing-pen-tool.html]

[INDUSTRY] Illustrator: Pen creates paths with straight segments (click) and Bezier curves (click-drag). Anchor points define segments, control handles define curve shape. Path is defined by anchor positions + handle positions, curve is rendered mathematically.

[KINEORA] Pen Tool exists to give Kineora users the same precision as Illustrator/Animate for character outlines, props, and clean vector art that Pencil/Brush cannot achieve. It should be the tool for deliberate, editable vector construction, not freehand sketching.

When to use Pen: When user needs exact control over curves, sharp corners, smooth joins, editable after creation, closed shapes with fill.

When NOT to use Pen: When user wants fast freehand sketching (use Pencil), or textured painting (use Brush), or geometric primitives (use Rect/Oval).

Dependencies: Requires Node::Path model with bezier anchors, Subselection Tool for editing, Fill/Stroke color system, Snap system, Viewport coordinate conversion.

---

## 2. UI

[INDUSTRY] Adobe Tools Panel: Pen is in drawing area, icon is pen nib. Flyout contains Add Anchor Point (+), Delete Anchor Point (-), Convert Anchor Point (Shift+C). [Illustrator Pen Guide]

[INDUSTRY] Illustrator cursors: Different cursors for different states — Initial Anchor (first point), Sequential Anchor (continuing), Add (+ next to pen), Delete (- next to pen), Convert (^), Close (small circle next to pen), Continue (slash), Retract handles.

[KINEORA] UI Specification:

- **Toolbar Location:** Drawing group, second row after Selection/Transform/Lasso. Icon: pen nib with 45° angle, 18x18px line icon.
- **Icon Meaning:** Pen nib = precision path creation, not freehand.
- **Grouping:** Grouped with Add/Delete/Convert anchor tools via flyout (long-press triangle indicator).
- **Active State:** Background #2d5aa7, border #5a8fc0, icon #eaf3ff when active. Inactive: transparent, #c9c9c9.
- **Hover State:** Background #3a3a3a, tooltip appears at left:44 top:6 with "Pen Tool (P)" + "— coming soon" if not implemented.
- **Disabled State:** Opacity 0.5, cursor not-allowed, tooltip shows reason "engine not attached" or "needs Path model".
- **Keyboard Focus:** Focus ring, same tooltip on focus.
- **Tooltip:** "Pen Tool (P)" + description "Creates precise Bézier paths — click for corner, drag for curve"
- **Cursor:** Default pen icon. States:
  - Initial: pen with small x (first point, terminates existing path)
  - Sequential: pen with small line (continuing path)
  - Add: pen with + (over path segment, can add anchor)
  - Delete: pen with - (over anchor, can delete)
  - Convert: pen with ^ (over smooth point, click to convert to corner)
  - Close: pen with small circle (over first anchor, will close)
  - Continue: pen with slash (over endpoint, will continue)
  - Retract: pen with small arrow (over anchor with handles, will retract handles)
- **Options Panel:** 
  - Show Pen Preview (checkbox) — previews line from last point to cursor
  - Show Solid Points (checkbox) — selected hollow vs solid
  - Show Precise Cursors (checkbox) — crosshair vs pen icon, Caps Lock toggles
  - Object Drawing toggle (Merge vs Object mode)
- **Properties Panel:** When path selected, shows fill, stroke, stroke width, path closed/open, anchor count.
- **Context Controls:** None beyond Options.

---

## 3. ACTIVATION

[INDUSTRY] Adobe: Click Pen icon in Tools panel, or press P. If another path is being drawn, starting new path terminates previous. Pen stays active until user switches tool, or presses Esc, or Ctrl+click away.

[KINEORA] Activation:

- **Toolbar Activation:** Click Pen icon → setTool('pen'), bus emits tool:changed {toolId:'pen'}, status bar shows "tool: pen", Stage cursor becomes pen.
- **Keyboard Activation:** Press P → same as toolbar. If already active, does nothing.
- **Tool Switch Behavior:** When switching FROM Pen to another tool:
  - If path is being drawn (has at least one anchor but not finished), path remains as temporary preview? In Adobe, unfinished path stays? Actually Adobe terminates path when switching tools — the preview is discarded, no document change, no undo. Kineora should same: switching tools discards in-progress path preview, no command.
- **What Happens to Previous Tool:** Previous tool's preview (e.g., Rect preview) is discarded. Its state (e.g., selection) is preserved.
- **State Persistence:** Pen's own state (Show Preview preference) is session view state, persisted in toolOptions, not document. Last used fill/stroke from colors area persists.
- **State Reset:** In-progress path anchors reset on tool switch, Esc, blur, or successful commit.

---

## 4. POINTER / INPUT LIFECYCLE

### Pointer Down — What Begins?

[INDUSTRY] Adobe Pen: First click creates initial anchor point (beginning of new path, terminates existing). Second click creates second anchor + visible segment (unless Show Preview off, then segment not visible until second point). Click-drag creates smooth point with two handles.

[KINEORA] Pointer Down begins:
- Hit-test: Is pointer over existing path segment? → Add anchor mode (if path selected)
- Over existing anchor? → Delete or Convert or Continue mode depending on anchor type and whether drawing in progress
- Over first anchor of current path? → Close path mode
- Over endpoint of existing path (not current)? → Continue path mode
- Else → Create new anchor (corner if click, smooth if drag)
- Captures pointer, starts gesture, stores startDoc position.

### Pointer Move — What Changes?

[INDUSTRY] Adobe: If Show Pen Preview on, preview line from last anchor to cursor follows. If dragging to create curve, handles extend, curve preview updates. Shift constrains angle to 45° multiples. Alt breaks handle symmetry.

[KINEORA] Pointer Move updates:
- If creating anchor via drag: handle length/direction updates, temporary curve preview updates (editor-only, translucent, never in export)
- If Show Preview: straight preview line from last anchor to current doc position
- If hovering over close target: cursor changes to close indicator
- Screen→Doc conversion via viewport, zoom/pan independent
- No document mutation, only preview state, scheduleRedraw via rAF

### Pointer Up — What Commits?

[INDUSTRY] Adobe: On release, anchor is committed to temporary path (not yet document). Path is only committed to document when closed, or double-clicked, or tool switched, or Enter? Actually Adobe: To complete open path, double-click last point, click Pen icon, or Ctrl+click away. To close, click first anchor.

[KINEORA] Pointer Up:
- If creating new anchor: anchor added to in-progress path (temporary, not yet document)
- If closing: path closed, one command committed to document (DrawPath with closed=true)
- If adding anchor to existing path: one command (AddAnchor)
- If deleting anchor: one command (DeleteAnchor)
- Validation: path must have at least 2 anchors to create segment, at least 3 to close with area? But allow 2-point line as open path.
- Commit exactly one undoable command on successful completion, emits document:changed

### Cancel — What Happens?

[INDUSTRY] Adobe: Esc cancels current path drawing, no document change. Pointercancel, blur also cancel.

[KINEORA] Cancel:
- Pointercancel / window blur / tool switch / Esc → discard in-progress path preview, no command, no undo entry, scheduleRedraw to clear preview
- If editing existing path (move anchor), Esc reverts anchor to original position, no command

### Escape — What Happens?

- If in-progress path exists: discard it, no document change
- If no in-progress path but a path is selected: deselect? Or do nothing? In Adobe, Esc deselects? Actually Esc = cancel drawing, not deselect. Kineora: Esc discards preview only, selection unchanged.

### Tool Switch — What Happens?

- Discards in-progress path preview, no command
- If path was being edited (move anchor), discards edit
- New tool activates

### Window Blur — What Happens?

- Same as cancel: discards preview, releases pointer capture, no command

---

## 5. MODIFIER KEYS

[INDUSTRY] Adobe Pen modifiers:
- Shift: Constrains angle to multiples of 45° while creating/editing anchors/handles [Pen doc]
- Alt/Option: Breaks handle symmetry (unhinges handles), or splits curve, or converts. While creating bezier, Alt-drag splits handles. Over handle + Alt = split.
- Ctrl/Cmd: Allows editing bezier curve when over handle, or closes? Actually Ctrl+click away completes open path, or Cmd for Direct Selection access.
- Shift+C: Convert Anchor Point tool
- Caps Lock: Toggles precise cursor (crosshair)

[KINEORA] Modifiers:

- **Shift:** While creating anchor or dragging handle, constrain angle to 45° multiples (0°,45°,90°, etc.) and constrain handle length? For straight segments, Shift-click constrains segment angle. For handles, Shift-drag constrains handle angle.
- **Alt/Option:** While dragging handle, break symmetry — handles move independently (one side only). While creating smooth point, Alt-drag after creation converts to corner with one handle. Over existing smooth point + Alt-drag = convert to corner with independent handles.
- **Ctrl/Cmd:** While over handle, allows editing handle without switching to Subselection. Ctrl+click away from path = finish open path.
- **Shift+Alt:** Constrain + break — constrain independent handle to 45°.
- **Platform Differences:** Alt on Windows = Option on Mac. Ctrl on Windows = Cmd on Mac for some actions. Document both.

Do not invent undocumented modifiers.

---

## 6. CURSOR

Document all cursor states:

- **Default:** Pen nib icon (18px)
- **Hover over empty stage:** Pen with small x (ready to create first anchor)
- **Hover over existing path segment (selected path):** Pen with + (add anchor)
- **Hover over anchor point (selected path):** Pen with - (delete anchor)
- **Hover over smooth point:** Pen with ^ (convert to corner)
- **Hover over first anchor of current path:** Pen with circle (close path)
- **Hover over endpoint of other path:** Pen with slash (continue path)
- **Dragging handle:** Grabbing hand or pen with handle
- **Invalid operation (e.g., over locked layer):** Not-allowed cursor
- **Snapping:** When snapping to point/grid, cursor may show magnet or highlight

---

## 7. VISUAL FEEDBACK

[INDUSTRY] Adobe: Anchor points displayed as squares (corner) or circles (smooth), hollow vs solid for selected. Handles displayed as lines with dots. Preview line from last point to cursor if preference on. Path highlighted with layer color.

[KINEORA] Visual Feedback:

- **Preview:** While drawing, translucent preview of segment from last anchor to cursor (editor-only, never exported). If dragging curve, preview curve with handles.
- **Anchors:** In-progress path anchors shown as small squares (corner) or circles (smooth), color #fff with border #000, size 6px. Selected anchor = hollow, unselected = solid? Or per preference Show Solid Points.
- **Handles:** Direction lines from anchor to control point, thin line #888, handle dot #fff border #000, size 4px.
- **Bounding Box:** No bounding box while drawing, but after commit, selection shows box.
- **Highlights:** When hovering over add/delete target, path segment highlights with layer color.
- **Snapping Indicators:** When snapping to grid/point, small magnet icon or highlight of target anchor.
- **Completion:** When closing, small circle near cursor, first anchor highlights.
- **Error:** If over locked layer, cursor not-allowed, no preview.

---

## 8. DOCUMENT EFFECT

[INDUSTRY] Pen creates new vector path entities, or modifies existing paths (add/delete/move anchors).

[KINEORA] Document Effect:

- **Creates Content:** Yes, when path is finished (closed or open), creates Node::Path with anchors, fill, stroke, stroke width from current colors.
- **Modifies Content:** Yes, when adding/deleting/moving anchors or handles on existing path.
- **Deletes Content:** Yes, when deleting anchor (path redrawn without it).
- **Modifies Geometry:** Yes, anchor positions and handle positions define path geometry.
- **Modifies Style:** No, style (fill/stroke) comes from colors area at creation, not modified by Pen itself. Existing path style preserved when editing geometry.
- **Modifies Animation Exposure:** No, but creation may auto-keyframe if drawing at held frame (F6 semantics).
- **Modifies Color:** No.

---

## 9. PREVIEW VS COMMIT

**Temporary Editor State:**

- In-progress path anchors list (not yet in document)
- Preview segment from last anchor to cursor
- Handle drag preview
- Cursor state
- All stored in Stage's refs (rectPreviewRef equivalent for pen), renderer-only, cleared on cancel/commit

**Committed Document State:**

- When path is closed or explicitly finished (double-click, Ctrl+click away, tool switch after at least 2 points?), one command DrawPath { anchors, closed, fill, stroke, etc. } committed to engine, which creates Node::Path in document at current frame on active layer
- After commit, preview cleared, selection set to new path id

**Why Separation Matters:** Prevents document pollution with incomplete paths, allows Esc to cancel without undo, ensures one undo per completed path, keeps export clean (preview never exported), allows smooth live feedback without writing document each move.

---

## 10. UNDO / REDO

- **What Creates Undo:** One completed path (open or closed) = one undo entry. One add anchor = one entry. One delete anchor = one entry. One move anchor/handle = one entry.
- **What Does Not:** Pointer move preview, hover, cursor changes, failed/cancelled gestures, zero-delta moves.
- **Gesture Boundaries:** From first anchor creation to path completion (close or finish) = one gesture = one undo, even though multiple pointer downs occurred. Alternative: each anchor could be separate? But Adobe: whole path is one? Actually Adobe Pen: each click adds point but undo removes last point? Need to decide. Kineora: one path = one undo for simplicity, matches Rectangle tool (one command per shape).
- **Cancelled:** Esc, pointercancel, blur, tool switch during drawing → no undo entry
- **Failed:** Locked layer, hidden layer, folder → no command, no undo, toast
- **Repeated:** Drawing multiple paths = multiple undo entries

---

## 11. LAYER BEHAVIOR

- **Active Layer:** New paths created on active layer at playhead frame. Must be Normal (not folder), visible, unlocked.
- **Locked Layer:** If active layer locked, draw blocked → no node, no command, toast "draw blocked: layer locked", log "draw:blocked(locked)"
- **Hidden Layer:** If active layer hidden (visible=false) but unlocked, is it allowed? In Kineora current, hidden layers are not rendered but still allow frame editing? For drawing, B-5 says editable_target_layer requires visible and unlocked. So hidden → blocked, toast "layer hidden"
- **Empty Layer:** Allowed, will create keyframe if needed (auto-key F6 copy-prev)
- **Non-editable Layer (Folder):** Folder is not draw target → blocked, toast "folder — not a frame target"
- **Layer Hierarchy:** If active layer is child of hidden/locked folder, ancestor walk must block (B-1/B-3). So check layer_and_ancestors_visible/unlocked.

---

## 12. TIMELINE BEHAVIOR

- **Current Frame:** Path created at playhead frame on active layer
- **Keyframe:** If frame already has content keyframe, new path added to that keyframe's content
- **Blank Frame:** If blank keyframe, converting? Actually draw at blank? In Adobe, drawing at blank creates content? In Kineora, DrawRect does ensure_keyframe (F6 copy-prev) — drawing at held frame auto-keys and preserves existing. So Pen should same: if at held frame, auto-create keyframe copying previous content, then add path.
- **Existing Drawing:** New path added alongside existing content at that frame
- **Empty Frame:** If no keyframe before, creates keyframe at 1? Or at playhead? Should create keyframe at playhead with new path
- **Auto-keyframe:** When editing held frame, auto-keys (F6 semantics), undo removes keyframe exactly
- **Frame Exposure:** New content holds until next keyframe (held span)

---

## 13. SNAPPING

[INDUSTRY] Adobe: Snap to Point (tolerance 1-8px), Snap to Objects, grid, guides. Pen tool snaps to existing anchors, to grid, to objects.

[KINEORA] Snapping:

- **Point Snapping:** When pointer near existing anchor (tolerance maybe 8px screen), snap to that anchor position, show highlight. Tolerance setting in preferences (Click Accuracy).
- **Grid Snapping:** If grid visible and snap to grid on, snap anchor to grid intersection
- **Guide Snapping:** If guides exist, snap to guides
- **Object Snapping:** Snap to other objects' bounds? Maybe later
- **Angle Snapping:** Shift constrains to 45° multiples — this is angle snapping
- **Snap Indicators:** When snapping, cursor shows magnet, or anchor highlights, or small text "anchor" / "grid"
- **When Activates:** On pointer move, check nearby snap targets within tolerance (screen-space, not doc-space, so zoom independent)
- **UI Communication:** Highlight of snap target, cursor change, maybe status bar shows "snap to anchor"

---

## 14. INPUT DEVICES

- **Mouse:** Primary. Click = corner point, click-drag = smooth point with handles. Pressure not applicable for Pen (vector, not brush). Right-click? No, right-click not used for Pen (context menu later).
- **Trackpad:** Same as mouse, but may have less precision. No pressure.
- **Stylus (without pressure):** Same as mouse, but may have more precision.
- **Pressure-sensitive Tablet:** Pen Tool does NOT use pressure for path creation (unlike Brush). Pressure ignored. But tablet may give more precise positioning. Wacom pen uses brush settings when Brush selected, else eraser settings — but for Pen, no pressure.
- **Differences:** Mouse vs tablet same for Pen, except tablet may have better accuracy, but no pressure effect.

---

## 15. EDGE CASES

- **Empty Canvas:** No existing paths, first anchor creates initial point, no segment visible until second anchor (unless preview on)
- **No Selection:** No path selected, Pen over empty = create new path. Over existing path but not selected? In Adobe, Pen over unselected path does not add anchor until path selected with Selection tool. Kineora: require path selected? Or allow add if any path under cursor? Decision: require selection for add/delete, to avoid accidental edits.
- **Existing Object:** Clicking on existing path with Pen when no path being drawn → should select path? Or add anchor? In Adobe, Pen over selected path adds/deletes. Over unselected path, it selects? Actually Pen over unselected path may select it? Need to define: Kineora: if over existing path and no in-progress path, first select that path (if not already), then allow add/delete.
- **Overlapping Objects:** Hit-test frontmost first. Pen over overlapping area where multiple paths overlap — topmost path gets add/delete.
- **Locked Layer:** Active layer locked → blocked, no preview, not-allowed cursor, toast
- **Hidden Layer:** Active layer hidden → blocked
- **Empty Frame:** No keyframe at playhead, drawing creates new keyframe
- **Existing Drawing:** Adds to existing keyframe content
- **Extreme Zoom:** At 25% zoom, 1 doc px = 0.25 screen px, but anchor creation still uses doc coords, so tiny moves still create valid anchors. At 800% zoom, large screen moves = small doc moves, still accurate because screen→doc conversion divides by zoom.
- **Tiny Object:** Path with anchors very close together — should still be valid, but may be hard to select. Minimum distance? No minimum for Pen, unlike Rect (1px min). Allow tiny.
- **Huge Object:** Path extending beyond stage onto pasteboard — allowed, staging area, still selectable, but export clips to stage.
- **Pointer Leaving Canvas:** While drawing, pointer leaves canvas → preview should still follow? Or pause? In Adobe, if pointer leaves, preview may stop at edge? Kineora: if pointer leaves during drag, still update preview based on last known doc position, and on pointerup outside, commit if valid (like Rect tool does).
- **Escape During Operation:** Discard in-progress path, no command
- **Tool Switch During Operation:** Discard preview, no command
- **Window Losing Focus:** Discard preview (blur handler)
- **Invalid Operation:** Closing path with only 1 anchor → invalid, no command, maybe toast "need at least 2 points to close"
- **Cancelled Operation:** No undo entry

---

## 16. ENGINEERING IMPLICATION

NO CODE — Conceptual requirements:

- **Interaction State:** Need to track in-progress path: list of anchors (each with x,y, handle_in, handle_out, kind), isDrawing flag, last anchor, preview position, current mode (create, add, delete, convert, close, continue)
- **Preview State:** Temporary visual preview of segment from last anchor to cursor, plus handles, stored in Stage refs, rendered via canvasRenderer as editor-only overlay (never in document), cleared on cancel/commit
- **Document State:** Committed path becomes Node::Path in document model at current frame on active layer, via command DrawPath
- **Hit-testing Requirement:** Need hit_test for existing paths (point near segment? anchor hit?), and anchor hit radius (maybe 6px screen), and segment hit tolerance
- **Coordinate Conversion:** Every pointer event: screen (clientX - wrap left) → doc via screenToDoc(viewport, sx, sy) which divides by zoom and subtracts pan. Must be zoom/pan independent.
- **Selection Dependency:** Need to know if path under cursor is selected, to decide add/delete. Selection from statusJson().selection
- **Layer Permission:** Check editable_target_layer() — active layer exists, is Normal, visible, unlocked, ancestors visible/unlocked. If fails, block with toast.
- **Timeline Dependency:** Need playhead, active_layer, active_scene from statusJson(), and auto-keyframe logic (ensure_keyframe) in engine when drawing at held frame.
- **Undo Boundary:** One completed path = one command, one undo entry. Add/delete anchor = one entry each. Zero-delta or cancelled = no entry.
- **Rendering Feedback:** canvasRenderer must draw preview path (translucent), anchors (squares/circles), handles (lines + dots), snap highlights. All editor-only, never in SVG export.
- **Pointer Capture:** On pointerdown, capture pointer (setPointerCapture), release on pointerup/cancel/blur/Esc/tool switch
- **Cancellation:** Handlers for pointercancel, blur, keydown Esc (capture phase), tool switch

---

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Adobe Animate | Illustrator | Krita (Vector) | Toon Boom | OpenToonz | Blender GP | Kineora |
|----------|---------------|-------------|----------------|-----------|-----------|------------|---------|
| First anchor creates path start, terminates previous | Yes — Initial Anchor pointer [2] | Yes | Yes (freehand path) | Yes | — | Yes (new stroke) | KEEP — terminates previous, starts new |
| Click = corner, Drag = smooth with handles | Yes [2] | Yes | — | — | — | — | KEEP |
| Shift constrains 45° | Yes [2] | Yes (Shift 45/90) | — | — | — | — | KEEP |
| Alt breaks handle symmetry | Yes (Alt drag splits) [2] | Yes (Alt splits) | — | — | — | — | KEEP |
| Add anchor over segment (+) | Yes — Add pointer [2] | Yes (+) | — | — | — | — | KEEP — requires path selected |
| Delete anchor over anchor (-) | Yes — Delete pointer [2] | Yes (-) | — | — | — | — | KEEP |
| Convert smooth to corner (click) / corner to smooth (Alt-drag) | Yes — Convert ^ [2] | Yes (Shift+C) | — | — | — | — | KEEP |
| Close path by clicking first anchor (circle) | Yes — Close pointer with circle [2] | Yes | Yes | Yes | — | Yes (close) | KEEP |
| Continue path from endpoint (slash) | Yes — Continue pointer [2] | Yes | — | — | — | — | KEEP |
| Show Pen Preview preference | Yes [2] | — | — | — | — | — | KEEP — session view state |
| Show Precise Cursors (crosshair, Caps Lock) | Yes [2] | — | — | — | — | — | MODIFY — maybe always crosshair for precision? |
| Object vs Merge drawing mode | Yes — Object Drawing button [helpx draw] | — | — | — | — | — | KEEP — affects selection after creation |
| Fill/Stroke from current colors | Yes — Tools panel colors [helpx] | Yes | — | — | — | — | KEEP |

---

## 18. KINEORA DECISION

- **KEEP:** All core Pen behaviors from Adobe/Illustrator: click=corner, drag=smooth, Shift=45°, Alt=break handles, Add/Delete/Convert pointers, Close with circle, Continue with slash, Show Preview preference, one undo per completed path, layer permission checks (visible/unlocked/not folder + ancestors), auto-keyframe at held frame.

- **MODIFY:** 
  - Precise Cursors: Instead of preference, always use crosshair when Pen active for precision, but allow Caps Lock toggle as Adobe does. Reason: crosshair more precise for vector work.
  - Path completion: Adobe requires double-click or Ctrl+click away to finish open path. Kineora should also allow Enter to finish open path (more discoverable), and Esc to cancel. Reason: keyboard accessibility.

- **REJECT:**
  - Scissors tool as separate tool — merge into Pen's delete/convert workflow. Reason: reduces toolbar clutter, matches Kineora's clean UI goal.
  - Disable Auto Add/Delete preference (Illustrator) — Kineora should always allow auto add/delete when path selected, for simplicity. No preference.

- **DEFER:**
  - Path Simplify/Optimize (Object > Path > Simplify) — advanced cleanup, later unit
  - Join paths (Ctrl+J) — needs two endpoints selected, later
  - Average/Join and Average — later

---

## 19. ACCEPTANCE CRITERIA

Testable behavioral statements:

- Tool activates via toolbar click and via P shortcut, active state visually obvious (#2d5aa7 background)
- Cursor changes to pen icon, and to +, -, ^, circle, slash when over relevant targets
- First click creates initial anchor, terminates any existing in-progress path, no document change yet
- Second click creates visible segment (if preview on) or segment appears after second point
- Click creates corner point (no handles), drag creates smooth point with symmetric handles
- Shift while creating constrains angle to 45° multiples
- Alt while dragging handle breaks symmetry (handles independent)
- Pointer move updates only temporary preview, never document
- Pointer up adds anchor to in-progress path (temporary)
- Double-click last point or Ctrl+click away or Enter finishes open path — one DrawPath command, one undo entry, selection set to new path
- Clicking first anchor (hollow) with circle indicator closes path — one command with closed=true
- Hover over selected path segment shows + and clicking adds anchor — one AddAnchor command
- Hover over anchor shows - and clicking deletes anchor — one DeleteAnchor command, path redrawn
- Clicking smooth point with ^ converts to corner (handles removed) — one Convert command
- Alt-drag corner point creates independent handles — converts to smooth with broken symmetry
- Escape during drawing discards in-progress path, no command, no undo entry
- Pointercancel / blur / tool switch during drawing discards preview, no command
- Locked/hidden/folder active layer blocks drawing — no node, no command, toast with reason, log blocked
- Drawing at held frame auto-creates keyframe copying previous content (F6 semantics), undo removes keyframe exactly
- New path uses current fill/stroke from colors area
- Preview, anchors, handles are editor-only, never appear in SVG export
- Undo restores exact previous document state, redo restores path
- Extreme zoom (25%-800%) still creates accurate doc-space anchors (screen→doc ÷ zoom)
- Tiny anchors (close together) allowed, huge paths beyond stage allowed (pasteboard staging, clipped on export)
- Pointer leaving canvas during drag still updates preview and commits on release outside if valid

**Sources:**
- Adobe Animate Pen Tool: https://helpx.adobe.com/animate/using/drawing-pen-tool.html
- Adobe Drawing Preferences: https://helpx.adobe.com/animate/using/drawing-preferences.html
- Illustrator Pen Guide: https://www.maaillustrations.com/blogs/magazine/features-and-functions-of-pen-tool
- Adobe Tools Panel: https://helpx.adobe.com/animate/using/using-stage-tools-panel.html
