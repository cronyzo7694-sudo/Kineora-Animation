# 06 — GAPS, BUGS, AMBIGUITIES

Bugs B-1…B-7 are copied from `LAYER_SYSTEM_FORENSIC_RESEARCH.md` (still valid).  
BUG-D-001 **resolved** at `29789e5` (test assertion).

---

## A. Unify-specific gaps (new)

| ID | Gap | Expected | Source | Sev | When |
|---|---|---|---|---|---|
| **U-G1** | Layers + Timeline are two panels | One row = name chrome + frames | Blueprint 7.1.1 + human | HIGH | P0 unify |
| **U-G2** | Two `ancestorCollapsed` copies | One `timelineRows.ts` | DRY / desync risk | MED | with U-G1 |
| **U-G3** | `NAME_W = 92` no flags | Full chrome + splitter | Adobe + 7.1.1 | HIGH | P0 |
| **U-G4** | Independent vertical scrolls | One scroll | Adobe | HIGH | P0 |
| **U-G5** | No elapsed-time readout | `(playhead-1)/fps` | Blueprint 7.1.5 | LOW | P0 small |
| **U-G6** | C-08/C-22 “FUNCTIONAL” onion/camera | Honest DEFERRED | FL-0017 | MED process | docs only |
| **U-G7** | Unify + left Layers both ON | One list (default hide left dock) | usable UI | HIGH | Inc 1 ship rule |
| **U-G8** | `TIMELINE_H_MIN` 96 clips headers+grid | min 168 / default 200 | C-08 paper vs real chrome | HIGH | Inc 1 |
| **U-G9** | nameW min 140 too narrow for flags | min 160 | 04 math | MED | Inc 1 |

---

## B. Engine bugs (fix during or right after unify — already specified)

| ID | Symptom | Fix (already written in LAYER research) | Owner |
|---|---|---|---|
| **B-1** | Child of hidden folder still on Stage | ancestor-visible in `evaluate` / hit-test | SYS-16 + eval |
| **B-2** | F5/F6/F7 write frames onto a folder | `is_folder()` guard like `draw_rect` | SYS-15/16 |
| **B-3** | Folder lock does not cascade | `cascade_flag(Locked)` | SYS-16 |
| **B-4** | Duplicate folder ignores children | deep subtree duplicate | SYS-16 |
| **B-5** | `active_layer` may be a folder | central `editable_target_layer()` | SYS-15/16 |
| **B-8** | `copyFrames` emits `document:changed` | drop the emit (copy is not a mutation) | SYS-15 `client.ts` |

Do **not** invent new bug IDs for the same facts.

---

## C. Ambiguity register (STOP — do not guess)

| ID | Question | Why open | Coding rule until closed |
|---|---|---|---|
| **AMB-TL-001** | Multi-layer vs Active-layer-only view | Adobe only; Blueprint silent | do not build |
| **AMB-TL-002** | Show actual fps while playing | Adobe; Blueprint silent | do not build |
| **AMB-TL-003** | Row height Short/Medium/Tall | Adobe; Blueprint `height` unused | keep 22px |
| **AMB-TL-004** | Pin / color underline after name | Adobe only | do not build |
| **AMB-TL-005** | Scale spans when fps changes | **RESOLVED** by engineering 07 (frames invariant) | do not add Scale Frame Spans |
| **AMB-TL-006** | Bake keys on 1s/2s intervals | Adobe | do not build |
| **AMB-TL-007** | Alt+Shift+./, page hop | Adobe | do not bind |
| **AMB-TL-008** | Customizable toolbar | Adobe | keep fixed header |
| **AMB-TL-009** | Loop in/out range | Adobe; Blueprint = whole duration | keep whole-doc loop |
| **AMB-TL-010** | After unify, what does Window ▸ Layers do? | two panels today | **do not delete LayersPanel** until decided |
| **AMB-TL-011** | Folder grid visual (dim strip vs empty) | Blueprint: no frames | either; must keep row height |
| **AMB-TL-012** | Default `nameW` px | silent | recommendation 200 |
| **AMB-TL-014..019** | onion defaults / play / layer scope | see `08_ONION_SKIN.md` | use listed recommendations |
| **AMB-TL-020** | EMF write semantics | see `09` | **do not implement EMF** |
| **AMB-TL-021** | Expand-span numeric N | Adobe only | do not build |
| **AMB-TL-022** | Frame 1 time = 0s? | rec. `(f-1)/fps` | see `10` |
| **AMB-L1…L5** | see LAYER research | already open | unchanged |
| **AMB-S04-*** | snap / grid | SYS-04 | not this pack |

---

## D. C-08 / C-22 honesty table (process)

| Contract claim | Code truth |
|---|---|
| tl.onion / onion.outline / onion.multi / onion.markers FUNCTIONAL | **absent** |
| tl.addcamera / tl.attachcam FUNCTIONAL | **absent** |
| tl.hamburger FUNCTIONAL | **absent** |
| lyr.parent FUNCTIONAL | folder nest only, **not** W2 parenting |
| msk.mask FUNCTIONAL | **no mask kind** |
| lyr.z / lyr.attach FUNCTIONAL | **absent** |

Coding agents: treat C-08/C-22 as a **wishlist checklist**, never as “already shipped”.

---

## E. Do-not-invent (timeline+layers)

- Mask / guide / pose / camera / audio layer **kinds**
- Transform parenting (`parent_id` stays folder)
- New bus events
- Onion **inside the unify increment** (onion = Increment 2, file 08) · EMF until AMB-TL-020 · Time Scrubber / custom toolbar / loop range / fps-span-scale
- Auto-picking a child layer when a folder is active
- Global layers across scenes
- Adobe playhead color (blue)
- Deleting LayersPanel before AMB-TL-010
