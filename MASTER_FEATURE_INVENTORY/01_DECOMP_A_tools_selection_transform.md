# §3. FULL FEATURE DECOMPOSITION — PART A: TOOLS · SELECTION · TRANSFORM

> Every feature decomposed to: sub-features → controls → options → states → interactions → model/engine/command/persistence/export → priority. Sources in `[brackets]`. Tool specs use the 27-field schema (`T2A.1`…`T2D.13`).

---

## 3.0 APPLICATION SHELL & WORKSPACE  [F-01-01/02/03 · C-02 · Part 01 §1.1]

### 3.0.1 Application shell & window anatomy  [F-01-01 · REQ-SYS]
- **Regions (default "Essentials" workspace):**
  - **Menu bar** (top) — File/Edit/View/Insert/Modify/Text/Commands/Control/Debug/Window/Help [Part 01 §1.1.1]
  - **Stage** (center) — canvas + gray pasteboard [Part 01 §1.4]
  - **Timeline panel** (bottom, docked)
  - **Tools panel** (left, docked) — 4 sections (Tools/View/Colors/Options)
  - **Properties panel** (right, docked)
  - **Library panel** (right/float)
  - **Other panels** — Color, Swatches, Align, Transform, Info, Scene, Components, Actions, Output, Motion Editor, Frame Picker, Layer Depth, Brush Library, Movie Explorer, History
  - **Edit bar** (above stage) — breadcrumb `Scene ▸ symbol ▸ nested…` + Back button [Part 11.3]
  - **Status bar** (bottom) — frame, fps, elapsed time, workspace switcher, zoom
- **Panel/dock manager** [MOD-PANEL]: every panel = `{id, title, defaultDock, isVisible, floatingRect, size}`.
- **Event bus** [MOD-BUS, REQ-SYS-006]: `context:changed`, `selection:changed`, `timeline:changed`, `document:changed`, `tool:changed` — panels subscribe, never read each other.
- **Dark/light theme** via CSS tokens (no hard-coded colors) [Part 01 §1.1.4].

### 3.0.2 Workspaces  [F-01-02 · C-02]
- Save/customize arrangements · "New Workspace…" · "Reset Workspace" · workspace switcher (status bar) · persistence to **app prefs** (JSON, never project) · dock/float/group/stack/tab.
- **Interactions:** drag tab → stack/float; drag to edge → dock; drag to center → tabs.

### 3.0.3 Multi-document management  [F-01-03]
- Multiple `.fla`-equivalent docs in tabs · Window ▸ arrange · per-doc Library/timeline · panels bind to **active** doc.
- **States:** No-document (empty state + New/Open buttons) · Loading (spinner/skeleton) · Multiple (tabs) · Active-doc binding.

### 3.0.4 Status bar & state visibility  [F-01-29 · C-05 · REQ-UI]
- Always-visible cells: **tool** (icon+name) · **selection** (count + commonType) · **activeLayer** (name + lock/hidden icon) · **activeFrame** (N/total + fps) · **activeScene** · **activeSymbol** (breadcrumb) · **recording** (REC) · **playback** (▶/⏸/loop) · **saving** (Saving…/Saved hh:mm) · **export** (progress %) · **mode** (transform/rig/camera/text) · **snap** (grid/objects/pixels).
- Clickable frame cell → go-to-frame dialog. aria-live for changes.

### 3.0.5 Command palette  [C-04 · REQ-SYS-008 · ENG-023]
- **Cmd+K / Ctrl+K** global fuzzy search over tools/commands/panels/features/actions/shortcuts · Enter runs · shows shortcut · Esc/outside-click close · focus trapped · mobile bottom-sheet. The discoverability backstop — **every feature registers a palette entry**.

### 3.0.6 Menus  [F-01-04..14 · C-03]  *(full tree in §4)*
File / Edit / View / Insert / Modify / Text / Commands / Control / Debug(legacy) / Window / Help.

