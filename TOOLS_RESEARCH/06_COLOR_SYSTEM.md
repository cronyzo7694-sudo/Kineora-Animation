# COLOR SYSTEM — Deep Research (2D Fill/Stroke/Color Authoring)

> No Code, 2D Only. System, not just picker.

## 1. PURPOSE

[INDUSTRY] Adobe Animate: "The Stroke Color and Fill Color controls in the Tools panel, or the Property inspector" [helpx strokes]. Colors area has reset to default, None, swap [helpx]. Eyedropper samples color and auto-switches to Bucket/Ink Bottle.

[INDUSTRY] Krita: Color Sampler Tool (P) — sample from all layers or active layer, Radius averaging, Blend %, Info Box, Ctrl quick access from brush [docs.krita.org color sampler]. Colors stored as numbers, blending modes (Multiply, Addition, Erase).

[INDUSTRY] Toon Boom: Colour Eyedropper, Pencil Texture Eyedropper [Toon Boom]

[KINEORA] Color System exists to manage authoring style (current fill/stroke for new objects) and selected object style (properties of selection). It must distinguish current tool style vs selected object style, support sampling, swatches, gradients, alpha, and honest handling of mixed colors.

Use Color: Set fill/stroke for new drawings, change selected objects' fill/stroke, sample existing colors.

Not Color: Transform, selection, etc.

Dependencies: ToolColors, ToolOptions, PropertiesPanel, Stage preview, Engine setNodeProps, setDocumentSettings (background), Layer outline color.

## 2. UI

- **Toolbar Colors Area:** Located below View area, above Options area in Tools panel (Adobe 4 sections) [helpx stage].
  - **Fill Swatch:** 22x22px overlapping, top-left, white border, shows current fill color or None pattern (striped red with ╱)
  - **Stroke Swatch:** 22x22px overlapping, bottom-right offset 10px, shows current stroke color or None
  - **None Buttons:** ∅F and ∅S mini buttons — set fill/stroke to None (transparent/no stroke)
  - **Swap Button:** ⇄ — swaps fill and stroke
  - **Default Button:** D or ⭯ — reset to black stroke, white fill (Adobe default)
  - **Stroke Width:** W label + number input (0+)
  - **Vertical vs Horizontal:** Vertical in ToolsPanel (column), horizontal in toolbar (row)

- **Options Area:** For Paint Bucket, Ink Bottle, etc., may show Gap Size, etc., but colors area is always visible.

- **Properties Panel:**
  - When no selection: Document background color field (ColorField)
  - When single object selected: Fill color, Stroke Enabled checkbox, Stroke color (if enabled), Stroke width
  - When multiple selection with same color: shows shared color; if mixed colors, shows placeholder "—" or "mixed" badge
  - Live preview: while editing color field, preview updates renderer-only (colorPreview), no engine write until commit (blur/Enter/picker close)

- **Color Picker:** Native <input type="color"> for MVP, but future needs wheel, RGB, HSB, HEX, alpha slider

- **Eyedropper Tool:** Samples color from canvas. UI: crosshair cursor, preview of sampled color? In Adobe, Eyedropper click copies fill, then auto-switches to Bucket.

- **Swatches Panel:** Future — default palette, custom, recent colors, saved swatches

- **Gradient Editor:** Future — linear/radial, stops, direction, etc.

- **Tooltip:** Fill swatch tooltip "Fill color — #ffffff (click to pick)", Stroke "Stroke color — #000000", None "Fill: no color", Swap "Swap fill and stroke (X)", Default "Default colors — black stroke, white fill (D)"

- **Cursor:** Default, eyedropper crosshair with preview

## 3. ACTIVATION

- **Colors Area Activation:** Always visible in Tools panel, not a tool itself. Clicking fill/stroke swatch opens color picker (native). Picking updates toolColors state (session view state, not document), emits toolColors:changed via bus? Actually ToolColors subscribes to toolColors prefs.

- **Eyedropper Tool Activation:** Toolbar click or I shortcut → setTool('eyedropper'), cursor crosshair, status "eyedropper"

- **Properties Color Fields Activation:** When object selected, Properties shows color fields. Clicking opens picker, live preview on input, commit on blur/Enter/change.

- **Tool Switch:** Colors area persists across tool switches (current authoring color is global, not per-tool, except maybe? In Adobe, fill/stroke are global). So switching from Rect to Brush keeps same fill.

- **State Persistence:** Current fill/stroke/width stored in localStorage via toolColors.ts (loadToolColors, setToolColors, subscribe), session view state, not document. Survives reload.

