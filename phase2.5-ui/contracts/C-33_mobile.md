# UI CONTRACT: C-33 — MOBILE / TOUCH INTERACTION SYSTEM UI
```
SOURCE:  Phase-2 F-31-01..10
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Persistent bottom toolbar + tool ring + bottom sheets + long-press menus (no hover/right-click reliance).
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| mb.undo/redo | Undo/Redo | ALWAYS-VISIBLE |
| mb.play | Play/Pause | ALWAYS-VISIBLE |
| mb.tools | Tool ring | ALWAYS-VISIBLE |
| mb.selectmode | Select mode (Shift replacement) | FUNCTIONAL |
| mb.constrain | Constrain (Shift) | FUNCTIONAL |
| mb.alt | Alt (center/opposite) | FUNCTIONAL |
| mb.onion | Onion toggle | FUNCTIONAL |
| mb.keyframe | Add keyframe | FUNCTIONAL |
| mb.delete | Delete | FUNCTIONAL |
| mb.back | Back / close | ALWAYS-VISIBLE |
| mb.palette | Cmd+K (search) | ALWAYS-VISIBLE |
| mb.sheet | Bottom sheet (Properties/Library/Timeline) | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Idle | toolbar visible |
| Tool active | options in sheet |
| Mode active | mode chip + Esc/back |
| Precision | loupe (offset bubble) |
| Sheet open | swipe-dismiss + back |
## D. EXIT / ESCAPE / UNDO
Back closes sheets/modes; two-finger tap = undo; Esc (keyboard) maps to back.
## E. SHORTCUTS
(no keyboard) → toolbar buttons + gestures.
## F. POINTER + TOUCH
Tap/double-tap/long-press/drag/pinch/twist/two-finger-pan; palm rejection; 44px targets.
## G. BUTTON BLOCKS (exemplar)
**mb.selectmode** — ID mb.selectmode · Action `selectMode.toggle()` (view state) · Twice-click: toggles off · No-context: always.
## H. OVERLAYS
Bottom sheets (mobile modal equivalent); long-press context menus.
## I. ERROR & RECOVERY
Two-finger-pan vs marquee conflict → gesture disambiguation (F-31 M.2). Fat-finger miss → loupe.
## J. AUDIT
[x] visible (P0 always reachable) [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (back) [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-33)
```
