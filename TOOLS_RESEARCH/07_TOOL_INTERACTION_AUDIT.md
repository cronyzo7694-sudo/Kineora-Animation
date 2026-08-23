# TOOL INTERACTION AUDIT — 6 Core Tools (Pen, Pencil, Brush, Eraser, Shapes, Color)

> No Code, 2D Only. Cross-system interactions.

## Purpose

After researching 6 tools individually, audit how they interact with each other, with Color System, with Layers, with Timeline, to ensure consistent behavior and no conflicts.

## 1. PEN ↔ COLOR

[INDUSTRY] Adobe: Pen creates paths using Stroke Color and Fill Color from Tools panel. Fill None = no fill, Stroke None = no stroke. Path closing does not auto-apply fill, fill applied separately.

[KINEORA] Pen ↔ Color:
- **Current Style:** When Pen creates new path, it uses current fill/stroke from ToolColors (view state). Fill null = path with no fill (open or closed), Stroke null = no stroke (invisible unless fill).
- **Path Closing:** Closing path does not change fill/stroke, uses current at creation.
- **Existing Path Styling:** Editing existing path geometry (move anchor) does NOT change its fill/stroke. Styling changed via PropertiesPanel setNodeProps, not Pen.
- **Preview vs Commit:** Preview uses current colors with alpha, committed uses solid.
- **Decision:** KEEP — current style for new, preserve existing style when editing geometry.

## 2. PENCIL ↔ COLOR

[INDUSTRY] Adobe: Pencil draws strokes using Stroke Color, line weight, style from Properties. Smoothing slider affects line.

[KINEORA] Pencil ↔ Color:
- **Current Stroke:** Pencil creates stroke-only (no fill) using current stroke color and width from ToolColors.
- **Fill Behavior:** Pencil does NOT create fill, even if fill color set. Fill None irrelevant. If user wants fill, use Brush or Bucket after.
- **Pressure/Opacity:** Pencil no pressure for size (Brush does), so color opacity constant.
- **Decision:** KEEP — stroke only, no fill, no pressure.

## 3. BRUSH ↔ COLOR

[INDUSTRY] Adobe: Brush paints fills using Fill Color. 5 modes affect where paint lands. Paint Brush Art/Pattern uses stroke style.

[KINEORA] Brush ↔ Color:
- **Brush Color:** Uses current fill color from ToolColors for fill shapes. Stroke ignored.
- **Opacity/Alpha:** For MVP, fill hex only, no alpha, but future opacity via alpha field. Pressure could vary opacity in future.
- **Gradient:** Art Brush can have gradient along path, but deferred. For MVP solid fill only.
- **Modes & Color:** Paint Selection mode uses current fill but only on selected fills — so color system provides fill, mode filters where.
- **Decision:** KEEP — fill only, modes filter, pressure varies size not opacity for MVP.

## 4. ERASER ↔ COLOR

[INDUSTRY] Adobe: Eraser does not affect style, only geometry. Krita: Eraser as blending mode keeps brush but erases alpha.

[KINEORA] Eraser ↔ Color:
- **Does Erasing Affect Style?** No, erasing removes content, does not change fill/stroke of remaining.
- **Vector vs Raster:** For MVP whole-object delete, no style change. For future partial erase with splitting, remaining pieces keep original fill/stroke.
- **Decision:** KEEP — erasing never modifies style.

## 5. SHAPES ↔ COLOR

[INDUSTRY] Adobe: Rectangle/Oval/Line use Fill and Stroke from Tools panel. Line uses stroke only (no fill). Primitive shapes have fill/stroke.

[KINEORA] Shapes ↔ Color:
- **Fill:** Rect/Oval/Polygon/Star use current fill (null = no fill)
- **Stroke:** Use current stroke and width (null = no stroke, except Line requires stroke)
- **Line:** Uses stroke only, fill ignored, even if fill set
- **Live Style Changes:** After shape created, changing current authoring color does NOT affect existing shape — only new shapes. Existing shape style changed via Properties.
- **Selected Object Style:** Properties shows fill/stroke of selected shape, live preview, one undo per commit.
- **Decision:** KEEP — fill+stroke for Rect/Oval, stroke-only for Line, current style for new, Properties for existing.

## 6. ALL SIX ↔ TIMELINE

[INDUSTRY] Adobe Animate: All drawing tools create content at current frame on active layer. If at held frame, auto-key (F6 copy-prev). Timeline duration extends.

[KINEORA] All Six ↔ Timeline:
- **Current Frame:** All create at playhead on active layer
- **Keyframe:** If content keyframe at playhead, add to its content. If held frame (no keyframe but previous content held), auto-create keyframe copying previous content (F6 semantics), then add new content. This preserves existing animation.
- **Blank Frame:** Blank keyframe has empty content — drawing at blank should convert blank to content keyframe with new content? Actually F7 blank is empty, drawing at blank should create content? In Kineora DrawRect does ensure_keyframe which copies previous? For blank, it should restore pre-blank content? But for simplicity: drawing at blank creates content keyframe with new content (overwrites blank? Or adds?). For MVP, same as held: auto-key.
- **Auto-keyframe:** Only for drawing tools (Pen/Pencil/Brush/Shapes). Eraser also auto-keys when erasing at held frame (remove from new keyframe, not previous). Color changes (setNodeProps) — base props, not per-frame, so no auto-key? But transform does auto-key. For MVP, color changes affect base node, so affect all frames holding that node, no auto-key needed.
- **Frame Exposure:** New content holds until next keyframe (exposure)
- **Decision:** KEEP — all drawing tools auto-key at held frame, eraser auto-keys, color base props no auto-key.

