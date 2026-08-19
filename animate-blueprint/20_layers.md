# PART 20 — LAYERS
### Every layer function: create, delete, rename, move, duplicate, lock, hide, outline, folders, hierarchy, layer type, layer order, layer parenting — plus the complete layer-type reference and the layer data model.

---

## 20.0 What a layer is

A layer = a **horizontal strip of frames** + a set of **display properties** (visibility, lock, outline, type, order, depth). Layers stack **bottom → top** (top = drawn frontmost on stage). Layers exist to:

1. **Separate** objects so they don't merge/cut (merge model — Part 06) and so each can animate independently.
2. **Organize** (folders, naming).
3. **Apply special behavior** (mask/guide/pose/camera/audio — the layer *type*).

### Layer data model

```jsonc
{
  "id":"L3", "name":"arm_R", "type":"normal",      // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible":true, "locked":false, "outline":false,
  "outlineColor":"#ff0000",                          // per-layer outline tint
  "parentId":null,                                   // folder parent (hierarchy) or layer-parenting link
  "zDepth":0, "attachedToCamera":false,              // camera (Part 16)
  "frames":[...], "height":18                         // row height in px
}
```

---

## 20.1 Layer lifecycle operations

| Operation | Trigger | Data change | Rules |
|---|---|---|---|
| **Create** | + button / Insert menu | append a `normal` layer above the active one | named "Layer N"; becomes active. |
| **Delete** | trash / right-click → Delete | remove layer + its frames | prompt if it's a mask/guide/pose layer with dependents (21.3); undoable. |
| **Rename** | double-click name | `name` | names are display-only; IDs are stable (rename-safe refs). |
| **Move (reorder)** | drag up/down | layer order in `layers[]` | changes render order (top = front). Dragging into a folder nests it. |
| **Duplicate** | right-click → Duplicate Layer | deep-copy layer (frames + content) inserted above | new layer = independent copy. |
| **Copy/Paste Layer** | context menu | copy layer (with frames) to clipboard → paste | paste into another timeline (scene/symbol). |

---

## 20.2 Layer state toggles

| State | Toggle | Effect on stage | Effect on editing | Effect on export |
|---|---|---|---|---|
| **Visible** | eye | shown | editable | exported (default) |
| **Hidden** | eye off | not shown | not selectable/editable | **not exported** (default "export hidden layers" = off) |
| **Locked** | padlock | shown (normally) | **not selectable/editable**; skipped by Select All | exported |
| **Outline** | square | rendered as **outlines only** | editable normally | exported **fully** (outline is authoring-only) |

- **Locked layers** still render (unlike hidden). They protect finished art while you draw on other layers.
- **Outline mode** = a view aid to see through a layer (e.g., see the rig under a filled foreground) without changing its data.
- Lock/hide/outline on a **folder** cascade to all children.

---

## 20.3 Layer types (the complete reference)

| Type | Purpose | Stores | Interactions | Where |
|---|---|---|---|---|
| **Normal** | Standard content | frames with shapes/instances/text | default | everywhere |
| **Folder** | Group layers | `children` (layer list indentation) | lock/hide/outline cascade; collapse/expand | everywhere |
| **Mask** | Defines a clipping shape | a shape (the mask) | clips the **masked** layer(s) below it (Part 21) | everywhere |
| **Masked** | Is clipped by the mask above | normal content | only shows where the mask is opaque (Part 21) | under a mask |
| **Guide** | Non-printing helper (paths, notes) | a path | content invisible at export; snaps objects to it | classic tween (Part 10.6) |
| **Motion Guide** | Classic-tween path | a path | linked tween layer follows it | classic tween (Part 10.6) |
| **Pose** | IK armature | armature + poses (Part 14) | green; Insert Pose; bones | rigging |
| **Tween** | Motion-tween spans | tween spans (Part 09) | blue; one target per span; no drawing | motion tweens |
| **Camera** | Camera keyframes | camera states (Part 16) | camera tool; attach layers | camera |
| **Audio** | Sound frames | sound attachments (Part 17) | waveform display | audio |

**Type conversion rules:**
- Normal ↔ Folder ↔ Mask ↔ Guide: changeable via right-click → Properties (some conversions warn, e.g., mask→normal breaks clipping).
- Pose/Tween/Camera/Audio: created automatically by their tools; converting away (e.g., delete bones) reverts to normal.
- **One armature per pose layer**; **one target per tween span** (Part 09); **one mask per mask group** (Part 21).

---

## 20.4 Layer hierarchy (folders & nesting)

- A **folder** contains child layers (indented under it, with a collapse/expand triangle).
- **Nesting depth**: our app supports unlimited nesting (Animate: 2 levels); folders are **purely organizational** — they do **not** create a coordinate space (unlike symbol nesting, Part 11.8).
- **Folder + camera**: folders can carry z-depth and attach-to-camera like layers (applied to children).
- **Drag-drop rules:** drag a layer onto a folder = nest; drag to the left edge = out of the folder; drag between two layers = reorder at that level.

---

## 20.5 Layer parenting (transform inheritance)

**Layer parenting** (Animate's modern feature) = a layer **inherits the transform of its parent layer**, so moving/rotating the parent moves the children as a group — like a lightweight rig without symbols.

| Aspect | Rule |
|---|---|
| **Link** | A layer's `parentId` points at another layer; the UI shows an indent + connector line. |
| **Inheritance** | Child transform = parent transform ∘ child local transform (position/rotation/scale/skew). |
| **Visibility** | Hiding a parent hides children. |
| **Pose/IK** | Parenting works with rigs (parents can drive IK chains). |
| **Reparent** | Change `parentId` anytime; *[WISH W2]* our app stores **local-space** transforms so re-parenting is a clean matrix change (Animate's copy/paste + re-parent bugs are design-out: stable IDs + local space — Part 14.2). |

**Layer parenting vs symbol nesting (choose correctly):**
- **Parenting** = transforms only, no timeline isolation (all on the same timeline).
- **Nesting (symbols)** = full timeline isolation + reuse (Part 11).
- Use parenting for quick group motion; nesting for reusable, independently-animating parts.

---

## 20.6 Layer order & render rules

- Render order = `layers[]` index order, **bottom → top** (index 0 = backmost).
- Within a layer: display-list order (back → front) per Part 01 §1.4.2.
- **Mask groups** render: mask layer clips the masked layer(s) directly below (Part 21).
- **Camera** applies after all layers composite (Part 16).
- **Move Ahead/Behind** (Modify > Arrange, Ctrl+↑/↓) changes **object** order within a layer — distinct from layer reordering.

---

## 20.7 BUILD CHECKPOINT M2/M3 (layers slice)

- [ ] All lifecycle ops (create/delete/rename/move/duplicate/copy-paste) with correct undo.
- [ ] Visibility/lock/outline with cascade-through-folders and export rules (hidden = not exported by default).
- [ ] All 11 layer types with their storage + auto-creation + conversion warnings.
- [ ] Folders with nesting, collapse/expand, drag rules.
- [ ] Layer parenting with local-space inheritance and safe re-parenting *[WISH W2]*.
- [ ] Render order + within-layer object order.

*Next: `21_masks.md` — mask/masked layers, clipping behavior, animated masks, nested masks, alpha behavior, and the original equivalent implementation.*
