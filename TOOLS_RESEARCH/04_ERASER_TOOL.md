# ERASER TOOL — Deep Research (2D Cleanup)

> No Code, 2D Only

## 1. PURPOSE

[INDUSTRY] Adobe Animate: Eraser Tool (E) — erases parts of drawings, size like brush, modes [Adobe Beginner Guide]. "Synchronizing settings in Eraser and Brush tools" — can sync pressure/tilt/size/shape [helpx reshape].

[INDUSTRY] Blender Grease Pencil: Erase modes — hard, soft, point, stroke (entire line) [Blender GP]. Fill tool has gap closure.

[INDUSTRY] Krita: Eraser is not separate tool but blending mode (Erase) toggled via E key, keeps current brush [docs.krita.org]. Means any brush can become eraser.

[INDUSTRY] Toon Boom: Eraser tool with Tip tab (size min/max with pressure, tilt, speed, taper), Smoothing tab, Erasing Options (Apply to Line and Colour Art, Tip Style Round/Flat/Bevel, Snapping) [docs.toonboom eraser]

[KINEORA] Eraser exists to clean up, correct, and refine vector art without deleting whole objects. It should allow partial erase, not just object delete (which is DeleteSelection). It must avoid destructive confusion — erasing should be predictable, undoable, and respect layers.

Use Eraser: Remove parts of strokes/fills, clean overlapping lines, refine shapes.

Not Eraser: Delete whole selected objects (use Delete), cut (use Cut), hide (use Eye).

Dependencies: Brush tip system, hits_in_rect / hits_in_polygon / point-in-fill, stroke splitting logic, layer permissions, timeline.

## 2. UI

- **Toolbar:** Paint group, icon: eraser (angled rectangle). Shortcut E. Active #2d5aa7. Tooltip "Eraser Tool (E)"
- **Cursor:** Eraser circle showing size, or eraser icon. When over deletable content, shows eraser with highlight.
- **Options:**
  - Eraser Mode: Erase Normal (paints over lines and fills), Erase Fills Only, Erase Lines Only, Erase Selected Fills, Erase Inside (like Brush modes) [Adobe]
  - Faucet: click to erase entire fill or line (like Paint Bucket faucet) — maybe toggle
  - Size: slider
  - Shape: round/square
  - Pressure/Tilt sync with Brush (Sync settings with Brush checkbox) [helpx]
  - Smoothing
  - Tip Style: Round/Flat/Bevel for pencil line extremities after erase [Toon Boom]
- **Properties:** Size, mode, tip style
- **StatusBar:** "eraser" + size + mode

## 3. ACTIVATION

- Toolbar click or E → setTool('eraser'), tool:changed, cursor eraser circle
- If coming from Brush, may sync settings if checkbox on
- Switching discards previous preview
- State: Eraser Mode, Size, Tip Style persisted as session view state

## 4. POINTER LIFECYCLE

**Down:** Begins erase gesture. Hit-test: What is under pointer? For Erase Normal, any stroke/fill. For Fills Only, only fills. For Lines Only, only strokes. Captures pointer, stores startDoc, begins gesture.

**Move:** While dragging, erases content under brush circle. Preview: Shows area to be erased? Or shows eraser circle? In Adobe, eraser shows no preview of result until release? Actually eraser erases as you drag (live). But for Kineora's one-undo-per-gesture rule, should show preview of erased area (e.g., dimmed or with X) and commit on release, not erase live each move (which would be many document writes). So move updates preview of affected area (editor-only overlay showing what will be erased), not document.

If Faucet mode: click (no drag) erases entire fill/line under pointer — commit on pointerup without drag.

**Up:** Validates — if drag or faucet click hit something, commit one Erase command that removes or splits affected nodes. For vector, erasing a stroke may split it into two paths (if middle erased) or shorten it (if end erased). For fill, may create hole or split? Complex. For MVP, simple: erase whole objects whose bounds intersect eraser rect (like Select All but delete). Or erase = delete selection that intersects? Need to define.

For MVP Kineora: Eraser = delete objects whose bounds touch eraser circle (contact selection + delete). One command DeleteSelection for those ids. This matches current Stage's select_in_rect logic but with eraser size.

**Cancel:** pointercancel/blur/Esc/tool switch → discard preview, no command

## 5. MODIFIERS

