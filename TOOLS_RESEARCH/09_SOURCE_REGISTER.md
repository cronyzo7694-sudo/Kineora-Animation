# SOURCE REGISTER — 6 Core Tools Research

> All authoritative sources used for Pen, Pencil, Brush, Eraser, Shapes, Color research. No Code.

## Purpose

Record every source with URL, type, confidence, what behavior it provided, to allow cross-checking and audit.

## Source Quality Levels

- **OFFICIAL:** Official product documentation/manual — highest confidence
- **TECHNICAL:** Official technical docs, reputable technical analysis — high confidence
- **COMMUNITY:** Community discussion, forum, Reddit — lower confidence, useful for real-world behavior not in official docs, labeled as lower-confidence

## 1. Adobe Animate — Official

| ID | URL | Type | What It Provided | Confidence |
|----|-----|------|------------------|------------|
| ADOBE-01 | https://helpx.adobe.com/animate/using/using-stage-tools-panel.html | OFFICIAL | Tools panel 4 sections (tools/view/colors/options), Hand tool Spacebar temporary, Zoom Enlarge/Reduce + drag rect fills window, Pressure/Tilt icons only if Wacom | HIGH |
| ADOBE-02 | https://helpx.adobe.com/animate/using/drawing-pen-tool.html | OFFICIAL | Pen tool 6 pointer states (Initial Anchor, Sequential, Add +, Delete -, Convert ^, Close circle, Continue slash, Retract), straight lines click-click, curves click-drag, C-shape vs S-shape, close path hollow first anchor + circle, add/delete anchor, convert corner/smooth, adjust segments via Subselection, preferences Show Pen Preview/Solid Points/Precise Cursors (crosshair, Caps Lock toggle) | HIGH |
| ADOBE-03 | https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html | OFFICIAL | Pencil tool modes Straighten/Smooth/Ink, Brush tool modes Paint Normal/Fills/Behind/Selection/Inside, Brush size scales with zoom option, Pressure/Tilt for Brush, Line tool stroke only, Rectangle/Oval/PolyStar creation, Object Drawing mode (Merge vs Object), Variable Width tool width points/handles | HIGH |
| ADOBE-04 | https://helpx.adobe.com/animate/using/strokes-fills-gradients.html | OFFICIAL | Stroke/Fill color controls in Tools panel and Property inspector, Smoothing slider 0-100 for Pencil/Brush Smooth mode disabled in Straighten/Ink, Ink Bottle tool for multiple lines, Paint Bucket gap size, Copy strokes/fills via Eyedropper auto-switch to Ink/Bucket | HIGH |
| ADOBE-05 | https://helpx.adobe.com/animate/using/selecting-objects.html | OFFICIAL | Selection tool click object, double-click connected lines, double-click fill selects shape+outline, marquee drag, Lock/Unlock via Modify>Arrange | HIGH |
| ADOBE-06 | https://helpx.adobe.com/animate/using/reshape-lines-shapes.html | OFFICIAL | Straighten/Smooth via Selection tool Smooth/Straighten modifiers, Optimize curves, Smooth dialog params, Shape recognition, Modify Shapes Expand/Inset, Sync settings Brush/Eraser (Sync checkbox) | HIGH |
| ADOBE-07 | https://helpx.adobe.com/animate/using/drawing-preferences.html | OFFICIAL | Pen preferences, Connect Lines tolerance, Smooth Curves amount for Pencil Straighten/Smooth, Recognize Lines tolerance, Recognize Shapes Off/Strict/Normal/Tolerant, Click Accuracy, Selection/Subselection/Lasso contact options (Contact-Sensitive) | HIGH |
| ADOBE-08 | https://helpx.adobe.com/animate/using/transforming-combining-graphic-objects.html | OFFICIAL | Free Transform tool drag handles to move/scale/rotate/skew, Asset Warp tool pins/mesh, Open/Fixed modes, mesh density, propagate changes | HIGH |
| ADOBE-09 | https://helpx.adobe.com/animate/using/character-rigging-in-animate.html | OFFICIAL | Asset Warp rig creation (click to add joint, mesh, Create bones option, Freeze joint, Bone Type hard/soft, Mesh density slider, Propagate changes, Rotate Bone via drag or Rotation angle) | HIGH |
| ADOBE-10 | https://helpx.adobe.com/animate/using/bone-tool-animation.html | OFFICIAL | Bone tool add bones to symbols/shapes, IK, On-stage controls (head with 4-way arrows + circle for rotation), Select bones, Move bones relative to shape, Edit IK shape, Bind bones to points (yellow highlight, squares vs triangles), Constrain motion (disable rotation/translation, Joint Speed) | HIGH |
| ADOBE-11 | https://helpx.adobe.com/animate/desktop/using/basic-tools.html | OFFICIAL | Brush Tool (B) custom brush shape/angle, Bone Tool IK, Camera (pan/zoom/focal/rotate/tint), Ellipse, Pencil, Pen, Rectangle, Transform anchor, Transform tool | HIGH |
| ADOBE-12 | https://helpx.adobe.com/animate/using/working-with-paint-brush.html | OFFICIAL | Paint Brush Art/Pattern Brushes — Name, Scale proportionately, Stretch to fit, Stretch between guides, Flip, Spacing, At corners Center/Flank/Slice/Overlap, Object drawing mode default for Art Brush (performance), Convert Lines to Fills, Pressure/Tilt modifiers with min/max %, Customizing Pressure/Tilt sensitivity | HIGH |

