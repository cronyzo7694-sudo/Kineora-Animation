# F-03-15 — LOCKED & HIDDEN OBJECT BEHAVIOR
```
SOURCE BLUEPRINT: Part 03 §3.7 · DEEP FEATURE: F-03-15 · STATUS: AUDITED
DEPENDS ON: F-03-01 · FEEDS: Part 20 (layers)
```
## A. IDENTITY
1. Official name: (layer lock/hide; object lock). 4. Purpose: exclude content from **selection and editing** without deleting it. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Select All does **not** select locked/hidden layers, or non-current-timeline layers (F-03-07 E1). E2 [OFFICIAL] Lock a group/symbol to prevent accidental selection/change (F-03-03 E-src "lock the group or symbol"). E3 [OFFICIAL] Hidden layers not rendered; locked layers still rendered (Part 20). E4 [OFFICIAL] Outline mode = view aid; content still selectable (Part 20). E5 [INFERENCE] Hidden layers excluded from export by default ("export hidden layers" off).

## D. INTERACTIONS
Click/marquee/select-all on locked/hidden → skipped (no selection, no error). Locked layer still renders. Hidden layer not rendered, not selectable.

## E. STATES
| State | Rendered | Selectable | Editable | Exported |
|---|---|---|---|---|
| Normal | yes | yes | yes | yes |
| Locked layer | yes | **no** | **no** | yes |
| Hidden layer | **no** | **no** | **no** | **no** (default) |
| Outline layer | outlines | yes | yes | fully |
| Locked object (Arrange>Lock) | yes | **no** | **no** | yes |
| Hidden object (ours) | no | no | no | no (toggle) |

## L. LIMITATIONS
L.1 Silent skip (no feedback) → ours: no-entry cursor + toast. L.2 Hidden layers export excluded by default but users forget → publish warning (F-03-07 L.3). L.3 No per-object hide in Animate → ours adds it.

## M. EDGE CASES
M.1 locked layer + select-all → skipped (E1) · M.2 lock a symbol then try drag → no-op · M.3 hidden layer content still in file (just not rendered) · M.4 outline mode + select → allowed (E4) · M.5 lock folder → cascades to children (Part 20).

## O/P/Q/R/S/Y
Data: `layer.visible/locked/outline`, `node.locked` (object). Events: `layer:changed`, `selection:lost` (if a selected object becomes hidden/locked). Undo: lock/hide toggles = commands (or view state? → ours: **layer lock/hide = commands**, object lock = command). Serialization: layer flags persisted. Mobile: lock/hide via layer long-press menu. Implementation: hit-test skips (F-03-01 Y); renderer skips hidden.

## TESTS
TS-01 click locked layer = nothing · TS-02 select-all excludes locked (E1) · TS-03 excludes hidden · TS-04 locked layer still renders · TS-05 hidden not rendered · TS-06 outline mode selectable (E4) · TS-07 object-lock skip · TS-08 folder lock cascades · TS-09 no-entry cursor (ours) · TS-10 export-hidden warning (ours) · TS-11 hidden-object toggle (ours) · TS-12 undo lock toggle.

## AUDITS
No contradiction. Self-challenge: overlooked = locked-still-renders vs hidden-not + export exclusion + cascade — covered. Version stable.
```
FEATURE COMPLETE: F-03-15 — Locked & hidden behavior — AUDITED
```
