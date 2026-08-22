# KINEORA TOOLS RESEARCH

## Purpose

This folder is the implementation contract for Kineora's authoring tools. It is based on the existing repository research, especially:

- `animate-blueprint/01_application_map.md`
- `animate-blueprint/02a_tools_selection_transform.md`
- `animate-blueprint/02b_tools_drawing.md`
- `animate-blueprint/02c_tools_painting.md`
- `animate-blueprint/02d_tools_utility.md`
- `animate-blueprint/03_selection_system.md`
- `animate-blueprint/04_transform_system.md`
- `animate-blueprint/06_shape_system.md`
- `animate-blueprint/23_color.md`
- `animate-blueprint/29_shortcuts.md`
- `animate-blueprint/32_architecture.md`
- `animate-blueprint/33_data_model.md`
- `animate-blueprint/34_ui_button_spec.md`
- `MASTER_FEATURE_INVENTORY/01_DECOMP_A_tools_selection_transform.md`
- `MASTER_FEATURE_INVENTORY/02_DECOMP_B_drawing_shape_timeline.md`

This folder does not replace the existing blueprint. It converts the tool research into smaller, code-ready files. Adobe behavior is used as a reference; Kineora decisions are explicitly marked so we do not accidentally copy legacy or confusing behavior.

## Reading notation

- **[ADOBE]** = observed workflow or capability in Adobe Animate documentation.
- **[KINEORA]** = approved product behavior for our original editor.
- **[CODE]** = current repository implementation or gap.
- **[LATER]** = intentionally deferred; do not create a fake/dead control.
- **[BLOCKED]** = depends on a model or engine that does not exist yet.

## Non-negotiable shared tool contract

Every tool must implement the same lifecycle:

```text
activate
  -> show tool state and options
pointerdown
  -> hit-test / begin gesture / capture pointer
pointermove
  -> update an editor-only preview; do not write document state repeatedly
pointerup
  -> validate; commit exactly one command; emit document:changed
pointercancel / Escape / blur
  -> discard preview; do not create an undo entry
```

Shared rules:

1. All pointer coordinates are converted from screen space to document space through the viewport transform. Browser zoom, panel position, stage zoom, and pan must never change document geometry.
2. A document mutation is committed only on successful pointer release or an explicit action. Live previews remain renderer/editor state.
3. One completed gesture creates one undoable command. A click that does nothing creates no command.
4. Locked, hidden, or non-editable layers reject mutation at the engine boundary, not only in React.
5. Drawing and painting target the active scene, active layer, and current playhead frame. The auto-keyframe policy is explicit and must be shown in the UI.
6. Every functional tool has a visible active state, keyboard focus state, tooltip, cursor, and disabled/error explanation.
7. Every tool has a testable command/event contract. No UI-only fake operation.
8. Selection overlays, guides, cursor previews, onion skin, and snap hints are editor-only and never enter export output.
9. Pointer capture is released on pointerup, pointercancel, Escape, window blur, and tool switch.
10. Tool settings are session/view state unless explicitly documented as document data. The current style (fill/stroke) is a document-authoring preference and is separate from selected object properties.

## MVP scope and order

The first usable animation workflow needs these capabilities in order:

1. **Selection and transform** — select, move, scale, rotate, constrain, duplicate-drag.
2. **Line-art drawing** — Pencil and Pen.
3. **Paint/coloring** — Brush, Paint Bucket, Eyedropper, Ink Bottle.
4. **Geometric construction** — Rectangle, Oval, Line, PolyStar, primitives.
5. **Cleanup** — Eraser, Subselection, Width.
6. **View** — Hand, Zoom, Stage Rotate.
7. **Animation helpers** — Time Scrubber, Camera.
8. **Advanced character tools** — Bone, Bind, Asset Warp.
9. **Legacy or low-priority tools** — Fluid Brush, Deco, Spray; do not ship as separate tools unless a later decision proves value.

## File plan