## 2. Adobe Illustrator — Official / Technical (for vector behavior)

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| ILLU-01 | https://www.maaillustrations.com/blogs/magazine/features-and-functions-of-pen-tool | TECHNICAL (but detailed) | Pen Tool functions: Pen (P) click straight, drag curve, Add (+), Delete (-), Convert (Shift+C), Scissors (C), Cursors: begin path, midway, pressed, over path +, over anchor -, over begin close circle, over endpoint continue, over anchor with handles, Keyboard: Shift 45°, Direct Selection + Delete deletes anchor leaving two paths, Pen+Option = Convert, Pen over handle + Cmd = edit curve, Pen+Option while creating = split (unhinge), Preferences: Tolerance 1-8px, Object Selection by Path Only, Snap to Point tolerance, Highlight Anchors on Mouseover, Show Handles When Multiple Selected | MEDIUM-HIGH (secondary but detailed) |
| ILLU-02 | https://helpx.adobe.com/illustrator/desktop/draw-shapes-and-paths/learn-drawing-basics/adjust-anchor-point-handle-and-bounding-box-display-size.html | OFFICIAL | Anchor point/handle/bounding box display size, Highlight anchors on mouseover, Show handles when multiple selected | HIGH |

## 3. Krita — Official Manual

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| KRITA-01 | https://docs.krita.org/en/reference_manual/tools/freehand_brush.html | OFFICIAL | Freehand Brush smoothing: No Smoothing (raw), Basic Smoothing (old tablets), Weighted Smoothing (Distance, Stroke Ending, Smooth Pressure, Scalable Distance), Stabilizer (Sample Count Max Speed, Min Speed, Delay, Finish Line, Stabilize sensors, Pixel), Assistants magnetic | HIGH |
| KRITA-02 | https://docs.krita.org/en/reference_manual/brushes/brush_settings.html + texture, options, etc. | OFFICIAL | Brush Settings: Brush Tips, Blending Modes, Opacity/Flow, Size, Ratio, Spacing, Paint Thickness, Rotation, Scatter, Texture (Multiply/Subtract/Lightness Map/Gradient Map etc.), etc. Sensors: Pressure, Tilt, Speed, Distance, Fuzzy, Fade | HIGH |
| KRITA-03 | https://docs.krita.org/en/reference_manual/tools/color_sampler.html | OFFICIAL | Color Sampler Tool (P) — sample from all layers or active layer, Radius averaging, Blend %, Info Box, Ctrl quick access from brush, renamed from Color Picker | HIGH |
| KRITA-04 | https://docs.krita.org/en/user_manual/getting_started/basic_concepts.html | OFFICIAL | Tools share opacity dependent on preset, other tools individual opacity, Colors blending modes (Multiply, Addition, Erase as blending mode, Normal), Eraser as blending mode toggled via E, Transformations Deform Brush | HIGH |
| KRITA-05 | https://www.basearts.com/artquest/handouts/KRITA/Krita2.9-EN04-Painting_Tools.pdf | OFFICIAL (handout) | Painting Tools: Freehand Brush shortcuts Shift+drag size, Ctrl pick color, Middle-click pan, Ctrl+Middle zoom, +/- zoom, Shift+Middle rotate, Smoothing types, Ellipse Fill/Outline/Size lock, Polygon Angle Constraints, Freehand Path Precision Raw/Curve/Straight, Dynamic Brush Mass/Drag, Multibrush Symmetry/Mirror/Translate/Snowflake | HIGH |
| KRITA-06 | https://docs.krita.org/en/reference_manual/tools/shape_selection.html | OFFICIAL | Shape Selection Tool Stroke tab Fill None/Color/Gradient, Fill Type Linear/Radial, Repeat, Preset, Stop color/opacity, Bilinear/Bicubic interpolation, Mesh Gradients SVG draft 2 | HIGH |

