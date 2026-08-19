# UI CONTRACT: C-13 — DRAWING TOOLS UI
```
SOURCE:  Phase-2 F-02-08..24, F-05-01..10
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Tools panel (tool buttons) + Options area (contextual modifiers) + Cmd+K; mobile = tool ring + options sheet.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| t.pen | Pen (+add/delete/convert anchor flyout) | FUNCTIONAL |
| t.text | Text | FUNCTIONAL |
| t.line | Line | FUNCTIONAL |
| t.rect | Rectangle (+Oval/PolyStar/Primitives flyout) | FUNCTIONAL |
| t.pencil | Pencil | FUNCTIONAL |
| t.brush | Brush | FUNCTIONAL |
| t.paintbrush | Paint Brush | FUNCTIONAL |
| t.eraser | Eraser | FUNCTIONAL |
| t.width | Width | FUNCTIONAL |
| t.eyedropper | Eyedropper | FUNCTIONAL |
| t.bucket | Paint Bucket | FUNCTIONAL |
| t.ink | Ink Bottle | FUNCTIONAL |
| opt.objmode | Object Drawing toggle | CONTEXTUAL (draw tools) |
| opt.snap | Magnet | CONTEXTUAL |
| opt.smooth | Smoothing slider | CONTEXTUAL (pencil/brush/paintbrush) |
| opt.pencil.mode | Straighten/Smooth/Ink | CONTEXTUAL (pencil) |
| opt.brush.mode | 5 paint modes | CONTEXTUAL (brush) |
| opt.brush.size | Brush size slider | CONTEXTUAL (brush/eraser) |
| opt.bucket.gap | Gap size (bucket) | CONTEXTUAL (bucket) |
| opt.bucket.lock | Lock Fill | CONTEXTUAL (bucket/brush) |
| opt.eraser.mode | 5 eraser modes + faucet | CONTEXTUAL (eraser) |
| opt.stroke/fill | Stroke/Fill chips + no-color | ALWAYS-VISIBLE (Color section) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Tool selected | tool persists (mode chip + status bar shows active tool) |
| Drawable layer | drawing enabled |
| Locked/hidden/tween layer | tool active but draw blocked + toast reason (F-05-09) |
| Non-keyframe frame | auto-key toast (F-08-13) |
| No doc | tools DISABLED-BY-CONTEXT |
| Mobile | tool ring + options bottom sheet |
## D. EXIT / ESCAPE / UNDO
Esc cancels in-progress stroke/path (Pen partial path); Esc exits tool sub-mode; each completed shape = one DrawCommand (undo).
## E. SHORTCUTS
P/T/N/R/O/Shift+Y/Y/B/E/U/I/K/S + Space pan. Mobile: tool ring taps.
## F. POINTER + TOUCH
Pointer capture on draw (§22); stylus pressure/tilt → width; touch: finger smoothing + loupe.
## G. BUTTON BLOCKS (exemplar)
**t.brush** — ID t.brush · Action `tool.activate('brush')` (view state) · Twice-click: idempotent · During-op: allowed · No-doc: DISABLED.
**opt.objmode** — Action `pref.set('objectDrawing')` · Twice-click: toggles · No-doc: DISABLED.
## H. OVERLAYS
Pen anchor preview L1; brush size HUD L1; tool flyouts L4.
## I. ERROR & RECOVERY
Draw on locked layer → toast + no-entry cursor; Undo restores. Pen partial → Esc discards (no command).
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive (ring+sheet) [x] tested [x] wired [x] undo per shape.
```
UI COMPLETE  (C-13)
```
