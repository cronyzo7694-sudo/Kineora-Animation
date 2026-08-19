# UI CONTRACT: C-26 — FACIAL ANIMATION UI
```
SOURCE:  Phase-2 F-19-01..07
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Face rig template (ours) + Frame Picker (mouth/eyes) + expression presets + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| fac.template | Face rig template | FUNCTIONAL (ours) |
| fac.blink | Blink (eyelid clip + auto-blink params) | CONTEXTUAL |
| fac.gaze | Gaze (pose / pupil offset) | CONTEXTUAL |
| fac.expression | Expression presets (neutral/happy/angry/surprised/sad/scared) | CONTEXTUAL |
| fac.head | Head movement (nod/tilt/shake/turn poses) | CONTEXTUAL |
| fac.mouth | Mouth (viseme + expression frames) | CONTEXTUAL |
| fac.swap | Swap / Frame Picker per part | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Head MC selected | face parts selectable inside |
| Blink auto | interval + avoid-speech |
| Expression applied | all parts set (one command) |
| Turn | pose swap (front/¾/side) |
| Mobile | expression sheet + frame picker |
## D. EXIT / ESCAPE / UNDO
Esc exits face edit; expression/blink/gaze = one command each.
## E. SHORTCUTS
Assignable. Mobile: sheet.
## F. POINTER + TOUCH
Double-click head → parts; pick poses via Frame Picker; drag pupils (loupe).
## G. BUTTON BLOCKS (exemplar)
**fac.expression** — ID fac.expression · Action `expression.apply(id)` (one command) · Twice-click: idempotent · No-face-rig: DISABLED.
## H. OVERLAYS
Frame Picker L3; expression menu L4.
## I. ERROR & RECOVERY
Mouth priority during speech (expression+viseme conflict → mouth wins + toast).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-26)
```
