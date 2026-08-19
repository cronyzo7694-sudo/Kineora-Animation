# F-13-06 — BONES/IK INTEGRATION · F-13-07 — POSING · F-13-08 — ANIMATION CRAFT
```
SOURCE BLUEPRINT: Part 13 §13.5–13.7 · DEEP FEATURES: F-13-06/07/08 · STATUS: AUDITED
DEPENDS ON: F-13-04/05, F-14-* (IK), F-09-*
```
## F-13-06 BONES/IK INTEGRATION
1. Official name: (bone tool for characters). 4. Purpose: chain parts with the Bone tool; constraints; IK posing. 8. Status: current.
EVIDENCE
E1 [SECONDARY] Udemy Bone Tool section: "build an armature of connected bones for puppet-style animation, using symbols, pivot points." E2 [OFFICIAL] F-14: chain instances; constraints (elbow −10°..130°); drag hand → chain follows. E3 [COMMUNITY] r/animate rant: Bone tool "abandoned since release… restricted to one layer… won't work with warped assets" → [WISH W2] ours local-space robust.
SEMANTICS: Bone chain shoulder→elbow→wrist; constraints at joints; IK = drag end, chain follows; FK = rotate each joint.
LIMITATIONS: L.1 Animate bone = one layer, breaks on copy/paste, no warp mix (E3) → ours: local-space, separate rig types, tween-agnostic.
EDGE: M.1 chain with constraints · M.2 bone + warp separation (ours).
TESTS: TS-01 chain instances · TS-02 elbow constraint · TS-03 drag hand → IK solve · TS-04 FK fallback · TS-05 copy/paste no corruption (ours).

## F-13-07 POSING
1. Official name: (posing workflow). 4. Purpose: set key poses on keyframes; pose library. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Adobe walk-cycle: **key poses: contact, recoil (down), passing, high point (up)**, then return to contact (5 poses). E2 [BLUEPRINT Part 13.6]: F6 keyframe / Insert Pose; tween between; pose library (ours).
SEMANTICS: block key poses every 4–8 frames; Insert Pose (bones) or F6 (transforms); tween between.
LIMITATIONS: L.1 no pose library in Animate → ours: save/reuse named poses (P1).
EDGE: M.1 walk 4-pose cycle (E1) · M.2 pose reuse across characters.
TESTS: TS-01 key poses on keyframes · TS-02 insert pose · TS-03 tween between · TS-04 pose library (ours) · TS-05 undo.

## F-13-08 ANIMATION CRAFT
1. Official name: (blocking, arcs, easing, squash & stretch). 4. Purpose: the craft rules that make tweens look alive. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Adobe walk-cycle: **timing/spacing/weight**; vertical torso motion = weight shift; horizontal S-curve = center-of-gravity; **arm swing opposite to legs**; troubleshoot uneven arm swing. E2 [BLUEPRINT Part 13.7]: blocking → breakdowns → easing → arcs → squash & stretch → overlap.
SEMANTICS
- Blocking (key poses) → in-between (tweens + breakdowns) → easing → arcs → squash/stretch → overlap (hair lags).
- Arm swing opposite to legs (E1); body bob offset half-step from legs.
LIMITATIONS: L.1 linear tween = robotic → easing (F-09-05). L.2 arcs lost in straight tweens → motion path + breakdown keys.
EDGE: M.1 arm swing mismatch (E1) → mirror keyframes. M.2 foot slide (F-13-09).
TESTS: TS-01 arm swing opposite (E1) · TS-02 body bob · TS-03 easing applied · TS-04 arcs via path · TS-05 squash on impact · TS-06 overlap (hair delay).
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = 5-pose walk (E1) + arm-swing-opposite + bone-tool-broken (E3) — covered.
```
FEATURE COMPLETE: F-13-06/07/08 — IK integration, posing, animation craft — AUDITED
```
