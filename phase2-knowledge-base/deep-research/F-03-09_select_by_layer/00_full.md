# F-03-09 — SELECT BY LAYER (+ ACTIVE LAYER TRACKING)

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.6, §3.3.7)
DEEP FEATURE:      Select by layer (layer-row selection vs content selection; active-layer tracking)
QUEUE ID:          F-03-09
STATUS:            FULLY RESEARCHED → AUDITED
DEPENDS ON:        F-03-02 (dual-domain) · F-03-08 (timeline selection)
```

## A. IDENTITY
| Field | Value |
|---|---|
| 1. Official name | Layer selection / active layer (no single official name; observable behavior). |
| 4. Purpose | Select **layer rows** (for rename/delete/reorder/lock/hide) independently of their **content**; track the **active layer** where new drawings land. |
| 5. Category | Timeline-domain selection. |
| 8. Status | Current. |

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | The **active layer** is highlighted (pencil icon) and receives new drawings. | [OBSERVED — universal Animate UI; docs reference "active layer"] |
| E2 | Clicking a layer row selects the layer (rename/delete/reorder ops become available). | [OBSERVED] |
| E3 | Selecting content on a layer makes that layer active. | [INFERENCE from workflow] |
| E4 | Lock/hide/outline on a layer do **not** affect layer-row selection (only content selection). | [OFFICIAL] F-03-01 E7 + layer docs |
| E5 | Layer auto-select behavior: clicking empty space "switches layers" (community complaint about auto layer-switching on click). | [COMMUNITY REPORT] 2022 |
| E6 | Select All respects layer lock/hide (F-03-07 E1). | [OFFICIAL] |

## B. UI LOCATION
```
Timeline → layer rows (click = select layer; pencil = active)
Layer context menu (right-click) → Select All on Layer (our addition), lock/hide/outline
```

## D. INTERACTIONS
| Action | Result |
|---|---|
| Click a layer row | layer selected (timeline-domain); NOT its content |
| Click content on stage | that content's layer becomes **active** (E3) |
| Draw with a tool | lands on the **active layer** (E1) |
| Lock/hide/outline toggle | affects content selection, not row selection (E4) |
| Right-click layer row | layer context menu (Part 30) |

## E. STATES
| State | Layer-row selection | Content selection |
|---|---|---|
| Layer locked | still selectable (row) | blocked (F-03-01 E7) |
| Layer hidden | still selectable (row) | blocked |
| Outline mode | still selectable | allowed |
| Active layer | pencil highlighted (E1) | its content editable |
| Folder collapsed | row selectable; children hidden in UI | children not stage-selectable |

## F. OBJECT COMPATIBILITY
Layer selection is **type-agnostic** (operates on rows). Content-selection side-effects respect the F-03-01 F matrix.

## L. LIMITATIONS
| # | Limitation | Trigger | Actual | Severity | Source | Better (ours) |
|---|---|---|---|---|---|---|
| L.1 | Clicking empty space can auto-switch active layer | click near/behind content | active layer changes unexpectedly | Medium | [COMMUNITY] E5 | toggle "auto-select layer on click" (default OFF, ours) |
| L.2 | No "Select All on Layer" shortcut | per-layer bulk select | manual marquee | Low | [INFERENCE] | add right-click → Select All on Layer |
| L.3 | Active layer not persisted in some flows | reload | last-active lost | Low | F-03-02 R | persist activeLayerId (already our choice) |

## M. EDGE CASES
M.1 active layer deleted → fallback to nearest surviving (F-03-02 M.22) · M.2 active layer locked → draw attempts blocked with reason · M.3 selecting content on a hidden layer (impossible) · M.4 folder selected → ops cascade to children · M.5 multi-layer select (rows) → batch lock/hide.

## O/P/Q/R
- Data: `timelineSelection.selectedLayers[]` + `activeLayerId` (F-03-02 O).
- Events: `timelineSelection:changed`.
- Undo: layer-row selection = view state; layer ops (rename/delete/reorder) = commands.
- Serialization: `activeLayerId` persisted (convenience); row selection not.

## S/T/U/V
- Mobile: tap row = select; long-press = layer menu; active-layer indicated by highlight.
- Stylus: as mouse.
- Accessibility: announce active layer name on change.
- Performance: O(1) row selection.

## W. WORKFLOWS
W.1 Draw on a specific layer: click the layer row → active (pencil) → draw.
W.2 Batch lock: multi-select rows → lock all.
W.3 Reorder: drag a row up/down (Part 20).

## X. ALTERNATIVES
Make a layer active: click row (explicit) vs click its content (E3 implicit). Best: row-click for intent, content-click for speed.

## Y. IMPLEMENTATION (OURS)
- `selectLayer(id)` / `setActiveLayer(id)` write `timelineSelection`; content-click promotion gated by `autoSelectLayerOnClick` (default OFF, L.1 fix).
- Add "Select All on Layer" context command (L.2 fix).
- Persist activeLayerId (L.3).

## TEST MATRIX
TS-01 row click selects layer not content · TS-02 content click makes layer active · TS-03 draw lands on active layer · TS-04 locked row still selectable · TS-05 hidden row selectable, content not · TS-06 active layer deleted → fallback · TS-07 auto-select-on-click OFF (ours) · TS-08 multi-row batch lock · TS-09 folder cascade · TS-10 undo (row select none; ops one) · TS-11 mobile tap/long-press · TS-12 reload restores activeLayerId.

## AUDITS
**Contradiction:** none. **Completeness:** complete. **Self-challenge:** overlooked = auto layer-switching (E5) + active-layer persistence — covered. **Version:** stable.

```
FEATURE COMPLETE: F-03-09 — Select by layer — AUDITED
```
