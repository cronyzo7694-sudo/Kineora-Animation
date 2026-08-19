# F-03-01 — F. OBJECT COMPATIBILITY · H. TIMELINE · I. SYMBOL · J. LAYER · K. CROSS-FEATURE

---

## F. OBJECT COMPATIBILITY (what a hit test returns for each object type)

| Object type | Support | Hit-test behavior (click → what is selected) |
|---|---|---|
| Shape (raw, merge) — **fill** | SUPPORTED (sub-object) | fill selected alone (E12); marquee selects intersected region (E13) |
| Shape (raw) — **stroke** | SUPPORTED (sub-object) | stroke selected alone (E12); double-click = connected strokes (E14) |
| Drawing object | SUPPORTED | whole object; marquee honors contact-sensitivity (E9) |
| Group | SUPPORTED (container) | whole group; must **enclose** to marquee-select (E2); double-click enters edit (E11) |
| Symbol instance (any type) | SUPPORTED (container) | whole instance; must **enclose** to marquee-select (E2); click works (E3) |
| Graphic symbol instance | SUPPORTED | same as instance; hit resolves to the instance, never its internal frames |
| Movie clip instance | SUPPORTED | same; internal animation does **not** affect hit (hit = instance bounds/content at that frame) |
| Button instance | SUPPORTED | same as instance; in "Enable Simple Buttons" the Hit-area state may capture the pointer (special — Part 11) |
| Bitmap | SUPPORTED | whole bitmap (rect); [INFERENCE] hit = bounding rect by default, alpha-precise only if implemented |
| Text block | SUPPORTED | whole text block; click = select; double-click = text edit; must enclose to marquee (E2) |
| Bone / armature | PARTIAL | clicking a bone selects it (Part 14); pose-layer frame click selects whole armature |
| Rig (our app) | PARTIAL | rig parts are instances → instance hit rules |
| Mask (mask layer shape) | SUPPORTED | the mask shape is selectable as a shape on its mask layer (Part 21) |
| Camera | SPECIAL | camera is not a stage object — selecting the Camera tool / camera layer activates it (Part 16); no stage hit |
| Frame (timeline cell) | n/a | frames are hit-tested in the **Timeline panel**, not the stage (H below) |
| Layer (row) | n/a | layer rows are timeline UI, not stage |
| Scene | n/a | scenes are navigated via the Scene panel |
| Audio | n/a | audio is a keyframe attachment (waveform in timeline), not a stage object |

---

## H. TIMELINE INTERACTION

- **Current frame defines the hit-test set.** A hit resolves only against objects present on the **current frame** of visible layers (E-state "Playing").
- **Frames / keyframes:** clicking a **frame cell** (timeline) selects that layer's content **between keyframes** (E8) — a timeline-side selection, not a stage hit.
- **Blank keyframes / held frames:** content is whatever the nearest preceding keyframe holds (Part 07 hold rule); hits resolve against that held content. A **blank keyframe** = empty at that frame → no stage hits.
- **Motion tweens:** the target instance is hit-testable; its position at the playhead frame is the hit position.
- **Classic/shape tweens:** intermediate frames are computed; hits resolve against the interpolated content (shape tween = the morphed shape at that frame; classic = the instance's interpolated transform).
- **IK pose layers:** bones are hit-testable (F matrix); the deformed shape of an IK shape is hit-testable as a shape.
- **Graphic/movie clip timelines:** hitting an instance always selects the **instance**, not the inner frames; inner frames are only hit-testable after entering edit-in-place.
- **Nested timelines:** hit tests descend only into the **current edit scope** (top level → containers only).

---

## I. SYMBOL INTERACTION

- **Graphic / Movie clip / Button:** all resolve to the **instance** as the hit unit (never internal content at the top level).
- **Nested symbol:** hit = the top-most instance under the pointer (stacking order E10; instances sit above raw shapes).
- **Instance:** click selects the instance; Shift-click adds; marquee must enclose (E2).
- **Symbol edit mode / edit in place:** while editing, hits resolve against the **symbol's own timeline content**; the rest of the stage is dimmed and excluded.
- **Swap symbol / duplicate / break apart:** post-hit commands (they act on the selected instance); hit testing only *produces* the instance selection.

---

## J. LAYER INTERACTION

| Layer type/state | Hit-test effect |
|---|---|
| Normal | content hit-testable normally |
| Folder | container only; its **children's** content is hit-testable (folders don't create a hit boundary) |
| Mask | the mask shape is hit-testable (as a shape) |
| Masked | content hit-testable; hit resolves to the content, clip does not alter hit geometry |
| Guide / motion guide | guide paths are hit-testable as paths; guide content does **not** export |
| Camera layer | no stage hits (camera widget is UI) |
| Pose/IK layer | bones + IK-shape content hit-testable |
| **Locked layer** | skipped entirely (no hits) |
| **Hidden layer** | skipped (not rendered → no hits) |
| Outline-mode layer | content still hit-testable (outline is render-only) |

---

## K. CROSS-FEATURE INTERACTION (what triggers / what changes / what the user sees / what data changes)

| With | Trigger | What changes | What does NOT change | User sees | Data change |
|---|---|---|---|---|---|
| Selection | click/marquee | selection state | document model | highlight + bounding box | none (view) |
| Transform | select then drag | object transform | other objects | object moves | transform.x/y… |
| Drawing | (no hit role) | — | — | — | — |
| Shapes (merge) | partial marquee | selected region | rest of shape | speckled region | none until move/cut |
| Keyframes/tweens | click on tweened instance | selects tween target | tween curve | instance selected | none until edit |
| Symbols | click instance | selects instance | symbol definition | bounding box | none |
| Rigging/IK | click bone | selects bone | other bones | bone highlight | none |
| Asset warp | click warped asset/pin | selects asset or pin | mesh | pin highlight | none |
| Masks | click mask shape | selects shape | masked content | shape highlight | none |
| Camera | n/a | — | — | — | — |
| Audio | n/a (timeline) | — | — | — | — |
| Lip sync | click mouth instance | selects instance | viseme keyframes | bounding box | none |
| Scenes | n/a (panel) | — | — | — | — |
| Text | click text | selects block (or caret on double-click) | text content | highlight / caret | none until edit |
| Color | (no direct role) | — | — | — | — |
| Import/Export | n/a | — | — | — | — |
| Playback | frame advance | hit set changes; selection may drop if object vanishes | — | selection may clear | none |
