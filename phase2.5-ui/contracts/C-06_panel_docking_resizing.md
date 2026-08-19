# UI CONTRACT: C-06 — PANEL SYSTEM + DOCKING + RESIZING (§10/11/12)
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §10/11/12 + Phase-2 F-01-02
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Panels at default dock; **Window menu / Cmd+K** reopens any closed panel; drag header to dock/float.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| pnl.header | Panel header (title + icon + close) | FUNCTIONAL |
| pnl.close | Close (X) | FUNCTIONAL |
| pnl.collapse | Collapse (chevron) | FUNCTIONAL |
| pnl.resize | Resize handle (6px edges) | FUNCTIONAL |
| pnl.dock.preview | Dock ghost (drop preview) | FUNCTIONAL |
| pnl.tab | Tab (stacked panel) | FUNCTIONAL |
| pnl.float | Float (undock) | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Docked | fixed to zone |
| Floating | L2, draggable |
| Tabbed | stack with tab strip |
| Collapsed | header-only (96px timeline / icon strip) |
| Resizing | live preview; min-clamp |
| Invalid dock | red ghost + revert |
| Mobile | panels → bottom sheets (no dock) |
## D. EXIT / ESCAPE / UNDO
Close (X) → hidden; reopen Window/Cmd+K. Esc cancels a drag-in-progress (returns to origin). Reset Workspace restores. Dock actions undoable (P2).
## E. SHORTCUTS
Cmd+L Library · Cmd+K palette (reopen any panel) · F4 toggle Properties (ours). Mobile: sheet toggle.
## F. POINTER + TOUCH
Desktop: drag header = dock/float; drag 6px edges = resize; pointer capture (§22). Touch: drag ≥6px resize; long-press header = dock menu.
## G. BUTTON BLOCKS (exemplar)
**pnl.close** — ID pnl.close · Action `panel.hide(id)` (view state, no undo) · Twice-click: no-op · During-op: allowed · No-context: n/a.
**pnl.dock.preview** — passive; shows valid (green) / invalid (red) zones.
## H. OVERLAYS
Dock ghost L1; panel context menu L4.
## I. ERROR & RECOVERY
Panel corrupted layout → auto-reset + toast. Zero-size attempt → min-clamp (never 0). Overlapping critical UI → C-36 test fails → auto-reflow.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable+reopen [x] responsive (sheets) [x] tested (no-overlap + min-clamp) [x] wired [x] reset-workspace.
```
UI COMPLETE  (C-06)
```
