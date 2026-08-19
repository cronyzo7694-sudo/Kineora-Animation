# PART 02a — EVERY TOOL: SELECTION & TRANSFORM TOOLS
### Deep 27-field specification. This file covers: Selection, Subselection, Free Transform, Gradient Transform, 3D Rotation (legacy), 3D Translation (legacy), Lasso (+Polygon, +Magic Wand).

> **How to read this file.** Every tool uses the identical 27-field schema below. Read a tool top-to-bottom and you have everything needed to implement it: what it does, how the user drives it (mouse + touch + keyboard), what data it writes into the document model (field names reference Part 33 JSON), and what can go wrong. Implementation guidance targets a **cross-platform engine** (Desktop = Windows/macOS/Linux; Mobile = Android/iOS/tablets; Web = same codebase). Every tool is a `Tool` implementing the interface from Part 01 §1.3.2.

### THE 27-FIELD SCHEMA (template)

```
TOOL NAME:
 1. Official name
 2. Purpose
 3. Location
 4. Icon conceptual description (original app draws its own glyph — never Adobe's art)
 5. Shortcut
 6. Mouse interaction
 7. Touch interaction
 8. Selection behavior
 9. Drag behavior
10. Double-click behavior
11. Right-click/context behavior
12. Tool Options (Options area of the Tools panel)
13. Properties affected (which document-model fields change)
14. What objects it can modify
15. What objects it cannot modify
16. Timeline interaction
17. Keyframe interaction
18. Vector interaction
19. Bitmap interaction
20. Symbol interaction
21. Shape interaction
22. Common mistakes
23. Professional use
24. Example animation workflow
25. Equivalent functionality needed in our application
26. Mobile implementation
27. Desktop implementation
```

Plus, where it matters, two extra blocks per tool:
- **EVENT SEQUENCE** — the exact pointer/keyboard event chain and what happens at each phase.
- **MODIFIER MATRIX** — a table of modifier keys (Shift / Alt-Option / Ctrl-Cmd / Space) and their effect during that tool.
- **UNDO GRANULARITY** — what a single Undo step reverts.
- **MODEL WRITES** — the exact JSON paths (Part 33) this tool mutates.

---

## T2A.1 — SELECTION TOOL

**1. Official name:** Selection tool.
**2. Purpose:** Select entire objects (raw shapes, drawing objects, groups, symbol instances, text blocks, bitmaps) and move them; also *reshape* raw vector paths by dragging their edges/corners; and drill into groups/symbols by double-click. This is the default, always-available tool.
**3. Location:** Tools panel, first button (top-left).
**4. Icon conceptual description:** a solid black filled arrow cursor pointing up-left (standard pointer). Our app draws its own arrow glyph; do not copy Adobe's exact pixel art.
**5. Shortcut:** `V`. (Temporarily: holding `V` while another tool is active switches to Selection for as long as held; `Ctrl` on Windows / `Cmd` on macOS does the same for some tools.)

**6. Mouse interaction:**
- **Click (press+release without movement):** hit-test at pointer → select the top-most selectable object at that point (see hit-test rules, Part 03). Replaces current selection. Clicking empty space (stage/pasteboard) clears selection.
- **Click on a vector edge/curve:** if the click lands within `edgeHitRadius` (≈4 px) of a raw-shape path, the tool enters **edge-reshape** mode instead of selecting the whole shape.
- **Drag (press, move ≥3 px, release):** two cases:
  - (a) pressed **on an object** → move the selection (or the single object under the cursor) by the pointer delta. Emits a `MoveCommand` on release.
  - (b) pressed **on empty space** → **marquee**: draw a rectangle; on release select every object intersecting the rectangle (or touching it, if Contact-Sensitive Selection is on — see field 8).
- **Drag on a raw-shape edge:** live re-shape of that segment (field 18).
**7. Touch interaction:**
- **Tap:** select under finger (hit-test uses a finger-sized tolerance ≈ 20–24 px).
- **Drag:** if started on an object → move it (finger offset not shown under finger — see Part 31 for the offset-loupe); if started on empty → marquee select.
- **Edge-reshape with a finger** is error-prone: our app enables it only when a "Node/Reshape mode" toggle is on, otherwise a finger drag always moves/marquees.
- **Two-finger drag:** reserved for canvas pan (never object move). Pinch = zoom (app-level).
**8. Selection behavior:**
- Click = single select (deselects others). `Shift`+click = **toggle** membership (add if absent, remove if present).
- Drag-marquee = rectangular select. Two preferences matter:
  - **Contact-Sensitive Selection ON** → any object merely *touched* by the marquee is selected.
  - **Contact-Sensitive Selection OFF** → only objects fully *enclosed* are selected.
