# F-14-05 — IK SOLVERS · F-14-06 — CONSTRAINTS · F-14-07 — POSE LAYER · F-14-08 — POSE EDITING · F-14-09 — BONE ANIMATION
```
SOURCE BLUEPRINT: Part 14 §14.4–14.8 · DEEP FEATURES: F-14-05..09 · STATUS: AUDITED
DEPENDS ON: F-14-03/04
```
## F-14-05 IK SOLVERS
1. Official name: (IK solving). 4. Purpose: compute joint angles so the end effector reaches the drag target. 8. Status: current (behavior); solver internals = our design.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: dragging a bone poses the armature; Animate interpolates positions between poses. E2 [BLUEPRINT Part 14.4]: 2-bone analytic + CCD + FABRIK; unreachable → straighten; constraints clamp; **solve at author-time only** (playback interpolates stored angles).
SEMANTICS (drag-the-hand sequence)
```
grab → capture pose → on move: reach test (unreachable → straighten toward target)
  → solve (2-bone analytic / FABRIK / CCD) → clamp constraints → write pose
release → PoseCommand (one undo)
```
- Playback = interpolate angles (no re-solve) — deterministic (E1/E2).
LIMITATIONS: L.1 playback doesn't re-solve (can look off-path) → ours: optional re-solve preview. L.2 bend-direction ambiguity (elbow up/down) → bias from current pose.
EDGE: M.1 target beyond reach (straighten) · M.2 constraint blocks (hand stops short + indicator) · M.3 2-segment vs N-segment chain.
TESTS: TS-01 drag hand → elbow/shoulder solve · TS-02 unreachable straighten · TS-03 constraint clamp · TS-04 bend-direction bias · TS-05 pose recorded · TS-06 playback interpolates (no re-solve) · TS-07 undo.

## F-14-06 CONSTRAINTS
1. Official name: (bone constraints). 4. Purpose: rotation min/max/lock, translation x/y, joint speed, spring. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: rotation + translation controls; **lock icon = free rotation**; **joint speed** = weight (max 100% = unlimited); "To make a bone stationary relative to parent, disable rotation and x/y translation." E2 [BLUEPRINT Part 14.5]: constraint wedge visualization.
CONTROLS
| Constraint | Field | Behavior |
|---|---|---|
| Rotation min/max | minRot/maxRot | clamp |
| Rotation lock | rotationLocked | rigid |
| Translation x/y | xEnabled/yEnabled | slide joint |
| Joint speed | jointSpeed 0–100 | weight lag |
| Spring | strength/damping | wobble |
LIMITATIONS: L.1 Animate's rotation-control UI (circle turns red, lock→dot) is awkward → ours: numeric + wedge. L.2 spring secondary motion only in runtime (legacy) → ours: author-time spring preview.
EDGE: M.1 rigid bone follows parent · M.2 slide joint · M.3 wedge overlap.
TESTS: TS-01 elbow −10..130 (E1) · TS-02 lock = rigid · TS-03 translation enable · TS-04 joint speed · TS-05 spring · TS-06 wedge viz.

## F-14-07 POSE LAYER & INSERT POSE
1. Official name: Pose layer / Insert Pose. 4. Purpose: the green layer storing armature poses. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: "IK armatures exist on **pose layers**"; "insert poses by right-clicking a frame in a pose layer and selecting **Insert Pose**"; "Animate automatically interpolates the positions of the bones in the frames between poses." E2 [OFFICIAL] `animation-basics.html`: green span + black diamonds = poses. E3 [OFFICIAL] `bone-tool-animation.html`: Type menu = **Runtime** (manipulated by AS3 at runtime) vs Authoring.
SEMANTICS: first bone creates the pose layer; Insert Pose records config; between poses = interpolated; one armature per pose layer.
LIMITATIONS: L.1 one armature per layer → multiple limbs = multiple layers. L.2 Runtime type legacy AS3.
EDGE: M.1 delete all bones → layer reverts to normal · M.2 single pose holds.
TESTS: TS-01 pose layer created · TS-02 insert pose (E1) · TS-03 green diamonds (E2) · TS-04 interpolate between poses · TS-05 runtime type legacy · TS-06 delete bones reverts.

## F-14-08 POSE EDITING RULES
1. Official name: (pose editing). 4. Purpose: select/move/delete bones & poses. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: select bone = click; **Shift+click = multi**; **double-click = all bones in armature**; Parent/Child/Next-Previous sibling buttons; click a pose-layer frame = whole armature. E2 [OFFICIAL] same: move bone ends in IK shape via **Subselection** (blocked if multiple poses exist → delete extra poses first); move instance alone = Alt/Command+drag.
SEMANTICS: selection granularity (bone vs armature); pose-layer frame = armature selection (E1).
LIMITATIONS: L.1 subselection blocked with multiple poses (E2) → ours: edit current pose + warn.
EDGE: M.1 double-click bone = armature · M.2 pose delete → interp across gap · M.3 bone reparent (ours safe, F-14-03).
TESTS: TS-01 click bone · TS-02 shift multi · TS-03 double-click armature · TS-04 pose-frame select · TS-05 subselection pose-edit · TS-06 delete pose · TS-07 reparent safe.

## F-14-09 BONE ANIMATION WORKFLOW
1. Official name: (bone animation). 4. Purpose: author-time pose→pose animation; runtime flag. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] F-14-07 E1/E3. E2 [BLUEPRINT Part 14.8]: frame 1 Insert Pose → frame 10 drag hand → Insert Pose → easing.
SEMANTICS: pose at frame N → pose at frame M → interp + easing; per-limb pose layers.
LIMITATIONS: L.1 runtime type legacy → ours: behavior-layer flag (P2).
EDGE: M.1 multiple limbs = multiple pose layers · M.2 easing on pose span.
TESTS: TS-01 two poses tween · TS-02 easing · TS-03 multi-limb rig · TS-04 undo insert-pose.
## AUDITS (all five)
No contradiction. Self-challenge: overlooked = author-time-solve/playback-interp (E1/E2) + subselection-multi-pose-block (E2) + one-armature-per-layer — covered.
```
FEATURE COMPLETE: F-14-05..09 — Solvers, constraints, pose layer, pose editing, bone animation — AUDITED
```
