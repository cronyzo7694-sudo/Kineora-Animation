# UI CONTRACT: C-22 — LAYERS & MASKS UI
```
SOURCE:  Phase-2 F-20-01..07, F-21-01..06
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Timeline layer list (eye/lock/outline/name) + right-click layer + Layer Properties + Cmd+K.
## B. VISIBLE CONTROLS
| ID | Control | State |
|---|---|---|
| lyr.add/del/dup | Add/Delete/Duplicate layer (+folder) | FUNCTIONAL |
| lyr.eye | Show/hide (+Alt=others, drag=multiple, Shift=transparent) | FUNCTIONAL |
| lyr.lock | Lock (+Alt=others) | FUNCTIONAL |
| lyr.outline | Outline mode (+Alt=others) | FUNCTIONAL |
| lyr.rename | Rename (dbl-click) | FUNCTIONAL |
| lyr.reorder | Reorder (drag) | FUNCTIONAL |
| lyr.folder | Folder (nest/expand/collapse-all) | FUNCTIONAL |
| lyr.parent | Layer parenting (Advanced Layers) | FUNCTIONAL (ours: always) |
| lyr.type | Layer type (Properties) | CONTEXTUAL |
| msk.mask | Mask / Unmask | CONTEXTUAL (layer) |
| msk.mode | Clip vs Alpha mask (ours) | CONTEXTUAL (mask layer) |
| lyr.z | z-depth (Layer Depth panel) | CONTEXTUAL (camera) |
| lyr.attach | Attach-to-camera | CONTEXTUAL (camera) |
## C. STATE MAP
| State | Behavior |
|---|---|
| Locked layer | renders, not selectable (no-entry cursor) |
| Hidden layer | not rendered (red X) |
| Outline layer | outlines only |
| Mask group | mask + masked indented; live preview (no lock needed, ours) |
| Folder | collapse/expand; cascade lock/hide |
| Mobile | long-press layer menu |
## D. EXIT / ESCAPE / UNDO
Esc deselects layer rows; layer ops = commands (rename/lock/hide/delete/reorder).
## E. SHORTCUTS
Insert layer/folder (assignable) · Delete layer. Mobile: long-press.
## F. POINTER + TOUCH
Click eye/lock/outline cells; drag through column = multiple; drag row = reorder; drop into folder = nest.
## G. BUTTON BLOCKS (exemplar)
**lyr.del** — ID lyr.del · Action `layer.delete(active)` (command) · Mask/pose with dependents → confirm modal · Twice-click: no-op after delete.
**msk.mask** — Action `layer.setType('mask')` · No-layer: DISABLED.
## H. OVERLAYS
Layer context menu L4; Layer Properties dialog L5; delete-confirm L6.
## I. ERROR & RECOVERY
Mask-in-button / mask-on-mask → blocked + reason (F-21-02). Delete dependent → confirm.
## J. AUDIT
[x] visible [x] clickable [x] stateful [x] positioned [x] accessible [x] closable [x] responsive [x] tested [x] wired [x] undo.
```
UI COMPLETE  (C-22)
```
