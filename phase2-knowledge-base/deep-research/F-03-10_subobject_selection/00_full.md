# F-03-10 — RAW-SHAPE SUB-OBJECT SELECTION (FILL vs STROKE)

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.4.1)
DEEP FEATURE:      Raw-shape sub-object selection (fill-only / stroke-only; split-on-move)
QUEUE ID:          F-03-10
STATUS:            FULLY RESEARCHED → AUDITED
DEPENDS ON:        F-03-01 Hit testing · F-03-02 (subPath targets) · F-03-03 (click)
```

## A. IDENTITY
| Field | Value |
|---|---|
| 1. Official name | (no single name) — "You can choose to select only an object's strokes or only its fills" (Adobe doc). |
| 4. Purpose | Select a raw shape's **fill** and **stroke** as **independent sub-objects**, so one can be moved/deleted/restyled without the other — and moving a partial selection **splits** the shape (merge model). |
| 8. Status | Current (the defining Flash/Animate merge-model behavior). |

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | Click a fill selects the fill; click a stroke selects the stroke — treated separately. | [OFFICIAL] `selecting-objects.html` + [SECONDARY] |
| E2 | Double-click a fill selects fill **and** stroke together. | [OFFICIAL] |
| E3 | Double-click a stroke selects all **connected strokes**. | [OFFICIAL] |
| E4 | Moving a partially-selected raw shape **cuts/splits** it (the region detaches). | [COMMUNITY REPORT] 2017 (F-03-01 E13) |
| E5 | Fill and stroke move/adjust separately (each has own style in Properties). | [COMMUNITY] 2020 (F-03-01 E12) |
| E6 | A marquee partially over a raw shape selects the intersected **region** (always, regardless of contact pref). | [OFFICIAL/COMMUNITY] F-03-05 E5 |

## B. UI LOCATION
```
Tools panel → Selection tool (V) → click/double-click on a raw shape
Stage → the shape's fill area (speckled highlight) vs stroke (colored highlight)
```

## D. INTERACTIONS
| Action | Result |
|---|---|
| Click fill | fill selected (speckled); stroke unselected (E1) |
| Click stroke | stroke selected; fill unselected (E1) |
| Double-click fill | fill+stroke (E2) |
| Double-click stroke | connected strokes (E3) |
| Drag selected fill | fill splits away from the shape (E4) |
| Drag selected stroke | stroke splits from the shape |
| Marquee partial | region selected (E6) → move splits |

## E. STATES
| State | Behavior |
|---|---|
| Fill only selected | fill schema in Properties; stroke untouched |
| Stroke only selected | stroke schema (width/style/cap/join) |
| Fill+stroke selected | whole-shape schema (E2) |
| Region selected (marquee) | partial-shape selection; move = split (E4) |
| Merge mode OFF (object mode) | **no sub-object selection** — drawing objects are atomic |

## F. OBJECT COMPATIBILITY
| Type | Sub-object selection |
|---|---|
| Raw shape (merge mode) | **SUPPORTED** — fill / stroke / region (E1/E6) |
| Drawing object | NOT SUPPORTED (atomic; double-click to edit in place) |
| Group / instance / text / bitmap | NOT SUPPORTED (atomic) |
| IK shape | PARTIAL (bones deform; contour points via Subselection) |

## DATA MODEL (subPath targets — F-03-02 O)
```jsonc
{ "nodeId":"n1", "subPath":"fills[0]" }      // fill sub-object
{ "nodeId":"n1", "subPath":"strokes[0]" }    // stroke sub-object
// region selection (marquee) = a computed sub-region (temp geometry, resolved on the move command)
```
**Key rule (carried from blueprint Part 03 §3.4.1):** sub-object selection does **not** split the shape in the model immediately; the split happens on the first move/cut/delete command (one undo entry). This preserves undo granularity.

## L. LIMITATIONS
| # | Limitation | Trigger | Actual | Severity | Source | Better (ours) |
|---|---|---|---|---|---|---|
| L.1 | Split-on-move surprises | partial select + drag | shape cut apart | Medium | [COMMUNITY] E4 | region-select lock toggle (F-03-01 L.1) |
| L.2 | Fill/stroke ambiguity at edges | click near outline | wrong sub-object | Low | [COMMUNITY] E5 | hover highlights which sub-object will select |
| L.3 | Double-click stroke ≠ fill+stroke | dbl-click stroke | strokes only | Low | [OFFICIAL] E3 | tooltip: "double-click the FILL for both" |
| L.4 | No sub-object selection in object mode | draw with Object Drawing ON | atomic only | Low | [OFFICIAL] F-03-01 E9 | status-bar shows current mode |

## M. EDGE CASES
M.1 fill-only shape (no stroke) → click fill = fill; no stroke to select · M.2 stroke-only shape → click inside outline = miss (F-03-01 M.24) · M.3 self-intersecting fill → winding rule region · M.4 moving fill leaves a "ghost" stroke (then delete) · M.5 double-click fill on a shape whose stroke was already deleted → fill only · M.6 region marquee then move = split (E4) vs region marquee then delete = hole · M.7 sub-object + Shift toggle (add fill of another shape) · M.8 undo of a split = shape re-merges (one command).

## O/P/Q/R
- Data: subPath targets (above); region = temp geometry.
- Events: `selection:changed` (sub-object target).
- Undo: selection = none; **split/move/delete = one command** (model splits at command time).
- Serialization: selection not persisted; the split result (two shapes) IS persisted after the command.

## S/T/U/V
- Mobile: tap fill/stroke; double-tap fill = fill+stroke; region-select lock protects against accidental splits on touch.
- Stylus: 1-px precision for stroke-edge hits.
- Accessibility: announce "fill selected / stroke selected / shape selected".
- Performance: fill/stroke hit via path tests (F-03-01 V); split = boolean subtract (Part 06 engine).

## W. WORKFLOWS
W.1 Move just the stroke: click stroke → drag → stroke detaches (E4).
W.2 Grab the whole shape: double-click the fill (E2) → move.
W.3 Carve a piece: marquee partial region → drag → piece splits off (E6/E4).

## X. ALTERNATIVES
Whole shape: double-click fill (E2) vs Shift+click fill+stroke vs marquee-all. Region cut: partial marquee+drag vs Lasso+drag. Best: double-click fill (fast); lasso for organic cuts.

## Y. IMPLEMENTATION (OURS)
- Targets carry `subPath` (fills[i]/strokes[i]); region selection = a temp clip region.
- Split-on-move = boolean subtraction executed by the shape engine at command time (Part 06), one undo entry.
- Hover sub-object preview (L.2 fix); region-select lock (L.1 fix); object/merge mode indicator (L.4 fix).

## TEST MATRIX
TS-01 click fill = fill only (E1) · TS-02 click stroke = stroke only · TS-03 double-click fill = both (E2) · TS-04 double-click stroke = connected strokes (E3) · TS-05 drag fill = split (E4) · TS-06 partial marquee + drag = split · TS-07 partial marquee + delete = hole · TS-08 object mode = atomic (no sub-object) · TS-09 undo split = re-merge · TS-10 fill-only shape · TS-11 stroke-only shape miss inside · TS-12 shift-toggle sub-objects · TS-13 region-select lock ON = no split · TS-14 mobile double-tap fill · TS-15 stylus stroke-edge 1px hit · TS-16 serialization of split result.

## AUDITS
**Contradiction:** none (sub-object behavior consistent across official+community). **Completeness:** complete. **Self-challenge:** overlooked = split-at-command-time (not at selection time) + stroke-only interior miss + object-mode exclusion — covered. **Version:** unchanged since Flash (defining behavior).

```
FEATURE COMPLETE: F-03-10 — Raw-shape sub-object selection — AUDITED
```
