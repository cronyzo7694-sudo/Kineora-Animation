# PART 13 — CHARACTER ANIMATION (THE COMPLETE WORKFLOW)
### Character artwork → separate body parts → symbols → hierarchy → pivot points → bones → IK → poses → animation → reusable clips. The full pipeline, step-by-step, with three rigging approaches and a concrete example character.

---

## 13.0 The two production approaches (and when to use each)

| Approach | How it moves | Best for | Rig style |
|---|---|---|---|
| **Cut-out / puppet** | Separate parts (symbols) hinged at joints, posed per frame or tweened | Fast production, limited budget, stylized shows | Hierarchy + pivots (+ bones/IK) |
| **Frame-by-frame** | Redraw every frame | Full traditional animation, nuanced motion | Drawings + onion skin (Part 15) |
| **Hybrid** (industry standard) | Cut-out body + hand-drawn accents (face, hair, effects) | Most professional work | Both |

This part documents the **cut-out pipeline** (the one that uses symbols/bones/IK); frame-by-frame is Part 15; the hybrid is a composition of both.

---

## 13.1 STEP 1 — Character artwork (prepare the parts)

**Goal:** the character exists as **separate, cleanly-cut parts**, each drawn to its final look.

Rules of thumb:
- **One part per movable joint** — head, torso, upper arm, forearm, hand, upper leg, lower leg, foot, plus eyes/brows/mouth as separate small parts.
- **Draw parts with overlap** at the joint (the upper arm slightly overlaps the torso) so no gaps show when rotating.
- **Cut parts cleanly** (no stray pixels; use object-drawing mode or convert each to a symbol).
- **Front/back ordering matters**: decide the stacking (e.g., torso behind arms; one arm in front, one behind).

Input methods:
- Draw in-app (Parts 05–06), or
- Import external art (PSD/AI/PNG — Part 27; AI/PSD can import **per-layer** so each layer becomes a part).

---

## 13.2 STEP 2 — Separate body parts (into symbols)

