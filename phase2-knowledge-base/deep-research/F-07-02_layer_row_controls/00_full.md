# F-07-02 — LAYER ROW CONTROLS (eye / lock / outline / name / type)
```
SOURCE BLUEPRINT: Part 07 §7.1.1 · Part 20 · DEEP FEATURE: F-07-02 · STATUS: AUDITED
DEPENDS ON: F-07-01 · FEEDS: F-20-02/03
```
## A. IDENTITY
1. Official name: (layer controls — Eye/Lock/Outline columns). 4. Purpose: per-layer show/hide, lock, outline mode, naming, and type indicators in the timeline's layer list. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `timeline-layers.html`: **Eye column** = show/hide; **top eye icon** = all; **drag through the column** = multiple; **Alt/Option+click** = hide all **others**. E2 [OFFICIAL] same: **Lock column** = lock/unlock; **padlock icon** = all; drag through = multiple; **Alt+click** = lock all **others**. E3 [OFFICIAL] same: **Outline column** = toggle outline mode (colored square = layer outline color); **Alt+click** = all others as outlines. E4 [OFFICIAL] same: **red X next to layer name** = hidden indicator. E5 [OFFICIAL] same: **Shift+click the eye** = set visibility to **transparent** (dim, not hide); "Show Others Transparent" context command. E6 [OFFICIAL] same: double-click the layer **icon** → Layer Properties (outline color, etc.). E7 [OFFICIAL] same: pencil icon = active layer; **pencil + slash** = active layer is locked/hidden (can't edit). E8 [OFFICIAL] same: folders; expand/collapse triangle; "Expand/Collapse All Folders" right-click. E9 [OFFICIAL] same: lock/hide on a folder cascades to children. E10 [OFFICIAL] same: layer transparency via Layer Properties → Visibility > Transparent. E11 [OFFICIAL] same: **Layer parenting** requires Advanced Layers (ON by default for new files); hierarchy icon top-right. E12 [COMMUNITY] "active layer button" top-left of stage = shorten timeline to show only active layer (view aid).

## C. CONTROLS (per-layer columns + header toggles)
| Control | Click | Alt/Option+click | Drag through | Shift+click |
|---|---|---|---|---|
| Eye | toggle this layer | toggle all OTHERS | multiple | **transparent mode** (E5) |
| Lock | toggle this | lock all OTHERS | multiple | — |
| Outline | toggle this | all OTHERS as outlines | multiple | — |
| Name | select layer (F-03-09) | — | reorder | contiguous multi-select |
| Icon (dbl-click) | Layer Properties (E6) | — | — | — |

## E. STATES
| State | Indicator | Editing |
|---|---|---|
| Active | pencil icon (E7) | editable |
| Active+locked/hidden | pencil + slash (E7) | blocked |
| Hidden | red X (E4) | blocked |
| Transparent (E5) | dimmed | editable (view aid) |
| Outline mode | colored square | editable (outlines only) |
| Folder collapsed | triangle | children hidden in UI |

## L. LIMITATIONS
L.1 Transparent mode (Shift+eye) obscure → ours: surface as a button. L.2 No per-layer opacity slider (only 3 states: full/transparent/hidden) → ours adds numeric layer opacity (P2). L.3 Layer parenting needs Advanced Layers ON → ours: parenting always available (no mode gate).

## M. EDGE CASES
M.1 lock folder → children locked (E9) · M.2 hide folder → children hidden · M.3 Alt+click eye with all hidden → shows all · M.4 transparent + hidden conflict (transparent has no effect on hidden, E5) · M.5 pencil+slash state (E7) · M.6 drag-through column mid-list.

## O/P/Q/R/S/Y
Data: `layer.visible/locked/outline/outlineColor/name/type/transparent` (Part 33). Events: `layer:changed`. Undo: lock/hide/outline/rename = commands (rename also via dialog). Serialization: all layer flags persisted. Mobile: long-press layer row → menu (Part 31). Implementation: column click handlers on LayerRow component; cascade to folder children; header toggles = batch ops.

## TESTS
TS-01 eye toggles one · TS-02 top eye = all · TS-03 Alt+eye = others · TS-04 drag-through multiple · TS-05 Shift+eye = transparent (E5) · TS-06 lock = no edit, still renders · TS-07 outline square toggles · TS-08 red X on hidden (E4) · TS-09 pencil/slash states (E7) · TS-10 folder cascade (E9) · TS-11 dbl-click icon = properties (E6) · TS-12 rename persists · TS-13 parenting needs advanced-layers (or ours: always) · TS-14 mobile long-press menu · TS-15 undo lock toggle.
## AUDITS
No contradiction. Self-challenge: overlooked = Alt+click "others", drag-through, Shift+eye transparent, pencil+slash — covered. Version stable.
```
FEATURE COMPLETE: F-07-02 — Layer row controls — AUDITED
```
