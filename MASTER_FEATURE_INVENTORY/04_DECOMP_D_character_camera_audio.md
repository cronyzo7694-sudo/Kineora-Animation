# §3. FULL FEATURE DECOMPOSITION — PART D: CHARACTER · BONE/IK · FBF · CAMERA · AUDIO · LIP-SYNC · FACIAL

---

## 3.15 CHARACTER ANIMATION & RIGGING  [F-13 · F-14 · Parts 13–14 · C-23/24/25 · REQ-RIG/IK/WARP]

### 3.15.1 Approach selection  [F-13-01] — Cut-out/puppet vs Frame-by-frame vs Hybrid.

### 3.15.2 Artwork preparation  [F-13-02] — one part per movable joint; overlap at joints; clean cuts; front/back ordering.

### 3.15.3 Parts → symbols  [F-13-03] — Convert to Symbol (F8); naming convention (`ch_armUpper_R`, `ch_mouth`); Movie Clip (self-animating) vs Graphic (parent-driven); **Distribute to Layers**.

### 3.15.4 Hierarchy building  [F-13-04] — nest parts under root movie clip (`character` → torso/head/arm_R/…).

### 3.15.5 Pivot placement  [F-13-05 · REQ-XFR-003] — pivot at joint (shoulder/elbow/wrist/neck); registration point at same joint.

### 3.15.6 Bones/IK integration  [F-13-06] — chain parts with Bone tool; constraints (elbow −10°..130°); IK (drag hand) vs FK (rotate each).

### 3.15.7 Posing workflow  [F-13-07] — key poses (contact/down/passing/up); F6 / Insert Pose; **pose library** (save/apply named poses, P1).

### 3.15.8 Animation craft  [F-13-08] — blocking → in-betweens → breakdowns → easing → arcs → timing/overlap → squash & stretch.

### 3.15.9 Walk-cycle recipe  [F-13-09] — 4 contact poses; body bob; arm swing; **no foot-slide** (ground-contact lock helper P2).

### 3.15.10 Reusable clips  [F-13-10] — wrap walk into movie clip; clip library (idle/walk/run/jump/wave/talk).

### 3.15.11 Three rig approaches  [F-13-11]
| Approach | Model | Our tier |
|---|---|---|
| A. Transform hierarchy | nested instances + transforms (FK) | P0 |
| B. Bones/IK | armature + pose layer | P1 |
| C. Asset Warp | mesh + pins | P1 |
- Shared rig layer so A/B/C mix per part.

### 3.15.12 Character data model  [F-13-12 · §33.4/33.5/33.11] — `character{rootSymbolId, parts[], rigs[], poses[], clips[]}`.

### 3.15.13 Bone vocabulary  [F-14-01] — bone / armature / parent-child / joint / root / IK target / rotation constraint / translation constraint / bone length / pose / pose layer / spring.

### 3.15.14 Two armature types  [F-14-02 · REQ-IK-001]
- **Symbol armature** (chain instances; each rotates as rigid part) vs **IK shape** (bones inside one shape; contour bends; edit limits after rigging; complex shape → convert prompt).

### 3.15.15 Bone data model  [F-14-03 · REQ-IK-001 · ENG-007]
- `bone{id, parentId, length, rotation(local), translationX/Y, minRot, maxRot, rotationLocked, xEnabled, yEnabled, jointSpeed, spring{strength,damping}}`.
- **Local-space + stable IDs** → copy/paste/re-parent/scale never corrupts poses [W2 / RSK-003].

### 3.15.16 Building armatures  [F-14-04] — click root → drag joint-to-joint; carve inside shape; Alt+drag = move one instance.

### 3.15.17 IK solvers  [F-14-05 · REQ-IK-002 · ENG-006]
- Drag hand (IK target) → reach check (unreachable = straighten) → solve: **2-bone analytic** (law of cosines) · **FABRIK** (N-segment default, ≤20 iters) · **CCD** (rotation-dominant) → clamp constraints → write pose.
- **Author-time solve only**; playback interpolates stored angles (ENG-008, deterministic).

### 3.15.18 Constraints  [F-14-06 · REQ-IK-002]
- **Rotation min/max** · **rotation lock** (rigid) · **translation x/y enable** (sliding joints) · **joint speed** (0–100%) · **spring** (strength/damping). Constraint **wedge visualization**.

### 3.15.19 Pose layer & Insert Pose  [F-14-07 · REQ-IK-003] — green layer auto-created; Insert Pose records `{boneStates[]}`; interpolation between poses; one armature per pose layer; runtime-vs-authoring flag (P2).

