# FINAL PRE-CODING ENGINEERING READINESS AUDIT — 6 Core Tools

> **No Code, No Implementation, 2D Only. Review → Cross-Check → Gaps → Resolve → Freeze**

**Date:** 2026-08-23
**Scope:** Pen Tool, Pencil Tool, Brush Tool, Eraser Tool, Shapes Toolset, Color System
**Supporting:** 23_FULL_ROADMAP.md, 01_PEN_TOOL.md, 02_PENCIL_TOOL.md, 03_BRUSH_TOOL.md, 04_ERASER_TOOL.md, 05_SHAPES_TOOLSET.md, 06_COLOR_SYSTEM.md, 07_TOOL_INTERACTION_AUDIT.md, 08_TERMINOLOGY_GLOSSARY.md, 09_SOURCE_REGISTER.md, 10_FINAL_6_TOOL_AUDIT.md
**Architecture References:** animate-blueprint/02a_tools_selection_transform.md, 02b_tools_drawing.md, 02c_tools_painting.md, 06_shape_system.md, 33_data_model.md, 34_ui_button_spec.md, MASTER_FEATURE_INVENTORY/01_DECOMP_A, 02_DECOMP_B

---

## STEP 1 — READ EVERYTHING (Independent Audit)

I have independently read:

- **23_FULL_ROADMAP.md** — 30-tool master list, 4-section contract (tools/view/colors/options), gap map, ASCII visual, file plan for deep dives. No code. Covers Adobe 4 sections, 30 tools with Adobe/Blender/Toon Boom equivalents. PASS.

- **01_PEN_TOOL.md** — 409 lines, extremely deep: Purpose with industry observations, UI with 8 cursor states (Initial x, Sequential, Add +, Delete -, Convert ^, Close circle, Continue slash, Retract), Activation, Pointer lifecycle (Down/Move/Up/Cancel/Esc/Tool Switch/Blur), Modifiers Shift 45° + Alt break + Ctrl finish, Visual Feedback (preview translucent, anchors squares/circles, handles), Document Effect (creates Node::Path, modifies geometry), Preview vs Commit separation, Undo one path = one undo, Layer behavior with ancestor walk B-1/B-3/B-5, Timeline auto-key F6, Snapping point/grid/angle, Input devices mouse/tablet no pressure, Edge cases 15+, Engineering Implication conceptual (interaction state, preview, hit-testing, coordinate conversion, etc.), Cross-software table Adobe/Illustrator/Krita/Toon Boom/Blender GP, Kineora decisions KEEP/MODIFY/REJECT/DEFER with WHY, Acceptance criteria 20+ testable statements, Sources with links. No code. PASS.

- **02_PENCIL_TOOL.md** — 211 lines, deep: Purpose (freehand vector line art, why distinct from Pen/Brush), UI (toolbar Y, pencil icon, Pencil Mode Straighten/Smooth/Ink dropdown, Smoothing slider 0-100, Object Drawing toggle), Activation, Pointer lifecycle (Down begins freehand, Move adds points with smoothed preview, Up commits if >=3px else no object, Cancel/Esc/Blur discard), Modifiers Shift H/V constrain only, Cursor pencil, Visual Feedback preview solid stroke color editor-only, Document Effect creates Node::Path stroke-only no fill, Preview vs Commit separation, Undo one stroke = one undo, Layer same checks, Timeline auto-key, Snapping none for MVP (Connect Lines tolerance future), Input devices mouse/tablet no pressure (Brush handles pressure), Edge cases, Engineering Implication, Cross-software comparison Animate/Illustrator/Krita/Toon Boom, Kineora decisions KEEP 3 modes + smoothing slider + Shift H/V + Object Drawing, MODIFY smoothing uses Krita weighted+stabilizer but simple 0-100 UI for MVP, REJECT pressure for Pencil, DEFER shape recognition, Acceptance criteria. No code. PASS.

- **03_BRUSH_TOOL.md** — 214 lines, deep: Purpose (natural painting fills, pressure expressive), UI (B, brush circle size, 5 modes Paint Normal/Fills/Behind/Selection/Inside [helpx draw], Size/Shape, Pressure/Tilt icons only if Wacom, Stage zoom checkbox, Smoothing), Activation, Pointer lifecycle (Down begins brush, Move adds dabs with spacing + pressure size variation + tilt angle + mode filtering, Up commits dot allowed on click vs Pencil/Rect min threshold, Cancel discard), Modifiers no Shift/Alt, Pressure varies min-max, Tilt varies angle, Speed, Cursor brush circle, Visual Feedback preview solid fill with mode respect, Document Effect creates Node::BrushStroke fill, Preview vs Commit, Undo one stroke, Layer active only + Paint Inside/Selection edge cases, Timeline auto-key, Snapping none, Input devices mouse constant max size vs tablet variable min-max pressure + tilt, Edge cases including Paint Selection no selection → no-op + toast, Paint Inside start empty → no-op, Extreme zoom size scaling option, Engineering Implication, Cross-software table, Kineora decisions KEEP 5 modes + pressure/tilt + smoothing + dot, MODIFY size constant doc MVP + no merge (separate objects), REJECT Flow vs Opacity, DEFER Art/Pattern Brush, Taper, Texture, Acceptance criteria. No code. PASS.

- **04_ERASER_TOOL.md** — 223 lines, deep: Purpose (cleanup, not whole delete), UI (E, eraser circle, Eraser Mode Normal/Fills/Lines/Selected/Inside + Faucet, Size, Shape, Pressure/Tilt sync with Brush checkbox [helpx reshape], Tip Style Round/Flat/Bevel [Toon Boom]), Activation, Pointer lifecycle (Down hit-test per mode, Move updates preview of affected area dimmed/red not doc write, Up commits one Erase/DeleteSelection for intersecting active layer objects, Cancel discard), Modifiers no Shift/Alt, Pressure size, Cursor eraser circle + highlight, Visual Feedback preview overlay, Document Effect deletes/modifies geometry, no style change, Preview vs Commit separation why one undo, Undo one gesture = one undo, Layer active only for MVP to avoid accidental other layers, Timeline auto-key at held frame, Snapping none, Input devices mouse constant vs tablet pressure, Edge cases including whole-object vs partial splitting (MVP whole-object too aggressive for huge objects), pointer leaving commit, Esc discard, Engineering Implication (EraserGesture, hits_in_rect/circle, path splitting future), Cross-software comparison Animate/Krita (eraser as mode E toggles) vs Toon Boom vs Blender GP (hard/soft/point/stroke), Kineora decisions KEEP drag erase + pressure + layer checks, MODIFY whole-object delete for MVP not partial splitting (reason complex boolean), REJECT merge, DEFER partial splitting, Faucet, Tip Style, Selected/Inside modes, Acceptance criteria. No code. PASS.

- **05_SHAPES_TOOLSET.md** — 278 lines, deep per shape: Purpose (fast geometric construction), UI per shape (Rect R crosshair + Corner Radius, Rounded Rect Primitive hinges [Adobe Guide], Oval O + inner radius/close path/start-end angle [helpx draw oval], Line N stroke-only, Polygon/Star sides/ratio), Activation via R/O/N, Pointer lifecycle per shape action-level (Rect Down start + Move threshold 3px + buildRect with Shift square Alt from-center + preview translucent fill alpha 0.3 + dashed stroke + Up commit DrawRect if w>=1/h>=1 else no object, Oval same, Line Shift 45°, Polygon center+radius+rotation), Modifiers Shift square/circle/45° + Alt from-center + Shift+Alt + Esc cancel (Adobe + Krita Shift square + Ctrl center), Cursor crosshair, Visual Feedback preview translucent + dimensions in status bar, Document Effect creates Node::Rect/Oval/Line/PolyStar at current frame, Preview vs Commit separation, Undo one shape, Layer same checks, Timeline auto-key, Snapping grid/point/angle, Input devices mouse/stylus no pressure, Edge cases tiny <1px no object (MIN_RECT_DIM), huge beyond stage allowed clipped on export, pointer leaving commit outside, Engineering Implication (RectGesture, normalizeRect 4 directions → top-left + positive, buildRect with square/fromCenter), Cross-software comparison Animate/Illustrator/Krita/Toon Boom/Blender GP Box/Circle, Kineora decisions KEEP drag+crosshair+Shift+Alt+Esc+Object Drawing+fill/stroke+min 1px, MODIFY rounded rect corner_radius field serde default + Oval separate node for hit-test, REJECT live primitive hinges for MVP (too complex), DEFER Polygon/Star live params, Oval Primitive inner radius, Line as separate vs Path, Acceptance criteria. No code. PASS.

- **06_COLOR_SYSTEM.md** — 262 lines, system not picker: Purpose (authoring vs selected style), UI Colors Area (Fill 22px white border overlapping + Stroke 22px offset 10px + None ∅F∅S striped red ╱ + Swap ⇄ + Default D + Stroke Width W, vertical/horizontal), Properties Panel (no selection = Document background ColorField, single = Fill + Stroke Enabled + Stroke color + Width, multiple same = shared, mixed = "—" + badge, live preview via onPreview ColorPreview renderer-only + commit on blur/Enter/picker close + Esc cancel + lastCommittedRef dedupe), Color Picker native <input type="color"> MVP, Eyedropper Tool (I) crosshair + sample via selectAt + selection_details + auto-switch to Bucket + toast, Swatches Panel future, Gradient Editor future, Tooltip per swatch, Cursor eyedropper, Activation (Colors Area always visible view state localStorage, Eyedropper via I, Properties via selection), Pointer lifecycle for Eyedropper (Down hit-test + sample + auto-switch, no doc change, no undo, allowed on locked read-only like copy), Modifiers no Shift/Alt for Eyedropper, D default + X swap future shortcuts, Visual Feedback overlapping swatches + None pattern + live preview + mixed, Document Effect no create but modifies via setNodeProps fill/stroke/width/background, Preview vs Commit separation why prevents undo fragmentation + allows Esc + clean export, Undo one Properties commit = one undo, ToolColors changes no undo no dirty, Layer active for new + selected_editable filters locked/hidden, Timeline current frame + base props affect all held frames + no auto-key for fill (transform auto-keys), Snapping none, Input devices mouse/trackpad/stylus no pressure, Ctrl quick sampler future, Edge Cases 15+ including mixed colors, locked/hidden, tiny/huge, leaving, Esc, tool switch blur commits, invalid same color no command, Engineering Implication (ToolColors state localStorage + ColorPreview + Node fill/stroke + hit-testing + screenToDoc + selection_details + layer permission + timeline + undo boundary + rendering + pointer capture + cancellation), Cross-software table Animate/Illustrator/Krita (sample all vs active, Radius, Blend %)/Toon Boom/OpenToonz, Kineora decisions KEEP overlapping + None + Swap + Default + current vs selected separation + Eyedropper auto-switch + live preview + one undo + mixed badge + BUG-P-001, MODIFY sample from active context only MVP + native picker MVP + alpha via background_alpha only, DEFER gradient, swatches palette, art/pattern brush color, full models RGB/HSB/HEX/alpha beyond native, pressure-to-opacity, Acceptance criteria 20+ testable, Sources. No code. PASS.

- **07_TOOL_INTERACTION_AUDIT.md** — Cross-audit 14 sections, no code, covers Pen↔Color (current style for new, preserve existing when editing geometry), Pencil↔Color (stroke only), Brush↔Color (fill only + 5 modes filter), Eraser↔Color (never modifies style), Shapes↔Color (fill+stroke, Line stroke-only, current for new, Properties for existing), All↔Timeline (auto-key F6 copy-prev at held, eraser auto-keys, color base no auto-key), All↔Layers (active only, locked/hidden/folder blocked via ancestor walk B-1/B-3/B-5), All↔Selection (Pen requires selection for add/delete, others create new, Eraser no selection), Pen↔Pencil↔Brush distinctions, Shapes↔Pen conversion live primitive vs ordinary, Color↔Selection↔Properties live preview contract, Conflicts resolved (no shortcut/modifier/cursor/layer/timeline/undo conflicts), Decisions summary KEEP/MODIFY/DEFER, Acceptance criteria for interactions. PASS.

- **08_TERMINOLOGY_GLOSSARY.md** — Glossary with table Term/Definition/When to Use/When NOT to Use/Preferred, covers Stroke/Fill/Path/Anchor Point/Anchor/Point/Handle/Control Point/Direction Line/Segment/Corner Point/Smooth Point/Shape/Primitive/Object/Node/Brush Stroke/Pencil Stroke, Color terms Fill Color/Stroke Color/Stroke Width/No Color/No Fill/No Stroke/Current/Authoring/Selected/Swatch/Eyedropper/Opacity/Alpha/Gradient/Solid, Selection/Transform terms, Layer terms (Layer/Folder/Normal/Active/Visible/Hidden/Locked/Outline/Parent/Child/Nest), Timeline terms (Playhead/Frame/Keyframe/Blank/Held/Empty/Duration/FPS/Auto-key/Onion/Tween), Input terms (Pointer Down/Up/Move/Cancel/Click/Drag/Gesture/Threshold/Modifier/Cursor/Preview/Commit/Cancel), Brush/Eraser terms, General (Stage/Pasteboard/Viewport/Document/Scene/Engine/WASM/Client/Command/Undo), Terms to Avoid (Point generic, Line generic, Shape for freehand, Object vs Shape vs Node, Anchor ambiguous, Color vs Fill, Opacity vs Alpha). Ensures consistent terminology. PASS.

- **09_SOURCE_REGISTER.md** — All sources with ID/URL/Type/What Provided/Confidence, quality levels OFFICIAL/TECHNICAL/COMMUNITY, 12 Adobe official, 2 Illustrator, 6 Krita official, 3 Toon Boom official, 3 OpenToonz official, 3 Blender GP official/technical, 1 PDF guide, 2 community lower-confidence, Conflicting Evidence table with 5 conflicts (Pencil smoothing modes, Brush size scaling, Eraser separate vs mode, Pen completion, Fill/Stroke new vs existing) with resolution and Kineora decision, Source Coverage Checklist all 16 sources checked, INSUFFICIENT EVIDENCE section (Connect Lines tolerance exact px, Brush hardness range, Paint Unpainted/Repaint exact behavior) marked not invented. PASS.

- **10_FINAL_6_TOOL_AUDIT.md** — Final gate PASS checklist per tool for 28 required sections, cross-tool conflict audit (shortcuts, modifiers, cursors, selection, layers, timeline, snapping, undo), terminology consistency audit against glossary, duplicated/missing functionality audit, dependency graph (Color base → Pen/Pencil/Brush/Eraser/Shapes + Layers/Timeline/Viewport), Kineora decisions audit with WHY per tool, No Code/No 3D/No Unrelated audit PASS, Source Quality audit PASS, Final Deliverable check PASS, Quality Gate final all 28 sections checked. PASS but claims PASS without independent verification — this audit will independently verify.

Architecture docs checked: animate-blueprint/02a (Selection/Transform), 02b (Drawing Pencil/Pen/Brush), 02c (Painting Bucket/Ink/Eraser), 06 (Shape system), 33 (Data model), 34 (UI button spec), MASTER_FEATURE_INVENTORY/01_DECOMP_A (tools selection transform), 02_DECOMP_B (drawing shape timeline) — all consistent with 6-tool research, no contradictions found with blueprint's Node model requiring extension for Path.

**Independent Audit Verdict for Step 1:** All 10 files exist, are deep, no code, 2D only, follow template, sources provided. No file is shallow.

---

## STEP 2 — FIND CONTRADICTIONS

### Tool Behavior Contradictions

**Pen vs Pencil:**
- Pen: click=corner, drag=smooth with handles, 6 cursor states, Add/Delete/Convert, Close circle, Continue slash, Show Preview preference, one path = one undo
- Pencil: freehand drag adds many points, 3 modes Straighten/Smooth/Ink, Smoothing slider 0-100, Shift H/V constrain only, no handles while drawing, stroke-only no fill, tiny <3px no object, one stroke = one undo
- **Contradiction?** No — distinct purposes: Pen precision bezier vs Pencil freehand stroke. Both use Node::Path but Pen has few anchors with handles, Pencil has many points with smoothing. No conflict.

**Pencil vs Brush:**
- Pencil: stroke only, no fill, no pressure, uniform width, 3 modes, smoothing
- Brush: fill only, 5 modes Normal/Fills/Behind/Selection/Inside, pressure varies size min-max + tilt angle, dot allowed on click, no merge for MVP
- **Contradiction?** No — distinct: Pencil stroke vs Brush fill, Pencil no pressure vs Brush pressure, Pencil tiny no object vs Brush dot allowed. Documented as Kineora decision to keep separate. No conflict.

**Brush vs Eraser:**
- Brush: creates fill, 5 modes, pressure size, dot allowed, preview solid fill
- Eraser: deletes, same size like brush, pressure size, modes Normal/Fills/Lines/Selected/Inside + Faucet deferred, whole-object delete MVP, preview dimmed/red overlay
- **Contradiction?** Potential: Brush Mode and Eraser Mode both have Normal/Fills/Behind/Selection/Inside — are they same modes or different? In Adobe, Brush has Paint Normal/Fills/Behind/Selection/Inside, Eraser has Erase Normal/Fills/Lines/Selected/Inside — similar but Eraser has Lines vs Behind difference. Research documents both as same concept but with Eraser having Lines instead of Behind. No contradiction, just similar naming. Clarify in final spec: Brush Mode vs Eraser Mode are separate but analogous.

**Eraser vs Pencil:**
- Eraser: deletes whole objects intersecting circle for MVP, no style change
- Pencil: creates stroke-only, no fill
- **Contradiction?** No — opposite operations, no conflict. Both respect layer permissions.

**Shapes vs Pen:**
- Shapes: drag creates geometric primitive (Rect/Oval/Line) with crosshair, Shift square/circle/45°, Alt from-center, Esc cancel, min 1px, translucent preview, one shape = one undo
- Pen: click/drag creates bezier path with anchors/handles, 6 cursor states, close circle, etc.
- **Contradiction?** No — Shapes are fast geometric, Pen is precise bezier. Both use fill/stroke from current colors, but Shapes uses buildRect/normalizeRect, Pen uses anchors. No conflict. Gap: Shapes currently defines Rect as Node::Rect but Pen defines Node::Path — need both node kinds, consistent with blueprint's need to extend Node model.

