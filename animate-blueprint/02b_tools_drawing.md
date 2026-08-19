# PART 02b — EVERY TOOL: DRAWING TOOLS (GEOMETRIC & PATH)
### Deep 27-field specification. This file covers: Pen (+ Add/Delete/Convert Anchor sub-tools), Text, Line, Rectangle, Oval, Rectangle Primitive, Oval Primitive, PolyStar.

> Same 27-field schema as `02a_tools_selection_transform.md`. Drawing tools share a common "**draw gesture**" contract: `down → (anchor or drag) → up → commit a DrawCommand that inserts a path/parametric shape into the current layer+frame`. Every drawing tool must honor: (1) the current **stroke** and **fill** style (Part 23), (2) the current **drawing mode** (merged vs object drawing — Part 06), (3) the current **frame/keyframe** target (Part 07/08), (4) **snapping** (grid/guides/objects/pixels), and (5) layer **lock/visibility** (Part 20). Details below assume you've read Part 01 §1.3.2 (Tool interface).

---

## T2B.1 — PEN TOOL (+ ADD / DELETE / CONVERT ANCHOR SUB-TOOLS)

**1. Official name:** Pen tool; sub-tools: Add Anchor Point tool, Delete Anchor Point tool, Convert Anchor Point tool.
**2. Purpose:** Draw precise Bézier paths by placing anchors. Click = straight/corner anchor; click-drag = curve anchor (drags out tangent handles). The sub-tools edit an existing path's anchor topology (add/delete) and point type (corner↔smooth). This is the precision path authoring tool (vs Pencil's freehand).
**3. Location:** Tools panel (flyout holds the 3 sub-tools).
**4. Icon conceptual description:** a fountain-pen nib (concept); sub-tools: pen with a "+", pen with a "−", pen with a caret/corner (concept).
**5. Shortcut:** `P`.

