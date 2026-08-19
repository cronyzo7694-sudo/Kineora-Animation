# UI CONTRACT: C-10 — LIBRARY PANEL UI
```
SOURCE:  Phase-2 F-12-01..13
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Library panel (Cmd+L); Cmd+K "Library"; mobile = grid bottom sheet.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| lib.list | Asset list (icon+name+kind+use-count) | FUNCTIONAL |
| lib.preview | Preview (symbol anim / waveform / bitmap thumb / button clickable) | FUNCTIONAL |
| lib.search | Search box | FUNCTIONAL |
| lib.newsymbol | New Symbol | FUNCTIONAL |
| lib.newfolder | New Folder | FUNCTIONAL |
| lib.delete | Delete (trash) | DISABLED-BY-CONTEXT (no selection) |
| lib.properties | Asset Properties (i) | CONTEXTUAL |
| lib.unused | Select Unused Items | FUNCTIONAL |
| lib.sort | Sort/menu | FUNCTIONAL |
| lib.dragout | Drag-to-stage (instantiate) | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Empty library | empty state + "Import…" |
| Asset selected | preview + properties + delete enabled |
| Symbol selected | double-click = edit (F-11-07) |
| Delete in-use | confirm modal (cancel / break instances / delete+instances) |
| Search active | filtered list; scope chip (all/folder) |
| Mobile | grid + tap-place + long-press menu |
## D. EXIT / ESCAPE / UNDO
Panel closable + reopen; Esc clears search; delete/rename/duplicate = one undo each (F-12).
## E. SHORTCUTS
Cmd+L · Cmd+F8 new symbol · Del delete (with confirm). Mobile: long-press.
## F. POINTER + TOUCH
Drag asset → stage = instantiate; drag onto instance = swap (F-12-11); double-click symbol = edit. Touch: tap asset → Place button → tap stage.
## G. BUTTON BLOCKS (exemplar)
**lib.delete** — ID lib.delete · Action `asset.delete(selected)` (command + confirm-if-used) · Twice-click: after delete, selection empty → DISABLED · During-op: disabled · No-selection: DISABLED-BY-CONTEXT.
**lib.dragout** — gesture; drop = `instantiate()` (one command) · No-stage: drop rejected (ghost invalid).
## H. OVERLAYS
Asset context menu L4; delete-confirm modal L6.
## I. ERROR & RECOVERY
Delete in-use → modal (never silent). Broken asset ref → toast + skip in list. Import fail → report (F-27-08).
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable+reopen [x] responsive (grid sheet) [x] tested [x] wired [x] undo per op.
```
UI COMPLETE  (C-10)
```
