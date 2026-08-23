# BRUSH TOOL — Deep Research (2D Painting)

> No Code, 2D Only

## 1. PURPOSE

[INDUSTRY] Adobe Animate: "Use the Brush Tool (B) to custom-define a brush by setting parameters of the brush such as shape and angle. You can create natural artwork in your projects by customizing the brush tool to suit your drawing needs." [helpx basic-tools] + "Paint with the Brush tool" — Animate scales brush size proportionately to zoom, Pressure/Tilt support [helpx draw].

[INDUSTRY] Krita: Brush engines — Pixel Brush, Color Smudge, etc. Options: Brush Tips, Blending Modes, Opacity, Flow, Size, Ratio, Spacing, Paint Thickness, Rotation, Scatter, Texture, etc. Sensors: Pressure, Tilt, Speed, Distance, etc. [docs.krita.org brush settings]

[INDUSTRY] Toon Boom: Brush tool with tip library, min/max size with pressure, tilt sensitivity, taper, smoothing [docs.toonboom eraser properties but brush similar]

[KINEORA] Brush exists for natural painting, fills, artistic strokes, not just outlines. Unlike Pencil (stroke only) and Pen (precision), Brush paints filled shapes or textured strokes, with pressure for expressive width/opacity. It's for coloring, shading, and artistic line art.

Use Brush: Painting fills, expressive lines with pressure, coloring, artistic strokes.

Not Brush: Precise geometric (Rect/Oval), exact bezier (Pen), uniform thin lines (Pencil).

Dependencies: Brush engine, Node::BrushStroke or similar, Fill color, Pressure/Tilt sensors, Layer permissions, Timeline.

## 2. UI

- **Toolbar:** Drawing group, icon: brush tip angled. Shortcut B. Active #2d5aa7. Tooltip "Brush Tool (B)"
- **Cursor:** Brush circle showing size, or brush icon. While drawing, brush tip preview. Pressure icon shows if Wacom connected.
- **Options:**
  - Brush Mode: Paint Normal (paints over lines and fills), Paint Fills Only, Paint Behind (blank areas only), Paint Selection (applies fill to selection), Paint Inside (paints fill where stroke starts, never lines) [helpx draw]
  - Brush Size: dropdown or slider, 1px to large
  - Brush Shape: round, square, etc.
  - Pressure: icon to enable pressure sensitivity (only if Wacom) — varies width
  - Tilt: icon to enable tilt — varies angle
  - Stage zoom level checkbox — if enabled, brush size scales with zoom; if disabled, constant pixel size [helpx draw]
  - Smoothing slider (0-100) for Smooth mode
  - Object Drawing toggle
- **Properties:** Fill color (Brush paints fill, not stroke), Brush size/shape, Smoothing, Pressure min/max
- **Colors Area:** Fill color used for brush, stroke ignored? In Adobe Brush paints fill. So fill swatch matters.
- **StatusBar:** "brush" + size

## 3. ACTIVATION

- Toolbar click or B → setTool('brush'), tool:changed, cursor brush circle
- Spacebar temporary Hand still works (spaceHeld)
- Switching discards previous preview
- State: Brush Mode, Size, Shape, Pressure/Tilt enabled, Smoothing persisted as session view state

## 4. POINTER LIFECYCLE

**Down:** Begins brush stroke. No hit-test for selection, always creates new stroke even over existing. Captures pointer, stores startDoc, begins gesture with points.

**Move:** While dragging, adds dabs (points) with spacing, updates preview stroke (editor-only). If Pressure enabled and tablet, size varies with pressure (min/max). If Tilt enabled, angle varies. Spacing controls how many dabs. If mode Paint Fills Only, only paints where fill exists; Paint Behind only blank; Paint Inside only fill where started; Paint Selection only selected area. So preview must respect mode.

**Up:** Validates — if drag < threshold? For Brush, tiny click maybe creates dot? In Adobe, Brush click creates single dab. Kineora: if drag <3px, still create dot (single fill). Commit one DrawBrush command with points, size, fill, mode.

**Cancel:** pointercancel/blur/Esc/tool switch → discard preview, no command

## 5. MODIFIERS

- **Shift:** No documented for Brush? Maybe constrains? In Animate, Shift not for Brush. So no.
- **Alt:** No
- **Ctrl/Cmd:** No
- **Pressure:** Varies size between min and max (Toon Boom: Minimum and Maximum Size, Pressure checkbox) [eraser properties but brush similar]
- **Tilt:** Varies angle (Pen Tilt Sensitivity)
- **Speed:** Varies size (Speed sensitivity)
- **Modifier Combos:** Pressure + Tilt can combine