### 3.15.20 Pose editing rules  [F-14-08] — select bone (click/Shift/dbl-click) · Parent/Child/Next buttons · Alt+drag one instance · Subselection drag bone end (blocked if multiple poses + warn) · add/remove/reparent (P1).

### 3.15.21 Bone animation workflow  [F-14-09] — Insert Pose @1 → drag @10 → Insert Pose → interpolate → easing.

### 3.15.22 Asset Warp (engine)  [REQ-WARP-001 · F-02-32]
- Pins + triangle mesh (MLS/ARAP) · rigid/flexible · keyframed pins (per-keyframe data, no flicker [W3]) · vector + raster sources · incompatible with bones (blocked + reason).

---

## 3.16 FRAME-BY-FRAME & ONION SKIN  [F-15-01..06 · Part 15 · C-19 · REQ-FBF]

### 3.16.1 Workflow steps  [F-15-01] — draw frame 1 → F6/F7 next → onion skin → redraw → exposure → playback.

### 3.16.2 Onion skin controls  [F-15-02 · REQ-FBF-001]
- **Onion Skin** toggle (O) · **Onion Outlines** (Shift+O) · **Edit Multiple Frames** (Alt+O) · **Modify Markers** (Always / Anchor / Onion 2 / 5 / All) · **Start/End markers** (drag; Ctrl = both) · **tint colors** (past/future) · **opacity slider** + **decrease-by slider** (D7).
- **Exclude frame** (right-click → exclude/include).

### 3.16.3 Onion behavior & implementation  [F-15-03]
- Past = one tint, future = another, current = full color · ghosts not editable (except Edit Multiple) · never export · cached per-frame bitmaps · applies per current layer (or all, toggle).

### 3.16.4 FBF tools & shortcuts  [F-15-04] — `.`/`,` step · F5/F6/F7 · Shift+F5/F6 · Enter play · O onion.

### 3.16.5 Exposure & timing  [F-15-05] — ones/twos/threes (hold 1/2/3); span drag; Hold-N dialog (ours).

### 3.16.6 Cel/drawing reuse system  [F-15-06 · REQ-FBF-002 · W1]
- **Drawing** = reusable Library asset. **Expose same drawing** (D + click) = reference (shared; edit propagates) vs **Duplicate to new drawing** (F6) = independent copy.
- Model: `{type:'drawing', id, layers[], duration}` + `frames[{type:'keyframe', drawingId}]`. Shared badge. Drawing Editor. **Strict superset of Animate.**

---

## 3.17 CAMERA  [F-16-01..07 · Part 16 · C-27 · REQ-CAM]

### 3.17.1 Camera concept & 3 zooms  [F-16-01]
- Camera = animatable screen-space transform (pan/zoom/rotate + tint). **View zoom ≠ camera zoom ≠ object scale** (tooltip-documented).

### 3.17.2 Camera data model & matrix  [F-16-02 · REQ-CAM-001]
- `camera{enabled, x, y, z, zoom, rotation, tint?, filters[]}` + per-layer `zDepth`.
- `CameraMatrix = Translate(center) · Rotate · Scale(zoom · depthScale(zDepth)) · Translate(-x,-y)`.

### 3.17.3 Camera layer  [F-16-03] — camera keyframes on camera layer/track; delete layer = disable camera.

### 3.17.4 Camera tool interaction  [F-16-04] — pan (drag) · zoom (Shift+drag/slider) · rotate (Ctrl+drag/slider) · reset per property · border + on-screen sliders.

### 3.17.5 Camera animation & presets  [F-16-05]
- Workflow: keyframe @1 → F6 @N → move → classic tween → easing.
- **Presets (ours, P1):** push-in / pull-out / pan / truck+parallax / rotate / shake.

### 3.17.6 Layer depth & parallax  [F-16-06] — z-depth per layer (keyframable); near moves more; render back-to-front; per-layer cache + transform.

### 3.17.7 Attach-to-camera (HUD)  [F-16-07] — pinned layers stay fixed while world pans/zooms.

---

## 3.18 AUDIO  [F-17-01..09 · Part 17 · C-28 · REQ-AUD]

### 3.18.1 Event vs Stream sounds  [F-17-01]
- **Event:** plays fully after load; overlaps; independent of timeline. **Stream:** frame-synced; drops ANIMATION frames (audio never skips); bounded by span.

### 3.18.2 Import & formats  [F-17-02] — MP3/WAV/AIFF (+OGG/FLAC/M4A ours) → sound asset `{id,name,durationMs,sampleRate,channels,dataRef}` + waveform peaks.

### 3.18.3 Placement & waveform  [F-17-03] — attach to keyframe; waveform across frames (extent = ceil(dur×fps)); scrub-audio.

