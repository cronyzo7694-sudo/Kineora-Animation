# TOOLS PANEL FULL ROADMAP — Master Reference (No Code, Only Research)

> **Goal:** Itna deep research ki ek pagal AI bhi is file ko dekh ke code likh de. Har tool ka Adobe + Blender + Toon Boom behavior, har point, har action, har UI state defined.

**Sources:**
- Adobe Animate Tools Panel: https://helpx.adobe.com/animate/using/using-stage-tools-panel.html [1](https://helpx.adobe.com/animate/using/using-stage-tools-panel.html)
- Adobe Pen Tool: https://helpx.adobe.com/animate/using/drawing-pen-tool.html [2](https://helpx.adobe.com/animate/using/drawing-pen-tool.html)
- Adobe Basic Tools: https://helpx.adobe.com/animate/desktop/using/basic-tools.html
- Adobe Drawing Lines/Shapes: https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html
- Adobe Selection: https://helpx.adobe.com/animate/using/selecting-objects.html
- Blender Grease Pencil: https://www.graphicsandprogramming.net/eng/tutorial/blender/the-grease-pencil/grease-pencil-in-blender-2-8-introduction + https://docs.blender.org/manual/en/latest/grease_pencil/modes/edit/grease_pencil_menu.html
- Toon Boom Harmony Drawing Tools: https://docs.toonboom.com/help/harmony-20/essentials/drawing/about-drawing-tool.html
- Adobe Beginner Guide PDF (tool shortcuts): studentcabletelevision.com guide

---

## 0. Adobe Tools Panel ka 4-Section Contract

[ADOBE] "The Tools panel is divided into four sections: the tools area contains drawing, painting, and selection tools · the view area contains tools for zooming and panning · the colors area contains modifiers for stroke and fill colors · the options area contains modifiers for the currently selected tool." [helpx]

**KINEORA mapping:**
```
+------------------+
| TOOLS AREA       |  Selection + Drawing + Painting
|  [Select Group]  |
|  [Draw Group]    |
|  [Paint Group]   |
+------------------+
| VIEW AREA        |  Hand, Zoom, Rotate Stage
+------------------+
| COLORS AREA      |  Fill swatch, Stroke swatch, None, Swap, Default
+------------------+
| OPTIONS AREA     |  Tool-specific modifiers (e.g. Pencil Mode, Brush Mode, Zoom Enlarge/Reduce)
+------------------+
```

**KINEORA Rule:** No fake/dead button. Every visible button must have: active state, hover tooltip (Label + Shortcut), cursor, enabled/disabled reason, one undo per gesture.

---

## 1. MASTER TOOL LIST — Full Roadmap (30 Tools)

### 1.1 SELECTION GROUP (4 tools) — P0

| # | ID | Label | Shortcut | Adobe | Blender GP | Toon Boom | Kineora Status |
|---|----|-------|----------|-------|------------|-----------|----------------|
| 1 | select | Selection Tool | V | Select Tool (V) — selects whole objects, marquee, move [1] | Select (Edit Mode) | Select | DONE — Stage pointer router |
| 2 | subselect | Subselection Tool | A | Subselection (A) — selects anchor points, Bézier handles [Adobe] | Edit Points | Contour Editor | COMING SOON — needs Node::Path |
| 3 | transform | Free Transform Tool | Q | Free Transform (Q) — scale/rotate/skew/distort [helpx] | Transform (G/R/S) | — | DONE — transformMath + handles |
| 4 | lasso | Lasso Tool | L | Lasso (L) — freehand selection [Adobe Beginner Guide] | Lasso Select | Cutter | COMING SOON — needs hits_in_polygon |

**Selection Group UI:**
- Icon: Arrow (select), white arrow (subselect), dotted box with handles (transform), lasso loop (lasso)
- Cursor: default arrow, white arrow, move, lasso
- Options: Contact sensitivity (Touching vs Fully enclosed), Snap toggles, Show bounding box

### 1.2 DRAWING GROUP (8 tools) — P0-P1

