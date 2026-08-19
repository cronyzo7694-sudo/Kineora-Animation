# 08_TWEEN_EASING_ENGINE — MOD-TWEEN · MOD-EASING · MOD-PATH

## MOD-TWEEN — span sampling
```
sampleMotion(span, f): per-property valueAt(f) (MOD-KEYFRAME) → apply to target transform/color/filters
sampleClassic(span, f): whole-state lerp between K1,K2 (rotate flags) ; broken(no endpoint) → hold
sampleShape(span, f): ShapeMorpher.interp(shapeA, shapeB, t, hints)
```
- **Motion tween** (REQ-TWN-001): one target; per-property keys; tween layer blocks drawing; target-removed = hollow dot (span keeps keys); Split Motion splits at frame.
- **Classic tween** (REQ-TWN-002): auto-wrap non-symbol → symbol "tween1"; Rotate None/Auto/CW/CCW+loops (additive to end-frame rotation); Orient/Snap/Sync; broken = dashed + tooltip.
- **Shape tween** (REQ-TWN-003): correspondence by index + subdivision of fewer anchors; per-anchor lerp; fill color lerp; hints override; width-profile morph; unsupported (symbol/group/text) → prompt break-apart.

## ShapeMorpher (MOD-VECTOR service)
1. Normalize anchor counts (subdivide); 2. Build correspondence (index or hint map); 3. Per-anchor lerp (position+handles); 4. Region count mismatch → loop split/merge; 5. Cache correspondence per (a,b) hash.

## MOD-EASING — easing engine (REQ-TWN-004)
```
easedT = easeFunction(t)         // t∈[0,1]→t'∈[0,1];  value = lerp(v0,v1,easedT)
```
- Built-ins: linear; quad/cubic/quart/quint/sine/exp/circ (in/out/inOut); back; elastic; bounce; steps(n).
- Slider −100..+100 (classic/shape) = quadratic in/out strength.
- Custom Bézier: control points (Ctrl/Cmd+click to add); x=frames 0–100%, y=%change.
- Presets: per-property (position/rotation/scale/color/filters) + saved custom (same doc-type in Animate → ours cross-doc JSON, F-09-06 L.1) + motion presets (whole tween reuse).

## MOD-PATH — motion path (REQ-TWN-005)
- Derived from x/y keys (two views, one truth): `path.anchors[i] ↔ position key[i]`, `vertexFrames`.
- Interp: parameter (default, eased) vs constant-speed (arc-length table, ours) — Part 10.2.
- Orient-to-path: `rotation_final = objectRotation + tangentAngle(path, t)`; forward-axis configurable (ours).
- Edit ops: drag segment (no click-to-select), subselection handles, move whole path, reverse path, copy-as-stroke / paste-stroke (closed stroke rejected), always-show-paths option.

## Graph editor (REQ-TWN-006 / C-18)
- Rows = properties; graph = time×value; keys = dots (roving = round); dashed curve = ease-applied actual values; multi-select + bulk edit (W4); Ctrl+drag key = time-only.

## Numerical behavior
- Rotation flags: `auto` = shortest; `CW/CCW` + `rotations` = direction + N full turns (F-08-04).
- Negative scale = flip (tweenable); scale 0 = invisible but selectable.

## Acceptance
- **REQ-TWN-001-A**: Given motion span target@(0,0)→(320,0); When playhead mid; Then x=160, y=0, document unchanged.
- **REQ-TWN-002-A**: Given classic tween rotate CW+2 loops; Then end-frame rotation = start + endFrameDelta + 720°.
- **REQ-TWN-003-A**: Given square→circle shape tween; Then morph deterministic (same frames every run) and broken (dashed) when endpoint deleted.
- **REQ-TWN-004-A**: Given ease-in slider −100; Then early frames change less per frame than late frames (monotonic velocity increase).
- **REQ-TWN-005-A**: Given path vertex moved; Then x/y key at that vertex updates (single source of truth).
