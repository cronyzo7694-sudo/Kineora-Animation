# UI CONTRACT: C-24 — ASSET WARP UI
```
SOURCE:  Phase-2 F-02-32
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Asset Warp tool (Tools) + warp Properties + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| aw.tool | Asset Warp tool | FUNCTIONAL |
| aw.pins | Warp pins (add/delete) | CONTEXTUAL (warped asset) |
| aw.mode | Rigid/Flexible | CONTEXTUAL |
| aw.envelope | Envelope mode | CONTEXTUAL |
| aw.reset | Reset warp | CONTEXTUAL |
| aw.pinpos | Pin position (x/y) | CONTEXTUAL (pin) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Asset selected (shape/DO/bitmap) | click = add pin; drag = deform |
| Symbol instance | DISABLED + tooltip (warp the art inside) |
| Warped + keyframed | pins copy to new keyframe (F-02-32) |
| Mode chip | "Warp mode" + Esc exits |
| Mobile | pin drag + loupe; long-press = add/remove pin |
## D. EXIT / ESCAPE / UNDO
Esc exits warp mode; pin move = one command (keyframed pins).
## E. SHORTCUTS
(assignable) · Alt+click = toggle rigid/flexible (F-02-32 E7). Mobile: loupe.
## F. POINTER + TOUCH
Click = add pin; drag pin = deform (rigid/flexible); double-click (Selection) = edit base shape.
## G. BUTTON BLOCKS (exemplar)
**aw.tool** — ID aw.tool · Action `tool.activate('assetWarp')` · Symbol instance target → DISABLED + tooltip · Twice-click: idempotent.
## H. OVERLAYS
Pins + mesh L1; warp context menu L4.
## I. ERROR & RECOVERY
Warp + bones conflict → blocked (separate rig types). Flicker on duplicate → data-keyframes (W3, no flicker).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-24)
```
