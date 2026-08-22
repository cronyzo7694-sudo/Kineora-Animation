# 01 — GOAL AND SCOPE (2D animation, not the whole Adobe product)

## Human goal (this campaign)

> Log 2D animation kar payein. Tools, layers, properties, timeline, stage, camera, export — lekin **pehle Timeline + Layers** ko Adobe jaisa **ek** banana.

This pack is **only Timeline + Layers**. Tools / Properties / Camera / Export stay in their own research files.

## What “2D animation works” means here

A user can:

1. See **one** timeline: layer names + eye/lock/outline **on the same row** as that layer’s frames.
2. Pick an **active Normal layer**, draw on the Stage, see a keyframe dot on **that row**.
3. F6 / F7 / F5 / Shift+F5 / Shift+F6 with the **hold rule** (already in engine).
4. Scrub playhead; Stage follows.
5. Hide / lock / outline a layer (and a **folder**, with cascade — Blueprint 20.2).
6. Create / delete / rename / reorder / folder nest / collapse.
7. Classic tween between two same-object keys (already in engine).
8. Play / stop / loop.

If those eight work in **one panel**, 2D animation is usable. Everything else is later.

## IN scope (this pack → later code)

| Item | Why in |
|---|---|
| Unify LayersPanel + TimelineStrip into one `Timeline` panel | Blueprint 7.1.1; human order |
| Shared **row identity** (one `LayerId` = one row = one frame strip) | without this, unify is fake |
| Shared vertical scroll (layer list and frame grid never desync) | Adobe; Blueprint implied |
| Shared row height | Adobe layer height; Blueprint 20 `height` field |
| Folder collapse hides **both** name and frames | already partly true in each panel separately |
| Frame ops blocked on folders | LAYER research B-2 |
| Ancestor hide/lock honored on Stage | LAYER research B-1 / B-3 |
| Honest labels (C-08 is not engine-complete) | FL-0017 |

## OUT of scope (do not invent in unify)

| Item | Why out |
|---|---|
| Mask / Guide / Pose / Camera / Audio **layer kinds** | Blueprint 20.3 lists them; **not required for first 2D ship**. LAYER research §8: only Normal + Folder now. |
| Layer **transform parenting** (WISH W2) | Blueprint 20.5 marked WISH; `parent_id` today = **folder only** |
| Motion tween / shape tween | Part 09 later; classic tween already exists |
| Onion skin | Specified in `08` — **Increment 2**, not inside unify |
| Edit Multiple Frames | `09` — **blocked** AMB-TL-020 |
| fps “scale frame spans”, time-interval bake | **AMB-TL-005 closed** (eng 07: frames invariant) |
| Customizable timeline toolbar | Adobe; Blueprint silent → AMB / later |
| Advanced Layers: layer depth, camera button, parenting view | SYS-25 / W2 |
| ActionScript / frame actions | out of product |
| Multi-layer row selection | Adobe yes; Blueprint silent → AMB-L4 already open |
| Docking timeline to other panels | SYS-01 deferred docking unit |

## Relationship to existing LAYER_SYSTEM_FORENSIC_RESEARCH.md

That file is **still valid**. This pack **adds**:

- the **unify** UI contract (one panel),
- Adobe 2026 timeline-page translation,
- frame-grid + layer-list **row sync**.

It does **not** reopen folder-model decisions already locked there (folders have no frames; cascade; no mask kinds).

## Honest status words

- SPECIFIED ≠ IMPLEMENTED ≠ TESTED ≠ MANUALLY ACCEPTED ≠ COMPLETE.
- C-08 / C-22 “UI COMPLETE” = **not** a product claim.
- SYS-15 Timeline / SYS-16 Layers on the board = QUEUED spec + PARTIAL impl. **Not COMPLETE.**
