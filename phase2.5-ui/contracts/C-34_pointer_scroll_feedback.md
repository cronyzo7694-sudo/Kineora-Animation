# UI CONTRACT: C-34 — POINTER CAPTURE + SCROLL + FEEDBACK/ERROR SYSTEMS
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §20/21/22/23
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Cross-cutting (all drag ops + all scroll containers + all feedback).
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| ptr.capture | pointer capture on drag-down | FUNCTIONAL (all drags) |
| scr.containers | scroll registry (H/V/touch/wheel/shift-wheel) | FUNCTIONAL |
| fb.toast | Toast | FUNCTIONAL |
| fb.progress | Progress bar + cancel | CONTEXTUAL (long ops) |
| fb.spinner | Spinner / skeleton | CONTEXTUAL (loading) |
| fb.inline | Inline error (fields) | CONTEXTUAL (invalid) |
| fb.modal | Modal error (blocking) | CONTEXTUAL (fatal) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Drag | capture; lostpointercapture = cancel + revert |
| Long op | progress + cancel (never frozen) |
| Invalid field | inline error + revert |
| Fatal | modal + rollback + autosave safe state |
| Scroll | one scroll body per panel (no nesting) |
## D. EXIT / ESCAPE / UNDO
Esc cancels drag/op; cancel = revert (undo).
## E. SHORTCUTS
Esc universal cancel. Mobile: back.
## F. POINTER + TOUCH
pointerdown/move/up/cancel/leave all handled; multi-touch conflict = single-pointer ownership.
## G. BUTTON BLOCKS (exemplar)
**fb.progress.cancel** — ID fb.progress.cancel · Action `op.cancel()` · Twice-click: no-op (already cancelling).
## H. OVERLAYS
Toast L4; modal error L7 (critical).
## I. ERROR & RECOVERY
Every op: expected error + message + retry/cancel/undo/rollback + safe state (autosave).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested (pointer-lost, cancel-mid-op) [x] wired [x] undo.
```
UI COMPLETE  (C-34)
```
