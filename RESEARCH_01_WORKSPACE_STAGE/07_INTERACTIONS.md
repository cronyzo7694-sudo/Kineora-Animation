# 07 — INTERACTIONS — Har Click Pe Kya Hoga — State Machine

> Is file me har mouse/keyboard interaction ka exact outcome likha hai — coding me sochna nahi.

## 7.1 Tool State

```ts
type ToolId = 'select' | 'rect' | 'oval' | 'hand' | 'zoom';
let activeTool: ToolId = 'select'; // App.tsx tool state
```

- Tool change → bus.emit('tool:changed', {toolId}) → status bar + properties Tool tab re-render + cursor change

## 7.2 Cursor Rules

| Context | Tool | Cursor |
|---------|------|--------|
| Over handle (scale) | select | nwse-resize / nesw-resize / ew-resize / ns-resize |
| Over rotate handle | select | crosshair or rotate cursor |
| Over selected object | select | move |
| Over unselected object | select | pointer |
| Over empty stage/pasteboard | select | default |
| Hand tool dragging | hand | grabbing |
| Hand tool idle | hand | grab |
| Zoom tool | zoom | zoom-in (Alt = zoom-out) |
| Rect tool | rect | crosshair |
| Spacebar held (temp hand) | any | grab → grabbing when dragging |
| Over ruler | any | pointer + guide creation hint |
| Over guide | any | ew-resize (v guide) / ns-resize (h guide) |

## 7.3 Selection — Detailed

### Single Click

- Click on object (hit-test via evaluate + pointInRect + z-order top→frontmost) → `selectAt(x,y)` → selection = that object → event selection:changed → Properties Object tab shows x/y/w/h/fill/stroke
- Click on already selected object → keep selection, arm MoveGesture (so drag moves)
- Click on empty (no hit) → `selectInRect(x,y,x,y)` → clear selection → Properties shows Doc tab

### Shift+Click

- `selectToggleAt(x,y)` — if object not in selection → add, if in selection → remove
- Allows multi-select

### Marquee Drag

- Mousedown on empty + drag → marquee rect → `selectInRect(x1,y1,x2,y2)` on mouseup — selects all objects whose bounds intersect marquee (contact selection)
- Shift+marquee → add to selection (toggle? Adobe: Shift marquee adds)
- For Phase 1: marquee = contact, not enclosure — any intersect selects

### Select All

- Ctrl+A → `selectAll()` — selects all objects on unlocked layers of current frame
- Locked/hidden layers skipped

### Deselect All

- Ctrl+Shift+A or click empty → clear

## 7.4 Move

- Arm MoveGesture on mousedown over selected object
- Drag threshold 3px desktop / 12px touch — below threshold = click, not drag
- During drag: previewDelta = screenDeltaToDoc(dx,dy) — renderer draws selected items translated — no engine write — live preview
- On mouseup: if dragging and delta !=0 → `moveSelection(dx,dy)` → one Command Move → document:changed → undoable
- Snap: if snap enabled, previewDelta snapped to grid/guides/objects
- Nudge: Arrow keys → move 1px, Shift+Arrow → 10px — each nudge = one command? Or coalesce? For Phase 1: each arrow = one command, Shift+arrow = 10px one command

## 7.5 Transform — Scale / Rotate

- Handles: 8 scale handles (tl/t/tr/r/br/b/bl/l) + 1 rotate handle (top center offset)
- Hit-test handles in screen space — HANDLE_HIT_RADIUS 8px
- On mousedown over handle → arm TransformGesture — anchor = opposite handle (or center if Alt held) — center = selection center
- During drag:
  - Scale: compute scaleFactors(handle, startHandle, anchor, currentDoc, shiftKey) — Shift = constrain proportions — returns sx,sy
  - Rotate: rotationDelta(center, startDoc, currentDoc, shiftKey) — Shift = snap 45deg — returns deg
  - Update pending map — Map<id, AbsTransformOut> — renderer draws pending transformed items — no engine write
- On mouseup: `transformSelection(pendingArray)` → one command
- Esc cancel

## 7.6 Draw — Rectangle (and Oval future)

- Tool = rect
- Mousedown → arm RectGesture — startX/Y screen
- Mousemove past threshold → dragging=true — previewRect = normalizeRect(startDoc, currentDoc) — renderer draws translucent preview
- Mouseup: if validRect (w>=1 && h>=1) → `drawRect(x,y,w,h, fill)` → Command DrawRect → new node id → selection = new node → event
- If active layer locked/hidden → draw blocked → toast "draw blocked: active layer is locked or hidden"
- Shift during draw: constrain to square (rect) / circle (oval)

## 7.7 Pan

- Hand tool (H) drag → panBy(dx,dy)
- Spacebar hold → temporary Hand — Space down → previous tool saved, activeTool=hand, Space up → restore
- Middle mouse drag → pan — already
- No inertia — immediate

## 7.8 Zoom

