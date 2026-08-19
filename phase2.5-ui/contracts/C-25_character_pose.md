# UI CONTRACT: C-25 — CHARACTER PIPELINE & POSE LIBRARY UI
```
SOURCE:  Phase-2 F-13-01..12
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Distribute to Layers (Modify ▸ Timeline) · Convert to Symbol (F8) · Pose Library panel (ours) · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| chp.distribute | Distribute to Layers / Keyframes | CONTEXTUAL (multi-select) |
| chp.symbolize | Convert parts to symbols | CONTEXTUAL |
| chp.nest | Nest into root movie clip | CONTEXTUAL |
| chp.pivot | Set pivot at joint (snap helper) | CONTEXTUAL |
| pose.save | Save pose | CONTEXTUAL (rig) |
| pose.apply | Apply pose (to keyframe) | CONTEXTUAL |
| pose.library | Pose library (list) | FUNCTIONAL (panel) |
| chp.template | Character template | FUNCTIONAL (ours) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Parts selected | distribute + symbolize enabled |
| Rig active | pose save/apply enabled |
| Pose applied | keyframe written (one command) |
| Mode chip | "Rig mode" + Esc exits |
| Mobile | toolbar + pose sheet |
## D. EXIT / ESCAPE / UNDO
Esc exits rig mode; pose apply = one command.
## E. SHORTCUTS
F8 · Ctrl+Shift+D distribute (assignable). Mobile: toolbar.
## F. POINTER + TOUCH
Drag pivot to joint (loupe on touch); select parts → distribute.
## G. BUTTON BLOCKS (exemplar)
**pose.save** — ID pose.save · Action `pose.save(name)` (command) · Duplicate name → prompt · No-rig: DISABLED.
**chp.distribute** — Action `distributeToLayers()` (one command) · No-selection: DISABLED.
## H. OVERLAYS
Pose library panel (dockable); pivot snap hints L1.
## I. ERROR & RECOVERY
Pivot drift warning (F-13-05). Foot-slide → ground-contact helper toast.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-25)
```