| # | ID | Label | Shortcut | Adobe Behavior | Blender Equivalent | Toon Boom | Notes |
|---|----|-------|----------|----------------|--------------------|-----------|-------|
| 5 | pen | Pen Tool | P | Pen Tool (P) — click creates anchor, drag creates curve, Shift constrains 45°, Alt breaks handles, small circle to close path [2] | Curve tool, Polyline | Polyline | COMING SOON — needs bezier path model |
| 6 | pencil | Pencil Tool | Y | Pencil (Y) — freehand lines, modes: Straighten / Smooth / Ink, Shift constrains H/V [helpx draw] | Draw Pencil | Pencil | RESEARCHED — needs smoothing param |
| 7 | brush | Brush Tool | B | Brush (B) — paints fills, size/shape, modes: Paint Normal/Fills/Behind/Selection/Inside, Pressure/Tilt support [helpx draw] | Draw Brush, Draw Ink | Brush | RESEARCHED — needs brush engine |
| 8 | line | Line Tool | N | Line (N) — straight line segment, no fill, Object vs Merge mode [helpx] | Line tool | Line | COMING SOON — simple, needs stroke only |
| 9 | rect | Rectangle Tool | R | Rectangle (R) — rect/square, Shift=square, Alt=from-center, Esc=cancel [Adobe] | Box | Rectangle | DONE — gesture.ts normalizeRect |
| 10 | oval | Oval Tool | O | Oval (O) — oval/circle, same modifiers as rect [Adobe] | Circle | Ellipse | COMING SOON — needs ellipse node |
| 11 | polystar | PolyStar Tool | — | PolyStar — polygon/star, sides, star points [Adobe] | — | — | COMING SOON — needs sides param |
| 12 | text | Text Tool | T | Text (T) — creates text boxes [Adobe Guide] | Text (but GP has no text) | Text | BLOCKED — needs Node::Text |

**Drawing Group Modifiers:**
- Pen: Show Pen Preview, Show Solid Points, Show Precise Cursors (crosshair)
- Pencil: Pencil Mode (Straighten/Smooth/Ink), Smoothing slider, Straighten tolerance
- Brush: Brush Mode (5 modes), Size, Shape, Pressure (Wacom), Tilt, Stage zoom level checkbox
- Line/Rect/Oval: Object Drawing toggle (Merge vs Object), Stroke/Fill from colors area

### 1.3 PAINTING / COLOR GROUP (5 tools) — P1

| # | ID | Label | Shortcut | Adobe | Blender | Toon Boom | Status |
|---|----|-------|----------|-------|---------|-----------|--------|
| 13 | bucket | Paint Bucket Tool | K | Paint Bucket (K) — fills enclosed areas with fill color [Adobe Guide] | Fill tool | Paint | DONE — setNodeProps fill |
| 14 | ink | Ink Bottle Tool | S | Ink Bottle (S) — changes stroke color/width/style [Adobe Guide] | — | Ink | DONE — setNodeProps stroke |
| 15 | eyedropper | Eyedropper Tool | I | Eyedropper (I) — samples color, auto-switches to Bucket [Adobe Guide] | Eyedropper | Colour Eyedropper | DONE — copies fill/stroke |
| 16 | eraser | Eraser Tool | E | Eraser (E) — erases drag, size like brush [Adobe Guide] | Erase (hard/soft/point/stroke) | Eraser | COMING SOON — needs erase modes |
| 17 | width | Width Tool | Shift+W | Width Tool — variable stroke width, width points with handles [helpx draw] | — | — | RESEARCHED — needs width points |

**Paint Group UI:**
- Bucket: Gap size, Close large gaps, Fill locks
- Eraser: Erase Mode (Erase Normal/Fills/Lines/Selected Fills/Inside), Faucet (click to erase), Size
- Width: Width Point, Width Handle, Copy/Delete width point

### 1.4 VIEW / UTILITY GROUP (5 tools) — P0

