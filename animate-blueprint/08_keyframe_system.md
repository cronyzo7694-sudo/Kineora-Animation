# PART 08 — KEYFRAME SYSTEM
### Keyframes from beginner to technical: what data each keyframe stores, what changes visually vs internally, how interpolation works, and what happens on move/delete/duplicate — for every keyframe type.

---

## 8.0 Keyframes for a beginner (60-second model)

A keyframe is a **snapshot you author**; everything between keyframes is **computed** by the app.

- You draw a ball at **frame 1** (a keyframe).
- You move the ball at **frame 10** (another keyframe).
- Frames 2–9 are **not authored** — the app **interpolates** the ball's position between the two.

That's it. A keyframe = "here is the truth at this moment." Frames between keyframes = "guess smoothly between the truths."

### The two families of keyframes

| Family | Where it lives | What it stores |
|---|---|---|
| **Property keyframes** (modern motion tween) | Inside a **tween span**, **per property** | A single property value (x, y, scaleX, rotation, alpha, …) for the tween's target object. |
| **Classic/frame keyframes** | Whole-frame | The **entire content** of the layer at that frame (all objects + their state). |

Animate has both: the **modern motion tween** uses property keyframes (fine-grained, one per property); the **classic tween** and frame-by-frame use whole-frame keyframes (coarse). Our app implements property keyframes as the primary system (it is strictly more flexible) and whole-frame keyframes for frame-by-frame (Part 15).

---

## 8.1 The keyframe data model

```jsonc
// PROPERTY keyframe (inside a motion tween span)
{ "frame": 10, "property": "x", "value": 320, "ease": null }

// WHOLE-FRAME keyframe (frame-by-frame / classic tween endpoints)
{ "frame": 1, "type": "keyframe", "content": [ nodeIds... ], "label": null, "actions": [] }
```

### 8.1.1 What data is stored (general)
- **Which frame** it occupies.
- **The value(s)** being keyed (one property, or whole content).
- **Optional easing** (Part 09) attached to that keyframe or the outgoing segment.
- **Optional metadata**: frame label (named goto target), frame actions (scripts), sound assignment (Part 17), color/alpha of a pose.

### 8.1.2 What changes visually
- A keyframe **marker** appears in the timeline (dot / diamond).
- On the stage: at that frame, the object shows the **keyed state** (e.g., rotated 45°).
- In panels: the Properties panel shows the keyed values when the playhead is on that frame.

### 8.1.3 What changes internally
- The document model gains a keyframe record at that frame.
- The **interpolator's input set** changes → all in-between frames between neighboring keyframes are **recomputed** (dirty range = the affected span).

---

## 8.2 Interpolation (how in-between frames are computed)

```
valueAt(t) = interpolate( keyBefore.value, keyAfter.value, ease(normalize(t)) )
```

- `t` = playhead frame, normalized to the segment `[frameBefore, frameAfter]` → `[0,1]`.
- `interpolate` depends on property type:
  - **Numbers** (x, y, alpha, scale, rotation, zoom): linear (or eased) numeric lerp.
  - **Rotation**: shortest-path or forced CW/CCW with optional multiple full turns (Part 09).
  - **Colors**: lerp in the color space (RGB or OKLab — our app uses OKLab for perceptually even fades, P1).
  - **Shapes (shape tween)**: **path morphing** — anchor correspondence between start/end paths, then per-anchor lerp (Part 09.4). This is the hardest interpolation; see 8.3.4.
  - **Bones**: per-joint angle/translation lerp (Part 14).
  - **Camera**: position/zoom/rotation lerp (Part 16).
- **Easing** (Part 09.5) remaps `t` (ease-in/out, custom curves) before interpolation.

**Sampling rule:** playback (and export) evaluates the timeline at integer frames (and at arbitrary times for video export with motion blur). The interpolator is **deterministic** — same inputs → same frames.

---

## 8.3 Keyframe types (per the requirement)

For each: **stored data / visual change / internal change / interpolation / move / delete / duplicate**.

