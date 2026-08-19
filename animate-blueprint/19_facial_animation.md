# PART 19 — FACIAL ANIMATION
### Building faces from eyes/eyebrows/mouth/head via symbols + keyframes + nested timelines — then five complete subsystems: Blink, Eye direction, Mouth, Expression, Head movement.

---

## 19.0 The facial rig (how a face is constructed)

A face = a **nested structure of symbols**, each part independently swappable/animatable:

```
head (movie clip, on the character rig — Part 13)
 ├─ skull/face base (static artwork, one symbol)
 ├─ eye_L, eye_R (movie clips — blink + pupil inside)
 │    ├─ sclera (white), eyelid (movie clip that closes), pupil (symbol that moves)
 ├─ brow_L, brow_R (symbols — raised/furrowed by rotation/position)
 └─ mouth (graphic symbol — viseme frames inside, Part 18)
```

**Why nesting:** each subsystem (blink, eye direction, mouth) has its **own timeline** inside its own symbol, so it can loop/animate independently while the head moves — the nested-timeline model from Part 11.8.

**Design rule:** build each face part as a symbol with **one pose per frame** (like the mouth symbol), driven by **Frame Picker / swap** on the parent timeline, OR as a movie clip with its **own looping animation** (blink). Use graphics for parent-driven poses, movie clips for self-looping motions.

---

## 19.1 Blink system

### 19.1.1 Construction
- **Eyelid** = a movie clip with frames: `open (1) → half (2) → closed (3) → half (2) → open (1)` (a 3-frame blink on 2s = ~6 frames). The closed frame = an eyelid shape drawn over the eye (skin color + lash line).
- Place the eyelid movie clip over the eye; it plays **only when triggered**.

### 19.1.2 Triggering (two approaches)
1. **Timeline-triggered (recommended):** a blink is a **keyframe event** — place a keyframe that starts the eyelid clip (or a graphic eyelid whose frame advances). Blinks happen on the main timeline at authored moments (natural, controllable).
2. **Random/auto blink (our app P1):** the eyelid clip has an **auto-blink behavior** — holds "open" for a random 2–6 s, then plays the blink. Set via a parameter (min/max interval). This removes the tedium of manual blinks (a top-requested nicety).

### 19.1.3 Timing rules
- A blink = **~6–10 frames** (fast close, fast open; the close is faster than the open).
- Blinks every **2–6 seconds** (randomized feels natural).
- **Never blink mid-line** (during a word) — the classic mistake. Our app's auto-blink **avoids active lip-sync frames** (reads the lip-sync result — Part 18) automatically.

### Data
```jsonc
"blink": { "eyelidSymbolId":"eyelid", "mode":"auto|timeline",
           "minIntervalMs":2000, "maxIntervalMs":6000, "avoidSpeech":true }
```

---

## 19.2 Eye direction system