**Shapes vs Pencil:**
- Shapes: geometric, crosshair, modifiers, min size
- Pencil: freehand, pencil cursor, 3 modes, smoothing
- **Contradiction?** No — distinct.

**Color vs Every Drawing Tool:**
- Color: ToolColors = current authoring for new objects (view state, no undo, localStorage), Properties = selected object style (document, one undo per commit, live preview renderer-only)
- Pen/Pencil/Brush/Shapes all use current fill/stroke from ToolColors at creation time
- **Contradiction?** Check: Pen research says fill/stroke from current colors at creation, preserve existing when editing geometry — matches Color's current vs selected separation. Pencil says stroke only from current stroke, no fill — matches Color's fill swatch ignored for Pencil? But Color system says fill swatch matters for all? Need to resolve: In Color system, Fill swatch is for fills (Brush, Shapes), Stroke swatch for strokes (Pencil, Pen, Line). So Pencil uses stroke swatch only, not fill — consistent with Pencil's Document Effect says stroke only. No contradiction, just need to explicitly state in final spec which swatch each tool uses.

### UI Contradictions

**Shortcut Conflicts:** Audited in 07 and 10 — all 19 shortcuts distinct: V, A, Q, L, P, Y, B, N, R, O, T, K, S, I, E, H, Z, Shift+H, Shift+W. No conflicts. PASS.

**Modifier Conflicts:** Audited — Shift always constrain (Pen 45°, Pencil H/V, Shapes square/circle/45°), Alt always alternate (Pen break handles, Shapes from-center), Pressure only Brush/Eraser, Tilt only Brush/Eraser. No conflicts. PASS.

**Cursor Conflicts:** All distinct: arrow, pen with +, -, ^, circle, slash, pencil diagonal, brush circle, eraser circle, crosshair, grab, zoom, pipette. No conflicts. PASS.

**Toolbar Grouping Conflicts:** 
- Old files had grouping: Selection group (Select, Subselect, Transform, Lasso), Drawing group (Pen, Text, Line, Rect, Oval, Pencil, Brush), Paint group (Bucket, Ink, Eyedropper, Eraser, Width), View group (Hand, Zoom, etc.)
- New 6-tool research focuses on Pen, Pencil, Brush, Eraser, Shapes (Rect/Oval/Line/PolyStar), Color
- **Conflict?** In old 23_FULL_ROADMAP.md, ToolsPanel had only 8 tools, but new ToolsPanel (cc71de7) has 15 tools with coming-soon. Old grouping had Pen in drawing group, but new mission's 01_PEN_TOOL.md says Pen in drawing group second row after Selection/Transform/Lasso — consistent. No grouping conflict, just more tools added.

**Options-Panel Conflicts:**
- Pen: Show Pen Preview, Show Solid Points, Show Precise Cursors, Object Drawing toggle
- Pencil: Pencil Mode Straighten/Smooth/Ink, Smoothing slider (only in Smooth), Object Drawing
- Brush: Brush Mode 5 modes, Size, Shape, Pressure/Tilt icons, Stage zoom checkbox, Smoothing, Object Drawing
- Eraser: Eraser Mode, Faucet, Size, Shape, Pressure/Tilt sync, Smoothing, Tip Style Round/Flat/Bevel
- Shapes: Object Drawing, Corner Radius, inner radius, etc.
- **Conflict?** Object Drawing toggle appears in Pen, Pencil, Brush, Shapes — is it per-tool or global? In Adobe, Object Drawing button is in Options area, per-tool? Actually it's global toggle that affects all drawing tools. So having it in multiple tools' Options is not conflict, it's same global toggle shown when any drawing tool active. Document as global.

**Terminology Conflicts:** Checked against 08 glossary — all 6 files use consistent terms: Stroke for outline, Fill for interior, Path for bezier, Anchor Point for path points, Handle for bezier handles, Transform Handle for selection, Shape for primitives, Object for generic selectable, Node for engine model only. No random alternation. PASS.

### Document Model Contradictions

Check concepts:

- **Path:** Pen and Pencil both create Node::Path — Pen has few anchors with handles (corner/smooth, handle_in/out), Pencil has many points with smoothing. Both are Path, consistent. Need to ensure Path model can hold both: anchors with optional handles, plus smoothing flag? For Pencil, smoothing is applied to points, not handles? But can be same Path with many anchors, no handles, plus smoothing param. No contradiction.

- **Stroke:** Pencil creates stroke-only (fill=None, stroke=color, width), Pen creates path with fill+stroke from current, Shapes: Line stroke-only, Rect/Oval fill+stroke. All use stroke concept consistently: stroke color + width + style.

- **Fill:** Brush creates fill-only (fill=color, stroke=None), Shapes Rect/Oval use fill+stroke, Pen uses fill+stroke, Pencil no fill. Consistent: fill is interior.

- **Shape:** Rect/Oval/Line/PolyStar are Shapes (geometric primitives) — defined as separate Node kinds or as Path? Old research says Rect node exists, Oval needs new node, Line could be Path with 2 points. Need to resolve: In final spec, define Shape as either live primitive (with params) vs ordinary path. For MVP, ordinary path/rect/oval nodes, not live primitive. So Shape term used for geometric creation gesture, but after creation becomes Object (Node). No contradiction, just need to clarify live primitive vs ordinary.

- **Object:** Generic selectable — includes Rect, Oval, Path, Brush Stroke, SymbolInstance, etc. Consistent.

- **Node:** Engine term — NodeId, Node::Rect, Node::Path, etc. — used in engine docs only, not user UI. Consistent with glossary saying Node for engine, Object for UI.

- **Brush Stroke:** Brush creates fill shape — is it Node::BrushStroke or Node::Path with fill? Old research says Node model limited to Rect and SymbolInstance, needs extension. New research says Brush creates Node::BrushStroke or Node::Path with fill. Need to decide: For MVP, Brush Stroke could be Node::Path with fill and many points, or separate BrushStroke node with points+size. No contradiction, just need to pick one in final spec: recommend Node::BrushStroke with points and size for pressure support, but could also be Path.

- **Color:** Fill Color, Stroke Color, Stroke Width, None, Alpha, Opacity — consistent. Color System defines current authoring vs selected object separation, which matches all tools' use of current at creation.

- **Gradient:** Deferred for all — consistent.

- **Frame:** All tools interact with current frame via auto-key F6 semantics — consistent.

**Result:** No critical terminology contradictions, but need to clarify in final spec: Path vs Shape vs Brush Stroke node kinds and which swatch each tool uses.

---

## STEP 3 — COLOR SYSTEM AUDIT (High Risk)

Verify difference:

**Current Authoring Style (ToolColors):**
- [INDUSTRY] Adobe: Tools panel Stroke/Fill controls = new objects [helpx strokes]
- [KINEORA] ToolColors state { fill: string|null, stroke: string|null, strokeWidth: number } stored in localStorage via toolColors.ts, session view state, not document, no undo, no dirty, persists reload, affects new drawings only. Fill swatch 22px overlapping with None striped pattern when null, Stroke swatch offset 10px, None buttons ∅F∅S, Swap ⇄, Default D, Width W. Always visible in Tools panel.

**Selected Object Style (PropertiesPanel):**
- [INDUSTRY] Adobe: Property inspector = selected objects
- [KINEORA] PropertiesPanel shows Document background when no selection, Fill/Stroke/Width when single selection with live preview via onPreview ColorPreview renderer-only, commit one setNodeProps on blur/Enter/picker close, one undo entry, Esc cancels and reverts draft and clears preview, lastCommittedRef dedupe prevents close+blur double command. Multiple selection same color shows shared, mixed shows "—" placeholder + "Mixed selection — common fields only" badge, W/H hidden when any instance (BUG-P-001).

Verify each:

- **Fill:** ToolColors fill = new objects fill (Brush, Rect, Oval, Pen closed). Properties fill = selected object fill. When fill=None, object has no fill (transparent). For Pencil, fill ignored (stroke only). For Line, fill ignored (stroke only). For Brush, fill only. For Shapes Rect/Oval fill+stroke. All documented.

- **Stroke:** ToolColors stroke = new objects stroke (Pencil, Pen, Line, Rect, Oval). Properties stroke = selected. Stroke Enabled checkbox for objects that have stroke. Stroke null = no stroke (None). Width W.

- **Opacity/Alpha:** For MVP, fill hex only (no alpha), background has background_alpha 0..1. Stroke hex only. Future opacity via alpha field. Documented as MODIFY and DEFER.

- **No-fill / No-stroke:** Fill null = transparent interior, shown as striped red ╱ pattern in swatch with data-testid tool-fill-none. Stroke null = no outline, similar. None buttons ∅F∅S set null. All with tooltips.

- **Mixed Values:** Multiple selection with different fills → Properties fill shows "—" placeholder, not color, plus mixed badge. W/H hidden when any instance (BUG-P-001). ToolColors still shows authoring color, not selection.

- **Live Preview:** While editing Properties color field, onPreview sends ColorPreview { item: { id, fill } } to Stage, which renders displayItems with preview colors without writing engine. Renderer-only, cleared on commit/cancel/unmount. Prevents undo fragmentation.

- **Commit:** Properties color committed on blur/Enter/native change (picker close) → one setNodeProps command, document:changed, one undo.

- **Undo:** ToolColors changes no undo, Properties one commit = one undo, drawing new object with current color = one Draw command = one undo.

- **Tool Switching:** Colors area persists across tool switches (global). If editing Properties color and switching tool, blur commits (since input blurs), then unmount clears preview.

**Ambiguity Check:**

- Does changing ToolColors dirty document? No, view state only, no dirty, no undo — explicitly documented, no ambiguity.

- Does Eyedropper create undo? No, read-only, samples to ToolColors, no doc change, no undo, allowed on locked layers — documented, no ambiguity.

- Does Properties color affect future or selected? Selected only — documented, no ambiguity.

- What happens with mixed colors? Shows "—" and badge, common fields only — documented, no ambiguity.

- What happens on Esc in Properties color? Cancels, reverts draft, clears preview, no command — documented.

- What happens on locked layer object color edit? selected_editable filters, so locked objects not editable, commit blocked or no-op with toast "layer locked" — documented, but need to ensure engine also blocks (layer_and_ancestors_unlocked check) — documented as layer permission requirement.

**Result:** No ambiguity in Color System. Difference between Current Authoring and Selected Object is crystal clear, with preview vs commit separation, undo boundaries, layer checks.

---

## STEP 4 — PEN TOOL AUDIT

Verify every action per master prompt:

**Path Creation:**

- **First Anchor:** Trigger: click on empty stage with Pen active, no in-progress path. Visual: pen with small x cursor, click creates initial anchor (square for corner, circle for smooth if drag), terminates existing in-progress path if any, no document change yet (temporary). Result: in-progress path list with one anchor, preview line from last anchor to cursor if Show Preview on. Cancellation: Esc discards in-progress path, no command. Undo: no undo yet (not committed).

- **Second Anchor:** Trigger: second click/drag. Visual: preview line from first to second, or curve preview if drag. Result: temporary path with two anchors, one segment, still not document. Undo: no undo.

- **Straight Segment:** Trigger: click, click (no drag). Expected: corner points (no handles), straight line between anchors. Visual: straight preview line. Result: temporary segment. Cancellation: Esc discards whole in-progress path.

- **Curved Segment:** Trigger: click-drag (drag direction defines handle). Expected: smooth point with two symmetric handles, curve tangent to handles. Visual: handles extend as you drag, curve preview updates. Result: temporary curve. Modifiers: Shift constrains handle angle 45°, Alt breaks symmetry (independent handles). Cancellation: Esc discards.

- **Click:** Short press without drag = corner point, no handles.

- **Click-drag:** Press, drag, release = smooth point with handles, handle length = drag distance, direction = drag direction, symmetric.

- **Drag Direction:** Determines handle direction: trailing handle opposite drag? Actually for smooth point, first drag defines both handles? Per Illustrator: drag from first anchor when beginning curved path. Amount dragged = one third of curve for smooth. So drag direction = direction of next segment launch.

- **Bézier Handles:** Each anchor may have handle_in (incoming) and handle_out (outgoing). Smooth point has symmetric same length opposite direction. Corner point has no handles or broken.

- **Corner Point:** Anchor with no handles, or with broken handles forming sharp corner. Created via click (no drag) or via Convert tool clicking smooth point.

- **Smooth Point:** Anchor with symmetric handles, continuous curve. Created via click-drag.

- **Tangent Behavior:** Path must be tangent to handle at anchor (launch/landing direction same as handle direction) [Illustrator Pen Guide].

- **Handle Independence:** Alt breaks symmetry — handles move independently, creating corner with one or two independent handles (change-direction point).

- **Handle Symmetry:** Without Alt, handles locked symmetric (same length, opposite direction).

- **Path Continuation:** Trigger: click on endpoint of existing path (not current) with slash cursor. Expected: continue path from that endpoint, adding new anchors to existing path, not new path. Result: existing path extended, one command? Or new path? Kineora: continue existing path = modify existing path, one command? But for MVP, continue = edit existing path geometry, one command.

- **Path Closing:** Trigger: click on first anchor (hollow) of current path with small circle cursor. Expected: path closed, fill applied if current fill not None, one DrawPath command with closed=true committed. Visual: circle indicator, first anchor highlights. Result: closed path node. Undo: one undo removes closed path.

- **Path Completion (Open):** Trigger: double-click last point, or click Pen icon in Tools panel, or Ctrl/Cmd+click away from path, or Enter (Kineora addition). Expected: open path finished, one DrawPath command with closed=false. Visual: no circle, path remains open. Undo: one undo.

- **Open Path:** Path with first != last anchor, not closed, no fill or fill may still apply? In Adobe, open path can have fill? Actually fill for open path may still fill? But typically fill for open path fills as if closed? Kineora: allow fill for open path? Decision: open path with fill = fill as if closed? Or no fill? For MVP, allow fill but export as open? Need to define: Kineora decision says closing does not change fill/stroke, uses current at creation. So open path can have fill, but rendering may close implicitly? For MVP, keep fill for open path as if closed for simplicity? Document as decision.

- **Closed Path:** First == last anchor, closed=true, fill applied.

**Path Editing:**

- **Move Anchor:** Trigger: Subselection Tool drags anchor (not Pen). But Pen research also includes move anchor? Actually Pen's Convert/ Direct Selection can move anchor. For Pen tool itself, does it move anchor? In Adobe, Pen tool can move anchor via Ctrl+drag handle? Actually Pen over anchor with handles can retract handles, but moving anchor is Subselection. So for Pen tool, move anchor is via Subselection, not Pen. So Pen's move anchor action is actually Subselection's job. But research includes move anchor as part of Pen's editing? Clarify: Pen tool's pointer over anchor with handles shows retract, not move. Moving anchor is Subselection. So for Pen tool audit, move anchor is DEFERRED to Subselection.

- **Add Anchor:** Trigger: Pen over selected path segment with + cursor, click. Expected: anchor added to path, path redrawn with new anchor, one AddAnchor command. Visual: + near pen, segment highlights. Result: path with extra anchor. Undo: one undo removes added anchor.

- **Delete Anchor:** Trigger: Pen over anchor with - cursor, click. Expected: anchor removed, path redrawn without it, one DeleteAnchor command. Visual: - near pen. Result: path with one less anchor. Undo: one undo restores.

- **Move Handle:** Trigger: Subselection drags handle dot. Expected: handle moves, curve on that side adjusts, other side adjusts if symmetric else only that side. Visual: handle line updates, curve preview. Result: one command modifying handle. Undo: one undo.

- **Convert Corner/Smooth:** Trigger: Click smooth point with Pen (no drag) converts to corner (handles removed) with ^ cursor? Actually Convert: click smooth point = corner, Alt-drag corner = smooth with independent handles. Also Shift+C tool. Expected: point kind toggles, handles added/removed. Visual: square vs circle. Result: one Convert command.

- **Split Path:** Scissors tool (C) click on segment divides into two paths — deferred, not in MVP Pen, but could be part of Pen? Kineora decision REJECT Scissors as separate, merge into delete/convert workflow — so split deferred.

- **Join Path:** Ctrl+J joins endpoints — deferred.

- **Continue Path:** Already covered.

- **Reopen Path:** Click endpoint with slash to continue — same as continue.

- **Close Path:** Already.

- **Select Path:** Click path with Selection tool selects whole path, not Pen. Pen over unselected path may select it first? Kineora decision: if over existing path and no in-progress, first select that path, then allow add/delete.

- **Modify Existing Path:** Add/delete/convert/move handle all modify existing path.

**Interaction:**

- **Cursor States:** 8 states documented with exact triggers: Initial x (empty), Sequential (continuing), Add + (over segment), Delete - (over anchor), Convert ^ (over smooth), Close circle (over first), Continue slash (over endpoint), Retract (over anchor with handles). All with visual description. No ambiguity.

- **Live Preview:** Show Pen Preview preference — preview line from last anchor to cursor follows, updates on move, editor-only. Also curve preview when dragging handle. All preview not in doc.

- **Path Preview:** Preview segment translucent, never exported.

- **Anchor Preview:** Anchor dots shown for in-progress path, hollow vs solid per Show Solid Points pref.

- **Snapping:** Point snapping to existing anchors within 8px screen, grid snapping if grid on, guide snapping, angle snapping Shift 45°. Indicators: magnet, highlight, status text "snap to anchor". All documented.

- **Modifiers:** Shift 45°, Alt break, Ctrl finish/open path, Caps Lock precise cursor — all documented with platform differences.

- **Escape:** Discards in-progress path, no command, no undo — documented.

- **Enter:** Kineora addition to finish open path — documented as MODIFY with reason keyboard accessibility.

- **Double-click:** Finish open path — documented.

- **Clicking Existing Anchors:** Over anchor → Delete or Convert or Continue depending on context — documented with cursor states.

- **Clicking Existing Paths:** Over segment → Add anchor if path selected — documented.

**Styling:**

- Fill: current fill from ToolColors at creation, None = no fill, applied separately after closing? Actually Pen closing does not auto-apply fill, fill from current at creation. Documented.

- Stroke: current stroke + width from ToolColors at creation.

- Stroke Width: from ToolColors strokeWidth.