Do not invent Shift/Alt for Brush without evidence.

## 6. CURSOR

- Default: Brush circle showing size (e.g., 10px circle) or brush icon
- Drawing: Brush tip
- Pressure active: circle may change size with pressure preview
- Invalid: not-allowed over locked layer
- Gap: When Paint Inside mode and starting in empty area, no paint → maybe cursor shows blocked?

## 7. VISUAL FEEDBACK

- Preview: While dragging, shows stroke preview in fill color, with size variation if pressure, with texture if textured brush. Editor-only, solid (not translucent like Rect), but still preview until commit? Actually Brush paints as you draw, but Kineora should keep preview until release for undo consistency, then commit.
- No handles while drawing
- After commit, stroke becomes selectable object? In Adobe Merge mode, brush strokes merge with existing fills? Actually Brush paints fills that merge? In Animate, brush strokes are fills that can merge? But Kineora: each stroke is separate object? Or merges? Decision: for MVP, each brush stroke is separate Node, like Rect, for simplicity and undo exactness. Merging deferred.
- Mode feedback: If Paint Selection mode and nothing selected, status shows "no selection" and no paint.

## 8. DOCUMENT EFFECT

- Creates: Yes, Node::BrushStroke or Node::Rect? Actually brush creates fill shapes. For MVP, could be Node::Path with fill, or Node::BrushStroke with points. Creates at current frame on active layer.
- Modifies: No (creates)
- Deletes: No
- Geometry: Freehand points with width
- Style: Fill color from current fill, no stroke, size from brush size + pressure
- Animation: Auto-key at held frame

## 9. PREVIEW VS COMMIT

Temporary: Points list with size per dab, preview stroke rendered as overlay, mode-filtered, cleared on cancel/commit

Committed: One command DrawBrush { points, size, fill, mode }, creates node, selection = new id, document:changed

Why separation: Allows Esc cancel, one undo per stroke, prevents tiny accidental dots? But Brush dot allowed, so threshold lower than Pencil. Still separation for clean export and undo.

## 10. UNDO/REDO

- One stroke = one undo
- No undo for preview
- Cancelled/failed = no undo
- Multiple strokes = multiple undo

## 11. LAYER BEHAVIOR

- Active layer must be Normal, visible, unlocked, ancestors visible/unlocked
- Locked/hidden/folder → blocked, toast
- Paint Behind mode: paints in blank areas only, but still requires editable active layer
- Paint Inside: paints only inside fill where started — if start in empty, no paint, but not error? Should be no-op, no command, maybe toast "paint inside: start inside a fill"

## 12. TIMELINE BEHAVIOR

- Current frame: stroke at playhead
- Keyframe: add to existing or auto-key copy-prev
- Blank: same
- Existing: adds alongside
- Auto-key: F6 semantics

## 13. SNAPPING

- Brush generally does NOT snap — freehand painting, snapping would break artistic flow
- So no snapping for Brush

## 14. INPUT DEVICES

- **Mouse:** Works, constant size (max size), no pressure, no tilt
- **Trackpad:** Same as mouse, may be less precise
- **Stylus (no pressure):** Same as mouse, but more precise
- **Pressure Tablet (Wacom):** Key for Brush! Pressure varies size between min and max (Toon Boom: Minimum Size % of Maximum, Pressure checkbox to invert). Also varies opacity/flow. Tilt varies angle (Pen Tilt Sensitivity %). Rotation varies if pen supports.
- **Differences:** Mouse = uniform size, tablet with pressure = variable size, more expressive. This is why Brush is distinct from Pencil — Pencil no pressure, Brush has pressure.

## 15. EDGE CASES

- Empty canvas: first stroke
- No selection: Paint Selection mode requires selection — if none, no paint, no command, toast "paint selection: select a fill first"
- Existing object: Paint Normal paints over, Paint Fills only paints fills, Paint Behind only blank, Paint Inside only inside start fill
- Overlapping: New stroke on top
- Locked/hidden/folder: blocked
- Empty frame: creates keyframe
- Extreme zoom: If Stage zoom level checkbox enabled, brush size scales with zoom (so same screen size at any zoom), if disabled, constant doc size (appears larger at lower zoom). Kineora should decide: for MVP, brush size scales with zoom? Actually Rect tool doc size = screen ÷ zoom, so at 50% zoom same drag = double doc size. For Brush, if size scales with zoom, same brush appears same screen size at any zoom (more natural). So option needed. For MVP, keep constant doc size for simplicity (like Rect), but document the option as future.
- Tiny: click creates dot (single dab) — allowed, unlike Pencil/Rect which require min drag. So Brush dot is valid.
- Huge: stroke beyond stage allowed
- Pointer leaving: commit if valid
- Esc: discard
- Tool switch: discard
- Blur: discard
- Invalid: locked, or Paint Inside start in empty → no-op
- Cancelled: no undo