**6. Mouse interaction:**
- **Click (no drag):** place a **corner anchor**. A preview segment (rubber-band) connects the previous anchor to the cursor.
- **Click-drag:** place a **curve anchor** — dragging pulls the tangent handles; the outgoing handle follows the pointer, the incoming handle mirrors it (smooth point).
- **Click on the starting anchor:** close the path (fills it if a fill is set).
- **Hover an existing path:** cursor switches to Add-anchor (pen +) on a segment, Delete-anchor (pen −) over an anchor, Convert (caret) over an anchor with Alt/Option held.
- **Continue an open path:** click its end anchor to append.
**7. Touch interaction:** tap = corner anchor; tap-drag = curve anchor (finger-offset loupe shows the handles); double-tap on start anchor = close path; long-press anchor = add/delete/convert menu; two-finger = pan/zoom.
**8. Selection behavior:** none on existing objects — the Pen owns the path being built. When the path closes/completes, it becomes selected (so Properties shows its fill/stroke).
**9. Drag behavior:** dragging from a placed anchor defines the tangent **direction and length** of the outgoing handle (mirrored incoming handle for smooth points). A live curve preview bends toward the pointer.
**10. Double-click behavior:** double-click on the last anchor ends the path (open path, unfilled center if it's a filled-looking open path — fill only applies to enclosed regions at render).
**11. Right-click/context behavior:** close path, end path, cancel path, convert point (on existing anchors).
**12. Tool Options:** snap toggle; "Show Preview" (rubber-band + live curve preview — always on in our app); (option) magnet = snap anchors to grid/guides/objects.
**13. Properties affected:** creates/modifies `shape.path` (anchor positions, handle vectors, point types, closed flag). Fill/stroke styles come from the current Color settings (Part 23).
**14. What it can modify:** creates new vector paths; sub-tools edit **any** path (raw shape outline, drawing object path, mask shape).
**15. What it cannot modify:** bitmaps, text (unbroken), symbol instances (their transform), group internals without entering the group.
**16. Timeline interaction:** drawing adds content to the **current frame** of the **active layer**:
- active frame is a **keyframe** → content adds into it (merge) or a new drawing object is created (object mode).
- active frame is **blank keyframe** → you draw fresh into it.
- active frame is **empty/held** → our app auto-inserts a keyframe then draws (Animate behavior for drawing is to draw into the nearest keyframe/auto-key; we make it explicit with a toast).
- active layer is a **tween layer** → drawing is blocked (Animate: "you cannot draw in a tween layer"); our app shows a clear error + suggests a new layer.
- active layer is **locked/hidden** → blocked with reason.
**17. Keyframe interaction:** the path is stored in the current keyframe's content array. If you draw on a **motion-tween span** frame, Animate disallows; our app warns and creates a blank keyframe only if you confirm (to avoid corrupting tween spans).
**18. Vector interaction:** the core precision editor: corner anchors (two independent tangents), smooth anchors (mirrored tangents), closed vs open paths, per-anchor add/delete/convert. `Shift` while dragging a handle snaps to 45°. `Alt/Option` while dragging a handle **splits** the mirror (creates a corner). `Alt/Option`+click an anchor converts its type.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none directly (use inside symbol edit).
**21. Shape interaction:** raw shape = merge behavior; object mode = creates a Drawing Object. Closing a path with a fill set fills the enclosed area.
**22. Common mistakes:** not closing the path → fill doesn't appear; wrong handle direction → S-curves instead of C-curves; forgetting the Convert sub-tool exists and struggling to change a corner to a curve; drawing on a locked layer and seeing "nothing".
**23. Professional use:** clean character silhouettes; precise logo curves; motion-guide paths (Part 10); custom mask shapes (Part 21); cut-out rig shapes.
**24. Example workflow:** `P` → trace a head profile with 6 anchors (mix of corners and curves) → close the path → set fill skin color, stroke dark → `F8` convert to symbol.
**25. Equivalent in our app:** a `PenTool` writing anchors into the Vector Engine's path model, with live rubber-band + curve preview; the three sub-tools are **modifier states** (like modern editors: hold Alt = convert, hover+drag to add/delete) **and** standalone modes for touch. Emits one `DrawPathCommand` on completion (undoable in one step).
**26. Mobile implementation:** anchor placement with a magnified loupe; tap-drag for handles with offset; double-tap to close; long-press for anchor ops; an "undo last anchor" button (Backspace equivalent) always visible.
**27. Desktop implementation:** classic pen + rubber-band + snap; HUD showing segment length/angle; Esc cancels the in-progress path.

**EVENT SEQUENCE (draw a 3-anchor closed path):**
```
pointerdown (click)  → add anchor[0]
pointermove          → rubber-band preview from anchor[0] to cursor
pointerdown (click)  → add anchor[1] (straight segment committed)
pointerdown (drag)   → add anchor[2] as curve; drag defines handles (live curve preview)
pointerdown on anchor[0] → close path → commit DrawPathCommand { path, style }
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | snap handle/segment to 45° |
| Alt/Option | split handles (corner) while dragging; convert point type on click |
| Ctrl/Cmd | temporarily activate Selection |

**UNDO GRANULARITY:** the whole path = one `DrawPathCommand` (undo removes the entire path). Sub-tool edits = one `PathEditCommand` each.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape'|'drawingObject', shape:{path, fills[], strokes[]}})`. Merged vs object mode changes the node type (Part 06/33).

---

## T2B.2 — TEXT TOOL

**1. Official name:** Text tool.
**2. Purpose:** Create and edit text. Three behavior types: **Static** (authored display text, rasterized/outlined at export), **Dynamic** (runtime-updatable text, e.g. score, captions), **Input** (user-editable fields, e.g. forms). (TLF = legacy Text Layout Framework, deprecated — documented only as history.)
**3. Location:** Tools panel.
**4. Icon conceptual description:** a letter "T" (concept).
**5. Shortcut:** `T`.

**6. Mouse interaction:**
- **Click on empty stage:** create **point text** (auto-width: box grows with content; no wrap).
- **Drag a rectangle:** create **fixed-width text** (box constrains width; text wraps).
- **Click inside an existing text block:** enter text-edit (caret + character selection with drag).
**7. Touch interaction:** tap = place point text; drag = fixed-width box; tap existing text = edit with the **system keyboard**; text-selection handles (like OS text editing) for select/copy/cut.
**8. Selection behavior:** a text block is a single selectable object. While in text-edit, the tool selects *characters* (caret + range), not the object. Exit edit (click empty / Esc / switch tool) returns to object selection.
**9. Drag behavior:** drag = size the fixed-width box (re-wraps text); drag from inside (edit mode) = select characters.
**10. Double-click behavior:** double-click a text block → enter character editing at that point.
**11. Right-click/context behavior:** cut/copy/paste text, font/size/color, align, convert to movie clip, Break Apart (characters → separate blocks; again → vector shapes), export text as PNG.
**12. Tool Options:** none in the Options area (all settings live in Properties — Part 26 text schema).
**13. Properties affected (model writes):** `textNode.text` (string), `textNode.style` { fontFamily, fontSize, color, bold, italic, align, letterSpacing, lineSpacing, underline… }, `textNode.box` { width, height, autoSize }, `textNode.type` (static/dynamic/input), `textNode.embedFonts` (glyph set), `textNode.antiAlias`, `textNode.selectable` (input), plus the shared `transform`.
**14. What it can modify:** creates/edits text blocks.
**15. What it cannot modify:** raw shapes, bitmaps, symbol instances — unless text is **broken apart** (Break Apart once = each character its own text block; twice = characters become vector shapes).
**16. Timeline interaction:** text lives on a frame/keyframe; draw-on-locked/tween-layer rules identical to T2B.1 field 16.
**17. Keyframe interaction:** text content is keyframable. **Motion tween** on text: Animate auto-wraps the text in a symbol (tweening text directly requires it). **Classic tween** needs text converted to a symbol first. **Shape tween** needs text broken apart to shapes. Our app enforces these with clear prompts instead of silent wraps.
**18. Vector interaction:** only after Break Apart×2 (text → vector outlines); then editable with Subselection/Pen.
**19. Bitmap interaction:** none (text is vector/glyph based).
**20. Symbol interaction:** text can be converted to a symbol (F8) or wrapped by motion tween; text inside symbols edits in symbol mode.
**21. Shape interaction:** break-apart text behaves as shapes (merge/object rules apply).
**22. Common mistakes:** expecting a shape tween on un-broken text; forgetting to **embed fonts** for dynamic text (runtime falls back to a system font, layout shifts); point vs box text confusion (auto-width vs wrap); anti-alias setting causing blurry small text.
**23. Professional use:** titles, lower-thirds, dynamic scoreboards/counters, input forms in interactive pieces, captions; break-apart for logo treatments.
**24. Example workflow:** `T` → type "TITLE" → set font/size/color in Properties → `F8` movie clip → keyframe fade-in (alpha 0→100 motion tween).
**25. Equivalent in our app:** a `TextTool` + **Text Engine** (Part 32): text nodes in the scene graph; glyph rendering via canvas `fillText` (web) / Skia/DirectWrite (desktop) / glyph atlas (export); a text style schema; runtime binding for dynamic text (bind `textNode.text` to a variable); font embedding list. Nothing Adobe-specific.
**26. Mobile implementation:** tap + system keyboard (IME-aware); drag handles for box sizing; font/size via panel; long-press for cut/copy/paste menu; text selection via native selection overlay.
**27. Desktop implementation:** inline editing with caret, IME support, double-click word select, rich text metrics (baseline, leading, tracking), spell-check optional.

**EVENT SEQUENCE (create point text):**
```
pointerdown on empty → create text node at point (autoSize=width)
→ enter edit mode; system IME opens (mobile)
typing → textNode.text += char (undo coalesced per word/session)
pointerdown outside / Esc / tool switch → exit edit → commit TextCommand
```
**UNDO GRANULARITY:** text typing is coalesced (one undo per typing session or word); a single `TextCommand` stores before/after string + style.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'text', text, style, box, textType, embedFonts})`.

---

## T2B.3 — LINE TOOL

**1. Official name:** Line tool.
**2. Purpose:** Draw a straight **stroke** between two points (no fill).
**3. Location:** Tools panel.
**4. Icon conceptual description:** a diagonal straight line (concept).
**5. Shortcut:** `N`.

**6. Mouse interaction:** press = start point; drag = rubber-band preview; release = commit. `Shift` constrains to 45° increments. (Press+drag then release all happen in one gesture.)
**7. Touch interaction:** finger drag; a "constrain" toggle (or auto-snap) replaces Shift; length/angle readout HUD for precision.
**8. Selection behavior:** the new stroke becomes selected on commit.
**9. Drag behavior:** rubber-band preview line.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** cancel stroke (Esc also cancels mid-drag).
**12. Tool Options:** snap (magnet); drawing mode (merged vs object); (option) show length/angle HUD.
**13. Properties affected:** creates a stroke path: `shape.strokes[0]` (or a stroke-only shape in object mode) with current stroke style { color, thickness, cap, join, style }.
**14. What it can modify:** creates strokes only.
**15. What it cannot modify:** fills; existing objects.
**16–17. Timeline/keyframe:** same draw-target rules as T2B.1 field 16/17.
**18. Vector interaction:** the line is a 2-anchor path; editable afterward with Selection/Subselection/Width tools.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode → the line merges/splits other shapes it crosses (Part 06); object mode → independent object.
**22. Common mistakes:** wrong stroke thickness/color set earlier (check Color controls first); not holding Shift → off-axis line; expecting a fill.
**23. Professional use:** guidelines, speed lines, panel borders, horizon lines, technical edges.
**24. Example workflow:** `N` → set stroke 2px black → draw horizon with Shift → snap to grid.
**25. Equivalent in our app:** a `LineTool` = Pen with exactly 2 anchors, no curves, stroke-only. Reuses the stroke style system.
**26. Mobile implementation:** drag + snap; numeric length/angle entry for precision; constrain toggle.
**27. Desktop implementation:** Shift-snap to 45°; live length/angle HUD; snap to grid/guides/objects.

**EVENT SEQUENCE:**
```
pointerdown → record start (snapped)
pointermove  → preview line start→cursor (shift-snapped)
pointerup    → commit DrawPathCommand { path:[start,end], stroke:style }
```
**MODEL WRITES:** a stroke-only shape in the current frame.

---

## T2B.4 — RECTANGLE TOOL

**1. Official name:** Rectangle tool.
**2. Purpose:** Draw rectangles (with optional rounded corners) as raw merge shapes or drawing objects, with fill + stroke.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a square/rectangle outline (concept).
**5. Shortcut:** `R`.

**6. Mouse interaction:** drag corner-to-corner. Modifiers: `Shift` = square; `Alt/Option` = draw from center; `Shift+Alt` = centered square. Release commits.
**7. Touch interaction:** drag between two corners; snap to grid; numeric W/H entry for precision.
**8. Selection behavior:** the new shape becomes selected on commit.
**9. Drag behavior:** rubber-band rectangle preview.
**10. Double-click behavior:** (legacy) opens Rectangle Settings (corner radius). Our app: the corner-radius control is always in Options/Properties, no modal.
**11. Right-click/context behavior:** cancel.
**12. Tool Options:** corner radius (0 = square, >0 = rounded, in px); snap; drawing mode.
**13. Properties affected:** creates a rect path (4 corners, optional rounded) + fill/stroke styles.
**14. What it can modify:** creates rectangles.
**15. What it cannot modify:** existing shapes.
**16–17. Timeline/keyframe:** standard draw-target rules.
**18. Vector interaction:** the rect is a 4-anchor closed path (or rounded with arcs); editable afterward.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode merges/splits; object mode = atomic drawing object.
**22. Common mistakes:** drawing rounded when intending square (radius not reset); forgetting Shift → not square; expecting it to draw a perfect square without modifier.
**23. Professional use:** panels, UI boxes, backgrounds, mattes, color fields.
**24. Example workflow:** `R` → drag a backdrop → set fill → Arrange → Send to Back.
**25. Equivalent in our app:** `RectTool` emitting a `RectNode` (x, y, w, h, cornerRadius) — parametric until edited/broken; renderer tessellates to path on demand.
**26. Mobile implementation:** drag + numeric W/H + radius slider; snap.
**27. Desktop implementation:** Shift/Alt modifiers; live W/H HUD; radius via Options or a corner drag handle.

**MODEL WRITES:** `layers[i].frames[f].content.push({type:'rect', x, y, w, h, cornerRadius, fill, stroke})` (or baked path in merge mode — see Part 06).

---

## T2B.5 — OVAL TOOL

**1. Official name:** Oval tool.
**2. Purpose:** Draw circles/ellipses with fill + stroke.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an ellipse outline (concept).
**5. Shortcut:** `O`.

**6. Mouse interaction:** drag a bounding box; `Shift` = circle; `Alt/Option` = from center; `Shift+Alt` = centered circle.
**7. Touch interaction:** drag; snap; numeric diameter entry.
**8. Selection behavior:** new shape selected on commit.
**9. Drag behavior:** rubber-band ellipse preview.
**10. Double-click behavior:** (legacy) Oval Settings: start/end angle + inner radius (donut/arc). Our app: these are always-visible Options (arc sweep + donut hole).
**11. Right-click/context behavior:** cancel.
**12. Tool Options:** start angle, end angle (arc/pie), inner radius (donut), close path toggle; snap; drawing mode.
**13. Properties affected:** ellipse path (arc segments) + fill/stroke.
**14. What it can modify:** creates ellipses.
**15. What it cannot modify:** existing shapes.
**16–17. Timeline/keyframe:** standard.
**22. Common mistakes:** forgetting Shift → ellipse not circle; donut settings left over from last time.
**23. Professional use:** heads, eyes, wheels, buttons, rings.
**24. Example workflow:** `O` → Shift-drag a circle → set radial gradient fill → Gradient Transform to light it.
**25. Equivalent in our app:** `EllipseTool` emitting an `EllipseNode` (cx, cy, rx, ry, startAngle, endAngle, innerRadius) — parametric until edited.
**26–27. Mobile/desktop:** as Rectangle; arc/donut via Options.

---

## T2B.6 — RECTANGLE PRIMITIVE TOOL / T2B.7 — OVAL PRIMITIVE TOOL

**1. Official name:** Rectangle Primitive tool; Oval Primitive tool.
**2. Purpose:** Draw rectangles/ovals whose parameters stay **editable after creation** — a "procedural/parametric" shape instead of a baked path. Change corner radius, start/end angles, inner radius later without redrawing.
**3. Location:** Tools panel flyout (with Rectangle/Oval).
**4. Icon conceptual description:** square/ellipse with a small handle dot (concept).
**5. Shortcut:** `R` / `O` (shared flyout).

**6. Mouse interaction:** same drag as Rectangle/Oval. After creation, dragging the **dot handle** on the shape adjusts its parameters live (radius / angles / hole).
**7. Touch interaction:** drag to create; drag handle dot to adjust parameters; numeric panel.
**8. Selection behavior:** selecting a primitive shows its **parameter handles** (dots) instead of raw-path anchors.
**9. Drag behavior:** handle drag = non-destructive parameter edit.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to drawing object / break apart (bakes the path, losing parametric edit).
**12. Tool Options:** same numeric params as Rectangle/Oval (radius; start/end angle; inner radius) + snap + drawing mode.
**13. Properties affected:** `primitiveNode.params` { w, h, cornerRadius } or { cx, cy, rx, ry, startAngle, endAngle, innerRadius }. Properties panel shows these params until the shape is baked.
**14. What it can modify:** creates parametric primitives.
**15. What it cannot modify:** once broken apart / converted, it is a raw path (no more params).
**22. Common mistakes:** breaking apart too early and losing the ability to tweak radius; not noticing it's still parametric (Subselection won't show normal anchors until baked).
**23. Professional use:** UI elements you may resize/re-round later; placeholders whose proportions change during layout.
**24. Example workflow:** draw a rounded-rect button as a Primitive → later drag the dot to increase roundness → then bake to path for final edit.
**25. Equivalent in our app:** `RectPrimitiveNode` / `EllipsePrimitiveNode` storing parameters; rendered by tessellation; "bake to path" converts to a plain shape node. This is a small, high-value feature.
**26–27. Mobile/desktop:** drag + handle dot + numeric params.

---

## T2B.8 — POLYSTAR TOOL (POLYGON / STAR)

**1. Official name:** PolyStar tool.
**2. Purpose:** Draw regular polygons (3–32 sides) and stars (configurable point count + spike depth).
**3. Location:** Tools panel flyout (with Rectangle/Oval).
**4. Icon conceptual description:** a polygon outline (concept).
**5. Shortcut:** none by default (assignable).
**6. Mouse interaction:** drag a bounding box; the polygon/star is generated from current params.
**7. Touch interaction:** drag; params via Options.
**8–11. Interactions:** standard draw; Options dialog (or panel) sets: **Style** = Polygon | Star; **Number of Sides/Points** (3–32); **Star Point Size** (0–1; 0 = max spike depth, 1 = degenerate to polygon).
**12. Tool Options:** as above + snap + drawing mode.
**13. Properties affected:** parametric polygon/star record (or baked path).
**14. What it can modify:** creates polygons/stars.
**15. What it cannot modify:** existing shapes.
**22. Common mistakes:** wrong star-point size → skinny spikes or flat shape; forgetting sides count.
**23. Professional use:** starbursts, badges, gear teeth, decorative shapes.
**24. Example workflow:** PolyStar → 5 sides → drag → yellow fill → convert to symbol → rotate slowly (motion tween).
**25. Equivalent in our app:** `PolyTool` producing a parametric polygon/star node.
**26–27. Mobile/desktop:** drag + numeric panel.

---

## 02b BUILD CHECKPOINT

- [ ] Pen tool draws open/closed Bézier paths (corners + curves), with add/delete/convert anchor editing.
- [ ] Text tool: point + box text; static/dynamic/input types; font/size/color/align/spacing; break-apart ×2 to shapes.
- [ ] Line / Rectangle / Oval / PolyStar create shapes honoring current fill+stroke, merged vs object mode, and snapping.
- [ ] Primitives stay parametric (radius/angles/hole editable) until baked.
- [ ] Every draw tool: correct behavior on locked/hidden/tween layers; auto-keyframe rule on non-keyframe frames; undo = one command per drawn object.
- [ ] All tools work on desktop and touch with the specified equivalents.

*Next: `02c_tools_painting.md` — Pencil, Brush, Paint Brush (art/pattern), Fluid Brush (legacy), Eraser, Width.*