## 4. Toon Boom Harmony — Official

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| TOON-01 | https://docs.toonboom.com/help/harmony-20/essentials/drawing/about-drawing-tool.html + Harmony 22 Advanced | OFFICIAL | Drawing Tools list: Select, Cutter, Reposition All Drawings, Contour Editor, Centerline Editor, Pencil Editor, Smooth Editor, Perspective, Envelope, Edit Gradient/Texture, Brush, Pencil, Eraser, Text, Line, Rectangle, Ellipse, Polyline, Paint, Ink, Paint Unpainted, Repaint, Unpaint, Stroke, Close Gap, Colour Eyedropper, Pencil Texture Eyedropper — with Vector/Bitmap layer support | HIGH |
| TOON-02 | https://docs.toonboom.com/help/harmony-21/essentials/reference/tool-properties/eraser-tool-properties.html + Harmony 20 Premium | OFFICIAL | Eraser Properties: Tip tab — Tip Library round, Min/Max Size with Pressure/Tilt/Speed/Taper (Distance/Percentage, Start/End Tapering, Fade Distance), Size Proportional to Camera, Roundness/Angle, Pen Tilt Sensitivity %, Use Pen Rotation, Smoothing tab, Erasing Options Apply to Line and Colour Art, Tip Style Round/Flat/Bevel, Snapping | HIGH |
| TOON-03 | https://docs.toonboom.com/help/harmony-22/advanced/drawing/about-stabilization.html | OFFICIAL | Pen Stabilization for Brush/Pencil/Eraser/Stamp/Stroke, smoothing after creation simplifying points/curves, trial/error distance trailing behind cursor | HIGH |

## 5. OpenToonz — Official

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| OT-01 | https://opentoonz.readthedocs.io/en/latest/drawing_animation_levels.html | OFFICIAL | Selection Tool modes Standard/Selected Frames/Whole Level/Same Style/etc., Position X/Y offset, Thickness for vector, Cap, Rectangular/Freehand/Polyline selection types, Move with Shift constrain H/V, Thickness via double arrow drag, Whole Level transform | HIGH |
| OT-02 | https://opentoonz.readthedocs.io/en/latest/interface_overview.html | OFFICIAL | Toolbar contains draw/select/edit/animate tools, Tool Options Bar displays settings for current tool, scrollable if too short | HIGH |
| OT-03 | https://opentoonz.readthedocs.io/en/latest/editing_animation_levels.html | OFFICIAL | Level Strip cut/copy/paste/delete/insert/reverse/swing/step/duplicate/renumber, editing one frame vs several frames | HIGH |

## 6. Blender Grease Pencil — Official (2D only)

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| BLEND-01 | https://www.graphicsandprogramming.net/eng/tutorial/blender/the-grease-pencil/grease-pencil-in-blender-2-8-introduction | TECHNICAL | Annotate tool simple/line/polygon/eraser, Grease Pencil object Stroke/Monkey/Blank, 2D Animation suite Draw/Fill/Erase (hard/soft/point/stroke)/Cutter, top header Draw Block/Ink/Marker/Noise/Pen/Pencil, Material stroke continuous/dots/squares/line/texture fill uniform/gradient/checker/texture, Modifiers Array/Build/Mirror/Simplify/Subdivide, Visual effects Light/Pixelate/Rim/Shadow/Swirl, Sculpt Grab/Randomize | MEDIUM (secondary but useful for 2D) |
| BLEND-02 | https://docs.blender.org/manual/en/latest/grease_pencil/modes/edit/grease_pencil_menu.html | OFFICIAL | Edit Mode Transform Move/Rotate/Scale G/R/S, Proportional Editing, Bend/Shear/To Sphere/Extrude/Shrink Fatten, Mirror Ctrl-M, Snap Shift-S, Clean Up Delete Loose Points, etc. | HIGH |
| BLEND-03 | https://thehiena.medium.com/2d-animation-in-blender-3d-4-3-grease-pencil-091eb03ecc9c | TECHNICAL | 2D template, shortcuts Ctrl+Alt+Middle rotate canvas, Fill precision 2, gap closure via scroll, multi-frame editing, custom brushes via style>texture, timeline shortcuts Ctrl+I invert, S scale keyframes, E move frames, etc. | MEDIUM |

## 7. Adobe Beginner Guide PDF

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| PDF-01 | https://studentcabletelevision.com/wp-content/uploads/2020/05/Adobe-Animate-Website-Guide-Updated.pdf | TECHNICAL (educational) | Tool Bar list: Select (V) + Subselection (A), Free Transform (Q) + Gradient Transform, Lasso (L) + Polygon + Magic Wand, Fluid Brush vs Classic Brush (B) smoothing, Eraser (E) size like brush, Rectangle (R) + Rectangle Primitive + Oval (O) + Oval Primitive + PolyStar, Line (N), Pen (P) + Add/Delete/Convert Anchor, Text (T), Paint Bucket (K) + Ink Bottle (S), Eyedropper (I) auto-switch to Bucket, Asset Warp (W) pins/mesh, Hand (H) + Rotation (Shift+H) + Time Scrub (Shift+Alt+H) + 3D Rotation + Bone via ... ellipsis, Properties Panel per tool, Merge vs Object Drawing Mode, Fluid Brush properties Stabilization/Curve Smoothing/Roundness/Angle/Taper/Velocity/Pressure | MEDIUM |