- Ctrl+= / wheel up → zoomAt(center, 1.1 or 2) — zoom centered at mouse or view center
- Ctrl+- / wheel down → zoomAt 0.5 or 1/1.1
- Zoom tool (Z):
  - Click → zoom in 2x centered at click
  - Alt+Click → zoom out 2x
  - Drag rect → zoom to rect (fitViewport to that rect)
- Fit: Ctrl+0 → fitViewport(docW,docH,viewW,viewH) with 40px padding
- 100%: Ctrl+1 → zoom=1, pan centered
- Double-click stage → Fit

## 7.9 Guides Interaction (from 06)

- Ruler area: top 16px horizontal ruler, left 16px vertical ruler — mousedown in ruler → arm GuideCreateGesture — preview line → mouseup → addGuide
- Guide hit: distance <8px screen → cursor ew/ns-resize
- Drag guide → moveGuide
- Drag guide to ruler area → deleteGuide
- Lock guides → cannot move
- Show/hide guides → toggle

## 7.10 Context Menus

### Stage Right-Click

- If over selected object: Cut, Copy, Paste in Place, Paste in Center, Delete, Duplicate, Arrange (Bring to Front etc), Group/Ungroup, Convert to Symbol, Properties
- If over unselected object: same but first select that object? Adobe: right-click selects object under cursor then shows menu — implement: on right-click, if hit object not in selection → select it, then show menu
- If over empty: Paste, Select All, Properties, Document Settings

### LayersColumn Right-Click (Layer Row)

- Rename, Delete, Duplicate, Copy, Paste, Hide Others, Lock Others, Show All, Unlock All, Properties (Layer Properties dialog)

### FramesGrid Right-Click (Frame Cell)

- Insert Frame (F5), Insert Keyframe (F6), Insert Blank Keyframe (F7), Delete Frame (Shift+F5), Clear Keyframe (Shift+F6), Copy Frames, Paste Frames, Cut Frames, Select All Frames, Reverse Frames

## 7.11 EditBar Interactions

- Back button ← click → `edit.exitOneLevel()` — Esc also
- Breadcrumb level click → `edit.exitToLevel(n)` — jump to that depth
- Zoom dropdown click → show zoom options — 25%,50%,100%,200%, Fit — calls stageViewController

## 7.12 TimelinePanel Interactions (Merged)

- Eye click → toggle visibility — immediate, no undo? Actually layer visibility = document mutation? In Adobe, eye is view? But spec: visible flag is document? Check model.rs — Layer visible bool — is it doc or view? In Kineora model, Layer visible is doc — so toggle = command — undoable
- Lock click → toggle lock — command — undoable
- Outline click → toggle outline — view? Actually outline is view aid but stored per layer — in model outline bool — command? For Phase 1: outline = view aid, no command, just viewPrefs? But current model has outline bool — keep as doc? Decision: outline = view aid, not persisted in doc? Simpler: outline = view state (session) — no command — for Phase 1 keep as view
- Name double-click → inline input — Enter commits rename command, Esc cancels
- Row click → set active layer — session, no command
- Row drag → reorder layers — command moveLayer
- Frame cell click → select frame(s) — session
- Frame ruler click → set playhead — session
- Playhead drag → scrub — session
- Divider drag → resize layersColumnW — view, persisted prefs, no doc command

## 7.13 PropertiesPanel Tabs Interactions

- Tab click → switch tab — session, no command
- Numeric field (x/y/w/h/rotation/strokeWidth):
  - onChange → local draft + live preview? For x/y/w/h, live preview via pending transform? For Phase 1: numeric fields commit on blur/Enter — one command — Esc cancel — same as ColorField pattern
  - Validation: min/max clamp — e.g., w/h >=1, rotation -360..360, strokeWidth >=0
- Color field:
  - Click chip → color picker — onInput → colorPreview → renderer preview — no engine write
  - On close/blur/Enter → commit one command — e.g., `setFillColor(id, color)` — toast
  - Esc → cancel preview
- Opacity slider:
  - Drag → live preview (colorPreview or pending) — commit on release — one command
- Doc fields (W/H/FPS/Background):
  - W/H — number input — commit on blur/Enter → `setDocumentSettings` command
  - FPS — number 1..120
  - Background — color picker — live preview + commit

## 7.14 Menu Bar Interactions

- Click menu → dropdown — hover to switch menus — click item → run commandId → same as shortcut/button
- Disabled items: grayed, tooltip why disabled — e.g., "No selection" for Delete

## 7.15 Keyboard — Global

- All shortcuts from 08_SHORTCUTS.md — precedence: tool > panel > global — e.g., when text input focused, shortcuts skip
- Esc precedence tree: modal → palette → dropdown → drag → tool sub-mode → edit depth exit — first matching wins, single Esc = one step

## 7.16 Touch / Mobile (Future, but spec for completeness)

- Tap = click
- Drag = pan/move
- Pinch = zoom
- Long-press = right-click context menu
- Panels → bottom sheets on <768px
- Toolbar overflow → ⋮ More

For Phase 1 desktop only, but keep touch threshold 12px vs 3px desktop.

Next: 08_SHORTCUTS.md
