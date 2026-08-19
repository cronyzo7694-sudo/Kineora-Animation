# UI CONTRACT: C-03 — MENUS (File/Edit/View/Insert/Modify/Text/Control)
```
SOURCE:  Phase-2 F-01-04..12
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Menu bar (desktop) / hamburger (mobile); every command ALSO in Cmd+K palette (discoverability backstop).
## B. VISIBLE CONTROLS (menu → command groups, all FUNCTIONAL or DISABLED-BY-CONTEXT)
| Menu | Groups |
|---|---|
| File | New/New-from-Template/Open/Open-Recent/Open-from-Libraries/Close/Save/Save-As/Save-as-Template/Import/Export/Publish/Print/Exit |
| Edit | Undo/Redo/History · Cut/Copy/Paste/Paste-in-Place/Paste-Special/Duplicate · Select-All/Deselect · Find&Replace · Timeline submenu · Edit-Symbols/In-Place/All · Prefs/Shortcuts/Toolbars |
| View | Go-To · Zoom · Preview-Modes · Work-Area · Rulers/Grid/Guides · Snapping · Hide-Edges · Shape-Hints |
| Insert | New-Symbol · Timeline(Frame/Keyframe/Blank) · Tweens · Scene |
| Modify | Document · Convert-to-Symbol · Break-Apart · Bitmap · Symbol · Shape · Combine-Objects · Timeline · Transform · Arrange · Align · Group/Ungroup |
| Text | Font/Size/Style · Align · Letter/Line-Spacing · Embed |
| Control | Play · Rewind · Step · Test · Mute · Loop · Live-Preview · Enable-Simple-Buttons |
## C. STATE MAP
| State | Behavior |
|---|---|
| No selection | Modify/Edit object commands DISABLED-BY-CONTEXT (greyed + reason) |
| Selection | object commands enabled |
| No document | File(most) disabled; New/Open enabled |
| Playing | Control shows Pause |
| Mobile | menus = hamburger + palette |
## D. EXIT / ESCAPE / UNDO
Menus close on Esc/outside-click; every mutating menu command = one undo entry (Phase-2 Q).
## E. SHORTCUTS (F-29)
Ctrl+N/O/S/W/R/I/X/C/V/Shift+V/D/A/Shift+A · F5/F6/F7 · Ctrl+Enter test · Ctrl+J doc · Ctrl+B break · F8 convert.
## F. POINTER + TOUCH
Click menu → dropdown; hover submenu (desktop); tap + long-press (mobile sheet).
## G. BUTTON BLOCKS (exemplar)
**Edit ▸ Undo** — ID menu.edit.undo · Action `undo()` · Disabled-by-context: empty stack → greyed · Twice-click: second = no-op (safe) · During-op: disabled.
**Modify ▸ Break Apart** — Action `breakApart()` (one command) · Twice-click: second level flattens (defined, F-11-11) · No-selection: DISABLED.
## H. OVERLAYS
Menu dropdowns L4; submenus L4.
## I. ERROR & RECOVERY
Command fails → toast + undo available. Publish errors → Output log + modal (C-31).
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful (disable+reason) [x] positioned [x] accessible [x] closable [x] responsive (hamburger) [x] tested [x] command-wired [x] undo-wired.
```
UI COMPLETE  (C-03)
```
