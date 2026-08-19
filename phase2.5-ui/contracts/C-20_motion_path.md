# UI CONTRACT: C-20 — MOTION PATH UI
```
SOURCE:  Phase-2 F-10-01..06
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Stage (path appears when tween target selected) + Motion Path context menu + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| path.vertices | Path vertices (diamonds = position keys) | CONTEXTUAL (motion span) |
| path.handles | Bézier handles (Subselection) | CONTEXTUAL |
| path.reshape | Drag segment (Selection) | CONTEXTUAL |
| path.move | Move whole path (drag/arrows/Properties) | CONTEXTUAL |
| path.reverse | Reverse Path | CONTEXTUAL |
| path.copy/paste | Copy path as stroke / paste stroke as path | CONTEXTUAL |
| path.orient | Orient to Path / Snap | CONTEXTUAL |
| path.always | Always Show Motion Paths | FUNCTIONAL (option) |
| path.delete | Delete path | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Span selected | path visible + editable |
| Subselection | anchors + handles |
| Orient ON | object faces tangent |
| Constant-speed (ours) | arc-length toggle |
| Mobile | tap vertex + loupe drag |
## D. EXIT / ESCAPE / UNDO
Esc deselects path; every path edit = one command (writes back to x/y keys).
## E. SHORTCUTS
Ctrl+drag property key = time-only move. Mobile: loupe.
## F. POINTER + TOUCH
Drag segment (don't click-to-select first, F-10 L.1); drag vertex; Free Transform path (not target).
## G. BUTTON BLOCKS (exemplar)
**path.reverse** — ID path.reverse · Action `path.reverse()` (one command) · Twice-click: re-reverses (restores) · No-span: DISABLED.
## H. OVERLAYS
Path L1 (never exported); context menu L4.
## I. ERROR & RECOVERY
Closed stroke pasted as path → rejected + toast (F-10 M.6). Path+target marquee select both (F-10).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-20)
```