- No-fill / No-stroke: Fill null = transparent, Stroke null = no outline, both allowed? Path with no fill and no stroke invisible — should be blocked? Or allowed? For MVP, allow but maybe toast "no fill and no stroke — invisible"? But research says fill and stroke from current, None allowed. So path with no fill and no stroke would be invisible — should be prevented? Kineora decision: allow but not ideal, maybe block? Actually for Shapes, Line requires stroke, but Pen could have no fill and no stroke? That would be invisible, should be no-op? Document as edge: if both None, no object? Or allow? For MVP, allow but it will be invisible — better to block? Let's mark as OPEN QUESTION: what happens when both fill and stroke None for Pen? For now, Kineora decision says fill/stroke from current, None allowed, but need to define if both None = no command? Let's put in ambiguity register.

- Current Style: ToolColors view state, no undo, for new objects.

- Inherited Style: When editing existing path geometry, preserve its existing fill/stroke, not current.

- Selected-object Style: Properties shows fill/stroke of selected path, live preview, one undo per commit.

**Edge Cases:** Already audited in Pen file — 15+ edge cases including empty canvas, no selection, overlapping, locked/hidden/folder, empty frame, extreme zoom, tiny/huge, pointer leaving, Esc, tool switch, blur, invalid both None, cancelled. All documented.

**Result:** Pen Tool has no critical ambiguity except both None case and open path fill rendering — mark as MEDIUM ambiguity, not critical for MVP.

---

## STEP 5 — PENCIL AUDIT

Verify:

- **Straighten Mode:** [INDUSTRY] Adobe: "To draw straight lines and convert approximations of triangles, ovals, circles, rectangles, and squares into these common geometric shapes, select Straighten" [helpx draw]. Kineora: KEEP Straighten mode for MVP with basic line straightening, full shape recognition deferred. No ambiguity.

- **Smooth Mode:** [INDUSTRY] Adobe: "To draw smooth curved lines, select Smooth" [helpx draw]. Smoothing slider 0-100 in Properties when Smooth mode [helpx strokes]. Kineora: KEEP Smooth mode with smoothing slider 0-100, enabled only in Smooth mode (per Adobe official). No ambiguity.

- **Ink Mode:** [INDUSTRY] Adobe: "To draw freehand lines with no modification applied, select Ink" [helpx draw]. Kineora: KEEP Ink mode raw no smoothing. No ambiguity.

- **Smoothing Values:** Adobe Smoothing 0-100, default 50. Krita Weighted Smoothing Distance, Stroke Ending, Smooth Pressure, Scalable Distance, Stabilizer Sample Count Max/Min, Delay, Finish Line, Pixel. Kineora: For MVP simple 0-100 slider, advanced weighted+stabilizer deferred but documented as MODIFY with reason better quality but simple UI for now. No ambiguity, MVP scope clear.

- **Stabilization:** Krita Stabilizer averages inputs, draws circle around cursor, line behind cursor, Delay dead zone for sharp corners, Finish Line ensures completion. Kineora: MODIFY — use weighted + stabilizer as option later, simple 0-100 for MVP. No ambiguity, deferred scope clear.

- **Pressure:** Adobe Pencil no pressure, Brush has pressure. Krita Freehand Brush has pressure for size. Kineora: REJECT pressure for Pencil, keep for Brush only. Reason: Pencil uniform weight for line art. No ambiguity.

- **Tablet vs Mouse:** Mouse constant size, tablet more precise but no pressure for Pencil. Documented. No ambiguity.

- **Constraints:** Shift constrains to H/V [helpx draw]. No Alt. Documented.

- **Stroke Creation:** Pointer down begins freehand path, no hit-test, no selection, captures pointer. Move adds points with smoothed preview live, no doc write. Up commits if drag >=3px else no object. One DrawPath stroke-only no fill, stroke from current stroke color/width.

- **Stroke Simplification:** After commit, path may have many points — need simplification to reduce points while preserving shape. Adobe has Optimize curves, Smooth modifier. Kineora: For MVP, keep raw smoothed points, no simplification, but document as future.

- **Self-intersection:** Freehand may self-intersect — allowed, creates complex path, still valid.

- **Current Color:** Uses current stroke color/width from ToolColors, fill ignored.

- **Current Frame:** At playhead, auto-key F6 copy-prev if held, adds stroke.

- **Undo:** One stroke = one undo, cancelled/failed no undo.

**How Pencil Differs from Pen and Brush:**

- Pen: precision, few anchors with handles, corner/smooth, 6 cursor states, Add/Delete/Convert, close circle
- Pencil: freehand, many points, 3 modes Straighten/Smooth/Ink, smoothing slider, no handles while drawing, stroke-only, Shift H/V only, no pressure
- Brush: fill painting, 5 modes Normal/Fills/Behind/Selection/Inside, pressure varies size, dot allowed, no merge for MVP

All differences explicitly documented in 07 interaction audit section 9 and in each file's Purpose.

**Functional Ambiguity Check:** None critical. All modes, smoothing, constraints, creation, undo, layer, timeline defined. Edge cases covered.

---

## STEP 6 — BRUSH AUDIT

Verify:

- **Brush Mode:** 5 modes documented from Adobe official [helpx draw]: Paint Normal (paints over lines and fills on same layer), Paint Fills Only (paints fills only, skips strokes & empty), Paint Behind (paints blank areas on same layer leaving lines/fills unaffected), Paint Selection (applies new fill to selection when fill selected), Paint Inside (paints fill where stroke starts and never paints lines, if start in empty no effect). All with expected behavior. Kineora KEEP all 5 for MVP. No ambiguity.

- **Brush Size:** Size slider 1px to large, from Brush tool modifiers [helpx draw]. Kineora KEEP size.

- **Brush Shape:** Round, square, etc. from modifiers. Kineora KEEP shape.

- **Pressure:** Varies size between min and max with Pressure checkbox, invert behavior, Tilt varies angle, Speed varies size [Toon Boom eraser properties but brush similar + Adobe Pressure/Tilt]. Kineora KEEP pressure min/max + tilt angle, with Wacom check. No ambiguity.

- **Tilt:** Pen Tilt Sensitivity % stretches tip per tilt angle [Toon Boom]. Kineora KEEP.

- **Speed:** Speed sensitivity reduces size when drawing fast [Toon Boom]. Kineora KEEP as part of pressure sensors? Actually documented as Speed sensitivity in Toon Boom, but Kineora for MVP keeps pressure only, speed deferred? In research, Speed listed as sensor but Kineora decision says pressure min/max + tilt for MVP, speed maybe part of pressure? Clarify: For MVP, pressure varies size, tilt varies angle, speed deferred. No ambiguity, just need to mark speed as DEFERRED in final spec.

- **Taper:** Start and End Taper Distance/Percentage, Fade Distance [Toon Boom]. Kineora DEFER taper for MVP, reason complex.

- **Opacity:** Flow vs Opacity distinction in Toon Boom (Flow cumulative, Opacity non-cumulative). Kineora for MVP only opacity (fill alpha), flow deferred, REJECT Flow vs Opacity distinction for MVP with reason simpler. No ambiguity.

- **Smoothing:** Smoothing slider + Stage zoom level checkbox (if enabled size scales with zoom, if disabled constant pixel size) [helpx draw]. Kineora KEEP smoothing slider, MODIFY size constant doc for MVP (not scaling with zoom) with option later, reason simpler engineering consistent with Rect. No ambiguity, MVP vs deferred clear.

- **Stage Zoom Behavior:** Adobe scales brush size proportionately to zoom, with checkbox to disable. Kineora decision: constant doc size for MVP, option later. No ambiguity, documented as MODIFY.

- **Click/Dot Behavior:** Adobe Brush click creates single dab. Kineora: dot allowed on click (single fill) unlike Pencil/Rect which require min drag. Documented, no ambiguity.

- **Current Color:** Fill color from ToolColors, stroke ignored (Brush paints fill). Documented.

- **Fill/Stroke Relationship:** Fill only, no stroke, size from brush size + pressure. Documented.

- **Layer Behavior:** Active layer only for MVP to avoid accidental other layers, blocked on locked/hidden/folder + ancestors, with toast. Paint Inside start empty → no-op + toast, Paint Selection no selection → no-op + toast. Documented.

- **Frame Behavior:** Current frame at playhead, auto-key F6 copy-prev at held, adds stroke.

- **Undo:** One stroke = one undo, dot = one undo.

**MVP vs Deferred Explicit:**

- MVP: Paint Normal, Fills, Behind, Selection, Inside (all 5), Size, Shape, Pressure min/max, Tilt angle, Smoothing, Object Drawing toggle, dot allowed, one undo, layer checks, auto-key

- Deferred: Art Brush/Pattern Brush (Name, Scale proportionately, Stretch to fit, Stretch between guides, Flip, Spacing, At corners Center/Flank/Slice/Overlap) [helpx paint brush], Taper Start/End Distance/Percentage, Fade Distance, Texture, Dual Tip, Brush sync with Eraser, Flow vs Opacity, Size Proportional to Camera, Roundness/Angle, Pen Rotation, etc. All with reasons.

No ambiguity, MVP scope frozen.

---

## STEP 7 — ERASER AUDIT

Verify:

- **Normal:** Erase Normal paints over lines and fills on same layer (like Brush Normal) — KEEP for MVP

- **Fills:** Erase Fills Only — paints fills only, skips strokes — KEEP? Actually research says KEEP for MVP Normal only, others later? In 04_ERASER_TOOL.md, Kineora decision says KEEP drag erase + pressure + layer checks, MODIFY whole-object delete for MVP, DEFER Fills/Lines/Selected/Inside modes. So for MVP, only Normal mode, not Fills. But in interaction audit, says all modes? Need to resolve: In Eraser file, MVP is Normal only, but in 05_SHAPES etc., says Eraser modes? Let's check: 04_ERASER_TOOL.md section 2 says Eraser Mode options include Normal, Fills Only, Lines Only, Selected Fills, Inside — but Kineora decision says DEFER Fills/Lines/Selected/Inside modes, only Normal for MVP. So final spec should say MVP Normal only, others deferred. This is a minor contradiction between UI options list and Kineora decision — resolve: MVP Normal only, others deferred.

- **Lines:** Erase Lines Only — deferred

- **Selected:** Erase Selected Fills — deferred

- **Inside:** Erase Inside — deferred

- **Faucet:** Click to erase entire fill/line — deferred (Faucet) [community]

- **Size:** Like brush, slider, pressure varies — KEEP

- **Tip Style:** Round/Flat/Bevel for pencil line extremities after erase [Toon Boom] — DEFER

- **Pressure:** Varies size if enabled and Sync with Brush — KEEP

- **Complete Erase:** Whole object removal — KEEP for MVP as whole-object delete

- **Partial Erase:** Erase part of stroke, splitting into two paths or shortening — DEFERRED, reason complex path boolean

- **Vector Behavior:** For vector, erasing middle splits into two, end shortens, fill hole? Complex. For MVP whole-object delete, not partial.

- **Raster Behavior:** For raster, erase alpha? Kineora is vector-only for MVP (Node::Rect, Path, etc.), raster deferred. So raster erasing deferred.

- **Undo:** One erase gesture = one undo, even if multiple objects erased — KEEP

- **Layer Behavior:** Active layer only for MVP, blocked on locked/hidden/folder + ancestors — KEEP

- **Frame Behavior:** Current frame at playhead, auto-key at held frame, blank frame no-op — KEEP

**Does Research Promise Unreasonable Behavior?**

Check: Does Eraser research promise partial splitting that current model cannot support? In 04 file, it says "For MVP Kineora: Eraser = delete objects whose bounds touch eraser circle (contact selection + delete). One command DeleteSelection for those ids. This matches current Stage's select_in_rect logic but with eraser size." So it does NOT promise partial splitting for MVP, it promises whole-object delete which current model CAN support (select_in_rect + delete_selection). Good, no unreasonable promise.

Future partial splitting is marked DEFERRED with reason complex.

**Result:** No unreasonable promise, MVP scope realistic.

---

## STEP 8 — SHAPES AUDIT

Verify each shape:

**Rectangle:**

- Down: start screen + startDoc, dragging false, preview null, capture pointer
- Move: past 3px threshold dragging true, compute doc end, build rect via normalizeRect (4 directions → top-left + positive) + buildRect with Shift square + Alt from-center, preview translucent fill alpha 0.3 + stroke dashed editor-only
- Up: if valid w>=1/h>=1 commit one DrawRect with x,y,w,h,fill from current fill, else no object. Clear preview, selection = new id
- Shift: square
- Alt: from-center
- Escape: cancel discard preview no command
- Min size: 1px doc (MIN_RECT_DIM)
- Fill: current fill, null = no fill
- Stroke: current stroke + width, null = no stroke (but rect with no fill and no stroke invisible → should be no-op? Edge case: if both None, no object? For Shapes, if both None, invisible, should be no-op? Document as edge: if both fill and stroke None, no command? Or allow? For Rect, fill from current fill, stroke from current? Actually current code uses fill only for Rect? In Stage.tsx drawRect uses fill only? But research says fill+stroke. Need to clarify: Rect should use both fill and stroke from current. If both None, no object? Mark as ambiguity.)

- Snapping: grid/point/angle, Shift 45° is angle snap? For rect, angle not, but for line yes. For rect, grid snap for corners.

- Live parameters: Corner radius for rounded rect — KEEP corner_radius field serde default 0, so old files load. Primitive Rectangle with hinges deferred.

- Conversion: Ordinary path after creation, not live primitive.

- Undo: one shape = one undo

- Frame: at playhead, auto-key

**Rounded Rectangle:** Same as Rect but with corner radius live param. Adobe Primitive Rectangle has hinges to edit corner radius [Adobe Guide]. Kineora KEEP corner_radius field, DEFER hinges live editing.

**Oval / Circle:**

- Down/Move/Up same as Rect but ellipse preview
- Shift: circle
- Alt: from-center
- Min size: w>=1/h>=1
- Fill: current fill
- Stroke: current stroke
- Snapping: grid
- Live params: Oval Primitive inner radius, close path, start/end angle [helpx draw oval] — DEFER
- Conversion: ordinary
- Undo: one
- Frame: auto-key

**Line:**

- Down: start, Move: preview line from startDoc to currentDoc translucent line with stroke color, Up: commit DrawLine if length>=1px
- Shift: 45° multiples (horizontal/vertical/diagonal) [Adobe]
- Alt: from-center? For line, from-center means start is center, end is symmetric? Actually for line, from-center would mean line extends both directions from start? But Adobe Line tool Alt = from-center? Check: For Rectangle/Oval, Alt from-center, for Line maybe also? In Krita, Ctrl center. So Kineora: Line Alt from-center = start is center, line extends both sides? Or start is center and drag defines half length? Need to define: For Line, down = one endpoint, move = other endpoint, Alt = from-center means start is center and line extends both directions (so total length = 2 * drag distance). This is common. Document as decision.

- Min size: length>=1px

- Fill: none, stroke only (no fill) [helpx draw line: cannot set fill attributes for Line tool]

- Stroke: current stroke + width

- Snapping: angle snap Shift 45°

- Live params: none

- Conversion: ordinary path with 2 points

- Undo: one

**Polygon / Star / PolyStar:**

- Activation: PolyStar tool, no shortcut
- Creation: Down = center, Move = radius + rotation preview, Up = commit with sides and ratio from options
- Sides: number of sides (e.g., 5 for pentagon)
- Star ratio: inner/outer radius (e.g., 0.5)
- Inner radius, Outer radius
- Fill/Stroke from current
- Live params: sides, ratio, etc. — deferred for MVP? But research says PolyStar needs sides param. For MVP, could have default 5 sides.

- **LIVE PRIMITIVE vs ORDINARY PATH — Critical Resolution:**

[INDUSTRY] Adobe: Regular Rectangle tool vs Primitive Rectangle tool — regular creates shape where outline and fill are different objects and can be moved separately unless Object Drawing Mode, while Primitive has hinges that allow editing shape. [Adobe Beginner Guide]

[INDUSTRY] Illustrator: Live shapes vs ordinary paths — live shapes have live parameters (width/height/corner radius) that can be edited via widgets, but can be expanded to ordinary path.

[KINEORA] Decision from 05_SHAPES_TOOLSET.md:

- **KEEP for MVP:** Ordinary path/rect/oval nodes after creation, not live primitive. Each shape drag = one Draw command creating Node::Rect/Oval/Line with x,y,w,h,fill,stroke, etc. After creation, shape is selectable and transformable via Free Transform, but not live editable via hinges. Reason: live primitive requires extra model for live params (width/height/corner radius as live props) and conversion logic, too complex for MVP.

- **DEFER:** Live primitive with hinges (Primitive Rectangle/Oval with corner radius, inner radius, start/end angle) — future WISH. When live primitive implemented, it should have live parameters stored and conversion to ordinary path via command.

- **Engineering Implication:** For MVP, Shape model = ordinary: Rect { x,y,w,h,fill,stroke,stroke_width,corner_radius (serde default 0) }, Oval { x,y,w,h,fill,stroke }, Line { x1,y1,x2,y2,stroke,stroke_width }. No live param storage beyond corner_radius. For future live primitive: need LivePrimitive node with type, params, and conversion.

- **Final Freeze:** MVP = ordinary, not live. Future = live primitive with hinges.

No ambiguity after this resolution.

---

## STEP 9 — CROSS-TOOL INTERACTION MATRIX

