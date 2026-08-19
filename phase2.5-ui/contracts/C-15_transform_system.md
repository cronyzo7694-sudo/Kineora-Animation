# UI CONTRACT: C-15 — TRANSFORM SYSTEM UI
```
SOURCE:  Phase-2 F-04-01..14, F-02-03/04
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Free Transform (Q) + Transform panel (Window ▸ Transform) + Modify ▸ Transform menu + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| t.free | Free Transform tool | FUNCTIONAL |
| t.grad | Gradient Transform tool | CONTEXTUAL (gradient/bitmap fill) |
| ft.handles | 8 transform handles + rotation zone + pivot | CONTEXTUAL (selection) |
| ft.modes | Scale/Rotate&Skew/Distort/Envelope modes | CONTEXTUAL (shape for distort/envelope) |
| trn.fields | X/Y/W/H/Rotate/Skew numeric | CONTEXTUAL (selection) |
| trn.constrain | Constrain proportions | FUNCTIONAL |
| trn.reset | Remove Transform | CONTEXTUAL |
| trn.flip | Flip H/V | CONTEXTUAL |
| trn.rot90 | Rotate 90° CW/CCW | CONTEXTUAL |
| trn.scalerot | Scale & Rotate dialog | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Selection | handles + panel live |
| Rotated/skewed selection | handles show rotated AABB |
| Distort/Envelope requested on non-shape | DISABLED + tooltip (F-04 L.1) |
| Pivot dragged | transform point moves (double-click = re-center) |
| Numeric editing | Enter commit / Esc cancel |
| Mobile | pinch scale / twist rotate / handles ≥44px |
## D. EXIT / ESCAPE / UNDO
Esc exits transform mode; one gesture = one TransformCommand (undo). Numeric Esc reverts.
## E. SHORTCUTS
Q · Shift constrain · Alt center/opposite · Ctrl+Alt+S scale-rotate · Ctrl+Shift+Z remove (legacy) · arrows nudge. Mobile: gestures + panel.
## F. POINTER + TOUCH
Handle drag (pointer capture §22); rotation zone; pivot drag with loupe (touch).
## G. BUTTON BLOCKS (exemplar)
**ft.modes.distort** — ID ft.modes.distort · Action `transform.setMode('distort')` · Twice-click: idempotent · Non-shape: DISABLED + tooltip (never silent).
**trn.reset** — Action `transform.remove()` (one command) · Twice-click: idempotent (already identity) · No-selection: DISABLED.
## H. OVERLAYS
Transform HUD L1; Scale&Rotate dialog L5.
## I. ERROR & RECOVERY
Distort on symbol → tooltip (greyed). Pivot drift warning (F-13-05). NaN input → inline error + revert.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive [x] tested [x] wired [x] undo per gesture.
```
UI COMPLETE  (C-15)
```