### 3.18.4 Sync menu  [F-17-04 · REQ-AUD-001] — **Event / Start** (no overlap of same sound) / **Stop** (silence at key) / **Stream**.

### 3.18.5 Loop  [F-17-05] — loop count (0=N); timeline audio loop (per-span toggle).

### 3.18.6 Trim / volume / effects / envelope  [F-17-06]
- Trim in/out (non-destructive) · Volume % · **Effect** (Left/Right/Fade L→R/Fade R→L/Fade In/Fade Out/Custom) · **custom envelope** (draggable points).

### 3.18.7 Timeline synchronization  [F-17-07] — start at keyframe; move keyframe = move start; Stream bounded by span; Stop keyframe; scrub (toggle); mute; fps remap.

### 3.18.8 Export synchronization  [F-17-08 · REQ-AUD-002]
- Video = sample-exact mux per frame · HTML = asset + `{startAt,loop,sync}` metadata · GIF/sequence = silent + warn · project = assets + refs.

### 3.18.9 Audio data model  [F-17-09 · §33.12] — asset + attachment `{assetId, sync, loop, trimStartMs, trimEndMs, volume, envelope[]}`.

---

## 3.19 LIP SYNC  [F-18-01..07 · Part 18 · C-29 · REQ-LIP]

### 3.19.1 Phoneme→viseme mapping  [F-18-01] — 12-viseme chart: A · B/M-P · C/D-G-K-N-R-S-T-Y-Z · D · E · F/V · L/TH · O · U · W/Q · Rest · extra.

### 3.19.2 Mouth library/symbol  [F-18-02] — graphic symbol, one frame per viseme, labeled; `mouthPoses[{frame,viseme}]`; driven by instance `firstFrame` (reuses symbol system).

### 3.19.3 Auto lip-sync workflow  [F-18-03 · REQ-LIP-001] — mouth symbol + audio (Stream required, warn if Event) → Lip Syncing dialog (12 visemes → map to frames → choose audio layer → Sync) → auto keyframes.

### 3.19.4 Analysis  [F-18-04] — VAD (silence) → phoneme recognition `[{phoneme,startMs,endMs,confidence}]` → viseme dictionary → merge same-viseme runs → sub-frame collisions (longest wins) → frame = round(ms/1000×fps).

### 3.19.5 Manual override & Frame Picker  [F-18-05 · REQ-LIP-002] — Frame Picker per keyframe · swap · drag keys · F6/F7/Shift+F6 · F5 hold · scrub-with-audio.

### 3.19.6 Improved original system  [F-18-06] — 10 improvements:
1. live waveform + **phoneme lane** (colored blocks) · 2. editable detection (drag boundaries, re-map) · 3. **confidence display** · 4. **lead/lag offset** · 5. **viseme dictionary** (editable, sharable) · 6. multi-language (pluggable) · 7. better VAD (threshold slider) · 8. **blend** (optional morph; default snap) · 9. **batch** multi-character · 10. **undoable** (one pass).

### 3.19.7 Lip-sync data model  [F-18-07 · §33.13] — `lipSync{mouthSymbolId, audioAssetId, audioLayerId, visemeMap{}, result[{viseme,startFrame,endFrame,confidence}], leadMs, blend}`.

---

## 3.20 FACIAL ANIMATION  [F-19-01..07 · Part 19 · C-26]

### 3.20.1 Facial rig construction  [F-19-01] — head (movie clip) → face base + eye_L/R (blink+pupil inside) + brow_L/R + mouth (graphic viseme frames). Nested timelines.

### 3.20.2 Blink system  [F-19-02]
- Eyelid movie clip (open→half→closed→half→open). **Timeline-triggered** vs **auto-blink** (random 2–6s interval, avoids speech — P1). ~6–10 frames; never mid-line.

### 3.20.3 Eye direction system  [F-19-03] — pupil offset + gaze poses (lookLeft/Right/Up/Down/center) + blink-on-change (P2 toggle).

### 3.20.4 Mouth system  [F-19-04] — viseme frames + expression poses (smile/frown/grin) in same symbol; jaw movie clip for A/O.

### 3.20.5 Expression system  [F-19-05] — 6 expressions (neutral/happy/angry/surprised/sad/scared) · expression symbols (frame-per-expression) vs composite presets · swap (default) vs tween.

### 3.20.6 Head movement system  [F-19-06] — nod/tilt/shake/turn (front/¾/side swap) + anticipation + overlap.

### 3.20.7 Facial workflow  [F-19-07] — draw parts → symbolize → nest → pivots → mouth library → blink → animate.
