# §3. FULL FEATURE DECOMPOSITION — PART B: DRAWING · SHAPE · TIMELINE · KEYFRAME

---

## 3.5 DRAWING TOOLS (GEOMETRIC & PATH)  [Part 02b · C-13 · REQ-DRW]

> All drawing tools honor the **draw-target contract** (REQ-DRW-003): active layer lock/hidden/tween + frame key/blank/held/empty + drawing mode (merge/object) + fill/stroke style + snapping. One `DrawCommand` per completed shape.

### 3.5.1 Pen Tool (P) + anchor sub-tools  [F-02-08 · T2B.1]
- Click = corner anchor · click-drag = curve anchor (tangents) · click start = close · hover = add/delete/convert cursor · continue at end anchor.
- Sub-tools: **Add Anchor Point**, **Delete Anchor Point**, **Convert Anchor Point** (also modifier states: hold Alt=convert).
- Options: snap toggle · Show Preview (rubber-band + live curve) · magnet.
- Shift = 45° · Alt = split mirror · Esc = cancel in-progress path.
- Model: `shape.path` (anchors/handles/pointTypes/closed) + fill/stroke styles.
- Undo: whole path = one `DrawPathCommand`; sub-tool edits = one `PathEditCommand` each.

### 3.5.2 Text Tool (T)  [F-02-09 · T2B.2 · C-16 · REQ-TXT]  *(full system §3.24)*
- Click = **point text** (auto-width, no wrap) · drag = **fixed-width box** (wraps) · click-inside = character edit (caret).
- Three types: **Static / Dynamic / Input**.
- Undo: typing coalesced (per word/session) = one `TextCommand`.

### 3.5.3 Line Tool (N)  [F-02-10 · T2B.3]
- Press-drag-release; Shift = 45°; stroke-only (no fill). Options: snap · drawing mode · length/angle HUD. Model: stroke-only shape. Undo: one `DrawPathCommand`.

### 3.5.4 Rectangle Tool (R)  [F-02-11 · T2B.4]
- Drag corner-to-corner; Shift = square; Alt = from center; Shift+Alt = centered square.
- Options: **corner radius** (0=square, >0=rounded, px) · snap · drawing mode.
- Model: `{type:'rect', x,y,w,h,cornerRadius, fill, stroke}` (or baked path in merge mode).

### 3.5.5 Oval Tool (O)  [F-02-12 · T2B.5]
- Drag bounding box; Shift = circle; Alt = from center. Options: **start angle, end angle (arc/pie), inner radius (donut), close path** · snap · drawing mode.

### 3.5.6 Rectangle Primitive / Oval Primitive (R/O flyout)  [F-02-13/14 · T2B.6/7]
- **Parametric** shapes — parameters stay editable (dot handle drags radius/angles/hole) until baked.
- Model: `rectPrimitive{w,h,cornerRadius}` / `ellipsePrimitive{cx,cy,rx,ry,startAngle,endAngle,innerRadius}`.
- Bake (Break Apart / Convert to drawing object) → plain path (loses params). [P1]

### 3.5.7 PolyStar Tool (polygon/star)  [F-02-15 · T2B.8]
- Options: **Style** Polygon|Star · **Sides/Points** (3–32) · **Star Point Size** (0–1). No default shortcut (assignable).

### 3.5.8 Pencil Tool (Shift+Y)  [F-02-16 · T2C.1]
- Freehand strokes with **3 assist modes**: **Straighten** (recognize near-straight/arc runs) · **Smooth** (default) · **Ink** (raw, minimal processing).
- Options: drawing mode · assist mode · smoothing-strength slider · snap. Shift = force straight segments · Alt = temporary eyedropper · Space = pan.
- Model: stroke path with `{color, thickness, cap, join, style, widthProfile}`.

### 3.5.9 Brush Tool (B)  [F-02-17 · T2C.2]
- Paints **fill** geometry (not strokes). Stylus pressure/tilt → width/angle.
- **5 paint modes:** Paint Normal · Paint Fills · Paint Behind · Paint Selection · Paint Inside.
- Options: **Brush Mode** · **Brush Size** (free slider) [W5] · **Brush Shape** (round/flat/angled) · **Lock Fill** (gradient continuity) · Pressure/Tilt toggles.
- Undo: one `DrawFillCommand` per stroke.

