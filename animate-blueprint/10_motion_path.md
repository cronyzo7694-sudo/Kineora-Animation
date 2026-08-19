# PART 10 — MOTION PATH
### The path a tweened object follows: path, anchors, Bézier handles, tangents, curves, motion guide, position interpolation, orientation, rotation-along-path, path editing/duplication/reversal.

---

## 10.0 What a motion path is

A motion path is the **curve traced by an object's position over time** in a motion tween. It is derived from the tween's **position property keyframes** (x, y keys — Part 09.1): each position keyframe = one **vertex** on the path. The object travels the path, arriving at each vertex at that keyframe's time.

```
positionKeys:  (frame 1, P0) (frame 30, P1) (frame 60, P2)
motion path =  Bézier curve through P0 → P1 → P2
object position at t = point on the curve at arc-position(t)
```

Two kinds in Animate:
1. **Motion-tween path** (modern) — the path **is** the tween's position curve; editable directly on stage.
2. **Motion guide** (classic tween, legacy) — a separate guide-layer path that the tweened object snaps to.

Our app implements #1 as the primary (it's the modern model) and #2 as a compatibility layer.

---

## 10.1 Path anatomy (the terms)

| Term | Meaning |
|---|---|
| **Path** | The ordered curve the object follows. |
| **Vertex / anchor point** | A point where the path changes direction; one per **position keyframe**. |
| **Bézier handle / tangent** | The two-direction line at a vertex that controls the curve's approach/exit. |
| **Tangent length** | How far the curve is "pulled" toward the handle (longer = wider arc). |
| **Curve segment** | The Bézier between two adjacent vertices. |
| **Closed vs open path** | A closed path loops (the object returns to the start and continues). |
| **Arc position** | How far along the path the object is at time t (parameterized by the position curve's easing, **not** by arc-length unless normalized). |

### Data model

```jsonc
// derived from the tween's x/y keys, cached for editing:
"path": {
  "anchors": [ { "x":0,"y":0,"h1x":..,"h1y":..,"h2x":..,"h2y":.. }, ... ],  // h1=incoming, h2=outgoing handles
  "closed": false,
  "vertexFrames": [1, 30, 60]      // which frame each anchor corresponds to
}
```

Editing the path **writes back** to the x/y keys (they are the same data, two views).

---

## 10.2 Position interpolation along the path

Two distinct notions of "position on a path":

1. **Parameter interpolation** — `point = bezier(path, t)` where `t` = eased segment progress (Part 08.2/09.4). This is what Animate does: the object's speed along the path follows the **position easing**, and equal `t` steps are **not** equal distances (a long curve segment and a short one are both traversed in their allotted keyframe interval). 
2. **Arc-length reparameterization** — constant speed along the path regardless of segment length.

**Design rule (our app):** default to **parameter interpolation** (matches Animate exactly — users expect it), and offer **"constant speed"** as a per-tween option (P1, valuable for wheels/cameras). Both are implemented by sampling the Bézier and building an arc-length lookup table when constant speed is requested.

### Multi-segment mapping
- Segment `i` spans `[vertexFrames[i], vertexFrames[i+1]]`. The object's position at frame `f` in that range = `bezier(segment_i, ease((f - f0)/(f1 - f0)))`.
- The segment's **own easing** comes from the position property keys (per-key easing — Part 09.4).

---

## 10.3 Orientation & rotation along the path

| Option | Behavior |
|---|---|
| **No orientation** | The object keeps its authored rotation (doesn't turn with the path). |
| **Orient to path** | The object **rotates to face the path tangent** (its forward axis aligns with travel direction) — e.g., a car following a road, a bird banking. |
| **Rotation along path (combined)** | The object's own rotation property **adds** to the path orientation (e.g., a spinning wheel while orienting to the road). |

Implementation: at each frame, compute the **tangent angle** `θ = atan2(dy, dx)` of the path at the object's position; apply `rotation_final = objectRotation + θ` when orient-to-path is on. The object's **forward axis** is defined as its +X local axis (or a user-specified "forward" angle).

**Snap to path (classic motion guide):** the object's **pivot** snaps to the guide path at the start/end keyframes; in between it follows the path (orient-to-path optional).

---

## 10.4 Path editing (what the user can do)

| Operation | Tool | Effect |
|---|---|---|
| **Move a vertex** | Selection (click a vertex) or Subselection | Moves that position keyframe's (x,y) → the object re-routes through the new point. |
| **Drag a segment** | Selection (drag the curve itself) | Reshapes the segment (re-fit Bézier through the drag point) → updates the adjacent position keys' tangents. |
| **Pull tangent handles** | Subselection | Changes the curve's approach/exit at a vertex (smooth vs corner: Alt splits the handles). |
| **Add a vertex** | Click on the path (Subselection / right-click → Add Keyframe) | Inserts a new position keyframe at that point (at the corresponding frame). |
| **Delete a vertex** | Select vertex → Delete | Removes that position keyframe; the path re-smooths between neighbors. |
| **Straighten/curve a segment** | Convert point (Subselection) | Toggle the vertex between corner (sharp) and smooth (curved). |

**Critical rule:** path edits are **time-aware** — dragging a vertex changes the *position at that keyframe's time*, not the timing. To change *when* the object is somewhere, move the keyframe on the timeline (Part 08.4.1).

---

## 10.5 Path duplication & reversal

| Operation | Does |
|---|---|
| **Duplicate path (copy motion)** | Copy the tween's position curve to another tween/object (Copy/Paste Motion — Part 09.2.6). The object follows the same route. |
| **Reverse path (Reverse Frames)** | Reverses the keyframe order → the object travels the path **backwards** (end→start). The curve geometry is unchanged; only the time direction flips. |
| **Reverse path direction (our app addition, P2)** | Keep timing, but reorder the vertices so the object goes start→end along the *mirrored* route. Distinct from Reverse Frames (which reverses time). |

---

## 10.6 Motion guide layers (legacy classic-tween paths)

- A **motion guide layer** sits above a tweened layer; its content is a **path** (not rendered at export).
- The tweened layer is **indented/linked** to the guide; the object's pivot **snaps to the guide's start** at K1 and **end** at K2.
- The object follows the guide; **Orient to Path** + **Snap** options in the frame Properties.
- Unlinking = drag the layer out from under the guide.
- **Our app:** supports guide layers as a compatibility feature; the modern motion path (10.1) is the recommended tool.

---

## 10.7 BUILD CHECKPOINT M2 (path slice)

- [ ] Motion path derived from x/y keys, rendered on stage, editable (vertices, segments, handles, add/delete).
- [ ] Path edits write back to position keys (single source of truth).
- [ ] Parameter interpolation (default) + constant-speed option (arc-length table).
- [ ] Orient-to-path + rotation-along-path + forward-axis setting.
- [ ] Copy/paste motion; reverse frames; reverse-direction.
- [ ] Motion guide layers (classic tween compat) with snap + orient.

*Next: `11_symbol_system.md` — graphic/movie clip/button symbols, instances, nesting, nested animation, registration point, symbol editing, swap, break apart, convert-to-symbol.*