| # | ID | Label | Shortcut | Adobe | Blender | Status |
|---|----|-------|----------|-------|---------|--------|
| 18 | hand | Hand Tool | H | Hand (H) — pans view, Spacebar temporary [helpx stage] | Hand, Middle-drag | DONE — panBy, spaceHeld |
| 19 | zoom | Zoom Tool | Z | Zoom (Z) — click zoom in, Alt+click zoom out, drag rect fills window, Enlarge/Reduce modifiers [helpx stage] | Zoom, Ctrl+MMB | DONE — zoomAt, zoomToRect, zoomMode |
| 20 | rotateStage | Stage Rotate Tool | Shift+H | Rotation Tool (Shift+H) — rotates stage view [Adobe Guide] | Rotate canvas Ctrl+Alt+MMB | COMING SOON — view-only |
| 21 | timeScrub | Time Scrub Tool | Shift+Alt+H | Time Scrub (Shift+Alt+H) — scrub timeline on stage [Adobe Guide] | Timeline scrub | COMING SOON |
| 22 | artBrush | Paint Brush (Art/Pattern) | — | Art Brush / Pattern Brush — Scale proportionately, Stretch to fit, Flip, Spacing, Corners [helpx paint brush] | — | RESEARCHED — needs art brush engine |

### 1.5 RIGGING / ADVANCED GROUP (4 tools) — P2-P3

| # | ID | Label | Shortcut | Adobe | Status |
|---|----|-------|----------|-------|--------|
| 23 | bone | Bone Tool | — | Bone Tool — IK bones, parent-child, bind to symbols/shapes, Joint Speed, Constrain [helpx bone] | DEFERRED — needs IK system |
| 24 | bind | Bind Tool | — | Bind Tool — bind bones to shape points, yellow highlight for connected [helpx bone] | DEFERRED |
| 25 | assetWarp | Asset Warp Tool | W | Asset Warp (W) — creates pins/mesh, deform shapes/bitmaps, Open/Fixed mode, mesh density [helpx asset warp] | DEFERRED — needs warp mesh |
| 26 | envelope | Envelope / Distort | — | Envelope — distort via bounding box [Adobe] | DEFERRED |

### 1.6 LEGACY / DEFERRED (4 tools) — Explicitly NOT in MVP

| # | ID | Label | Why Deferred |
|---|----|-------|--------------|
| 27 | fluidBrush | Fluid Brush | GPU accelerated, overlaps Classic Brush — merge into Brush tool with smoothing |
| 28 | deco | Deco Tool | Decorative drawing — low priority, can be brush preset |
| 29 | spray | Spray Brush | Particle spray — can be brush preset |
| 30 | 3dRot | 3D Rotation/Translation | 3D layer — needs 3D engine, deferred |

---

## 2. HAR TOOL KA DEEP CONTRACT (Template)

Har tool file me yeh sections hone chahiye (example Pen Tool):

### 2.1 Tool Identity
- ID, Label, Shortcut, Icon SVG path, Group, Priority

### 2.2 Purpose — Why this tool matters
- One line: what user does with it
- [ADOBE] reference + [KINEORA] decision

### 2.3 Adobe Behavior (Deep)
- Activation: where in Tools panel, what cursor
- Pointer states: Initial Anchor, Sequential Anchor, Add (+), Delete (-), Convert (^), Close (o), etc. [Pen doc]
- Gestures: pointerdown, pointermove (preview), pointerup (commit), pointercancel/Esc/blur (discard)
- Modifiers: Shift (constrain 45°), Alt (break handles, from-center), Ctrl/Cmd (close, etc.)
- Options: Show Pen Preview, Show Solid Points, Show Precise Cursors
- Model writes: Node::Path with anchors, fill/stroke from colors area
- Timeline: auto-keyframe policy (F6 copy-prev when drawing at held frame)
- Undo: one command per path, Esc = no command
- Errors: locked/hidden/folder layer blocked, empty path = no command
- Acceptance: list of manual QA steps

### 2.4 Blender Equivalent (for inspiration)
- Grease Pencil Draw modes: Draw, Fill, Erase (hard/soft/point/stroke), Cutter, Tint, Eyedropper, Line, Polyline, Arc, Curve, Box, Circle [Blender GP]
- Fill: gap closure, precision, multi-frame editing
- Sculpt: Grab, Randomize, etc.
- What to steal: gap closure, multi-frame, pressure, tilt