### 8.3.1 Position keyframe
- **Stored:** `{property:'x'|'y', value}` (motion tween) or whole-frame content position (classic).
- **Visual:** object at that spot; motion path shows a vertex (Part 10).
- **Internal:** tween's position curve gets a control point.
- **Interpolation:** linear/eased between position keys; the object travels the **motion path**.
- **Move (drag the keyframe in time):** the object reaches that position earlier/later; the path re-times.
- **Delete:** the curve loses a control point; path simplifies (the object no longer passes through that spot).
- **Duplicate:** two identical position keys (object pauses there between them).

### 8.3.2 Rotation keyframe
- **Stored:** `{property:'rotation', value}` (+ orientation flags: auto/CW/CCW, rotations count).
- **Visual:** object angle changes; the stage shows the rotated state.
- **Internal:** rotation curve control point.
- **Interpolation:** angle lerp; shortest-path unless flags force direction/full turns.
- **Move:** rotation happens earlier/later.
- **Delete:** rotation jumps from previous to next key directly.
- **Duplicate:** rotation holds (pause) between the duplicates.

### 8.3.3 Scale keyframe
- **Stored:** `{property:'scaleX'|'scaleY', value}` (independent per axis).
- **Visual:** object size changes around the pivot.
- **Internal:** scale curve control point.
- **Interpolation:** multiplicative-consistent lerp (lerp on log-scale for natural growth — our app's choice; Animate lerps linearly).
- **Move/Delete/Duplicate:** as rotation.

### 8.3.4 Shape keyframe (shape tween / frame-by-frame)
- **Stored:** whole-frame content = a **shape** (path + fills + strokes). In a shape tween, TWO shape keyframes (start + end) define the morph.
- **Visual:** the shape looks different at this frame.
- **Internal:** for shape tweens, the engine builds **anchor correspondence** between start/end paths (matching by index, position, or manual **shape hints** — Part 09.4).
- **Interpolation:** per-anchor lerp of positions + handles; per-fill color lerp; region count changes handled by splitting/merging loops (Part 09.4).
- **Move:** the morph starts/ends earlier/later.
- **Delete (one endpoint):** the tween breaks (dashed line = broken tween); the remaining frames hold the surviving keyframe.
- **Duplicate:** no visible change (identical shape between).

### 8.3.5 Symbol keyframe (symbol swap / instance change)
- **Stored:** whole-frame content = a **symbol instance** (which symbol + instance transform). Swapping the symbol at a keyframe = "symbol keyframe" in practice.
- **Visual:** a different symbol appears (e.g., mouth pose A → mouth pose B — see 8.3.9).
- **Internal:** the frame's instance `symbolId` changes.
- **Interpolation:** symbol swaps are **discrete** — no interpolation (the swap happens at the keyframe). (Position/transform of the instance still tweens around the swap.)
- **Move/Delete/Duplicate:** as classic keyframes.

### 8.3.6 Color keyframe (color/alpha of a symbol instance)
- **Stored:** `{property:'tint'|'brightness'|'alpha', value}` — the instance's **color effect** (Part 11).
- **Visual:** the instance recolors/fades.
- **Internal:** color-effect curve control point.
- **Interpolation:** color lerp (RGB/OKLab) or alpha lerp.
- **Move/Delete/Duplicate:** as other property keys.

### 8.3.7 Camera keyframe
- **Stored:** `{frame, camera:{x,y,z,zoom,rotation,tint}}` on the camera layer.
- **Visual:** the whole stage view changes (pan/zoom/rotate) — the camera keyframe changes the **frame**, not the art.
- **Internal:** camera layer's keyframe data.
- **Interpolation:** position/zoom/rotation lerp (zoom often lerped in log-space for natural push-ins — our app's choice).
- **Move:** the camera move re-times.
- **Delete:** camera snaps from previous to next view.
- **Duplicate:** camera holds (static shot).

### 8.3.8 Bone keyframe (pose)
- **Stored:** `{frame, pose:{boneStates:[{boneId, rotation, translation}]}}` on a pose layer.
- **Visual:** the armature takes that pose.
- **Internal:** each bone's angle/position control points.
- **Interpolation:** per-bone angle/translation lerp between poses (IK is *not* re-solved during playback — the solver runs at author time; playback interpolates stored angles. This is how Animate behaves and it's the right model).
- **Move:** the pose re-times.
- **Delete:** the armature interpolates across the gap (or breaks if it was a single pose).
- **Duplicate:** the pose holds.

### 8.3.9 Mouth keyframe (lip-sync viseme)
- **Stored:** a **graphic-symbol instance** whose "first frame" is set to a mouth-pose frame (via Frame Picker / auto lip-sync — Part 18). In practice = a **symbol-swap/instance keyframe** pointing at a different mouth pose.
- **Visual:** the mouth shape changes (A/E/O/M/rest…).
- **Internal:** the instance's `symbolId` or `firstFrame` changes.
- **Interpolation:** discrete (mouth shapes snap, like real speech — no morph).
- **Move/Delete/Duplicate:** as symbol keyframes; auto lip-sync generates a run of these from audio (Part 18).

---

## 8.4 Keyframe lifecycle events (what happens when…)

### 8.4.1 A keyframe is MOVED (dragged in time)
1. The keyframe record's `frame` changes.
2. The span it belongs to re-computes (dirty range).
3. If it was a tween property keyframe, the property curve re-times; the motion path re-draws (Part 10).
4. If it lands past the layer duration, the layer extends.
5. Undo = one `MoveKeyframeCommand`.

### 8.4.2 A keyframe is DELETED
1. The record is removed.
2. **Property keyframe:** the property curve loses the point; neighbors interpolate across (or hold the remaining value).
3. **Whole-frame keyframe:** the layer reverts to the previous keyframe's hold (or becomes empty if it was the first).
4. **Classic/shape tween endpoint:** the tween **breaks** (rendered as a dashed line; the span holds the surviving endpoint).
5. **Pose:** armature interpolates across, or breaks.
6. Undo = one `DeleteKeyframeCommand`.

### 8.4.3 A keyframe is DUPLICATED (copy-paste)
1. A new record with identical data at the target frame.
2. Between identical keys, the property **holds constant** (a pause — the classic timing trick).
3. Undo = one `PasteKeyframeCommand`.

---

## 8.5 Auto-keying (when a keyframe is created for you)

- **Rule (our app, explicit):** editing an object's property while the playhead is on a **non-keyframe** frame auto-inserts a property keyframe (motion tween) or converts to a keyframe (frame-by-frame) at the playhead, and shows a toast: "Auto-keyed frame N."
- **Animate legacy "Auto-Keyframe mode":** a scrub-with-keys mode; deprecated but our app offers a toggle (P2) for muscle-memory users.
- **Blank keyframe vs keyframe:** auto-key on empty layers creates a **keyframe with content** (F6 semantics), not blank.

---

## 8.6 Keyframes + audio/symbols/rigging (cross-interactions)

- **Audio:** sound is attached to **whole-frame keyframes** (the sound starts at that keyframe; Stop sync at a later keyframe — Part 17). A keyframe can carry a `sound:{assetId, sync, loop, effect}`.
- **Symbols:** graphic-instance frame mapping (Part 11) means a main-timeline keyframe can *drive* a graphic symbol's internal frame — the mechanism behind Frame Picker lip-sync.
- **Rigging:** poses are keyframes on pose layers (8.3.8); bone constraints are **not** keyframed (constraints are rig-level, static per bone).

---

## 8.7 BUILD CHECKPOINT M2 (keyframe slice)

- [ ] Two keyframe families implemented: property keyframes (per-property, inside tween spans) + whole-frame keyframes (frame-by-frame).
- [ ] Interpolator for: numbers, rotation (with direction/flags), colors (OKLab), alpha, scale (log-lerp), camera, bones.
- [ ] Shape morph interpolation with anchor correspondence (details in Part 09.4).
- [ ] Keyframe move/delete/duplicate semantics exactly as 8.4, incl. tween-break on endpoint delete.
- [ ] Auto-keying rule + toast.
- [ ] Frame labels + frame actions stored on keyframes.
- [ ] All keyframe types render correct timeline visuals.

*Next: `09_tweening.md` — Motion Tween, Classic Tween, Shape Tween (start/end/interpolation/supported properties/easing/motion path/rotation/scale/color/alpha/filters/morphing) + the complete easing system.*