## 8. Community / Lower Confidence (Useful Real-World)

| ID | URL | Type | What Provided | Confidence |
|----|-----|------|---------------|------------|
| COMM-01 | https://www.reddit.com/r/adobeanimate/comments/xgd6sp/how_do_i_turn_off_smoothing_for_the_pencil_tool/ | COMMUNITY | Pencil smoothing can't be turned off, switch to Smooth or Ink, Paintbrush has smoothing slider, Y shortcut | LOW-MEDIUM |
| COMM-02 | https://community.adobe.com/t5/animate-discussions/how-do-you-find-the-pencil-mode-in-adobe-animate-cc-2019/td-p/10304180 | COMMUNITY | Pencil mode at bottom of Tools panel when Pencil selected, drag toolbar to 2 columns to see, select Smooth to stop straightening | LOW-MEDIUM |

## 9. Conflicting Evidence and Resolution

| Conflict | Source A | Source B | Resolution | Kineora Decision |
|----------|----------|----------|------------|------------------|
| Pencil Smoothing slider enabled in which modes? | ADOBE-04: Smoothing slider disabled in Straighten/Ink, enabled in Smooth | PDF-01: Fluid Brush has smoothing, Classic Brush not, Pencil Mode affects? | Adobe official says Smoothing disabled in Straighten/Ink, enabled in Smooth. Community says Ink has no smoothing. So keep Smoothing enabled only in Smooth mode. | KEEP — Smoothing only in Smooth |
| Brush size scaling with zoom | ADOBE-03: Animate scales brush size proportionately to zoom, with checkbox to disable | Krita: Scalable Distance makes smoothing independent of zoom | Adobe has option Stage zoom level checkbox. For MVP, keep constant doc size for simplicity, option later. | MODIFY — constant doc size MVP, option later |
| Eraser as separate tool vs blending mode | ADOBE: Eraser Tool (E) separate | KRITA: Eraser as blending mode (E toggles) | Both valid. Separate tool more discoverable for beginners (Animate), blending mode more flexible (Krita). Kineora for MVP separate tool, but allow future toggle. | KEEP separate tool MVP, DEFER blending mode toggle |
| Pen path completion | ADOBE-02: double-click last point, click Pen icon, Ctrl/Cmd+click away, or click first anchor to close | ILLU-01: With path selected, Spacebar for Hand, etc. | Multiple ways to finish. Kineora should support double-click, Ctrl+click away, Enter, and close via first anchor. | KEEP multiple finish methods + add Enter for discoverability |
| Fill/Stroke for new vs existing | ADOBE-04: Tools panel colors = new objects, Property inspector = selected | KRITA-04: Paint tools share opacity dependent on preset | Both agree: authoring color vs selected color separation. | KEEP separation |

## 10. Source Coverage Checklist

- [x] Adobe Animate Tools Panel
- [x] Adobe Pen Tool deep (6 states)
- [x] Adobe Pencil/Brush/Shapes
- [x] Adobe Strokes/Fills
- [x] Adobe Selection
- [x] Adobe Transform/Asset Warp/Bone
- [x] Illustrator Pen (anchor/handle)
- [x] Krita Freehand Brush smoothing/stabilizer
- [x] Krita Brush Settings
- [x] Krita Color Sampler
- [x] Toon Boom Drawing Tools list
- [x] Toon Boom Eraser Properties + Stabilization
- [x] OpenToonz Selection + Toolbar + Level Strip
- [x] Blender Grease Pencil Draw/Fill/Erase/Box/Circle
- [x] Adobe Beginner Guide PDF
- [x] Community real-world pencil smoothing

All 6 tools have at least 2 official sources + 1 cross-software comparison.

## 11. INSUFFICIENT EVIDENCE

- **Exact numeric tolerance for Connect Lines / Recognize Lines/Shapes in doc units vs screen px:** Adobe says tolerance relative to screen resolution and magnification, default Normal, but no exact px value. So KINEORA should define own tolerance (e.g., 8px screen) and document as KINEORA DECISION.

- **Krita Brush Tip Hardness numeric range for vector vs raster:** Krita docs show hardness for pixel brush, but vector shape tools use different. For Kineora vector-only MVP, hardness not needed, so DEFER.

- **Toon Boom Paint Unpainted / Repaint exact behavior:** Docs list tools but not deep interaction. So for Kineora, KEEP simple Paint Bucket fill only, DEFER Unpainted/Repaint.

Explicitly mark as INSUFFICIENT EVIDENCE where needed, do not invent.

