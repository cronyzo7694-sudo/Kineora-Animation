# UI CONTRACT: C-30 — IMPORT UI
```
SOURCE:  Phase-2 F-27-01..08
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
File ▸ Import (To Stage / To Library / External Library) · drag-drop · paste · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| imp.tostage | Import to Stage | FUNCTIONAL |
| imp.tolibrary | Import to Library | FUNCTIONAL |
| imp.external | Open External Library | FUNCTIONAL |
| imp.dialog | Format-specific dialog (PSD layers/movie-clip/registration/compression) | CONTEXTUAL |
| imp.progress | Import progress + cancel | CONTEXTUAL (large) |
| imp.report | Import report | CONTEXTUAL (result) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Idle | import entries |
| Dialog | per-format options (F-27) |
| Importing | progress + cancel |
| Report | created/converted/warnings |
| Error | broken file → report + retry |
| Mobile | file picker + share sheet |
## D. EXIT / ESCAPE / UNDO
Esc cancels dialog; import = ONE command (undo removes assets + instances).
## E. SHORTCUTS
Ctrl+R (stage) · Ctrl+I (library) · Ctrl+Shift+O (external). Mobile: picker.
## F. POINTER + TOUCH
Drag file onto stage/library; dialog checkboxes.
## G. BUTTON BLOCKS (exemplar)
**imp.tostage** — ID imp.tostage · Action `import('stage')` (command) · Twice-click: reopens picker · No-doc: DISABLED.
## H. OVERLAYS
Import dialog L5; report toast/panel L4.
## I. ERROR & RECOVERY
<2px image rejected + message · drag-drop transparency loss warn (F-27 L.3) · Smart-Objects rasterized (noted in report).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-30)
```