| File | Tool | Status |
|---|---|---|
| `01_SELECT_TOOL.md` | Selection / move / marquee | RESEARCHED — batch 1 |
| `02_FREE_TRANSFORM_TOOL.md` | Move / scale / rotate / skew | RESEARCHED — batch 1 |
| `03_PENCIL_TOOL.md` | Freehand vector line art | RESEARCHED — batch 1 |
| `04_BRUSH_TOOL.md` | Freehand filled painting | RESEARCHED — batch 1 |
| `05_PAINT_BUCKET_TOOL.md` | Vector region fill | RESEARCHED — batch 1 |
| `06_ERASER_TOOL.md` | Vector cleanup / erase modes | RESEARCHED — batch 1 |
| `07_PEN_TOOL.md` | Precision Bézier paths | RESEARCHED — batch 2 |
| `08_LINE_RECT_OVAL_TOOLS.md` | Geometric drawing | RESEARCHED — batch 2 |
| `09_POLYSTAR_PRIMITIVES.md` | Polygon, star, editable primitives | RESEARCHED — batch 2 |
| `10_SUBSELECTION_TOOL.md` | Anchor and Bézier editing | RESEARCHED — batch 2 |
| `11_WIDTH_TOOL.md` | Variable stroke width | RESEARCHED — batch 2 |
| `12_EYEDROPPER_INK_BOTTLE.md` | Style sampling and stroke application | RESEARCHED — batch 2 |
| `13_HAND_ZOOM_STAGE_ROTATE.md` | View tools | RESEARCHED — batch 3 |
| `14_PAINT_BRUSH_ART_PATTERN.md` | Art and pattern brushes | RESEARCHED — batch 3 |
| `15_TEXT_TOOL.md` | Static text first; dynamic/input later | RESEARCHED — batch 3 |
| `16_TIME_SCRUBBER_CAMERA.md` | Stage scrubbing and camera | RESEARCHED — batch 3 |
| `17_BONE_BIND_ASSET_WARP.md` | Rigging tools | RESEARCHED — batch 3 / advanced |
| `18_LEGACY_TOOLS.md` | Fluid, Deco, Spray decisions | RESEARCHED — batch 3 / defer |
| `19_TOOL_COMMAND_MATRIX.md` | UI → command → model map | CROSS-AUDITED — batch 4 |
| `20_TOOL_ACCEPTANCE_MATRIX.md` | End-to-end QA workflows | CROSS-AUDITED — batch 4 |
| `21_FINAL_TOOL_AUDIT.md` | Conflict resolution, priorities, dependency graph, coding gate | COMPLETE — batch 4 |
| `22_DEEP_AUDIT_REPORT.md` | Structural, link, consistency, security, and usability audit | COMPLETE — batch 5 |

## Current implementation snapshot

[CODE] The repository currently has a working Selection/Move/Transform path for rectangle and symbol-instance content, a real Rectangle draw gesture, a Canvas renderer, and a Rust/WASM command bridge. The current `Node` model is still limited compared with the required tool set: it has `Rect` and `SymbolInstance`, but not general paths, strokes, fills, text, bitmap, brush stroke, or raster paint nodes.

Therefore, the next implementation must not try to fake Pencil/Brush/Bucket/Eraser with rectangles. The vector model and commands must be extended first after this research folder is complete.

## Adobe research sources

- [Use the Stage and Tools panel for Animate](https://helpx.adobe.com/in/animate/desktop/workspace-and-workflow/using-stage-tools-panel.html)
- [Basic tools in Animate](https://helpx.adobe.com/in/animate/desktop/using/basic-tools.html)
- [Drawing in Animate](https://helpx.adobe.com/animate/using/drawing.html)
- [Elements in Animate](https://helpx.adobe.com/animate/using/elements.html)
- [Strokes, fills, and gradients](https://helpx.adobe.com/au/animate/using/strokes-fills-gradients.html)
- [Using Paint Brush in Animate](https://helpx.adobe.com/in/animate/desktop/using/working-with-paint-brush.html)
- [Timeline in Animate](https://helpx.adobe.com/animate/using/timeline.html)

## Final cross-audit

`21_FINAL_TOOL_AUDIT.md` is the conflict-resolution authority for all tool files. It fixes shortcut collisions, shared auto-key/tween rules, command names, node/style boundaries, dependencies, implementation order, and the final no-coding gate.

`22_DEEP_AUDIT_REPORT.md` records the actual checks performed and the corrections made before implementation.

## Research gate

No tool implementation starts until:

- each MVP tool has a dedicated research file;
- activation, options, gestures, modifiers, model writes, timeline behavior, undo, errors, and acceptance cases are specified;
- dependencies between tools are listed;
- the final tool command matrix is approved;
- the current code gap is mapped to concrete Rust/UI/test files.