- Double-click = drill into group/drawing-object/symbol (field 10).
- `Ctrl+A` Select All = everything on **unlocked, visible layers of the current timeline** (does not select locked/hidden layers, or other scenes).
- Selecting a **part of a merge shape** (fill only, or stroke only) is possible — see Part 03 for fill/stroke-only selection; the fill and stroke of a raw shape are separate selectable sub-objects.
- A selection can be **mixed** (multiple object types); then Properties shows only common properties (x, y, w, h).
**9. Drag behavior:**
- Moving a selection translates all its members by the same delta. **Snapping** applies (if enabled): snap to object edges/centers, grid, guides, pixels — a dashed snap line is drawn as feedback.
- Dragging a raw-shape **corner** moves that anchor; dragging an **edge** bulges the segment; modifier `Alt/Option` on a corner adds a curve handle; `Ctrl/Cmd` temporarily converts selection-to-move even if you started on a point.
**10. Double-click behavior:**
- On a **group or drawing object** → enter edit-in-place (drill one level; the breadcrumb updates; other objects dim).
- On a **symbol instance** → enter symbol edit-in-place (Part 11).
- On a **raw shape's fill** → select fill + its stroke together.
- On a **connected line** → select the entire connected line chain.
- On a **text block** → enter text-edit (caret).
- On a **bitmap** → select it and show transform box (older behavior: opens bitmap editor — our app: select only).
**11. Right-click/context behavior:** opens the object context menu (Part 30): Cut, Copy, Paste, Select All, Deselect, Convert to Symbol (F8), Break Apart, Edit (in place), Swap Symbol, Arrange, Transform, Export PNG, etc. On empty stage: paste, paste-in-place, document settings, etc.
**12. Tool Options (Options area):**
- **Magnet (snap to objects)** — toggle: moving/reshaping snaps to nearby objects' edges, centers, anchor points.
- **Smooth / Straighten** — buttons applied to a *selected raw shape*: simplify curves (Smooth) or straighten near-straight segments (Straighten). These modify geometry immediately.
**13. Properties affected (model writes):**
- On move: `node.transform.x`, `node.transform.y` (Part 33 `Transform`).
- On reshape: `shape.path` (anchor/control-point array).
- Selection itself: transient UI state (not persisted), but selection drives which object's properties the Properties panel shows (Part 26).
**14. What it can modify:** raw shapes (merge shapes) incl. their fill and stroke sub-objects; drawing objects; groups (as a unit — reshape requires entering the group); symbol instances (move only); text blocks; bitmaps (move/select); connected line chains.
**15. What it cannot modify:**
- Content on **locked** layers (click selects nothing; marquee skips them).
- Content on **hidden** layers.
- The *inside* of a group/symbol without double-clicking into it.
- Anchor-level curve handles of a path (that is Subselection, T2A.2) — the Selection tool can move corners/edges but not pull individual Bézier handles.
**16. Timeline interaction:**
- Selecting/moving does not change frames by itself.
- Moving an object **while the current frame is a keyframe** edits that keyframe's stored value.
- Moving an object **while the current frame is a held/static frame** (not a keyframe) → Animate auto-inserts a keyframe at the playhead (or edits the span's first keyframe). **Our app's rule (explicit):** moving content on a non-keyframe auto-converts that frame to a keyframe and warns the user with a status toast.
- (Legacy) **Auto-Keyframe mode** inserts keyframes automatically while scrubbing — deprecated; our app offers a toggle with the same semantics (P2).
**17. Keyframe interaction:**
- A move on a frame that belongs to a **motion tween span** creates/updates a **position property keyframe** at the playhead (Part 09). x and y are independent per-property keyframes.
- A move on a **classic tween** intermediate frame → Animate inserts a keyframe there and the classic tween re-interpolates through it.
**18. Vector interaction (edge/curve reshaping):**
- Hovering a path edge shows a small arc or right-angle cursor (arc = can bend curve; angle = can move corner).
- **Drag an edge:** the segment between its two anchors is re-fit as a curve through the dragged point (quadratic/cubic). If the edge was straight, dragging bulges it into a curve; if curved, dragging moves the apex.
- **Drag a corner:** the anchor moves; adjacent segments follow. `Alt/Option`+drag corner → pulls a one-sided tangent out of a corner (converts corner→curve locally).
- **Drag an end-anchor of an open path:** moves that endpoint.
- All reshape writes go into `shape.path`; smoothing may reduce point count.
**19. Bitmap interaction:** select/move bitmap instances; double-click selects; no pixel editing. Bitmaps are moved as rectangles; they cannot be "reshaped" by edge-drag.
**20. Symbol interaction:** click selects the **instance** (not the symbol definition); move changes instance transform only; double-click enters edit-in-place; right-click → Edit / Swap Symbol / Break Apart.
**21. Shape interaction:**
- In **merge-shape mode** (Part 06), selecting part of a shape (a fill or a stroke) and dragging it **cuts** that part away from the rest — the classic Flash "select + drag splits a shape" behavior. (This surprises users; our app makes it a documented, discoverable behavior with a one-time tooltip.)
- In **object-drawing mode**, the drawing object is atomic: click selects the whole object.
**22. Common mistakes:**
- Thinking drag = move when it actually drew a marquee (pressed empty space by 1 px).
- Accidentally reshaping a vector edge when intending to move the object (fix: drag from the object's fill, not its outline).
- Selecting a fill but not its stroke, moving it, and leaving a "ghost" stroke behind.
- Forgetting that locked layers block selection.
**23. Professional use:** primary placement & nudging; quick curve cleanup (drag edges to round/sharpen silhouettes); previewing rig motion by dragging a limb before bones are added; marquee + Shift to build complex selections.
**24. Example animation workflow:** draw an arm with Brush → double-click to select fill+stroke → `F8` convert to symbol → drag to shoulder position → keyframe at frame 1. Later: select arm, drag down at frame 10 → Animate auto-keys → tween between frames 1 and 10.
**25. Equivalent functionality in our app:** a `SelectionTool` that (a) hit-tests via the Scene Graph's spatial index, (b) manages selection state with Shift-toggle and marquee modes, (c) emits `MoveCommand`, `ReshapeCommand` on release, (d) snaps via the shared SnapEngine, (e) drives the Properties/Info/Transform panels through `selection:changed` events. Nothing about this is Adobe-specific — it is generic editor behavior.
**26. Mobile implementation:** tap = select; drag-on-object = move with finger-offset loupe; drag-on-empty = marquee; long-press = context menu; edge-reshape gated behind a "Reshape" mode toggle; multi-select via a "Select" mode where each tap toggles membership (Shift not available). Snap feedback = dashed lines.
**27. Desktop implementation:** pointer hit-testing against an R-tree/quadtree of object bounds; marquee via screen-space rect ∩ bounds (with optional precise path intersection for Contact-Sensitive OFF); Shift/Alt/Ctrl modifier handling; edge reshape using the Vector Engine's path editor.

**EVENT SEQUENCE (move a shape):**
```
pointerdown (on shape)  → hit-test → select shape (unless shift → toggle) → store grab offset
pointermove (≥3px)     → preview: shape.transform.x/y += delta (no commit)
                          → SnapEngine returns nearest snap → apply + draw hint line
pointerup               → commit MoveCommand { target, from, to } → push undo
                          → emit 'document:changed'
```
**MODIFIER MATRIX:**
| Modifier | During drag | During click | During marquee |
|---|---|---|---|
| Shift | constrain move to 45°/axis (if enabled) | toggle selection | add to selection |
| Alt/Option | duplicate-drag (drag a copy) | — | — |
| Ctrl/Cmd | temporarily force move-mode over reshape | temporarily activate Selection | — |
| Space (held) | pan viewport | — | — |

**UNDO GRANULARITY:** one `MoveCommand` per drag gesture (press→release). Reshape = one `ReshapeCommand` per edge-drag gesture (undo restores previous path). Smooth/Straighten = one command each.
**MODEL WRITES:** `layers[i].frames[j].content[k].transform.{x,y}` for moves; `…content[k].shape.path` for reshapes.

---

## T2A.2 — SUBSELECTION TOOL

**1. Official name:** Subselection tool.
**2. Purpose:** Edit vector paths at the **anchor-point level**: move anchors, pull Bézier handles, convert corner↔smooth points; also reshape **motion paths** on motion tweens (Part 10); also move bone ends of an IK shape (Part 14).
**3. Location:** Tools panel, second button (often a flyout with Selection).
**4. Icon conceptual description:** a hollow/white arrow (outline arrow) — signals "sub-object" precision vs the solid Selection arrow.
**5. Shortcut:** `A`.

**6. Mouse interaction:**
- **Click a path:** reveals its anchors as small squares (selected anchor = filled square; unselected = hollow).
- **Click an anchor:** select it; if it is a curve point, its two tangent handles appear (dots on short lines).
- **Drag an anchor:** move it; adjacent segments re-compute.
- **Drag a tangent handle:** change that tangent's direction/length (both sides stay mirrored for a smooth point unless it was split). `Shift` snaps handle to 45° increments; `Alt/Option` breaks the mirror (creates independent handles → corner behavior on that side).
- **`Alt/Option`+click an anchor:** toggle corner ↔ smooth point.
- **Click empty / press Escape:** deselect anchors.
**7. Touch interaction:** tap path → anchors appear (enlarged); drag anchor/handle with finger-offset loupe; long-press anchor → corner/smooth toggle + delete; two-finger = pan/pinch zoom.
**8. Selection behavior:** operates on **anchors and handles**, not whole objects. Shift+click adds anchors to selection; marquee (drag on empty) selects anchors inside the rectangle only. A selected object shows its anchor cloud; nothing else on stage is selected.
**9. Drag behavior:**
- Anchor drag: re-fits the two adjacent segments (and any attached fills).
- Handle drag: modifies the cubic/quadratic control point; the curve re-renders live.
- On a **motion path** (tween): dragging the path reshapes the motion; dragging a **keyframe vertex** on the path moves that keyframe's position value (Part 10).
**10. Double-click behavior:** on a motion path → edit tween path; on an anchor → (legacy) cycles point type. Our app: double-click anchor toggles corner↔smooth.
**11. Right-click/context behavior:** Add Anchor, Delete Anchor, Convert to Smooth/Corner, Reset tangent; on a motion path: add keyframe vertex, reset path.
**12. Tool Options:** none beyond snapping toggles (path/anchor display is always on while active).
**13. Properties affected:** `shape.path` anchor list (positions, handle vectors, point types); for motion paths: the tween's `position` property curve (Part 09/10).
**14. What it can modify:** any vector path — raw shape outlines (strokes and fill boundaries), drawing-object paths, motion-tween motion paths, IK shape contours (move bone end within the shape).
**15. What it cannot modify:** bitmaps; text (unbroken); symbol-instance *transforms*; merge-shape fills as a whole (only their outline paths); a motion path when the span has been converted to keyframes.
**16. Timeline interaction:** editing a motion path adds/updates **position property keyframes** at the edited vertices (Part 10). Editing static artwork edits the current keyframe.
**17. Keyframe interaction:** on a motion tween, path edits modify position keyframes; in an IK pose layer, path edits are **blocked when multiple poses exist** (documented Animate limitation) — our app instead edits only the current pose and warns.
**18. Vector interaction:** the core vector editor. Supports: select single/multiple anchors, move, add/delete anchors, convert point type, pull handles, `Shift` 45° snap, `Alt` split handles. Also "drag to lasso anchors".
**19. Bitmap interaction:** none (bitmaps have no vector path).
**20. Symbol interaction:** none directly — used *inside* symbol-edit mode to fix the symbol's artwork; changes propagate to all instances.
**21. Shape interaction:** edit the outline contour of merge shapes and drawing objects; changing the outline re-fills the interior automatically (fill follows path).
**22. Common mistakes:** pulling the wrong handle; accidentally converting a smooth point to corner (breaks curve continuity); editing the motion path when intending to move the object; not realizing IK shapes lock path editing once posed.
**23. Professional use:** precise logo/character cleanup; finessing motion paths; adjusting IK shape contours; splitting/merging tangents for sharp-vs-smooth corners.
**24. Example workflow:** draw a head outline with Pen → `A` → smooth the jaw by dragging handles → convert the chin to a corner → `F8` to symbol. Later: a motion tween's path curves too wide → `A` → drag path keyframe vertices to tighten.
**25. Equivalent in our app:** a `PathEditTool` over the Vector Engine's path model: selection of anchors/handles, transforms of handles, point-type toggles, and motion-path editing when the hovered path belongs to a tween. Must support **undo per drag** and re-render the path (and its fill) live.
**26. Mobile implementation:** anchor/handle editing is impossible without precision → our app shows a **magnified loupe** (fixed 2–3× zoom bubble offset above the finger) when a handle is grabbed; long-press menu for add/delete/convert; numeric fallback panel for handle angle/length.
**27. Desktop implementation:** full Bézier editing with on-screen readout (angle/length of dragged handle); `Shift` axis snap; `Alt` handle split; marquee anchor selection.

**EVENT SEQUENCE (move a handle):**
```
pointerdown on handle → hit-test anchors → select anchor (shift=add) → grab handle offset
pointermove           → recompute path from new handle vector (live, throttled 60fps)
pointerup             → commit PathEditCommand { path, before, after } → undo push
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | snap handle to 45°; snap anchor move to axes |
| Alt/Option | split mirrored handles (drag one side) / toggle point type on click |
| Ctrl/Cmd | temporarily switch to Selection tool |

**UNDO GRANULARITY:** one `PathEditCommand` per handle/anchor drag gesture. Add/delete/convert = separate commands.
**MODEL WRITES:** `shape.path` (anchors + handles + pointTypes); for motion path: `tween.properties.position.keyframes[]`.

---

## T2A.3 — FREE TRANSFORM TOOL

**1. Official name:** Free Transform tool.
**2. Purpose:** Move, rotate, scale, skew a selection using on-object handles; on **raw shapes only**, also **Distort** (move corners independently) and **Envelope** (deform via a mesh). Also relocates the **transform point (pivot)**.
**3. Location:** Tools panel (flyout with Gradient Transform).
**4. Icon conceptual description:** a square bounding box with corner handles around a shape (concept); our app draws its own.
**5. Shortcut:** `Q`.

**6. Mouse interaction:** hover over a selected object to see the transform box. Cursor changes by zone (field 9). Drag a zone to transform. The white circle **transform point** can be dragged anywhere (sets pivot).
**7. Touch interaction:** handles enlarged to ≥44 px touch targets; one-finger drag = move; two-finger pinch = scale; two-finger twist = rotate; long-press a corner = rotate mode; numeric fallback in Transform panel for precision.
**8. Selection behavior:** operates on the current selection. Single object → its own box. Multiple objects → one shared box around the union (transforms all; Distort/Envelope apply only if **all** members are raw shapes). A new box + transform point appear; the previous transform state is shown (box reflects current scale/rotation/skew).
**9. Drag behavior (zones):**
| Zone | Cursor | Drag does |
|---|---|---|
| Inside box (not on pivot) | move | translate |
| Corner handle | diagonal resize | scale (both axes) |
| Corner handle + just **outside** the corner | rotate arc | rotate around pivot |
| Edge midpoint | left-right / up-down | scale one axis |
| Edge midpoint + `Shift` (or a skew modifier) | skew arrows | skew along that axis |
| Transform point (white circle) | move pivot | relocate pivot |
| `Alt/Option`+corner rotate | rotate | rotate around the **opposite** corner |
**10. Double-click behavior:** double-click the transform point → **re-center it** to the selection's center; (legacy) double-click empty → exit transform mode.
**11. Right-click/context behavior:** Rotate 90° CW/CCW, Scale and Rotate… (numeric dialog), Flip Vertical/Horizontal, Remove Transform (reset), Distort toggle, Envelope toggle.
**12. Tool Options (Options area):** four sub-modes: **Scale**, **Rotate & Skew**, **Distort**, **Envelope**. Distort/Envelope only activate for raw-shape selections.
**13. Properties affected:** `transform.{x,y,scaleX,scaleY,rotation,skewX,skewY}` and `transform.pivot` (Part 33); under Distort/Envelope: `shape.path` vertices.
**14. What it can modify:** raw shapes (all modes incl. distort/envelope), drawing objects, groups, symbol instances, text blocks, bitmaps (move/rotate/scale/skew only).
**15. What it cannot modify:** **Distort/Envelope on symbols, bitmaps, video, sound, gradients, text** — Animate explicitly excludes these; only raw shapes distort. (Workaround: Break Apart text/symbol, or use Asset Warp tool.) Locked layers. Locked objects.
**16. Timeline interaction:** transforming while a keyframe is current records into that keyframe; Auto-Keyframe (legacy) can insert keys while scrubbing (P2 in our app).
**17. Keyframe interaction:** on a **motion tween span**, transforms create **independent per-property keyframes** (x, y, scaleX, scaleY, rotation, skewX, skewY each have their own keyframes — see Part 09). On classic tweens, a transform on an in-between frame inserts a keyframe.
**18. Vector interaction:** scale/rotate re-compute the path matrix; **Distort** moves the 4 corner vertices independently (perspective-ish quad); **Envelope** shows a mesh of points + tangent handles; dragging any mesh point warps the shape (paths re-fit to the deformed mesh).
**19. Bitmap interaction:** move/rotate/scale/skew only — no distort/envelope; use Asset Warp for pixel deformation.
**20. Symbol interaction:** transforms the instance; the pivot = instance **transform point** (distinct from the symbol's registration point — Part 11 explains both). Rotation happens around the pivot.
**21. Shape interaction:** merge shapes and drawing objects fully supported; envelope on raw fills/strokes.
**22. Common mistakes:** distort on a symbol is silently ignored → user thinks it's broken; skewing when meaning to scale (grabbed edge instead of corner); pivot left at a weird place → rotation swings wildly; envelope mesh edited then shape "explodes" if points cross.
**23. Professional use:** posing cut-out parts (rotate around joints); flipping walk-cycle limbs; scaling heads for squash-and-stretch; setting pivots **before** adding bones.
**24. Example workflow:** select arm symbol → `Q` → drag pivot to the shoulder joint → rotate arm up → keyframe at frame 1 → rotate down at frame 10 → motion tween (rotation property animates).
**25. Equivalent in our app:** a `TransformTool` that renders a bounding box + handle hit-zones; maps gestures to transform matrix ops; writes into the `Transform` component on the node; supports pivot editing; Distort/Envelope delegate to the Vector Engine's mesh deformer. Emits `TransformCommand` per gesture.
**26. Mobile implementation:** large handles; snap rotation to 15°; pivot drag via offset-loupe; two-finger pinch/rotate; numeric Transform panel as the precision path; distort/envelope via a "Warp mode" with drag points + on-screen magnification.
**27. Desktop implementation:** 8-handle box + rotation zone (outside corners) + pivot drag; full modifier support; live numeric readout; envelope mesh editing with tangent handles.

**EVENT SEQUENCE (rotate):**
```
pointerdown in rotate-zone → set mode=rotate; record pivot (transform point) in stage coords
pointermove               → compute angle = atan2(pointer-pivot) - grabAngle
                            → preview node.rotation = startRotation + angle
                            → Shift snaps to 15°/45°
pointerup                 → commit TransformCommand { node, before:{rotation}, after:{rotation} }
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | proportional scale; rotate in 45° steps; skew on axis |
| Alt/Option | rotate around opposite corner; scale from center |
| Ctrl/Cmd | temporarily activate Selection |

**UNDO GRANULARITY:** one `TransformCommand` per gesture (stores before/after of all changed transform fields).
**MODEL WRITES:** `node.transform.{x,y,scaleX,scaleY,rotation,skewX,skewY,pivot}`; distort/envelope → `node.shape.path`.

---

## T2A.4 — GRADIENT TRANSFORM TOOL

**1. Official name:** Gradient Transform tool.
**2. Purpose:** Edit the transform of a **gradient or bitmap fill** applied to a shape: move center, scale/stretch, rotate, adjust focal point (radial), and tile/scale bitmap fills — without changing the shape geometry.
**3. Location:** Tools panel (flyout with Free Transform).
**4. Icon conceptual description:** a square with a diagonal gradient and a small rotation handle (concept).
**5. Shortcut:** `F`.

**6. Mouse interaction:** click a shape with a gradient/bitmap fill → its fill handles appear (center circle, bounding ring/square, rotate handle, focal point for radial). Drag each handle per field 9. Click another shape to switch.
**7. Touch interaction:** tap shape to reveal handles; drag handles (enlarged); two-finger twist to rotate the gradient; numeric gradient controls in the Color panel as fallback.
**8. Selection behavior:** requires a selected (or clicked) shape whose **fill style** is linear/radial gradient or bitmap. Only fill handles show; no object bounding box.
**9. Drag behavior (handles):**
| Handle | Drag does |
|---|---|
| Center | move gradient center |
| Square handle (edge) | scale/stretch the gradient along that axis |
| Circle handle (rotate) | rotate the gradient |
| Focal point (radial) | skew the transition toward one side |
| Bitmap-fill corner | scale/tile the bitmap pattern |
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** reset gradient, convert to solid, open Color panel.
**12. Tool Options:** none (handles are contextual).
**13. Properties affected:** the fill style's **gradient transform matrix** (center, scaleX/Y, rotation, focal) — stored per fill style in `shape.fills[i].style.transform` (Part 33).
**14. What it can modify:** linear-gradient fills, radial-gradient fills, bitmap fills inside raw shapes and drawing objects.
**15. What it cannot modify:** solid fills; strokes; symbol instances; text (unbroken); anything whose fill isn't gradient/bitmap.
**16. Timeline interaction:** editing in a keyframe records into that keyframe; on static frames → auto-key (same rule as T2A.1 field 16).
**17. Keyframe interaction:** the gradient transform is part of the shape's fill style → participates in **shape tween** interpolation between keyframes (gradient rotates/scales morph smoothly).
**18. Vector interaction:** modifies fill style data only, never path geometry.
**19. Bitmap interaction:** bitmap *fills* only (a bitmap used as a fill pattern); not placed bitmap instances.
**20. Symbol interaction:** n/a directly (edit inside symbol mode).
**21. Shape interaction:** merge shapes + drawing objects.
**22. Common mistakes:** clicking a stroke or a solid fill (no handles appear); confusing focal point with center (radial gradients); expecting it to rotate the shape (it rotates the gradient only).
**23. Professional use:** lighting (radial highlight off-center = lit sphere), sky gradients, fake 3D shading, tiling a texture inside a shape.
**24. Example workflow:** fill a ball with radial gradient → `F` → drag center up-left, drag focal point to fake a light source → ball looks 3D → shape-tween the gradient later for a moving light.
**25. Equivalent in our app:** a `FillTransformTool` that exposes the fill's local transform matrix via handles; stores as `fillStyle.transform`; renders a live preview by re-rasterizing the fill. Delegates gradient math to the Color/Render engine (Part 32).
**26. Mobile implementation:** drag handles with snap; the Color panel provides numeric center/rotation/scale; two-finger twist = rotate gradient.
**27. Desktop implementation:** direct-manipulation handles + live preview; `Shift` snaps rotation to 45°; `Alt` resets.

**EVENT SEQUENCE (rotate gradient):**
```
pointerdown on rotate handle → mode=rotateFill
pointermove → gradient.transform.rotation += delta → re-render fill live
pointerup → commit FillTransformCommand
```
**UNDO GRANULARITY:** one `FillTransformCommand` per handle-drag.
**MODEL WRITES:** `shape.fills[i].style.transform.{center, scaleX, scaleY, rotation, focal}`.

---

## T2A.5 — 3D ROTATION TOOL (LEGACY)

**1. Official name:** 3D Rotation tool.
**2. Purpose:** (Legacy — ActionScript 3.0 documents only) Rotate **movie-clip instances** in simulated 3D around x/y/z axes for a 2.5D effect.
**3. Location:** Tools panel flyout (legacy).
**4. Icon conceptual description:** a circle with three 3D axis arrows (concept).
**5. Shortcut:** `W`.
**6. Mouse interaction:** hover a movie clip → 3D axis rings appear; drag a ring = rotate around that axis; drag center = free rotation; crosshair overlay shows the axes.
**7. Touch interaction:** two-finger twist = z rotation; drag axis rings for x/y; numeric panel for exact values.
**8. Selection behavior:** requires a movie-clip instance; no effect on other types.
**9. Drag behavior:** per-axis ring rotation; the instance re-projects (2.5D) live.
**10. Double-click behavior:** reset rotation (legacy).
**11. Right-click/context behavior:** reset 3D, switch global/local axes.
**12. Tool Options:** global vs local axis toggle (iconized).
**13. Properties affected:** `instance.rotationX/rotationY/rotationZ`.
**14. What it can modify:** movie-clip instances only.
**15. What it cannot modify:** shapes, groups, text, graphic/button symbols, HTML5/WebGL documents (unsupported outside AS3).
**16–17. Timeline/keyframe:** 3D values are per-keyframe; tweenable as property keyframes (rotationX/Y/Z animate independently).
**22. Common mistakes:** using it in HTML5 Canvas documents (unsupported — Animate silently doesn't offer it); confusing 3D rotation with the 2D rotation property.
**25. Equivalent in our app:** **not** a separate tool. Our app provides a **2.5D transform component** (`rotateX`, `rotateY` with perspective) on any node + camera z-depth parallax (Part 16). This covers the real use case (fake 3D) with a cleaner model.
**26–27. Mobile/desktop:** gesture-based 3D gizmo (mobile) / axis rings (desktop), only if the 2.5D component is enabled.

---

## T2A.6 — 3D TRANSLATION TOOL (LEGACY)

**1. Official name:** 3D Translation tool.
**2. Purpose:** (Legacy AS3) Move movie-clip instances along x/y/z in simulated 3D.
**3. Location:** Tools panel flyout (legacy).
**4. Icon conceptual description:** 3D axis arrows with a translate handle (concept).
**5. Shortcut:** `G`.
**6–11. Interactions:** drag an axis arrow = move along that axis; drag center = free move; touch: axis handles; double-click/context = reset; global/local toggle.
**13. Properties affected:** `instance.x/y/z`.
**14. What it can modify:** movie clips (legacy AS3).
**15. What it cannot modify:** everything else; non-AS3 docs.
**25. Equivalent in our app:** z-depth property on nodes/layers + camera (Part 16). No dedicated tool.

---

## T2A.7 — LASSO TOOL (+ POLYGON MODE, + MAGIC WAND)

**1. Official name:** Lasso tool; sub-modes: **Polygon Mode** and **Magic Wand**.
**2. Purpose:** Freeform-area selection (irregular outline); Polygon Mode selects via straight segments; Magic Wand selects same/similar-colored regions of a **broken-apart bitmap**.
**3. Location:** Tools panel (flyout).
**4. Icon conceptual description:** a lasso rope loop (concept); Polygon = lasso with straight edges; Wand = a wand with sparkle.
**5. Shortcut:** `L` (modes chosen in the Options area or the flyout).

**6. Mouse interaction:**
- **Lasso:** press and drag to trace a freeform loop; release closes the loop (straight line back to start); everything inside (and intersecting, if contact-sensitive) is selected.
- **Polygon Mode:** click to drop a vertex; click successive vertices; **double-click** to close.
- **Magic Wand:** single click on a color region; selects the contiguous area of same/similar color (within threshold).
**7. Touch interaction:** finger-drag traces the loop; Polygon Mode = tap per vertex, double-tap to close; Wand = tap a color. Threshold via a slider in Options.
**8. Selection behavior:** selects **raw-shape area** inside the loop (partial shape selection — only the enclosed pixels/regions of merge shapes) or **bitmap pixel regions** (after Break Apart) for the Wand. Symbols/groups/text are only selectable whole (the loop must fully enclose them; they cannot be partially lassoed). Shift = add to selection.
**9. Drag behavior:** freehand trace path; preview line follows pointer.
**10. Double-click behavior:** closes a Polygon Mode selection.
**11. Right-click/context behavior:** invert selection, select similar color, exit lasso mode.
**12. Tool Options:** Polygon Mode toggle; Magic Wand Mode toggle; **Magic Wand Threshold** (0–255; higher = more colors match) and **Smoothing** (pixels/rough/normal/smooth) for the Wand.
**13. Properties affected:** selection mask (which shape regions / bitmap pixels are selected) — transient; a subsequent move/cut/edit writes to the model.
**14. What it can modify:** raw merge shapes (partial area), broken-apart bitmaps (Wand region).
**15. What it cannot modify:** intact symbols/instances/text (only whole-object selection); groups; un-broken bitmaps (Wand does nothing until Break Apart).
**16–17. Timeline/keyframe:** selection is transient; the follow-up action (move/delete/fill) edits the current keyframe.
**18. Vector interaction:** partial-shape selection then move = **cut** that region away (merge model); then fill = paint region; delete = remove region (splits strokes).
**19. Bitmap interaction:** Wand = flood-fill selection by color similarity (connected-component + threshold); delete = transparent holes; move = cut region into a new bitmap.
**20. Symbol interaction:** whole-instance selection only when fully enclosed.
**21. Shape interaction:** partial region selection of merge shapes.
**22. Common mistakes:** forgetting to Break Apart a bitmap before Magic Wand (nothing happens); partial shape selection then deleting leaves stray stroke segments; threshold too low/high for the Wand.
**23. Professional use:** cutting texture regions; organic silhouette selection; cleaning scanned art (wand-select background → delete).
**24. Example workflow:** import a scanned drawing → Break Apart → Magic Wand (threshold ~30) click the white background → Delete → clean line art remains → trace/vectorize.
**25. Equivalent in our app:** a `LassoTool` with three modes over the Raster/Vector engines: freeform (polygonize the pointer path, then region-select by winding/point-in-polygon), polygon (same with click vertices), magic wand (BFS flood-fill on the raster buffer with per-channel threshold). Selection is a **mask** applied on the next command.
**26. Mobile implementation:** finger-drag lasso; tap-per-vertex polygon (double-tap closes); wand = tap; threshold slider always visible in Options; selection mask highlighted with marching-ants.
**27. Desktop implementation:** pointer path → polygon → scanline point-in-polygon for vector; flood-fill for raster.

**EVENT SEQUENCE (wand):**
```
pointerdown on bitmap → mode=wand → BFS flood-fill from pixel (threshold) → region mask
pointerup → selection = region mask (no model write yet)
next action (delete/fill/move) → command writes to model
```
**UNDO GRANULARITY:** the *follow-up* command (e.g., DeleteRegion) is the undo unit; the selection itself is not undoable.
**MODEL WRITES:** depends on follow-up: `shape.path` (region cut), bitmap pixel buffer (delete), etc.

---

## 02a BUILD CHECKPOINT

After implementing these 7 tools, the editor must be able to:

- [ ] Click-select any object; Shift-toggle; marquee-select (both contact-sensitive modes).
- [ ] Move a selection with snapping; undo/redo each move.
- [ ] Reshape a vector edge/corner with the Selection tool; undo restores the path.
- [ ] Edit anchors + Bézier handles with Subselection; toggle corner↔smooth; split handles with Alt.
- [ ] Free-transform: move/rotate/scale/skew + relocate the pivot; numeric readout.
- [ ] Distort/Envelope raw shapes (only raw shapes).
- [ ] Transform a gradient's center/rotation/focal and a bitmap fill's tiling.
- [ ] Lasso freeform + polygon selection; Magic-Wand color selection on a broken-apart bitmap.
- [ ] All of the above through **touch** (tap/drag/pinch/twist/long-press) with the mobile mappings specified.
- [ ] Cross-platform: identical behavior on Windows/macOS/Linux desktop and on tablets (pointer events unified — Part 31).

*Next: `02b_tools_drawing.md` — Pen (+anchor sub-tools), Text, Line, Rectangle, Oval, Rectangle/Oval Primitives, PolyStar.*
