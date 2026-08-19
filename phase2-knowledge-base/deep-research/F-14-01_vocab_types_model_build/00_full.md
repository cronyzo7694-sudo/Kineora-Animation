# F-14-01 — VOCABULARY · F-14-02 — TWO ARMATURE TYPES · F-14-03 — BONE DATA MODEL · F-14-04 — BUILDING
```
SOURCE BLUEPRINT: Part 14 §14.0–14.3 · DEEP FEATURES: F-14-01/02/03/04 · STATUS: AUDITED
DEPENDS ON: F-11-*, F-13-06 · FEEDS: F-14-05..09
```
## F-14-01 VOCABULARY
1. Official name: (bone/armature terms). 4. Purpose: define the IK vocabulary. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] `bone-tool-animation.html`: bones chain objects "from shoulder to elbow to wrist"; parent-child relationships.
TERMS: bone (rigid segment parent-joint→child-joint); armature (whole tree); parent/child (tree edges); joint (bone endpoint/pivot, carries constraints); root (top bone, anchors chain); IK target (end effector = hand); rotation constraint (min/max); translation constraint (x/y enable); bone length; pose (snapshot); armature/pose layer (green); spring (lag/wobble).
TESTS: TS-01 terms map to model fields.

## F-14-02 TWO ARMATURE TYPES
1. Official name: (symbol armature vs IK shape). 4. Purpose: bones connect symbol instances OR carve inside a raw shape. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: "Add bones to symbols" (chain instances) vs "Add bones to shapes" (carve inside a shape). E2 [OFFICIAL] same: IK shape restrictions — **cannot merge with other shapes; cannot rotate/scale/skew with Free Transform; editing control points not recommended; too-complex shape → prompt to convert to movie clip**. E3 [OFFICIAL] same: after adding bones to a shape, **no new strokes; no in-place edit; shape gets its own registration/transform point/bounding box**.
SEMANTICS (table)
| | Symbol armature | IK shape |
|---|---|---|
| Connects | instance pivots | shape control points |
| Deformation | rigid parts | contour bends (bind weights) |
| Edit after | instances editable | shape edit limited (E2/E3) |
LIMITATIONS: L.1 IK shape edit limits (E2/E3) → ours: warn + "bake" escape. L.2 one armature per pose layer (F-14-07).
EDGE: M.1 too-complex shape → convert prompt (E2) · M.2 multiple color areas → marquee-select whole shape first (E2).
TESTS: TS-01 chain instances · TS-02 carve shape · TS-03 IK-shape edit limits enforced · TS-04 complex-shape prompt · TS-05 bake escape (ours).

## F-14-03 BONE DATA MODEL
1. Official name: (bone model). 4. Purpose: local-space bone graph with stable IDs ([WISH W2]). 8. Status: current behavior; model = our design.
EVIDENCE: E1 [BLUEPRINT Part 14.2] model. E2 [COMMUNITY] copy/paste + re-parent corrupts Animate bones → local-space fix.
O. MODEL
```jsonc
"armature": { "bones":[
  { "id":"b0","parentId":null,"childId":"b1","length":60,"rotation":0,
    "translationX":0,"translationY":0,"minRot":-10,"maxRot":130,"rotationLocked":false,
    "xEnabled":false,"yEnabled":false,"jointSpeed":100,"spring":null } ],
  "bindings":[ {"boneId":"b0","targetNodeId":"armUpper_R"} | {"boneId":"b0","controlPoints":[3,4,5]} ] }
```
Rule: each bone stores **angle relative to parent** (local) + stable IDs → copy/paste/re-parent safe (E2).
TESTS: TS-01 local-space angles · TS-02 stable IDs · TS-03 copy/paste no corruption · TS-04 re-parent safe · TS-05 reload.

## F-14-04 BUILDING ARMATURES
1. Official name: (building). 4. Purpose: the click-drag chain workflow. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: symbols — click the root instance, drag from root joint to next instance (child); repeat. E2 [OFFICIAL] same: shapes — select whole shape, click-drag inside to carve first bone, drag from tail for next. E3 [OFFICIAL] same: **moving an instance without others = Alt/Command+drag** (bones lengthen to follow).
SEMANTICS: bone added at click point; chain grows by dragging from a joint.
EDGE: M.1 first bone = root (E1) · M.2 alt-drag instance alone (E3) · M.3 carve multiple bones in a shape (E2).
TESTS: TS-01 click root → chain · TS-02 carve shape bones · TS-03 alt-drag instance alone (E3) · TS-04 undo add-bone.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = IK-shape edit limits (E2/E3) + alt-drag-instance-alone (E3) + local-space fix (E2) — covered.
```
FEATURE COMPLETE: F-14-01/02/03/04 — Vocabulary, armature types, bone model, building — AUDITED
```
