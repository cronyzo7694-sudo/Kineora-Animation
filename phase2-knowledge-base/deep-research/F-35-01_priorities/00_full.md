# F-35-01..04 — IMPLEMENTATION PRIORITY (full part)
```
SOURCE BLUEPRINT: Part 35 · DEEP FEATURES: F-35-01..04 · STATUS: AUDITED
DEPENDS ON: (all features — classification) · FEEDS: Part 36 (final)
```
## A. IDENTITY
1. Official name: (priority classification). 4. Purpose: P0–P3 tiers + build order. 8. Status: current.
## EVIDENCE
E1 [BLUEPRINT Part 35] definitions + full classification table + build order + [WISH] list (community-sourced, Phase-1).
## F-35-01 DEFINITIONS
P0 = MVP core (app useless without); P1 = professional expectations; P2 = advanced/QoL (better than Animate); P3 = optional/niche/legacy.
## F-35-02 CLASSIFICATION (consolidated)
- **P0**: doc model+serializer+autosave, undo, event bus+panels, cross-platform shell, path/stroke/fill/merge/boolean models, core tools (pen/shapes/pencil/brush/eraser), selection+transform, timeline+keyframes+frame-ops, 3 tweens+easing, motion path, symbols/instances/nesting/library, layers/masks/text/color/align, cut-out pipeline, frame-by-frame+onion, shortcuts, context menus.
- **P1**: primitives, paint-brush+brush-library, variable-width, trace-bitmap, distort/envelope, numeric transform, motion presets, graph editor, layer parenting, alpha masks, bone/IK, asset warp, cel/drawing reuse, pose library, facial systems, camera+depth, audio+lip-sync, import/export full, mobile adapter+loupe+toolbar.
- **P2**: plugin API, expand/soften-fill, constant-speed path, auto-key scrub, find&replace colors, auto-blink, camera presets, phoneme-lane, WebM/OGG/FLAC, scene tabs, AI in-betweening (W9), bitmap pencil (W10).
- **P3**: font symbols, ragged/stipple strokes, generator brushes (Deco/Spray), 360° head turns, glTF/WebGL, cloud sync.
## F-35-03 BUILD ORDER
R0 core (Parts 01–06) → R1 animates (07–12) → R2 characters (13–19) → R3 ships everywhere (27–31) → R4 better-than-Animate (the [WISH] list).
## F-35-04 ROADMAP
M1–M6 milestones mapped to releases (Part 00 roadmap).
## L. LIMITATIONS
L.1 P0-first is strict (release blocker). L.2 [WISH] deferred to R4 — do not drop.
## M. EDGE CASES
M.1 a P0 depends on P1 (e.g., graph editor for easing) → our rule: P0 minimum viable, P1 completes.
## O/P/Q/R/S/Y
Data: priority table (meta, not document data). Events: n/a. Undo: n/a. Serialization: n/a. Implementation: roadmap tracker in the queue (Part 00).
## TESTS
TS-01 every queue feature has a tier · TS-02 P0 list is self-sufficient (MVP builds) · TS-03 [WISH] scheduled · TS-04 roadmap covers M1–M6.
## AUDITS
No contradiction. Self-challenge: overlooked = P0-vs-P1-dependency tension + [WISH]-deferral — covered.
```
FEATURE COMPLETE: F-35-01..04 — Implementation priority — AUDITED
```
