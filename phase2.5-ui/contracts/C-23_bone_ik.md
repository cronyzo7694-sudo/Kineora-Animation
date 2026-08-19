# UI CONTRACT: C-23 — BONE / IK RIGGING UI
```
SOURCE:  Phase-2 F-14-01..09, F-02-29/30
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Bone tool (M) + Bind tool + bone Properties + pose layer (right-click → Insert Pose) + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| bone.tool | Bone tool (chain symbols / carve shape) | FUNCTIONAL |
| bone.bind | Bind tool (point→bone weights) | CONTEXTUAL (IK shape) |
| bone.length | Bone length | CONTEXTUAL (bone) |
| bone.rot | Rotation min/max + lock | CONTEXTUAL |
| bone.trans | Translation x/y enable | CONTEXTUAL |
| bone.speed | Joint speed | CONTEXTUAL |
| bone.spring | Spring (strength/damping) | CONTEXTUAL |
| bone.nav | Parent/Child/Next/Prev buttons | CONTEXTUAL |
| bone.insertpose | Insert Pose | CONTEXTUAL (pose layer) |
| bone.wedge | Constraint wedge viz | CONTEXTUAL (bone) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Bone selected | red + bound points (yellow with Bind) |
| Armature selected (double-click) | whole-armature props |
| Pose layer | green span + diamonds; Insert Pose |
| Multiple poses | subselection edit blocked + reason (F-14 L.1) |
| Mode chip | "Rig mode" persistent + Esc exits |
| Mobile | bone drag + loupe; numeric constraints sheet |
## D. EXIT / ESCAPE / UNDO
Esc exits bone tool/mode; pose insert/edit = one command (F-14).
## E. SHORTCUTS
M · Shift+click multi-bone · double-click = armature. Mobile: loupe + sheet.
## F. POINTER + TOUCH
Click-drag = add bone; drag bone = pose (IK solve); Alt+drag = move one instance; Shift+click point = bind.
## G. BUTTON BLOCKS (exemplar)
**bone.tool** — ID bone.tool · Action `tool.activate('bone')` · Complex shape → convert-to-clip PROMPT (never silent) · Twice-click: idempotent.
**bone.insertpose** — Action `pose.insert()` (command) · Non-pose layer: DISABLED.
## H. OVERLAYS
Bone glyphs + constraint wedges L1; bone context menu L4.
## I. ERROR & RECOVERY
Bone+AssetWarp conflict → blocked + reason (separate rig types). Copy/paste corruption → local-space (W2, no corruption).
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable (Esc) [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-23)
```
