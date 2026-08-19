# PART 24 — ALIGN / DISTRIBUTE
### Align left/center/right/top/middle/bottom, distribute horizontal/vertical, spacing, match size, stage-relative vs object-relative alignment.

---

## 24.0 The two alignment spaces

Every align/distribute operation works **relative to one of two spaces** (a toggle in the panel):

| Space | Reference | Use |
|---|---|---|
| **Align to Stage** | The stage rectangle (0,0,w,h) | Center titles, pin elements to edges, layout across the whole frame |
| **Align to Selection** | The **bounding box** of the selected objects (Part 03.4.10) | Align objects to each other |

**Important Animate nuance:** "Align to Stage" means aligning **relative to the stage bounds**; "Align to Selection" means **relative to the selection's union bounding box**. Our app keeps these two plus a third (below).

---

## 24.1 Alignment operations (the 6)

Each computes the selection's bounding box (or the stage) and sets each object's position:

| Operation | Moves objects so their… | Reference axis |
|---|---|---|
| **Align Left** | left edge = reference left | x |
| **Align Center (horizontal)** | center-x = reference center-x | x |
| **Align Right** | right edge = reference right | x |
| **Align Top** | top edge = reference top | y |
| **Align Middle (vertical)** | center-y = reference center-y | y |
| **Align Bottom** | bottom edge = reference bottom | y |

### Data flow (per operation)
```
ref = stage bounds  OR  selection union bounds
for each selected object:
  delta = (target edge position) - (object's current edge position)
  object.transform.x/y += delta
commit = one AlignCommand (undoable)
```

---

## 24.2 Distribute operations

Distribute **spaces objects evenly** between the first and last (extreme) objects.

| Operation | Evenly spaces the objects'… | Along |
|---|---|---|
| **Distribute Left Edges** | left edges | x |
| **Distribute Horizontal Centers** | center-x | x |
| **Distribute Right Edges** | right edges | x |
| **Distribute Top Edges** | top edges | y |
| **Distribute Vertical Centers** | center-y | y |
| **Distribute Bottom Edges** | bottom edges | y |

### Algorithm
```
sort objects by the distributed coordinate (x or y)
total span = last.position - first.position          // extremes stay fixed
gap = total span / (N - 1)
for i in 1..N-2: object[i].position = first.position + gap * i
```
(The first and last objects **do not move** — they define the span.)

---

## 24.3 Spacing (even gaps)

Our app adds (Animate has partial support): **Space Evenly Horizontally / Vertically** — distribute the **gaps between objects** equally (not the centers). Algorithm:

```
totalWidth = Σ object widths
freeSpace = (last.right - first.left) - totalWidth
gap = freeSpace / (N - 1)
place objects left→right with `gap` between them
```
This is what users usually mean by "distribute" (equal visual gaps), and is a common Animate complaint — we provide both center-distribution and gap-distribution.

---

## 24.4 Match size & related

| Operation | Does |
|---|---|
| **Match Width / Height / Both** | resize all selected to match the reference (largest, smallest, or stage) |
| **Match Size (W & H)** | both dimensions |
| **Space buttons** | (covered in 24.3) |

---

## 24.5 Alignment math details

- **Rotated/skewed objects:** alignment uses the **axis-aligned bounding box** (Part 03) — same as Animate. (Our app offers "use rotated bounds" as an option, P2.)
- **Groups/symbols:** align by their bounding box; the group's internal layout is untouched (the group moves as one).
- **Locked/hidden objects** are excluded from the selection and don't affect the bounding box (Part 03.7).
- **Single object + Align to Stage** = snap the object to the stage edge/center (very common).

---

## 24.6 BUILD CHECKPOINT M2 (align slice)

- [ ] Align panel with the 6 align + 6 distribute + match-size + spacing buttons.
- [ ] Stage vs selection space toggle; third "align to first-selected" option (our addition).
- [ ] Even-gap distribution (24.3) in addition to center distribution.
- [ ] Correct behavior for rotated objects, groups, locked/hidden exclusion.
- [ ] One undoable command per operation.

*Next: `25_scenes.md` — scene creation, duplication, ordering, duration, navigation, scene-level timeline/camera/audio.*