- **Shift:** No documented? Maybe constrains? Not for Eraser.
- **Alt:** No
- **Ctrl/Cmd:** No
- **Pressure:** Varies size (like Brush) if tablet and Pressure enabled
- **Tilt:** Varies angle
- **Sync with Brush:** If enabled, size/shape/pressure/tilt mirrored from Brush tool

## 6. CURSOR

- Default: Eraser circle showing size
- Over erasable fill: eraser with fill highlight
- Over erasable line: eraser with line highlight
- Over locked layer: not-allowed
- Faucet mode: eraser with faucet icon?

## 7. VISUAL FEEDBACK

- Preview: While dragging, shows translucent overlay of area to be erased, or affected objects dimmed with red X, or eraser circle. Editor-only.
- No handles
- After commit, erased content gone, selection pruned
- Error: locked layer → no preview, not-allowed cursor

## 8. DOCUMENT EFFECT

- Creates: No
- Modifies: Yes, may split paths (geometry changes) or remove parts
- Deletes: Yes, removes content (whole or partial)
- Geometry: Yes, may change path structure
- Style: No (erasing does not affect style of remaining)
- Animation: Affects current frame only, auto-key if at held frame

For MVP simple: Deletes whole objects that intersect eraser, so deletes content.

## 9. PREVIEW VS COMMIT

Temporary: Eraser circle position, list of object ids that would be erased, preview overlay showing them dimmed/red, stored in Stage refs, never exported

Committed: One Erase/Delete command removing those ids (or splitting), document:changed, selection pruned

Why separation: One undo per gesture, allows Esc cancel, prevents many writes during drag, clean export

## 10. UNDO/REDO

- One erase gesture (drag) = one undo entry (even if multiple objects erased)
- Faucet click = one entry
- Preview move = no undo
- Cancelled/failed = no undo
- Multiple erases = multiple undo

## 11. LAYER BEHAVIOR

- Active layer? Actually Eraser may affect any visible unlocked layer? In Adobe, eraser affects same layer? In Kineora Selection, select_all skips hidden/locked. For Eraser, should affect active layer only or all visible? Adobe: Brush Mode affects same layer only. So Eraser should affect active layer only? Or active + visible? Decision: For MVP, eraser affects active layer only, to avoid accidental erasing other layers. Requires editable_target_layer check for active layer.

- Locked: If active layer locked, blocked → toast, no command

- Hidden: If active layer hidden, blocked

- Folder: If active layer folder, blocked

- Ancestors: If active layer child of hidden/locked folder, blocked via ancestor walk

## 12. TIMELINE BEHAVIOR

- Current frame: erases at playhead
- Keyframe: if at content keyframe, removes from that keyframe; if at held frame, auto-keys copy-prev then erases in new keyframe, undo removes keyframe
- Blank: if blank keyframe, nothing to erase → no-op
- Existing: removes from existing content
- Auto-key: F6 semantics

## 13. SNAPPING

- Eraser generally does NOT snap — freehand cleanup, snapping would be confusing
- So no snapping

## 14. INPUT DEVICES

- Mouse: Constant size (max)
- Trackpad: Same
- Stylus: More precise, but no pressure unless enabled
- Pressure Tablet: Size varies min-max with pressure if Pressure enabled and Sync with Brush on. This matches Brush sync.

## 15. EDGE CASES

- Empty canvas: nothing to erase → no command, no toast? Or toast "nothing to erase"
- No selection: Eraser does not require selection, it erases under pointer regardless of selection (unlike Paint Selection mode)
- Existing object: erases if under eraser circle
- Overlapping: If multiple objects under eraser, erase all that intersect? Or only topmost? Adobe Eraser erases whatever you drag over, multiple. So Kineora should erase all intersecting active layer objects.
- Locked/hidden/folder: blocked
- Empty frame: no content → no-op
- Extreme zoom: screen→doc ÷ zoom, eraser size in doc = screen size ÷ zoom? Or constant doc? For Brush, size scales with zoom option. For Eraser, same. For MVP, constant doc size (like Rect) — so at low zoom eraser appears larger in doc? Actually if size constant doc, at 25% zoom same screen size = 4x doc size, so erases larger area in doc — might be unexpected. Better to make eraser size screen-space constant? But for simplicity, keep doc constant for now, document as future option.
- Tiny: Eraser size may be larger than tiny object — still erases it
- Huge: Eraser small relative to huge object — only part erased, but MVP deletes whole object if any part touches, so may be too aggressive. Future needs partial erase with path splitting.
- Pointer leaving: commit if valid
- Esc: discard preview, no command
- Tool switch: discard
- Blur: discard
- Invalid: locked → no command
- Cancelled: no undo

