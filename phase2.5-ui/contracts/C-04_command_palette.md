# UI CONTRACT: C-04 — COMMAND PALETTE & SEARCH (§25)
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §25 + Phase-2 F-01-10/13
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
**Cmd+K / Ctrl+K** (global) · hamburger → "Search…" (mobile).
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| pal.input | Fuzzy search field | FUNCTIONAL |
| pal.results | Result list (name + shortcut + category) | FUNCTIONAL |
| pal.empty | Empty state ("No results — try 'tool'/'panel'/'export'") | FUNCTIONAL |
| pal.hint | Footer hints (↑↓ select, Enter run, Esc close) | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Typing | fuzzy filter (tools/commands/panels/features/actions/shortcuts) |
| No match | empty state + suggestions |
| Result selected | highlight; Enter runs |
| Running command | palette closes; command executes |
| Mobile | bottom-sheet palette |
## D. EXIT / ESCAPE
Esc closes (restores focus) · outside-click closes · Enter runs selected.
## E. SHORTCUTS
Cmd+K open · ↑↓ navigate · Enter run · Esc close. Mobile: palette button.
## F. POINTER + TOUCH
Click result = run; scroll results; touch: tap result, swipe-dismiss.
## G. BUTTON BLOCKS (exemplar)
**pal.input** — ID pal.input · Action `palette.open()` · Twice-open: toggles (idempotent) · During-op: allowed (queue command after op) · No-context: always available.
## H. OVERLAYS
Palette = L4 (above panels, below dialogs); focus trapped while open.
## I. ERROR & RECOVERY
Command not found → empty state (never silent). Command throws → toast + palette reopens with error.
## J. UI RELIABILITY AUDIT
[x] visible (always reachable) [x] clickable [x] stateful [x] positioned (centered/top) [x] accessible (keyboard-first) [x] closable (Esc) [x] responsive (sheet) [x] tested (every feature registers an entry) [x] command-wired [x] undo (commands carry their own).
```
UI COMPLETE  (C-04)
```