### 3.5.10 Paint Brush Tool (Y) — Art/Pattern brushes  [F-02-18 · T2C.3]
- Stroke-based **Art Brush** (stretched) / **Pattern Brush** (tiled) along path.
- Options: Stroke Style dropdown (doc brushes + Brush Library) · Edit Stroke Style → Art (Scale Proportionately / Stretch to Fit / Stretch Between Guides) · Pattern (Stretch to fit / Add space / Approximate path; Flip H/V; Spacing; At corners = Center/Flank/Slice/Overlap).
- Model: `{type:'brushStroke', brushAssetId, path, widthProfile}`. Brushes live in Library + Brush Library panel. [P1]

### 3.5.11 Fluid Brush Tool — LEGACY/REMOVED  [F-02-19 · T2C.4]
- CS5.5-era. Folded into Brush as smoothing+taper+ink-flow (P2). `[REMOVED]`.

### 3.5.12 Eraser Tool (E)  [F-02-20 · T2C.5 · REQ-SHP]
- **5 modes:** Erase Normal · Erase Fills · Erase Lines · Erase Selected Fills · Erase Inside.
- Options: mode · **Eraser Shape** (round/square) · **Faucet** (delete whole fill/stroke segment in one click) · Size slider.
- Boolean subtraction + stroke splitting. Undo: one `EraseCommand` per stroke.
- (Legacy double-click clears stage → ours: "Clear Stage" button + confirmation.)

### 3.5.13 Width Tool (U)  [F-02-21 · T2C.6]
- Per-point variable width via drag handles; Alt+drag = asymmetric (one side); save/reuse **width profiles**.
- Model: `stroke.widthProfile = [{t, wL, wR}]`. Shape-tweenable. [P1]

---

## 3.6 UTILITY / VIEW / RIGGING / CAMERA TOOLS  [Part 02d]

### 3.6.1 Eyedropper (I)  [F-02-22 · T2D.1]
- Sample fill/stroke style (solid/gradient/bitmap) → **style clipboard**; explicit apply (no hover-paint bug) [W6].
- Options: sample fill only / stroke only / both. Right-click: Apply-to-selection / Paste fill style / Paste stroke style. Alt+click = apply to target.

