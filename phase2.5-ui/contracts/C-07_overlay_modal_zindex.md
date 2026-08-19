# UI CONTRACT: C-07 — OVERLAY + MODAL + Z-INDEX SYSTEM (§7/8/9)
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §7/8/9 + Phase-2 F-30 (context menus)
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Central `OverlayManager` + `ModalManager` (all tooltips/dropdowns/menus/popovers/dialogs/modals register here — components never self-position).
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| ovl.tooltip | Tooltip | FUNCTIONAL |
| ovl.dropdown | Dropdown menu | FUNCTIONAL |
| ovl.popover | Popover (color picker/transform editor) | FUNCTIONAL |
| ovl.context | Context menu | FUNCTIONAL |
| ovl.dialog | Dialog | FUNCTIONAL |
| ovl.modal | Modal | FUNCTIONAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Open tooltip | L3, no focus steal, hover-dismiss |
| Open dropdown | L4, focus + Esc + outside-click close |
| Open modal | L6, focus trap, one-at-a-time (queue) |
| Off-viewport | auto-reposition (flip X→Y, 8px margin) |
| Mobile | dropdown→bottom sheet; tooltip→long-press hint |
| Multiple modals | incompatible → queue (never stack) |
## D. EXIT / ESCAPE
Tooltip: hover-out. Dropdown/popover/context: Esc + outside-click. Dialog/modal: Esc (cancel) + Close button + outside-click (configurable). Focus trap enforced (Tab cycles inside).
## E. SHORTCUTS
Esc = universal close (closest layer first). Enter = primary action in modal. Mobile: back-gesture closes sheet.
## F. POINTER + TOUCH
Outside-click (pointerdown outside) closes dismissibles; touch: tap-outside; long-press opens context.
## G. BUTTON BLOCKS (exemplar)
**ovl.modal.primary** — ID ovl.modal.primary · Action `modal.confirm()` (command) · Twice-click: disabled while running (loading) · During-op: disabled · No-context: n/a (button is part of the modal).
## H. OVERLAYS
Self-referential: the system manages its own z (L0–L7 policy) — components request `getZ(kind)`, never hard-code.
## I. ERROR & RECOVERY
Overlay off-screen → reposition (never clip). Focus lost → re-focus trapped element. Modal cancel → rollback via undo.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful [x] positioned (viewport-collision) [x] accessible (focus-trap) [x] closable (Esc/outside/close) [x] responsive (sheets) [x] tested (off-screen/clip/focus) [x] wired (central managers) [x] undo (modal confirm = command).
```
UI COMPLETE  (C-07)
```
