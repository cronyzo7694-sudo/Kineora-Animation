# PART 09 — TWEENING
### Motion Tween, Classic Tween, Shape Tween — each with starting state, ending state, interpolation, supported/unsupported properties, easing, motion path, rotation, scale, color, alpha, filters, morphing, keyframe behavior — plus the complete easing system.

---

## 9.0 The three tween types at a glance

| | Motion Tween (modern) | Classic Tween | Shape Tween |
|---|---|---|---|
| Interpolates | A **symbol/text instance's properties** over a span | A single object between two **whole-frame keyframes** | A **raw shape morphing** into another shape |
| Storage | A **span** with per-property keyframes | Two keyframes + a span flag | Two keyframes + a span flag |
| Target | Symbol instances + text (others auto-wrapped) | Instances/groups/text (converted to symbol) | Raw shapes only |
| Motion path | Yes (editable Bézier) | Only via **motion guide** (legacy) | No |
| Per-property keys | Yes (x, y, scaleX, … independent) | No (single value per keyframe) | No |
| Easing | Per-property + presets | Simple ease + custom graph | Simple ease + custom graph |
| Modern default? | Yes (current Animate) | Legacy (kept for compat) | Yes (for morphing) |

**Design rule for our app:** implement **motion tween as the primary system** (it is strictly more powerful), **shape tween** for morphing, and **classic tween as a compatibility layer** that internally maps to whole-frame keyframes. The timeline visual language distinguishes them (Part 07.2).

---

## 9.1 MOTION TWEEN

### 9.1.1 Starting state
- A **tween span** on a **tween layer**, with a **target object** (symbol instance or text) at the first frame. The first frame is a **property keyframe** holding all initial values.
- Creation: select an object → Insert > Motion Tween. If the object isn't a symbol/text, Animate **wraps it in a symbol** (our app prompts: "Tweening requires a symbol — convert?").

### 9.1.2 Ending state
- Move the playhead in the span and change a property (drag the object, change alpha in Properties, rotate, etc.) → a **property keyframe** is created at that frame. The tween interpolates from the previous key of that property to this one.
- There is **no single "end keyframe"** — each property has its own keys, possibly at different frames.

### 9.1.3 Interpolation
- Per-property numeric interpolation (Part 08.2): position, scale, rotation, skew, alpha, color, filters.
- The **span** is the unit: select it as one object, drag it, copy it, delete it, or stretch it (all keys scale proportionally).

### 9.1.4 Supported properties (what a motion tween can animate)

| Property | Keyframe granularity | Notes |
|---|---|---|
| x, y (position) | independent | Drives the **motion path** (Part 10). |
| scaleX, scaleY | independent | Around the pivot. |
| rotation | single | With orientation options (9.1.7). |
| skewX, skewY | independent | |
| alpha (opacity) | single | Instance color-effect alpha. |
| tint / brightness | single | Instance color effect. |
| **Filters** (drop shadow, blur, glow, etc.) | per-filter per-param | Instance filters (Part 11). |
| 3D (rotationX/Y/Z, z — legacy) | per-property | Legacy only. |

### 9.1.5 Unsupported properties
- **Raw-shape geometry** (use shape tween).
- **Symbol swap** is not a *tweened* property (discrete swap at a keyframe; position still tweens around it).
- **Pivot changes** — pivot is static within a span in practice.
- **Frame labels/actions** — not tweened.
- **Bones** — bones use pose layers, not motion tweens (Part 14).

### 9.1.6 Easing
- Per-property easing in the **Motion Editor / graph editor** *[WISH W4]*: each property curve can have its own ease (ease-in/out, presets, custom Bézier). See 9.4.

### 9.1.7 Motion path
- Position keys define a **motion path** — a visible, editable Bézier the object follows (full spec: Part 10). Rotate-along-path option orients the object to the path tangent.

### 9.1.8 Rotation details
- Rotation is stored as **degrees + orientation flags**: `Auto` (shortest path), `CW`, `CCW`, and a **"rotations"** count (number of extra full turns — e.g., a wheel spins 3× while moving).

### 9.1.9 Keyframe behavior
- Property keyframes are **per-property**: you can key x at frame 5 and alpha at frame 12 independently. Right-click a span → **View Keyframes** → pick which property's keys to display.
- Deleting a property keyframe reverts that property to interpolation across the gap.

