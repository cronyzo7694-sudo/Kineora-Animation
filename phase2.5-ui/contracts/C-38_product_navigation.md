# UI CONTRACT: C-38 — PRODUCT-LEVEL NAVIGATION
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §31 + Phase-2 F-01-01
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Breadcrumb (edit bar) + Back button + Cmd+K + scene tabs + status bar.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| nav.breadcrumb | Scene ▸ symbol ▸ nested breadcrumb | CONTEXTUAL (edit depth) |
| nav.back | Back (one level) | CONTEXTUAL |
| nav.root | Exit to document (root) | CONTEXTUAL |
| nav.tabs | Scene/document tabs | CONTEXTUAL (≥2) |
| nav.palette | Cmd+K | ALWAYS-VISIBLE |
| nav.status | Status bar (where am I) | ALWAYS-VISIBLE |
## C. STATE MAP
| State | Behavior |
|---|---|
| Document level | breadcrumb = scene |
| Symbol edit | breadcrumb path + dimmed scope |
| Deep nesting | Esc = one level; Ctrl+Enter = root |
| Multiple scenes | tabs + Go To |
| Lost? | status bar always shows scene/symbol/frame |
## D. EXIT / ESCAPE / UNDO
Esc = up one level · Ctrl+Enter = root · Back button · double-click-outside. No dead-ends.
## E. SHORTCUTS
Esc · Ctrl+Enter · Ctrl+E toggle edit · Cmd+K. Mobile: back button.
## F. POINTER + TOUCH
Click breadcrumb level = jump; double-click-outside = exit; back gesture (mobile).
## G. BUTTON BLOCKS (exemplar)
**nav.back** — ID nav.back · Action `edit.exitOneLevel()` · Twice-click: exits again (defined) · At root: HIDDEN.
## H. OVERLAYS
n/a (navigation is inline).
## I. ERROR & RECOVERY
Broken symbol ref during edit → toast + return to safe level. Unsaved edits → autosave (never lose work).
## J. AUDIT
[x] visible (where-am-I always) [x] clickable [x] stateful [x] positioned [x] accessible [x] closable/back [x] responsive [x] tested [x] wired [x] undo-safe.
```
UI COMPLETE  (C-38)
```
