# F-16-04 — CAMERA TOOL INTERACTION · F-16-05 — CAMERA ANIMATION & PRESETS · F-16-06 — LAYER DEPTH & PARALLAX · F-16-07 — CAMERA REPRESENTATION SPEC
```
SOURCE BLUEPRINT: Part 16 §16.3–16.6 · DEEP FEATURES: F-16-04..07 · STATUS: AUDITED
DEPENDS ON: F-16-02/03
```
## F-16-04 CAMERA TOOL INTERACTION
1. Official name: Camera tool. 4. Purpose: pan/zoom/rotate via drag/modifiers/slider. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: onscreen zoom/rotate slider + reset per property; camera border visible. E2 [SECONDARY] Medium: drag = pan; Shift+drag = zoom; Ctrl/Cmd+drag = rotate. E3 [BLUEPRINT Part 16.3] touch: one-finger pan, pinch zoom, twist rotate.
INTERACTIONS
| Action | Desktop | Touch |
|---|---|---|
| Pan | drag | one-finger drag |
| Zoom | Shift+drag / slider | pinch / slider |
| Rotate | Ctrl/Cmd+drag / slider | twist / slider |
| Reset | per-property reset | tap reset |
LIMITATIONS: L.1 modifier-drag obscure → ours: on-screen mode buttons + HUD.
EDGE: M.1 slider snap-back (infinite rotate) · M.2 reset per property.
TESTS: TS-01 pan drag · TS-02 shift zoom · TS-03 ctrl rotate · TS-04 slider · TS-05 reset · TS-06 touch gestures.

## F-16-05 CAMERA ANIMATION & PRESETS
1. Official name: (camera animation). 4. Purpose: keyframe + tween the camera; presets. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Adobe Learn: frame 1 key → frame 220 key (zoom 190%) → classic tween → ease. E2 [BLUEPRINT Part 16.4] presets (push-in/pull-out/pan/truck+parallax/rotate/shake) — ours (Animate has none).
SEMANTICS
| Preset | Keys |
|---|---|
| Push-in | zoom 100→200 (ease-out) |
| Pull-out | 150→100 |
| Pan | x 0→400 |
| Truck+parallax | pan + layer z-depths |
| Rotate | 0→8° |
| Shake | ±x/y keys over 3–6 frames |
LIMITATIONS: L.1 no presets in Animate → ours ships one-click presets (P1). L.2 easing needed for cinematic feel (E1).
EDGE: M.1 preset on existing keys (merge) · M.2 shake amplitude config.
TESTS: TS-01 camera keys + tween (E1) · TS-02 ease · TS-03 push-in preset · TS-04 shake preset · TS-05 undo.

## F-16-06 LAYER DEPTH & PARALLAX
1. Official name: Layer Depth. 4. Purpose: z-depth per layer → parallax (near moves faster). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `working-with-camera-in-animate.html`: Layer Depth panel; near = lower positive, far = higher positive, behind = negative; parallax effect. E2 [OFFICIAL] `controlling-the-camera.pdf`: Advanced Layers ON; drag colored lines (layer) relative to dotted line (camera); z-depth keyframable per layer (tweenable).
SEMANTICS: z-depth → depthScale in camera matrix (F-16-02); render back-to-front per depth.
LIMITATIONS: L.1 z-depth keyframable = jumps between keys → ours: tween option. L.2 needs Advanced Layers ON → ours: always available.
EDGE: M.1 layer behind camera (negative) · M.2 many layers at distinct depths.
TESTS: TS-01 parallax near-fast · TS-02 depth panel drag · TS-03 z-depth keyframe tween · TS-04 negative z · TS-05 render order.

## F-16-07 CAMERA REPRESENTATION SPEC (ours)
1. Official name: (our camera spec). 4. Purpose: the implementation contract. 8. Status: our-design.
SPEC
- One Camera per scene/timeline {x,y,z,zoom,rotation,tint,filters}.
- Camera keyframes on a dedicated camera track (not a content layer).
- Interp: position/rotation lerp; zoom log-space; easing per segment.
- Per-layer zDepth → parallax scale; attachable HUD layers.
- Presets = one-click keyframe writers.
- Export: camera matrix applied in ALL exporters (image/sequence/video/HTML) — WYSIWYG.
LIMITATIONS: L.1 camera track vs layer (ours) — clear separation.
EDGE: M.1 camera + attached layers + export.
TESTS: TS-01 camera track · TS-02 log-zoom · TS-03 presets write keys · TS-04 export identical across targets · TS-05 reload.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = modifier-drag mapping + shake preset + z-depth-keyframable (E2) — covered.
```
FEATURE COMPLETE: F-16-04..07 — Camera tool, animation/presets, depth/parallax, representation — AUDITED
```
