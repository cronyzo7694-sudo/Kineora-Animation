# UI CONTRACT: C-09 — PROPERTIES PANEL UI
```
SOURCE:  Phase-2 F-26-01..12
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Properties panel (right dock, 240×320 min); Cmd+K "Properties"; mobile = right/bottom sheet.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| prp.contextchip | Context chip (tool/selection/frame/document) | ALWAYS-VISIBLE |
| prp.sections | Schema sections (per context F-26-02..12) | CONTEXTUAL |
| prp.field.* | Number/Text/Color/Select/Slider/Checkbox/Gradient/Curve fields | FUNCTIONAL |
| prp.swap | Swap Symbol | CONTEXTUAL (instance) |
| prp.framepicker | Frame Picker | CONTEXTUAL (graphic) |
| prp.lipsync | Lip Syncing | CONTEXTUAL (graphic + audio) |
| prp.addfilter | Add Filter | CONTEXTUAL (instance) |
| prp.editease | Edit Ease | CONTEXTUAL (tween) |
| prp.embed | Embed Fonts | CONTEXTUAL (dynamic/input text) |
| prp.regtransform | Registration/Transform point toggle | CONTEXTUAL (selection) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Nothing selected | document schema (size/fps/bg) |
| Tool active | tool options |
| Shape selected | fill/stroke/width/rule |
| Instance selected | swap/color-effect/filters/loop |
| Text selected | type/char/paragraph/embed |
| Frame/tween selected | label/sound/ease |
| Camera/Bone/Warp selected | their schemas |
| Mixed selection | common only (x/y/w/h) + "mixed" badge |
| Field editing | live preview; Enter commit; Esc cancel |
| Mobile | bottom sheet (swipeable) |
## D. EXIT / ESCAPE / UNDO
Esc cancels field edit (revert); Enter/blur commits (one undo); panel collapsible.
## E. SHORTCUTS
F4 toggle (ours) · Tab next field · Enter commit · Esc cancel. Mobile: sheet.
## F. POINTER + TOUCH
Click field → edit; drag slider; numeric scroll-wheel stepper; touch: large steppers (44px).
## G. BUTTON BLOCKS (exemplar)
**prp.swap** — ID prp.swap · Action `swapSymbol()` (opens Library picker popover) · Twice-click: reopens (idempotent) · During-op: disabled · No-instance: HIDDEN-WHEN-UNAVAILABLE (context chip explains).
**prp.field.numeric** — Commit on Enter/blur (one command) · Invalid input: inline error + revert (never silent) · Twice-Enter: idempotent.
## H. OVERLAYS
Library picker popover L3; Frame Picker L3; color picker popover L3.
## I. ERROR & RECOVERY
Invalid value → inline error + revert + tooltip range. Swap no-symbols → empty picker + message. Filter param invalid → revert.
## J. UI RELIABILITY AUDIT
[x] visible [x] clickable [x] stateful (context matrix) [x] positioned [x] accessible [x] closable [x] responsive (sheet) [x] tested (context transitions, no silent loss) [x] wired [x] undo per commit.
```
UI COMPLETE  (C-09)
```
