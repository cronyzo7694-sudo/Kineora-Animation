# UI CONTRACT: C-12 — COLOR / SWATCHES / ALIGN / TRANSFORM / INFO PANELS UI
```
SOURCE:  Phase-2 F-23-01..08, F-24-01..06, F-04-10
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Window ▸ Color / Swatches / Align / Transform / Info; Cmd+K each; mobile = grouped sheet.
## B. VISIBLE CONTROLS
| ID | Control | Panel | State |
|---|---|---|---|
| col.fill/stroke | Fill/Stroke chips | Color | FUNCTIONAL |
| col.swap | Swap fill/stroke | Color | FUNCTIONAL |
| col.bw | Black & White (reset) | Color | FUNCTIONAL |
| col.nocolor | No Color | Color | FUNCTIONAL |
| col.type | Fill type (solid/linear/radial/bitmap) | Color | FUNCTIONAL |
| col.stops | Gradient stops editor | Color | CONTEXTUAL (gradient) |
| col.picker | Color picker (HS/RGB/hex/alpha) | Color | FUNCTIONAL |
| sw.add | Add Swatch | Swatches | FUNCTIONAL |
| sw.list | Swatch grid (+folders) | Swatches | FUNCTIONAL |
| aln.stage | To Stage toggle | Align | FUNCTIONAL |
| aln.6 | Align L/C/R/T/M/B (6) | Align | DISABLED-BY-CONTEXT (no selection) |
| aln.dist | Distribute (6) | Align | DISABLED-BY-CONTEXT (<3) |
| aln.match | Match size | Align | DISABLED-BY-CONTEXT (<2) |
| aln.gap | Even-gap (ours) | Align | DISABLED-BY-CONTEXT (<2) |
| trn.fields | X/Y/W/H/Rotate/Skew numeric | Transform | DISABLED-BY-CONTEXT |
| trn.constrain | Constrain proportions | Transform | FUNCTIONAL |
| trn.reset | Reset (remove transform) | Transform | CONTEXTUAL (selection) |
| inf.readout | W/H/X/Y + RGB(A) + pointer | Info | ALWAYS-VISIBLE |
| inf.regtrans | Registration/Transform toggle | Info | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| No selection | Align/Transform disabled + reason; Color still usable (set defaults) |
| Selection | all enabled |
| Gradient fill | stops editor shows |
| Mixed selection | Transform common-only (x/y/w/h) |
| Mobile | sheets |
## D. EXIT / ESCAPE / UNDO
Panels closable+reopen; picker popover Esc closes; field commit = one undo; align = one undo (F-24).
## E. SHORTCUTS
Cmd+K Align (Ctrl+K legacy) · numeric commit Enter/Esc. Mobile: taps.
## F. POINTER + TOUCH
Click chip → picker popover (L3); drag stops; click align button. Touch: 44px targets.
## G. BUTTON BLOCKS (exemplar)
**col.bw** — ID col.bw · Action `color.reset()` (white fill/black stroke) · Twice-click: idempotent · No-context: always (sets defaults).
**aln.dist** — Action `align.distribute(axis)` (one command) · <3 objects: DISABLED-BY-CONTEXT (tooltip "need 3+ objects").
## H. OVERLAYS
Color picker popover L3; gradient stop menu L4.
## I. ERROR & RECOVERY
Both fill+stroke = No Color → warn toast ("invisible shape"). Numeric invalid → inline error + revert.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-12)
```