## 16. ENGINEERING IMPLICATION

- Interaction state: EraserGesture { points, size, mode, affectedIds, isDragging }
- Preview: circle + affected ids overlay
- Document: Erase command (for MVP DeleteSelection)
- Hit-testing: Need hits_in_rect or hits_in_circle — objects whose bounds intersect eraser circle. For MVP, use hits_in_rect with eraser rect, or point-in-circle.
- Coordinate: screenToDoc
- Layer permission: editable_target_layer for active layer only
- Timeline: playhead, active_layer, auto-key
- Undo: one per gesture
- Rendering: preview overlay
- Pointer capture: capture on down, release on up/cancel
- Cancellation: pointercancel, blur, Esc, tool switch

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Animate Eraser | Krita Eraser (mode) | Toon Boom Eraser | Blender GP Erase | Kineora |
|----------|----------------|---------------------|------------------|------------------|---------|
| Erases drag area | Yes [Adobe] | Yes (brush as eraser) | Yes | Yes (hard/soft/point/stroke) | KEEP |
| Size like brush | Yes [Adobe] | Yes (current brush size) | Yes (Max Size) | Yes | KEEP |
| Modes: Normal/Fills/Lines/Selected/Inside | Yes (Erase Normal etc.) [community] | — | — | — | KEEP for MVP Normal, others later |
| Faucet (click to erase whole fill/line) | Yes (Faucet) [community] | — | — | — | DEFER |
| Pressure varies size | Yes (sync with Brush) [helpx] | Yes (brush size sensor) | Yes (Min/Max + Pressure) | Yes | KEEP |
| Tip Style Round/Flat/Bevel | — | — | Yes [Toon Boom] | — | DEFER |
| Eraser as blending mode (any brush becomes eraser) | No | Yes (E toggles Erase) [Krita] | — | — | MODIFY — Kineora could allow E to toggle any brush to eraser mode in future, but for MVP separate tool |
| Point vs Stroke erase | — | — | — | Yes (point vs stroke) [Blender] | DEFER — MVP whole object, partial later |

## 18. KINEORA DECISION

- KEEP: Eraser drag erases content under brush circle, size like brush, pressure varies size if enabled, one undo per gesture, layer checks (active layer Normal visible unlocked + ancestors), auto-key at held frame, preview vs commit separation.

- MODIFY: 
  - For MVP, erase whole objects that intersect eraser (contact selection + delete), not partial path splitting. Reason: partial splitting requires complex path boolean and stroke reconstruction, too complex for MVP, but whole-object erase still useful for cleanup and matches Select All + Delete workflow.
  - No Faucet for MVP — click without drag does nothing (or could be considered no-op), to keep one gesture rule simple. Faucet later.

- REJECT: 
  - Eraser merging with existing fills (like Brush merge) — no, keep separate objects.

- DEFER:
  - Partial erase with stroke splitting, fill hole creation
  - Faucet mode
  - Tip Style Round/Flat/Bevel
  - Erase Selected Fills / Inside modes
  - Sync settings with Brush advanced (taper, etc.)

## 19. ACCEPTANCE CRITERIA

- Activates via E and toolbar, active state obvious
- Cursor eraser circle with size, not-allowed over locked
- Pointer down begins erase gesture, no doc change, captures pointer
- Pointer move updates preview (circle + affected objects dimmed) only, no doc change
- Pointer up with drag that hit active layer objects commits one DeleteSelection for those ids, one undo entry, selection pruned
- Click without drag (no movement) → no command (for MVP, no faucet)
- Esc / cancel / blur / tool switch discards preview, no command
- Locked/hidden/folder active layer blocks → toast, no command
- Erasing at held frame auto-keys, undo exact
- Preview never exported
- Undo restores erased objects, redo removes again
- Zoom/pan independent
- Overlapping objects under eraser all erased if on active layer
- Empty frame or nothing under eraser → no command, no undo

Sources: Adobe Eraser [Adobe Guide], Krita Eraser as mode [docs.krita.org], Toon Boom Eraser Properties [docs.toonboom], Blender GP Erase [Blender GP], Adobe Sync Brush/Eraser [helpx reshape]
