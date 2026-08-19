# F-13-04 — HIERARCHY BUILDING · F-13-05 — PIVOT PLACEMENT
```
SOURCE BLUEPRINT: Part 13 §13.3–13.4 · DEEP FEATURES: F-13-04, F-13-05 · STATUS: AUDITED
DEPENDS ON: F-13-03, F-11-12
```
## F-13-04 HIERARCHY BUILDING
1. Official name: (nesting the rig). 4. Purpose: build the part tree so parts move together correctly. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 13.3]: character tree — root movie clip → torso/head/arms/legs; arm → upper/lower/hand nested. E2 [OFFICIAL] F-11-12: nesting semantics (graphic sync / clip free). E3 [SECONDARY] Udemy: "rig with pivot points and classic tween"; nest per limb.
SEMANTICS (the tree)
```
character (root MC)
 ├─ torso
 ├─ head (MC: face, eye_L/R, mouth)
 ├─ arm_R (MC: upper_R, lower_R(child at elbow), hand_R)
 └─ arm_L (mirrored copy)
```
- Nest a limb's parts → one symbol (arm_R) so the limb moves as a unit.
- Wrap the whole body under "character" (one reusable instance, F-13-10).
LIMITATIONS: L.1 movie clip vs graphic choice per part (F-11-02/03). L.2 deep nesting perf → leaf caching.
EDGE: M.1 mirrored arm (flip) · M.2 head nested with mouth/eyes.
TESTS: TS-01 limb nesting · TS-02 root wrap · TS-03 mirrored arm · TS-04 nesting playback (F-11-12).

## F-13-05 PIVOT PLACEMENT
1. Official name: (pivot at joint). 4. Purpose: set each part's pivot (and registration) at its joint so rotation = joint movement. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 13.4]: upper arm pivot → shoulder; forearm → elbow; hand → wrist; head → neck. E2 [OFFICIAL] F-04-07: pivot vs registration vs center. E3 [COMMUNITY] "check the symbol pivots on your keyframes… if the pivot is moving, symbols act weird" (classic-tween jitter).
SEMANTICS
- Registration point (symbol-local 0,0) at the joint at creation (F-11-06).
- Transform point (pivot) per-instance at the joint for rotation.
- Pivot must be **identical across keyframes** in a classic tween or it jitters (E3).
LIMITATIONS: L.1 pivot-at-center mistake = broken elbow → ours: joint-hint + snap pivot to joint. L.2 pivot moving between keys = jitter (E3) → ours: warn.
EDGE: M.1 pivot on the wrong joint · M.2 pivot drift in tween (E3).
TESTS: TS-01 pivot at joint · TS-02 registration at joint · TS-03 rotation = joint movement · TS-04 pivot-consistency warn (ours) · TS-05 undo.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = pivot-drift-jitter (E3) + registration-vs-pivot-both-at-joint — covered.
```
FEATURE COMPLETE: F-13-04/05 — Hierarchy & pivot placement — AUDITED
```
