# UI CONTRACT: C-02 — APPLICATION SHELL & WORKSPACE
```
SOURCE:  Phase-2 F-01-01/02/03/13/15/16/29
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
- App launch → default workspace loads; **Cmd+K** opens palette (everything reachable).
## B. VISIBLE CONTROLS
| ID | Control | State | Visibility |
|---|---|---|---|
| app.menubar | Menu bar | FUNCTIONAL | ALWAYS-VISIBLE (desktop) |
| app.stage | Stage + pasteboard | FUNCTIONAL | ALWAYS-VISIBLE |
| app.tools | Tools panel | FUNCTIONAL | ALWAYS-VISIBLE (collapsible) |
| app.timeline | Timeline panel | FUNCTIONAL | ALWAYS-VISIBLE (min 96px) |
| app.properties | Properties panel | FUNCTIONAL | ALWAYS-VISIBLE (collapsible) |
| app.library | Library panel | FUNCTIONAL | HIDDEN-WHEN-UNAVAILABLE→Window/Cmd+L reopen |
| app.statusbar | Status bar | FUNCTIONAL | ALWAYS-VISIBLE |
| app.breadcrumb | Edit bar (scene▸symbol breadcrumb) | FUNCTIONAL | CONTEXTUAL (edit depth >0) |
| app.workspace.switch | Workspace switcher | FUNCTIONAL | ALWAYS-VISIBLE (top-right) |
| app.workspace.reset | Reset Workspace | FUNCTIONAL | Window ▸ Workspace ▸ Reset |
| app.tab | Document/scene tabs | FUNCTIONAL | CONTEXTUAL (≥2 open) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Normal | all regions render |
| No document | stage empty + "New/Open" empty-state buttons |
| Loading doc | spinner + skeleton panels |
| Multiple docs | tabs; panels bind to ACTIVE doc |
| Workspace custom | layout from prefs; Reset restores |
| Mobile | menubar→hamburger; panels→sheets (§14) |
## D. EXIT / CANCEL / ESCAPE / UNDO
- Panels: close (Window menu) + reopen (Window/Cmd+K). Reset Workspace restores. No trap.
## E. SHORTCUTS
Cmd+K palette · Cmd+L Library · Cmd+J Document · Cmd+N/O/S/W · Cmd+Shift+Alt+K shortcut editor. Mobile: toolbar + palette.
## F. POINTER + TOUCH
Desktop: click/drag dock/resize (§10/11). Touch: tap panels, drag resize ≥6px, pinch stage zoom.
## G. BUTTON BLOCKS (exemplar)
**app.workspace.reset** — ID app.workspace.reset · Tooltip "Restore default layout" · Action `workspace.reset()` (pref write, undoable P2) · Twice-click: idempotent · During-op: disabled · No-context: always available.
## H. OVERLAYS
Menus (L4), palette (L4), dialogs (L5/6).
## I. ERROR & RECOVERY
Panel layout corrupt → auto-reset + toast. Dock drop invalid → ghost shows invalid (red) + revert.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable+reopen [x] responsive [x] tested [x] command-wired [x] undo-where-required.
```
UI COMPLETE  (C-02)
```