## 7. ALL SIX ↔ LAYERS

- **Active Layer:** All tools target active layer (where new content lands, or where erase looks)
- **Locked Layer:** All mutating tools blocked if active layer locked or ancestor locked — no command, toast "layer locked", log blocked. Read-only tools (Eyedropper, Select) allowed on locked.
- **Hidden Layer:** Active layer hidden → blocked for drawing/erasing (B-5). Ancestor hidden → blocked (B-1). Hidden layers not selectable, so no color edit.
- **Folder:** Folder not draw/erase target → blocked, toast "folder — not a frame target"
- **Empty Layer:** Allowed, auto-key creates first keyframe
- **Hierarchy:** Ancestor walk for visibility/unlocked required

## 8. ALL SIX ↔ SELECTION

- **Pen:** Does not require selection to create new, but requires selection for add/delete anchor on existing path
- **Pencil/Brush/Shapes:** Do not require selection, create new regardless, selection becomes new object
- **Eraser:** Does not require selection, erases under pointer regardless
- **Color:** Properties shows colors based on selection_details, live preview for single selection

## 9. PEN ↔ PENCIL ↔ BRUSH — How They Differ

[INDUSTRY] Adobe: Pen = precision bezier, Pencil = freehand lines (stroke), Brush = freehand fills with pressure, distinct cursors and modes.

[KINEORA] Distinctions:
- **Pen:** Deliberate anchor placement, editable bezier, corner/smooth, handles, closing, for clean vector
- **Pencil:** Fast freehand stroke, smoothing, no fill, uniform width, for sketching
- **Brush:** Freehand fill painting, 5 modes, pressure varies size, for coloring/artistic
- **Decision:** KEEP three separate tools, not merged, each with distinct purpose and UI, to match industry mental model.

## 10. SHAPES ↔ PEN/PENCIL/BRUSH — Conversion

- **Live Primitive vs Ordinary Path:** Adobe Primitive Rectangle/Oval have hinges for live editing, but can be converted to ordinary path. Kineora for MVP: shapes become ordinary Path/Rect/Oval nodes after creation, not live primitive. Conversion to path later.
- **Decision:** DEFER live primitive, keep ordinary for MVP.

## 11. COLOR ↔ SELECTION ↔ PROPERTIES — Live Preview Contract

- **Current Authoring Color (ToolColors):** View state, no undo, affects new objects only
- **Selected Object Color (Properties):** Document state, one undo per commit, live preview renderer-only during edit, commit on blur/Enter/picker close, Esc cancels
- **Why Separation:** Prevents undo fragmentation, allows cancel, clean export
- **Decision:** KEEP separation, as implemented in PropertiesPanel with onPreview and lastCommittedRef.

## 12. CONFLICTS FOUND AND RESOLVED

- **Shortcut Conflicts:** Pen P, Pencil Y, Brush B, Eraser E, Rect R, Oval O, Line N, Text T, Hand H, Zoom Z, Eyedropper I, Bucket K, Ink S — all distinct, no conflict. Width Shift+W distinct.
- **Modifier Conflicts:** Pen uses Shift 45° + Alt break, Rect/Oval/Line use Shift square/circle/45° + Alt from-center — consistent, no conflict. Pencil uses Shift H/V only, Brush uses no Shift/Alt — consistent.
- **Cursor Conflicts:** Each tool has distinct cursor (arrow, crosshair, pen, pencil, brush circle, eraser circle, hand grab, zoom) — no conflict.
- **Layer Conflicts:** All use same editable_target_layer check — consistent.
- **Timeline Conflicts:** All use same auto-key F6 semantics — consistent.
- **Undo Conflicts:** All use one gesture = one command — consistent.

## 13. KINEORA DECISIONS SUMMARY

- KEEP all 6 systems with distinct purposes, no merging
- KEEP color separation (authoring vs selected)
- KEEP layer permission checks (visible/unlocked/not folder + ancestors)
- KEEP timeline auto-key for drawing/erasing at held frame
- KEEP preview vs commit separation for all
- KEEP one undo per completed gesture
- DEFER live primitive, art/pattern brush, gradient, swatches palette, partial erase splitting

## 14. ACCEPTANCE CRITERIA FOR INTERACTIONS

- Pen creates new path using current fill/stroke, editing existing path preserves its style
- Pencil creates stroke-only using current stroke, no fill, no pressure
- Brush paints fill using current fill, respects 5 modes, pressure varies size
- Eraser removes content without affecting style of remaining
- Shapes use current fill+stroke (Line stroke-only), new shapes use current, existing via Properties
- All drawing/erasing at held frame auto-keys copy-prev, undo exact
- All blocked on locked/hidden/folder active layer or ancestor, with honest toast
- Color live preview renderer-only, commit one undo, Esc cancels
- Tool switch discards in-progress preview of previous tool, no command
- No shortcut/modifier/cursor conflicts across 6 tools