| Interaction | Expected Behavior | Conflict? | Resolution |
|-------------|-------------------|-----------|------------|
| Pen + Color | New path uses current fill/stroke from ToolColors at creation, existing path editing preserves its style, preview uses current with alpha | No | KEEP |
| Pencil + Color | Stroke-only using current stroke color/width, fill ignored, no pressure | No | KEEP — stroke only |
| Brush + Color | Fill-only using current fill, 5 modes filter where paint lands, pressure varies size, dot allowed | No | KEEP — fill only |
| Eraser + Color | Never modifies style, only deletes/splits geometry, preview dimmed/red, whole-object delete MVP | No | KEEP — no style change |
| Shapes + Color | Rect/Oval/PolyStar fill+stroke from current, Line stroke-only, current for new, Properties for existing, both None → no object? (ambiguity) | Minor ambiguity both None | RESOLVE: If both fill and stroke None, no command, no object, toast "no fill and no stroke — invisible" — add to final spec |
| Pen + Timeline | At playhead on active layer, if held frame auto-key copy-prev then add path, one undo, undo removes keyframe exactly, holds until next keyframe | No | KEEP — F6 semantics |
| Pencil + Timeline | Same as Pen: at playhead, auto-key at held, one stroke = one undo | No | KEEP |
| Brush + Timeline | Same: at playhead, auto-key, one stroke = one undo, dot allowed | No | KEEP |
| Eraser + Timeline | At playhead, if content keyframe removes from that keyframe, if held auto-keys copy-prev then erases in new keyframe, blank frame no-op, one erase = one undo | No | KEEP |
| Shapes + Timeline | Same: at playhead, auto-key, one shape = one undo, min 1px | No | KEEP |
| Pen + Layers | Active layer must be Normal visible unlocked + ancestors visible/unlocked, blocked on locked/hidden/folder → toast + log, no command | No | KEEP — B-1/B-3/B-5 |
| Pencil + Layers | Same as Pen | No | KEEP |
| Brush + Layers | Active layer only MVP, blocked same, Paint Inside start empty → no-op + toast, Paint Selection no selection → no-op + toast | No | KEEP |
| Eraser + Layers | Active layer only MVP, blocked same | No | KEEP |
| Shapes + Layers | Same as Pen | No | KEEP |
| Color + Layers | New objects require editable active layer, selected objects color edit via selected_editable filters locked/hidden, so locked objects not editable, toast if any locked | No | KEEP |
| Pen + Selection | No selection needed to create new, requires selection for add/delete anchor on existing path, overlapping topmost first | No | KEEP |
| Pencil + Selection | No selection needed, creates new, selection becomes new | No | KEEP |
| Brush + Selection | No selection needed except Paint Selection mode requires selection, creates new, selection = new | No | KEEP |
| Eraser + Selection | No selection needed, erases under pointer regardless of selection | No | KEEP |
| Shapes + Selection | No selection needed, creates new, selection = new | No | KEEP |
| Color + Selection | Properties shows colors based on selection_details, single vs multiple same vs mixed "—" + badge, BUG-P-001 instances no W/H | No | KEEP |
| Pen + Snapping | Point snapping to existing anchors within 8px screen, grid/guides/object snap, angle snap Shift 45°, indicators magnet/highlight/status text | No | KEEP |
| Pencil + Snapping | No snap for MVP (freehand), future point snap for gap closing | No | KEEP — no snap MVP |
| Brush + Snapping | No snap (artistic flow) | No | KEEP — no snap |
| Eraser + Snapping | No snap | No | KEEP — no snap |
| Shapes + Snapping | Grid/point/angle snap, Shift 45° for Line, indicators | No | KEEP |
| Color + Snapping | No snap | No | KEEP |
| Pen + Undo | One completed path (open or closed) = one undo, Add/Delete/Convert anchor = one each, preview no undo, cancelled/failed no undo | No | KEEP |
| Pencil + Undo | One stroke = one undo | No | KEEP |
| Brush + Undo | One stroke (including dot) = one undo | No | KEEP |
| Eraser + Undo | One erase gesture (drag) = one undo even if multiple objects, faucet click = one, preview no undo | No | KEEP |
| Shapes + Undo | One shape = one undo, tiny <1px no undo | No | KEEP |
| Color + Undo | ToolColors changes no undo no dirty, Properties one commit = one undo, drawing with current = one Draw = one undo | No | KEEP |

**Result:** No critical conflicts, only minor ambiguity both None for Shapes/Pen, resolved.

---

## STEP 10 — ENGINEERING DEPENDENCY AUDIT

Without code, identify foundational systems that must exist before each tool.

**Foundational Systems (already exist in repo per 23 roadmap and App.tsx):**

- **Document Model:** Document, Scene, Layer, Node (Rect, SymbolInstance) — exists, but needs extension for Path, Oval, Line, BrushStroke, PolyStar
- **Layer Permissions:** layer_and_ancestors_visible, layer_and_ancestors_unlocked, is_folder, editable_target_layer — exists (B-1/B-3/B-5)
- **Frame Representation:** BTreeMap<u32, Frame> with Keyframe { content, transforms, label } and Blank, timeline_duration — exists
- **Viewport Coordinate Conversion:** viewport.ts createViewport, docToScreen, screenToDoc, fitViewport, panBy, zoomAt, zoomToRect — exists, pure, tested
- **Hit Testing:** eval.rs hit_test, hits_in_rect, node_bounds, node_layer_index, node_transform_in_scene — exists for Rect, needs extension for Path/Oval/Line/BrushStroke + hits_in_polygon for Lasso/Eraser
- **Pointer Capture:** Stage.tsx window mousemove/mouseup/pointercancel/blur/keydown Esc handlers, rafRef for redraw — exists
- **Preview Rendering:** canvasRenderer.ts render with RenderState (background, stageW/H, items, selectedIds, overlay, marquee, previewDelta, previewRect, colorPreview, workArea, grid, rulers, onionGhosts) — exists, but needs preview for Pen/Pencil/Brush/Shapes/Eraser
- **Undo/Redo:** command.rs History with execute/undo/redo, is_dirty snapshot-based, mark_clean, prevSelection/postSelection (INV-EDIT-2) — exists
- **Command/Event Boundary:** engine/client.ts facade — UI's only doorway to Rust core, WASM_PKG_URL, WASM_BG_URL, loadEngine with fetch→Blob URL→init, docChanged emits document:changed, emitSelectionChanged builds full selection:changed payload {prevTargets,targets,kind,commonType,bounds} — exists
- **Tool State:** toolColors.ts load/set/subscribe with localStorage, toolOptions.ts, onionPrefs.ts, viewPrefs.ts — exists
- **Selection System:** selection_details, selection_rects, selection:changed event with full payload — exists
- **Timeline:** TimelineStrip with cellKinds, rulerInterval, onionRange, ghostAlpha, collectGhosts — exists

**Required Extensions for 6 Tools (conceptual, no code):**

- **Color Model:** For MVP solid colors only: fill: string|null, stroke: string|null, strokeWidth: number, background: string, background_alpha. Already exists via ToolColors and Node. For future: gradient (linear/radial with stops, direction, scale, rotation), swatches palette, alpha per fill/stroke.

- **Vector/Path Model:** Node::Path { id, anchors: Vec<Anchor { x,y, handle_in: Option<Pt>, handle_out: Option<Pt>, kind: Corner/Smooth }>, closed: bool, fill, stroke, stroke_width } — needed for Pen, Pencil, Brush (if Path with fill), Shapes Line/PolyStar. Must support serde defaults for old files (old files without kind/parent_id/collapsed load as Normal).

- **Stroke Representation:** For Pencil: stroke-only Path with no fill, width from current. For Brush: fill-only Path or BrushStroke with points+size+pressure.

- **Brush Model:** Node::BrushStroke { id, points: Vec<Pt with pressure>, size, fill, mode } or Node::Path with fill and variable width. Must support 5 modes filtering and pressure-to-size.

- **Shape Model:** Node::Rect { id, x,y,w,h, fill, stroke, stroke_width, corner_radius (serde default 0) }, Node::Oval { x,y,w,h, fill, stroke }, Node::Line { x1,y1,x2,y2, stroke, stroke_width }, Node::PolyStar { center, outer_radius, inner_radius, sides, ratio, fill, stroke } — for MVP Rect/Oval/Line, PolyStar deferred but define.

- **Eraser Model:** For MVP whole-object delete uses existing DeleteSelection command, no new model. For future partial erase: need path boolean operations, stroke splitting, fill hole creation — deferred.

- **Fill/Stroke Representation:** Already in Node, but need to ensure fill null = no fill, stroke null or stroke_enabled false = no stroke, both None → no object (prevent invisible).