### 2.5 Toon Boom Equivalent
- Brush/Pencil/Eraser/Text/Line/Rectangle/Ellipse/Polyline/Paint/Ink/Close Gap [Toon Boom]
- What to steal: Close Gap tool, Paint Unpainted, Repaint

### 2.6 KINEORA UI Definition
- ToolsPanel: where, active style (background #2d5aa7, border #5a8fc0), hover tooltip (Label + Shortcut + coming-soon badge)
- Stage cursor: crosshair, pen with states, etc.
- Options area: what modifiers show
- Colors area: fill/stroke used?
- Properties panel: what shows when tool active vs selection
- Status bar: what readout
- Timeline: any tool-specific timeline UI?

### 2.7 Pointer Router (Code-Ready)
- File: Stage.tsx — activeTool(), isSelectLike()
- Gesture struct: startX, startY, dragging, lastDocX, etc.
- Threshold: MIN_DRAG = 3px, MIN_RECT_DIM = 1 doc px
- Screen→Doc: screenToDoc(vp, sx, sy), zoom, pan
- Preview: editor-only, translucent, never in export
- Commit: drawRect(x,y,w,h,fill) / drawPath(...) etc., one command

### 2.8 Model & Engine Writes
- Rust Session method: draw_rect, draw_path, etc.
- Node kind: Rect, Oval, Path, Text, etc.
- Command: DrawRect, DrawPath, etc.
- WASM facade: kineora_draw_rect, etc.
- client.ts facade: drawRect(...)

### 2.9 Timeline / Layers / Onion Interaction
- Does it create keyframe? Does it respect locked/hidden/folder?
- Does it work with onion skin? (view-only, never export)
- Does it work with Edit Multiple Frames?

### 2.10 Undo / Redo Contract
- One gesture = one command
- What is before/after?
- What does undo restore?

### 2.11 Error / Edge Cases
- Engine not attached → honest toast, disabled?
- Locked layer → blocked, toast "draw blocked: layer locked"
- Hidden layer → blocked?
- Folder → blocked, "folder — not a frame target"
- Zero delta → no command
- Esc / pointercancel → discard

### 2.12 Acceptance Matrix (Manual QA)
- Table of actions + expects (like in README)

---

## 3. CURRENT KINEORA GAP MAP

| Tool | Current Code | Gap | Next File to Edit |
|------|--------------|-----|-------------------|
| select | Stage.tsx select_at, select_in_rect, moveSelection | multi-select union AABB done, but lasso needs polygon | gesture.ts + transformMath.ts |
| transform | Stage.tsx transformSelection, 8 handles + rotate | pivot draggable deferred | transformMath.ts |
| rect | Stage.tsx drawRect, normalizeRect, Shift square, Alt center | DONE | — |
| bucket/ink/eyedropper | Stage.tsx setNodeProps fill/stroke | DONE | — |
| hand/zoom | Stage.tsx panBy, zoomAt, spaceHeld | DONE | — |
| pen | NOT IMPLEMENTED | needs Node::Path (bezier anchors), Add/Delete/Convert states | core/src/model.rs, session.rs, wasm.rs |
| pencil | NOT IMPLEMENTED | needs freehand path smoothing, Straighten/Smooth/Ink modes | model.rs, eval.rs |
| brush | NOT IMPLEMENTED | needs brush stroke node, pressure, tilt, 5 paint modes | model.rs |
| oval/line/polystar | NOT IMPLEMENTED | needs Oval/Line/Star nodes, corner_radius | model.rs |
| eraser | NOT IMPLEMENTED | needs hits_in_polygon + erase modes | eval.rs, session.rs |
| text | BLOCKED | needs Node::Text + on-stage editing | model.rs |
| bone/bind/assetWarp | DEFERRED | needs IK + mesh system | — |

---

## 4. TOOL PANEL VISUAL ROADMAP (ASCII)

```
[Adobe Animate — Tools Panel (vertical, icon-only, like Kineora)]

+------+
|  V   |  Selection (V)
|  A   |  Subselection (A) [coming soon]
|  Q   |  Free Transform (Q)
|  L   |  Lasso (L) [coming soon]
+------+
|  P   |  Pen (P) [coming soon]
|  T   |  Text (T) [coming soon]
|  N   |  Line (N) [coming soon]
|  R   |  Rectangle (R) [DONE]
|  O   |  Oval (O) [coming soon]
|  Y   |  Pencil (Y) [coming soon]
|  B   |  Brush (B) [coming soon]
+------+
|  K   |  Paint Bucket (K) [DONE]
|  S   |  Ink Bottle (S) [DONE]
|  I   |  Eyedropper (I) [DONE]
|  E   |  Eraser (E) [coming soon]
|  W   |  Width (Shift+W) [research]
+------+
|  H   |  Hand (H) [DONE]
|  Z   |  Zoom (Z) [DONE]
|  H+  |  Rotate Stage (Shift+H) [coming soon]
+------+
| COLORS |
| [Fill] [Stroke] overlapping
| ∅F ∅S  W: [1]  ⇄ D
+------+
| OPTIONS |
| (tool-specific)
+------+
```

**KINEORA Improvement (already done in cc71de7):**
- Overlapping fill/stroke swatches (Adobe-like)
- 15 tools with coming-soon toasts (not dead buttons)
- Clean timeline (EMF/camera/parenting hidden by default)

---

## 5. RESEARCH FILES TO CREATE NEXT (Deep Dive)

Har tool ke liye ek file banao — NO CODE, only deep research:

| File | Tool | Deep Points to Cover |
|------|------|----------------------|
| 23_FULL_ROADMAP.md | All tools | This file — master list |
| 24_PEN_DEEP.md | Pen Tool | Adobe 6 pointer states, straight vs curve, add/delete/convert, Shift 45°, Alt break, close path, preferences (Show Preview/Solid Points/Precise Cursors), Blender Curve vs Polyline, Toon Boom Polyline, Kineora Node::Path model, gesture struct, undo |
| 25_PENCIL_BRUSH_DEEP.md | Pencil + Brush | Adobe Pencil modes (Straighten/Smooth/Ink), Smooth Curves tolerance, Recognize Lines/Shapes, Brush modes (5), Pressure/Tilt, Stage zoom level checkbox, Blender Draw Pencil/Ink/Marker/Pen, Toon Boom Pencil Editor/Smooth Editor, Kineora smoothing algo |
| 26_SHAPE_TOOLS_DEEP.md | Line/Rect/Oval/PolyStar | Adobe Line/Rect/Oval/PolyStar, Rectangle Primitive vs Normal (hinges), Oval Primitive (inner radius, close path), Shift square/circle, Alt from-center, Esc cancel, Object vs Merge mode, Blender Box/Circle, Toon Boom Rectangle/Ellipse |
| 27_PAINT_TOOLS_DEEP.md | Bucket/Ink/Eyedropper/Eraser/Width | Adobe Paint Bucket gap size, Close large gaps, Paint Fills/Lines, Ink Bottle stroke width, Eyedropper auto-switch, Eraser modes (Normal/Fills/Lines/Selected Fills/Inside) + Faucet, Width Tool width points/handles, Blender Fill gap closure + Erase modes, Toon Boom Paint/Unpaint/Close Gap |
| 28_TEXT_TOOL_DEEP.md | Text Tool | Adobe Text types (Static/Dynamic/Input), font, anti-alias, selectable, break apart, Blender no text (but import SVG), Toon Boom Text, Kineora Node::Text + on-stage editing + Properties |
| 29_VIEW_TOOLS_DEEP.md | Hand/Zoom/Rotate/TimeScrub | Adobe Hand Spacebar temporary, Zoom Enlarge/Reduce + drag rect fills window, Rotate Stage, Time Scrub, Blender Hand middle-drag + Rotate canvas Ctrl+Alt+MMB, Kineora panBy/zoomAt/viewport.ts |
| 30_RIGGING_TOOLS_DEEP.md | Bone/Bind/AssetWarp | Adobe Bone IK, Bind yellow highlight, Asset Warp pins/mesh density/Open vs Fixed, Propagate changes, Toon Boom Bone/Deformation, Blender Armature (for ref), Kineora deferred but define contract |
| 31_COLOR_STYLE_DEEP.md | Fill/Stroke/Color System | Adobe Stroke/Fill, None, Swap, Default, Color Panel (Solid/Linear/Radial/Bitmap), Blender Material stroke/fill/gradient/texture, Toon Boom Colour Eyedropper, Kineora toolColors.ts + ToolColors.tsx overlapping |
| 32_TOOL_UI_CONTRACT.md | UI/UX for all tools | ToolsPanel active state (#2d5aa7), hover tooltip, cursor per tool, Options area per tool, StatusBar readout, Properties context, Timeline interaction, Engine-not-attached honest state |

---

## 6. HOW TO WRITE A DEEP RESEARCH FILE (Instruction for AI)

**RULES:**
1. NO CODE — sirf research, markdown me
2. Har file me yeh headings hone chahiye:
   - Tool Identity
   - Purpose
   - Adobe Behavior (har point + source link)
   - Blender Behavior (kya steal kar sakte hain)
   - Toon Boom Behavior (kya steal)
   - Kineora Decision (kya rakhna, kya nahi)
   - UI Definition (ToolsPanel, Stage cursor, Options, Colors, Properties, StatusBar, Timeline)
   - Pointer Router (gesture struct, threshold, screen→doc, preview, commit)
   - Model Writes (Rust Session, Node kind, Command, WASM facade)
   - Timeline/Layers/Onion Interaction
   - Undo/Redo
   - Errors/Edge Cases
   - Acceptance Matrix
3. Har action ko define karo: click, Shift+click, Alt+click, drag, Shift+drag, Alt+drag, double-click, Esc, pointercancel, blur
4. Har modifier ko define karo: Shift, Alt, Ctrl/Cmd, Spacebar
5. UI ko define karo: icon, cursor, tooltip, active state, disabled reason
6. Source links do: helpx.adobe.com, docs.blender.org, docs.toonboom.com

**Example for Pen Tool (already in 07_PEN_TOOL.md but make deeper in 24_PEN_DEEP.md):**
- Adobe: 6 pointer states (Initial Anchor, Sequential, Add +, Delete -, Convert ^, Close o) [Pen doc]
- Straight line: click, click, Shift-click 45°, preview line (Show Pen Preview)
- Curve: drag to create direction lines, C-shape vs S-shape, break handles Alt-drag
- Close: click hollow first anchor, small circle appears
- Add/Delete: Pen over path = Add (+), over anchor = Delete (-), must be selected
- Convert: Shift+C toggles, click smooth point = corner, Alt-drag corner = smooth with independent handles
- Adjust: Subselection drags anchor or handle, Shift constrains 45°, add points via Pen
- Preferences: Show Pen Preview, Show Solid Points, Show Precise Cursors (crosshair, Caps Lock toggle)
- Blender: Curve tool, Polyline sharp corners, Bezier handles
- Toon Boom: Polyline, Contour Editor
- Kineora: Node::Path { anchors: Vec<Anchor { x,y, handle_in, handle_out, kind }>, closed, fill, stroke }, gesture: PenGesture { anchors, preview, closing }, command: DrawPath, undo: one path

---

## 7. NEXT STEPS

1. **Is file ko padh lo (23_FULL_ROADMAP.md)** — yeh full roadmap hai
2. **24_PEN_DEEP.md se start karo** — Pen Tool ka sabse deep research (Adobe 6 states + Blender + Toon Boom + Kineora contract)
3. Fir **25_PENCIL_BRUSH_DEEP.md**, **26_SHAPE_TOOLS_DEEP.md**, etc.
4. Har file me NO CODE, only research, itna deep ki pagal AI bhi code likh de

**Tagki list ready hai — ab is roadmap pe kaam shuru karo!**