- **State Reset:** Reset button → default colors (fill #ffffff, stroke #000000, width 1)

## 4. POINTER / INPUT LIFECYCLE — For Eyedropper and Color Picking

**Eyedropper Pointer Down:** Hit-test at doc position via selectAt? Actually eyedropper should sample color of object under pointer, not select? In Kineora current Stage.tsx, eyedropper does selectAt then gets selection_details[0] fill/stroke. So down selects object under pointer and copies its colors to toolColors, then auto-switches to Bucket.

**Pointer Move:** For Eyedropper, maybe no drag, only click. For color picker input, drag in picker updates live preview.

**Pointer Up:** For Eyedropper, commit sampled colors to toolColors (no document change, no undo), notify "picked up #color → Paint Bucket", and onToolChange('bucket') auto-switch.

**Cancel:** Esc cancels color picker? For native input, Esc may cancel? For Eyedropper, Esc does nothing, or clears? Actually Esc should not affect eyedropper.

**Escape:** For Properties color field, Esc cancels edit, reverts draft to original value, clears preview.

**Tool Switch:** If switching away from Eyedropper during sampling, discard? No doc change anyway.

**Window Blur:** No effect for color system (view state)

## 5. MODIFIER KEYS

- **For Eyedropper:** No Shift/Alt? In Adobe, Eyedropper click fill → Bucket, click stroke → Ink Bottle. So modifier could distinguish? Actually Adobe: Eyedropper samples both? Kineora current: picks fill and switches to Bucket. Could have Shift to pick stroke? But not documented. So for MVP, no modifiers for Eyedropper.

- **For Color Picker:** No modifiers

- **For Swap/Default:** No modifiers, but keyboard shortcuts: D = default colors, X = swap (Adobe Illustrator shortcuts) — could be added later

## 6. CURSOR

- **Fill/Stroke Swatch Hover:** Pointer cursor (hand) indicating clickable
- **Eyedropper Tool:** Eyedropper icon (pipette) or crosshair with small color preview
- **Over locked layer with Eyedropper:** Still allowed? Eyedropper is read-only, so allowed even on locked layers (like copy). So cursor still eyedropper, not not-allowed.
- **Color Picker Input:** Default

## 7. VISUAL FEEDBACK

- **Fill/Stroke Swatches:** Show current color, or None pattern (red ╱ with striped background) when null. Overlapping visual (fill behind, stroke front offset) like Adobe.
- **Live Preview:** While editing Properties color field, Stage shows live preview of object with new fill/stroke (renderer-only, colorPreview), without writing engine. This is per Part 26.12 "color controls live" + C-09 "live preview; commit on release"
- **None State:** When fill=None, swatch shows transparent with red slash, and object has no fill (only stroke). When stroke=None, no outline.
- **Mixed Colors:** When multiple objects selected with different fills, Properties fill field shows placeholder "—" or "mixed" badge, not a color. Fill swatch in Tools panel still shows current authoring color, not selection.
- **Sampling Feedback:** When Eyedropper picks color, toast shows "picked up #color → Paint Bucket", and ToolColors swatches update instantly.
- **Error:** Invalid color? Native color input only allows valid hex, so no invalid. For custom picker later, invalid hex shows error and reverts.

## 8. DOCUMENT EFFECT

- **Creates Content?** No, color system itself does not create, but it affects what new objects will look like (current authoring color)
- **Modifies Content?** Yes, when user commits fill/stroke change in PropertiesPanel via setNodeProps — modifies selected objects' fill/stroke/width at current frame, one undoable command
- **Deletes?** No, but setting fill to None removes fill visually, setting stroke_enabled false removes stroke
- **Modifies Geometry?** No
- **Modifies Style?** Yes, fill, stroke, stroke_width, background color (document settings)
- **Modifies Animation?** No, but style changes are at current frame, with auto-key if at held frame? Actually setNodeProps may auto-key? In Session, set_node_props is transform? Need to check — it should auto-key like other edits.
- **Modifies Color?** Yes

## 9. PREVIEW VS COMMIT

**Temporary (Preview):**

- Current authoring color in ToolColors is view state, not document, until used to draw new object
- Live preview in Properties: while typing color or dragging picker, onPreview callback sends ColorPreview { item: { id, fill } } to Stage, which renders displayItems with preview fill/stroke without writing engine. This is renderer-only, cleared on commit/cancel/unmount.

**Committed:**

- When new object drawn (Rect, Brush, etc.), it uses current fill/stroke from toolColors at that moment — creates node with that fill/stroke, committed via Draw command
- When Properties color committed (blur/Enter/picker close), one setNodeProps command with fill/stroke/width, emits document:changed, creates undo entry

Why separation: Prevents undo fragmentation (many preview updates would create many undo entries if written each time), allows Esc cancel, allows live feedback without dirtying document until commit, matches Adobe "color controls live"

## 10. UNDO / REDO

- **What Creates Undo:** One committed color change in Properties (fill, stroke, width, background) = one undo entry. Drawing new object with current color = one entry (Draw command).
- **What Does Not:** Changing current authoring color in ToolColors (fill/stroke swatch) — no undo, no dirty, view state only. Live preview while editing — no undo. Sampling with Eyedropper — no undo (read-only). Failed (locked layer) — no undo.
- **Gesture Boundaries:** One color field commit (blur/Enter) = one undo, even if user typed many chars. Idempotent dedupe via lastCommittedRef in ColorField.
- **Cancelled:** Esc in Properties color field → no undo, reverts draft, clears preview
- **Failed:** Locked layer → setNodeProps blocked? Actually engine may block if layer locked? Then no command, no undo, toast.

## 11. LAYER BEHAVIOR

- **Active Layer:** For new objects, active layer must be editable (Normal, visible, unlocked, ancestors visible/unlocked) — else draw blocked
- **Locked Layer:** If trying to change fill/stroke of object on locked layer, what happens? selected_editable() filters to only visible+unlocked layers at playhead. So locked layer objects are not editable, commit does nothing? Actually setNodeProps with ids from locked layer should be blocked at engine? In Session, selected_editable filters, so locked objects not in editable list, so delete/move blocked. For setNodeProps, does it check locked? It should, but currently apply_node_props is no-op for instances, but for rects on locked layer, does it block? Need to check — but for MVP, Properties commit should be blocked if any selected object is on locked layer, toast "layer locked"
- **Hidden Layer:** Hidden layer objects not selectable (hit-test skips hidden), so Properties won't show them. So no color edit on hidden.
- **Empty Layer:** No objects, so Properties shows Document background, not object colors
- **Non-editable (Folder):** Folder has no content, so no object color, only Document

## 12. TIMELINE BEHAVIOR

- **Current Frame:** Color changes affect current frame's content (transform override at playhead)
- **Keyframe:** If at content keyframe, color change modifies that keyframe's node props? Actually Node props (fill/stroke) are base props, not per-frame transform? In Kineora model, fill/stroke are base node props, not per-frame? But setNodeProps may affect base? Need to check — but for animation, fill/stroke changes should be per-frame? Or base? In Adobe, fill/stroke can be per-keyframe? Actually in Animate, fill/stroke are per object, not per frame, but if you have tween, color can tween? For MVP, color changes affect base node, so all frames where that node appears get new color (since content_at returns same node id across held frames). So timeline: color change at any frame affects all frames holding that node.
- **Blank Frame:** No content, so no object color to edit
- **Auto-keyframe:** Does color change auto-key? For transform, patch_transforms auto-keys at held frame. For base props like fill, does it auto-key? Probably not, since fill is base, not per-frame. So no auto-key for fill/stroke, but transform (x/y) does auto-key.
- **Frame Exposure:** Color change persists across held span because node id same

## 13. SNAPPING

- Color system does NOT involve snapping — no grid/point snap for colors
- So no snapping

## 14. INPUT DEVICES

- **Mouse:** Click swatch opens native color picker, pick color, commit on close/blur
- **Trackpad:** Same
- **Stylus:** Same, no pressure for color picking
- **Pressure Tablet:** No pressure for color, but Wacom may have color picker via pen button (Krita: Ctrl for sampler). For Kineora, could have Ctrl quick access to Eyedropper from any paint tool (like Krita: Ctrl for sampler). But for MVP, Eyedropper is separate tool.

## 15. EDGE CASES

- **Empty Canvas:** No objects, ToolColors shows current authoring color (default white fill, black stroke), Properties shows Document background
- **No Selection:** Properties shows Document, not object colors. ToolColors still shows authoring colors.
- **Existing Object:** Single selection shows its fill/stroke in Properties, live preview works
- **Overlapping Objects:** Each has its own fill, Properties shows mixed if different
- **Multiple Selection Same Color:** Properties shows shared color
- **Multiple Selection Mixed Colors:** Properties fill field shows "—" placeholder, mixed badge, common fields only (BUG-P-001: instances have no W/H)
- **Locked Layer:** Object on locked layer not selectable, so no color edit. If somehow selected (e.g., via undo), setNodeProps should block or be no-op, toast.
- **Hidden Layer:** Not selectable, no color edit
- **Empty Frame:** No object colors
- **Extreme Zoom:** Color picking via Eyedropper uses doc coords via hit-test, so zoom independent
- **Tiny Object:** Still selectable and color editable, hit tolerance helps
- **Huge Object:** Same
- **Pointer Leaving Canvas:** Color picker is native input, not canvas pointer, so leaving canvas during picker does not affect. Eyedropper leaving canvas: if pointer leaves, no sampling, no command.
- **Escape During Operation:** In Properties color field, Esc cancels edit, reverts draft, clears preview, no command
- **Tool Switch During Operation:** If editing color field and switching tool, commit or cancel? In Kineora, ColorField useEffect cleanup clears preview on unmount, but does it commit? It should commit on blur before unmount? Actually blur commits, then unmount clears preview. So tool switch during color edit should commit? Or cancel? For MVP, commit on blur, so tool switch (which blurs input) commits.
- **Window Losing Focus:** Color picker may stay open? Native picker may close? For Properties, blur commits, so losing focus commits.
- **Invalid Operation:** Setting fill to same color → no command, no undo (before==after check)
- **Cancelled Operation:** Esc → no command

## 16. ENGINEERING IMPLICATION

- **Interaction State:** ToolColors state { fill: string|null, stroke: string|null, strokeWidth: number } stored in localStorage, managed via toolColors.ts with load/set/subscribe
- **Preview State:** ColorPreview { background?, item?: { id, fill?, stroke?, strokeWidth? } } sent via onPreview callback to Stage, rendered as displayItems with preview colors, not in document
- **Document State:** Node { fill, stroke, stroke_width } base props, and Transform for x/y, stored in Document.nodes, modified via SetNodeProps command
- **Hit-testing:** For Eyedropper, need selectAt to find object under pointer, then selection_details to get its fill/stroke
- **Coordinate Conversion:** Eyedropper uses screenToDoc via viewport
- **Selection Dependency:** Properties shows colors based on selection_details from statusJson(), filtered for baseEditable (non-instances for W/H)
- **Layer Permission:** selected_editable() checks layer effective visible/unlocked, so locked objects not editable
- **Timeline Dependency:** playhead for hit-test and transform, but fill is base not per-frame
- **Undo Boundary:** One Properties color commit = one SetNodeProps command, one undo entry. ToolColors changes = no undo.
- **Rendering Feedback:** canvasRenderer render uses items with fill/stroke, plus colorPreview overlay
- **Pointer Capture:** For Eyedropper, no need for capture? Actually Stage onMouseDown handles eyedropper and does selectAt, no drag.
- **Cancellation:** ColorField has lastCommittedRef to dedupe, onNativeChange for picker close, onBlur commit, onKeyDown Esc cancel, useEffect cleanup clears preview

## 17. CROSS-SOFTWARE COMPARISON

| Behavior | Animate | Illustrator | Krita | Toon Boom | OpenToonz | Kineora |
|----------|---------|-------------|-------|-----------|-----------|---------|
| Fill/Stroke swatches overlapping | Yes [helpx strokes] | Yes (foreground/background) | Yes (foreground/background + pattern) | Yes | — | KEEP — overlapping 22px with offset |
| None (transparent/no stroke) | Yes (None button, ∅) [helpx] | Yes (None) | Yes (None) | — | — | KEEP — ∅F ∅S with striped pattern |
| Swap fill/stroke (X) | Yes [helpx] | Yes (X) | Yes (X) | — | — | KEEP — ⇄ button |
| Default black/white (D) | Yes [helpx] | Yes (D) | Yes (D) | — | — | KEEP — D button |
| Current authoring color vs selected object | Yes — Tools panel colors = new objects, Properties = selected [helpx] | Yes | Yes (preset vs tool opacity) [Krita basic] | — | — | KEEP — ToolColors = new, Properties = selected |
| Eyedropper samples and auto-switches to Bucket/Ink | Yes [Adobe Guide] | Yes (I) | Yes (P for sampler, Ctrl quick) [Krita] | Yes (Colour Eyedropper) | — | KEEP — I samples fill and switches to Bucket |
| Sample from all layers vs active layer | — | — | Yes (all vs active, Radius, Blend %) [Krita color sampler] | — | — | MODIFY — for MVP sample from active edit context only, all-layers later |
| Live preview while editing color | Yes (Property inspector live) | Yes | Yes (live preview system) [Krita brush settings] | — | — | KEEP — onPreview renderer-only, commit on release |
| One undo per color commit, not per preview | Yes (one per gesture) | Yes | — | — | — | KEEP — lastCommittedRef dedupe |
| Gradient support | Yes (Linear/Radial/Bitmap) [helpx] | Yes | Yes (Gradient) | — | — | DEFER — solid only for MVP, gradient later |
| Swatches palette, recent, history | Yes (Swatches panel) | Yes | Yes (Palette, recent) | — | — | DEFER — default + custom later |
| Alpha/Opacity | Yes (alpha) | Yes | Yes (Opacity/Flow) | Yes (Flow/Opacity) [Toon Boom] | — | KEEP — background_alpha, stroke alpha via color? For MVP fill hex only, alpha via background_alpha field |

## 18. KINEORA DECISION

- KEEP: Overlapping fill/stroke swatches with None (∅F ∅S striped), Swap (⇄), Default (D), Stroke Width W, Fill for new objects from ToolColors (view state, localStorage), Stroke for new objects, Eyedropper (I) samples fill/stroke and auto-switches to Bucket, Properties shows fill/stroke for single selection with live preview (renderer-only, commit on blur/Enter/picker close), one undo per commit, layer checks via selected_editable, mixed colors shows "—" and badge, BUG-P-001 (instances no W/H).

- MODIFY:
  - Sample behavior: For MVP, Eyedropper samples from active edit context only (topmost hit at doc position), not all layers merged. Reason: simpler, matches Kineora's active layer model. All-layers merged sampling (Krita) later.
  - Color picker: Use native <input type="color"> for MVP, not full wheel/RGB/HSB/HEX/alpha. Reason: native is accessible, no extra dependency, sufficient for solid colors. Full picker later.
  - Alpha: For MVP, fill hex only (no alpha in fill), but background has background_alpha field. Stroke alpha via stroke color? Actually stroke hex only. Alpha for fills/strokes via separate opacity field later.

- REJECT: None

- DEFER:
  - Gradient (Linear/Radial/Bitmap) — needs gradient stops, direction, etc.
  - Swatches palette (default, custom, recent, history, naming, reorder)
  - Art/Pattern Brush color interaction (brush color vs fill)
  - Full color models (RGB, HSB/HSL, HEX numeric, alpha slider) beyond native picker
  - Pressure-to-opacity for Brush (only size for MVP)

## 19. ACCEPTANCE CRITERIA

- ToolColors shows overlapping fill (22px white border) and stroke (22px offset 10px) swatches, with None pattern (red ╱ striped) when null
- Fill swatch tooltip shows "Fill color — #ffffff (click to pick)", stroke similar
- None buttons ∅F ∅S clear color and show None pattern, with data-testid tool-fill-none-btn, tool-stroke-none-btn
- Swap button ⇄ exchanges fill and stroke, swatches follow
- Default button D resets to fill #ffffff, stroke #000000, width 1
- Stroke width input W edits strokeWidth, min 0
- Current fill/stroke/width persisted in localStorage, survives reload
- Changing ToolColors does NOT create undo entry, does NOT dirty document
- Eyedropper Tool (I) activates via toolbar and I shortcut, cursor eyedropper, status "eyedropper"
- Eyedropper click on object with fill samples fill to ToolColors, switches to Bucket tool, toast "picked up #color → Paint Bucket", no document change, no undo
- Eyedropper allowed even on locked layers (read-only)
- PropertiesPanel when no selection shows Document background color field with live preview (background preview)
- PropertiesPanel single selection shows Fill color, Stroke Enabled checkbox, Stroke color (if enabled), Stroke width, with live preview (colorPreview) on input, commit one setNodeProps on blur/Enter/picker close, one undo entry
- Multiple selection same color shows shared color, mixed colors shows "—" placeholder and "Mixed selection — common fields only" badge, W/H hidden when any instance (BUG-P-001)
- Color commit with same value → no command, no undo
- Esc in Properties color field cancels edit, reverts draft, clears preview, no command
- Tool switch during color edit commits on blur (since input blurs)
- Locked layer objects not selectable, so no color edit; if selected via undo, setNodeProps blocked or no-op with toast
- Live preview is renderer-only, never in SVG export, committed color appears in export
- Undo restores exact previous fill/stroke, redo restores new
- Zoom/pan independent — eyedropper hit-test uses doc coords ÷ zoom

Sources: Adobe Strokes/Fills [helpx strokes], Adobe Tools Panel [helpx stage], Krita Color Sampler [docs.krita.org color sampler], Krita Basic Concepts [Krita basic], Toon Boom Colour Eyedropper [Toon Boom], Adobe Beginner Guide [studentcabletelevision]
