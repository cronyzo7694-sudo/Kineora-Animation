# PART 15 — FRAME-BY-FRAME ANIMATION
### The traditional workflow: drawing frame → next frame → onion skin → redraw → exposure → playback — with every onion-skin control, and the cel/drawing-reuse system [WISH W1].

---

## 15.0 Frame-by-frame vs tweening (when to use each)

- **Frame-by-frame** = every frame is a **keyframe** you drew. Total control, no interpolation artifacts. Use for: nuanced motion (hands, faces, hair, water), stylized/limited animation, effects.
- **Tweening** (Part 09) = you author endpoints, the app fills the middle. Use for: mechanical motion, cut-out rigs, camera, UI.
- **Hybrid** (industry norm): tween the body, frame-by-frame the accents. The editor must make both **equally easy** and let them **coexist on different layers**.

---

## 15.1 The workflow (step-by-step)

### Step 1 — Draw frame 1
- Draw the key pose on layer 1, frame 1 (a keyframe, since frame 1 is one by default).

### Step 2 — Next frame
- **Insert Blank Keyframe (F7)** on frame 2 (starts empty) **or** **Insert Keyframe (F6)** (copies frame 1's drawing — you modify the copy).
- *[WISH W1] The cel/drawing-reuse rule:* **F6 (copy) vs F7 (blank) is the key decision:**
  - **F6** duplicates the previous drawing → edit the copy (trace-over). This is the traditional "cel" workflow but in Animate it makes an **independent copy** — a change to the original does **not** propagate (users hate this: "duplicate a frame and only that frame changes").
  - **Our app adds a third way (W1):** **"Drawing" asset + exposure** — a drawing is a **reusable asset** in the Library; a frame **exposes** a drawing. Duplicate a frame = **expose the same drawing** (shared); edit-on-duplicate = **instantiate a new drawing** (independent). This gives both behaviors explicitly (15.5).

### Step 3 — Onion skin
- Turn on onion skin to see the **previous/next** drawings **ghosted** (semi-transparent) behind the current one → draw the in-between accurately.

### Step 4 — Redraw
- Draw the in-between; repeat steps 2–4 for every frame.

### Step 5 — Exposure & timing
- Adjust **exposure** (how many frames each drawing holds — Part 07.3) to control timing (twos = 2 frames/drawing, ones = 1 frame/drawing). Classic limited animation uses twos (12fps feel on 24fps).

### Step 6 — Playback
- Enter to play; `.` / `,` to step; scrub to check arcs.

---

## 15.2 Onion skin — every control, in detail

Onion skin = a **render pass** that draws neighboring frames' contents ghosted so you can see motion continuity.

### 15.2.1 The controls (timeline bottom row)

| Control | Icon concept | Does |
|---|---|---|
| **Onion Skin** (toggle) | two overlapping squares | Show previous + next frames ghosted. |
| **Onion Skin Outlines** | overlapping square outlines | Show ghosts as **outlines only** (lighter on CPU). |
| **Edit Multiple Frames** | stacked squares with pencil | Show (and allow **editing**) multiple frames at once — not just ghosts. |
| **Modify Markers** (dropdown) | flag | Choose the onion-skin **range**: Always Show Markers / Anchor Markers / Onion 2 / Onion 5 / Onion All. |
| **Start/End onion markers** | bracket handles on the frame ruler | Manually drag the **onion range** (which frames ghost). |
| **Onion tint colors** | color chips | Past frames tint one color, future frames another (configurable). |
| **Onion opacity** (our app) | slider | Ghost strength (0–100%). |

### 15.2.2 Onion-skin behavior rules
- **Past frames** ghost in one tint (default red-ish), **future frames** in another (default green-ish); the **current frame** is full color.
- Ghosts are **not editable** (except in Edit Multiple Frames mode) and **never export**.
- Onion range defaults to a few frames around the playhead; markers define it.
- **Anchor Markers**: lock the onion range so it doesn't follow the playhead (e.g., always show frames 1–5 while you draw 6–12).
- Onion skin applies **per current layer** (or all layers — a toggle, our app default: all).
- Only **keyframe drawings** ghost (static frames show the same ghost — no point re-drawing them).

### 15.2.3 Implementation
- The renderer draws the ghost pass **under** the current frame: for each frame in the onion range, render its content with tint+alpha, using a cached bitmap per frame (invalidate on edit). Outline mode renders path strokes only. This is a **cache-friendly** design (key for long frame-by-frame scenes).

---

## 15.3 Frame-by-frame tools & shortcuts

| Action | Shortcut | Does |
|---|---|---|
| Next/prev frame | `.` / `,` | step the playhead (draw → step → draw) |
| Insert keyframe (copy prev) | F6 | new key with copied content |
| Insert blank keyframe | F7 | new empty key |
| Extend frame (exposure) | F5 | hold the drawing one more frame |
| Delete frame / Clear keyframe | Shift+F5 / Shift+F6 | shorten / empty |
| Play / stop | Enter | playback |
| Onion skin toggle | (assignable; our app: `O`) | show ghosts |

---

## 15.4 Playback & exposure rules

- **Exposure** = the number of consecutive frames a drawing holds (its "hold"). Editing exposure = drag the span edge / F5 / Shift+F5 (Part 07).
- **Timing on twos:** duplicate each drawing across 2 frames (hold of 2). This halves the drawing work — the classic economical technique.
- **Ones vs twos vs threes:** hold length 1/2/3 — more holds = choppier but stylized. The editor's exposure system makes this trivial.
- **Loop playback** + **scrub with audio** (Part 17) are the review tools.

---

## 15.5 The cel / drawing-reuse system [WISH W1] — our improvement

**Problem (Animate):** F6 copies a drawing into an **independent** duplicate. Change the original later → duplicates don't update. Users explicitly asked for a **cel-based workflow** where drawings are reusable assets.

**Our model — two explicit operations:**

| Operation | Shortcut (ours) | Semantics |
|---|---|---|
| **Expose same drawing** (share) | `D` then click the frame, or right-click → "Expose Drawing" | The frame **references** a Library drawing; editing the drawing updates **every frame** that exposes it. (Like a symbol, but a flat drawing — the cel model.) |
| **Duplicate to new drawing** (independent) | F6 (default) | Copies the drawing into a **new** Library drawing; edits affect only this frame. (Animate's behavior, kept.) |
| **Edit drawing** | double-click (or in-place) | Edit a drawing in the **Drawing Editor** (its own canvas) or in place. |

Data model:

```jsonc
// a drawing is a Library asset
{ "type":"drawing", "id":"d_012", "layers":[...], "duration":1 }   // one flat drawing (multi-layer optional)

// a frame exposes a drawing
"frames":[ { "type":"keyframe", "drawingId":"d_012" } ]
```

Benefits:
- Reuse one drawing across frames/scenes (exposure = reference, not copy).
- Fix a drawing once → all its exposures update (trace-over corrections propagate).
- Smaller files (shared geometry).
- **Still fully compatible** with the classic F6-copy workflow (independent drawings).

This is a **strict superset** of Animate's behavior and directly answers the top community request.

---

## 15.6 BUILD CHECKPOINT M4 (frame-by-frame slice)

- [ ] Frame-by-frame workflow: F6/F7/F5, step `.`/`,`, play, scrub.
- [ ] Onion skin: toggle, outlines, edit-multiple-frames, markers (always/anchor/2/5/all), draggable range, tint colors, opacity; ghosts never export; cache-friendly.
- [ ] Exposure editing (span drag) + ones/twos/threes timing.
- [ ] Cel/drawing system: drawing assets, expose-same vs duplicate-new, drawing editor, propagate edits *[WISH W1]*.

*Next: `16_camera.md` — camera tool, camera layer, position, zoom, rotation, camera keyframes, tweening, presets, movement, and how a new app should represent camera animation.*