## 16. ENGINEERING IMPLICATION

- Interaction state: BrushGesture { points: Vec<Pt with pressure>, size, mode, isDragging }
- Preview: temporary stroke with dabs, rendered via canvasRenderer
- Document: DrawBrush command
- Hit-testing: none for creation, but for modes Paint Fills/Inside need to know if point is inside fill? That requires point-in-fill test at startDoc
- Coordinate: screenToDoc via viewport
- Layer permission: editable_target_layer + mode-specific checks
- Timeline: playhead, active_layer, auto-key
- Undo: one per stroke
- Rendering: preview stroke with variable width if pressure, respecting mode
- Pointer capture: capture on down, release on up/cancel
- Cancellation: pointercancel, blur, Esc, tool switch

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Animate Brush | Krita Brush | Toon Boom Brush | Blender GP Draw | Kineora |
|----------|---------------|-------------|-----------------|-----------------|---------|
| Paints fill (not stroke) | Yes [helpx draw] | — | Yes | — | KEEP — brush paints fill |
| 5 modes: Normal/Fills/Behind/Selection/Inside | Yes [helpx draw] | — | — | — | KEEP |
| Size scales with zoom option | Yes [helpx draw] | — | — | — | MODIFY — for MVP constant doc size, option later |
| Pressure varies size | Yes (Pressure modifier) | Yes (Size sensor) | Yes (Min/Max + Pressure) | Yes | KEEP — min/max + pressure |
| Tilt varies angle | Yes (Tilt modifier) | Yes (Tilt) | Yes (Pen Tilt Sensitivity) | — | KEEP |
| Smoothing/Stabilizer | Smoothing slider | Weighted/Stabilizer | Smoothing + Pen Stabilizer | — | KEEP — smoothing slider + stabilizer future |
| Taper Start/End | — | — | Taper Distance/Percentage | — | DEFER — later |
| Texture/Art Brush | Paint Brush Art/Pattern [helpx paint brush] | Texture, Pattern | Textured Vector | — | DEFER — Art Brush later, basic solid for MVP |

## 18. KINEORA DECISION

- KEEP: Brush paints fill, 5 modes (Normal, Fills, Behind, Selection, Inside), Size + Shape, Pressure min/max, Tilt angle, Smoothing, Object Drawing toggle, one undo per stroke, layer checks, auto-key, dot allowed on click.

- MODIFY: 
  - Size scaling with zoom: For MVP, keep constant doc size (like Rect) for simplicity, but add preference "Scale with zoom" later (like Adobe). Reason: simpler engineering, consistent with other tools.
  - Merge behavior: Adobe Brush in Merge mode merges with existing fills. Kineora for MVP should NOT merge — each stroke separate object for exact undo and simpler model. Merging deferred. Reason: merging makes undo complex and can cause unexpected shape changes.

- REJECT: 
  - Flow vs Opacity distinction (Toon Boom has both) — for MVP only opacity (fill alpha), flow deferred. Reason: simpler.

- DEFER:
  - Art Brush / Pattern Brush (Paint Brush tool) — needs brush library, stretch options, etc. [helpx paint brush]
  - Taper, Fade Distance, Texture, Dual Tip
  - Brush sync with Eraser (Sync settings checkbox)

## 19. ACCEPTANCE CRITERIA

- Activates via B and toolbar, active state obvious
- Cursor shows brush circle with size, not-allowed over locked
- Pointer down begins stroke, no doc change
- Pointer move adds dabs with spacing, updates preview respecting mode (Normal paints everywhere, Fills only on fills, Behind only blank, Selection only selected, Inside only inside start fill)
- Pointer up with any drag or click commits one DrawBrush fill, fill from current fill color
- Paint Selection with no selection → no command, toast
- Paint Inside starting in empty → no command
- Pressure tablet: size varies min-max with pressure, tilt varies angle (if supported), mouse = max size constant
- Esc / cancel / blur / tool switch discards preview, no command
- Locked/hidden/folder blocks → toast, no command
- Drawing at held frame auto-keys, undo exact
- Preview never exported, committed stroke exported as filled path
- Undo removes stroke, redo restores
- Zoom/pan independent — doc coords correct
- Dot on click allowed (single dab)

Sources: Adobe Brush [helpx draw], Paint Brush Art/Pattern [helpx paint brush], Krita Brush Settings [docs.krita.org], Toon Boom Eraser/Brush Properties [docs.toonboom]
