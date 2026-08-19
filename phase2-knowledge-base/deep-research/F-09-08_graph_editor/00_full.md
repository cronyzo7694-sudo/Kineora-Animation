# F-09-08 — GRAPH EDITOR (MOTION EDITOR, AE-STYLE) [WISH W4]
```
SOURCE BLUEPRINT: Part 09 §9.4.4, Part 01 §1.13 · DEEP FEATURE: F-09-08 · STATUS: AUDITED
DEPENDS ON: F-09-01/05/07
```
## A. IDENTITY
1. Official name: Motion Editor (legacy Animate graph editor). 4. Purpose: view/edit every tween property curve on one timeline — multi-property, multi-select, per-property easing (the AE-style experience users want). 8. Status: current (Motion Editor; ours = first-class graph editor per [WISH W4]).

## EVIDENCE
E1 [OFFICIAL] `adding-custom-eases.html`: Motion Editor shows **Eases category** (Add → Custom), property graphs with **solid curve** + **dashed curve** (actual values after ease); hot text dims when ease applied. E2 [OFFICIAL] `using-property-keyframes.html`: **roving keys appear as round dots** (vs squares) in Motion Editor; right-click key → roving. E3 [COMMUNITY] r/animation (Harmony-vs-AE): users want clear keyframes, multi-select many keys, drag values, visible motion path — the AE graph-editor standard. E4 [OFFICIAL] `editing_the_motion_path…html`: **Always Show Motion Paths** option (all layers' paths at once).

## D. CONTROLS
| Control | Behavior |
|---|---|
| Property list (left) | one row per tweenable property (x, y, scaleX…, alpha, filters) |
| Value graph (right) | time (x) vs value (y); keys as dots/diamonds |
| Add key | click on curve / context menu |
| Select keys | click / marquee / Shift+click (multi) |
| Drag key | move value+time (E2: Ctrl+drag = time only) |
| Ease menu per property | apply preset/custom (E1) |
| Dashed overlay | actual values after ease (E1) |
| Roving | round dots; context → roving (E2) |
| Bezier handle editing | curve tangents |

## E. STATES
Key selected vs curve selected; property expanded/collapsed; ease applied (dashed overlay, E1); roving mode (round, E2).

## L. LIMITATIONS
L.1 Animate's Motion Editor is legacy/secondary (hidden behind panel) → ours: primary graph editor (W4). L.2 Hot-text dims under ease (E1) → ours: keep numeric fields editable with live graph sync. L.3 Multi-select weak in Animate → ours: robust multi-select + bulk value edit (W4).

## M. EDGE CASES
M.1 edit a roving key (time-free) · M.2 select keys across properties · M.3 ease on a single segment · M.4 filter param curves · M.5 bulk drag N keys by +10px.

## O/P/Q/R/S/Y
Data: reads/writes span property curves (F-09-07). Events: `timeline:changed`. Undo: one command per graph edit (coalesced per drag). Serialization: curves persisted; graph zoom/scroll = view. Mobile: pinch-zoom graph; tap/drag keys; ease via panel. Implementation: `GraphEditor` panel over the TweenEngine's curve model (Part 32.8); dashed = composed(ease∘value) preview (E1).

## TESTS
TS-01 show all property curves · TS-02 multi-select keys (W4) · TS-03 drag value+time · TS-04 Ctrl+drag time-only (E2) · TS-05 apply ease → dashed (E1) · TS-06 roving round dots (E2) · TS-07 bulk edit N keys · TS-08 add key on curve · TS-09 undo per drag · TS-10 always-show-paths (E4) · TS-11 mobile pinch · TS-12 reload curves.
## AUDITS
No contradiction. Self-challenge: overlooked = dashed-ease-overlay (E1) + roving-dots (E2) + W4 multi-select gap — covered.
```
FEATURE COMPLETE: F-09-08 — Graph editor — AUDITED
```
