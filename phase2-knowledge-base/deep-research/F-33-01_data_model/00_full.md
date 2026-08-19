# F-33-01..19 — DATA MODEL (full part)
```
SOURCE BLUEPRINT: Part 33 — Data Model (JSON schemas)
DEEP FEATURES: F-33-01..19 · STATUS: AUDITED
DEPENDS ON: F-32 (architecture) · FEEDS: Phase 3 (global audit)
```
## A. IDENTITY
1. Official name: (project data model — ours). 4. Purpose: the 19 JSON schemas — the single source of truth. 8. Status: our-design.

## EVIDENCE
E1 [BLUEPRINT Part 33] 19 schemas + conventions (ID stable, dataRef indirection, formatVersion). E2 [OUR DESIGN DECISION] sparse frames + derived duration (F-07-01).

## F-33-01..19 SCHEMA INDEX (full schemas in Phase-1 Part 33; conventions consolidated)
| ID | Schema | Key fields |
|---|---|---|
| F-33-01 | Project | formatVersion/meta/settings/scenes/library/brushes/preferences |
| F-33-02 | Scene | id/name/timeline/backgroundOverride |
| F-33-03 | Layer | type/visible/locked/outline/parentId/transformParentId/zDepth/maskMode/frames |
| F-33-04 | Character | rootSymbolId/parts/rigs/poses/clips |
| F-33-05 | Body Part | symbolId/parentId/pivot/zOrder |
| F-33-06 | Bone/Armature | bones(parentId/childId/length/rotation/constraints)/bindings |
| F-33-07 | Symbol & Instance | symbolType/registrationPoint/timeline; colorEffect/filters/loop/instanceName |
| F-33-08 | Frame | keyframe/blankKeyframe/tween/classicTween/shapeTween/pose (sparse) |
| F-33-09 | Keyframe | frame/property/value/ease/orientation/rotations/roving |
| F-33-10 | Tween preset | id/name/kind/properties |
| F-33-11 | Pose | id/name/parts/bones |
| F-33-12 | Audio | asset(durationMs/sampleRate/dataRef) + attachment(sync/loop/trim/volume/envelope) |
| F-33-13 | Mouth Shape | mouthPoses(frame/viseme) + lipSync(visemeMap/result/leadMs/blend) |
| F-33-14 | Camera | enabled/x/y/z/zoom/rotation/tint/filters |
| F-33-15 | Asset | kind(width/height/dataRef | durationMs | symbolType/timeline | brushDef) |
| F-33-16 | Transform | x/y/scaleX/scaleY/rotation/skewX/skewY/pivotX/pivotY |
| F-33-17 | Text | textType/style/box/embedFonts/antiAlias/binding |
| F-33-18 | Effect | colorEffect(mode/value) + filters(type/params) |
| F-33-19 | Shape | type/path(anchors)/fills(regions/styles)/strokes(widthProfile)/params/children |

## L. LIMITATIONS
L.1 ID-based refs (rename-safe) vs Animate legacy linkage — ours: IDs. L.2 dataRef indirection (binaries not inlined).

## M. EDGE CASES
M.1 formatVersion migration · M.2 broken dataRef (warn) · M.3 sparse frames round-trip · M.4 nested symbol refs.

## O/P/Q/R/S/Y
Data: the schemas (document). Events: n/a. Undo: n/a. Serialization: JSON Schema validator + dataRef packaging. Implementation: schema set + validator + migration function.

## TESTS
TS-01 all 19 schemas valid · TS-02 serializer round-trip · TS-03 dataRef indirection · TS-04 migration · TS-05 rename-safe IDs · TS-06 sparse frames · TS-07 nested symbol refs · TS-08 reload identical.

## AUDITS
No contradiction (our-design, labeled). Self-challenge: overlooked = ID-stability + dataRef-indirection + formatVersion-migration — covered.

```
FEATURE COMPLETE: F-33-01..19 — Data model — AUDITED
```
