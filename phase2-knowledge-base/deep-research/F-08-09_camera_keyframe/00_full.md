# F-08-09 — CAMERA KEYFRAME · F-08-10 — BONE/POSE KEYFRAME · F-08-11 — MOUTH/VISEME KEYFRAME
```
SOURCE BLUEPRINT: Part 08 §8.3.7–8.3.9 · DEEP FEATURES: F-08-09/10/11 · STATUS: AUDITED
DEPENDS ON: F-08-01/02 · FEEDS: Parts 14/16/18
```
## F-08-09 CAMERA KEYFRAME
1. Official name: (camera keyframe). 4. Purpose: key the camera's x/y/z/zoom/rotation (+tint) on the camera layer. 8. Status: current (camera added 2019).
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: add tweens/keyframes on the camera layer; camera props in Properties. E2 [OFFICIAL] Adobe Learn virtual-camera: frame 1 key, frame 220 key (zoom 190%), classic tween between; easing. E3 [OFFICIAL] same: attach HUD layers to camera (pinned).
SEMANTICS
- Stored: `{frame, camera:{x,y,z,zoom,rotation,tint}}` (whole-frame on camera layer).
- Interp: position/rotation lerp; **zoom log-space** (ours) for natural push-ins; easing per segment (E2).
- Visual: whole stage pans/zooms/rotates; attached layers pinned (E3).
LIMITATIONS: L.1 zoom linear looks odd → ours log-space. L.2 camera rotate around center only → ours: optional focus point.
EDGE: M.1 delete camera layer = camera off · M.2 attached HUD unaffected · M.3 push-in then pull-out keys.
TESTS: TS-01 camera key stores state · TS-02 tween between camera keys (E2) · TS-03 log-zoom natural · TS-04 HUD attached pinned (E3) · TS-05 delete layer disables · TS-06 undo.

## F-08-10 BONE/POSE KEYFRAME
1. Official name: (pose). 4. Purpose: store an armature configuration (all bone angles/translations) on a pose layer. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `bone-tool-animation.html`: Insert Pose (right-click pose-layer frame) records armature config; Animate interpolates bone positions between poses. E2 [OFFICIAL] `animation-basics.html`: green span, diamond poses. E3 [OFFICIAL] `bone-tool-animation.html`: runtime vs authoring type; joint speed/spring per bone.
SEMANTICS
- Stored: `{frame, pose:{boneStates:[{boneId, rotation, translation}]}}` (F-14 model).
- Interp: per-bone angle/translation lerp (NO re-solve during playback — solver runs at author time).
- Visual: green diamonds (E2).
LIMITATIONS: L.1 playback interpolates, doesn't re-solve (can look off-path) → ours: optional re-solve preview. L.2 pose on non-pose layer blocked.
EDGE: M.1 single pose holds · M.2 delete pose = interp across gap · M.3 copy/paste poses (local-space safe, W2).
TESTS: TS-01 insert pose (E1) · TS-02 interpolate between poses (E1) · TS-03 green diamond (E2) · TS-04 constraints hold during pose · TS-05 delete pose interp-across · TS-06 undo.

## F-08-11 MOUTH/VISEME KEYFRAME
1. Official name: (mouth keyframe — viseme). 4. Purpose: key which mouth pose (graphic symbol frame) shows at each frame (lip sync). 8. Status: current (auto lip-sync 2018+).
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: Auto Lip-Sync creates keyframes matching audio visemes. E2 [OFFICIAL] same: mouth = graphic symbol; each keyframe sets the instance's shown frame. E3 [OFFICIAL] Frame Picker browses/picks symbol frames per keyframe.
SEMANTICS
- Stored: an instance keyframe with `loop.firstFrame` set to the viseme pose (F-08-07 variant).
- Interp: **discrete** (mouth shapes snap; optional blend ours, Part 18.6.8).
- Visual: mouth pose changes per frame in sync with audio.
LIMITATIONS: L.1 viseme snaps (no morph) → ours: optional blend. L.2 first-frame beyond ~20 had a picker bug [COMMUNITY, F-18] → ours: no such limit.
EDGE: M.1 fast speech → sub-frame collisions (longest wins, Part 18.4.6) · M.2 hold a plosive (M pose longer).
TESTS: TS-01 auto lip-sync keys (E1) · TS-02 viseme per keyframe · TS-03 frame picker picks (E3) · TS-04 discrete snap · TS-05 manual correction via picker · TS-06 undo auto-pass (one command).
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = camera-layer-delete-disables + pose-interp-not-re-solve + viseme-discrete — covered.
```
FEATURE COMPLETE: F-08-09/10/11 — Camera / Bone / Mouth keyframes — AUDITED
```
