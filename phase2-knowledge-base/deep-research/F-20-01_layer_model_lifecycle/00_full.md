# F-20-01 — LAYER DATA MODEL · F-20-02 — LIFECYCLE OPS · F-20-03 — STATE TOGGLES
```
SOURCE BLUEPRINT: Part 20 §20.0–20.2 · DEEP FEATURES: F-20-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-07-01/02 · FEEDS: F-20-04..07
```
## F-20-01 LAYER DATA MODEL
1. Official name: (layer). 4. Purpose: a frame strip + display properties. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] `timeline-layers.html` (F-07-02 E1–E11). E2 [BLUEPRINT Part 20.0] model.
O. MODEL
```jsonc
{ "id":"L3","name":"arm_R","type":"normal","visible":true,"locked":false,"outline":false,
  "outlineColor":"#ff0000","parentId":null,"zDepth":0,"attachedToCamera":false,"frames":[...],"height":18 }
```
TESTS: TS-01 round-trip layer flags · TS-02 rename-safe (ID) · TS-03 reload.

## F-20-02 LIFECYCLE OPS
1. Official name: (layer ops). 4. Purpose: create/delete/rename/move/duplicate/copy-paste. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `timeline-layers.html`: select layer = click name / click any frame / click its object; Shift+click contiguous; Ctrl/Cmd+click non-contiguous; drag to reorder; double-click name to rename. E2 [BLUEPRINT Part 20.1]: create above active; delete prompt if dependents; duplicate = deep copy.
SEMANTICS
| Op | Result |
|---|---|
| Create | append above active; becomes active |
| Delete | remove + frames; prompt if mask/guide/pose with dependents |
| Rename | display-only (ID stable) |
| Move (reorder) | render order (top = front) |
| Duplicate | deep copy (frames+content) |
| Copy/Paste layer | cross-timeline |
LIMITATIONS: L.1 layer count limited by memory only [OFFICIAL]. L.2 layers don't increase file size (only objects) [OFFICIAL].
EDGE: M.1 delete active layer (fallback, F-03-02 M.22) · M.2 reorder into a folder · M.3 paste layer name collision.
TESTS: TS-01 create above active · TS-02 delete prompt · TS-03 rename-safe · TS-04 reorder render · TS-05 duplicate deep · TS-06 cross-timeline paste · TS-07 undo.

## F-20-03 STATE TOGGLES
1. Official name: (visible/locked/outline). 4. Purpose: per-layer show/lock/outline with cascade. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `timeline-layers.html`: eye = show/hide (+ red X hidden); lock = prevent changes; outline = colored square; folder cascade (lock/hide folder → all children). E2 [OFFICIAL] same: publish settings choose whether hidden layers are included in export.
SEMANTICS (matrix, F-03-15 E)
| State | Rendered | Selectable | Editable | Exported |
|---|---|---|---|---|
| Normal | yes | yes | yes | yes |
| Locked | yes | no | no | yes |
| Hidden | no | no | no | no (default) |
| Outline | outlines | yes | yes | fully |
LIMITATIONS: L.1 hidden-layer export opt-in (E2) → ours: visible export toggle. L.2 lock still renders (vs hidden) — common confusion → tooltip.
EDGE: M.1 folder lock cascades · M.2 outline on a mask layer (renders mask outline).
TESTS: TS-01 eye toggle + red X · TS-02 lock no-edit still-renders · TS-03 hidden not-rendered · TS-04 outline view · TS-05 folder cascade · TS-06 export-hidden toggle (ours) · TS-07 undo toggle.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = locked-renders-vs-hidden-not + folder cascade + export-hidden opt-in — covered.
```
FEATURE COMPLETE: F-20-01/02/03 — Layer model, lifecycle, state toggles — AUDITED
```