1. Select each part → **Convert to Symbol (F8)** (Part 11.2).
2. **Naming convention** (enforced by our app's character template, P2): `ch_armUpper_R`, `ch_armLower_R`, `ch_hand_R`, `ch_head`, `ch_eye_L`, `ch_mouth`, etc. Prefix = character, suffix = side.
3. Type: **Movie Clip** for parts that animate independently (walk cycles); **Graphic** for parts driven by the main timeline (mouth poses — Part 18).
4. At this point every part is a Library symbol; the character is a set of instances.

**Distribute to Layers** (Part 07.4.13) — our app auto-places each selected part on its own layer with the part's name; this is the single biggest time-saver for rigging.

---

## 13.3 STEP 3 — Build the hierarchy (nesting)

**Goal:** make the character a **tree** so parts move together correctly.

```
character (root movie clip)
 ├─ torso
 ├─ head (movie clip)
 │    ├─ face
 │    ├─ eye_L, eye_R (movie clips — blink inside)
 │    └─ mouth (graphic — viseme frames inside)
 ├─ arm_R (movie clip)
 │    ├─ armUpper_R (symbol)
 │    ├─ armLower_R (symbol, child of armUpper — rotates at elbow)
 │    └─ hand_R (symbol)
 └─ arm_L (mirrored copy)
```

How to build it (Animate practice):
1. Select the parts that belong together (e.g., upper arm + forearm + hand) → **F8** → new symbol "arm_R" (this nests them).
2. Inside "arm_R", position forearm's pivot at the elbow, hand's pivot at the wrist.
3. Repeat for head, legs, etc. → then nest the whole body under "character".
4. **Wrap into a single "character" movie clip** so the entire rig is one reusable instance (13.7).

**Nesting rules recap (Part 11.8):** movie clips play independently; graphics sync to the parent. Rig parts are usually **movie clips** (or plain symbols inside a movie clip) so each limb's internal animation (if any) runs on its own.

---

## 13.4 STEP 4 — Set pivot points (the make-or-break step)

**Goal:** every part rotates around its **joint**, not its center.

For each part:
1. Select the part → Free Transform (Q).
2. Drag the **transform point (pivot)** to the joint: upper arm pivot → shoulder; forearm pivot → elbow; hand pivot → wrist; head pivot → neck.
3. **Set the registration point at the same joint** when the symbol is created (Part 11.2) so the part's origin = joint (placement math stays simple).

**Why:** if the pivot is at the part's center, rotating the forearm swings it around its middle (broken elbow). Pivot-at-joint makes rotation *be* the joint movement.

---

## 13.5 STEP 5 — Bones & IK (optional but powerful)

*(Full engine spec: Part 14.)*

- **Chain the parts with the Bone tool (M):** click shoulder → drag to elbow → drag to wrist. This creates an **armature** (parent→child bones) on a **pose layer**.
- **Set constraints:** elbow rotation limits (−10°..130°) so it can't bend backwards; knee (0°..140°); wrist translation off.
- **Now posing is inverse-kinematic:** drag the **hand** → the forearm + upper arm follow automatically (the IK solver computes the joint angles). Far faster than rotating each part.
- **IK vs FK:** IK = drag the end (hand), chain follows. FK = rotate each joint explicitly (full control). Our app supports **both** + a per-chain toggle (Part 14).

---

## 13.6 STEP 6 — Poses

A **pose** = one snapshot of the character's joint configuration (all parts' transforms, or all bones' angles).

**Pose workflow (cut-out):**
1. Frame 1: set the **key pose** (contact, down, passing, up — the walk-cycle 4 poses).
2. Insert keyframes (F6) or **Insert Pose** (bones) at the next beat.
3. Set the next pose.
4. **Tween** between poses (motion tween for transforms / IK auto-interpolation for bones).

**Pose library (our app addition, P1):** save named poses ("walk_contact", "walk_down") and **reuse them** on any keyframe — a direct quality-of-life win over Animate.

---

## 13.7 STEP 7 — Animate (keyframes + tweens + easing)

- **Blocking:** rough key poses first (every 4–8 frames), no in-betweens.
- **In-between:** let tweens interpolate; add **breakdowns** (extra keyframes) where arcs need correction (e.g., a hand swinging should arc, not go straight).
- **Easing** (Part 09.4): limbs ease-in/out; avoid robotic linear motion.
- **Arcs:** move the pivot/vertices so motion follows arcs (Part 10 motion path for the whole body).
- **Timing:** hold poses for weight (Part 07 exposure); overlap motion (hair lags the head) via delayed keys.
- **Squash & stretch:** scale keys on impact frames.

**The walk-cycle recipe (canonical):**
1. 4 contact poses (or 8 with down/passing/up), 12–24 fps feel.
2. Body bob (torso y) offset half a step from the legs.
3. Arm swing opposite to legs.
4. Foot **does not slide**: match the foot's backward speed to the body's forward speed on contact (the classic fix — our app offers a **ground-contact lock** helper, P2).
5. Loop it inside a **movie clip** (13.8).

---

## 13.8 STEP 8 — Reusable clips (the payoff)

- Wrap the finished walk into a **movie clip** "walkCycle" → place it anywhere; it loops forever.
- Build a **library of clips**: idle, walk, run, jump, wave, talk. Each = one movie clip.
- Assemble scenes by **placing clips on the main timeline** (or scene timelines — Part 25) and adding transitions.
- **This is the entire point of symbols + nesting** (Parts 11–12): build once, reuse everywhere, keep files small.

---

## 13.9 The three rigging approaches compared (implementation)

| Approach | Model | Pros | Cons | Our app |
|---|---|---|---|---|
| **A. Transform hierarchy** (parts + pivots, no bones) | nested instances + transforms | Simple, robust, copy/paste-safe | FK only (rotate each part) | P0 (core) |
| **B. Bones/IK** | armature + pose layer (Part 14) | Fast posing, constraints | Historically buggy on copy/paste *[WISH W2]* | P1 (designed robust) |
| **C. Asset Warp** | mesh + pins (T2D.11) | Deform one bitmap/vector, no cut-out | Limited articulation, soft only | P1 |

Our app ships **all three** (they serve different art styles) with a **shared rig layer** so A→B→C can mix per part.

---

## 13.10 Character data model (the rig as data)

```jsonc
"character": {
  "id":"ch_hero", "rootSymbolId":"character",
  "parts": [
    { "id":"head", "symbolId":"ch_head", "parentId":null, "pivot":{"x":20,"y":8} },
    { "id":"armUpper_R","symbolId":"ch_armUpper_R","parentId":"torso","pivot":{"x":0,"y":0} }
  ],
  "rigs": [
    { "id":"armR_ik", "type":"bones", "chain":["armUpper_R","armLower_R","hand_R"],
      "constraints":[{ "boneId":"elbow","minRot":-10,"maxRot":130 }] }
  ],
  "poses": [
    { "id":"walk_contact", "parts":[ { "partId":"armUpper_R","transform":{...} }, ... ] }
  ],
  "clips": [
    { "id":"walkCycle", "symbolId":"walkCycle", "duration": 24, "loop": true }
  ]
}
```

*(Full schemas: Part 33.)*

---

## 13.11 BUILD CHECKPOINT M4 (character slice)

- [ ] Art import (per-layer) + in-app part drawing.
- [ ] Convert parts to symbols with joint-aligned registration points; distribute-to-layers.
- [ ] Nest into root movie clip; pivot-at-joint for every part.
- [ ] Bone chain + constraints + IK pose by dragging the end; FK fallback.
- [ ] Pose recording (F6 / Insert Pose) + tweening + easing; pose library.
- [ ] Walk-cycle recipe reproducible (no foot-slide); ground-contact helper.
- [ ] Wrap finished animation into reusable movie clips; scene assembly from clips.

*Next: `14_bone_ik.md` — bones, armature, parent/child, joint, root, IK target, rotation/translation constraints, bone length, pose, armature layer, bone animation, IK pose, keyframe behavior — with the shoulder→upper-arm→elbow→forearm→wrist→hand example and what happens when you drag the hand.*
