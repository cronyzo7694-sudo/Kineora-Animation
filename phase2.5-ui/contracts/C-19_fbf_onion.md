# UI CONTRACT: C-19 — FRAME-BY-FRAME & ONION SKIN UI
```
SOURCE:  Phase-2 F-15-01..06
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Timeline bottom row (onion controls) + frame ops + cel/drawing panel (ours, W1) + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| fbf.onion | Onion Skin toggle | FUNCTIONAL |
| fbf.outline | Onion Outlines | CONTEXTUAL (onion ON) |
| fbf.multi | Edit Multiple Frames | CONTEXTUAL |
| fbf.markers | Modify Markers (always/anchor/2/5/all) | CONTEXTUAL |
| fbf.range | Start/End markers (drag; Ctrl=both) | CONTEXTUAL |
| fbf.tint | Past/Present/Future tint | Preferences |
| fbf.opacity | Starting opacity + decrease-by sliders | CONTEXTUAL (adv settings) |
| fbf.exclude | Right-click frame → exclude/include | CONTEXTUAL |
| fbf.step | Step ./, · F5/F6/F7 | FUNCTIONAL |
| fbf.cel | Expose same / Duplicate new (D / F6) | CONTEXTUAL (drawing) |
| fbf.holdN | Hold N frames dialog (ours) | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Onion ON | ±2 frames ghosted (default) |
| Markers anchored | range fixed while scrub |
| Edit-multiple | ghosts editable |
| Outline mode | paths only |
| Cel shared | "shared" badge on exposed frames |
| Mobile | onion toolbar + long-press frames |
## D. EXIT / ESCAPE / UNDO
Esc exits edit-multiple; each frame/drawing op = one command.
## E. SHORTCUTS
O/Shift+O/Alt+O (ours) · F5/F6/F7 · ./, · Alt+,/. hop. Mobile: toolbar.
## F. POINTER + TOUCH
Drag markers; right-click frame = exclude; hover span = colored-outline preview (desktop).
## G. BUTTON BLOCKS (exemplar)
**fbf.onion** — ID fbf.onion · Action `onion.toggle()` (view state) · Twice-click: toggles · No-doc: DISABLED.
**fbf.cel.expose** — Action `drawing.expose(id)` (command) · Twice-click: idempotent (same ref) · No-drawing: DISABLED.
## H. OVERLAYS
Onion ghost pass L1 (never exported); hold-N dialog L5.
## I. ERROR & RECOVERY
Broken drawingId → toast + re-link. Edit-multiple on heavy scene → perf warn.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-19)
```
