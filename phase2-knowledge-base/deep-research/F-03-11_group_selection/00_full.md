# F-03-11 — DRAWING OBJECT / GROUP SELECTION
```
SOURCE BLUEPRINT: Part 03 §3.4.2, §3.4.3 · DEEP FEATURE: F-03-11 · STATUS: AUDITED
DEPENDS ON: F-03-01/02/03
```
## A. IDENTITY
1. Official name: (drawing-object selection / group selection). 4. Purpose: select **atomic** containers (drawing objects, groups) and drill into them via double-click. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Groups/instances/text need **enclosure** to marquee-select (F-03-01 E2). E2 [OFFICIAL] Double-click group → edit group; outside dims; double-click blank = Edit All (F-03-03 E5). E3 [OFFICIAL] Click selects group/object as a whole; Properties shows x/y + dimensions. E4 [OFFICIAL] Arrange > Group/Ungroup; Ctrl+G/Ctrl+Shift+G. E5 [OFFICIAL] Drawing objects atomic; overlapping objects don't merge (Part 06).

## D. INTERACTIONS
Click = whole container selected (no sub-object). Double-click = edit-in-place (dim scope). Shift+click = toggle. Marquee = enclosure (contact pref). Right-click = group/object menu.

## E. STATES
Top-level: container selected (child not). Edit-in-place: children selectable; outside dimmed+excluded. Locked/hidden: excluded.

## F. COMPATIBILITY
Drawing object: atomic, edit-in-place. Group: atomic, edit-in-place, ungroup/break-apart.

## L. LIMITATIONS
L.1 Enclosure required for marquee (E1) → ours: contact toggle + hint. L.2 No child selection without entering edit scope → ours: Alt+click to reach child (P2).

## M. EDGE CASES
M.1 double-click while Simple-Buttons... n/a. M.2 group inside group → descend per level. M.3 undo of group edit = normal command. M.4 break-apart group → children flatten (Part 06.8).

## O/P/Q/R/S/Y
Data: `{nodeId}` target, `editMode.scope:'group'`. Events: `selection:changed`, `editMode:entered/exited`. Undo: selection none; edits = commands. Serialization: group persisted; editMode not. Mobile: double-tap to drill. Implementation: container hit (bounds) → atomic target; double-click → edit scope.

## TESTS
TS-01 click group = whole · TS-02 double-click = edit scope + dim · TS-03 blank double-click = exit · TS-04 marquee enclosure (contact OFF) · TS-05 shift-toggle · TS-06 locked excluded · TS-07 nested group descend · TS-08 undo group edit · TS-09 mobile double-tap · TS-10 break-apart flatten.

## AUDITS
No contradiction. Self-challenge: overlooked = enclosure (E1) + edit-scope exclusivity + nested descend — covered. Version stable.
```
FEATURE COMPLETE: F-03-11 — Drawing object / group selection — AUDITED
```
