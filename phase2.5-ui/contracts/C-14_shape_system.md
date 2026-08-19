# UI CONTRACT: C-14 — SHAPE SYSTEM UI
```
SOURCE:  Phase-2 F-06-01..12
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Modify ▸ Shape / Combine Objects / Break Apart; context menu on shapes; Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| shp.convert | Convert Lines to Fills | CONTEXTUAL (stroke selected) |
| shp.expand | Expand Fill | CONTEXTUAL (fill) |
| shp.soften | Soften Fill Edges | CONTEXTUAL (fill) |
| shp.smooth | Smooth | CONTEXTUAL (raw shape) |
| shp.straighten | Straighten | CONTEXTUAL |
| shp.optimize | Optimize Curves | CONTEXTUAL |
| shp.hint | Add Shape Hint | CONTEXTUAL (shape tween) |
| shp.union | Combine ▸ Union | CONTEXTUAL (≥2 drawing objects) |
| shp.intersect | Intersect | CONTEXTUAL (≥2) |
| shp.punch | Punch | CONTEXTUAL (≥2) |
| shp.crop | Crop | CONTEXTUAL (≥2) |
| shp.break | Break Apart | CONTEXTUAL (symbol/group/text/bitmap/primitive) |
| shp.objmode | Object/merge mode toggle | CONTEXTUAL (draw tools) |
| shp.regionlock | Region-select lock (ours) | CONTEXTUAL (selection) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Raw shape selected | shape ops enabled |
| Drawing object selected | boolean ops enabled (≥2) |
| Symbol/group/text/bitmap | Break Apart enabled |
| Tweened symbol | Break Apart BLOCKED + reason (F-06-11 L.3) |
| Merge mode ON | split-on-move possible (toast) |
| Object mode ON | atomic (no split) |
## D. EXIT / ESCAPE / UNDO
Each op = one command (undo restores geometry). Break Apart one-way → confirm (Library keeps symbol).
## E. SHORTCUTS
Ctrl+B break · Ctrl+G/U group/ungroup · Ctrl+Shift+O optimize. Mobile: long-press shape menu.
## F. POINTER + TOUCH
Menu/context commands; boolean ops = selection-driven (no drag).
## G. BUTTON BLOCKS (exemplar)
**shp.union** — ID shp.union · Action `combine('union')` (one command) · Twice-click: second on result = no-op (already unioned) · During-op: disabled · <2 objects: DISABLED-BY-CONTEXT.
**shp.break** — Action `breakApart()` (one command) · Twice-click: second flattens one more level (defined) · Tweened symbol: DISABLED + reason.
## H. OVERLAYS
Shape context menu L4; confirm modal L6 (break-apart tweened).
## I. ERROR & RECOVERY
Boolean on unsupported mix → toast; Undo reverts. Break-apart loses link → toast "symbol kept in Library".
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-14)
```