### 9.1.10 Tween span operations
- **Move span** (drag to another layer/frame); **stretch** (scale all keys); **swap target** (paste a new instance onto the span / Swap Symbol — the tween re-targets, keeping the property curve); **save as motion preset** (reusable tween — Part 09.5).

---

## 9.2 CLASSIC TWEEN

### 9.2.1 Starting & ending state
- Two **whole-frame keyframes** on the same layer (start content at K1, end content at K2) + a "Classic Tween" flag on the span between them.
- Both keyframes must contain the **same object** (usually a symbol instance, or a group/text — Animate auto-converts to symbol with a warning).

### 9.2.2 Interpolation
- The object's **whole state** interpolates: position, scale, rotation, skew, alpha, color, filters — all in **one** keyframe pair (no per-property keys).
- Frames render light blue with an arrow; a **dashed line** = broken tween (missing endpoint / different object).

### 9.2.3 Supported / unsupported
- Supported: transform (move/scale/rotate/skew), color effect (alpha/tint/brightness), filters.
- Unsupported: shape morphing, per-property keys, motion path (without a motion guide layer).

### 9.2.4 Motion guide (legacy path support)
- A **motion guide layer** above the tweened layer holds a **path**; the classic tween's object follows it (snap the object's pivot to the path start/end). Full guide/path semantics: Part 10.
- Orientation-to-path + snap-to-path options.

### 9.2.5 Easing
- A single **Ease** slider (−100 ease-in … +100 ease-out) + a **Custom Ease** graph (drag control points on a value/time curve — see 9.4).

### 9.2.6 Copy/Paste Motion
- **Copy Motion as XML** / **Paste Motion Special** (Animate) — copy a classic tween's property curves and apply to another object (motion presets). Our app: **Copy Motion / Paste Motion** as JSON (same idea).

### 9.2.7 Why keep classic tween at all?
- Muscle memory + a huge body of tutorials use it; it is simpler to reason about ("two poses → tween"). Our app keeps it as a thin layer over whole-frame keyframes + an interpolator. It also matches the **frame-by-frame → tween hybrid** workflows many animators use.

---

## 9.3 SHAPE TWEEN

### 9.3.1 Starting & ending state
- Two **whole-frame keyframes** with **raw shapes** (draw a square at K1, a circle at K2) + a "Shape Tween" flag. The shape **morphs** between them.

### 9.3.2 Interpolation (shape morphing — the hard part)
1. **Anchor correspondence**: match anchors of the start path to the end path. Default: by **index order** (anchor 0→0, 1→1…). If counts differ, the engine **inserts/splits** anchors so both paths have equal counts (subdivide the one with fewer).
2. **Per-anchor lerp**: each anchor's position + handles lerp across the segment; the fill follows the moving outline.
3. **Fill color lerp**: fill/stroke colors lerp (RGB/OKLab).
4. **Shape hints** (Modify > Shape > Add Shape Hint, Ctrl+Shift+H): the user places **lettered markers** (a, b, c…) on start & end shapes to **force correspondence** ("this corner morphs to THAT corner") — fixes chaotic morphs.

### 9.3.3 Supported / unsupported
- Supported: raw shapes (paths, fills, strokes, colors, variable-width profiles — Animate supports width-profile shape tweens).
- Unsupported: symbols/groups/text/bitmaps (must **Break Apart** to raw shapes first).

### 9.3.4 Easing
- Simple ease slider + custom ease graph (same as classic).

### 9.3.5 Keyframe behavior
- Only the two endpoint keyframes are editable; intermediate frames are computed. Add an intermediate keyframe (a third shape) for multi-stage morphs. Delete an endpoint → tween breaks (dashed).

### 9.3.6 Shape-tween + motion
- You can **move** the shape between K1 and K2 (position changes) — the shape morphs **and** travels. Color + position + shape all tween together.

---

## 9.4 THE COMPLETE EASING SYSTEM

Easing = remapping the interpolation parameter `t` (Part 08.2) so motion accelerates/decelerates. Our app implements a unified easing engine used by **all** tween types and the graph editor.

