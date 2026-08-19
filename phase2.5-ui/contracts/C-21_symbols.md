# UI CONTRACT: C-21 — SYMBOL SYSTEM UI
```
SOURCE:  Phase-2 F-11-01..14
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Modify ▸ Convert to Symbol (F8) / New Symbol (Ctrl+F8) · Library · double-click instance · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| sym.convert | Convert to Symbol (dialog: name/type/9-grid+offset) | CONTEXTUAL (selection) |
| sym.new | New Symbol | FUNCTIONAL |
| sym.edit | Edit / In Place / New Window | CONTEXTUAL (instance) |
| sym.swap | Swap Symbol | CONTEXTUAL (instance) |
| sym.duplicate | Duplicate Symbol | CONTEXTUAL |
| sym.break | Break Apart | CONTEXTUAL |
| sym.loop | Loop / Play Once / Single Frame + first frame | CONTEXTUAL (graphic) |
| sym.framepicker | Frame Picker | CONTEXTUAL (graphic) |
| sym.coloreffect | Color effect (brightness/tint/alpha/advanced) | CONTEXTUAL |
| sym.filters | Filters (+params) | CONTEXTUAL |
| sym.name | Instance name | CONTEXTUAL (mc/button) |
| sym.breadcrumb | Edit bar breadcrumb + Back | CONTEXTUAL (edit depth) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Instance selected | instance schema |
| Edit-in-place | dimmed scope; breadcrumb |
| Graphic | loop + frame picker |
| Movie clip | instance name |
| Button | tracking (as button / menu item) |
| Live button (Simple Buttons ON) | click activates; marquee/Alt+click selects |
| Mobile | double-tap edit; library place |
## D. EXIT / ESCAPE / UNDO
Esc = exit one edit level (ours); Ctrl+Enter = root; Back/breadcrumb/double-click-outside. Symbol edits = commands (propagate all instances).
## E. SHORTCUTS
F8 · Ctrl+F8 · Ctrl+B break · Ctrl+E toggle edit · Ctrl+G/U. Mobile: double-tap + back.
## F. POINTER + TOUCH
Double-click = edit-in-place; double-click Library icon = symbol mode; drag library → instance.
## G. BUTTON BLOCKS (exemplar)
**sym.convert** — ID sym.convert · Action `convertToSymbol()` (dialog → command) · Twice-click: reopens dialog · No-selection: DISABLED.
**sym.break** — Action `breakApart()` · Tweened symbol: DISABLED + reason (F-06-11).
## H. OVERLAYS
Convert dialog L5; Frame Picker L3; swap picker L3.
## I. ERROR & RECOVERY
Duplicate name → warn/auto-rename. Broken ref → toast + swap. Break-apart loses link → toast "symbol kept".
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-21)
```
