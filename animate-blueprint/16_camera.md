# PART 16 — CAMERA
### Camera tool, camera layer, position, zoom, rotation, keyframes, tweening, presets, movement, layer depth (parallax), attach-to-camera — and how a new app should represent camera animation.

---

## 16.0 What the camera is (and is not)

- The **camera** is an **animatable screen-space transform** applied to the whole stage: **pan (x/y), zoom, rotate**, plus optional **color/tint effects**. It is a **document object** — it renders at export, unlike the view zoom/pan (Part 02d T2D.5) which is authoring-only.
- It **frames** the artwork; it does **not** resize the stage or move layers (layers stay in stage space; the camera changes the *view*).
- Added in Animate 2019 (was "Virtual Camera" in the Adobe learn series); available for all built-in doc types (HTML5 Canvas, WebGL, AS3).
- **Adding depth:** the **Layer Depth panel** assigns each layer a **z-depth**; the camera then produces **parallax** (near layers move more than far layers) — the 2.5D effect.

### Three distinct "zooms" (never confuse them — document in tooltips)

| Term | Scope | Animated? | Exported? |
|---|---|---|---|
| **View zoom** (Ctrl+=, wheel) | authoring viewport | no | no |
| **Camera zoom** (this part) | the whole scene | **yes** | **yes** |
| **Object scale** (Part 04) | one object | yes | yes |

---

## 16.1 The camera model (data)

```jsonc
"camera": {
  "enabled": true,
  "x": 0, "y": 0,            // pan (stage-space position of the camera center)
  "z": 0,                     // depth position (for 2.5D; default 0)
  "zoom": 1.0,               // 1.0 = 100% (no scale)
  "rotation": 0,             // degrees, around the camera center
  "tint": null,              // optional scene-wide color tint {color, amount}
  "filters": []              // optional camera filters (blur, etc.)
}

// per-layer depth
"layers[i].zDepth": 0        // 0 = at camera plane; negative = behind camera; positive = closer
```

### Camera transform math (concept)
```
screenPoint = CameraMatrix(stagePoint)
CameraMatrix = Translate(center) · Rotate(rotation) · Scale(zoom · depthScale(zDepth)) · Translate(-x, -y)
```
- **depthScale(zDepth)** = the parallax factor for a layer at depth `d`: layers nearer the camera (small positive `d` in Animate's convention) scale/move **more** than layers at `d=0`. (Animate: camera at 0; objects closer = lower positive numbers, farther = higher positive numbers; behind camera = negative.)
- The camera's own **zoom** scales everything uniformly.

---

## 16.2 The Camera layer (timeline)

- Enabling the camera (Camera tool or the **Add Camera** button on the timeline) creates a **Camera layer** at the top of the layer list.
- The camera layer holds **camera keyframes**: each keyframe stores `{x, y, z, zoom, rotation, tint}`.
- Between camera keyframes, values **tween** (classic-tween-style interpolation on the camera layer; easing applies).
- Deleting the camera layer disables the camera.

### Attach-to-camera (HUD layers)
- Layers that must **not** move with the camera (HUD, captions, scoreboards) can be **attached to the camera** (the chain-link dot in the layer row, or right-click → Attach To Camera).
- Attached layers are pinned to the **camera view** — they stay fixed on screen while the world pans/zooms.
- Multiple layers can be attached; their z-depth still applies.

---

## 16.3 Camera interaction (the tool)

| Action | Input (desktop) | Input (touch) | Result |
|---|---|---|---|
| **Pan** | drag | one-finger drag | `x/y` change |
| **Zoom** | `Shift`+drag (or on-screen slider) | pinch (or slider) | `zoom` change |
| **Rotate** | `Ctrl/Cmd`+drag (or slider) | two-finger twist | `rotation` change |
| **Reset a property** | reset icon next to it | tap reset | property → default |

- **On-screen UI:** a zoom slider + rotate slider with a center value readout; the camera border drawn around the stage.
- **Properties panel:** numeric x/y/z/zoom/rotation + tint + filters + reset buttons.

---

## 16.4 Camera animation workflow

1. Select the Camera tool → camera layer is created/selected.
2. **Frame 1:** set the starting shot (keyframe exists by default on frame 1).
3. Move the playhead to the target frame; **Insert Keyframe (F6)** on the camera layer.
4. Pan/zoom/rotate to the new shot.
5. Right-click between the keys → **Create Classic Tween** (or motion tween) → the camera move interpolates.
6. Apply **easing** (ease-out for a cinematic settle; ease-in-out for push-ins).
7. Preview (`Enter`) — scrub shows the move.

**Common camera moves (presets):**

| Preset | Keys | Use |
|---|---|---|
| **Push-in** | zoom 100% → 200% (ease-out) | focus a subject |
| **Pull-out** | zoom 150% → 100% | reveal context |
| **Pan** | x 0 → 400 | follow a character |
| **Truck + parallax** | pan + layers at different z-depth | 3D-feel tracking |
| **Rotate** | rotation 0 → 8° | dramatic tilt |
| **Shake** | several ±x/y keys over 3–6 frames | impact/explosion |

**Our app ships these as one-click camera presets (P1)** — Animate has no built-in camera presets; this is a direct improvement. A preset = a function that writes the camera keyframes + easing for you.

---

## 16.5 Layer depth & parallax (the 2.5D effect)

1. Enable **Advanced Layers** (timeline top) + open the **Layer Depth panel** (Window > Layer Depth).
2. Assign z-depth to layers: near layers (foreground) lower positive numbers; far layers (background) higher; behind-camera = negative.
3. Camera pans/zooms → near layers move **faster** (bigger parallax) than far ones → depth illusion.
4. **z-depth is keyframable per layer** (Animate ties it to keyframes; you can tween it) — a layer can move toward/away from the camera over time.
5. **Implementation:** per-layer `zDepth` → depthScale factor in the camera matrix (16.1). Render layers back-to-front (far first), each with its own depth scale. Cache each layer's raster; apply camera matrix per layer (GPU: one draw call per layer with a transform).

---

## 16.6 How a new app should represent camera animation (summary spec)

1. **One `Camera` object per scene/timeline** (not per layer) with `{x, y, z, zoom, rotation, tint, filters}`.
2. **Camera keyframes on a dedicated camera layer** (or a camera track — our app uses a camera track on the timeline so it can't be confused with content layers).
3. **Interpolation:** lerp position/rotation; **zoom lerped in log-space** (natural push-ins); easing per segment.
4. **Per-layer zDepth** → parallax scale; layers attachable to camera (HUD).
5. **Camera presets** (push/pull/pan/shake/truck) as one-click keyframe writers.
6. **Export:** the camera matrix is applied at render time in every exporter (image/sequence/video/HTML — Part 28) so the output matches the editor exactly.

---

## 16.7 BUILD CHECKPOINT M4 (camera slice)

- [ ] Camera object + camera layer/track; enable/disable; camera border + on-screen zoom/rotate sliders.
- [ ] Pan/zoom/rotate via tool (desktop modifiers + touch gestures) + numeric Properties.
- [ ] Camera keyframes + tweening + easing; log-space zoom interpolation.
- [ ] Layer depth panel + per-layer zDepth + parallax rendering (back-to-front, per-layer transform).
- [ ] Attach-to-camera (HUD) layers.
- [ ] Camera presets (push/pull/pan/shake/truck).
- [ ] Camera exported identically in all exporters.

*Next: `17_audio.md` — import, formats, audio layer, waveform, sync (Event/Start/Stop/Stream), loop, trim, volume, scrubbing, timeline sync, export sync.*
