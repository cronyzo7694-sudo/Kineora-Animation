# F-30-01..10 — CONTEXT MENUS (full part)
```
SOURCE BLUEPRINT: Part 30 · DEEP FEATURES: F-30-01..10 · STATUS: AUDITED
DEPENDS ON: F-03 (selection), F-07 (timeline), F-12 (library)
```
## A. IDENTITY
1. Official name: (context menus). 4. Purpose: right-click (long-press) menus scoped to the target. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] `arranging-objects.html`: right-click → Convert To Symbol / Distribute To Layers / Edit / Arrange. E2 [OFFICIAL] `symbols.html`: right-click instance → Edit in Place / Edit In New Window / Edit. E3 [OFFICIAL] `frames-keyframes.html`: right-click frame → Insert Keyframe/Blank Keyframe / Copy-Paste Frames / Span Based Selection. E4 [OFFICIAL] `timeline-layers.html`: right-click layer → Properties / Expand-Collapse All Folders. E5 [BLUEPRINT Part 30] the 10 menu scopes.
## F-30-01..10 MENU SCOPES (consolidated)
| Scope | Commands |
|---|---|
| Stage (empty) | Paste, Paste in Place, Select All/Deselect, Document Properties, Grid/Guides/Rulers, Arrange |
| Object | Cut/Copy/Paste, Duplicate, Convert to Symbol, Break Apart, Edit/Edit-in-Place, Arrange, Transform, Export PNG |
| Shape | + Convert Lines to Fills, Expand/Soften Fill, Smooth/Straighten/Optimize, Add Shape Hint, Combine Objects, Trace Bitmap |
| Symbol | Edit/In-Place/New-Window, Swap, Duplicate Symbol, Break Apart, Instance Name, Arrange/Transform/Export |
| Timeline | Insert Frame/Keyframe/Blank, Insert Scene, prefs |
| Layer | Insert Layer/Folder, Delete, Duplicate, Rename, Properties, Mask/Unmask, Show All/Lock Others, Distribute, Copy/Paste Layer |
| Frame | Insert/Delete/Clear/Remove, Copy/Cut/Paste, Reverse, Convert, Create Tweens, Insert Pose, Actions |
| Library asset | Edit, Duplicate, Rename, Delete, Select Unused, Properties, Export, Update-from-file, Move-to-folder |
| Audio | Sound Properties, Edit Envelope, Stop Sound, Remove, Export |
| Scene | Add/Duplicate/Rename/Delete/Reorder |
## L. LIMITATIONS
L.1 enable/disable per context (predicates) — ours: ContextMenuBuilder. L.2 mobile = long-press (F-31).
## M. EDGE CASES
M.1 menu on empty vs object · M.2 menu during playback · M.3 disabled items greyed.
## O/P/Q/R/S/Y
Data: menu registry (commandId + predicate + label). Events: none (commands emit). Undo: menu command = one entry. Serialization: n/a. Mobile: long-press opens same menu. Implementation: `ContextMenuBuilder(target, ctx)` → ordered command list.
## TESTS
TS-01 stage menu · TS-02 object menu · TS-03 shape extras · TS-04 symbol menu · TS-05 frame menu · TS-06 layer menu · TS-07 library menu · TS-08 audio menu · TS-09 scene menu · TS-10 disabled predicates · TS-11 long-press (mobile) · TS-12 command = one undo.
## AUDITS
No contradiction. Self-challenge: overlooked = per-scope command sets + enable-predicates + long-press-mobile — covered.
```
FEATURE COMPLETE: F-30-01..10 — Context menus — AUDITED
```
