# F-03-12 — SYMBOL INSTANCE SELECTION
```
SOURCE BLUEPRINT: Part 03 §3.4.4 · DEEP FEATURE: F-03-12 · STATUS: AUDITED
DEPENDS ON: F-03-01/02/03/11 · FEEDS: Part 11 symbol editing
```
## A. IDENTITY
1. Official name: (instance selection). 4. Purpose: select a **symbol instance** (a reference to a Library definition) as one unit; the definition edits only via drill-down. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Click selects a stroke/fill/group/**instance**/text (F-03-01 E3). E2 [OFFICIAL] Instances need **enclosure** to marquee-select (F-03-01 E2). E3 [OFFICIAL] Double-click instance = Edit in Place; exit via Back/scene/double-click-outside (F-03-03 E6). E4 [OFFICIAL] Instance ≠ definition: editing instance (transform/tint) ≠ editing symbol (updates all) (Part 11). E5 [OFFICIAL] Double-click Library icon = symbol-editing mode (full window) (F-03-03 M.20).

## D. INTERACTIONS
Click = instance selected (bounding box + pivot). Double-click = edit-in-place. Shift+click = toggle. Marquee = enclosure (contact pref). Right-click = instance menu (Edit/Swap/Break Apart).

## E. STATES
Top-level: instance (never inner frames). Edit-in-place: symbol's timeline content selectable. Broken reference (deleted symbol): select + warn (ours). Live button (Simple Buttons ON): click activates, marquee selects (F-03-03 E9).

## F. COMPATIBILITY
Graphic/movie clip/button instances: atomic target `{nodeId}`. Nesting: outermost wins; descend per double-click.

## L. LIMITATIONS
L.1 Enclosure for marquee (E2) → hint. L.2 Instance vs definition confusion (E4) → breadcrumb + distinct highlight. L.3 Button-live blocks click-select (F-03-03 L.1) → Alt+click force-select.

## M. EDGE CASES
M.1 3-deep nested symbol descend/exit · M.2 double-click with Subselection = no edit (F-03-03 E12) · M.3 broken ref (deleted symbol) · M.4 swap symbol keeps transform (Part 11) · M.5 instance on pasteboard selectable.

## O/P/Q/R/S/Y
Data: `{nodeId}` + `editMode.scope:'symbol', symbolId`. Events: `selection:changed`, `editMode:*`. Undo: selection none; symbol edits = commands (propagate to all instances). Serialization: instance persisted; editMode not. Mobile: double-tap = edit-in-place. Implementation: instance hit = bounds; double-click opens symbol scope; breadcrumb stack.

## TESTS
TS-01 click instance · TS-02 marquee enclosure · TS-03 double-click edit-in-place · TS-04 double-click Library icon = symbol mode · TS-05 exit paths (Back/scene/outside) · TS-06 instance transform ≠ definition · TS-07 broken ref warn · TS-08 live button marquee-select · TS-09 nested descend · TS-10 swap keeps transform · TS-11 undo definition edit propagates · TS-12 mobile double-tap.

## AUDITS
No contradiction. Self-challenge: overlooked = instance-vs-definition (E4), live-button block, Library-icon-vs-stage double-click difference (M.2/E5) — covered. Version stable.
```
FEATURE COMPLETE: F-03-12 — Symbol instance selection — AUDITED
```
