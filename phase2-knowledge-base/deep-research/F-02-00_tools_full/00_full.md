# F-02-00..34 — EVERY TOOL (full part)
```
SOURCE BLUEPRINT: Part 02 — Every Tool (animate-blueprint/02a..02d_tools_*.md — 27-field specs)
DEEP FEATURES: F-02-00..34 · STATUS: AUDITED
DEPENDS ON: F-01-15 (tool interface) · FEEDS: Parts 03–06 (tool behavior consumers)
```
## A. IDENTITY
1. Official name: (Tools panel). 4. Purpose: 35 tools, each a stateful interaction mode; full 27-field spec per tool (Phase 1). 8. Status: current (legacy tools marked).

## EVIDENCE REGISTER (key tool facts)
| # | Claim | Status |
|---|---|---|
| E1 | Tools panel = tools/view/colors/options sections. | [OFFICIAL] `using-stage-tools-panel.html` |
| E2 | Selection(V)/Subselection(A)/Free-Transform(Q)/Gradient(F)/3D-Rot(W)/3D-Trans(G)/Lasso(L)/Pen(P)/Text(T)/Line(N)/Rect(R)/Oval(O)/Pencil(Shift+Y)/Paint-Brush(Y)/Brush(B)/Eraser(E)/Width(U)/Eyedropper(I)/Bucket(K)/Ink-Bottle(S)/Bone(M)/Camera(C)/Hand(H)/Zoom(Z). | [OFFICIAL] + [SECONDARY] DefKey (F-29) |
| E3 | Magic Wand: threshold 1–200 (0=exact); smoothing Pixels/Rough/Normal/Smooth; bitmap must be broken apart; flip-bug. | [OFFICIAL] `imported-bitmaps.html` + [COMMUNITY] (F-03-06) |
| E4 | Brush 5 modes (Normal/Fills/Behind/Selection/Inside); Paint-Brush art/pattern brushes; object-mode default for art brushes. | [OFFICIAL] `draw-simple-lines-shapes.html`, `working-with-paint-brush.html` |
| E5 | Bone tool: chain symbols or carve shapes; Alt+drag = move one instance; IK-shape edit limits. | [OFFICIAL] `bone-tool-animation.html` |
| E6 | Camera tool: drag=pan, Shift+drag=zoom, Ctrl+drag=rotate; camera layer. | [OFFICIAL] `working-with-camera-in-animate.html` + [SECONDARY] Medium |
| E7 | Asset Warp (19.0): pins on shapes/drawing-objects/bitmaps; rigid/flexible; Alt+click toggles mode. | [OFFICIAL] `transforming-combining-graphic-objects.html` |
| E8 | Free Transform: cannot distort symbols/bitmaps/text (shape-only). | [OFFICIAL] same (F-04 E2) |

## F-02-00 STROKE CAPTURE & SMOOTHING PIPELINE
resample → RDP + moving-average + straighten → per-point pressure/tilt/velocity → variable-width skeleton; smoothing slider (W5).

## F-02-01..34 TOOL INDEX (27-field specs live in Phase-1 files; consolidated here)
| ID | Tool | Shortcut | Key behavior (deep refs) |
|---|---|---|---|
| F-02-01 | Selection | V | move/marquee/edge-reshape (F-03) |
| F-02-02 | Subselection | A | anchors/handles/motion-path (F-03-02, F-10) |
| F-02-03 | Free Transform | Q | handle zones/pivot/modes (F-04) |
| F-02-04 | Gradient Transform | F | center/scale/rotate/focal (F-23) |
| F-02-05/06 | 3D Rot/Trans | W/G | legacy AS3 (E2) |
| F-02-07 | Lasso/Polygon/Wand | L | freeform/vertices/wand (F-03-06, E3) |
| F-02-08 | Pen (+anchor sub-tools) | P | corner/curve/close/add/delete/convert |
| F-02-09 | Text | T | point/box/3-types (F-22) |
| F-02-10 | Line | N | 2-anchor, 45° snap |
| F-02-11/12 | Rect/Oval | R/O | Shift square/circle, Alt center |
| F-02-13/14 | Rect/Oval Primitive | R/O | parametric (F-06-04) |
| F-02-15 | PolyStar | — | polygon/star params |
| F-02-16 | Pencil | Shift+Y | Straighten/Smooth/Ink |
| F-02-17 | Brush | B | 5 modes + size/shape + lock-fill (E4) |
| F-02-18 | Paint Brush | Y | art/pattern brushes (E4) |
| F-02-19 | Fluid Brush | — | REMOVED (legacy) |
| F-02-20 | Eraser | E | 5 modes + faucet + stroke-split |
| F-02-21 | Width | U | width points + profiles |
| F-02-22 | Eyedropper | I | sample style (no hover-paint, W6) |
| F-02-23 | Paint Bucket | K | flood fill + gap tolerance + lock-fill |
| F-02-24 | Ink Bottle | S | stroke on outline (solid only) |
| F-02-25 | Hand | H | pan (spacebar temp) |
| F-02-26 | Zoom | Z | marquee zoom, Alt out |
| F-02-27 | Stage Rotate | Shift+H | rotate view |
| F-02-28 | Time Scrubber | Shift+Alt+H | scrub anywhere |
| F-02-29 | Bone | M | chain/carve/pose (E5, F-14) |
| F-02-30 | Bind | — | point→bone weighting |
| F-02-31 | Camera | C | pan/zoom/rotate (E6, F-16) |
| F-02-32 | Asset Warp | — | pins/mesh rigid/flexible (E7) |
| F-02-33 | Deco | — | LEGACY (patterns) |
| F-02-34 | Spray Brush | — | LEGACY (scatter) |

## L. LIMITATIONS (tool-scoped, consolidated)
L.1 Distort/Envelope shape-only (E8). L.2 Wand needs break-apart + flip-bug (E3). L.3 Fluid/Deco/Spray removed/legacy. L.4 Bone+AssetWarp incompatible (F-14 E5). L.5 Ink Bottle solid-only (F-05 E1).

## M. EDGE CASES
M.1 tool on locked layer (blocked + reason) · M.2 tool on tween layer (blocked) · M.3 wand on flipped bitmap (E3) · M.4 bone on complex shape (convert prompt) · M.5 pressure absent (constant width).

## O/P/Q/R/S/Y
Data: tool = state machine (no model); writes via DrawCommand/etc. Events: `tool:changed`. Undo: one command per gesture (per-tool granularity in 27-field specs). Serialization: tool options = app prefs. Mobile: tool buttons + gestures (F-31). Implementation: `Tool` interface (F-01-15) + per-tool option schema.

## TESTS
TS-01 tool switch emits tool:changed · TS-02 each tool's shortcut (E2) · TS-03 wand threshold/smoothing (E3) · TS-04 brush modes (E4) · TS-05 bone chain + alt-drag (E5) · TS-06 camera modifiers (E6) · TS-07 warp rigid/flexible (E7) · TS-08 distort shape-only (E8) · TS-09 locked-layer block · TS-10 undo per gesture · TS-11 legacy tools flagged.

## AUDITS
No contradiction. Self-challenge: overlooked = tool-as-state-machine + wand-flip-bug + legacy-tool-set + per-tool-undo-granularity — covered.

```
FEATURE COMPLETE: F-02-00..34 — Every tool — AUDITED
```