### 3.0.7 Stage & canvas  [F-01-16 · Part 01 §1.4]
- **Geometry:** stage = `width×height` px; origin (0,0) top-left; +X→right, +Y→down.
- **Pasteboard/work area:** gray surround; authored but **not exported**; View ▸ Work Area toggles (Ctrl+Shift+W).
- **Compositing order (render pass):** background → grid/guides/rulers → layers bottom→top → (per frame: display-list order, recurse groups/symbols) → mask clipping → onion-skin ghosts → camera transform → **selection overlays** (never exported).
- **Rendering modes** (View ▸ Preview Mode): Full / Fast / Anti-alias / **Outline** (paths only).
- **View transform** (zoom/pan/rotate-view) is authoring-only; **camera** (Part 16) is a separate animatable document transform.

### 3.0.8 Grid / Guides / Rulers / Snapping  [F-01-17 · Part 01 §1.4.4]
- **Rulers** (Ctrl+R) · **Guides** (drag from ruler; move/lock/snap; cyan/magenta, non-printing) · **Grid** (Ctrl+'; configurable) · **Snapping** to objects/grid/guides/pixels · **Snap Align** (dashed alignment hints).
- **SnapEngine** [MOD-*]: candidate point → nearest snap point + hint line; used uniformly by move/transform/draw.
- **Snap states:** snap-to-objects (magnet), snap-to-grid, snap-to-guides, snap-to-pixels — each a toggle.

---

## 3.1 TOOLS — SHARED FOUNDATION  [F-02-00 · Part 02 §"Stroke capture"]

### 3.1.0 Tool interface (state-machine abstraction)  [Part 01 §1.3.2 · STM-TOOL]
- Every tool: `{id, cursor(), onPointerDown/Move/Up, onKeyDown/Up, optionsSchema, canTarget(hit)}`.
- **Gesture** = down→move(s)→up → one **Command** on up. Undo = inverse command.
- **States (STM-TOOL):** INACTIVE → ACTIVE → DRAGGING → COMMITTING | CANCELLING.
- **Modifier matrix** per tool (Shift/Alt/Ctrl/Space).

### 3.1.1 Stroke capture & smoothing pipeline (shared)  [F-02-00 · REQ-DRW]
- Input pipeline: pointermove (60–240Hz) → resample (0.5–2px) → smoothing (RDP + moving-average/one-euro + straighten recognizer) → per-point attributes (pressure/tilt/velocity) → variable-width skeleton → **one DrawCommand** on pointerup.
- **Smoothing amount** = per-tool slider 0–100 [W5].

---

## 3.2 SELECTION & TRANSFORM TOOLS  [Part 02a]

### 3.2.1 Selection Tool (V)  [F-02-01 · T2A.1 · C-01]
- **Purpose:** select whole objects + move + reshape raw vector edges + drill into groups/symbols.
- **Interactions:**
  - Click = select top-most; click empty = clear.
  - Click within `edgeHitRadius` (≈4px desktop / 24px touch) of raw-shape path → **edge-reshape** mode.
  - Drag (≥3px) on object = move (`MoveCommand`); on empty = **marquee**.
  - Drag on raw-shape edge = live reshape.
  - Shift+click = toggle · Shift+drag = constrain 45°/axis · Alt/Option+drag = duplicate-drag · Ctrl/Cmd = force move-mode · Space(held) = pan.
  - Double-click: group/DO → edit-in-place; instance → symbol edit; fill → fill+stroke; connected line → whole chain; text → text-edit; bitmap → select.
- **Options area:** Magnet (snap to objects) · Smooth · Straighten.
- **States:** normal · object-selected · marquee-in-progress (live preview) · edge-reshape (arc/angle cursor) · locked/hidden hit (no-entry cursor + toast).
- **Model writes:** `node.transform.{x,y}` (move); `shape.path` (reshape). Selection = transient view state.
- **Commands:** `MoveCommand`, `ReshapeCommand`, `Smooth`/`Straighten` (one each).
- **Undo granularity:** one MoveCommand per drag; one ReshapeCommand per edge-drag.
- **[REQUIRED — P0]**

### 3.2.2 Subselection Tool (A)  [F-02-02 · T2A.2]
- **Purpose:** anchor-point editing, Bézier handles, corner↔smooth, motion-path editing, IK bone-end moves.
- **Interactions:** click path → anchors; click anchor → select; drag anchor/handle; Shift=45° snap; Alt/Option=split mirror (corner); Alt+click anchor = toggle corner/smooth; marquee selects anchors.
- **Right-click:** Add/Delete Anchor, Convert Smooth/Corner, Reset tangent; (motion path) add keyframe vertex, reset path.
- **Model writes:** `shape.path` (anchors/handles/point types); motion path → `tween.properties.position.keyframes[]`.
- **Commands:** `PathEditCommand` (per handle/anchor drag); add/delete/convert = separate commands.
- **[REQUIRED — P0]**

### 3.2.3 Free Transform Tool (Q)  [F-02-03 · T2A.3 · C-15 · REQ-XFR]
- **Purpose:** move/rotate/scale/skew + pivot relocation + Distort/Envelope (raw shapes only).
- **Handle zones (drag behavior):** inside box = translate · corner = scale both · just-outside corner = rotate · edge midpoint = scale one axis · edge+Shift = skew · white circle pivot = relocate · Alt+corner rotate = rotate around opposite corner.
- **Options (4 sub-modes):** Scale · Rotate & Skew · Distort · Envelope (Distort/Envelope only for raw shapes).
- **Double-click pivot = re-center** to selection center.
- **Right-click:** Rotate 90° CW/CCW, Scale and Rotate…, Flip H/V, Remove Transform, Distort/Envelope toggle.
- **States:** single-object box · multi-object union box · Distort/Envelope on non-shape = DISABLED + tooltip.
- **Modifiers:** Shift = proportional scale / 45° rotate / axis skew · Alt = opposite-corner/center.
- **Model writes:** `transform.{x,y,scaleX,scaleY,rotation,skewX,skewY,pivot}`; distort/envelope → `shape.path`.
- **Command:** one `TransformCommand` per gesture (all changed fields).
- **[REQUIRED — P0]**

### 3.2.4 Gradient Transform Tool (F)  [F-02-04 · T2A.4]
- **Purpose:** edit gradient/bitmap-fill transform (center, scale/stretch, rotation, focal, tile).
- **Handles:** center · square (scale/stretch) · circle (rotate) · focal point (radial) · bitmap-fill corner (tile).
- **Model writes:** `shape.fills[i].style.transform.{center,scaleX,scaleY,rotation,focal}`.
- **Command:** `FillTransformCommand` per handle-drag. Participates in shape tween.
- **States:** gradient/bitmap fill required (solid fill → disabled).
- **[REQUIRED — P0]**

### 3.2.5 3D Rotation Tool (W) — LEGACY  [F-02-05 · T2A.5]
- AS3 movie-clip 2.5D rotation (x/y/z axis rings). **Not a separate tool in Kineora** — replaced by 2.5D transform component (`rotateX/rotateY`) + camera z-depth. `[LEGACY]` `[NOT BUILT]`.

### 3.2.6 3D Translation Tool (G) — LEGACY  [F-02-06 · T2A.6]
- AS3 movie-clip z-translation. Replaced by z-depth + camera. `[LEGACY]` `[NOT BUILT]`.

### 3.2.7 Lasso Tool (L) + Polygon Mode + Magic Wand  [F-02-07 · T2A.7]
- **Lasso:** freeform trace → select inside/intersecting (contact-sensitive).
- **Polygon Mode:** click vertices, double-click to close.
- **Magic Wand:** click a color → select contiguous same-color region (broken-apart bitmaps only).
- **Options:** Polygon Mode toggle · Magic Wand Mode toggle · **Magic Wand Threshold** (slider 0–200, default user-set ~20) · **Wand Smoothing** (Pixels/Rough/Normal/Smooth).
- **Selection = mask** applied on next command (delete/fill/move).
- **Undo granularity:** the follow-up command (selection itself not undoable).
- **[REQUIRED — P0] (wand P1)**

---

## 3.3 SELECTION SYSTEM (full)  [F-03-01..19 · Part 03 · C-01 · REQ-SEL]

### 3.3.1 Selection data structure  [F-03-02 · REQ-SEL-002]
```
selection = { kind: objects|anchors|frames|bones|warpPins|camera|none,
              mode: normal|subselection,
              targets: [{nodeId, subPath?} | {nodeId, anchorIndex?}],
              anchorIds[], bounds{}, commonType }
```
- **Dual-domain:** stage targets + timeline selection (`selectedLayers/activeLayerId/selectedFrames`).
- Sub-object (fill/stroke) = `nodeId + subPath` — split deferred to command time (REQ-SEL-006).

### 3.3.2 Hit testing  [F-03-01 · REQ-SEL-001]
- **Order:** overlays (handles/anchors/bones/pins/camera) first → top layer → front object → recurse groups/symbols → skip locked/hidden → empty = stage.
- **Algorithm:** `hitTestNode` per type: shape/drawingObject (point-in-path winding + 4px edge-hit → stroke sub-object) · group (recurse) · instance (bounds) · text (box) · bitmap (rect; alpha>0 if precise) · brushStroke/warp (outline/mesh).
- **Spatial index** (quadtree/R-tree per layer) for O(log n).
- **Edge-hit radius:** 4px desktop / 24px touch (configurable).
- **Drag threshold (disambiguation):** ≥3px desktop / 12px touch before marquee; below + release = click [OUR DESIGN DECISION].

### 3.3.3 Click selection  [F-03-03]
- Single top-most · empty = clear · double-click drill-down matrix (fill=fill+stroke / stroke=stroke-chain / group=edit-in-place / instance=symbol-edit / text=caret / bitmap=select).
- **Simple Buttons ON** (D9): live button blocks click-select; select via marquee/Alt+click.
- **Alt+click = cycle z-stack** (select-behind, ours — C4).

### 3.3.4 Shift toggle / multi-select  [F-03-04]
- Shift+click = add/remove membership · **Shift Select preference** (D1 — disable Shift+click) · deselect-individual · 3-way Shift semantics.
- Click toggles; marquee adds (Alt+marquee = subtract, ours — C5).

### 3.3.5 Marquee selection  [F-03-05 · REQ-SEL-004]
- **Contact-Sensitive ON** (default, ours — C1): touched = selected · **OFF**: fully-enclosed only.
- Raw shapes: selects fill **regions** (partial); atomic objects: whole enclosure.
- Timeline frame marquee; additive/subtractive.

### 3.3.6 Lasso / Select All / Deselect / by-timeline / by-layer  [F-03-06/07/08/09]
- **Select All** (Ctrl+A): unlocked+visible layers, current timeline only.
- **Select by timeline** (keyframe click → select content, toggle gated).
- **Frame-selection model:** frame-based default, span-based opt-in (hamburger) — C3. drag=range, Shift+click=contiguous, Ctrl/Cmd+click=non-contiguous.
- **Alt+, / Alt+.** = keyframe hop (D10).
- **Select by layer:** active-layer tracking; "Select All on Layer".

### 3.3.7 Per-object-type selection  [F-03-10..14]
- **Raw shape:** fill vs stroke sub-objects (speckled fill / colored stroke) · double-click fill = whole shape.
- **Drawing object / group:** atomic; double-click edit-in-place.
- **Instance:** instance ≠ definition; pivot shown as white circle.
- **Text:** block select; double-click = text-edit.
- **Bitmap:** rect; broken-apart = region selectable.
- **Bone:** red highlight + bound points (yellow with Bind); Shift multi; double-click = armature.
- **Warp pins / camera** selection.

### 3.3.8 Locked & hidden behavior  [F-03-15 · REQ-SEL]
| State | Selection | Editing | Select All | Export |
|---|---|---|---|---|
| Locked layer | skipped | blocked | skipped | exported |
| Hidden layer | not selectable/rendered | skipped | skipped | **not exported** (default) |
| Outline layer | normal | editable | included | exported full |
| Locked **object** (Arrange ▸ Lock) | blocked | blocked | skipped | exported |
| Hidden **object** (ours, P2) | skipped | — | — | — |

### 3.3.9 Selection overlay  [F-03-16 · REQ-EXP-002]
- Selection outline (1–2px) · dotted fill highlight · bounding box (configurable color) · transform handles · anchor dots + tangent handles · bone glyphs + bind points · warp pins · camera outline · **Hide Edges** (Ctrl+Shift+E) suppresses all.
- `SelectionOverlayRenderer` drawn last; never in export/thumbnails.

### 3.3.10 Selection events & timeline interaction  [F-03-17/18 · REQ-SEL-005]
- `selection:changed {prevTargets, targets, kind, commonType, bounds}` — emit once per gesture; `selection:preview` throttled during drag.
- `selection:lost` on delete/scrub; selection persists while node still exists at new frame.
- Selection = view state (no undo); commands capture `prevSelection` and restore it.

### 3.3.11 Mobile selection  [F-03-19 · C-33]
- Tap (24px) · long-press (context) · **Select-mode** toggle (Shift replacement) · one-finger marquee (two-finger = pan) · loupe for anchors.

---

## 3.4 TRANSFORM SYSTEM (full)  [F-04-01..14 · Part 04 · C-15 · REQ-XFR]

### 3.4.1 Transform model & matrix  [F-04-01 · REQ-XFR-001]
- `transform = {x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY}` — decomposed values stored (matrix = cached derivative).
- **Matrix order (concept):** `Translate · Rotate(skewY) · Skew(skewX) · Scale · Translate(-pivot)`.
- **Spaces:** stage / object-local / parent / screen.

### 3.4.2 Move  [F-04-02] — delta + snap + duplicate-drag (Alt) + nudge (arrows 1px, Shift 10px) → `transform.x/y`. Motion tween: independent x/y keys.

### 3.4.3 Scale  [F-04-03] — corner/edge handles, pivot-based, Shift=proportional, Alt=opposite-corner, negative scale = flip, squash&stretch (scaleX≠scaleY). `scaleX/scaleY` (motion: independent keys; log-lerp).

### 3.4.4 Rotate  [F-04-04] — rotation zone, 45°/15° snap, opposite-corner (Alt), pivot decides. `rotation` (+CW/CCW/flags).

### 3.4.5 Skew  [F-04-05] — edge+Shift, axis; skew kept separate from rotation. `skewX/skewY`.

### 3.4.6 Free transform combined  [F-04-06] — one TransformCommand per gesture; combine rotate+scale allowed.

### 3.4.7 Distort  [F-04-07 · REQ-XFR-002] — 4 corner handles, baked into path geometry, shape-tweenable, **not** a tweenable transform. Shape-only.

### 3.4.8 Envelope  [F-04-08] — mesh + tangent handles, baked into path. Shape-only. (Asset Warp supersedes — Part 02d.)

### 3.4.9 Registration vs pivot vs center  [F-04-09 · REQ-XFR-003]
- **Registration point** = symbol-local (0,0), set at creation (9-point grid).
- **Pivot (transform point)** = per-instance rotation/scale center (white circle, draggable).
- **Transform center** = bounding-box center (derived).
- Double-click pivot = re-center.

### 3.4.10 Numeric transform  [F-04-10] — X/Y/W/H(%/px)/Rotate/Skew fields + constrain-proportions chain + Scale & Rotate dialog (Ctrl+Alt+S) + 3D (legacy). Enter/blur commit = one command; Esc revert.

### 3.4.11 Copy / Remove transform  [F-04-11] — Copy/Paste Transform (whole component) · **Remove Transform** = flatten (scale=1, rotate=0, skew=0, path re-baked) [P1].

### 3.4.12 Flip H/V  [F-04-12] — mirror around center (scaleX/Y negated); flip-around-pivot option.

### 3.4.13 Transform ↔ animation summary  [F-04-13]
| Op | Stored | Motion keys | Classic | Shape |
|---|---|---|---|---|
| Move | x,y | x-key,y-key (independent) | position key | position |
| Scale | scaleX,Y | scaleX-key,scaleY-key | linear | — |
| Rotate | rotation | rotation-key(CW/CCW/loops) | linear | — |
| Skew | skewX,Y | skewX-key,skewY-key | linear | — |
| Pivot | pivotX,Y | **not tweenable** | — | — |
| Distort/Envelope | baked path | — | — | morph |
| Flip | scale negated | scale-key | linear | — |

### 3.4.14 Mobile transform  [F-04-14] — pinch scale · twist rotate · handles ≥44px · loupe pivot drag · numeric panel.
