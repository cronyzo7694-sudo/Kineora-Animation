# F-16-01 — CAMERA CONCEPT & 3 ZOOMS · F-16-02 — CAMERA MODEL & MATRIX · F-16-03 — CAMERA LAYER
```
SOURCE BLUEPRINT: Part 16 §16.0–16.2 · DEEP FEATURES: F-16-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-08-09 · FEEDS: F-16-04..07
```
## F-16-01 CONCEPT & 3 ZOOMS
1. Official name: Camera tool / virtual camera. 4. Purpose: an animatable screen-space transform (pan/zoom/rotate + tint) over the whole stage. 8. Status: current (added 2019).
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: camera = pan/zoom/rotate + color tint/filters; "when you set a camera view… you look at the layers as though you were looking through that camera"; tweens/keyframes on the camera layer. E2 [OFFICIAL] Adobe Learn virtual-camera: "Animate CC now has a native camera tool… zoom, rotate, and panning motion." E3 [BLUEPRINT Part 16.0]: three distinct zooms (view / camera / object) — never confuse.
SEMANTICS (3 zooms table)
| Term | Scope | Animated | Exported |
|---|---|---|---|
| View zoom | authoring viewport | no | no |
| Camera zoom | whole scene | yes | yes |
| Object scale | one object | yes | yes |
LIMITATIONS: L.1 camera-vs-view zoom confusion → ours: distinct UI (camera border + badge).
EDGE: M.1 camera zoom ≠ stage resize.
TESTS: TS-01 camera ≠ view zoom · TS-02 camera exports · TS-03 view zoom doesn't.

## F-16-02 CAMERA MODEL & MATRIX
1. Official name: (camera data). 4. Purpose: the camera state + per-layer depth parallax. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: camera props x/y/z/zoom/rotation + tint/filters; **Layer Depth panel** (Window > Layer Depth): z-depth per layer → **parallax** (near layers move faster); camera at 0; closer = lower positive; behind = negative. E2 [BLUEPRINT Part 16.1] matrix: `screen = Translate(center)·Rotate·Scale(zoom·depthScale(z))·Translate(-x,-y)`.
O. MODEL
```jsonc
"camera": { "enabled":true, "x":0,"y":0,"z":0,"zoom":1.0,"rotation":0,"tint":null,"filters":[] }
"layers[i].zDepth": 0
```
SEMANTICS: depthScale(z) = parallax factor; near = more movement.
LIMITATIONS: L.1 z-depth keyframable per layer (jumps) → ours: smooth option. L.2 zoom linear looks odd → log-space (carried F-08-09).
EDGE: M.1 negative z (behind camera) · M.2 layer at camera plane (no parallax).
TESTS: TS-01 camera state stored · TS-02 depthScale parallax · TS-03 negative z · TS-04 log-zoom.

## F-16-03 CAMERA LAYER
1. Official name: Camera layer. 4. Purpose: the timeline layer holding camera keyframes. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: enabling camera adds a **camera layer** with the camera object; camera icon in Properties. E2 [OFFICIAL] Adobe Learn virtual-camera: camera layer + UI overlay (zoom/rotate slider); frame 1 keyframe → frame 220 keyframe → classic tween. E3 [OFFICIAL] `controlling-the-camera.pdf`: **Attach Layer To Camera** (chain dot) — attached layers unaffected by camera motion (HUD/captions).
SEMANTICS
- Camera layer = camera keyframes (F-08-09).
- Attach-to-camera = layer pinned to view (E3); multiple layers attachable.
- Delete camera layer = camera disabled.
LIMITATIONS: L.1 forgetting to attach HUD layers (they drift) → ours: attach suggestion toast.
EDGE: M.1 delete camera layer → off · M.2 attached layer still has z-depth (E3 note).
TESTS: TS-01 camera layer created · TS-02 camera keys tween (E2) · TS-03 attach HUD pinned (E3) · TS-04 delete disables · TS-05 multiple attached.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = 3-zooms distinction + attach-to-camera (E3) + parallax z-convention — covered.
```
FEATURE COMPLETE: F-16-01/02/03 — Camera concept, model, layer — AUDITED
```
