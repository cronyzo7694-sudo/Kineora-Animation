# PART 14 — BONE / IK SYSTEM
### Bones, armature, parent/child, joint, root, IK target, rotation/translation constraints, bone length, pose, armature layer, bone animation, IK pose, keyframe behavior — with the shoulder→upper-arm→elbow→forearm→wrist→hand example and the exact sequence when the user drags the hand.

---

## 14.0 The vocabulary (defined once)

| Term | Meaning |
|---|---|
| **Bone** | A rigid segment connecting a **parent joint** to a **child joint**, with a length and an angle (relative to its parent). |
| **Armature** | The whole connected bone tree (one root + its descendants). One armature per pose layer. |
| **Parent / Child** | Bones form a **tree**: each bone has one parent (except the root) and zero+ children. |
| **Joint** | A bone's endpoint where it meets its child (the pivot). Joints carry **constraints**. |
| **Root** | The top bone of the armature (no parent). Its position anchors the whole chain on stage. |
| **IK target** | The point the user drags (the **end effector**, e.g., the hand). IK solves joint angles to reach it. |
| **Rotation constraint** | min/max angle a joint may rotate (±), and a flag to **lock** rotation (rigid). |
| **Translation constraint** | whether a joint may translate along x/y (for sliding joints). |
| **Bone length** | The distance from parent joint to child joint. For symbol armatures it's the distance between the two instances' pivots; for IK shapes it's the carved distance. |
| **Pose** | A stored snapshot of all bone angles/translations at one frame. |
| **Armature layer / pose layer** | The timeline layer (green) that stores the armature + its poses. |
| **Spring** | A bone property making it lag/wobble (secondary motion). |

---

## 14.1 Two kinds of armatures (same tool, two targets)

| | Symbol armature (chain of instances) | IK shape (bones inside one shape) |
|---|---|---|
| **What bones connect** | Symbol instances (their pivots) | Control points inside a raw shape |
| **Deformation** | Each instance rotates/translates as a rigid part | The shape's contour **bends** (bound points follow bones) |
| **Editing after rigging** | Instances stay individually editable | Shape editing becomes limited (no new strokes/scale/skew; Animate warns) |
| **Use** | Cut-out characters (limbs) | Tails, tentacles, plant stems, single-piece characters |
| **Weighting** | none (whole instance per bone) | **Bind tool** (Part 02d T2D.9) sets point→bone weights |

---

## 14.2 The bone model (data)

```jsonc
"armature": {
  "bones": [
    { "id":"b0", "parentId":null, "childId":"b1",              // symbol armature: link by bone chain
      "length": 60, "rotation": 0, "translationX":0, "translationY":0,
      "minRot": -10, "maxRot": 130, "rotationLocked": false,
      "xEnabled": false, "yEnabled": false,
      "jointSpeed": 100, "spring": null }                       // {strength, damping}
  ],
  "bindings": [ { "boneId":"b0", "targetNodeId":"armUpper_R" } ]   // symbol armature
            // or: { "boneId":"b0", "controlPoints":[3,4,5] }        // IK shape
}
```

**Coordinate system (the [WISH W2] fix):** each bone stores its **angle relative to its parent** (local space) and each instance stores its **local transform**. All IK math runs in local space with **stable bone IDs**. Result: copy/pasting a rig, scaling a child, or re-parenting **cannot corrupt poses** (this is the exact bug class Animate users report; we design it out at the data level).

---

## 14.3 Building an armature (the interaction)

### 14.3.1 Symbol armature
1. Place instances on stage (shoulder, upper arm, forearm, hand) roughly in position.
2. Select the **Bone tool (M)**.
3. Click the **root instance** (shoulder) to set the root; the first bone is created at the click point.
4. **Drag from the root's joint to the next instance** (elbow) → child bone; repeat elbow→wrist, wrist→hand.
5. The chain is now an armature on a **pose layer**.

### 14.3.2 IK shape
1. Draw the shape; select it fully (marquee the whole shape).
2. Bone tool: **click-drag inside the shape** to carve the first bone; drag from its tail to carve the next.
3. If the shape is too complex, prompt to convert to a movie clip first (Animate does this).
4. Use the **Bind tool** to fix which contour points each bone pulls.

---

## 14.4 Posing & the IK solve (what happens when you drag the hand)

**Example chain: Shoulder → Upper Arm → Elbow → Forearm → Wrist → Hand.**

The user drags the **hand** (the IK target). Sequence:

