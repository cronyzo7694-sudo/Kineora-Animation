# PART 07 — TIMELINE
### The complete timeline specification: every component, every frame type, every layer control, every timeline action — control-by-control, with what changes in the model and how it interacts with keyframes, audio, symbols, and rigging.

---

## 7.0 What the timeline IS (the clock + the score)

The timeline is **two things at once**:

1. **A clock** — it maps a **playhead position** (frame number) to a moment in time (`t = frame / fps`) and evaluates every layer's content at that moment.
2. **A score** — it is an **editable 2D grid** of `layer × frame` where each cell holds a piece of frame data. The user *composes* animation by editing this grid; playback just *reads* it.

Everything in this part is about the grid: its components, its cell types, its controls, and its actions. Keyframe *semantics* (what data lives in a keyframe, how interpolation works) are Part 08; tween *span* behavior is Part 09.

### The core data structure

```jsonc
// A timeline (main timeline or a symbol's timeline)
"timeline": {
  "layers": [ Layer, ... ],          // bottom→top (render order = index order, 0 = back)
  "duration": 120,                    // computed: max frame extent across layers
  "playhead": 0                       // current frame (view state, not saved)
}

// A layer
{
  "id":"L1", "name":"arm", "type":"normal",   // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible": true, "locked": false, "outline": false,
  "parentId": null,                  // for folders/nesting
  "zDepth": 0,                        // camera parallax depth (Part 16)
  "attachedToCamera": false,
  "frames": [ Frame, ... ]            // sparse — only keyframes + span markers stored (7.3)
}
```

---

## 7.1 Timeline components (control-by-control)

### 7.1.1 Layer row (left column list)
Each layer = one horizontal row. Clicking a row **selects the layer** (for rename/reorder/delete/properties). Double-click the name = rename. The **active layer** (pencil icon) is where new drawings go. Layer rows show, left→right:

| Control | Icon concept | Click does | Data changed |
|---|---|---|---|
| **Visibility (eye)** | open/closed eye | toggle show/hide | `layer.visible` |
| **Lock (padlock)** | padlock | toggle lock | `layer.locked` |
| **Outline (colored square)** | filled/hollow square | toggle outline render | `layer.outline` |
| **Name** | text | rename (dbl-click) | `layer.name` |
| **Type icon** | (varies) | opens layer menu | — |
| **Attach-to-camera dot** | chain link | pin layer to camera | `layer.attachedToCamera` |

*(Full layer semantics: Part 20. Mask/guide/pose/camera/audio layer types: Parts 21/14/16/17.)*

### 7.1.2 Frame numbers (header ruler)
- A horizontal ruler showing frame numbers (1, 5, 10, 15, …). 
- **Click a number** = jump the playhead to that frame.
- **Drag in the header** = scrub (with audio, if scrubbing enabled — Part 17).
- Current-frame indicator: a red outline/box around the current frame number.

### 7.1.3 Playhead
- A red vertical line + top handle spanning the frame grid. **It is the "now".**
- **Drag the handle** = scrub; **click a frame cell** = jump.
- The playhead is **view state** (not saved), but it drives: what the stage shows, what frame commands target, what properties panel shows for frames.

### 7.1.4 Frame cells (the grid)
- Each `layer × frame` cell shows that frame's **visual language** (7.4). Click selects the frame(s); right-click opens the frame context menu (Part 30); drag moves/copies spans.

### 7.1.5 Onion-skin & playback controls (bottom row)
- **Onion Skin** toggle, **Onion Outlines**, **Edit Multiple Frames**, **Modify Markers** (Part 15).
- **Center Frame** (jump to playhead), **Loop playback**, **Mute**, transport (go-to-first / play / go-to-last).
- **Status readout**: current frame, fps, elapsed time.

---

## 7.2 Frame types (every kind of cell — exact meaning)