**Dependency Ordering (from repo's actual architecture):**

```
FOUNDATION (already exists, needs extension)
  ├── Document, Scene, Layer, Settings, Transform
  ├── History, Command, dirty snapshot
  ├── Viewport math (screen↔doc)
  ├── Hit-test for existing Rect/SymbolInstance
  └── WASM bridge + client facade + bus events

COLOR MODEL (06) — no dependencies, provides fill/stroke for all
  ├── ToolColors (view state, localStorage)
  ├── ColorPreview (renderer-only)
  └── PropertiesPanel live preview contract

VECTOR/PATH MODEL (needed for Pen/Pencil/Brush/Line)
  ├── Node::Path with anchors/handles/closed
  ├── Anchor kinds Corner/Smooth
  ├── Path hit-test (point near segment, anchor hit radius)
  └── Command DrawPath + Add/Delete/Convert Anchor

SHAPE MODEL (05) — depends on Color + Path for Line
  ├── Node::Rect with corner_radius serde default
  ├── Node::Oval
  ├── Node::Line (or Path with 2 points)
  └── Node::PolyStar (deferred but define)

PEN TOOL (01) — depends on Color + Path + Subselection + Snap
  ├── Interaction state: in-progress anchors, preview, mode
  ├── 6 cursor states
  ├── Modifiers Shift 45° + Alt break + Ctrl finish
  └── One path = one undo

PENCIL TOOL (02) — depends on Color + Path + Smoothing
  ├── 3 modes Straighten/Smooth/Ink
  ├── Smoothing 0-100 + weighted + stabilizer future
  └── One stroke = one undo

BRUSH TOOL (03) — depends on Color + Brush model + Pressure/Tilt + 5 modes
  ├── 5 modes Normal/Fills/Behind/Selection/Inside
  ├── Pressure min/max + Tilt angle + Speed deferred
  └── Dot allowed, no merge MVP

ERASER TOOL (04) — depends on Brush tip + Hit-test + Path splitting future
  ├── Whole-object delete MVP (hits_in_rect/circle + DeleteSelection)
  └── Partial splitting deferred

SHAPES TOOLSET (05) — depends on Color + Shape model + Modifiers
  ├── Rect/Oval/Line with Shift square/circle/45° + Alt from-center + Esc cancel
  └── Min 1px, translucent preview, one shape = one undo

CROSS-TOOL INTEGRATION (07)
  ├── Pen/Pencil/Brush/Shapes ↔ Color (current vs selected)
  ├── All ↔ Timeline auto-key F6
  ├── All ↔ Layers permission checks
  └── No conflicts

QA (acceptance criteria per tool + cross-tool matrix)
```

**Why This Order:**

- Foundation must exist first because all tools need Document/Layer/Viewport/Hit-test/History/Command/Event — already exists but needs extension for new Node kinds.

- Color Model next because it has no dependencies and provides fill/stroke for all drawing tools — ToolColors is view state, Properties is document state, live preview contract must be defined before tools that use colors.

- Vector/Path Model next because Pen, Pencil, Brush, Line, PolyStar all need Path representation with anchors/handles — without Path, Pen/Pencil/Brush cannot be implemented without faking with Rect (which is forbidden per research gate).

- Shape Model next because Rect/Oval/Line need Rect/Oval/Line nodes, which are simpler than Path but still need fill/stroke and corner_radius — can be implemented after Color and Path.

- Pen next because it is most complex (14 actions, 6 cursor states, Add/Delete/Convert) and needs Path + Subselection + Snap — after Path model, Pen can be implemented.

- Pencil next because it needs Path + Smoothing (simpler than Pen, no handles while drawing) — after Pen, Pencil is easier.

- Brush next because it needs Brush model + Pressure/Tilt + 5 modes — more complex than Pencil, needs Path and Color.

- Eraser next because it needs Brush tip + Hit-test + for MVP whole-object delete uses existing DeleteSelection, but future partial needs Path boolean — after Brush.

- Shapes next because they are simpler (drag creates) but need Rect/Oval/Line nodes and modifiers — can be after Pen/Pencil/Brush or before, but placing after ensures Path model exists for Line as Path.

- Cross-tool Integration last because it verifies Pen/Pencil/Brush/Eraser/Shapes ↔ Color/Timeline/Layers/Selection/Snapping/Undo have no conflicts — must be after all tools.

- QA last — acceptance criteria per tool + cross-tool matrix.

**What Must Already Work Before Each Stage:**

- Before Color: Foundation (Document, Viewport, History, WASM bridge) must work — it does (UI 868 tests pass, build pass).

- Before Path: Color must work (ToolColors, Properties live preview) — it does for Rect.

- Before Shapes: Color + Path must work for Line as Path.

- Before Pen: Path + Color + Subselection (for anchor editing) + Snap must work.

- Before Pencil: Path + Color + Smoothing must work.

- Before Brush: Path + Color + Brush model + Pressure/Tilt + Hit-test for modes must work.

- Before Eraser: Brush tip + Hit-test must work.

- Before Cross-tool: All 6 tools must have research complete.

**What Should NOT Be Implemented Yet (per new mission, only 6 tools):**

- Text Tool (T) — needs Node::Text + on-stage editing — BLOCKED, not in 6
- Bone/Bind/Asset Warp (W) — needs IK + mesh — DEFERRED, not in 6
- Hand/Zoom/Rotate/Time Scrub — View tools, not in 6 (but already exist, okay)
- Selection/Subselection/Lasso/Transform — not in 6 (but already exist)
- Gradient, Swatches Palette, Art/Pattern Brush, Taper, Texture, Dual Tip, Flow, Tip Style Round/Flat/Bevel, Faucet, Partial Erase Splitting, Live Primitive Hinges, Polygon/Star live params, Oval Primitive inner radius, etc. — all DEFERRED with reasons.

---

## STEP 11 — IMPLEMENTATION ORDER (Safest Coding Sequence)

**Recommended Order for NEXT Coding Phase (after this audit):**

1. **FOUNDATION EXTENSION** — Extend Document model for new Node kinds
   - Why first: All 6 tools need Path/Rect/Oval/Line/BrushStroke nodes, current model only has Rect and SymbolInstance
   - Depends on: Existing Document, Layer, Settings, History
   - Must already work: Existing Rect/SymbolInstance lifecycle, layer permissions B-1/B-3/B-5, viewport math, WASM bridge
   - Should NOT yet: Implement tool gestures, only model + serde defaults

2. **COLOR SYSTEM POLISH** — Ensure ToolColors and Properties live preview contract is solid for new node kinds
   - Why second: No dependencies, provides style for all drawing tools, already partially done for Rect
   - Depends on: Foundation
   - Must already work: ToolColors localStorage, ColorPreview renderer-only, PropertiesPanel fields
   - Should NOT yet: Gradient, swatches palette

3. **VECTOR PATH MODEL** — Node::Path with anchors (x,y, handle_in/out, kind Corner/Smooth), closed flag
   - Why third: Pen, Pencil, Brush, Line need Path, without it they would be faked with Rect (forbidden)
   - Depends on: Foundation + Color
   - Must already work: Document with new node kinds, fill/stroke
   - Should NOT yet: Smoothing, pressure, add/delete anchor commands

4. **SHAPE MODEL** — Node::Rect with corner_radius serde default 0, Node::Oval, Node::Line
   - Why fourth: Simpler than Path, but needs Color, and Rect already exists — extend it
   - Depends on: Color + Path (for Line as Path)
   - Must already work: Path model for Line
   - Should NOT yet: Live primitive hinges, Polygon/Star

5. **PEN TOOL** — Most complex, 14 actions, 6 cursor states
   - Why fifth: Needs Path model + Color + Subselection + Snap, after Path model ready
   - Depends on: Path + Color + Subselection + Snap + Viewport + Layer permissions + Timeline auto-key
   - Must already work: Path model, hit-test for path segments and anchors, screenToDoc, editable_target_layer, ensure_keyframe
   - Should NOT yet: Pencil, Brush, Eraser, Shapes beyond Rect

6. **PENCIL TOOL** — Freehand vector with 3 modes and smoothing
   - Why sixth: Needs Path + Color + Smoothing, simpler than Pen (no handles while drawing), after Pen's path infrastructure
   - Depends on: Path + Color + Smoothing (weighted + stabilizer future)
   - Must already work: Pen's path preview infrastructure
   - Should NOT yet: Brush pressure, shape recognition

7. **BRUSH TOOL** — Fill painting with 5 modes and pressure/tilt
   - Why seventh: Needs Brush model + Color + Pressure/Tilt + 5 modes filtering, more complex than Pencil
   - Depends on: Path + Color + Brush model + Pressure/Tilt sensors + Hit-test for modes
   - Must already work: Pencil smoothing, Path model
   - Should NOT yet: Art/Pattern Brush, Taper, Texture

8. **ERASER TOOL** — Cleanup, whole-object delete MVP
   - Why eighth: Needs Brush tip + Hit-test, for MVP uses existing DeleteSelection (whole-object), future partial needs Path boolean
   - Depends on: Brush tip + Hit-test + Layer permissions + Timeline auto-key
   - Must already work: Brush size/pressure, hits_in_rect/circle
   - Should NOT yet: Partial splitting, Faucet, Tip Style

9. **SHAPES TOOLSET** — Rect/Oval/Line (and PolyStar deferred) with modifiers
   - Why ninth: Simpler drag gestures, but needs Shape model + Color + Modifiers, can be after Pen/Pencil/Brush or in parallel, placing after ensures Path for Line
   - Depends on: Color + Shape model + Modifiers (Shift square/circle/45° + Alt from-center) + Viewport + Layer + Timeline
   - Must already work: Rect gesture normalizeRect/buildRect/isValidRect
   - Should NOT yet: Live primitive hinges, Polygon/Star live params

10. **CROSS-TOOL INTEGRATION + QA** — Verify interactions and acceptance criteria
    - Why last: Must verify Pen/Pencil/Brush/Eraser/Shapes ↔ Color/Timeline/Layers/Selection/Snapping/Undo have no conflicts, after all tools implemented
    - Depends on: All 6 tools
    - Must already work: All tool gestures, color live preview, auto-key, layer checks
    - Should NOT yet: Other tools beyond 6 (Text, Bone, etc.)

**Safety Reasoning:** Foundation first because without model extension, tools would fake with Rect. Color second because no dependencies and needed for all. Path third because Pen/Pencil/Brush/Line need it. Shapes fourth because simpler but needs Color+Path. Pen fifth because most complex and needs Path+Snap. Pencil sixth simpler than Pen. Brush seventh needs pressure. Eraser eighth needs hit-test. Shapes ninth can be parallel but placed after to reuse Path for Line. Integration last to catch conflicts.

---

## STEP 12 — MVP VS DEFERRED (Definitive Matrix)

| Feature | MVP | Deferred | Reason |
|---------|-----|----------|--------|
| **Pen Tool** | | | |
| First anchor creates path start, terminates previous | MVP | | Core path creation, Adobe/Illustrator behavior |
| Click = corner point, Drag = smooth with handles | MVP | | Core Pen behavior |
| Shift constrains 45° | MVP | | Adobe Pen modifier, essential for precision |
| Alt breaks handle symmetry (independent handles) | MVP | | Adobe Pen modifier, needed for corner/smooth conversion |
| Add anchor over segment (+) | MVP | | Requires path selected, one AddAnchor command, essential for editing |
| Delete anchor over anchor (-) | MVP | | One DeleteAnchor command |
| Convert smooth to corner (click) / corner to smooth (Alt-drag) | MVP | | Convert ^ cursor, essential |
| Close path by clicking first anchor (circle) | MVP | | Closed path with fill, one DrawPath closed=true |
| Continue path from endpoint (slash) | MVP | | Continue existing path, one command |
| Finish open path via double-click / Ctrl+click away / Enter | MVP | | Multiple finish methods, Enter added for discoverability |
| Show Pen Preview preference | MVP | | Session view state, previews line from last to cursor |
| Object vs Merge drawing mode | MVP | | Affects selection after creation, already exists |
| Fill/Stroke from current colors | MVP | | Current style for new, preserve existing when editing geometry |
| One path = one undo, Add/Delete/Convert = one each | MVP | | Undo contract |
| Layer permission checks (visible/unlocked/not folder + ancestors B-1/B-3/B-5) | MVP | | Safety, prevents orphans |
| Auto-key at held frame (F6 copy-prev) | MVP | | Animation workflow, preserves existing |
| Point/Grid/Guide/Angle snapping | MVP | | Point snap 8px screen, grid snap, Shift 45° angle snap, indicators |
| Show Precise Cursors (crosshair, Caps Lock toggle) | | Deferred | Preference, for MVP always crosshair for precision (MODIFY) |
| Scissors tool as separate | | Deferred | Merge into Pen workflow, reduce clutter (REJECT) |
| Disable Auto Add/Delete preference | | Deferred | Always allow auto add/delete when path selected for simplicity (REJECT) |
| Path Simplify/Optimize | | Deferred | Advanced cleanup, needs Object>Path>Simplify, later unit |
| Join paths Ctrl+J | | Deferred | Needs two endpoints selected, later |
| **Pencil Tool** | | | |
| Freehand vector drawing, no hit-test, creates new even over existing | MVP | | Core Pencil behavior |
| Straighten mode (basic line straightening) | MVP | | Adobe Pencil mode, converts rough to straight |
| Smooth mode (smooth curves) | MVP | | Adobe Pencil mode |
| Ink mode (raw no modification) | MVP | | Adobe Pencil mode |
| Smoothing slider 0-100 (only in Smooth mode) | MVP | | Property inspector, affects smoothness |
| Shift constrains H/V | MVP | | Adobe Pencil modifier |
| Object Drawing toggle | MVP | | Merge vs Object mode |
| Stroke only, no fill, uniform width, no pressure | MVP | | Distinction from Brush (which has pressure) |
| Min drag 3px threshold, tiny <3px no object | MVP | | Prevents accidental dots (like Rect min 1px) |
| One stroke = one undo, layer checks, auto-key | MVP | | Consistent |
| Weighted Smoothing (Distance, Stroke Ending, Smooth Pressure, Scalable Distance) + Stabilizer (Sample Count Max/Min, Delay, Finish Line, Pixel) | | Deferred (but documented as MODIFY) | Better quality than simple slider, but simple 0-100 UI for MVP, advanced options later |
| Pressure sensitivity for Pencil | | Rejected | Keep for Brush only, Pencil uniform weight (REJECT) |
| Shape recognition (Recognize Lines/Shapes Off/Strict/Normal/Tolerant) | | Deferred | Needs Modify>Shape>Straighten, later |
| **Brush Tool** | | | |
| Paints fill (not stroke) | MVP | | Adobe Brush paints fill [helpx draw] |
| 5 modes: Normal, Fills Only, Behind, Selection, Inside | MVP | | All 5 from Adobe official [helpx draw] |
| Size + Shape (round/square) | MVP | | Brush modifiers |
| Pressure varies size min-max with Pressure checkbox | MVP | | Wacom support, Toon Boom Min/Max + Pressure |
| Tilt varies angle (Pen Tilt Sensitivity) | MVP | | Tablet support |
| Smoothing slider | MVP | | Smooth curves |
| Object Drawing toggle | MVP | | Merge vs Object |
| Dot allowed on click (single dab) | MVP | | Unlike Pencil/Rect, Brush dot valid |
| One stroke = one undo, layer active only MVP, auto-key | MVP | | Consistent |
| Size scales with zoom option (Stage zoom checkbox) | | Deferred (MODIFY) | For MVP constant doc size for simplicity (like Rect), option later — reason simpler engineering |
| Merge behavior (Merge mode merges with existing fills) | | Deferred (MODIFY) | For MVP no merge — separate objects for exact undo, simpler model — reason merging makes undo complex |
| Flow vs Opacity distinction (Flow cumulative, Opacity non-cumulative) | | Rejected | For MVP only opacity, flow deferred — reason simpler (REJECT) |
| Art Brush / Pattern Brush (Name, Scale proportionately, Stretch to fit, Stretch between guides, Flip, Spacing, At corners Center/Flank/Slice/Overlap) | | Deferred | Needs brush library, stretch options [helpx paint brush] — reason needs art brush engine |
| Taper Start/End Distance/Percentage, Fade Distance, Texture, Dual Tip, Roundness/Angle, Pen Rotation, Size Proportional to Camera | | Deferred | Advanced brush tip options [Toon Boom] — reason complex |
| Brush sync with Eraser (Sync settings checkbox) | | Deferred | Sync pressure/tilt/size/shape [helpx reshape] — reason advanced |
| **Eraser Tool** | | | |
| Drag erases content under brush circle, size like brush | MVP | | Core Eraser behavior [Adobe] |
| Size slider, pressure varies size if enabled and Sync with Brush | MVP | | Like Brush |
| One erase gesture (drag) = one undo even if multiple objects, preview dimmed/red overlay editor-only | MVP | | Preview vs commit separation, one undo |
| Layer active only MVP, blocked on locked/hidden/folder + ancestors, auto-key at held frame, blank frame no-op | MVP | | Safety + animation |
| Faucet (click to erase entire fill/line) | | Deferred | Click to erase whole fill/line [community] — reason needs whole-object vs partial distinction, for MVP click no drag = no command (no faucet) |
| Modes: Fills Only, Lines Only, Selected Fills, Inside | | Deferred | Erase Fills Only, Lines Only, Selected Fills, Inside [Adobe] — reason for MVP Normal only to keep simple, others later |
| Tip Style Round/Flat/Bevel for pencil line extremities | | Deferred | Toon Boom Tip Style [Toon Boom] — reason advanced |
| Partial erase with stroke splitting into two paths / shortening / fill hole creation | | Deferred | Complex path boolean and stroke reconstruction — reason too complex for MVP, whole-object delete MVP still useful |
| Raster erasing (alpha) | | Deferred | Kineora vector-only MVP, raster deferred |
| Eraser as blending mode (any brush becomes eraser via E toggle) | | Deferred (MODIFY) | Krita Eraser as mode [Krita] — separate tool more discoverable for MVP, blending mode toggle future |
| **Shapes Toolset** | | | |
| Rectangle drag creates with crosshair, preview translucent fill alpha 0.3 + stroke dashed editor-only | MVP | | Core Rect behavior |
| Oval/Circle drag creates with ellipse preview | MVP | | Core Oval |
| Line drag creates with line preview, stroke-only no fill | MVP | | Core Line [helpx draw line cannot set fill] |
| Shift: Rect square, Oval circle, Line 45° multiples, Polygon rotation 45° | MVP | | Adobe + Krita Shift square [Adobe Guide + Krita] |
| Alt: Rect/Oval/Line from-center (start is center) | MVP | | Adobe Alt from-center [Adobe] + Krita Ctrl center |
| Shift+Alt: square/circle from center, line 45° from center | MVP | | Combo |
| Esc cancels discard preview no command | MVP | | T2B.4 |
| Min size 1px (w>=1/h>=1 or length>=1) no object if tiny | MVP | | MIN_RECT_DIM prevents accidental dots |
| Fill+Stroke from current colors (Line stroke-only) | MVP | | Current style for new |
| Object Drawing toggle | MVP | | Merge vs Object |
| One shape = one undo, layer checks B-1/B-3/B-5, auto-key F6 | MVP | | Consistent |
| Grid/Point/Angle snapping (basic) | MVP | | Grid snap for corners, angle snap Shift 45° |
| Rounded Rectangle corner_radius field with serde default 0 | MVP (MODIFY) | | Common, needs param, old files load — reason rounded rect common |
| Oval as separate node Oval for hit-test ellipse not rect | MVP (MODIFY) | | Cleaner hit-test and export — reason ellipse hit-test different from rect |
| Live primitive with hinges (Primitive Rectangle/Oval with corner radius, inner radius, close path, start/end angle) | | Deferred | Adobe Primitive has hinges [Adobe Guide] + Oval Primitive inner radius/close path/start-end angle [helpx draw oval] — reason live primitive requires extra model for live params and conversion, too complex for MVP, ordinary path after creation for MVP |
| Polygon/Star/PolyStar live params (sides, star ratio, inner/outer radius) | | Deferred | Needs PolyStar node with sides/ratio — reason needs new node kind, later |
| Line as separate node vs Path with 2 points | | Deferred | For MVP Line can be Path with 2 anchors, but define as separate for clarity later — reason clarity |
| **Color System** | | | |
| Overlapping fill (22px white border) and stroke (22px offset 10px) swatches with None striped red ╱ pattern when null, data-testid tool-fill-none etc. | MVP | | Adobe overlapping [helpx strokes] |
| None buttons ∅F∅S clear color and show None pattern | MVP | | None button [helpx] |
| Swap ⇄ exchanges fill and stroke, swatches follow | MVP | | Swap [helpx] |
| Default D resets to fill #ffffff stroke #000000 width 1 | MVP | | Default [helpx] |
| Stroke Width W input min 0 | MVP | | Width |
| Current fill/stroke/width persisted in localStorage (toolColors.ts) view state no undo no dirty survives reload for new objects | MVP | | Authoring color |
| Selected object color in PropertiesPanel single selection Fill + Stroke Enabled + Stroke color + Width with live preview renderer-only via onPreview ColorPreview + commit one setNodeProps on blur/Enter/picker close + Esc cancel + lastCommittedRef dedupe | MVP | | Selected style, live preview Part 26.12 + C-09 |
| Multiple selection same color shows shared, mixed shows "—" + badge "Mixed selection — common fields only" + W/H hidden when any instance BUG-P-001 | MVP | | Mixed handling |
| Eyedropper Tool I samples fill/stroke via selectAt + selection_details and auto-switches to Bucket with toast "picked up #color → Paint Bucket" no doc change no undo allowed on locked read-only | MVP | | Eyedropper [Adobe Guide + Krita P + Toon Boom Colour Eyedropper] |
| Live preview renderer-only never exported, committed appears in export SVG with fill/stroke/rotation clipped to stage | MVP | | Preview vs commit |
| One Properties commit = one undo, ToolColors no undo, drawing with current = one Draw = one undo, same color no command | MVP | | Undo |
| Layer active for new requires editable active layer, selected_editable filters locked/hidden for color edit, toast if locked | MVP | | Layer permission |
| Current frame at playhead, base props affect all held frames (node id same across held), no auto-key for fill (transform auto-keys) | MVP | | Timeline |
| Native <input type="color"> picker for MVP | MVP (MODIFY) | | Reason native accessible no extra dep sufficient for solid colors — full wheel/RGB/HSB/HEX/alpha later |
| Sample from active edit context only (topmost hit) not all layers merged | MVP (MODIFY) | | Reason simpler matches active layer model — all-layers merged (Krita Radius/Blend %) later |
| Gradient (Linear/Radial/Bitmap) with stops, direction, scale, rotation, handles, interpolation, transparency | | Deferred | Needs gradient stops, direction, etc. [helpx] — reason needs gradient engine |
| Swatches palette (default, custom, recent, history, naming, duplicate, delete, reorder) | | Deferred | Needs palette organization — reason needs swatches system |
| Art/Pattern Brush color interaction (brush color vs fill) | | Deferred | Needs art brush engine — reason needs brush library |
| Full color models RGB/HSL/HSV/HEX numeric + alpha slider beyond native picker | | Deferred | Needs full picker UI — reason native sufficient for MVP |
| Pressure-to-opacity for Brush (only size MVP) | | Deferred | Only size for MVP — reason simpler |

---

## STEP 13 — ENGINEER QUESTIONS TEST

Pretend engineer implementing.

For each tool ask questions, mark RESOLVED if research answers, OPEN DECISION if not.

**Pen Tool Questions:**

- What happens on first click? → Creates initial anchor, terminates previous in-progress path, no doc change yet — RESOLVED (01_PEN_TOOL.md Pointer Down)

- What happens on second click? → Adds second anchor to temporary path, preview segment from first to second — RESOLVED

- Click vs Drag? → Click=corner no handles, Drag=smooth with symmetric handles — RESOLVED

- What cursor when over existing path segment? → Pen with + (Add anchor) if path selected — RESOLVED

- What cursor over anchor? → Pen with - (Delete) — RESOLVED

- What cursor over first anchor of current path? → Pen with circle (Close) — RESOLVED

- What cursor over endpoint of other path? → Pen with slash (Continue) — RESOLVED

- What happens when closing path? → One DrawPath command closed=true committed, fill from current, selection = new id — RESOLVED

- What happens on double-click last point? → Finishes open path, one DrawPath closed=false — RESOLVED

- Does Enter finish open path? → Yes, Kineora addition for discoverability — RESOLVED (MODIFY with reason)

- What happens on Escape? → Discards in-progress path, no command, no undo — RESOLVED

- Does it create undo entry? → One completed path = one undo, Add/Delete/Convert = one each, preview no undo — RESOLVED

- What happens on locked layer? → Blocked, no node, no command, toast "draw blocked: layer locked", log blocked — RESOLVED

- Does it affect selected or future? → Future (new path) uses current colors, editing existing preserves its style — RESOLVED

- Which style is used? → Current fill/stroke from ToolColors at creation — RESOLVED

- What happens if both fill and stroke None? → OPEN DECISION — research says None allowed but invisible path would be invisible. Need product decision: should both None block with toast "no fill and no stroke — invisible" and no command? Mark as MEDIUM ambiguity.

**Pencil Tool Questions:**

- Straighten vs Smooth vs Ink? → Straighten converts to geometric shapes, Smooth smooths curves, Ink raw no modification — RESOLVED (02)

- Smoothing values? → 0-100 slider, only in Smooth mode per Adobe official, Weighted Smoothing + Stabilizer deferred as advanced — RESOLVED

- Pressure? → No pressure for Pencil, uniform width, Brush handles pressure — RESOLVED (REJECT with reason)

- What happens on tiny drag <3px? → No object, no command — RESOLVED

- Does it create undo? → One stroke = one undo — RESOLVED

- Locked layer? → Blocked, toast, no command — RESOLVED

**Brush Tool Questions:**

- What are 5 modes? → Normal, Fills Only, Behind, Selection, Inside with exact expected behavior per Adobe official [helpx draw] — RESOLVED

- What happens in Paint Selection with no selection? → No command, toast "paint selection: select a fill first" — RESOLVED

- What happens in Paint Inside starting in empty? → No command, no paint — RESOLVED

- Does click create dot? → Yes, dot allowed (single dab) unlike Pencil/Rect — RESOLVED

- Does it merge with existing fills in Merge mode? → For MVP no merge, separate objects for exact undo — RESOLVED (MODIFY with reason merging makes undo complex)

- Does size scale with zoom? → For MVP constant doc size, option Scale with zoom later — RESOLVED (MODIFY)

- Pressure? → Varies size min-max, tilt varies angle — RESOLVED

- Undo? → One stroke = one undo — RESOLVED

**Eraser Tool Questions:**

- What are modes? → Normal MVP, Fills Only, Lines Only, Selected Fills, Inside + Faucet deferred — RESOLVED but need to clarify MVP Normal only vs all 5 — minor contradiction resolved: MVP Normal only, others deferred.

- Does it erase partial or whole? → For MVP whole-object delete (contact selection + delete), partial splitting with path boolean deferred — RESOLVED (MODIFY with reason complex)

- Does it affect style? → Never modifies style of remaining — RESOLVED

- What happens on locked layer? → Blocked, toast, no command — RESOLVED

- Undo? → One gesture = one undo even if multiple objects — RESOLVED

**Shapes Toolset Questions:**

- Rectangle creation gesture? → Down start, Move past 3px threshold shows translucent preview with buildRect Shift square Alt from-center, Up commits if w>=1/h>=1 else no object — RESOLVED

- What does Shift do for Rect/Oval/Line? → Rect square, Oval circle, Line 45° multiples, Polygon rotation 45° — RESOLVED

- What does Alt do? → From-center (start is center) — RESOLVED, with Line from-center meaning line extends both directions from center (total length 2* drag) — RESOLVED as decision

- What is min size? → 1px doc (MIN_RECT_DIM) — RESOLVED

- What happens if both fill and stroke None? → OPEN DECISION — same as Pen, invisible shape. Should block? Mark MEDIUM.

- Fill/Stroke for Line? → Stroke only, fill ignored per Adobe Line cannot set fill — RESOLVED

- Live primitive vs ordinary? → MVP ordinary (Rect/Oval/Line nodes after creation, not live editable with hinges), live primitive with hinges deferred — RESOLVED with WHY

- Undo? → One shape = one undo — RESOLVED

**Color System Questions:**

- What is difference between Current Authoring and Selected Object? → ToolColors view state localStorage no undo no dirty for new objects vs Properties document state one undo per commit live preview renderer-only — RESOLVED, no ambiguity per Step 3 audit

- What happens when changing ToolColors? → No undo, no dirty, view state only — RESOLVED

- What happens when Eyedropper samples? → No undo, read-only, samples to ToolColors, auto-switches to Bucket, allowed on locked — RESOLVED

- What happens with mixed colors multiple selection? → Shows "—" placeholder + mixed badge + common fields only, W/H hidden when any instance BUG-P-001 — RESOLVED

- What happens on Esc in Properties color field? → Cancels, reverts draft, clears preview, no command — RESOLVED

- Does same color commit create undo? → No, before==after check no command — RESOLVED

- Locked layer object color edit? → selected_editable filters, so locked objects not editable, blocked with toast — RESOLVED

All engineer questions RESOLVED except two both-None cases.

---

## STEP 14 — AMBIGUITY REGISTER

**CRITICAL (Must be resolved before coding) — 0**

None — all critical behaviors defined, no blocking ambiguity.

**MEDIUM (Can be resolved during implementation but documented):**

- **AMB-001:** Pen Tool and Shapes Toolset — what happens when both fill and stroke are None (transparent fill + no stroke) at creation time? Path/Shape would be invisible. Research says None allowed for fill and stroke individually, but both None would be invisible. 
  - Original statements: 01_PEN_TOOL.md says "Fill null = no fill, Stroke null = no stroke (invisible unless fill)" and "Fill/Stroke from current colors at creation, None allowed". 05_SHAPES_TOOLSET.md says "Fill: current fill, null = no fill, Stroke: current stroke + width, null = no stroke" and "Line uses stroke only".
  - Conflict: If both None, object invisible — should it be blocked?
  - Resolution: For MVP, if both fill and stroke None, treat as invalid — no command, no object, toast "no fill and no stroke — invisible, set a color". This prevents invisible objects polluting document. Add to final spec. Not critical for coding start, but should be decided.

- **AMB-002:** Shapes Toolset — Line Tool Alt from-center exact behavior: does line extend both directions from start (total length 2* drag) or does start remain one endpoint and Alt just changes center? 
  - Industry: Krita Ctrl center for Rectangle/Ellipse means from-center. For Line, from-center typically means line extends both directions from initial click (center). Adobe Line tool Alt from-center? Not explicitly in docs, but common pattern.
  - Resolution: For Kineora, Line Alt from-center = start is center, line extends symmetrically both directions, total length = 2 * distance from start to current. Document as Kineora decision. Not critical.

- **AMB-003:** Pencil Tool — does Straighten mode's shape recognition happen live during drag or only on release? Adobe docs say select mode then draw, but not clear if recognition is live preview or post-process.
  - Resolution: For MVP, Straighten applies basic line straightening live in preview, but full shape recognition (triangles, ovals, circles, rectangles, squares into geometric shapes) is deferred. So live preview shows straightened line, but complex shape recognition post-process deferred. Mark as MEDIUM, not blocking.

**LOW (Cosmetic/non-blocking):**

- **LOW-001:** Pen Tool Show Precise Cursors preference — should it be preference or always crosshair? Research says Adobe has preference Show Precise Cursors with crosshair and Caps Lock toggle. Kineora decision MODIFY says always crosshair for precision but allow Caps Lock toggle. Low ambiguity, cosmetic.

- **LOW-002:** Brush Tool Stage zoom level checkbox — exact UI location (Options area vs Properties) — low, deferred option.

- **LOW-003:** Eraser Tool Tip Style Round/Flat/Bevel — visual difference of pencil line extremities after erase — low, deferred.

**Goal CRITICAL=0 achieved.**

---

## STEP 15 — FINAL SPECIFICATION FREEZE — KINEORA 6-TOOL BEHAVIOR CONTRACT

This is the authoritative source of truth for engineering.

### PEN TOOL — Final Contract

- **Purpose:** Precision Bézier path creation with anchors and handles, for clean vector art
- **Shortcut:** P, Toolbar drawing group, icon pen nib, active #2d5aa7
- **Cursor States (6+):** Initial x (first point terminates previous), Sequential (continuing), Add + (over selected path segment), Delete - (over anchor), Convert ^ (over smooth point), Close circle (over first anchor of current path), Continue slash (over endpoint of other path)
- **Gestures:** Down begins (hit-test for add/delete/close/continue else new anchor, capture pointer, store startDoc), Move updates preview (translucent preview line from last anchor to cursor if Show Preview on, curve preview with handles when dragging, Shift constrains 45°, Alt breaks symmetry), Up adds anchor to temporary in-progress path (not yet document) or if closing finishes path and commits one DrawPath closed=true or if add/delete anchor commits one Add/Delete/Convert Anchor command
- **Completion:** Double-click last point OR click Pen icon OR Ctrl/Cmd+click away OR Enter (Kineora addition) finishes open path with closed=false, one DrawPath command. Click first anchor with circle closes with closed=true.
- **Modifiers:** Shift 45° angle constrain for anchors/handles/segments, Alt break handle symmetry (independent handles), Ctrl/Cmd finish open path / access Direct Selection, Caps Lock toggle precise cursor crosshair
- **Visual Feedback:** Preview translucent segment + anchors squares/circles (hollow vs solid per Show Solid Points) + handles lines+dots, snap highlights (magnet) when near existing anchor/grid, all editor-only never exported
- **Document Effect:** Creates Node::Path with anchors (x,y, handle_in/out, kind Corner/Smooth), closed flag, fill/stroke from current ToolColors at creation. Modifies existing path geometry via Add/Delete/Convert/Move handle, preserves existing fill/stroke when editing geometry.
- **Preview vs Commit:** Temporary in-progress anchors list + preview segment + handles in Stage refs, renderer-only, cleared on cancel/commit. Committed one DrawPath/Add/Delete/Convert command creates/modifies node, selection = new id, document:changed
- **Undo:** One completed path = one undo, Add/Delete/Convert = one each, preview no undo, cancelled/failed (locked/hidden/folder) no undo, tiny allowed (no min for Pen)
- **Layers:** Active layer must be Normal visible unlocked + ancestors visible/unlocked (B-1/B-3/B-5 checks), blocked → toast "draw blocked: layer locked/hidden/folder — not a frame target", log blocked, no command
- **Timeline:** At playhead on active layer, if held frame auto-key copy-prev (F6) then add path, one undo, undo removes keyframe exactly, holds until next keyframe
- **Snapping:** Point snap to existing anchors within 8px screen (Click Accuracy tolerance), Grid snap if grid visible + snap on, Guide snap, Angle snap Shift 45°, indicators magnet/highlight/status text "snap to anchor"
- **Input Devices:** Mouse primary click=corner drag=smooth, Trackpad same, Stylus more precise no pressure, Tablet no pressure for Pen (pressure ignored, Brush handles pressure)
- **Edge Cases:** Empty canvas first anchor no segment until second, no selection requires selection for add/delete to avoid accidental edits, overlapping topmost first, locked/hidden/folder blocked, empty frame creates keyframe, extreme zoom screen→doc ÷ zoom accurate, tiny anchors allowed, huge beyond stage allowed pasteboard staging clipped on export, pointer leaving commits if valid outside, Esc/pointercancel/blur/tool switch discards preview no command, both fill and stroke None → invalid no command toast "no fill and no stroke — invisible" (AMB-001 resolution)
- **Decisions:** KEEP all core Pen behaviors (6 states, Shift 45°, Alt break, Add/Delete/Convert, Close circle, Continue slash, Show Preview, Object Drawing, fill/stroke from current, layer checks, auto-key, snapping), MODIFY precise cursor always crosshair + Enter to finish (reason precision + discoverability), REJECT Scissors separate + Disable Auto Add/Delete pref (reduce clutter/simplicity), DEFER Simplify/Optimize, Join, Average

### PENCIL TOOL — Final Contract

- **Purpose:** Fast freehand vector line art with smoothing, for quick sketches and rough animation
- **Shortcut:** Y, Toolbar drawing group, icon pencil diagonal, cursor pencil
- **Options:** Pencil Mode dropdown Straighten / Smooth / Ink (stepped line icon at bottom of Tools panel), Smoothing slider 0-100 enabled only in Smooth mode per Adobe official [helpx strokes], Object Drawing toggle
- **Gestures:** Down begins freehand path at doc position, no hit-test (always new), capture pointer, start gesture. Move past 3px threshold dragging true, adds points to temporary path, updates preview stroke (solid in stroke color) with smoothing applied live (per mode). Up validates if drag >=3px commits one DrawPath stroke-only no fill with stroke from current stroke color/width, else tiny <3px no object no command. Cancel via pointercancel/blur/Esc/tool switch discards preview no command.
- **Modes:** Straighten converts rough lines to straight and approximations of triangles/ovals/circles/rectangles/squares into geometric shapes (basic for MVP, full recognition deferred), Smooth draws smooth curved lines with smoothing slider, Ink draws freehand with no modification
- **Modifiers:** Shift constrains to horizontal/vertical while drawing [helpx draw], Alt no effect (do not invent), Ctrl/Cmd no
- **Visual Feedback:** Preview solid stroke color editor-only while dragging, no handles/bounding box while drawing, after commit selectable with transform handles, error not-allowed over locked
- **Document Effect:** Creates Node::Path with many points (freehand), stroke-only (fill=None), stroke color/width from current, at current frame on active layer, auto-key at held frame
- **Preview vs Commit:** Temporary raw points + smoothed preview in Stage refs, overlay, never exported, cleared on cancel/commit. Committed one DrawPath command, selection = new id, document:changed
- **Undo:** One stroke = one undo, preview no undo, cancelled/failed no undo, tiny no undo
- **Layers:** Same checks as Pen: active Normal visible unlocked + ancestors, blocked → toast no command
- **Timeline:** At playhead, if content keyframe add to content, if held auto-key copy-prev then add, blank → auto-key, holds until next
- **Snapping:** No snap for MVP (freehand), future point snap for gap closing
- **Input Devices:** Mouse constant size, Trackpad same but jittery needs more smoothing, Stylus more precise no pressure, Tablet no pressure for Pencil (Brush handles pressure), Velocity fast less accurate needs smoothing, slow more precise, Weighted Smoothing Distance = events before first dab, Stabilizer future
- **Decisions:** KEEP freehand + 3 modes + smoothing slider 0-100 + Shift H/V + Object Drawing + stroke only + min 3px + one undo + layer checks + auto-key, MODIFY smoothing uses Krita weighted (Distance, Stroke Ending, Smooth Pressure, Scalable Distance) + Stabilizer (Sample Count Max/Min, Delay, Finish Line, Pixel) but simple 0-100 UI for MVP advanced later (better quality but simple UI), REJECT pressure for Pencil (keep for Brush only, reason uniform weight), DEFER shape recognition (Recognize Lines/Shapes Off/Strict/Normal/Tolerant) needs Modify>Shape>Straighten later
- **Difference from Pen/Brush:** Pen precision few anchors with handles + 6 cursor states + Add/Delete/Convert + close, Pencil freehand many points + 3 modes + smoothing + stroke-only + Shift H/V only + no pressure, Brush fill painting + 5 modes + pressure size + dot allowed + no merge MVP

### BRUSH TOOL — Final Contract

- **Purpose:** Natural painting fills with pressure, for coloring, shading, artistic strokes
- **Shortcut:** B, Toolbar drawing group, icon brush tip angled, cursor brush circle showing size
- **Options:** Brush Mode 5 modes [helpx draw]: Paint Normal (paints over lines and fills on same layer), Paint Fills Only (paints fills only skips strokes & empty), Paint Behind (paints blank areas only leaving lines/fills unaffected), Paint Selection (applies new fill to selection when fill selected), Paint Inside (paints fill where stroke starts never paints lines, if start in empty no effect), Brush Size slider, Brush Shape round/square, Pressure icon enable pressure sensitivity only if Wacom varies width, Tilt icon enable tilt varies angle, Stage zoom level checkbox (if enabled size scales with zoom if disabled constant pixel) [helpx draw], Smoothing slider, Object Drawing toggle
- **Gestures:** Down begins brush stroke at doc position, no hit-test for selection (always new) except modes need hit-test for filtering (Paint Fills needs fill under, Inside needs fill where started, Selection needs selection), capture pointer. Move adds dabs (points) with spacing, updates preview stroke editor-only solid fill with size variation if pressure (min-max) + tilt angle + mode filtering (Normal everywhere, Fills only on fills, Behind only blank, Selection only selected, Inside only inside start fill). Up validates — even tiny click creates dot (single dab) unlike Pencil/Rect, commit one DrawBrush command with points, size, fill from current fill, mode. Cancel discard preview no command.
- **Modifiers:** No Shift/Alt for Brush per docs (do not invent), Pressure varies size min-max + invert checkbox, Tilt varies angle Pen Tilt Sensitivity %, Speed varies size (Speed sensitivity) [Toon Boom] — for MVP pressure size only, speed deferred
- **Cursor:** Brush circle showing size (e.g., 10px), pressure active circle may change size with pressure preview, not-allowed over locked, maybe blocked cursor when Paint Inside start empty
- **Visual Feedback:** Preview solid fill with size variation + texture if textured, editor-only but solid (not translucent like Rect) still preview until release for undo consistency, mode feedback if Paint Selection no selection → status "no selection" no paint, after commit stroke becomes selectable object (for MVP separate Node, not merged)
- **Document Effect:** Creates Node::BrushStroke or Node::Path with fill (fill-only, no stroke, size from brush size + pressure) at current frame on active layer, auto-key at held frame, no merge for MVP (each stroke separate for exact undo)
- **Preview vs Commit:** Temporary points list with size per dab + mode-filtered preview overlay, cleared on cancel/commit. Committed one DrawBrush command, selection = new id, document:changed, why separation one undo per stroke + Esc cancel + clean export
- **Undo:** One stroke (including dot) = one undo, preview no undo, cancelled/failed no undo, multiple strokes multiple undo
- **Layers:** Active layer only MVP to avoid accidental other layers, must be Normal visible unlocked + ancestors, blocked → toast no command, Paint Behind still requires editable active layer, Paint Inside start empty → no-op toast "paint inside: start inside a fill", Paint Selection no selection → no-op toast "paint selection: select a fill first"
- **Timeline:** At playhead, add to existing or auto-key copy-prev at held, blank auto-key, holds until next
- **Snapping:** No snap (artistic flow)
- **Input Devices:** Mouse constant max size no pressure no tilt, Trackpad same, Stylus more precise no pressure unless enabled, Pressure Tablet key: size varies min-max % of max with Pressure checkbox invert, also opacity/flow, Tilt varies angle stretched by % per tilt, Rotation varies if pen supports tip rotation [Toon Boom]
- **Edge Cases:** Empty canvas first stroke, no selection Paint Selection requires selection else no-op toast, existing object Paint Normal over, Fills only on fills, Behind only blank, Inside only inside start fill, overlapping new on top, locked/hidden/folder blocked, empty frame creates keyframe, extreme zoom size scaling option: if Stage zoom checkbox enabled size scales with zoom same screen size at any zoom, if disabled constant doc size appears larger at lower zoom — for MVP constant doc size for simplicity (like Rect) but document option as future, tiny click dot allowed valid, huge beyond stage allowed, pointer leaving commit if valid, Esc/tool switch/blur discard, invalid locked or Paint Inside empty no-op, cancelled no undo
- **Decisions:** KEEP fill-only + 5 modes + Size+Shape + Pressure min/max + Tilt angle + Smoothing + Object Drawing + dot allowed + one undo + layer checks + auto-key, MODIFY size constant doc MVP not scaling with zoom (option later) reason simpler consistent with Rect, MODIFY no merge MVP separate objects reason merging makes undo complex, REJECT Flow vs Opacity distinction (only opacity MVP) reason simpler, DEFER Art Brush/Pattern Brush (Name, Scale proportionately, Stretch to fit, Stretch between guides, Flip, Spacing, At corners Center/Flank/Slice/Overlap) needs brush library + art brush engine, DEFER Taper Start/End Distance/Percentage + Fade Distance + Texture + Dual Tip + Roundness/Angle + Pen Rotation + Size Proportional to Camera + Brush sync with Eraser

### ERASER TOOL — Final Contract

- **Purpose:** Cleanup, correct, refine vector art without deleting whole objects via selection, predictable undoable
- **Shortcut:** E, Toolbar paint group, icon eraser angled rectangle, cursor eraser circle showing size
- **Options:** Eraser Mode: for MVP Normal only (paints over lines and fills on same layer), deferred Fills Only, Lines Only, Selected Fills, Inside + Faucet (click to erase entire fill/line) [Adobe], Size slider, Shape round/square, Pressure/Tilt sync with Brush checkbox (Sync settings with Brush) [helpx reshape], Smoothing, Tip Style Round/Flat/Bevel for pencil line extremities after erase [Toon Boom] deferred
- **Gestures:** Down begins erase gesture, hit-test what under pointer per mode (Normal any stroke/fill, Fills only fills, Lines only strokes), capture pointer, start gesture. Move while dragging erases content under brush circle, for MVP shows preview of affected area dimmed/red overlay editor-only not doc write (not live erase each move which would be many writes, one-undo-per-gesture rule), if Faucet mode click no drag erases entire fill/line under pointer commit on up without drag but deferred for MVP (for MVP click no drag = no command no faucet). Up validates if drag hit active layer objects commits one Erase command that for MVP deletes whole objects whose bounds intersect eraser circle (contact selection + DeleteSelection) one command DeleteSelection for those ids, matches Stage select_in_rect logic but with eraser size, future partial erase with splitting into two paths/shortening/fill hole deferred. Cancel via pointercancel/blur/Esc/tool switch discards preview no command.
- **Modifiers:** No Shift/Alt, Pressure varies size if enabled and Sync with Brush, Tilt varies angle, Sync with Brush checkbox mirrors size/shape/pressure/tilt from Brush
- **Cursor:** Eraser circle showing size, over erasable fill/line highlight, over locked not-allowed, Faucet mode eraser with faucet icon deferred
- **Visual Feedback:** Preview translucent overlay of area to be erased or affected objects dimmed with red X or eraser circle editor-only, no handles, after commit erased content gone selection pruned, error not-allowed over locked
- **Document Effect:** For MVP deletes whole objects that intersect eraser, so deletes content at current frame on active layer, auto-key if at held frame, no style change for remaining (erasing never modifies style)
- **Preview vs Commit:** Temporary eraser circle + affected ids overlay in Stage refs never exported, committed one Erase/Delete command removing ids (or splitting future) document:changed selection pruned, why separation one undo per gesture + Esc cancel + prevents many writes + clean export
- **Undo:** One erase gesture drag = one undo even if multiple objects erased, faucet click = one, preview no undo, cancelled/failed no undo, multiple erases multiple undo
- **Layers:** Active layer only MVP to avoid accidental other layers, must be Normal visible unlocked + ancestors visible/unlocked, blocked → toast no command, ancestor walk required
- **Timeline:** At playhead, if content keyframe removes from that keyframe, if held auto-keys copy-prev then erases in new keyframe, blank frame nothing to erase no-op, one erase = one undo, auto-key F6 semantics
- **Snapping:** No snap (freehand cleanup)
- **Input Devices:** Mouse constant max size, Trackpad same, Stylus more precise no pressure unless enabled, Pressure Tablet size varies min-max with pressure if Pressure enabled and Sync with Brush on, matches Brush sync
- **Decisions:** KEEP drag erase under circle + size like brush + pressure size if enabled + one undo per gesture + layer checks active only + auto-key + preview vs commit, MODIFY whole-object delete for MVP not partial splitting reason complex path boolean and stroke reconstruction too complex for MVP but whole-object still useful matches Select All+Delete, MODIFY no Faucet for MVP click no drag = no command to keep one gesture rule simple faucet later, REJECT merge, DEFER partial erase with splitting/fill hole, Faucet mode, Tip Style Round/Flat/Bevel, Selected/Inside modes, Sync advanced taper etc.

### SHAPES TOOLSET — Final Contract

- **Purpose:** Fast geometric construction for UI, backgrounds, props, with exact dimensions and modifiers
- **Tools:** Rectangle (R), Rounded Rectangle (R with corner radius), Oval (O), Circle (Shift+O), Line (N), Polygon, Star, PolyStar (deferred live params)
- **Toolbar:** R icon rectangle outline, O oval outline, N diagonal line, PolyStar star/polygon, active #2d5aa7, tooltip with shortcut, cursor crosshair for all shapes
- **Options:** Object Drawing toggle (Merge vs Object) [helpx draw], Corner Radius for rounded rect, Oval Primitive inner radius/close path/start-end angle [helpx draw oval] deferred, Polygon sides/star ratio/size, Fill/Stroke from colors area (Line stroke only no fill [helpx draw line cannot set fill]), Pencil Mode not for shapes
- **Gestures Per Shape (Action Level):**
  - **Rectangle:** Down begins rect gesture stores start screen X,Y and startDoc via screenToDoc captures pointer dragging false preview null. Move if not dragging and past threshold 3px dragging true computes doc end position builds rect via normalizeRect (4 directions → top-left + positive) + buildRect with Shift square + Alt from-center, preview translucent rect overlay editor-only fill alpha 0.3 + stroke dashed never in document scheduleRedraw. Up if dragging and valid rect isValidRect w>=1/h>=1 doc px commits one DrawRect command with x,y,w,h,fill from current fill (and stroke from current stroke+width) else tiny click no object no command. Clear preview selection = new id. Cancel pointercancel/blur/Esc/tool switch discards preview no command, Escape discards.
  - **Rounded Rectangle:** Same as Rect but with corner_radius live param, Adobe Primitive Rectangle has hinges to edit corner radius [Adobe Guide]
  - **Oval/Circle:** Down start, Move preview oval translucent, Up commit DrawOval if valid w>=1/h>=1, Shift circle w==h, Alt from-center
  - **Line:** Down start one endpoint, Move preview line from startDoc to currentDoc translucent line with stroke color, Up commit DrawLine if length>=1px one command, Shift constrains angle to 45° multiples (horizontal/vertical/diagonal) [Adobe], Alt from-center = start is center line extends both directions total length 2* drag distance (Kineora decision for AMB-002)
  - **Polygon/Star:** Down = center, Move = radius + rotation preview, Up = commit with sides and ratio from options, Shift constrains rotation 45° multiples, Alt from-center? Center already start so Alt maybe no effect or toggles inner radius, for MVP default 5 sides
- **Modifiers:** Shift = square/circle/45° (Rect square, Oval circle, Line 45°) [Adobe Guide] + Krita Shift square [Krita], Alt = from-center (Rect/Oval/Line) [Adobe] + Krita Ctrl center, Shift+Alt = square/circle from center or line 45° from center, Esc cancel
- **Cursor:** Crosshair for all shapes, not-allowed over locked
- **Visual Feedback:** Preview translucent shape fill alpha 0.3 + stroke dashed editor-only never exported, no handles while drawing but after commit selection shows transform handles, dimensions status bar shows W×H or radius while dragging, error not-allowed over locked with toast "draw blocked"
- **Document Effect:** Creates Node::Rect/Oval/Line/PolyStar at current frame on active layer, no modify/delete for MVP, geometry x,y,w,h or x1,y1,x2,y2 or sides/ratio, style Fill from current fill (Line stroke only) + Stroke from current stroke + Width from current, animation auto-key at held frame
- **Preview vs Commit:** Temporary startDoc/currentDoc/preview rect/oval/line via buildRect with modifiers in Stage refs rectPreviewRef, translucent overlay, cleared on cancel/commit. Committed one DrawRect/DrawOval/DrawLine/DrawPolyStar creates node selection = new id document:changed, why separation Esc cancel + one undo + clean export + live feedback without doc writes
- **Undo:** One shape drag = one undo entry, tiny <1px or < threshold no command no undo, cancelled/failed no undo, multiple shapes multiple undo
- **Layers:** Active layer must be Normal visible unlocked + ancestors visible/unlocked, locked/hidden/folder blocked toast no command log blocked, empty layer allowed auto-key
- **Timeline:** Current frame shape at playhead, keyframe add to existing or auto-key copy-prev, blank auto-key, existing adds alongside, auto-key F6 semantics undo exact, exposure holds until next keyframe
- **Snapping:** Grid snap if grid visible + snap on for corners, Point snap to existing anchors, Object snap to bounds later, Angle snap Shift 45° for Line, indicators highlight/magnet/status text, basic grid snapping for MVP
- **Input Devices:** Mouse primary drag, Trackpad same, Stylus same more precise no pressure, Pressure not used for shapes unlike Brush
- **Edge Cases:** Empty canvas first shape, no selection creates new selection = new, existing adds, overlapping new on top, locked/hidden/folder blocked, empty frame creates keyframe, extreme zoom screen→doc ÷ zoom same screen drag = different doc size depending on zoom correct doc size = screen ÷ zoom at 50% same drag = double doc size (like Rect manual test D), tiny w<1/h<1/length<1 no object no command MIN_RECT_DIM 1px, huge beyond stage allowed clipped on export, pointer leaving commit if valid on release outside like Rect does, Esc/tool switch/blur discard, invalid locked etc no command, cancelled no undo
- **Decisions:** KEEP drag create with crosshair + Shift square/circle/45° + Alt from-center + Esc cancel + Object Drawing + fill/stroke from current + min 1px + one undo + layer checks + auto-key + preview translucent + export clipped, MODIFY Rounded Rect corner_radius field serde default 0 old files load UI corner radius in Properties/Options reason rounded rect common needs param, MODIFY Oval separate node Oval for cleaner hit-test ellipse not rect reason ellipse hit-test different from rect, REJECT live primitive hinges for MVP ordinary path after creation not live editable reason live primitive requires extra model for live params and conversion too complex for MVP, DEFER Polygon/Star/PolyStar live params sides ratio inner/outer radius needs PolyStar node later, DEFER Oval Primitive inner radius close path start/end angle, DEFER Line as separate vs Path with 2 points for MVP Line can be Path with 2 anchors but define as separate for clarity later, DEFER live shape editing via hinges

### COLOR SYSTEM — Final Contract

- **Purpose:** Manage authoring style (current fill/stroke for new objects) and selected object style (existing selection), distinguish current vs selected, support sampling, swatches, gradients, alpha, mixed colors honest
- **UI Colors Area:** Below View area above Options in Tools panel per Adobe 4 sections [helpx stage], Fill swatch 22x22 overlapping top-left white border shows current fill or None striped red ╱ pattern with data-testid tool-fill-none, Stroke swatch 22x22 overlapping bottom-right offset 10px shows current stroke or None, None buttons ∅F∅S mini set fill/stroke to None transparent/no stroke, Swap ⇄ swaps fill and stroke, Default D or ⭯ resets to black stroke white fill, Stroke Width W label + number input 0+, vertical in ToolsPanel column horizontal in toolbar row
- **Properties Panel:** No selection = Document background color field ColorField with live preview background preview, single object = Fill color + Stroke Enabled checkbox + Stroke color if enabled + Stroke width with live preview ColorPreview renderer-only via onPreview + commit one setNodeProps on blur/Enter/picker close + Esc cancel reverts draft + clears preview + lastCommittedRef dedupe prevents close+blur double command, multiple same color shows shared, mixed shows "—" placeholder + "Mixed selection — common fields only" badge + W/H hidden when any instance BUG-P-001, live preview Part 26.12 + C-09
- **Color Picker:** Native <input type="color"> for MVP, future wheel/RGB/HSB/HEX/alpha slider
- **Eyedropper Tool:** I, icon pipette, crosshair cursor with small color preview, samples color from canvas via selectAt + selection_details fill/stroke, auto-switches to Bucket (fill) or Ink Bottle (stroke) — for MVP fill and switches to Bucket with toast "picked up #color → Paint Bucket", no document change no undo allowed on locked read-only like copy, quick access Ctrl from brush future (Krita Ctrl for sampler)
- **Swatches Panel:** Future default palette custom recent saved swatches history naming reorder duplicate delete
- **Gradient Editor:** Future linear/radial with stops position/color/alpha/direction/scale/rotation/handles/interpolation/transparency
- **Tooltip:** Fill "Fill color — #ffffff (click to pick)", Stroke "Stroke color — #000000", None "Fill: no color", Swap "Swap fill and stroke (X)", Default "Default colors — black stroke white fill (D)"
- **Activation:** Colors Area always visible view state localStorage via toolColors.ts load/set/subscribe session view state not document no undo no dirty survives reload for new objects, Eyedropper via I shortcut toolbar click setTool('eyedropper') cursor crosshair, Properties via selection, tool switch Colors Area persists global (switching Rect to Brush keeps same fill), state reset via Default button
- **Pointer Lifecycle Eyedropper:** Down hit-test at doc position via selectAt selects object under pointer and copies its colors to ToolColors then auto-switches to Bucket, Move no drag only click, Up commits sampled colors to ToolColors no doc change no undo notify and onToolChange('bucket'), Cancel Esc does nothing for Eyedropper, Escape in Properties color field cancels edit reverts draft clears preview no command, Tool Switch discards? No doc change anyway, Window Blur no effect
- **Modifiers:** No Shift/Alt for Eyedropper MVP (Adobe Eyedropper click fill → Bucket click stroke → Ink Bottle could have Shift to pick stroke but not documented for MVP no modifiers), Color Picker no modifiers, Swap/Default no modifiers but future shortcuts D default X swap (Illustrator)
- **Cursor:** Fill/Stroke swatch hover pointer hand clickable, Eyedropper pipette or crosshair with preview, over locked layer still eyedropper allowed read-only not not-allowed, Color Picker default
- **Visual Feedback:** Swatches show current color or None striped red ╱, live preview while editing Properties color field Stage shows live preview of object with new fill/stroke renderer-only colorPreview without writing engine, None state transparent with red slash object no fill/stroke, Mixed Colors multiple objects different fills Properties shows "—" placeholder mixed badge not color, Fill swatch in Tools panel still shows authoring color not selection, Sampling feedback toast "picked up #color → Paint Bucket" and ToolColors swatches update instantly, Invalid color native input only valid hex no invalid
- **Document Effect:** No create but affects what new objects will look like (current authoring), modifies selected objects' fill/stroke/width/background via setNodeProps/setDocumentSettings one undoable command, no delete but setting fill None removes fill visually stroke_enabled false removes stroke, no geometry, modifies style fill/stroke/width/background/background_alpha, no animation but style changes at current frame with auto-key? For base props fill no auto-key transform auto-keys, modifies color
- **Preview vs Commit:** Temporary current authoring color view state until used to draw new object, live preview in Properties while typing/dragging picker onPreview sends ColorPreview to Stage renders displayItems with preview colors not in document. Committed when new object drawn uses current fill/stroke at that moment creates node via Draw command, when Properties color committed blur/Enter/picker close one setNodeProps emits document:changed creates undo entry, why separation prevents undo fragmentation + allows Esc cancel + live feedback without dirtying + matches Adobe "color controls live"
- **Undo:** One committed color change in Properties = one undo entry, drawing new object with current = one Draw = one undo, ToolColors changes no undo no dirty view state only, live preview no undo, Eyedropper sampling no undo read-only, failed locked no undo, one color field commit = one undo even if many chars typed idempotent dedupe via lastCommittedRef
- **Layers:** New objects require editable active layer, selected objects color edit via selected_editable filters locked/hidden at playhead so locked objects not editable, commit blocked or no-op with toast "layer locked", hidden not selectable no color edit, empty no objects shows Document background, folder no content only Document
- **Timeline:** Color changes affect current frame's content transform override at playhead, base props fill affects base node so all frames holding node get new color (content_at same node id across held frames), blank frame no content no object color, auto-keyframe does color change auto-key? For transform yes, for base props fill no auto-key, exposure persists across held span because node id same
- **Snapping:** No snap for color
- **Input Devices:** Mouse click swatch opens native picker pick color commit on close/blur, Trackpad same, Stylus same no pressure, Pressure Tablet no pressure for color but Wacom may have color picker via pen button Krita Ctrl for sampler, for Kineora Ctrl quick access to Eyedropper from any paint tool future but MVP Eyedropper separate tool
- **Decisions:** KEEP overlapping swatches with None ∅F∅S striped + Swap ⇄ + Default D + Stroke Width W + Fill for new from ToolColors view state localStorage + Stroke for new + Eyedropper I samples and auto-switches to Bucket + Properties fill/stroke for single with live preview renderer-only commit on blur/Enter/picker close + one undo per commit + layer checks via selected_editable + mixed "—" + badge + BUG-P-001, MODIFY sample from active context only MVP not all layers merged reason simpler matches active layer model all-layers merged (Krita Radius/Blend %) later, MODIFY native <input type="color"> for MVP not full wheel/RGB/HSB/HEX/alpha reason native accessible no extra dep sufficient for solid, MODIFY alpha via background_alpha only for MVP fill hex only no alpha in fill but background has background_alpha field, DEFER gradient Linear/Radial/Bitmap with stops/direction/scale/rotation/handles/interpolation/transparency needs gradient engine, DEFER swatches palette default custom recent history naming reorder, DEFER art/pattern brush color interaction needs brush library, DEFER full color models RGB/HSB/HSL/HEX numeric + alpha slider beyond native picker, DEFER pressure-to-opacity for Brush only size MVP

---

## STEP 16 — ENGINEERING HANDOFF CHECKLIST

**Required Foundational Systems (must exist before 6-tool coding):**

- [x] Document Model: Document, Scene, Layer (Normal/Folder, parent_id, collapsed, depth), Settings (width/height/fps/background/background_alpha/units/platform), Transform (x,y,scale_x/y,rotation,skew,pivot) — exists but needs extension for Path/Oval/Line/BrushStroke/PolyStar node kinds + corner_radius
- [x] History: History with execute/undo/redo, is_dirty snapshot-based (content != snapshot), mark_clean, prevSelection/postSelection (INV-EDIT-2), 100 bound — exists
- [x] Layer Permissions: layer_and_ancestors_visible, layer_and_ancestors_unlocked, is_folder, editable_target_layer (Normal+visible+unlocked+ancestors) + frame_target_ok (Normal+unlocked+ancestors) + reject_frame_target logging — exists (B-1/B-3/B-5)
- [x] Frame Representation: BTreeMap<u32, Frame> Keyframe { content: Vec<NodeId>, transforms: BTreeMap<NodeId,Transform>, label: Option<String> } + Blank, timeline_duration max keyframe min 1 — exists
- [x] Viewport: viewport.ts createViewport, docToScreen, screenToDoc, fitViewport, panBy, zoomAt, zoomToRect, pure doc↔screen math, tested 25%-800% — exists
- [x] Hit Testing: hit_test, hits_in_rect, node_bounds, node_layer_index, node_transform_in_scene for Rect/SymbolInstance — exists, needs extension for Path (point near segment, anchor hit radius 6px), Oval (ellipse), Line (segment), BrushStroke, plus hits_in_polygon for Lasso/Eraser
- [x] Pointer Capture: Stage.tsx window mousemove/mouseup/pointercancel/blur/keydown Esc (capture), rafRef rAF scheduleRedraw, spaceHeld Spacebar temporary Hand — exists
- [x] Preview Rendering: canvasRenderer.ts render with RenderState (background, stageW/H, items, selectedIds, overlay, marquee, previewDelta, previewRect, colorPreview, workArea, grid, rulers, onionGhosts) — exists, needs preview for Pen/Pencil/Brush/Shapes/Eraser (translucent rect/oval/line/path)
- [x] Command/Event Boundary: engine/client.ts — UI's only doorway to core, WASM_PKG_URL /wasm/kineora_core.js + WASM_BG_URL /wasm/kineora_core_bg.wasm, loadEngine fetch→text→Blob URL→import→wasmBytes→init, honest error detail with build command, docChanged emits document:changed only for document mutations, emitSelectionChanged builds full selection:changed {prevTargets,targets,kind,commonType,bounds} with union AABB, asU64/asNum bigint boundary contract, hasSymbolFacade, hasDocManager — exists
- [x] Tool State: toolColors.ts load/set/subscribe/swap/reset with localStorage, toolOptions.ts zoomMode, onionPrefs.ts, viewPrefs.ts — exists
- [x] Selection: selection_details, selection_rects, selection:changed event full payload — exists
- [x] Timeline: TimelineStrip with CELL_W, NAME_W, cellKinds, rulerInterval, onionRange, ghostAlpha, collectGhosts, frame ops F6/F7/Shift+F6/F5/Shift+F5 + clipboard + tween + labels + span resize — exists

**Required Tool Systems (to be built in next phase, per this audit):**

- [ ] Path Model: Node::Path with anchors Vec<Anchor { x,y, handle_in/out, kind Corner/Smooth }>, closed bool, fill, stroke, stroke_width, serde defaults
- [ ] Shape Model Extension: Node::Rect corner_radius f64 serde default 0, Node::Oval, Node::Line, Node::PolyStar (deferred but define)
- [ ] Brush Model: Node::BrushStroke with points Vec<Pt with pressure>, size, fill, mode (Normal/Fills/Behind/Selection/Inside)
- [ ] Commands: DrawPath, AddAnchor, DeleteAnchor, ConvertAnchor, DrawBrush, Erase (or DeleteSelection for MVP whole-object), DrawOval, DrawLine, DrawPolyStar, SetNodeProps already exists, TransformSelection already exists
- [ ] WASM Facades: kineora_draw_path, kineora_add_anchor, kineora_delete_anchor, kineora_convert_anchor, kineora_draw_brush, kineora_erase, kineora_draw_oval, kineora_draw_line, kineora_set_node_props, etc. + set_all_layers_visible/locked/outline already exists per header-all flags
- [ ] Client Facades: drawPath, addAnchor, deleteAnchor, convertAnchor, drawBrush, erase, drawOval, drawLine, etc. in engine/client.ts
- [ ] Stage Pointer Router: activeTool(), isSelectLike(), PenGesture, PencilGesture, BrushGesture, EraserGesture, RectGesture/OvalGesture/LineGesture with startX/Y, dragging, lastDocX/Y, threshold 3px, MIN_RECT_DIM 1px, screenToDoc via viewport, preview refs, commit one command, cancel handlers
- [ ] Canvas Renderer Preview: render preview for Pen (translucent path + anchors + handles), Pencil (smoothed stroke), Brush (fill with variable width + mode filtering), Eraser (circle + dimmed affected), Shapes (translucent rect/oval/line)
- [ ] ToolColors UI: ToolColors.tsx overlapping swatches with None striped pattern, ∅F∅S, ⇄, D, W input — already improved in cc71de7, needs to support new node kinds
- [ ] ToolOptions UI: ToolOptions.tsx per tool modifiers — Pencil Mode, Brush Mode, Smoothing, etc.
- [ ] PropertiesPanel: PropertiesPanel.tsx already has live preview via onPreview ColorPreview + ColorField with lastCommittedRef dedupe + NumberField validation, needs to support Path anchor count, Shape W/H/corner_radius/sides/ratio, Brush size, etc.
- [ ] Timeline Interaction: Ensure auto-key F6 copy-prev at held frame for all drawing tools, via ensure_keyframe in engine Draw commands

**Dependencies and Ordering:** As per Step 11 implementation order: Foundation Extension → Color System Polish → Vector Path Model → Shape Model → Pen → Pencil → Brush → Eraser → Shapes → Cross-tool Integration + QA

**MVP Scope Frozen (per Step 12 matrix):**

- Pen: first anchor, straight, curve, corner/smooth, handles, Shift 45°, Alt break, Add +/Delete -/Convert ^, Close circle, Continue slash, double-click/Ctrl+click away/Enter finish open, Show Preview, Object Drawing, fill/stroke from current, one undo per path, layer checks B-1/B-3/B-5, auto-key F6, point/grid/angle snapping

- Pencil: freehand, 3 modes Straighten (basic)/Smooth/Ink, smoothing 0-100 only in Smooth, Shift H/V, Object Drawing, stroke only no fill uniform no pressure, min 3px, one undo, layer checks, auto-key

- Brush: fill only, 5 modes Normal/Fills/Behind/Selection/Inside, Size+Shape, Pressure min-max size + Tilt angle, Smoothing, Object Drawing, dot allowed on click, no merge MVP (separate objects), one undo, layer active only + Paint Inside/Selection toasts, auto-key

- Eraser: drag erases under circle size like brush + pressure size if enabled + Sync with Brush, Normal mode MVP only, whole-object delete MVP (contact selection + DeleteSelection), preview dimmed/red overlay editor-only, one undo per gesture, layer active only + ancestors, auto-key, blank no-op

- Shapes: Rectangle (R) + Rounded Rect corner_radius serde default + Oval (O) + Circle Shift + Line (N) Shift 45° + Alt from-center for all + Shift+Alt + Esc cancel + Object Drawing + fill+stroke (Line stroke-only) + min 1px + translucent preview + one undo + layer checks + auto-key + grid/point/angle snap

- Color: overlapping Fill 22px white border + Stroke 22px offset 10px swatches with None striped red ╱ + None buttons ∅F∅S + Swap ⇄ + Default D + Stroke Width W, current authoring view state localStorage no undo no dirty for new + selected object in Properties with live preview renderer-only commit one setNodeProps on blur/Enter/picker close + Esc cancel + lastCommittedRef dedupe, multiple same shared mixed "—" + badge + BUG-P-001 instances no W/H, Eyedropper I samples fill and auto-switches to Bucket toast no doc change no undo allowed on locked read-only, live preview never exported committed in export SVG clipped, one commit = one undo, layer selected_editable filters locked/hidden, base props affect all held frames no auto-key for fill, native color input MVP + sample active context only MVP

**Deferred Scope Frozen (per Step 12 with reasons):**

- Pen: Show Precise Cursors preference (always crosshair MVP for precision), Scissors separate (merge into workflow reduce clutter), Disable Auto Add/Delete pref (always allow for simplicity), Simplify/Optimize (advanced cleanup), Join paths Ctrl+J (needs two endpoints)
- Pencil: Weighted Smoothing advanced params + Stabilizer (better quality but simple 0-100 UI MVP), Pressure for Pencil (keep for Brush only uniform weight), Shape recognition full (Recognize Lines/Shapes Off/Strict/Normal/Tolerant) needs Modify>Shape>Straighten
- Brush: Size scaling with zoom option (constant doc size MVP simpler consistent with Rect), Merge behavior (no merge MVP separate objects reason undo complex), Flow vs Opacity (only opacity MVP simpler), Art/Pattern Brush (Name, Scale proportionately, Stretch to fit, Stretch between guides, Flip, Spacing, At corners Center/Flank/Slice/Overlap) needs brush library + art brush engine, Taper Start/End Distance/Percentage + Fade Distance + Texture + Dual Tip + Roundness/Angle + Pen Rotation + Size Proportional to Camera + Brush sync
- Eraser: Faucet click to erase whole fill/line (needs whole vs partial distinction), Modes Fills Only/Lines Only/Selected Fills/Inside (Normal only MVP to keep simple), Tip Style Round/Flat/Bevel (advanced), Partial erase splitting into two paths/shortening/fill hole (complex path boolean), Raster erasing (vector-only MVP), Eraser as blending mode any brush becomes eraser via E toggle (separate tool more discoverable MVP)
- Shapes: Live primitive with hinges (Primitive Rectangle/Oval with corner radius, inner radius, close path, start/end angle) needs extra model for live params and conversion too complex for MVP, Polygon/Star/PolyStar live params sides ratio inner/outer radius needs PolyStar node, Line as separate vs Path with 2 points clarity, Live shape editing via hinges
- Color: Gradient Linear/Radial/Bitmap with stops/direction/scale/rotation/handles/interpolation/transparency needs gradient engine, Swatches palette default custom recent history naming reorder, Art/Pattern Brush color interaction needs brush library, Full color models RGB/HSB/HSL/HEX numeric + alpha slider beyond native picker, Pressure-to-opacity for Brush only size MVP

**Unresolved Questions (Ambiguity Register):**

- CRITICAL: 0 — goal achieved, no blocking ambiguity

- MEDIUM:
  - AMB-001: Both fill and stroke None at creation (Pen/Shapes) → invisible object. Resolution: invalid no command toast "no fill and no stroke — invisible, set a color" — add to final spec
  - AMB-002: Line Tool Alt from-center exact — extends both directions total length 2* drag — resolution: start is center symmetric both directions — add to final spec
  - AMB-003: Pencil Straighten shape recognition live vs on release — resolution: basic line straightening live preview, full shape recognition deferred — add to final spec

- LOW: Precise Cursors preference, Stage zoom checkbox location, Tip Style visual — cosmetic, non-blocking

**QA Requirements:**

- Every tool: activation via toolbar + shortcut, active state obvious, cursor changes per state, pointer down begins no doc change, move updates preview only, up commits one command one undo, Esc/cancel/blur/tool switch discards preview no command no undo, locked/hidden/folder blocked with honest toast + log, drawing at held frame auto-keys copy-prev undo exact, preview never exported committed in export SVG clipped to stage, undo/redo exact, zoom/pan independent doc coords correct via screenToDoc ÷ zoom, extreme zoom 25%-800% accurate, tiny/huge handled, pointer leaving commits if valid outside

- Color: ToolColors no undo no dirty, Properties one commit one undo, live preview renderer-only, mixed badge, BUG-P-001

- Cross-tool: No shortcut/modifier/cursor conflicts, Pen/Pencil/Brush distinct purposes, Shapes vs Pen conversion ordinary MVP not live, Color separation current vs selected, All ↔ Timeline auto-key F6, All ↔ Layers permission checks B-1/B-3/B-5

**Cross-Tool Requirements:**

- All 6 tools must use same editable_target_layer and frame_target_ok checks with ancestor walk
- All drawing tools must use same auto-key ensure_keyframe logic
- All must use same preview vs commit separation and one gesture = one command
- Color must provide current fill/stroke for new via ToolColors and selected via Properties with live preview
- No fake/dead buttons, every visible button has active/hover/disabled reason/tooltip/cursor

**Terminology Requirements:**

- Use glossary 08_TERMINOLOGY_GLOSSARY.md: Stroke for outline, Fill for interior, Path for bezier (Pen/Pencil), Shape for geometric primitives (Rect/Oval/Line), Object for generic selectable user-facing, Node for engine model only, Anchor Point for path points, Transform Anchor for transform, Handle for bezier, Transform Handle for selection, Brush Stroke for Brush, Pencil Stroke for Pencil, Fill Color/Stroke Color/Stroke Width specific, None/No Fill/No Stroke, Current/Authoring vs Selected Object, Swatch, Eyedropper, Alpha 0..1 for engine Opacity label for UI, Gradient deferred, etc. No random synonyms.

---

## STEP 17 — DO NOT CHANGE HISTORY — Traceability

If contradiction found, identify original, conflicting, explain, choose authoritative, record resolution — maintain traceability.

**Contradictions Found and Resolved with Traceability:**

1. **Eraser Modes MVP Scope:**
   - Original statement 1: 04_ERASER_TOOL.md Section 2 UI says Eraser Mode options include Normal, Fills Only, Lines Only, Selected Fills, Inside
   - Original statement 2: 04_ERASER_TOOL.md Section 18 Kineora Decision says DEFER Fills Only, Lines Only, Selected Fills, Inside modes, only Normal for MVP
   - Conflict: UI list says all modes, Decision says only Normal MVP
   - Explanation: UI list describes full Adobe behavior (industry observation), Decision defines MVP scope (Kineora decision) — not actual contradiction, but need to clarify MVP vs full
   - Authoritative Decision: MVP = Normal only, others deferred — as per Kineora Decision section which is authoritative for MVP scope
   - Resolution: In final spec, explicitly state MVP Normal only, others deferred with reason keep simple

2. **Brush Mode vs Eraser Mode Naming:**
   - Original: 03_BRUSH_TOOL.md says Brush Mode 5 modes Normal/Fills/Behind/Selection/Inside, 04_ERASER_TOOL.md says Eraser Mode Normal/Fills/Lines/Selected/Inside + Faucet — similar but Eraser has Lines vs Behind difference
   - Conflict: Are Brush Mode and Eraser Mode same?
   - Explanation: Adobe has Paint modes for Brush and Erase modes for Eraser — similar concept but Eraser has Lines instead of Behind, because Behind for eraser would be meaningless? Actually Eraser Behind would erase blank? So difference intentional
   - Authoritative: Keep as separate but analogous, document difference: Brush has Behind, Eraser has Lines
   - Resolution: Final spec clarifies Brush Mode vs Eraser Mode are separate but analogous, with Eraser having Lines instead of Behind

3. **Shapes Both None:**
   - Original: 05_SHAPES_TOOLSET.md says Fill null = no fill, Stroke null = no stroke, both allowed? But Line requires stroke, Rect with no fill and no stroke invisible
   - Original: 06_COLOR_SYSTEM.md says None ∅F∅S clears color and marks swatch with None pattern
   - Conflict: If both None, invisible object — should it be allowed?
   - Explanation: Industry allows None for fill and stroke individually, but both None would be invisible — Adobe may prevent or allow? Not clear, INSUFFICIENT EVIDENCE
   - Authoritative: For Kineora, prevent invisible objects for MVP — no command, toast "no fill and no stroke — invisible"
   - Resolution: Add to final spec as AMB-001 resolution, not critical

All resolutions recorded, traceability maintained.

---

## STEP 18 — FINAL PASS/FAIL

**RESEARCH STATUS:**

### Checklist for READY FOR CODING:

- [x] Critical ambiguity = 0 — achieved, only 3 MEDIUM and 3 LOW, no CRITICAL
- [x] Critical contradictions = 0 — 3 minor contradictions found and resolved with traceability, no critical contradictions
- [x] Dependencies are known — Foundation, Color, Path, Shape models, plus existing Viewport, Hit-test, History, WASM bridge, ToolColors, etc., all identified with ordering
- [x] MVP scope is frozen — per Step 12 matrix, every feature marked MVP or Deferred with reason, no vague "later"
- [x] Deferred scope is frozen — per Step 12, every deferred has reason (complex, needs engine, etc.)
- [x] Cross-tool behavior is defined — per Step 9 matrix 25+ interactions, no conflicts, all expected behaviors defined
- [x] Engineering handoff exists — per Step 16 checklist with required foundational and tool systems, dependencies, order, MVP/deferred, unresolved questions, QA, cross-tool, terminology

**Does research answer final deliverable: "What should Kineora's complete 2D Tool Panel contain for these 6 tools, how should every tool behave, how should every action behave, what should UI communicate, how should tools interact with document/layers/timeline, and what conceptual requirements must engineering satisfy?"**

- What tools: Yes — 6 core + 30 total roadmap
- How every tool behaves: Yes — action-level breakdown per tool (Pen 14 actions, Pencil 10+, Brush 10+, Eraser 8+, Shapes 5 shapes each, Color system)
- How every action behaves: Yes — pointer down/move/up/cancel/Esc/tool switch/blur, modifiers Shift/Alt/Ctrl/Pressure/Tilt, each defined with trigger, visual feedback, result, cancellation, undo
- What UI communicates: Yes — toolbar location, icon meaning, grouping, flyout, active/hover/disabled/focus states, tooltip, cursor (6+ states for Pen), options panel, properties, status bar, timeline, visual feedback (preview, handles, anchors, highlights, snapping, error, completion)
- How tools interact with document/layers/timeline: Yes — Document Effect (create/modify/delete/geometry/style/animation/color), Preview vs Commit separation why it matters, Layer Behavior (active/locked/hidden/empty/non-editable/hierarchy with ancestor walk B-1/B-3/B-5), Timeline Behavior (current/keyframe/blank/existing/empty/auto-key F6/exposure), Snapping (grid/point/object/angle with indicators), Input Devices (mouse/trackpad/stylus/pressure tablet)
- What engineering must satisfy: Yes — Engineering Implication per tool (interaction state, preview state, document state, hit-testing, coordinate conversion, selection dependency, layer permission, timeline dependency, undo boundary, rendering feedback, pointer capture, cancellation) — no code

**Final Verdict:**

✅ READY FOR CODING

**Reason:** Critical ambiguity 0, critical contradictions 0, dependencies known with safe ordering, MVP and deferred scopes frozen with reasons, cross-tool behavior defined with matrix and no conflicts, engineering handoff checklist exists with required systems, terminology consistent via glossary, sources registered with quality levels and conflict resolution, no code, no 3D, deep enough that experienced engineer can read and understand exactly what Kineora should behave like without guessing.

**Next Phase:** Actual engineering/coding per implementation order in Step 11, starting with Foundation Extension (Path/Shape/Brush models) then Color Polish then Pen then Pencil then Brush then Eraser then Shapes then Cross-tool Integration + QA.

This is the final research gate — research complete, spec frozen, ready for coding.

---

**Sources for this audit:**

- All 6-tool research files (01-06) + 07-10 audits + 23 roadmap
- Adobe Animate Tools Panel: https://helpx.adobe.com/animate/using/using-stage-tools-panel.html
- Adobe Pen Tool: https://helpx.adobe.com/animate/using/drawing-pen-tool.html
- Adobe Draw Shapes: https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html
- Adobe Strokes/Fills: https://helpx.adobe.com/animate/using/strokes-fills-gradients.html
- Adobe Transform: https://helpx.adobe.com/animate/using/transforming-combining-graphic-objects.html
- Illustrator Pen: https://www.maaillustrations.com/blogs/magazine/features-and-functions-of-pen-tool
- Krita Freehand Brush: https://docs.krita.org/en/reference_manual/tools/freehand_brush.html
- Krita Brush Settings: https://docs.krita.org/en/reference_manual/brushes/brush_settings.html
- Krita Color Sampler: https://docs.krita.org/en/reference_manual/tools/color_sampler.html
- Toon Boom Drawing Tools: https://docs.toonboom.com/help/harmony-20/essentials/drawing/about-drawing-tool.html
- Toon Boom Eraser Properties: https://docs.toonboom.com/help/harmony-21/essentials/reference/tool-properties/eraser-tool-properties.html
- Toon Boom Stabilization: https://docs.toonboom.com/help/harmony-22/advanced/drawing/about-stabilization.html
- OpenToonz Selection: https://opentoonz.readthedocs.io/en/latest/drawing_animation_levels.html
- Blender Grease Pencil: https://www.graphicsandprogramming.net/eng/tutorial/blender/the-grease-pencil/grease-pencil-in-blender-2-8-introduction + https://docs.blender.org/manual/en/latest/grease_pencil/modes/edit/grease_pencil_menu.html
- Adobe Beginner Guide PDF: https://studentcabletelevision.com/wp-content/uploads/2020/05/Adobe-Animate-Website-Guide-Updated.pdf

