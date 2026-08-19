# F-03-16 — SELECTION OVERLAY (BOUNDING BOX, HIGHLIGHT, HANDLES)
```
SOURCE BLUEPRINT: Part 03 §3.5, §3.8 · DEEP FEATURE: F-03-16 · STATUS: AUDITED
DEPENDS ON: F-03-02 (selection state) · FEEDS: Part 04 (transform handles)
```
## A. IDENTITY
1. Official name: (selection highlight / bounding box). 4. Purpose: draw the **visual feedback** of selection — outline, dotted fill, bounding box, handles, anchors — as a non-exported overlay. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] When an object is selected, a **rectangular box** appears around it (F-03-01 E18). E2 [OFFICIAL] **Custom bounding-box colors per object type**: Preferences > General > Highlight Color (F-03-02 E6). E3 [OFFICIAL] **Hide Edges** (View > Hide Edges) hides selection highlighting; toggle to restore (F-03-02 E5). E4 [OFFICIAL] Selected strokes/fills highlighted with a marquee/pattern ("highlights them with a marquee"); raw-shape fill = speckled/dotted [OBSERVED]. E5 [OFFICIAL] Subselection shows control points + Bézier handles (F-03-01 E3-src). E6 [INFERENCE] Overlay never exports (it is authoring-only).

## B. UI LOCATION
```
Preferences > General > Highlight Color (per type)   [E2]
View > Hide Edges (Ctrl/Cmd+Shift+E)                 [E3]
Stage → overlay drawn by SelectionOverlayRenderer
```

## C. CONTROLS
| Control | Purpose | Default |
|---|---|---|
| Highlight color per type (E2) | bounding-box color | per-type preset |
| Hide Edges (E3) | suppress highlight | OFF |

## D. OVERLAY ELEMENTS (per selection kind)
| Element | When | Concept |
|---|---|---|
| Selection outline | raw shape/stroke selected | path highlighted (true shape) |
| Dotted fill | raw fill selected | translucent fill + dot texture |
| Bounding box | object/group/instance/text/bitmap | 1–2 px rect (AABB; rotated = rotated bounds) |
| Transform handles + pivot | Free Transform (Part 04) | 8 handles + rotation zone + pivot |
| Anchor dots + tangent handles | Subselection | squares + handle lines |
| Bone glyphs + bind points | armature selected | bone lines + bound squares/triangles |
| Warp pins | warp asset selected | small circles |
| Camera outline | camera active | stage-border rectangle + slider |

## E. STATES
Highlight shown (default) vs hidden (Hide Edges, E3). Bounding box for rotated objects shows **rotated AABB** (F-03-02 E3/M.9). Mixed selection = union box.

## L. LIMITATIONS
L.1 Bounding box vs outline confusion (AABB vs true path) → ours: draw box dashed + outline solid (F-03-02 L.5). L.2 Highlight colors global per type, not per-instance → ours: + per-selection override (P2). L.3 Hide Edges hides ALL highlights (no selective) → ours: per-layer highlight suppression (P2).

## M. EDGE CASES
M.1 zero-size object box · M.2 off-stage box extends past stage · M.3 rotated AABB vs OBB · M.4 hide-edges while selecting (F-03-02 M.24) · M.5 mixed-type union box · M.6 anchor cloud box (subselection).

## O/P/Q/R/S/Y
Data: overlay derives entirely from `selection` + `editMode` + camera state (no separate model). Events: `selection:changed` → redraw. Undo: n/a (render pass). Serialization: highlight colors = app prefs; hide-edges = view flag. Mobile: overlay + larger handles (Part 31); reduced-motion = no animated dashes. Implementation: `SelectionOverlayRenderer` drawn last, skipped in export/thumbnails.

## TESTS
TS-01 box appears on select (E1) · TS-02 rotated = rotated AABB · TS-03 mixed = union box · TS-04 dotted fill highlight · TS-05 per-type color (E2) · TS-06 hide-edges suppresses (E3) · TS-07 overlay not in export · TS-08 subselection anchors · TS-09 bone glyphs · TS-10 warp pins · TS-11 camera outline · TS-12 mobile larger handles · TS-13 zero-size box · TS-14 off-stage box.

## AUDITS
No contradiction. Self-challenge: overlooked = overlay-never-exports + rotated-AABB + hide-edges-global — covered. Version stable.
```
FEATURE COMPLETE: F-03-16 — Selection overlay — AUDITED
```