| Cell | Visual (concept) | Meaning | Stored data |
|---|---|---|---|
| **Keyframe (with content)** | solid black dot | An explicit frame holding content; content is authored here. | `{type:'keyframe', content:[...]}` |
| **Blank keyframe** | hollow dot | An explicit **empty** keyframe (content intentionally empty — breaks the hold). | `{type:'blankKeyframe'}` |
| **Static / held frame** | gray cell (span of the keyframe) | Not stored — it *repeats* the previous keyframe's content. | (derived — nothing stored) |
| **Empty frame** | white cell | No content on this layer at this frame. | (derived) |
| **Frame span** | gray bar ending in a hollow rectangle | The run of static frames a keyframe holds across. | (derived; extent = next keyframe − 1) |
| **Motion tween span** | blue bar, black dot start, black diamond keys | Interpolated symbol/text tween (Part 09). | `{type:'tween', tween:{kind:'motion', targetId, properties:{...}}}` |
| **Classic tween span** | blue bar + arrow | Legacy tween between two keyframes. | `{type:'classicTween'}` (span between keyframes) |
| **Shape tween span** | light-green bar + arrow | Morph tween between two keyframes. | `{type:'shapeTween'}` |
| **IK pose span** | green bar, diamond poses | Bone armature poses. | `{type:'pose', pose:{...}}` (Part 14) |
| **Frame with action** | cell with small "a" | Frame carries a script/behavior. | `{type:'keyframe', actions:[...]}` |
| **Frame with label** | cell with red flag | Named frame (goto targets). | `{type:'keyframe', label:'walk_01'}` |

**Critical concept — sparse storage:** only **keyframes** (and tween/pose span markers) are stored. Static/empty frames are **derived** by "hold until next keyframe" semantics. The model never stores 120 identical frames. This is what makes the file small and the editor fast.

---

## 7.3 Exposure, holds, and frame spans (the "hold" rule)

- **Exposure** = how many frames a keyframe's content is *visible* for = the run of frames until the next keyframe (exclusive).
- The **hold rule**: a layer at frame `f` shows the content of the **nearest keyframe at or before `f`**. A keyframe "holds" until the next keyframe replaces it.
- **Frame span** = `[keyframe, nextKeyframe - 1]`. The last cell of a span shows a hollow rectangle ("end of hold").
- **Blank keyframe** = an explicit empty hold (e.g., the character disappears at frame 20 by inserting a blank keyframe there).

**Example:** frame 1 = keyframe (drawing), frame 10 = keyframe (different drawing). Frames 1–9 show drawing 1; frame 10+ show drawing 2. Stored: just frames 1 and 10.

---

## 7.4 Timeline action reference (every possible action)

Each action: **trigger → model change → visible result → undo unit**.

### 7.4.1 Insert Frame (F5)
- **Trigger:** select frame(s) → Insert Frame (F5).
- **Model change:** extends the span of the previous keyframe by one frame (inserts a static frame after the keyframe; shifts later frames right).
- **Visible result:** the keyframe's content holds for one more frame (animation stretches).
- **Undo:** one `InsertFramesCommand` (span index range).

### 7.4.2 Insert Keyframe (F6)
- **Model change:** converts the current frame to a keyframe **copying the previous keyframe's content** (content is duplicated → you can now edit it independently at this frame).
- **Visible result:** a new dot; content identical to before until you edit.
- **This is the #1 animation action** — "copy the previous frame and make a new key pose."
- **Undo:** one command.

### 7.4.3 Insert Blank Keyframe (F7)
- **Model change:** converts the current frame to an **empty** keyframe (no content — breaks the hold).
- **Visible result:** a hollow dot; content disappears from here until the next keyframe.
- **Undo:** one command.

### 7.4.4 Delete Frame (Shift+F5)
- **Model change:** removes the frame(s); content after shifts left.
- **Undo:** one command (range).

### 7.4.5 Clear Keyframe (Shift+F6)
- **Model change:** removes the keyframe **status** (the frame reverts to a static/held frame), but **does not delete the frame** — the content collapses into the previous keyframe's hold.
- **Difference from Delete:** Clear Keyframe keeps the timeline length; Delete Frame shortens it.

### 7.4.6 Remove Frames (vs Delete)
- **Delete Frames** removes frames and shifts the rest left (timeline shortens).
- **Remove Frames** deletes the frames **and leaves a gap** (subsequent frames stay put). Our app exposes both with distinct names + tooltips.

### 7.4.7 Copy / Cut / Paste Frames
- **Copy Frames** — copies a frame range (incl. keyframes, tweens, labels) to a clipboard.
- **Paste Frames** — pastes at the playhead (overwriting or inserting per option). Paste **frames** (not just content) is how you move whole animation chunks.
- **Undo:** one command.

### 7.4.8 Duplicate Frames
- Copy + insert immediately after (or at selection). No clipboard.

### 7.4.9 Move Frames (drag)
- Drag a frame/span to another position or layer. If the target has a keyframe, prompt overwrite/insert.
- **Undo:** one `MoveFramesCommand` (from/to).

### 7.4.10 Reverse Frames
- Reverse the **order** of the selected keyframes (e.g., a walk-cycle reverses). Content plays backwards.
- Applies to keyframes within the selection; tweens re-interpolate.