### 3.6.2 Paint Bucket (K)  [F-02-23 · T2D.2]
- Flood-fill enclosed region. Options: **Gap Size** (Don't Close / Close Small / Medium / Large) · **Lock Fill**. Winding/even-odd rules.

### 3.6.3 Ink Bottle (S)  [F-02-24 · T2D.3]
- Apply stroke style to outline (add/restyle). No options.

### 3.6.4 Hand (H)  [F-02-25 · T2D.4] — pan viewport (Space = temporary). View-only.

### 3.6.5 Zoom (Z)  [F-02-26 · T2D.5] — click in / Alt out / marquee zoom; Ctrl+=/−/1/0. View-only.

### 3.6.6 Stage Rotate (Shift+H)  [F-02-27 · T2D.6] — rotate view; reset option. Not persisted.

### 3.6.7 Time Scrubber (Shift+Alt+H)  [F-02-28 · T2D.7] — scrub playhead by horizontal drag on stage. [P2].

### 3.6.8 Bone Tool (M)  [F-02-29 · T2D.8 · C-23]  *(engine §3.15)*
- Chain symbol instances OR carve bones inside a shape (IK shape). Pose by dragging.
- Right-click: Insert Pose, Remove Bone, Remove Armature, Add Spring, constraints.
- Model: bone graph `{parent, child, length, angle}` + constraints + pose.

### 3.6.9 Bind Tool (sub-tool)  [F-02-30 · T2D.9]
- Edit point→bone weighting (IK shapes). Shift+click point = add; Ctrl/Option+click = remove; Shift+drag = lasso-add. Squares = single-bone, triangles = multi-bone points.

### 3.6.10 Camera Tool (C)  [F-02-31 · T2D.10 · C-27]  *(engine §3.17)*
- Pan (drag) / Zoom (Shift+drag or slider) / Rotate (Ctrl+drag or slider) + reset buttons.
- Model: `camera{x,y,z,zoom,rotation,tint,filters}` + camera layer keyframes.

### 3.6.11 Asset Warp Tool  [F-02-32 · T2D.11 · C-24]  *(engine §3.15.8)*
- Pins + mesh over shape/DO/bitmap; **rigid** (articulated) / **flexible** (MLS/ARAP). Keyframed pins stored as data (no flicker) [W3].
- Alt+click = toggle rigid/flexible; double-click (Selection) = edit base shape (vector).
- Model: `{type:'warpAsset', sourceNodeId, baseShapeId?, warp:{mode, pins[], mesh{verts,triangles}}}`. [P1]

### 3.6.12 Deco Tool & Spray Brush — LEGACY  [F-02-33/34 · T2D.12/13]
- Procedural patterns / symbol scatter. Optional generator brushes (P3). `[LEGACY]` `[NOT BUILT]`.

---

## 3.7 DRAWING SYSTEM (stroke/fill model)  [F-05-01..10 · Part 05]

### 3.7.1 Stroke model  [F-05-01 · REQ-DRW-001]
- **Creation** (pen/pencil/line/rect/oval/polystar/paint-brush; ink-bottle adds to fill) · **thickness** (base width 0.25–200px + variable width profile) · **style** (solid/dash/art/pattern; ragged/stipple = P3) · **color** (flat-only [REQ-DRW-002]; gradient stroke via convert-to-fill) · **opacity** (alpha, top-level slider [W6]) · **smoothing** · **curves** (cubic Bézier canonical) · **corners** · **caps** (round/square/butt) · **joins** (round/miter/bevel + miter-limit) · **editing** · **converting** (lines→fills) · **breaking apart** · **grouping**.

### 3.7.2 Fill model  [F-05-02] — creation (closed path + fill style) · regions · fill rule (nonzero/even-odd).

### 3.7.3 Merge vs object mode  [F-05-03 · REQ-SHP-001]
- **Merged (raw):** same-color overlap = union · diff-color = cut (cookie-cutter) · stroke crosses = split · move part = split-off · delete = hole.
- **Object drawing:** atomic, no interaction, display-list stacking.
- Toggle in tool Options; node type `shape` vs `drawingObject`.

### 3.7.4 Caps & joins  [F-05-04] — round/square/butt; round/miter(limit)/bevel.

### 3.7.5 Stroke rendering (outline polygons)  [F-05-05 · ENG-004] — strokes = offset outline polygons (not line primitives) → correct scaling + variable width. Hairline/anti-alias note.

### 3.7.6 Stroke↔fill conversion  [F-05-06] — Convert Lines to Fills (stroke→fill outline, loses path edit) · Ink Bottle (fill→stroke) · Trace Bitmap.

### 3.7.7 Opacity & compositing  [F-05-07] — no double-darkening on same-style merge overlap.

### 3.7.8 Snapping during drawing  [F-05-08] — grid/guides/objects/pixels.

### 3.7.9 Draw-target contract  [F-05-09 · REQ-DRW-003] — validate layer + frame + mode + style + snap at pointer-down.

### 3.7.10 Per-tool 15-dimension matrix  [F-05-10] — cross-reference (stroke/fill/thickness/style/color/opacity/smoothing/curves/corners/caps/joins/editing/converting/break-apart/grouping).

---

## 3.8 SHAPE SYSTEM  [F-06-01..12 · Part 06 · C-14 · REQ-SHP]

### 3.8.1 Shape taxonomy  [F-06-01]
| Kind | Model type | Atomic | Edit |
|---|---|---|---|
| Raw shape (merge) | `shape` | No (fill/stroke sub-objects) | directly |
| Drawing object | `drawingObject` | Yes | dbl-click edit-in-place |
| Primitive | `rectPrimitive`/`ellipsePrimitive`/`polyStar` | Yes | parametric until baked |
| Group | `group` | Yes | dbl-click edit-in-place |
| *(contrast)* Instance | `symbolInstance` | Yes | edit definition (all instances) |

### 3.8.2 Merge model  [F-06-02] — union/cut/split-on-move/delete-hole (6 exact rules).

### 3.8.3 Drawing objects  [F-06-03] — atomic; edit-in-place; break-apart → raw.

### 3.8.4 Primitives  [F-06-04] — `params` object; tessellated; bake-on-demand.

### 3.8.5 Shape editing & handles  [F-06-05] — levels (whole/anchor/topology/width/style/region); handles (anchors, tangents, primitive dots, width bars, gradient handles).

### 3.8.6 Smooth / Straighten / Optimize  [F-06-06] — simplification; Optimize Curves (Ctrl+Shift+Alt+C) reduces anchors by angle threshold.

### 3.8.7 Combine objects (booleans)  [F-06-07 · REQ-SHP-002]
- **Union / Intersect / Punch / Crop** on drawing objects (raw shapes too, ours).
- Top-most = active (style/punch shape); "keep originals" option (ours). Same Boolean engine as merge.

### 3.8.8 Erase as subtraction  [F-06-08] — stamp boolean + faucet + stroke split.

### 3.8.9 Fill behavior  [F-06-09] — regions; styles (solid/linear/radial/bitmap); gradient transform; lock-fill; gap tolerance; fill rule.

### 3.8.10 Stroke behavior  [F-06-10] — splits at intersections; caps/joins; flat color.

### 3.8.11 Conversion & break-apart hierarchy  [F-06-11 · REQ-SHP-003]
```
symbol instance ─Break Apart─▶ raw content (copy; symbol kept)
group            ─▶ children (one level)
text block       ─▶ per-char text blocks ─▶ vector shapes
bitmap           ─▶ bitmap-fill region (editable)
drawing object   ─▶ raw shape
primitive        ─▶ baked path
```
- Convert Lines to Fills · Expand Fill · Soften Fill Edges (P2) · Trace Bitmap.
- **Tweened symbol → Break Apart BLOCKED** + convert-to-FBF first (ENG-021).

### 3.8.12 Shape data model  [F-06-12 · §33.19] — `{id, type, transform, fillRule, path{anchors,closed}, fills[{region,style}], strokes[{path,closed,style,widthProfile}], params, children}`.

---

## 3.9 TIMELINE  [F-07-01..16 · Part 07 · C-08 · REQ-TIM]

### 3.9.1 Timeline data structure  [F-07-01 · REQ-TIM-001]
- `timeline = {layers[], duration (derived)}`; `layer = {id, name, type, visible, locked, outline, parentId, zDepth, attachedToCamera, frames[] (sparse)}`.
- **Sparse storage + hold rule** (ENG-011): only keyframes + span markers stored; static/empty derived.

### 3.9.2 Layer row controls  [F-07-02 · REQ-LAY-002]
- **eye** (Alt=others, drag=multiple, Shift=transparent) · **lock** (Alt=others) · **outline** (Alt=others) · **name** (dbl-click rename) · **type icon** (dbl = Layer Properties) · **attach-to-camera dot** · **z-depth** (advanced layers).

### 3.9.3 Frame ruler  [F-07-03] — numbering (1,5,10,15…) · click = jump · drag = scrub (audio optional).

### 3.9.4 Playhead  [F-07-04 · REQ-TIM-004] — red line + handle · drag = scrub · click cell = jump · double-click = select column · Home/End · Alt+,/. = keyframe hop. View state (not saved).

### 3.9.5 Frame cells & visual language  [F-07-05 · REQ-TIM-002]
- **Glyphs:** solid dot = keyframe w/ content · hollow dot = blank keyframe · gray = held · white = empty · hollow rect = end of hold · blue bar = motion tween (diamond = property key) · blue+arrow = classic tween · light-green+arrow = shape tween · green+diamond = IK pose · dashed = broken tween · red flag = label · "a" = action.
- Colorblind pattern mode.

### 3.9.6 Frame types  [F-07-06] — keyframe / blank / static(held) / empty / span / motion-tween / classic-tween / shape-tween / pose / labeled / action.

### 3.9.7 Exposure & holds  [F-07-07] — hold rule: nearest keyframe ≤ f; span = [keyframe, nextKeyframe−1].

### 3.9.8 Insert Frame (F5)  [F-07-08 · CMD-INSERT-FRAME] — extend hold +1; later keyframes shift right.

### 3.9.9 Insert Keyframe (F6)  [F-07-09 · CMD-INSERT-KEY] — copy prev content → new key.

### 3.9.10 Insert Blank Keyframe (F7)  [F-07-10 · CMD-INSERT-BLANK] — empty key (breaks hold).

### 3.9.11 Delete / Clear / Remove frames  [F-07-11 · REQ-TIM-003]
- **Delete Frame** (Shift+F5) — remove + shift left (shortens) · **Clear Keyframe** (Shift+F6) — strip key status, keep length · **Remove Frames** — delete + leave gap. Three distinct commands.

### 3.9.12 Copy / Cut / Paste / Duplicate / Move frames  [F-07-12] — frame clipboard (keyframes+tweens+labels) · paste at playhead (overwrite/insert) · duplicate (no clipboard) · drag move (prompt on collision).

### 3.9.13 Reverse / Extend / Shorten / Convert frames  [F-07-13]
- Reverse Frames (order) · Extend/Shorten (span drag) · Convert to Keyframes (bake) · Convert to Blank Keyframes.

### 3.9.14 Distribute to Layers / Synchronize Symbols  [F-07-14]
- Distribute to Layers (split objects to own layers) · **Distribute to Keyframes** (D5 — new) · Synchronize Symbols (legacy; ours = sync-nested-loops P2).

### 3.9.15 Tween span creation  [F-07-15] — Motion / Classic / Shape / Insert Pose (diamond).

### 3.9.16 Timeline cross-interactions  [F-07-16] — audio waveform + scrub · graphic-instance frame mapping · pose diamonds · mobile (long-press menus, ruler pinch).

---

## 3.10 KEYFRAME SYSTEM  [F-08-01..13 · Part 08 · C-17 · REQ-KF]

### 3.10.1 Keyframe data model  [F-08-01 · REQ-KF-001]
- **Two families:** property keyframes (per-property, inside tween span) vs whole-frame keyframes (frame-by-frame/classic).
- Property key: `{frame, property, value, ease?, orientation?, rotations?, roving?}` — property ∈ {x,y,scaleX,scaleY,rotation,skewX,skewY,alpha,tint,brightness,filter.*}.
- Whole-frame: `{frame, type:'keyframe', content[], label?, actions[], sound?}`.

### 3.10.2 Interpolation engine  [F-08-02 · REQ-KF-002]
- Numbers: linear/eased · Rotation: shortest-path (auto) | CW/CCW + rotations×360 · Color: OKLab (ENG-009) · Scale: log-lerp · Camera zoom: log-lerp (ENG-010) · Bones: per-joint angle lerp (ENG-008) · Symbol swap: discrete · Shape: anchor morph.

### 3.10.3 Position keyframe  [F-08-03] — x/y curve control points; motion-path vertex.

### 3.10.4 Rotation keyframe  [F-08-04] — orientation flags (auto/CW/CCW) + rotations count.

### 3.10.5 Scale keyframe  [F-08-05] — per-axis; log-lerp.

### 3.10.6 Shape keyframe  [F-08-06] — whole-frame shape; anchor correspondence in shape tween.

### 3.10.7 Symbol keyframe  [F-08-07] — symbol swap = discrete (no interp).

### 3.10.8 Color keyframe  [F-08-08] — tint/brightness/alpha curves.

### 3.10.9 Camera keyframe  [F-08-09] — camera states on camera layer.

### 3.10.10 Bone/pose keyframe  [F-08-10] — pose interpolation (angles).

### 3.10.11 Mouth/viseme keyframe  [F-08-11] — instance firstFrame swap (discrete).

### 3.10.12 Keyframe lifecycle  [F-08-12] — move (re-time; path re-draw) · delete (property: curve loses point; whole-frame: revert to hold; tween endpoint: **break** = dashed) · duplicate (identical keys = hold/pause).

### 3.10.13 Auto-keying  [F-08-13 · REQ-KF-003] — set-value at non-key playhead → auto-insert key + toast "Auto-keyed frame N"; legacy Auto-Keyframe scrub mode = OFF default (toggle P2).