### 9.4.1 The easing function

```
easedT = easeFunction(t)          # t ∈ [0,1] → eased t' ∈ [0,1]
valueAt(t) = lerp(v0, v1, easedT)
```

### 9.4.2 Built-in easings

| Family | Functions |
|---|---|
| Linear | linear |
| Quadratic / Cubic / Quartic / Quintic | easeIn, easeOut, easeInOut |
| Sine | easeIn, easeOut, easeInOut |
| Exponential | easeIn, easeOut, easeInOut |
| Circular | easeIn, easeOut, easeInOut |
| Back | easeIn, easeOut, easeInOut (overshoot) |
| Elastic | easeIn, easeOut, easeInOut (spring) |
| Bounce | easeIn, easeOut, easeInOut |
| Steps | stepStart, stepEnd, stepN(n) (discrete) |

*(These are the standard Robert Penner easing curves — public domain; implement them directly.)*

### 9.4.3 The ease slider (−100 … +100)
- Classic/shape tween: a single **Ease** value. Negative = **ease-in** (slow start, fast end); positive = **ease-out** (fast start, slow end). The slider sets the strength; the curve is quadratic by default.

### 9.4.4 Custom ease (graph editor)
- A **value-over-time graph**: horizontal axis = frames (0%→100% of the segment), vertical = percentage of change (0%→100%). A diagonal line = linear. Drag the line / add control points = custom acceleration curve (Bézier).
- Our app's graph editor *[WISH W4]* shows **every property curve** of a tween (position X/Y, scale, rotation, alpha…) on one shared timeline — the After-Effects-style experience users want: multi-select keyframes, drag values directly on the graph, per-property eases.

### 9.4.5 Easing presets
- Animate ships **ease presets** (pre-configured curves: "Ease In", "Ease Out", "Bounce In", "Spring", etc.) applicable from a dropdown. Our app: the built-in functions (9.4.2) are the presets + a **save-custom-preset** option.

### 9.4.6 Motion presets (reusable tweens)
- A **motion preset** = a saved tween (all property curves + easing) that can be applied to another object. Animate's Commands menu (Copy/Paste Motion, motion presets). Our app: **Motion preset library** (JSON), drag-onto-object to apply.

---

## 9.5 Tween model (data)

```jsonc
// motion tween span (on a tween layer)
{ "type":"tween", "kind":"motion",
  "targetId":"n123",
  "start": 1, "duration": 60,
  "properties": {
     "x":      [ {frame:1, value:0, ease:null}, {frame:61, value:320, ease:{fn:'easeOut', a:1.7}} ],
     "y":      [ {frame:1, value:0}, {frame:61, value:0} ],
     "rotation":[ {frame:1, value:0}, {frame:61, value:360, orientation:'CW', rotations:1} ],
     "alpha":  [ {frame:1, value:1}, {frame:61, value:0} ]
  },
  "path": { "anchors":[...], "closed":false }   // derived from x/y keys (Part 10)
}

// classic/shape tween
{ "type":"classicTween" | "shapeTween", "start":1, "end":30, "ease": 0, "customEase":[ {t,y}... ], "shapeHints":[{startAnchor, endAnchor}] }
```

---

## 9.6 BUILD CHECKPOINT M2 (tween slice)

- [ ] Motion tween: span + per-property keyframes for x/y/scale/rotation/skew/alpha/tint/filters; auto-wrap non-symbols (with prompt).
- [ ] Motion path rendering + editing (Part 10 completes it); rotate-along-path; rotation flags (CW/CCW/loops).
- [ ] Classic tween: whole-frame interpolation + motion-guide path + ease slider/custom graph + copy/paste motion.
- [ ] Shape tween: anchor correspondence + subdivision + shape hints + color/width-profile morphing.
- [ ] Easing engine: all Penner functions + slider + custom Bézier graph + presets + motion presets.
- [ ] Graph editor (AE-style): multi-property curves, multi-select keys, per-property ease *[WISH W4]*.
- [ ] Broken-tween rendering (dashed) + recovery UX.

*Next: `10_motion_path.md` — path, anchors, Bézier handles, tangents, curves, motion guide, position interpolation, orientation, rotate-along-path, path editing/duplication/reversal.*
