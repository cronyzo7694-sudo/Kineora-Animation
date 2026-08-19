# 09_SYMBOL_RIG_IK_ENGINE — MOD-SYMBOL · MOD-INSTANCE · MOD-RIG · MOD-BONE · MOD-IK · MOD-POSE · MOD-WARP

## MOD-SYMBOL — definitions & nesting (REQ-SYM-001/004)
```
resolveNesting(node, time):
  symbolInstance → sym = library[symbolId]
    graphic: childTime = map(time, instance.loop)      // loop/once/single + firstFrame (F-11-08)
    movieClip: childTime = instanceClock(time)         // independent, loops
    button: state-driven (up/over/down/hit)
    recurse sym.timeline at childTime (depth ≤ 32)
```
- Graphic loop math: `loop → (t - firstFrame) % dur + 1`; `playOnce → min(t,dur)`; `single → firstFrame`.
- Edit modes: definition edit / edit-in-place (dim scope) / edit-in-new-window; breadcrumb stack; Esc=one level, Ctrl+Enter=root (ENG-024).
- Registration point = symbol-local (0,0); instance x/y = where it lands; pivot ≠ registration (REQ-XFR-003).
- Swap preserves transform/color/name (CMD-SWAP-SYMBOL); break-apart one level (block tweened symbol, ENG-021).

## MOD-INSTANCE — instance props (REQ-SYM-003)
colorEffect (brightness/tint/alpha/advanced) · filters (dropShadow/blur/glow/bevel/gradient*) · loop + firstFrame · instanceName. Top-level opacity slider (W6).

## MOD-RIG / MOD-BONE — local-space armature (REQ-IK-001; ENG-007)
```
bone: { id, parentId, length, rotation(local), translationX/Y,
        minRot, maxRot, rotationLocked, xEnabled, yEnabled, jointSpeed, spring }
bindings: symbol armature = {boneId → targetNodeId}; IK shape = {boneId → controlPoints[]}
world(pose) = compose parent→child local transforms (cached, dirty on change)
```
- Two armature kinds (F-14-02): symbol chain vs carved IK shape (edit limits enforced; complex shape → convert prompt).
- Building: click root → drag joint→joint; Alt+drag moves one instance (bones stretch).
- Stable IDs + local space ⇒ copy/paste/re-parent/scaling never corrupts poses (RSK-003 mitigation).

## MOD-IK — solvers (REQ-IK-002; ENG-006)
```
drag(hand → target):
  reach = Σ lengths; if |target-root| ≥ reach → straighten toward target (unreachable)
  else solve:
    2 bones → analytic (law of cosines; bend direction from current pose/bias)
    N bones → FABRIK (default; iterate ≤ 20, tol 0.01px) or CCD (rotation-dominant)
  clamp each joint to [minRot,maxRot] + translation flags + jointSpeed
  write pose (angles) → PoseCommand
```
- **Author-time solve only**; playback interpolates stored angles (ENG-008; deterministic).
- Constraint wedge visualization (authoring L1 overlay).

## MOD-POSE — pose layer & library (REQ-IK-003)
- Pose layer (green) auto-created by first bone; Insert Pose records `{boneStates[]}`; frames between poses interpolate; one armature per pose layer.
- Pose library: save/apply named poses (P1, ours).

## MOD-WARP — asset warp (REQ-WARP-001)
- Pins + triangle mesh over shape/DO/bitmap; rigid (articulated) / flexible (MLS/ARAP) modes.
- Keyframed pins stored as data per keyframe (W3: no symbol-link flicker); new keyframe copies previous pins.
- Alt+click toggles rigid/flexible; double-click (Selection) edits base shape (vector).
- Incompatible with bones (separate rig types — F-14 E5 → blocked + reason).

## Acceptance
- **REQ-SYM-004-A**: Given graphic symbol 30 frames, instance loop, main@61; Then shows internal frame 1 (loop map); movie clip instance unaffected.
- **REQ-IK-002-A**: Given shoulder→elbow→wrist, target at hand; Then solver places hand at target (within tol) and elbow within [−10°,130°]; unreachable target → chain straightens.
- **REQ-WARP-001-A**: Given warped bitmap, duplicate symbol, animate pins; Then no flicker (pins are per-keyframe data).
