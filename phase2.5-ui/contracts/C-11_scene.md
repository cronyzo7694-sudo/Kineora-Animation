# UI CONTRACT: C-11 — SCENE PANEL UI
```
SOURCE:  Phase-2 F-25-01..06
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Scene panel (Window ▸ Scene); Cmd+K "Scene"; mobile = dropdown/tabs.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| scn.list | Scene list (ordered) | FUNCTIONAL |
| scn.add | Add Scene | FUNCTIONAL |
| scn.duplicate | Duplicate Scene | DISABLED-BY-CONTEXT (no selection) |
| scn.delete | Delete Scene | DISABLED-BY-CONTEXT (no selection / last scene) |
| scn.rename | Rename (dbl-click) | FUNCTIONAL |
| scn.reorder | Reorder (drag) | FUNCTIONAL |
| scn.tabs | Scene tabs (ours, W12) | CONTEXTUAL (≥2 scenes) |
| scn.goto | View ▸ Go To (first/prev/next/last) | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| One scene | delete disabled (last-scene guard) |
| Multiple | all ops enabled |
| Scene switching | stage + timeline rebind to active scene |
| Mobile | dropdown + tabs |
## D. EXIT / ESCAPE / UNDO
Panel closable; rename commit on Enter, Esc cancels; scene ops = one undo each (F-25).
## E. SHORTCUTS
Insert scene (assignable) · breadcrumb scene click. Mobile: dropdown.
## F. POINTER + TOUCH
Click = switch; double-click = rename; drag = reorder; long-press = menu.
## G. BUTTON BLOCKS (exemplar)
**scn.delete** — ID scn.delete · Action `scene.delete(selected)` (command + confirm) · Twice-click: after delete → selection empty → DISABLED · Last scene → DISABLED-BY-CONTEXT (tooltip "cannot delete last scene").
## H. OVERLAYS
Scene context menu L4; delete-confirm modal L6.
## I. ERROR & RECOVERY
Delete scene with shared assets → confirm (assets stay, use-count recomputed — F-25).
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-11)
```
