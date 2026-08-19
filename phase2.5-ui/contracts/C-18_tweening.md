# UI CONTRACT: C-18 — TWEENING UI (motion/classic/shape + easing + graph editor)
```
SOURCE:  Phase-2 F-09-01..08, F-10-01..06
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Insert ▸ Motion/Classic/Shape Tween · frame context menu · graph editor (motion spans) · Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| twn.create | Create Motion/Classic/Shape Tween | CONTEXTUAL (keyframe/selection) |
| twn.ease | Ease slider (hot text) | CONTEXTUAL (span) |
| twn.customease | Custom Ease (graph) | CONTEXTUAL |
| twn.rotate | Rotate (None/Auto/CW/CCW + loops) | CONTEXTUAL (classic) |
| twn.orient | Orient to Path / Snap | CONTEXTUAL (path) |
| twn.viewkeys | View Keyframes > type | CONTEXTUAL (motion span) |
| twn.split | Split Motion | CONTEXTUAL (motion span) |
| twn.roving | Switch to roving | CONTEXTUAL (spatial keys) |
| twn.remove | Remove Tween / Convert to FBF | CONTEXTUAL |
| twn.graph | Graph editor (curves + dashed ease + multi-select) | CONTEXTUAL (motion) |
| twn.preset | Ease/motion presets | CONTEXTUAL |
## C. STATE MAP
| State | Behavior |
|---|---|
| Two keyframes + object | classic/shape tween create enabled |
| Motion span | view-keys/split/roving/graph enabled |
| Broken tween | dashed + tooltip |
| Graph open | property curves; keys draggable; dashed = eased actual |
| Mobile | long-press → tween menu; ease via sheet |
## D. EXIT / ESCAPE / UNDO
Esc closes graph editor; every tween op = one command.
## E. SHORTCUTS
F6 in span = all-prop key · Ctrl+drag property key · Cmd+K. Mobile: menu.
## F. POINTER + TOUCH
Drag span = move/stretch; drag path = reshape (F-10); graph: click/drag keys, marquee multi-select.
## G. BUTTON BLOCKS (exemplar)
**twn.create.motion** — ID twn.create.motion · Action `createTween('motion')` (one command) · Non-symbol target → auto-wrap PROMPT (never silent) · Twice-click: no-op (already span).
**twn.split** — Action `splitMotion(frame)` · No-span: DISABLED-BY-CONTEXT.
## H. OVERLAYS
Graph editor panel (dockable); ease preset menu L4; wrap-confirm modal L6.
## I. ERROR & RECOVERY
Shape tween on symbol → prompt break-apart. Broken tween → tooltip + fix. Ease overshoot → optional clamp.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-18)
```