### 7.4.11 Extend / Shorten Frame (span drag)
- Drag the **last frame** of a span (or the span edge) to extend/shorten the hold. Our app also supports **duration-drag** on any span edge.

### 7.4.12 Convert to Keyframes / Blank Keyframes
- **Convert to Keyframes** — every frame in the selection becomes a keyframe (e.g., bake a tween into per-frame keys — needed before frame-by-frame editing).
- **Convert to Blank Keyframes** — same but empty.

### 7.4.13 Distribute to Layers
- Takes each selected object (or each group of selected content) and moves it to its **own new layer** — used to split a character into parts (Part 13 step 2). Auto-names layers.

### 7.4.14 Synchronize Symbols (legacy)
- Aligns the internal timelines of graphic-symbol instances to the main timeline (so nested loops line up). Our app: a "sync nested loops" command (P2).

### 7.4.15 Tween actions (spans)
- **Create Motion Tween** — converts the selection (symbol/text) + its layer into a tween span (Part 09).
- **Create Classic Tween** / **Create Shape Tween** — between two keyframes (Part 09).
- **Insert Pose** — on a pose layer (Part 14).

---

## 7.5 Layer controls & hierarchy (timeline-side)

- **Add layer** (+), **Add folder**, **Delete layer**, **Duplicate layer**.
- **Reorder** (drag up/down) — changes render order (top = front).
- **Rename** (double-click).
- **Folder** — a container row; layers inside can be **collapsed/expanded** (triangle); folders group + can be locked/hidden as one.
- **Layer parenting** — a layer can be parented to another (indent + line), so it inherits the parent's transform/visibility *[WISH W2]* (our app: parenting via a `parentId` link; moves propagate in local space so copy/paste can't corrupt — Part 20).
- **Layer type** — set via right-click → Properties (normal/mask/masked/guide/pose/camera/audio/tween/folder). Type changes what the layer stores and how it renders (Parts 16/17/20/21).
- **Layer properties dialog** — name, type, outline color, layer height (timeline row size), visibility.

---

## 7.6 How the timeline interacts with everything else

### With keyframes (Part 08)
The timeline *stores* keyframes; keyframes *carry* the data. Editing a frame cell = editing the keyframe at that cell. The playhead selects *which* keyframe is "current" for stage edits.

### With audio (Part 17)
Audio lives on an **audio layer** as a **waveform drawn across frames**. The waveform's horizontal extent = the sound's duration at current fps. Dragging the waveform moves its start frame; keyframing Start/Stop uses the Sync menu (Event/Start/Stop/Stream). **Scrubbing** the playhead plays stream audio at the scrub position (when scrub-audio is on).

### With symbols (Part 11)
The main timeline can hold **instances** of symbols. A **graphic symbol instance** shows one of its internal frames (loop/play-once/single-frame + first-frame via Frame Picker) — so the main timeline "drives" graphic-symbol animation by frame number. A **movie clip** plays independently of the main timeline. This is why "timeline = clock" matters: main-timeline frame → graphic-instance frame mapping is deterministic.

### With rigging (Part 14)
Pose layers store **poses** (armature configurations) as diamonds; the timeline interpolates between them. Bones are per-pose-layer; moving a bone writes into the current pose keyframe.

### On mobile (Part 31)
- Scrub = drag on the playhead or on the stage (Time Scrubber).
- Frame ops = long-press frame → action menu (insert/delete/copy/paste/clear).
- Layer ops = long-press layer row → menu.
- Pinch on the ruler = zoom the frame ruler (see more frames); two-finger scroll = pan the frame grid.

---

## 7.7 BUILD CHECKPOINT M2 (timeline slice)

- [ ] Layer list with visibility/lock/outline/name/type; add/delete/rename/reorder/folder; active-layer tracking.
- [ ] Frame ruler + playhead (click-to-jump, drag-to-scrub).
- [ ] Sparse frame storage with the hold rule (keyframes + derived static frames).
- [ ] All frame types rendered with distinct visuals (keyframe/blank/tween/pose/label/action/held).
- [ ] All 15+ timeline actions working with correct undo granularity (insert/delete/clear/remove/copy/paste/move/duplicate/reverse/extend/shorten/convert/distribute).
- [ ] Tween-span creation (motion/classic/shape) wired (full behavior in Part 09).
- [ ] Audio waveform display + scrub (full behavior in Part 17).
- [ ] Touch: scrub, long-press frame/layer menus, ruler pinch-zoom.

*Next: `08_keyframe_system.md` — what data each keyframe type stores, what changes visually/internally, interpolation, and what happens on move/delete/duplicate — beginner-to-technical.*