1. **Grab:** pointer-down on the hand's joint selects the armature (or just the end bone); the current pose is captured as the solve's starting state.
2. **Drag:** on each pointer-move, the IK solver runs with the **target = pointer position**:
   - **Step 1 — reach:** compute the chain's total reach. If the target is **beyond** full extension (distance from shoulder > Σ bone lengths), the solver **straightens** the chain pointing at the target (arm fully extended toward it) — the "unreachable" case.
   - **Step 2 — solve angles:** find joint angles that place the hand at the target:
     - **2-bone analytic** (shoulder+elbow, 2 segments): the classic two-bone IK with a closed-form solution — given the shoulder root, the target, and the two lengths, compute elbow angle (law of cosines) and shoulder angle; choose the **elbow bend direction** (up/down) from the current pose or a bias.
     - **N-bone** (3+ segments): **CCD** (cyclic coordinate descent — iteratively rotate each joint toward the target from the tip back) or **FABRIK** (forward-and-backward reaching inverse kinematics — reposition joints along the bone-length constraints). Our app: **FABRIK as default** (converges fast, respects length), **CCD** for polish/rotation-dominant rigs, **2-bone analytic** for the common 2-segment limb (fast + deterministic).
   - **Step 3 — apply constraints:** clamp each joint's rotation to its **[minRot, maxRot]**; apply translation constraints; apply joint speed/spring.
   - **Step 4 — write pose:** store the solved angles into the current pose (and update the stage).
3. **Release:** commit `PoseCommand` (the pose change is undoable as one step).
4. **Authoring note:** during playback the app **interpolates stored angles** — it does **not** re-run IK every frame (Part 08.3.8). IK runs only at author time when you drag. This is exactly Animate's model and the right one (deterministic playback).

**What the user sees while dragging:** the elbow and shoulder joints rotate automatically; the hand follows the pointer; if the target is unreachable, the arm goes straight; if a constraint blocks the solve, the hand stops short (the solver clamps and the hand may not reach the pointer — show a subtle indicator).

---

## 14.5 Constraints (in detail)

| Constraint | Field | Behavior |
|---|---|---|
| **Rotation min/max** | `minRot, maxRot` (degrees, relative to parent) | The joint clamps to the range. E.g., elbow −10°..130° prevents hyperextension. |
| **Rotation lock** | `rotationLocked` | The bone is rigid relative to its parent (moves with it, can't rotate independently). |
| **Translation x/y enable** | `xEnabled, yEnabled` | Allows a joint to **slide** (e.g., a piston, a tongue extending). Both disabled = pure rotation joint. |
| **Joint speed** | `jointSpeed` (0–100%) | Limits how fast a joint responds → "weight" (a heavy arm lags). 100% = unlimited. |
| **Spring** | `spring{strength,damping}` | The bone overshoots/wobbles when its parent moves (secondary motion like hair/antennae). |

**Constraint visualization:** draw the min/max angle **wedges** at each joint while editing (our app) so users see the allowed range.

---

## 14.6 The pose layer (timeline interaction)

- Adding the first bone **creates a pose layer** (green) and moves the armature onto it.
- **Insert Pose** (right-click a frame → Insert Pose): records the current armature configuration as a **pose** at that frame.
- **Poses are keyframes** (diamonds, Part 08.3.8): between poses, bones interpolate (angles + translations).
- **Runtime vs Authoring** (legacy AS3): "Type = Runtime" exposes the armature to script at runtime. Our app: a "runtime-riggable" flag for the behavior layer (P2).
- Deleting all bones removes the pose layer; the instances revert to normal layers.

---

## 14.7 IK pose editing rules

- **Select a bone:** click (Selection); Shift+click multi; double-click = whole armature; Parent/Child/Next-sibling buttons in Properties navigate.
- **Move a joint/instance:** drag with Selection (moves the bone, updating lengths); **Alt/Option+drag** moves one instance alone (bones stretch to follow).
- **Move a bone end in an IK shape:** Subselection drag (blocked if multiple poses exist — our app edits only the current pose + warns).
- **Add/remove bones:** Bone tool drag adds a child; right-click → Remove Bone / Remove Armature.
- **Reparent:** our app allows dragging a bone's parent link (P1) — the [WISH W2] local-space model makes this safe (Animate cannot re-parent cleanly after animation).

---

## 14.8 Bone animation (authoring workflow)

1. Frame 1: **Insert Pose** (initial pose).
2. Move the playhead to frame 10; drag the hand to the new pose; **Insert Pose**.
3. Frames 2–9 auto-interpolate (angles lerp).
4. Add **easing** on the pose span (Part 09.4) for weight.
5. Key each limb's poses on the **same pose layer** or **separate pose layers** (one armature per layer; a character with 2 arms + 2 legs = 4 armatures/layers).

---

## 14.9 BUILD CHECKPOINT M4 (IK slice)

- [ ] Bone tool: build symbol armatures AND IK shapes (carve + bind).
- [ ] Bone model in local space with stable IDs; parent/child tree; root anchoring.
- [ ] IK solvers: 2-bone analytic, CCD, FABRIK; unreachable-target straighten; bend-direction bias.
- [ ] Constraints (rotation min/max/lock, translation, joint speed, spring) with wedge visualization.
- [ ] Pose layer + Insert Pose; pose interpolation; pose editing rules (incl. move/delete/duplicate).
- [ ] The shoulder→elbow→wrist→hand example works end-to-end: drag hand → elbow/shoulder solve → constraints hold → pose recorded → tween.
- [ ] Copy/paste/scaling/re-parenting of rigs does not corrupt poses *[WISH W2]*.

*Next: `15_frame_by_frame.md` — drawing frame → next frame → onion skin → redraw → exposure → playback, with every onion-skin control.*