- **Pupil** = a small symbol inside the eye; move it to look left/right/up/down (offset within the sclera bounds).
- **Eye-direction poses:** a graphic symbol with frames `lookLeft / lookRight / lookUp / lookDown / center` — swap/frame-pick to change gaze (same mechanism as the mouth — Part 18.2).
- **Animate gaze:** keyframe the pupil position (motion tween) or swap the direction pose; add a **quick ease** for a darting look.
- **Blink on direction change** (subtle realism): trigger a blink when the gaze changes — our app does this automatically (P2 toggle).
- **Both eyes together:** eye_L and eye_R are usually driven together (a "gaze" controller sets both pupils — our app's face rig template does this).

### Data
```jsonc
"gaze": { "eyeL":{...}, "eyeR":{...}, "current":"center|left|right|up|down",
          "pupilOffset":{x,y}, "blinkOnChange":true }
```

---

## 19.3 Mouth system

- The mouth **is** the lip-sync system (Part 18): a graphic symbol, one frame per viseme, driven by auto lip-sync or manual Frame Picker.
- **Mouth as expression** (not speech): the same symbol can include **expression poses** (smile, frown, grin, gritted teeth) as extra frames — swap to them for expressions (Part 11.6).
- **Mouth + jaw:** for big open visemes, the whole **jaw/lower face** can move (nest the mouth in a "jaw" movie clip that rotates open on "A/O" poses) — advanced but standard for quality rigs.

---

## 19.4 Expression system

An **expression** = a coordinated set of part poses: brows + eyes + mouth together.

| Expression | Brows | Eyes | Mouth |
|---|---|---|---|
| Neutral | rest | center, open | rest |
| Happy | raised | slightly squinted | smile |
| Angry | furrowed (rotated inward/down) | narrowed | frown/gritted |
| Surprised | high raised | wide | "O" (ah) |
| Sad | inner tips up | droopy lids | slight frown |
| Scared | raised + inner up | wide | open "E/A" |

### Implementation (two options)
1. **Expression symbols (recommended for limited rigs):** one graphic symbol with an **expression per frame** (the whole face redrawn per expression). Swap the face instance → expression changes. Simple, reliable, great for stylized work.
2. **Composite (recommended for flexible rigs):** an **expression preset** = a named bundle of part-pose references:
   ```jsonc
   "expression":"happy" = { brows:{rotation:-15, y:-4}, eyes:{pose:"squint"}, mouth:{frame: smileFrame} }
   ```
   Applying an expression sets all parts at once. Our app ships a **preset library + a per-expression keyframe** (one keyframe = one expression; tweens interpolate between them if the parts are transform-based).

- **Blend/transition:** transform-based expressions tween smoothly (brows rise, mouth corners turn). Frame-based expressions swap (snap). Our app supports both; default = swap (matches Animate's style).

---

## 19.5 Head movement system

- The **head** is a symbol; rotate/scale/position it for **turns, nods, tilts, shakes**.
- **Nod** = rotation up/down around the neck pivot (Part 13.4); **tilt** = rotation around the nose axis (skew/rotate); **shake** = rapid small rotations.
- **Anticipation & settle:** nod = down-up-settle (3 keys with ease — Part 09.4); shake = 3–5 fast alternating keys.
- **Head turn (2D fake):** swap between **front / ¾ / side** head poses (frames in a graphic symbol) + a quick ease — the standard limited-animation turn. (Full 360° head turns = a different, advanced rig — P3.)
- **Overlap:** the head leads, hair/brows lag (secondary motion — offset their keys or use spring bones, Part 14.5).

### Head-movement data
```jsonc
"head": { "symbolId":"head", "pivot":{"x":20,"y":8},       // neck pivot
          "poses":["front","threeQuarter","side"],           // turn poses
          "movement": { "nod":"rotation", "tilt":"skew", "shake":"rotation" } }
```

---

## 19.6 The facial-animation workflow (end-to-end)

1. **Draw parts** (eyes, brows, mouth, head) as clean separate artwork (Part 05).
2. **Symbolize** each; nest under a **head movie clip** (Part 11.8).
3. **Set pivots** (neck for head, eyelid hinge for blink) (Part 13.4).
4. **Build the mouth library** (viseme frames — Part 18.2).
5. **Build blink** (eyelid clip + auto/timeline trigger).
6. **Animate:** head moves + expressions on keyframes; mouth from lip-sync; gaze + blinks on top.
7. **Layer the order:** brows on top, then eyes, then mouth, over the face base.

---

## 19.7 BUILD CHECKPOINT M4 (facial slice)

- [ ] Face rig: head/eyes/brows/mouth symbols nested under a head movie clip; pivots at hinges.
- [ ] Blink: eyelid clip + timeline trigger + auto-blink (random interval, avoids speech).
- [ ] Eye direction: pupil move + gaze poses + blink-on-change.
- [ ] Mouth: lip-sync (Part 18) + expression poses in the same symbol.
- [ ] Expression system: preset library + per-expression keyframes + swap/tween modes.
- [ ] Head movement: nod/tilt/shake/turn with anticipation + overlap.

*Next: `20_layers.md` — create/delete/rename/move/duplicate/lock/hide/outline/group/hierarchy/type/order/parenting.*
