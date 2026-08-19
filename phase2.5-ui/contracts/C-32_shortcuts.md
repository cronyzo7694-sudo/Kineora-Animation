# UI CONTRACT: C-32 — SHORTCUTS & CONFLICT MANAGER UI
```
SOURCE:  Phase-2 F-29-01..12
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Edit ▸ Keyboard Shortcuts (Ctrl+Shift+Alt+K) · Cmd+K (palette shows shortcuts).
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| sc.editor | Shortcut editor (list + rebind) | FUNCTIONAL |
| sc.conflict | Conflict warning | CONTEXTUAL (bind collision) |
| sc.reset | Reset to defaults | FUNCTIONAL |
| sc.import/export | Import/export shortcut set | FUNCTIONAL |
| sc.mobilemap | Mobile equivalent column | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Idle | active set applied |
| Rebinding | capture mode; conflict highlight |
| Conflict | warning + choose (replace/cancel) |
| Reset | defaults restored |
| Mobile | shortcuts → toolbar buttons |
## D. EXIT / ESCAPE / UNDO
Esc cancels rebind; shortcut changes = app prefs (undoable P2).
## E. SHORTCUTS
Ctrl+Shift+Alt+K open editor. Mobile: toolbar.
## F. POINTER + TOUCH
Click command → press key → bind; conflict modal.
## G. BUTTON BLOCKS (exemplar)
**sc.reset** — ID sc.reset · Action `shortcuts.reset()` (pref write) · Twice-click: idempotent · No-context: always.
## H. OVERLAYS
Conflict modal L6; editor dialog L5.
## I. ERROR & RECOVERY
Two actions same key → conflict modal (never silent hijack, F-29).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-32)
```
